import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Movement } from '../../app/types/database';
import { queueMovement, getQueuedMovements, dequeueMovement } from '../../lib/indexedDB';

interface MovementsState {
    items: Movement[];
    loading: boolean;
    error: string | null;
    isOnline: boolean;
}

const initialState: MovementsState = {
    items: [],
    loading: false,
    error: null,
    isOnline: navigator.onLine,
};

export const fetchMovements = createAsyncThunk(
    'movements/fetchMovements',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('stock_movements')
                .select('*, products(name, barcode)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const addMovement = createAsyncThunk(
    'movements/addMovement',
    async (movement: Omit<Movement, 'id' | 'created_at'>) => {
        try {
            // Local stock no longer maintained here since we removed it
            if (!navigator.onLine) {
                await queueMovement(movement);
                return { ...movement, id: 'temp-' + Date.now(), created_at: new Date().toISOString(), offline: true } as any;
            }

            const { data, error } = await supabase
                .from('stock_movements')
                .insert([movement])
                .select()
                .single();

            if (error) throw error;

            return data as Movement;
        } catch (err: any) {
            // If failed for other reasons (e.g. network timeout despite navigator.onLine being true)
            await queueMovement(movement);
            return { ...movement, id: 'temp-' + Date.now(), created_at: new Date().toISOString(), offline: true } as any;
        }
    }
);

export const adjustStock = createAsyncThunk(
    'movements/adjustStock',
    async ({ productId, newStock, currentStock }: { productId: string; newStock: number; currentStock: number }, { dispatch, getState, rejectWithValue }) => {
        try {
            const difference = newStock - currentStock;

            if (difference === 0) return; // No change needed

            const movementType = difference > 0 ? 'IN' : 'OUT';
            const quantity = Math.abs(difference);

            // Get current user from auth state
            const state = getState() as any;
            const userId = state.auth?.user?.id || 'system-user';

            const movement: Omit<Movement, 'id' | 'created_at'> = {
                product_id: productId,
                type: movementType,
                quantity: quantity,
                user_id: userId,
            };

            // Create the movement
            const result = await dispatch(addMovement(movement)).unwrap();

            return result;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const syncOfflineMovements = createAsyncThunk(
    'movements/syncOfflineMovements',
    async (_, { dispatch }) => {
        if (!navigator.onLine) return;

        const queued = await getQueuedMovements();
        if (queued.length === 0) return;

        for (const m of queued) {
            try {
                const { timestamp, ...movementData } = m;
                const { data, error } = await supabase
                    .from('stock_movements')
                    .insert([movementData])
                    .select()
                    .single();

                if (!error && data) {
                    // (Stock is no longer duplicated in the products table)                    
                    await dequeueMovement(timestamp);
                }
            } catch (err) {
                console.error('Failed to sync movement', err);
            }
        }
        dispatch(fetchMovements());
    }
);

const movementsSlice = createSlice({
    name: 'movements',
    initialState,
    reducers: {
        setOnlineStatus: (state, action) => {
            state.isOnline = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMovements.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMovements.fulfilled, (state, action) => {
                state.items = action.payload;
                state.loading = false;
            })
            .addCase(fetchMovements.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addMovement.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            });
    },
});

export const { setOnlineStatus } = movementsSlice.actions;
export default movementsSlice.reducer;
