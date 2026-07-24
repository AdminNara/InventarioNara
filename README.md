# Inventario Nara

Aplicación móvil de levantamiento de inventario para equipos de conteo y supervisión. Está construida con React, Vite y TypeScript, usa Supabase Auth para iniciar sesión, Supabase Postgres con RLS para los datos y Vercel para producción.

## Estado actual

- Frontend productivo publicado en Vercel: `https://inventario-nara.vercel.app`.
- Backend versionado con migraciones SQL en `supabase/migrations/`.
- Login real por Supabase Auth; cada usuario debe tener una fila vinculada en `public.app_users.auth_user_id`.
- Roles soportados: `Contador` para levantamientos y `Supervisor` para revisión, cierre, reapertura y catálogos administrativos.
- La lectura de cámara para Code 128 sigue siendo experimental; el ingreso manual de códigos está disponible.

## Requisitos

- Node.js 20 o posterior.
- npm 10 o posterior.
- Chrome o Edge reciente para cámara y pruebas de navegador.
- Proyecto Supabase con las migraciones aplicadas.
- Variables de entorno locales o de Vercel configuradas.

## Variables

Copia `.env.example` a `.env.local` para desarrollo local y completa:

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_PUBLICA
```

Para pruebas e2e autenticadas, define también en tu entorno local, sin versionarlas:

```bash
E2E_BASE_URL=http://127.0.0.1:4173
E2E_COUNTER_EMAIL=contador@example.com
E2E_COUNTER_PASSWORD=...
E2E_SUPERVISOR_EMAIL=supervisor@example.com
E2E_SUPERVISOR_PASSWORD=...
```

No uses `service_role`, contraseñas ni claves privadas en el frontend.

## Instalar y ejecutar

```bash
git clone https://github.com/AdminNara/InventarioNara.git
cd InventarioNara
npm ci
npm run dev
```

Abre la dirección que muestre Vite. Sin variables Supabase válidas, la app muestra una pantalla de configuración pendiente.

## Verificación

```bash
npm run typecheck
npm run build
npm run audit
npm run verify
```

Para pruebas de navegador locales:

```bash
npm run build
npm run preview
npm run e2e
```

Para producción:

```bash
E2E_BASE_URL=https://inventario-nara.vercel.app npm run e2e
```

Las pruebas autenticadas se omiten automáticamente si faltan las variables `E2E_*`.

## Despliegue

El proyecto Vercel debe usar:

- Framework: Vite.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Después de cada despliegue, valida que producción responda, que la pantalla de login renderice y que al menos un usuario Contador y uno Supervisor puedan completar sus recorridos mínimos.

## Estructura

- `src/main.tsx`: rutas, pantallas y flujos principales.
- `src/supabaseClient.ts`: creación del cliente Supabase público.
- `src/supabaseInventory.ts`: lectura y escritura de datos contra Supabase.
- `supabase/migrations/`: esquema, semillas, RLS y cambios de base de datos.
- `tests/e2e/`: pruebas de humo de login, flujo Contador y superficies Supervisor.
- `docs/`: especificaciones, diseño, modelo de datos y evidencia del prototipo.

## Códigos Code 128

El material de prueba está en `public/codigos_de_barras_code128.pdf` y también se abre desde Perfil. La cámara requiere `localhost` o HTTPS. Si no inicia, habilita el permiso del sitio o usa ingreso manual, por ejemplo `118120007` o `0132130023R`.

## Limitaciones conocidas

- Las credenciales de prueba deben gestionarse fuera del repositorio.
- El botón de restablecimiento solo reinicia estado local auxiliar; no borra datos remotos en Supabase.
- La lectura física de códigos depende del navegador, cámara, enfoque y permiso del dispositivo.
- El paquete de producción puede emitir advertencia de tamaño; no bloquea el build, pero queda como optimización futura.
