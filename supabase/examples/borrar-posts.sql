-- =========================================================================
-- Radar I+D — Borrar TODAS las publicaciones (dejar el feed en limpio)
-- =========================================================================
-- Pegá este bloque en el SQL editor de Supabase (Dashboard → SQL Editor) y
-- ejecutalo. NO es una migración: vive acá para quedar versionado y reutilizable.
--
-- ⚠️ DESTRUCTIVO E IRREVERSIBLE. Borra TODOS los posts de TODOS los autores.
--    Por el `on delete cascade` del esquema, también se borran en cascada:
--      · comments            (comentarios de esos posts)
--      · votes               (votos de esos posts)
--      · ai_outputs          (resúmenes / síntesis IA de esos posts)
--      · notifications.post_id (las de "nueva publicación" / "comentario";
--                               las de rango/insignia, sin post_id, se conservan)
--    Las cuentas (auth.users / profiles) y los catálogos NO se tocan.
--
-- NOTA (puntos): al borrar los votos, el trigger fn_vote_points le resta a cada
-- autor los +3 por voto positivo, pero NO revierte los +10 por publicar, +15 por
-- resumen, +5 por comentar, etc. Para dejar los puntos realmente en cero, corré
-- además el BLOQUE OPCIONAL del final.
-- =========================================================================

-- ----- PASO 1: borrar todos los posts (cascada incluida) -----------------
do $$
declare
  n_posts int;
  n_com   int;
  n_votos int;
  n_ai    int;
begin
  select count(*) into n_posts from public.posts;
  select count(*) into n_com   from public.comments;
  select count(*) into n_votos from public.votes;
  select count(*) into n_ai    from public.ai_outputs;

  delete from public.posts;

  raise notice 'Listo. Borrados % posts y, en cascada, % comentarios, % votos y % salidas IA.',
    n_posts, n_com, n_votos, n_ai;
end $$;

-- =========================================================================
-- BLOQUE OPCIONAL — dejar también los PUNTOS en cero (clean slate total).
-- Descomentá las 2 líneas de abajo SOLO si querés resetear la puntuación.
-- (Si lo dejás comentado, los puntos quedan como están, salvo el ajuste
--  automático de los votos borrados que describe la NOTA de arriba.)
-- =========================================================================
-- update public.profiles
--    set puntos = 0, fecha_actualizacion = now();
