-- =========================================================================
-- Radar I+D / I+D Hub — Puntos: anti self-comment + penalización inactividad
-- 1) Self-comments no longer earn points: fn_comment_points /
--    fn_dato_comment_points now skip award_points when the commenter is the
--    author of the post/dato, mirroring the anti-self checks that
--    fn_vote_points and fn_dato_like_points already had.
-- 2) Inactivity penalty: profiles.last_activity_at is bumped by touch
--    triggers on every ACTOR action (publish, comment, vote, like — points
--    or not); apply_inactivity_penalty() subtracts the configurable
--    'penalizacion_inactividad' amount (−100) after 15 idle days, repeats
--    every further 15 days via last_penalty_at, and floors at 0. Invoked by
--    a daily Vercel cron (/api/cron/inactivity-penalty) — no pg_cron here.
-- Subtracting points fires no rank notifications/events: fn_notif_rango and
-- fn_act_rango only trigger when new.puntos > old.puntos.
-- =========================================================================

-- ---- 1) no points for self-comments ---------------------------------------
-- create or replace keeps trg_comments_points / trg_datos_comments_points
-- attached; no trigger recreation needed.
create or replace function fn_comment_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select user_id into v_author from posts where id = new.post_id;
  if v_author is null or v_author <> new.user_id then          -- no self-comment farming
    perform award_points(new.user_id, 'comentar');             -- +5
  end if;
  return new;
end $$;

create or replace function fn_dato_comment_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select user_id into v_author from datos where id = new.dato_id;
  if v_author is null or v_author <> new.user_id then          -- no self-comment farming
    perform award_points(new.user_id, 'comentar_dato');        -- +3
  end if;
  return new;
end $$;

-- ---- 2) activity tracking columns ------------------------------------------
-- Backfill with now(): activity_events only keeps 30 days and misses users
-- without events, so nobody is penalized right after this deploy — the first
-- penalties can land 15 days later at the earliest.
alter table profiles
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists last_penalty_at  timestamptz;
create index if not exists idx_profiles_last_activity on profiles(last_activity_at);

-- Configurable amount, adjustable without a migration (negative = subtract).
insert into puntos_config (accion, puntos) values ('penalizacion_inactividad', -100)
on conflict (accion) do update set puntos = excluded.puntos;

-- ---- touch triggers ---------------------------------------------------------
-- One generic function on the 6 action tables (all expose user_id = actor).
-- NOT wired through award_points on purpose: award_points also runs for the
-- author RECEIVING a vote/like (not an interaction), while self-comments and
-- negative votes ARE interactions but earn no points.
create or replace function fn_touch_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set last_activity_at = now() where id = new.user_id;
  return new;
end $$;

drop trigger if exists trg_touch_posts          on posts;
drop trigger if exists trg_touch_datos          on datos;
drop trigger if exists trg_touch_comments       on comments;
drop trigger if exists trg_touch_datos_comments on datos_comments;
drop trigger if exists trg_touch_votes          on votes;
drop trigger if exists trg_touch_datos_likes    on datos_likes;

create trigger trg_touch_posts          after insert on posts          for each row execute function fn_touch_activity();
create trigger trg_touch_datos          after insert on datos          for each row execute function fn_touch_activity();
create trigger trg_touch_comments       after insert on comments       for each row execute function fn_touch_activity();
create trigger trg_touch_datos_comments after insert on datos_comments for each row execute function fn_touch_activity();
create trigger trg_touch_votes          after insert on votes          for each row execute function fn_touch_activity();
create trigger trg_touch_datos_likes    after insert on datos_likes    for each row execute function fn_touch_activity();

-- ---- penalty function --------------------------------------------------------
-- Idempotent: penalizing sets last_penalty_at = now(), which blocks another
-- 15 days; any user action makes last_activity_at take over. Running it twice
-- in a row (or daily via cron) never double-penalizes. Floors at 0 and skips
-- users already at 0.
create or replace function apply_inactivity_penalty()
returns table(usuario uuid, puntos_despues int)
language plpgsql security definer set search_path = public as $$
declare v_pen int;
begin
  select puntos into v_pen from puntos_config where accion = 'penalizacion_inactividad';
  if v_pen is null or v_pen >= 0 then return; end if;
  return query
  update profiles p
     set puntos = greatest(0, p.puntos + v_pen),               -- v_pen = -100
         last_penalty_at = now(),
         fecha_actualizacion = now()
   where p.puntos > 0
     and greatest(p.last_activity_at, coalesce(p.last_penalty_at, p.last_activity_at))
         <= now() - interval '15 days'
  returning p.id, p.puntos;
end $$;

-- ---- grants -------------------------------------------------------------------
revoke all on function fn_touch_activity()        from public;
revoke all on function apply_inactivity_penalty() from public;
grant execute on function apply_inactivity_penalty() to service_role;
