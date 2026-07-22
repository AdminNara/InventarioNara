# Especificaciones funcionales — Levantamiento de inventario Nara

## Propósito

Demostrar un flujo móvil uniforme para registrar inventario por cliente y bodega, convertir cajas a unidades, controlar vencimientos, resolver omisiones y cerrar un levantamiento con trazabilidad. El prototipo debe sentirse como una aplicación real aunque use datos ficticios y almacenamiento local.

## Usuarios simulados

- **Contador — María López:** crea y retoma borradores, busca o escanea artículos, registra cantidades y envía a revisión.
- **Supervisor — Carlos Mena:** revisa cobertura, completa o confirma faltantes, cierra, reabre y administra artículos, clientes y bodegas.
- **Cambio de rol:** el chip de rol o Perfil abre un selector. Cambiar de rol modifica acciones y accesos visibles, pero no representa seguridad real.

## Objetivo observable

Un levantamiento cerrado debe contener una decisión explícita para cada artículo incluido en el alcance capturado al iniciar: cantidad mayor que cero o cantidad cero confirmada. Debe conservar cliente, bodega, responsables, fechas, lotes, observaciones y eventos del historial. Los cambios posteriores del catálogo no alteran retroactivamente ese alcance.

## Alcance

- Clientes activos con una o varias bodegas activas.
- Catálogo global de artículos y asignación de artículos activos por cliente.
- Un levantamiento pertenece a una bodega y verifica el surtido activo del cliente.
- Conteo por caja o unidad, conversión a unidades, lotes y vencimientos cuando correspondan.
- Borradores con guardado automático y vigencia editable de 24 horas.
- Estados Borrador, En revisión y Cerrado; un borrador vencido es una condición del estado Borrador.
- Reapertura supervisada con motivo obligatorio.
- Administración local simulada de artículos, clientes, bodegas y asignaciones.
- Persistencia ficticia en `localStorage` y restablecimiento del escenario inicial.

## Fuera de alcance

Backend, base de datos remota, autenticación, autorización real, datos productivos, sincronización entre dispositivos, modo sin conexión productivo, ERP, notificaciones, auditoría legal, Supabase, Vercel y despliegue. La cámara se usa únicamente en el navegador local para leer Code 128; no guarda ni transmite imágenes.

## Reloj de demostración

- Usa por defecto el instante fijo `2026-07-17 22:00` en la zona `America/Managua`.
- El borrador de Distribuidora El Ahorro inicia a las `16:00` y vence el `2026-07-18 16:00`; por eso muestra 18 horas restantes.
- Perfil ofrece controles de demostración para avanzar 7 horas, avanzar 19 horas y restaurar el reloj.
- Toda fecha, tiempo restante y vencimiento se calcula desde este reloj, no desde textos escritos manualmente.

## Modelo de estados

| Estado | Quién puede modificar | Acciones permitidas | Transición |
|---|---|---|---|
| Borrador vigente | Contador responsable | Contar, editar, guardar y enviar | En revisión |
| Borrador vencido | Nadie desde el conteo | Consultar y solicitar habilitación simulada | Borrador vigente por acción del Supervisor |
| En revisión | Supervisor | Registrar faltantes, confirmar cero y cerrar | Cerrado |
| Cerrado | Nadie | Consultar, revisar historial y reabrir | En revisión |

La reapertura conserva todas las líneas y agrega un evento al historial. No borra el cierre anterior.

## Flujo principal

1. El Contador abre Nuevo levantamiento.
2. Selecciona un cliente activo y luego una bodega activa del cliente.
3. El sistema crea un borrador, registra responsable, fecha de inicio y vencimiento a 24 horas.
4. El Contador busca o escanea un artículo asignado, elige Caja o Unidad e ingresa un entero no negativo.
5. El sistema calcula el total en unidades. Si el artículo aplica vencimiento, requiere al menos un lote completo.
6. Guardar actualiza o crea la línea del artículo, recalcula el progreso y confirma el guardado.
7. Enviar a revisión cambia el estado y registra el evento.
8. El Supervisor resuelve los artículos faltantes registrando conteo o confirmando cero.
9. Con cero pendientes, Cerrar levantamiento solicita confirmación, registra fecha y responsable, y deja el resultado en solo lectura.
10. Reabrir exige motivo, agrega un evento y devuelve el levantamiento a En revisión.

## Reglas funcionales

### Inicio y navegación

