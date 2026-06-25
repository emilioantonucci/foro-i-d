-- =========================================================================
-- Radar I+D — 3 publicaciones de ejemplo para poblar el feed (demo/lanzamiento)
-- =========================================================================
-- Pegá este bloque en el SQL editor de Supabase (Dashboard → SQL Editor) y
-- ejecutalo. NO es una migración: vive acá para quedar versionado y reutilizable.
--
-- Qué hace:
--   1) Resuelve tu user_id buscando tu perfil por email. Si todavía no existe
--      (no te registraste en la app), aborta con un mensaje claro.
--   2) Inserta 3 posts realistas en categorías distintas, con created_at
--      escalonado para que el feed se ordene de forma natural.
--   3) Es idempotente: cada post solo se inserta si no existe ya uno tuyo con
--      ese mismo título, así que podés correrlo más de una vez sin duplicar.
--
-- NOTA (puntos): el trigger fn_post_points otorga +10 por publicar y +15 por
-- resumen propio en cada insert. Estos 3 posts con resumen suman +75 puntos a
-- tu perfil. Es esperado al usar tu propia cuenta como autora.
--
-- Si querés cambiar el autor, editá el email de abajo por el del perfil deseado.
-- =========================================================================

do $$
declare
  v_uid uuid;
  v_email text := 'investigacion.desarrollo@doinglobal.com';
begin
  select id into v_uid
    from public.profiles
   where email = v_email
   limit 1;

  if v_uid is null then
    raise exception
      'No existe un perfil con el email %. Registrate primero en la app y volvé a correr este script.',
      v_email;
  end if;

  -- 1) Inteligencia artificial
  insert into public.posts
    (user_id, titulo, url, resumen, relevancia, categoria, etiquetas, prioridad, aplicacion_interna, created_at, updated_at)
  select
    v_uid,
    'UNESCO publica la primera guía global para IA generativa en educación e investigación',
    'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research',
    'La UNESCO presenta su primer marco internacional para regular y aprovechar la IA generativa en instituciones educativas. Propone ocho medidas de política pública —proteger la agencia humana, validar los sistemas y desarrollar competencias de IA en docentes y estudiantes— y fija un límite de edad de 13 años para su uso. Es un documento de referencia para diseñar lineamientos institucionales sobre IA.',
    'Marca el estándar que adoptarán universidades y organismos al definir sus políticas de IA. Nos sirve de base para construir nuestros propios lineamientos de uso de IA generativa en los programas y en la producción de material académico.',
    'inteligencia_artificial',
    array['IA generativa','política educativa','UNESCO','ética'],
    'alta',
    array['Lineamientos de uso de IA para docentes','Diseño curricular'],
    now() - interval '3 days',
    now() - interval '3 days'
  where not exists (
    select 1 from public.posts
     where user_id = v_uid
       and titulo = 'UNESCO publica la primera guía global para IA generativa en educación e investigación'
  );

  -- 2) Educación superior
  insert into public.posts
    (user_id, titulo, url, resumen, relevancia, categoria, etiquetas, prioridad, aplicacion_interna, created_at, updated_at)
  select
    v_uid,
    'EDUCAUSE Horizon 2025: las tendencias que están redefiniendo la enseñanza y el aprendizaje',
    'https://library.educause.edu/resources/2025/5/2025-educause-horizon-report-teaching-and-learning-edition',
    'El informe anual de EDUCAUSE, elaborado con metodología Delphi sobre un panel de líderes globales, identifica las tendencias y tecnologías clave que transforman la educación superior. La IA y la realidad virtual reconfiguran cómo los estudiantes interactúan con el contenido y cómo se documenta y valora el aprendizaje. Incluye escenarios de futuro para orientar decisiones institucionales.',
    'Es el termómetro más citado del sector para anticipar hacia dónde va la enseñanza superior. Útil para fundamentar decisiones de roadmap académico y detectar tecnologías a incorporar antes que la competencia.',
    'educacion_superior',
    array['tendencias','educación superior','EdTech','prospectiva'],
    'media',
    array['Roadmap académico','Benchmarking de mercado'],
    now() - interval '1 day',
    now() - interval '1 day'
  where not exists (
    select 1 from public.posts
     where user_id = v_uid
       and titulo = 'EDUCAUSE Horizon 2025: las tendencias que están redefiniendo la enseñanza y el aprendizaje'
  );

  -- 3) Oportunidades de nuevos programas
  insert into public.posts
    (user_id, titulo, url, resumen, relevancia, categoria, etiquetas, prioridad, aplicacion_interna, created_at, updated_at)
  select
    v_uid,
    'Las microcredenciales siguen creciendo: el 68% de las universidades planea adoptarlas en 5 años',
    'https://www.coursera.org/enterprise/resources/ebooks/micro-credentials-report-2025',
    'El Micro-Credentials Impact Report 2025 de Coursera muestra que el 51% de los líderes de educación superior ya integra microcredenciales en su oferta y que el 68% de quienes aún no lo hacen planea sumarlas en los próximos cinco años. La demanda de certificaciones cortas, modulares y verificables por empleadores sigue en alza.',
    'Señala una oportunidad concreta: empaquetar parte de nuestra oferta de posgrado en microcredenciales apilables podría captar demanda de formación corta y funcionar como embudo hacia los programas largos.',
    'oportunidades_programas',
    array['microcredenciales','nuevos programas','Coursera','mercado laboral'],
    'alta',
    array['Diseño de nueva oferta','Estrategia comercial'],
    now() - interval '4 hours',
    now() - interval '4 hours'
  where not exists (
    select 1 from public.posts
     where user_id = v_uid
       and titulo = 'Las microcredenciales siguen creciendo: el 68% de las universidades planea adoptarlas en 5 años'
  );

  raise notice 'Listo: publicaciones de ejemplo cargadas (las que ya existían se omitieron).';
end $$;
