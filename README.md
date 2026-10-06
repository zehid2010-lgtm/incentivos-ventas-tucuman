# Incentivos de Venta – Tucumán

Aplicación web móvil para seguimiento de incentivos en rutas 40–45.

## Seguridad de datos

Los archivos con nombres y códigos de clientes **no se guardan en GitHub**.
La aplicación obtiene los JSON desde OneDrive/SharePoint mediante Microsoft Graph y autenticación corporativa.

Archivos de configuración:
- `secure-config.js`: tenantId, clientId y enlaces compartidos corporativos.
- `secure-data.js`: autenticación MSAL y lectura de datos vía Microsoft Graph.
- `app.js`: consume los datos mediante el cargador seguro.

No colocar secretos, tokens ni contraseñas en el repositorio.

## Flujo Estrella Galicia

1. Power Automate recibe el correo.
2. Guarda temporalmente el Excel.
3. Ejecuta el Office Script `Estrella Galicia 2026`.
4. Actualiza `/Incentivos/estrella.json` en OneDrive.
5. La app lee ese archivo con autenticación Microsoft.

## Datos requeridos antes de producción

Completar `secure-config.js` con:
- `tenantId`
- `clientId`
- `estrellaShareUrl`
- `tresNinasShareUrl`

La app Entra debe permitir el origen donde se publica esta aplicación y contar con permiso delegado `Files.Read`.
