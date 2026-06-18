-- =========================================================================
-- Radar I+D / I+D Hub — Initial schema
-- Greenfield migration: types, lookup tables, core tables, points engine
-- (triggers), governance guards, RLS policies, dashboard views, reference seed.
-- NOTHING here drops or alters existing data (the database is empty).
-- The auth.users -> profiles trigger lives in 0002_auth_hook.sql (touches auth).
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------- enum ----------
do $$ begin
  create type user_rol as enum ('usuario', 'moderador', 'admin');
exception when duplicate_object then null; end $$;

-- =========================================================================
-- LOOKUP TABLES (controlled vocabularies)
-- =========================================================================
create table if not exists categorias (
  slug   text primary key,
  nombre text not null,
  orden  int  not null default 0,
  activo boolean not null default true
);

create table if not exists estados (
  slug   text primary key,
  nombre text not null,
  orden  int  not null default 0,   -- content lifecycle order
  color  text
);

create table if not exists prioridades (
  slug   text primary key,
  nombre text not null,
  orden  int  not null default 0,
  color  text
);

create table if not exists tipos_voto (
  slug        text primary key,
  nombre      text not null,
  es_positivo boolean not null default true,  -- 'descartar' = false
  orden       int  not null default 0
);

create table if not exists puntos_config (
  accion text primary key,
  puntos int  not null
);

-- =========================================================================
-- CORE TABLES
-- =========================================================================
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nombre              text,
  email               text,
  rol                 user_rol not null default 'usuario',
  avatar_url          text,
  bio                 text,
  area                text,
  puntos              int  not null default 0,
  perfil_completo     boolean not null default false,  -- gates the one-time +20
  fecha_registro      timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);
-- NOTE: `rango` is NOT stored. It is derived from `puntos` via rango_for_puntos().

create table if not exists posts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  titulo             text not null,
  url                text,
  resumen            text,
  relevancia         text,
  categoria          text references categorias(slug),
  etiquetas          text[] not null default '{}',
  estado             text not null default 'nuevo'  references estados(slug),
  prioridad          text not null default 'media'  references prioridades(slug),
  aplicacion_interna text[] not null default '{}',
  marcado_relevante  boolean not null default false, -- gates the one-time +25
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_posts_user     on posts(user_id);
create index if not exists idx_posts_categoria on posts(categoria);
create index if not exists idx_posts_estado    on posts(estado);
create index if not exists idx_posts_created   on posts(created_at desc);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  comentario text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_comments_post on comments(post_id);

create table if not exists votes (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references posts(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  tipo_voto text not null references tipos_voto(slug),
  created_at timestamptz not null default now(),
  constraint uq_vote_once unique (post_id, user_id, tipo_voto)
);
create index if not exists idx_votes_post on votes(post_id);

create table if not exists badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nombre      text not null,
  descripcion text,
  criterio    text
);

