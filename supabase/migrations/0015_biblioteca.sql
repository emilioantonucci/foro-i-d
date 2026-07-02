-- =========================================================================
-- 0015 — Biblioteca de links
--   * posts.fecha_original: fecha de publicación del recurso original
--     (la extrae la IA al publicar; null en posts anteriores).
--   * posts.tipo_material: clasificación del material (paper, informe, …);
--     null hasta que la IA lo clasifique (publicación nueva o backfill).
--   * v_feed: se recrea agregando ambas columnas AL FINAL (create or
--     replace view no permite reordenar).
--   * v_biblioteca: vista liviana para la página /biblioteca, con la
--     interacción (votos + comentarios) como columna ordenable.
--   * ai_outputs.tipo: se agrega 'digest' (resumen semanal IA).
-- Idempotente: se puede re-ejecutar sin efectos secundarios.
-- =========================================================================

-- 1) Columnas nuevas en posts -------------------------------------------------
alter table posts add column if not exists fecha_original date;
alter table posts add column if not exists tipo_material  text;

-- Keep in sync con TIPOS_MATERIAL en lib/constants.ts.
alter table posts drop constraint if exists chk_posts_tipo_material;
alter table posts add constraint chk_posts_tipo_material check (
  tipo_material is null or tipo_material in
  ('paper','informe','estadistica','noticia','articulo','video',
   'podcast','herramienta','curso','libro','otro')
);

create index if not exists idx_posts_fecha_original on posts(fecha_original desc nulls last);
create index if not exists idx_posts_tipo_material  on posts(tipo_material);

-- 2) v_feed — mismo cuerpo que 0013 + columnas nuevas al final ---------------
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
  exists (select 1 from polls pl where pl.post_id = p.id) as has_poll,
  p.fecha_original,
  p.tipo_material
from posts p
left join profiles pr on pr.id = p.user_id;

grant select on v_feed to authenticated;

-- 3) v_biblioteca — lista compacta y filtrable de todas las publicaciones ----
create or replace view v_biblioteca with (security_invoker = on) as
select
  p.id, p.user_id, p.titulo, p.url, p.resumen, p.categoria,
  p.tipo_material, p.fecha_original, p.created_at,
  pr.nombre as autor_nombre,
  (select count(*) from votes    v where v.post_id = p.id)::int as votos_count,
  (select count(*) from comments c where c.post_id = p.id)::int as comentarios_count,
  ((select count(*) from votes    v where v.post_id = p.id)
 + (select count(*) from comments c where c.post_id = p.id))::int as interaccion
from posts p
left join profiles pr on pr.id = p.user_id;

grant select on v_biblioteca to authenticated;

-- 4) ai_outputs — nuevo tipo 'digest' (resumen semanal IA) --------------------
-- El check inline de 0001 recibe el nombre autogenerado ai_outputs_tipo_check.
alter table ai_outputs drop constraint if exists ai_outputs_tipo_check;
alter table ai_outputs add constraint ai_outputs_tipo_check
  check (tipo in ('resumen','sintesis','oportunidad','brief','digest'));
