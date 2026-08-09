-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 53 : LES PHOTOS ENREGISTRÉES (LE CŒUR)
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 52.
--  Se relance sans risque (tout est « if not exists »).
--
--  CE QUE ÇA OUVRE
--  ---------------
--  Jusqu'ici, seuls les tatoueurs avaient une raison de créer un
--  compte. Cette table ouvre le site aux VISITEURS : un cœur sur une
--  photo, et elle se retrouve dans « Mes favoris ».
--
--  ⚠️ IL N'Y A QU'UN SEUL TYPE DE COMPTE, et c'est le point de départ
--  de toute la passe. Rien ici ne distingue un « particulier » d'un
--  « tatoueur » : la table ne connaît que des comptes. Quelqu'un qui
--  enregistre des photos aujourd'hui et crée son portfolio demain
--  GARDE ses favoris — ils n'ont jamais appartenu à un type de compte,
--  mais à une personne.
--
--  CE QU'ON ENREGISTRE : UNE PHOTO, PAS UNE ADRESSE D'IMAGE.
--  La ligne pointe `photos_tatoueur(id)` — la photo telle qu'elle vit
--  dans le portfolio, avec son style, son rendu et sa nature. Deux
--  conséquences voulues :
--   · le style de la photo est LU au moment de l'affichage : le menu
--     déroulant de la page Favoris ne montre que les styles vraiment
--     enregistrés, sans qu'on ait rien à recopier ici ;
--   · le tatoueur retagge une photo → le favori suit, tout seul.
--
--  ET QUAND LA PHOTO DISPARAÎT ? `on delete cascade`. Un tatoueur qui
--  retire une photo de son portfolio la retire de partout — garder
--  dans des favoris une image que son auteur a effacée serait au mieux
--  un lien mort, au pire une publication contre son gré.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LA TABLE
-- ---------------------------------------------------------------------
create table if not exists public.favoris_photos (
  --  QUI ENREGISTRE. Le compte s'en va, ses favoris avec lui.
  utilisateur_id uuid not null
    references auth.users(id) on delete cascade,

  --  QUELLE PHOTO. Elle disparaît du portfolio, elle disparaît d'ici.
  photo_id uuid not null
    references public.photos_tatoueur(id) on delete cascade,

  --  QUAND — c'est l'ordre d'affichage de la page : le dernier
  --  enregistré arrive en tête, comme partout ailleurs.
  cree_le timestamptz not null default now(),

  --  UNE SEULE LIGNE PAR PHOTO ET PAR PERSONNE. La clé composite dit
  --  exactement cela, et rend le geste IDEMPOTENT : réenregistrer une
  --  photo déjà enregistrée ne crée pas de doublon (le code écrit en
  --  `upsert`, voir /api/yokofolio/favoris/photo).
  primary key (utilisateur_id, photo_id)
);

-- ---------------------------------------------------------------------
-- 2) LES INDEX
-- ---------------------------------------------------------------------
--  LA PAGE « MES FAVORIS » : toutes les photos d'un compte, la plus
--  récente d'abord. C'est LA lecture du produit, elle a son index.
create index if not exists idx_favoris_photos_par_compte
  on public.favoris_photos (utilisateur_id, cree_le desc);

--  LE SENS INVERSE — toutes les personnes qui ont enregistré UNE
--  photo. Personne ne l'affiche aujourd'hui ; la cascade de
--  suppression, elle, l'emprunte à chaque photo retirée.
create index if not exists idx_favoris_photos_par_photo
  on public.favoris_photos (photo_id);

-- ---------------------------------------------------------------------
-- 3) LA SÉCURITÉ — CHACUN SES FAVORIS, ET RIEN QUE LES SIENS
-- ---------------------------------------------------------------------
--  ⚠️ CE QU'UNE PERSONNE ENREGISTRE NE REGARDE QU'ELLE. Ce n'est pas
--  une liste publique, ce n'est pas un compteur de popularité : quatre
--  politiques, toutes les quatre sur `auth.uid()`, et aucune lecture
--  possible d'un compte par un autre.
alter table public.favoris_photos enable row level security;

drop policy if exists "lire ses photos enregistrees" on public.favoris_photos;
create policy "lire ses photos enregistrees"
  on public.favoris_photos for select
  using (auth.uid() = utilisateur_id);

drop policy if exists "enregistrer une photo" on public.favoris_photos;
create policy "enregistrer une photo"
  on public.favoris_photos for insert
  with check (auth.uid() = utilisateur_id);

drop policy if exists "retirer une photo enregistree" on public.favoris_photos;
create policy "retirer une photo enregistree"
  on public.favoris_photos for delete
  using (auth.uid() = utilisateur_id);

-- ---------------------------------------------------------------------
-- 4) VÉRIFICATION
-- ---------------------------------------------------------------------
--  À lancer après coup : la table doit exister, avec ses trois
--  politiques et ses deux index.
--
--    select count(*) as politiques
--      from pg_policies
--     where schemaname = 'public' and tablename = 'favoris_photos';
--    -- attendu : 3
