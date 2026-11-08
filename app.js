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

async function loadClients() {
  const response = await fetch("./choco-clientes.json", {cache: "no-store"});
  if (!response.ok) throw new Error("No se pudo cargar el listado.");
  const {corte, clientes} = await response.json();
  const selector = $("routeSelect");
  const search = $("searchInput");
  const list = $("clientList");
  let product = 2;
  let status = "all";
  function render() {
    const query = search.value.trim().toLocaleLowerCase("es");
    const rows = clientes.filter(row => row[0] === selector.value && (row[1].includes(query) || (row[4] || "").toLocaleLowerCase("es").includes(query)) &&
      (status === "all" || Boolean(row[product]) === (status === "buyers")));
    rows.sort((a, b) => a[product] - b[product] || a[1].localeCompare(b[1], "es", {numeric:true}));
    $("clientCount").textContent = rows.length + " clientes · Ruta " + selector.value + " · Corte " + corte;
    list.replaceChildren(...rows.map(row => {
      const item = $("clientTemplate").content.cloneNode(true);
      item.querySelector(".client-name").textContent = row[4] || row[1];
      item.querySelector(".client-meta").textContent = row[1] + " · " + (product === 2 ? "Choco 1 L" : "Choco 200 ml");
      const badge = item.querySelector(".client-status");
      badge.className = "client-status badge " + (row[product] ? "ok" : "pending");
      badge.textContent = row[product] ? "COMPRADOR" : "PENDIENTE";
      return item;
    }));
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No hay clientes para este filtro.";
      list.append(empty);
    }
  }
  for (const [id, key, change] of [
    ["statusFilters", "filter", value => { status = value; }],
    ["categoryFilters", "category", value => { product = value === "protein" ? 2 : 3; }]
  ]) {
    const group = $(id);
    group.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || !button.dataset[key]) return;
      change(button.dataset[key]);
      group.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
      render();
    });
  }
  selector.addEventListener("change", render);
  search.addEventListener("input", render);
  $("openChocoClients").addEventListener("click", () => $("chocoClients").scrollIntoView({behavior:"smooth"}));
  render();
}
loadClients().catch(() => {
  $("clientCount").textContent = "No se pudo cargar el listado de clientes.";
});
