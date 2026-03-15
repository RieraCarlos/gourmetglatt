import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAppSelector } from "@/app/hook"

export function SiteHeader() {
    const { user } = useAppSelector((state) => state.auth);
    return (
        <header className="sticky top-0 z-40 bg-background/5 p-4 backdrop-blur-md shadow-sm border-b border-[#525834]/10 transition-all">
            <div className="flex w-full items-center gap-2 px-1 lg:gap-4 lg:px-6">
                <SidebarTrigger className="-ml-1 text-[#3b4125] shrink-0" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 bg-[#3b4125]/20 hidden sm:block"
                />
                <div className="flex flex-1 items-center justify-between min-w-0">
                    <p className="text-[11px] md:text-sm font-black uppercase tracking-widest text-[#202312] flex items-center gap-2 truncate min-w-0">
                        <span className="truncate">{user?.role}</span> 
                        <span className="text-[8px] md:text-[10px] bg-[#3b4125]/10 px-2 py-0.5 rounded-full text-[#3b4125] shrink-0">OPERATIVE</span>
                    </p>
                </div>
            </div>
        </header>
    )
}
