import React from 'react';
import { useAppSelector } from '../app/hook';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';

const InventoryCharts: React.FC = () => {
    const { items: movements } = useAppSelector((state) => state.movements);

    // Prepare data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return format(date, 'yyyy-MM-dd');
    }).reverse();

    const chartData = last7Days.map(date => {
        const dayMovements = movements.filter(m => m.created_at.startsWith(date));
        return {
            date: format(new Date(date), 'dd/MM'),
            entradas: dayMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0),
            salidas: dayMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0),
        };
    });

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="text-lg font-bold mb-6">Flujo de Inventario (7 días)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888888', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888888', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="entradas" fill="rgb(34 197 94)" radius={[4, 4, 0, 0]} name="Entradas" />
                            <Bar dataKey="salidas" fill="rgb(239 68 68)" radius={[4, 4, 0, 0]} name="Salidas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="text-lg font-bold mb-6">Actividad de Movimientos</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="rgb(34 197 94)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="rgb(34 197 94)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="rgb(239 68 68)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="rgb(239 68 68)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                            />
                            <Area type="monotone" dataKey="entradas" stroke="rgb(34 197 94)" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} name="Entradas" />
                            <Area type="monotone" dataKey="salidas" stroke="rgb(239 68 68)" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} name="Salidas" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default InventoryCharts;
