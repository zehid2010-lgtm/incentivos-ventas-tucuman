interface ClientData {
    r: string;
    n: string;
    i: string;
    h: string;
    k: number;
    p: number;
    s: number;
}

interface ScriptResult {
    period: string;
    u: string;
    t: { protein: number; snacks: number };
    c: ClientData[];
}

function main(workbook: ExcelScript.Workbook): ScriptResult {
    const ws = workbook.getWorksheet("CLIENTE") ?? workbook.getWorksheet("CLIENTES");
    if (!ws) throw new Error("No se encontró CLIENTE/CLIENTES.");
    const periodValue = ws.getRange("C2").getText().trim();
    if (periodValue !== "202610") {
        throw new Error("Se requiere el reporte de octubre 2026. Año / Mes: " + periodValue);
    }
    const range = ws.getUsedRange(true);
    if (!range) throw new Error("La hoja CLIENTE está vacía.");
    const texts = range.getTexts();
    const raw = range.getValues();
    let headerRow = -1;
    for (let r = 0; r < Math.min(texts.length, 40); r++) {
        const row = texts[r].map(v => normalize(v));
        if (row.includes("CLIENTE") && row.includes("COMPRAD KO (TKA)") &&
            (row.includes("RUTA PREVENTA") || row.includes("CODIGO RUTA PREVENTA"))) {
            headerRow = r;
            break;
        }
    }
    if (headerRow < 0) throw new Error("No se encontraron los encabezados.");
    const headers = texts[headerRow].map(v => normalize(v));
    const iRoute = findHeader(headers, ["RUTA PREVENTA", "CODIGO RUTA PREVENTA"]);
    const iClient = findHeader(headers, ["CLIENTE"]);
    const iId = findHeader(headers, ["CODIGO CLIENTE", "OUTNUM"]);
    const iChannel = findHeader(headers, ["PACK-LOCAL", "PACK LOCAL"]);
    const iKo = findHeader(headers, ["COMPRAD KO (TKA)"]);
    const iProtein = findHeader(headers, ["PROTEINA", "PROTEINAS"]);
    const iSnacks = findHeader(headers, ["SNACKS"]);
    const routes: string[] = ["003140", "003141", "003142", "003143", "003144", "003145"];
    const clients: ClientData[] = [];
    for (let r = headerRow + 1; r < texts.length; r++) {
        const route = String(texts[r][iRoute] ?? "").replace(/\D/g, "").padStart(6, "0");
        if (!routes.includes(route)) continue;
        const name = String(texts[r][iClient] ?? "").trim();
        if (!name) continue;
        const base = isPositive(texts[r][iKo], raw[r][iKo]);
        const protein = isPositive(texts[r][iProtein], raw[r][iProtein]);
        const snacks = isPositive(texts[r][iSnacks], raw[r][iSnacks]);
        // La base cuenta KO; los compradores de cada marca se cuentan aparte.
        if (!base && !protein && !snacks) continue;
        clients.push({
            r: route.slice(-2),
            n: name,
            i: String(texts[r][iId] ?? "").trim(),
            h: String(texts[r][iChannel] ?? "").trim(),
            k: base ? 1 : 0,
            p: protein ? 1 : 0,
            s: snacks ? 1 : 0
        });
    }
    return {
        period: "2026-10",
        u: new Date().toISOString(),
        t: { protein: 45, snacks: 35 },
        c: clients
    };
}

function isPositive(textValue: string, rawValue: string | number | boolean): boolean {
    if (typeof rawValue === "number") return rawValue > 0;
    const text = String(textValue ?? "").trim().replace("%", "").replace(",", ".");
    const value = Number(text);
    return text !== "" && Number.isFinite(value) && value > 0;
}

function normalize(value: string): string {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().toUpperCase().replace(/\s+/g, " ");
}

function findHeader(headers: string[], candidates: string[]): number {
    for (let i = 0; i < candidates.length; i++) {
        const index = headers.indexOf(normalize(candidates[i]));
        if (index >= 0) return index;
    }
    throw new Error("No se encontró encabezado: " + candidates.join(" / "));
}
