
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
function articleCard(a){
 return `<article class="card" onclick="openArticle(${a.id})" style="cursor:pointer">
 ${a.image_url?`<img src="${esc(a.image_url)}" alt="">`:""}<div class="card-body"><div class="cat">${esc(a.category)}</div><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="meta">${esc(a.author||"Redação")} • ${fmtDate(a.published_at)}</div></div></article>`;
}
function render(){
 const s=DATA.settings||{};
 document.documentElement.style.setProperty("--primary",s.primary_color||"#0a4f8a");
 document.documentElement.style.setProperty("--accent",s.accent_color||"#a61f2b");
 $("brand").textContent=s.site_name||"Jornal Coopera Natal";$("footerBrand").textContent=s.site_name||"Jornal Coopera Natal";$("tagline").textContent=s.tagline||"";$("breakingText").textContent=s.breaking_text||"";$("footerAbout").textContent=s.about_text||"";
 const arts=DATA.articles||[]; const feat=arts.find(a=>a.featured)||arts[0];
 if(feat){$("heroImg").src=feat.image_url||"";$("heroCat").textContent=feat.category||"";$("heroTitle").textContent=feat.title;$("heroSummary").textContent=feat.summary||"";$("heroMain").onclick=()=>openArticle(feat.id)}
 const side=arts.filter(a=>!feat||a.id!==feat.id).slice(0,2);$("heroSide").innerHTML=side.map(a=>`<article class="side-story" onclick="openArticle(${a.id})">${a.image_url?`<img src="${esc(a.image_url)}" alt="">`:""}<div><div class="cat">${esc(a.category)}</div><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></div></article>`).join("");
 $("newsGrid").innerHTML=arts.filter(a=>a.content_type!=="entrevista").slice(0,12).map(articleCard).join("");
 $("interviewGrid").innerHTML=arts.filter(a=>a.content_type==="entrevista"||a.category==="Entrevistas").slice(0,9).map(articleCard).join("")||"<p>Nenhuma entrevista publicada ainda.</p>";
 $("coopGrid").innerHTML=(DATA.cooperatives||[]).map(c=>`<article class="coop-card">${c.image_url?`<img src="${esc(c.image_url)}" alt="">`:""}<div class="coop-body"><div class="cat">${esc(c.type||"Cooperativa")}</div><h3>${esc(c.name)}</h3><p>${esc(c.description||"")}</p>${c.website?`<a class="btn primary" target="_blank" rel="noopener" href="${esc(c.website)}" onclick="track('coop',${c.id})">Conhecer</a>`:""} ${c.instagram?`<a class="btn light" target="_blank" rel="noopener" href="${esc(c.instagram)}" onclick="track('coop',${c.id})">Instagram</a>`:""}</div></article>`).join("");
 $("linkGrid").innerHTML=(DATA.links||[]).map(x=>`<a class="link-card" target="_blank" rel="noopener" href="${esc(x.url)}" onclick="track('link',${x.id})"><b>${esc(x.name)}</b><span>${esc(x.description||"")}</span><em>${esc(x.category||"Serviço")} →</em></a>`).join("");
 $("faqList").innerHTML=(DATA.faqs||[]).map((f,i)=>`<details ${i===0?"open":""}><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("");
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
 await track("article",id);
 const a=(DATA.articles||[]).find(x=>x.id===id); if(!a)return;
 const yid=youtubeId(a.youtube_url);
 $("articleView").innerHTML=`<div class="cat">${esc(a.category)}</div><h1>${esc(a.title)}</h1><div class="article-summary">${esc(a.summary||"")}</div><div class="meta">${esc(a.author||"Redação")} • ${fmtDate(a.published_at)}</div>${a.image_url?`<img src="${esc(a.image_url)}" alt="">`:""}${yid?`<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yid)}" title="${esc(a.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`:""}<div class="article-content">${a.body_html||""}</div><div style="margin-top:14px">${a.extra_url?`<a class="btn primary" target="_blank" rel="noopener" href="${esc(a.extra_url)}">${esc(a.extra_label||"Abrir link")}</a> `:""}${a.source_url?`<a class="btn light" target="_blank" rel="noopener" href="${esc(a.source_url)}">${esc(a.source_name||"Fonte")}</a> `:""}<button class="btn light" onclick="closeArticle()">Fechar</button></div>`;
 $("articleView").classList.add("active");$("articleView").scrollIntoView({behavior:"smooth"});
}
window.openArticle=openArticle;window.closeArticle=()=>$("articleView").classList.remove("active");window.track=track;
(async()=>{DATA=await api("/api/site-data");render();track("page",0)})().catch(e=>console.error(e));

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
