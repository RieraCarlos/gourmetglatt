import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { InventoryItem, Movement } from '../../app/types/database';

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

// Load from localStorage on init
const getInitialItems = (): InventoryItem[] => {
    try {
        const cached = localStorage.getItem('inventory_items');
        return cached ? JSON.parse(cached) : [];
    } catch {
        return [];
    }
};

const getInitialLastFetch = (): number | null => {
    try {
        const last = localStorage.getItem('inventory_lastFetch');
        return last ? parseInt(last, 10) : null;
    } catch {
        return null;
    }
};

const getInitialStockMovements = (): Record<string, Movement[]> => {
    try {
        const cached = localStorage.getItem('stock_movements');
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const getInitialMovementsLoading = (): Record<string, boolean> => {
    try {
        const cached = localStorage.getItem('movements_loading');
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const getInitialMovementsError = (): Record<string, string | null> => {
    try {
        const cached = localStorage.getItem('movements_error');
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const getInitialMovementsLastFetch = (): Record<string, number> => {
    try {
        const cached = localStorage.getItem('movements_last_fetch');
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const getInitialTodayTotals = (): { out: number; in: number } => {
    try {
        const cached = localStorage.getItem('today_totals');
        console.log('Loading today totals from localStorage', cached ? JSON.parse(cached) : { out: 0, in: 0 });

        return cached ? JSON.parse(cached) : { out: 0, in: 0 };
    } catch {
        return { out: 0, in: 0 };
    }
};

const getInitialTodayTotalsLastFetch = (): number | null => {
    try {
        const cached = localStorage.getItem('today_totals_last_fetch');
        return cached ? parseInt(cached, 10) : null;
    } catch {
        return null;
    }
};

const initialState: InventoryState = {
    items: getInitialItems(),
    loading: false,
    error: null,
    lastFetch: getInitialLastFetch(),
    stockMovements: getInitialStockMovements(),
    movementsLoading: getInitialMovementsLoading(),
    movementsError: getInitialMovementsError(),
    movementsLastFetch: getInitialMovementsLastFetch(),
    batchMovementsLoading: false,
    todayTotals: getInitialTodayTotals(),
    todayTotalsLastFetch: getInitialTodayTotalsLastFetch(),
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

        // Save to localStorage
        localStorage.setItem('inventory_items', JSON.stringify(inventoryData));
        localStorage.setItem('inventory_lastFetch', Date.now().toString());

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
            // Update localStorage
            localStorage.setItem('stock_movements', JSON.stringify(state.stockMovements));
            localStorage.setItem('movements_loading', JSON.stringify(state.movementsLoading));
            localStorage.setItem('movements_error', JSON.stringify(state.movementsError));
            localStorage.setItem('movements_last_fetch', JSON.stringify(state.movementsLastFetch));
        },
        // Update inventory item locally
        updateInventoryItemLocally: (state, action: PayloadAction<{ id: string | number; changes: Partial<InventoryItem> }>) => {
            const { id, changes } = action.payload;
            const itemIndex = state.items.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                state.items[itemIndex] = { ...state.items[itemIndex], ...changes };
                // Update localStorage
                localStorage.setItem('inventory_items', JSON.stringify(state.items));
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
                // Save loading state to localStorage
                localStorage.setItem('movements_loading', JSON.stringify(state.movementsLoading));
            })
            .addCase(fetchStockMovements.fulfilled, (state, action) => {
                const productId = action.meta.arg;
                state.stockMovements[productId] = action.payload;
                state.movementsLoading[productId] = false;
                state.movementsLastFetch[productId] = Date.now();
                // Save movements, loading state and last fetch to localStorage
                localStorage.setItem('stock_movements', JSON.stringify(state.stockMovements));
                localStorage.setItem('movements_loading', JSON.stringify(state.movementsLoading));
                localStorage.setItem('movements_last_fetch', JSON.stringify(state.movementsLastFetch));
            })
            .addCase(fetchStockMovements.rejected, (state, action) => {
                const productId = action.meta.arg;
                state.movementsLoading[productId] = false;
                state.movementsError[productId] = action.payload || action.error.message || null;
                // Save loading state and error to localStorage
                localStorage.setItem('movements_loading', JSON.stringify(state.movementsLoading));
                localStorage.setItem('movements_error', JSON.stringify(state.movementsError));
            })
            .addCase(fetchStockMovementsBatch.pending, (state) => {
                state.batchMovementsLoading = true;
            })
            .addCase(fetchStockMovementsBatch.fulfilled, (state, action) => {
                state.batchMovementsLoading = false;
                // Update movements for each product
                action.payload.forEach(({ productId, movements }) => {
                    state.stockMovements[productId] = movements;
                    state.movementsLastFetch[productId] = Date.now();
                    state.movementsLoading[productId] = false;
                    state.movementsError[productId] = null;
                });
                // Save to localStorage
                localStorage.setItem('stock_movements', JSON.stringify(state.stockMovements));
                localStorage.setItem('movements_last_fetch', JSON.stringify(state.movementsLastFetch));
                localStorage.setItem('movements_loading', JSON.stringify(state.movementsLoading));
                localStorage.setItem('movements_error', JSON.stringify(state.movementsError));
            })
            .addCase(fetchStockMovementsBatch.rejected, (state, action) => {
                state.batchMovementsLoading = false;
                state.error = action.payload || action.error.message || null;
            })
            .addCase(fetchTodayTotals.fulfilled, (state, action) => {
                state.todayTotals = action.payload;
                state.todayTotalsLastFetch = Date.now();
                // Save to localStorage
                localStorage.setItem('today_totals', JSON.stringify(action.payload));
                localStorage.setItem('today_totals_last_fetch', Date.now().toString());
            })
            .addCase(fetchTodayTotals.rejected, (state, action) => {
                state.error = action.payload || action.error.message || null;
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
