// SHOWOFF API: thin Cloudflare Pages Function in front of Supabase (Postgres + Auth). See API.md.
// Needs env vars SUPABASE_URL and SUPABASE_ANON_KEY (both public values). No service-role key is used:
// the caller's own JWT is forwarded, so Postgres (auth.uid() + SECURITY DEFINER functions) enforces the rules.
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const BID=/^d\d{1,6}$/,CODE={unauthenticated:401,invalid_input:400,already_voted:409,no_profile:404};
export async function onRequest({request,env}){
  const base=(env.SUPABASE_URL||'').replace(/\/$/,''),key=env.SUPABASE_ANON_KEY;
  if(!base||!key)return J({error:'not_configured'},503);
  const p=new URL(request.url).pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean),m=request.method;
  const jwt=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const rpc=async(fn,args,needAuth)=>{
    if(needAuth&&!jwt)return J({error:'unauthenticated'},401);
    let r;try{r=await fetch(`${base}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:key,authorization:'Bearer '+(jwt||key),'content-type':'application/json'},body:JSON.stringify(args)})}catch{return J({error:'upstream_unreachable'},502)}
    const j=await r.json().catch(()=>null);
    if(r.ok)return J(j);
    if(r.status===401||r.status===403)return J({error:'unauthenticated'},401);
    const c=j&&j.message;return J({error:CODE[c]?c:'server_error'},CODE[c]||500);
  };
  const body=async()=>request.json().catch(()=>({}));
  if(p[0]==='leaderboard'&&m==='GET'){const r=await rpc('leaderboard',{});return r.ok?J({top:await r.json()}):r}
  if(p[0]==='me'&&m==='GET')return rpc('get_me',{},true);
  if(p[0]==='me'&&m==='POST')return rpc('set_name',{p_name:String((await body()).name||'')},true);
  if(p[0]==='battles'&&BID.test(p[1]||'')){
    if(m==='GET')return jwt?rpc('get_battle',{p_battle:p[1]},true):J({battle:p[1],mine:null});
    if(p[2]==='vote'&&m==='POST'){const c=(await body()).choice;return rpc('cast_vote',{p_battle:p[1],p_choice:String(c)},true)}
  }
  return J({error:'not_found'},404);
}
