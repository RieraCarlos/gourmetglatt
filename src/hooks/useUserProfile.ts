
import { useAppSelector } from '@/app/hook';

interface UserProfile {
    name: string;
    email: string;
    avatar: string;
}

export function useUserProfile(): {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
} {
    const authUser = useAppSelector((state) => state.auth.user);

    // Derive profile directly from the synchronized Redux state
    const userProfile = authUser ? {
        name: authUser.name || authUser.email.split('@')[0],
        email: authUser.email,
        avatar: authUser.avatar_url || '/avatars/default.jpg',
    } : null;

    return { user: userProfile, loading: false, error: null };
}
