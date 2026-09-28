
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...headers}});
const bad=(m,s=400)=>json({error:m},s);
const cookie=(req,name)=>{const c=req.headers.get("Cookie")||"";const m=c.match(new RegExp("(?:^|;\\s*)"+name+"=([^;]+)"));return m?decodeURIComponent(m[1]):null};
const nowIso=()=>new Date().toISOString();

async function isAdmin(req,env){
 const t=cookie(req,"jcn_session"); if(!t)return false;
 const row=await env.DB.prepare("SELECT token FROM admin_sessions WHERE token=? AND expires_at > ?").bind(t,nowIso()).first();
 return !!row;
}
async function requireAdmin(req,env){if(!(await isAdmin(req,env)))return bad("Não autorizado",401);return null}
async function readJson(req){try{return await req.json()}catch{return null}}
function allowedTable(x){return ["articles","links","cooperatives","faqs","ads"].includes(x)}
function sqlEntity(entity){
 const map={
  articles:["title","summary","category","author","published_at","status","featured","content_type","image_url","body_html","youtube_url","extra_label","extra_url","source_name","source_url"],
  links:["name","category","description","url","active"],
  cooperatives:["name","type","description","website","instagram","image_url","active"],
  faqs:["question","answer"],
  ads:["name","title","body","placement","target_url","image_url","active"]
 };return map[entity]
}
async function upsert(env,entity,obj){
 const cols=sqlEntity(entity); if(!cols)return null;
 const vals=cols.map(c=>obj[c]??(["featured","active"].includes(c)?0:""));
 if(obj.id){
  const set=cols.map(c=>`${c}=?`).join(",");
  await env.DB.prepare(`UPDATE ${entity} SET ${set} WHERE id=?`).bind(...vals,obj.id).run();return obj.id
 }
 const qs=cols.map(()=>"?").join(",");
 const r=await env.DB.prepare(`INSERT INTO ${entity} (${cols.join(",")}) VALUES (${qs})`).bind(...vals).run();
 return r.meta.last_row_id;
}
async function stats(env){
 const page=(await env.DB.prepare("SELECT COALESCE(SUM(count),0) total FROM analytics WHERE event_type='page'").first())?.total||0;
 const av=(await env.DB.prepare("SELECT COALESCE(SUM(count),0) total FROM analytics WHERE event_type='article'").first())?.total||0;
 const lc=(await env.DB.prepare("SELECT COALESCE(SUM(count),0) total FROM analytics WHERE event_type='link'").first())?.total||0;
 const ac=(await env.DB.prepare("SELECT COALESCE(SUM(count),0) total FROM analytics WHERE event_type='ad'").first())?.total||0;
 const top=await env.DB.prepare("SELECT event_type,item_id,count FROM analytics ORDER BY count DESC LIMIT 30").all();
 const labels=[];
 for(const r of top.results){
  let label=`${r.event_type} #${r.item_id}`;
  if(r.event_type==="article"){const x=await env.DB.prepare("SELECT title FROM articles WHERE id=?").bind(r.item_id).first();if(x)label=x.title}
  if(r.event_type==="link"){const x=await env.DB.prepare("SELECT name FROM links WHERE id=?").bind(r.item_id).first();if(x)label=x.name}
  if(r.event_type==="ad"){const x=await env.DB.prepare("SELECT name FROM ads WHERE id=?").bind(r.item_id).first();if(x)label=x.name}
  if(r.event_type==="coop"){const x=await env.DB.prepare("SELECT name FROM cooperatives WHERE id=?").bind(r.item_id).first();if(x)label=x.name}
  labels.push({label,total:r.count})
 }
 return {pageViews:page,articleViews:av,linkClicks:lc,adClicks:ac,topItems:labels}
}

