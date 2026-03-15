{/*}
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { setAuth, setLoading, logout } from '@/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from './app/hook'
import App from './App.tsx'

const Root = () => {
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector((state) => state.auth);

    useEffect(() => {
        let isSubscribed = true;

        const fetchProfile = async (session: any) => {
            if (!isSubscribed) return;
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;

                if (isSubscribed) {
                    dispatch(setAuth({
                        user: {
                            id: session.user.id,
                            email: session.user.email!,
                            role: profile?.role || '',
                        },
                        session,
                    }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                if (isSubscribed) {
                    dispatch(setAuth({
                        user: {
                            id: session.user.id,
                            email: session.user.email!,
                            role: '' as any,
                        },
                        session,
                    }));
                }
            }
        };

        // Initialize session
        const initializeAuth = async () => {

            try {

                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {

                    throw error;
                }
                if (session) {

                    await fetchProfile(session);
                } else {
                    if (isSubscribed) {
                        dispatch(setLoading(false));
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (isSubscribed) {
                    dispatch(setLoading(false));
                }
            }
        };

        initializeAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') {
                // Handled by initializeAuth
                return;
            }

            if (event === 'SIGNED_IN' && session) {
                await fetchProfile(session);
            } else if (event === 'SIGNED_OUT') {

                if (isSubscribed) {
                    dispatch(logout());
                }
            } else if (event === 'TOKEN_REFRESHED' && session) {

                await fetchProfile(session);
            } else if (!session) {

                if (isSubscribed) {
                    dispatch(setLoading(false));
                }
            }
        });

        return () => {
            isSubscribed = false;
            subscription.unsubscribe();
        };
    }, [dispatch]);

    // Mostrar pantalla de loading solo si está validando y no hay usuario guardado
    if (loading && !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Cargando...</div>
            </div>
        );
    }

    return <App />;
};

export default Root;
*/}