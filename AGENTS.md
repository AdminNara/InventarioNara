# Instrucciones para construir el prototipo

Este paquete define un prototipo móvil, local e interactivo para levantamientos de inventario. Las imágenes son referencias visuales; los documentos convierten lo visible en reglas verificables para evitar pantallas estáticas, botones sin respuesta o comportamientos inventados.

## Lectura obligatoria

Lee en este orden antes de escribir código:

1. `docs/specifications.md`
2. `docs/design.md`
3. `docs/tasks.md`
4. Las ocho imágenes de `docs/references/screens/`

## Resultado esperado antes de construir

Presenta al usuario:

1. Un resumen del objetivo y del flujo completo.
2. La lista de pantallas, diálogos y estados que se implementarán.
3. Las decisiones de fidelidad visual que se desprenden de las imágenes.
4. Las contradicciones o vacíos que aún sean materiales.
5. Un plan breve por bloques verificables.

Pregunta únicamente cuando falte una decisión que cambie el alcance, el flujo o los datos. No preguntes por detalles ya resueltos en este paquete. Espera aprobación explícita antes de iniciar la construcción.

## Alcance técnico

- Construye un frontend local, en español y con enfoque móvil primero.
- Usa React, Vite y TypeScript.
- Usa solo dependencias locales registradas en `package.json` y `package-lock.json`.
- No instales herramientas globales ni modifiques el sistema operativo, el `PATH` u otros proyectos.
- No uses `sudo`, `apt`, `brew`, `winget`, `choco` ni instaladores externos.
- Si Node.js o npm no están disponibles, informa el bloqueo; no intentes instalarlos.
- No incluyas `node_modules`, archivos temporales ni resultados de compilación en el entregable.
- Mantén una arquitectura pequeña y legible. Evita dependencias, patrones y capas que no aporten al prototipo.

## Datos y persistencia simulada

- Usa exclusivamente datos ficticios locales.
- No agregues backend, base de datos, autenticación real, servicios externos, variables sensibles, integraciones ni despliegue.
- Usa `localStorage` para que borradores, cambios de catálogo, reaperturas y rol seleccionado sobrevivan a una recarga. Esta persistencia es solo una simulación local.
- Incluye una acción de `Restablecer datos de demostración` dentro de Perfil, con confirmación previa.
- Usa el reloj de demostración definido en las especificaciones para que los estados y fechas de las referencias sean reproducibles.
- Los roles Contador y Supervisor son modos de demostración; no son mecanismos reales de seguridad.

## Fidelidad visual obligatoria

- Reproduce la composición, jerarquía, proporciones, espaciado, colores, iconografía, tarjetas, estados y acciones de las imágenes.
- Implementa la interfaz con HTML y CSS; nunca muestres las imágenes como fondo ni como sustituto de controles reales.
- Usa `Segoe UI` y `Segoe UI Semibold`, con alternativas del sistema si no están disponibles.
- Centraliza colores, tipografía, radios, sombras, espaciado y tamaños en variables CSS.
- Conserva una sola navegación inferior de tres opciones en todas las pantallas: Levantamientos, Catálogo y Perfil. Esta corrección documental prevalece sobre la navegación de cinco opciones visible en UI-06.
- Usa íconos vectoriales consistentes. Cada ícono interactivo debe tener nombre accesible y área táctil mínima de 44 × 44 px.
- El contenido se adapta entre 360 y 430 px de ancho y permanece centrado en pantallas mayores. No debe haber desplazamiento horizontal.
- Las barras inferiores permanecen fijas sin ocultar contenido y respetan el área segura del dispositivo.

## Funcionalidad obligatoria

- Ningún botón, tarjeta, filtro, selector, pestaña, enlace o ícono de edición visible puede quedar sin respuesta.
- Toda acción debe producir navegación, cambio de estado, diálogo, mensaje o actualización de datos observable.
- La búsqueda filtra mientras se escribe y ofrece estado sin resultados.
- El escaneo simulado abre un diálogo y permite seleccionar un artículo de demostración.
- Los formularios implementan estado inicial, válido, inválido, deshabilitado, envío, éxito y cancelación.
- Las acciones destructivas o de cambio de estado —restablecer, confirmar cero, cerrar y reabrir— requieren confirmación.
- El botón Atrás conserva los datos válidos ya guardados y solicita confirmación si existe información no guardada.
- El conteo de progreso se calcula por artículos únicos resueltos, no por número de lotes.
- La edición de un artículo ya contado actualiza su línea sin aumentar dos veces el progreso.
- Las vistas administrativas incluyen altas y ediciones funcionales mediante diálogos o paneles, aunque no exista una imagen separada para cada formulario.

## Estados que deben demostrarse

Además del estado principal de cada referencia, implementa:

- vacío;
- carga breve simulada;
- sin resultados;
- validación junto al campo;
- éxito no intrusivo;
- error recuperable;
- control deshabilitado con explicación;
- borrador vigente y borrador vencido;
- revisión con pendientes y revisión completa;
- cerrado y reabierto.

No mantengas mensajes de error visibles cuando el valor mostrado sea válido. Los avisos de las imágenes representan estados específicos y deben aparecer solo cuando corresponda.

## Fuentes de verdad

Aplica esta jerarquía:

1. `docs/specifications.md` define comportamiento, datos, reglas y criterios de aceptación.
2. `docs/design.md` define composición, navegación, textos y estados visuales.
3. Las imágenes definen la apariencia y densidad de las ocho pantallas principales.
4. `docs/tasks.md` define el orden de implementación y las verificaciones.

Las correcciones explícitas documentadas prevalecen sobre textos o estados contradictorios de las imágenes. Ante cualquier otra contradicción material, detente y consulta.

## Forma de trabajo

- Implementa un bloque a la vez y limita los cambios al bloque aprobado.
- Reutiliza componentes cuando mantenga la fidelidad visual y simplifique el comportamiento.
- Después de cada bloque:
  1. Ejecuta el prototipo.
  2. Recorre las interacciones del bloque en el navegador.
  3. Revisa 360, 390 y 430 px de ancho.
  4. Compara la pantalla con su imagen de referencia.
  5. Verifica navegación por teclado, foco visible y etiquetas de controles.
  6. Ejecuta las comprobaciones disponibles.
  7. Actualiza `docs/tasks.md` sin borrar el alcance pendiente.
  8. Resume cambios, pruebas y diferencias visuales conocidas.
  9. Espera aprobación antes de avanzar al siguiente bloque.

## Validación final

El prototipo no está terminado hasta confirmar que:

- `npm run dev` inicia el proyecto.
- `npm run build` finaliza sin errores.
- TypeScript, importaciones y rutas no presentan errores.
- Las ocho pantallas principales y sus diálogos son accesibles.
- El flujo crear → contar → gestionar lotes → revisar → cerrar → reabrir funciona de principio a fin.
- Alta y edición de artículos, clientes y bodegas actualizan la interfaz.
- La recarga conserva el estado local y Restablecer datos recupera el escenario inicial.
- Los criterios de aceptación se recorrieron en el navegador y cuentan con evidencia.
- No existen botones visibles sin funcionamiento, secretos, llamadas remotas, backend, integraciones o despliegue.

## Entrega final

Solo después de aprobar el prototipo completo:

- Organiza el proyecto para que pueda copiarse a otro entorno.
- Incluye código fuente, `package.json`, `package-lock.json`, `.gitignore` e instrucciones breves de instalación, ejecución, compilación y restablecimiento de datos.
- Excluye `node_modules`, temporales y compilados.
- No inicies todavía la integración con Supabase, el backend ni el despliegue en Vercel.
