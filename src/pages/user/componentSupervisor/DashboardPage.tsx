import { useMemo, useState, useEffect } from "react"
import type { DetailedStockMovement } from "@/app/types/database"

import CustomerFilter from "./CustomerFilter"
import InventoryPieChart from "./InventoryPieChart"
import InventoryTable from "./InventoryTable"

import { useDispatch, useSelector } from "react-redux"
import { fetchMovements } from "@/features/movements/movementsSlice"
import type { RootState, AppDispatch } from "@/app/store"

export default function InventoryDashboard() {
    const dispatch = useDispatch<AppDispatch>()
    const { items: data, loading, error } = useSelector((state: RootState) => state.movements)
    const [customerFilter, setCustomerFilter] = useState<string>("all")

    useEffect(() => {
        dispatch(fetchMovements())
    }, [dispatch])

    /* 1️⃣ Normalización estructural */
    const outMovements = useMemo(() => {
        return (data as DetailedStockMovement[]).filter((movement: DetailedStockMovement) => movement.type === "OUT")
    }, [data])
    /* 2️⃣ Filtro interactivo */
    const filteredData = useMemo(() => {
        if (customerFilter === "all") return outMovements
        return outMovements.filter(
            (movement: DetailedStockMovement) => movement.customer === customerFilter
        )
    }, [customerFilter, outMovements])
    if (loading && data.length === 0) {
        return (
            <div className="space-y-6 p-4 animate-pulse">
                <div className="h-10 w-[300px] bg-muted rounded-md" />
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="h-[300px] rounded-2xl bg-muted" />
                </div>
                <div className="h-[400px] rounded-2xl bg-muted" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 text-red-500">
                <p>Error cargando los movimientos de inventario: {error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4">

            <CustomerFilter
                data={data as DetailedStockMovement[]}
                value={customerFilter}
                onChange={setCustomerFilter}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <InventoryPieChart data={filteredData} />
            </div>

            <InventoryTable data={filteredData} />

        </div>
    )
}