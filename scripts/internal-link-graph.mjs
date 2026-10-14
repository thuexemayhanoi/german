#!/usr/bin/env node
// Deterministic all-published-URL link graph. No external services or writes to article JSON.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {getModel,renderSite} from "./build.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const BASE="https://de.rentbikehanoi.com";
const MODEL=getModel(),FILES=renderSite(MODEL);
const urlPath=link=>link===BASE?"/":link.slice(BASE.length);
const pageFile=u=>u==="/"?"index.html":u.slice(1)+"index.html";
const sitemap=FILES["sitemap.xml"];
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>urlPath(m[1]));
// /suche/ is a real, intentionally noindex utility page omitted from the XML sitemap.
if(FILES["suche/index.html"])urls.push("/suche/");
const urlSet=new Set(urls);
if(urlSet.size!==urls.length)throw Error("Duplicate sitemap URLs");
const hubKeys=new Set(MODEL.hubs.map(h=>h.slug));
const postHub=new Map(MODEL.posts.map(p=>["/ratgeber/"+p.slug+"/",p.hub]));
const classify=u=>{
 if(u==="/")return {type:"homepage",cluster:"portal"};
 if(u==="/suche/")return {type:"utility-noindex",cluster:"site-utility"};
 if(u==="/ratgeber/"||u.startsWith("/ratgeber/seite/"))return {type:"archive",cluster:"editorial-navigation"};
 if(u.startsWith("/ratgeber/"))return {type:"article",cluster:postHub.get(u)||"unknown"};
 if(u.startsWith("/themen/"))return {type:"hub",cluster:u.split("/")[2]};
 return {type:"main-page",cluster:"site-information"};
};
const report=urls.map(u=>({url:BASE+u,path:u,...classify(u),
 outgoingLinks:[],incomingLinks:[],recommendedLinks:[],outgoingCount:0,incomingCount:0,
 contextualOutgoingCount:0,contextualIncomingCount:0}));
const byPath=new Map(report.map(x=>[x.path,x]));
const details=[];
const dedup=new Set();
function recommendation(from,to,anchor,reason){
 if(!urlSet.has(to)||!byPath.has(to))throw Error("Recommended link has no published target "+from+" -> "+to);
 const row=byPath.get(from),present=row.outgoingLinks.some(x=>x.url===BASE+to);
 row.recommendedLinks.push({url:BASE+to,anchor,reason,status:present?"implemented":"recommended"});
}
for(const row of report){
 const html=FILES[pageFile(row.path)];
 if(!html)throw Error("Missing generated HTML "+row.path);
 const contextualRanges=[];
 for(const match of html.matchAll(/<nav class="contextual-links"[^>]*>[\s\S]*?<\/nav>/g))
  contextualRanges.push([match.index,match.index+match[0].length]);
 for(const match of html.matchAll(/<div class="article-end">[\s\S]*?<\/div>/g))
  contextualRanges.push([match.index,match.index+match[0].length]);
 for(const match of html.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/gi)){
  const href=(match[1].match(/\bhref="([^"]+)"/i)||[])[1];
  if(!href||!href.startsWith("/")||href.startsWith("//"))continue;
  const to=href.split(/[?#]/)[0];
  if(!urlSet.has(to))continue;
  const anchor=match[2].replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,180);
  if(!anchor)continue;
  const scope=contextualRanges.some(r=>match.index>=r[0]&&match.index<r[1])?"contextual":"navigation-or-template";
  const key=row.path+"|"+to+"|"+anchor+"|"+scope;
  if(dedup.has(key))continue;
  dedup.add(key);
  const edge={source:row.url,target:BASE+to,anchor,scope,cluster:row.cluster};
  details.push(edge);
  row.outgoingLinks.push({url:edge.target,anchor,scope});
  byPath.get(to).incomingLinks.push({url:row.url,anchor,scope});
 }
}
for(const row of report){
 row.outgoingCount=row.outgoingLinks.length;
 row.incomingCount=row.incomingLinks.length;
 row.contextualOutgoingCount=row.outgoingLinks.filter(x=>x.scope==="contextual").length;
 row.contextualIncomingCount=row.incomingLinks.filter(x=>x.scope==="contextual").length;
 const spec=MODEL.internalLinks;
 if(row.type==="hub"){
  const cfg=spec.hubs[row.cluster];
  for(const p of cfg.related)recommendation(row.path,"/themen/"+p.slug+"/",p.anchor,"Curated topic bridge");
  if(cfg.priority)recommendation(row.path,cfg.priority.url,cfg.priority.anchor,"Priority next step");
 }
 if(row.type==="main-page"){
  const key=row.path.split("/")[1];
  for(const p of spec.pages[key]||[])recommendation(row.path,p.url,p.anchor,"Main-page contextual support");
 }
 if(row.path==="/ratgeber/")for(const p of spec.archive)
  recommendation(row.path,"/themen/"+p.slug+"/",p.anchor,"Direct topic discovery");
 if(row.type==="article"){
  const hub="/themen/"+row.cluster+"/";
  if(hubKeys.has(row.cluster))recommendation(row.path,hub,"Alle Ratgeber zum Thema "+row.cluster,"Supporting article to hub");
 }
}
const payload={site:BASE,source:"scripts/build.mjs, published sitemap and /suche/ noindex utility (not Search Console)",scope:"all published URLs; sitewide navigation distinguished from contextual links",nodeCount:report.length,edgeCount:details.length,
 types:report.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{}),
 contextualEdgeCount:details.filter(x=>x.scope==="contextual").length,
 nodes:report};
const json=JSON.stringify(payload,null,2)+"\n";
const columns=["URL","Outgoing Links","Incoming Links","Anchor Text","Cluster","Recommended Link"];
const quoted=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
const csv=[columns.map(quoted).join(","),...report.map(r=>[
 r.url,
 r.outgoingLinks.map(x=>x.url+" ["+x.scope+"]").join(" | "),
 r.incomingLinks.map(x=>x.url+" ["+x.scope+"]").join(" | "),
 r.outgoingLinks.map(x=>x.anchor).join(" | "),
 r.cluster,
 r.recommendedLinks.map(x=>x.url+" ("+x.anchor+"; "+x.status+")").join(" | ")
].map(quoted).join(","))].join("\n")+"\n";
const outputs=[["reports/internal-link-graph.json",json],["reports/internal-link-graph.csv",csv]];
const check=process.argv.includes("--check");
for(const [p,content] of outputs){
 const target=path.join(ROOT,p);
 if(check){if(!fs.existsSync(target)||fs.readFileSync(target,"utf8")!==content)throw Error("Graph drift "+p);}
 else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
}
console.log(JSON.stringify({mode:check?"check":"build",nodes:report.length,edges:details.length,contextualEdges:payload.contextualEdgeCount,types:payload.types,files:outputs.map(x=>x[0])}));
