import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { fetchProducts } from '../features/products/productsSlice';
import { fetchMovements } from '../features/movements/movementsSlice';
import { fetchInventory } from '../features/inventory/inventorySlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileDown,
    FileText,
    AlertTriangle,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';

const ReportGenerator: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: products, loading: productsLoading } = useAppSelector((state) => state.products);
    const { items: movements, loading: movementsLoading } = useAppSelector((state) => state.movements);
    const { items: inventory, loading: inventoryLoading } = useAppSelector((state) => state.inventory);

    const [isExporting, setIsExporting] = React.useState<string | null>(null);

    // DATE FILTER STATES
    const [startDate, setStartDate] = React.useState<string>(() => {
        const d = new Date();
        d.setDate(1); // Default to first of month
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = React.useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [movementType, setMovementType] = React.useState<string>('ALL');

    useEffect(() => {
        if (products.length === 0) dispatch(fetchProducts());
        if (movements.length === 0) dispatch(fetchMovements());
        if (inventory.length === 0) dispatch(fetchInventory());
    }, [dispatch, products.length, movements.length, inventory.length]);

    const isLoading = productsLoading || movementsLoading || inventoryLoading;

    // FILTERED DATA
    const filteredMovements = React.useMemo(() => {
        return movements.filter(m => {
            const mDate = new Date(m.created_at).toISOString().split('T')[0];
            const isWithinRange = mDate >= startDate && mDate <= endDate;
            const matchesType = movementType === 'ALL' || m.type === movementType;
            return isWithinRange && matchesType;
        });
    }, [movements, startDate, endDate, movementType]);

    // KPI Calculations
    const lowStockItems = inventory.filter(item => (item.stock || 0) < 20);

    const downloadInventoryPDF = async () => {
        setIsExporting('inventory');
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(32, 35, 18); // #202312
            doc.text('Gourmet Glatt - Inventory Summary', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(110, 118, 71); // #6E7647
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Total SKUs: ${products.length}`, 14, 35);

            const tableData = products.map(p => [
                p.barcode || 'N/A',
                p.name,
                p.category || 'General'
            ]);

            autoTable(doc, {
                head: [['BARCODE', 'PRODUCT NAME', 'CATEGORY']],
                body: tableData,
                startY: 45,
                theme: 'striped',
                headStyles: { fillColor: [59, 65, 37], textColor: [255, 255, 255] }, // #3B4125
                alternateRowStyles: { fillColor: [249, 250, 245] },
            });

            doc.save(`inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Inventory report generated successfully");
        } catch (error) {
            toast.error("Failed to generate inventory report");
        } finally {
            setIsExporting(null);
        }
    };

    const downloadMovementsPDF = async () => {
        setIsExporting('movements');
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(32, 35, 18);
            doc.text('Gourmet Glatt - Movement Ledger', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(110, 118, 71);
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
            doc.text(`Filter: ${movementType === 'ALL' ? 'All Movements' : movementType === 'IN' ? 'Entries Only' : 'Outputs Only'}`, 14, 35);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

            const tableData = filteredMovements.map((m: any) => [
                new Date(m.created_at).toLocaleDateString(),
                m.type,
                m.products?.name || 'Unknown',
                m.quantity.toString(),
                m.customer || 'Internal'
            ]);

            autoTable(doc, {
                head: [['DATE', 'TYPE', 'PRODUCT', 'QTY', 'ACCOUNT']],
                body: tableData,
                startY: 45,
                theme: 'striped',
                headStyles: { fillColor: [82, 88, 52], textColor: [255, 255, 255] }, // #525834
            });

            doc.save(`movements_ledger_${startDate}_to_${endDate}.pdf`);
            toast.success("Movement ledger generated successfully");
        } catch (error) {
            toast.error("Failed to generate movement ledger");
        } finally {
            setIsExporting(null);
        }
    };

    const downloadCriticalStockPDF = async () => {
        setIsExporting('critical');
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(220, 38, 38); // Destructive
            doc.text('CRITICAL STOCK ALERT REPORT', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(32, 35, 18);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Review required for ${lowStockItems.length} items below threshold (20 units).`, 14, 35);

            const tableData = lowStockItems.map(p => [
                p.name,
                p.stock?.toString() || '0',
                'REQUIRED'
            ]);

            autoTable(doc, {
                head: [['PRODUCT', 'CURRENT STOCK', 'ACTION']],
                body: tableData,
                startY: 45,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
            });

            doc.save(`critical_stock_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Critical stock report generated");
        } catch (error) {
            toast.error("Failed to generate critical stock report");
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-6xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#202312] uppercase tracking-tighter">Report Control Center</h2>
                <p className="text-sm font-medium text-[#6E7647]">Analytical insights and data export</p>
            </div>

            {/* FILTER BAR */}
            <Card className="rounded-3xl border-[#525834]/20 bg-[#f9faf5]/50 backdrop-blur-md shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-end gap-6">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-[#202312] ml-1">Start Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 size-3.5 text-[#6E7647]" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-xl border-[#525834]/20 bg-white pl-10 focus-visible:ring-[#3b4125]"
                                />
                            </div>
                        </div>

                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-[#202312] ml-1">End Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 size-3.5 text-[#6E7647]" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-xl border-[#525834]/20 bg-white pl-10 focus-visible:ring-[#3b4125]"
                                />
                            </div>
                        </div>

                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-[#202312] ml-1">Movement Type</Label>
                            <Select value={movementType} onValueChange={setMovementType}>
                                <SelectTrigger id="type" className="rounded-xl border-[#525834]/20 bg-white focus:ring-[#3b4125]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-[#525834]/20">
                                    <SelectItem value="ALL" className="text-xs font-bold uppercase">All Movements</SelectItem>
                                    <SelectItem value="IN" className="text-xs font-bold uppercase text-emerald-700">Stock Entries (IN)</SelectItem>
                                    <SelectItem value="OUT" className="text-xs font-bold uppercase text-amber-700">Stock Outputs (OUT)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-center bg-[#3b4125] text-white rounded-xl h-10 px-4 shadow-lg shadow-[#3b4125]/20">
                            <Filter className="size-4 mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Filters Active</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ANALYTICS PREVIEW CARDS */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-[2rem] border-[#525834]/10 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Package className="w-5 h-5 text-[#3b4125]" />
                            <Badge variant="outline" className="text-[10px] font-bold border-[#3b4125]/20 text-[#3b4125] uppercase tracking-widest">Global</Badge>
                        </div>
                        <CardTitle className="text-sm font-black uppercase tracking-tight pt-4">Inventory Summary</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total SKUs in Catalog</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-[#202312] tracking-tighter tabular-numbers">
                            {isLoading ? "..." : products.length}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-[#525834]/10 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                <ArrowDownLeft className="w-4 h-4 text-[#6E7647]" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold border-[#6E7647]/20 text-[#6E7647] uppercase tracking-widest">Period</Badge>
                        </div>
                        <CardTitle className="text-sm font-black uppercase tracking-tight pt-4">Movement Flow</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            {startDate} to {endDate}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#202312] tracking-tighter tabular-numbers">
                                {isLoading ? "..." : filteredMovements.length}
                            </p>
                            <span className="text-[10px] font-bold text-[#6E7647] uppercase">Events</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] bg-destructive/5 shadow-sm hover:shadow-md transition-all group overflow-hidden border-destructive/20!">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-widest animate-pulse">Critical</Badge>
                        </div>
                        <CardTitle className="text-sm font-black uppercase tracking-tight pt-4 text-destructive">Critical Alerts</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-destructive/60">Stock Below Threshold (20)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-[#202312] tracking-tighter tabular-numbers">
                            {isLoading ? "..." : lowStockItems.length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* EXPORT BUTTONS GRID */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Button
                    onClick={downloadInventoryPDF}
                    disabled={isLoading || !!isExporting}
                    className="h-20 rounded-2xl bg-[#3b4125] hover:bg-[#202312] text-white font-black uppercase tracking-widest text-xs flex flex-col gap-1 items-center justify-center transition-all shadow-xl shadow-[#3b4125]/10 border-none group"
                >
                    {isExporting === 'inventory' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>Export Catalog</span>
                </Button>

                <Button
                    onClick={downloadMovementsPDF}
                    disabled={isLoading || !!isExporting}
                    className="h-20 rounded-2xl bg-[#525834] hover:bg-[#3b4125] text-white font-black uppercase tracking-widest text-xs flex flex-col gap-1 items-center justify-center transition-all shadow-xl shadow-[#525834]/10 border-none group"
                >
                    {isExporting === 'movements' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>Export Ledger</span>
                </Button>

                <Button
                    onClick={downloadCriticalStockPDF}
                    disabled={isLoading || !!isExporting || lowStockItems.length === 0}
                    variant="destructive"
                    className="h-20 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col gap-1 items-center justify-center transition-all shadow-xl shadow-destructive/10 border-none group"
                >
                    {isExporting === 'critical' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>Critical Report</span>
                </Button>
            </div>
        </div>
    );
};

export default ReportGenerator;
