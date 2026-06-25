-- =========================================================================
-- Radar I+D / I+D Hub — Email notifications
-- Adds per-user email preferences + a one-click unsubscribe token to profiles,
-- a `notifications` outbox/log table, and triggers that enqueue rank-up and
-- new-badge notifications (the only events the app can't observe in code).
-- Instant events (nueva_publicacion, comentario) and the weekly digest are
-- written by the server via the service role. No existing data is dropped.
-- =========================================================================

-- =========================================================================
-- PROFILES — notification preferences (default ON) + unsubscribe token
-- =========================================================================
alter table profiles add column if not exists notif_email_enabled    boolean not null default true;
alter table profiles add column if not exists notif_nueva_publicacion boolean not null default true;
alter table profiles add column if not exists notif_comentario        boolean not null default true;
alter table profiles add column if not exists notif_resumen_semanal   boolean not null default true;
alter table profiles add column if not exists notif_rango             boolean not null default true;
alter table profiles add column if not exists unsubscribe_token       uuid not null default gen_random_uuid();

-- Token is the credential for the no-login unsubscribe endpoint: must be unique.
create unique index if not exists uq_profiles_unsub_token on profiles(unsubscribe_token);

-- =========================================================================
-- NOTIFICATIONS — outbox (email reliability/idempotency) + future in-app log
-- =========================================================================
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  tipo         text not null check (tipo in
                 ('nueva_publicacion','comentario','resumen_semanal','rango','insignia')),
  post_id      uuid references posts(id) on delete cascade,
  payload      jsonb not null default '{}',
  email_status text not null default 'pending'
                 check (email_status in ('pending','sent','skipped','failed')),
  leido        boolean not null default false,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);
create index if not exists idx_notif_recipient on notifications(recipient_id, created_at desc);
create index if not exists idx_notif_pending   on notifications(email_status) where email_status = 'pending';

-- =========================================================================
-- TRIGGERS — enqueue rank-up + new-badge notifications (pending)
-- SECURITY DEFINER: bypasses RLS so the row can be written for any recipient.
-- =========================================================================

-- Rank-up: points only ever cross a rank boundary upward here (votes can lower
-- points but we don't notify on rank-down). Mirrors rango_for_puntos().
create or replace function fn_notif_rango()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old text; v_new text;
begin
  v_old := rango_for_puntos(old.puntos);
  v_new := rango_for_puntos(new.puntos);
  if v_new is distinct from v_old and new.puntos > old.puntos then
    insert into notifications (recipient_id, tipo, payload)
    values (new.id, 'rango',
            jsonb_build_object('rango_anterior', v_old, 'rango_nuevo', v_new, 'puntos', new.puntos));
  end if;
  return new;
end $$;

-- New badge: user_badges insert is idempotent (on conflict do nothing), so this
-- fires exactly once per badge earned.
create or replace function fn_notif_insignia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nombre text; v_desc text;
begin
  select nombre, descripcion into v_nombre, v_desc from badges where id = new.badge_id;
  insert into notifications (recipient_id, tipo, payload)
  values (new.user_id, 'insignia',
          jsonb_build_object('badge_nombre', v_nombre, 'badge_descripcion', v_desc));
  return new;
end $$;

drop trigger if exists trg_notif_rango     on profiles;
drop trigger if exists trg_notif_insignia  on user_badges;

create trigger trg_notif_rango    after update of puntos on profiles
  for each row execute function fn_notif_rango();
create trigger trg_notif_insignia after insert on user_badges
  for each row execute function fn_notif_insignia();

revoke all on function fn_notif_rango()    from public;
revoke all on function fn_notif_insignia() from public;

-- =========================================================================
-- RLS — recipients may read their own notifications (for a future in-app inbox).
-- All writes happen via the service role, which bypasses RLS; no write policy
-- is granted to the `authenticated` role on purpose.
-- =========================================================================
alter table notifications enable row level security;

create policy notif_select_own on notifications
  for select to authenticated using (recipient_id = auth.uid());

grant select on notifications to authenticated;
