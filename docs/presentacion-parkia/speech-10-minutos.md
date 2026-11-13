# GUION COMPLETO: PRESENTACIÓN ORAL DE PARKIA (10 MINUTOS EXACTOS)

**Duración total:** 10:00 minutos (600 segundos)  
**Velocidad de exposición recomendada:** 115 - 125 palabras por minuto (ritmo pausado, natural y profesional)  
**Idioma y registro:** Español rioplatense (argentino) natural, seguro, empático y orientado a producto real.

---

## ESTRUCTURA NARRATIVA Y CRONOGRAMA

```
[00:00 - 01:40] BLOQUE 1: VALOR DEL PROYECTO ────────── Caro (50s) + Flor (50s)
[01:40 - 03:10] BLOQUE 2: METODOLOGÍAS Y DESAFÍOS ──── Milagros (1m 30s)
[03:10 - 05:10] BLOQUE 3: BACKEND Y TECNOLOGÍAS ────── Mijail (1m) + Rodri (1m)
[05:10 - 06:50] BLOQUE 4: PROBLEMÁTICA DEL USUARIO ──── Priscila Torres (1m 40s)
[06:50 - 08:20] BLOQUE 5: IMPACTO Y ECONOMÍA ────────── Jennifer (1m 30s)
[08:20 - 10:00] BLOQUE 6: FRONTEND Y EXPERIENCIA ────── Ybam (1m 40s)
```

---

## BLOQUE 1: VALOR DEL PROYECTO (1 minuto 40 segundos)

### 1. Caro
* **Tema:** Apertura, presentación de Parkia, diferencial principal y relevancia.
* **Tiempo asignado:** 0:50 (50 segundos) — ~105 palabras.
* **Conceptos a enfatizar:** "Encontrá tu lugar antes de llegar", marketplace de dos puntas, garantía de lugar real (no una simple recomendación).

#### Texto literal para exponer:
> "Buenas tardes al jurado. Les hago una pregunta muy simple: ¿cuántas veces salieron con tiempo hacia una reunión, una consulta médica o a trabajar, y terminaron llegando tarde porque estuvieron veinte minutos dando vueltas a la manzana buscando dónde estacionar?
> 
> *(Pausa breve de 2 segundos)*
> 
> Para solucionar esto creamos **Parkia**. Parkia es una plataforma digital integral que conecta a conductores que necesitan estacionar con cocheras comerciales que tienen lugares libres en tiempo real. 
> 
> Nuestro diferencial no es decirte por dónde hay garajes como hace un mapa común; nuestro diferencial es que te aseguramos y bloqueamos tu plaza exacta antes de que salgas de tu casa, en menos de un minuto."

* **Frase de transición hacia Flor:**  
  *"Y para contarles qué propuesta de valor concreta le damos a cada parte de este mercado, le paso la palabra a Flor."*

---

### 2. Flor
* **Tema:** Propuesta de valor integral para conductores y dueños de garaje; promesa de marca.
* **Tiempo asignado:** 0:50 (50 segundos) — ~100 palabras.
* **Conceptos a enfatizar:** Solución bilateral (beneficio para quien maneja y para quien administra), cero inversión de hardware para el garaje, previsibilidad absoluta.

#### Texto literal para exponer:
> "Gracias, Caro. Parkia nace como un modelo de doble beneficio. 
> 
> Al conductor le devolvemos tranquilidad y tiempo: sabe de antemano el precio exacto por hora, elige qué comodidades necesita —como garaje techado, seguridad las 24 horas o cargador para autos eléctricos— y llega a la entrada con un código digital único, sin sorpresas ni tickets de papel.
> 
> Pero del otro lado resolvemos un problema gigantesco para los dueños de estacionamientos: las cocheras vacías en horarios de baja demanda. Les permitimos llenar esos espacios y digitalizar su operación diaria sin gastar un solo peso en sensores caros ni en molinetes nuevos; operan directo desde su celular o computadora."

* **Frase de transición hacia Milagros:**  
  *"Detrás de esta propuesta hubo un trabajo de desarrollo en equipo muy riguroso, y Milagros les va a contar cómo nos organizamos para construirlo."*

