import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { fetchMovements } from '../features/movements/movementsSlice';
import type { RootState } from '../app/store';
import { ArrowUpCircle, ArrowDownCircle, Clock, Package, User } from 'lucide-react';

const MovementHistory: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items, loading, error } = useAppSelector((state: RootState) => state.movements);

    useEffect(() => {
        dispatch(fetchMovements());
    }, [dispatch]);

    if (loading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Cargando movimientos...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">{error}</div>;
    }

    return (
        <div className="overflow-hidden bg-card rounded-3xl border border-border shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-secondary/30">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Movimiento</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Cantidad</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((movement: any) => (
                            <tr key={movement.id} className="hover:bg-secondary/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${movement.type === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                                            {movement.type === 'IN' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                        </div>
                                        <span className="font-bold text-sm">{movement.type === 'IN' ? 'Entrada' : 'Salida'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[200px]">{movement.products?.name || 'Producto Desconocido'}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{movement.products?.barcode}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-black ${movement.type === 'IN' ? 'text-green-500' : 'text-destructive'}`}>
                                        {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">{movement.user_id.split('-')[0]}...</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">
                                            {new Date(movement.created_at).toLocaleDateString()} {new Date(movement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {items.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                    No hay movimientos registrados recientemente.
                </div>
            )}
        </div>
    );
};

export default MovementHistory;
