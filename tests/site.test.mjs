import test from "node:test";
import assert from "node:assert/strict";
import { renderSite, getModel } from "../scripts/build.mjs";
const model=getModel();
test("Exactly 300 unique editorial topics in ten groups",()=>{assert.equal(model.hubs.length,10);assert.equal(model.plan.topics.length,300);assert.equal(new Set(model.plan.topics.map(x=>x.id)).size,300);for(const hub of model.hubs)assert.equal(model.plan.topics.filter(p=>p.hub===hub.slug).length,30)});
test("Unpublished ideas never become actual article routes",()=>{const out=renderSite(model);for(const p of model.plan.topics.filter(x=>x.status!=="PUBLISHED"))assert.ok(!out["ratgeber/"+p.slug+"/index.html"]);assert.equal(JSON.parse(out["search-index.json"]).length,model.posts.length)});
test("German premium templates include theme, links and accessible mobile menu",()=>{const out=renderSite(model),home=out["index.html"];assert.match(home,/<html lang="de">/);assert.match(home,/class="mega"/);assert.match(home,/class="mobile-menu"/);assert.match(home,/class="footer"/);assert.match(home,/300/);assert.match(home,/ratgeber/);assert.ok(out["suche/index.html"].includes('id="search-input"'))});
test("Google Search Console meta verification is present once in homepage head and survives rebuild",()=>{const out=renderSite(model),home=out["index.html"];const tag='<meta name="google-site-verification" content="HwLeUnxn5y1nBbGQD-54b3hR_dw10qMQ12wfmuDPfBg" />';assert.equal(home.split(tag).length-1,1);assert.ok(home.indexOf(tag)>home.indexOf("<head>")&&home.indexOf(tag)<home.indexOf("</head>"));});
test("Six latest cards render committed local photos with responsive, accessible markup",()=>{
 const photos=Array.from({length:6},(_,i)=>"/assets/demo-photo-"+(i+1)+".webp");
 const html=renderSite({...model,homePhotos:photos})["index.html"];
 assert.equal((html.match(/class="card-image"/g)||[]).length,6);
 assert.equal((html.match(/class="card-visual card-visual--photo"/g)||[]).length,6);
 for(const photo of photos)assert.ok(html.includes('src="'+photo+'"'));
 assert.equal((html.match(/loading="lazy" decoding="async" width="960" height="540"/g)||[]).length,6);
 const withoutPhotos=renderSite({...model,homePhotos:[]})["index.html"];
 assert.equal((withoutPhotos.match(/class="card-image"/g)||[]).length,0);
 assert.equal((withoutPhotos.match(/class="card-visual" /g)||[]).length,6);
});
test("Canonical sitemap contains only actual static routes",()=>{const out=renderSite(model),sm=out["sitemap.xml"];for(const p of model.posts){assert.ok(sm.includes("/ratgeber/"+p.slug+"/"));assert.ok(out["ratgeber/"+p.slug+"/index.html"].includes('"@type":"Article"'))}assert.ok(!sm.includes("/suche/"));assert.ok(!sm.includes("/404.html"))});
test("Generated safety manifest matches actual outputs",()=>{const out=renderSite(model),manifest=JSON.parse(out["generated-files.json"]);assert.equal(manifest.paths.length,Object.keys(out).length-1);for(const path of manifest.paths)assert.ok(path in out);assert.ok(!("CNAME" in out))});

test("Mobile menu markup retains all ten real topic links for progressive enhancement",()=>{const html=renderSite(model)["index.html"];const section=html.match(/<details class="mobile-menu">([\s\S]*?)<\/details>/);assert.ok(section);assert.equal((section[1].match(/href="\/themen\//g)||[]).length,10);assert.match(section[1],/class="mobile-links"/)});

test("Local article assistant ranks published German posts only, never fabricated URLs",async()=>{
 await import("../assets/local-assistant.js");
 const engine=globalThis.GermanGuideLocal;
 assert.equal(engine.normalize("Führerschein & Rückgabe"),"fuehrerschein rueckgabe");
 const index=[
  {url:"/ratgeber/schaltmotorrad-mieten-worauf-du-achten-solltest/",title:"Schaltmotorrad mieten: worauf du achten solltest",description:"Fahrpraxis und Sicherheit",hubName:"Fahrzeugwahl"},
  {url:"/ratgeber/fahrzeuggewicht-vor-der-abholung-vergleichen/",title:"Fahrzeuggewicht vor der Abholung vergleichen",description:"Gewicht vor der Mietdauer",hubName:"Fahrzeugwahl"},
  {url:"https://evil.example/anything",title:"Schaltmotorrad",description:"",hubName:""}
 ];
 const ranked=engine.rankArticles(index,"Schaltmotorrad und Sicherheit",5);
 assert.equal(ranked[0].url,index[0].url);
 assert.ok(ranked.every(x=>x.url.startsWith("/ratgeber/")));
 assert.equal(engine.bestPassage(["Unrelated text repeated for length to make this a possible answer in the search results.","Schaltmotorrad und Sicherheit sind bei der Mietentscheidung wichtig und müssen überprüft werden."],"Schaltmotorrad Sicherheit").startsWith("Schaltmotorrad"),true);
 assert.equal(engine.safeArticleUrl("https://evil.example/"),false);
});

test("Floating AI bubble avoids fixed obstacle by shifting up and preserves clear viewport",async()=>{
 await import("../assets/local-assistant.js");
 const {chooseFabTop,rankArticles}=globalThis.GermanGuideLocal;
 const obstacle=[{left:310,right:392,top:495,bottom:565}];
 const top=chooseFabTop(500,70,640,320,56,obstacle);
 assert.equal(top,430);
 assert.ok(top+56<=640-16);
 const index=[{url:"/ratgeber/roller-oder-motorrad-in-hanoi-wichtige-unterschiede/",title:"Roller oder Motorrad in Hanoi: wichtige Unterschiede",description:"Fahrzeugwahl und sichere Nutzung",hubName:"Fahrzeugwahl"}];
 assert.equal(rankArticles(index,"Roller oder Motorrad?",3)[0].url,index[0].url);
});
