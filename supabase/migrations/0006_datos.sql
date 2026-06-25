-- =========================================================================
-- Radar I+D / I+D Hub — "Datos random" (subforo distendido)
-- A lightweight, NON-actionable knowledge feed (libros, artículos, datos
-- curiosos…). Kept in its OWN tables, ISOLATED from `posts`, so it never
-- contaminates the I+D analytics (Panel / Tendencias / IA de oportunidades),
-- which all aggregate over `posts`.
--
-- Reuses the engine from 0001_init.sql: award_points(), set_updated_at(),
-- is_admin_or_mod(). Idempotent (if not exists / on conflict / drop+create).
-- Awards points to profiles.puntos (moves the ranking) but adds NO rows to
-- any posts-based view, so the I+D metrics stay clean.
-- =========================================================================

-- ---- points config (lighter than the radar's actions) -------------------
insert into puntos_config (accion, puntos) values
  ('publicar_dato', 5),
  ('comentar_dato', 3),
  ('like_dato',     2)
on conflict (accion) do nothing;

-- ---- tables --------------------------------------------------------------
create table if not exists datos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  titulo      text not null,
  tipo        text not null default 'otro'
                check (tipo in ('libro','articulo','video','podcast','dato_curioso','recomendacion','otro')),
  url         text,
  descripcion text,
  etiquetas   text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_datos_user    on datos(user_id);
create index if not exists idx_datos_created  on datos(created_at desc);
create index if not exists idx_datos_tipo     on datos(tipo);

create table if not exists datos_comments (
  id         uuid primary key default gen_random_uuid(),
  dato_id    uuid not null references datos(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  comentario text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_datos_comments_dato on datos_comments(dato_id);

create table if not exists datos_likes (
  dato_id    uuid not null references datos(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dato_id, user_id)   -- one "me gusta" per user per dato
);
create index if not exists idx_datos_likes_dato on datos_likes(dato_id);

-- =========================================================================
-- FUNCTIONS — point triggers (SECURITY DEFINER so award_points + the
-- cross-user profile update run with owner privileges, mirroring 0001).
-- =========================================================================
create or replace function fn_dato_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 'publicar_dato');            -- +5
  return new;
end $$;

create or replace function fn_dato_comment_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 'comentar_dato');            -- +3
  return new;
end $$;

-- Mirrors fn_vote_points: a "me gusta" rewards the DATO's author (+2),
-- never the liker, and is reverted on un-like. No self-like farming.
create or replace function fn_dato_like_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select user_id into v_author from datos where id = coalesce(new.dato_id, old.dato_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then
      perform award_points(v_author, 'like_dato');                -- +2 to the author
    end if;
  elsif tg_op = 'DELETE' then
    if v_author <> old.user_id then
      update profiles
         set puntos = greatest(0, puntos - (select puntos from puntos_config where accion = 'like_dato')),
             fecha_actualizacion = now()
       where id = v_author;
    end if;
  end if;
  return coalesce(new, old);
end $$;

-- =========================================================================
-- TRIGGERS
-- =========================================================================
drop trigger if exists trg_datos_updated          on datos;
drop trigger if exists trg_datos_points           on datos;
drop trigger if exists trg_datos_comments_updated on datos_comments;
drop trigger if exists trg_datos_comments_points  on datos_comments;
drop trigger if exists trg_datos_likes_points     on datos_likes;

create trigger trg_datos_updated          before update on datos
  for each row execute function set_updated_at();
create trigger trg_datos_points           after insert on datos
  for each row execute function fn_dato_points();

create trigger trg_datos_comments_updated before update on datos_comments
  for each row execute function set_updated_at();
create trigger trg_datos_comments_points  after insert on datos_comments
  for each row execute function fn_dato_comment_points();

create trigger trg_datos_likes_points     after insert or delete on datos_likes
  for each row execute function fn_dato_like_points();

-- =========================================================================
-- RLS — same pattern as posts/comments/votes: read all (authenticated),
-- write own rows; owner or admin/mod can edit/delete. NO governance lock.
-- =========================================================================
alter table datos          enable row level security;
alter table datos_comments enable row level security;
alter table datos_likes    enable row level security;

-- datos
drop policy if exists datos_select on datos;
drop policy if exists datos_insert on datos;
drop policy if exists datos_update on datos;
drop policy if exists datos_delete on datos;
create policy datos_select on datos for select to authenticated using (true);
create policy datos_insert on datos for insert to authenticated with check (user_id = auth.uid());
create policy datos_update on datos for update to authenticated
  using (user_id = auth.uid() or is_admin_or_mod())
  with check (user_id = auth.uid() or is_admin_or_mod());
create policy datos_delete on datos for delete to authenticated
  using (user_id = auth.uid() or is_admin_or_mod());

-- datos_comments
drop policy if exists datos_comments_select on datos_comments;
drop policy if exists datos_comments_insert on datos_comments;
drop policy if exists datos_comments_update on datos_comments;
drop policy if exists datos_comments_delete on datos_comments;
create policy datos_comments_select on datos_comments for select to authenticated using (true);
create policy datos_comments_insert on datos_comments for insert to authenticated with check (user_id = auth.uid());
create policy datos_comments_update on datos_comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy datos_comments_delete on datos_comments for delete to authenticated
  using (user_id = auth.uid() or is_admin_or_mod());

-- datos_likes (no UPDATE: remove + re-add)
drop policy if exists datos_likes_select on datos_likes;
drop policy if exists datos_likes_insert on datos_likes;
drop policy if exists datos_likes_delete on datos_likes;
create policy datos_likes_select on datos_likes for select to authenticated using (true);
create policy datos_likes_insert on datos_likes for insert to authenticated with check (user_id = auth.uid());
create policy datos_likes_delete on datos_likes for delete to authenticated using (user_id = auth.uid());

-- =========================================================================
-- GRANTS — table privileges for the authenticated role (RLS still gates rows).
-- =========================================================================
grant select, insert, update, delete on datos, datos_comments, datos_likes to authenticated;

revoke all on function fn_dato_points()         from public;
revoke all on function fn_dato_comment_points() from public;
revoke all on function fn_dato_like_points()    from public;

-- =========================================================================
-- VIEW — v_datos exposes each dato with its author + like/comment counts as
-- columns, so the feed can sort by those counts and paginate at the DB level
-- (range + exact count). security_invoker = on -> RLS of base tables applies.
-- =========================================================================
create or replace view v_datos with (security_invoker = on) as
select
  d.id, d.user_id, d.titulo, d.tipo, d.url, d.descripcion, d.etiquetas,
  d.created_at, d.updated_at,
  pr.nombre     as autor_nombre,
  pr.avatar_url as autor_avatar,
  pr.puntos     as autor_puntos,
  (select count(*) from datos_likes    l where l.dato_id = d.id)::int as likes_count,
  (select count(*) from datos_comments c where c.dato_id = d.id)::int as comentarios_count
from datos d
left join profiles pr on pr.id = d.user_id;

grant select on v_datos to authenticated;
