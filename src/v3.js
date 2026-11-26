/* ---------- inline marks ---------- */
const MK={
 code:`<svg class="mk" viewBox="0 0 17 17"><rect x=".5" y=".5" width="16" height="16" rx="4" fill="#141414"/><path d="M4.6 6l2.6 2.5-2.6 2.5M8.8 11.2h3.6" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 globe:`<svg class="mk" viewBox="0 0 17 17" fill="none" stroke="#141414" stroke-width="1.2"><circle cx="8.5" cy="8.5" r="7"/><path d="M1.5 8.5h14M2.6 4.8h11.8M2.6 12.2h11.8M8.5 1.5c2 2.1 3 4.4 3 7s-1 4.9-3 7c-2-2.1-3-4.4-3-7s1-4.9 3-7z"/></svg>`,
 crawft:`<img class="mk" src="/assets/v3/ic/crawft.svg" alt="">`,
 temper:`<svg class="mk" viewBox="0 0 17 17"><rect x=".5" y=".5" width="16" height="16" rx="4" fill="#1b1b1b"/><rect x="3.5" y="4" width="2.6" height="9" rx="1" fill="#8d8d8d"/><path d="M8 6.6l1.7 1.7 3.4-3.6" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11.4h5" stroke="#5c8f6b" stroke-width="1.4" stroke-linecap="round"/></svg>`,
 design:`<svg class="mk" viewBox="0 0 17 17"><path d="M8.5 15.5L3.6 10 8.5 1.5 13.4 10z" fill="#ecc1c1" stroke="#141414" stroke-width="1.1" stroke-linejoin="round"/><circle cx="8.5" cy="9.4" r="1.2" fill="#fff" stroke="#141414" stroke-width="1"/><path d="M8.5 8.2V2.2" stroke="#141414" stroke-width="1"/></svg>`,
 oss:`<svg class="mk" viewBox="0 0 24 24"><path fill="#141414" d="M12 1.5a10.5 10.5 0 0 0-3.3 20.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.3 0c2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z"/></svg>`,
 wins:`<svg class="mk" viewBox="0 0 17 17" stroke="#141414" stroke-width="1" stroke-linejoin="round"><path d="M5 2h7v3.6a3.5 3.5 0 0 1-7 0z" fill="#f2c14e"/><path d="M5 3.4H2.6c0 2 1 3.2 2.6 3.3M12 3.4h2.4c0 2-1 3.2-2.6 3.3" fill="none"/><path d="M8.5 9.1v2.6" fill="none"/><path d="M6 14.6h5v-2.9H6z" fill="#141414"/></svg>`
};
const L=(id,txt,mk)=>`<span class="h" tabindex="0" role="button" data-id="${id}">${MK[mk]||""}<span class="t">${txt}</span><span class="m"><i></i></span></span>`;
if(!document.getElementById("bio").children.length)document.getElementById("bio").innerHTML=[
 `I'm 14. Right now I'm building ${L("temper","Temper","temper")}, which watches the code AI agents ship and undoes what breaks.`,
 `I taught myself to ${L("dev","build software","code")}, and most of what I make ends up on ${L("net","the internet","globe")}.`,
 `Outside of that, I do ${L("design","design work","design")}, send ${L("oss","pull requests","oss")} to tools I use, and go to ${L("wins","hackathons","wins")}. I've won 5 so far.`
].map(p=>`<p>${p}</p>`).join("");

