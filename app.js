const KEY="album-peru-56-v1";
let state=JSON.parse(localStorage.getItem(KEY)||"{}");
let currentFilter="all", currentSearch="", currentSeries="all";

const album=document.querySelector("#album");
const nav=document.querySelector("#seriesNav");

function save(){localStorage.setItem(KEY,JSON.stringify(state)); renderStats();}
function isFound(id){return !!state[id]}
function toggle(id){state[id]=!state[id];if(!state[id])delete state[id];save();render();renderReferenceMarkers();}
function matches(c){
  const q=currentSearch.trim().toLowerCase();
  const search=!q || `${c.name} ${c.series} ${c.region} ${c.year}`.toLowerCase().includes(q);
  const filter=currentFilter==="all" || (currentFilter==="found"&&isFound(c.id)) || (currentFilter==="missing"&&!isFound(c.id));
  const series=currentSeries==="all" || c.series===currentSeries;
  return search&&filter&&series;
}
function grouped(){
  const groups={};
  MONEDAS.filter(matches).forEach(c=>(groups[c.series]??=[]).push(c));
  return groups;
}
function renderNav(){
  const series=[...new Set(MONEDAS.map(c=>c.series))];
  nav.innerHTML=`<button class="series-btn ${currentSeries==="all"?"active":""}" data-series="all">Todas <span>${MONEDAS.length}</span></button>`+
    series.map(s=>`<button class="series-btn ${currentSeries===s?"active":""}" data-series="${escapeAttr(s)}">${s} <span>${MONEDAS.filter(c=>c.series===s).length}</span></button>`).join("");
  nav.querySelectorAll(".series-btn").forEach(b=>b.onclick=()=>{currentSeries=b.dataset.series;renderNav();render()});
}

function renderReferenceMarkers(){
  const map=document.querySelector("#referenceMap");
  if(!map) return;
  map.querySelectorAll(".map-marker").forEach(x=>x.remove());
  Object.entries(REFERENCE_MARKERS).forEach(([id,pos])=>{
    const marker=document.createElement("span");
    marker.className="map-marker"+(isFound(Number(id))?" visible":"");
    marker.style.left=pos[0]+"%";
    marker.style.top=pos[1]+"%";
    marker.dataset.label="Moneda N.º "+String(id).padStart(2,"0");
    marker.title=isFound(Number(id))?"Encontrada":"Aún no marcada";
    map.appendChild(marker);
  });
}

function render(){
  const groups=grouped();
  const names=Object.keys(groups);
  if(!names.length){album.innerHTML='<div class="empty">No encontramos monedas con esos filtros.</div>';return}
  album.innerHTML=names.map(series=>`
    <section class="series-block">
      <div class="series-title"><h2>${series}</h2><small>${groups[series].length} piezas visibles</small></div>
      <div class="grid">${groups[series].map(card).join("")}</div>
    </section>`).join("");
  album.querySelectorAll(".coin-card").forEach(el=>el.onclick=()=>toggle(Number(el.dataset.id)));
}
function card(c) {
  const found = isFound(c.id);

  return `
    <article class="coin-card ${found ? "found" : ""}"
             data-id="${c.id}">

      <div class="badge">✓ TENGO</div>

      <div class="coin-image">
        ${
          c.image
            ? `
              <img
                src="${c.image}"
                alt="${c.name}"
                loading="lazy"
                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='grid';
                "
              >
              <div class="coin-placeholder"
                   style="display:none">
                Imagen no disponible
              </div>
            `
            : `
              <div class="coin-placeholder">
                Imagen pendiente
              </div>
            `
        }
      </div>

      <div class="coin-info">
        <div class="coin-no">
          N.º ${String(c.id).padStart(2, "0")} · ${c.year}
        </div>

        <div class="coin-name">${c.name}</div>

        <div class="coin-meta">
          <span>${c.region}</span>
          <span>S/ 1</span>
        </div>

        <div class="check">
          ${found
            ? "✓ EN MI COLECCIÓN"
            : "○ ME FALTA — clic para marcar"}
        </div>
      </div>
    </article>
  `;
}
function renderStats(){
  const found=Object.keys(state).filter(k=>state[k]).length;
  const pct=Math.round(found/MONEDAS.length*100);
  document.querySelector("#foundCount").textContent=found;
  document.querySelector("#missingCount").textContent=MONEDAS.length-found;
  document.querySelector("#progressText").textContent=`${found} de ${MONEDAS.length}`;
  document.querySelector("#progressPct").textContent=`${pct}%`;
  document.querySelector("#progressBar").style.width=pct+"%";
}
function escapeAttr(s){return s.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
document.querySelector("#search").addEventListener("input",e=>{currentSearch=e.target.value;render()});
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");currentFilter=b.dataset.filter;render();
});
document.querySelector("#resetBtn").onclick=()=>{
  if(confirm("¿Seguro que quieres borrar todo el progreso?")){state={};save();render();}
};
document.querySelector("#themeBtn").onclick=()=>{
  const dark=document.documentElement.dataset.theme==="dark";
  document.documentElement.dataset.theme=dark?"":"dark";
  localStorage.setItem("album-theme",dark?"light":"dark");
};
if(localStorage.getItem("album-theme")==="dark")document.documentElement.dataset.theme="dark";
renderNav();render();renderStats();renderReferenceMarkers();
