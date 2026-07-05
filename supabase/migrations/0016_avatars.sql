-- =========================================================================
-- Radar I+D / I+D Hub — Foto de perfil (avatar) subida por el usuario
-- La imagen ya recortada (cuadrado 512×512 WebP) sube DIRECTO del navegador
-- al bucket PÚBLICO `avatars` (carpeta raíz = auth.uid()); `profiles.avatar_url`
-- guarda la URL pública que sirve el CDN de Supabase. Público porque el avatar
-- aparece en feed, ranking, comentarios y perfiles ajenos (firmar signed URLs
-- por cada avatar en cada vista sería costoso). Idempotente.
-- =========================================================================

-- ---- bucket público (5MB máx; solo imágenes) ------------------------------
-- Recortamos client-side y subimos solo el resultado (~30-60KB), pero el tope
-- de 5MB es la guarda de servidor pedida por el requerimiento.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---- RLS de storage.objects ------------------------------------------------
-- Lectura: pública (el bucket es público; el CDN sirve la foto sin login).
-- Escritura/actualización/borrado: solo dentro de la carpeta propia
-- ({auth.uid()}/...). Se incluye UPDATE por si alguna subida usa upsert.
drop policy if exists avatars_select on storage.objects;
drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

create policy avatars_select on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy avatars_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
