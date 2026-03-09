"use client"

import * as React from "react"
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import {
    IconChevronDown,
    IconChevronUp,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconGripVertical,
    IconLayoutColumns,
    IconTrendingUp,
    IconDotsVertical,
    IconEdit,
    IconTrash,
} from "@tabler/icons-react"
import { Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart } from "recharts"

import { useAppDispatch, useAppSelector } from "@/app/hook"
import { fetchStockMovements, fetchStockMovementsBatch, fetchInventory } from "@/features/inventory/inventorySlice"
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime"
import type { InventoryItem } from "@/app/types/database"
import { inventorySchema } from "@/app/types/schemas"
import { useIsMobile } from "@/hooks/use-mobile"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { softDeleteProduct, updateProduct, fetchProducts } from "@/features/products/productsSlice"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// reuse inventory item type, alias for clarity
type StockData = InventoryItem

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number | string }) {
    const { attributes, listeners } = useSortable({
        id,
    } as any)

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <IconGripVertical className="size-3 text-muted-foreground" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    )
}

function ActionsCell({ item }: { item: StockData }) {
    const dispatch = useAppDispatch()
    const { user } = useAppSelector(s => s.auth)
    const { items: products } = useAppSelector(s => s.products)

    // We get the actual product config so we can edit
    const product = React.useMemo(() => products.find(p => p.id === item.id.toString()), [products, item.id])

    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

    const [editName, setEditName] = React.useState("")
    const [editDesc, setEditDesc] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (isEditOpen && product) {
            setEditName(product.name)
            setEditDesc(product.description || "")
        }
    }, [isEditOpen, product])

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!product) return
        setIsSubmitting(true)
        try {
            await dispatch(updateProduct({
                id: product.id,
                name: editName,
                description: editDesc,
            })).unwrap()
            await dispatch(fetchInventory()).unwrap()
            toast.success("Producto actualizado exitosamente")
            setIsEditOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!user || (!product && !item.id)) return
        setIsSubmitting(true)
        try {
            await dispatch(softDeleteProduct({
                id: item.id.toString(),
                user_id: user.id
            })).unwrap()
            await dispatch(fetchInventory()).unwrap()
            toast.success("Producto eliminado exitosamente")
            setIsDeleteOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) return null

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <IconDotsVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={(e) => { e.preventDefault(); setIsEditOpen(true) }}
                        disabled={!product}
                    >
                        <IconEdit className="mr-2 size-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={(e) => { e.preventDefault(); setIsDeleteOpen(true) }}
                        className="text-destructive focus:text-destructive"
                    >
                        <IconTrash className="mr-2 size-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Producto</DialogTitle>
                        <DialogDescription>
                            Modifica el nombre y descripción del producto.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-desc">Descripción</Label>
                            <Input
                                id="edit-desc"
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar este producto? Esta acción lo removerá de las vistas activas.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

const columns: ColumnDef<StockData>[] = [
    {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
        accessorKey: "name",
        header: "NOMBRE",
        cell: ({ row }) => {
            return <TableCellViewer item={row.original} />
        },
    },
    {
        accessorKey: "entry",
        header: "ENTRY",
        cell: ({ row }) => <div className="text-center">{row.getValue("entry")}</div>,
    },
    {
        accessorKey: "output",
        header: "OUTPUT",
        cell: ({ row }) => <div className="text-center">{row.getValue("output")}</div>,
    },
    {
        accessorKey: "stock",
        header: "STOCK",
        cell: ({ row }) => {
            const stock = row.getValue("stock") as number
            return (
                <Badge variant={stock > 0 ? "default" : "destructive"} className="text-center">
                    {stock}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <ActionsCell item={row.original} />,
    },
]

function DraggableRow({ row }: { row: Row<StockData> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
    } as any)

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                    )}
                </TableCell>
            ))}
        </TableRow>
    )
}

