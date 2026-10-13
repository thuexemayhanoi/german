#!/usr/bin/env node
// External AI writes prose; this factory scores and publishes only. No AI API/model.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getModel, renderSite, build } from "./build.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const at=p=>path.join(root,p),read=p=>JSON.parse(fs.readFileSync(at(p),"utf8"));
const save=(p,v)=>{fs.mkdirSync(path.dirname(at(p)),{recursive:true});fs.writeFileSync(at(p),JSON.stringify(v,null,2)+"\n")};
const queue=()=>fs.existsSync(at("content/inbox"))?fs.readdirSync(at("content/inbox")).filter(x=>/^DE-\d{3}\.json$/.test(x)).sort():[];
const words=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const validDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"))&&s<=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Bangkok"}).format(new Date());
export function inspect(d,p){
 const errors=[],parts={identity:0,sections:0,depth:0,seo:0,sources:0};
 const fail=(bad,message)=>{if(bad)errors.push(message)};
 if(!d||typeof d!=="object"||Array.isArray(d)||!p)return{pass:false,score:0,errors:["Draft or Matrix row missing"],parts};
 if(d.id===p.id&&d.slug===p.slug&&d.hub===p.hub&&d.title===p.title)parts.identity=20;else errors.push("Matrix identity/title/hub/slug mismatch");
 fail(p.status==="PUBLISHED"||p.status==="BLOCKED","Cannot publish terminal row");
 const sec=Array.isArray(d.sections)?d.sections:[];
 if(sec.length>=4&&sec.length<=12)parts.sections+=8;else errors.push("4–12 sections required");
 const hs=sec.map(x=>typeof x?.heading==="string"?x.heading.trim():"");
 if(hs.every(x=>x.length>=8)&&new Set(hs).size===hs.length)parts.sections+=6;else errors.push("Missing/duplicate heading");
 const paras=[],badParas=[];
 for(const s of sec){
  if(!Array.isArray(s?.paragraphs)||s.paragraphs.length<2){badParas.push("2 paragraphs per section");continue}
  for(const x of s.paragraphs){if(typeof x!=="string"||x.trim().length<100)badParas.push("Short paragraph");else paras.push(x)}
  if(s.bullets!==undefined){if(!Array.isArray(s.bullets)||s.bullets.some(x=>typeof x!=="string"||x.length<12))badParas.push("Invalid bullets");else paras.push(...s.bullets)}
 }
 if(!badParas.length)parts.sections+=8;else errors.push(...new Set(badParas));
 const body=paras.join(" "),wc=words(body);
 if(wc>=450)parts.depth+=10;else errors.push("450 German words minimum; got "+wc);
 if(wc>=700)parts.depth+=6;
 const n=[...body.toLowerCase().matchAll(/\b(der|die|das|und|mit|wenn|diese|beim|sollte|nicht|eine|einen|einer|für|über|kann|ist|werden)\b/g)].length;
 if(n>=35)parts.depth+=6;else fail(n<8,"German-language prose required");
 if(typeof d.description==="string"&&d.description.length>=85&&d.description.length<=180)parts.seo+=6;else errors.push("SEO description 85–180 characters");
 if(typeof d.excerpt==="string"&&d.excerpt.length>=80&&d.excerpt.length<=330)parts.seo+=5;else errors.push("Excerpt 80–330 characters");
 if(typeof d.title==="string"&&d.title.length>=24&&d.title.length<=115)parts.seo+=5;else errors.push("Title 24–115 characters");
 const sources=Array.isArray(d.sources)?d.sources:[],domains=new Set(),urls=new Set();
 if(sources.length>=2)parts.sources+=8;else errors.push("Two sources required");
 let valid=0,dated=0;
 for(const s of sources){
  try{
   const url=new URL(s.url);
   if(url.protocol!=="https:"||!url.hostname.includes(".")||url.hostname==="example.org"||url.hostname.endsWith(".example")||url.username||url.password)throw Error("placeholder");
   if(typeof s.label!=="string"||s.label.length<5||urls.has(url.href))throw Error("label or duplicate");
   urls.add(url.href);domains.add(url.hostname.replace(/^www\./,""));valid++;
   if(validDate(s.checkedOn))dated++;
  }catch{errors.push("Invalid source URL/label or duplicate (no example.org)")}
 }
 if(valid>=2&&valid===sources.length)parts.sources+=6;
 if(domains.size>=2)parts.sources+=2;
 if(dated>=2&&dated===sources.length)parts.sources+=4;else errors.push("Valid nonfuture checkedOn source dates required");
 const score=Object.values(parts).reduce((a,b)=>a+b,0);
 return {pass:score>=75&&errors.length===0,score,threshold:75,wordCount:wc,parts,errors};
}
export function inspectPair(drafts,plan=read("data/editorial-plan.json")){
 if(drafts.length!==2)return{ok:false,reason:"Exactly 2 drafts per pair"};
 const expected=plan.topics.filter(p=>!["PUBLISHED","BLOCKED"].includes(p.status)).slice(0,2).map(p=>p.id);
 if(drafts.map(d=>d.id).join(",")!==expected.join(","))return{ok:false,reason:"Wrong ID order; expected "+expected.join(",")};
 const results=drafts.map(d=>inspect(d,plan.topics.find(p=>p.id===d.id)));
 if(results.some(x=>!x.pass))return{ok:false,reason:"QA <75 or critical error",results};
 const body=d=>(d.sections||[]).flatMap(s=>s.paragraphs||[]).join("\n");
 const existing=getModel().posts;
 if(body(drafts[0])===body(drafts[1])||drafts.some(d=>existing.some(p=>body(p)===body(d))))return{ok:false,reason:"Duplicate article body"};
 return{ok:true,results,ids:drafts.map(d=>d.id)};
}
export function publish(){
 const names=queue();
 if(names.length<2||names.length>10||names.length%2!==0)throw Error("Inbox must have even count 2..10, got "+names.length);
 const plan=read("data/editorial-plan.json"),drafts=names.slice(0,2).map(n=>read("content/inbox/"+n));
 const pass=inspectPair(drafts,plan);if(!pass.ok)throw Error("FACTORY BLOCKED "+JSON.stringify(pass));
 const now=new Date().toISOString().slice(0,10);
 const posts=drafts.map((d,i)=>({...d,date:validDate(d.date)?d.date:now,readMinutes:Math.max(3,Math.ceil(pass.results[i].wordCount/200))}));
 for(const d of posts){
  if(fs.existsSync(at("content/posts/"+d.id+".json")))throw Error("Already exists "+d.id);
  const p=plan.topics.find(x=>x.id===d.id);p.status="PUBLISHED";p.publishedUrl="/ratgeber/"+p.slug+"/";
 }
 const before=getModel();
 renderSite({hubs:before.hubs,plan,posts:[...before.posts,...posts]}); // preflight, no writes
 for(const d of posts)save("content/posts/"+d.id+".json",d);
 save("data/editorial-plan.json",plan);
 build(false);
 for(const n of names.slice(0,2))fs.unlinkSync(at("content/inbox/"+n));
 const report={status:"PUBLISHED",ids:pass.ids,qaScores:pass.results.map(x=>x.score),publishedAt:new Date().toISOString(),remaining:plan.topics.filter(x=>x.status!=="PUBLISHED").length};
 save("reports/factory-last-pair.json",report);
 return report;
}
const status=()=>{const plan=read("data/editorial-plan.json"),counts={};for(const p of plan.topics)counts[p.status]=(counts[p.status]||0)+1;return{planned:200,published:counts.PUBLISHED||0,counts,queued:queue().map(x=>x.slice(0,-5))}};
function main(){
 const cmd=process.argv[2]||"status";
 if(cmd==="status")console.log(JSON.stringify(status(),null,2));
 else if(cmd==="next"){const n=Number(process.argv[3]||2);if(!Number.isInteger(n)||n<1||n>10)throw Error("Next count 1..10");const plan=read("data/editorial-plan.json"),pending=new Set(queue().map(x=>x.slice(0,-5)));console.log(JSON.stringify({queued:status().queued,next:plan.topics.filter(p=>!["PUBLISHED","BLOCKED"].includes(p.status)&&!pending.has(p.id)).slice(0,n)},null,2))}
 else if(cmd==="score"){if(!process.argv[3])throw Error("File required");const d=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),"utf8"));const result=inspect(d,read("data/editorial-plan.json").topics.find(x=>x.id===d.id));console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1}
 else if(cmd==="check"){const names=queue();if(names.length!==2)throw Error("check requires exactly 2 inbox files");const result=inspectPair(names.map(n=>read("content/inbox/"+n)));console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1}
 else if(cmd==="publish"){if(process.env.GITHUB_ACTIONS!=="true"||process.env.GITHUB_REF!=="refs/heads/main")throw Error("Publish only from production GitHub Actions");console.log(JSON.stringify(publish(),null,2))}
 else throw Error("Unknown command");
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main()}catch(e){console.error(e.message);process.exitCode=1}}
