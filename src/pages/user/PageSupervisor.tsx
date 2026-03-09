import { AppSidebar } from "./componentSupervisor/app-sidebar"
import { ChartAreaInteractive } from "./componentSupervisor/chart-area-interactive"
import { DataTable } from "./componentSupervisor/data-table"
import { SectionCards } from "./componentSupervisor/section-cards"
import { SiteHeader } from "./componentSupervisor/site-header"
import ScanInventory from "./componentSupervisor/ScanInventory"
import ProductCatalog from "@/components/ProductCatalog"
import InventoryDashboard from "./componentSupervisor/DashboardPage"
import ReportGenerator from "@/components/ReportGenerator"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Routes, Route } from 'react-router-dom'

export default function Page() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col min-w-0">
                    <div className="@container/main flex flex-1 flex-col gap-2 min-w-0">
                        <Routes>
                            <Route
                                index
                                element={
                                    <>
                                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-0">
                                            <SectionCards />
                                            <div className="px-4 lg:px-6 min-w-0 w-full overflow-hidden">
                                                <ChartAreaInteractive />
                                            </div>
                                            <DataTable />
                                        </div>
                                    </>
                                }
                            />
                            <Route path="scan" element={<ScanInventory />} />
                            <Route path="catalog" element={<ProductCatalog />} />
                            <Route path="dashboard" element={<InventoryDashboard />} />
                            <Route path="report" element={<ReportGenerator />} />
                        </Routes>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
