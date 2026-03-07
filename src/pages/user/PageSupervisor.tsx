import { AppSidebar } from "./componentSupervisor/app-sidebar"
import { ChartAreaInteractive } from "./componentSupervisor/chart-area-interactive"
import { DataTable } from "./componentSupervisor/data-table"
import { SectionCards } from "./componentSupervisor/section-cards"
import { SiteHeader } from "./componentSupervisor/site-header"
import ScanInventory from "./ScanInventory"
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
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <Routes>
                            <Route
                                index
                                element={
                                    <>
                                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                            <SectionCards />
                                            <div className="px-4 lg:px-6">
                                                <ChartAreaInteractive />
                                            </div>
                                            <DataTable />
                                        </div>
                                    </>
                                }
                            />
                            <Route path="scan" element={<ScanInventory />} />
                        </Routes>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
