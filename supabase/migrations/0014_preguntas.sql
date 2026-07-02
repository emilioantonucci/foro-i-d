-- =========================================================================
-- Radar I+D / I+D Hub — Preguntas disparadoras
-- Hasta 2 preguntas abiertas por publicación (post o dato), visibles
-- destacadas en el detalle para fomentar el debate; se responden por los
-- comentarios normales (sin hilos propios), por eso alcanza con text[].
-- Por defecto ninguna: es una elección del autor. Idempotente.
-- =========================================================================

alter table posts add column if not exists preguntas text[] not null default '{}';
alter table datos add column if not exists preguntas text[] not null default '{}';

alter table posts drop constraint if exists posts_preguntas_max2;
alter table posts add constraint posts_preguntas_max2
  check (cardinality(preguntas) <= 2);

alter table datos drop constraint if exists datos_preguntas_max2;
alter table datos add constraint datos_preguntas_max2
  check (cardinality(preguntas) <= 2);
