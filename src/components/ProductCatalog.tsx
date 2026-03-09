import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { fetchProducts } from '../features/products/productsSlice';
import { fetchInventory } from '../features/inventory/inventorySlice';
import type { Product } from '@/app/types/database';
import type { RootState } from '../app/store';
import { Package, Search, AlertCircle, ShoppingCart, Plus, Edit2 } from 'lucide-react';
import ProductForm from './ProductForm';

const ProductCatalog: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items, loading, error } = useAppSelector((state: RootState) => state.products);
    const { items: inventoryItems } = useAppSelector((state: RootState) => state.inventory);
    const { user } = useAppSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchInventory());
    }, [dispatch]);

    // Helper to get stock from the efficient view (inventory_view) instead of calculating from movements
    const getProductStock = (productId: string) => {
        const inv = inventoryItems.find(i => i.id.toString() === productId.toString())
        return inv ? (inv.stock || 0) : 0
    };

    const filteredItems = items.filter((item: Product) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.barcode.includes(searchTerm);

        if (filter === 'low-stock') {
            return matchesSearch && getProductStock(item.id) < 20;
        }
        return matchesSearch;
    });

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setFilter(filter === 'all' ? 'low-stock' : 'all')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all ${filter === 'low-stock'
                            ? 'bg-destructive/10 border-destructive text-destructive font-semibold'
                            : 'bg-card border-border text-foreground hover:bg-secondary'
                            }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        {filter === 'low-stock' ? 'Viendo Low stock' : 'Low stock'}
                    </button>

                    {user?.role === 'admin' && (
                        <button
                            onClick={handleAdd}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Producto
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item: Product) => (
                    <div
                        key={item.id}
                        className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="aspect-square bg-secondary/50 flex items-center h-24 w-full justify-center overflow-hidden">
                            <Package className="w-16 h-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                            {getProductStock(item.id) < 20 && (
                                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg">
                                    Bajo Stock
                                </div>
                            )}
                        </div>

                        <div className="p-5 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                    {item.name}
                                </h4>
                                <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono whitespace-nowrap">
                                    {item.barcode}
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[5px]">
                                {item.description || 'Sin descripción disponible.'}
                            </p>

                            <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className={`text-xl font-black ${getProductStock(item.id) < 20 ? 'text-destructive' : 'text-foreground'}`}>
                                        {getProductStock(item.id)} <span className="text-xs font-medium text-muted-foreground">units</span>
                                    </p>
                                </div>
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-200 group/edit"
                                    >
                                        <Edit2 className="w-5 h-5 group-hover/edit:scale-110 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-border bg-secondary/20">
                    <div className="p-4 rounded-full bg-secondary">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">No se encontraron productos</h3>
                        <p className="text-muted-foreground">Prueba ajustando los filtros o el término de búsqueda.</p>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <ProductForm
                    product={editingProduct}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
};

export default ProductCatalog;
