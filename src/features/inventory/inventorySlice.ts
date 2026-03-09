import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { InventoryItem, Movement } from '../../app/types/database';
import { softDeleteProduct } from '../products/productsSlice';

interface InventoryState {
    items: InventoryItem[];
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
    stockMovements: Record<string, Movement[]>; // Cambiar a objeto con product_id como key
    movementsLoading: Record<string, boolean>; // Loading por product_id
    movementsError: Record<string, string | null>; // Error por product_id
    movementsLastFetch: Record<string, number>; // Última vez que se cargaron movimientos por product_id
    batchMovementsLoading: boolean; // Loading para carga batch
    todayTotals: {
        out: number;
        in: number;
    };
    todayTotalsLastFetch: number | null; // Última vez que se cargaron los totales diarios
}

const initialState: InventoryState = {
    items: [],
    loading: false,
    error: null,
    lastFetch: null,
    stockMovements: {},
    movementsLoading: {},
    movementsError: {},
    movementsLastFetch: {},
    batchMovementsLoading: false,
    todayTotals: { out: 0, in: 0 },
    todayTotalsLastFetch: null,
};

export const fetchInventory = createAsyncThunk<
    InventoryItem[],
    void,
    { rejectValue: string }
>('inventory/fetchInventory', async (_, { rejectWithValue }) => {
    try {
        const { data, error } = await supabase
            .from('inventory_view')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        const inventoryData = (data || []) as InventoryItem[];

        return inventoryData;
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to fetch inventory');
    }
});

export const fetchStockMovements = createAsyncThunk<
    Movement[],
    string,
    { rejectValue: string }
>('inventory/fetchStockMovements', async (productId, { rejectWithValue }) => {
    try {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data || []) as Movement[];
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to fetch stock movements');
    }
});

export const fetchStockMovementsBatch = createAsyncThunk<
    { productId: string; movements: Movement[] }[],
    string[],
    { rejectValue: string }
>('inventory/fetchStockMovementsBatch', async (productIds, { rejectWithValue }) => {
    try {
        if (productIds.length === 0) return [];

        // Fetch movements for all products in a single query
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*')
            .in('product_id', productIds)
            .order('product_id', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        // Group movements by product_id
        const movementsByProduct = productIds.reduce((acc, productId) => {
            acc[productId] = [];
            return acc;
        }, {} as Record<string, Movement[]>);

        (data || []).forEach((movement: Movement) => {
            const productId = movement.product_id.toString();
            if (movementsByProduct[productId]) {
                movementsByProduct[productId].push(movement);
            }
        });

        // Return array of { productId, movements } objects
        return Object.entries(movementsByProduct).map(([productId, movements]) => ({
            productId,
            movements
        }));
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to fetch stock movements batch');
    }
});

// Thunk to calculate today's totals directly from stock_movements
export const fetchTodayTotals = createAsyncThunk<
    { out: number; in: number },
    void,
    { rejectValue: string }
>('inventory/fetchTodayTotals', async (_, { rejectWithValue }) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('stock_movements')
            .select('type,quantity')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) {
            throw new Error(error.message);
        }

        let outTotal = 0;
        let inTotal = 0;
        (data || []).forEach((m: { type: string; quantity: number }) => {
            if (m.type === 'OUT') {
                outTotal += m.quantity;
            } else if (m.type === 'IN') {
                inTotal += m.quantity;
            }
        });

        return { out: outTotal, in: inTotal };
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to fetch today totals');
    }
});

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        // Manual invalidation to force refetch
        invalidateCache: (state) => {
            state.lastFetch = null;
            state.todayTotalsLastFetch = null;
        },
        // Invalidate movements cache for a specific product
        invalidateMovementsCache: (state, action: PayloadAction<string>) => {
            const productId = action.payload;
            delete state.stockMovements[productId];
            delete state.movementsLoading[productId];
            delete state.movementsError[productId];
            delete state.movementsLastFetch[productId];
        },
        // Update inventory item locally
        updateInventoryItemLocally: (state, action: PayloadAction<{ id: string | number; changes: Partial<InventoryItem> }>) => {
            const { id, changes } = action.payload;
            const itemIndex = state.items.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                state.items[itemIndex] = { ...state.items[itemIndex], ...changes };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                fetchInventory.fulfilled,
                (state, action: PayloadAction<InventoryItem[]>) => {
                    state.items = action.payload;
                    state.loading = false;
                    state.lastFetch = Date.now();
                }
            )
            .addCase(fetchInventory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || null;
            })
            .addCase(fetchStockMovements.pending, (state, action) => {
                const productId = action.meta.arg;
                state.movementsLoading[productId] = true;
                state.movementsError[productId] = null;
            })
            .addCase(fetchStockMovements.fulfilled, (state, action) => {
                const productId = action.meta.arg;
                state.stockMovements[productId] = action.payload;
                state.movementsLoading[productId] = false;
                state.movementsLastFetch[productId] = Date.now();
            })
            .addCase(fetchStockMovements.rejected, (state, action) => {
                const productId = action.meta.arg;
                state.movementsLoading[productId] = false;
                state.movementsError[productId] = action.payload || action.error.message || null;
            })
            .addCase(fetchStockMovementsBatch.pending, (state) => {
                state.batchMovementsLoading = true;
            })
            .addCase(fetchStockMovementsBatch.fulfilled, (state, action) => {
                state.batchMovementsLoading = false;
                action.payload.forEach(({ productId, movements }) => {
                    state.stockMovements[productId] = movements;
                    state.movementsLastFetch[productId] = Date.now();
                    state.movementsLoading[productId] = false;
                    state.movementsError[productId] = null;
                });
            })
            .addCase(fetchStockMovementsBatch.rejected, (state, action) => {
                state.batchMovementsLoading = false;
                state.error = action.payload || action.error.message || null;
            })
            .addCase(fetchTodayTotals.fulfilled, (state, action) => {
                state.todayTotals = action.payload;
                state.todayTotalsLastFetch = Date.now();
            })
            .addCase(fetchTodayTotals.rejected, (state, action) => {
                state.error = action.payload || action.error.message || null;
            })
            .addCase(softDeleteProduct.fulfilled, (state, action) => {
                // Sincronización optimista ultra-rápida: Al completarse el borrado
                // sacamos el ítem inmediatamente de `state.items`
                const deletedProductId = action.payload;
                state.items = state.items.filter(item => item.id.toString() !== deletedProductId);

                // Forzar la recarga futura si alguien llama a la vista 
                state.lastFetch = null;
            });
    },
});

export const { invalidateCache, updateInventoryItemLocally, invalidateMovementsCache } = inventorySlice.actions;

// Selectors
export const selectShouldFetchTodayTotals = (state: { inventory: InventoryState }) => {
    const { todayTotalsLastFetch } = state.inventory;
    if (!todayTotalsLastFetch) return true;

    const today = new Date();
    const lastFetchDate = new Date(todayTotalsLastFetch);
    return lastFetchDate.toDateString() !== today.toDateString();
};

export default inventorySlice.reducer;
