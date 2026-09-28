
const $=id=>document.getElementById(id);let DATA={};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
async function api(path,opts={}){const r=await fetch(path,opts);if(r.status===401){showLogin();throw new Error("Não autenticado")}if(!r.ok)throw new Error(await r.text());const ct=r.headers.get("content-type")||"";return ct.includes("application/json")?r.json():r.text()}
function showLogin(){$("loginView").style.display="grid";$("adminApp").style.display="none"}function showApp(){$("loginView").style.display="none";$("adminApp").style.display="grid"}
$("loginForm").onsubmit=async e=>{e.preventDefault();try{await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:$("loginUser").value,password:$("loginPass").value})});showApp();await loadAll()}catch(err){$("loginMsg").textContent="Usuário ou senha incorretos."}};
$("logout").onclick=async()=>{await api("/api/logout",{method:"POST"}).catch(()=>{});showLogin()};
document.querySelectorAll(".admin-side button[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".admin-side button[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tab").forEach(x=>x.style.display=x.id===b.dataset.tab?"block":"none")});

async function upload(input){
 const f=input.files[0];if(!f)return null;const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});if(!r.ok)throw new Error(await r.text());return (await r.json()).url;
}
async function loadAll(){DATA=await api("/api/admin-data");renderAll()}
function renderAll(){renderInbox();renderArticles();renderCoops();renderLinks();renderAds();renderFaq();renderSettings();renderStats();}

function renderArticles(){
 $("catList").innerHTML=(DATA.categories||[]).map(c=>`<option value="${esc(c)}">`).join("");
 $("articleRows").innerHTML=(DATA.articles||[]).map(a=>`<tr><td>${esc(a.title)}</td><td>${esc(a.content_type)}</td><td>${esc(a.category)}</td><td>${esc(a.status)}</td><td><button class="btn light" onclick="editArticle(${a.id})">Editar</button> <button class="btn" onclick="delRow('articles',${a.id})">Excluir</button></td></tr>`).join("");
}
window.editArticle=id=>{const a=DATA.articles.find(x=>x.id===id);if(!a)return;$("artId").value=a.id;$("artTitle").value=a.title||"";$("artSummary").value=a.summary||"";$("artCategory").value=a.category||"";$("artAuthor").value=a.author||"";$("artDate").value=a.published_at||"";$("artStatus").value=a.status||"rascunho";$("artFeatured").value=a.featured?1:0;$("artType").value=a.content_type||"materia";$("artImage").value=a.image_url||"";$("artPreview").src=a.image_url||"";$("artContent").value=a.body_html||"";$("artYoutube").value=a.youtube_url||"";$("artExtraLabel").value=a.extra_label||"";$("artExtraUrl").value=a.extra_url||"";$("artSourceName").value=a.source_name||"";$("artSourceUrl").value=a.source_url||""};
$("clearArticle").onclick=()=>{$("articleForm").reset();$("artId").value="";$("artPreview").src=""};
$("articleForm").onsubmit=async e=>{e.preventDefault();let image=$("artImage").value;if($("artUpload").files[0])image=await upload($("artUpload"));const obj={id:$("artId").value||null,title:$("artTitle").value,summary:$("artSummary").value,category:$("artCategory").value,author:$("artAuthor").value,published_at:$("artDate").value,status:$("artStatus").value,featured:+$("artFeatured").value,content_type:$("artType").value,image_url:image,body_html:$("artContent").value,youtube_url:$("artYoutube").value,extra_label:$("artExtraLabel").value,extra_url:$("artExtraUrl").value,source_name:$("artSourceName").value,source_url:$("artSourceUrl").value};await saveEntity("articles",obj);$("clearArticle").click();await loadAll()};

