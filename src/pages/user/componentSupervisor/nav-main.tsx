"use client"

import { type Icon } from "@tabler/icons-react"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Link, useLocation } from 'react-router-dom';

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: Icon
    }[]
}) {
    const location = useLocation()

    return (
        <SidebarGroup>
            <SidebarGroupContent className="px-2">
                <SidebarMenu className="gap-1.5">
                    {items.map((item) => {
                        const isActive = location.pathname === item.url
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton 
                                    asChild 
                                    tooltip={item.title}
                                    className={`h-12 rounded-xl transition-all duration-300 ${
                                        isActive 
                                            ? "bg-[#3b4125] text-white shadow-lg shadow-[#3b4125]/20" 
                                            : "text-[#6E7647] hover:bg-[#525834]/30 hover:text-white"
                                    }`}
                                >
                                    <Link to={item.url} className="flex items-center gap-3 px-3">
                                        {item.icon && (
                                            <item.icon className={`size-5 transition-colors ${
                                                isActive ? "text-white" : "text-[#6E7647]"
                                            }`} />
                                        )}
                                        <span className="font-bold tracking-tight uppercase text-[11px] truncate">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