- **REQ-001:** Todas las pantallas usan rutas navegables y un historial que permite Atrás sin perder cambios ya guardados.
- **REQ-002:** La navegación inferior contiene Levantamientos, Catálogo y Perfil en ese orden. La opción activa se indica con color, texto y marcador superior.
- **REQ-003:** El rol seleccionado persiste localmente. El Contador puede consultar Catálogo en solo lectura; el Supervisor ve las acciones administrativas.

### Levantamientos

- **REQ-004:** Mis levantamientos agrupa En curso y Recientes, y ordena cada grupo desde el evento más nuevo.
- **REQ-005:** Nuevo levantamiento requiere cliente y bodega. Bodega permanece deshabilitada hasta seleccionar cliente y se limpia si cambia el cliente.
- **REQ-006:** No se puede crear otro borrador vigente para la misma combinación de cliente y bodega. Se ofrece Continuar borrador.
- **REQ-007:** Al iniciar se guardan identificadores de cliente, bodega y responsable, `startedAt`, `expiresAt`, estado, historial inicial y `scopeArticleIds` con los artículos activos asignados en ese instante.
- **REQ-008:** Cada cambio válido se guarda localmente. La interfaz muestra el momento del último guardado y las horas restantes.
- **REQ-009:** Al vencer las 24 horas, el borrador se vuelve de solo lectura y explica cómo reactivarlo en modo Supervisor.

### Búsqueda, escaneo y conteo

- **REQ-010:** La búsqueda coincide parcialmente y sin distinguir mayúsculas con nombre o código, muestra máximo ocho resultados y ofrece estado sin coincidencias.
- **REQ-011:** Escanear solicita la cámara trasera mediante `getUserMedia` y usa `BarcodeDetector` configurado exclusivamente para `code_128`. Una coincidencia asignada selecciona el artículo; un código desconocido y un artículo conocido fuera del alcance se explican por separado. Si falta soporte, cámara o permiso, el diálogo permite ingresar manualmente el Code 128 o código interno. La cámara y el ciclo de detección se detienen al reconocer, cerrar, navegar u ocultar la pestaña.
- **REQ-012:** Seleccionar un artículo ya contado carga sus datos para edición; guardarlo reemplaza la línea existente.
- **REQ-013:** Caja solo está disponible si el factor es mayor que uno. Unidad siempre está disponible.
- **REQ-014:** La cantidad acepta únicamente dígitos que representen un entero entre 0 y 999999. Vacío, espacios, signos, letras, decimales y negativos son inválidos.
- **REQ-015:** Para Caja, `totalUnits = quantity × unitsPerBox`; para Unidad, `totalUnits = quantity`.
- **REQ-016:** Los mensajes de error aparecen solo después de una entrada inválida o intento de guardar. Un valor válido muestra ayuda neutral y el total calculado.
- **REQ-017:** La observación es opcional, elimina espacios al inicio y final, y permite hasta 200 caracteres.

### Lotes y vencimientos

- **REQ-018:** Un artículo con `appliesExpiry = true` requiere al menos un lote con cantidad y fecha antes de guardar.
- **REQ-019:** Cada lote guarda identificador, orden visible, unidad elegida, cantidad, unidades calculadas, fecha y observación.
- **REQ-020:** Se permiten fechas pasadas, actuales y futuras para reflejar inventario vencido; las fechas pasadas se etiquetan como Vencido sin bloquear el guardado.
- **REQ-021:** Agregar lote valida primero el lote actual y luego abre un formulario vacío. Editar conserva el resto de lotes. Eliminar requiere confirmación cuando quedaría al menos otro lote.
- **REQ-022:** Total registrado es la suma de `totalUnits` de todos los lotes. El progreso del levantamiento aumenta una sola vez por artículo, sin importar el número de lotes.
- **REQ-023:** Guardar lotes permanece deshabilitado si existe un lote incompleto y muestra el motivo junto al lote afectado.

### Revisión y cierre

- **REQ-024:** En revisión se comparan las líneas con `scopeArticleIds`, la fotografía de artículos activos asignados al iniciar. Altas, bajas o desactivaciones posteriores no cambian el denominador del levantamiento en curso.
- **REQ-025:** Cada pendiente indica nombre, conteo anterior inmediato cuando exista y acciones disponibles.
- **REQ-026:** Registrar conteo abre la captura del artículo y, al guardar, vuelve a Revisión de cobertura.
- **REQ-027:** Confirmar cero abre un diálogo con artículo y conteo anterior. Al confirmar, crea una línea explícita con cero unidades y `zeroConfirmed = true`.
- **REQ-028:** Cerrar permanece deshabilitado mientras existan pendientes y explica cuántos faltan.
- **REQ-029:** Con cero pendientes, Cerrar abre una confirmación con cliente, bodega y total de artículos. Confirmar registra responsable, fecha y evento.
- **REQ-030:** La pantalla Cerrado es de solo lectura y muestra resumen, responsables, fechas e historial.
- **REQ-031:** Reabrir solo está disponible para el Supervisor. Requiere un motivo no vacío de hasta 300 caracteres, registra responsable y fecha, y cambia a En revisión.

