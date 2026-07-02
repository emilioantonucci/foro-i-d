-- =========================================================================
-- Radar I+D / I+D Hub — Recursos adjuntos (PDF / Word)
-- Los archivos suben DIRECTO del navegador a Supabase Storage (bucket
-- privado `recursos`, carpeta raíz = auth.uid()); posts/datos guardan solo
-- la referencia (path + metadata). La descarga usa signed URLs generadas
-- server-side. Idempotente (if not exists / on conflict / drop+create).
-- =========================================================================

-- ---- columnas de adjunto (aditivas, nullable -> retrocompatibles) --------
alter table posts
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_mime text,
  add column if not exists file_size int;

alter table datos
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_mime text,
  add column if not exists file_size int;

-- ---- bucket privado (12MB máx; solo PDF y Word) ---------------------------
-- 12MB: un PDF a base64 infla ~x1.33 (~16MB) y queda bajo el tope de 20MB
-- por request de la API de Gemini.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recursos', 'recursos', false, 12582912,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---- RLS de storage.objects ------------------------------------------------
-- Lectura: cualquier autenticado (los recursos son internos del equipo).
-- Escritura/borrado: solo dentro de la carpeta propia ({auth.uid()}/...).
-- Sin UPDATE: los archivos son inmutables (se reemplaza subiendo otro).
drop policy if exists recursos_select on storage.objects;
drop policy if exists recursos_insert on storage.objects;
drop policy if exists recursos_delete on storage.objects;

create policy recursos_select on storage.objects for select to authenticated
  using (bucket_id = 'recursos');

create policy recursos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy recursos_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- vistas: columnas nuevas AL FINAL (create or replace no reordena) -----
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
  p.file_name
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
  d.file_name
from datos d
left join profiles pr on pr.id = d.user_id;

grant select on v_datos to authenticated;
