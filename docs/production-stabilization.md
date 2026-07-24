# Estabilizacion de produccion

Fecha: 2026-07-24

## Estado

La rama de estabilizacion corrige documentacion, scripts de verificacion, dependencia vulnerable de desarrollo, pruebas e2e de humo y una exposicion RPC innecesaria en Supabase.

No se declara version estable final hasta ejecutar las pruebas autenticadas con credenciales locales `E2E_*` para Contador y Supervisor.

## Evidencia local

- `npm run verify`: correcto.
- `npm run typecheck`: correcto.
- `npm run build`: correcto, con advertencia no bloqueante de bundle mayor a 500 kB.
- `npm run audit`: correcto, 0 vulnerabilidades.
- `npm run preview`: responde `HTTP 200` en `http://127.0.0.1:4173`.

## Evidencia Supabase

- Proyecto validado: `NA44 - APP INVENTARIO` (`galmymdcqmnyimjhqypv`).
- Usuarios de aplicacion: 2.
- Usuarios activos vinculados a Supabase Auth: 2.
- Roles: 1 Contador y 1 Supervisor.
- Tablas principales con RLS activo: `app_users`, `clients`, `warehouses`, `articles`, `client_articles`, `inventory_counts`, `inventory_count_articles`, `count_lines`, `lots`, `history_events`.
- Migracion aplicada: `revoke_rls_auto_enable_rpc`.

## Evidencia Vercel

- Proyecto: `inventario-nara`.
- Framework: Vite.
- Deployment productivo previo: `READY`.
- Dominio productivo: `https://inventario-nara.vercel.app`.
- Runtime errors ultimas 24 h: sin errores encontrados por el conector Vercel.

## E2E

- Produccion sin credenciales: pantalla de login protegida validada con Playwright.
- Pruebas autenticadas: implementadas y omitidas automaticamente cuando faltan `E2E_COUNTER_*` y `E2E_SUPERVISOR_*`.

## Pendiente para declarar estable

- Ejecutar `E2E_BASE_URL=https://inventario-nara.vercel.app npm run e2e` con credenciales reales de prueba.
- Validar login Contador, guardado de conteo y acceso Supervisor.
- Habilitar leaked password protection en Supabase Auth o aceptar explicitamente ese warning como riesgo residual.
- Confirmar el deployment Vercel `READY` despues del push final.
