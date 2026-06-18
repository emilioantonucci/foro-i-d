-- =========================================================================
-- Radar I+D / I+D Hub — Feed view
-- v_feed exposes each post with its author + vote/comment counts as columns,
-- so the feed can sort by those columns and paginate at the DB level
-- (range + exact count). security_invoker = on -> RLS of base tables applies.
-- Adds a view only; no data or table changes.
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
  (select count(*) from votes    v where v.post_id = p.id and v.tipo_voto = 'prioritario')::int as prioritario_count
from posts p
left join profiles pr on pr.id = p.user_id;

grant select on v_feed to authenticated;
