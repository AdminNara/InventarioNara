# Diseño funcional — Levantamiento de inventario Nara

## Dirección visual

La interfaz conserva la apariencia de las referencias: móvil, limpia, fondo marfil casi blanco, texto azul marino, acción primaria verde petróleo, tarjetas claras, avisos ámbar y confirmaciones verdes. No usar logo. La fidelidad se evalúa por composición, jerarquía, espaciado, tamaño relativo, estados e interacciones, no por copiar la imagen como fondo.

## Correcciones que prevalecen sobre las imágenes

1. UI-06 usa la misma navegación inferior de tres opciones que UI-01, UI-07 y UI-08.
2. El catálogo muestra 41 artículos activos globales; 38 corresponde a los asignados a Distribuidora El Ahorro.
3. Los mensajes de validación aparecen solo cuando existe un error. UI-03 no debe mostrar un error si la cantidad `3` es válida.
4. Los avisos de lote incompleto aparecen solo si hay un lote incompleto. Con dos lotes completos, UI-04 muestra confirmación neutral o no muestra aviso.
5. Las tarjetas En revisión y Cerrado de UI-01 deben tener destino evidente: CTA o chevrón, además de ser pulsables por completo.
6. El texto ambiguo `Retomar en 18 h` se reemplaza por `18 h restantes para editar`.

## Variables visuales

| Uso | Valor |
|---|---|
| Fuente regular | `Segoe UI, system-ui, sans-serif` |
| Fuente destacada | `Segoe UI Semibold, Segoe UI, system-ui, sans-serif` |
| Azul marino | `#001349` |
| Verde petróleo | `#006A70` |
| Verde petróleo oscuro | `#00575C` |
| Dorado Nara | `#DBB13B` |
| Ámbar de atención | `#B66A00` |
| Verde de éxito | `#198A3B` |
| Texto secundario | `#5C6272` |
| Borde | `#D4D8DE` |
| Fondo | `#FFFDF9` |
| Superficie | `#FFFFFF` |
| Superficie tenue | `#F6F7F7` |
| Radio pequeño / grande | `10 px / 16 px` |
| Sombra de tarjeta | `0 4px 14px rgba(0, 19, 73, 0.08)` |
| Espaciado base | múltiplos de `4 px`; separación principal de `16, 24 y 32 px` |

Los tonos pueden ajustarse ligeramente al medir las imágenes, pero deben centralizarse en variables y mantener contraste suficiente.

## Lienzo y respuesta

- Diseñar desde 390 px; validar 360, 390 y 430 px.
- En escritorio, limitar el contenido móvil a 430 px, centrarlo y usar fondo neutro alrededor.
- Márgenes laterales: 16 px en 360–389 px y 20 px desde 390 px.
- Encabezado fijo o estable de 64–72 px; título centrado cuando haya Atrás.
- Botones principales de 52–58 px de alto; controles táctiles mínimos de 44 px.
- Navegación inferior fija de 72–80 px más `env(safe-area-inset-bottom)`.
- Añadir relleno inferior para que el contenido nunca quede oculto por la barra fija.
- Los textos pueden crecer hasta 200 % sin recorte; las tarjetas pasan de columnas a filas apiladas cuando sea necesario.

## Navegación

| Ruta | Pantalla | Acceso principal |
|---|---|---|
| `/levantamientos` | UI-01 Mis levantamientos | Pestaña Levantamientos |
| `/levantamientos/nuevo` | UI-02 Nuevo levantamiento | Nuevo levantamiento |
| `/levantamientos/:id/conteo` | UI-03 Conteo | Continuar o Registrar conteo |
| `/levantamientos/:id/articulos/:articleId/lotes` | UI-04 Lotes | Agregar otro lote o editar lotes |
| `/levantamientos/:id/revision` | UI-05 Revisión | Tarjeta En revisión |
| `/levantamientos/:id/cerrado` | UI-06 Cerrado | Tarjeta Cerrado o cierre exitoso |
| `/catalogo` | UI-07 Catálogo | Pestaña Catálogo |
| `/clientes` | UI-08 Clientes y bodegas | Acceso administrativo desde Perfil |
| `/perfil` | Perfil y utilidades | Pestaña Perfil |

