import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface CategoryData {
    category: string;
    stock: number;
    fill: string;
}

interface StockDistributionDonutProps {
    data: CategoryData[];
    totalStock: number;
}

const StockDistributionDonut: React.FC<StockDistributionDonutProps> = ({ data, totalStock }) => {
    // Synchronize chart colors with corporate palette
    const chartConfig = useMemo(() => {
        const config: any = {
            stock: {
                label: "Units",
            }
        };
        data.forEach((item) => {
            config[item.category] = {
                label: item.category,
                color: item.fill,
            };
        });
        return config;
    }, [data]);

    return (
        <Card className="flex flex-col border-none shadow-xl bg-card overflow-hidden rounded-2xl">
            {/* Header with Corporate Primary Color */}
            <CardHeader className="bg-linear-to-r from-[#3b4125] to-[#202312] text-white p-6 pb-4 rounded-t-2xl">
                <CardTitle className="text-xl font-black uppercase tracking-tight">Inventory Mix</CardTitle>
                <CardDescription className="text-[#6E7647] font-medium">Stock units grouped by category</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <div className="w-full h-[300px] md:h-[250px] relative">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square h-full w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={data}
                                    dataKey="stock"
                                    nameKey="category"
                                    innerRadius="65%"
                                    outerRadius="85%"
                                    paddingAngle={5}
                                    strokeWidth={0}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Pie>

                                {/* Center Label */}
                                <g>
                                    <text
                                        x="50%"
                                        y="48%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-[#202312] text-4xl font-black"
                                    >
                                        {totalStock.toLocaleString()}
                                    </text>
                                    <text
                                        x="50%"
                                        y="58%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-[#6E7647] text-xs font-black uppercase tracking-widest"
                                    >
                                        Total Units
                                    </text>
                                </g>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* Legend with Corporate Tokens */}
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
                    {data.map((item) => (
                        <div key={item.category} className="flex items-center gap-2 group cursor-default">
                            <div
                                className="h-3 w-3 rounded-md shadow-sm group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-[11px] font-bold text-[#525834] uppercase tracking-wider">
                                {item.category}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default StockDistributionDonut;
