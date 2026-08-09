-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 54 : LES TATOUEURS SUIVIS
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 53.
--  Se relance sans risque (tout est « if not exists »).
--
--  CE QUE ÇA OUVRE
--  ---------------
--  Le bouton « Suivre » de la fiche. Une fois suivi, il dit « Suivi »,
--  et le tatoueur rejoint la fenêtre « Tatoueurs suivis · 12 » de la
--  page Favoris.
--
--  ⚠️ SUIVRE N'EST PAS S'ABONNER. Rien ici ne déclenche d'e-mail, de
--  notification ni de fil d'actualité : c'est une LISTE PERSONNELLE,
--  celle qu'on se fait pour retrouver un travail qu'on a aimé. Le jour
--  où le site enverra vraiment quelque chose, ce sera une décision à
--  prendre — et une colonne à ajouter ici, pas un comportement qu'on
--  aurait glissé sans le dire.
--
--  ⚠️ ET ÇA NE SE VOIT PAS DE L'AUTRE CÔTÉ. Le tatoueur ne sait pas
--  qui le suit, ni combien : aucune lecture n'est ouverte au-delà du
--  compte qui a suivi (voir les politiques). Le jour où l'on voudra
--  afficher un nombre d'abonnés, il faudra un compteur agrégé — pas
--  d'ouvrir cette table.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LA TABLE
-- ---------------------------------------------------------------------
create table if not exists public.tatoueurs_suivis (
  --  QUI SUIT. Le compte s'en va, ses suivis avec lui.
  utilisateur_id uuid not null
    references auth.users(id) on delete cascade,

  --  QUI EST SUIVI. Le portfolio est supprimé pour de bon (purge des
  --  30 jours), la ligne s'en va : une fiche qui n'existe plus n'a
  --  rien à faire dans une liste.
  --  ⚠️ UNE SUPPRESSION DIFFÉRÉE, ELLE, NE TOUCHE À RIEN : la ligne
  --  `tatoueurs` existe encore pendant les 30 jours (c'est ce qui
  --  permet la réactivation), donc le suivi survit exactement le temps
  --  que le portfolio peut revenir.
  tatoueur_id uuid not null
    references public.tatoueurs(id) on delete cascade,

  --  QUAND — l'ordre de la liste : le dernier suivi en tête.
  cree_le timestamptz not null default now(),

  --  UN SEUL SUIVI PAR TATOUEUR ET PAR PERSONNE : le geste est
  --  idempotent, cliquer deux fois « Suivre » ne crée pas deux lignes.
  primary key (utilisateur_id, tatoueur_id)
);

-- ---------------------------------------------------------------------
-- 2) LES INDEX
-- ---------------------------------------------------------------------
--  LA FENÊTRE « TATOUEURS SUIVIS » : tous les suivis d'un compte, le
--  dernier d'abord.
create index if not exists idx_tatoueurs_suivis_par_compte
  on public.tatoueurs_suivis (utilisateur_id, cree_le desc);

--  Le sens inverse — emprunté par la cascade quand un portfolio est
--  purgé.
create index if not exists idx_tatoueurs_suivis_par_tatoueur
  on public.tatoueurs_suivis (tatoueur_id);

-- ---------------------------------------------------------------------
-- 3) LA SÉCURITÉ — CHACUN SA LISTE
-- ---------------------------------------------------------------------
alter table public.tatoueurs_suivis enable row level security;

drop policy if exists "lire ses suivis" on public.tatoueurs_suivis;
create policy "lire ses suivis"
  on public.tatoueurs_suivis for select
  using (auth.uid() = utilisateur_id);

drop policy if exists "suivre un tatoueur" on public.tatoueurs_suivis;
create policy "suivre un tatoueur"
  on public.tatoueurs_suivis for insert
  with check (auth.uid() = utilisateur_id);

drop policy if exists "ne plus suivre" on public.tatoueurs_suivis;
create policy "ne plus suivre"
  on public.tatoueurs_suivis for delete
  using (auth.uid() = utilisateur_id);

-- ---------------------------------------------------------------------
-- 4) VÉRIFICATION
-- ---------------------------------------------------------------------
--    select count(*) as politiques
--      from pg_policies
--     where schemaname = 'public' and tablename = 'tatoueurs_suivis';
--    -- attendu : 3
