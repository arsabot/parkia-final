# GUÍA RÁPIDA DE EJECUCIÓN — PARKIA

Este documento explica cómo levantar el proyecto completo (**Backend Django + Frontend React**) de forma rápida y sencilla.

---

## ⚡ Método 1: Inicio Rápido con 1 Solo Comando (Recomendado)

En la raíz del proyecto contamos con un script automatizado que se encarga de crear el entorno virtual, instalar dependencias, migrar la base de datos y levantar ambos servidores en simultáneo:

```bash
chmod +x start.sh
./start.sh
```

Una vez ejecutado, tendrás disponible:
- 🌐 **Frontend (Web):** [http://localhost:5173](http://localhost:5173) (o `http://127.0.0.1:5173`)
- 🔌 **Backend API:** [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
- 🛠️ **Panel Django Admin:** [http://127.0.0.1:8000/admin-django/](http://127.0.0.1:8000/admin-django/)

*Para detener ambos servidores, simplemente presiona `Ctrl + C` en esa terminal.*

---

## 🛠️ Método 2: Inicio Manual (Paso a Paso)

Si prefieres ejecutar el Backend y el Frontend en dos terminales independientes:

### Terminal 1: Backend (Django)

1. Abrir terminal y entrar a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Crear y activar el entorno virtual de Python:
   ```bash
   python3 -m venv venv
   source venv/bin/activate       # En Windows: venv\Scripts\activate
   ```

3. Instalar las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```

4. Aplicar las migraciones a la base de datos:
   ```bash
   python manage.py migrate
   ```

5. *(Opcional, primera vez)* Cargar los datos de prueba iniciales:
   ```bash
   python manage.py seed_data
   ```

6. Iniciar el servidor Django:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

---

### Terminal 2: Frontend (React + Vite)

1. Abrir una segunda terminal y entrar a la carpeta frontend:
   ```bash
   cd frontend
   ```

2. Instalar los paquetes npm:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en [http://localhost:5173](http://localhost:5173).

---

## 🔑 Cuentas de Prueba Pre-cargadas

Para probar la plataforma sin necesidad de registrarte, puedes usar los botones **"Demo Conductor"** y **"Demo Admin"** en el Navbar o ingresar con:

| Rol | Email | Contraseña | Descripción |
| :--- | :--- | :--- | :--- |
| **Conductor** | `conductor@parkia.com` | `parkia123` | Búsqueda en mapa, filtros, reservas y tickets QR. |
| **Administrador** | `admin@parkia.com` | `parkia123` | Panel de control, métricas, gestión de plazas y reservas. |

---

## 🧪 Ejecutar Tests

Para validar el correcto funcionamiento del backend:
```bash
cd backend
source venv/bin/activate
python manage.py test apps.users.test_users apps.parking.test_parking apps.reservations.test_reservations
```
Todos los 13 tests deben pasar exitosamente.
