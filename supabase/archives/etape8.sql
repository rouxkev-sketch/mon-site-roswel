-- ============================================================
--  ROSWEL — COMPLÉMENT ÉTAPE 8 : INSCRIPTION DES ARTISANS
-- ============================================================
--  À exécuter comme les précédents :
--  Supabase → SQL Editor → New query → tout coller → Run
--  (réexécutable sans danger)
-- ============================================================

-- Les demandes de modification envoyées par l'admin (messages types,
-- affichés dans l'espace de l'artisan tant qu'il n'a pas corrigé)
alter table public.artisans
  add column if not exists motifs_modifications text[] not null default '{}';

-- ============================================================
-- STOCKAGE DES PHOTOS DES ARTISANS
-- ------------------------------------------------------------
-- Un « bucket » est un dossier de fichiers hébergé par Supabase.
-- Règles : tout le monde peut VOIR les photos (fiches publiques),
-- mais chaque artisan ne peut déposer/remplacer QUE dans son
-- propre dossier (nommé d'après son identifiant de compte).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos-artisans', 'photos-artisans', true)
on conflict (id) do nothing;

drop policy if exists "photos_lecture_publique" on storage.objects;
create policy "photos_lecture_publique" on storage.objects
  for select
  using (bucket_id = 'photos-artisans');

drop policy if exists "photos_depot_dans_son_dossier" on storage.objects;
create policy "photos_depot_dans_son_dossier" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos-artisans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_remplacement_dans_son_dossier" on storage.objects;
create policy "photos_remplacement_dans_son_dossier" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos-artisans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- FIN
-- ============================================================
