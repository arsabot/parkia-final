-- ============================================================================
-- PARKIA: SISTEMA DE BLOQUEO DE PLAZAS EN TIEMPO REAL
-- Migración para control de concurrencia, exclusión mutua y expiración de 5 minutos
-- ============================================================================

-- 1. Tabla de bloqueos temporales (space_locks)
CREATE TABLE IF NOT EXISTS space_locks (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
    parking_id BIGINT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released', 'converted')),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices de alta velocidad y exclusión
CREATE INDEX IF NOT EXISTS idx_space_locks_space_date_status ON space_locks(space_id, date, status);
CREATE INDEX IF NOT EXISTS idx_space_locks_expires_at ON space_locks(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_space_locks_session ON space_locks(session_id, status);
CREATE INDEX IF NOT EXISTS idx_space_locks_parking ON space_locks(parking_id, status);

-- 3. Habilitar RLS en space_locks
ALTER TABLE space_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read SpaceLocks" ON space_locks;
CREATE POLICY "Public Read SpaceLocks" ON space_locks FOR SELECT USING (true);

DROP POLICY IF EXISTS "System Modify SpaceLocks" ON space_locks;
CREATE POLICY "System Modify SpaceLocks" ON space_locks FOR ALL USING (true);

-- 4. Habilitar Supabase Realtime para space_locks y parking_spaces
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'space_locks'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE space_locks;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'parking_spaces'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE parking_spaces;
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. FUNCIÓN: cleanup_expired_locks()
-- Libera automáticamente bloqueos cuya vigencia haya superado los 5 minutos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Pasa a 'expired' los bloqueos activos vencidos
    WITH expired AS (
        UPDATE space_locks
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND expires_at < NOW()
        RETURNING space_id
    )
    SELECT COUNT(*) INTO v_count FROM expired;

    -- Si la plaza estaba marcada como 'locked' y ya no tiene ningún bloqueo activo,
    -- vuelve a estar disponible
    UPDATE parking_spaces ps
    SET status = 'available'
    WHERE ps.status = 'locked'
      AND NOT EXISTS (
          SELECT 1 FROM space_locks sl
          WHERE sl.space_id = ps.id 
            AND sl.status = 'active' 
            AND sl.expires_at > NOW()
      );

    RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. FUNCIÓN ATÓMICA: acquire_space_lock(...)
-- Garantiza exclusión mutua pesimista (FOR UPDATE) y temporizador de 5 minutos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION acquire_space_lock(
    p_space_id BIGINT,
    p_parking_id BIGINT,
    p_user_id BIGINT,
    p_session_id TEXT,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_space_status VARCHAR(20);
    v_space_type VARCHAR(20);
    v_space_code VARCHAR(20);
    v_existing_lock_id BIGINT;
    v_other_lock_id BIGINT;
    v_res_id BIGINT;
    v_new_lock_id BIGINT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Paso 0: Limpieza inmediata de bloqueos vencidos
    PERFORM cleanup_expired_locks();

    -- Paso 1: Bloqueo pesimista a nivel de fila sobre la plaza para serializar la concurrencia
    SELECT status, space_type, code 
    INTO v_space_status, v_space_type, v_space_code
    FROM parking_spaces
    WHERE id = p_space_id AND parking_id = p_parking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'El espacio seleccionado no pertenece a este estacionamiento o no existe.'
        );
    END IF;

    -- Paso 2: Verificar si la plaza está en mantenimiento u ocupada físicamente
    IF v_space_status = 'maintenance' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAINTENANCE',
            'message', 'La plaza ' || v_space_code || ' se encuentra temporalmente fuera de servicio.'
        );
    END IF;

    IF v_space_status = 'occupied' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'OCCUPIED',
            'message', 'La plaza ' || v_space_code || ' se encuentra ocupada actualmente.'
        );
    END IF;

    -- Paso 3: Verificar permisos para plaza accesible
    IF v_space_type = 'disabled' THEN
        IF p_user_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.id = p_user_id AND (u.cud_verified = TRUE OR r.code = 'disabled')
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'DISABILITY_PERMIT_REQUIRED',
                'message', 'La plaza ' || v_space_code || ' es accesible, reservada para personas con credencial de discapacidad verificada.'
            );
        END IF;
    END IF;

    -- Paso 4: Si este mismo usuario/sesión ya tenía un bloqueo activo en esta plaza, lo renueva
    SELECT id INTO v_existing_lock_id
    FROM space_locks
    WHERE space_id = p_space_id
      AND date = p_date
      AND status = 'active'
      AND expires_at > NOW()
      AND (session_id = p_session_id OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    LIMIT 1;

    IF v_existing_lock_id IS NOT NULL THEN
        UPDATE space_locks
        SET expires_at = NOW() + INTERVAL '5 minutes',
            updated_at = NOW()
        WHERE id = v_existing_lock_id
        RETURNING id, expires_at INTO v_new_lock_id, v_expires_at;

        RETURN jsonb_build_object(
            'success', true,
            'lock_id', v_new_lock_id,
            'space_id', p_space_id,
            'space_code', v_space_code,
            'expires_at', v_expires_at,
            'ttl_seconds', 300,
            'is_renewed', true,
            'message', 'Bloqueo renovado con éxito.'
        );
    END IF;

    -- Paso 5: Liberar cualquier otro bloqueo previo que este usuario/sesión tenga en este parking
    -- (Un usuario solo puede bloquear una plaza a la vez durante el checkout)
    UPDATE space_locks
    SET status = 'released', updated_at = NOW()
    WHERE parking_id = p_parking_id
      AND status = 'active'
      AND (session_id = p_session_id OR (p_user_id IS NOT NULL AND user_id = p_user_id));

    -- Paso 6: Verificar si OTRO usuario tiene bloqueada esta plaza en ese rango de fecha y hora
    SELECT id INTO v_other_lock_id
    FROM space_locks
    WHERE space_id = p_space_id
      AND date = p_date
      AND status = 'active'
      AND expires_at > NOW()
      AND start_time < p_end_time
      AND end_time > p_start_time
    LIMIT 1;

    IF v_other_lock_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCKED_BY_OTHER',
            'message', 'Esta plaza acaba de ser seleccionada por otro usuario. Elegí otra plaza disponible.'
        );
    END IF;

    -- Paso 7: Verificar si existe una reserva confirmada o pendiente que se solape
    SELECT id INTO v_res_id
    FROM reservations
    WHERE space_id = p_space_id
      AND date = p_date
      AND status IN ('pending', 'confirmed')
      AND start_time < p_end_time
      AND end_time > p_start_time
    LIMIT 1;

    IF v_res_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_RESERVED',
            'message', 'La plaza ' || v_space_code || ' ya se encuentra reservada para esa franja horaria.'
        );
    END IF;

    -- Paso 8: Insertar el bloqueo de 5 minutos
    INSERT INTO space_locks (
        space_id,
        parking_id,
        user_id,
        session_id,
        date,
        start_time,
        end_time,
        status,
        locked_at,
        expires_at
    ) VALUES (
        p_space_id,
        p_parking_id,
        p_user_id,
        p_session_id,
        p_date,
        p_start_time,
        p_end_time,
        'active',
        NOW(),
        NOW() + INTERVAL '5 minutes'
    )
    RETURNING id, expires_at INTO v_new_lock_id, v_expires_at;

    -- Actualizar estado de la plaza a 'locked'
    UPDATE parking_spaces 
    SET status = 'locked' 
    WHERE id = p_space_id AND status = 'available';

    RETURN jsonb_build_object(
        'success', true,
        'lock_id', v_new_lock_id,
        'space_id', p_space_id,
        'space_code', v_space_code,
        'expires_at', v_expires_at,
        'ttl_seconds', 300,
        'is_renewed', false,
        'message', 'Tu plaza está protegida durante 5 minutos.'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. FUNCIÓN ATÓMICA: release_space_lock(...)
-- Libera proactivamente el bloqueo temporal de una plaza
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_space_lock(
    p_lock_id BIGINT,
    p_session_id TEXT,
    p_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_space_id BIGINT;
BEGIN
    UPDATE space_locks
    SET status = 'released', updated_at = NOW()
    WHERE id = p_lock_id
      AND status = 'active'
      AND (session_id = p_session_id OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    RETURNING space_id INTO v_space_id;

    IF FOUND THEN
        -- Si ya no tiene bloqueos activos, vuelve a disponible
        IF NOT EXISTS (
            SELECT 1 FROM space_locks
            WHERE space_id = v_space_id AND status = 'active' AND expires_at > NOW()
        ) THEN
            UPDATE parking_spaces SET status = 'available' WHERE id = v_space_id AND status = 'locked';
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'released', true,
            'message', 'Plaza liberada exitosamente.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'released', false,
        'message', 'Bloqueo no encontrado o ya expirado.'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. FUNCIÓN ATÓMICA: confirm_reservation_with_lock(...)
-- Convierte transaccionalmente el bloqueo temporal en reserva confirmada
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_reservation_with_lock(
    p_lock_id BIGINT,
    p_session_id TEXT,
    p_user_id BIGINT,
    p_vehicle_plate TEXT,
    p_vehicle_model TEXT DEFAULT 'Auto Particular',
    p_payment_method TEXT DEFAULT 'Mercado Pago',
    p_payment_status TEXT DEFAULT 'paid',
    p_reservation_status TEXT DEFAULT 'confirmed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lock RECORD;
    v_parking RECORD;
    v_hours NUMERIC(6,2);
    v_total_price NUMERIC(10,2);
    v_booking_code VARCHAR(20);
    v_reservation_id BIGINT;
    v_new_reservation RECORD;
BEGIN
    -- Limpieza de bloqueos vencidos
    PERFORM cleanup_expired_locks();

    -- Paso 1: Bloquear la fila del bloqueo pesimistamente
    SELECT * INTO v_lock
    FROM space_locks
    WHERE id = p_lock_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCK_NOT_FOUND',
            'message', 'El bloqueo de la plaza no existe o fue liberado.'
        );
    END IF;

    -- Paso 2: Verificar propiedad y estado
    IF v_lock.status <> 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCK_INACTIVE',
            'message', 'El bloqueo ya no se encuentra activo.'
        );
    END IF;

    IF v_lock.expires_at < NOW() THEN
        UPDATE space_locks SET status = 'expired', updated_at = NOW() WHERE id = p_lock_id;
        UPDATE parking_spaces SET status = 'available' WHERE id = v_lock.space_id AND status = 'locked';
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCK_EXPIRED',
            'message', 'El tiempo de 5 minutos para completar la reserva ha expirado. Por favor, selecciona una plaza nuevamente.'
        );
    END IF;

    IF v_lock.session_id <> p_session_id AND (p_user_id IS NULL OR v_lock.user_id <> p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCK_FORBIDDEN',
            'message', 'No tienes permiso para confirmar este bloqueo.'
        );
    END IF;

    -- Paso 3: Obtener información del estacionamiento para cálculo de tarifa
    SELECT * INTO v_parking FROM parkings WHERE id = v_lock.parking_id;
    
    -- Calcular duración en horas
    v_hours := EXTRACT(EPOCH FROM (v_lock.end_time - v_lock.start_time)) / 3600.0;
    IF v_hours < 0.5 THEN
        v_hours := 1.0;
    END IF;

    v_total_price := ROUND(v_hours * v_parking.price_per_hour, 2);

    -- Generar código único de reserva (formato PK-XXXXXX)
    v_booking_code := 'PK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- Paso 4: Insertar la reserva confirmada
    INSERT INTO reservations (
        booking_code,
        user_id,
        parking_id,
        space_id,
        vehicle_plate,
        vehicle_model,
        date,
        start_time,
        end_time,
        total_hours,
        total_price,
        status,
        payment_method,
        payment_status,
        created_at,
        updated_at
    ) VALUES (
        v_booking_code,
        p_user_id,
        v_lock.parking_id,
        v_lock.space_id,
        upper(trim(p_vehicle_plate)),
        p_vehicle_model,
        v_lock.date,
        v_lock.start_time,
        v_lock.end_time,
        v_hours,
        v_total_price,
        p_reservation_status,
        p_payment_method,
        p_payment_status,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_reservation_id;

    -- Paso 5: Convertir el bloqueo a 'converted'
    UPDATE space_locks
    SET status = 'converted',
        updated_at = NOW()
    WHERE id = p_lock_id;

    -- Paso 6: Actualizar estado de la plaza a 'reserved'
    UPDATE parking_spaces
    SET status = 'reserved'
    WHERE id = v_lock.space_id;

    -- Retornar la reserva completa con detalles
    SELECT 
        r.id,
        r.booking_code,
        r.user_id as user,
        r.parking_id as parking,
        p.name as parking_name,
        p.address as parking_address,
        p.city as parking_city,
        p.phone as parking_phone,
        r.space_id as space,
        ps.code as space_code,
        r.vehicle_plate,
        r.vehicle_model,
        r.date,
        r.start_time,
        r.end_time,
        r.total_hours,
        r.total_price,
        r.status,
        r.payment_method,
        r.payment_status,
        r.created_at
    INTO v_new_reservation
    FROM reservations r
    JOIN parkings p ON p.id = r.parking_id
    LEFT JOIN parking_spaces ps ON ps.id = r.space_id
    WHERE r.id = v_reservation_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', '¡Reserva confirmada con éxito!',
        'reservation', row_to_json(v_new_reservation)
    );
END;
$$;