---

## BLOQUE 2: METODOLOGÍAS Y DESAFÍOS (1 minuto 30 segundos)

### 3. Milagros
* **Tema:** Metodología de trabajo, organización del equipo de 8 personas, control de calidad y resolución de desafíos.
* **Tiempo asignado:** 1:30 (90 segundos) — ~185 palabras.
* **Conceptos a enfatizar:** Trabajo en equipo coordinado, Git Flow estricto con Code Review obligatorio, 45 tests automatizados, mentalidad QA desde el día uno.

#### Texto literal para exponer:
> "Gracias, Flor. Organizar a un equipo de ocho desarrolladores para entregar una solución robusta requirió un marco de trabajo claro desde el primer día. 
> 
> Definimos un flujo de Git Flow estandarizado: la rama `main` protegida únicamente para versiones estables, ramas temáticas para cada funcionalidad y una regla innegociable: ningún Pull Request se integraba sin la revisión técnica cruzada de otro compañero del equipo. Nadie aprobaba su propio código.
> 
> Establecimos pautas estrictas de calidad: en el backend seguimos el estándar PEP 8 y construimos una suite de cuarenta y cinco pruebas automatizadas para blindar la lógica crítica, como evitar que dos personas reserven el mismo lugar a la misma hora. En el frontend, aplicamos análisis estático con Oxlint, logrando cero errores en más de setenta componentes.
> 
> Nuestro principal desafío no fue solo escribir código, sino coordinar dos visiones muy distintas: la velocidad que necesita el conductor en la calle y la simpleza que necesita el operador en la garita. Para lograrlo, iteramos los flujos hasta que la reserva se pudiera completar en tres pasos y el control de acceso en un solo escaneo."

* **Frase de transición hacia Mijail:**  
  *"Para conocer los cimientos que hacen posible este motor, Mijail les va a explicar la arquitectura de nuestro backend."*

---

## BLOQUE 3: BACKEND Y TECNOLOGÍAS UTILIZADAS (2 minutos)

### 4. Mijail
* **Tema:** Arquitectura del backend, Django REST Framework, modelo relacional y motor de disponibilidad horaria.
* **Tiempo asignado:** 1:00 (60 segundos) — ~125 palabras.
* **Conceptos a enfatizar:** Django 5 + DRF, cálculo relacional de disponibilidad horaria sin solapamiento, asignación inteligente de plazas estándar y accesibles (CUD).

#### Texto literal para exponer:
> "Gracias, Mili. En el backend elegimos Python con Django 5 y Django REST Framework porque necesitábamos solidez, escalabilidad y un ORM relacional de primer nivel.
> 
> El corazón de Parkia es nuestro motor de disponibilidad. No manejamos el estacionamiento como un stock estático; lo modelamos de forma temporal. Cuando un conductor selecciona una fecha y un rango de horario, el sistema ejecuta una validación relacional que compara intervalos de tiempo, asegurando de forma matemática que ninguna plaza pueda solaparse con otra reserva activa.
> 
> Además, implementamos asignación inteligente: el sistema prioriza cocheras estándar y protege las plazas adaptadas, reservándolas exclusivamente para conductores con Certificado Único de Discapacidad verificado."

* **Frase de transición hacia Rodri:**  
  *"Ahora Rodri les va a contar cómo protegemos esta información y cómo conectamos los pagos y accesos."*

---

### 5. Rodri
* **Tema:** Seguridad, autenticación, protección contra fuerza bruta, pasarela Mercado Pago y terminal de accesos por QR.
* **Tiempo asignado:** 1:00 (60 segundos) — ~120 palabras.
* **Conceptos a enfatizar:** JWT con rotación, bloqueo de fuerza bruta (Django Axes), Mercado Pago con webhooks firmados criptográficamente (HMAC), control de garita con QR.

