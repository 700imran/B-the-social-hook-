// SHOWOFF API (Cloudflare Pages Function + D1). See API.md.
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const UUID=/^[0-9a-f-]{36}$/i,BID=/^d\d{1,6}$/,lvl=x=>Math.floor(Math.sqrt(x/50))+1;
const dayStr=o=>new Date(Date.now()-o*864e5).toISOString().slice(0,10);
export async function onRequest({request,env}){
  const u=new URL(request.url),p=u.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean),m=request.method,db=env.DB;
  if(!db)return J({error:'db_not_configured'},503);
  try{
    if(p[0]==='players'&&m==='POST'){
      const b=await request.json().catch(()=>({}));const name=String(b.name||'').replace(/[<>&"']/g,'').trim().slice(0,24);
      if(!UUID.test(b.id||'')||!name)return J({error:'invalid_input'},400);
      await db.prepare('INSERT INTO players(id,name) VALUES(?1,?2) ON CONFLICT(id) DO UPDATE SET name=?2').bind(b.id,name).run();
      return J(await player(db,b.id),201);
    }
    if(p[0]==='players'&&p[1]&&m==='GET'){const pl=UUID.test(p[1])&&await player(db,p[1]);return pl?J(pl):J({error:'not_found'},404)}
    if(p[0]==='leaderboard'&&m==='GET'){
      const r=await db.prepare('SELECT id,name,xp,streak FROM players ORDER BY xp DESC LIMIT 20').all();
      return J({top:r.results.map(x=>({...x,level:lvl(x.xp)}))});
    }
    if(p[0]==='battles'&&BID.test(p[1]||'')){
      const bid=p[1];
      if(m==='GET'){
        const pid=u.searchParams.get('player')||'',mine=UUID.test(pid)?await db.prepare('SELECT choice FROM votes WHERE battle_id=?1 AND player_id=?2').bind(bid,pid).first():null;
        if(!mine)return J({battle:bid,mine:null}); // totals stay hidden until you vote
        return J({battle:bid,mine:mine.choice,...await counts(db,bid)});
      }
      if(p[2]==='vote'&&m==='POST'){
        const b=await request.json().catch(()=>({}));
        if(!UUID.test(b.player||'')||!['a','b'].includes(b.choice))return J({error:'invalid_input'},400);
        const pl=await player(db,b.player);if(!pl)return J({error:'unknown_player'},404);
        const today=dayStr(0),streak=pl.last_day===today?pl.streak:(pl.last_day===dayStr(1)?pl.streak+1:1);
        const gained=10+(pl.last_day===today?0:5*Math.min(streak,5));
        const [ins]=await db.batch([
          db.prepare('INSERT OR IGNORE INTO votes(battle_id,player_id,choice) VALUES(?1,?2,?3)').bind(bid,b.player,b.choice)]);
        if(!ins.meta.changes)return J({error:'already_voted'},409);
        await db.prepare('UPDATE players SET xp=xp+?2,streak=?3,last_day=?4 WHERE id=?1').bind(b.player,gained,streak,today).run();
        return J({mine:b.choice,gained,xp:pl.xp+gained,streak,level:lvl(pl.xp+gained),...await counts(db,bid)});
      }
    }
    return J({error:'not_found'},404);
  }catch(e){return J({error:'server_error'},500)}
}
const player=(db,id)=>db.prepare('SELECT id,name,xp,streak,last_day FROM players WHERE id=?1').bind(id).first();
async function counts(db,bid){const r=await db.prepare("SELECT choice,COUNT(*) n FROM votes WHERE battle_id=?1 GROUP BY choice").bind(bid).all();const o={a:0,b:0};r.results.forEach(x=>o[x.choice]=x.n);return o}