Los formularios administrativos, confirmaciones y selector de rol se presentan como diálogos o paneles inferiores para no crear pantallas principales sin referencia.

## Componentes comunes

- Encabezado con Atrás, título y estado o rol cuando corresponda.
- Tarjeta de entidad con icono, título, subtítulo, estado y acción.
- Campo de búsqueda con icono y botón de escaneo opcional.
- Botón primario sólido, secundario delineado y destructivo/atención ámbar.
- Chip de estado con icono y texto; nunca depende solo del color.
- Barra de progreso con fracción textual y valor accesible.
- Mensaje contextual para información, atención, error y éxito.
- Diálogo accesible con título, descripción, acción principal y Cancelar.
- Mensaje breve de guardado o éxito anunciado sin mover el contenido.
- Navegación inferior consistente de tres pestañas.

## UI-01 — Mis levantamientos

**Referencia:** `references/screens/01 mis levantamientos.png`

### Composición que se conserva

- Título grande, chip de rol y avatar.
- Botón principal Nuevo levantamiento.
- Secciones En curso y Recientes.
- Tarjetas de Borrador, En revisión y Cerrado con progreso y metadatos.
- Navegación inferior.

### Redacción mejorada

- Borrador: `Guardado automáticamente · 18 h restantes para editar`.
- En revisión, Contador: `Enviado al supervisor` y CTA `Ver revisión`.
- En revisión, Supervisor: CTA `Revisar cobertura`.
- Cerrado: CTA `Ver resumen`.

### Interacción

- Nuevo levantamiento abre UI-02.
- Continuar conteo abre UI-03 con el borrador existente.
- La tarjeta En revisión abre UI-05; las acciones dependen del rol.
- La tarjeta Cerrado abre UI-06.
- Chip de rol y avatar abren el selector de rol/Perfil.
- Catálogo y Perfil navegan; la pestaña actual tiene marcador superior.

### Estados adicionales

- Sin levantamientos: ilustración simple, texto `Aún no hay levantamientos` y CTA Nuevo levantamiento.
- Borrador vencido: chip `Vencido`, texto explicativo y CTA `Ver borrador`.
- Error local recuperable: mensaje con Reintentar y Restablecer desde Perfil.

## UI-02 — Nuevo levantamiento

**Referencia:** `references/screens/02 nuevo levantamiento.png`

### Composición que se conserva

- Encabezado con Atrás y título centrado.
- Selectores Cliente y Bodega.
- Tarjeta Responsable y fecha.
- Mensaje de guardado automático, resumen y botón inferior.

### Redacción mejorada

- Introducción: `Selecciona el cliente y la bodega donde realizarás el conteo.`
- Mensaje: `Al iniciar, el borrador se guardará automáticamente durante 24 horas.`
- Resumen: `38 artículos asignados` y `6 requieren fecha de vencimiento`.
- Nota inferior: `Podrás continuar este levantamiento más tarde.`

### Interacción

- Estado inicial sin selección; Bodega está deshabilitada.
- Cliente despliega solo clientes activos.
- Elegir cliente habilita y filtra bodegas activas.
- Si cambia Cliente, se limpia Bodega y se recalcula Resumen.
- Iniciar conteo permanece deshabilitado hasta completar ambos valores.
- Si existe un borrador vigente para la combinación, un diálogo ofrece Continuar borrador o Cancelar.
- Atrás con selecciones no guardadas pide confirmación.

### Estados adicionales

- Cliente sin bodegas activas: mensaje `Este cliente no tiene bodegas disponibles` y botón deshabilitado.
- Carga breve al calcular resumen.
- Error junto a cada selector después de intentar iniciar incompleto.

