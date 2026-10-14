#!/usr/bin/env node
// Human-controlled workflow for external AI-generated drafts. NO AI APIs, NO LLM runtime.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const write=(p,v)=>{const dest=path.join(ROOT,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(v,null,2)+"\n")};
const args=process.argv.slice(2),cmd=args[0]||"help";
const planPath="data/editorial-plan.json",claimsPath="data/writer-claims.json";
const plan=read(planPath),claims=read(claimsPath),topics=plan.topics;
const arg=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null};
const get=id=>{const p=topics.find(x=>x.id===id);if(!p)throw Error("Unbekannte Themen-ID: "+id);return p};
const words=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"));
function validate(d){
 const errors=[];
 const bad=(expr,msg)=>{if(expr)errors.push(msg)};
 if(!d||typeof d!=="object"||Array.isArray(d))throw Error("Entwurf muss JSON-Objekt sein");
 const topic=topics.find(x=>x.id===d.id);
 bad(!topic,"id must match DE-001 ... DE-300");if(topic){
  bad(topic.status==="PUBLISHED","topic already PUBLISHED");bad(topic.hub!==d.hub,"hub differs from plan");
  bad(topic.slug!==d.slug,"slug differs from plan");bad(topic.title!==d.title,"title differs from plan (edit Matrix first if necessary)");
 }
 bad(typeof d.title!=="string"||d.title.length<24||d.title.length>115,"title: 24–115 characters");
 bad(typeof d.description!=="string"||d.description.length<85||d.description.length>180,"description: 85–180 characters");
 bad(typeof d.excerpt!=="string"||d.excerpt.length<80||d.excerpt.length>330,"excerpt: 80–330 characters");
 bad(!Array.isArray(d.sections)||d.sections.length<4||d.sections.length>12,"sections: 4–12 required");
 let total=0;const headingKeys=new Set();
 for(const s of d.sections||[]){
  if(typeof s.heading!=="string"||s.heading.length<8)errors.push("each section requires a substantial heading");
  if(headingKeys.has(s.heading))errors.push("duplicate H2");headingKeys.add(s.heading);
  if(!Array.isArray(s.paragraphs)||s.paragraphs.length<2)errors.push("each section needs 2+ paragraphs");
  for(const p of s.paragraphs||[]){if(typeof p!=="string"||p.length<100)errors.push("short paragraph (<100 characters)");total+=words(p)}
  if(s.bullets!==undefined&&(!Array.isArray(s.bullets)||s.bullets.some(b=>typeof b!=="string"||b.length<12)))errors.push("invalid bullets");
  for(const b of s.bullets||[])total+=words(b);
 }
 bad(total<450,"minimum 450 body words, got "+total);
 bad(!Array.isArray(d.sources)||d.sources.length<2,"at least two reviewed source URLs required");
 const sourceUrls=new Set();
 for(const s of d.sources||[]){if(typeof s.url!=="string"||!/^https:\/\/[^\s]+\.[^\s]+/i.test(s.url))errors.push("source must use a full HTTPS URL");
  if(typeof s.label!=="string"||s.label.length<5)errors.push("source label missing");
  if(!validDate(s.checkedOn))errors.push("source checkedOn must be YYYY-MM-DD");
  if(sourceUrls.has(s.url))errors.push("duplicate source URL");sourceUrls.add(s.url);
 }
 if(d.date&& !validDate(d.date))errors.push("invalid date");
 return {ok:errors.length===0,errors,topic,wordCount:total};
}
const getDraft=f=>{if(!f)throw Error("Expected JSON file path");return JSON.parse(fs.readFileSync(path.resolve(process.cwd(),f),"utf8"))};
function checkBranch(){let br;try{br=execFileSync("git",["branch","--show-current"],{cwd:ROOT,encoding:"utf8"}).trim()}catch{throw Error("Git checkout needed for publishing")};if(!br||br==="main"||br==="master")throw Error("Publish only on non-main review branch");return br}
function printHelp(){console.log(`External AI writer CLI – without API keys or local models

node scripts/editorial.mjs status
node scripts/editorial.mjs next --count 5 [--hub fahrzeugwahl]
node scripts/editorial.mjs claim DE-001 --writer Claude
node scripts/editorial.mjs release DE-001 --writer Claude
node scripts/editorial.mjs prompt DE-001
node scripts/editorial.mjs validate path/to/DE-001.json
node scripts/editorial.mjs stage path/to/DE-001.json
node scripts/editorial.mjs publish .local-drafts/DE-001.json --approve DE-001

Publication requires separate human fact check + explicit per-ID approval + PR review.
No automatic API calls, no scheduled writer, no auto-approval.`)}
try{
 if(cmd==="help"){printHelp()}
 else if(cmd==="status"){const counts={};for(const p of topics)counts[p.status]=(counts[p.status]||0)+1;console.log(JSON.stringify({total:topics.length,counts,claimed:Object.keys(claims).length,publishedSeed:fs.readdirSync(path.join(ROOT,"content/posts")).filter(x=>x.endsWith(".json")&&!x.startsWith("DE-")).length},null,2))}
 else if(cmd==="next"){const count=Number(arg("--count")||5),hub=arg("--hub");if(!Number.isInteger(count)||count<1||count>10)throw Error("--count must be 1..10");const q=topics.filter(p=>p.status==="IDEA"&&!claims[p.id]&&(!hub||p.hub===hub)).slice(0,count);console.log(JSON.stringify(q,null,2))}
 else if(cmd==="claim"){const p=get(args[1]),writer=arg("--writer");if(!writer||writer.length>80)throw Error("Set --writer ChatGPT/Claude/Mistral/...");if(p.status==="PUBLISHED")throw Error("Already published");if(claims[p.id])throw Error("Already claimed by "+claims[p.id].writer);claims[p.id]={writer,claimedAt:new Date().toISOString()};write(claimsPath,claims);console.log("Claimed "+p.id+" for "+writer+"; commit claim file to share ownership")}
 else if(cmd==="release"){const p=get(args[1]),writer=arg("--writer");if(!claims[p.id])throw Error("Not claimed");if(!writer||claims[p.id].writer!==writer)throw Error("Writer mismatch");delete claims[p.id];write(claimsPath,claims);console.log("Released "+p.id)}
 else if(cmd==="prompt"){const p=get(args[1]);if(p.status==="PUBLISHED")throw Error("Already published");console.log(`WRITING ASSIGNMENT – copy into an external AI chat (ChatGPT / Claude / Mistral / Gemini).
This tool does not call any AI service.

Language: native German (de-DE). Research topic independently, verify search intent and facts.
Fixed Matrix ID: ${p.id}
Fixed Hub: ${p.hub}
Fixed title: ${p.title}
Fixed slug: ${p.slug}
Audience: travelers considering motorbike / scooter rental in Hanoi.
Write original user-first German, at least 450 body words, 4–12 H2 sections with two substantial paragraphs each.
No unsupported prices, license rules, deposits, availability, testimonials or fabricated sources.
Collect at least 2 genuine public HTTPS references and source checked date YYYY-MM-DD; verify sources manually.
Avoid duplicating existing articles. Do not write HTML; output ONLY valid JSON:
{
  "id":"${p.id}",
  "hub":"${p.hub}",
  "slug":"${p.slug}",
  "title":"${p.title.replace(/"/g,'\\"')}",
  "description":"85–180 Zeichen eindeutige SEO-Beschreibung",
  "excerpt":"80–330 Zeichen originaler Teaser",
  "sections":[
    {"heading":"Erster eigenständiger Abschnitt","paragraphs":["Mindestens 100 Zeichen Text ...","Zweiter vollständiger Absatz ..."],"bullets":["Konkreter wichtiger Punkt"]},
    {"heading":"Weiterer eigenständiger Abschnitt","paragraphs":["...","..."]},
    {"heading":"Dritter eigenständiger Abschnitt","paragraphs":["...","..."]},
    {"heading":"Vierter eigenständiger Abschnitt","paragraphs":["...","..."]}
  ],
  "sources":[{"label":"Echte Quelle","url":"https://example.org/real-source","checkedOn":"YYYY-MM-DD"},{"label":"Zweite echte Quelle","url":"https://example.org/another-real-source","checkedOn":"YYYY-MM-DD"}]
}
The example.org URLs above are placeholders only: replace with verifiably real sources.
Do not claim approval or publish. Return draft for human review.`)}
 else if(cmd==="validate"||cmd==="stage"||cmd==="publish"){const draft=getDraft(args[1]),res=validate(draft);if(!res.ok)throw Error(res.errors.join("\n - "));if(cmd==="validate"){console.log(JSON.stringify({ok:true,id:draft.id,wordCount:res.wordCount,sources:draft.sources.length},null,2))}
  else if(cmd==="stage"){const dest=".local-drafts/"+draft.id+".json";write(dest,draft);console.log("Staged privately: "+dest+"; now perform human source/fact review. No publication.")}
  else{checkBranch();if(arg("--approve")!==draft.id)throw Error("Owner approval required: --approve "+draft.id);const file="content/posts/"+draft.id+".json";if(fs.existsSync(path.join(ROOT,file)))throw Error("Already exists: "+file);const now=new Date().toISOString().slice(0,10);draft.date=now;draft.readMinutes=Math.max(3,Math.ceil(res.wordCount/200));write(file,draft);res.topic.status="PUBLISHED";res.topic.publishedUrl="/ratgeber/"+res.topic.slug+"/";delete claims[draft.id];write(planPath,plan);write(claimsPath,claims);try{const b=build(false);console.log("PREVIEW GENERATED on non-main branch: "+b.count+" files; verify and open reviewed PR. No autonomous merge/deploy.")}catch(e){console.error("Build failed; revert article, plan and claim edits before retrying: "+e.message);process.exitCode=1}}
 }
 else{printHelp();process.exitCode=1}
}catch(e){console.error("EDITORIAL ERROR: "+e.message);process.exitCode=1}
