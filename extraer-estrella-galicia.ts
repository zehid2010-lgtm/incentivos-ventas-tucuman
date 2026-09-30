/**
 * Office Script: extraer Estrella Galicia
 * Devuelve solo rutas 40–45.
 * Toma el % oficial de "% COB ESTRELLA GALICIA" cuando está disponible,
 * para que la app replique exactamente el Avance.
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
      routeCoverage: {},
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

  const coverageData = findOfficialCoverage(workbook, allowedRoutes);

  return {
    incentive: "Estrella Galicia",
    target: 60,
    updatedAt: new Date().toISOString(),
    rules: {
      buyer: "COMPRAD ESTRELLA GALICIA = 100%; vacío = no comprador",
      coverage: "% COB ESTRELLA GALICIA del informe Avance tiene prioridad sobre el cálculo por clientes"
    },
    routeCoverage: coverageData.routeCoverage,
    overallCoverage: coverageData.overallCoverage,
    clients: clients
  };
}

function findOfficialCoverage(
  workbook: ExcelScript.Workbook,
  allowedRoutes: Set<string>
): { routeCoverage: { [route: string]: number }, overallCoverage: number | null } {
  const result: { [route: string]: number } = {};
  let overallCoverage: number | null = null;

  for (const sheet of workbook.getWorksheets()) {
    const used = sheet.getUsedRange();
    if (!used) continue;

    const texts = used.getTexts();
    const maxRows = texts.length;

    for (let r = 0; r < maxRows; r++) {
      const headers = texts[r].map(v => normalize(v));
      const routeIdx = headers.findIndex(h =>
        (h.includes("RUTA") && h.includes("PREVENTA")) ||
        h === "CODIGO RUTA" ||
        h === "RUTA"
      );
      const coverageIdx = headers.findIndex(h =>
        h.includes("COB") &&
        h.includes("ESTRELLA") &&
        h.includes("GALICIA")
      );

      if (routeIdx < 0 || coverageIdx < 0) continue;

      for (let row = r + 1; row < texts.length; row++) {
        const route = normalizeRoute(texts[row][routeIdx]);
        if (!allowedRoutes.has(route)) continue;

        const coverage = parsePercentage(texts[row][coverageIdx]);
        if (coverage === null) continue;

        result[route.slice(-2)] = coverage;
      }

      // Busca también la fila general del jefe/CEDI sin ruta informada.
      const jefeIdx = headers.findIndex(h => h.includes("JEFE") && h.includes("DESARROLLADOR"));
      if (jefeIdx >= 0) {
        for (let row = r + 1; row < texts.length; row++) {
          const jefe = normalize(texts[row][jefeIdx]);
          if (!jefe.includes("ZEHID") || !jefe.includes("RICARDO")) continue;

          const routeRaw = String(texts[row][routeIdx] ?? "").trim();
          if (routeRaw) continue;

          const coverage = parsePercentage(texts[row][coverageIdx]);
          if (coverage !== null) overallCoverage = coverage;
        }
      }
    }
  }

  return { routeCoverage: result, overallCoverage };
}

function parsePercentage(value: string): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/\s/g, "")
    .replace("%", "")
    .replace(",", ".");

  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;

  if (raw.includes("%")) return num;
  return num <= 1 ? num * 100 : num;
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
  const idx = findHeaderOptional(headers, candidates);
  if (idx < 0) throw new Error(`No se encontró encabezado: ${candidates.join(" / ")}`);
  return idx;
}

function findHeaderOptional(headers: string[], candidates: string[]): number {
  const normalized = candidates.map(v => normalize(v));
  return headers.findIndex(h => normalized.includes(h));
}
