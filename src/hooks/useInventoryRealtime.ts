import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch } from '@/app/hook'
import { fetchInventory, fetchTodayTotals } from '@/features/inventory/inventorySlice'
import { supabase } from '@/lib/supabase'

/**
 * Hook para subscribirse a cambios en tiempo real de inventario
 * - Zero-Refresh Synchronization
 * - Incluye Debounce para prevenir saturación del UI Thread
 * - Auto-Reconexión en caso de desconexión del WebSocket
 */
export function useInventoryRealtime() {
    const dispatch = useAppDispatch()
    const debounceTimer = useRef<NodeJS.Timeout|null>(null)

    const handleRealtimeChange = useCallback(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        
        debounceTimer.current = setTimeout(() => {
            dispatch(fetchInventory())
            dispatch(fetchTodayTotals())
        }, 500)
    }, [dispatch])

    useEffect(() => {
        // Usar un nombre de canal estable para evitar múltiples suscripciones redundantes
        const channel = supabase
            .channel('inventory-global-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => handleRealtimeChange()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stock_movements' },
                () => handleRealtimeChange()
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn(`[Realtime Sync] Connection issue (${status}). Subase will auto-retry.`)
                }
            })

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            channel.unsubscribe()
        }
    }, [handleRealtimeChange])
}
