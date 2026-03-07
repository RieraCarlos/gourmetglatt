import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import { logout } from '../../features/auth/authSlice';
import { Package, LogOut, Search, FileText, Bell } from 'lucide-react';
import ProductCatalog from '../../components/ProductCatalog';
import ReportGenerator from '../../components/ReportGenerator';

const UserDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { items: products } = useAppSelector((state) => state.products);
    const { items: movements } = useAppSelector((state) => state.movements);
    const [activeTab, setActiveTab] = useState<'catalog' | 'reports'>('catalog');

    // Mapear movimientos a una cantidad lógica (IN suma, OUT resta)
    const totalUnits = movements.reduce((acc, m) => {
        return m.type === 'IN' ? acc + m.quantity : acc - m.quantity;
    }, 0);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card p-6 flex flex-col hidden md:flex sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Search className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Gourmet Glatt</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'catalog' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="font-medium">Catálogo</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${activeTab === 'reports' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Reportes</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-border">
                    <div className="px-3 mb-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Colaborador</p>
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
                            {activeTab === 'catalog' ? 'Consulta de Inventario' : 'Reportes Disponibles'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {activeTab === 'catalog' ? 'Consulta el stock disponible en tiempo real.' : 'Genera reportes rápidos del estado actual.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary transition-all relative">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'catalog' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Productos en Catálogo</p>
                                    <h3 className="text-3xl font-black mt-2">{products.length}</h3>
                                </div>
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unidades Totales</p>
                                    {totalUnits.toLocaleString()}
                                </div>
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Última Sincronización</p>
                                    <h3 className="text-3xl font-black mt-2">Hoy, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Stock Disponible</h2>
                                </div>
                                <ProductCatalog />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8">
                            <ReportGenerator />
                            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                                <h2 className="text-xl font-bold mb-4">Ayuda sobre reportes</h2>
                                <p className="text-muted-foreground">
                                    Como colaborador, puedes exportar el estado actual del inventario para consultas rápidas.
                                    Si necesitas reportes históricos detallados, por favor contacta con un administrador.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
