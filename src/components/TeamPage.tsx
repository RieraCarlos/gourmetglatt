import React from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hook';
import { fetchTeamMembers, updateMemberInState, removeMemberFromState } from '@/features/profiles/profilesSlice';
import { supabase } from '@/lib/supabase';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconUsers, IconMail, IconBadge, IconUsersGroup } from "@tabler/icons-react";
import type { UserProfile } from '@/features/auth/authSlice';

export default function TeamPage() {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const { teamMembers, loading } = useAppSelector((state) => state.profiles);
    React.useEffect(() => {
        if (currentUser?.sector_id) {
            dispatch(fetchTeamMembers(currentUser.sector_id));

            // Set up Realtime subscription for this sector
            const channel = supabase
                .channel(`team-sector-${currentUser.sector_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'profiles',
                        filter: `sector_id=eq.${currentUser.sector_id}`,
                    },
                    (payload) => {
                        console.log('Realtime profile change:', payload);
                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            dispatch(updateMemberInState(payload.new as UserProfile));
                        } else if (payload.eventType === 'DELETE') {
                            dispatch(removeMemberFromState(payload.old.id));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentUser?.sector_id, dispatch]);

    // Use useMemo to prevent unnecessary calculations in future iterations
    const members = React.useMemo(() => teamMembers, [teamMembers]);

    if (loading && members.length === 0) {
        return <TeamSkeleton />;
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#3b4125]/20 border border-[#3b4125]/10">
                        <IconUsersGroup className="size-6 text-[#6E7647]" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#202312]">
                            My Team
                        </h1>
                        <p className="text-[10px] sm:text-xs font-bold text-[#6E7647] uppercase tracking-[0.2em]">
                            Directory of Sector Collaborators
                        </p>
                    </div>
                </div>
            </div>

            {members.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {members.map((member) => (
                        <MemberCarnet
                            key={member.id}
                            member={member}
                            isCurrentUser={member.id === currentUser?.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function MemberCarnet({ member, isCurrentUser }: { member: UserProfile, isCurrentUser: boolean }) {
    const avatarUrl = member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`;

    return (
        <Card className="group relative overflow-hidden rounded-[2rem] border-[#3b4125]/10 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {/* Decoration Gradient */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#202312] to-[#3b4125] opacity-95" />

            <CardHeader className="relative pt-12 flex flex-col items-center">
                <div className="relative">
                    <Avatar className="size-24 border-4 border-white shadow-2xl rounded-full">
                        <AvatarImage src={avatarUrl} alt={member.name} />
                        <AvatarFallback className="bg-[#525834] text-white text-2xl font-black">
                            {member.name?.substring(0, 2).toUpperCase() || 'GG'}
                        </AvatarFallback>
                    </Avatar>
                    {isCurrentUser && (
                        <div className="absolute -bottom-1 -right-1 bg-[#6E7647] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border-2 border-white shadow-lg">
                            Tú
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-2 pb-8 text-center space-y-4">
                <div className="space-y-1">
                    <h3 className="font-black text-lg uppercase tracking-tight text-[#202312] line-clamp-1 px-2">
                        {member.name || (member.email.split('@')[0])}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 text-[#6E7647]">
                        <IconBadge className="size-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {member.role}
                        </span>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#3b4125]/5 space-y-2">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3b4125]/5 rounded-xl text-[#202312]/70 group-hover:bg-[#3b4125]/10 transition-colors">
                        <IconMail className="size-3.5 text-[#6E7647]" />
                        <span className="text-[11px] font-medium truncate">
                            {member.email}
                        </span>
                    </div>
                </div>

                {/* Footer Badge */}
                <div className="pt-2">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6E7647]/10 text-[#6E7647] text-[8px] font-black uppercase tracking-widest">
                        Sector Verified
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TeamSkeleton() {
    return (
        <div className="p-4 sm:p-8 space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="rounded-[2rem] border-[#3b4125]/10 bg-white">
                        <div className="h-24 bg-[#3b4125]/5 rounded-t-[1.9rem]" />
                        <CardContent className="pt-12 pb-8 flex flex-col items-center space-y-4">
                            <Skeleton className="size-24 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[#3b4125]/5 rounded-[3rem] border-2 border-dashed border-[#3b4125]/10">
            <div className="p-6 rounded-full bg-white shadow-xl">
                <IconUsers className="size-12 text-[#6E7647]" />
            </div>
            <div className="space-y-1 px-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-[#202312]">Solitary Echoes...</h3>
                <p className="text-sm font-medium text-[#6E7647] max-w-xs">
                    It seems that you are the only active member in this sector.
                </p>
            </div>
        </div>
    );
}