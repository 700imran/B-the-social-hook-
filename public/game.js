(()=>{'use strict';
const $=s=>document.querySelector(s),KEY='so_me',SK='so_sess',API='/api',CFG=window.SHOWOFF_CFG||{},AUTH=!!(CFG.supabaseUrl&&CFG.anonKey);
const lvl=x=>Math.floor(Math.sqrt(x/50))+1,need=l=>50*l*l,esc=s=>escapeHtml(s);
const day=Math.floor(Date.now()/864e5),bid='d'+day,ix=(day%3)*2,A=sampleItems[ix],B=sampleItems[ix+1];
let me;try{me=JSON.parse(localStorage.getItem(KEY))}catch{}
me=me||{name:'Player'+(100+Math.random()*900|0),xp:0,streak:0,last:'',votes:{}};
const keep=()=>{try{localStorage.setItem(KEY,JSON.stringify(me))}catch{}};
let live=false,res=null,board=[],sess=null;try{sess=JSON.parse(localStorage.getItem(SK))}catch{}
const putSess=s=>{sess=s;try{s?localStorage.setItem(SK,JSON.stringify(s)):localStorage.removeItem(SK)}catch{}};
// --- Supabase Auth (GoTrue REST, email magic link) ---
if(AUTH&&/access_token=/.test(location.hash)){const q=new URLSearchParams(location.hash.slice(1));if(q.get('access_token')){putSess({at:q.get('access_token'),rt:q.get('refresh_token'),exp:Date.now()/1e3+ +q.get('expires_in')});history.replaceState(null,'',location.pathname+location.search)}}
async function token(){if(!AUTH||!sess)return null;if(sess.exp-60>Date.now()/1e3)return sess.at;
try{const r=await fetch(CFG.supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:CFG.anonKey,'content-type':'application/json'},body:JSON.stringify({refresh_token:sess.rt})});if(!r.ok)throw 0;const j=await r.json();putSess({at:j.access_token,rt:j.refresh_token,exp:Date.now()/1e3+j.expires_in});return j.access_token}catch{putSess(null);return null}}
async function signIn(email){try{const r=await fetch(CFG.supabaseUrl+'/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',headers:{apikey:CFG.anonKey,'content-type':'application/json'},body:JSON.stringify({email,create_user:true})});return r.ok}catch{return false}}
async function api(p,o={}){try{const t=await token(),h={'content-type':'application/json'};if(t)h.authorization='Bearer '+t;const r=await fetch(API+p,{...o,headers:h,signal:AbortSignal.timeout(5000)});if(r.status>=500)return null;return await r.json().catch(()=>null)}catch{return null}}
// --- sound (respects the existing sound toggle) ---
let ac;function tone(f,d=.1,t='sine',at=0,v=.05){if(typeof soundEnabled==='undefined'||!soundEnabled)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),s=ac.currentTime+at;o.type=t;o.frequency.setValueAtTime(f,s);g.gain.setValueAtTime(v,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(ac.destination);o.start(s);o.stop(s+d)}catch{}}
const sfx={vote:()=>{tone(440,.08,'triangle');tone(660,.12,'triangle',.07)},win:()=>[523,659,784,1047].forEach((f,k)=>tone(f,.2,'square',k*.09,.03)),hover:()=>tone(880,.03,'sine',0,.015)};
function burst(x,y){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=['#ff3d81','#F6BF24','#00D4AA','#38BDF8','#a06cff'];for(let k=0;k<30;k++){const e=document.createElement('i');e.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:8px;height:12px;background:${c[k%5]};z-index:99;pointer-events:none;border-radius:2px`;document.body.appendChild(e);const a=Math.random()*6.28,d=80+Math.random()*150;e.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+90}px) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>e.remove()}}
// --- UI ---
const hud=()=>{const l=lvl(me.xp),lo=need(l-1),p=Math.min(100,(me.xp-lo)/(need(l)-lo)*100);return`<div class="hud"><button class="hud-name" id="gName" title="Rename">${esc(me.name)}</button><span class="chip">LV ${l}</span><div class="xpbar" role="progressbar" aria-label="XP to next level" aria-valuenow="${Math.round(p)}"><b style="width:${p}%"></b></div><span class="chip">${me.xp} XP</span><span class="chip">🔥 ${me.streak}</span><button class="chip" id="gSound">🔊 Sound</button>${live?'<button class="chip" id="gOut">Sign out</button>':''}</div>${AUTH&&!live?'<form class="signin" id="gSign"><input type="email" required placeholder="you@example.com" aria-label="Email"><button class="chip" type="submit">Email me a login link</button></form>':''}`};
const card=(x,k)=>{const t=res?res.a+res.b:0,pc=res?Math.round(res[k]*100/Math.max(1,t)):0;return`<button class="duel${res&&res.mine===k?' mine':''}" data-k="${k}" ${res?'disabled':''} aria-label="Vote for ${esc(x.title)}"><div class="submission-art art-${x.art}"><span class="art-shape"></span><span class="art-shape two"></span><div class="abstract">${x.art==='creator'?'CREATE':x.art==='startup'?'BUILD':'DESIGN'}<small>${esc(x.field.toUpperCase())}</small></div></div><h3>${esc(x.title)}</h3><small>by ${esc(x.owner)}</small>${res?`<div class="res"><b style="width:${pc}%"></b><span>${pc}%</span></div>`:'<span class="vs-cta">Tap to vote · +10 XP</span>'}</button>`};
const mode=()=>live?'LIVE':AUTH?'GUEST · SIGN IN TO SAVE XP':'PREVIEW MODE';
function paint(){const el=$('#arena');el.innerHTML=`<div class="arena-in"><div class="eyebrow">TODAY'S BATTLE · ${mode()}</div><h2>Which one wins?</h2>${hud()}<div class="duel-grid">${card(A,'a')}<div class="vs">VS</div>${card(B,'b')}</div><h3 class="lb-h">Top players</h3><ol class="lb">${board.map((p,k)=>`<li${p.me?' class="you"':''}><span>${k+1}</span>${esc(p.name)}<b>${p.xp} XP</b></li>`).join('')||'<li>Be the first on the board.</li>'}</ol><p class="modal-note">${live?'Votes are counted on the server: one per account per battle.':AUTH?'Guest votes and XP stay on this device. Sign in to save them and join the shared leaderboard.':'Preview mode: votes and XP stay on this device. Connect Supabase for shared results.'}</p></div>`;
$('#gSound').onclick=()=>{$('#soundToggle').click();setTimeout(()=>{sfx.win();paint()},50)};
$('#gName').onclick=async()=>{const n=(prompt('Display name (max 24 chars)',me.name)||'').trim().slice(0,24);if(!n)return;me.name=n;keep();if(live)await api('/me',{method:'POST',body:JSON.stringify({name:n})});await refresh()};
if($('#gOut'))$('#gOut').onclick=()=>{putSess(null);live=false;res=null;toast('Signed out');init2()};
if($('#gSign'))$('#gSign').onsubmit=async e=>{e.preventDefault();toast(await signIn(e.target.querySelector('input').value.trim())?'Check your email for the login link':'Could not send the link. Try again.')};
document.querySelectorAll('.duel').forEach(b=>{b.onmouseenter=sfx.hover;b.onclick=e=>vote(b.dataset.k,e)})}
async function refresh(){const lb=AUTH&&await api('/leaderboard');board=(lb&&lb.top)||[];if(!board.length&&!AUTH)board=['Nova','Kite','Rune','Echo','Juno'].map((n,k)=>({name:n+' (sample)',xp:260-k*45}));if(!live&&me.xp)board=[...board,{name:me.name+' (you, guest)',xp:me.xp,me:1}];board=board.sort((a,b)=>b.xp-a.xp).slice(0,8);paint()}
const seed=k=>{const s=[...bid].reduce((a,c)=>a+c.charCodeAt(0),0);return{a:20+s%30+(k==='a'),b:20+(s*7)%30+(k==='b'),mine:k}};
async function vote(k,e){const before=lvl(me.xp);let out=null;
if(live){out=await api('/battles/'+bid+'/vote',{method:'POST',body:JSON.stringify({choice:k})});
 if(out&&out.error==='already_voted'){res=await api('/battles/'+bid);toast('You already voted in this battle');await refresh();return}
 if(out&&out.error==='unauthenticated'){putSess(null);live=false;toast('Session expired. Sign in again to save XP.')}}
if(!out||out.error){const today=new Date().toISOString().slice(0,10),y=new Date(Date.now()-864e5).toISOString().slice(0,10);let g=10;if(me.last!==today){me.streak=me.last===y?me.streak+1:1;g+=5*Math.min(me.streak,5)}me.last=today;me.xp+=g;out={...seed(k),gained:g}}
else{me.xp=out.xp;me.streak=out.streak}
res={a:out.a,b:out.b,mine:k};if(!live){me.votes[bid]=k;keep()}sfx.vote();burst(e.clientX,e.clientY);toast('+'+out.gained+' XP'+(me.streak>1?' · '+me.streak+'-day streak 🔥':''));
if(lvl(me.xp)>before)setTimeout(()=>{sfx.win();toast('LEVEL UP! You are now level '+lvl(me.xp));burst(innerWidth/2,innerHeight/3)},700);await refresh()}
async function init2(){live=false;const st=me.votes[bid];
if(AUTH&&await token()){const m=await api('/me');if(m&&!m.error&&m.name){live=true;me={...me,name:m.name,xp:m.xp,streak:m.streak};const r=await api('/battles/'+bid);res=r&&r.mine?r:null}}
if(!live)res=st?seed(st):null;await refresh()}
(async()=>{const s=document.createElement('section');s.className='section arena';s.id='arena';($('#fields')||document.body).before(s);await init2()})()})();
