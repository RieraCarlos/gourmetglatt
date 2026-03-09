import { useEffect, useRef, useState, useCallback } from 'react'
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

    // Referencia para el debounce timer
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // Estado para forzar la reconexión
    const [retryCount, setRetryCount] = useState(0)

    // Agrupamos el refetch en una función memorizada que se retrasa ligeramente
    const handleRealtimeChange = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        // Debounce: 500ms window to batch rapid changes
        debounceTimer.current = setTimeout(() => {


            // Refresca UI invisiblemente en 2do plano sin recargar ventana
            dispatch(fetchInventory())
            dispatch(fetchTodayTotals()) // Fuerza métricas en SectionCards
        }, 500)
    }, [dispatch])

    useEffect(() => {


        const channel = supabase
            .channel(`inventory_changes_${retryCount}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Escucha INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'products',
                },
                () => {
                    handleRealtimeChange()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'stock_movements',
                },
                () => {
                    handleRealtimeChange()
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {

                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.error(`[Realtime Sync] Connection lost (${status}). Auto-reconnecting...`)
                    // Cleanup actual
                    channel.unsubscribe()

                    // Esperar 3 segundos e intentar reconectar (Exponential Backoff básico)
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1)
                    }, 3000)
                }
            })

        return () => {

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
            channel.unsubscribe()
        }
    }, [handleRealtimeChange, retryCount])
}