### Administración

- **REQ-032:** Catálogo busca por nombre o código y filtra Todos, Activos e Inactivos.
- **REQ-033:** Nuevo artículo y Editar artículo usan un formulario con nombre, código, presentación, unidades por caja, aplica vencimiento y estado.
- **REQ-034:** Nombre y código son obligatorios; el código es único sin distinguir mayúsculas; unidades por caja es un entero entre 1 y 9999.
- **REQ-035:** Desactivar un artículo impide asignarlo a nuevos clientes, pero conserva conteos históricos.
- **REQ-036:** Clientes y bodegas busca por cliente, expande o contrae cada tarjeta y conserva un solo cliente expandido a la vez.
- **REQ-037:** Nuevo cliente requiere nombre único y estado. Agregar bodega requiere nombre único dentro del cliente y estado.
- **REQ-038:** Un cliente o bodega inactivos no pueden seleccionarse para un levantamiento nuevo, pero su historial permanece consultable.
- **REQ-039:** Gestionar artículos asignados permite activar o desactivar relaciones cliente-artículo y actualiza inmediatamente UI-02, UI-08 y los levantamientos futuros. Un levantamiento ya iniciado conserva su alcance capturado.

### Respuesta y accesibilidad

- **REQ-040:** Toda acción local muestra respuesta en menos de 300 ms; las cargas simuladas duran entre 300 y 600 ms y nunca bloquean sin indicador.
- **REQ-041:** Los mensajes de éxito se anuncian y desaparecen; los errores permanecen hasta corregirse o descartarse.
- **REQ-042:** La interfaz se puede usar con teclado, conserva foco visible, devuelve el foco al control que abrió un diálogo y no depende solo del color.
- **REQ-043:** Los campos tienen etiqueta asociada, los errores se vinculan al campo y los botones de solo ícono tienen nombre accesible.
- **REQ-044:** El diseño soporta 200 % de zoom, ancho de 360 a 430 px y preferencia de movimiento reducido sin perder contenido o acciones.

## Modelo de datos local

| Entidad | Campos mínimos |
|---|---|
| User | `id`, `name`, `role`, `avatar` |
| Client | `id`, `name`, `active` |
| Warehouse | `id`, `clientId`, `name`, `active`, `lastCountAt` |
| Article | `id`, `code`, `barcode?`, `name`, `presentation`, `unitsPerBox`, `appliesExpiry`, `active` |
| ClientArticle | `clientId`, `articleId`, `active` |
| InventoryCount | `id`, `clientId`, `warehouseId`, `counterId`, `scopeArticleIds`, `status`, `startedAt`, `expiresAt`, `submittedAt`, `closedAt`, `closedBy`, `reopenedAt` |
| CountLine | `id`, `countId`, `articleId`, `unitType`, `quantity`, `totalUnits`, `observation`, `zeroConfirmed` |
| Lot | `id`, `lineId`, `order`, `unitType`, `quantity`, `totalUnits`, `expiryDate`, `observation` |
| HistoryEvent | `id`, `countId`, `type`, `actorId`, `occurredAt`, `reason` |

## Datos de demostración coherentes

### Usuarios

- María López — Contador.
- Carlos Mena — Supervisor.

### Clientes y bodegas

- Distribuidora El Ahorro — activo; Bodega central y Bodega sur activas.
- Supermercado La Unión — activo; Bodega norte y Bodega principal activas.
- Mayorista El Progreso — inactivo; Bodega principal inactiva.
- Mini Market San Juan — activo; Bodega principal activa.

### Catálogo

- 45 artículos globales: 41 activos y 4 inactivos.
- Distribuidora El Ahorro tiene 38 artículos activos asignados.
- Supermercado La Unión tiene los 41 artículos activos asignados.
- Mini Market San Juan tiene 15 artículos activos asignados.
- Mayorista El Progreso conserva asignaciones históricas, pero no admite nuevos levantamientos.
- Artículos visibles obligatorios:
  - ART-00125 — Café Nara clásico 250 g — caja de 24 — aplica vencimiento.
  - ART-00418 — Galletas Nara chocolate 6x12 — caja de 72 — no aplica vencimiento.
  - ART-00805 — Jugo Nara naranja 1 L — unidad — aplica vencimiento.
  - ART-00920 — Cereal Nara 450 g — caja de 12 — no aplica vencimiento.
