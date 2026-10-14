#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, getModel, renderSite } from "./build.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const check=(ok,msg)=>{if(!ok)throw Error("QA FAIL: "+msg)};
try{
 const model=getModel(),{hubs,plan,posts}=model,files=renderSite(model);
 check(fs.readFileSync(path.join(ROOT,"CNAME"),"utf8").trim()==="de.rentbikehanoi.com","CNAME");
 check(hubs.length===10&&plan.topics.length===300,"10 hubs and exactly 300 editorial topics");
 check(new Set(plan.topics.map(p=>p.id)).size===300,"unique topic ids");
 check(new Set(plan.topics.map(p=>p.slug)).size===300,"unique planned article slugs");
 for(const h of hubs)check(plan.topics.filter(p=>p.hub===h.slug).length===30,"30 topics in "+h.slug);
 for(const [file,html] of Object.entries(files).filter(([p])=>p.endsWith(".html"))){
  check(/<html lang="de">/.test(html),"German HTML lang "+file);
  check(/<title>[^<]+<\/title>/.test(html),"missing title "+file);
  check(/<meta name="description"/.test(html),"missing meta description "+file);
  check(html.includes('class="site-head"')&&html.includes('class="footer"'),"shared header/footer "+file);
  if(!["404.html","suche/index.html"].includes(file))check(html.includes('<link rel="canonical" href="https://de.rentbikehanoi.com/'),"missing canonical "+file);
  const localLinks=[...html.matchAll(/<a\b[^>]*href="(\/[^\"#?]*)/g)].map(m=>m[1]);for(const link of localLinks){if(!link.startsWith("/"))continue;const target=link==="/"? "index.html":link.slice(1)+(link.endsWith("/")?"index.html":"");check(target in files||fs.existsSync(path.join(ROOT,target)),"dead internal link "+file+" -> "+link)}
  for(const a of [...html.matchAll(/href="#([^"]+)"/g)])check(html.includes('id="'+a[1]+'"'),"missing local anchor "+file+" #"+a[1]);
 }
 const sitemap=files["sitemap.xml"];check(!sitemap.includes("/suche/"),"search excluded from sitemap");
 for(const u of [...sitemap.matchAll(/<loc>https:\/\/de\.rentbikehanoi\.com(\/[^<]*)<\/loc>/g)])check((u[1]==="/"? "index.html":u[1].slice(1)+"index.html") in files,"sitemap target "+u[1]);
 for(const idea of plan.topics.filter(p=>p.status!=="PUBLISHED"))check(!sitemap.includes("/ratgeber/"+idea.slug+"/"),"unpublished idea indexed "+idea.id);
 check(posts.every(p=>sitemap.includes("/ratgeber/"+p.slug+"/")),"all published posts in sitemap");
 check(JSON.parse(files["search-index.json"]).length===posts.length,"search includes published only");
 check(!Object.keys(files).some(f=>f==="CNAME"),"generator must not overwrite CNAME");
 const verified=build(true);console.log("QA PASSED: "+verified.count+" generated outputs; "+posts.length+" published articles, 10 hubs, 300 topics, CNAME unchanged.");
}catch(e){console.error(e.message);process.exitCode=1}
