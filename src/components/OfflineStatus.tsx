import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { syncOfflineMovements, setOnlineStatus } from '../features/movements/movementsSlice';
import type { RootState } from '../app/store';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

const OfflineStatus: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOnline } = useAppSelector((state: RootState) => state.movements);
    const [syncing, setSyncing] = useState(false);
    const [justSynced, setJustSynced] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            dispatch(setOnlineStatus(true));
            handleSync();
        };
        const handleOffline = () => dispatch(setOnlineStatus(false));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [dispatch]);

    const handleSync = async () => {
        setSyncing(true);
        await dispatch(syncOfflineMovements());
        setSyncing(false);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
    };

    if (isOnline && !syncing && !justSynced) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 fade-in duration-500">
            {!isOnline ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-destructive text-white rounded-full shadow-2xl font-bold">
                    <WifiOff className="w-5 h-5 animate-pulse" />
                    Modo Offline Activo
                </div>
            ) : syncing ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-2xl font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sincronizando datos...
                </div>
            ) : justSynced ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-full shadow-2xl font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    Datos Sincronizados
                </div>
            ) : null}
        </div>
    );
};

export default OfflineStatus;
