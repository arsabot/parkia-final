# HOJA DE RUTA Y RESUMEN RÁPIDO PARA EL EQUIPO (CHEATSHEET)

**Objetivo:** Coordinación perfecta entre los 8 expositores para cumplir los **10:00 minutos exactos**, con narrativa continua, sin repeticiones y con transiciones fluidas.

---

## REGLAS DE ORO DE LA PRESENTACIÓN EN EQUIPO

1. **El pase de palabra es sagrado:** Cada expositor debe memorizar su **frase de salida** para pasarle la palabra a su compañero por su nombre. Esto transmite profesionalismo y cohesión.
2. **No pises los temas de tus compañeros:** Cada persona es dueña exclusiva de su área. Si hablás de temas de otros, rompés el cronograma y el jurado siente desorganización.
3. **Mantené el ritmo (115-125 palabras por minuto):** No corras. Hacé pausas de uno o dos segundos tras ideas clave para que el jurado las procese.
4. **Solidaridad en el escenario:** Si un compañero se traba o duda un segundo, el siguiente expositor o el líder del bloque toma la palabra con una sonrisa natural y continúa sin evidenciar nerviosismo.

---

## TABLA DE ROLES Y RESPONSABILIDADES POR EXPOSITOR

### 1. CARO
* **Área:** Apertura, presentación de Parkia, diferencial y relevancia.
* **Tiempo asignado:** **0:50 (50 segundos)** — Inicio en `00:00` | Fin en `00:50`.
* **Conceptos clave que DEBE enfatizar:**
  1. Gancho inicial: La frustración real de perder 20 minutos buscando estacionamiento.
  2. Definición clara: Marketplace que conecta conductores con cocheras comerciales en tiempo real.
  3. Diferencial principal: No es un mapa informativo pasivo; es **reserva y garantía de lugar en 60 segundos antes de salir de casa**.
* **Lo que NO debe mencionar:**
  - No profundizar en la arquitectura ni nombrar tecnologías (le corresponde a Mijail y Rodri).
  - No detallar números de comisiones ni porcentajes financieros (le corresponde a Jennifer).
* **Frase de entrada:** *"Buenas tardes al jurado. Les hago una pregunta muy simple: ¿cuántas veces salieron con tiempo..."*
* **Frase de salida / Transición:** *"Y para contarles qué propuesta de valor concreta le damos a cada parte de este mercado, le paso la palabra a Flor."*

---

### 2. FLOR
* **Área:** Propuesta de valor integral para conductores y garajes; promesa de marca.
* **Tiempo asignado:** **0:50 (50 segundos)** — Inicio en `00:50` | Fin en `01:40`.
* **Conceptos clave que DEBE enfatizar:**
  1. Solución bilateral (beneficio simultáneo para quien maneja y para quien administra).
  2. Experiencia del conductor: Precios transparentes, filtros (techado, 24hs, cargador EV) y entrada sin tickets.
  3. Beneficio clave para el garajista: **Cero inversión de hardware ($0 USD)**; opera con su celular o PC actual.
* **Lo que NO debe mencionar:**
  - No hablar del flujo de Git ni de las pruebas unitarias (le corresponde a Milagros).
  - No explicar cómo funciona el escaneo de la cámara ni el código QR en detalle (le corresponde a Ybam y Rodri).
* **Frase de entrada:** *"Gracias, Caro. Parkia nace como un modelo de doble beneficio..."*
* **Frase de salida / Transición:** *"Detrás de esta propuesta hubo un trabajo de desarrollo en equipo muy riguroso, y Milagros les va a contar cómo nos organizamos para construirlo."*

---

### 3. MILAGROS
* **Área:** Metodología de desarrollo, organización del equipo de 8 personas y aseguramiento de calidad (QA).
* **Tiempo asignado:** **1:30 (90 segundos)** — Inicio en `01:40` | Fin en `03:10`.
* **Conceptos clave que DEBE enfatizar:**
  1. Organización del equipo: Git Flow con rama `main` protegida y ramas por funcionalidad (`feat/...`, `fix/...`).
  2. Cultura de revisión técnica: Ningún Pull Request se fusionó sin la revisión cruzada obligatoria de un compañero.
  3. Calidad demostrable: PEP 8 en backend con **45 pruebas automatizadas**, y análisis estático con Oxlint con **0 errores** en más de 70 componentes.