function TableCellViewer({ item }: { item: StockData }) {
    const dispatch = useAppDispatch()
    const { stockMovements, movementsLoading, movementsError, movementsLastFetch } = useAppSelector((s) => s.inventory)
    const isMobile = useIsMobile()

    // Get movements for this specific product
    const productMovements = stockMovements[item.id.toString()] || []
    const isLoadingMovements = movementsLoading[item.id.toString()] || false
    const movementsErrorForProduct = movementsError[item.id.toString()]
    const lastFetchMovements = movementsLastFetch[item.id.toString()]

    // Check if movements data is stale (older than 5 minutes)
    const isMovementsStale = lastFetchMovements ? (Date.now() - lastFetchMovements) > (5 * 60 * 1000) : true

    // Fetch stock movements when drawer opens, but only if we don't have them or they're stale
    React.useEffect(() => {
        if (item.id && (!productMovements.length || isMovementsStale) && !isLoadingMovements && !movementsErrorForProduct) {
            dispatch(fetchStockMovements(item.id.toString()))
        }
    }, [dispatch, item.id, productMovements.length, isMovementsStale, isLoadingMovements, movementsErrorForProduct])

    // Transform movements data for the chart
    const chartData = React.useMemo(() => {
        if (!productMovements.length) return []

        // Sort movements by date
        const sortedMovements = [...productMovements].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Calculate cumulative stock over time
        let cumulativeStock = 0
        const chartPoints: Array<{
            date: string
            entries: number
            outputs: number
            stock: number
            movement: number // + for IN, - for OUT
        }> = []

        sortedMovements.forEach((movement) => {
            const date = new Date(movement.created_at).toISOString().split('T')[0]
            const quantity = movement.quantity
            const isEntry = movement.type === 'IN'

            if (isEntry) {
                cumulativeStock += quantity
                chartPoints.push({
                    date,
                    entries: quantity,
                    outputs: 0,
                    stock: cumulativeStock,
                    movement: quantity
                })
            } else {
                cumulativeStock -= quantity
                chartPoints.push({
                    date,
                    entries: 0,
                    outputs: quantity,
                    stock: cumulativeStock,
                    movement: -quantity
                })
            }
        })

        return chartPoints
    }, [productMovements])

    return (
        <Drawer direction={isMobile ? "bottom" : "right"}>
            <DrawerTrigger asChild>
                <Button variant="link" className="w-fit px-0 text-left text-foreground font-medium">
                    {item.name}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle>{item.name}</DrawerTitle>
                    <DrawerDescription>
                        Accumulated stock and individual movements over time
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    {!isMobile && (
                        <>
                            <div className="h-48">
                                {isLoadingMovements ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                ) : movementsErrorForProduct ? (
                                    <div className="flex items-center justify-center h-full text-destructive">
                                        Error loading movements: {movementsErrorForProduct}
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData}>
                                            <defs>
                                                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis
                                                yAxisId="stock"
                                                orientation="left"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                                label={{ value: 'Stock', angle: -90, position: 'insideLeft' }}
                                            />
                                            <YAxis
                                                yAxisId="movements"
                                                orientation="right"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                                label={{ value: 'Movimientos', angle: 90, position: 'insideRight' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '6px',
                                                }}
                                                labelFormatter={(value) => `Fecha: ${new Date(value).toLocaleDateString('es-ES')}`}
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
                                                strokeWidth={3}
                                                dot={{ fill: 'hsl(220, 70%, 50%)', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, stroke: 'hsl(220, 70%, 50%)', strokeWidth: 2 }}
                                            />
                                            {/* Entries bars */}
                                            <Bar
                                                yAxisId="movements"
                                                dataKey="entries"
                                                fill="hsl(142, 71%, 45%)"
                                                radius={[2, 2, 0, 0]}
                                            />
                                            {/* Outputs bars */}
                                            <Bar
                                                yAxisId="movements"
                                                dataKey="outputs"
                                                fill="hsl(0, 0%, 64%)"
                                                radius={[2, 2, 0, 0]}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No movement data available
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                <div className="flex gap-2 leading-none font-medium">
                                    Stock Evolution <IconTrendingUp className="size-4" />
                                </div>
                                <div className="text-muted-foreground">
                                    <strong>Blue line:</strong> Accumulated stock over time<br />
                                    <strong>Green bars:</strong> Individual entries<br />
                                    <strong>Gray bars:</strong> Individual outputs<br />
                                    Current stock: <strong>{item.stock}</strong> units
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="name">Product Name</Label>
                                <p className="text-sm font-medium">{item.name}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="stock">Current Stock</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{item.stock}</p>
                                    <Badge variant={item.stock > 0 ? "default" : "destructive"}>
                                        {item.stock > 0 ? "In Stock" : "Out of Stock"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="entry">Total Entries</Label>
                                <p className="text-sm font-medium">{item.entry}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="output">Total Outputs</Label>
                                <p className="text-sm font-medium">{item.output}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export function DataTable() {
    const dispatch = useAppDispatch()
    const { items: data, loading, error, stockMovements, movementsLastFetch, batchMovementsLoading } = useAppSelector((s) => s.inventory)
    const [localData, setLocalData] = React.useState(() => data)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })

    // Setup realtime subscription for automatic updates
    useInventoryRealtime()

    const sortableId = React.useId()
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => localData?.map(({ id }) => id) || [],
        [localData]
    )

    // Update local data when Redux data changes
    React.useEffect(() => {
        setLocalData(data)
    }, [data])

    // Fetch base products for Edit mapping
    React.useEffect(() => {
        dispatch(fetchProducts())
    }, [dispatch])

    // Schema validation
    React.useEffect(() => {
        if (data.length) {
            try {
                inventorySchema.array().parse(data)
            } catch (e) {
                console.error("Inventory schema mismatch", e)
            }
        }
    }, [data])

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            setLocalData((data) => {
                const oldIndex = dataIds.indexOf(active.id)
                const newIndex = dataIds.indexOf(over.id)
                return arrayMove(data, oldIndex, newIndex)
            })
        }
    }

    // Create table instance
    const table = useReactTable({
        data: localData,
        columns,
        state: {
            sorting,
            columnVisibility,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.id.toString(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    // Preload movements for current page products
    React.useEffect(() => {
        if (!localData.length || batchMovementsLoading) return

        // Get current page rows
        const currentPageRows = table.getRowModel().rows
        const currentPageProductIds = currentPageRows.map((row: any) => row.original.id.toString())

        // Filter products that don't have movements or have stale data
        const productsNeedingMovements = currentPageProductIds.filter((productId: string) => {
            const hasMovements = stockMovements[productId]?.length > 0
            const lastFetch = movementsLastFetch[productId]
            const isStale = lastFetch ? (Date.now() - lastFetch) > (5 * 60 * 1000) : true // 5 minutes

            return !hasMovements || isStale
        })

        // Batch load movements for products that need them
        if (productsNeedingMovements.length > 0) {
            dispatch(fetchStockMovementsBatch(productsNeedingMovements))
        }
    }, [dispatch, table, localData, pagination.pageIndex, pagination.pageSize, stockMovements, movementsLastFetch, batchMovementsLoading])

    // Conditional rendering for loading/error states
    if (loading && !data.length) {
        return (
            <div className="flex justify-center p-8">
                <div className="text-muted-foreground">Loading inventory...</div>
            </div>
        )
    }

    if (error && !data.length) {
        return (
            <div className="text-center p-8 text-red-500">
                Error loading inventory: {error}
            </div>
        )
    }

    return (
        <div className="w-full flex-col justify-start gap-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <Label htmlFor="view-selector" className="sr-only">
                    View
                </Label>
                <h2 className="text-lg font-semibold mr-4">Inventory</h2>
                <Select defaultValue="inventory">
                    <SelectTrigger
                        className="flex w-fit @4xl/main:hidden"
                        size="sm"
                        id="view-selector"
                    >
                        <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns className="size-4" />
                                <span className="hidden lg:inline">Columns</span>
                                <IconChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !== "undefined" &&
                                        column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
                <div className="flex items-center gap-2 py-4">
                    <Input
                        placeholder="Filter by product name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className={header.column.getCanSort() ? "cursor-pointer select-none" : undefined}
                                                    onClick={
                                                        header.column.getCanSort()
                                                            ? header.column.getToggleSortingHandler()
                                                            : undefined
                                                    }
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <div className="flex items-center gap-1">
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                            {header.column.getIsSorted()
                                                                ? header.column.getIsSorted() === "asc"
                                                                    ? <IconChevronUp className="size-3" />
                                                                    : <IconChevronDown className="size-3" />
                                                                : null}
                                                        </div>
                                                    )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext
                                        items={dataIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map((row) => (
                                            <DraggableRow key={row.id} row={row} />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No inventory data available.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>

                <div className="flex items-center justify-between px-4">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                    <SelectValue
                                        placeholder={table.getState().pagination.pageSize}
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
