import { z } from 'zod';

// schema for inventory view items
export const inventorySchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    entry: z.number(),
    output: z.number(),
    stock: z.number(),
    category: z.string(),
});

export type InventorySchema = z.infer<typeof inventorySchema>;

export const productSchema = z.object({
    barcode: z.string().min(1, "El código de barras es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional().nullish(),
    category: z.string().min(1, "La categoría es requerida"),
});

export type ProductSchema = z.infer<typeof productSchema>;