create table if not exists user_badges (
  user_id         uuid not null references profiles(id) on delete cascade,
  badge_id        uuid not null references badges(id)    on delete cascade,
  fecha_obtencion timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists ai_outputs (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete set null,
  tipo       text not null check (tipo in ('resumen','sintesis','oportunidad','brief')),
  contenido  jsonb not null,
  modelo     text,            -- Gemini model name used
  validado   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_outputs_post on ai_outputs(post_id);

-- =========================================================================
-- FUNCTIONS — points engine + helpers
-- =========================================================================

-- Central, idempotent-friendly point mutator (SECURITY DEFINER: bypasses RLS).
create or replace function award_points(p_user uuid, p_accion text)
returns void language plpgsql security definer set search_path = public as $$
declare v_pts int;
begin
  if p_user is null then return; end if;
  select puntos into v_pts from puntos_config where accion = p_accion;
  if v_pts is null then return; end if;
  update profiles
     set puntos = greatest(0, puntos + v_pts),
         fecha_actualizacion = now()
   where id = p_user;
end $$;

-- Derive rank from points (must mirror lib/points.ts).
create or replace function rango_for_puntos(p int)
returns text language sql immutable as $$
  select case
    when p >= 7000 then 'Mentor de Innovación'
    when p >= 4500 then 'Estratega I+D'
    when p >= 2500 then 'Referente'
    when p >= 1000 then 'Analista'
    when p >=  400 then 'Curador'
    when p >=  100 then 'Explorador'
    else                'Observador'
  end
$$;

-- Role check used by RLS. SECURITY DEFINER avoids recursion on profiles.
create or replace function is_admin_or_mod()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and rol in ('admin','moderador')
  );
$$;

-- generic updated_at / fecha_actualizacion stampers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function set_fecha_actualizacion()
returns trigger language plpgsql as $$
begin new.fecha_actualizacion = now(); return new; end $$;

-- ----- point triggers (SECURITY DEFINER so the internal award_points call,
-- ----- and the cross-user profile update, run with owner privileges) -----

create or replace function fn_post_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 'publicar_enlace');           -- +10
  if new.resumen is not null and length(btrim(new.resumen)) > 0 then
    perform award_points(new.user_id, 'resumen_propio');          -- +15
  end if;
  return new;
end $$;

create or replace function fn_post_relevante()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.marcado_relevante and not old.marcado_relevante then
    perform award_points(new.user_id, 'marcado_relevante');       -- +25 to author
  end if;
  return new;
end $$;

create or replace function fn_comment_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 'comentar');                  -- +5
  return new;
end $$;