/* ---------- data ---------- */
const D={
 dev:{img:"contrib",fit:"contain",k:"1,284 this year",t:"GitHub contributions",d:"Every commit, PR and issue since I started.",url:"https://github.com/henrybrewer00-dotcom"},
 net:{type:"social"},
 temper:{img:"temper",k:"building now",t:"Temper",d:"Watches what your agents ship, undoes what breaks, and checks every change first.",url:"https://temper-beta.vercel.app"},
 design:{type:"pair",k:"design",t:"ReMynd landing page",d:"Before and after my redesign.",url:"https://remynd.coduck.app"},
 oss:{img:"oss",k:"open source",t:"Pull requests",d:"Small fixes to SymPy, Biome and Astro.",url:"https://github.com/henrybrewer00-dotcom"},
 wins:{img:"wins",pos:"center 0%",k:"5 wins",t:"Hackathons",d:"3rd at EVOLVE with Temper, plus InsForge, Frontier Tower and a16z × Cursor."}
};
const FEATS=[
 {img:"temper",file:"temper — home",t:"Temper",k:"building now",d:"What I spend most of my time on right now. Temper watches what your agents ship, undoes what breaks, and checks every change first. The agents that check the work are separate from the one that writes it. It took 3rd place at EVOLVE, the 8090 Software Factory hackathon.",l:[["temper-beta.vercel.app","https://temper-beta.vercel.app"]],pos:"center top"},
 {type:"vurn"},
 {type:"ba",file:"remynd — landing page redesign",t:"ReMynd landing page",k:"design",d:"I redesigned the landing page for ReMynd, a Mac app that remembers your screen. Both sides are recordings of the real sites. Move across the frame to compare, or open them live below.",l:[["Before, live","https://remyndai.com"],["After, live","https://remynd.coduck.app"]]},
 {img:"wins",file:"evolve — third place",t:"Hackathons",k:"5 wins",d:"I've won 5 hackathons. This is 3rd place at EVOLVE, with Chamath Palihapitiya. The others were InsForge, Frontier Tower and a16z × Cursor.",ar:"5/4",pos:"center 0%"},
 {img:"glass",file:"glasscast — repo",t:"Glasscast",k:"open source",d:"Screen Studio costs money, so I made a free one.",l:[["Code","https://github.com/henrybrewer00-dotcom/Glasscast"]]},
 {img:"oss",file:"sympy — pull request",t:"Open source",k:"pull requests",d:"Small fixes to SymPy, Biome and Astro.",l:[["GitHub","https://github.com/henrybrewer00-dotcom"]]},

];
const ALSO=[["Crawft","past","An AI monitoring tool for schools. I helped start it early on."],["SiteLight","side project","Built in 24 hours. Scaled to its first client in 10 days ($2)."],["S.I.E.G.E.","hardware","A small car that chases my dogs around the house."],["ROV sub","in progress","An underwater remote-controlled submarine I'm still building."]];
const lk=l=>l?`<div class="lk">${l.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("")}</div>`:"";
const SEL=`<span class="sel"><b></b><b></b><b></b><b></b></span>`;
if(!document.getElementById("feats").children.length)document.getElementById("feats").innerHTML=FEATS.map(f=>{
 if(f.type==="vurn")return `<article class="feat vurn rv"><div class="frame"><b>vurn ai — security</b><span>highlight</span></div><div class="vbox"><div class="vk">Vurn AI</div><div class="vn ink">40,000+</div><div class="vl ink">Shopify accounts were open to critical vulnerabilities that Vurn AI found.</div><div class="vd ink">Vurn AI is a tool I built that scans code for security holes.</div></div></article>`;
 const media=f.type==="ba"
  ?`<div class="shot ba"><div class="cmp" id="cmp" style="--x:50%"><div class="pane before"><video muted loop playsinline preload="none" poster="/assets/v3/img/rm-before.jpg" data-src="/assets/v3/vid/rm-before.mp4" aria-label="ReMynd landing page before the redesign (remyndai.com)"></video></div><div class="pane after"><video muted loop playsinline preload="none" poster="/assets/v3/img/rm-after.jpg" data-src="/assets/v3/vid/rm-after.mp4" aria-label="ReMynd landing page after Henry's redesign (remynd.coduck.app)"></video></div><button class="tag l" data-x="100">Before</button><button class="tag r" data-x="0">After</button><span class="bar"></span><span class="knob" aria-label="Drag to compare">↔</span></div>${SEL}</div>`
  :`<div class="shot"${f.ar?` style="aspect-ratio:${f.ar}"`:""}><img src="/assets/v3/img/${f.img}.jpg" alt="${f.t}" loading="lazy" style="object-position:${f.pos||"top"}">${SEL}</div>`;
 return `<article class="feat rv"><div class="frame"><b>${f.file}</b><span class="dim" data-img="${f.type==="ba"?"rm-after":f.img}"></span></div>${media}<div class="fcap"><div class="t ink">${f.t}</div><div class="k">${f.k}</div><div class="d ink">${f.d}</div>${lk(f.l)}</div></article>`}).join("");
if(!document.getElementById("also").children.length)document.getElementById("also").innerHTML=ALSO.map(([n,k,d])=>`<li><div class="nm ink">${n}</div><div class="k">${k}</div><div class="d ink">${d}</div></li>`).join("");
document.querySelectorAll(".dim").forEach(s=>{const i=new Image();i.onload=()=>s.textContent=i.naturalWidth+" × "+i.naturalHeight;i.src="/assets/v3/img/"+s.dataset.img+".jpg"});

/* ---------- measures ---------- */
const spans=[...document.querySelectorAll(".h")];
function measure(){spans.forEach(s=>{const t=s.querySelector(".t"),m=s.querySelector(".m");const w=t.getBoundingClientRect().width;m.style.width=w+"px";m.querySelector("i").textContent=Math.round(w)});
 const me=document.getElementById("me").getBoundingClientRect();if(!copied)document.getElementById("sz").textContent=Math.round(me.width)+" × "+Math.round(me.height)}
let copied=false;
(document.fonts?document.fonts.ready:Promise.resolve()).then(measure);measure();addEventListener("resize",measure);

