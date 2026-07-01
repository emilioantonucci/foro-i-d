-- =========================================================================
-- Radar I+D / I+D Hub — Actividad reciente (feed de eventos del sidebar)
-- A global, short-lived activity log for the "Actividad reciente" widget:
-- who published, commented, voted/liked, earned a badge or ranked up.
-- Populated ONLY by SECURITY DEFINER triggers (no client writes). Rows older
-- than 30 days are purged opportunistically on each insert (no pg_cron in
-- this project) and the read view filters to 30 days as a second belt.
-- Payload snapshots (titulo, extracto, badge_nombre…) let the UI render
-- without joining posts/datos/badges; ON DELETE CASCADE keeps events from
-- pointing at removed content. Reuses rango_for_puntos() from 0001.
-- =========================================================================

-- ---- table ---------------------------------------------------------------
create table if not exists activity_events (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid not null references profiles(id) on delete cascade,
  tipo       text not null check (tipo in
               ('publico_enlace','publico_dato','comento_enlace','comento_dato',
                'voto_enlace','like_dato','insignia','rango')),
  post_id    uuid references posts(id) on delete cascade,
  dato_id    uuid references datos(id) on delete cascade,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_created on activity_events(created_at desc);

-- =========================================================================
-- HELPER — single insert path + opportunistic 30-day retention. The DELETE
-- is cheap at this volume thanks to idx_activity_created.
-- =========================================================================
create or replace function log_activity(
  p_actor uuid, p_tipo text, p_post uuid, p_dato uuid, p_payload jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_actor is null then return; end if;
  delete from activity_events where created_at < now() - interval '30 days';
  insert into activity_events (actor_id, tipo, post_id, dato_id, payload)
  values (p_actor, p_tipo, p_post, p_dato, coalesce(p_payload, '{}'::jsonb));
end $$;

-- =========================================================================
-- FUNCTIONS — one per event source (SECURITY DEFINER, mirroring fn_notif_*
-- in 0005). Vote/like filters replicate fn_vote_points / fn_dato_like_points
-- exactly (positive + no self), so the widget never shows activity the
-- points engine ignores.
-- =========================================================================
create or replace function fn_act_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform log_activity(new.user_id, 'publico_enlace', new.id, null,
                       jsonb_build_object('titulo', new.titulo));
  return new;
end $$;

create or replace function fn_act_dato()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform log_activity(new.user_id, 'publico_dato', null, new.id,
                       jsonb_build_object('titulo', new.titulo, 'dato_tipo', new.tipo));
  return new;
end $$;

create or replace function fn_act_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_titulo text;
begin
  select titulo into v_titulo from posts where id = new.post_id;
  perform log_activity(new.user_id, 'comento_enlace', new.post_id, null,
                       jsonb_build_object('titulo', v_titulo,
                                          'extracto', left(new.comentario, 140)));
  return new;
end $$;

create or replace function fn_act_dato_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_titulo text;
begin
  select titulo into v_titulo from datos where id = new.dato_id;
  perform log_activity(new.user_id, 'comento_dato', null, new.dato_id,
                       jsonb_build_object('titulo', v_titulo,
                                          'extracto', left(new.comentario, 140)));
  return new;
end $$;

-- Votes: only positive, non-self votes are logged (same gate as
-- fn_vote_points, 0001). On un-vote the mirror event is removed so the
-- widget never shows a "votó" that was taken back.
create or replace function fn_act_vote()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_pos boolean; v_titulo text; v_voto_nombre text;
begin
  select es_positivo, nombre into v_pos, v_voto_nombre
    from tipos_voto where slug = coalesce(new.tipo_voto, old.tipo_voto);
  if v_pos is distinct from true then return coalesce(new, old); end if;

  select user_id, titulo into v_author, v_titulo
    from posts where id = coalesce(new.post_id, old.post_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then                               -- no self-vote
      perform log_activity(new.user_id, 'voto_enlace', new.post_id, null,
                           jsonb_build_object('titulo', v_titulo,
                                              'tipo_voto', new.tipo_voto,
                                              'tipo_voto_nombre', v_voto_nombre));
    end if;
  elsif tg_op = 'DELETE' then
    delete from activity_events
     where tipo = 'voto_enlace' and actor_id = old.user_id
       and post_id = old.post_id and payload->>'tipo_voto' = old.tipo_voto;
  end if;
  return coalesce(new, old);
end $$;

-- Likes on datos: same gate as fn_dato_like_points (0006) — no self-like;
-- un-like removes the mirror event.
create or replace function fn_act_dato_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_titulo text;
begin
  select user_id, titulo into v_author, v_titulo
    from datos where id = coalesce(new.dato_id, old.dato_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then                               -- no self-like
      perform log_activity(new.user_id, 'like_dato', null, new.dato_id,
                           jsonb_build_object('titulo', v_titulo));
    end if;
  elsif tg_op = 'DELETE' then
    delete from activity_events
     where tipo = 'like_dato' and actor_id = old.user_id and dato_id = old.dato_id;
  end if;
  return coalesce(new, old);
end $$;

create or replace function fn_act_insignia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nombre text;
begin
  select nombre into v_nombre from badges where id = new.badge_id;
  perform log_activity(new.user_id, 'insignia', null, null,
                       jsonb_build_object('badge_nombre', v_nombre));
  return new;
end $$;

-- Rank-up: same upward-crossing detection as fn_notif_rango (0005), kept as
-- an independent function so 0005 stays untouched.
create or replace function fn_act_rango()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old text; v_new text;
begin
  v_old := rango_for_puntos(old.puntos);
  v_new := rango_for_puntos(new.puntos);
  if v_new is distinct from v_old and new.puntos > old.puntos then
    perform log_activity(new.id, 'rango', null, null,
                         jsonb_build_object('rango_anterior', v_old, 'rango_nuevo', v_new));
  end if;
  return new;
end $$;

-- =========================================================================
-- TRIGGERS
-- =========================================================================
drop trigger if exists trg_act_posts          on posts;
drop trigger if exists trg_act_datos          on datos;
drop trigger if exists trg_act_comments       on comments;
drop trigger if exists trg_act_datos_comments on datos_comments;
drop trigger if exists trg_act_votes          on votes;
drop trigger if exists trg_act_datos_likes    on datos_likes;
drop trigger if exists trg_act_insignia       on user_badges;
drop trigger if exists trg_act_rango          on profiles;

create trigger trg_act_posts          after insert on posts
  for each row execute function fn_act_post();
create trigger trg_act_datos          after insert on datos
  for each row execute function fn_act_dato();
create trigger trg_act_comments       after insert on comments
  for each row execute function fn_act_comment();
create trigger trg_act_datos_comments after insert on datos_comments
  for each row execute function fn_act_dato_comment();
create trigger trg_act_votes          after insert or delete on votes
  for each row execute function fn_act_vote();
create trigger trg_act_datos_likes    after insert or delete on datos_likes
  for each row execute function fn_act_dato_like();
create trigger trg_act_insignia       after insert on user_badges
  for each row execute function fn_act_insignia();
create trigger trg_act_rango          after update of puntos on profiles
  for each row execute function fn_act_rango();

revoke all on function log_activity(uuid, text, uuid, uuid, jsonb) from public;
revoke all on function fn_act_post()         from public;
revoke all on function fn_act_dato()         from public;
revoke all on function fn_act_comment()      from public;
revoke all on function fn_act_dato_comment() from public;
revoke all on function fn_act_vote()         from public;
revoke all on function fn_act_dato_like()    from public;
revoke all on function fn_act_insignia()     from public;
revoke all on function fn_act_rango()        from public;

-- =========================================================================
-- RLS — the feed is global: any authenticated user can read. No write
-- policies on purpose: only the SECURITY DEFINER triggers insert/delete.
-- =========================================================================
alter table activity_events enable row level security;

drop policy if exists activity_select on activity_events;
create policy activity_select on activity_events for select to authenticated using (true);

grant select on activity_events to authenticated;

-- =========================================================================
-- VIEW — events + actor (nombre/avatar), newest first, 30-day window as a
-- second belt on top of the opportunistic purge. security_invoker = on ->
-- RLS of activity_events/profiles applies to the caller.
-- =========================================================================
create or replace view v_actividad_reciente with (security_invoker = on) as
select
  a.id, a.actor_id, a.tipo, a.post_id, a.dato_id, a.payload, a.created_at,
  pr.nombre     as actor_nombre,
  pr.avatar_url as actor_avatar
from activity_events a
left join profiles pr on pr.id = a.actor_id
where a.created_at >= now() - interval '30 days'
order by a.created_at desc;

grant select on v_actividad_reciente to authenticated;
