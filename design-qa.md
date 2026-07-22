# Design QA — Prototipo de levantamiento de inventario Nara

**Fuentes visuales**

- Originales: `docs/references/screens/01 mis levantamientos.png` a `08 clientes y bodegas.png`.
- Referencias normalizadas: `docs/evidence/ref-ui-01-normalized.png` a `ref-ui-08-normalized.png`.
- Implementación: `docs/evidence/ui-01-390.png` a `ui-08-390.png`.

**Normalización y estado**

- Viewport de captura: 390 px de ancho; alturas equivalentes a la proporción de cada referencia: 822, 693, 822, 693, 693, 822, 822 y 731 px.
- El navegador reserva 15 px para la barra de desplazamiento en siete rutas; por ello sus capturas de contenido son 375 px de ancho. Las referencias normalizadas se ajustaron a las dimensiones exactas de cada captura: 375×790, 390×693, 375×698, 375×666, 375×666, 375×790, 375×790 y 375×703 px.
- Densidad de captura: 1 CSS px por píxel de evidencia; sin marco de dispositivo ni navegador.
- Estados: UI-01 Contador; UI-02 El Ahorro/Bodega central; UI-03 borrador 12/38 con Café; UI-04 dos lotes completos; UI-05 35/38; UI-06 Supervisor/cerrado; UI-07 y UI-08 Supervisor.

**Evidencia de comparación completa**

- Tipografía: Segoe UI/Segoe UI Semibold, jerarquía y pesos equivalentes; no hay títulos truncados a 390 px.
- Espaciado y composición: márgenes laterales, tarjetas, radios, navegación fija y densidad móvil ajustados tras comparación normalizada. Las acciones inferiores permanecen al final del contenido, ocupan espacio propio y nunca flotan sobre controles.
- Colores: azul marino, verde petróleo, ámbar, verde de éxito, superficies y bordes centralizados en tokens CSS y equivalentes a la referencia.
- Activos e iconos: avatar real extraído del material aprobado; iconografía vectorial consistente, con áreas táctiles de 44 px.
- Copia y contenido: textos y métricas coinciden con las especificaciones. Se aplican las correcciones documentales que prevalecen sobre la imagen.
- Reflujo: ocho rutas aprobadas a 360, 390 y 430 px sin desbordamiento horizontal.

**Evidencia enfocada**

- UI-01: encabezado, avatar, CTA principal, tarjetas Borrador/En revisión y navegación.
- UI-02: selectores dependientes a ancho completo, responsable, resumen 38/6 y acción habilitada.
- UI-03/UI-04: búsqueda/escáner, artículo, conversión, fechas locales correctas, edición y total de lotes.
- UI-02/UI-03/UI-04/UI-05: la acción inferior tiene posición estática dentro del flujo. La matriz a 360, 390 y 430 px confirmó 0 intersecciones con controles, 0 con la navegación fija y 0 desbordamiento horizontal.
- UI-06: contexto en cuatro filas, 38/38, 1,284, 6, dos eventos y reapertura.
- UI-07/UI-08: modo Supervisor, altas/ediciones visibles, tarjetas compactas y navegación de tres opciones.

**Historial de iteraciones**

1. Primera comparación: densidad excesiva, UI-02 ocultaba resumen, fechas de lote desplazadas un día, siete vencimientos y UI-06 sin contexto/historial completo. Resultado: bloqueado.
2. Correcciones: densidad móvil, selectores a ancho completo, fecha local segura, seis vencimientos, total 1,284, avatar real, UI-04 editable y UI-06 reconstruida. Resultado: bloqueado por superposición de pendientes con acción fija.
3. Tercera corrección: reserva inferior para pantallas con acción fija y comprobación geométrica en UI-03/UI-04/UI-05. El caso UI-02 reportado por el usuario demostró que la solución todavía podía cubrir contenido.
4. Corrección final: la acción inferior pasó a formar parte del flujo y se dejó fija únicamente la navegación principal. La matriz geométrica de UI-02/UI-03/UI-04/UI-05 en los tres anchos no detectó superposiciones. No quedan hallazgos P0, P1 o P2.

**Hallazgos residuales P3**

- Algunas formas de iconos varían levemente frente a la referencia, pero mantienen una familia visual consistente y significado accesible.
- La navegación obligatoria de tres opciones reduce el área vertical frente a referencias que omitían la barra; el contenido permanece desplazable y ningún control queda oculto.

**Comprobaciones técnicas**

- Interacciones primarias: crear/continuar, búsqueda, escaneo simulado, guardar, editar/eliminar lotes, confirmar cero, cerrar y reabrir.
- Consola: 0 errores.
- Compilación: `npm run build` aprobada.
- Llamadas remotas: ninguna encontrada en `src` o `package.json`.

final result: passed
