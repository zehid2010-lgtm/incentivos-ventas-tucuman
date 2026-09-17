# Diseño del flujo Power Automate

## Flujo A – Estrella Galicia
1. **When a new email arrives (V3)**.
2. Condición por asunto: contiene `Avance y Seguimiento Multicategorias`.
3. Obtener adjunto Excel.
4. Guardarlo temporalmente en OneDrive/SharePoint.
5. **Run script** → `extraer-estrella-galicia.ts`.
6. Tomar el objeto JSON devuelto.
7. Actualizar `data/estrella.json` en el repositorio o en el backend de la app.
8. Eliminar archivo temporal si corresponde.

## Flujo B – 3 Niñas
1. **When a new email arrives (V3)**.
2. Condición por asunto: contiene `INFORME ZSx3A COB LAS 3 NIÑAS`.
3. Obtener adjunto Excel.
4. Guardarlo temporalmente.
5. **Run script** → `extraer-tres-ninas.ts`.
6. Tomar el objeto JSON devuelto.
7. Actualizar `data/tres-ninas.json`.
8. Eliminar temporal.

## Recomendación de seguridad
Los JSON contienen datos de clientes. No deben quedar expuestos en un sitio público. Antes de automatizar el paso 7 conviene definir si la publicación será privada/autenticada o si el backend guardará los datos fuera de GitHub.