function renderCoops(){$("coopRows").innerHTML=(DATA.cooperatives||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.type||"")}</td><td>${esc(x.website||"")}</td><td><button class="btn light" onclick="editCoop(${x.id})">Editar</button> <button class="btn" onclick="delRow('cooperatives',${x.id})">Excluir</button></td></tr>`).join("")}
window.editCoop=id=>{const x=DATA.cooperatives.find(a=>a.id===id);$("coopId").value=x.id;$("coopName").value=x.name||"";$("coopType").value=x.type||"";$("coopDesc").value=x.description||"";$("coopWebsite").value=x.website||"";$("coopInstagram").value=x.instagram||"";$("coopImage").value=x.image_url||"";$("coopActive").value=x.active?1:0};
$("clearCoop").onclick=()=>{$("coopForm").reset();$("coopId").value=""};
$("coopForm").onsubmit=async e=>{e.preventDefault();let image=$("coopImage").value;if($("coopUpload").files[0])image=await upload($("coopUpload"));await saveEntity("cooperatives",{id:$("coopId").value||null,name:$("coopName").value,type:$("coopType").value,description:$("coopDesc").value,website:$("coopWebsite").value,instagram:$("coopInstagram").value,image_url:image,active:+$("coopActive").value});$("clearCoop").click();await loadAll()};

function renderLinks(){$("linkRows").innerHTML=(DATA.links||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.category||"")}</td><td>${x.clicks||0}</td><td><button class="btn light" onclick="editLink(${x.id})">Editar</button> <button class="btn" onclick="delRow('links',${x.id})">Excluir</button></td></tr>`).join("")}
window.editLink=id=>{const x=DATA.links.find(a=>a.id===id);$("linkId").value=x.id;$("linkName").value=x.name||"";$("linkCategory").value=x.category||"";$("linkDesc").value=x.description||"";$("linkUrl").value=x.url||"";$("linkActive").value=x.active?1:0};
$("clearLink").onclick=()=>{$("linkForm").reset();$("linkId").value=""};
$("linkForm").onsubmit=async e=>{e.preventDefault();await saveEntity("links",{id:$("linkId").value||null,name:$("linkName").value,category:$("linkCategory").value,description:$("linkDesc").value,url:$("linkUrl").value,active:+$("linkActive").value});$("clearLink").click();await loadAll()};

