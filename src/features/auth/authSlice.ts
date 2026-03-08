import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'supervisor';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    avatar_url?: string;
}

interface AuthState {
    user: UserProfile | null;
    session: any | null;
    loading: boolean;
    error: string | null;
    authReady: boolean; // Indicates if the initial Supabase session check is complete
}

// Leer del localStorage al iniciar
const loadFromLocalStorage = (): AuthState => {
    try {
        const savedAuth = localStorage.getItem('gourmet_auth');
        if (savedAuth) {
            const parsed = JSON.parse(savedAuth);
            // Even if we have a saved session, we are NOT ready until Supabase confirms it
            return { ...parsed, authReady: false, loading: true };
        }
    } catch (error) {
        console.error('Error loading auth from localStorage:', error);
    }
    return {
        user: null,
        session: null,
        loading: false,
        error: null,
        authReady: true,
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
            state.authReady = true; // El login exitoso cuenta como comprobación lista
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
        setAuthReady: (state, action: PayloadAction<boolean>) => {
            state.authReady = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.session = null;
            state.loading = false;
            state.authReady = true; // Finished checking, user is definitely logged out
            // Limpiar localStorage
            localStorage.removeItem('gourmet_auth');
        },
    },
});

export const { setAuth, setLoading, setError, setAuthReady, logout } = authSlice.actions;
export default authSlice.reducer;
