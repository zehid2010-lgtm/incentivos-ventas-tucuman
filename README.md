# Incentivos de Venta – Tucumán

Aplicación web móvil para seguimiento de dos incentivos en rutas 40–45:

1. **Estrella Galicia**
   - Fuente: solapa `CLIENTES` / columna `COMPRAD ESTRELLA GALICIA`
   - `100%` = comprador
   - vacío = no comprador
   - Meta de cobertura: **60%**

2. **3 Niñas**
   - Fuente: solapa `CLIENTE`
   - Columnas: `CREMA` y `SNACKS`
   - `1` = comprador
   - `0` o vacío = no comprador
   - Meta Cremas: **35%**
   - Meta Snacks: **35%**

## Estructura

- `index.html` interfaz
- `styles.css` estilos
- `app.js` cálculo de cobertura, faltantes y filtros
- `data/estrella.json` datos normalizados de Estrella Galicia
- `data/tres-ninas.json` datos normalizados de 3 Niñas
- `power-automate/` scripts de extracción para usar desde Power Automate + Excel Online

## Importante

Los datos contienen nombres y códigos de clientes. **No publicar este repositorio como público.**
Usar repositorio privado y un método de publicación/autenticación aprobado por la empresa.

## Prueba local

Como la app carga archivos JSON, debe abrirse mediante HTTP. Por ejemplo:

```bash
python -m http.server 8080
```

y luego abrir `http://localhost:8080`.

## Próximo paso

Configurar dos flujos en Power Automate (o uno con dos ramas) que detecten los correos de BI, guarden el Excel temporalmente, ejecuten el Office Script correspondiente y actualicen los JSON usados por la app.
