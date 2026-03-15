import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between pb-4 border-b border-[#3b4125]/10">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-[#3b4125]/10 rounded-xl" />
                    <Skeleton className="h-3 w-32 bg-[#3b4125]/5 rounded-full" />
                </div>
                <Skeleton className="h-10 w-10 bg-[#3b4125]/10 rounded-full" />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-[2rem] bg-white border border-[#3b4125]/5 p-6 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-10 w-10 bg-[#3b4125]/10 rounded-xl" />
                            <Skeleton className="h-4 w-20 bg-[#6E7647]/10 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-24 bg-[#202312]/5 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="h-[400px] rounded-[2.5rem] bg-white border border-[#3b4125]/5 p-8">
                    <Skeleton className="h-6 w-40 bg-[#3b4125]/10 mb-8 rounded-lg" />
                    <Skeleton className="h-64 w-full bg-[#6E7647]/5 rounded-xl" />
                </div>
                <div className="h-[400px] rounded-[2.5rem] bg-white border border-[#3b4125]/5 p-8">
                    <Skeleton className="h-6 w-40 bg-[#3b4125]/10 mb-8 rounded-lg" />
                    <Skeleton className="h-64 w-full bg-[#6E7647]/5 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
