import { useMemo } from "react"
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts"
import type { DetailedStockMovement } from "@/app/types/database"

interface Props {
    data: DetailedStockMovement[]
}

export default function InventoryPieChart({ data }: Props) {
    // Earthy Corporate palette
    const COLORS = [
        "#3b4125", // Corp Primary
        "#202312", // Corp Dark
        "#6E7647", // Corp Light
        "#525834", // Corp Secondary
        "#8B9467", // Light Sage
        "#A3AD85", // Pale Olive
    ];

    const chartData = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach((item) => {
            const name = item.product_name || "Unknown Item"
            const qty = Number(item.quantity) || 0
            if (qty > 0) {
                grouped[name] = (grouped[name] || 0) + qty
            }
        })
        return Object.entries(grouped)
            .map(([product, quantity]) => ({
                name: product,
                value: quantity
            }))
            .sort((a, b) => b.value - a.value) // Sort by volume
            .slice(0, 10) // Only top 10 to keep it clean
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground italic text-sm bg-muted/5 rounded-[2.5rem] border border-dashed border-[#6E7647]/20">
                <p className="font-bold uppercase tracking-widest text-[10px]">No distribution data available</p>
            </div>
        )
    }

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        stroke="none"
                        label={({ name, x, y, cx }) => (
                            <text
                                x={x}
                                y={y}
                                fill="#202312"
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                className="text-[10px] font-black uppercase tracking-tighter"
                            >
                                {name.length > 12 ? `${name.substring(0, 10)}...` : name}
                            </text>
                        )}
                        labelLine={{ stroke: '#3b4125', strokeWidth: 1, opacity: 0.3 }}
                    >
                        {chartData.map((_entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            backgroundColor: '#202312',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#white' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}