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
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                        <IconTruck className="size-4" />
                        Packages shipped today
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {shippedToday}
                    </CardTitle>
                    {/* 
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +12.5%
                        </Badge>
                    </CardAction>
                    */}
                </CardHeader>
                {/* 
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Trending up this month <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Visitors for the last 6 months
                    </div>
                </CardFooter>
                */}
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                        <IconPlus className="size-4" />
                        Packages registered today
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {registeredToday}
                    </CardTitle>
                    {/* 
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingDown />
                            -20%
                        </Badge>
                    </CardAction>
                    */}
                </CardHeader>
                {/* 
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Down 20% this period <IconTrendingDown className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Acquisition needs attention
                    </div>
                </CardFooter>
                */}
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                        <IconBox className="size-4" />
                        Average stock per product
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {averageStock}
                    </CardTitle>
                    {/* 
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +12.5%
                        </Badge>
                    </CardAction>
                    */}
                </CardHeader>
                {/*     
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Strong user retention <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Engagement exceed targets</div>
                </CardFooter>
                */}
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                        <IconPercentage className="size-4" />
                        Percentage of product shipments
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {percentageShipments}%
                    </CardTitle>
                    {/* 
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +4.5%
                        </Badge>
                    </CardAction>
                    */}
                </CardHeader>
                {/*     
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Steady performance increase <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Meets growth projections</div>
                </CardFooter>
                */}
            </Card>
        </div>
    )
}
