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
    IconDotsVertical,
    IconEdit,
    IconTrash,
} from "@tabler/icons-react"
import { useAppDispatch, useAppSelector } from "@/app/hook"
import { fetchStockMovements, fetchStockMovementsBatch, fetchInventory } from "@/features/inventory/inventorySlice"
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime"
import type { InventoryItem } from "@/app/types/database"
import { inventorySchema } from "@/app/types/schemas"
import { useIsMobile } from "@/hooks/use-mobile"

const StockMovementChart = React.lazy(() => import("./stock-movement-chart").then(m => ({ default: m.StockMovementChart })))

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
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

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
        header: "NAME / BARCODE",
        cell: ({ row }) => {
            return (
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                    <TableCellViewer item={row.original} />
                </div>
            )
        },
    },
    {
        accessorKey: "entry",
        header: "ENTRY",
        cell: ({ row }) => <div className="text-right font-medium pr-4">{row.getValue("entry")}</div>,
    },
    {
        accessorKey: "output",
        header: "OUTPUT",
        cell: ({ row }) => <div className="text-right font-medium pr-4">{row.getValue("output")}</div>,
    },
    {
        accessorKey: "stock",
        header: "STOCK",
        cell: ({ row }) => {
            const stock = row.getValue("stock") as number
            return (
                <div className="flex justify-center">
                    <Badge
                        variant={stock > 0 ? "default" : "destructive"}
                        className={`text-center font-bold px-3 py-0.5 rounded-full ${stock > 0 ? "bg-[#3b4125] hover:bg-[#3b4125]" : ""}`}
                    >
                        {stock}
                    </Badge>
                </div>
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
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 border-b border-[#525834]/20 transition-colors hover:bg-[#6E7647]/5"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-4 px-4">
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
                    <DrawerDescription className="text-xs ">
                        Accumulated stock and individual movements over time
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm pb-8">
                    <React.Suspense fallback={
                        <div className="h-48 flex items-center justify-center border rounded-xl border-dashed">
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="h-4 w-32" />
                                <span className="text-xs text-muted-foreground">Cargando analíticas...</span>
                            </div>
                        </div>
                    }>
                        {isLoadingMovements ? (
                            <div className="h-48 flex items-center justify-center border rounded-xl border-dashed">
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : movementsErrorForProduct ? (
                            <div className="h-48 flex items-center justify-center text-destructive text-xs p-4 text-center border rounded-xl border-destructive/20 bg-destructive/5">
                                Error al cargar movimientos: {movementsErrorForProduct}
                            </div>
                        ) : (
                            <StockMovementChart
                                data={chartData}
                                productName={item.name}
                                currentStock={item.stock}
                            />
                        )}
                    </React.Suspense>

                    <Separator className="opacity-50" />

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
    const [activeCategory, setActiveCategory] = React.useState("All")

    // Dynamic category extraction
    const categories = React.useMemo(() => {
        const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean)))
        return ["All", ...uniqueCategories.sort()]
    }, [data])

    // Memoized filtered data
    const filteredData = React.useMemo(() => {
        if (activeCategory === "All") return localData
        return localData.filter(item => item.category === activeCategory)
    }, [localData, activeCategory])

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
        data: filteredData,
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

    // Reset pagination on category change
    React.useEffect(() => {
        table.setPageIndex(0)
    }, [activeCategory, table])

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
        <div className="w-full flex flex-col gap-6 pt-2">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                    <h2 className="text-xl font-black text-[#202312] uppercase tracking-tight">Inventory</h2>
                    <p className="text-[10px] font-bold text-[#6E7647] uppercase tracking-widest mt-0.5">Real-time Management</p>
                </div>
            </div>

            <div className="px-4 lg:px-6">
                <Tabs
                    value={activeCategory}
                    onValueChange={setActiveCategory}
                    className="w-full"
                >
                    <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-11 bg-[#202312]/5 p-1 gap-1 no-scrollbar rounded-xl border border-[#202312]/5">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category}
                                value={category}
                                className="data-[state=active]:bg-[#3b4125] data-[state=active]:text-white rounded-lg px-6 h-9 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                                {category === "Todos" ? "All categories" : category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="relative flex flex-col gap-4 px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Input
                            placeholder="Filter by product name..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="pl-4 h-11 rounded-xl border-[#202312]/10 bg-white shadow-sm focus-visible:ring-[#3b4125]"
                        />
                    </div>
                </div>

                <div className="relative rounded-2xl border border-[#202312]/10 bg-white shadow-md overflow-hidden">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
                            <Table>
                                <TableHeader className="sticky top-0 z-20 bg-[#202312]">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-none h-14">
                                            {headerGroup.headers.map((header) => {
                                                const isNumeric = header.column.id === "entry" || header.column.id === "output" || header.column.id === "stock"
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        colSpan={header.colSpan}
                                                        className={`text-[10px] font-black uppercase text-white tracking-widest px-4 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                                                        onClick={
                                                            header.column.getCanSort()
                                                                ? header.column.getToggleSortingHandler()
                                                                : undefined
                                                        }
                                                    >
                                                        {header.isPlaceholder ? null : (
                                                            <div className={`flex items-center gap-2 ${isNumeric ? "justify-center" : "justify-start"}`}>
                                                                {flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                                {header.column.getIsSorted()
                                                                    ? header.column.getIsSorted() === "asc"
                                                                        ? <IconChevronUp className="size-3 text-white/50" />
                                                                        : <IconChevronDown className="size-3 text-white/50" />
                                                                    : null}
                                                            </div>
                                                        )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
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
                                                className="h-32 text-center text-[#6E7647] font-medium italic"
                                            >
                                                No inventory matches available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </DndContext>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#6E7647] uppercase tracking-wider">Entries:</span>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger className="h-9 w-[80px] rounded-xl border-[#202312]/10 bg-white font-bold text-xs shadow-sm focus:ring-[#3b4125]" id="rows-per-page">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="top" className="rounded-xl">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`} className="font-bold">
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-[10px] font-black text-[#6E7647] uppercase tracking-widest">
                            {table.getFilteredRowModel().rows.length} Total SKUs
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-[#6E7647] uppercase tracking-widest mr-2">
                            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                        <div className="flex gap-1.5">
                            <Button
                                variant="outline"
                                className="size-9 rounded-xl border-[#202312]/10 bg-white hover:bg-[#202312]/5"
                                size="icon"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronsLeft className="size-4 text-[#3b4125]" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-9 rounded-xl border-[#202312]/10 bg-white hover:bg-[#202312]/5"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronLeft className="size-4 text-[#3b4125]" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-9 rounded-xl border-[#202312]/10 bg-white hover:bg-[#202312]/5"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronRight className="size-4 text-[#3b4125]" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-9 rounded-xl border-[#202312]/10 bg-white hover:bg-[#202312]/5"
                                size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronsRight className="size-4 text-[#3b4125]" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