/* copy email */
const me=document.getElementById("me"),sz=document.getElementById("sz");
me.addEventListener("mouseenter",()=>{if(!copied)sz.textContent="click to copy email"});
me.addEventListener("mouseleave",()=>{if(!copied)measure()});
me.addEventListener("click",()=>{try{navigator.clipboard&&navigator.clipboard.writeText("henrybrewer00@gmail.com").catch(()=>{})}catch(e){}
 copied=true;sz.textContent="email copied";clearTimeout(me._t);me._t=setTimeout(()=>{copied=false;measure()},1800)});

/* ---------- ruler: page y in px, rose line follows the cursor ---------- */
(function(){const r=document.getElementById("ruler");if(!r||getComputedStyle(r).display==="none")return;const tk=r.querySelector(".tk");const labels=[];
 for(let i=0;i<30;i++){const l=document.createElement("i");r.appendChild(l);labels.push(l)}
 const line=document.createElement("b");line.innerHTML="<span></span>";line.style.display="none";r.appendChild(line);let my=-1;
 const draw=()=>{const y=scrollY;tk.style.transform=`translateY(${-(y%100)}px)`;const first=Math.floor(y/100)*100;
  labels.forEach((l,i)=>{const v=first+i*100;l.style.top=(v-y+14)+"px";l.textContent=v});
  if(my>=0){line.style.display="";line.style.top=my+"px";line.firstChild.textContent="y "+Math.round(my+y)}};
 let q=0;const sched=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;draw()})};addEventListener("scroll",sched,{passive:true});addEventListener("mousemove",e=>{my=e.clientY;sched()},{passive:true});
 document.addEventListener("mouseleave",()=>{my=-1;line.style.display="none"});draw()})();
try{document.getElementById("bestrun").textContent=+localStorage.getItem("hb-runner-best")||0}catch(e){}

/* ---------- reveal on scroll ---------- */
(function(){const els=[...document.querySelectorAll(".rv")];
 const check=()=>{els.forEach(e=>{if(!e.classList.contains("in")&&e.getBoundingClientRect().top<innerHeight*.94)e.classList.add("in")})};
 if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -6% 0px"});els.forEach(e=>io.observe(e))}
 addEventListener("scroll",check,{passive:true});addEventListener("resize",check);check();setTimeout(check,400)})();

/* ---------- before / after (recordings of the real sites) ---------- */
(function(){const c=document.getElementById("cmp");if(!c)return;const vids=[...c.querySelectorAll("video")];let drag=false;
 const play=()=>vids.forEach(v=>{if(!v.src){v.src=v.dataset.src;v.load()}const p=v.play();p&&p.catch(()=>{})});
 const pause=()=>vids.forEach(v=>v.pause());
 if("IntersectionObserver" in window){new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?play():pause()),{rootMargin:"200px 0px"}).observe(c)}else play();
 const set=x=>c.style.setProperty("--x",Math.max(0,Math.min(100,x)).toFixed(2)+"%");
 const fromE=e=>{const r=c.getBoundingClientRect();return (e.clientX-r.left)/r.width*100};
 c.addEventListener("pointerdown",e=>{if(e.target.closest(".tag"))return;drag=true;c.classList.remove("ease");c.setPointerCapture(e.pointerId);set(fromE(e))});
 c.addEventListener("pointermove",e=>{if(drag||e.pointerType==="mouse"){c.classList.remove("ease");set(fromE(e))}});
 c.addEventListener("pointerup",()=>drag=false);c.addEventListener("pointercancel",()=>drag=false);
 c.querySelectorAll(".tag").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();c.classList.add("ease");set(+b.dataset.x)}));
})();

