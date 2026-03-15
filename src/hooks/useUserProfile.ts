import { useAppSelector } from '@/app/hook';
import type { UserProfile } from '@/features/auth/authSlice';

export function useUserProfile(): {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
} {
    const authUser = useAppSelector((state) => state.auth.user);
    const loading = useAppSelector((state) => state.auth.loading);
    const error = useAppSelector((state) => state.auth.error);

    return { user: authUser, loading, error };
}
