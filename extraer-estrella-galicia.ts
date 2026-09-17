/**
 * Office Script: extraer Estrella Galicia
 * Devuelve solo rutas 40–45.
 * Busca automáticamente la fila real de encabezados en CLIENTE/CLIENTES.
 */
function main(workbook: ExcelScript.Workbook) {
  const allowedRoutes = new Set(["003140", "003141", "003142", "003143", "003144", "003145"]);
  const ws = findSheet(workbook, ["CLIENTES", "CLIENTE"]);
  if (!ws) throw new Error("No se encontró la solapa CLIENTES/CLIENTE.");

  const range = ws.getUsedRange();
  if (!range) {
    return {
      incentive: "Estrella Galicia",
      target: 60,
      updatedAt: new Date().toISOString(),
      clients: []
    };
  }

  const values = range.getTexts();
  const headerRow = findHeaderRow(values);
  const headers = values[headerRow].map(v => normalize(v));

  const iRoute = findHeader(headers, ["CODIGO RUTA PREVENTA", "RUTA PREVENTA"]);
  const iClient = findHeader(headers, ["CLIENTE"]);
  const iId = findHeader(headers, ["OUTNUM", "CODIGO CLIENTE"]);
  const iChannel = findHeader(headers, ["PACK-LOCAL", "PACK LOCAL"]);
  const iEg = findHeader(headers, ["COMPRAD ESTRELLA GALICIA"]);

  const clients: {
    route: string;
    routeCode: string;
    client: string;
    clientId: string;
    channel: string;
    buyer: boolean;
  }[] = [];

  for (let r = headerRow + 1; r < values.length; r++) {
    const route = normalizeRoute(values[r][iRoute]);
    if (!allowedRoutes.has(route)) continue;

    const client = (values[r][iClient] || "").trim();
    if (!client) continue;

    const raw = (values[r][iEg] || "").trim();

    clients.push({
      route: route.slice(-2),
      routeCode: route,
      client: client,
      clientId: (values[r][iId] || "").trim(),
      channel: (values[r][iChannel] || "").trim(),
      buyer: normalize(raw).includes("100")
    });
  }

  return {
    incentive: "Estrella Galicia",
    target: 60,
    updatedAt: new Date().toISOString(),
    rules: {
      buyer: "COMPRAD ESTRELLA GALICIA = 100%; vacío = no comprador"
    },
    clients: clients
  };
}

function findSheet(workbook: ExcelScript.Workbook, names: string[]): ExcelScript.Worksheet | undefined {
  const wanted = names.map(v => normalize(v));
  for (const ws of workbook.getWorksheets()) {
    if (wanted.includes(normalize(ws.getName()))) return ws;
  }
  return undefined;
}

function findHeaderRow(values: string[][]): number {
  const maxRows = Math.min(values.length, 40);

  for (let r = 0; r < maxRows; r++) {
    const row = values[r].map(v => normalize(v));
    const hasRoute = hasHeader(row, ["CODIGO RUTA PREVENTA", "RUTA PREVENTA"]);
    const hasClient = hasHeader(row, ["CLIENTE"]);
    const hasEstrella = hasHeader(row, ["COMPRAD ESTRELLA GALICIA"]);

    if (hasRoute && hasClient && hasEstrella) return r;
  }

  throw new Error("No se encontró la fila de encabezados en la solapa CLIENTES. Debe contener Ruta Preventa, Cliente y COMPRAD ESTRELLA GALICIA.");
}

function hasHeader(headers: string[], candidates: string[]): boolean {
  const normalized = candidates.map(v => normalize(v));
  return headers.some(h => normalized.includes(h));
}

function normalize(v: string): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeRoute(v: string): string {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits.padStart(6, "0");
}

function findHeader(headers: string[], candidates: string[]): number {
  const normalized = candidates.map(v => normalize(v));
  const idx = headers.findIndex(h => normalized.includes(h));
  if (idx < 0) throw new Error(`No se encontró encabezado: ${candidates.join(" / ")}`);
  return idx;
}
