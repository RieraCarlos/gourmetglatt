import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '../auth/authSlice';

interface ProfilesState {
    teamMembers: UserProfile[];
    loading: boolean;
    error: string | null;
}

const initialState: ProfilesState = {
    teamMembers: [],
    loading: false,
    error: null,
};

export const fetchTeamMembers = createAsyncThunk(
    'profiles/fetchTeamMembers',
    async (sectorId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('sector_id', sectorId)
                .order('name', { ascending: true });

            if (error) throw error;
            return data as UserProfile[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const profilesSlice = createSlice({
    name: 'profiles',
    initialState,
    reducers: {
        updateMemberInState: (state, action: PayloadAction<UserProfile>) => {
            const index = state.teamMembers.findIndex(m => m.id === action.payload.id);
            if (index !== -1) {
                state.teamMembers[index] = action.payload;
            } else {
                // If it's a new member in the sector
                state.teamMembers.push(action.payload);
                state.teamMembers.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        removeMemberFromState: (state, action: PayloadAction<string>) => {
            state.teamMembers = state.teamMembers.filter(m => m.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTeamMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeamMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.teamMembers = action.payload;
            })
            .addCase(fetchTeamMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { updateMemberInState, removeMemberFromState } = profilesSlice.actions;
export default profilesSlice.reducer;
