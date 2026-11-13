-- ============================================================================
-- PARKIA - FULL SUPABASE MIGRATION SCHEMA & SEED DATA
-- Generated automatically from Parkia Backend SQLite
-- Multi-Tenant Smart Parking & Garita System
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing if re-running
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS space_locks CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS parking_spaces CASCADE;
DROP TABLE IF EXISTS parkings CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    cud_number VARCHAR(50),
    cud_verified BOOLEAN DEFAULT FALSE,
    cud_expiration DATE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date_joined TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 2. PARKINGS & SPACES
-- ----------------------------------------------------------------------------
CREATE TABLE parkings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    price_per_hour NUMERIC(10,2) NOT NULL,
    price_per_day NUMERIC(10,2),
    opening_time TIME DEFAULT '07:00:00',
    closing_time TIME DEFAULT '23:00:00',
    is_24_hours BOOLEAN DEFAULT FALSE,
    capacity INTEGER NOT NULL DEFAULT 30,
    rating DOUBLE PRECISION DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_covered BOOLEAN DEFAULT TRUE,
    has_security BOOLEAN DEFAULT TRUE,
    has_ev_charging BOOLEAN DEFAULT FALSE,
    has_disabled_access BOOLEAN DEFAULT TRUE,
    has_car_wash BOOLEAN DEFAULT FALSE,
    has_valet BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    gallery JSONB DEFAULT '[]',
    phone VARCHAR(50) DEFAULT '+54 11 4321-8899',
    owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parking_spaces (
    id BIGSERIAL PRIMARY KEY,
    parking_id BIGINT REFERENCES parkings(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    floor VARCHAR(50) NOT NULL DEFAULT 'PB',
    space_type VARCHAR(20) NOT NULL DEFAULT 'standard', -- standard, disabled, ev, large
    status VARCHAR(20) NOT NULL DEFAULT 'available',     -- available, occupied, reserved, maintenance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parking_id, code)
);