#### Texto literal para exponer:
> "Gracias, Miji. La seguridad en Parkia está pensada de punta a punta. Implementamos autenticación mediante JSON Web Tokens con rotación automática, y para proteger los accesos integramos Django Axes, que bloquea automáticamente cualquier intento de ataque por fuerza bruta tras cinco intentos fallidos durante quince minutos.
> 
> Para los pagos, desarrollamos la integración con la API de Mercado Pago, gestionando la creación de preferencias y escuchando notificaciones automáticas mediante Webhooks protegidos con firma criptográfica HMAC-SHA256, lo que garantiza que ninguna orden pueda ser adulterada.
> 
> Cuando la reserva se confirma, se genera un código alfanumérico único `PK` y un código QR dinámico. El garajista solo tiene que apuntar la cámara de su celular o computadora, y en una fracción de segundo el sistema valida el ingreso y actualiza el estado de la plaza."

* **Frase de transición hacia Priscila Torres:**  
  *"Pero más allá de la tecnología, todo esto responde a necesidades humanas reales, y Priscila les va a explicar el problema desde la perspectiva del usuario."*

---

## BLOQUE 4: PROBLEMÁTICA DEL USUARIO (1 minuto 40 segundos)

### 6. Priscila Torres
* **Tema:** Perspectiva del usuario: el estrés y pérdidas del conductor frente a la ineficiencia del garajista tradicional.
* **Tiempo asignado:** 1:40 (100 segundos) — ~205 palabras.
* **Conceptos a enfatizar:** Empatía con el conductor en la calle, frustración del cartel "Completo", falta de previsibilidad, gestión prehistórica del garaje (cuadernos con birome), solución unificada de Parkia.

#### Texto literal para exponer:
> "Gracias, Rodri. Pensemos por un momento en lo que significa manejar hoy en la ciudad. Salís apurado, el tránsito está colapsado, y cuando por fin llegás a tu destino empieza la verdadera pesadilla: dar vueltas y vueltas a la manzana.
> 
> En promedio, perdemos más de veinte minutos buscando un lugar. Eso no es solo tiempo que no vuelve; es combustible que se quema sin sentido, es estrés, y muchas veces es llegar y encontrarse de frente con el cartel de 'Completo'. Es una incertidumbre total que arruina el día de cualquier persona. Y si encima tenés movilidad reducida, la situación es todavía más injusta, porque casi nunca sabés si vas a encontrar una plaza adaptada disponible.
> 
> Pero miremos la otra cara de la moneda: el dueño del garaje. Mientras en la calle la gente se desespera por estacionar, en su playa tiene un treinta y cinco por ciento de cocheras vacías en las horas valle. Y su forma de administrar sigue siendo prehistórica: anotan patentes a mano con una birome en un cuaderno, cobran con tickets de papel que se pierden y no tienen forma de avisarle a los conductores que están a tres cuadras que ahí hay lugar.
> 
> Parkia termina con esta desconexión absurda: al conductor le da certeza y control antes de arrancar el auto, y al garajista le da visibilidad y clientes que antes pasaban de largo."

* **Frase de transición hacia Jennifer:**  
  *"Y para entender cómo esta solución se traduce en impacto real y en un negocio sustentable, los dejo con Jennifer."*

---

## BLOQUE 5: IMPACTO Y ECONOMÍA (1 minuto 30 segundos)

### 7. Jennifer
* **Tema:** Modelo de negocio, viabilidad financiera, comisiones (15% Parkia / 85% garaje), proyecciones y sustentabilidad ambiental.
* **Tiempo asignado:** 1:30 (90 segundos) — ~185 palabras.
* **Conceptos a enfatizar:** Modelo marketplace de comisión (15%), cero costo marginal, caso de negocio de garaje (+1.8 millones ARS/mes), impacto ambiental demostrable (menos CO2).

