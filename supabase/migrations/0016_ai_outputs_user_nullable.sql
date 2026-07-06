-- =========================================================================
-- 0016 — ai_outputs.user_id nullable
--   0001 definió `user_id not null ... on delete set null`: al borrar un
--   usuario de Auth, el cascade a profiles dispara el SET NULL y revienta
--   con 23502 (not-null violation) → HTTP 500 en la Admin API.
--   Se quita el NOT NULL y se conserva el SET NULL: las filas quedan como
--   anónimas en vez de borrarse, porque la caché del digest semanal
--   (app/api/ai/digest) y los conteos globales del dashboard consultan
--   ai_outputs sin filtrar por usuario. RLS ya tolera huérfanas: ai_select
--   es using(true) y update/delete quedan solo para admin/mod.
-- Idempotente: se puede re-ejecutar sin efectos secundarios.
-- =========================================================================

alter table ai_outputs alter column user_id drop not null;
