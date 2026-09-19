/**
 * Office Script: extraer 3 Niñas
 * Rutas 40–45. Para CREMA y SNACKS: 1 = comprador; 0/vacío = no comprador.
 * Busca automáticamente la fila real de encabezados en CLIENTE/CLIENTES.
 */
function main(workbook: ExcelScript.Workbook) {
  const allowedRoutes = new Set(["003140","003141","003142","003143","003144","003145"]);
  const ws = findSheet(workbook, ["CLIENTE","CLIENTES"]);
  if (!ws) throw new Error("No se encontró la solapa CLIENTE/CLIENTES.");

  const range = ws.getUsedRange();
  if (!range) {
    return {
      incentive:"3 Niñas",
      targets:{cream:35,snacks:35},
      updatedAt:new Date().toISOString(),
      clients:[]
    };
  }

  const values = range.getTexts();
  const headerRow = findHeaderRow(values);
  const headers = values[headerRow].map(normalize);

  const iRoute = findHeader(headers, ["RUTA PREVENTA","CODIGO RUTA PREVENTA"]);
  const iClient = findHeader(headers, ["CLIENTE"]);
  const iId = findHeader(headers, ["CODIGO CLIENTE","OUTNUM"]);
  const iChannel = findHeader(headers, ["PACK-LOCAL","PACK LOCAL"]);
  const iCream = findHeader(headers, ["CREMA"]);
  const iSnacks = findHeader(headers, ["SNACKS"]);

  const clients:any[] = [];
  for (let r=headerRow+1; r<values.length; r++) {
    const route = normalizeRoute(values[r][iRoute]);
    if (!allowedRoutes.has(route)) continue;

    const client = (values[r][iClient] || "").trim();
    if (!client) continue;

    const cream = (values[r][iCream] || "").trim();
    const snacks = (values[r][iSnacks] || "").trim();

    clients.push({
      route: route.slice(-2),
      routeCode: route,
      client,
      clientId: (values[r][iId] || "").trim(),
      channel: (values[r][iChannel] || "").trim(),
      creamBuyer: cream === "1",
      snacksBuyer: snacks === "1",
      creamRaw: cream,
      snacksRaw: snacks
    });
  }

  return {
    incentive:"3 Niñas",
    targets:{cream:35,snacks:35},
    updatedAt:new Date().toISOString(),
    rules:{buyer:"1 = comprador; 0 o vacío = no comprador"},
    clients
  };
}

function findSheet(workbook:ExcelScript.Workbook, names:string[]) {
  const wanted = names.map(normalize);
  for (const ws of workbook.getWorksheets()) {
    if (wanted.includes(normalize(ws.getName()))) return ws;
  }
  return undefined;
}

function findHeaderRow(values:string[][]): number {
  const maxRows = Math.min(values.length, 40);
  for (let r=0; r<maxRows; r++) {
    const row = values[r].map(normalize);
    const hasRoute = hasHeader(row, ["RUTA PREVENTA","CODIGO RUTA PREVENTA"]);
    const hasClient = hasHeader(row, ["CLIENTE"]);
    const hasCream = hasHeader(row, ["CREMA"]);
    const hasSnacks = hasHeader(row, ["SNACKS"]);
    if (hasRoute && hasClient && hasCream && hasSnacks) return r;
  }
  throw new Error("No se encontró la fila de encabezados de 3 Niñas. Debe contener Ruta Preventa, Cliente, CREMA y SNACKS.");
}

function hasHeader(headers:string[], candidates:string[]): boolean {
  const normalized = candidates.map(normalize);
  return headers.some(h => normalized.includes(h));
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
