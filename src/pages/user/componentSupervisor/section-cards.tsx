import { IconTruck, IconPlus, IconBox, IconPercentage } from "@tabler/icons-react"

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/app/hook"
import { useEffect, useMemo } from "react"
import { fetchTodayTotals, selectShouldFetchTodayTotals } from "@/features/inventory/inventorySlice"

export function SectionCards() {
    const dispatch = useAppDispatch()
    const { items } = useAppSelector((s) => s.inventory)
    const { out: shippedToday, in: registeredToday } = useAppSelector((s) => s.inventory.todayTotals)

    // compute average stock and total entries
    const averageStock = useMemo(() => {
        if (!items.length) return 0
        const total = items.reduce((sum, it) => sum + (it.stock || 0), 0)
        return Math.round(total / items.length)
    }, [items])

    const totalEntries = useMemo(() => {
        return items.reduce((sum, it) => sum + (it.entry || 0), 0)
    }, [items])

    const percentageShipments = useMemo(() => {
        if (totalEntries === 0) return 0
        return parseFloat(((shippedToday / totalEntries) * 100).toFixed(2))
    }, [shippedToday, totalEntries])

    const shouldFetchTodayTotals = useAppSelector(selectShouldFetchTodayTotals)

    useEffect(() => {
        if (shouldFetchTodayTotals) {
            dispatch(fetchTodayTotals())
        }
    }, [dispatch, shouldFetchTodayTotals])

    return (
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-r *:data-[slot=card]:from-white *:data-[slot=card]:to-[#3b4125]/20 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#202312]">
                        <IconTruck className="size-7" />
                        Packages shipped today
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-[#3b4125]/80">
                        {shippedToday}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#202312]">
                        <IconPlus className="size-7" />
                        Packages registered today
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-[#3b4125]/80">
                        {registeredToday}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#202312]">
                        <IconBox className="size-7" />
                        Average stock per product
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-[#3b4125]/80">
                        {averageStock}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#202312]">
                        <IconPercentage className="size-7" />
                        Product shipments
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-[#3b4125]/80">
                        {percentageShipments}%
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    )
}
