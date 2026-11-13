import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface UseSpaceLocksRealtimeProps {
  parkingId?: number;
  onLockChange: () => void;
  enabled?: boolean;
}

/**
 * Hook para sincronizar en tiempo real el estado de bloqueos y plazas
 * entre todos los usuarios conectados al mismo estacionamiento.
 */
export const useSpaceLocksRealtime = ({
  parkingId,
  onLockChange,
  enabled = true,
}: UseSpaceLocksRealtimeProps) => {
  const onLockChangeRef = useRef(onLockChange);

  useEffect(() => {
    onLockChangeRef.current = onLockChange;
  }, [onLockChange]);

  useEffect(() => {
    if (!enabled || !parkingId || !isSupabaseConfigured() || !supabase) {
      return;
    }

    const channelName = `parkia-locks-parking-${parkingId}`;
    const channel = supabase.channel(channelName);

    // 1. Escuchar cambios directos en space_locks (INSERT, UPDATE, DELETE)
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'space_locks',
          filter: `parking_id=eq.${parkingId}`,
        },
        () => {
          onLockChangeRef.current();
        }
      )
      // 2. Escuchar cambios de estado en parking_spaces
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_spaces',
          filter: `parking_id=eq.${parkingId}`,
        },
        () => {
          onLockChangeRef.current();
        }
      )
      // 3. Escuchar canal de broadcast de respaldo (fallback inmediato sobre WebSocket)
      .on(
        'broadcast',
        { event: 'space_lock_updated' },
        (payload) => {
          if (payload?.payload?.parkingId === parkingId) {
            onLockChangeRef.current();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Refrescar al conectar
          onLockChangeRef.current();
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [parkingId, enabled]);

  /**
   * Emite un evento broadcast inmediato a todos los navegadores conectados
   */
  const broadcastLockChange = async () => {
    if (!parkingId || !isSupabaseConfigured() || !supabase) return;
    try {
      const channel = supabase.channel(`parkia-locks-parking-${parkingId}`);
      await channel.send({
        type: 'broadcast',
        event: 'space_lock_updated',
        payload: { parkingId, timestamp: Date.now() },
      });
    } catch {
      // Ignorar si la red falla en el broadcast
    }
  };

  return { broadcastLockChange };
};