#### Texto literal para exponer:
> "Gracias, Priscila. Parkia no necesita comprar terrenos ni construir cocheras: somos un modelo de marketplace tecnológico que aprovecha la infraestructura que ya existe en la ciudad.
> 
> Nuestro esquema de monetización es simple y transparente: por cada reserva confirmada a través de la plataforma, retenemos una comisión automática del quince por ciento, y el ochenta y cinco por ciento restante se liquida directamente al dueño del estacionamiento.
> 
> ¿Qué significa esto para un garaje mediano de cincuenta plazas? Que si gracias a Parkia ocupa apenas ocho cocheras extra por día en horarios valle, genera más de un millón ochocientos mil pesos netos adicionales al mes, con costo de hardware igual a cero.
> 
> Y para Parkia, al ser software en la nube, el costo marginal por procesar una nueva reserva es prácticamente nulo. Con una red inicial de cincuenta garajes en la ciudad, alcanzamos una facturación proyectada superior a los veinte millones de pesos mensuales con un margen de contribución altísimo.
> 
> Y lo más importante: generamos un impacto ambiental directo. Diversos estudios urbanos demuestran que el treinta por ciento del tráfico céntrico son autos buscando dónde estacionar. Al eliminar esas vueltas innecesarias, reducimos de manera concreta las emisiones de carbono en la ciudad."

* **Frase de transición hacia Ybam:**  
  *"Para ver cómo cobra vida todo esto en una experiencia de usuario simple e intuitiva, Ybam les va a mostrar el frontend."*

---

## BLOQUE 6: FRONTEND Y EXPERIENCIA DE USUARIO (1 minuto 40 segundos)

### 8. Ybam
* **Tema:** Interfaz de usuario, mapa interactivo, grilla de plazas, checkout, terminal de garita en vivo y cierre contundente.
* **Tiempo asignado:** 1:40 (100 segundos) — ~210 palabras.
* **Conceptos a enfatizar:** React 19 + TypeScript + Vite + Tailwind, mapa Leaflet fluido, grilla visual de cocheras, escáner de cámara integrado, cierre memorable.

#### Texto literal para exponer:
> "Gracias, Jenni. La mejor tecnología es la que no se siente. Por eso diseñamos la experiencia de Parkia con React 19, TypeScript y Tailwind CSS, priorizando velocidad, accesibilidad y claridad.
> 
> Cuando el usuario entra, se encuentra con una interfaz limpia, con soporte completo para modo claro y modo oscuro. En la pantalla de búsqueda, integramos un mapa interactivo con Leaflet que muestra en tiempo real los garajes cercanos, destacando los precios por hora sobre el mapa y permitiendo filtrar al instante por garajes techados, abiertos veinticuatro horas o con cargador eléctrico.
> 
> Al ingresar al garaje, el conductor no solo ve fotos y opiniones de otros usuarios; ve una grilla visual con cada plaza individual —la A-cero-uno, la B-cero-cuatro—. Selecciona su lugar, elige pagar con Mercado Pago, tarjetas o en efectivo, y en segundos recibe su código y su QR digital con una celebración en pantalla.
> 
> Y del lado del operador, creamos la Terminal de Garita: con solo abrir la web en su teléfono, activa el escáner de cámara integrado, lee el QR del conductor, confirma el ingreso y la plaza cambia de estado automáticamente. Y si alguien llega por ventanilla sin reserva, puede registrarlo en un click con la función de ingreso directo.
> 
> Las cocheras ya están construidas; la tecnología ya está funcionando. Parkia es el puente digital que las conecta con la gente. Muchas gracias y quedamos a disposición del jurado para sus preguntas."

---

## RESUMEN DE CONTROL DE TIEMPOS

| Orden | Expositor | Bloque Temático | Tiempo Parcial | Tiempo Acumulado |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **Caro** | Apertura y Qué es Parkia | **0:50** | 0:50 |
| 2 | **Flor** | Propuesta de Valor y Relevancia | **0:50** | 1:40 |
| 3 | **Milagros** | Metodología de Trabajo y QA | **1:30** | 3:10 |
| 4 | **Mijail** | Backend, Django y Motor de Reservas | **1:00** | 4:10 |
| 5 | **Rodri** | Seguridad, Mercado Pago y QR | **1:00** | 5:10 |
| 6 | **Priscila Torres** | Problemática del Conductor y Garajista | **1:40** | 6:50 |
| 7 | **Jennifer** | Modelo de Negocio, Finanzas e Impacto | **1:30** | 8:20 |
| 8 | **Ybam** | Frontend, Experiencia y Cierre | **1:40** | **10:00** |

