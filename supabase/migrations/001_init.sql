-- SHOWOFF: Supabase schema. Run in the Supabase SQL editor (or `supabase db push`).
-- All access goes through SECURITY DEFINER functions; tables have RLS on and NO policies (direct access denied).
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 24),
  xp int not null default 0, streak int not null default 0, last_day date,
  created_at timestamptz not null default now());
create table public.votes(
  battle_id text not null check(battle_id ~ '^d[0-9]{1,6}$'),
  player_id uuid not null references public.profiles(id) on delete cascade,
  choice text not null check(choice in('a','b')),
  created_at timestamptz not null default now(),
  primary key(battle_id,player_id));
create index on public.votes(battle_id,choice);
create index on public.profiles(xp desc);
alter table public.profiles enable row level security;
alter table public.votes enable row level security;
revoke all on public.profiles, public.votes from anon, authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,name) values(new.id,'Player'||substr(new.id::text,1,4)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.get_me() returns json language sql security definer set search_path='' stable as $$
  select row_to_json(t) from (select name,xp,streak,floor(sqrt(xp/50.0))::int+1 as level from public.profiles where id=auth.uid()) t $$;

create function public.set_name(p_name text) returns json language plpgsql security definer set search_path='' as $$
declare n text:=left(btrim(regexp_replace(coalesce(p_name,''),'[<>&"'']','','g')),24);
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if n='' then raise exception 'invalid_input'; end if;
  update public.profiles set name=n where id=auth.uid();
  return public.get_me();
end $$;

create function public.leaderboard() returns json language sql security definer set search_path='' stable as $$
  select coalesce(json_agg(t),'[]'::json) from (
    select name,xp,streak,floor(sqrt(xp/50.0))::int+1 as level,(id=auth.uid()) as me
    from public.profiles order by xp desc, created_at limit 20) t $$;

create function public.get_battle(p_battle text) returns json language plpgsql security definer set search_path='' stable as $$
declare m text; ca int; cb int;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select choice into m from public.votes where battle_id=p_battle and player_id=auth.uid();
  if m is null then return json_build_object('battle',p_battle,'mine',null); end if; -- totals hidden until you vote
  select count(*) filter(where choice='a'),count(*) filter(where choice='b') into ca,cb from public.votes where battle_id=p_battle;
  return json_build_object('battle',p_battle,'mine',m,'a',ca,'b',cb);
end $$;

create function public.cast_vote(p_battle text,p_choice text) returns json language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); pr public.profiles; s int; g int; ca int; cb int;
begin
  if uid is null then raise exception 'unauthenticated'; end if;
  if p_battle !~ '^d[0-9]{1,6}$' or p_choice not in('a','b') then raise exception 'invalid_input'; end if;
  select * into pr from public.profiles where id=uid for update;
  if not found then raise exception 'no_profile'; end if;
  insert into public.votes(battle_id,player_id,choice) values(p_battle,uid,p_choice) on conflict do nothing;
  if not found then raise exception 'already_voted'; end if;
  s:=case when pr.last_day=current_date then pr.streak when pr.last_day=current_date-1 then pr.streak+1 else 1 end;
  g:=10+case when pr.last_day=current_date then 0 else 5*least(s,5) end;
  update public.profiles set xp=xp+g,streak=s,last_day=current_date where id=uid;
  select count(*) filter(where choice='a'),count(*) filter(where choice='b') into ca,cb from public.votes where battle_id=p_battle;
  return json_build_object('mine',p_choice,'gained',g,'xp',pr.xp+g,'streak',s,'level',floor(sqrt((pr.xp+g)/50.0))::int+1,'a',ca,'b',cb);
end $$;

revoke all on function public.get_me(),public.set_name(text),public.leaderboard(),public.get_battle(text),public.cast_vote(text,text) from public,anon;
grant execute on function public.leaderboard() to anon,authenticated;
grant execute on function public.get_me(),public.set_name(text),public.get_battle(text),public.cast_vote(text,text) to authenticated;
