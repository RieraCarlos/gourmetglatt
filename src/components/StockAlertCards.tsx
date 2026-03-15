import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, Package, ArrowRight } from 'lucide-react';

interface LowStockProduct {
    id: string | number;
    name: string;
    barcode: string;
    stock: number;
}

interface CategoryAlert {
    category: string;
    lowStockCount: number;
    totalCount: number;
    percentage: number;
    products: LowStockProduct[];
}

interface StockAlertCardsProps {
    alerts: CategoryAlert[];
}

/**
 * Atomic Alert Card Component
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const AlertCard = memo(({ alert }: { alert: CategoryAlert }) => {
    return (
        <Card className="group relative overflow-hidden border-[#3b4125]/10 bg-linear-to-r from-[#ffffff] to-[#f7dfdf] shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
            {/* Header with Corporate Primary Color */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3b4125]" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-[#6E7647]">
                    {alert.category}
                </CardTitle>
                <div className="p-1.5 rounded-full bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#202312]">{alert.lowStockCount}</span>
                    <span className="text-sm font-bold text-[#525834]">SKUs CRITICAL</span>
                </div>

                <p className="text-[11px] font-medium text-muted-foreground mt-1">
                    {alert.percentage.toFixed(1)}% of category requires replenishment
                </p>

                <div className="mt-5">
                    <Dialog>
                        <DialogTrigger asChild>
                            <button
                                className="w-full h-11 flex items-center justify-between px-4 text-sm font-bold rounded-xl bg-[#3b4125] text-white hover:bg-[#202312] active:scale-[0.98] transition-all shadow-lg shadow-[#3b4125]/10"
                                aria-label={`View low stock for ${alert.category}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span>Details</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-destructive/10">
                                        <AlertCircle className="w-6 h-6 text-destructive" />
                                    </div>
                                    <DialogTitle className="text-2xl font-black text-[#202312]">
                                        Critical Stock: {alert.category}
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="text-base font-medium text-[#525834]">
                                    Items below the safety threshold (20 units).
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 rounded-2xl border border-border overflow-hidden bg-white/50 backdrop-blur-sm">
                                <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                                    <Table>
                                        <TableHeader className="bg-[#3b4125]/5 sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow className="border-b border-[#3b4125]/10 hover:bg-transparent">
                                                <TableHead className="font-black text-[#3b4125] h-12 px-4 italic">Product</TableHead>
                                                <TableHead className="font-black text-[#3b4125] h-12">Barcode</TableHead>
                                                <TableHead className="text-right font-black text-[#3b4125] h-12 px-4">Current</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {alert.products.map((product) => (
                                                <TableRow key={product.id} className="hover:bg-[#525834]/5 transition-colors border-b border-muted/30 last:border-0">
                                                    <TableCell className="py-4 px-4 font-bold text-[#202312]">{product.name}</TableCell>
                                                    <TableCell className="py-4 font-mono text-xs text-muted-foreground">{product.barcode}</TableCell>
                                                    <TableCell className="py-4 px-4 text-right">
                                                        <Badge variant="destructive" className="font-black bg-destructive text-white border-none shadow-sm px-3">
                                                            {product.stock}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
});

AlertCard.displayName = 'AlertCard';

const StockAlertCards: React.FC<StockAlertCardsProps> = ({ alerts }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert) => (
                <AlertCard key={alert.category} alert={alert} />
            ))}

            {alerts.length === 0 && (
                <Card className="col-span-full border-dashed border-[#525834]/30 bg-[#525834]/5 flex flex-col items-center justify-center p-12 text-center rounded-3xl">
                    <div className="p-5 rounded-full bg-white shadow-sm mb-4">
                        <Package className="w-10 h-10 text-[#525834]" />
                    </div>
                    <CardTitle className="text-xl font-black text-[#202312]">All categories healthy</CardTitle>
                    <CardDescription className="text-[#6E7647] font-medium mt-1">
                        No products are currently under the 20-unit replenishment threshold.
                    </CardDescription>
                </Card>
            )}
        </div>
    );
};

export default StockAlertCards;
