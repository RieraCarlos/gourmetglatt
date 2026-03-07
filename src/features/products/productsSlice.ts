
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../app/types/database';

interface ProductsState {
    items: Product[];
    loading: boolean;
    error: string | null;
}

const initialState: ProductsState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data as Product[];
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchProductByBarcode = createAsyncThunk(
    'products/fetchProductByBarcode',
    async (barcode: string, { rejectWithValue }) => {

        try {

            const cleanBarcode = barcode.trim()

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', cleanBarcode)
                .maybeSingle()

            if (error) throw error

            if (!data) {
                return rejectWithValue('Producto no encontrado')
            }

            return data as Product

        } catch (err: any) {
            return rejectWithValue(err.message)
        }
    }
);


export const addProduct = createAsyncThunk(
    'products/addProduct',
    async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([product])
                .select()
                .single();

            if (error) throw error;
            return data as Product;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, ...changes }: Partial<Product> & { id: string }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .update(changes)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Product;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);


const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.items = action.payload;
                state.loading = false;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                const index = state.items.findIndex((p) => p.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            });
    },
});

export default productsSlice.reducer;
