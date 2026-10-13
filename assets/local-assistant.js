/* German on-device blog guide assistant, adapted from /web local search.
   No paid AI API, tracking, third-party network request or invented business facts. */
(function (root) {
  "use strict";
  const BUSINESS = Object.freeze({
    name:"Motorbike Rental - Nguyen Tu",
    phone:"0942 467 674",
    tel:"tel:+84942467674",
    zalo:"https://zalo.me/0942467674",
    maps:"https://share.google/59Er3R16jWr3psKeo",
    email:"mailto:nguyentuantu8x@gmail.com"
  });
  const STOP = new Set("ich du sie der die das den dem des ein eine einen einem einer und oder mit ohne fuer von im in auf zu zur zum am an ist sind war was wie wo wer warum kann koennen mir bitte ueber info infos hanoi vietnam mieten mietung".split(" "));
  const SYN = {
    fuehrerschein:["fahrerlaubnis","dokumente","vertrag","verkehr","sicherheit"],
    fuehrerscheine:["fahrerlaubnis","dokumente","vertrag"],
    lizenz:["fahrerlaubnis","dokumente"],
    recht:["gesetz","verkehr","sicherheit","dokumente"],
    kaution:["deposit","mietpreise","vertrag","rueckgabe"],
    pfand:["kaution","vertrag","dokumente"],
    preis:["mietpreise","kosten","kaution"],
    preise:["mietpreise","kosten","kaution"],
    kosten:["mietpreise","kaution","vertrag"],
    sicher:["sicherheit","verkehr","bremsen"],
    sicherheit:["verkehr","helm","bremsen"],
    fuehrung:["sicherheit","fahrzeugwahl"],
    lieferung:["abholung","rueckgabe"],
    rueckgabe:["abholung","vertrag"],
    abholen:["abholung","uebergabe"],
    automatik:["automatikroller","fahrzeugwahl"],
    schaltung:["schaltmotorrad","fahrzeugwahl"],
    gepaeck:["stauraum","gewicht","fahrzeugwahl"],
    route:["routen","reiseplanung"],
    tour:["routen","reiseplanung"]
  };
  function normalize(text) {
    return String(text == null ? "" : text).toLocaleLowerCase("de-DE")
      .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
  }
  function queryTerms(q) {
    const terms=normalize(q).split(" ").filter(w=>w.length>2&&!STOP.has(w)).slice(0,9);
    return [...new Set(terms)];
  }
  function safeArticleUrl(path) {
    return typeof path==="string" && /^\/ratgeber\/[a-z0-9-]+\/$/.test(path);
  }
  function scoreText(text,terms,weight) {
    const hay=normalize(text), parts=hay.split(" ");
    let score=0;
    for (const t of terms) {
      if (parts.some(p=>p===t||p.startsWith(t)&&t.length>=4)) score+=weight;
      else if ((SYN[t]||[]).some(w=>hay.includes(normalize(w)))) score+=Math.max(1,weight-1);
    }
    return score;
  }
  function rankArticles(index,question,limit=3) {
    if (!Array.isArray(index))return [];
    const terms=queryTerms(question);
    if (!terms.length)return [];
    return index.filter(p=>p&&safeArticleUrl(p.url))
      .map(p=>({...p,_score:scoreText(p.title,terms,6)+scoreText(p.description,terms,3)+scoreText(p.hubName,terms,2)}))
      .filter(p=>p._score>=2)
      .sort((a,b)=>b._score-a._score||String(a.title).localeCompare(String(b.title),"de"))
      .slice(0,Math.max(1,Math.min(5,limit)));
  }
  function bestPassage(paragraphs,q) {
    const terms=queryTerms(q);
    if (!Array.isArray(paragraphs)||!paragraphs.length)return "";
    const sorted=paragraphs.filter(t=>typeof t==="string"&&t.trim().length>55)
      .map((text,i)=>({text:text.trim(),i,score:scoreText(text,terms,3)}))
      .sort((a,b)=>b.score-a.score||a.i-b.i);
    if(!sorted.length)return "";
    const chosen=sorted[0].text.replace(/\s+/g," ");
    const max=295;
    if(chosen.length<=max)return chosen;
    const cut=chosen.lastIndexOf(" ",max);
    return chosen.slice(0,Math.max(190,cut))+" …";
  }
  /* Pure collision solver: prefer bottom-right, step upward around fixed widgets. */
  function chooseFabTop(baseTop,safeTop,viewBottom,x,size,obstacles) {
    const baseline=Math.max(safeTop,Math.min(baseTop,viewBottom-size-16));
    let best=baseline,bestPenalty=Infinity;
    const offsets=[0,70,140,210,280,-70];
    for(const d of offsets){
      const y=baseTop-d;
      if(y<safeTop||y+size>viewBottom-16)continue;
      const rect={left:x,right:x+size,top:y,bottom:y+size};
      const penalty=(obstacles||[]).reduce((sum,b)=>
        sum+(rect.left<b.right+9&&rect.right>b.left-9&&rect.top<b.bottom+9&&rect.bottom>b.top-9?1:0),0);
      if(penalty<bestPenalty){bestPenalty=penalty;best=y}
      if(!penalty)break;
    }
    return best;
  }
  root.GermanGuideLocal={normalize,queryTerms,rankArticles,bestPassage,safeArticleUrl,chooseFabTop};
  if(typeof document==="undefined")return;

  const READY=()=> {
    if(document.getElementById("g-guide-floating"))return;
    const styleURL="/assets/styles.css"; // visual styles reuse the site's own stylesheet
    void styleURL;
    const host=document.createElement("div");
    host.id="g-guide-floating";
    host.innerHTML=
      '<div class="g-quick" id="g-quick" data-open="false">'+
        '<button class="g-quick-main" type="button" aria-expanded="false" aria-controls="g-quick-actions" aria-label="Schnellkontakt öffnen" title="Schnellkontakt: externer Verleih">'+
          '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 16.5v3a1.5 1.5 0 0 1-1.7 1.5A18.5 18.5 0 0 1 3 4.7 1.5 1.5 0 0 1 4.5 3h3A1.5 1.5 0 0 1 9 4.3c.1 1 .4 2 .7 2.9a1.5 1.5 0 0 1-.3 1.6L8 10.2a15 15 0 0 0 5.8 5.8l1.4-1.4a1.5 1.5 0 0 1 1.6-.3c.9.3 1.9.6 2.9.7a1.5 1.5 0 0 1 1.3 1.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'+
        '</button>'+
        '<div id="g-quick-actions" class="g-quick-actions" hidden>'+
          '<span class="g-quick-label">Externer Verleih · Nguyen Tu</span>'+
          '<a href="tel:+84942467674" aria-label="Anrufen 0942 467 674"><span aria-hidden="true">☎</span> Anrufen</a>'+
          '<a href="https://zalo.me/0942467674" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">Z</span> Zalo</a>'+
          '<a href="https://share.google/59Er3R16jWr3psKeo" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">⌖</span> Karte</a>'+
          '<a href="mailto:nguyentuantu8x@gmail.com"><span aria-hidden="true">✉</span> E-Mail</a>'+
        '</div>'+
      '</div>'+
      '<button class="g-ai-fab" id="g-ai-fab" type="button" aria-expanded="false" aria-controls="g-ai-panel" aria-label="Lokalen Ratgeber-Assistenten öffnen" title="Blog-Assistent · ohne KI-API">'+
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7l-4.2 1 1.3-4.1A8 8 0 1 1 20 12z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.8 11.7h.01M12 11.7h.01M15.2 11.7h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'+
        '<span class="g-ai-dot" aria-hidden="true"></span>'+
      '</button>'+
      '<section class="g-ai-panel" id="g-ai-panel" role="dialog" aria-modal="false" aria-label="Lokaler Blog-Assistent" hidden>'+
        '<div class="g-ai-head"><div><strong>Ratgeber-Assistent</strong><small>Lokale Artikelsuche · ohne KI-API</small></div><button class="g-ai-close" type="button" aria-label="Assistent schließen">×</button></div>'+
        '<div class="g-ai-log" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
        '<div class="g-ai-quick" aria-label="Häufige Themen">'+
          '<button type="button" data-question="Roller oder Motorrad?">Fahrzeugwahl</button>'+
          '<button type="button" data-question="Was ist mit der Kaution?">Kaution</button>'+
          '<button type="button" data-question="Sicherheit im Verkehr">Sicherheit</button>'+
          '<button type="button" data-question="Führerschein und Dokumente">Führerschein</button>'+
        '</div>'+
        '<form class="g-ai-form"><label class="g-visually-hidden" for="g-ai-text">Frage stellen</label><input id="g-ai-text" type="text" maxlength="240" autocomplete="off" placeholder="Frage zu unseren Ratgebern …" aria-label="Frage zu den Ratgebern"/><button type="submit" aria-label="Frage senden">➤</button></form>'+
      '</section>';
    document.body.appendChild(host);
    const quick=host.querySelector("#g-quick"), quickBtn=host.querySelector(".g-quick-main"),
      quickActions=host.querySelector("#g-quick-actions"), fab=host.querySelector("#g-ai-fab"),
      panel=host.querySelector("#g-ai-panel"), closeBtn=host.querySelector(".g-ai-close"),
      log=host.querySelector(".g-ai-log"),form=host.querySelector(".g-ai-form"),
      input=host.querySelector("#g-ai-text");
    let indexPromise=null, welcomed=false, lastArticle=null, frame=0, baselineHeight=0;
    const cachedPages=new Map();
    function setQuick(open) {
      quick.dataset.open=String(!!open);
      quickActions.hidden=!open;
      quickBtn.setAttribute("aria-expanded",String(!!open));
      schedulePosition();
    }
    function keyboardVisible() {
      const vv=window.visualViewport;
      if(!vv||document.activeElement!==input)return false;
      baselineHeight=Math.max(baselineHeight,window.innerHeight);
      return baselineHeight-vv.height>110;
    }
    function openChat(open) {
      if(open)setQuick(false);
      panel.hidden=!open;
      fab.setAttribute("aria-expanded",String(!!open));
      document.body.classList.toggle("g-ai-open",!!open);
      if(open){
        if(!welcomed) {
          welcomed=true;
          addMsg("bot","Hallo! Ich suche lokal in den veröffentlichten deutschen Ratgebern. Keine generative KI, keine externe Chat-API. Frage nach Fahrzeugwahl, Kaution, Sicherheit oder einer Route.");
        }
        loadIndex().catch(()=>{});
        if(!window.matchMedia("(pointer: coarse)").matches)input.focus({preventScroll:true});
      }else {
        document.body.classList.remove("g-ai-keyboard");
        baselineHeight=0;
      }
      schedulePosition();
    }
    function addMsg(type,text,links) {
      const msg=document.createElement("div");
      msg.className="g-ai-message "+type;
      const p=document.createElement("p");p.textContent=text;msg.appendChild(p);
      if(Array.isArray(links)&&links.length){
        const ul=document.createElement("ul");ul.className="g-ai-links";
        for(const link of links.slice(0,3)){
          if(!safeArticleUrl(link.url) && !/^\/(ratgeber|suche|themen\/[a-z0-9-]+)\/$/.test(link.url))continue;
          const li=document.createElement("li"),a=document.createElement("a");
          a.href=link.url;a.textContent=link.label||"Ratgeber lesen";
          li.append(a);ul.append(li);
        }
        if(ul.childElementCount)msg.append(ul);
      }
      log.append(msg);
      log.scrollTop=log.scrollHeight;
      return msg;
    }
    async function loadIndex() {
      if(!indexPromise){
        indexPromise=fetch("/search-index.json",{credentials:"same-origin",cache:"force-cache"})
          .then(r=>{if(!r.ok)throw Error("index HTTP "+r.status);return r.json()})
          .then(rows=>{if(!Array.isArray(rows))throw Error("invalid index");return rows.filter(p=>p&&safeArticleUrl(p.url))})
          .catch(e=>{indexPromise=null;throw e});
      }
      return indexPromise;
    }
    async function fetchArticle(hit) {
      if(!safeArticleUrl(hit.url))return [];
      if(cachedPages.has(hit.url))return cachedPages.get(hit.url);
      const r=await fetch(hit.url,{credentials:"same-origin",cache:"force-cache"});
      if(!r.ok)throw Error("Article not available");
      const html=await r.text();
      const doc=new DOMParser().parseFromString(html,"text/html");
      const paragraphs=[...doc.querySelectorAll("article.reading p,article.reading li")]
        .map(n=>n.textContent.replace(/\s+/g," ").trim()).filter(s=>s.length>45).slice(0,90);
      cachedPages.set(hit.url,paragraphs);
      return paragraphs;
    }
    function contactQuestion(text) {
      return /\b(kontakt|anrufen|telefon|nummer|zalo|anschrift|adresse|vermieter|oeffnungszeit|email|e mail)\b/.test(normalize(text));
    }
    function pricingQuestion(text) {
      return /\b(preis|preise|kosten|tarif|wie teuer|verfuegbar|verfuegbarkeit)\b/.test(normalize(text));
    }
    async function send(raw) {
      const q=String(raw||"").trim().slice(0,240);
      if(!q)return;
      addMsg("user",q);
      input.value="";
      const norm=normalize(q);
      if(contactQuestion(q)){
        addMsg("bot","Dieser Guide bietet keine Buchung an. Für ein Mietangebot erreichst du den externen Verleih Motorbike Rental – Nguyen Tu unter "+BUSINESS.phone+". Du kannst links die Schnellkontakte öffnen.");
        return;
      }
      if(pricingQuestion(q)){
        addMsg("bot","Aktuelle Preise und Verfügbarkeit kann dieser Ratgeber nicht live bestätigen. Vergleiche die Mietbedingungen und lasse dir ein konkretes Angebot direkt vom Anbieter geben.",[
          {url:"/themen/mietpreise-kaution/",label:"Mietpreise und Kaution"}]);
        return;
      }
      const pending=addMsg("bot","Ich durchsuchen die veröffentlichten deutschen Artikel …");
      try{
        const rows=await loadIndex();
        let hits=rankArticles(rows,q,3);
        if(!hits.length && /^(mehr|weiter|und sonst|mehr dazu|details)/.test(norm)&&lastArticle){
          hits=[lastArticle];
        }
        if(!hits.length){
          pending.firstChild.textContent="Dazu finde ich keinen eindeutigen veröffentlichten Artikel. Im Ratgeberarchiv kannst du alle verfügbaren Themen prüfen. Ich erfinde keine Antwort.";
          const a=document.createElement("a");a.href="/ratgeber/";a.textContent="Alle veröffentlichten Ratgeber →";a.className="g-ai-single-link";pending.append(a);
          return;
        }
        lastArticle=hits[0];
        let passage="";
        try{passage=bestPassage(await fetchArticle(hits[0]),q)}catch(e){/* matched title and metadata remain valid */}
        const lead=passage?"Passage aus „"+hits[0].title+"“: "+passage :
          "Ich habe dazu passende veröffentlichte Artikel gefunden. Öffne die Quelle für die vollständige, geprüfte Beschreibung.";
        pending.firstChild.textContent=lead;
        const links=document.createElement("ul");links.className="g-ai-links";
        for(const h of hits){
          const li=document.createElement("li"),a=document.createElement("a");
          a.href=h.url;a.textContent=h.title;li.append(a);links.append(li);
        }
        pending.append(links);log.scrollTop=log.scrollHeight;
      }catch(e){
        pending.firstChild.textContent="Der lokale Artikelindex ist gerade nicht verfügbar. Die veröffentlichen Ratgeber bleiben über das Archiv erreichbar.";
        const a=document.createElement("a");a.href="/ratgeber/";a.textContent="Ratgeberarchiv →";a.className="g-ai-single-link";pending.append(a);
      }
    }
    function overlaps(a,b,gap=8){
      return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
    }
    function obstacleRects(){
      const selectors=".back-top.visible,.g-quick,.cookie-banner,.cookie-consent,.sticky-cta,[data-floating-obstacle],.floating-contact,.fixed-contact,[role='dialog']:not(.g-ai-panel)";
      const results=[];
      for(const el of document.querySelectorAll(selectors)){
        if(el===fab||el===panel||el.contains(fab)||el.contains(panel))continue;
        const c=window.getComputedStyle(el);
        if(c.display==="none"||c.visibility==="hidden"||Number(c.opacity)<.15)continue;
        if(c.position!=="fixed"&&c.position!=="sticky"&&!el.hasAttribute("data-floating-obstacle"))continue;
        const r=el.getBoundingClientRect();
        if(r.width&&r.height)results.push(r);
      }
      return results;
    }
    function position() {
      const vv=window.visualViewport;
      const viewTop=vv?vv.offsetTop:0,viewBottom=vv?vv.offsetTop+vv.height:window.innerHeight;
      const mobileMenu=!!document.querySelector(".mobile-menu[open]")||
        document.body.classList.contains("mobile-nav-open");
      host.classList.toggle("g-float-hidden",mobileMenu);
      if(mobileMenu)return;
      const safeTop=Math.max(74,viewTop+12),minBottom=16;
      const btnSize=56;
      const x=window.innerWidth-16-btnSize;
      const baseTop=viewBottom-86-btnSize;
      const obstacles=obstacleRects();
      const top=chooseFabTop(baseTop,safeTop,viewBottom,x,btnSize,obstacles);
      const bottom=Math.max(8,window.innerHeight-top-btnSize);
      fab.style.bottom=Math.round(bottom)+"px";
      const chatOn=!panel.hidden;
      const typing=chatOn&&keyboardVisible();
      document.body.classList.toggle("g-ai-keyboard",typing);
      if(!chatOn)return;
      if(typing){
        const visibleHeight=vv?vv.height:window.innerHeight;
        panel.style.top=Math.round(viewTop+8)+"px";
        panel.style.bottom="auto";
        panel.style.height=Math.round(Math.max(180,visibleHeight-16))+"px";
        panel.style.left="8px";panel.style.right="8px";panel.style.width="auto";
      }else{
        const panelBottom=bottom+70;
        const headerBottom=Math.max(72,viewTop+12);
        const allowed=window.innerHeight-panelBottom-headerBottom-10;
        panel.style.top="auto";
        panel.style.bottom=Math.round(panelBottom)+"px";
        panel.style.height=Math.round(Math.max(180,Math.min(500,allowed)))+"px";
        panel.style.left="auto";panel.style.right="12px";
        panel.style.width="min(380px,calc(100vw - 24px))";
      }
    }
    function schedulePosition(){
      if(frame)return;
      frame=requestAnimationFrame(()=>{frame=0;position()});
    }
    quickBtn.addEventListener("click",()=>{
      const next=quick.dataset.open!=="true";
      if(next)openChat(false);
      setQuick(next);
    });
    fab.addEventListener("click",()=>openChat(panel.hidden));
    closeBtn.addEventListener("click",()=>{openChat(false);fab.focus({preventScroll:true})});
    form.addEventListener("submit",e=>{e.preventDefault();send(input.value)});
    host.querySelectorAll(".g-ai-quick button").forEach(btn=>
      btn.addEventListener("click",()=>send(btn.dataset.question||"")));
    document.addEventListener("click",e=>{
      if(quick.dataset.open==="true"&&!quick.contains(e.target))setQuick(false);
    });
    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape")return;
      if(!panel.hidden){e.preventDefault();openChat(false);fab.focus({preventScroll:true})}
      else if(quick.dataset.open==="true"){setQuick(false);quickBtn.focus({preventScroll:true})}
    });
    input.addEventListener("focus",()=>{setTimeout(schedulePosition,80);setTimeout(schedulePosition,300)});
    input.addEventListener("blur",()=>{setTimeout(schedulePosition,100)});
    for(const ev of ["scroll","resize","orientationchange"]){
      window.addEventListener(ev,schedulePosition,{passive:true});
    }
    if(window.visualViewport){
      window.visualViewport.addEventListener("resize",schedulePosition,{passive:true});
      window.visualViewport.addEventListener("scroll",schedulePosition,{passive:true});
    }
    const menu=document.querySelector(".mobile-menu");
    menu?.addEventListener("toggle",()=>{if(menu.open){openChat(false);setQuick(false)}schedulePosition()});
    const observer=new MutationObserver(schedulePosition);
    observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
    if(typeof ResizeObserver!=="undefined"){
      const ro=new ResizeObserver(schedulePosition);
      const top=document.querySelector(".back-top");if(top)ro.observe(top);
      const header=document.querySelector(".site-head");if(header)ro.observe(header);
    }
    schedulePosition();
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",READY,{once:true});
  else READY();
})(typeof window!=="undefined"?window:globalThis);
