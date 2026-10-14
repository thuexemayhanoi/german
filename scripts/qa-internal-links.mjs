#!/usr/bin/env node
// Guard high-quality contextual links, without changing any article's editorial JSON.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {getModel,renderSite} from "./build.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const model=getModel(),files=renderSite(model),spec=model.internalLinks;
function assert(ok,message){if(!ok)throw Error("LINK_QA_FAIL "+message);}
const hubSlugs=new Set(model.hubs.map(x=>x.slug));
assert(Object.keys(spec.hubs||{}).length===10,"exactly ten curated hub plans required");
assert(Object.keys(spec.pages||{}).sort().join(",")==="datenschutz,hinweise,kontakt,ueber-uns","four main-page link plans required");
const expectedTargets=new Set([...model.hubs.map(x=>"/themen/"+x.slug+"/"),"/ratgeber/","/kontakt/","/datenschutz/","/ueber-uns/","/hinweise/","/suche/"]);
let links=0;
for(const h of model.hubs){
 const c=spec.hubs[h.slug],html=files["themen/"+h.slug+"/index.html"];
 assert(c&&c.related.length===2&&c.priority,"two related peers and one priority link "+h.slug);
 assert(c.related[0].slug!==c.related[1].slug,"peer topic distinct "+h.slug);
 assert(!c.related.some(x=>!hubSlugs.has(x.slug)||x.slug===h.slug),"valid related hubs "+h.slug);
 assert(!html.includes('<h2>Weitere Themen</h2>'),"generic unrelated six-hub sidebar removed "+h.slug);
 const items=[...c.related.map(x=>({url:"/themen/"+x.slug+"/",anchor:x.anchor})),c.priority];
 assert(html.includes('<nav class="contextual-links"'),"context nav exists "+h.slug);
 for(const i of items){
  assert(expectedTargets.has(i.url),"missing target "+i.url);
  assert(i.url!=="/","no homepage as contextual target");
  assert(i.anchor.trim().length>=14,"descriptive anchor "+h.slug+" -> "+i.url);
  assert(html.includes('href="'+i.url+'">'+i.anchor+"</a>"),"missing exact contextual anchor "+h.slug+" -> "+i.url);
  links++;
 }
}
for(const [key,items] of Object.entries(spec.pages)){
 assert(items.length>=2,"two main page references "+key);
 const html=files[key+"/index.html"];
 assert(html.includes('<nav class="contextual-links"'),"context nav on main page "+key);
 for(const item of items){
  assert(expectedTargets.has(item.url)&&item.url!=="/","valid contextual main-page target "+key);
  assert(html.includes('href="'+item.url+'">'+item.anchor+"</a>"),"exact main-page anchor "+key+" to "+item.url);
  links++;
 }
}
assert(spec.archive.length===10,"all ten hubs in archive navigation");
for(const item of spec.archive){
 assert(hubSlugs.has(item.slug),"archive topic exists "+item.slug);
 assert(files["ratgeber/index.html"].includes('href="/themen/'+item.slug+'/">'+item.anchor+"</a>"),"archive topic link "+item.slug);
}
assert(!files["index.html"].includes('<nav class="contextual-links"'),"homepage has no new promotional linking block");
for(const post of model.posts){
 const html=files["ratgeber/"+post.slug+"/index.html"];
 assert(html.includes('<a href="/themen/'+post.hub+'/">'),"existing article to hub kept "+post.id);
}
console.log("LINK_QA_PASS curated="+links+" published_articles="+model.posts.length+" 10 hubs, 4 info pages, main archive and homepage protected.");
