
/* =========================================================
   ABAS PRINCIPAIS DO PORTAL
   ========================================================= */

function activatePortalTab(tabId, updateHash=true){
  const target=document.getElementById(tabId);
  if(!target)return;

  document.querySelectorAll(".portal-tab").forEach(el=>{
    el.classList.toggle("active",el.id===tabId);
  });

  document.querySelectorAll(".nav-tab").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.tab===tabId);
  });

  if(updateHash){
    history.replaceState(null,"","#"+tabId);
  }

  window.scrollTo({top:0,behavior:"smooth"});
}

function initPortalTabs(){
  document.querySelectorAll(".nav-tab").forEach(btn=>{
    btn.addEventListener("click",()=>activatePortalTab(btn.dataset.tab));
  });

  const hash=(location.hash||"").replace("#","");
  const valid=["capa","comparador","noticias","entrevistas","cooperativas","links","faq","contato"];
  activatePortalTab(valid.includes(hash)?hash:"capa",false);
}

window.activatePortalTab=activatePortalTab;



const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmtDate=v=>{if(!v)return"";const d=new Date(v+"T12:00:00");return d.toLocaleDateString("pt-BR")};
let DATA={};

async function api(path,opts={}){const r=await fetch(path,opts);if(!r.ok)throw new Error(await r.text());return r.json()}
function youtubeId(url){
 if(!url)return null;
 try{
  const u=new URL(url);
  if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];
  if(u.pathname.includes("/shorts/"))return u.pathname.split("/shorts/")[1].split("/")[0];
  if(u.pathname.includes("/embed/"))return u.pathname.split("/embed/")[1].split("/")[0];
  return u.searchParams.get("v");
 }catch{return null}
}
async function track(type,id){
 fetch("/api/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,id})}).catch(()=>{});
}

let HERO_ITEMS=[],HERO_INDEX=0,HERO_TIMER=null;
function setupHeroCarousel(arts){
 HERO_ITEMS=(arts||[]).slice(0,8);
 if(!HERO_ITEMS.length)return;
 const main=$("heroMain");
 if(!$("heroControls")){
  const controls=document.createElement("div");
  controls.id="heroControls";
  controls.className="hero-controls";
  controls.innerHTML=`<button id="heroPrev" aria-label="Notícia anterior">‹</button><div id="heroDots" class="hero-dots"></div><button id="heroNext" aria-label="Próxima notícia">›</button>`;
  main.appendChild(controls);
  $("heroPrev").onclick=e=>{e.stopPropagation();showHero((HERO_INDEX-1+HERO_ITEMS.length)%HERO_ITEMS.length,true)};
  $("heroNext").onclick=e=>{e.stopPropagation();showHero((HERO_INDEX+1)%HERO_ITEMS.length,true)};
  main.addEventListener("mouseenter",()=>clearInterval(HERO_TIMER));
  main.addEventListener("mouseleave",startHeroTimer);
 }
 $("heroDots").innerHTML=HERO_ITEMS.map((_,i)=>`<button class="hero-dot" data-i="${i}" aria-label="Abrir manchete ${i+1}"></button>`).join("");
 document.querySelectorAll(".hero-dot").forEach(d=>d.onclick=e=>{e.stopPropagation();showHero(+d.dataset.i,true)});
 showHero(0,false);
 startHeroTimer();
}
function showHero(index,restart){
 if(!HERO_ITEMS.length)return;
 HERO_INDEX=index;
 const a=HERO_ITEMS[index];
 $("heroImg").src=a.image_url||"";
 $("heroCat").textContent=a.category||"";
 $("heroTitle").textContent=a.title||"";
 $("heroSummary").textContent=a.summary||"";
 $("heroMain").onclick=()=>openArticle(a.id);
 document.querySelectorAll(".hero-dot").forEach((d,i)=>d.classList.toggle("active",i===index));
 if(restart)startHeroTimer();
}
function startHeroTimer(){
 clearInterval(HERO_TIMER);
 if(HERO_ITEMS.length>1)HERO_TIMER=setInterval(()=>showHero((HERO_INDEX+1)%HERO_ITEMS.length,false),6500);
}

function articleCard(a){
 return `<article class="card" onclick="openArticle(${a.id})" style="cursor:pointer">
 ${a.image_url?`<img src="${esc(a.image_url)}" alt="">`:""}<div class="card-body"><div class="cat">${esc(a.category)}</div><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="meta">${esc(a.author||"Redação")} • ${fmtDate(a.published_at)}</div></div></article>`;
}
function relativePublishedTime(value){
 if(!value)return "";
 const hasTime=String(value).includes("T");
 let d;
 if(hasTime){
  d=new Date(value);
 }else{
  const parts=String(value).split("-").map(Number);
  if(parts.length!==3)return "";
  d=new Date(parts[0],parts[1]-1,parts[2],12,0,0);
 }
 if(Number.isNaN(d.getTime()))return "";
 const now=new Date();
 if(!hasTime){
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const day=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diffDays=Math.round((today-day)/86400000);
  if(diffDays<=0)return "publicado hoje";
  if(diffDays===1)return "publicado ontem";
  return `publicado há ${diffDays} dias`;
 }
 const sec=Math.max(0,Math.floor((now-d)/1000));
 if(sec<60)return "publicado agora";
 const min=Math.floor(sec/60);
 if(min<60)return `publicado há ${min} min`;
 const hr=Math.floor(min/60);
 if(hr<24)return `publicado há ${hr} h`;
 const days=Math.floor(hr/24);
 if(days===1)return "publicado ontem";
 if(days<30)return `publicado há ${days} dias`;
 return `publicado em ${fmtDate(String(value).slice(0,10))}`;
}
function renderBreakingTicker(articles,settingsText){
 const host=$("breakingText");
 if(!host)return;
 const latest=(articles||[]).slice(0,8);
 const items=[];
 if(settingsText && settingsText.trim())items.push({label:settingsText.trim(),id:null,time:""});
 latest.forEach(a=>items.push({label:a.title||"",id:a.id,time:relativePublishedTime(a.published_at)}));
 if(!items.length){host.textContent="Últimas atualizações do Jornal Coopera Natal";return}
 host.innerHTML=`<div class="breaking-viewport"><div class="breaking-track">${items.map((x,i)=>`<span class="breaking-item ${x.id?'is-link':''}" ${x.id?`onclick="openArticle(${x.id})"`:''}><strong>${esc(x.label)}</strong>${x.time?` <em>• ${esc(x.time)}</em>`:""}</span>`).join('<span class="breaking-sep">◆</span>')}</div></div>`;
}


/* =========================================================
   COOPERATIVAS — BUSCA, RAMO, ORDEM E LOGO
   ========================================================= */

let COOP_FILTER_TEXT = "";
let COOP_FILTER_TYPE = "Todos";

function normalizeSearchText(value){
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ensureCoopControls(){
  const grid = $("coopGrid");
  if(!grid || $("coopTools")) return;

  const tools = document.createElement("div");
  tools.id = "coopTools";
  tools.className = "coop-tools";

  tools.innerHTML = `
    <div class="coop-search-box">
      <span class="coop-search-icon">⌕</span>
      <input
        id="coopSearch"
        type="search"
        placeholder="Pesquisar por nome, ramo ou palavra-chave..."
        autocomplete="off"
      >
    </div>

    <div class="coop-filter-wrap">
      <label for="coopTypeFilter">Ramo</label>
      <select id="coopTypeFilter">
        <option value="Todos">Todos os ramos</option>
      </select>
    </div>

    <div class="coop-total" id="coopTotal"></div>
  `;

  grid.parentNode.insertBefore(tools, grid);

  $("coopSearch").addEventListener("input", e => {
    COOP_FILTER_TEXT = e.target.value || "";
    renderCooperatives();
  });

  $("coopTypeFilter").addEventListener("change", e => {
    COOP_FILTER_TYPE = e.target.value || "Todos";
    renderCooperatives();
  });
}

function updateCoopTypeOptions(){
  const select = $("coopTypeFilter");
  if(!select) return;

  const types = [...new Set(
    (DATA.cooperatives || [])
      .map(c => String(c.type || "Outros").trim())
      .filter(Boolean)
  )].sort((a,b) => a.localeCompare(b, "pt-BR"));

  const current = COOP_FILTER_TYPE;

  select.innerHTML = `
    <option value="Todos">Todos os ramos</option>
    ${types.map(type => `
      <option value="${esc(type)}">${esc(type)}</option>
    `).join("")}
  `;

  if(types.includes(current)){
    select.value = current;
  }else{
    COOP_FILTER_TYPE = "Todos";
    select.value = "Todos";
  }
}

function cooperativeSearchBlob(c){
  return normalizeSearchText([
    c.name,
    c.type,
    c.description,
    c.website,
    c.instagram
  ].filter(Boolean).join(" "));
}

function renderCooperatives(){
  const grid = $("coopGrid");
  if(!grid) return;

  ensureCoopControls();
  updateCoopTypeOptions();

  const search = normalizeSearchText(COOP_FILTER_TEXT);

  const all = [...(DATA.cooperatives || [])].sort((a,b) => {
    const ao = Number.isFinite(Number(a.sort_order))
      ? Number(a.sort_order)
      : 100;

    const bo = Number.isFinite(Number(b.sort_order))
      ? Number(b.sort_order)
      : 100;

    if(ao !== bo) return ao - bo;

    return String(a.name || "")
      .localeCompare(String(b.name || ""), "pt-BR");
  });

  const list = all.filter(c => {
    const matchesType =
      COOP_FILTER_TYPE === "Todos" ||
      String(c.type || "Outros") === COOP_FILTER_TYPE;

    const matchesText =
      !search ||
      cooperativeSearchBlob(c).includes(search);

    return matchesType && matchesText;
  });

  if($("coopTotal")){
    $("coopTotal").textContent =
      list.length === all.length
        ? `${all.length} cooperativa${all.length === 1 ? "" : "s"}`
        : `${list.length} de ${all.length}`;
  }

  if(!list.length){
    grid.innerHTML = `
      <div class="coop-empty">
        <b>Nenhuma cooperativa encontrada.</b>
        <span>Tente pesquisar outro nome, ramo ou palavra-chave.</span>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(c => `
    <article class="coop-card">

      <div class="coop-media">
        ${
          c.image_url
            ? `
              <img
                src="${esc(c.image_url)}"
                alt="Logo ${esc(c.name || "Cooperativa")}"
                loading="lazy"
              >
            `
            : `
              <div class="coop-placeholder">
                ${esc((c.name || "C").charAt(0).toUpperCase())}
              </div>
            `
        }
      </div>

      <div class="coop-body">
        <div class="coop-topline">
          <span class="cat">
            ${esc(c.type || "Cooperativa")}
          </span>
        </div>

        <h3>${esc(c.name || "")}</h3>

        <p class="coop-description">
          ${esc(c.description || "")}
        </p>

        <div class="coop-actions">
          ${
            c.website
              ? `
                <a
                  class="btn primary"
                  target="_blank"
                  rel="noopener"
                  href="${esc(c.website)}"
                  onclick="track('coop', ${Number(c.id) || 0})"
                >
                  Site
                </a>
              `
              : ""
          }

          ${
            c.instagram
              ? `
                <a
                  class="btn light"
                  target="_blank"
                  rel="noopener"
                  href="${esc(c.instagram)}"
                  onclick="track('coop', ${Number(c.id) || 0})"
                >
                  Instagram
                </a>
              `
              : ""
          }
        </div>
      </div>

    </article>
  `).join("");
}


function render(){
  const s = DATA.settings || {};

  document.documentElement.style.setProperty(
    "--primary",
    s.primary_color || "#0a4f8a"
  );

  document.documentElement.style.setProperty(
    "--accent",
    s.accent_color || "#a61f2b"
  );

  if($("brand")){
    $("brand").textContent = s.site_name || "Jornal Coopera Natal";
  }

  if($("footerBrand")){
    $("footerBrand").textContent = s.site_name || "Jornal Coopera Natal";
  }

  if($("tagline")){
    $("tagline").textContent = s.tagline || "";
  }

  if($("footerAbout")){
    $("footerAbout").textContent = s.about_text || "";
  }

  const arts = DATA.articles || [];

  renderBreakingTicker(
    arts,
    s.breaking_text || ""
  );

  if($("heroMain") && arts.length){
    setupHeroCarousel(arts);
  }

  const side = arts.slice(1,3);

  if($("heroSide")){
    $("heroSide").innerHTML = side.map(a => `
      <article class="side-story" onclick="openArticle(${Number(a.id) || 0})">
        ${
          a.image_url
            ? `<img src="${esc(a.image_url)}" alt="">`
            : ""
        }

        <div>
          <div class="cat">${esc(a.category || "")}</div>
          <h3>${esc(a.title || "")}</h3>
          <p>${esc(a.summary || "")}</p>
        </div>
      </article>
    `).join("");
  }

  if($("newsGrid")){
    const news = arts
      .filter(a => a.content_type !== "entrevista")
      .slice(0,12);

    $("newsGrid").innerHTML =
      news.length
        ? news.map(articleCard).join("")
        : `<div class="empty-state">Nenhuma notícia publicada ainda.</div>`;
  }

  if($("interviewGrid")){
    const interviews = arts
      .filter(a =>
        a.content_type === "entrevista" ||
        a.category === "Entrevistas"
      )
      .slice(0,9);

    $("interviewGrid").innerHTML =
      interviews.length
        ? interviews.map(articleCard).join("")
        : `<div class="empty-state">Nenhuma entrevista publicada ainda.</div>`;
  }

  /* COOPERATIVAS */
  renderCooperatives();

  /* LINKS ÚTEIS */
  if($("linkGrid")){
    const links = DATA.links || [];

    $("linkGrid").innerHTML =
      links.length
        ? links.map(x => `
            <a
              class="link-card"
              target="_blank"
              rel="noopener"
              href="${esc(x.url || "#")}"
              onclick="track('link', ${Number(x.id) || 0})"
            >
              <b>${esc(x.name || "")}</b>

              <span>
                ${esc(x.description || "")}
              </span>

              <em>
                ${esc(x.category || "Serviço")} →
              </em>
            </a>
          `).join("")
        : `
          <div class="empty-state">
            Nenhum link útil cadastrado como ativo.
          </div>
        `;
  }

  /* DÚVIDAS */
  if($("faqList")){
    const faqs = DATA.faqs || [];

    $("faqList").innerHTML =
      faqs.length
        ? faqs.map((f,i) => `
            <details ${i === 0 ? "open" : ""}>
              <summary>
                ${esc(f.question || "")}
              </summary>

              <p>
                ${esc(f.answer || "")}
              </p>
            </details>
          `).join("")
        : `
          <div class="empty-state">
            Nenhuma dúvida cadastrada ainda.
          </div>
        `;
  }

  renderAds();
}

function renderAds(){
 ["top","middle"].forEach(place=>{
  const host=$(place==="top"?"adTop":"adMiddle"); const ad=(DATA.ads||[]).find(a=>a.placement===place);
  if(!ad){host.innerHTML="";return}
  const key="closed_ad_"+ad.id;if(sessionStorage.getItem(key)){host.innerHTML="";return}
  host.innerHTML=`<aside class="ad"><button class="ad-x">×</button><div class="ad-label">Publicidade</div><div class="ad-in">${ad.image_url?`<img src="${esc(ad.image_url)}" alt="">`:""}<div class="ad-copy"><h3>${esc(ad.title)}</h3><p>${esc(ad.body||"")}</p>${ad.target_url?`<a class="btn primary" target="_blank" rel="noopener" href="${esc(ad.target_url)}" onclick="track('ad',${ad.id})">Saiba mais</a>`:""}</div></div></aside>`;
  host.querySelector(".ad-x").onclick=()=>{sessionStorage.setItem(key,"1");host.innerHTML=""}
 });
}
async function openArticle(id){
 if(typeof activatePortalTab==="function") activatePortalTab("noticias");
 await track("article",id);
 const a=(DATA.articles||[]).find(x=>x.id===id); if(!a)return;
 const yid=youtubeId(a.youtube_url);
 $("articleView").innerHTML=`<div class="cat">${esc(a.category)}</div><h1>${esc(a.title)}</h1><div class="article-summary">${esc(a.summary||"")}</div><div class="meta">${esc(a.author||"Redação")} • ${fmtDate(a.published_at)}</div>${a.image_url?`<img src="${esc(a.image_url)}" alt="">`:""}${yid?`<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yid)}" title="${esc(a.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`:""}<div class="article-content">${a.body_html||""}</div><div style="margin-top:14px">${a.extra_url?`<a class="btn primary" target="_blank" rel="noopener" href="${esc(a.extra_url)}">${esc(a.extra_label||"Abrir link")}</a> `:""}${a.source_url?`<a class="btn light" target="_blank" rel="noopener" href="${esc(a.source_url)}">${esc(a.source_name||"Fonte")}</a> `:""}<button class="btn light" onclick="closeArticle()">Fechar</button></div>`;
 $("articleView").classList.add("active");$("articleView").scrollIntoView({behavior:"smooth"});
}
window.openArticle=openArticle;window.closeArticle=()=>$("articleView").classList.remove("active");window.track=track;


/* =========================================================
   PISOS OFICIAIS / REFERÊNCIAS 2026
   ========================================================= */

const SIM_PISOS = {
  motofretista: [
    {
      id:"motofrete_principal",
      label:"Motofretista — empresa de tele-entrega/malotes",
      valor:1884.75,
      tipo:"CCT",
      vigencia:"01/05/2026 a 30/04/2027",
      fonte:"MTE Mediador — MR033743/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR033743%2F2026",
      nota:"Piso para empregado motofretista CBO 5191-10 em empresa de tele-entrega/malotes. Periculosidade de 30% calculada separadamente."
    },
    {
      id:"motofrete_secundaria",
      label:"Motofretista — atividade secundária do empregador",
      valor:2809.94,
      tipo:"CCT",
      vigencia:"01/05/2026 a 30/04/2027",
      fonte:"MTE Mediador — MR033743/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR033743%2F2026",
      nota:"Piso previsto para motofretista empregado em atividade secundária, nos estabelecimentos abrangidos pela CCT."
    }
  ],

  motorista_onibus: [
    {
      id:"onibus_mais30",
      label:"Ônibus > 30 passageiros — intermunicipal/turismo/fretamento",
      valor:3721.00,
      tipo:"Instrumento coletivo",
      vigencia:"01/05/2026 a 30/04/2027",
      fonte:"MTE Mediador — MR028767/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR028767%2F2026",
      nota:"Aplicável ao enquadramento específico do instrumento coletivo."
    },
    {
      id:"onibus_17a30",
      label:"Ônibus/micro-ônibus 17 a 30 passageiros",
      valor:3188.00,
      tipo:"Instrumento coletivo",
      vigencia:"01/05/2026 a 30/04/2027",
      fonte:"MTE Mediador — MR028767/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR028767%2F2026",
      nota:"Aplicável ao enquadramento específico do instrumento coletivo."
    }
  ],

  motorista_van: [
    {
      id:"van_ate16",
      label:"Van/micro-ônibus até 16 passageiros",
      valor:2765.00,
      tipo:"Instrumento coletivo",
      vigencia:"01/05/2026 a 30/04/2027",
      fonte:"MTE Mediador — MR028767/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR028767%2F2026",
      nota:"Aplicável ao transporte intermunicipal, turismo ou fretamento abrangido pelo instrumento."
    }
  ],

  atendente: [
    {
      id:"comercio_demais",
      label:"Comércio varejista RN — demais empresas",
      valor:1678.00,
      tipo:"CCT",
      vigencia:"a partir de 01/05/2026",
      fonte:"MTE Mediador — MR037937/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR037937%2F2026",
      nota:"Piso geral do comércio varejista abrangido pela CCT."
    },
    {
      id:"comercio_repis",
      label:"Comércio varejista RN — ME/EPP com REPIS válido",
      valor:1628.00,
      tipo:"CCT/REPIS",
      vigencia:"a partir de 01/05/2026",
      fonte:"MTE Mediador — MR037937/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR037937%2F2026",
      nota:"Só usar se a empresa for ME/EPP e possuir o certificado de adesão ao REPIS exigido pela CCT."
    }
  ],

  vendedor: [
    {
      id:"comercio_demais",
      label:"Comércio varejista RN — demais empresas",
      valor:1678.00,
      tipo:"CCT",
      vigencia:"a partir de 01/05/2026",
      fonte:"MTE Mediador — MR037937/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR037937%2F2026",
      nota:"Piso geral do comércio varejista abrangido pela CCT."
    },
    {
      id:"comercio_repis",
      label:"Comércio varejista RN — ME/EPP com REPIS válido",
      valor:1628.00,
      tipo:"CCT/REPIS",
      vigencia:"a partir de 01/05/2026",
      fonte:"MTE Mediador — MR037937/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR037937%2F2026",
      nota:"Somente com certificado REPIS válido."
    }
  ],

  caixa_comercio: [
    {
      id:"comercio_demais",
      label:"Comércio varejista RN — demais empresas",
      valor:1678.00,
      tipo:"CCT",
      vigencia:"a partir de 01/05/2026",
      fonte:"MTE Mediador — MR037937/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR037937%2F2026",
      nota:"Piso geral do comércio varejista abrangido pela CCT."
    }
  ],

  servente: [
    {
      id:"construcao_servente",
      label:"Construção civil — Servente",
      valor:1656.60,
      tipo:"CCT",
      vigencia:"01/01/2026 a 31/12/2026",
      fonte:"MTE Mediador — MR015048/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR015048%2F2026",
      nota:"Use somente se o empregador e a obra estiverem abrangidos pelo instrumento coletivo."
    }
  ],

  pedreiro: [
    {
      id:"construcao_oficial",
      label:"Construção civil — Oficial",
      valor:2296.80,
      tipo:"CCT",
      vigencia:"01/01/2026 a 31/12/2026",
      fonte:"MTE Mediador — MR015048/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR015048%2F2026",
      nota:"Referência de Oficial prevista na CCT; confirme o enquadramento funcional da atividade."
    }
  ],

  pintor: [
    {
      id:"construcao_oficial",
      label:"Construção civil — Oficial",
      valor:2296.80,
      tipo:"CCT",
      vigencia:"01/01/2026 a 31/12/2026",
      fonte:"MTE Mediador — MR015048/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR015048%2F2026",
      nota:"Referência de Oficial; confirme o enquadramento funcional."
    }
  ],

  encanador: [
    {
      id:"construcao_oficial",
      label:"Construção civil — Oficial",
      valor:2296.80,
      tipo:"CCT",
      vigencia:"01/01/2026 a 31/12/2026",
      fonte:"MTE Mediador — MR015048/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR015048%2F2026",
      nota:"Referência de Oficial; confirme o enquadramento funcional."
    }
  ],

  eletricista_construcao: [
    {
      id:"construcao_oficial",
      label:"Construção civil — Oficial",
      valor:2296.80,
      tipo:"CCT",
      vigencia:"01/01/2026 a 31/12/2026",
      fonte:"MTE Mediador — MR015048/2026",
      url:"https://mediador.trabalho.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=MR015048%2F2026",
      nota:"Referência de Oficial; periculosidade deve ser aplicada somente se a atividade efetivamente se enquadrar nas hipóteses legais."
    }
  ],

  enfermeiro: [
    {
      id:"enfermagem_nacional",
      label:"Piso nacional de referência — Enfermeiro 44h",
      valor:4750.00,
      tipo:"Lei 14.434/2022 + ADI 7222",
      vigencia:"referência nacional vigente",
      fonte:"Lei 14.434/2022 / STF ADI 7222",
      url:"https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14434.htm",
      nota:"Para iniciativa privada, observar também negociação coletiva e decisões vigentes na ADI 7222. Valor de referência para 44h."
    }
  ],

  tec_enfermagem: [
    {
      id:"enfermagem_nacional",
      label:"Piso nacional de referência — Técnico de Enfermagem 44h",
      valor:3325.00,
      tipo:"Lei 14.434/2022 + ADI 7222",
      vigencia:"referência nacional vigente",
      fonte:"Lei 14.434/2022 / STF ADI 7222",
      url:"https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14434.htm",
      nota:"Para iniciativa privada, observar também negociação coletiva. Valor de referência para 44h."
    }
  ]
};

function simGetPisos(cargoId){
  return SIM_PISOS[cargoId] || [];
}

function simFillPisos(){
  const sel=$("simPiso");
  if(!sel)return;

  const cargoId=$("simCargo")?.value;
  const pisos=simGetPisos(cargoId);

  if(!pisos.length){
    sel.innerHTML='<option value="manual">Sem piso oficial automático cadastrado — informar manualmente</option>';
    sel.disabled=true;
    if($("simPisoNota")){
      $("simPisoNota").textContent="Não foi atribuído piso automático a este cargo porque o valor pode depender de CCT/ACT, CNAE, sindicato, jornada ou enquadramento profissional. Use o piso correto no campo salário-base.";
    }
    return;
  }

  sel.disabled=false;
  sel.innerHTML=pisos.map((p,i)=>`
    <option value="${i}">${esc(p.label)} — ${simMoney(p.valor)}</option>
  `).join("");

  simPisoChanged();
}

function simPisoChanged(){
  const cargoId=$("simCargo")?.value;
  const pisos=simGetPisos(cargoId);
  const idx=parseInt($("simPiso")?.value,10);

  if(!pisos.length || !Number.isInteger(idx) || !pisos[idx])return;

  const p=pisos[idx];
  SIM_SALARIO_MANUAL=false;
  $("simSalario").value=Number(p.valor).toFixed(2);

  if($("simPisoNota")){
    $("simPisoNota").innerHTML=`<b>${esc(p.fonte)}</b> • ${esc(p.vigencia)}<br>${esc(p.nota)}`;
  }
  if($("simSalarioNota")){
    $("simSalarioNota").textContent="Valor preenchido automaticamente conforme o piso/enquadramento selecionado. Pode ser substituído se houver instrumento mais específico aplicável.";
  }

  simCalculate();
}


/* =========================================================
   COMPARADOR CLT x COOPERATIVA
   ========================================================= */

const SIM_RAMO_CARGOS = {
  "Transporte e Logística":[
    {id:"motofretista",nome:"Motofretista / motociclista profissional",base:"minimo",periculosidade:30,keywords:"moto entrega delivery logística"},
    {id:"motorista",nome:"Motorista",base:"minimo",periculosidade:0,keywords:"carro veículo transporte"},
    {id:"motorista_onibus",nome:"Motorista de ônibus / micro-ônibus",base:"minimo",periculosidade:0,keywords:"ônibus coletivo transporte"},
    {id:"motorista_van",nome:"Motorista de van",base:"minimo",periculosidade:0,keywords:"van fretamento transporte"},
    {id:"aux_logistica",nome:"Auxiliar de logística",base:"minimo",periculosidade:0,keywords:"logística estoque carga"},
    {id:"conferente",nome:"Conferente / expedição",base:"minimo",periculosidade:0,keywords:"expedição carga logística"}
  ],
  "Crédito e Serviços Financeiros":[
    {id:"atendimento_credito",nome:"Atendimento / relacionamento",base:"minimo",periculosidade:0},
    {id:"caixa",nome:"Caixa / tesouraria",base:"minimo",periculosidade:0},
    {id:"assistente_financeiro",nome:"Assistente financeiro",base:"minimo",periculosidade:0},
    {id:"analista_credito",nome:"Analista de crédito",base:"minimo",periculosidade:0},
    {id:"gerente",nome:"Gerente / gestor de unidade",base:"minimo",periculosidade:0}
  ],
  "Saúde":[
    {id:"recepcao_saude",nome:"Recepcionista / atendimento",base:"minimo",periculosidade:0},
    {id:"aux_saude",nome:"Auxiliar de serviços de saúde",base:"minimo",periculosidade:0},
    {id:"tec_enfermagem",nome:"Técnico de enfermagem",base:"minimo",periculosidade:0},
    {id:"enfermeiro",nome:"Enfermeiro",base:"minimo",periculosidade:0},
    {id:"medico",nome:"Médico",base:"minimo",periculosidade:0},
    {id:"dentista",nome:"Cirurgião-dentista",base:"minimo",periculosidade:0},
    {id:"tec_laboratorio",nome:"Técnico de laboratório",base:"minimo",periculosidade:0}
  ],
  "Agropecuário":[
    {id:"trabalhador_rural",nome:"Trabalhador rural",base:"minimo",periculosidade:0},
    {id:"aux_agro",nome:"Auxiliar agropecuário",base:"minimo",periculosidade:0},
    {id:"tec_agricola",nome:"Técnico agrícola / agropecuário",base:"minimo",periculosidade:0},
    {id:"operador_maquinas",nome:"Operador de máquinas",base:"minimo",periculosidade:0}
  ],
  "Consumo e Comércio":[
    {id:"atendente",nome:"Atendente",base:"minimo",periculosidade:0},
    {id:"vendedor",nome:"Vendedor",base:"minimo",periculosidade:0},
    {id:"estoquista",nome:"Estoquista",base:"minimo",periculosidade:0},
    {id:"caixa_comercio",nome:"Operador de caixa",base:"minimo",periculosidade:0},
    {id:"aux_adm",nome:"Auxiliar administrativo",base:"minimo",periculosidade:0}
  ],
  "Infraestrutura e Energia":[
    {id:"eletricista",nome:"Eletricista",base:"minimo",periculosidade:0},
    {id:"tec_manutencao",nome:"Técnico de manutenção",base:"minimo",periculosidade:0},
    {id:"aux_manutencao",nome:"Auxiliar de manutenção",base:"minimo",periculosidade:0},
    {id:"operador",nome:"Operador",base:"minimo",periculosidade:0}
  ],
  "Construção e Habitação":[
    {id:"pedreiro",nome:"Pedreiro",base:"minimo",periculosidade:0},
    {id:"servente",nome:"Servente / ajudante",base:"minimo",periculosidade:0},
    {id:"pintor",nome:"Pintor",base:"minimo",periculosidade:0},
    {id:"encanador",nome:"Encanador",base:"minimo",periculosidade:0},
    {id:"eletricista_construcao",nome:"Eletricista de instalações",base:"minimo",periculosidade:0}
  ],
  "Trabalho e Serviços":[
    {id:"asg",nome:"Auxiliar de serviços gerais",base:"minimo",periculosidade:0},
    {id:"limpeza",nome:"Profissional de limpeza",base:"minimo",periculosidade:0},
    {id:"portaria",nome:"Porteiro / controlador de acesso",base:"minimo",periculosidade:0},
    {id:"recepcionista",nome:"Recepcionista",base:"minimo",periculosidade:0},
    {id:"administrativo",nome:"Assistente administrativo",base:"minimo",periculosidade:0},
    {id:"tecnico",nome:"Técnico / profissional especializado",base:"minimo",periculosidade:0}
  ],
  "Educação e Formação":[
    {id:"instrutor",nome:"Instrutor / facilitador",base:"minimo",periculosidade:0},
    {id:"professor",nome:"Professor",base:"minimo",periculosidade:0},
    {id:"apoio_educacao",nome:"Apoio administrativo educacional",base:"minimo",periculosidade:0}
  ],
  "Tecnologia e Comunicação":[
    {id:"suporte",nome:"Suporte técnico",base:"minimo",periculosidade:0},
    {id:"desenvolvedor",nome:"Desenvolvedor / programação",base:"minimo",periculosidade:0},
    {id:"designer",nome:"Designer / comunicação",base:"minimo",periculosidade:0},
    {id:"social_media",nome:"Social media / conteúdo",base:"minimo",periculosidade:0}
  ],
  "Outros":[
    {id:"geral",nome:"Outro cargo / atividade",base:"minimo",periculosidade:0}
  ]
};

let SIM_CARGO_ATUAL=null;
let SIM_SALARIO_MANUAL=false;

function simMoney(v){
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number.isFinite(v)?v:0);
}
function simN(id){
  const el=$(id);
  return el?Math.max(0,parseFloat(el.value)||0):0;
}
function simHoursWindow(){
  const a=$("simInicio")?.value,b=$("simFim")?.value;
  if(!a||!b)return 0;
  let [h1,m1]=a.split(":").map(Number),[h2,m2]=b.split(":").map(Number);
  let x=h1+m1/60,y=h2+m2/60;
  if(y<=x)y+=24;
  return Math.max(0,y-x);
}
function simOverlapNight(start,end){
  if(!start||!end)return 0;
  let [h1,m1]=start.split(":").map(Number),[h2,m2]=end.split(":").map(Number);
  let s=h1+m1/60,e=h2+m2/60;
  if(e<=s)e+=24;
  let total=0;
  const windows=[[22,29],[-2,5],[46,53]];
  for(const [a,b] of windows){
    total+=Math.max(0,Math.min(e,b)-Math.max(s,a));
  }
  return Math.min(total,e-s);
}
function simInssEmpregado(base){
  const teto=8475.55,b=Math.min(base,teto);
  const faixas=[
    [0,1621,.075],
    [1621,2902.84,.09],
    [2902.84,4354.27,.12],
    [4354.27,8475.55,.14]
  ];
  let total=0;
  for(const [ini,fim,aliq] of faixas){
    if(b>ini) total+=Math.max(0,Math.min(b,fim)-ini)*aliq;
  }
  return total;
}
function simIrrf2026(rendimento,inss){
  const simpl=607.20;
  const baseLegal=Math.max(0,rendimento-inss);
  const baseSimpl=Math.max(0,rendimento-simpl);
  const base=Math.min(baseLegal,baseSimpl);
  let imposto=0;
  if(base<=2428.80) imposto=0;
  else if(base<=2826.65) imposto=base*.075-182.16;
  else if(base<=3751.05) imposto=base*.15-394.16;
  else if(base<=4664.68) imposto=base*.225-675.49;
  else imposto=base*.275-908.73;
  imposto=Math.max(0,imposto);
  let reducao=0;
  if(rendimento<=5000) reducao=Math.min(imposto,312.89);
  else if(rendimento<=7350) reducao=Math.max(0,978.62-(.133145*rendimento));
  return Math.max(0,imposto-reducao);
}
function simFillRamos(){
  const ramo=$("simRamo");
  if(!ramo)return;
  ramo.innerHTML=Object.keys(SIM_RAMO_CARGOS).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  simFillCargos();
}
function simFillCargos(){
  const ramo=$("simRamo")?.value;
  const cargo=$("simCargo");
  if(!cargo)return;
  const list=SIM_RAMO_CARGOS[ramo]||[];
  cargo.innerHTML=list.map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join("");
  simCargoChanged();
}
function simCargoChanged(){
  const ramo=$("simRamo")?.value;
  const id=$("simCargo")?.value;
  const list=SIM_RAMO_CARGOS[ramo]||[];
  SIM_CARGO_ATUAL=list.find(x=>x.id===id)||list[0]||null;
  SIM_SALARIO_MANUAL=false;
  const minimo=simN("simMinimo")||1621;
  const pisos=simGetPisos(id);
  if(!pisos.length && SIM_CARGO_ATUAL?.base==="minimo"){
    $("simSalario").value=minimo.toFixed(2);
    $("simSalarioNota").textContent="Sem piso oficial automático cadastrado para este enquadramento. Foi usado o salário mínimo nacional como referência inicial; substitua pelo piso/CCT correto quando aplicável.";
  }
  $("simPericulosidade").value=String(SIM_CARGO_ATUAL?.periculosidade||0);
  simFillPisos();
  simCalculate();
}
function simMinimumChanged(){
  const minimo=simN("simMinimo")||1621;
  $("simMinimoLabel").textContent=simMoney(minimo);
  const cargoId=$("simCargo")?.value;
  const temPisoOficial=simGetPisos(cargoId).length>0;
  if(!SIM_SALARIO_MANUAL && !temPisoOficial && SIM_CARGO_ATUAL?.base==="minimo"){
    $("simSalario").value=minimo.toFixed(2);
  }
  simCalculate();
}
function simCalcQtd(windowHours,days){
  const weekly=windowHours*days;
  let qtd=Math.max(1,Math.ceil(weekly/44));
  if(windowHours>10)qtd=Math.max(qtd,Math.ceil(windowHours/10));
  if(days===7)qtd=Math.max(qtd,2);
  return qtd;
}
function simCalculate(){
  if(!$("comparador"))return;

  const minimo=simN("simMinimo")||1621;
  const salario=Math.max(simN("simSalario"),0);
  const dias=+($("simDias")?.value||5);
  const windowHours=simHoursWindow();
  const weeklyHours=windowHours*dias;
  const qtd=simCalcQtd(windowHours,dias);
  const perPct=simN("simPericulosidade")/100;
  const insPct=simN("simInsalubridade")/100;
  const beneficios=simN("simBeneficios");
  const equipamento=simN("simEquipamento");
  const patronalPct=simN("simPatronal")/100;
  const ratPct=simN("simRat")/100;
  const feriados=Math.floor(simN("simFeriados"));
  const compensa=$("simCompensaFeriado")?.checked;
  const calcExtra=$("simHoraExtraAuto")?.checked;
  const calcNoturno=$("simNoturnoAuto")?.checked;
  const reservaRescisao=$("simRescisao")?.checked;

  const horasPorCltSemana=weeklyHours/qtd;
  const horasPorCltDia=windowHours/qtd;
  const divisor=220;
  const valorHora=salario/divisor;

  const periculosidade=salario*perPct;
  const insalubridade=minimo*insPct;

  let extraMes=0;
  if(calcExtra){
    const excedenteSemana=Math.max(0,horasPorCltSemana-44);
    const excedenteDia=Math.max(0,horasPorCltDia-8)*dias;
    const extraSemanal=Math.max(excedenteSemana,excedenteDia);
    extraMes=extraSemanal*(52/12)*valorHora*1.5;
  }

  let noturnoMes=0;
  if(calcNoturno){
    const nightWindow=simOverlapNight($("simInicio")?.value,$("simFim")?.value);
    const nightPerClt=(nightWindow/qtd)*dias*(52/12);
    const horaNoturnaFicta=nightPerClt*(60/52.5);
    noturnoMes=horaNoturnaFicta*valorHora*.20;
  }

  let feriadoMes=0;
  if(feriados>0 && !compensa){
    const horasFeriado=Math.min(8,Math.max(0,horasPorCltDia));
    feriadoMes=feriados*horasFeriado*valorHora;
  }

  const remuneracao=salario+periculosidade+insalubridade+extraMes+noturnoMes+feriadoMes;

  const dec13=remuneracao/12;
  const ferias=remuneracao/12;
  const tercoFerias=remuneracao/36;
  const baseProvisoes=remuneracao+dec13+ferias+tercoFerias;
  const fgts=baseProvisoes*.08;
  const patronal=baseProvisoes*patronalPct;
  const rat=baseProvisoes*ratPct;
  const provisaoRescisoria=reservaRescisao?fgts*.40:0;

  const custoUnit=remuneracao+dec13+ferias+tercoFerias+fgts+patronal+rat+beneficios+equipamento+provisaoRescisoria;
  const custoClt=custoUnit*qtd;

  const inss=simInssEmpregado(remuneracao);
  const irrf=simIrrf2026(remuneracao,inss);
  const liquido=Math.max(0,remuneracao-inss-irrf);

  const coopValor=simN("simCoopValor");
  const coopTaxa=simN("simCoopTaxa");
  const coopExtra=simN("simCoopExtra");
  const isencao=Math.min(12,Math.floor(simN("simCoopIsencao")));
  const coopMensalNormal=coopValor+coopTaxa+coopExtra;
  const coopAno=(coopValor+coopExtra)*12 + coopTaxa*(12-isencao);
  const coopMensalMedio=coopAno/12;

  $("simQtdClt").textContent=String(qtd);
  $("simCustoClt").textContent=simMoney(custoClt);
  $("simCustoCltAno").textContent=`${simMoney(custoClt*12)}/ano`;
  $("simCustoCoop").textContent=simMoney(coopMensalMedio);
  $("simCustoCoopAno").textContent=`${simMoney(coopAno)}/ano`;
  $("simBruto").textContent=simMoney(remuneracao);
  $("simInss").textContent=simMoney(inss);
  $("simIrrf").textContent=simMoney(irrf);
  $("simLiquido").textContent=simMoney(liquido);

  let motivos=[];
  if(dias===7)motivos.push("funcionamento em 7 dias exige revezamento e descanso semanal");
  if(windowHours>10)motivos.push("a janela diária ultrapassa 10 horas");
  if(weeklyHours>44)motivos.push(`a operação exige ${weeklyHours.toFixed(1).replace(".",",")} h de cobertura por semana`);
  if(!motivos.length)motivos.push("a cobertura informada cabe na referência geral de uma escala");
  $("simQtdMotivo").textContent=motivos.join("; ")+".";

  const diff=custoClt-coopMensalMedio;
  const diffAbs=Math.abs(diff);
  $("simDiferenca").textContent=simMoney(diffAbs);
  const card=$("simResultadoCard");
  if(diff>0.01){
    $("simResultadoLabel").textContent="Menor custo estimado: Cooperativa";
    $("simResultadoResumo").textContent=`${simMoney(diff)} por mês abaixo do custo CLT estimado.`;
    card.className="sim-result-card emphasis is-coop";
    $("simLeitura").innerHTML=`<b>Financeiramente, neste cenário, a cooperativa apresenta menor custo mensal estimado.</b> A diferença é de ${simMoney(diff)} por mês. Compare também cobertura, contrato, autonomia cooperativa e responsabilidades operacionais.`;
  }else if(diff<-0.01){
    $("simResultadoLabel").textContent="Menor custo estimado: CLT";
    $("simResultadoResumo").textContent=`${simMoney(diffAbs)} por mês abaixo do custo médio da cooperativa.`;
    card.className="sim-result-card emphasis is-clt";
    $("simLeitura").innerHTML=`<b>Financeiramente, neste cenário, a contratação CLT apresenta menor custo mensal estimado.</b> A diferença é de ${simMoney(diffAbs)} por mês. O resultado não elimina diferenças de gestão, cobertura e responsabilidades entre os modelos.`;
  }else{
    $("simResultadoLabel").textContent="Custos praticamente equivalentes";
    $("simResultadoResumo").textContent="A diferença mensal é mínima.";
    card.className="sim-result-card emphasis";
    $("simLeitura").innerHTML=`Os custos ficaram praticamente equivalentes. Nesse cenário, a análise deve se concentrar na estrutura operacional, continuidade da cobertura e responsabilidades de cada modelo.`;
  }

  const alertas=[];
  if(dias===7)alertas.push("<b>Operação 7 dias:</b> o simulador força no mínimo 2 CLTs para permitir revezamento e repouso semanal.");
  if(windowHours>10)alertas.push("<b>Janela diária extensa:</b> uma única pessoa não é considerada suficiente para cobrir toda a operação.");
  if(weeklyHours>44)alertas.push(`<b>Cobertura semanal:</b> são ${weeklyHours.toFixed(1).replace(".",",")} horas de operação por semana.`);
  if(calcNoturno && simOverlapNight($("simInicio")?.value,$("simFim")?.value)>0)alertas.push("<b>Horário noturno:</b> foi incluído adicional noturno urbano mínimo de 20% no período entre 22h e 5h, com hora noturna reduzida.");
  if(feriados>0 && !compensa)alertas.push(`<b>Feriados:</b> foram considerados ${feriados} dia(s) trabalhado(s) sem folga compensatória.`);
  if(insPct>0)alertas.push("<b>Insalubridade:</b> o percentual só deve ser usado quando a atividade estiver efetivamente caracterizada conforme as normas aplicáveis.");
  $("simAlertaJornada").innerHTML=alertas.length?alertas.join("<br>"):"<b>Jornada:</b> nenhuma situação especial adicional foi identificada pelos parâmetros informados.";

  const itens=[
    ["Salário-base",salario],
    [`Periculosidade (${(perPct*100).toFixed(0)}%)`,periculosidade],
    [`Insalubridade (${(insPct*100).toFixed(0)}%)`,insalubridade],
    ["Horas extras estimadas",extraMes],
    ["Adicional noturno estimado",noturnoMes],
    ["Feriados sem compensação",feriadoMes],
    ["13º provisionado",dec13],
    ["Férias provisionadas",ferias],
    ["1/3 de férias provisionado",tercoFerias],
    ["FGTS (8%)",fgts],
    [`Encargo patronal (${(patronalPct*100).toFixed(1).replace(".",",")}%)`,patronal],
    [`RAT (${(ratPct*100).toFixed(1).replace(".",",")}%)`,rat],
    ["Benefícios mensais",beneficios],
    ["Equipamento / veículo / combustível",equipamento]
  ];
  if(reservaRescisao)itens.push(["Reserva rescisória estimativa",provisaoRescisoria]);

  $("simDetalheClt").innerHTML=itens.map(([nome,valor])=>`
    <tr>
      <td>${esc(nome)}</td>
      <td>${simMoney(valor)}</td>
      <td>${simMoney(valor*qtd)}</td>
    </tr>
  `).join("")+`
    <tr class="sim-total">
      <td>TOTAL ESTIMADO</td>
      <td>${simMoney(custoUnit)}</td>
      <td>${simMoney(custoClt)}</td>
    </tr>
  `;
}
let SIM_COMPARATOR_READY=false;

function initComparator(){
  const box=$("comparador");
  if(!box || SIM_COMPARATOR_READY)return;

  const required=[
    "simRamo","simCargo","simPiso","simMinimo","simSalario",
    "simPericulosidade","simInsalubridade","simDias",
    "simInicio","simFim","simCoopValor"
  ];

  const missing=required.filter(id=>!$(id));
  if(missing.length){
    console.error("Campos ausentes no comparador:",missing);
    return;
  }

  SIM_COMPARATOR_READY=true;

  // Preenche ramos e cargos imediatamente, sem depender da API do jornal.
  simFillRamos();

  $("simRamo").addEventListener("change",simFillCargos);
  $("simCargo").addEventListener("change",simCargoChanged);
  $("simPiso")?.addEventListener("change",simPisoChanged);

  $("simMinimo").addEventListener("input",simMinimumChanged);

  $("simSalario").addEventListener("input",()=>{
    SIM_SALARIO_MANUAL=true;
    simCalculate();
  });

  [
    "simPericulosidade","simInsalubridade","simBeneficios","simEquipamento",
    "simInicio","simFim","simDias","simFeriados","simCompensaFeriado",
    "simHoraExtraAuto","simNoturnoAuto","simPatronal","simRat",
    "simCoopValor","simCoopTaxa","simCoopExtra","simCoopIsencao","simRescisao"
  ].forEach(id=>{
    const el=$(id);
    if(!el)return;
    el.addEventListener("input",simCalculate);
    el.addEventListener("change",simCalculate);
  });

  simMinimumChanged();
  simCalculate();
}

function bootComparator(){
  try{
    initPortalTabs();
    initComparator();
  }catch(e){
    console.error("Erro ao iniciar comparador:",e);
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",bootComparator,{once:true});
}else{
  bootComparator();
}

(async()=>{
  try{
    DATA=await api("/api/site-data");
    render();
    track("page",0);
  }catch(e){
    console.error("Erro ao carregar conteúdo do jornal:",e);
  }
})();

const contactForm=$("contactForm");
if(contactForm)contactForm.addEventListener("submit",async e=>{
 e.preventDefault();
 const status=$("contactStatus");
 status.textContent="Enviando...";
 try{
  await api("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   name:$("contactName").value.trim(),
   email:$("contactEmail").value.trim(),
   subject:$("contactSubject").value.trim(),
   message:$("contactMessage").value.trim()
  })});
  status.textContent="Mensagem enviada com sucesso.";
  status.style.color="#13724a";
  contactForm.reset();
 }catch(err){
  status.textContent="Não foi possível enviar. Tente novamente.";
  status.style.color="#a61f2b";
 }
});