function renderAds(){$("adRows").innerHTML=(DATA.ads||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.placement)}</td><td>${x.clicks||0}</td><td><button class="btn light" onclick="editAd(${x.id})">Editar</button> <button class="btn" onclick="delRow('ads',${x.id})">Excluir</button></td></tr>`).join("")}
window.editAd=id=>{const x=DATA.ads.find(a=>a.id===id);$("adId").value=x.id;$("adName").value=x.name||"";$("adTitle").value=x.title||"";$("adText").value=x.body||"";$("adPlacement").value=x.placement||"middle";$("adUrl").value=x.target_url||"";$("adImage").value=x.image_url||"";$("adActive").value=x.active?1:0};
$("clearAd").onclick=()=>{$("adForm").reset();$("adId").value=""};
$("adForm").onsubmit=async e=>{e.preventDefault();let image=$("adImage").value;if($("adUpload").files[0])image=await upload($("adUpload"));await saveEntity("ads",{id:$("adId").value||null,name:$("adName").value,title:$("adTitle").value,body:$("adText").value,placement:$("adPlacement").value,target_url:$("adUrl").value,image_url:image,active:+$("adActive").value});$("clearAd").click();await loadAll()};

function renderFaq(){$("faqRows").innerHTML=(DATA.faqs||[]).map(x=>`<tr><td>${esc(x.question)}</td><td><button class="btn light" onclick="editFaq(${x.id})">Editar</button> <button class="btn" onclick="delRow('faqs',${x.id})">Excluir</button></td></tr>`).join("")}
window.editFaq=id=>{const x=DATA.faqs.find(a=>a.id===id);$("faqId").value=x.id;$("faqQ").value=x.question||"";$("faqA").value=x.answer||""};
$("clearFaq").onclick=()=>{$("faqForm").reset();$("faqId").value=""};
$("faqForm").onsubmit=async e=>{e.preventDefault();await saveEntity("faqs",{id:$("faqId").value||null,question:$("faqQ").value,answer:$("faqA").value});$("clearFaq").click();await loadAll()};

function renderSettings(){const s=DATA.settings||{};$("setName").value=s.site_name||"";$("setTag").value=s.tagline||"";$("setBreaking").value=s.breaking_text||"";$("setAbout").value=s.about_text||"";$("setPrimary").value=s.primary_color||"#0a4f8a";$("setAccent").value=s.accent_color||"#a61f2b"}
$("settingsForm").onsubmit=async e=>{e.preventDefault();await api("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({site_name:$("setName").value,tagline:$("setTag").value,breaking_text:$("setBreaking").value,about_text:$("setAbout").value,primary_color:$("setPrimary").value,accent_color:$("setAccent").value})});await loadAll()};

function renderStats(){const s=DATA.stats||{};$("stPage").textContent=s.pageViews||0;$("stArticles").textContent=s.articleViews||0;$("stLinks").textContent=s.linkClicks||0;$("stAds").textContent=s.adClicks||0;$("statsDetails").innerHTML=`<p class="note">As estatísticas abaixo são somadas no D1 e representam acessos reais ao site publicado.</p><table class="stats-table"><thead><tr><th>Item</th><th>Visualizações / Cliques</th></tr></thead><tbody>${(s.topItems||[]).map(x=>`<tr><td>${esc(x.label)}</td><td>${x.total}</td></tr>`).join("")}</tbody></table>`}
async function saveEntity(entity,obj){await api(`/api/${entity}`,{method:obj.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj)})}
window.delRow=async(entity,id)=>{if(!confirm("Excluir este item?"))return;await api(`/api/${entity}/${id}`,{method:"DELETE"});await loadAll()};

(async()=>{try{await api("/api/session");showApp();await loadAll()}catch{showLogin()}})();

function renderInbox(){
 const msgs=DATA.messages||[];
 const badge=$("inboxBadge");
 const newCount=msgs.filter(m=>m.status==="new").length;
 if(badge)badge.innerHTML=newCount?`<span class="badge-new">${newCount}</span>`:"";
 const list=$("inboxList");if(!list)return;
 list.innerHTML=msgs.map(m=>`<div class="inbox-item ${m.status==="new"?"new":m.status==="replied"?"replied":"read"}" onclick="openMessage(${m.id})">
  <h4>${esc(m.subject||"(Sem assunto)")}${m.status==="new"?'<span class="badge-new">Novo</span>':""}</h4>
  <p>${esc(m.name)} • ${esc(m.email)} • ${new Date(m.created_at).toLocaleString("pt-BR")}</p>
  <p>${esc((m.message||"").slice(0,120))}</p>
 </div>`).join("")||'<div class="note">Nenhuma mensagem recebida ainda.</div>';
}
window.openMessage=id=>{
 const m=(DATA.messages||[]).find(x=>x.id===id);if(!m)return;
 const view=$("messageView");
 view.innerHTML=`<h3 style="margin-top:0">${esc(m.subject||"(Sem assunto)")}</h3>
 <div class="message-meta"><b>De:</b> ${esc(m.name)} &lt;${esc(m.email)}&gt;<br><b>Recebida em:</b> ${new Date(m.created_at).toLocaleString("pt-BR")}<br><b>Status:</b> ${esc(m.status)}</div>
 <div class="message-body">${esc(m.message)}</div>
 <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap">
  <a class="btn primary" href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: "+(m.subject||"Contato Jornal Coopera Natal"))}">Responder por e-mail</a>
  <button class="btn light" onclick="setMessageStatus(${m.id},'read')">Marcar como lido</button>
  <button class="btn light" onclick="setMessageStatus(${m.id},'replied')">Marcar como respondido</button>
  <button class="btn" onclick="deleteMessage(${m.id})">Excluir</button>
 </div>`;
 if(m.status==="new")setMessageStatus(m.id,"read",false);
};
window.setMessageStatus=async(id,status,reload=true)=>{
 await api(`/api/messages/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
 if(reload)await loadAll(); else {const m=DATA.messages.find(x=>x.id===id);if(m)m.status="read";renderInbox()}
};
window.deleteMessage=async id=>{
 if(!confirm("Excluir esta mensagem?"))return;
 await api(`/api/messages/${id}`,{method:"DELETE"});await loadAll();$("messageView").innerHTML='<div class="note">Mensagem excluída.</div>';
};
const refreshInbox=$("refreshInbox");if(refreshInbox)refreshInbox.onclick=()=>loadAll();
