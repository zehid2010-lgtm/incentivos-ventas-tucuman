const ROUTES = ["40","41","42","43","44","45"];
let data = { estrella:null, ninas:null };
let currentMode = "estrella";
let currentStatus = "all";
let currentCategory = "cream";

const $ = id => document.getElementById(id);
const pct = value => `${value.toFixed(1).replace(".",",")}%`;
const ceilTarget = (total, targetPct) => Math.ceil(total * targetPct / 100);

async function loadData(){
  const [e,n] = await Promise.all([
    fetch("estrella.json").then(r=>r.json()),
    fetch("tres-ninas.json").then(r=>r.json())
  ]);
  data.estrella=e; data.ninas=n;
  const newest = [new Date(e.updatedAt),new Date(n.updatedAt)].sort((a,b)=>b-a)[0];
  $("lastUpdate").textContent = `Última actualización: ${newest.toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"})}`;
  render();
}

function routeClients(source, route){
  return source.clients.filter(c=>c.route===route);
}

function render(){
  const route = $("routeSelect").value;
  renderSummary(route);
  renderList(route);
}

function renderSummary(route){
  const e = routeClients(data.estrella, route);
  const eb = e.filter(c=>c.buyer).length;
  const ep = e.length ? eb/e.length*100 : 0;
  const et = ceilTarget(e.length, data.estrella.target);
  $("estrellaPct").textContent=pct(ep);
  $("estrellaBuyers").textContent=eb;
  $("estrellaTotal").textContent=e.length;
  $("estrellaMissing").textContent=Math.max(0,et-eb);
  $("estrellaBar").style.width=`${Math.min(ep,100)}%`;

  const n = routeClients(data.ninas, route);
  const cb = n.filter(c=>c.creamBuyer).length;
  const sb = n.filter(c=>c.snacksBuyer).length;
  const cp = n.length ? cb/n.length*100 : 0;
  const sp = n.length ? sb/n.length*100 : 0;
  const ct = ceilTarget(n.length, data.ninas.targets.cream);
  const st = ceilTarget(n.length, data.ninas.targets.snacks);
  $("creamPct").textContent=pct(cp);
  $("creamBuyers").textContent=cb;
  $("creamMissing").textContent=Math.max(0,ct-cb);
  $("creamBar").style.width=`${Math.min(cp,100)}%`;
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
    const buyer = currentMode==="estrella" ? c.buyer : (currentCategory==="cream" ? c.creamBuyer : c.snacksBuyer);
    const statusOk = currentStatus==="all" || (currentStatus==="buyers" && buyer) || (currentStatus==="pending" && !buyer);
    const searchOk = !q || c.client.toLowerCase().includes(q) || String(c.clientId).toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  clients.sort((a,b)=>{
    const ab = currentMode==="estrella" ? a.buyer : (currentCategory==="cream" ? a.creamBuyer : a.snacksBuyer);
    const bb = currentMode==="estrella" ? b.buyer : (currentCategory==="cream" ? b.creamBuyer : b.snacksBuyer);
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
    const buyer = currentMode==="estrella" ? c.buyer : (currentCategory==="cream" ? c.creamBuyer : c.snacksBuyer);
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
  $("clientList").innerHTML='<div class="empty">No se pudieron cargar los archivos JSON. Para probar localmente, levantá un servidor HTTP simple o publicá la carpeta.</div>';
});