-- ----------------------------------------------------------------------------
-- 3. RESERVATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    parking_id BIGINT REFERENCES parkings(id) ON DELETE CASCADE,
    space_id BIGINT REFERENCES parking_spaces(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours NUMERIC(6,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- pending, confirmed, completed, cancelled
    cancellation_reason TEXT,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    payment_method VARCHAR(50) DEFAULT 'Efectivo',
    payment_status VARCHAR(20) DEFAULT 'paid',
    staff_notes VARCHAR(255) DEFAULT '',
    payment_expires_at TIMESTAMPTZ,
    commission_rate NUMERIC(5,2) DEFAULT 15.00,
    commission_amount NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(total_price * 0.15, 2)) STORED,
    owner_payout NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(total_price * 0.85, 2)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3.1 SPACE LOCKS (BLOQUEOS TEMPORALES CONCURRENTES)
-- ----------------------------------------------------------------------------
CREATE TABLE space_locks (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
    parking_id BIGINT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    user_id BIGINT,
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

ALTER TABLE space_locks DROP CONSTRAINT IF EXISTS space_locks_user_id_fkey;

-- ----------------------------------------------------------------------------
-- 4. FAVORITES & REVIEWS & CLAIMS
-- ----------------------------------------------------------------------------
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    parking_id BIGINT REFERENCES parkings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, parking_id)
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    parking_id BIGINT REFERENCES parkings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    reservation_ref VARCHAR(50),
    description TEXT NOT NULL,
    contact VARCHAR(120),
    status VARCHAR(20) DEFAULT 'abierto',
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX idx_reservations_booking_code ON reservations(booking_code);
CREATE INDEX idx_reservations_parking_id ON reservations(parking_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_parking_spaces_parking ON parking_spaces(parking_id);
CREATE INDEX idx_parking_spaces_type ON parking_spaces(space_type);
CREATE INDEX idx_parkings_city ON parkings(city);
CREATE INDEX idx_space_locks_space_date_status ON space_locks(space_id, date, status);
CREATE INDEX idx_space_locks_expires_at ON space_locks(expires_at) WHERE status = 'active';
CREATE INDEX idx_space_locks_session ON space_locks(session_id, status);
CREATE INDEX idx_space_locks_parking ON space_locks(parking_id, status);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_locks ENABLE ROW LEVEL SECURITY;

ALTER TABLE space_locks REPLICA IDENTITY FULL;
ALTER TABLE parking_spaces REPLICA IDENTITY FULL;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Permissive policies for Demo & Web deployment
CREATE POLICY "Public Read Parkings" ON parkings FOR SELECT USING (true);
CREATE POLICY "Public Modify Parkings" ON parkings FOR ALL USING (true);

CREATE POLICY "Public Read Spaces" ON parking_spaces FOR SELECT USING (true);
CREATE POLICY "Public Modify Spaces" ON parking_spaces FOR ALL USING (true);

CREATE POLICY "Public Read SpaceLocks" ON space_locks FOR SELECT USING (true);
CREATE POLICY "Public Modify SpaceLocks" ON space_locks FOR ALL USING (true);

CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Modify Users" ON users FOR ALL USING (true);

CREATE POLICY "Public Read Roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Public Read UserRoles" ON user_roles FOR SELECT USING (true);

CREATE POLICY "Public Read Reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Public Modify Reservations" ON reservations FOR ALL USING (true);

CREATE POLICY "Public Read Favorites" ON favorites FOR SELECT USING (true);
CREATE POLICY "Public Modify Favorites" ON favorites FOR ALL USING (true);

CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public Modify Reviews" ON reviews FOR ALL USING (true);

CREATE POLICY "Public Read Claims" ON claims FOR SELECT USING (true);
CREATE POLICY "Public Modify Claims" ON claims FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- SEED: ROLES
-- ----------------------------------------------------------------------------
INSERT INTO roles (id, code, name, description) VALUES (1, 'driver', 'Conductor', 'Busca y reserva plazas.');
INSERT INTO roles (id, code, name, description) VALUES (2, 'owner', 'Dueño de estacionamiento', 'Gestiona su garaje, sus plazas y sus reservas.');
INSERT INTO roles (id, code, name, description) VALUES (3, 'admin', 'Administrador', 'Gestiona toda la plataforma.');
INSERT INTO roles (id, code, name, description) VALUES (4, 'disabled', 'Persona con discapacidad', 'Credencial verificada por un administrador. Puede reservar plazas accesibles.');

-- ----------------------------------------------------------------------------
-- SEED: USERS
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (1, 'conductor@parkia.com', 'pbkdf2_sha256$1500000$b9DOIyMmnyjlYbz4Df3sMV$ZdWL4226pJKwkpHTnsksVgChaT22BuK9/ZoGBE0dnDs=', 'Carlos', 'Méndez', '+54 9 11 4488-2211', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NULL, False, NULL, False, False, True, '2026-09-07 16:06:24.860817', '2026-09-07 16:06:24.860691');
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (2, 'admin@parkia.com', 'pbkdf2_sha256$1500000$tEWAx5B1geyMETU2nFuEWC$HzPS5doyNGT0F9IQBmKab7W8q1/BHjiOLmkXEoelLbo=', 'Valentina', 'Rossi', '+54 9 11 8899-7733', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', NULL, False, NULL, True, True, True, '2026-09-07 16:06:25.096382', '2026-09-07 16:06:25.096309');
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (3, 'lucia.gomez@gmail.com', 'pbkdf2_sha256$1500000$HR03wnizS0eHJCOXlg8HHK$gQcKjlNXN6dGq5G3n0wCK1drL7+MYKAdYzd1aidGlPg=', 'Lucía', 'Gómez', '+54 9 11 9911-3322', NULL, NULL, False, NULL, False, False, True, '2026-09-07 16:06:25.330286', '2026-09-07 16:06:25.330223');
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (4, 'martin.suarez@gmail.com', 'pbkdf2_sha256$1500000$US63snHs462J8DApSWIzSx$Cli9I5Wq+vnkM7Q+36I0LnOh40bHqzXs3OdG6zoh1Qs=', 'Martín', 'Suárez', '+54 9 11 7722-1144', NULL, NULL, False, NULL, False, False, True, '2026-09-07 16:06:25.579058', '2026-09-07 16:06:25.578991');
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (5, 'dueno@parkia.com', 'pbkdf2_sha256$1500000$hbzvqD0xLkPqUmiiTFXlCp$/HrUYSw5OrYdOe0afcjApuHZqjUyoWpL1Lsc5rlMa+k=', 'Roberto', 'Garaje Central', '+54 9 11 5555-0199', NULL, NULL, False, NULL, False, False, True, '2026-10-13 16:46:26.990020', '2026-10-13 16:46:26.708373');
INSERT INTO users (id, email, password, first_name, last_name, phone, avatar_url, cud_number, cud_verified, cud_expiration, is_staff, is_superuser, is_active, created_at, date_joined) VALUES (6, 'valeria.discapacidad@parkia.com', 'pbkdf2_sha256$1500000$l24kMGrLUChmiUQ6oCfG64$UURcj3hktskp59t6zKzWX+0p7p31xy4qg6gu/V6kABc=', 'Valeria', 'López', '+5491122334455', NULL, '04-38912456-7', True, '2028-12-31', False, False, True, '2026-11-10 17:15:10.426587', '2026-11-10 17:15:10.141962');

-- ----------------------------------------------------------------------------
-- SEED: USER_ROLES
-- ----------------------------------------------------------------------------
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (1, 5, 2, '2026-11-10 15:51:36.831088');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (2, 4, 1, '2026-11-10 15:51:36.831617');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (3, 3, 1, '2026-11-10 15:51:36.832027');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (4, 2, 3, '2026-11-10 15:51:36.832353');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (5, 1, 1, '2026-11-10 15:51:36.832640');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (6, 6, 1, '2026-11-10 17:15:10.433143');
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (7, 6, 4, '2026-11-10 17:15:10.434125');

-- ----------------------------------------------------------------------------
-- SEED: PARKINGS
-- ----------------------------------------------------------------------------
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (1, 'Parkia Obelisco & Corrientes', 'Av. Corrientes 1045, San Nicolás', 'Buenos Aires', -34.6037, -58.3816, 'Estacionamiento premium subterráneo ubicado a 50 metros del Obelisco y teatros de calle Corrientes. Cuenta con vigilancia 24hs, circuito cerrado de TV y plazas extra anchas.', 2400, 18000, '00:00:00', '23:59:59', True, 35, 4.9, 128, True, True, True, True, True, True, True, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4322-9090', 5, '2026-09-07 16:06:25.816119', '2026-11-10 16:41:38.207024');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (2, 'Estacionamiento Palermo Soho Hub', 'Honduras 4820, Palermo', 'Buenos Aires', -34.5885, -58.4283, 'Ubicado en el epicentro gastronómico y de diseño de Palermo Soho. Fácil acceso, garita de seguridad, cámaras HD y cargadores rápidos para vehículos eléctricos.', 2100, 16000, '07:00:00', '02:00:00', False, 28, 4.8, 94, True, True, True, True, True, False, False, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4833-1122', NULL, '2026-09-07 16:06:25.818641', '2026-11-10 16:41:38.208545');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (3, 'Garage Plaza San Martín & Retiro', 'Florida 980, Retiro', 'Buenos Aires', -34.596, -58.3755, 'Ideal para personas de negocios y turistas. Conexión rápida con estación Retiro y Plaza San Martín. Plazas techadas y monitoreo permanente.', 1800, 14000, '06:30:00', '23:30:00', False, 30, 4.7, 82, True, True, True, False, True, True, False, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4311-6677', NULL, '2026-09-07 16:06:25.820566', '2026-11-10 16:41:38.209544');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (4, 'Parkia Puerto Madero Dock 4', 'Juana Manso 850, Puerto Madero', 'Buenos Aires', -34.6055, -58.3628, 'Estacionamiento moderno de alta categoría con acceso automatizado por matrícula. A pasos de los mejores restaurantes y torres corporativas de Puerto Madero.', 3200, 24000, '00:00:00', '23:59:59', True, 40, 4.9, 160, True, True, True, True, True, True, True, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4515-3344', NULL, '2026-09-07 16:06:25.822193', '2026-11-10 16:41:38.210491');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (5, 'EcoPark Recoleta Village', 'Vicente López 2050, Recoleta', 'Buenos Aires', -34.5878, -58.392, 'Playa techada frente al Cementerio de la Recoleta, Plaza Francia y cines. Estructura moderna, señalización digital de plazas y atención personalizada.', 2300, 17500, '07:00:00', '01:00:00', False, 25, 4.8, 110, True, True, True, False, True, False, False, 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4801-4455', NULL, '2026-09-07 16:06:25.823687', '2026-11-10 16:41:38.211417');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (6, 'Central Belgrano & Juramento', 'Av. Cabildo 2140, Belgrano', 'Buenos Aires', -34.5614, -58.4568, 'En pleno centro comercial de Belgrano, junto a estación Juramento del subte D. Entrada amplia apta para camionetas y SUV.', 1900, 15000, '07:00:00', '23:00:00', False, 30, 4.6, 76, True, True, True, False, True, True, False, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4782-9900', NULL, '2026-09-07 16:06:25.825109', '2026-11-10 16:41:38.212348');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (7, 'San Telmo Colonial Parking', 'Defensa 840, San Telmo', 'Buenos Aires', -34.6186, -58.3712, 'Excelente opción para visitar la feria de San Telmo y Plaza Dorrego. Tarifas promocionales por estadía y personal de asistencia permanente.', 1600, 12000, '08:00:00', '22:00:00', False, 20, 4.5, 64, True, False, True, False, False, False, False, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4361-5544', NULL, '2026-09-07 16:06:25.826567', '2026-11-10 16:41:38.213598');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (8, 'Tribunales Express Garage', 'Lavalle 1320, San Nicolás', 'Buenos Aires', -34.6025, -58.3862, 'Zona Tribunales y Teatro Colón. Rápida entrada y salida, sistema de cobro digital y cámaras de lectura de placas.', 2200, 16500, '06:00:00', '22:00:00', False, 26, 4.7, 88, True, True, True, False, True, False, False, 'https://images.unsplash.com/photo-1508873696983-2df570464756?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1508873696983-2df570464756?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4371-2288', NULL, '2026-09-07 16:06:25.828097', '2026-11-10 16:41:38.214619');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (9, 'Parkia Villa Crespo Outlet', 'Aguirre 750, Villa Crespo', 'Buenos Aires', -34.5956, -58.4374, 'Playa cómoda ubicada en la zona de outlets de indumentaria y café de especialidad. Tarifas económicas y espacios de fácil maniobra.', 1500, 11500, '08:00:00', '21:00:00', False, 22, 4.6, 50, True, True, True, False, True, True, False, 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4774-8833', NULL, '2026-09-07 16:06:25.829630', '2026-11-10 16:41:38.215446');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (10, 'Colegiales Plaza Garage', 'Federico Lacroze 2890, Colegiales', 'Buenos Aires', -34.5768, -58.4489, 'Estacionamiento 24hs en Colegiales, cerca de productoras y polo gastronómico de Av. Álvarez Thomas y Lacroze. Cobertura total y cámaras 4K.', 1750, 13000, '00:00:00', '23:59:59', True, 24, 4.7, 42, True, True, True, True, True, False, False, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80"]'::jsonb, '+54 11 4552-7711', NULL, '2026-09-07 16:06:25.831022', '2026-11-10 16:41:38.216316');
INSERT INTO parkings (id, name, address, city, latitude, longitude, description, price_per_hour, price_per_day, opening_time, closing_time, is_24_hours, capacity, rating, reviews_count, is_active, is_covered, has_security, has_ev_charging, has_disabled_access, has_car_wash, has_valet, image_url, gallery, phone, owner_id, created_at, updated_at) VALUES (11, 'dgfdfgdg', 'fgdfgdfg', 'Buenos Aires', -34.6037, -58.3816, '', 2000, 15000, '07:00:00', '23:00:00', False, 25, 4.8, 0, True, True, True, False, True, False, False, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800', '[]'::jsonb, 'dfgdfgdfgdg', NULL, '2026-10-27 12:52:41.958407', '2026-10-27 12:52:41.958418');

-- ----------------------------------------------------------------------------
-- SEED: PARKING SPACES
-- ----------------------------------------------------------------------------
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (1, 1, 'A01', 'Planta Baja', 'disabled', 'available', '2026-09-07 16:06:25.817568');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (2, 1, 'A02', 'Planta Baja', 'ev', 'occupied', '2026-09-07 16:06:25.817574');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (3, 1, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817576');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (4, 1, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817578');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (5, 1, 'A05', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817580');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (6, 1, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817582');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (7, 1, 'A07', 'Planta Baja', 'standard', 'maintenance', '2026-09-07 16:06:25.817585');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (8, 1, 'A08', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817587');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (9, 1, 'A09', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817589');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (10, 1, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.817591');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (11, 1, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817593');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (12, 1, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817595');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (13, 1, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817597');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (14, 1, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817599');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (15, 1, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817601');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (16, 1, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817603');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (17, 1, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817605');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (18, 1, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.817606');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (19, 1, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.817608');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (20, 1, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.817610');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (21, 2, 'A01', 'Planta Baja', 'disabled', 'reserved', '2026-09-07 16:06:25.819664');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (22, 2, 'A02', 'Planta Baja', 'ev', 'available', '2026-09-07 16:06:25.819670');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (23, 2, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819673');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (24, 2, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819675');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (25, 2, 'A05', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819679');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (26, 2, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819681');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (27, 2, 'A07', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819684');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (28, 2, 'A08', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.819687');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (29, 2, 'A09', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.819689');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (30, 2, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.819691');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (31, 2, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.819693');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (32, 2, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.819695');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (33, 2, 'B03', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.819697');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (34, 2, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.819699');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (35, 2, 'B05', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.819701');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (36, 2, 'B06', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.819703');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (37, 2, 'B07', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.819704');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (38, 2, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.819706');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (39, 2, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.819708');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (40, 2, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.819710');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (41, 3, 'A01', 'Planta Baja', 'disabled', 'available', '2026-09-07 16:06:25.821403');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (42, 3, 'A02', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.821408');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (43, 3, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.821410');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (44, 3, 'A04', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.821412');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (45, 3, 'A05', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.821414');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (46, 3, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.821416');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (47, 3, 'A07', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.821418');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (48, 3, 'A08', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.821420');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (49, 3, 'A09', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.821422');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (50, 3, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.821424');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (51, 3, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.821426');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (52, 3, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.821428');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (53, 3, 'B03', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.821429');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (54, 3, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.821431');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (55, 3, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.821433');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (56, 3, 'B06', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.821435');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (57, 3, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.821437');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (58, 3, 'B08', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.821438');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (59, 3, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.821440');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (60, 3, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.821442');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (61, 4, 'A01', 'Planta Baja', 'disabled', 'available', '2026-09-07 16:06:25.822942');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (62, 4, 'A02', 'Planta Baja', 'ev', 'occupied', '2026-09-07 16:06:25.822947');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (63, 4, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.822949');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (64, 4, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.822951');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (65, 4, 'A05', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.822953');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (66, 4, 'A06', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.822955');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (67, 4, 'A07', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.822957');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (68, 4, 'A08', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.822959');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (69, 4, 'A09', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.822961');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (70, 4, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.822963');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (71, 4, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.822964');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (72, 4, 'B02', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.822966');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (73, 4, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.822968');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (74, 4, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.822970');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (75, 4, 'B05', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.822972');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (76, 4, 'B06', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.822974');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (77, 4, 'B07', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.822976');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (78, 4, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.822978');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (79, 4, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.822979');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (80, 4, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.822981');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (81, 5, 'A01', 'Planta Baja', 'disabled', 'available', '2026-09-07 16:06:25.824384');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (82, 5, 'A02', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824388');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (83, 5, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824391');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (84, 5, 'A04', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.824393');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (85, 5, 'A05', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824395');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (86, 5, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824397');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (87, 5, 'A07', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824399');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (88, 5, 'A08', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824401');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (89, 5, 'A09', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824403');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (90, 5, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.824405');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (91, 5, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824407');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (92, 5, 'B02', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.824409');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (93, 5, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824411');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (94, 5, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824412');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (95, 5, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824414');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (96, 5, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824416');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (97, 5, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824418');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (98, 5, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.824420');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (99, 5, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.824422');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (100, 5, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.824423');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (101, 6, 'A01', 'Planta Baja', 'disabled', 'reserved', '2026-09-07 16:06:25.825772');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (102, 6, 'A02', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.825775');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (103, 6, 'A03', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.825778');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (104, 6, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.825780');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (105, 6, 'A05', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.825782');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (106, 6, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.825784');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (107, 6, 'A07', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.825786');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (108, 6, 'A08', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.825788');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (109, 6, 'A09', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.825790');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (110, 6, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.825792');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (111, 6, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.825794');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (112, 6, 'B02', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.825796');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (113, 6, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.825797');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (114, 6, 'B04', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.825799');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (115, 6, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.825801');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (116, 6, 'B06', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.825803');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (117, 6, 'B07', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.825805');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (118, 6, 'B08', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.825807');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (119, 6, 'B09', 'Primer Piso', 'large', 'reserved', '2026-09-07 16:06:25.825808');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (120, 6, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.825810');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (121, 7, 'A01', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.827240');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (122, 7, 'A02', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.827245');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (123, 7, 'A03', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.827248');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (124, 7, 'A04', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.827251');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (125, 7, 'A05', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.827253');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (126, 7, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.827255');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (127, 7, 'A07', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.827257');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (128, 7, 'A08', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.827259');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (129, 7, 'A09', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.827261');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (130, 7, 'A10', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.827263');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (131, 7, 'B01', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.827266');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (132, 7, 'B02', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.827268');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (133, 7, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.827270');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (134, 7, 'B04', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.827272');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (135, 7, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.827274');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (136, 7, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.827276');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (137, 7, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.827278');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (138, 7, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.827280');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (139, 7, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.827282');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (140, 7, 'B10', 'Primer Piso', 'large', 'reserved', '2026-09-07 16:06:25.827284');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (141, 8, 'A01', 'Planta Baja', 'disabled', 'reserved', '2026-09-07 16:06:25.828883');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (142, 8, 'A02', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.828887');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (143, 8, 'A03', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.828889');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (144, 8, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828891');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (145, 8, 'A05', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828893');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (146, 8, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828895');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (147, 8, 'A07', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828897');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (148, 8, 'A08', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.828899');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (149, 8, 'A09', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828901');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (150, 8, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.828903');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (151, 8, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.828905');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (152, 8, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.828906');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (153, 8, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.828908');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (154, 8, 'B04', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.828910');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (155, 8, 'B05', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.828912');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (156, 8, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.828914');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (157, 8, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.828915');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (158, 8, 'B08', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.828917');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (159, 8, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.828919');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (160, 8, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.828921');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (161, 9, 'A01', 'Planta Baja', 'disabled', 'occupied', '2026-09-07 16:06:25.830284');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (162, 9, 'A02', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830288');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (163, 9, 'A03', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830290');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (164, 9, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830292');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (165, 9, 'A05', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.830294');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (166, 9, 'A06', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830296');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (167, 9, 'A07', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.830298');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (168, 9, 'A08', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830300');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (169, 9, 'A09', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.830303');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (170, 9, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.830305');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (171, 9, 'B01', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830306');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (172, 9, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830308');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (173, 9, 'B03', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830310');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (174, 9, 'B04', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.830312');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (175, 9, 'B05', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.830314');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (176, 9, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830316');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (177, 9, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830317');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (178, 9, 'B08', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.830319');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (179, 9, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.830321');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (180, 9, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.830323');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (181, 10, 'A01', 'Planta Baja', 'disabled', 'reserved', '2026-09-07 16:06:25.831649');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (182, 10, 'A02', 'Planta Baja', 'ev', 'available', '2026-09-07 16:06:25.831653');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (183, 10, 'A03', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.831655');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (184, 10, 'A04', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.831657');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (185, 10, 'A05', 'Planta Baja', 'standard', 'reserved', '2026-09-07 16:06:25.831659');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (186, 10, 'A06', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.831661');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (187, 10, 'A07', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.831663');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (188, 10, 'A08', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.831665');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (189, 10, 'A09', 'Planta Baja', 'standard', 'occupied', '2026-09-07 16:06:25.831667');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (190, 10, 'A10', 'Planta Baja', 'standard', 'available', '2026-09-07 16:06:25.831669');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (191, 10, 'B01', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.831671');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (192, 10, 'B02', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.831673');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (193, 10, 'B03', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.831675');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (194, 10, 'B04', 'Primer Piso', 'standard', 'occupied', '2026-09-07 16:06:25.831677');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (195, 10, 'B05', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.831678');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (196, 10, 'B06', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.831680');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (197, 10, 'B07', 'Primer Piso', 'standard', 'available', '2026-09-07 16:06:25.831682');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (198, 10, 'B08', 'Primer Piso', 'standard', 'reserved', '2026-09-07 16:06:25.831684');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (199, 10, 'B09', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.831686');
INSERT INTO parking_spaces (id, parking_id, code, floor, space_type, status, created_at) VALUES (200, 10, 'B10', 'Primer Piso', 'large', 'available', '2026-09-07 16:06:25.831688');

-- ----------------------------------------------------------------------------
-- SEED: RESERVATIONS
-- ----------------------------------------------------------------------------
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (1, 'PK-892401', 1, 1, 5, 'AF 342 KL', 'Volkswagen Golf TSI', '2026-09-08', '14:00:00', '18:30:00', 4.5, 10800, 'cancelled', 'Prueba de cancelacion exitosa', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.834332', '2026-09-07 16:15:53.299530');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (2, 'PK-774912', 1, 2, 22, 'AF 342 KL', 'Volkswagen Golf TSI', '2026-09-07', '19:00:00', '22:00:00', 3, 6300, 'cancelled', 'Cambio de itinerario / Planes cancelados', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.835129', '2026-10-13 16:32:12.045153');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (3, 'PK-DTAKZF', 1, 1, 18, 'AE 108 ZW', 'Toyota Corolla', '2026-09-06', '09:00:00', '12:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.835786', '2026-09-07 16:06:25.835790');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (4, 'PK-J63C1L', 1, 1, 18, 'AE 758 ZW', 'Toyota Corolla', '2026-09-05', '09:00:00', '11:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.836419', '2026-09-07 16:06:25.836423');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (5, 'PK-GU33DT', 3, 1, 13, 'AE 624 ZW', 'Toyota Corolla', '2026-09-05', '16:00:00', '19:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.837016', '2026-09-07 16:06:25.837019');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (6, 'PK-5QUOQV', 4, 1, 10, 'AE 544 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '18:00:00', 4, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.837558', '2026-09-07 16:06:25.837562');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (7, 'PK-2XNAK5', 3, 1, 10, 'AE 741 ZW', 'Toyota Corolla', '2026-09-04', '09:00:00', '13:00:00', 4, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.838116', '2026-09-07 16:06:25.838119');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (8, 'PK-YVWCRA', 1, 1, 13, 'AE 887 ZW', 'Toyota Corolla', '2026-09-04', '09:00:00', '10:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.838641', '2026-09-07 16:06:25.838645');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (9, 'PK-3PNOYY', 3, 1, 7, 'AE 773 ZW', 'Toyota Corolla', '2026-09-04', '16:00:00', '20:00:00', 4, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.839181', '2026-09-07 16:06:25.839184');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (10, 'PK-2KCWH9', 4, 1, 17, 'AE 271 ZW', 'Toyota Corolla', '2026-09-03', '16:00:00', '18:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.839700', '2026-09-07 16:06:25.839703');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (11, 'PK-EGJZG7', 3, 1, 8, 'AE 190 ZW', 'Toyota Corolla', '2026-09-02', '11:00:00', '13:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.840209', '2026-09-07 16:06:25.840212');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (12, 'PK-8FPHO1', 1, 1, 7, 'AE 673 ZW', 'Toyota Corolla', '2026-09-01', '11:00:00', '13:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.840709', '2026-09-07 16:06:25.840712');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (13, 'PK-SHSHZU', 1, 1, 20, 'AE 613 ZW', 'Toyota Corolla', '2026-08-31', '18:00:00', '20:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.841233', '2026-09-07 16:06:25.841236');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (14, 'PK-BSFRP7', 3, 2, 40, 'AE 958 ZW', 'Toyota Corolla', '2026-09-06', '11:00:00', '14:00:00', 3, 6300, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.841752', '2026-09-07 16:06:25.841755');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (15, 'PK-MVSRPQ', 1, 2, 24, 'AE 858 ZW', 'Toyota Corolla', '2026-09-06', '11:00:00', '12:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.842301', '2026-09-07 16:06:25.842304');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (16, 'PK-HOGIX5', 3, 2, 34, 'AE 188 ZW', 'Toyota Corolla', '2026-09-06', '09:00:00', '11:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.842812', '2026-09-07 16:06:25.842815');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (17, 'PK-XJTNWO', 4, 2, 32, 'AE 743 ZW', 'Toyota Corolla', '2026-09-05', '09:00:00', '12:00:00', 3, 6300, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.843320', '2026-09-07 16:06:25.843323');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (18, 'PK-IGZJ7G', 3, 2, 30, 'AE 407 ZW', 'Toyota Corolla', '2026-09-05', '16:00:00', '17:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.843816', '2026-09-07 16:06:25.843820');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (19, 'PK-D97V71', 3, 2, 36, 'AE 742 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '18:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.844433', '2026-09-07 16:06:25.844438');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (20, 'PK-M2LFRI', 4, 2, 22, 'AE 508 ZW', 'Toyota Corolla', '2026-09-04', '14:00:00', '18:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.845004', '2026-09-07 16:06:25.845008');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (21, 'PK-329E67', 1, 2, 25, 'AE 922 ZW', 'Toyota Corolla', '2026-09-04', '14:00:00', '18:00:00', 4, 8400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.845555', '2026-09-07 16:06:25.845559');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (22, 'PK-PGH1YO', 4, 2, 23, 'AE 497 ZW', 'Toyota Corolla', '2026-09-04', '11:00:00', '14:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.846094', '2026-09-07 16:06:25.846098');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (23, 'PK-GQCJRS', 4, 2, 25, 'AE 683 ZW', 'Toyota Corolla', '2026-09-03', '11:00:00', '13:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.846642', '2026-09-07 16:06:25.846646');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (24, 'PK-IZ2X1J', 4, 2, 29, 'AE 806 ZW', 'Toyota Corolla', '2026-09-03', '16:00:00', '18:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.847151', '2026-09-07 16:06:25.847154');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (25, 'PK-MIT100', 3, 2, 37, 'AE 656 ZW', 'Toyota Corolla', '2026-09-02', '14:00:00', '17:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.847655', '2026-09-07 16:06:25.847659');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (26, 'PK-8QCA53', 1, 2, 29, 'AE 981 ZW', 'Toyota Corolla', '2026-09-02', '11:00:00', '14:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.848179', '2026-09-07 16:06:25.848183');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (27, 'PK-I0JA4Q', 3, 2, 34, 'AE 487 ZW', 'Toyota Corolla', '2026-09-01', '18:00:00', '19:30:00', 1.5, 3150, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.848688', '2026-09-07 16:06:25.848691');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (28, 'PK-ETIJJ9', 4, 2, 31, 'AE 105 ZW', 'Toyota Corolla', '2026-09-01', '14:00:00', '15:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.849226', '2026-09-07 16:06:25.849229');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (29, 'PK-E4IKO6', 3, 2, 34, 'AE 474 ZW', 'Toyota Corolla', '2026-08-31', '14:00:00', '15:30:00', 1.5, 3150, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.849743', '2026-09-07 16:06:25.849747');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (30, 'PK-N77HEQ', 1, 2, 34, 'AE 391 ZW', 'Toyota Corolla', '2026-08-31', '11:00:00', '15:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.850254', '2026-09-07 16:06:25.850257');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (31, 'PK-25PMGF', 3, 3, 52, 'AE 785 ZW', 'Toyota Corolla', '2026-09-06', '14:00:00', '17:00:00', 3, 5400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.850777', '2026-09-07 16:06:25.850780');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (32, 'PK-P6TNS6', 1, 3, 47, 'AE 294 ZW', 'Toyota Corolla', '2026-09-05', '09:00:00', '13:00:00', 4, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.851292', '2026-09-07 16:06:25.851295');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (33, 'PK-E5N62I', 3, 3, 46, 'AE 906 ZW', 'Toyota Corolla', '2026-09-05', '09:00:00', '10:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.851796', '2026-09-07 16:06:25.851800');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (34, 'PK-8ALOPL', 1, 3, 43, 'AE 422 ZW', 'Toyota Corolla', '2026-09-04', '11:00:00', '15:00:00', 4, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.852330', '2026-09-07 16:06:25.852334');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (35, 'PK-OHEMEZ', 4, 3, 46, 'AE 869 ZW', 'Toyota Corolla', '2026-09-04', '11:00:00', '12:30:00', 1.5, 2700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.852938', '2026-09-07 16:06:25.852942');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (36, 'PK-8I4ZEG', 3, 3, 51, 'AE 364 ZW', 'Toyota Corolla', '2026-09-04', '09:00:00', '13:00:00', 4, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.853504', '2026-09-07 16:06:25.853508');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (37, 'PK-JA5BQ2', 1, 3, 42, 'AE 503 ZW', 'Toyota Corolla', '2026-09-03', '16:00:00', '20:00:00', 4, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.854052', '2026-09-07 16:06:25.854056');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (38, 'PK-UJ2CQO', 1, 3, 46, 'AE 205 ZW', 'Toyota Corolla', '2026-09-03', '11:00:00', '14:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.854587', '2026-09-07 16:06:25.854590');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (39, 'PK-79QA81', 1, 3, 56, 'AE 984 ZW', 'Toyota Corolla', '2026-09-02', '11:00:00', '13:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.855156', '2026-09-07 16:06:25.855160');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (40, 'PK-B0VJKH', 3, 3, 51, 'AE 506 ZW', 'Toyota Corolla', '2026-09-02', '09:00:00', '11:00:00', 2, 3600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.855670', '2026-09-07 16:06:25.855673');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (41, 'PK-3J524Q', 4, 3, 42, 'AE 507 ZW', 'Toyota Corolla', '2026-09-02', '18:00:00', '20:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.856189', '2026-09-07 16:06:25.856194');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (42, 'PK-BZT6ET', 3, 3, 46, 'AE 678 ZW', 'Toyota Corolla', '2026-09-01', '14:00:00', '17:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.856745', '2026-09-07 16:06:25.856749');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (43, 'PK-R0XQ0B', 4, 3, 44, 'AE 499 ZW', 'Toyota Corolla', '2026-08-31', '11:00:00', '15:00:00', 4, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.857388', '2026-09-07 16:06:25.857392');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (44, 'PK-D305WH', 1, 3, 58, 'AE 451 ZW', 'Toyota Corolla', '2026-08-31', '09:00:00', '11:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.857998', '2026-09-07 16:06:25.858002');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (45, 'PK-JOSWP3', 4, 3, 46, 'AE 534 ZW', 'Toyota Corolla', '2026-08-31', '14:00:00', '17:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.858751', '2026-09-07 16:06:25.858756');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (46, 'PK-1PLD51', 1, 4, 69, 'AE 273 ZW', 'Toyota Corolla', '2026-09-06', '09:00:00', '12:00:00', 3, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.859488', '2026-09-07 16:06:25.859493');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (47, 'PK-S8XT07', 4, 4, 63, 'AE 870 ZW', 'Toyota Corolla', '2026-09-06', '18:00:00', '20:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.860086', '2026-09-07 16:06:25.860090');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (48, 'PK-1YX5JD', 3, 4, 73, 'AE 806 ZW', 'Toyota Corolla', '2026-09-05', '16:00:00', '17:30:00', 1.5, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.860686', '2026-09-07 16:06:25.860690');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (49, 'PK-A2L4AH', 4, 4, 73, 'AE 287 ZW', 'Toyota Corolla', '2026-09-05', '11:00:00', '12:30:00', 1.5, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.861310', '2026-09-07 16:06:25.861314');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (50, 'PK-U9A4PV', 3, 4, 71, 'AE 474 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '16:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.861922', '2026-09-07 16:06:25.861926');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (51, 'PK-ZITZOT', 3, 4, 80, 'AE 489 ZW', 'Toyota Corolla', '2026-09-04', '18:00:00', '20:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.862461', '2026-09-07 16:06:25.862465');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (52, 'PK-9VKQYZ', 1, 4, 64, 'AE 331 ZW', 'Toyota Corolla', '2026-09-03', '18:00:00', '22:00:00', 4, 12800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.862976', '2026-09-07 16:06:25.862979');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (53, 'PK-LR9WXM', 3, 4, 78, 'AE 839 ZW', 'Toyota Corolla', '2026-09-02', '18:00:00', '21:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.863508', '2026-09-07 16:06:25.863512');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (54, 'PK-I67F0A', 4, 4, 78, 'AE 595 ZW', 'Toyota Corolla', '2026-09-01', '16:00:00', '17:30:00', 1.5, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.864025', '2026-09-07 16:06:25.864029');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (55, 'PK-6VH9R7', 3, 4, 67, 'AE 179 ZW', 'Toyota Corolla', '2026-09-01', '09:00:00', '10:30:00', 1.5, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.864542', '2026-09-07 16:06:25.864545');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (56, 'PK-5KEPFV', 1, 4, 73, 'AE 919 ZW', 'Toyota Corolla', '2026-09-01', '11:00:00', '12:30:00', 1.5, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.865045', '2026-09-07 16:06:25.865049');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (57, 'PK-STYL05', 4, 4, 71, 'AE 283 ZW', 'Toyota Corolla', '2026-08-31', '16:00:00', '18:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.865589', '2026-09-07 16:06:25.865597');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (58, 'PK-HC893Z', 3, 5, 96, 'AE 438 ZW', 'Toyota Corolla', '2026-09-06', '18:00:00', '19:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.866126', '2026-09-07 16:06:25.866130');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (59, 'PK-ZQSP0H', 3, 5, 98, 'AE 876 ZW', 'Toyota Corolla', '2026-09-06', '18:00:00', '19:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.866657', '2026-09-07 16:06:25.866660');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (60, 'PK-EPJU0L', 4, 5, 95, 'AE 949 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '18:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.867189', '2026-09-07 16:06:25.867193');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (61, 'PK-03R694', 4, 5, 96, 'AE 615 ZW', 'Toyota Corolla', '2026-09-05', '18:00:00', '22:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.867752', '2026-09-07 16:06:25.867756');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (62, 'PK-OKGARW', 4, 5, 92, 'AE 638 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '17:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.868283', '2026-09-07 16:06:25.868286');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (63, 'PK-B3S8DY', 3, 5, 98, 'AE 836 ZW', 'Toyota Corolla', '2026-09-04', '16:00:00', '20:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.868844', '2026-09-07 16:06:25.868848');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (64, 'PK-RDUQ31', 3, 5, 88, 'AE 628 ZW', 'Toyota Corolla', '2026-09-04', '14:00:00', '16:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.869435', '2026-09-07 16:06:25.869438');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (65, 'PK-C0Q4ZZ', 1, 5, 95, 'AE 614 ZW', 'Toyota Corolla', '2026-09-03', '11:00:00', '13:00:00', 2, 4600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.869976', '2026-09-07 16:06:25.869979');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (66, 'PK-TVPDMT', 3, 5, 90, 'AE 706 ZW', 'Toyota Corolla', '2026-09-02', '11:00:00', '15:00:00', 4, 9200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.870558', '2026-09-07 16:06:25.870563');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (67, 'PK-TMVUKK', 4, 5, 86, 'AE 415 ZW', 'Toyota Corolla', '2026-09-01', '11:00:00', '14:00:00', 3, 6900, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.871115', '2026-09-07 16:06:25.871118');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (68, 'PK-QKOW0K', 1, 5, 85, 'AE 656 ZW', 'Toyota Corolla', '2026-08-31', '14:00:00', '16:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.871638', '2026-09-07 16:06:25.871642');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (69, 'PK-ONXNMS', 1, 6, 112, 'AE 887 ZW', 'Toyota Corolla', '2026-09-06', '16:00:00', '20:00:00', 4, 7600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.872192', '2026-09-07 16:06:25.872196');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (70, 'PK-PN8C21', 1, 6, 113, 'AE 712 ZW', 'Toyota Corolla', '2026-09-06', '16:00:00', '17:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.872705', '2026-09-07 16:06:25.872708');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (71, 'PK-2489K4', 3, 6, 110, 'AE 663 ZW', 'Toyota Corolla', '2026-09-06', '16:00:00', '19:00:00', 3, 5700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.873218', '2026-09-07 16:06:25.873221');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (72, 'PK-8JL15C', 1, 6, 109, 'AE 574 ZW', 'Toyota Corolla', '2026-09-05', '09:00:00', '13:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.873739', '2026-09-07 16:06:25.873742');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (73, 'PK-I8FWYP', 1, 6, 114, 'AE 651 ZW', 'Toyota Corolla', '2026-09-05', '18:00:00', '19:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.874269', '2026-09-07 16:06:25.874272');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (74, 'PK-LGGZ8B', 3, 6, 112, 'AE 736 ZW', 'Toyota Corolla', '2026-09-05', '14:00:00', '16:00:00', 2, 3800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.874784', '2026-09-07 16:06:25.874788');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (75, 'PK-IVI6VM', 4, 6, 101, 'AE 692 ZW', 'Toyota Corolla', '2026-09-04', '18:00:00', '21:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.875324', '2026-09-07 16:06:25.875328');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (76, 'PK-ND2W23', 3, 6, 106, 'AE 594 ZW', 'Toyota Corolla', '2026-09-04', '18:00:00', '21:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.875834', '2026-09-07 16:06:25.875838');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (77, 'PK-M3MIOM', 3, 6, 114, 'AE 544 ZW', 'Toyota Corolla', '2026-09-03', '11:00:00', '12:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.876340', '2026-09-07 16:06:25.876343');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (78, 'PK-XFUCD6', 1, 6, 113, 'AE 914 ZW', 'Toyota Corolla', '2026-09-02', '16:00:00', '19:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.876865', '2026-09-07 16:06:25.876868');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (79, 'PK-9E4MB2', 3, 6, 118, 'AE 696 ZW', 'Toyota Corolla', '2026-09-02', '16:00:00', '18:00:00', 2, 3800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.877451', '2026-09-07 16:06:25.877456');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (80, 'PK-M6V6C1', 3, 6, 104, 'AE 785 ZW', 'Toyota Corolla', '2026-09-02', '11:00:00', '15:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.878032', '2026-09-07 16:06:25.878035');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (81, 'PK-GRBO41', 1, 6, 109, 'AE 823 ZW', 'Toyota Corolla', '2026-09-01', '18:00:00', '20:00:00', 2, 3800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.878557', '2026-09-07 16:06:25.878561');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (82, 'PK-TW6N14', 3, 6, 119, 'AE 848 ZW', 'Toyota Corolla', '2026-08-31', '16:00:00', '18:00:00', 2, 3800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.879150', '2026-09-07 16:06:25.879154');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (83, 'PK-BFDZB4', 4, 6, 116, 'AE 377 ZW', 'Toyota Corolla', '2026-08-31', '11:00:00', '15:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:06:25.879725', '2026-09-07 16:06:25.879728');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (84, 'PK-U91C22', 1, 1, 1, 'AF999ZZ', 'Peugeot 208', '2026-09-08', '14:00:00', '17:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario / Planes cancelados', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-09-07 16:15:31.112136', '2026-10-13 16:32:10.647136');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (85, 'PK-JXI0PT', 1, 1, 1, 'AA123BB', 'Auto Particular', '2026-10-06', '10:00:00', '12:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario / Planes cancelados', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-06 12:52:29.422813', '2026-10-13 16:32:09.037829');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (86, 'PK-Q4EB3R', 1, 1, 2, 'AA123BB', 'Auto Particular', '2026-10-06', '10:00:00', '12:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario / Planes cancelados', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-06 22:34:24.648047', '2026-10-13 15:26:05.381068');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (87, 'PK-S28P6M', 1, 4, 61, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 6400, 'completed', 'Cambio de itinerario / Planes cancelados', '2026-10-13 16:30:43.278177', '2026-10-13 16:53:06.714749', 'Mercado Pago', 'paid', '', NULL, '2026-10-13 15:25:54.121346', '2026-10-13 16:53:06.716806');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (88, 'PK-48AD78', 1, 1, 4, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'completed', 'Cambio de itinerario / Planes cancelados', '2026-10-13 17:59:30.827726', '2026-10-13 20:19:03.211829', 'Mercado Pago', 'paid', '', NULL, '2026-10-13 16:11:53.059553', '2026-10-13 20:19:03.214823');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (89, 'PK-NYBTOM', 2, 1, 1, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'completed', NULL, '2026-10-13 16:52:28.977093', '2026-10-13 16:52:45.981645', 'Mercado Pago', 'paid', '', NULL, '2026-10-13 16:26:50.580101', '2026-10-13 16:52:45.984422');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (90, 'PK-PF5QCH', 1, 1, 2, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'completed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-13 16:51:21.252630', '2026-10-13 16:59:05.690297');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (91, 'PK-NS9QU1', 5, 1, 1, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'cancelled', 'Error al seleccionar fecha u horario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-13 17:29:58.546718', '2026-10-13 17:30:36.798521');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (92, 'PK-VZS0X1', 1, 1, 14, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '20:00:00', 10, 24000, 'cancelled', 'Error al seleccionar fecha u horario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-13 17:46:59.084058', '2026-10-13 20:17:33.242533');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (93, 'PK-CB6MN2', 5, 1, 9, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'completed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-13 20:15:52.746390', '2026-10-13 20:21:25.688261');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (94, 'PK-CTLJ11', 1, 4, 61, 'AA123BB', '', '2026-10-13', '10:00:00', '13:00:00', 3, 9600, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-13 20:18:27.721446', '2026-10-13 20:18:27.721462');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (95, 'PK-ZZU3GF', 5, 1, 1, 'RLROFKFL', '', '2026-10-13', '20:19:31.810625', '21:19:31.810625', 1, 2400, 'completed', NULL, '2026-10-13 20:19:31.810625', '2026-10-13 20:19:39.913611', 'Efectivo', 'paid', '', NULL, '2026-10-13 20:19:31.814102', '2026-10-13 20:19:39.917755');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (96, 'PK-3AK5H7', 1, 1, 1, 'AA123BB', 'Auto Particular', '2026-10-13', '10:00:00', '12:00:00', 2, 4800, 'completed', NULL, '2026-10-13 21:29:06.906982', '2026-10-13 21:29:45.645118', 'Efectivo', 'paid', '', NULL, '2026-10-13 21:25:39.075790', '2026-10-13 21:29:45.883221');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (97, 'PK-0L1LDT', 1, 1, 1, 'AA123BB', 'Auto Particular', '2026-10-27', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-27 06:01:01.827100', '2026-10-27 06:01:01.827118');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (98, 'PK-CWYA3R', 1, 1, 2, 'AA123BB', 'Auto Particular', '2026-10-27', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, '2026-10-27 12:51:55.029139', NULL, 'Efectivo', 'paid', '', NULL, '2026-10-27 06:04:11.108174', '2026-10-27 12:51:55.031137');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (99, 'PK-GEB1TG', 1, 4, 77, 'AA123BB', 'Auto Particular', '2026-10-27', '10:00:00', '12:00:00', 2, 6400, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-27 12:50:54.305629', '2026-10-27 12:50:54.305645');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (100, 'PK-TQTPFM', 2, 1, 3, 'AA123BB', 'Auto Particular', '2026-10-27', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-10-27 19:21:17.904639', '2026-10-27 19:21:17.904658');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (101, 'PK-MGS51E', 1, 1, 1, 'AA123BB', 'Auto Particular', '2026-11-06', '10:00:00', '12:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario / Planes cancelados', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-06 15:27:00.817645', '2026-11-10 02:20:27.623922');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (102, 'PK-46OAYW', 1, 1, 5, 'AA123BB', 'Auto Particular', '2026-11-06', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-06 15:31:09.356720', '2026-11-06 15:31:09.356745');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (103, 'PK-VHEJ6G', 1, 1, 10, 'AA123BB', 'Auto Particular', '2026-11-06', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-06 15:36:47.225800', '2026-11-06 15:36:47.225818');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (104, 'PK-1SV33E', 1, 1, 12, 'AA123BB', 'Auto Particular', '2026-11-06', '10:00:00', '12:00:00', 2, 4800, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-06 18:09:22.105856', '2026-11-06 18:09:22.105877');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (105, 'PK-GQDY7R', 5, 4, 62, 'AA123BB', '', '2026-11-07', '10:00:00', '13:00:00', 3, 9600, 'confirmed', NULL, NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-07 03:18:38.739831', '2026-11-07 03:18:38.739862');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (106, 'PK-RZNDM1', 1, 1, 1, 'AA123BB', 'Auto Particular', '2026-11-10', '10:00:00', '12:00:00', 2, 4800, 'pending', NULL, NULL, NULL, 'Mercado Pago', 'pending', '', '2026-11-10 02:35:03.077683', '2026-11-10 02:20:03.078050', '2026-11-10 02:20:03.078055');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (107, 'PK-WDKE5K', 3, 1, 5, 'AE 100 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '20:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.091346', '2026-11-10 16:40:58.091352');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (108, 'PK-SXPCWC', 1, 1, 3, 'AE 640 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '12:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.092582', '2026-11-10 16:40:58.092587');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (109, 'PK-FVYUXQ', 3, 1, 1, 'AE 885 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '21:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.094004', '2026-11-10 16:40:58.094135');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (110, 'PK-O25BQI', 4, 1, 20, 'AE 854 ZW', 'Toyota Corolla', '2026-11-08', '14:00:00', '17:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.095888', '2026-11-10 16:40:58.095894');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (111, 'PK-QP87L4', 4, 1, 6, 'AE 498 ZW', 'Toyota Corolla', '2026-11-07', '09:00:00', '12:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.097781', '2026-11-10 16:40:58.097788');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (112, 'PK-E2AAE5', 4, 1, 6, 'AE 996 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '17:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.098844', '2026-11-10 16:40:58.098849');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (113, 'PK-G4D3H8', 4, 1, 10, 'AE 221 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '15:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.099728', '2026-11-10 16:40:58.099732');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (114, 'PK-1OBVMU', 1, 1, 15, 'AE 736 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '15:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.100511', '2026-11-10 16:40:58.100515');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (115, 'PK-6YCZIS', 3, 1, 1, 'AE 652 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '12:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.101624', '2026-11-10 16:40:58.101637');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (116, 'PK-3W7K1S', 4, 1, 2, 'AE 279 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '11:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.103444', '2026-11-10 16:40:58.103449');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (117, 'PK-ZZ3MA3', 3, 1, 1, 'AE 127 ZW', 'Toyota Corolla', '2026-11-05', '11:00:00', '14:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.104538', '2026-11-10 16:40:58.104543');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (118, 'PK-AN7IFR', 4, 1, 11, 'AE 828 ZW', 'Toyota Corolla', '2026-11-04', '16:00:00', '17:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.105891', '2026-11-10 16:40:58.105897');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (119, 'PK-F5JNOU', 3, 1, 16, 'AE 636 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '16:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.106658', '2026-11-10 16:40:58.106662');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (120, 'PK-3NABVJ', 1, 1, 12, 'AE 158 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '20:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.107515', '2026-11-10 16:40:58.107521');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (121, 'PK-J5BQ1B', 4, 1, 1, 'AE 572 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '18:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.108348', '2026-11-10 16:40:58.108352');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (122, 'PK-2B0IEG', 3, 1, 10, 'AE 749 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '20:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.109063', '2026-11-10 16:40:58.109066');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (123, 'PK-LLQIKI', 4, 2, 32, 'AE 608 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '19:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.111010', '2026-11-10 16:40:58.111014');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (124, 'PK-J9T6EE', 4, 2, 27, 'AE 170 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '12:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.111960', '2026-11-10 16:40:58.111965');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (125, 'PK-1144S6', 3, 2, 26, 'AE 541 ZW', 'Toyota Corolla', '2026-11-08', '18:00:00', '19:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.113112', '2026-11-10 16:40:58.113124');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (126, 'PK-6VXQ9T', 1, 2, 33, 'AE 275 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '18:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.114509', '2026-11-10 16:40:58.114514');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (127, 'PK-4PFWCO', 4, 2, 21, 'AE 229 ZW', 'Toyota Corolla', '2026-11-07', '18:00:00', '22:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.115412', '2026-11-10 16:40:58.115416');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (128, 'PK-2WTJZT', 3, 2, 35, 'AE 339 ZW', 'Toyota Corolla', '2026-11-07', '11:00:00', '15:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.116142', '2026-11-10 16:40:58.116146');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (129, 'PK-W3TDAD', 4, 2, 40, 'AE 856 ZW', 'Toyota Corolla', '2026-11-07', '18:00:00', '21:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.116832', '2026-11-10 16:40:58.116836');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (130, 'PK-TMWBR7', 3, 2, 33, 'AE 645 ZW', 'Toyota Corolla', '2026-11-06', '11:00:00', '12:30:00', 1.5, 3150, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.117525', '2026-11-10 16:40:58.117528');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (131, 'PK-PBO41D', 4, 2, 39, 'AE 453 ZW', 'Toyota Corolla', '2026-11-05', '09:00:00', '11:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.118838', '2026-11-10 16:40:58.118843');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (132, 'PK-76CVIS', 4, 2, 35, 'AE 567 ZW', 'Toyota Corolla', '2026-11-05', '09:00:00', '10:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.119997', '2026-11-10 16:40:58.120002');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (133, 'PK-7ZJNPM', 1, 2, 38, 'AE 125 ZW', 'Toyota Corolla', '2026-11-04', '11:00:00', '14:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.121207', '2026-11-10 16:40:58.121212');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (134, 'PK-CTTV6U', 4, 2, 26, 'AE 332 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '15:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.122604', '2026-11-10 16:40:58.122608');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (135, 'PK-GSI0JB', 1, 2, 40, 'AE 777 ZW', 'Toyota Corolla', '2026-11-04', '09:00:00', '10:30:00', 1.5, 3150, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.123501', '2026-11-10 16:40:58.123505');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (136, 'PK-HXSJYT', 4, 2, 31, 'AE 124 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '18:00:00', 4, 8400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.124342', '2026-11-10 16:40:58.124346');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (137, 'PK-1GK7U3', 1, 3, 57, 'AE 441 ZW', 'Toyota Corolla', '2026-11-09', '14:00:00', '15:30:00', 1.5, 2700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.125355', '2026-11-10 16:40:58.125359');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (138, 'PK-W325CV', 3, 3, 42, 'AE 925 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '14:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.126082', '2026-11-10 16:40:58.126086');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (139, 'PK-5UNRVH', 4, 3, 42, 'AE 696 ZW', 'Toyota Corolla', '2026-11-08', '11:00:00', '14:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.127523', '2026-11-10 16:40:58.127528');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (140, 'PK-KGNJM1', 4, 3, 52, 'AE 166 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '17:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.128393', '2026-11-10 16:40:58.128398');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (141, 'PK-RSAF1B', 3, 3, 51, 'AE 746 ZW', 'Toyota Corolla', '2026-11-06', '18:00:00', '19:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.129263', '2026-11-10 16:40:58.129268');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (142, 'PK-BURQME', 3, 3, 47, 'AE 524 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '12:00:00', 3, 5400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.130911', '2026-11-10 16:40:58.130916');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (143, 'PK-67BS02', 1, 3, 42, 'AE 969 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '13:00:00', 4, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.131870', '2026-11-10 16:40:58.131874');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (144, 'PK-RI8IUT', 1, 3, 56, 'AE 686 ZW', 'Toyota Corolla', '2026-11-05', '09:00:00', '13:00:00', 4, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.132601', '2026-11-10 16:40:58.132604');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (145, 'PK-FRJ9O8', 3, 3, 56, 'AE 750 ZW', 'Toyota Corolla', '2026-11-04', '16:00:00', '17:30:00', 1.5, 2700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.133438', '2026-11-10 16:40:58.133442');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (146, 'PK-Q2G9LY', 4, 3, 50, 'AE 596 ZW', 'Toyota Corolla', '2026-11-04', '09:00:00', '10:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.134151', '2026-11-10 16:40:58.134155');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (147, 'PK-IW6W07', 4, 3, 44, 'AE 379 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '19:30:00', 1.5, 2700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.135861', '2026-11-10 16:40:58.135866');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (148, 'PK-TU985M', 1, 3, 57, 'AE 474 ZW', 'Toyota Corolla', '2026-11-03', '09:00:00', '11:00:00', 2, 3600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.137035', '2026-11-10 16:40:58.137052');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (149, 'PK-NG3SFT', 4, 3, 42, 'AE 864 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '17:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.138611', '2026-11-10 16:40:58.138616');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (150, 'PK-F830S8', 1, 4, 69, 'AE 262 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '22:00:00', 4, 12800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.139687', '2026-11-10 16:40:58.139692');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (151, 'PK-LVFFQJ', 1, 4, 79, 'AE 120 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '17:30:00', 1.5, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.140453', '2026-11-10 16:40:58.140457');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (152, 'PK-0RU5PC', 3, 4, 72, 'AE 717 ZW', 'Toyota Corolla', '2026-11-08', '11:00:00', '13:00:00', 2, 6400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.141260', '2026-11-10 16:40:58.141264');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (153, 'PK-9YZDW0', 4, 4, 63, 'AE 339 ZW', 'Toyota Corolla', '2026-11-07', '09:00:00', '11:00:00', 2, 6400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.142056', '2026-11-10 16:40:58.142061');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (154, 'PK-VC9N94', 1, 4, 67, 'AE 171 ZW', 'Toyota Corolla', '2026-11-07', '18:00:00', '20:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.143048', '2026-11-10 16:40:58.143053');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (155, 'PK-8VB6SL', 4, 4, 75, 'AE 516 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '18:00:00', 4, 12800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.144411', '2026-11-10 16:40:58.144415');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (156, 'PK-PJ8QN5', 4, 4, 68, 'AE 592 ZW', 'Toyota Corolla', '2026-11-06', '18:00:00', '22:00:00', 4, 12800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.145225', '2026-11-10 16:40:58.145229');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (157, 'PK-OA9NK4', 4, 4, 70, 'AE 170 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '13:00:00', 4, 12800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.146237', '2026-11-10 16:40:58.146242');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (158, 'PK-32WK29', 1, 4, 79, 'AE 406 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '16:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.147644', '2026-11-10 16:40:58.147648');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (159, 'PK-S2K6FS', 3, 4, 65, 'AE 655 ZW', 'Toyota Corolla', '2026-11-05', '14:00:00', '16:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.148704', '2026-11-10 16:40:58.148708');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (160, 'PK-ZHQA8F', 4, 4, 62, 'AE 671 ZW', 'Toyota Corolla', '2026-11-05', '09:00:00', '12:00:00', 3, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.149398', '2026-11-10 16:40:58.149402');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (161, 'PK-BXUIG9', 3, 4, 66, 'AE 826 ZW', 'Toyota Corolla', '2026-11-04', '18:00:00', '20:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.150090', '2026-11-10 16:40:58.150094');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (162, 'PK-XWBYIC', 1, 4, 80, 'AE 432 ZW', 'Toyota Corolla', '2026-11-04', '18:00:00', '21:00:00', 3, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.150913', '2026-11-10 16:40:58.150919');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (163, 'PK-XZTDPN', 3, 4, 72, 'AE 876 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '15:30:00', 1.5, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.152057', '2026-11-10 16:40:58.152062');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (164, 'PK-X9D8F1', 3, 4, 69, 'AE 411 ZW', 'Toyota Corolla', '2026-11-03', '11:00:00', '12:30:00', 1.5, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.152975', '2026-11-10 16:40:58.152979');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (165, 'PK-K1QWKE', 1, 4, 68, 'AE 654 ZW', 'Toyota Corolla', '2026-11-03', '11:00:00', '12:30:00', 1.5, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.153957', '2026-11-10 16:40:58.153961');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (166, 'PK-0FTWO2', 1, 5, 98, 'AE 384 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '20:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.154804', '2026-11-10 16:40:58.154808');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (167, 'PK-RZ3TG6', 4, 5, 96, 'AE 246 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '15:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.155527', '2026-11-10 16:40:58.155531');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (168, 'PK-BGV8DB', 4, 5, 89, 'AE 433 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '12:00:00', 3, 6900, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.156581', '2026-11-10 16:40:58.156586');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (169, 'PK-S6KH28', 4, 5, 90, 'AE 816 ZW', 'Toyota Corolla', '2026-11-08', '09:00:00', '10:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.157393', '2026-11-10 16:40:58.157397');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (170, 'PK-U197H5', 4, 5, 90, 'AE 500 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '18:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.158274', '2026-11-10 16:40:58.158277');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (171, 'PK-1C254G', 1, 5, 89, 'AE 959 ZW', 'Toyota Corolla', '2026-11-07', '11:00:00', '13:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.158970', '2026-11-10 16:40:58.158974');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (172, 'PK-I4L4LR', 4, 5, 87, 'AE 455 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '17:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.160200', '2026-11-10 16:40:58.160204');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (173, 'PK-BA53Z6', 3, 5, 81, 'AE 228 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '19:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.160967', '2026-11-10 16:40:58.160971');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (174, 'PK-JOWYB3', 1, 5, 98, 'AE 626 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '17:00:00', 3, 6900, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.161678', '2026-11-10 16:40:58.161682');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (175, 'PK-IRXBLF', 4, 5, 91, 'AE 669 ZW', 'Toyota Corolla', '2026-11-05', '14:00:00', '16:00:00', 2, 4600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.162728', '2026-11-10 16:40:58.162732');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (176, 'PK-HXFICC', 1, 5, 86, 'AE 280 ZW', 'Toyota Corolla', '2026-11-05', '09:00:00', '10:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.163665', '2026-11-10 16:40:58.163669');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (177, 'PK-OBMOBA', 4, 5, 99, 'AE 762 ZW', 'Toyota Corolla', '2026-11-05', '16:00:00', '18:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.164621', '2026-11-10 16:40:58.164625');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (178, 'PK-LI386L', 4, 5, 89, 'AE 318 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '18:00:00', 4, 9200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.165446', '2026-11-10 16:40:58.165450');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (179, 'PK-BT6DQG', 3, 5, 86, 'AE 554 ZW', 'Toyota Corolla', '2026-11-04', '18:00:00', '22:00:00', 4, 9200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.166111', '2026-11-10 16:40:58.166115');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (180, 'PK-7N3OF1', 3, 5, 88, 'AE 767 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '20:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.167039', '2026-11-10 16:40:58.167043');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (181, 'PK-OS49QR', 3, 5, 84, 'AE 797 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '17:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.167731', '2026-11-10 16:40:58.167735');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (182, 'PK-HUJ3DX', 1, 5, 98, 'AE 448 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '19:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.168729', '2026-11-10 16:40:58.168733');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (183, 'PK-2QD7FO', 4, 6, 113, 'AE 903 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '21:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.169564', '2026-11-10 16:40:58.169571');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (184, 'PK-J7K6SJ', 4, 6, 104, 'AE 658 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '20:00:00', 2, 3800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.170273', '2026-11-10 16:40:58.170277');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (185, 'PK-2JZJR4', 3, 6, 104, 'AE 744 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '13:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.171076', '2026-11-10 16:40:58.171081');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (186, 'PK-DY7OH6', 1, 6, 112, 'AE 998 ZW', 'Toyota Corolla', '2026-11-08', '09:00:00', '13:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.171899', '2026-11-10 16:40:58.171903');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (187, 'PK-NT49MO', 3, 6, 112, 'AE 536 ZW', 'Toyota Corolla', '2026-11-08', '11:00:00', '12:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.172602', '2026-11-10 16:40:58.172606');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (188, 'PK-P5FVYG', 4, 6, 110, 'AE 175 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '17:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.173475', '2026-11-10 16:40:58.173479');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (189, 'PK-OX612Q', 1, 6, 107, 'AE 869 ZW', 'Toyota Corolla', '2026-11-07', '18:00:00', '19:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.174136', '2026-11-10 16:40:58.174140');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (190, 'PK-DJSSB5', 4, 6, 112, 'AE 197 ZW', 'Toyota Corolla', '2026-11-07', '09:00:00', '12:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.175015', '2026-11-10 16:40:58.175019');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (191, 'PK-PLYSL7', 1, 6, 111, 'AE 426 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '20:00:00', 4, 7600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.175732', '2026-11-10 16:40:58.175736');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (192, 'PK-6LPAC4', 4, 6, 117, 'AE 427 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '19:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.176805', '2026-11-10 16:40:58.176809');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (193, 'PK-AFB0I8', 3, 6, 113, 'AE 854 ZW', 'Toyota Corolla', '2026-11-05', '14:00:00', '16:00:00', 2, 3800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.177603', '2026-11-10 16:40:58.177607');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (194, 'PK-L7VYLP', 4, 6, 107, 'AE 354 ZW', 'Toyota Corolla', '2026-11-04', '09:00:00', '11:00:00', 2, 3800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.178486', '2026-11-10 16:40:58.178490');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (195, 'PK-UNZPUT', 3, 6, 113, 'AE 919 ZW', 'Toyota Corolla', '2026-11-04', '18:00:00', '22:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.179230', '2026-11-10 16:40:58.179234');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (196, 'PK-026FND', 4, 6, 107, 'AE 781 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '18:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.180121', '2026-11-10 16:40:58.180125');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (197, 'PK-6NOW9Y', 3, 6, 109, 'AE 201 ZW', 'Toyota Corolla', '2026-11-03', '09:00:00', '10:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.180809', '2026-11-10 16:40:58.180813');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (198, 'PK-9AXMVU', 1, 6, 105, 'AE 310 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '21:00:00', 3, 5700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.181491', '2026-11-10 16:40:58.181495');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (199, 'PK-DO5SFS', 3, 6, 104, 'AE 452 ZW', 'Toyota Corolla', '2026-11-03', '09:00:00', '10:30:00', 1.5, 2850, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:40:58.182193', '2026-11-10 16:40:58.182197');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (200, 'PK-K81KQL', 1, 1, 12, 'AE 121 ZW', 'Toyota Corolla', '2026-11-09', '14:00:00', '15:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.219404', '2026-11-10 16:41:38.219409');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (201, 'PK-RH1433', 3, 1, 20, 'AE 938 ZW', 'Toyota Corolla', '2026-11-08', '18:00:00', '21:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.220746', '2026-11-10 16:41:38.220751');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (202, 'PK-JQCDTJ', 4, 1, 14, 'AE 156 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '18:00:00', 2, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.222203', '2026-11-10 16:41:38.222208');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (203, 'PK-8P2RFT', 3, 1, 4, 'AE 231 ZW', 'Toyota Corolla', '2026-11-08', '14:00:00', '17:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.223506', '2026-11-10 16:41:38.223514');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (204, 'PK-LNSGQC', 1, 1, 17, 'AE 544 ZW', 'Toyota Corolla', '2026-11-07', '11:00:00', '14:00:00', 3, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.224423', '2026-11-10 16:41:38.224428');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (205, 'PK-HA0NT7', 4, 1, 10, 'AE 846 ZW', 'Toyota Corolla', '2026-11-06', '18:00:00', '21:00:00', 3, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.225260', '2026-11-10 16:41:38.225265');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (206, 'PK-DQNCEJ', 4, 1, 6, 'AE 893 ZW', 'Toyota Corolla', '2026-11-06', '09:00:00', '11:00:00', 2, 4800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.225960', '2026-11-10 16:41:38.225964');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (207, 'PK-PZN3OE', 4, 1, 20, 'AE 342 ZW', 'Toyota Corolla', '2026-11-05', '11:00:00', '15:00:00', 4, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.226796', '2026-11-10 16:41:38.226800');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (208, 'PK-80RZ01', 4, 1, 16, 'AE 531 ZW', 'Toyota Corolla', '2026-11-04', '11:00:00', '12:30:00', 1.5, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.228212', '2026-11-10 16:41:38.228217');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (209, 'PK-96GVPE', 4, 1, 12, 'AE 904 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '18:00:00', 4, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.229839', '2026-11-10 16:41:38.229845');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (210, 'PK-UC0XQ7', 4, 1, 5, 'AE 354 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '20:00:00', 4, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.230807', '2026-11-10 16:41:38.230812');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (211, 'PK-5I9YCY', 3, 1, 7, 'AE 181 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '18:00:00', 4, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.232138', '2026-11-10 16:41:38.232143');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (212, 'PK-M1703F', 4, 2, 33, 'AE 183 ZW', 'Toyota Corolla', '2026-11-09', '14:00:00', '18:00:00', 4, 8400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.233328', '2026-11-10 16:41:38.233332');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (213, 'PK-41MOGF', 3, 2, 22, 'AE 696 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '21:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.234067', '2026-11-10 16:41:38.234071');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (214, 'PK-ERS10M', 3, 2, 29, 'AE 208 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '12:00:00', 3, 6300, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.235047', '2026-11-10 16:41:38.235054');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (215, 'PK-P4E83U', 4, 2, 35, 'AE 708 ZW', 'Toyota Corolla', '2026-11-08', '09:00:00', '11:00:00', 2, 4200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.236140', '2026-11-10 16:41:38.236145');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (216, 'PK-9NH1AN', 1, 2, 27, 'AE 182 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '17:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.236844', '2026-11-10 16:41:38.236851');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (217, 'PK-AV1OIF', 4, 2, 37, 'AE 847 ZW', 'Toyota Corolla', '2026-11-08', '09:00:00', '10:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.237640', '2026-11-10 16:41:38.237644');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (218, 'PK-C0878N', 4, 2, 38, 'AE 235 ZW', 'Toyota Corolla', '2026-11-07', '18:00:00', '19:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.238353', '2026-11-10 16:41:38.238356');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (219, 'PK-O5ZS0T', 3, 2, 30, 'AE 909 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '15:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.239013', '2026-11-10 16:41:38.239016');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (220, 'PK-FU3KUN', 3, 2, 32, 'AE 211 ZW', 'Toyota Corolla', '2026-11-06', '18:00:00', '22:00:00', 4, 8400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.239854', '2026-11-10 16:41:38.239859');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (221, 'PK-9U9RHV', 3, 2, 33, 'AE 235 ZW', 'Toyota Corolla', '2026-11-05', '14:00:00', '15:30:00', 1.5, 3150, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.240628', '2026-11-10 16:41:38.240633');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (222, 'PK-Y5SRVM', 3, 2, 23, 'AE 655 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '17:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.241300', '2026-11-10 16:41:38.241304');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (223, 'PK-8DLFS7', 1, 2, 30, 'AE 293 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '16:00:00', 2, 4200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.241921', '2026-11-10 16:41:38.241925');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (224, 'PK-YDD715', 4, 2, 29, 'AE 277 ZW', 'Toyota Corolla', '2026-11-03', '18:00:00', '21:00:00', 3, 6300, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.242654', '2026-11-10 16:41:38.242658');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (225, 'PK-PVW17V', 4, 3, 49, 'AE 573 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '10:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.243344', '2026-11-10 16:41:38.243348');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (226, 'PK-TSB00E', 3, 3, 48, 'AE 330 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '15:00:00', 4, 7200, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.244038', '2026-11-10 16:41:38.244042');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (227, 'PK-FD5VFO', 1, 3, 50, 'AE 572 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '12:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.244682', '2026-11-10 16:41:38.244686');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (228, 'PK-ON4FXP', 4, 3, 46, 'AE 464 ZW', 'Toyota Corolla', '2026-11-08', '09:00:00', '13:00:00', 4, 7200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.245309', '2026-11-10 16:41:38.245313');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (229, 'PK-J8FVIX', 1, 3, 46, 'AE 177 ZW', 'Toyota Corolla', '2026-11-07', '16:00:00', '18:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.245923', '2026-11-10 16:41:38.245926');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (230, 'PK-W9V3Y7', 1, 3, 50, 'AE 216 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '18:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.246589', '2026-11-10 16:41:38.246593');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (231, 'PK-HTTRL9', 1, 3, 45, 'AE 695 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '17:30:00', 1.5, 2700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.247268', '2026-11-10 16:41:38.247272');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (232, 'PK-HXOELP', 4, 3, 48, 'AE 498 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '16:00:00', 2, 3600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.247906', '2026-11-10 16:41:38.247910');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (233, 'PK-3K3HW3', 4, 3, 54, 'AE 116 ZW', 'Toyota Corolla', '2026-11-05', '16:00:00', '18:00:00', 2, 3600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.248545', '2026-11-10 16:41:38.248549');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (234, 'PK-G72FZ3', 4, 3, 43, 'AE 917 ZW', 'Toyota Corolla', '2026-11-04', '14:00:00', '15:30:00', 1.5, 2700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.249249', '2026-11-10 16:41:38.249253');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (235, 'PK-NHD8BS', 4, 3, 42, 'AE 521 ZW', 'Toyota Corolla', '2026-11-03', '14:00:00', '16:00:00', 2, 3600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.249912', '2026-11-10 16:41:38.249916');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (236, 'PK-DTCE51', 1, 4, 74, 'AE 426 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '13:00:00', 2, 6400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.250563', '2026-11-10 16:41:38.250567');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (237, 'PK-1PBT1V', 1, 4, 67, 'AE 812 ZW', 'Toyota Corolla', '2026-11-08', '14:00:00', '17:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.251215', '2026-11-10 16:41:38.251218');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (238, 'PK-AJHWJ3', 1, 4, 76, 'AE 830 ZW', 'Toyota Corolla', '2026-11-08', '14:00:00', '16:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.252219', '2026-11-10 16:41:38.252223');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (239, 'PK-LKAC9N', 4, 4, 63, 'AE 812 ZW', 'Toyota Corolla', '2026-11-08', '11:00:00', '14:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.252865', '2026-11-10 16:41:38.252869');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (240, 'PK-XXCO5L', 3, 4, 65, 'AE 400 ZW', 'Toyota Corolla', '2026-11-07', '16:00:00', '19:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.253503', '2026-11-10 16:41:38.253507');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (241, 'PK-9RJOLM', 1, 4, 66, 'AE 533 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '18:00:00', 4, 12800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.254106', '2026-11-10 16:41:38.254110');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (242, 'PK-KWBZ4Y', 3, 4, 66, 'AE 424 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '17:30:00', 1.5, 4800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.254756', '2026-11-10 16:41:38.254759');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (243, 'PK-TWK5QK', 1, 4, 63, 'AE 418 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '18:00:00', 4, 12800, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.255401', '2026-11-10 16:41:38.255404');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (244, 'PK-8FR9ZX', 3, 4, 77, 'AE 725 ZW', 'Toyota Corolla', '2026-11-05', '18:00:00', '21:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.256029', '2026-11-10 16:41:38.256033');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (245, 'PK-KKL2PH', 4, 4, 74, 'AE 954 ZW', 'Toyota Corolla', '2026-11-05', '11:00:00', '13:00:00', 2, 6400, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.256694', '2026-11-10 16:41:38.256698');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (246, 'PK-DBS8QZ', 1, 4, 76, 'AE 655 ZW', 'Toyota Corolla', '2026-11-04', '16:00:00', '19:00:00', 3, 9600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.257348', '2026-11-10 16:41:38.257352');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (247, 'PK-A3XFHG', 4, 4, 72, 'AE 126 ZW', 'Toyota Corolla', '2026-11-04', '09:00:00', '13:00:00', 4, 12800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.257995', '2026-11-10 16:41:38.257998');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (248, 'PK-85RZGR', 4, 4, 64, 'AE 286 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '18:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.258624', '2026-11-10 16:41:38.258628');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (249, 'PK-PY36L5', 1, 4, 77, 'AE 388 ZW', 'Toyota Corolla', '2026-11-03', '09:00:00', '12:00:00', 3, 9600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.259253', '2026-11-10 16:41:38.259256');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (250, 'PK-BNHG2U', 4, 4, 70, 'AE 166 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '18:00:00', 2, 6400, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.259922', '2026-11-10 16:41:38.259925');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (251, 'PK-WN23GX', 1, 5, 99, 'AE 221 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '20:00:00', 2, 4600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.260539', '2026-11-10 16:41:38.260543');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (252, 'PK-ZHCUI5', 3, 5, 84, 'AE 459 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '11:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.261138', '2026-11-10 16:41:38.261142');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (253, 'PK-813VEU', 3, 5, 98, 'AE 253 ZW', 'Toyota Corolla', '2026-11-09', '18:00:00', '20:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.261747', '2026-11-10 16:41:38.261750');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (254, 'PK-KYXZOJ', 1, 5, 90, 'AE 398 ZW', 'Toyota Corolla', '2026-11-08', '18:00:00', '21:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.262729', '2026-11-10 16:41:38.262732');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (255, 'PK-BAMJM0', 4, 5, 88, 'AE 731 ZW', 'Toyota Corolla', '2026-11-08', '18:00:00', '21:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.263408', '2026-11-10 16:41:38.263412');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (256, 'PK-GEU92D', 1, 5, 93, 'AE 916 ZW', 'Toyota Corolla', '2026-11-07', '16:00:00', '19:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.264068', '2026-11-10 16:41:38.264071');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (257, 'PK-UK5FRG', 4, 5, 84, 'AE 711 ZW', 'Toyota Corolla', '2026-11-07', '09:00:00', '10:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.264678', '2026-11-10 16:41:38.264681');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (258, 'PK-YRIMCE', 1, 5, 91, 'AE 584 ZW', 'Toyota Corolla', '2026-11-07', '11:00:00', '15:00:00', 4, 9200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.265325', '2026-11-10 16:41:38.265329');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (259, 'PK-PJK028', 3, 5, 90, 'AE 237 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '17:30:00', 1.5, 3450, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.265932', '2026-11-10 16:41:38.265936');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (260, 'PK-2I6CDT', 3, 5, 82, 'AE 909 ZW', 'Toyota Corolla', '2026-11-06', '14:00:00', '17:00:00', 3, 6900, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.266527', '2026-11-10 16:41:38.266530');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (261, 'PK-2PY9W9', 3, 5, 88, 'AE 959 ZW', 'Toyota Corolla', '2026-11-06', '16:00:00', '18:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.267246', '2026-11-10 16:41:38.267250');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (262, 'PK-5TD314', 4, 5, 89, 'AE 444 ZW', 'Toyota Corolla', '2026-11-05', '11:00:00', '15:00:00', 4, 9200, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.267859', '2026-11-10 16:41:38.267863');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (263, 'PK-K5XUAF', 3, 5, 90, 'AE 366 ZW', 'Toyota Corolla', '2026-11-04', '11:00:00', '13:00:00', 2, 4600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.268499', '2026-11-10 16:41:38.268503');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (264, 'PK-43U9X0', 1, 5, 91, 'AE 926 ZW', 'Toyota Corolla', '2026-11-04', '18:00:00', '21:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.269104', '2026-11-10 16:41:38.269108');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (265, 'PK-AC7F80', 1, 5, 87, 'AE 111 ZW', 'Toyota Corolla', '2026-11-03', '09:00:00', '12:00:00', 3, 6900, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.269734', '2026-11-10 16:41:38.269737');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (266, 'PK-XONU26', 3, 6, 112, 'AE 497 ZW', 'Toyota Corolla', '2026-11-09', '11:00:00', '12:30:00', 1.5, 2850, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.270346', '2026-11-10 16:41:38.270350');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (267, 'PK-F517F8', 3, 6, 108, 'AE 444 ZW', 'Toyota Corolla', '2026-11-09', '09:00:00', '13:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.270945', '2026-11-10 16:41:38.270949');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (268, 'PK-SWNB7Y', 3, 6, 115, 'AE 180 ZW', 'Toyota Corolla', '2026-11-08', '18:00:00', '19:30:00', 1.5, 2850, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.271541', '2026-11-10 16:41:38.271545');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (269, 'PK-AVVG1C', 4, 6, 117, 'AE 598 ZW', 'Toyota Corolla', '2026-11-08', '16:00:00', '20:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.272151', '2026-11-10 16:41:38.272155');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (270, 'PK-H4A7WW', 1, 6, 105, 'AE 283 ZW', 'Toyota Corolla', '2026-11-07', '16:00:00', '20:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.272775', '2026-11-10 16:41:38.272778');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (271, 'PK-8WLYM3', 1, 6, 106, 'AE 363 ZW', 'Toyota Corolla', '2026-11-07', '14:00:00', '17:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.273368', '2026-11-10 16:41:38.273371');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (272, 'PK-U2TCRM', 4, 6, 109, 'AE 398 ZW', 'Toyota Corolla', '2026-11-06', '18:00:00', '19:30:00', 1.5, 2850, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.274018', '2026-11-10 16:41:38.274021');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (273, 'PK-MZZAQX', 1, 6, 103, 'AE 492 ZW', 'Toyota Corolla', '2026-11-06', '11:00:00', '14:00:00', 3, 5700, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.274626', '2026-11-10 16:41:38.274630');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (274, 'PK-XBLFZV', 1, 6, 108, 'AE 956 ZW', 'Toyota Corolla', '2026-11-05', '16:00:00', '18:00:00', 2, 3800, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.275260', '2026-11-10 16:41:38.275263');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (275, 'PK-TZQWL5', 4, 6, 114, 'AE 429 ZW', 'Toyota Corolla', '2026-11-04', '16:00:00', '19:00:00', 3, 5700, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.275900', '2026-11-10 16:41:38.275904');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (276, 'PK-KUNC4R', 1, 6, 114, 'AE 511 ZW', 'Toyota Corolla', '2026-11-04', '11:00:00', '15:00:00', 4, 7600, 'completed', '', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.276546', '2026-11-10 16:41:38.276549');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (277, 'PK-6CASR1', 3, 6, 111, 'AE 829 ZW', 'Toyota Corolla', '2026-11-04', '11:00:00', '15:00:00', 4, 7600, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.277149', '2026-11-10 16:41:38.277152');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (278, 'PK-E6YQEA', 4, 6, 116, 'AE 666 ZW', 'Toyota Corolla', '2026-11-03', '16:00:00', '17:30:00', 1.5, 2850, 'cancelled', 'Cambio de itinerario', NULL, NULL, 'Efectivo', 'paid', '', NULL, '2026-11-10 16:41:38.277771', '2026-11-10 16:41:38.277774');
INSERT INTO reservations (id, booking_code, user_id, parking_id, space_id, vehicle_plate, vehicle_model, date, start_time, end_time, total_hours, total_price, status, cancellation_reason, check_in_time, check_out_time, payment_method, payment_status, staff_notes, payment_expires_at, created_at, updated_at) VALUES (279, 'PK-0D4HJZ', 1, 1, 9, 'AA123BB', 'Auto Particular', '2026-11-10', '10:00:00', '12:00:00', 2, 4800, 'pending', NULL, NULL, NULL, 'Mercado Pago', 'pending', '', '2026-11-10 17:18:06.410091', '2026-11-10 17:03:06.410320', '2026-11-10 17:03:06.410325');

-- ----------------------------------------------------------------------------
-- SEED: REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, user_id, parking_id, rating, comment, created_at) VALUES (1, 1, 1, 5, 'Excelente servicio, entré con el código y el lugar estaba reservado y señalizado con mi nombre. Muy seguro.', '2026-09-07 16:06:25.880485');
INSERT INTO reviews (id, user_id, parking_id, rating, comment, created_at) VALUES (2, 3, 1, 5, 'La mejor ubicación para ir al teatro sobre Corrientes. Súper rápido el acceso.', '2026-09-07 16:06:25.881633');
INSERT INTO reviews (id, user_id, parking_id, rating, comment, created_at) VALUES (3, 4, 2, 5, 'Pude cargar mi auto eléctrico sin problemas mientras almorzaba en Palermo.', '2026-09-07 16:06:25.882498');
INSERT INTO reviews (id, user_id, parking_id, rating, comment, created_at) VALUES (4, 1, 2, 4, 'Muy limpio y bien iluminado. El personal fue muy amable.', '2026-09-07 16:06:25.883351');
INSERT INTO reviews (id, user_id, parking_id, rating, comment, created_at) VALUES (5, 3, 4, 5, 'Impecable estacionamiento en Puerto Madero. Plazas amplias y muy cómodo.', '2026-09-07 16:06:25.884141');

-- ----------------------------------------------------------------------------
-- 7. RESTART AUTO-INCREMENT SEQUENCES
-- ----------------------------------------------------------------------------
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));
SELECT setval('user_roles_id_seq', COALESCE((SELECT MAX(id) FROM user_roles), 1));
SELECT setval('parkings_id_seq', COALESCE((SELECT MAX(id) FROM parkings), 1));
SELECT setval('parking_spaces_id_seq', COALESCE((SELECT MAX(id) FROM parking_spaces), 1));
SELECT setval('reservations_id_seq', COALESCE((SELECT MAX(id) FROM reservations), 1));
SELECT setval('reviews_id_seq', COALESCE((SELECT MAX(id) FROM reviews), 1));
SELECT setval('favorites_id_seq', COALESCE((SELECT MAX(id) FROM favorites), 1));
SELECT setval('claims_id_seq', COALESCE((SELECT MAX(id) FROM claims), 1));
SELECT setval('space_locks_id_seq', COALESCE((SELECT MAX(id) FROM space_locks), 1));

-- ----------------------------------------------------------------------------
-- 8. REALTIME PUBLICATION & RPC FUNCTIONS (SISTEMA DE BLOQUEO EN TIEMPO REAL)
-- ----------------------------------------------------------------------------
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

CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE space_locks
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND expires_at < NOW()
        RETURNING space_id
    )
    SELECT COUNT(*) INTO v_count FROM expired;

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
    PERFORM cleanup_expired_locks();

    -- Sanitizar p_user_id: si no existe en la tabla users, tratarlo como NULL para evitar fallos de clave foránea
    IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        p_user_id := NULL;
    END IF;

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

    UPDATE space_locks
    SET status = 'released', updated_at = NOW()
    WHERE parking_id = p_parking_id
      AND status = 'active'
      AND (session_id = p_session_id OR (p_user_id IS NOT NULL AND user_id = p_user_id));

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
    PERFORM cleanup_expired_locks();

    -- Sanitizar p_user_id: si no existe en la tabla users, tratarlo como NULL para evitar fallos de clave foránea
    IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        p_user_id := NULL;
    END IF;

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

    SELECT * INTO v_parking FROM parkings WHERE id = v_lock.parking_id;
    
    v_hours := EXTRACT(EPOCH FROM (v_lock.end_time - v_lock.start_time)) / 3600.0;
    IF v_hours < 0.5 THEN
        v_hours := 1.0;
    END IF;

    v_total_price := ROUND(v_hours * v_parking.price_per_hour, 2);
    v_booking_code := 'PK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- Asegurar user_id válido para la reserva definitiva
    IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        SELECT id INTO p_user_id FROM users ORDER BY id ASC LIMIT 1;
    END IF;

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

    UPDATE space_locks
    SET status = 'converted',
        updated_at = NOW()
    WHERE id = p_lock_id;

    UPDATE parking_spaces
    SET status = 'reserved'
    WHERE id = v_lock.space_id;

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

-- ----------------------------------------------------------------------------
-- TRIGGER DE INTEGRIDAD: previene solapamiento directo en reservations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_reservation_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status IN ('pending', 'confirmed') AND NEW.space_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM reservations
            WHERE space_id = NEW.space_id
              AND date = NEW.date
              AND id <> COALESCE(NEW.id, 0)
              AND status IN ('pending', 'confirmed')
              AND start_time < NEW.end_time
              AND end_time > NEW.start_time
        ) THEN
            RAISE EXCEPTION 'La plaza ya se encuentra reservada para esa franja horaria.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_reservation_overlap ON reservations;
CREATE TRIGGER trg_prevent_reservation_overlap
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_reservation_no_overlap();
