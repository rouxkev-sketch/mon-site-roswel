-- ============================================================
--  ROSWEL — COMPLÉMENT ÉTAPE 9 : MESSAGERIE INTERNE
-- ============================================================
--  À exécuter comme les précédents :
--  Supabase → SQL Editor → New query → tout coller → Run
--  (réexécutable sans danger)
-- ============================================================

-- Nombre de réponses déjà comptées pour la moyenne de rapidité.
-- (La rapidité affichée = delai_reponse_minutes, moyenne mise à jour
--  automatiquement à chaque réponse d'artisan — jamais saisie.)
alter table public.artisans
  add column if not exists nombre_reponses integer not null default 0;

-- ============================================================
-- PHOTOS JOINTES AUX MESSAGES — bucket PRIVÉ
-- ------------------------------------------------------------
-- Contrairement aux photos de profil (publiques), les photos de
-- messages sont privées : seul l'expéditeur peut déposer dans son
-- dossier, et le site génère des liens temporaires sécurisés pour
-- que l'autre participant de la conversation puisse les voir.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos-messages', 'photos-messages', false)
on conflict (id) do nothing;

drop policy if exists "messages_photos_depot" on storage.objects;
create policy "messages_photos_depot" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "messages_photos_lecture_expediteur" on storage.objects;
create policy "messages_photos_lecture_expediteur" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- FIN
-- ============================================================
