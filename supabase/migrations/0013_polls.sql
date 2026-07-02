-- =========================================================================
-- Radar I+D / I+D Hub — Encuestas (polls estilo Instagram)
-- Una encuesta opcional por publicación (post del Radar O dato de Datos
-- Random), de 2 a 4 opciones. Un voto por usuario (puede cambiarlo: upsert),
-- resultados visibles recién después de votar (lo decide la UI), sin cierre.
-- Reusa el engine de 0001 (award_points, is_admin_or_mod) y el log de
-- actividad de 0009 (log_activity). Idempotente.
-- =========================================================================

-- ---- puntos ----------------------------------------------------------------
insert into puntos_config (accion, puntos) values ('voto_encuesta', 2)
on conflict (accion) do nothing;

-- ---- tablas ----------------------------------------------------------------
create table if not exists polls (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  dato_id    uuid references datos(id) on delete cascade,
  pregunta   text not null,
  created_at timestamptz not null default now(),
  -- exactamente un padre (post o dato) y una encuesta por publicación
  check ((post_id is null) <> (dato_id is null)),
  unique (post_id),
  unique (dato_id)
);

create table if not exists poll_options (
  id      uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  texto   text not null,
  orden   int  not null default 0
);
create index if not exists idx_poll_options_poll on poll_options(poll_id);

create table if not exists poll_votes (
  poll_id    uuid not null references polls(id) on delete cascade,
  option_id  uuid not null references poll_options(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)   -- un voto por usuario; cambiar = upsert
);
create index if not exists idx_poll_votes_option on poll_votes(option_id);

-- =========================================================================
-- RPC — creación atómica encuesta + opciones. SECURITY INVOKER: la RLS del
-- caller aplica (solo el dueño del post/dato padre puede crearla).
-- =========================================================================
create or replace function create_poll_with_options(
  p_post uuid, p_dato uuid, p_pregunta text, p_opciones text[]
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_poll uuid;
  v_opciones text[];
begin
  select array_agg(btrim(o)) into v_opciones
    from unnest(coalesce(p_opciones, '{}')) as o
   where btrim(o) <> '';
  if p_pregunta is null or length(btrim(p_pregunta)) < 3 then
    raise exception 'La pregunta de la encuesta es muy corta.';
  end if;
  if coalesce(array_length(v_opciones, 1), 0) not between 2 and 4 then
    raise exception 'La encuesta necesita entre 2 y 4 opciones.';
  end if;

  insert into polls (post_id, dato_id, pregunta)
  values (p_post, p_dato, btrim(p_pregunta))
  returning id into v_poll;

  insert into poll_options (poll_id, texto, orden)
  select v_poll, t.opt, t.ord
    from unnest(v_opciones) with ordinality as t(opt, ord);

  return v_poll;
end $$;

revoke all on function create_poll_with_options(uuid, uuid, text, text[]) from public;
grant execute on function create_poll_with_options(uuid, uuid, text, text[]) to authenticated;

-- =========================================================================
-- PUNTOS — calcado de fn_dato_like_points (0006): el voto premia al AUTOR
-- de la publicación (+2), nunca al votante; sin self-farming. El UPDATE
-- (cambio de voto) no toca puntos (mismo autor, neto cero).
-- =========================================================================
create or replace function fn_poll_vote_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select coalesce(p.user_id, d.user_id) into v_author
    from polls pl
    left join posts p on p.id = pl.post_id
    left join datos d on d.id = pl.dato_id
   where pl.id = coalesce(new.poll_id, old.poll_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then
      perform award_points(v_author, 'voto_encuesta');             -- +2 al autor
    end if;
  elsif tg_op = 'DELETE' then
    if v_author <> old.user_id then
      update profiles
         set puntos = greatest(0, puntos - (select puntos from puntos_config where accion = 'voto_encuesta')),
             fecha_actualizacion = now()
       where id = v_author;
    end if;
  end if;
  return coalesce(new, old);
end $$;

-- =========================================================================
-- ACTIVIDAD — evento `voto_encuesta` para la campanita/actividad reciente.
-- Lleva el post_id/dato_id del PADRE, así v_notificaciones (0011) resuelve
-- es_para_mi sin cambios. Primero se amplía el CHECK de tipos (nombre
-- autogenerado: se resuelve dinámicamente por robustez).
-- =========================================================================
do $$
declare v_name text;
begin
  select conname into v_name
    from pg_constraint
   where conrelid = 'activity_events'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%tipo%';
  if v_name is not null then
    execute format('alter table activity_events drop constraint %I', v_name);
  end if;
end $$;

alter table activity_events add constraint activity_events_tipo_check check (tipo in
  ('publico_enlace','publico_dato','comento_enlace','comento_dato',
   'voto_enlace','like_dato','insignia','rango','voto_encuesta'));

create or replace function fn_act_poll_vote()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_titulo text; v_pregunta text; v_post uuid; v_dato uuid;
begin
  select coalesce(p.user_id, d.user_id), coalesce(p.titulo, d.titulo),
         pl.pregunta, pl.post_id, pl.dato_id
    into v_author, v_titulo, v_pregunta, v_post, v_dato
    from polls pl
    left join posts p on p.id = pl.post_id
    left join datos d on d.id = pl.dato_id
   where pl.id = coalesce(new.poll_id, old.poll_id);
  if v_author is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    if v_author <> new.user_id then                               -- no self-vote
      perform log_activity(new.user_id, 'voto_encuesta', v_post, v_dato,
                           jsonb_build_object('titulo', v_titulo, 'pregunta', v_pregunta));
    end if;
  elsif tg_op = 'DELETE' then
    delete from activity_events
     where tipo = 'voto_encuesta' and actor_id = old.user_id
       and ((v_post is not null and post_id = v_post)
         or (v_dato is not null and dato_id = v_dato));
  end if;
  return coalesce(new, old);
end $$;

-- =========================================================================
-- TRIGGERS
-- =========================================================================
drop trigger if exists trg_poll_votes_points on poll_votes;
drop trigger if exists trg_act_poll_votes    on poll_votes;
drop trigger if exists trg_touch_poll_votes  on poll_votes;

create trigger trg_poll_votes_points after insert or delete on poll_votes
  for each row execute function fn_poll_vote_points();
create trigger trg_act_poll_votes    after insert or delete on poll_votes
  for each row execute function fn_act_poll_vote();
-- votar una encuesta cuenta como actividad (evita la penalización de 0010)
create trigger trg_touch_poll_votes  after insert on poll_votes
  for each row execute function fn_touch_activity();

revoke all on function fn_poll_vote_points() from public;
revoke all on function fn_act_poll_vote()    from public;

-- =========================================================================
-- RLS — leer: cualquier autenticado. Crear encuesta/opciones: solo el dueño
-- de la publicación padre. Votar: fila propia (insert/update/delete).
-- =========================================================================
alter table polls        enable row level security;
alter table poll_options enable row level security;
alter table poll_votes   enable row level security;

drop policy if exists polls_select on polls;
drop policy if exists polls_insert on polls;
drop policy if exists polls_delete on polls;
create policy polls_select on polls for select to authenticated using (true);
create policy polls_insert on polls for insert to authenticated with check (
  (post_id is not null and exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()))
  or
  (dato_id is not null and exists (select 1 from datos d where d.id = dato_id and d.user_id = auth.uid()))
);
create policy polls_delete on polls for delete to authenticated using (
  exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid())
  or exists (select 1 from datos d where d.id = dato_id and d.user_id = auth.uid())
  or is_admin_or_mod()
);

