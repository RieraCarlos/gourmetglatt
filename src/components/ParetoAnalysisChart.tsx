import {
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    ComposedChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ParetoData {
    name: string;
    output: number;
    cumulativePercentage: number;
    class: 'A' | 'B' | 'C';
}

interface ParetoAnalysisChartProps {
    data: ParetoData[];
}

const ParetoAnalysisChart: React.FC<ParetoAnalysisChartProps> = ({ data }) => {
    // Determine Class A items for the table
    const classAItems = data.filter(item => item.class === 'A');

    return (
        <Card className="w-full border-none shadow-xl bg-card overflow-hidden rounded-2xl">
            <CardHeader className="bg-linear-to-r from-[#3b4125] to-[#202312] text-white p-6 rounded-t-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl md:text-2xl font-bold">Criticality Analysis (Pareto ABC)</CardTitle>
                        <CardDescription className="text-white/70 text-sm md:text-base mt-1">
                            Identification of high-impact products (80/20 Rule)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit bg-white/10 text-white border-white/20 px-3 py-1 text-xs uppercase tracking-wider font-bold">
                        {classAItems.length} Class A Items
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-8 space-y-8">
                {/* Responsive Chart Container */}
                <div className="w-full h-64 md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                scale="band"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#64748B' }}
                                interval={0}
                                hide={data.length > 10}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B', fontSize: 12 } }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                domain={[0, 100]}
                                label={{ value: '%', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748B', fontSize: 12 } }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'rgba(59, 65, 37, 0.05)' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar
                                yAxisId="left"
                                dataKey="output"
                                radius={[6, 6, 0, 0]}
                                name="Output Frequency"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.class === 'A' ? 'var(--corp-light)' : '#CBD5E1'}
                                    />
                                ))}
                            </Bar>
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumulativePercentage"
                                stroke="#3b4125"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#3b4125', strokeWidth: 2, stroke: '#FFF' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="Cumulative %"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Responsive Detailed Table */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 bg-[#6E7647] rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Class A Details (80% Impact)</h3>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-b border-border">
                                        <TableHead className="font-bold text-[#202312] py-4">Product Name</TableHead>
                                        <TableHead className="text-right font-bold text-[#202312] py-4">Frequency</TableHead>
                                        <TableHead className="text-right font-bold text-[#202312] py-4">Accumulated %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classAItems.map((item, idx) => (
                                        <TableRow key={idx} className="group hover:bg-[#3b4125]/5 transition-colors border-b border-border/50">
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#6E7647] text-white text-[10px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    {item.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-[#3b4125] py-4">
                                                {item.output}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Badge variant="outline" className="bg-[#6E7647]/10 text-[#6E7647] border-[#6E7647]/20 font-mono">
                                                    {item.cumulativePercentage.toFixed(1)}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ParetoAnalysisChart;
