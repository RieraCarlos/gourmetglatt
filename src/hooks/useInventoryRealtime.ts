import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hook'
import { fetchInventory } from '@/features/inventory/inventorySlice'
import { supabase } from '@/lib/supabase'

/**
 * Hook para subscribirse a cambios en tiempo real de inventario
 * Automáticamente dispara fetchInventory cuando hay cambios
 */
export function useInventoryRealtime() {
    const dispatch = useAppDispatch()

    useEffect(() => {
        // Debug log
        console.log('Setting up inventory realtime subscription')

        // Subscribe to inventory_view changes
        const subscription = supabase
            .channel('inventory_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escucha INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'inventory_view', // O la tabla principal de inventario
                },
                (payload) => {
                    console.log('Inventory change detected:', payload)
                    // Refetch inventory cuando hay cambios
                    dispatch(fetchInventory())
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to inventory changes')
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('Failed to subscribe to inventory changes')
                }
            })

        return () => {
            console.log('Cleaning up inventory realtime subscription')
            subscription.unsubscribe()
        }
    }, [dispatch])
}