* **Lo que NO debe mencionar:**
  - No detallar las fórmulas matemáticas del backend (le corresponde a Mijail).
  - No describir los componentes visuales ni estilos CSS (le corresponde a Ybam).
* **Frase de entrada:** *"Gracias, Flor. Organizar a un equipo de ocho desarrolladores para entregar una solución robusta..."*
* **Frase de salida / Transición:** *"Para conocer los cimientos que hacen posible este motor, Mijail les va a explicar la arquitectura de nuestro backend."*

---

### 4. MIJAIL
* **Área:** Backend, Django REST Framework, modelo relacional y motor de disponibilidad horaria.
* **Tiempo asignado:** **1:00 (60 segundos)** — Inicio en `03:10` | Fin en `04:10`.
* **Conceptos clave que DEBE enfatizar:**
  1. Stack backend: Python con Django 5 y Django REST Framework por su solidez y ORM relacional.
  2. Motor de disponibilidad temporal: Validación matemática de no solapamiento de horarios (`start_time < end_time`).
  3. Asignación inteligente e inclusiva: Cocheras estándar prioritarias y protección de plazas accesibles exclusivas para usuarios con CUD verificado.
* **Lo que NO debe mencionar:**
  - No hablar de Mercado Pago ni de tokens JWT (le corresponde a Rodri).
  - No hablar de la interfaz gráfica ni de Recharts (le corresponde a Ybam).
* **Frase de entrada:** *"Gracias, Mili. En el backend elegimos Python con Django 5 y Django REST Framework..."*
* **Frase de salida / Transición:** *"Ahora Rodri les va a contar cómo protegemos esta información y cómo conectamos los pagos y accesos."*

---

### 5. RODRI
* **Área:** Seguridad integral, autenticación, protección contra fuerza bruta, pasarela Mercado Pago y accesos por QR.
* **Tiempo asignado:** **1:00 (60 segundos)** — Inicio en `04:10` | Fin en `05:10`.
* **Conceptos clave que DEBE enfatizar:**
  1. Seguridad de accesos: Tokens JWT con rotación y bloqueo por fuerza bruta con **Django Axes** (bloqueo tras 5 intentos fallidos por 15 min).
  2. Pagos seguros: Integración con Mercado Pago mediante Webhooks protegidos con firma criptográfica HMAC-SHA256.
  3. Control en garita: Código dinámico `PK-XXXXXX` y QR validable por cámara en fracciones de segundo.
* **Lo que NO debe mencionar:**
  - No hablar de las pérdidas de tiempo en el tránsito ni del estrés urbano (le corresponde a Priscila).
  - No dar proyecciones de facturación mensual ni márgenes de ganancia (le corresponde a Jennifer).
* **Frase de entrada:** *"Gracias, Miji. La seguridad en Parkia está pensada de punta a punta..."*
* **Frase de salida / Transición:** *"Pero más allá de la tecnología, todo esto responde a necesidades humanas reales, y Priscila les va a explicar el problema desde la perspectiva del usuario."*

---

### 6. PRISCILA TORRES
* **Área:** Problemática del usuario: el dolor del conductor frente a la ineficiencia del garajista tradicional.
* **Tiempo asignado:** **1:40 (100 segundos)** — Inicio en `05:10` | Fin en `06:50`.
* **Conceptos clave que DEBE enfatizar:**
  1. Empatía con el conductor: Pérdida de 20 minutos por viaje, combustible malgastado, estrés y el impacto del cartel "Completo".
  2. Inclusión: La doble frustración de conductores con movilidad reducida que nunca saben si encontrarán plaza adaptada.
  3. El dolor del garajista: 35% de plazas vacías en horarios valle, cuadernos con birome y caja ciega sin canal digital.
* **Lo que NO debe mencionar:**
  - No dar los números de la comisión del 15% ni la facturación de la empresa (le corresponde a Jennifer).
  - No explicar la arquitectura de software ni las APIs (le correspondió a Mijail y Rodri).
