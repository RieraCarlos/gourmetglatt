"use client"

import * as React from "react"
import {
    IconCamera,
    IconDashboard,
    IconFileAi,
    IconFileDescription,
    IconInnerShadowTop,
    IconListDetails,
    IconReport,
    IconUsers,
    IconScan,
} from "@tabler/icons-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { useUserProfile } from "@/hooks/useUserProfile"
import type { UserProfile } from "@/features/auth/authSlice"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

const data = {
    navMain: [
        {
            title: "Scan Inventory",
            url: "/supervisor/scan",
            icon: IconScan,
        },
        {
            title: "Catalog",
            url: "/supervisor/catalog",
            icon: IconListDetails,
        },
        {
            title: "Dashboard",
            url: "/supervisor/dashboard",
            icon: IconDashboard,
        },
        {
            title: "Team",
            url: "/supervisor/team",
            icon: IconUsers,
        },
    ],
    navClouds: [
        {
            title: "Capture",
            icon: IconCamera,
            isActive: true,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Proposal",
            icon: IconFileDescription,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Prompts",
            icon: IconFileAi,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
    ],
    navSecondary: [

    ],
    documents: [
        {
            name: "Reports",
            url: "/supervisor/report",
            icon: IconReport,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useUserProfile()

    // Default user data while loading (matching the UserProfile type)
    const displayUser: UserProfile = user || {
        id: "loading",
        name: "User",
        email: "loading@example.com",
        avatar_url: "/avatars/default.jpg",
        role: "supervisor",
        sector_id: null
    }

    return (
        <Sidebar
            collapsible="icon"
            {...props}
            className="border-r border-[#3b4125]/20 transition-all duration-300 group-data-[collapsible=icon]:w-[68px]"
        >
            <SidebarHeader className="bg-[#202312] border-b border-[#3b4125]/10 py-4 rounded-t-lg">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="hover:bg-[#525834]/20 transition-colors h-12"
                        >
                            <Link to="/supervisor" className="flex items-center gap-3">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#3b4125] text-white shadow-lg shadow-[#3b4125]/20 transition-transform group-hover:scale-105">
                                    <IconInnerShadowTop className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-black text-white tracking-tight uppercase text-sm">GourmetGlatt</span>
                                    <span className="truncate text-[10px] font-bold text-[#6E7647] tracking-widest uppercase opacity-70">PWA Inventory</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="bg-[#202312] py-2">
                <NavMain items={data.navMain} />
                <NavDocuments items={data.documents} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter className="bg-[#202312] border-t border-[#3b4125]/10  rounded-b-lg">
                <NavUser user={displayUser} />
            </SidebarFooter>
        </Sidebar>
    )
}
