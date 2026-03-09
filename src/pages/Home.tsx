import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hook';
import { supabase } from '../lib/supabase';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const Home: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            } else if (user.role === 'supervisor') {
                navigate('/supervisor', { replace: true });
            } else {
                // Fallback for users with no role assigned or failed profile fetch
                console.error("User has no recognizable role assigned.");
                const handleLogout = async () => {
                    await supabase.auth.signOut();
                    dispatch(logout());
                    navigate('/login', { replace: true });
                };
                handleLogout();
            }
        }
    }, [user, navigate, dispatch]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-pulse text-primary font-medium">Redirigiendo...</div>
        </div>
    );
};

export default Home;
