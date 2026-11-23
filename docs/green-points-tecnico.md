# Documento Técnico: Programa Park for Good & Green Points

## 1. Visión General del Programa

**Park for Good** es el programa de impacto ambiental y social de **Parkia** que premia a los conductores que reservan con anticipación y se dirigen directamente a su estacionamiento reservado.

En la Ciudad Autónoma de Buenos Aires (CABA), buscar un lugar para estacionar demora en promedio **20 minutos**. Durante ese tiempo, se recorren aproximadamente **5 kilómetros** innecesarios y se emite **1 kilogramo de dióxido de carbono ($CO_2$)**.

Park for Good recompensa a los usuarios que evitan ese trayecto de búsqueda errática:
- **5 km** no conducidos.
- **1 kg de $CO_2$** no emitido a la atmósfera.
- **10 Green Points** acumulados por reserva.

---

## 2. Reglas del Sistema

1. **Acumulación de Puntos**:
   - Cada reserva finalizada otorga **10 Green Points**, **5 km ahorrados** y **1 kg de $CO_2$ evitado**.
   - **Condición excluyente**: Los puntos se acreditan **únicamente** si el personal del garaje validó el ingreso mediante el código QR (check-in registrado) y la reserva ya finalizó.
   - Si el usuario no asiste o cancela la reserva con anticipación, **no suma puntos**.
   - Unicidad: Una reserva nunca puede sumar puntos más de una vez (garantizado a nivel base de datos y modelo con `UniqueConstraint`).

2. **Canje y Descuento del 10%**:
   - Al acumular **100 Green Points**, en la siguiente reserva se aplica de forma automática un **10% de descuento**.
   - El saldo del usuario disminuye automáticamente en **100 puntos** al confirmar la reserva.
   - **Absorción del costo**: El descuento lo absorbe **100% Parkia** de su comisión. El propietario del estacionamiento cobra intacto su **85%** sobre el valor base de la reserva.
   - El descuento queda registrado de forma auditable en una tabla independiente (`GreenPointsDiscount`).

3. **Cancelaciones y Reembolsos**:
   - Si una reserva que ya había sumado puntos es cancelada o reembolsada, dichos puntos se descuentan (`refunded`).
   - El saldo de puntos del usuario **nunca puede quedar en negativo** (se limita al saldo actual disponible).
   - Si una reserva donde se aplicó el descuento del 10% es cancelada o reembolsada, los 100 puntos canjeados se **reintegran de inmediato** al usuario (`restored`).
   - El check-in en garita **rechaza cualquier intento de ingreso de una reserva cancelada**.

4. **Las Dos Causas de Park for Good**:
   - Parkia destina el **5% de su comisión** (15% del total de la reserva) a dos causas:
     1. **Ambiente**: Reforestación de árboles nativos en Argentina (ONGs aliadas: *PlantArg*, *Plantarse*).
     2. **Inclusión**: Accesibilidad universal para personas con discapacidad visual, auditiva e intelectual (ONGs aliadas: *Fundación Rumbos*, *Acceso Ya*, *Fundación TINC*).
   - Al usuario no se le cobra de más y el garajista no resigna ingresos. La donación es automática y financiada por Parkia.
   - La plataforma visibiliza el total acumulado donado a cada causa.

---

## 3. Parámetros de Configuración (`settings.py`)

Todos los valores clave se gestionan como variables de configuración parametrizables:

| Parámetro | Valor por Defecto | Variable de Entorno | Descripción |
| :--- | :--- | :--- | :--- |
| `GREEN_POINTS_PER_RESERVATION` | `10` | `GREEN_POINTS_PER_RESERVATION` | Puntos otorgados por reserva directa con check-in |
| `GREEN_POINTS_KM_SAVED_PER_RESERVATION` | `5.0` | `GREEN_POINTS_KM_SAVED_PER_RESERVATION` | Kilómetros no recorridos estimados por reserva |
| `GREEN_POINTS_CO2_SAVED_KG_PER_RESERVATION` | `1.0` | `GREEN_POINTS_CO2_SAVED_KG_PER_RESERVATION` | Kilogramos de CO₂ evitados por reserva |
| `GREEN_POINTS_REDEMPTION_THRESHOLD` | `100` | `GREEN_POINTS_REDEMPTION_THRESHOLD` | Puntos necesarios para aplicar el descuento |
| `GREEN_POINTS_DISCOUNT_PERCENT` | `10` | `GREEN_POINTS_DISCOUNT_PERCENT` | Porcentaje de descuento aplicado (10%) |
| `PARKIA_COMMISSION_PERCENT` | `15` | `PARKIA_COMMISSION_PERCENT` | Porcentaje de comisión estándar de Parkia (15%) |
| `CAUSE_ENVIRONMENT_COMMISSION_SHARE` | `5.0` | `CAUSE_ENVIRONMENT_COMMISSION_SHARE` | % de la comisión destinado a Medio Ambiente (5%) |
| `CAUSE_INCLUSION_COMMISSION_SHARE` | `5.0` | `CAUSE_INCLUSION_COMMISSION_SHARE` | % de la comisión destinado a Inclusión (5%) |

---

## 4. Arquitectura Backend (Python + Django)

### 4.1. Modelos (`apps/green_points/models.py`)

#### `GreenPointLedger`
Libro mayor contable inmutable para auditoría de movimientos de puntos:
- `user`: Usuario propietario.
- `reservation`: Reserva asociada (opcional).
- `points`: Valor entero con signo (+/-).
- `transaction_type`:
  - `earned`: +10 puntos por reserva finalizada con check-in.
  - `redeemed`: -100 puntos por aplicación de descuento.
  - `refunded`: Puntos descontados por cancelación/reembolso.
  - `restored`: +100 puntos reintegrados por cancelación de reserva con descuento.
  - `adjustment`: Ajustes manuales/administrativos.
