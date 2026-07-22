# Plan de construcción — Levantamiento de inventario Nara

Usa `⬜ Pendiente`, `🟨 En curso`, `✅ Terminado` o `⛔ Bloqueado`. No marques una tarea como terminada sin ejecutar su comprobación.

## Bloque 1 — Base reproducible

- **TASK-001 · ✅ Terminado:** Crear React + Vite + TypeScript, scripts `dev` y `build`, rutas y estructura simple.
  - Verificación: la pantalla base abre sin llamadas remotas y `npm run build` finaliza.
- **TASK-002 · ✅ Terminado:** Definir variables visuales, Segoe UI, contenedor móvil, encabezado, botones, tarjetas, diálogos y navegación inferior común.
  - Verificación: página de componentes a 360, 390 y 430 px sin desplazamiento horizontal.
- **TASK-003 · ✅ Terminado:** Crear el repositorio local de datos, reloj fijo, `localStorage`, migración por versión y Restablecer datos.
  - Verificación: un cambio sobrevive a recarga y el restablecimiento recupera los datos iniciales.
- **TASK-004 · ✅ Terminado:** Cargar usuarios, 45 artículos, asignaciones, clientes, bodegas y escenarios iniciales coherentes.
  - Verificación: 41 activos globales, 38 asignados a El Ahorro y 35/38 en la revisión prevista.

## Bloque 2 — Inicio y creación

- **TASK-005 · ✅ Terminado:** Construir UI-01 con tarjetas navegables, rol, estados y pestañas funcionales.
  - Verificación: Nuevo, Continuar, Revisar/Ver y Ver resumen llevan al destino correcto.
- **TASK-006 · ✅ Terminado:** Construir UI-02 con selects dependientes, resumen, validación y prevención de borrador duplicado.
  - Verificación: AC-003 y AC-004.
- **TASK-007 · ✅ Terminado:** Construir Perfil, selector de rol y controles del reloj.
  - Verificación: cambio de rol persiste y avanzar 19 h vence el borrador.

## Bloque 3 — Conteo funcional

- **TASK-008 · ✅ Terminado:** Construir búsqueda incremental, resultados, sin resultados y diálogo de escaneo Code 128 por cámara con ingreso manual accesible.
  - Verificación: `118120007` y `0132130023R` seleccionan el producto exacto; código desconocido y artículo conocido fuera del alcance se distinguen.
- **TASK-009 · ✅ Terminado:** Construir UI-03 con selección de unidad, validación entera, conversión, observación, guardado y edición.
  - Verificación: AC-008, AC-009 y AC-011.
- **TASK-010 · ✅ Terminado:** Construir UI-04 y paneles Agregar/Editar/Eliminar lote con total y fechas pasadas permitidas.
  - Verificación: AC-010; un lote incompleto impide guardar y un conjunto completo no muestra error.
- **TASK-011 · 🟨 En curso:** Implementar guardado automático, aviso de último guardado, salida con cambios y condición de borrador vencido.
  - Verificación: AC-005 y AC-006.

## Bloque 4 — Revisión, cierre y reapertura

- **TASK-012 · ✅ Terminado:** Construir UI-05 con pendientes derivados, conteo anterior y retorno desde Registrar conteo.
  - Verificación: AC-012 y AC-013.
- **TASK-013 · ✅ Terminado:** Implementar Confirmar cero, progreso, cierre deshabilitado y confirmación de cierre.
  - Verificación: AC-013, AC-014 y AC-015.
- **TASK-014 · ✅ Terminado:** Construir UI-06 en solo lectura, resumen, historial y reapertura con motivo.
  - Verificación: AC-015 y AC-016; la navegación inferior usa tres pestañas.

## Bloque 5 — Administración local

- **TASK-015 · ✅ Terminado:** Construir UI-07 con búsqueda, filtros, permisos visuales y formularios Nuevo/Editar artículo.
  - Verificación: AC-017 y estados sin resultados/inactivo.
- **TASK-016 · ✅ Terminado:** Construir UI-08 con búsqueda, acordeón, detalle de bodega y formularios Nuevo/Editar cliente y bodega.
  - Verificación: AC-018 y AC-019.
- **TASK-017 · ✅ Terminado:** Implementar Gestionar artículos asignados, propagar totales a UI-02/UI-08 y preservar el alcance de levantamientos iniciados.
  - Verificación: cambiar una asignación actualiza el cliente y los nuevos levantamientos sin cambiar el denominador de una revisión existente.