* **Frase de entrada:** *"Gracias, Rodri. Pensemos por un momento en lo que significa manejar hoy en la ciudad..."*
* **Frase de salida / Transición:** *"Y para entender cómo esta solución se traduce en impacto real y en un negocio sustentable, los dejo con Jennifer."*

---

### 7. JENNIFER
* **Área:** Modelo de negocio, viabilidad financiera, proyecciones y sustentabilidad ambiental.
* **Tiempo asignado:** **1:30 (90 segundos)** — Inicio en `06:50` | Fin en `08:20`.
* **Conceptos clave que DEBE enfatizar:**
  1. Modelo Marketplace: Cero activos físicos inmobiliarios, cobro por comisión del **15% por reserva confirmada (85% para el dueño)**.
  2. Viabilidad con números concretos: Un garaje mediano (50 plazas) que llena solo 8 cocheras extra al día suma **+$1.850.000 ARS netos al mes**.
  3. Escalabilidad e impacto ambiental: Costo marginal cercano a cero; red de 50 garajes factura más de \$20.000.000 ARS/mes con reducción directa de emisiones de CO2 al evitar el 30% del tráfico que busca estacionar.
* **Lo que NO debe mencionar:**
  - No describir los componentes de React ni las pantallas de la app (le corresponde a Ybam).
  - No volver a explicar la metodología de Git ni el trabajo en equipo (ya lo cubrió Milagros).
* **Frase de entrada:** *"Gracias, Priscila. Parkia no necesita comprar terrenos ni construir cocheras..."*
* **Frase de salida / Transición:** *"Para ver cómo cobra vida todo esto en una experiencia de usuario simple e intuitiva, Ybam les va a mostrar el frontend."*

---

### 8. YBAM
* **Área:** Frontend, experiencia de usuario (UX/UI), terminal de garita en vivo y cierre contundente.
* **Tiempo asignado:** **1:40 (100 segundos)** — Inicio en `08:20` | Fin en `10:00`.
* **Conceptos clave que DEBE enfatizar:**
  1. Stack visual moderno: React 19, TypeScript, Tailwind CSS, soporte modo claro/oscuro.
  2. Recorrido del conductor: Mapa interactivo con Leaflet con pines de precio, grilla de plazas individuales (A01, B02...) y checkout con confirmación inmediata.
  3. Terminal de Garita: Escáner de cámara integrado (`html5-qrcode`), check-in en un toque y botón de ingreso directo para clientes sin reserva.
  4. Cierre inspirador: *"Las cocheras ya están construidas; la tecnología ya está funcionando. Parkia es el puente digital que las conecta con la gente."*
* **Lo que NO debe mencionar:**
  - No volver a explicar el modelo de comisiones del 15% ni los costos de servidores.
  - No hablar de las librerías del backend (Django, SimpleJWT).
* **Frase de entrada:** *"Gracias, Jenni. La mejor tecnología es la que no se siente..."*
* **Frase de salida / Cierre final:** *"...Parkia es el puente digital que las conecta con la gente. Muchas gracias y quedamos a disposición del jurado para sus preguntas."*

---

## CRONOGRAMA SINÓPTICO PARA EL MODERADOR DEL EQUIPO

```
Minuto  0:00 ──► Caro arranca con el gancho y definición de Parkia
Minuto  0:50 ──► Pase a Flor (propuesta de valor bilateral)
Minuto  1:40 ──► Pase a Milagros (Git Flow, 45 tests, QA)
Minuto  3:10 ──► Pase a Mijail (Django 5, disponibilidad temporal, CUD)
Minuto  4:10 ──► Pase a Rodri (JWT, Axes, Mercado Pago, QR)
Minuto  5:10 ──► Pase a Priscila Torres (dolor humano, estrés, 35% ocioso)
Minuto  6:50 ──► Pase a Jennifer (15% comisión, +$1.8M garaje, impacto ambiental)
Minuto  8:20 ──► Pase a Ybam (React 19, Leaflet, Terminal Garita, Cierre)
Minuto 10:00 ──► APLAUSO FINAL Y APERTURA DE PREGUNTAS DEL JURADO
```

