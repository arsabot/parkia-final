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
 * Optimizado para dispositivos móviles (iOS Safari / Android) con:
 * 1. Suscripción Supabase Realtime (postgres_changes + broadcast).
 * 2. Detección de reconexión al volver a primer plano (visibilitychange/focus).
 * 3. Polling de respaldo automático (cada 3.5s) para redes móviles inestables.
 */
export const useSpaceLocksRealtime = ({
  parkingId,
  onLockChange,
  enabled = true,
}: UseSpaceLocksRealtimeProps) => {
  const onLockChangeRef = useRef(onLockChange);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    onLockChangeRef.current = onLockChange;
  }, [onLockChange]);

  useEffect(() => {
    if (!enabled || !parkingId) return;

    // Respaldo de polling para dispositivos móviles (Safari en iOS suspende WebSockets al bloquear o cambiar de app)
    const pollInterval = setInterval(() => {
      onLockChangeRef.current();
    }, 3500);

    // Detección de reactivación en primer plano en iPhone / móviles
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        onLockChangeRef.current();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    if (!isSupabaseConfigured() || !supabase) {
      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      };
    }

    const channelName = `parkia-locks-parking-${parkingId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channelRef.current = channel;

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
          onLockChangeRef.current();
        }
      });

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [parkingId, enabled]);

  /**
   * Emite un evento broadcast inmediato a todos los navegadores conectados
   */
  const broadcastLockChange = async () => {
    if (!parkingId) return;

    // Notificar localmente en caso de múltiples componentes en la misma ventana
    onLockChangeRef.current();

    if (!isSupabaseConfigured() || !supabase) return;

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'space_lock_updated',
          payload: { parkingId, timestamp: Date.now() },
        });
      }
    } catch {
      // Ignorar si la red falla en el broadcast
    }
  };

  return { broadcastLockChange };
};