/* ---------- runner game: jump cars, duck planes ---------- */
(function(){
 const NS="http://www.w3.org/2000/svg",svg=document.getElementById("run"),scene=document.getElementById("scene"),hint=document.getElementById("hint"),score=document.getElementById("score");
 const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e};
 const H=230,G=200,INK="#141414";let W=scene.clientWidth||1200;
 const defs=el("defs",{});
 defs.innerHTML=`<linearGradient id="paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2493c"/><stop offset=".55" stop-color="#c3301f"/><stop offset="1" stop-color="#8f1f14"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5560"/><stop offset=".6" stop-color="#1c2228"/><stop offset="1" stop-color="#2b333b"/></linearGradient>
 <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset=".7" stop-color="#dcdcdc"/><stop offset="1" stop-color="#b9b9b9"/></linearGradient>
 <radialGradient id="rim"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#9a9a9a"/></radialGradient>`;
 const ground=el("line",{x1:0,y1:G,x2:W,y2:G,stroke:INK,"stroke-width":1.1,"stroke-linecap":"round"});
 const dots=[];for(let i=0;i<38;i++)dots.push({e:el("line",{y1:G+7+(i%3)*6,y2:G+7+(i%3)*6,stroke:"#cfcfcf","stroke-width":1,"stroke-linecap":"round"}),x:Math.random()*W,len:4+(i*7)%16});
 const splats=el("g",{}),drops=el("g",{});

 /* ---- sports car, nose left ---- */
 const car=el("g",{});
 const trail=[0,1,2].map(i=>el("line",{y1:G-34+i*9,y2:G-34+i*9,stroke:"#c4c4c4","stroke-width":1.3,"stroke-linecap":"round"},car));
 el("ellipse",{cx:88,cy:G+1.5,rx:90,ry:3.4,fill:"rgba(0,0,0,.13)"},car);
 el("path",{d:`M6 ${G-11} C2 ${G-13} 1 ${G-19} 5 ${G-22} C14 ${G-26} 34 ${G-29} 56 ${G-31} C68 ${G-40} 82 ${G-46} 104 ${G-46} C122 ${G-46} 136 ${G-40} 148 ${G-33} L170 ${G-31} C176 ${G-30} 178 ${G-24} 177 ${G-17} L175 ${G-11} Z`,fill:"url(#paint)",stroke:INK,"stroke-width":1.2,"stroke-linejoin":"round"},car);
 el("path",{d:`M70 ${G-33} C80 ${G-41} 90 ${G-43} 101 ${G-43} L102 ${G-33} Z`,fill:"url(#glass)",stroke:INK,"stroke-width":.9},car);
 el("path",{d:`M106 ${G-33} L105 ${G-43} C118 ${G-43} 128 ${G-39} 138 ${G-33} Z`,fill:"url(#glass)",stroke:INK,"stroke-width":.9},car);
 el("path",{d:`M60 ${G-30} C90 ${G-31} 130 ${G-31} 160 ${G-29}`,fill:"none",stroke:"rgba(255,255,255,.45)","stroke-width":1.2,"stroke-linecap":"round"},car);
 el("path",{d:`M103 ${G-32} L103 ${G-15} M70 ${G-31} L66 ${G-15}`,fill:"none",stroke:"rgba(0,0,0,.35)","stroke-width":.8},car);
 el("path",{d:`M112 ${G-26} h7`,stroke:INK,"stroke-width":1.2,"stroke-linecap":"round"},car);
 el("path",{d:`M5 ${G-20} C10 ${G-22} 16 ${G-23} 20 ${G-23}`,fill:"none",stroke:"#ffe8a3","stroke-width":2.2,"stroke-linecap":"round"},car);
 el("path",{d:`M172 ${G-28} l4 1 l0 4 l-4 0z`,fill:"#ff6a5a",stroke:INK,"stroke-width":.6},car);
 el("path",{d:`M160 ${G-31} l2 -6 h14`,fill:"none",stroke:INK,"stroke-width":1.4,"stroke-linecap":"round"},car);
 el("path",{d:`M40 ${G-12} H150`,stroke:"rgba(0,0,0,.45)","stroke-width":1.6},car);
 const wheels=[38,146].map(cx=>{const g=el("g",{},car);el("path",{d:`M${cx-16} ${G-11} A16 16 0 0 1 ${cx+16} ${G-11}`,fill:"#1a1a1a"},g);
  el("circle",{cx,cy:G-12,r:12.5,fill:"#151515"},g);el("circle",{cx,cy:G-12,r:7.6,fill:"url(#rim)",stroke:"#555","stroke-width":.6},g);
  const sp=el("g",{},g);for(let k=0;k<5;k++){const a=k*72*Math.PI/180;el("line",{x1:cx,y1:G-12,x2:cx+Math.cos(a)*7,y2:G-12+Math.sin(a)*7,stroke:"#6b6b6b","stroke-width":1.6},sp)}
  el("circle",{cx,cy:G-12,r:1.8,fill:"#333"},g);return {sp,cx}});

 /* ---- small plane, nose left ---- */
 const plane=el("g",{});
 el("path",{d:"M0 9 C2 3 12 0 30 0 L98 0 C104 0 110 -2 116 -14 L124 -14 L122 2 C122 8 118 12 110 12 L18 14 C8 14 1 12 0 9Z",fill:"url(#hull)",stroke:INK,"stroke-width":1.1,"stroke-linejoin":"round"},plane);
 el("path",{d:"M10 4 C14 2 18 1.5 22 1.5 L22 6 L9 6Z",fill:"url(#glass)",stroke:INK,"stroke-width":.7},plane);
 for(let i=0;i<6;i++)el("circle",{cx:34+i*11,cy:5,r:1.8,fill:"#2b333b"},plane);
 el("path",{d:"M48 9 L76 9 L94 24 L84 24Z",fill:"#cfcfcf",stroke:INK,"stroke-width":1,"stroke-linejoin":"round"},plane);
 el("path",{d:"M104 2 L124 2 L130 -2 L110 -2Z",fill:"#d4777f",stroke:INK,"stroke-width":.8},plane);
 el("path",{d:"M2 7 h-3",stroke:INK,"stroke-width":1},plane);
 const prop=el("ellipse",{cx:-3,cy:7,rx:1.6,ry:10,fill:"rgba(20,20,20,.25)"},plane);
 const pshadow=el("ellipse",{cy:G+1.5,rx:50,ry:2.6,fill:"rgba(0,0,0,.08)"});

 /* ---- stick figure ---- */
 const shadow=el("ellipse",{cy:G+1.5,rx:12,ry:2.6,fill:"rgba(0,0,0,.14)"});
 const man=el("g",{fill:"none",stroke:INK,"stroke-linecap":"round","stroke-linejoin":"round"});
 const legB=el("path",{"stroke-width":2.6,opacity:.75},man),armB=el("path",{"stroke-width":2.3,opacity:.75},man),
  torso=el("path",{"stroke-width":3.2},man),neck=el("path",{"stroke-width":2.4},man),
  head=el("circle",{r:7.2,fill:"#fff","stroke-width":2.2},man),hair=el("path",{fill:INK,stroke:"none"},man),
  legA=el("path",{"stroke-width":2.6},man),armA=el("path",{"stroke-width":2.3},man);

 const P2=(x,y,a,l)=>[x+Math.sin(a)*l,y+Math.cos(a)*l];
 function limb(x,y,a1,l1,a2,l2,foot){const [x1,y1]=P2(x,y,a1,l1),[x2,y2]=P2(x1,y1,a1+a2,l2);let d=`M${x.toFixed(1)} ${y.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;if(foot)d+=`l${foot} 0`;return d}
 let st={},X=0;
 const best=(()=>{try{return +localStorage.getItem("hb-runner-best")||0}catch(e){return 0}})();
 let bestScore=best,pts=0,mode="run",intro=0,phase=0,manY=0,vy=0,air=false,duck=0,duckHold=false,dead=0,rag=null;
 let obs=null,nextObs=2.6,speed=480,last=performance.now(),passed=false;
 const GRAV=1900,JV=-Math.sqrt(2*GRAV*120);
 /* car roof height (px above ground) along its length, nose at 0 */
 const carTop=dx=>dx<0||dx>178?0:dx<22?20:dx<56?24+(dx-22)*.15:dx<70?30+(dx-56)*1.1:dx<140?46:31;
 const baseX=()=>Math.max(70,Math.min(W*.28,320));
 function manX(){const e=1-Math.pow(1-intro,3);return baseX()-(1-e)*(baseX()+70)}
 function setScore(){score.textContent=pts||bestScore?`score ${pts}${bestScore?` · best ${bestScore}`:""}`:""}
 function pose(x,y){/* y = ground offset of feet (negative when in air) */
  const crouch=duck,hipY=G+y-30+crouch*12,hx=x;
  const lean=.12+crouch*.75,tl=25-crouch*3;const [sx,sy]=P2(hx,hipY,Math.PI-lean,tl);
  const [nx,ny]=P2(sx,sy,Math.PI-lean*.6,4);
  torso.setAttribute("d",`M${hx} ${hipY}L${sx.toFixed(1)} ${sy.toFixed(1)}`);neck.setAttribute("d",`M${sx.toFixed(1)} ${sy.toFixed(1)}L${nx.toFixed(1)} ${ny.toFixed(1)}`);
  const hcx=nx+Math.sin(lean)*7,hcy=ny-6.5;head.setAttribute("cx",hcx.toFixed(1));head.setAttribute("cy",hcy.toFixed(1));
  hair.setAttribute("d",`M${(hcx-7.2).toFixed(1)} ${(hcy-1).toFixed(1)} A7.2 7.2 0 0 1 ${(hcx+7).toFixed(1)} ${(hcy-2.4).toFixed(1)} C${(hcx+3).toFixed(1)} ${(hcy-4.4).toFixed(1)} ${(hcx-3).toFixed(1)} ${(hcy-3.4).toFixed(1)} ${(hcx-7.2).toFixed(1)} ${(hcy-1).toFixed(1)}Z`);
  if(air&&mode==="run"){legA.setAttribute("d",limb(hx,hipY,1.25,15,-2.1,15,4));legB.setAttribute("d",limb(hx,hipY,.55,15,-1.7,15,4));
   armA.setAttribute("d",limb(sx,sy+1,2.5,11,-.5,10));armB.setAttribute("d",limb(sx,sy+1,1.9,11,-.8,10))}
  else if(crouch>.5){const s=Math.sin(phase)*.35;legA.setAttribute("d",limb(hx,hipY,1.05+s,14,-1.85,14,4));legB.setAttribute("d",limb(hx,hipY,.35-s,14,-1.5,14,4));
   armA.setAttribute("d",limb(sx,sy+1,1.2,10,.9,9));armB.setAttribute("d",limb(sx,sy+1,.7,10,1.1,9))}
  else{const s=Math.sin(phase),c=Math.cos(phase);
   legA.setAttribute("d",limb(hx,hipY,.62*s+.08,15,-(c>0?c*1.5:0)-.12,15.5,4));legB.setAttribute("d",limb(hx,hipY,-.62*s+.08,15,-(c<0?-c*1.5:0)-.12,15.5,4));
   armA.setAttribute("d",limb(sx,sy+1,-.85*s,11,1.35,10));armB.setAttribute("d",limb(sx,sy+1,.85*s,11,1.35,10))}
  shadow.setAttribute("cx",x);const k=Math.max(.3,1+y/130);shadow.setAttribute("rx",(12*k).toFixed(1));shadow.setAttribute("opacity",k.toFixed(2))}

 function spawn(){const lvl=pts;let kind="car";
  if(lvl>=4&&Math.random()<Math.min(.55,.25+lvl*.03))kind="plane";
  speed=Math.min(760,410+lvl*16)+Math.random()*50;
  obs={kind,x:W+40};passed=false;
  car.style.display=kind==="car"?"":"none";plane.style.display=pshadow.style.display=kind==="plane"?"":"none";
  if(kind==="plane"&&!scene.dataset.duckHint){scene.dataset.duckHint=1;flash(touch?"swipe down to duck":"↓ to duck")}}
 const touch=matchMedia("(hover: none)").matches;
 function flash(t){hint.textContent=t;hint.classList.add("show");clearTimeout(hint._t);hint._t=setTimeout(()=>hint.classList.remove("show"),2600)}

 function hit(){if(mode!=="run")return;mode="dead";dead=0;
  const x=manX();rag={x,y:manY,vx:-(speed*.55),vy:-560-Math.random()*120,rot:0,vr:-(5+Math.random()*3)};
  const by=G+manY-34;for(let i=0;i<26;i++){const d=el("circle",{r:(1+Math.random()*2.4).toFixed(1),fill:i%3?"#b3261e":"#8e1410"},drops);
   d._x=x+4;d._y=by+Math.random()*16;d._vx=-(80+Math.random()*420);d._vy=-(120+Math.random()*420);}
  flash("ouch");
  if(pts>bestScore){bestScore=pts;try{localStorage.setItem("hb-runner-best",bestScore)}catch(e){}const b=document.getElementById("bestrun");if(b)b.textContent=bestScore}
  pts=0;setScore()}
 function revive(){mode="run";intro=0;manY=0;vy=0;air=false;duck=0;rag=null;man.removeAttribute("transform");
  [...splats.children].forEach(s=>{s.style.transition="opacity 1.6s";s.style.opacity=0;setTimeout(()=>s.remove(),1700)})}

 function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(intro<1&&mode==="run")intro=Math.min(1,intro+dt/1.4);
  phase+=dt*(11+speed/90);
  dots.forEach(d=>{d.x-=dt*speed*.4;if(d.x<-20)d.x=W+Math.random()*40;d.e.setAttribute("x1",d.x.toFixed(1));d.e.setAttribute("x2",(d.x+d.len).toFixed(1))});
  duck+=((duckHold&&!air&&mode==="run"?1:0)-duck)*Math.min(1,dt*18);
  const x=manX();
  if(obs){obs.x-=speed*dt;
   if(obs.kind==="car"){car.setAttribute("transform",`translate(${obs.x.toFixed(1)} 0)`);trail.forEach((l,i)=>{l.setAttribute("x1",186+i*6);l.setAttribute("x2",212+i*12)});wheels.forEach(w=>w.sp.setAttribute("transform",`rotate(${(-now*.8)%360} ${w.cx} ${G-12})`));
    if(mode==="run"&&!passed){const top=Math.max(carTop(x+6-obs.x),carTop(x-6-obs.x));if(top&&-manY<top-3)hit()}}
   else{const py=G-74+Math.sin(now/300)*1.5;plane.setAttribute("transform",`translate(${obs.x.toFixed(1)} ${py.toFixed(1)})`);prop.setAttribute("ry",(4+Math.abs(Math.sin(now/30))*7).toFixed(1));pshadow.setAttribute("cx",(obs.x+62).toFixed(1));
    if(mode==="run"&&!passed&&obs.x<x+10&&obs.x+128>x-10&&duck<.6)hit()}
   const span=obs.kind==="car"?176:128;
   if(mode==="run"&&!passed&&obs.x+span<x-10){passed=true;pts++;setScore();if(pts===4)flash("planes now")}
   if(obs.x<-220){obs=null;nextObs=(pts>8?.7:1.1)+Math.random()*1.6}}
  else{nextObs-=dt;if(nextObs<=0)spawn()}
  if(mode==="run"){if(air){vy+=GRAV*dt;manY+=vy*dt;if(manY>=0){manY=0;vy=0;air=false}}pose(x,manY)}
  else{dead+=dt;if(rag){rag.vy+=GRAV*.8*dt;rag.x+=rag.vx*dt;rag.y+=rag.vy*dt;rag.rot+=rag.vr*dt;
    const floor=24*Math.abs(Math.sin(rag.rot))-4;if(rag.y>floor&&rag.vy>0){rag.y=floor;rag.vy*=-.25;rag.vx*=.55;rag.vr*=.4}
    man.setAttribute("transform",`translate(${(rag.x-x).toFixed(1)} ${(rag.y-manY).toFixed(1)}) rotate(${(rag.rot*57).toFixed(1)} ${x} ${G+manY-30})`);shadow.setAttribute("cx",rag.x)}
   if(dead>1.8)revive()}
  [...drops.children].forEach(d=>{d._vy+=GRAV*.7*dt;d._x+=d._vx*dt;d._y+=d._vy*dt;
   if(d._y>=G){const r=+d.getAttribute("r");el("ellipse",{cx:d._x.toFixed(1),cy:G+.5,rx:(r*2.2).toFixed(1),ry:(r*.55).toFixed(1),fill:"#a31d16",opacity:.85},splats);d.remove()}
   else{d.setAttribute("cx",d._x.toFixed(1));d.setAttribute("cy",d._y.toFixed(1))}});
  hint.style.left=x+"px";hint.style.top=(G-96+(mode==="run"?manY:0))+"px";
  if(running)requestAnimationFrame(tick);else ticking=false}

 function jump(){if(mode==="run"&&!air&&duck<.5){air=true;vy=JV}}
 function size(){W=scene.clientWidth;svg.setAttribute("viewBox",`0 0 ${W} ${H}`);ground.setAttribute("x2",W)}
 size();addEventListener("resize",size);
 const inView=()=>{const r=scene.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0};
 const typing=()=>/INPUT|TEXTAREA/.test(document.activeElement.tagName);
 addEventListener("keydown",e=>{if(!inView()||typing())return;
  if((e.code==="Space"||e.code==="ArrowUp"||e.code==="KeyW")&&!document.activeElement.classList.contains("h")){e.preventDefault();jump()}
  if(e.code==="ArrowDown"||e.code==="KeyS"){e.preventDefault();duckHold=true}});
 addEventListener("keyup",e=>{if(e.code==="ArrowDown"||e.code==="KeyS")duckHold=false});
 let ty=null;
 scene.addEventListener("pointerdown",e=>{ty=e.clientY;if(e.pointerType==="mouse"){if(e.button===2)return;jump()}});
 scene.addEventListener("pointerup",e=>{if(e.pointerType!=="mouse"&&ty!==null){if(e.clientY-ty>24){duckHold=true;setTimeout(()=>duckHold=false,650)}else jump()}ty=null});
 scene.addEventListener("contextmenu",e=>{e.preventDefault();duckHold=true;setTimeout(()=>duckHold=false,650)});
 hint.textContent=touch?"tap to jump":"space to jump";setScore();
 car.style.display="none";plane.style.display=pshadow.style.display="none";
 if(matchMedia("(prefers-reduced-motion: reduce)").matches){intro=1;pose(manX(),0);car.style.display="";car.setAttribute("transform",`translate(${manX()+120} 0)`)}
 else{var running=true,ticking=true;requestAnimationFrame(tick);
  const resume=()=>{if(running&&!ticking&&!document.hidden){ticking=true;last=performance.now();requestAnimationFrame(tick)}};
  if("IntersectionObserver" in window)new IntersectionObserver(es=>{running=es[0].isIntersecting;resume()}).observe(scene);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)running=false;else{running=true;resume()}})}
 hint.classList.add("show");setTimeout(()=>hint.classList.remove("show"),5500);
})();

/* ---------- previews ---------- */
const card=document.getElementById("card"),ghost=document.getElementById("ghost");let active=null,closeT=null;
const touch=matchMedia("(hover: none)").matches;
Object.values(D).forEach(d=>{if(d.img){const i=new Image();i.src="/assets/v3/img/"+d.img+".jpg"}});
const SOC=[["GitHub","https://github.com/henrybrewer00-dotcom",'<path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>'],
 ["X","https://x.com/Henry_J_Brew",'<path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/>'],
 ["Email","mailto:henrybrewer00@gmail.com",'<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.8 7l8.2 6 8.2-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>']];
function render(it){
 if(it.type==="social")return `<div class="dock">${SOC.map(([n,u,p])=>`<a href="${u}" ${u.startsWith("http")?'target="_blank" rel="noopener"':""} aria-label="${n}"><svg viewBox="0 0 24 24">${p}</svg><span>${n}</span></a>`).join("")}</div>`;
 const media=it.type==="pair"?`<div class="two"><figure><div class="ph"><img src="/assets/v3/img/rm-before.jpg" alt=""></div><figcaption>Before</figcaption></figure><figure><div class="ph"><img src="/assets/v3/img/rm-after.jpg" alt=""></div><figcaption>After</figcaption></figure></div>`
  :`<div class="ph${it.fit?" fit":""}"><img src="/assets/v3/img/${it.img}.jpg" alt="${it.t}" style="object-position:${it.pos||"top"}"></div>`;
 return `<div class="pc${it.fit?" wide":""}">${media}<div class="cap"><div class="tt">${it.t}</div><div class="k">${it.k}</div><div class="d">${it.d}</div>${it.url?`<div class="go">${touch?"tap again to open":"click to open"} ↗</div>`:""}</div></div>`}
function place(sp,allowScroll){if(!sp)return;let r=sp.getBoundingClientRect();const ch=card.offsetHeight,cw=card.offsetWidth;
 const need=r.top-ch-24;if(allowScroll&&need<0&&scrollY>=-need){scrollBy(0,need);r=sp.getBoundingClientRect()}
 const cx=(r.left+r.right)/2;const x=Math.max(16,Math.min(innerWidth-16-cw,cx-cw/2));let y=r.top-ch-10;let below=false;
 if(y<8){y=r.bottom+16;below=true;const over=y+ch-(innerHeight-16);if(allowScroll&&over>0){scrollBy(0,over);r=sp.getBoundingClientRect();y=r.bottom+16}}
 card.classList.toggle("below",below);card.style.left=x+"px";card.style.top=y+"px";
 const cs=getComputedStyle(sp);ghost.style.font=cs.font;ghost.style.lineHeight=cs.lineHeight;ghost.style.left=r.left+"px";ghost.style.top=r.top+"px"}
function open(sp){clearTimeout(closeT);const it=D[sp.dataset.id];if(!it||active===sp)return;active=sp;
 spans.forEach(x=>x.classList.toggle("on",x===sp));ghost.innerHTML=sp.innerHTML;ghost.querySelector(".m")&&ghost.querySelector(".m").remove();
 card.innerHTML=render(it);card.classList.toggle("live",it.type==="social");document.body.classList.add("peek");
 card.querySelectorAll("img").forEach(im=>im.addEventListener("load",()=>{if(active===sp)place(sp,touch)}));
 place(sp,touch);card.classList.remove("show");void card.offsetWidth;card.classList.add("show")}
function close(){active=null;spans.forEach(x=>x.classList.remove("on"));card.classList.remove("show","live");document.body.classList.remove("peek")}
const later=(ms)=>{clearTimeout(closeT);closeT=setTimeout(close,ms)};
spans.forEach(s=>{
 if(!touch){let it=null;s.addEventListener("mouseenter",()=>{clearTimeout(it);
  if(active&&active!==s&&card.classList.contains("live")){it=setTimeout(()=>{if(!overCard){clearTimeout(closeT);active=null;open(s)}},420);return}
  clearTimeout(closeT);if(active&&active!==s){active=null;open(s)}else it=setTimeout(()=>open(s),70)});
  s.addEventListener("mouseleave",()=>{clearTimeout(it);if(active===s&&card.classList.contains("live"))later(450);else if(active===s)close()})}
 s.addEventListener("click",e=>{e.stopPropagation();const u=D[s.dataset.id]&&D[s.dataset.id].url;
  if(u&&(!touch||active===s)){window.open(u,"_blank","noopener");return}
  if(active===s&&touch){close();return}if(active!==s){active=null;open(s)}});
 s.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();active===s?close():open(s)}if(e.key==="Escape")close()})});
let overCard=false;card.addEventListener("mouseenter",()=>{overCard=true;clearTimeout(closeT)});card.addEventListener("mouseleave",()=>{overCard=false;later(60)});card.addEventListener("click",e=>e.stopPropagation());
document.addEventListener("click",()=>{if(active)close()});
/* close as soon as the pointer is off the word itself */
addEventListener("mousemove",e=>{if(!active||touch||card.classList.contains("live"))return;const t=active.querySelector(".t").getBoundingClientRect(),r=active.getBoundingClientRect();
 if(e.clientX<Math.min(r.left,t.left)-2||e.clientX>t.right+2||e.clientY<t.top+3||e.clientY>t.bottom-2)close()},{passive:true});
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
addEventListener("scroll",()=>{if(active)place(active)},{passive:true});addEventListener("resize",()=>{if(active)place(active)});