create or replace function fn_vote_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_pos boolean;
begin
  select es_positivo into v_pos
    from tipos_voto where slug = coalesce(new.tipo_voto, old.tipo_voto);
  if v_pos is distinct from true then return coalesce(new, old); end if;

  select user_id into v_author from posts where id = coalesce(new.post_id, old.post_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then                               -- no self-vote farming
      perform award_points(v_author, 'voto_positivo');            -- +3
    end if;
  elsif tg_op = 'DELETE' then
    if v_author <> old.user_id then
      update profiles
         set puntos = greatest(0, puntos - (select puntos from puntos_config where accion = 'voto_positivo')),
             fecha_actualizacion = now()
       where id = v_author;
    end if;
  end if;
  return coalesce(new, old);
end $$;

create or replace function fn_profile_complete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.perfil_completo and not old.perfil_completo then
    perform award_points(new.id, 'perfil_completo');              -- +20 once
  end if;
  return new;
end $$;

create or replace function fn_ai_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'sintesis' then
    perform award_points(new.user_id, 'sintesis');                -- +30
  elsif new.tipo = 'oportunidad' then
    perform award_points(new.user_id, 'oportunidad');             -- +40
  end if;
  return new;
end $$;

-- ----- governance guards (RLS can't restrict per-column on UPDATE) -----

create or replace function fn_lock_rol()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rol is distinct from old.rol and not is_admin_or_mod() then
    new.rol := old.rol;  -- standard users cannot escalate their own role
  end if;
  return new;
end $$;

create or replace function fn_lock_post_governance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin_or_mod() then
    -- only admins/mods may change governance fields
    new.estado            := old.estado;
    new.prioridad         := old.prioridad;
    new.marcado_relevante := old.marcado_relevante;
  end if;
  return new;
end $$;

-- =========================================================================
-- TRIGGERS
-- =========================================================================
drop trigger if exists trg_posts_updated      on posts;
drop trigger if exists trg_posts_points        on posts;
drop trigger if exists trg_posts_relevante      on posts;
drop trigger if exists trg_posts_lock_gov       on posts;
drop trigger if exists trg_comments_updated     on comments;
drop trigger if exists trg_comments_points      on comments;
drop trigger if exists trg_votes_points         on votes;
drop trigger if exists trg_profiles_updated     on profiles;
drop trigger if exists trg_profiles_lock_rol    on profiles;
drop trigger if exists trg_profiles_complete    on profiles;
drop trigger if exists trg_ai_points            on ai_outputs;

create trigger trg_posts_lock_gov   before update on posts
  for each row execute function fn_lock_post_governance();
create trigger trg_posts_updated    before update on posts
  for each row execute function set_updated_at();
create trigger trg_posts_points     after insert on posts
  for each row execute function fn_post_points();
create trigger trg_posts_relevante  after update on posts
  for each row execute function fn_post_relevante();

create trigger trg_comments_updated before update on comments
  for each row execute function set_updated_at();
create trigger trg_comments_points  after insert on comments
  for each row execute function fn_comment_points();

create trigger trg_votes_points     after insert or delete on votes
  for each row execute function fn_vote_points();

create trigger trg_profiles_lock_rol before update on profiles
  for each row execute function fn_lock_rol();
create trigger trg_profiles_updated  before update on profiles
  for each row execute function set_fecha_actualizacion();
create trigger trg_profiles_complete after update on profiles
  for each row execute function fn_profile_complete();

create trigger trg_ai_points        after insert on ai_outputs
  for each row execute function fn_ai_points();

-- =========================================================================
-- RLS — enable on every table; authenticated-only, no anonymous access
-- =========================================================================
alter table profiles    enable row level security;
alter table posts       enable row level security;
alter table comments    enable row level security;
alter table votes       enable row level security;
alter table ai_outputs  enable row level security;
alter table badges      enable row level security;
alter table user_badges enable row level security;
alter table categorias  enable row level security;
alter table estados     enable row level security;
alter table prioridades enable row level security;
alter table tipos_voto  enable row level security;

-- profiles
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or is_admin_or_mod())
  with check (id = auth.uid() or is_admin_or_mod());

-- posts
create policy posts_select on posts for select to authenticated using (true);
create policy posts_insert on posts for insert to authenticated with check (user_id = auth.uid());
create policy posts_update on posts for update to authenticated
  using (user_id = auth.uid() or is_admin_or_mod())
  with check (user_id = auth.uid() or is_admin_or_mod());
create policy posts_delete on posts for delete to authenticated
  using (user_id = auth.uid() or is_admin_or_mod());

-- comments
create policy comments_select on comments for select to authenticated using (true);
create policy comments_insert on comments for insert to authenticated with check (user_id = auth.uid());
create policy comments_update on comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comments_delete on comments for delete to authenticated
  using (user_id = auth.uid() or is_admin_or_mod());

-- votes (no UPDATE: remove + re-add)
create policy votes_select on votes for select to authenticated using (true);
create policy votes_insert on votes for insert to authenticated with check (user_id = auth.uid());
create policy votes_delete on votes for delete to authenticated using (user_id = auth.uid());

-- ai_outputs
create policy ai_select on ai_outputs for select to authenticated using (true);
create policy ai_insert on ai_outputs for insert to authenticated with check (user_id = auth.uid());
create policy ai_update on ai_outputs for update to authenticated
  using (user_id = auth.uid() or is_admin_or_mod())
  with check (user_id = auth.uid() or is_admin_or_mod());
create policy ai_delete on ai_outputs for delete to authenticated
  using (user_id = auth.uid() or is_admin_or_mod());

-- badges / user_badges (read all; writes admin/mod only)
create policy badges_select on badges for select to authenticated using (true);
create policy badges_write  on badges for all to authenticated
  using (is_admin_or_mod()) with check (is_admin_or_mod());
create policy ubadges_select on user_badges for select to authenticated using (true);
create policy ubadges_write  on user_badges for all to authenticated
  using (is_admin_or_mod()) with check (is_admin_or_mod());

-- lookups (read all; writes admin/mod only)
create policy cat_select on categorias  for select to authenticated using (true);
create policy cat_write  on categorias  for all to authenticated using (is_admin_or_mod()) with check (is_admin_or_mod());
create policy est_select on estados     for select to authenticated using (true);
create policy est_write  on estados     for all to authenticated using (is_admin_or_mod()) with check (is_admin_or_mod());
create policy pri_select on prioridades for select to authenticated using (true);
create policy pri_write  on prioridades for all to authenticated using (is_admin_or_mod()) with check (is_admin_or_mod());
create policy tv_select  on tipos_voto  for select to authenticated using (true);
create policy tv_write   on tipos_voto  for all to authenticated using (is_admin_or_mod()) with check (is_admin_or_mod());
-- puntos_config: no policies => not readable by clients (server/triggers only)
alter table puntos_config enable row level security;

-- =========================================================================
-- GRANTS — table privileges for the authenticated role (RLS still gates rows).
-- Internal SECURITY DEFINER functions are NOT exposed as RPCs.
-- =========================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  profiles, posts, comments, votes, ai_outputs, badges, user_badges,
  categorias, estados, prioridades, tipos_voto
  to authenticated;

revoke all on function award_points(uuid, text)        from public;
revoke all on function fn_post_points()                 from public;
revoke all on function fn_post_relevante()              from public;
revoke all on function fn_comment_points()              from public;
revoke all on function fn_vote_points()                 from public;
revoke all on function fn_profile_complete()            from public;
revoke all on function fn_ai_points()                   from public;
revoke all on function fn_lock_rol()                    from public;
revoke all on function fn_lock_post_governance()        from public;
grant execute on function is_admin_or_mod()   to authenticated;
grant execute on function rango_for_puntos(int) to authenticated;

-- =========================================================================
-- DASHBOARD — views (security_invoker so RLS applies) + a pulse RPC
-- =========================================================================
create or replace view v_profiles with (security_invoker = on) as
  select p.*, rango_for_puntos(p.puntos) as rango from profiles p;

create or replace view v_posts_por_categoria with (security_invoker = on) as
  select c.slug, c.nombre, count(p.id)::int as total
  from categorias c left join posts p on p.categoria = c.slug
  group by c.slug, c.nombre order by total desc;

create or replace view v_posts_por_estado with (security_invoker = on) as
  select e.slug, e.nombre, e.orden, e.color, count(p.id)::int as total
  from estados e left join posts p on p.estado = e.slug
  group by e.slug, e.nombre, e.orden, e.color order by e.orden;

create or replace view v_posts_traccion with (security_invoker = on) as
  select p.id, p.titulo, p.categoria, p.estado, p.prioridad, p.created_at,
         (select count(*) from votes v where v.post_id = p.id)::int    as votos,
         (select count(*) from comments c where c.post_id = p.id)::int as comentarios,
         ((select count(*) from votes v where v.post_id = p.id)
        + (select count(*) from comments c where c.post_id = p.id))::int as traccion
  from posts p order by traccion desc;

create or replace view v_top_contribuyentes with (security_invoker = on) as
  select id, nombre, avatar_url, puntos, rango_for_puntos(puntos) as rango,
         (select count(*) from posts    p where p.user_id = profiles.id)::int as aportes,
         (select count(*) from comments c where c.user_id = profiles.id)::int as comentarios,
         (select count(*) from user_badges ub where ub.user_id = profiles.id)::int as insignias
  from profiles order by puntos desc;

create or replace function dashboard_pulso(p_desde timestamptz, p_hasta timestamptz)
returns table(publicaciones int, usuarios_activos int, votos int, comentarios int)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*)::int from posts    where created_at between p_desde and p_hasta),
    (select count(distinct user_id)::int from posts where created_at between p_desde and p_hasta),
    (select count(*)::int from votes    where created_at between p_desde and p_hasta),
    (select count(*)::int from comments where created_at between p_desde and p_hasta);
