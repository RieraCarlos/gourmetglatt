export interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'supervisor';
    created_at: string;
}

export interface Product {
    id: string;
    barcode: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface Movement {
    id: string;
    product_id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    user_id: string;
    created_at: string;
}

export interface InventoryItem {
    id: number | string;
    name: string;
    entry: number;
    output: number;
    stock: number;
}
