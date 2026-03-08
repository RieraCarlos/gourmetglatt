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

interface Props {
    data: DetailedStockMovement[]
}

const columns: ColumnDef<DetailedStockMovement>[] = [
    { accessorKey: "formatted_date", header: "Fecha" },
    { accessorKey: "product_name", header: "Producto" },
    { accessorKey: "type", header: "Tipo" },
    { accessorKey: "quantity", header: "Cantidad" },
    { accessorKey: "user_name", header: "Usuario" },
    { accessorKey: "customer", header: "Cliente" }
]

export default function InventoryTable({ data }: Props) {

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <div className="rounded-2xl border">

            <Table>

                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>

                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
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

                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>

                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
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