$$;

grant select on v_profiles, v_posts_por_categoria, v_posts_por_estado,
  v_posts_traccion, v_top_contribuyentes to authenticated;
grant execute on function dashboard_pulso(timestamptz, timestamptz) to authenticated;

-- =========================================================================
-- REFERENCE SEED (vocabularies, points config, badge catalog) — idempotent
-- =========================================================================
insert into categorias (slug, nombre, orden) values
  ('tendencias_mercado','Tendencias de mercado',1),
  ('inteligencia_artificial','Inteligencia artificial',2),
  ('educacion_superior','Educación superior',3),
  ('legaltech','Legaltech',4),
  ('ciberseguridad','Ciberseguridad',5),
  ('compliance','Compliance',6),
  ('finanzas_banca','Finanzas y banca',7),
  ('salud','Salud',8),
  ('innovacion_pedagogica','Innovación pedagógica',9),
  ('competencia','Competencia',10),
  ('oportunidades_programas','Oportunidades de nuevos programas',11),
  ('herramientas_digitales','Herramientas digitales',12),
  ('casos_exito','Casos de éxito',13),
  ('regulacion_normativa','Regulación y normativa',14),
  ('investigacion_academica','Investigación académica',15)
on conflict (slug) do nothing;

insert into estados (slug, nombre, orden, color) values
  ('nuevo','Nuevo',1,'#FFBA1A'),
  ('en_revision','En revisión',2,'#30587D'),
  ('validado','Validado',3,'#99CC06'),
  ('en_analisis','En análisis',4,'#30587D'),
  ('convertido_insumo','Convertido en insumo',5,'#6b9000'),
  ('derivado_proyecto','Derivado a proyecto',6,'#38761D'),
  ('archivado','Archivado',7,'#AAAAB4'),
  ('descartado','Descartado',8,'#C62A2F')
