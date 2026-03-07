import { z } from 'zod';

// schema for inventory view items
export const inventorySchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    entry: z.number(),
    output: z.number(),
    stock: z.number(),
});

export type InventorySchema = z.infer<typeof inventorySchema>;