export default {
 async fetch(req,env){
  const url=new URL(req.url),p=url.pathname;

  if(p==="/api/login"&&req.method==="POST"){
   const b=await readJson(req);if(!b)return bad("Dados inválidos");
   if(b.username!==env.ADMIN_USER||b.password!==env.ADMIN_PASSWORD)return bad("Credenciais inválidas",401);
   const token=crypto.randomUUID()+crypto.randomUUID(); const exp=new Date(Date.now()+8*3600*1000).toISOString();
   await env.DB.prepare("INSERT INTO admin_sessions(token,expires_at) VALUES(?,?)").bind(token,exp).run();
   return json({ok:true},200,{"Set-Cookie":`jcn_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`});
  }
  if(p==="/api/logout"&&req.method==="POST"){const t=cookie(req,"jcn_session");if(t)await env.DB.prepare("DELETE FROM admin_sessions WHERE token=?").bind(t).run();return json({ok:true},200,{"Set-Cookie":"jcn_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"})}
  if(p==="/api/session"){return (await isAdmin(req,env))?json({ok:true}):bad("Não autorizado",401)}

  if(p==="/api/site-data"){
   const [s,a,l,c,f,ads]=await Promise.all([
    env.DB.prepare("SELECT * FROM settings WHERE id=1").first(),
    env.DB.prepare("SELECT * FROM articles WHERE status='publicado' ORDER BY featured DESC, published_at DESC, id DESC").all(),
    env.DB.prepare("SELECT * FROM links WHERE active=1 ORDER BY id DESC").all(),
    env.DB.prepare("SELECT * FROM cooperatives WHERE active=1 ORDER BY name").all(),
    env.DB.prepare("SELECT * FROM faqs ORDER BY id").all(),
    env.DB.prepare("SELECT * FROM ads WHERE active=1 ORDER BY id DESC").all()
   ]);
   return json({settings:s,articles:a.results,links:l.results,cooperatives:c.results,faqs:f.results,ads:ads.results});
  }

  
  if(p==="/api/contact"&&req.method==="POST"){
   const b=await readJson(req);if(!b)return bad("Dados inválidos");
   const name=String(b.name||"").trim().slice(0,120),email=String(b.email||"").trim().slice(0,200),subject=String(b.subject||"").trim().slice(0,200),message=String(b.message||"").trim().slice(0,10000);
   if(!name||!email||!subject||!message)return bad("Preencha todos os campos");
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return bad("E-mail inválido");
   await env.DB.prepare("INSERT INTO messages(name,email,subject,message,status,created_at) VALUES(?,?,?,?,?,?)").bind(name,email,subject,message,"new",nowIso()).run();
   return json({ok:true});
  }

if(p==="/api/track"&&req.method==="POST"){
   const b=await readJson(req);if(!b||!["page","article","link","coop","ad"].includes(b.type))return bad("Evento inválido");
   const id=Number(b.id||0);
   await env.DB.prepare(`INSERT INTO analytics(event_type,item_id,count) VALUES(?,?,1) ON CONFLICT(event_type,item_id) DO UPDATE SET count=count+1`).bind(b.type,id).run();
   return json({ok:true});
  }

  if(p==="/api/admin-data"){
   const deny=await requireAdmin(req,env);if(deny)return deny;
   const [s,a,l,c,f,ads,msgs,st]=await Promise.all([
    env.DB.prepare("SELECT * FROM settings WHERE id=1").first(),
    env.DB.prepare("SELECT * FROM articles ORDER BY id DESC").all(),
    env.DB.prepare("SELECT links.*,COALESCE((SELECT count FROM analytics WHERE event_type='link' AND item_id=links.id),0) clicks FROM links ORDER BY id DESC").all(),
    env.DB.prepare("SELECT * FROM cooperatives ORDER BY id DESC").all(),
    env.DB.prepare("SELECT * FROM faqs ORDER BY id DESC").all(),
    env.DB.prepare("SELECT ads.*,COALESCE((SELECT count FROM analytics WHERE event_type='ad' AND item_id=ads.id),0) clicks FROM ads ORDER BY id DESC").all(),
    env.DB.prepare("SELECT * FROM messages ORDER BY created_at DESC, id DESC").all(),
    stats(env)
   ]);
   return json({settings:s,articles:a.results,links:l.results,cooperatives:c.results,faqs:f.results,ads:ads.results,messages:msgs.results,categories:["Cooperativas de Natal","Legislação","INSS e Previdência","Direitos do Cooperado","Trabalho e Mobilidade","Economia","Cursos e Capacitação","Documentos e Certidões","Entrevistas","Especiais"],stats:st});
  }

  if(p==="/api/settings"&&req.method==="PUT"){
   const deny=await requireAdmin(req,env);if(deny)return deny;const b=await readJson(req);if(!b)return bad("Dados inválidos");
   await env.DB.prepare("UPDATE settings SET site_name=?,tagline=?,breaking_text=?,about_text=?,primary_color=?,accent_color=? WHERE id=1").bind(b.site_name,b.tagline,b.breaking_text,b.about_text,b.primary_color,b.accent_color).run();return json({ok:true});
  }

  
  const mm=p.match(/^\/api\/messages\/(\d+)$/);
  if(mm){
   const deny=await requireAdmin(req,env);if(deny)return deny;
   const id=Number(mm[1]);
   if(req.method==="PUT"){
    const b=await readJson(req);if(!b||!["new","read","replied"].includes(b.status))return bad("Status inválido");
    await env.DB.prepare("UPDATE messages SET status=? WHERE id=?").bind(b.status,id).run();return json({ok:true});
   }
   if(req.method==="DELETE"){await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id).run();return json({ok:true})}
  }

const m=p.match(/^\/api\/(articles|links|cooperatives|faqs|ads)(?:\/(\d+))?$/);
  if(m){
   const deny=await requireAdmin(req,env);if(deny)return deny;
   const entity=m[1],id=m[2];
   if(req.method==="DELETE"&&id){await env.DB.prepare(`DELETE FROM ${entity} WHERE id=?`).bind(id).run();return json({ok:true})}
   if(req.method==="POST"||req.method==="PUT"){const b=await readJson(req);if(!b)return bad("Dados inválidos");const rid=await upsert(env,entity,b);return json({ok:true,id:rid})}
  }

  return env.ASSETS.fetch(req);
 }
}
