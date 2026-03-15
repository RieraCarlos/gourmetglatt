import {
    flexRender,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

import type { DetailedStockMovement } from "@/app/types/database"
import { Badge } from "@/components/ui/badge"

interface Props {
    data: DetailedStockMovement[]
}

const columns: ColumnDef<DetailedStockMovement>[] = [
    {
        accessorKey: "product_name",
        header: "Product",
        cell: ({ row }) => <span className="font-bold text-[#202312]">{row.original.product_name}</span>
    },
    {
        accessorKey: "formatted_date",
        header: "Date",
        cell: ({ row }) => <span className="text-[10px] font-black uppercase text-muted-foreground">{row.original.formatted_date}</span>
    },
    {
        accessorKey: "quantity",
        header: "Units",
        cell: ({ row }) => (
            <Badge variant="secondary" className="bg-[#3b4125]/10 text-[#3b4125] border-none font-black tabular-numbers">
                {row.original.quantity}
            </Badge>
        )
    },
    {
        accessorKey: "customer",
        header: "Client",
        cell: ({ row }) => <span className="text-xs font-bold text-[#525834] italic">{row.original.customer}</span>
    }
]

export default function InventoryTable({ data }: Props) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground font-medium italic">No movements recorded for the selected filter.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-auto overflow-y-auto scrollbar-thin scrollbar-thumb-[#3b4125]/20 scrollbar-track-transparent pr-2">
            <Table>
                <TableHeader className="bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-b border-[#3b4125]/10 hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="h-12 font-black text-[#3b4125] text-[10px] uppercase tracking-widest">
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row, idx) => (
                        <TableRow
                            key={row.id}
                            className={`border-b border-muted/30 transition-colors hover:bg-[#525834]/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#6E7647]/5'
                                }`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-4">
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
