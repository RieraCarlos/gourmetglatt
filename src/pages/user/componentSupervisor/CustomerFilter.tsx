import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import type { DetailedStockMovement } from "@/app/types/database"

interface Props {
    data: DetailedStockMovement[]
    value: string
    onChange: (value: string) => void
}

export default function CustomerFilter({
    data,
    value,
    onChange
}: Props) {

    const customers = Array.from(
        new Set(data.map((d) => d.customer).filter(Boolean))
    ) as string[]

    return (
        <div className="w-[300px]">

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filtrar cliente" />
                </SelectTrigger>

                <SelectContent>

                    <SelectItem value="all">
                        All
                    </SelectItem>

                    {customers.map((customer, index) => (
                        <SelectItem key={`customer-${customer || index}`} value={String(customer)}>
                            {String(customer)}
                        </SelectItem>
                    ))}

                </SelectContent>

            </Select>

        </div>
    )
}