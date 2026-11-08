const $ = id => document.getElementById(id);
const pct = (buyers, total) => (buyers * 100 / total)
  .toLocaleString("es-AR", {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "%";

async function loadChoco() {
  const response = await fetch("./choco-noviembre.json", {cache: "no-store"});
  if (!response.ok) throw new Error("No se pudo cargar el resumen Choco.");
  const {avanceReporte: summary, corte, updatedAt} = await response.json();
  const selector = $("routeSelect");

  $("lastUpdate").textContent = corte ? "Corte del reporte · 07/11/2026" :
    "Recepción · " + new Date(updatedAt).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short"
    });
  $("ninasDataStatus").textContent = "Avance por ruta · Reporte de noviembre";
  $("mesaProteinPct").textContent = pct(summary.choco1L, summary.clientesBase);
  $("mesaSnacksPct").textContent = pct(summary.choco200ml, summary.clientesBase);
  $("mesaProteinBuyers").textContent = summary.choco1L;
  $("mesaSnacksBuyers").textContent = summary.choco200ml;
  $("mesaProteinTotal").textContent = summary.clientesBase;
  $("mesaSnacksTotal").textContent = summary.clientesBase;

  function renderRoute() {
    const route = summary.porRuta.find(row => row.ruta === selector.value);
    $("ninasDataStatus").textContent = "Reporte de noviembre · " + route.clientesBase + " clientes base";
    for (const [prefix, buyers, target] of [
      ["protein", route.choco1L, 15], ["snacks", route.choco200ml, 50]
    ]) {
      $(prefix + "Pct").textContent = pct(buyers, route.clientesBase);
      $(prefix + "Buyers").textContent = buyers;
      $(prefix + "Missing").textContent = Math.max(0, Math.ceil(route.clientesBase * target / 100) - buyers);
      $(prefix + "Bar").style.width = buyers * 100 / route.clientesBase + "%";
    }
  }

  selector.addEventListener("change", renderRoute);
  renderRoute();
}

loadChoco().catch(error => {
  console.error(error);
  $("lastUpdate").textContent = "Error al cargar el reporte Choco";
});