- `description`: Motivo explicativo visible al usuario.
- `created_at`: Fecha y hora del movimiento.
- Restricción: `UniqueConstraint` en `(reservation, transaction_type='earned')` para prevenir duplicación a nivel base de datos.

#### `GreenPointsDiscount`
Registro auditable de descuentos aplicados:
- `reservation`: OneToOne con la reserva.
- `user`: Usuario beneficiario.
- `points_redeemed`: Cantidad de puntos debitados (100).
- `original_price`: Precio completo sin descuento ($).
- `discount_amount`: Monto bonificado ($).
- `discount_percent`: Porcentaje de descuento (10.00%).
- `final_price`: Precio final abonado ($).

### 4.2. Servicios Centrales (`apps/green_points/services.py`)

- `get_user_points_balance(user)`: Retorna el saldo neto acumulado actual (mínimo 0).
- `sync_user_points(user)`:
  - Detecta reservas finalizadas que tengan `check_in_time` registrado y no hayan cobrado puntos.
  - Verifica si alguna reserva con puntos fue cancelada/reembolsada y descuenta los puntos sin permitir saldo negativo.
  - Verifica si alguna reserva con descuento de 100 puntos fue cancelada/reembolsada y reintegra los 100 puntos.
- `handle_reservation_cancellation_or_refund(reservation)`: Disparado ante cancelaciones en `ReservationViewSet.cancel` y reembolsos en `pagos.services._apply_provider_payment`.
- `calculate_causes_totals()`: Calcula la recaudación global donada a cada causa a partir de las comisiones efectivas más la base inicial del MVP.
- `get_user_green_points_summary(user)`: Retorna el resumen consolidado (saldo, progreso al descuento, km, CO₂, historial y causas).

### 4.3. Endpoints REST (`config/urls.py` -> `apps/green_points/urls.py`)

- **`GET /api/green-points/`** (Autenticado):
  Retorna el estado de Green Points del usuario logueado:
  ```json
  {
    "balance": 100,
    "points_to_next_discount": 0,
    "has_discount_available": true,
    "discount_percent": 10,
    "redemption_threshold": 100,
    "km_saved": 50.0,
    "co2_saved_kg": 10.0,
    "completed_direct_trips": 10,
    "history": [...],
    "causes": {...}
  }
  ```
- **`GET /api/green-points/causes/`** (Público):
  Retorna las causas apoyadas, ONGs asociadas y montos acumulados donados.

- **`GET /api/reservations/check_availability/`**:
  Incluye el nodo `green_points` indicando si el usuario actual califica para el descuento del 10% en dicha cotización.

---

## 5. Arquitectura Frontend (React + TypeScript)

- **`src/services/greenPointsService.ts`**:
  Cliente API con métodos `getGreenPointsSummary()` y `getCausesSummary()`.
- **`src/components/greenPoints/GreenPointsCard.tsx`**:
  Tarjeta interactiva en **Mis Reservas** (`MyReservationsPage.tsx`):
  - Saldo en tiempo real y barra de progreso a los 100 puntos.
  - Métricas de impacto ($CO_2$ evitado en kg, km no conducidos).
  - Bloque de causas apoyadas con totales donados.
  - Botón para abrir el modal explicativo y modal con historial detallado de movimientos.
- **`src/components/greenPoints/ParkForGoodModal.tsx`**:
  Modal institucional que explica las 5 etapas del programa, la metodología de estimación de CO₂ y la propuesta de valor social y ambiental.
- **`src/pages/ParkingDetailPage.tsx`**:
  Muestra de manera transparente el desglose del 10% de descuento en el resumen de precios antes de confirmar la reserva, indicando que es absorbido por Parkia.
- **`src/pages/MyReservationsPage.tsx`**:
  Insignias visuales distintivas:
  - *Check-in validado • +10 Green Points*
  - *Descuento 10% Green Points (-$X)*

---

## 6. Procedimiento de Pruebas y Verificación

### Pruebas Unitarias del Backend
Para ejecutar los tests automatizados del módulo de Green Points:

```bash
cd backend
venv\Scripts\python manage.py test apps.green_points
```

La suite cubre 8 escenarios clave:
1. `test_points_calculation_on_completed_with_checkin`: Verificación de otorgamiento de 10 puntos y cómputo de métricas ecológicas al finalizar con check-in.
2. `test_points_not_earned_without_checkin`: Asegura que reservas sin check-in validado no reciban puntos.
3. `test_points_not_added_twice`: Protección contra doble acreditación de puntos.
4. `test_check_in_rejects_cancelled_reservation`: El personal no puede registrar ingreso sobre reservas canceladas.
5. `test_discount_applied_at_100_points`: Al alcanzar 100 puntos, la reserva aplica 10% de descuento y descuenta los 100 puntos.
6. `test_cancellation_restores_discount_points`: Cancelar una reserva bonificada reintegra los 100 puntos.
7. `test_cancellation_deducts_earned_points_without_negative_balance`: Si se cancela/reembolsa una reserva que sumó puntos, se descuentan sin permitir saldos negativos.
8. `test_causes_endpoint_and_summary_endpoint`: Integridad y disponibilidad de los endpoints REST públicos y privados.

### Compilación y Verificación de Frontend
```bash
cd frontend
npm run build
```
Valida que la compilación de TypeScript (`tsc -b`) y el bundle de Vite se generen sin advertencias ni errores.
