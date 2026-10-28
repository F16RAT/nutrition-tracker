'use strict';
const TZ='America/Phoenix';
const todayStr=()=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const shift=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const fmtDate=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'});
const r=(x,d=0)=>(+x||0).toFixed(d);const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let DATA=null,cur=new URLSearchParams(location.search).get('d')||todayStr();
function totals(day){const t={kcal:0,protein:0,carbs:0,fat:0,fiber:0,n:{}};
 (day?.meals||[]).forEach(m=>(m.items||[]).forEach(i=>{['kcal','protein','carbs','fat','fiber'].forEach(k=>t[k]+=+i[k]||0);
  for(const[k,v]of Object.entries(i.nutrients||{}))t.n[k]=(t.n[k]||0)+(+v||0)}));return t}
function color(p,limit){if(limit)return p>100?'var(--blu)':p>=90?'var(--amb)':'var(--grn)';return p<50?'var(--red)':p<90?'var(--amb)':p<=150?'var(--grn)':'var(--blu)'}
function bar(label,val,tgt,unit,limit,col){const p=tgt?val/tgt*100:0;return `<div class="bar"><div class="bl"><span>${label}</span><span>${r(val,val<10?1:0)} / ${tgt} ${unit} · <b>${r(p)}%</b></span></div><div class="bt"><div class="bf" style="width:${Math.min(p,100)}%;background:${col||color(p,limit)}"></div></div></div>`}
function ring(v,t){const R=52,C=2*Math.PI*R,p=Math.min(v/t,1),over=v>t;return `<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="${R}" fill="none" stroke="var(--tr)" stroke-width="12"/><circle cx="65" cy="65" r="${R}" fill="none" stroke="${over?'var(--blu)':'var(--acc)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 65 65)"/><text x="65" y="62" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${r(v)}</text><text x="65" y="82" text-anchor="middle" font-size="12" fill="var(--mu)">of ${t} kcal</text></svg>`}
function render(){
 const T=DATA.targets,day=DATA.days[cur],t=totals(day),isToday=cur===todayStr();
 document.getElementById('dlabel').textContent=fmtDate(cur);document.getElementById('dsub').textContent=(isToday?'Today · ':'')+cur;
 const kt=(day?.day_type&&T.kcal_by_day_type?.[day.day_type])||T.kcal,rem=kt-t.kcal;let h='';
 if(day?.estimate||day?.notes)h+=`<div class="card">${day.estimate?'<span class="badge">ESTIMATES / DEMO</span> ':''}<span class="mu">${esc(day.notes)}</span></div>`;
 h+=`<div class="card ring">${ring(t.kcal,kt)}<div><div class="big">${r(Math.abs(rem))}</div><div class="mu">${rem>=0?'kcal remaining':'kcal over'}</div>
 <div class="mu" style="margin-top:6px">Rest ${T.kcal_by_day_type?.rest} · Lift ${T.kcal_by_day_type?.lifting} · Hard ${T.kcal_by_day_type?.hard}</div>${day?.active_kcal?`<div class="mu">Active: ${day.active_kcal} kcal</div>`:''}${day?.weight_lb?`<div class="mu">Weight: ${day.weight_lb} lb</div>`:''}</div></div>`;
 const mk=t.protein*4+t.carbs*4+t.fat*9||1;
 h+=`<div class="card"><h2>Macros</h2>${bar(`Protein <span class="mu">${r(t.protein*4/mk*100)}% kcal · goal ${T.protein_range?.join('–')}</span>`,t.protein,T.protein,'g',0,'#9b59b6')}
 ${bar(`Carbs <span class="mu">${r(t.carbs*4/mk*100)}% kcal</span>`,t.carbs,T.carbs,'g',0,'#f1c40f')}${bar(`Fat <span class="mu">${r(t.fat*9/mk*100)}% kcal</span>`,t.fat,T.fat,'g',0,'#e67e22')}
 ${bar('Fiber',t.fiber,T.fiber,'g')}</div>`;
 const flags=[];let nb='';
 for(const[k,m]of Object.entries(T.nutrients)){const v=t.n[k]||0,p=v/m.target*100;nb+=bar(m.label+(m.limit?' <span class="mu">(limit)</span>':''),v,m.target,m.unit,m.limit);
  if(m.limit&&p>100)flags.push(`🔵 Over: ${m.label} ${r(p)}%`);else if(!m.limit&&p<50)flags.push(`🔴 Low: ${m.label} ${r(p)}%`);else if(!m.limit&&p<90)flags.push(`🟠 Short: ${m.label} ${r(p)}%`)}
 const pp=t.protein/T.protein*100,fp=t.fiber/T.fiber*100;if(pp<90)flags.unshift(`${pp<50?'🔴':'🟠'} Protein ${r(t.protein)} g (${r(pp)}%) — need ${r(T.protein-t.protein)} g`);if(fp<90)flags.unshift(`${fp<50?'🔴':'🟠'} Fiber ${r(t.fiber,1)} g (${r(fp)}%)`);
 h+=`<div class="card"><h2>Gaps &amp; flags</h2>${day?(flags.map(f=>`<div class="flag">${f}</div>`).join('')||'<div class="flag">✅ All on track</div>'):'<span class="mu">No data</span>'}</div>`;
 h+=`<div class="card"><h2>Nutrients</h2>${nb}</div>`;
 h+=`<div class="card"><h2>Meals</h2>${(day?.meals||[]).map(m=>{const mt=totals({meals:[m]});return `<details><summary><span><b>${esc(m.time)}</b> ${esc(m.name)}</span><span>${r(mt.kcal)} kcal · ${r(mt.protein)} g P</span></summary>
 ${m.note?`<div class="mu" style="padding-left:10px">${esc(m.note)}</div>`:''}${(m.items||[]).map(i=>`<div class="it"><span>${esc(i.food)}</span><span>${r(i.kcal)} kcal · P${r(i.protein)} C${r(i.carbs)} F${r(i.fat)}</span></div>`).join('')}</details>`}).join('')||'<span class="mu">Nothing logged.</span>'}</div>`;
 const wk=[...Array(7)].map((_,i)=>shift(cur,i-6)),wt=wk.map(d=>({d,t:totals(DATA.days[d]),has:!!DATA.days[d]})),logged=wt.filter(x=>x.has);
 const maxK=Math.max(T.kcal*1.2,...wt.map(x=>x.t.kcal)),maxP=Math.max(T.protein*1.2,...wt.map(x=>x.t.protein));
 const ch=(f,max,tg,c)=>`<div class="chart" style="position:relative">${wt.map(x=>`<div class="col"><span>${x.has?r(f(x.t)):''}</span><i style="height:${f(x.t)/max*85}%;background:${c}"></i><span>${x.d.slice(8)}</span></div>`).join('')}<div style="position:absolute;left:0;right:0;bottom:calc(${tg/max*85}% + 14px);border-top:1px dashed var(--mu)"></div></div>`;
 const avg=k=>logged.length?logged.reduce((a,x)=>a+x.t[k],0)/logged.length:0;
 h+=`<div class="card"><h2>7-day trend</h2><div class="mu">Calories (dashed = ${T.kcal})</div>${ch(t=>t.kcal,maxK,T.kcal,'var(--acc)')}<div class="mu" style="margin-top:10px">Protein g (dashed = ${T.protein})</div>${ch(t=>t.protein,maxP,T.protein,'#9b59b6')}
 <p class="mu">${logged.length} day(s) logged · avg ${r(avg('kcal'))} kcal · ${r(avg('protein'))} g protein · ${r(avg('fiber'),1)} g fiber</p>${weight()}</div>`;
 document.getElementById('app').innerHTML=h;document.getElementById('next').disabled=false;
 history.replaceState(null,'',isToday?location.pathname:'?d='+cur)}
