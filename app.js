const ROUTES = ["40","41","42","43","44","45"];
const DATA_BASE = "./";
let data = { estrella:null, ninas:null };
let currentMode = "estrella";
let currentStatus = "all";
let currentCategory = "protein";

const $ = id => document.getElementById(id);
const pct = value => `${value.toFixed(1).replace(".",",")}%`;
const ceilTarget = (total, targetPct) => Math.ceil(total * targetPct / 100);
const formatDate = value => new Date(value).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"});

async function fetchJson(path){
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${Date.now()}`, { cache:"no-store" });
  if(!response.ok) throw new Error(`No se pudo cargar ${path}: HTTP ${response.status}`);
  return response.json();
}

async function loadData(){
  const [e,n] = await Promise.all([
    fetchJson(DATA_BASE + "estrella.json"),
    fetchJson(DATA_BASE + "tres-ninas.json")
  ]);
  data.estrella=e;
  const octoberReady = n.period === "2026-10" && n.clients.every(c => typeof c.proteinBuyer === "boolean");
  data.ninas = {...n, ready:octoberReady, targets:{protein:45,snacks:35},
    clients:n.clients.map(c => ({...c, proteinBuyer:octoberReady ? c.proteinBuyer : false, snacksBuyer:octoberReady ? c.snacksBuyer : false}))};
  $("lastUpdate").textContent = `Estrella: ${formatDate(e.updatedAt)} · 3 Niñas: ${formatDate(n.updatedAt)}`;
  render();
}

function routeClients(source, route){
  return source.clients.filter(c=>c.route===route);
}

function officialEstrellaPct(route, clients){
  const value = data.estrella?.routeCoverage?.[route];
  return Number.isFinite(Number(value))
    ? Number(value)
    : (clients.length ? clients.filter(c=>c.buyer).length/clients.length*100 : 0);
}

function render(){
  const route = $("routeSelect").value;
  renderMesaSummary();
  renderSummary(route);
  renderList(route);
  $("ninasDataStatus").textContent = data.ninas.ready ? "Reporte de octubre · Proteína + Snacks" : "Pendiente de reporte de octubre";
  if (!data.ninas.ready) {
    ["mesaProteinPct","mesaSnacksPct","proteinPct","snacksPct","mesaProteinBuyers","mesaSnacksBuyers","proteinBuyers","snacksBuyers","proteinMissing","snacksMissing","mesaProteinTotal","mesaSnacksTotal"].forEach(id => $(id).textContent = "—");
    if (currentMode === "ninas") {
      $("clientCount").textContent = "Pendiente de reporte de octubre";
      $("clientList").innerHTML = '<div class="empty">Esperando el reporte de octubre con Proteína y Snacks.</div>';
    }
  }
}

function renderMesaSummary(){
  const e = data.estrella.clients;
  const eb = e.filter(c=>c.buyer).length;
  const calculatedEp = e.length ? eb/e.length*100 : 0;
  const ep = Number.isFinite(Number(data.estrella?.overallCoverage))
    ? Number(data.estrella.overallCoverage)
    : calculatedEp;

  $("mesaEstrellaPct").textContent = pct(ep);
  $("mesaEstrellaBuyers").textContent = eb;
  $("mesaEstrellaTotal").textContent = e.length;

  const n = data.ninas.clients;
  const cb = n.filter(c=>c.proteinBuyer).length;
  const sb = n.filter(c=>c.snacksBuyer).length;
  const cp = n.length ? cb/n.length*100 : 0;
  const sp = n.length ? sb/n.length*100 : 0;

  $("mesaProteinPct").textContent = pct(cp);
  $("mesaProteinBuyers").textContent = cb;
  $("mesaProteinTotal").textContent = n.length;

  $("mesaSnacksPct").textContent = pct(sp);
  $("mesaSnacksBuyers").textContent = sb;
  $("mesaSnacksTotal").textContent = n.length;
}

function renderSummary(route){
  const e = routeClients(data.estrella, route);
  const ep = officialEstrellaPct(route, e);
  const eb = Number.isFinite(data.estrella?.routeCoverage?.[route])
    ? Math.round(e.length * ep / 100)
    : e.filter(c=>c.buyer).length;
  const et = ceilTarget(e.length, data.estrella.target);
  $("estrellaPct").textContent=pct(ep);
  $("estrellaBuyers").textContent=eb;
  $("estrellaTotal").textContent=e.length;
  $("estrellaMissing").textContent=Math.max(0,et-eb);
  $("estrellaBar").style.width=`${Math.min(ep,100)}%`;

  const n = routeClients(data.ninas, route);
  const cb = n.filter(c=>c.proteinBuyer).length;
  const sb = n.filter(c=>c.snacksBuyer).length;
  const cp = n.length ? cb/n.length*100 : 0;
  const sp = n.length ? sb/n.length*100 : 0;
  const ct = ceilTarget(n.length, data.ninas.targets.protein);
  const st = ceilTarget(n.length, data.ninas.targets.snacks);
  $("proteinPct").textContent=pct(cp);
  $("proteinBuyers").textContent=cb;
  $("proteinMissing").textContent=Math.max(0,ct-cb);
  $("proteinBar").style.width=`${Math.min(cp,100)}%`;
  $("snacksPct").textContent=pct(sp);
  $("snacksBuyers").textContent=sb;
  $("snacksMissing").textContent=Math.max(0,st-sb);
  $("snacksBar").style.width=`${Math.min(sp,100)}%`;
}

function renderList(route){
  const q = $("searchInput").value.trim().toLowerCase();
  const list = $("clientList");
  list.innerHTML="";
  let clients = currentMode==="estrella"
    ? routeClients(data.estrella,route)
    : routeClients(data.ninas,route);

  $("listTitle").textContent = currentMode==="estrella" ? "Clientes Estrella Galicia" : "Clientes 3 Niñas";
  $("categoryFilters").classList.toggle("hidden", currentMode!=="ninas");

  clients = clients.filter(c=>{
    const buyer = currentMode==="estrella" ? c.buyer : (currentCategory==="protein" ? c.proteinBuyer : c.snacksBuyer);
    const statusOk = currentStatus==="all" || (currentStatus==="buyers" && buyer) || (currentStatus==="pending" && !buyer);
    const searchOk = !q || c.client.toLowerCase().includes(q) || String(c.clientId).toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  clients.sort((a,b)=>{
    const ab = currentMode==="estrella" ? a.buyer : (currentCategory==="protein" ? a.proteinBuyer : a.snacksBuyer);
    const bb = currentMode==="estrella" ? b.buyer : (currentCategory==="protein" ? b.proteinBuyer : b.snacksBuyer);
    if(ab!==bb) return ab ? 1 : -1;
    return a.client.localeCompare(b.client,"es");
  });

  $("clientCount").textContent=`${clients.length} clientes mostrados`;

  if(!clients.length){
    list.innerHTML='<div class="empty">No hay clientes para este filtro.</div>';
    return;
  }

  const tpl=$("clientTemplate");
  clients.forEach(c=>{
    const node=tpl.content.cloneNode(true);
    node.querySelector(".client-name").textContent=c.client;
    node.querySelector(".client-meta").textContent=`${c.clientId} · ${c.channel}`;
    const buyer = currentMode==="estrella" ? c.buyer : (currentCategory==="protein" ? c.proteinBuyer : c.snacksBuyer);
    const badge=node.querySelector(".client-status");
    badge.className=`client-status badge ${buyer?"ok":"pending"}`;
    badge.textContent=buyer?"COMPRADOR":"PENDIENTE";
    list.appendChild(node);
  });
}

document.addEventListener("click",e=>{
  const open=e.target.closest("[data-open]");
  if(open){
    currentMode=open.dataset.open;
    currentStatus="all";
    document.querySelectorAll("#statusFilters button").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));
    render();
    document.querySelector(".list-card").scrollIntoView({behavior:"smooth",block:"start"});
  }
  const sf=e.target.closest("#statusFilters button");
  if(sf){
    currentStatus=sf.dataset.filter;
    document.querySelectorAll("#statusFilters button").forEach(b=>b.classList.toggle("active",b===sf));
    render();
  }
  const cf=e.target.closest("#categoryFilters button");
  if(cf){
    currentCategory=cf.dataset.category;
    document.querySelectorAll("#categoryFilters button").forEach(b=>b.classList.toggle("active",b===cf));
    render();
  }
});
$("routeSelect").addEventListener("change",render);
$("searchInput").addEventListener("input",render);

loadData().catch(err=>{
  console.error(err);
  $("lastUpdate").textContent="Error al cargar los datos";
  $("clientList").innerHTML='<div class="empty">No se pudieron cargar los archivos JSON.</div>';
});