- Completa el conjunto con 41 artículos deterministas. Los IDs `a-1001` a `a-1015` usan los nombres y códigos Code 128 de `codigos_de_barras_code128.pdf`; los restantes conservan códigos internos `ART-01016` a `ART-01041`. Los primeros 37 están activos y los últimos 4 inactivos; al menos cuatro activos adicionales aplican vencimiento.

### Escenarios iniciales

- Borrador vigente de Distribuidora El Ahorro / Bodega central: 12 de 38 artículos; María López; 18 horas restantes.
- En revisión de Supermercado La Unión / Bodega norte: alcance histórico de 38 artículos y 35 resueltos; pendientes Galletas, Jugo y Cereal. Después de iniciar se asignaron tres artículos adicionales, por lo que UI-08 muestra 41 activos sin alterar este levantamiento.
- Cerrado de Mini Market San Juan / Bodega principal: 15 de 15 artículos validados el 16 jul 2026.
- Para demostrar UI-06 con 38 de 38, incluye además un cerrado consultable de Distribuidora El Ahorro.
- Galletas muestra 48 unidades en el levantamiento anterior; Cereal muestra 0; Jugo no tiene conteo previo.
- Café incluye dos lotes: 2 cajas con vencimiento 15 dic 2026 y 48 unidades con vencimiento 20 ene 2027; total 96 unidades.

## Criterios de aceptación

- **AC-001:** La aplicación inicia en UI-01, muestra los tres grupos de estado y todas las tarjetas visibles navegan al destino correcto.
- **AC-002:** Cambiar a Supervisor desde el chip actualiza acciones y persiste después de recargar.
- **AC-003:** Elegir Distribuidora El Ahorro filtra exactamente dos bodegas y muestra 38 artículos asignados.
- **AC-004:** Iniciar sin cliente o bodega muestra error junto al campo; iniciar una combinación con borrador vigente ofrece Continuar borrador.
- **AC-005:** El borrador guarda cambios localmente y, después de recargar, conserva artículo, cantidad, lotes, observación y progreso.
- **AC-006:** Avanzar el reloj más allá de 24 horas vuelve el borrador de solo lectura y muestra una explicación.
- **AC-007:** Buscar `café` o `ART-00125` selecciona Café Nara. Leer o ingresar `118120007` selecciona Sabor Y Color Madona, y `0132130023R` selecciona Biberon Polipro; si ya tenían línea, cargan sus datos sin duplicar progreso.
- **AC-008:** Tres cajas de Café calculan 72 unidades; `1.5`, `dos`, `-1` y espacios se rechazan sin mostrar un total incorrecto.
- **AC-009:** Un valor válido no mantiene visible un mensaje de error.
- **AC-010:** Café no puede guardarse sin fecha; dos lotes conservan cantidades, unidades, fechas y observaciones independientes y suman 96.
- **AC-011:** Editar un artículo contado no incrementa dos veces el progreso.
- **AC-012:** Revisión con 35 de 38 muestra exactamente Galletas, Jugo y Cereal con sus antecedentes correspondientes.
- **AC-013:** Confirmar cero requiere confirmación y crea una línea explícita; Registrar conteo vuelve a la revisión al guardar.
- **AC-014:** Cerrar permanece deshabilitado con pendientes y se habilita al llegar a 38 de 38.
- **AC-015:** El cierre registra supervisor, fecha y evento y deja todas las acciones de edición bloqueadas.
- **AC-016:** Reabrir rechaza un motivo vacío, acepta uno válido, agrega historial y devuelve el levantamiento a En revisión.
- **AC-017:** Nuevo y Editar artículo validan código único y factor entero, guardan y actualizan filtros y totales.
- **AC-018:** Nuevo cliente y Agregar bodega validan nombres, guardan y aparecen sin recargar.
- **AC-019:** Un cliente o bodega inactivos no aparecen como opciones de un nuevo levantamiento.
- **AC-020:** Restablecer datos, tras confirmar, recupera todo el escenario inicial.
- **AC-021:** Todas las acciones visibles responden; no existen botones decorativos ni rutas sin contenido.
- **AC-022:** `npm run build` termina sin errores y las ocho pantallas funcionan a 360, 390 y 430 px sin desplazamiento horizontal.

## Decisiones pendientes

No existen decisiones bloqueantes para construir el prototipo local. La lectura física requiere permiso y un navegador que implemente `BarcodeDetector` con `code_128`; cuando no está disponible se usa el ingreso manual. La sincronización real, Supabase y Vercel se reservan para una etapa posterior expresamente autorizada.
