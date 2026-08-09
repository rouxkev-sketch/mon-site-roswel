-- ============================================================
--  ROSWEL — PROSPECTION DES ARTISANS (avant leur inscription)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Ce script peut être exécuté plusieurs fois sans danger :
--  il ne crée que ce qui manque, il ne détruit jamais rien.
--
--  À QUOI ÇA SERT
--  --------------
--  On collecte des entreprises du bâtiment AVANT qu'elles ne
--  s'inscrivent (annuaire Sirene de l'INSEE + API Google Places),
--  on leur écrit, et on suit ce qui se passe. Ces fiches
--  collectées vivent dans leur PROPRE table : elles ne se
--  mélangent JAMAIS avec la table `artisans`, qui ne contient que
--  de vraies fiches créées par leur propriétaire.
--
--  Le jour où l'artisan crée son compte et saisit son SIREN, on
--  fait le rapprochement : `artisans_prospects.artisan_id` pointe
--  vers sa fiche. Le lien n'existe QUE dans ce sens.
-- ============================================================


-- ============================================================
-- 1. TABLE artisans_prospects — une ligne par entreprise démarchée
-- ============================================================
create table if not exists public.artisans_prospects (
  id uuid primary key default gen_random_uuid(),

  -- ----- Identité de l'entreprise (source : annuaire Sirene) -----
  -- Le SIREN est la CLÉ de tout : c'est lui qui permettra de
  -- reconnaître l'entreprise le jour où elle s'inscrira. Unique
  -- ici (jamais deux fois la même entreprise dans la file).
  siren text not null unique,
  siret_etablissement text,          -- établissement principal
  raison_sociale text not null,      -- nom légal renvoyé par l'annuaire
  nom_commercial text,               -- enseigne, si elle diffère
  code_naf text,                     -- ex. '4322A' (voir CODES_NAF_BATIMENT
                                     -- dans src/config/roswel.ts)
  libelle_naf text,
  date_creation_entreprise date,     -- servira au score d'ancienneté
  etat_administratif text,           -- 'A' = active (annuaire Sirene)

  -- ----- Provenance de la fiche -----
  source text not null default 'sirene'
    constraint artisans_prospects_source_check
    check (source in ('sirene', 'google_places', 'manuel')),
  -- Si la fiche a été enrichie par plusieurs sources, on les
  -- garde toutes ici (ex. {'sirene','google_places'}).
  sources text[] not null default '{}',
  collecte_le timestamptz not null default now(),
  maj_le timestamptz,

  -- ----- Métier et localisation (pour préremplir la future fiche) -----
  -- Slugs de métiers : voir METIERS dans src/config/roswel.ts.
  -- Déduits du code NAF, donc TOUJOURS à relire à la main.
  metiers text[] not null default '{}',
  ville_code_insee text,
  ville_nom text,
  ville_code_postal text,
  adresse text,
  latitude double precision,
  longitude double precision,

  -- ----- Contact -----
  -- L'email est le nerf de la guerre : l'annuaire Sirene ne le
  -- donne PAS. Il vient du site de l'entreprise, de sa fiche
  -- Google, ou d'une recherche à la main.
  email text,
  email_source text
    constraint artisans_prospects_email_source_check
    check (email_source in ('site_web', 'google', 'annuaire', 'manuel')),
  email_verifie_le timestamptz,
  telephone text,
  site_internet text,

  -- ----- Données Google Places (note + nombre d'avis UNIQUEMENT) -----
  place_id_google text unique,
  note_google numeric(2, 1),
  nombre_avis_google integer,
  date_maj_google timestamptz,       -- fraîcheur de la note Google

  -- ----- Suivi de la prospection -----
  statut text not null default 'non_contacte'
    constraint artisans_prospects_statut_check
    check (statut in (
      'non_contacte',      -- collecté, jamais écrit
      'email_a_trouver',   -- pas d'adresse : à chercher à la main
      'relance_en_cours',  -- au moins un envoi, séquence en cours
      'reponse_recue',     -- l'artisan a répondu : on arrête l'automatique
      'compte_cree',       -- objectif atteint (voir artisan_id)
      'rebond',            -- adresse invalide (rebond dur)
      'ne_plus_contacter'  -- désinscription ou refus explicite
    )),

  -- Combien d'e-mails automatiques sont déjà partis (plafond :
  -- NOMBRE_ENVOIS_MAXIMUM dans src/config/roswel.ts).
  nombre_envois integer not null default 0,
  premier_envoi_le timestamptz,      -- origine de la séquence J+7 / J+14 / J+30
  dernier_envoi_le timestamptz,
  prochain_envoi_le timestamptz,     -- c'est CE champ que la tâche planifiée lit

  -- Contact fait À LA MAIN via le formulaire du site de l'artisan
  -- (quand aucune adresse email n'a pu être trouvée). Ces contacts
  -- ne consomment PAS le plafond quotidien d'e-mails : ils ne
  -- passent pas par Resend et ne figurent pas dans
  -- prospection_envois.
  contact_formulaire_le timestamptz,

  -- ----- Rattachement à la vraie fiche (un seul sens) -----
  -- Renseigné au moment où l'artisan s'inscrit avec ce SIREN.
  -- `on delete set null` : si la fiche est supprimée, on garde la
  -- trace de la prospection, sans lien mort.
  artisan_id uuid references public.artisans (id) on delete set null,
  compte_cree_le timestamptz,

  -- ----- Divers -----
  notes_admin text,
  desinscrit_le timestamptz,
  -- Jeton du lien « Ne plus recevoir de messages » : imprévisible,
  -- et différent pour chaque prospect (jamais l'email en clair
  -- dans l'adresse de désinscription).
  jeton_desinscription text not null unique default gen_random_uuid()::text
);

-- ----- Index -----
-- (`siren` et `place_id_google` ont déjà leur index unique, créé
--  automatiquement par la contrainte `unique` ci-dessus.)

-- La requête de la tâche planifiée : « qui doit être contacté
-- maintenant ? » — filtre sur le statut puis sur la date.
create index if not exists artisans_prospects_file_idx
  on public.artisans_prospects (statut, prochain_envoi_le);

-- L'affichage de la page d'administration (filtres par statut)
create index if not exists artisans_prospects_statut_date_idx
  on public.artisans_prospects (statut, collecte_le desc);

-- Recherches par ville et rapprochement avec les vraies fiches
create index if not exists artisans_prospects_ville_idx
  on public.artisans_prospects (ville_code_insee);
create index if not exists artisans_prospects_artisan_idx
  on public.artisans_prospects (artisan_id);


-- ============================================================
-- 2. TABLE prospection_envois — le journal des e-mails partis
-- ------------------------------------------------------------
--  Sans ce journal, rien n'est possible : c'est lui qui porte le
--  plafond quotidien (comptage sur une FENÊTRE GLISSANTE de 24 h,
--  pas de remise à zéro à minuit), la séquence de relances et le
--  repérage des rebonds.
--
--  Volontairement PAS de suivi d'ouverture ni de clic : les
--  protections des messageries faussent complètement ces chiffres,
--  et les pixels de suivi dégradent la délivrabilité.
-- ============================================================
create table if not exists public.prospection_envois (
  id uuid primary key default gen_random_uuid(),

  prospect_id uuid not null
    references public.artisans_prospects (id) on delete cascade,

  -- L'adresse FIGÉE au moment de l'envoi (elle peut changer ensuite
  -- sur la fiche du prospect : le journal, lui, ne bouge pas).
  email text not null,

  -- 0 = premier contact, 1 = J+7, 2 = J+14, 3 = J+30
  -- (voir DELAIS_RELANCE_JOURS dans src/config/roswel.ts)
  numero_relance smallint not null default 0
    constraint prospection_envois_numero_check
    check (numero_relance >= 0 and numero_relance <= 3),

  -- Clé du gabarit utilisé (voir GABARITS_PROSPECTION dans
  -- src/config/roswel.ts) : permet de savoir quel texte est parti.
  gabarit text not null,

  -- LA colonne de la fenêtre glissante de 24 h
  envoye_le timestamptz not null default now(),

  resultat text not null
    constraint prospection_envois_resultat_check
    check (resultat in (
      'envoye',   -- accepté par Resend
      'simule',   -- pas de clé RESEND_API_KEY : affiché dans le terminal
      'echec',    -- refusé (erreur technique)
      'rebond'    -- rebond signalé après coup
    )),

  -- Identifiant du message chez Resend : sert à rapprocher les
  -- notifications de rebond reçues plus tard.
  id_resend text,
  erreur text
);

-- ----- Index -----
-- Comptage du plafond : « combien d'envois depuis 24 h ? »
create index if not exists prospection_envois_date_idx
  on public.prospection_envois (envoye_le desc);

-- Historique d'un prospect (affiché sur sa ligne dans l'admin)
create index if not exists prospection_envois_prospect_idx
  on public.prospection_envois (prospect_id, envoye_le desc);

-- Rapprochement des rebonds signalés par Resend
create index if not exists prospection_envois_resend_idx
  on public.prospection_envois (id_resend);


-- ============================================================
-- 3. COMPLÉMENTS SUR LA TABLE artisans
-- ============================================================

-- Fraîcheur de la note Google : la colonne manquait (seule
-- date_maj_instagram existait). Elle deviendra indispensable dès
-- que le rafraîchissement Google sera automatisé.
alter table public.artisans add column if not exists date_maj_google timestamptz;
-- (Aucun `grant` : comme le score ou la pastille, cette date est
--  écrite par le site, jamais par l'artisan.)

-- Index de RECHERCHE sur le SIREN — volontairement NON UNIQUE.
-- Il sert au rapprochement « ce prospect a-t-il déjà une fiche ? »
-- sans rien interdire : imposer l'unicité ici casserait
-- l'enregistrement d'une fiche en cas de doublon existant.
create index if not exists artisans_siren_idx
  on public.artisans (siren)
  where siren is not null;


-- ============================================================
-- 4. SÉCURITÉ (RLS)
-- ------------------------------------------------------------
--  Sécurité au niveau des lignes activée SANS AUCUNE règle
--  d'accès : ni les visiteurs, ni les artisans ne peuvent lire ou
--  écrire dans ces deux tables. Elles ne sont manipulées que par
--  le serveur, avec la clé SECRÈTE du projet (client « admin »),
--  qui n'est pas soumise à ces règles.
--  C'est exactement le modèle des tables `signalements` et
--  `messages_contact`.
--
--  Ces tables contiennent des données d'entreprises collectées
--  avant tout consentement : elles ne doivent JAMAIS être
--  accessibles avec la clé publique du navigateur.
-- ============================================================
alter table public.artisans_prospects enable row level security;
alter table public.prospection_envois enable row level security;


-- ============================================================
-- FIN — vérification rapide possible dans le SQL Editor :
-- select count(*) from public.artisans_prospects;
-- select count(*) from public.prospection_envois;
-- ============================================================
