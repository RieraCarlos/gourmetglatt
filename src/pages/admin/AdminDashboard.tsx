import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/app/hook';
import { logout } from '@/features/auth/authSlice';
import { LayoutDashboard, Users, Package, History, LogOut, TrendingUp, Bell, Plus, Minus, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import ProductCatalog from '@/components/ProductCatalog';
import MovementHistory from '@/components/MovementHistory';
import MovementDialog from '@/components/MovementDialog';
import InventoryCharts from '@/components/InventoryCharts';
import ReportGenerator from '@/components/ReportGenerator';

const AdminDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { items: products } = useAppSelector((state) => state.products);
    const { items: movements } = useAppSelector((state) => state.movements);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'history' | 'reports'>('dashboard');
    const [movementModal, setMovementModal] = useState<{ open: boolean, type: 'IN' | 'OUT' }>({ open: false, type: 'IN' });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
    };

    // Helper to calculate stock from movements
    const getProductStock = (productId: string) => {
        return movements
            .filter(m => m.product_id === productId)
            .reduce((total, m) => m.type === 'IN' ? total + m.quantity : total - m.quantity, 0);
    };

    const lowStockCount = products.filter(p => getProductStock(p.id) < 10).length;
    const today = new Date().toISOString().split('T')[0];
    const todayMovements = movements.filter(m => m.created_at.startsWith(today));
    const todayIn = todayMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0);
    const todayOut = todayMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card p-6 flex flex-col hidden md:flex sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Gourmet Glatt</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'products' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="font-medium">Productos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'history' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <History className="w-5 h-5" />
                        <span className="font-medium">Movimientos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'reports' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Reportes</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Usuarios</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-border">
                    <div className="px-3 mb-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Administrador</p>
                        <p className="text-xs font-medium truncate text-foreground/80">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            {activeTab === 'dashboard' ? 'Resumen General' : activeTab === 'products' ? 'Catálogo de Productos' : activeTab === 'history' ? 'Historial de Movimientos' : 'Reportes y Análisis'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {activeTab === 'dashboard' ? 'Vista rápida del estado del inventario.' : activeTab === 'products' ? 'Gestiona y visualiza todos los productos del sistema.' : activeTab === 'history' ? 'Listado completo de entradas y salidas.' : 'Genera reportes y analiza las tendencias de stock.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary transition-all relative">
                            <Bell className="w-5 h-5" />
                            {lowStockCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                            )}
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm group">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Productos</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-3xl font-black">{products.length}</h3>
                                    <div className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold">Total</div>
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm group">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Stock Bajo</p>
                                <div className="flex items-end justify-between">
                                    <h3 className={`text-3xl font-black ${lowStockCount > 0 ? 'text-destructive' : ''}`}>{lowStockCount}</h3>
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className="text-xs text-primary font-bold hover:underline"
                                    >
                                        Ver Alertas
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm group relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Entradas Hoy</p>
                                    <div className="flex items-end justify-between">
                                        <h3 className="text-3xl font-black text-green-500">{todayIn}</h3>
                                        <button
                                            onClick={() => setMovementModal({ open: true, type: 'IN' })}
                                            className="p-2 rounded-lg bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-110 transition-transform"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <ArrowUpCircle className="w-16 h-16 text-green-500" />
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm group relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Salidas Hoy</p>
                                    <div className="flex items-end justify-between">
                                        <h3 className="text-3xl font-black text-destructive">{todayOut}</h3>
                                        <button
                                            onClick={() => setMovementModal({ open: true, type: 'OUT' })}
                                            className="p-2 rounded-lg bg-destructive text-white shadow-lg shadow-destructive/20 hover:scale-110 transition-transform"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <ArrowDownCircle className="w-16 h-16 text-destructive" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <InventoryCharts />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold">Últimos Movimientos</h2>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            Ver todo
                                        </button>
                                    </div>
                                    <div className="max-h-[400px] overflow-hidden">
                                        <MovementHistory />
                                    </div>
                                </div>

                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold">Vista Previa Catálogo</h2>
                                        <button
                                            onClick={() => setActiveTab('products')}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            Ver todo
                                        </button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        <ProductCatalog />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Contents */}
                {activeTab === 'products' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ProductCatalog />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-200px)]">
                        <MovementHistory />
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ReportGenerator />
                        <InventoryCharts />
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                            <h2 className="text-xl font-bold mb-6">Resumen de Inventario</h2>
                            <MovementHistory />
                        </div>
                    </div>
                )}

                {/* Modals */}
                {movementModal.open && (
                    <MovementDialog
                        initialType={movementModal.type}
                        onClose={() => setMovementModal({ ...movementModal, open: false })}
                    />
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
