# Migración de Parkia a Supabase (100% Serverless)

Este directorio contiene todo lo necesario para migrar la base de datos de **Parkia** a **Supabase** y operar la plataforma de manera 100% serverless en la nube, sin necesidad de levantar servidores Django locales ni túneles temporales.

---

## Archivos Generados

- **`supabase/schema_and_seed.sql`**: Script SQL completo e idempotente que contiene:
  1. Extensiones PostgreSQL (`uuid-ossp`, `pgcrypto`).
  2. Tablas del sistema (`users`, `roles`, `user_roles`, `parkings`, `parking_spaces`, `reservations`, `favorites`, `reviews`, `claims`).
  3. Políticas de seguridad **Row Level Security (RLS)** preconfiguradas para lectura pública de garajes y gestión de reservas en la web.
  4. **Datos semilla completos (Seeds)**:
     - 11 Estacionamientos reales de CABA con coordenadas y tarifas.
     - 200 Plazas de estacionamiento (estándar y accesibles para CUD/discapacidad).
     - 279 Reservas históricas y activas con patentes y códigos QR (`PK-XXXXXX`).
     - 6 Usuarios de prueba con roles asignados:
       - **Conductor**: `conductor@parkia.com` / `Parkia123!`
       - **Dueño Garaje**: `dueno@parkia.com` / `Parkia123!`
       - **Administrador**: `admin@parkia.com` / `Parkia123!`
       - **Conductor con Discapacidad (CUD verificado)**: `valeria.discapacidad@parkia.com` / `Parkia123!`
     - Reseñas con calificaciones y comentarios.

---

## Pasos para Activar Supabase en 2 Minutos

### 1. Crear el Proyecto en Supabase (Gratis)
1. Ingresa a [supabase.com](https://supabase.com) e inicia sesión (con GitHub o Google).
2. Haz clic en **"New Project"**.
3. Dale un nombre (ej. `parkia-db`), define una contraseña para la base de datos y selecciona la región más cercana (ej: `sa-east-1` São Paulo).

### 2. Ejecutar la Migración y Cargar los Datos
1. En el menú lateral izquierdo de tu proyecto Supabase, entra a **SQL Editor**.
2. Haz clic en **"New query"**.
3. Abre el archivo [`supabase/schema_and_seed.sql`](./schema_and_seed.sql), copia todo su contenido y pégalo en el editor SQL.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter` / `Cmd + Enter`).
5. ¡Listo! En el **Table Editor** verás todas las tablas pobladas con los datos de prueba.

### 3. Conectar el Frontend
1. En Supabase, ve a **Project Settings** (ícono de engranaje) > **API**.
2. Copia:
   - **Project URL** (ej: `https://xyzabcdefg.supabase.co`)
   - **Project API Key (anon / public)** (ej: `eyJh...`)
3. Pega esas claves en el archivo `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
4. Al hacer deploy en Cloudflare Pages (`npm run deploy`), la plataforma en [https://parkia.pages.dev](https://parkia.pages.dev) funcionará de forma independiente 24/7 en cualquier celular, tablet o computadora, sin requerir ningún servidor backend corriendo en tu máquina.

