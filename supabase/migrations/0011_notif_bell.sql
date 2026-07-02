-- =========================================================================
-- 0011 — Campanita de notificaciones in-app.
--
-- Fuente: activity_events (0009), que ya registra vía triggers toda la
-- actividad (enlaces, datos random, comentarios, votos, likes, insignias,
-- rangos). Sin fan-out por usuario: el estado "visto" es un cursor por
-- perfil (notif_seen_at) y abrir la campanita marca todo como visto.
-- La tabla notifications (0005) queda solo como outbox de emails.
-- =========================================================================

alter table profiles
  add column if not exists notif_seen_at timestamptz not null default now();

-- =========================================================================
-- VIEW — notificaciones del caller: actividad ajena de los últimos 15 días
-- (la purga física a 30 días de 0009 no se toca: el rail la necesita).
-- security_invoker = on -> aplican las RLS de activity_events/profiles/
-- posts/datos del caller. es_para_mi marca eventos sobre contenido propio
-- ("X le dio me gusta a TU dato") para destacarlos en la UI.
-- =========================================================================
create or replace view v_notificaciones with (security_invoker = on) as
select
  a.id, a.actor_id, a.tipo, a.post_id, a.dato_id, a.payload, a.created_at,
  pr.nombre     as actor_nombre,
  pr.avatar_url as actor_avatar,
  (coalesce(p.user_id, d.user_id) = auth.uid()) is true as es_para_mi
from activity_events a
left join profiles pr on pr.id = a.actor_id
left join posts    p  on p.id  = a.post_id
left join datos    d  on d.id  = a.dato_id
where a.created_at >= now() - interval '15 days'
  and a.actor_id <> auth.uid()
order by a.created_at desc;

grant select on v_notificaciones to authenticated;
