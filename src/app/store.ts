import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productsReducer from '../features/products/productsSlice';
import movementsReducer from '../features/movements/movementsSlice';
import inventoryReducer from '../features/inventory/inventorySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productsReducer,
        movements: movementsReducer,
        inventory: inventoryReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;