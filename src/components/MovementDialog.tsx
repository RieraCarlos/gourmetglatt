import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { addMovement } from '../features/movements/movementsSlice';
import type { RootState } from '../app/store';
import { X, Scan, ArrowUpCircle, ArrowDownCircle, Package, Hash, Save } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { supabase } from '@/lib/supabase';

interface MovementDialogProps {
    onClose: () => void;
    initialType?: 'IN' | 'OUT';
}

const MovementDialog: React.FC<MovementDialogProps> = ({ onClose, initialType = 'IN' }) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { items: products } = useAppSelector((state: RootState) => state.products);

    const [type, setType] = useState<'IN' | 'OUT'>(initialType);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isScanning, setIsScanning] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || quantity <= 0 || !user) return;

        // UI Optimista: No bloqueamos con await, disparamos y cerramos
        dispatch(addMovement({
            product_id: selectedProductId,
            type,
            quantity,
            user_id: user.id
        }));

        onClose();
    };

    const handleScan = async (barcode: string) => {
        // query supabase for barcode, fallback to local cache if available
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id')
                .eq('barcode', barcode)
                .single();

            if (error) throw error;
            if (data) {
                setSelectedProductId(data.id);
                setIsScanning(false);
            } else {
                alert('Producto no encontrado');
            }
        } catch (err: any) {
            console.error('Error buscando producto por barcode', err);
            alert('Producto no encontrado');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-card rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            {type === 'IN' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Registrar {type === 'IN' ? 'Entrada' : 'Salida'}</h2>
                            <p className="text-sm text-muted-foreground">Actualiza el stock disponible.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex gap-2 p-1 bg-secondary rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setType('IN')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${type === 'IN' ? 'bg-card text-green-500 shadow-sm font-bold' : 'text-muted-foreground'}`}
                        >
                            <ArrowUpCircle className="w-4 h-4" />
                            Entrada
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('OUT')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${type === 'OUT' ? 'bg-card text-destructive shadow-sm font-bold' : 'text-muted-foreground'}`}
                        >
                            <ArrowDownCircle className="w-4 h-4" />
                            Salida
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Producto</label>
                            <div className="relative group">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    required
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                                >
                                    <option value="">Seleccionar producto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.barcode})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                    title="Escanear producto"
                                >
                                    <Scan className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Cantidad</label>
                            <div className="relative group">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
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
                            disabled={!selectedProductId}
                            className={`flex-2 py-4 px-6 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${type === 'IN'
                                ? 'bg-green-600 text-white shadow-green-600/20 hover:shadow-green-600/40 hover:-translate-y-0.5'
                                : 'bg-destructive text-destructive-foreground shadow-destructive/20 hover:shadow-destructive/40 hover:-translate-y-0.5'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Save className="w-5 h-5" />
                            Registrar
                        </button>
                    </div>
                </form>
            </div>

            {isScanning && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setIsScanning(false)}
                />
            )}
        </div>
    );
};

export default MovementDialog;
