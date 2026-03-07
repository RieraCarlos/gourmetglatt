import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { addMovement, fetchMovements as fetchGlobalMovements } from '../features/movements/movementsSlice';
import { fetchStockMovements, invalidateCache, fetchInventory, fetchTodayTotals } from '../features/inventory/inventorySlice';
import type { Product } from '@/app/types/database';
import { X, ArrowDownToLine, ArrowUpFromLine, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StockMovementFormProps {
    product: Product;
    onClose: () => void;
}

const StockMovementForm: React.FC<StockMovementFormProps> = ({ product, onClose }) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    const [type, setType] = useState<'IN' | 'OUT'>('IN');
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Fetch and calculate current stock dynamically using stock_movements
    const movements = useAppSelector((state) => state.inventory.stockMovements[product.id] || []);

    useEffect(() => {
        dispatch(fetchStockMovements(product.id));
    }, [dispatch, product.id]);

    const currentStock = useMemo(() => {
        return movements.reduce((acc, m) => {
            if (m.type === 'IN') return acc + m.quantity;
            if (m.type === 'OUT') return acc - m.quantity;
            return acc;
        }, 0);
    }, [movements]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('Error: Sesión no encontrada');
            return;
        }

        if (quantity <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        // Validate output against current stock to prevent negative stock
        if (type === 'OUT' && quantity > currentStock) {
            toast.error('No hay suficiente stock para realizar esta salida');
            return;
        }

        setLoading(true);

        try {
            await dispatch(addMovement({
                product_id: product.id.toString(),
                type: type,
                quantity: quantity,
                user_id: user.id
            })).unwrap();

            // Refresh Redux and Cache
            dispatch(fetchGlobalMovements());
            dispatch(fetchStockMovements(product.id)); // Refresh component stock
            dispatch(invalidateCache());
            dispatch(fetchInventory());
            dispatch(fetchTodayTotals());

            onClose();
            toast.success(`Movimiento de stock registrado exitosamente`);

            // Redirect user to their main dashboard
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/supervisor');
            }
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Error al guardar el movimiento');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-card rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ArrowDownToLine className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Registrar Stock</h2>
                            <p className="text-sm text-muted-foreground">Entradas y Salidas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        {/* Read-only Product Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Producto</label>
                            <div className="w-full px-4 py-3 bg-secondary/30 text-foreground font-medium border border-border/50 rounded-xl cursor-not-allowed">
                                {product.name}
                            </div>
                        </div>

                        {/* Read-only Current Stock */}
                        <div className="space-y-1.5 flex gap-4">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Stock Actual</label>
                                <div className="w-full px-4 py-3 bg-secondary/30 text-foreground font-bold text-xl border border-border/50 rounded-xl cursor-not-allowed flex items-center justify-center">
                                    {currentStock}
                                </div>
                            </div>
                        </div>

                        {/* Movement Type Toggle */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Tipo de Movimiento</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('IN')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold ${type === 'IN'
                                        ? 'border-green-500 bg-green-500/10 text-green-500'
                                        : 'border-border bg-transparent text-muted-foreground hover:bg-secondary/50'
                                        }`}
                                >
                                    <ArrowDownToLine className="w-5 h-5" />
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('OUT')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold ${type === 'OUT'
                                        ? 'border-red-500 bg-red-500/10 text-red-500'
                                        : 'border-border bg-transparent text-muted-foreground hover:bg-secondary/50'
                                        }`}
                                >
                                    <ArrowUpFromLine className="w-5 h-5" />
                                    Salida
                                </button>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Cantidad</label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={type === 'OUT' ? currentStock : undefined}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-lg text-center"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/70 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (type === 'OUT' && quantity > currentStock)}
                            className="flex-2 py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockMovementForm;
