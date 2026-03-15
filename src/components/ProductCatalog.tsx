import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { fetchProducts } from '../features/products/productsSlice';
import { fetchInventory } from '../features/inventory/inventorySlice';
import type { Product } from '@/app/types/database';
import type { RootState } from '../app/store';
import { Search, AlertCircle, Plus, Database, BarChart3, Filter, QrCode } from 'lucide-react';
import ProductForm from './ProductForm';
import ParetoAnalysisChart from './ParetoAnalysisChart';
import StockDistributionDonut from './StockDistributionDonut';
import StockAlertCards from './StockAlertCards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import BarcodeScanner from './BarcodeScanner';

// ProductCatalog component
const ProductCatalog: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: products, loading: productsLoading, error: productsError } = useAppSelector((state: RootState) => state.products);
    const { items: inventoryItems, loading: inventoryLoading } = useAppSelector((state: RootState) => state.inventory);
    const { user } = useAppSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchInventory());
    }, [dispatch]);

    // REALTIME SYNCHRONIZATION
    useEffect(() => {
        const channel = supabase
            .channel('inventory-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stock_movements' },
                () => {
                    // Refetch data when movements happen
                    dispatch(fetchInventory());
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dispatch]);

    // DEBOUNCE LOGIC (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    // SECTION 1: PARETO ANALYSIS LOGIC
    const paretoData = useMemo(() => {
        if (!inventoryItems.length) return [];
        const sorted = [...inventoryItems].sort((a, b) => (b.output || 0) - (a.output || 0));
        const totalOutput = sorted.reduce((acc, item) => acc + (item.output || 0), 0);
        if (totalOutput === 0) return sorted.map(item => ({ ...item, cumulativePercentage: 0, class: 'C' as const }));
        let runningTotal = 0;
        return sorted.map((item) => {
            runningTotal += (item.output || 0);
            const cumulativePercentage = (runningTotal / totalOutput) * 100;
            let itemClass: 'A' | 'B' | 'C' = 'C';
            if (cumulativePercentage <= 80) itemClass = 'A';
            else if (cumulativePercentage <= 95) itemClass = 'B';
            return { ...item, cumulativePercentage, class: itemClass };
        });
    }, [inventoryItems]);

    // SECTION 2A: STOCK DISTRIBUTION LOGIC
    const distributionData = useMemo(() => {
        const categoriesMap = new Map<string, number>();
        inventoryItems.forEach(item => {
            const cat = item.category || 'Uncategorized';
            categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + (item.stock || 0));
        });
        const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(215 25% 27%)', 'hsl(142 71% 45%)', 'hsl(31 92% 45%)', 'hsl(280 65% 60%)'];
        return Array.from(categoriesMap.entries()).map(([category, stock], index) => ({
            category,
            stock,
            fill: COLORS[index % COLORS.length]
        }));
    }, [inventoryItems]);

    const totalInventoryStock = useMemo(() => inventoryItems.reduce((acc, item) => acc + (item.stock || 0), 0), [inventoryItems]);

    // SECTION 2B: STOCK ALERTS LOGIC
    const alertData = useMemo(() => {
        const categories = Array.from(new Set(inventoryItems.map(i => i.category || 'Uncategorized')));
        return categories.map(cat => {
            const catItems = inventoryItems.filter(i => (i.category || 'Uncategorized') === cat);
            const lowStockItems = catItems.filter(i => (i.stock || 0) < 20);
            return {
                category: cat,
                lowStockCount: lowStockItems.length,
                totalCount: catItems.length,
                percentage: catItems.length > 0 ? (lowStockItems.length / catItems.length) * 100 : 0,
                products: lowStockItems.map(i => ({
                    id: i.id,
                    name: i.name,
                    barcode: products.find(p => p.id === i.id.toString())?.barcode || 'N/A',
                    stock: i.stock
                }))
            };
        }).filter(alert => alert.lowStockCount > 0);
    }, [inventoryItems, products]);

    // SOURCE OF TRUTH: Enriched products with inventory data
    const enrichedProducts = useMemo(() => {
        return inventoryItems.map(item => {
            const product = products.find(p => p.id === item.id.toString());
            return {
                id: item.id.toString(),
                name: item.name,
                barcode: product?.barcode || 'N/A',
                description: product?.description || '',
                category: item.category || 'Uncategorized',
                stock: item.stock || 0
            };
        });
    }, [inventoryItems, products]);

    const filteredProducts = useMemo(() => {
        return enrichedProducts.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                p.barcode.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesLowStock = showLowStockOnly ? p.stock < 20 : true;
            return matchesSearch && matchesLowStock;
        });
    }, [enrichedProducts, debouncedSearch, showLowStockOnly]);

    const groupedProducts = useMemo(() => {
        const groups: Record<string, typeof enrichedProducts[0][]> = {};
        filteredProducts.forEach(p => {
            const cat = p.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [filteredProducts]);
    {/*
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };*/}

    const handleAdd = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const onScanResult = (result: string) => {
        setSearchTerm(result);
        setIsScannerOpen(false);
    };

    if ((productsLoading || inventoryLoading) && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b4125]"></div>
                <p className="text-muted-foreground animate-pulse">Cargando catálogo y análisis...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10 px-4 md:px-8 py-6 pb-24 lg:pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#202312]">
                        Product Catalog & Analytics
                    </h1>
                    <p className="text-[#6E7647] font-medium text-sm md:text-base">
                        Inventory health and criticality analysis dashboard.
                    </p>
                </div>

                <div className="w-full md:w-auto">
                    {user?.role === 'admin' && (
                        <Button
                            onClick={handleAdd}
                            className="w-full md:w-auto h-12 md:h-11 px-8 rounded-xl bg-[#3b4125] text-white font-bold shadow-lg shadow-[#3b4125]/20 hover:bg-[#202312] transition-all"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Product
                        </Button>
                    )}
                </div>
            </div>

            {/* ANALYTICAL ECOSYSTEM (Sections 1 & 2) - SEQUENTIAL LAYOUT */}
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* SECTION 1: PARETO ANALYSIS - HIGH PRIORITY */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="p-2.5 rounded-xl bg-[#3b4125]/10">
                            <BarChart3 className="w-6 h-6 text-[#3b4125]" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-[#202312] uppercase tracking-tight">Intelligence (Pareto)</h2>
                    </div>
                    <ParetoAnalysisChart data={paretoData.slice(0, 15)} />
                </div>

                {/* SECTION 2: DISTRIBUTION & ALERTS (MIX) - ATOMIC COMPOSITION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start px-4 md:px-0">
                    {/* 2A: Stock Distribution (Mix) */}
                    <div className="lg:col-span-1">
                        <StockDistributionDonut data={distributionData} totalStock={totalInventoryStock} />
                    </div>

                    {/* 2B: Critical Alerts (Health) */}
                    <div className="lg:col-span-2">
                        <StockAlertCards alerts={alertData} />
                    </div>
                </div>

                {/* SECTION 3: CATALOG (INVENTORY) - DATA-GRID ARCHITECTURE */}
                <div className="pt-12 border-t border-border space-y-8">
                    <div className="flex items-center gap-3 px-1 mb-2">
                        <div className="p-2.5 rounded-xl bg-[#3b4125]/10">
                            <Database className="w-6 h-6 text-[#3b4125]" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-[#202312] uppercase tracking-tight">Inventory Catalog</h2>
                    </div>

                    {/* STICKY SEARCH & CONTROL BAR (MOBILE OPTIMIZED) */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-6 pt-2 -mx-4 px-4 md:mx-0 md:px-0 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border/50 md:border-none">
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#3b4125] transition-colors" />
                                <input
                                    type="search"
                                    inputMode="search"
                                    placeholder="Search by name or barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ fontSize: '16px' }}
                                    className="w-full pl-12 pr-4 h-12 bg-card border border-border/60 rounded-xl focus:ring-4 focus:ring-[#3b4125]/10 focus:border-[#3b4125] outline-none transition-all shadow-sm"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsScannerOpen(true)}
                                className="h-12 w-12 rounded-xl border-border bg-card hover:bg-[#3b4125]/5 hover:text-[#3b4125] transition-all"
                            >
                                <QrCode className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button
                                variant={showLowStockOnly ? "destructive" : "outline"}
                                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                                className={`flex-1 md:flex-none h-12 px-6 rounded-xl border transition-all font-bold ${showLowStockOnly
                                        ? 'bg-destructive text-white border-none shadow-lg shadow-destructive/20'
                                        : 'bg-card hover:border-[#3b4125] hover:text-[#3b4125]'
                                    }`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                {showLowStockOnly ? "Critical Stock" : "All Products"}
                            </Button>
                        </div>
                    </div>

                    {productsError && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm font-medium">{productsError}</p>
                        </div>
                    )}

                    {/* DATA-GRID DISPLAY */}
                    <div className="space-y-12">
                        {Object.keys(groupedProducts).length > 0 ? (
                            Object.entries(groupedProducts).map(([category, products]) => (
                                <div key={category} className="space-y-4 group/category">
                                    {/* Earthy Dark Category Header */}
                                    <div className="flex items-center justify-between bg-[#202312] p-4 rounded-2xl shadow-lg ring-1 ring-white/10 group-hover/category:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-[#6E7647] rounded-full" />
                                            <h3 className="text-sm md:text-base font-black tracking-widest uppercase text-white">{category}</h3>
                                        </div>
                                        <Badge className="bg-[#3b4125] text-white/90 border-none px-3 font-bold">{products.length} SKUs</Badge>
                                    </div>

                                    <div className="rounded-2xl border border-border/60 bg-white/50 backdrop-blur-sm shadow-xl overflow-hidden">
                                        <div className="overflow-x-auto scrollbar-hide">
                                            <Table>
                                                <TableHeader className="bg-[#3b4125]/5 border-b border-border/40">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[300px] font-black uppercase text-[11px] tracking-wider text-[#3b4125]">Identity</TableHead>
                                                        <TableHead className="hidden md:table-cell font-black uppercase text-[11px] tracking-wider text-[#3b4125]">Description</TableHead>
                                                        <TableHead className="text-right font-black uppercase text-[11px] tracking-wider text-[#3b4125]">Stock Level</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {products.map((p, idx) => {
                                                        const stock = p.stock || 0;
                                                        const isLowStock = stock < 20;
                                                        return (
                                                            <TableRow
                                                                key={p.id}
                                                                className={`group/row transition-all duration-300 border-border/30 hover:bg-[#525834]/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#6E7647]/5'
                                                                    }`}
                                                            >
                                                                <TableCell className="py-5">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="font-bold text-[#202312] group-hover/row:text-[#3b4125] transition-colors">{p.name}</span>
                                                                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md w-fit">{p.barcode}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="hidden md:table-cell py-5">
                                                                    <span className="text-xs font-medium text-[#525834] line-clamp-2 max-w-[250px] italic leading-relaxed">
                                                                        {p.description || "No technical description available."}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-right py-5">
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <div className="flex items-center gap-2">
                                                                            {isLowStock && (
                                                                                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                                                            )}
                                                                            <span className={`text-xl font-black tabular-numbers tracking-tight ${isLowStock ? 'text-destructive' : 'text-[#202312]'}`}>
                                                                                {stock}
                                                                            </span>
                                                                        </div>
                                                                        <Badge
                                                                            variant={isLowStock ? "destructive" : "outline"}
                                                                            className={`text-[9px] font-black uppercase border-none px-2 h-5 flex items-center shadow-sm ${!isLowStock ? 'bg-[#3b4125]/10 text-[#3b4125]' : 'bg-destructive text-white'
                                                                                }`}
                                                                        >
                                                                            {isLowStock ? "Replenish" : "Healthy"}
                                                                        </Badge>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 px-10 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-[#525834]/20 bg-[#6E7647]/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="p-6 rounded-full bg-white shadow-xl shadow-[#3b4125]/5">
                                    <Search className="w-16 h-16 text-[#3b4125]/20" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#202312] tracking-tight">No SKUs match your criteria</h3>
                                    <p className="text-[#525834] font-medium max-w-sm mx-auto text-sm leading-relaxed">
                                        We couldn't find any items. Try refining your search or clearing active filters to see more results.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => { setSearchTerm(""); setShowLowStockOnly(false); }}
                                    className="rounded-xl border-[#3b4125]/20 text-[#3b4125] font-bold hover:bg-[#3b4125] hover:text-white px-8 h-12 transition-all mt-4"
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <ProductForm
                    product={editingProduct}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            {isScannerOpen && (
                <BarcodeScanner
                    onScan={onScanResult}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
};

export default ProductCatalog;
