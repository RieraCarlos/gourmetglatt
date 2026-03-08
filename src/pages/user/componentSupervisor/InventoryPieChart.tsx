import { useMemo } from "react"
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts"
import type { DetailedStockMovement } from "@/app/types/database"

interface Props {
    data: DetailedStockMovement[]
}

export default function InventoryPieChart({ data }: Props) {
    const COLORS = [
        "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
        "#8884D8", "#82CA9D", "#A4DE6C", "#D0ED57"
    ];

    const chartData = useMemo(() => {

        const grouped: Record<string, number> = {}

        data.forEach((item) => {
            grouped[item.product_name] =
                (grouped[item.product_name] || 0) + item.quantity
        })

        return Object.entries(grouped).map(([product, quantity]) => ({
            name: product,
            value: quantity
        }))

    }, [data])

    return (
        <div className="rounded-2xl border p-4 w-full overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">
                Distribución de Inventario
            </h3>

            <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}