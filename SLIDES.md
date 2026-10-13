---
marp: true
theme: default
class: invert
paginate: true
header: 'PARKIA — El Airbnb de los Estacionamientos'
footer: 'Pitch Comercial & Modelo de Negocio'
style: |
  section {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #0b0f19;
    color: #f8fafc;
  }
  h1, h2, h3 {
    color: #ffffff;
  }
  .highlight {
    color: #3b82f6;
  }
  .success {
    color: #10b981;
  }
  .warning {
    color: #f59e0b;
  }
---

<!-- _class: invert lead -->
# PARKIA
### Encontrá tu lugar para estacionar <span class="highlight">antes de llegar</span>

**El "Airbnb de los estacionamientos urbanos":** Conectamos conductores con cocheras libres en tiempo real.

* Sin dar vueltas innecesarias
* Con tarifa transparente por hora
* Con reserva asegurada en menos de 60 segundos

---

## 1. El Problema (En Palabras Simples)

### Estacionar hoy es perder tiempo y dinero

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">

<div>

#### 🚗 Quien Maneja (Conductor)
* **20 minutos dando vueltas** a la manzana.
* **Gasto inútil de nafta** o batería eléctrica.
* **Estrés e incertidumbre:** llegar al trabajo o al médico y encontrar el cartel de *"Completo"*.

</div>

<div>

#### 🏢 Quien Cobra (Dueño de Garaje)
* **35% de cocheras vacías** en horarios valle.
* **Gestión con lápiz y papel:** tickets que se extravían y cobro lento.
* **Cero visibilidad digital:** no pueden captar a los miles de autos que pasan cerca.

</div>

</div>

---

## 2. ¿A Quién va Dirigido PARKIA?

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">

<div>

### 🚘 Conductores (B2C)
* Personas que van al trabajo, citas, compras o recitales.
* **Beneficio:** Reservan desde el celular, saben cuánto pagan y tienen su lugar asegurado.

</div>

<div>

### 🅿️ Garajes y Playas (B2B)
* Playas comerciales y cocheras con capacidad ociosa.
* **Beneficio:** Llenan sus horas muertas con clientes nuevos y controlan todo desde una tablet.

</div>

<div>

### 🏢 Empresas (B2B2C)
* Oficinas, hoteles o eventos con necesidades de parking.
* **Beneficio:** Abonos mensuales garantizados para empleados o clientes VIP.

</div>

</div>

---

## 3. ¿Cómo Funciona la App? (En 3 Pasos)

### Tan fácil como pedir un Uber

```
 [ 1. Buscás en el Mapa ]       [ 2. Elegís tu Cochera ]       [ 3. Llegás y Entrás ]
  Ves precios claros por hora    Horario y plaza (ej: A-04)     Mostrás código PK-8924
  Filtros: Techado, EV, CCTV     Cálculo exacto del costo       Sin tickets de papel
```

1. **Buscás:** Abrís la web, ves los estacionamientos cercanos y comparás precios.
2. **Elegís tu lugar:** Seleccionás la franja horaria y la cochera exacta que querés.
3. **Estacionás sin fricción:** Llegás, mostrás tu código digital `PK-XXXXXX` y listo.

---

## 4. ¿Cómo Funciona el Negocio?

### Modelo Marketplace: Sin comprar terrenos ni inmuebles

1. **El Conductor** paga su estadía a través de la plataforma.
2. **El Dueño del Garaje** recibe clientes que antes no tenía y cobra el 85%-90%.
3. **PARKIA comisiona** automáticamente un **10% al 15%** por cada reserva.

#### 2 Fuentes de Ingreso Principales:
* **Comisión por Reserva (Take-Rate):** Ganamos cada vez que un auto estaciona.
* **Abono Mensual SaaS para Garajes:** Cobro mensual ($40 - $80 USD/mes) por el software de gestión y estadísticas.

---

## 5. La Rentabilidad: ¿Cuánto se Gana?

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">

<div>

### 🏢 Para el Dueño del Garaje
* **Garaje mediano:** 50 cocheras.
* **Llenando solo 10 cocheras extra al día:**
* **+$750.000 / mes** de facturación neta extra.
* <span class="success">**Inversión inicial: $0** (usa un celular o tablet).</span>

</div>

<div>

### ⚡ Para la Empresa PARKIA
* **Costo marginal por reserva:** Casi $0 (Nube).
* **Con solo 50 garajes en la red:**
* **+$5.500.000 / mes** de ingresos recurrentes.
* <span class="highlight">**Margen bruto superior al 80%.**</span>

</div>

</div>

---

## 6. Proyección Financiera (Año 1)

* **Efecto Red Local:** Más cocheras atraen más conductores; más conductores atraen más garajes.
* **Marketing de Costo Casi Cero:** Los garajes colocan el cartel de PARKIA en su entrada, promocionando la app ante miles de autos al día.
* **Escalabilidad Geográfica:** El sistema se puede encender en cualquier ciudad sin cambios de software.

| Hito | Garajes Adheridos | Reservas Mensuales |
| :--- | :---: | :---: |
| **Mes 3** | 30 garajes | 1.500 reservas |
| **Mes 6** | 75 garajes | 4.200 reservas |
| **Mes 12** | 240 garajes | 18.500 reservas |

---

## 7. ¿Por Qué PARKIA Supera a los Demás?

* 🎯 **Lugar exacto garantizado:** No "buscá si hay lugar", sino cochera asignada con número (A-04).
* 🔌 **Listo para autos eléctricos:** Filtro de cargadores EV para el segmento premium.
* ⚡ **Sin descargar apps pesadas:** Funciona en 2 segundos desde cualquier navegador móvil.
* 💡 **Cero inversión para el garaje:** No requiere cámaras ni sensores caros de miles de dólares.

---

## 8. El Proyecto Hoy: 100% Funcional

* ✅ **Software terminado y probado:** Frontend en React 19 + Backend en Django REST.
* 🅿️ **+10 Estacionamientos cargados:** Con fotos reales, tarifas y plazas individuales.
* 🧪 **13 Tests automáticos aprobados:** Garantizan que nunca haya dos autos en una misma plaza.
* 🚀 **Modo Demo en 1 Click:** Pruebe como Conductor o Administrador desde la web.

---

<!-- _class: invert lead -->
# PARKIA

> *"Las cocheras ya están construidas. PARKIA las conecta con quienes las necesitan."*

### Probá la demo en vivo:
* Iniciá el proyecto: `./start.sh`
* Abrí `slides.html` en tu navegador para ver la presentación interactiva.
* Contacto: **info@parkia.com**