## UI-03 — Conteo de inventario

**Referencia:** `references/screens/03 conteo de inventario.png`

### Composición que se conserva

- Encabezado, chip Borrador y confirmación de guardado.
- Tarjeta de cliente, bodega, responsable, fecha y progreso.
- Búsqueda y escaneo.
- Tarjeta del artículo seleccionado.
- Selector segmentado Caja/Unidad, cantidad, conversión, vencimiento, observación y acción inferior.

### Redacción mejorada

- Ayuda válida: `Ingresa una cantidad entera.`
- Error decimal: `Usa números enteros; no se permiten decimales.`
- Error general: `Ingresa un número entero entre 0 y 999999.`
- Vencimiento: `Fecha de vencimiento` con chip `Obligatoria`.
- Observación: una sola indicación `Observación (opcional)`; placeholder `Añade una observación`.

### Interacción

- Buscar muestra resultados debajo y permite seleccionar con teclado o toque.
- El botón de escaneo abre una vista de cámara local con marco Code 128, estado anunciado y aviso de privacidad. Un código asignado selecciona el artículo automáticamente; un código desconocido o fuera del alcance mantiene el diálogo abierto. El ingreso manual permanece disponible cuando falta cámara, permiso o soporte nativo.
- Seleccionar un artículo carga su presentación y reglas.
- Caja y Unidad recalculan al instante; Caja se oculta o deshabilita si el factor es uno.
- La cantidad rechaza caracteres inválidos sin borrar el último valor válido.
- Para artículos con vencimiento, Agregar otro lote valida el actual y abre UI-04.
- Guardar conteo crea o actualiza la línea, muestra éxito, limpia la selección y conserva el progreso.
- Si se llegó desde UI-05, guardar vuelve a la revisión.
- La acción principal permanece fija al fondo sin ocultar campos.

### Estados adicionales

- Sin artículo seleccionado: búsqueda, ayuda de escaneo y texto `Selecciona un artículo para registrar el conteo`.
- Sin resultados, código no reconocido, artículo ya contado, guardando, guardado, error y borrador vencido.
- El error numérico de la imagen se usa solo como referencia visual del estado inválido, no del estado con valor `3`.

## UI-04 — Lotes y vencimientos

**Referencia:** `references/screens/04 lotes y vencimientos.png`

### Composición que se conserva

- Encabezado con Atrás.
- Tarjeta del artículo y chip Aplica vence.
- Total registrado.
- Lista de lotes, edición, Agregar lote y botón inferior.

### Redacción mejorada

- Cantidad etiqueta la unidad concreta: `Cantidad en cajas` o `Cantidad en unidades`.
- Conversión: `48 unidades` sin repetir `Equivale a` en pantallas estrechas si genera saturación.
- Aviso incompleto: `Completa la cantidad y la fecha de cada lote para guardar.`
- Estado completo opcional: `Todos los lotes están completos.`

### Interacción

- El total se recalcula al guardar, editar o eliminar un lote.
- Editar abre un panel con los mismos campos de UI-03.
- Agregar lote abre un panel vacío y asigna el siguiente número al guardar.
- El panel de edición permite Eliminar lote con confirmación si queda otro lote.
- Guardar N lotes valida todas las filas, actualiza una sola línea de artículo y vuelve al conteo o a revisión según el origen.
- Atrás con cambios no guardados solicita confirmación.

### Estados adicionales

- Sin lotes: mensaje y CTA Agregar primer lote.
- Lote incompleto marcado junto a su campo; botón Guardar deshabilitado.
- Fecha pasada: chip `Vencido`, sin bloqueo.
- Dos lotes completos no muestran un aviso de error.

## UI-05 — Revisión de cobertura

**Referencia:** `references/screens/05 revision de cobertura.png`

### Composición que se conserva

- Encabezado y chip En revisión.
- Tarjetas de contexto y progreso.
- Resumen de pendientes.
- Lista de artículos con conteo anterior y acciones.
- Barra inferior de cierre.

