-- ============================================================
--  ROSWEL — LES DEMANDES DE RENDEZ-VOUS (site vitrine)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Réexécutable sans danger.
--
--  À QUOI ÇA SERT
--  --------------
--  Le formulaire de /rendez-vous écrit ici, ET envoie une
--  notification par e-mail. Deux traces valent mieux qu'une : un
--  e-mail se perd dans une boîte, une ligne en base ne bouge pas.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien des autres produits du dépôt : ni `artisans`, ni `tatoueurs`,
--  ni `messages_contact`. Cette table est indépendante.
-- ============================================================

create table if not exists demandes_rdv (
  id uuid primary key default gen_random_uuid(),
  recue_le timestamptz not null default now(),

  -- QUI DEMANDE
  nom text not null,
  entreprise text not null,
  email text not null,
  -- Facultatif : tout le monde ne souhaite pas être appelé.
  telephone text,

  -- Une des valeurs proposées par le menu (voir
  -- RENDEZ_VOUS.taillesEntreprise dans src/config/agence.ts).
  -- Volontairement du texte libre et non une énumération : ajouter
  -- un palier ne doit pas demander une migration.
  taille_entreprise text not null,

  -- LE BESOIN, tel qu'il a été écrit.
  besoin text not null,

  -- LE SUIVI. `traitee` passe à vrai une fois le rendez-vous pris ;
  -- `notes` sert aux échanges internes.
  traitee boolean not null default false,
  notes text
);

-- La lecture courante se fait « les plus récentes d'abord ».
create index if not exists idx_demandes_rdv_date
  on demandes_rdv (recue_le desc);

-- Retrouver ce qui reste à traiter, sans parcourir tout l'historique.
create index if not exists idx_demandes_rdv_a_traiter
  on demandes_rdv (recue_le desc)
  where traitee = false;

-- ------------------------------------------------------------
--  SÉCURITÉ : personne, sauf le serveur
-- ------------------------------------------------------------
--  Ces demandes contiennent des coordonnées professionnelles : elles
--  n'ont RIEN à faire dans un navigateur. On active RLS sans écrire
--  la moindre règle — le résultat est un refus pour tout le monde.
--  La clé SECRÈTE du serveur (SUPABASE_SECRET_KEY), utilisée par
--  /api/rendez-vous, passe outre RLS : c'est elle, et elle seule, qui
--  écrit dans cette table.
alter table demandes_rdv enable row level security;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select recue_le, entreprise, nom, email, taille_entreprise
--    from demandes_rdv
--   where traitee = false
--   order by recue_le desc;
