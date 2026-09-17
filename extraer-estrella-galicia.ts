/**
 * Office Script: extraer Estrella Galicia
 * Devuelve solo rutas 40–45.
 * Ajusta automáticamente CLIENTE/CLIENTES y tolera espacios en encabezados.
 */
function main(workbook: ExcelScript.Workbook) {
  const allowedRoutes = new Set(["003140","003141","003142","003143","003144","003145"]);
  const ws = findSheet(workbook, ["CLIENTES","CLIENTE"]);
  if (!ws) throw new Error("No se encontró la solapa CLIENTES/CLIENTE.");

  const range = ws.getUsedRange();
  if (!range) return { incentive:"Estrella Galicia", target:60, clients:[] };

  const values = range.getTexts();
  const headers = values[0].map(normalize);
  const iRoute = findHeader(headers, ["CODIGO RUTA PREVENTA","RUTA PREVENTA"]);
  const iClient = findHeader(headers, ["CLIENTE"]);
  const iId = findHeader(headers, ["OUTNUM","CODIGO CLIENTE"]);
  const iChannel = findHeader(headers, ["PACK-LOCAL","PACK LOCAL"]);
  const iEg = findHeader(headers, ["COMPRAD ESTRELLA GALICIA"]);

  const clients:any[] = [];
  for (let r=1; r<values.length; r++) {
    const route = normalizeRoute(values[r][iRoute]);
    if (!allowedRoutes.has(route)) continue;
    const raw = (values[r][iEg] || "").trim();
    clients.push({
      route: route.slice(-2),
      routeCode: route,
      client: (values[r][iClient] || "").trim(),
      clientId: (values[r][iId] || "").trim(),
      channel: (values[r][iChannel] || "").trim(),
      buyer: normalize(raw).includes("100")
    });
  }
  return {
    incentive:"Estrella Galicia",
    target:60,
    updatedAt:new Date().toISOString(),
    rules:{buyer:"COMPRAD ESTRELLA GALICIA = 100%; vacío = no comprador"},
    clients
  };
}

function findSheet(workbook:ExcelScript.Workbook, names:string[]) {
  for (const ws of workbook.getWorksheets()) {
    if (names.includes(normalize(ws.getName()))) return ws;
  }
  return undefined;
}
function normalize(v:string) {
  return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g," ").trim().toUpperCase();
}
function normalizeRoute(v:string) {
  const digits = String(v ?? "").replace(/\D/g,"");
  return digits.padStart(6,"0");
}
function findHeader(headers:string[], candidates:string[]) {
  const normalized = candidates.map(normalize);
  const idx = headers.findIndex(h => normalized.includes(h));
  if (idx < 0) throw new Error(`No se encontró encabezado: ${candidates.join(" / ")}`);
  return idx;
}
