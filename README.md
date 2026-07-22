# Prototipo de levantamiento de inventario Nara

Prototipo móvil de inventario construido con React, Vite y TypeScript. Funciona sin backend: usa datos ficticios deterministas y conserva los cambios en `localStorage`.

## Requisitos

- Node.js 20 o posterior.
- npm 10 o posterior.
- Chrome o Edge reciente para probar la cámara.

## Instalar y ejecutar

```bash
git clone https://github.com/AdminNara/nara-inventario-prototipo.git
cd nara-inventario-prototipo
npm ci
npm run dev
```

Abre la dirección que muestre Vite, normalmente `http://localhost:5173/levantamientos`.

## Funciones incluidas

- Creación, conteo, lotes, revisión, cierre y reapertura de levantamientos.
- Catálogo, clientes, bodegas, asignaciones y roles de demostración.
- Persistencia local versionada y restablecimiento del escenario inicial.
- Diseño móvil para anchos entre 360 y 430 px.
- Ingreso manual de códigos Code 128 y acceso al PDF de prueba.

## Códigos Code 128

El material de prueba está en [`public/codigos_de_barras_code128.pdf`](public/codigos_de_barras_code128.pdf) y también se abre desde **Perfil → PDF Code 128**.

El diálogo solicita la cámara y prueba lectura local con `BarcodeDetector` o ZXing; no guarda ni transmite video. La lectura física queda como función experimental porque depende del enfoque, la resolución y los permisos del dispositivo y no fue confiable en la cámara usada durante esta validación. El ingreso manual sí está disponible: prueba `118120007` o `0132130023R`.

La cámara requiere `localhost` o HTTPS. Si no inicia, habilita el permiso del sitio o utiliza el ingreso manual del mismo diálogo.

## Reutilizar o adaptar

- Edita los datos iniciales en `src/data.ts`.
- Ajusta tipos y persistencia en `src/types.ts` y `src/store.ts`.
- La interfaz principal y las rutas están en `src/main.tsx`.
- Los tokens y estilos están en `src/styles.css` y `src/overrides.css`.
- Las reglas funcionales y visuales están documentadas en `docs/`.

El prototipo no incluye autenticación real, API, base de datos ni servicios externos. Los modos Contador y Supervisor son únicamente demostrativos.

## Compilar

```bash
npm run build
```

El resultado se genera en `dist/`, que no se versiona.

## Restablecer los datos

En **Perfil**, selecciona **Restablecer datos de demostración** y confirma. La aplicación recuperará los artículos, usuarios y levantamientos iniciales.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
