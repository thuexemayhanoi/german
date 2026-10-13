import test from "node:test";
import assert from "node:assert/strict";
import { inspect, inspectPair } from "../scripts/factory.mjs";
import { getModel } from "../scripts/build.mjs";
const matrix=getModel().plan.topics;
const pending=matrix.filter(p=>!["PUBLISHED","BLOCKED"].includes(p.status));
function draftFor(t){
 const paragraph="Wer in Hanoi ein Zweirad mieten möchte, sollte das Fahrzeug vor der Übernahme sorgfältig prüfen und vorab die wichtigsten Vertragsdetails klären. Diese Orientierung zeigt hilfreiche Fragen zur Sicherheit und zur praktischen Fahrzeugwahl, ohne konkrete Angebote zu versprechen. ".repeat(4);
 return {id:t.id,hub:t.hub,slug:t.slug,title:t.title,
  description:"Eine hilfreiche Orientierung zur Fahrzeugwahl in Hanoi, mit praktischen Prüffragen und nachvollziehbaren Kriterien für eine gut vorbereitete Reise.",
  excerpt:"Dieser deutschsprachige Ratgeber zeigt die wichtigsten Punkte vor einer Zweiradmiete und hilft dabei, Sicherheitsfragen und Mietbedingungen sorgfältig zu vergleichen.",
  sections:[1,2,3,4].map(i=>({heading:"Konkreter Prüfschritt Nummer "+i+" zur Vorbereitung",paragraphs:[paragraph,paragraph]})),
  sources:[{label:"Auswärtiges Amt Reisehinweise",url:"https://www.auswaertiges-amt.de/",checkedOn:"2026-10-10"},{label:"Vietnam Tourism Official",url:"https://vietnam.travel/",checkedOn:"2026-10-10"}]
 };
}
test("QA75 passes a good pair and does not require any AI API",()=>{
 if(pending.length<2)return;
 const one=draftFor(pending[0]),two=draftFor(pending[1]);
 two.sections[0].paragraphs[0]+=" Dies ist eine zusätzliche Frage für die zweite Variante.";
 const result=inspect(one,pending[0]);assert.ok(result.pass,JSON.stringify(result));
 assert.ok(result.score>=75);
 assert.ok(inspectPair([one,two]).ok);
});
test("Reject short prose, placeholder sources and invalid citations",()=>{
 if(!pending.length)return;
 const d=draftFor(pending[0]);d.sections.forEach(s=>s.paragraphs=["Kurz.","Kurz."]);
 d.sources[0].url="https://example.org/a";
 const result=inspect(d,pending[0]);assert.equal(result.pass,false);assert.ok(result.errors.length>0);
});
test("Reject wrong identity and nonconsecutive Matrix queue",()=>{
 if(pending.length<3)return;
 const one=draftFor(pending[0]),three=draftFor(pending[2]);
 assert.equal(inspectPair([one,three]).ok,false);
 one.slug="wrong";assert.equal(inspect(one,pending[0]).pass,false);
});
