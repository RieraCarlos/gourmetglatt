import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { addProduct, updateProduct, fetchProducts } from '../features/products/productsSlice';
import { addMovement, fetchMovements } from '../features/movements/movementsSlice';
import { invalidateCache, fetchInventory } from '../features/inventory/inventorySlice';
import type { Product } from '@/app/types/database';
import { X, Scan, Package, Tag, FileText, Save } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductFormProps {
    product?: Product | null;
    initialBarcode?: string;
    onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, initialBarcode, onClose }) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        barcode: initialBarcode || '',
        name: '',
        description: '',
        stock: 0,
    });
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                barcode: product.barcode,
                name: product.name,
                description: product.description || '',
                stock: 0,
            });
        } else if (initialBarcode) {
            setFormData(prev => ({ ...prev, barcode: initialBarcode }));
        }
    }, [product, initialBarcode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (product) {
                // Modo Edición: solo actualizamos los campos básicos
                await dispatch(updateProduct({
                    id: product.id,
                    barcode: formData.barcode,
                    name: formData.name,
                    description: formData.description
                })).unwrap();
            } else {
                // Modo Creación: 
                // 1) Crear producto en tabla 'products'
                const newProduct = await dispatch(addProduct({
                    barcode: formData.barcode,
                    name: formData.name,
                    description: formData.description
                })).unwrap();

                // 2) Si hay stock inicial, registramos el movimiento que afectará el stock real
                if (formData.stock > 0 && user) {
                    await dispatch(addMovement({
                        product_id: newProduct.id,
                        type: 'IN',
                        quantity: formData.stock,
                        user_id: user.id
                    })).unwrap();
                }
            }

            // Actualizar todo el sistema (tablas, gráficos) solicitando de nuevo las listas de DB
            dispatch(fetchProducts());
            dispatch(fetchMovements());

            // Invalidar caché de localStorage para que `data-table` de PWA se entere
            dispatch(invalidateCache());
            dispatch(fetchInventory());

            onClose();

            if (product) {
                toast.success('Producto actualizado exitosamente');
            } else {
                toast.success('Producto registrado exitosamente');
                // Redirect user to their main dashboard
                if (user?.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/supervisor');
                }
            }
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Error al guardar el producto');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (barcode: string) => {
        setFormData(prev => ({ ...prev, barcode }));
        setIsScanning(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <p className="text-sm text-muted-foreground">{product ? 'Actualiza la información del producto.' : 'Añade un nuevo producto al catálogo.'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Código de Barras</label>
                            <div className="relative group">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.barcode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                                    className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="Eje: 750123456789"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                    title="Escanear código"
                                >
                                    <Scan className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nombre del Producto</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Eje: Coca-Cola 600ml"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Descripción</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    placeholder="Escribe detalles sobre el producto..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Stock Inicial</label>
                            <input
                                type="number"
                                required
                                disabled={!!product}
                                min={0}
                                value={formData.stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                                placeholder="0"
                            />
                            {!!product && (
                                <p className="text-xs text-muted-foreground mt-1 ml-1">
                                    El stock no se puede modificar directamente. Debes registrar un movimiento (IN/OUT).
                                </p>
                            )}
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
                            disabled={loading}
                            className="flex-2 py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {product ? 'Guardar Cambios' : 'Registrar Producto'}
                                </>
                            )}
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

export default ProductForm;
