-- ============================================================
-- YOKOFOLIO — LA POPULARITÉ DES FICHES (comptage des clics)
-- ============================================================
-- À passer dans l'éditeur SQL de Supabase, EN DERNIER de la chaîne :
--   1. tatoueurs.sql
--   2. yokofolio-photos-par-style.sql
--   3. yokofolio-styles-adresse.sql
--   4. yokofolio-bio.sql
--   5. yokofolio-fiches-tatoueurs.sql
--   6. yokofolio-site-web.sql
--   7. yokofolio-popularite.sql   ← ce fichier
--
-- Ce qu'il fait :
--   - crée la table `clics_fiches` : UN clic « carte → fiche » par
--     ligne, avec une empreinte de visiteur ANONYME (condensat, jamais
--     l'adresse IP en clair) et le jour du clic ;
--   - le DÉDOUBLONNAGE PAR VISITEUR SUR 24 H est porté par l'index
--     unique (fiche, visiteur, jour) : rejouer le même clic le même
--     jour ne compte pas (l'API insère en ignorant les doublons).
--     Les rafales anormales et les robots identifiables sont écartés
--     AVANT l'insertion, côté serveur (src/app/api/tatoueur/clic) ;
--   - crée la vue `clics_tatoueurs` (slug → total), la seule chose que
--     le site lit pour CLASSER les cartes : les plus consultées
--     d'abord, à égalité l'ordre actuel est conservé ;
--   - RLS sans aucune règle publique sur la table : SEULE la clé
--     d'administration (l'API du site) peut y écrire ou la lire.
--
-- TANT QUE CE FICHIER N'EST PAS PASSÉ, le site tourne comme avant :
-- l'API de clic répond « ok » sans rien enregistrer, et le classement
-- reste l'ordre actuel. Repasser ce fichier ne casse rien.

create table if not exists public.clics_fiches (
  id bigint generated always as identity primary key,
  -- Le slug de la fiche cliquée (pas de clé étrangère : les fiches de
  -- démonstration n'existent pas en base, et un clic vaut d'être
  -- compté même si la fiche est recréée).
  tatoueur_slug text not null,
  -- L'empreinte ANONYME du visiteur : condensat (SHA-256, tronqué)
  -- d'adresse IP + navigateur + sel, calculé par l'API. Jamais
  -- d'adresse IP en clair.
  visiteur text not null,
  -- Le jour (UTC) du clic — la maille du dédoublonnage « sur 24 h ».
  jour date not null default (now() at time zone 'utc')::date,
  cree_le timestamptz not null default now()
);

-- LE DÉDOUBLONNAGE : un visiteur ne compte qu'UNE fois par fiche et
-- par jour. L'API insère avec « ignorer les doublons ».
create unique index if not exists clics_fiches_unicite
  on public.clics_fiches (tatoueur_slug, visiteur, jour);

-- L'index du comptage (regroupement par fiche).
create index if not exists clics_fiches_par_fiche
  on public.clics_fiches (tatoueur_slug);

-- RLS ACTIVÉE, AUCUNE RÈGLE : ni lecture ni écriture publiques. Seule
-- la clé service (l'API du site, côté serveur) passe.
alter table public.clics_fiches enable row level security;

comment on table public.clics_fiches is
  'Clics « carte → fiche » de yokofolio : un par visiteur (empreinte anonyme), par fiche et par jour. Écrit uniquement par l''API du site.';

-- ------------------------------------------------------------
-- LA VUE DE CLASSEMENT — slug → nombre total de clics.
-- C'est elle que lit le site (elle n'expose que des totaux, aucun
-- détail de visite).
-- ------------------------------------------------------------
create or replace view public.clics_tatoueurs as
  select tatoueur_slug as slug, count(*)::bigint as total
  from public.clics_fiches
  group by tatoueur_slug;

grant select on public.clics_tatoueurs to anon, authenticated;

comment on view public.clics_tatoueurs is
  'Totaux de clics par fiche (yokofolio) — sert au classement des cartes par popularité.';
