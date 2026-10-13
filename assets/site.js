(()=>{"use strict";
const bar=document.querySelector(".reading-progress"),top=document.querySelector(".back-top");
function update(){if(bar){const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?Math.min(100,100*scrollY/max):0)+"%"}if(top)top.classList.toggle("visible",scrollY>550)}
addEventListener("scroll",update,{passive:true});update();
const mega=document.querySelector(".mega"),mobile=document.querySelector(".mobile-menu");
const panel=mobile?.querySelector(".mobile-links"),summary=mobile?.querySelector("summary");
const head=document.querySelector(".site-head");
const element=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
function closeMobile(restoreFocus=false){
 if(!mobile?.open)return;
 mobile.open=false;
 document.body.classList.remove("mobile-nav-open");
 head?.classList.remove("mobile-nav-active");
 if(restoreFocus)summary?.focus({preventScroll:true});
}
if(mobile&&panel&&summary&&!panel.querySelector(".mobile-topic-grid")){
 const originalLinks=[...panel.querySelectorAll("a[href]")];
 const getLink=href=>originalLinks.find(a=>a.getAttribute("href")===href);
 const topics=originalLinks.filter(a=>a.getAttribute("href")?.startsWith("/themen/"));
 if(topics.length===10){
  summary.replaceChildren(element("span","menu-bars","☰"),element("span","","Menü"));
  summary.setAttribute("aria-controls","mobile-links");summary.setAttribute("aria-label","Menü öffnen");
  panel.id="mobile-links";
  const backdrop=element("button","mobile-backdrop");
  backdrop.type="button";backdrop.tabIndex=-1;backdrop.setAttribute("aria-label","Menü schließen");
  mobile.insertBefore(backdrop,panel);
  const topLine=element("div","mobile-panel-top");
  const close=element("button","mobile-close","×");close.type="button";close.setAttribute("aria-label","Menü schließen");
  topLine.append(element("span","","Navigation"),close);
  const shortcuts=element("div","mobile-shortcuts");
  for(const [href,label] of [["/ratgeber/","Alle Ratgeber ↗"],["/suche/","⌕ Suche"]]){
   const a=getLink(href)?.cloneNode(true)||element("a");a.href=href;a.textContent=label;shortcuts.append(a);
  }
  const title=element("p","mobile-section-label","10 Themenwelten");
  const grid=element("div","mobile-topic-grid");
  topics.forEach((link,index)=>{
   const a=link.cloneNode(true);a.className="mobile-topic";
   const number=element("span","mobile-topic-icon",String(index+1).padStart(2,"0"));
   number.setAttribute("aria-hidden","true");
   const name=element("span","mobile-topic-name",a.textContent.trim());
   a.replaceChildren(number,name);grid.append(a);
  });
  const foot=element("div","mobile-bottom-links");
  for(const [href,label] of [["/","Startseite"],["/ueber-uns/","Über uns"],["/kontakt/","Kontakt"],["/datenschutz/","Datenschutz"]]){
   const a=getLink(href)?.cloneNode(true)||element("a");a.href=href;a.textContent=label;foot.append(a);
  }
  panel.replaceChildren(topLine,shortcuts,title,grid,foot);
  close.addEventListener("click",()=>closeMobile(true));
  backdrop.addEventListener("click",()=>closeMobile(true));
  panel.querySelectorAll("a[href]").forEach(a=>a.addEventListener("click",()=>closeMobile(false)));
 }
}
mobile?.addEventListener("toggle",()=>{
 const opened=mobile.open;
 document.body.classList.toggle("mobile-nav-open",opened);
 head?.classList.toggle("mobile-nav-active",opened);
 if(opened){if(mega)mega.open=false;mobile.querySelector(".mobile-close")?.focus({preventScroll:true})}
});
addEventListener("keydown",e=>{
 if(e.key==="Escape"){
  if(mega)mega.open=false;
  if(mobile?.open){e.preventDefault();closeMobile(true)}
 }
 if(e.key==="Tab"&&mobile?.open&&panel){
  const focusables=[...panel.querySelectorAll('a[href],button:not([disabled])')];
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
});
document.addEventListener("click",e=>{
 if(mega&&!mega.contains(e.target))mega.open=false;
 if(mobile?.open&&!mobile.contains(e.target))closeMobile(false);
});
addEventListener("resize",()=>{if(innerWidth>770&&mobile?.open)closeMobile(false)},{passive:true});
const results=document.querySelector("#search-results"),field=document.querySelector("#search-input");if(results&&field){let index=[];const form=document.querySelector("#search-form");const params=new URLSearchParams(location.search);if(params.has("q"))field.value=params.get("q")||"";const render=()=>{const q=field.value.trim().toLocaleLowerCase("de");const words=q.split(/\s+/).filter(Boolean);const found=index.filter(p=>words.every(w=>(p.title+" "+p.description+" "+p.hubName).toLocaleLowerCase("de").includes(w)));results.textContent="";const msg=document.createElement("p");msg.textContent=q?(found.length+" veröffentlichte Treffer für „"+q+"“."):(index.length+" veröffentlichte Ratgeber durchsuchen.");results.append(msg);for(const item of found.slice(0,60)){const row=document.createElement("div");row.className="search-result";const a=document.createElement("a");a.href=item.url;a.textContent=item.title;const p=document.createElement("p");p.textContent=item.description;row.append(a,p);results.append(row)}if(q&&!found.length){const p=document.createElement("p");p.textContent="Keine Treffer. Probiere andere Begriffe.";results.append(p)}};fetch("/search-index.json").then(r=>{if(!r.ok)throw Error("Index nicht verfügbar");return r.json()}).then(j=>{index=j;render()}).catch(()=>{results.textContent="Die Suche ist momentan nicht verfügbar. Alle veröffentlichten Artikel findest du im Ratgeberarchiv."});field.addEventListener("input",render);form?.addEventListener("submit",e=>{e.preventDefault();const q=field.value.trim();history.replaceState(null,"",q?"/suche/?q="+encodeURIComponent(q):"/suche/");render()})}})();

/* Lazy-loading local blog assistant / Quick Call; no external APIs. */
(function () {
  if (typeof document === "undefined" || document.querySelector('script[data-german-guide-local]')) return;
  const script = document.createElement("script");
  script.src = "/assets/local-assistant.js?v=20261014a";
  script.async = true;
  script.dataset.germanGuideLocal = "";
  document.head.appendChild(script);
})();
