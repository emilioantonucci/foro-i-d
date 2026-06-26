-- =========================================================================
-- Radar I+D / I+D Hub — Outbox atomic claim
-- Adds a transient 'sending' state to the notifications outbox. It lets
-- concurrent flushes claim pending rows atomically (UPDATE ... WHERE
-- email_status = 'pending' RETURNING ...): a row that one flush already moved
-- to 'sending' is invisible to the other, so a rank-up / new-badge email is
-- never sent twice. Idempotent; no data is dropped.
-- =========================================================================

alter table notifications drop constraint if exists notifications_email_status_check;
alter table notifications add constraint notifications_email_status_check
  check (email_status in ('pending', 'sending', 'sent', 'skipped', 'failed'));
