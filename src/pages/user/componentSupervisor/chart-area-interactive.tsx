"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid } from "recharts"

import { useAppDispatch, useAppSelector } from "@/app/hook"
import { fetchInventory } from "@/features/inventory/inventorySlice"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "An interactive area chart with inventory data"

const chartConfig = {
    entry: {
        label: "Entries",
        color: "hsl(142, 71%, 45%)", // Verde
    },
    output: {
        label: "Outputs",
        color: "hsl(0, 0%, 64%)", // Gris
    },
} satisfies ChartConfig

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

export function ChartAreaInteractive() {
    const dispatch = useAppDispatch()
    const { items: data, loading, lastFetch } = useAppSelector((s) => s.inventory)

    console.log("Inventory data for chart:", data, "Loading:", loading, "LastFetch:", lastFetch)

    React.useEffect(() => {
        // Detect when page becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Page is visible, check if we should refetch
                const shouldFetch =
                    !data.length ||
                    !lastFetch ||
                    (Date.now() - lastFetch > CACHE_DURATION)

                if (shouldFetch && !loading) {
                    console.log("Page visible again, fetching inventory data...")
                    dispatch(fetchInventory())
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [dispatch, data.length, lastFetch, loading])

    React.useEffect(() => {
        // Fetch if:
        // 1. No data available
        // 2. Cache has expired (lastFetch is older than CACHE_DURATION or doesn't exist)
        const shouldFetch =
            !data.length ||
            !lastFetch ||
            (Date.now() - lastFetch > CACHE_DURATION)

        if (shouldFetch && !loading) {
            console.log("Fetching inventory data...")
            dispatch(fetchInventory())
        }
    }, [dispatch, data.length, lastFetch, loading])

    // Transform inventory data for the chart
    const chartData = React.useMemo(() => {
        if (!data.length) return []

        return data.map((item) => ({
            name: item.name,
            entry: item.entry || 0,
            output: item.output || 0,
        }))
    }, [data])

    // Show loading only if no data available AND currently loading
    if (!chartData.length && loading) {
        return (
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Inventory Movement</CardTitle>
                    <CardDescription>
                        Loading inventory data...
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
                        Loading chart...
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Optional: Render empty UI if no data and NOT loading
    // But since it's a dashboard card, seeing an empty area chart 
    // is better UX than completely removing the chart view.

    return (
        <Card className="w-full min-w-0 overflow-hidden @container/card">
            <CardHeader>
                <CardTitle>Product tracking</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Product entries and outputs comparison

                    </span>
                    <span className="@[540px]/card:hidden">
                        Entries vs Outputs
                        {loading && " (Refreshing...)"}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 w-full min-w-0">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full min-w-0"
                >
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillEntry" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="hsl(142, 71%, 45%)"
                                    stopOpacity={1.0}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(142, 71%, 45%)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="hsl(0, 0%, 64%)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(0, 0%, 64%)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="transparent" />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={(value, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.name
                                        }
                                        return value
                                    }}
                                />
                            }
                        />
                        <Area
                            dataKey="output"
                            type="natural"
                            fill="url(#fillOutput)"
                            stroke="hsl(0, 0%, 64%)"
                            stackId="a"
                        />
                        <Area
                            dataKey="entry"
                            type="natural"
                            fill="url(#fillEntry)"
                            stroke="hsl(142, 71%, 45%)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

