-- ============================================================
--  YOKOFOLIO — LES FICHES DES VRAIS TATOUEURS (comptes, statut,
--  photos)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  ⚠️ ORDRE DES MIGRATIONS : tatoueurs.sql d'abord, puis
--  yokofolio-photos-par-style.sql, puis yokofolio-styles-adresse.sql,
--  puis yokofolio-bio.sql, puis CE FICHIER, en dernier.
--  Réexécutable sans danger : chaque étape vérifie l'existant.
--
--  CE QUE ÇA CRÉE
--  --------------
--   1. LE LIEN COMPTE ↔ FICHE : la colonne `user_id`. Un compte n'a
--      qu'UNE fiche ; supprimer le compte supprime la fiche (cascade).
--
--   2. LE STATUT DE VÉRIFICATION : `en_attente` (fiche envoyée, pas
--      encore relue), `validee`, `refusee`. Les fiches envoyées par le
--      formulaire arrivent NON PUBLIÉES et en attente : RIEN n'est en
--      ligne avant validation. Les treize démos passent « validee ».
--
--   3. LES RÈGLES D'ÉCRITURE : un compte connecté peut CRÉER sa
--      propre fiche (jamais publiée par lui-même) et LIRE sa propre
--      fiche même non publiée. La publication, elle, reste un geste
--      d'administration (clé secrète du serveur).
--
--   4. LE STOCKAGE DES PHOTOS : le bucket `photos-tatoueurs`, lisible
--      par tous (les fiches affichent ces images), où chaque compte ne
--      peut écrire QUE dans son propre dossier (photos-tatoueurs/<id
--      du compte>/…).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien du produit artisans, et aucune fiche existante n'est modifiée
--  (à part le statut « validee » posé sur les démos).
-- ============================================================

-- 1) LE LIEN COMPTE ↔ FICHE ----------------------------------
alter table tatoueurs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

comment on column tatoueurs.user_id is
  'Le compte propriétaire de la fiche (null pour les fiches de démonstration). Supprimer le compte supprime la fiche.';

-- Un compte, une seule fiche.
create unique index if not exists idx_tatoueurs_un_compte_une_fiche
  on tatoueurs (user_id)
  where user_id is not null;

-- 2) LE STATUT DE VÉRIFICATION --------------------------------
alter table tatoueurs
  add column if not exists statut text not null default 'en_attente';

comment on column tatoueurs.statut is
  'en_attente (fiche envoyée, à relire), validee (relue et approuvée), refusee. La visibilité publique reste portée par `publie`.';

alter table tatoueurs drop constraint if exists tatoueurs_statut_valide;
alter table tatoueurs add constraint tatoueurs_statut_valide
  check (statut in ('en_attente', 'validee', 'refusee'));

-- Les fiches déjà en place (les démos, sans compte) sont validées.
update tatoueurs set statut = 'validee' where user_id is null;

-- 3) LES RÈGLES D'ACCÈS DE LA TABLE ---------------------------
--  (la lecture publique des fiches publiées existe déjà, inchangée)

-- Créer SA fiche : connecté, à son nom, et JAMAIS publiée d'office.
drop policy if exists "creation de sa propre fiche" on tatoueurs;
create policy "creation de sa propre fiche"
  on tatoueurs for insert
  to authenticated
  with check (auth.uid() = user_id and publie = false);

-- Lire SA fiche, même non publiée (écran « fiche en attente »).
drop policy if exists "lecture de sa propre fiche" on tatoueurs;
create policy "lecture de sa propre fiche"
  on tatoueurs for select
  to authenticated
  using (auth.uid() = user_id);

-- 4) LE STOCKAGE DES PHOTOS -----------------------------------
insert into storage.buckets (id, name, public)
  values ('photos-tatoueurs', 'photos-tatoueurs', true)
  on conflict (id) do nothing;

-- Tout le monde VOIT les photos (les fiches les affichent)…
drop policy if exists "photos tatoueurs visibles par tous" on storage.objects;
create policy "photos tatoueurs visibles par tous"
  on storage.objects for select
  using (bucket_id = 'photos-tatoueurs');

-- …mais chacun n'écrit QUE dans son propre dossier.
drop policy if exists "depot dans son propre dossier" on storage.objects;
create policy "depot dans son propre dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos-tatoueurs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "remplacement dans son propre dossier" on storage.objects;
create policy "remplacement dans son propre dossier"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos-tatoueurs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'photos-tatoueurs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "menage dans son propre dossier" on storage.objects;
create policy "menage dans son propre dossier"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos-tatoueurs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select nom, publie, statut, user_id is not null as a_un_compte
--    from tatoueurs order by cree_le desc limit 20;
--  select id, public from storage.buckets where id = 'photos-tatoueurs';
--
--  POUR VALIDER UNE FICHE (en attendant la page d'administration) :
--  update tatoueurs set statut = 'validee', publie = true
--    where slug = 'le-slug-de-la-fiche';
