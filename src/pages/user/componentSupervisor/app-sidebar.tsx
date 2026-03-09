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

    // Default user data while loading
    const displayUser = user || {
        name: "User",
        email: "loading@example.com",
        avatar: "/avatars/default.jpg",
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                        >
                            <Link to="/supervisor">
                                <IconInnerShadowTop className="size-5!" />
                                <span className="text-base font-bold">GourmetGlatt</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavDocuments items={data.documents} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={displayUser} />
            </SidebarFooter>
        </Sidebar>
    )
}