### Redacción mejorada

- Resumen: `3 artículos pendientes`.
- Explicación: `Registra una cantidad o confirma cero antes de cerrar.`
- Sin antecedente: `Sin conteo anterior`.
- Botón: `Cerrar levantamiento`; ayuda dinámica `Resuelve los 3 artículos pendientes`.

### Interacción

- Registrar conteo abre UI-03 con el artículo seleccionado y retorno a UI-05.
- Confirmar cero abre diálogo con nombre y antecedente; confirmar elimina el pendiente y actualiza progreso.
- Cada resolución anima brevemente sin depender del movimiento para comunicar el cambio.
- Con cero pendientes aparece un mensaje de cobertura completa y se habilita Cerrar.
- Cerrar abre una confirmación; aceptar navega a UI-06.
- El Contador puede abrir la pantalla en solo lectura y no ve acciones de resolución o cierre.

### Estados adicionales

- 35/38 con tres pendientes; 38/38 completo; carga; error recuperable; solo lectura para Contador.
- Si un artículo se desactiva después de iniciar, permanece en el levantamiento como parte del alcance capturado. Los tres artículos asignados después al Supermercado La Unión explican que UI-08 muestre 41 mientras esta revisión conserva 38.

## UI-06 — Levantamiento cerrado

**Referencia:** `references/screens/06 levantamiento cerrado.png`

### Composición que se conserva

- Encabezado y chip Cerrado.
- Datos de cliente, bodega, contador y fecha.
- Confirmación 38 de 38, resumen, historial y acción Reabrir.
- La navegación inferior se corrige a tres opciones.

### Redacción mejorada

- Confirmación: `38 de 38 artículos validados`.
- Metadato: `Cerrado por Carlos Mena · 17 jul 2026, 16:42`.
- Acción: `Reabrir levantamiento`.
- Ayuda: `Para permitir cambios, indica el motivo de la reapertura.`

### Interacción

- Resumen y líneas son de solo lectura.
- Reabrir aparece solo en modo Supervisor y abre diálogo con textarea, contador 0/300, Cancelar y Confirmar reapertura.
- Confirmar agrega evento con motivo, cambia a En revisión y navega a UI-05.
- El historial muestra Enviado a revisión, Cerrado y Reabierto cuando corresponda.
- Para Contador, se muestra `Solo un supervisor puede reabrir este levantamiento`.

### Estados adicionales

- Diálogo vacío con error; envío; reapertura exitosa; historial con varios ciclos.

## UI-07 — Catálogo de artículos

**Referencia:** `references/screens/07 catalogo de articulos.png`

### Composición que se conserva

- Encabezado y chip Supervisor.
- Búsqueda, filtro y botón Nuevo artículo.
- Tarjetas con nombre, código, estado, presentación, conversión y vencimiento.
- Navegación inferior.

### Redacción mejorada

- Filtro inicial: `Activos · 41`.
- Presentación: `Caja de 24 unidades` o `Unidad`.
- Conversión: `1 caja = 24 unidades`.
- Estados: `Aplica vencimiento` y `No aplica vencimiento`.

### Interacción

- La búsqueda filtra por nombre o código.
- El filtro alterna Todos, Activos e Inactivos y actualiza el conteo.
- Nuevo artículo abre formulario vacío.
- Editar abre formulario precargado.
- Guardar valida y actualiza la tarjeta sin recargar.
- En modo Contador se ocultan Nuevo y Editar; las tarjetas siguen consultables.

### Formulario de apoyo

- Campos: Nombre, Código, Presentación, Unidades por caja, Aplica vencimiento y Activo.
- Código se normaliza a mayúsculas y valida unicidad.
- Presentación Unidad fuerza factor 1; Caja requiere factor entero mayor o igual que 2.
- Cancelar con cambios solicita confirmación.
- El formulario conserva el estilo de tarjetas y botones de la referencia.

