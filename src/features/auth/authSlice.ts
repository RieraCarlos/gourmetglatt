import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'supervisor';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
}

interface AuthState {
    user: UserProfile | null;
    session: any | null;
    loading: boolean;
    error: string | null;
}

// Leer del localStorage al iniciar
const loadFromLocalStorage = (): AuthState => {
    try {
        const savedAuth = localStorage.getItem('gourmet_auth');
        if (savedAuth) {
            return JSON.parse(savedAuth);
        }
    } catch (error) {
        console.error('Error loading auth from localStorage:', error);
    }
    return {
        user: null,
        session: null,
        loading: true,
        error: null,
    };
};

const initialState: AuthState = loadFromLocalStorage();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action: PayloadAction<{ user: UserProfile | null; session: any | null }>) => {
            state.user = action.payload.user;
            state.session = action.payload.session;
            state.loading = false;
            // Guardar en localStorage
            localStorage.setItem('gourmet_auth', JSON.stringify(state));
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
        logout: (state) => {
            state.user = null;
            state.session = null;
            state.loading = false;
            // Limpiar localStorage
            localStorage.removeItem('gourmet_auth');
        },
    },
});

export const { setAuth, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