drop policy if exists poll_options_select on poll_options;
drop policy if exists poll_options_insert on poll_options;
drop policy if exists poll_options_delete on poll_options;
create policy poll_options_select on poll_options for select to authenticated using (true);
create policy poll_options_insert on poll_options for insert to authenticated with check (
  exists (
    select 1 from polls pl
    left join posts p on p.id = pl.post_id
    left join datos d on d.id = pl.dato_id
    where pl.id = poll_id and coalesce(p.user_id, d.user_id) = auth.uid()
  )
);
create policy poll_options_delete on poll_options for delete to authenticated using (
  exists (
    select 1 from polls pl
    left join posts p on p.id = pl.post_id
    left join datos d on d.id = pl.dato_id
    where pl.id = poll_id and (coalesce(p.user_id, d.user_id) = auth.uid() or is_admin_or_mod())
  )
);

drop policy if exists poll_votes_select on poll_votes;
drop policy if exists poll_votes_insert on poll_votes;
drop policy if exists poll_votes_update on poll_votes;
drop policy if exists poll_votes_delete on poll_votes;
create policy poll_votes_select on poll_votes for select to authenticated using (true);
create policy poll_votes_insert on poll_votes for insert to authenticated
  with check (user_id = auth.uid());
create policy poll_votes_update on poll_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy poll_votes_delete on poll_votes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on polls, poll_options to authenticated;
grant select, insert, update, delete on poll_votes to authenticated;

-- =========================================================================
-- VISTAS — has_poll AL FINAL (create or replace view no reordena columnas),
-- para el pill "Encuesta" en las cards sin queries extra.
-- =========================================================================
create or replace view v_feed with (security_invoker = on) as
select
  p.id, p.user_id, p.titulo, p.url, p.resumen, p.relevancia, p.categoria,
  p.etiquetas, p.estado, p.prioridad, p.aplicacion_interna, p.marcado_relevante,
  p.created_at, p.updated_at,
  pr.nombre     as autor_nombre,
  pr.avatar_url as autor_avatar,
  pr.puntos     as autor_puntos,
  coalesce((select pri.orden from prioridades pri where pri.slug = p.prioridad), 0) as prioridad_orden,
  (select count(*) from votes    v where v.post_id = p.id)::int as votos_count,
  (select count(*) from comments c where c.post_id = p.id)::int as comentarios_count,
  (select count(*) from votes    v where v.post_id = p.id and v.tipo_voto = 'util')::int        as util_count,
  (select count(*) from votes    v where v.post_id = p.id and v.tipo_voto = 'prioritario')::int as prioritario_count,
  p.file_path,
  p.file_name,
  exists (select 1 from polls pl where pl.post_id = p.id) as has_poll
from posts p
left join profiles pr on pr.id = p.user_id;

grant select on v_feed to authenticated;

create or replace view v_datos with (security_invoker = on) as
select
  d.id, d.user_id, d.titulo, d.tipo, d.url, d.descripcion, d.etiquetas,
  d.created_at, d.updated_at,
  pr.nombre     as autor_nombre,
  pr.avatar_url as autor_avatar,
  pr.puntos     as autor_puntos,
  (select count(*) from datos_likes    l where l.dato_id = d.id)::int as likes_count,
  (select count(*) from datos_comments c where c.dato_id = d.id)::int as comentarios_count,
  d.file_path,
  d.file_name,
  exists (select 1 from polls pl where pl.dato_id = d.id) as has_poll
from datos d
left join profiles pr on pr.id = d.user_id;

grant select on v_datos to authenticated;