on conflict (slug) do nothing;

insert into prioridades (slug, nombre, orden, color) values
  ('baja','Baja',1,'#99CC06'),
  ('media','Media',2,'#FFBA1A'),
  ('alta','Alta',3,'#FF8A1A'),
  ('critica','Crítica',4,'#C62A2F')
on conflict (slug) do nothing;

insert into tipos_voto (slug, nombre, es_positivo, orden) values
  ('util','Útil',true,1),
  ('relevante','Relevante',true,2),
  ('prioritario','Prioritario',true,3),
  ('requiere_analisis','Requiere análisis',true,4),
  ('descartar','Descartar',false,5)
on conflict (slug) do nothing;

insert into puntos_config (accion, puntos) values
  ('perfil_completo',20),
  ('publicar_enlace',10),
  ('resumen_propio',15),
  ('comentar',5),
  ('voto_positivo',3),
  ('marcado_relevante',25),
  ('sintesis',30),
  ('oportunidad',40)
on conflict (accion) do update set puntos = excluded.puntos;

insert into badges (slug, nombre, descripcion, criterio) values
  ('radar_tendencias','Radar de Tendencias','Detecta señales de mercado temprano','Publica 5 enlaces de tendencias'),
  ('curador_estrategico','Curador Estratégico','Aporta resúmenes propios de calidad','Publica 10 resúmenes propios'),
  ('cazador_competencia','Cazador de Competencia','Sigue de cerca a la competencia','Publica 5 enlaces de competencia'),
  ('especialista_ia','Especialista en IA','Referente en inteligencia artificial','Publica 10 enlaces de IA'),
  ('sintesis_ejecutiva','Síntesis Ejecutiva','Genera síntesis de debates','Crea 3 síntesis ejecutivas'),
  ('puente_id_comercial','Puente I+D–Comercial','Convierte señales en insumos','Genera 3 briefs de oportunidad'),
  ('constructor_debate','Constructor de Debate','Dinamiza la conversación','Comenta en 20 publicaciones'),
  ('innovacion_aplicada','Innovación Aplicada','Su aporte llegó a proyecto','1 aporte derivado a proyecto'),
  ('vision_academica','Visión Académica','Foco en mejora académica','Publica 5 enlaces de educación superior'),
  ('mentor_innovacion','Mentor de Innovación','Máximo rango de participación','Alcanza 7000 puntos')
on conflict (slug) do nothing;
