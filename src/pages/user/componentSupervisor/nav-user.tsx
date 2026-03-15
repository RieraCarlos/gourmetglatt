"use client"

import * as React from "react"
import {
    IconDotsVertical,
    IconLogout,
    IconUserCircle,
} from "@tabler/icons-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useAppDispatch } from "@/app/hook"
import { logout } from "@/features/auth/authSlice"
import type { UserProfile } from "@/features/auth/authSlice"
import { useNavigate } from "react-router-dom"
import { UserProfileDialog } from "@/components/UserProfileDialog"

export function NavUser({
    user,
}: {
    user: UserProfile
}) {
    const { isMobile } = useSidebar()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [profileDialogOpen, setProfileDialogOpen] = React.useState(false)

    const handleLogout = () => {
        dispatch(logout())
        navigate('/login', { replace: true })
        supabase.auth.signOut().catch((error) => {
            console.error('Error signing out:', error)
        })
    }

    const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="bg-[#3b4125]/10 hover:bg-[#525834]/30 text-white rounded-xl h-14 border border-white/5 data-[state=open]:bg-[#3b4125]/20 transition-all px-3"
                            >
                                <Avatar className="h-9 w-9 rounded-full border-2 border-[#6E7647]/20">
                                    <AvatarImage src={avatarUrl} alt={user.name} />
                                    <AvatarFallback className="rounded-full bg-[#3b4125] text-white font-bold">
                                        {user.name?.substring(0, 2).toUpperCase() || 'GG'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left leading-tight ml-2">
                                    <span className="truncate font-black text-xs uppercase tracking-tight text-white">{user.name || 'User'}</span>
                                    <span className="truncate text-[9px] font-bold text-[#6E7647] uppercase tracking-widest">
                                        {user.role}
                                    </span>
                                </div>
                                <IconDotsVertical className="ml-auto size-4 text-[#6E7647]" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl bg-[#202312] border-[#3b4125]/20 text-white shadow-2xl p-2"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={12}
                        >
                            <DropdownMenuLabel className="p-2 font-normal">
                                <div className="flex items-center gap-3 px-1 py-2 text-left bg-white/5 rounded-xl border border-white/5">
                                    <Avatar className="h-10 w-10 rounded-full border-2 border-[#3b4125]">
                                        <AvatarImage src={avatarUrl} alt={user.name} />
                                        <AvatarFallback className="rounded-full font-bold">
                                            {user.name?.substring(0, 2).toUpperCase() || 'GG'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate font-black text-sm uppercase tracking-tight">{user.name || 'User'}</span>
                                        <span className="truncate text-[10px] font-bold text-[#6E7647] uppercase tracking-widest">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10 my-2" />
                            <DropdownMenuGroup className="space-y-1">
                                <DropdownMenuItem 
                                    className="rounded-xl hover:bg-[#525834]/50 focus:bg-[#525834]/50 transition-colors py-2.5 px-3 cursor-pointer"
                                    onSelect={() => setProfileDialogOpen(true)}
                                >
                                    <IconUserCircle className="size-4 mr-2 text-[#6E7647]" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Profile</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-white/10 my-2" />
                            <DropdownMenuItem 
                                className="rounded-xl hover:bg-destructive/20 focus:bg-destructive/20 text-destructive-foreground transition-colors py-2.5 px-3 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault()
                                    handleLogout()
                                }}
                            >
                                <IconLogout className="size-4 mr-2" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <UserProfileDialog 
                user={user}
                open={profileDialogOpen}
                onOpenChange={setProfileDialogOpen}
            />
        </>
    )
}
