import { useMemo, useState, useEffect, Suspense, lazy } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchMovements } from "@/features/movements/movementsSlice"
import { fetchInventory } from "@/features/inventory/inventorySlice"
import type { RootState, AppDispatch } from "@/app/store"
import type { DetailedStockMovement } from "@/app/types/database"
import { supabase } from "@/lib/supabase"
import { BarChart3, Package, Users, Activity } from "lucide-react"
import { DashboardSkeleton } from "./DashboardSkeleton"

// Lazy load components for performance
const CustomerFilter = lazy(() => import("./CustomerFilter"))
const InventoryPieChart = lazy(() => import("./InventoryPieChart"))
const InventoryTable = lazy(() => import("./InventoryTable"))

export default function InventoryDashboard() {
    const dispatch = useDispatch<AppDispatch>()
    const { items: data, loading, error } = useSelector((state: RootState) => state.movements)
    const { items: inventory } = useSelector((state: RootState) => state.inventory)

    const [customerFilter, setCustomerFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("7d")

    useEffect(() => {
        dispatch(fetchMovements())
        dispatch(fetchInventory())
    }, [dispatch])

    // CENTRALIZED REALTIME SYNCHRONIZATION
    useEffect(() => {
        const channel = supabase
            .channel('dashboard-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stock_movements' },
                () => {
                    dispatch(fetchMovements())
                    dispatch(fetchInventory())
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [dispatch])

    const outMovements = useMemo(() => {
        return (data as DetailedStockMovement[]).filter((m) => m.type === "OUT")
    }, [data])

    const filteredData = useMemo(() => {
        const now = new Date()
        const filterDate = (dateStr: string) => {
            if (dateFilter === "all" || !dateStr) return true;

            const movementDate = new Date(dateStr)
            if (isNaN(movementDate.getTime())) return true; // If date is unparseable, don't filter it out

            if (dateFilter === "today") {
                return movementDate.toDateString() === now.toDateString()
            }
            if (dateFilter === "7d") {
                const threshold = new Date();
                threshold.setDate(now.getDate() - 7);
                return movementDate >= threshold;
            }
            if (dateFilter === "30d") {
                const threshold = new Date();
                threshold.setDate(now.getDate() - 30);
                return movementDate >= threshold;
            }
            return true
        }

        let result = outMovements
        if (customerFilter !== "all") {
            result = result.filter((m) => m.customer === customerFilter)
        }
        return result.filter((m) => filterDate(m.created_at || m.formatted_date))
    }, [customerFilter, dateFilter, outMovements])

    // KPI Metrics
    const metrics = useMemo(() => ({
        totalOut: outMovements.reduce((acc, current) => acc + current.quantity, 0),
        lowStockCount: inventory.filter(item => (item.stock || 0) < 20).length,
        activeCustomers: new Set(outMovements.map(m => m.customer)).size
    }), [outMovements, inventory])

    if (loading && data.length === 0) return <div className="p-8 lg:p-12 bg-[#6E7647]/5 min-h-screen"><DashboardSkeleton /></div>
    if (error) return <div className="p-12 text-destructive font-bold">Error: {error}</div>

    return (
        <div className="min-h-screen bg-[#6E7647]/5 transition-colors duration-500">
            <main className="p-4 md:p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto" aria-label="Main Dashboard Content">

                {/* PAGE TITLE FOR CONTEXT (Not sticky if parent header handles it) */}
                <div className="pb-4 border-b border-[#3b4125]/10 mb-8">
                    <h1 className="text-xl md:text-3xl font-black text-[#202312] tracking-tighter uppercase wrap-break-word">Inventory Dashboard</h1>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#6E7647] tracking-widest uppercase opacity-70">Strategic Stock Intelligence</p>
                </div>

                {/* 3-COLUMN KPI & FILTER GRID */}
                <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Operational Metrics">
                    {/* KPI 1: Movement volume */}
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl shadow-[#3b4125]/10 border border-white hover:translate-y-[-6px] transition-all duration-500 group overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-[#3b4125]/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10 flex justify-between items-start mb-6 gap-2">
                            <div className="p-4 rounded-2xl bg-linear-to-br from-[#3b4125] to-[#525834] shadow-lg shadow-[#3b4125]/30 shrink-0">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-[#6E7647] tracking-[0.2em] uppercase">Volume</span>
                                <span className="text-[8px] font-bold text-[#6E7647]/60 uppercase">Outbound Units</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-black text-[#202312] tracking-tighter tabular-numbers mb-1">
                                {loading ? "..." : metrics.totalOut.toLocaleString()}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-[#3b4125] rounded-full" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Dispatched</p>
                            </div>
                        </div>
                    </div>

                    {/* KPI 2: Critical Stock */}
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl shadow-destructive/10 border border-white hover:translate-y-[-6px] transition-all duration-500 group overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-destructive/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10 flex justify-between items-start mb-6 gap-2">
                            <div className="p-4 rounded-2xl bg-linear-to-br from-destructive to-orange-600 shadow-lg shadow-destructive/30 shrink-0">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-destructive tracking-[0.2em] uppercase">Status</span>
                                <span className="text-[8px] font-bold text-destructive/60 uppercase">System Alerts</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-black text-[#202312] tracking-tighter tabular-numbers mb-1">
                                {loading ? "..." : metrics.lowStockCount}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-destructive rounded-full" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">SKUs Below Threshold</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="relative bg-[#202312] rounded-[2.5rem] p-8 shadow-2xl shadow-black/40 text-white flex flex-col justify-between overflow-hidden border border-white/5 group">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#3b4125,transparent_60%)] opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <Users className="w-5 h-5 text-[#6E7647]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#6E7647]">Control Center</h4>
                                        <p className="text-[9px] font-bold text-[#6E7647]/40 uppercase">Filtering & Scopes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Target Account</label>
                                <Suspense fallback={<div className="h-12 bg-white/5 rounded-2xl animate-pulse" />}>
                                    <CustomerFilter
                                        data={data as DetailedStockMovement[]}
                                        value={customerFilter}
                                        onChange={setCustomerFilter}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-[9px] font-black text-[#6E7647] uppercase tracking-widest">Time Intelligence</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>
                            <div className="flex justify-between gap-1.5">
                                {[
                                    { id: "today", label: "Today" },
                                    { id: "7d", label: "7D" },
                                    { id: "30d", label: "30D" },
                                    { id: "all", label: "All" }
                                ].map((range) => (
                                    <button
                                        key={range.id}
                                        onClick={() => setDateFilter(range.id)}
                                        className={`flex-1 px-2 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all duration-500 border ${dateFilter === range.id
                                            ? 'bg-linear-to-br from-[#3b4125] to-[#202312] text-white border-white/20 shadow-xl scale-105 z-20'
                                            : 'bg-white/5 text-[#6E7647] border-transparent hover:border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ANALYTICAL CHARTS - SEQUENTIAL VERTICAL FLOW */}
                <section className="flex flex-col gap-12" aria-label="Analytical Visualizations">
                    <Suspense fallback={<div className="h-[400px] bg-white rounded-[2.5rem] animate-pulse" />}>
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-[#3b4125]/5 border border-[#3b4125]/5 flex flex-col min-w-0 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-[#6E7647]/10">
                                    <BarChart3 className="w-6 h-6 text-[#3b4125] shrink-0" />
                                </div>
                                <div>
                                    <h2 className="text-base md:text-xl font-black text-[#202312] uppercase tracking-tight wrap-break-word">Effective Distribution</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Share of outbound volume</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[350px]">
                                <InventoryPieChart data={filteredData} />
                            </div>
                        </div>
                    </Suspense>

                    <Suspense fallback={<div className="h-[400px] bg-white rounded-[2.5rem] animate-pulse" />}>
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-[#3b4125]/5 border border-[#3b4125]/5 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-[#6E7647]/10">
                                    <Activity className="w-6 h-6 text-[#3b4125] shrink-0" />
                                </div>
                                <div>
                                    <h2 className="text-base md:text-xl font-black text-[#202312] uppercase tracking-tight wrap-break-word">Recent Activity Log</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transactional history</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto scrollbar-hide">
                                <InventoryTable data={filteredData} />
                            </div>
                        </div>
                    </Suspense>
                </section>

            </main>
        </div>
    )
}