### Estados adicionales

- Sin resultados, catálogo vacío, código duplicado, guardando, guardado e inactivo.

## UI-08 — Clientes y bodegas

**Referencia:** `references/screens/08 clientes y bodegas.png`

### Composición que se conserva

- Encabezado y chip Supervisor.
- Búsqueda y botón Nuevo cliente.
- Tarjetas de cliente con estado, artículos asignados y expansión.
- Lista de bodegas y Agregar bodega.
- Navegación inferior.

### Redacción mejorada

- Cliente: `38 artículos activos asignados`.
- Bodega: `Último levantamiento: 17 jul 2026` o `Sin levantamientos`.
- Estados coherentes: `Activo/Inactivo` para cliente y `Activa/Inactiva` para bodega.

### Interacción

- Buscar filtra clientes mientras se escribe.
- Pulsar encabezado o chevrón expande un cliente y contrae el anterior.
- Pulsar una bodega abre un panel de detalle con estado y último levantamiento.
- Nuevo cliente abre formulario de nombre y estado.
- Agregar bodega abre formulario vinculado al cliente expandido.
- El panel de cliente ofrece Editar cliente y Gestionar artículos asignados.
- Gestionar artículos permite buscar y activar/desactivar asignaciones; el total del cliente y los levantamientos futuros se actualizan al guardar, sin modificar levantamientos ya iniciados.
- Un cliente inactivo puede expandirse y consultarse, pero no admite nuevas bodegas activas ni nuevos levantamientos.

### Estados adicionales

- Sin resultados, cliente sin bodegas, nombre duplicado, cliente inactivo, guardando y guardado.

## Perfil y diálogos de apoyo

Perfil no necesita una referencia principal, pero evita pestañas sin función. Debe incluir:

- Usuario actual y selector Contador/Supervisor.
- Fecha y hora del reloj de demostración.
- Avanzar reloj 7 h, avanzar 19 h y restaurar reloj.
- Restablecer datos de demostración con confirmación.
- Acceso a Clientes y bodegas para Supervisor.
- Acceso al PDF local con los 15 códigos Code 128 para mostrar o imprimir durante la demostración.
- Texto visible que aclara que roles y persistencia son simulados.

Diálogos obligatorios:

1. Selector de rol.
2. Escaneo Code 128 por cámara, ingreso manual, código no reconocido y artículo fuera del alcance.
3. Borrador existente.
4. Salir con cambios sin guardar.
5. Confirmar cero.
6. Cerrar levantamiento.
7. Reabrir con motivo.
8. Nuevo/Editar artículo.
9. Nuevo/Editar cliente.
10. Agregar/Editar bodega.
11. Gestionar artículos asignados.
12. Restablecer datos.

## Reglas de texto y formato

- Español claro, directo y consistente.
- Usar `levantamiento`, `conteo`, `artículo`, `bodega`, `caja`, `unidad`, `lote` y `vencimiento` siempre con el mismo significado.
- Fechas visibles: `17 jul 2026`; con hora: `17 jul 2026, 16:42`.
- Números con separador de miles: `1,284`.
- Botones empiezan con verbo: Iniciar, Guardar, Registrar, Confirmar, Cerrar, Reabrir, Agregar, Editar.
- Evitar repetir `(opcional)` en etiqueta y placeholder.
- Explicar por qué un botón está deshabilitado.

## Verificación visual

Para cada UI-01 a UI-08:

1. Capturar la pantalla en 390 px con el mismo escenario de datos de la referencia.
2. Comparar posición, jerarquía, densidad, ancho de tarjetas, alturas de controles, color, tipografía e iconos.
3. Corregir diferencias de alto impacto antes de pulir sombras o microespaciado.
4. Repetir a 360 y 430 px para detectar recorte, salto de texto u ocultamiento por barras fijas.
5. Documentar únicamente las diferencias conscientes indicadas en Correcciones que prevalecen sobre las imágenes.
