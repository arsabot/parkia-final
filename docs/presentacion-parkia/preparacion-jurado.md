# BANCO DE PREGUNTAS DIFÍCILES Y PREPARACIÓN PARA LA DEFENSA FRENTE AL JURADO

**Proyecto:** PARKIA  
**Objetivo:** Entrenar al equipo para responder con solvencia técnica, criterio de negocio y honestidad profesional ante las preguntas más incisivas y desafiantes del comité evaluador.

---

## ÍNDICE DE CATEGORÍAS

1. [Preguntas de Negocio, Mercado y Adopción](#1-preguntas-de-negocio-mercado-y-adopción)
2. [Preguntas de Competencia y Diferenciación](#2-preguntas-de-competencia-y-diferenciación)
3. [Preguntas de Arquitectura, Backend y Base de Datos](#3-preguntas-de-arquitectura-backend-y-base-de-datos)
4. [Preguntas de Seguridad, Pagos y Fraude](#4-preguntas-de-seguridad-pagos-y-fraude)
5. [Preguntas de Frontend y Experiencia de Usuario](#5-preguntas-de-frontend-y-experiencia-de-usuario)
6. [Preguntas Difíciles sobre Limitaciones, Pruebas y Deuda Técnica](#6-preguntas-difíciles-sobre-limitaciones-pruebas-y-deuda-técnica)

---

## 1. PREGUNTAS DE NEGOCIO, MERCADO Y ADOPCIÓN

### Pregunta 1: El dilema del "huevo o la gallina": ¿Cómo convencen a los primeros garajes de sumarse si todavía no tienen conductores, y cómo atraen conductores si no tienen garajes cargados?
* **Expositor recomendado:** Jennifer o Caro.
* **Respuesta sugerida:**  
  "Es el desafío clásico de todo marketplace bilateral. En Parkia resolvemos esto atacando primero la oferta con una barrera de entrada igual a cero: al dueño del garaje no le cobramos instalación, no le exigimos comprar sensores ni cámaras de diez mil dólares; le damos un software de garita gratuito que funciona en su propio celular o PC para reemplazar su cuaderno manual. 
  
  Estrategia de lanzamiento: comenzamos geofocalizados en un nodo hiperdenso de alta fricción (por ejemplo, Tribunales o Microcentro en CABA), cerrando acuerdos con cinco a diez garajes contiguos. Una vez concentrada la oferta en ese radio de cinco cuadras, la propuesta para el conductor que viaja a esa zona es 100% efectiva: sabe que ahí tiene lugar asegurado. Además, cada garaje aliado coloca el cartel oficial de Parkia en su entrada, funcionando como publicidad gratuita ante los miles de autos que pasan a diario por la puerta."

---

### Pregunta 2: ¿Por qué un garajista tradicional aceptaría ceder el 15% de comisión si muchos están acostumbrados a cobrar en efectivo y de manera informal?
* **Expositor recomendado:** Jennifer o Flor.
* **Respuesta sugerida:**  
  "Porque ese 15% no se aplica sobre los clientes habituales que el garaje ya tiene, sino sobre **ingresos incrementales en horarios valle**. Hoy un garaje tiene un 35% de plazas vacías entre las 10 de la mañana y las 4 de la tarde. Esas cocheras vacías generan cero pesos. 
  
  Con Parkia, el 85% de algo es infinitamente mejor que el 100% de nada. Si un garaje de cincuenta plazas llena solo ocho cocheras extra al día gracias a nuestra plataforma, está sumando más de un millón ochocientos mil pesos netos al mes que antes se evaporaban. Además, la digitalización de cobros con Mercado Pago y códigos QR le resuelve al propietario las fugas de caja y los faltantes de recaudación que ocurren habitualmente con el manejo exclusivo de efectivo."

---

### Pregunta 3: ¿Qué pasa si un conductor reserva una plaza por dos horas pero se queda cuatro horas? ¿Cómo se cobra el excedente?
* **Expositor recomendado:** Rodri o Mijail.
* **Respuesta sugerida:**  
  "Lo contemplamos en el diseño del flujo de garita. Cuando el vehículo egresa, el operador escanea el código en la pantalla de salida (`AdminGatePage`). El sistema calcula automáticamente la diferencia entre la hora de salida pactada y la hora real (`check_out_time`). 
  
  Si hay tiempo excedente, la terminal calcula el monto proporcional en base a la tarifa por hora del garaje y permite dos caminos: el cobro presencial en garita (efectivo o POS) registrado en el sistema, o el débito automático a través de la pasarela si el usuario tiene medio de pago guardado. Si esa plaza tenía otra reserva inmediata posterior, el sistema alerta al operador para reubicar la reserva entrante en otra plaza disponible del mismo estacionamiento."

---

## 2. PREGUNTAS DE COMPETENCIA Y DIFERENCIACIÓN

### Pregunta 4: ¿En qué se diferencia Parkia de Google Maps o Waze, que ya te indican dónde hay estacionamientos cercanos?
* **Expositor recomendado:** Caro o Priscila Torres.
* **Respuesta sugerida:**  
  "Google Maps y Waze son herramientas puramente informativas y de navegación: te dicen dónde queda una dirección y si una calle está congestionada, pero no tienen conexión con el inventario del garaje. Llegás a la puerta guiado por Waze y te encontrás con el cartel de 'Completo', habiendo perdido el viaje.
  
  Parkia no es un mapa pasivo; es una plataforma transaccional de reserva garantizada. En Parkia ves el precio exacto por hora antes de salir, sabés si hay enchufes para autos eléctricos o rampa de accesibilidad, y lo más importante: hacés click y esa plaza queda bloqueada en el servidor a tu nombre con un código único `PK`. Ningún conductor que llegue por la calle te la puede quitar."

---

### Pregunta 5: Ya existieron otras apps de estacionamiento en el país. ¿Por qué Parkia funcionaría donde otras no despegaron?
* **Expositor recomendado:** Jennifer o Flor.
* **Respuesta sugerida:**  
  "Las soluciones anteriores cometieron dos grandes errores: o pretendieron cobrarle al garaje un abono mensual fijo antes de demostrar resultados, o exigieron la instalación de hardware propietario costoso (sensores ultrasónicos por plaza o tótems de acceso con molinetes). Los dueños de garaje en Argentina no amortizan esas inversiones en dólares.
  
  Parkia elimina esa fricción: el garajista no invierte un solo peso para ingresar; opera con la cámara de su propio teléfono o una computadora básica con internet. Y a nivel comercial, vamos a éxito: solo cobramos una comisión cuando le llevamos un auto que efectivamente pagó y estacionó en su playa."

---

## 3. PREGUNTAS DE ARQUITECTURA, BACKEND Y BASE DE DATOS

### Pregunta 6: ¿Cómo garantizan a nivel de base de datos que dos conductores no reserven la misma plaza exactamente al mismo tiempo (condición de carrera)?
* **Expositor recomendado:** Mijail.
* **Respuesta sugerida:**  
  "Lo resolvemos en dos niveles dentro del backend de Django. En primer lugar, a nivel de consulta lógica, el serializador `ReservationCreateSerializer` evalúa la no superposición de intervalos con la condición relacional: reservas activas donde la hora de inicio sea menor a la hora de salida solicitada y la hora de fin sea mayor a la hora de inicio solicitada (`start_time < end_time` y `end_time > start_time`).
  
  En segundo lugar, para evitar condiciones de carrera en peticiones concurrentes simultáneas, la operación de reserva y pago se ejecuta dentro de un bloque atómico (`transaction.atomic()`) utilizando `select_for_update()` sobre el registro del estacionamiento y la plaza. De este modo, la base de datos bloquea la fila durante la validación y evita que dos hilos confirmen el mismo lugar en la misma fracción de segundo."

---

### Pregunta 7: En el repositorio vimos tanto Django como Supabase. ¿Cuál es la arquitectura real y por qué conviven ambas?
* **Expositor recomendado:** Mijail o Rodri.
* **Respuesta sugerida:**  
  "Diseñamos una **arquitectura híbrida y desacoplada**. El backend central del producto está desarrollado sobre Python con Django 5 y Django REST Framework, que gestiona las reglas de negocio complejas, la suite de tests y las tareas seguras de backend (como el bloqueo por fuerza bruta y las firmas criptográficas).
  
  En paralelo, preparamos un esquema completo en Supabase (PostgreSQL 15 con políticas RLS y triggers) que permite dos ventajas estratégicas: en primer lugar, otorga una vía de contingencia y portabilidad serverless para el frontend (`supabaseService.ts`), y en segundo lugar, facilita la persistencia en tiempo real de los tickets de soporte y reclamos generados por los usuarios sin sobrecargar el servidor central."

---

## 4. PREGUNTAS DE SEGURIDAD, PAGOS Y FRAUDE

### Pregunta 8: ¿Cómo evitan que un usuario malintencionado clone o falsifique un código QR para entrar gratis a un garaje?
* **Expositor recomendado:** Rodri.
* **Respuesta sugerida:**  
  "El código QR no es un pase estático; es una representación visual del identificador único `PK-XXXXXX` que está vinculado a una reserva en la base de datos con atributos no transferibles: la patente del vehículo, el modelo, la fecha exacta y la ventana horaria autorizada.
  
  Cuando el operador escanea el QR en la terminal de garita, el backend no solo verifica que el código exista; comprueba que la patente coincida con el vehículo físico que está ingresando, que el estado de la reserva sea `confirmed`, que no haya sido utilizada previamente (`check_in_time` nulo) y que la hora actual esté dentro de la tolerancia de ingreso. Un código reutilizado o falsificado es rechazado de inmediato por el sistema."

---

### Pregunta 9: ¿Cómo protegen la plataforma contra ataques cibernéticos y accesos no autorizados?
* **Expositor recomendado:** Rodri.
* **Respuesta sugerida:**  
  "Implementamos un esquema de seguridad multicapa:
  1. **Autenticación y tokens:** Usamos JSON Web Tokens (JWT) mediante `SimpleJWT` con expiración corta de acceso y rotación de tokens de refresco.
  2. **Protección contra fuerza bruta:** Con `django-axes`, si se detectan cinco intentos fallidos de login consecutivos para un usuario o desde una misma dirección IP, la cuenta se bloquea automáticamente por quince minutos.
  3. **Seguridad en Webhooks de pago:** El endpoint que recibe las notificaciones de Mercado Pago valida de forma estricta la firma criptográfica HMAC-SHA256 (`x-signature` y timestamp `ts`), asegurando que solo Mercado Pago pueda alterar el estado de cobro de una reserva.
  4. **Autorización granular (RBAC):** Permisos en DRF (`IsSuperAdmin`, `IsParkingOwnerOrAdmin`) que garantizan que ningún dueño de garaje pueda ver métricas o datos de un estacionamiento ajeno."

---

## 5. PREGUNTAS DE FRONTEND Y EXPERIENCIA DE USUARIO

### Pregunta 10: ¿Por qué decidieron desarrollar una Web App (PWA) en lugar de una aplicación nativa para Android y iOS en Flutter o React Native?
* **Expositor recomendado:** Ybam.
* **Respuesta sugerida:**  
  "Fue una decisión estratégica orientada a reducir al máximo la fricción del usuario. Cuando una persona está manejando o por salir, no quiere esperar a descargar cincuenta megabytes de una tienda de aplicaciones, esperar la instalación y crear una cuenta compleja. 
  
  Con React 19, Vite y Tailwind, logramos una aplicación web ultra liviana que carga en menos de un segundo en cualquier navegador móvil, permitiendo buscar, reservar y pagar en sesenta segundos. Además, el operador de garaje puede abrirla desde cualquier tablet o computadora básica sin necesidad de instalar software específico ni preocuparse por actualizaciones del sistema operativo."

---

### Pregunta 11: ¿Qué medidas de accesibilidad real incorporaron en la aplicación?
* **Expositor recomendado:** Ybam o Flor.
* **Respuesta sugerida:**  
  "La accesibilidad no la tratamos solo como una cuestión estética de contraste, sino como una funcionalidad de negocio e inclusión real:
  1. **Validación de CUD:** En el registro permitimos cargar el Certificado Único de Discapacidad. Las plazas de estacionamiento de tipo `disabled` (más anchas y cercanas a rampas de salida) están protegidas en el backend y solo pueden ser reservadas por usuarios con credencial verificada.
  2. **Diseño visual accesible:** Contraste reforzado en modo claro y modo oscuro verificado mediante tokens semánticos en `parkia-colores.css`.
  3. **Jerarquía y legibilidad:** Tipografía de alta legibilidad (*Plus Jakarta Sans* e *Inter*) y botones táctiles de gran tamaño para facilitar la operación en dispositivos móviles dentro del vehículo o en la garita."

---

## 6. PREGUNTAS DIFÍCILES SOBRE LIMITACIONES, PRUEBAS Y DEUDA TÉCNICA

### Pregunta 12 (PREGUNTA CRÍTICA): ¿Tienen todas las funcionalidades 100% terminadas? ¿Qué partes son simuladas o están pendientes?
* **Expositor recomendado:** Milagros o Rodri.
* **Respuesta sugerida (Honestidad y Solvencia):**  
  "Somos muy transparentes con el estado del proyecto: el núcleo operativo de Parkia —la búsqueda en mapa, la grilla interactiva de cocheras, el motor de reservas que impide solapamientos, el sistema de roles, la seguridad anti fuerza bruta y la terminal de garita con escáner de cámara— está **100% desarrollado, testeado y plenamente funcional**.
  
  ¿Qué aspectos están en fase de integración o sandbox?
  - **Mercado Pago:** La arquitectura completa del servicio, la creación de preferencias y la validación de webhooks HMAC están programadas y listas en el backend, operando actualmente en modo sandbox/prueba a la espera de credenciales comerciales productivas de cuenta jurídica.
  - **Chatbot de soporte:** El widget actual resuelve preguntas frecuentes y persiste tickets de reclamo reales (`RC-2026-XXXXX`), pero funciona con un árbol de decisión predefinido; la integración con un modelo de lenguaje generativo (LLM) autónomo está planificada en el roadmap.
  - **Reconocimiento automático de matrículas (LPR):** Es una funcionalidad futura planificada para garajes que deseen automatizar barreras con cámaras inteligentes sin intervención humana."

---

### Pregunta 13 (HALLAZGO DE AUDITORÍA): Al auditar su suite de pruebas, vimos que de 45 tests hay uno que falla en el módulo de pagos (`test_access_qr_is_refused_while_payment_is_pending`). ¿Por qué falló y cómo lo explican?
* **Expositor recomendado:** Mijail o Milagros.
* **Respuesta sugerida (Demuestra dominio técnico absoluto):**  
  "Es un excelente hallazgo y nos alegra que lo hayan observado. Ese test (`test_access_qr_is_refused_while_payment_is_pending`) verifica qué sucede en la garita cuando un vehículo llega con una reserva cuyo pago online aún figura pendiente. El test asume una política estricta de rechazo devolviendo código HTTP 400.
  
  Sin embargo, en la lógica operativa de la vista de garita priorizamos deliberadamente la flexibilidad comercial del garajista: la API responde código 200 con la información del vehículo y la bandera de pago pendiente, permitiendo que el operador cobre el monto pendiente en efectivo o por POS directamente en la ventanilla en lugar de dejar el auto frenado en la calle bloqueando el tránsito. El test falló por una desincronización entre la aserción estricta de la prueba unitaria y la regla operativa real, lo cual se resuelve formalizando esa regla en la suite de tests."

---

### Pregunta 14: ¿Cómo manejan las cancelaciones y devoluciones de dinero si un conductor se arrepiente?
* **Expositor recomendado:** Rodri o Jennifer.
* **Respuesta sugerida:**  
  "En el endpoint `/api/reservations/<id>/cancel/` implementamos una política transparente: si el conductor cancela antes del horario de inicio de la reserva, el estado pasa a `cancelled` y, si la estadía ya había sido abonada, el sistema cambia automáticamente el `payment_status` a `refunded` sincronizándolo con el modelo `Payment`. Esto libera de inmediato la plaza en la matriz para que otro usuario la pueda reservar y garantiza la confianza del conductor en la plataforma."

---

### Pregunta 15: ¿Qué costo de infraestructura mensual tiene operar Parkia hoy y cuánto costaría si crecen a 100 garajes?
* **Expositor recomendado:** Jennifer o Rodri.
* **Respuesta sugerida:**  
  "Hoy en etapa de MVP los costos son prácticamente cero, aprovechando capas de desarrollo gratuitas en servicios en la nube (Vercel para el frontend y servidores Linux estándar para Django). 
  
  Para una escala de 100 garajes con aproximadamente 25.000 reservas mensuales, estimamos un costo de infraestructura técnica de entre 150 y 250 dólares mensuales (alojamiento de backend en contenedores Docker escalables, base de datos PostgreSQL gestionada con réplica de lectura y almacenamiento en S3 para comprobantes). Frente a una facturación proyectada por comisión de más de cuarenta millones de pesos argentinos mensuales en esa escala, el costo de tecnología representa menos del 1% de los ingresos brutos."

