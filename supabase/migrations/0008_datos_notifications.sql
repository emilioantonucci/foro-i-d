-- =========================================================================
-- Radar I+D / I+D Hub — notificaciones por email para "Datos random"
-- Publicar un dato ahora avisa al equipo (igual que el Radar). La tabla
-- `notifications` referenciaba solo `posts`, así que sumamos `dato_id`, un
-- nuevo `tipo` y una preferencia propia (separada de la del Radar: Datos
-- random es distendido y el usuario debe poder silenciarlo aparte).
-- Idempotente (if not exists / drop ... if exists), como el resto.
-- =========================================================================

-- Referencia al dato. En estas filas `post_id` queda NULL.
alter table notifications add column if not exists dato_id uuid references datos(id) on delete cascade;

-- Ampliar el CHECK de tipo para aceptar 'nuevo_dato'.
alter table notifications drop constraint if exists notifications_tipo_check;
alter table notifications add constraint notifications_tipo_check
  check (tipo in ('nueva_publicacion','comentario','resumen_semanal','rango','insignia','nuevo_dato'));

-- Preferencia propia (default ON, como las demás).
alter table profiles add column if not exists notif_nuevo_dato boolean not null default true;