function weight(){const pts=Object.keys(DATA.days).sort().filter(d=>DATA.days[d].weight_lb).map(d=>[d,+DATA.days[d].weight_lb]);if(!pts.length)return '<p class="mu">No weight entries yet.</p>';
 const ws=pts.map(p=>p[1]),mn=Math.min(...ws)-1,mx=Math.max(...ws)+1,W=340,H=100,x=i=>pts.length<2?W/2:i/(pts.length-1)*(W-20)+10,y=w=>H-10-(w-mn)/(mx-mn)*(H-20);
 return `<div class="mu" style="margin-top:10px">Weight (lb) ${pts[0][1]} → ${ws.at(-1)}</div><svg viewBox="0 0 ${W} ${H}" width="100%"><polyline fill="none" stroke="var(--blu)" stroke-width="2" points="${pts.map((p,i)=>x(i)+','+y(p[1])).join(' ')}"/>${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p[1])}" r="3" fill="var(--blu)"/>`).join('')}</svg>`}
async function load(){try{const res=await fetch('data.json?t='+Date.now(),{cache:'no-store'});DATA=await res.json()}catch(e){document.getElementById('app').innerHTML='<p class="mu">Could not load data.json</p>';return}
 document.getElementById('upd').textContent='Last updated: '+(DATA.last_updated?new Date(DATA.last_updated).toLocaleString('en-US',{timeZone:TZ})+' MST':'—');render()}
document.getElementById('prev').onclick=()=>{cur=shift(cur,-1);render()};document.getElementById('next').onclick=()=>{cur=shift(cur,1);render()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});load();
