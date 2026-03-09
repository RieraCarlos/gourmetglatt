import {
    Bar,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    ComposedChart
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconTrendingUp } from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface ChartPoint {
    date: string
    entries: number
    outputs: number
    stock: number
    movement: number
}

interface StockMovementChartProps {
    data: ChartPoint[]
    productName: string
    currentStock: number
}

export function StockMovementChart({ data, productName, currentStock }: StockMovementChartProps) {
    const isMobile = useIsMobile()

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground border rounded-lg border-dashed">
                No movement data available
            </div>
        )
    }

    return (
        <Card className="border-0 md:border shadow-none md:shadow-sm overflow-hidden">
            <CardHeader className="p-2 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        Evolution <IconTrendingUp className="size-4 text-primary" />
                    </CardTitle>
                </div>
                <CardDescription className="text-xs">
                    Stock movements over time for {productName}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
                <div className="h-64 md:h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                minTickGap={isMobile ? 30 : 15}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return isMobile
                                        ? date.toLocaleDateString('es-ES', { month: 'numeric', day: 'numeric' })
                                        : date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
                                }}
                            />
                            <YAxis
                                yAxisId="stock"
                                orientation="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                yAxisId="movements"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={false} // Hide right axis ticks on all for cleaner look, tooltip gives values
                            />
                            <Tooltip
                                trigger="click" // Better for touch
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '12px'
                                }}
                                labelFormatter={(value) => `Fecha: ${new Date(value).toLocaleDateString('es-ES', { dateStyle: 'long' })}`}
                                formatter={(value, name) => {
                                    if (name === 'stock') return [value, 'Stock Total']
                                    if (name === 'entries') return [value, 'Entrada']
                                    if (name === 'outputs') return [value, 'Salida']
                                    return [value, name]
                                }}
                            />
                            {/* Stock line */}
                            <Line
                                yAxisId="stock"
                                type="monotone"
                                dataKey="stock"
                                stroke="hsl(220, 70%, 50%)"
                                strokeWidth={2}
                                dot={!isMobile}
                                activeDot={{ r: 5, stroke: 'hsl(220, 70%, 50%)', strokeWidth: 2 }}
                            />
                            {/* Entries bars */}
                            <Bar
                                yAxisId="movements"
                                dataKey="entries"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                barSize={isMobile ? 12 : 20}
                            />
                            {/* Outputs bars */}
                            <Bar
                                yAxisId="movements"
                                dataKey="outputs"
                                fill="#94a3b8"
                                radius={[4, 4, 0, 0]}
                                barSize={isMobile ? 12 : 20}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] md:text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                        <div className="size-2 rounded-full bg-[hsl(220,70%,50%)]" />
                        <span>Stock: {currentStock}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <div className="size-2 rounded-full bg-[#22c55e]" />
                        <span>Entradas</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <div className="size-2 rounded-full bg-[#94a3b8]" />
                        <span>Salidas</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
