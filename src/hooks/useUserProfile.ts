import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authUser = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current authenticated user
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError || !user) {
                    setError('No authenticated user');
                    setUserProfile(null);
                    return;
                }

                // Fetch user profile from profiles table
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('name, email, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching profile:', fetchError);
                    // Fallback to auth user data
                    setUserProfile({
                        name: authUser?.email?.split('@')[0] || 'User',
                        email: authUser?.email || user.email || '',
                        avatar: '/avatars/default.jpg',
                    });
                    return;
                }

                if (data) {
                    setUserProfile({
                        name: data.name || authUser?.email?.split('@')[0] || 'User',
                        email: data.email || authUser?.email || '',
                        avatar: data.avatar_url || '/avatars/default.jpg',
                    });
                }
            } catch (err: any) {
                console.error('Error in useUserProfile:', err);
                setError(err.message || 'Failed to fetch user profile');
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [authUser]);

    return { user: userProfile, loading, error };
}