## Bloque 6 — Estados, accesibilidad y calidad

- **TASK-018 · 🟨 En curso:** Completar carga, vacío, sin resultados, error, éxito, confirmación y deshabilitado en cada recorrido.
  - Verificación: inventario de estados completo y ningún botón visible sin respuesta.
- **TASK-019 · 🟨 En curso:** Revisar etiquetas, foco, teclado, retorno de foco, anuncios, contraste, áreas táctiles y movimiento reducido.
  - Verificación: recorrido completo solo con teclado y revisión automatizada disponible sin errores críticos.
- **TASK-020 · 🟨 En curso:** Ejecutar AC-001 a AC-022 y registrar resultado y evidencia.
  - Verificación: todos aprobados o con bloqueo documentado.
- **TASK-021 · ✅ Terminado:** Capturar UI-01 a UI-08 a 390 px y comparar con cada referencia; repetir reflujo a 360 y 430 px.
  - Verificación: sin diferencias de composición de alto impacto fuera de las correcciones aprobadas.
- **TASK-022 · ✅ Terminado:** Ejecutar compilación final, revisar consola, rutas, persistencia y ausencia de llamadas remotas.
  - Verificación: `npm run build` correcto, consola limpia y flujo completo demostrable.

## Cierre del prototipo

- **TASK-023 · ✅ Terminado:** Preparar instrucciones de uso, instalación, restablecimiento y escenarios de demostración.
- **TASK-024 · ⬜ Pendiente:** Empaquetar el frontend aprobado sin `node_modules`, backend, Supabase ni despliegue.
- **TASK-025 · ✅ Terminado:** Migrar el almacén local a versión 2, incorporar los 15 productos del PDF y publicar el PDF local desde Perfil.
  - Verificación: IDs, conteos, lotes y alcances v1 se preservan; origen y copia pública del PDF comparten SHA-256; `npm run build` finaliza correctamente.

## Evidencia de ejecución — 22 jul 2026

- UI-01 a UI-08: capturas reales a 390 px en `docs/evidence/ui-01-390.png` a `ui-08-390.png`, contrastadas con copias normalizadas de las ocho referencias aprobadas.
- Reflujo: 24 comprobaciones —ocho rutas a 360, 390 y 430 px— sin desplazamiento horizontal; cada ruta conserva exactamente tres opciones de navegación.
- UI-02: Distribuidora El Ahorro filtra dos bodegas, habilita Bodega central y muestra 38 artículos activos y 6 con vencimiento.
- UI-04: muestra 96 unidades, vencimientos 15 dic 2026 y 20 ene 2027; editar el primer lote a 4 cajas recalculó 144 unidades, Guardar mantuvo el progreso en 12/38 y Atrás mostró confirmación por cambios sin guardar.
- UI-02/UI-03/UI-04/UI-05: el pie de acción dejó de flotar y ahora ocupa su propio espacio al final del contenido. La matriz geométrica a 360, 390 y 430 px devolvió 0 intersecciones con tarjetas, campos o botones, 0 intersecciones con la navegación y 0 desbordamiento horizontal. Evidencia del caso reportado: `ui-02-overlap-fixed-final.png`.
- UI-06: 38/38, 1,284 unidades, 6 con vencimiento, historial Enviado/Cerrado y reapertura con motivo validada hasta el retorno a Revisión completa.
- Calidad técnica: `npm run build` finalizó correctamente; la consola del navegador devolvió 0 errores y la búsqueda en `src`/`package.json` no encontró llamadas remotas.
- Diferencias conscientes: UI-03 no muestra error con cantidad válida; UI-04 no muestra aviso de lote incompleto con dos lotes completos; UI-05 usa el escenario de Supermercado La Unión; UI-06 conserva la navegación documental de tres opciones.
- Escaneo Code 128: `AppState` v2 conserva líneas y alcance por ID. Los 15 registros tienen códigos únicos y `code === barcode`. En el navegador de prueba, que no expone `BarcodeDetector`, se validó el fallback manual con `118120007` → Sabor Y Color Madona (cantidad existente 5), `0132130023R` → Biberon Polipro (cantidad existente 9), código desconocido y `ART-01035` conocido fuera del alcance; guardar y recargar conservó cantidad 9 y el progreso permaneció 12/38. El diálogo no presentó desbordamiento horizontal a 360, 390 ni 430 px y la consola terminó con 0 errores. La lectura física queda condicionada a un navegador/dispositivo con soporte nativo `code_128` y permiso de cámara.
