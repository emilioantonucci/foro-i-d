-- =========================================================================
-- Radar I+D / I+D Hub — Automatic badge awarding
-- Adds award_badge() + check_badges() and triggers that evaluate each badge's
-- criteria after relevant actions and grant missing badges (idempotent).
-- No tables are dropped; only functions + triggers are added.
-- =========================================================================

create or replace function award_badge(p_user uuid, p_slug text)
returns void language plpgsql security definer set search_path = public as $$
declare v_badge uuid;
begin
  if p_user is null then return; end if;
  select id into v_badge from badges where slug = p_slug;
  if v_badge is null then return; end if;
  insert into user_badges(user_id, badge_id)
  values (p_user, v_badge)
  on conflict (user_id, badge_id) do nothing;
end $$;

-- Evaluates all badge criteria for a user and awards the ones earned.
create or replace function check_badges(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_tend int; v_resumen int; v_comp int; v_ia int; v_sintesis int;
  v_brief int; v_comments int; v_derivado int; v_edu int; v_puntos int;
begin
  if p_user is null then return; end if;

  select count(*) into v_tend     from posts where user_id = p_user and categoria = 'tendencias_mercado';
  select count(*) into v_resumen  from posts where user_id = p_user and resumen is not null and length(btrim(resumen)) > 0;
  select count(*) into v_comp     from posts where user_id = p_user and categoria = 'competencia';
  select count(*) into v_ia       from posts where user_id = p_user and categoria = 'inteligencia_artificial';
  select count(*) into v_edu      from posts where user_id = p_user and categoria = 'educacion_superior';
  select count(*) into v_derivado from posts where user_id = p_user and estado = 'derivado_proyecto';
  select count(*) into v_sintesis from ai_outputs where user_id = p_user and tipo = 'sintesis';
  select count(*) into v_brief    from ai_outputs where user_id = p_user and tipo = 'brief';
  select count(*) into v_comments from comments where user_id = p_user;
  select puntos   into v_puntos   from profiles where id = p_user;

  if v_tend     >= 5  then perform award_badge(p_user, 'radar_tendencias');     end if;
  if v_resumen  >= 10 then perform award_badge(p_user, 'curador_estrategico');  end if;
  if v_comp     >= 5  then perform award_badge(p_user, 'cazador_competencia');  end if;
  if v_ia       >= 10 then perform award_badge(p_user, 'especialista_ia');      end if;
  if v_sintesis >= 3  then perform award_badge(p_user, 'sintesis_ejecutiva');   end if;
  if v_brief    >= 3  then perform award_badge(p_user, 'puente_id_comercial');  end if;
  if v_comments >= 20 then perform award_badge(p_user, 'constructor_debate');   end if;
  if v_derivado >= 1  then perform award_badge(p_user, 'innovacion_aplicada');  end if;
  if v_edu      >= 5  then perform award_badge(p_user, 'vision_academica');     end if;
  if coalesce(v_puntos, 0) >= 7000 then perform award_badge(p_user, 'mentor_innovacion'); end if;
end $$;

-- trigger wrappers
create or replace function fn_check_badges_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform check_badges(new.user_id); return new; end $$;

create or replace function fn_check_badges_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform check_badges(new.id); return new; end $$;

drop trigger if exists trg_badges_posts_ins  on posts;
drop trigger if exists trg_badges_posts_upd  on posts;
drop trigger if exists trg_badges_comments   on comments;
drop trigger if exists trg_badges_ai         on ai_outputs;
drop trigger if exists trg_badges_profile    on profiles;

create trigger trg_badges_posts_ins after insert on posts
  for each row execute function fn_check_badges_user();
create trigger trg_badges_posts_upd after update of estado on posts
  for each row execute function fn_check_badges_user();
create trigger trg_badges_comments  after insert on comments
  for each row execute function fn_check_badges_user();
create trigger trg_badges_ai        after insert on ai_outputs
  for each row execute function fn_check_badges_user();
create trigger trg_badges_profile   after update of puntos on profiles
  for each row execute function fn_check_badges_profile();

revoke all on function award_badge(uuid, text)     from public;
revoke all on function check_badges(uuid)           from public;
revoke all on function fn_check_badges_user()       from public;
revoke all on function fn_check_badges_profile()    from public;
