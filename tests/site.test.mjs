import test from "node:test";
import assert from "node:assert/strict";
import { renderSite, getModel } from "../scripts/build.mjs";
const model=getModel();
test("Exactly 200 unique editorial topics in ten groups",()=>{assert.equal(model.hubs.length,10);assert.equal(model.plan.topics.length,200);assert.equal(new Set(model.plan.topics.map(x=>x.id)).size,200);for(const hub of model.hubs)assert.equal(model.plan.topics.filter(p=>p.hub===hub.slug).length,20)});
test("Unpublished ideas never become actual article routes",()=>{const out=renderSite(model);for(const p of model.plan.topics.filter(x=>x.status!=="PUBLISHED"))assert.ok(!out["ratgeber/"+p.slug+"/index.html"]);assert.equal(JSON.parse(out["search-index.json"]).length,model.posts.length)});
test("German premium templates include theme, links and accessible mobile menu",()=>{const out=renderSite(model),home=out["index.html"];assert.match(home,/<html lang="de">/);assert.match(home,/class="mega"/);assert.match(home,/class="mobile-menu"/);assert.match(home,/class="footer"/);assert.match(home,/200/);assert.match(home,/ratgeber/);assert.ok(out["suche/index.html"].includes('id="search-input"'))});
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
