-- ============================================================
--  ROSWEL — TABLE signalements (modération des fiches)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Ce script peut être exécuté plusieurs fois sans danger :
--  il ne crée que ce qui manque.
-- ============================================================

-- ============================================================
-- TABLE signalements — une ligne par signalement de fiche
-- ------------------------------------------------------------
--  Un visiteur (connecté ou non) signale une fiche : un ou
--  plusieurs motifs + un commentaire obligatoire. L'adresse IP sert
--  UNIQUEMENT aux garde-fous anti-spam (3 / IP / 24 h et
--  1 / IP / artisan / semaine). particulier_id n'est renseigné que
--  si le visiteur est connecté (utile pour repérer les faux
--  signalements récurrents) ; il pointe vers le compte
--  d'authentification et se met à NULL si le compte est supprimé.
-- ============================================================
create table if not exists public.signalements (
  id uuid primary key default gen_random_uuid(),

  -- La fiche concernée (supprimée avec l'artisan)
  artisan_id uuid not null references public.artisans (id) on delete cascade,

  -- Le compte du visiteur, seulement s'il était connecté
  particulier_id uuid references auth.users (id) on delete set null,

  -- Motif(s) cochés (clés définies dans src/config/roswel.ts)
  motifs text[] not null default '{}',

  -- Commentaire FACULTATIF (longueur maximum imposée côté site : 500 ;
  -- chaîne vide si le visiteur n'a rien écrit)
  commentaire text not null default '',

  -- Adresse IP (garde-fous anti-spam)
  ip text,

  -- Suivi par l'admin
  statut text not null default 'nouveau'
    check (statut in ('nouveau', 'traite', 'rejete')),

  cree_le timestamptz not null default now()
);

-- Index pour les garde-fous anti-spam et l'affichage admin
create index if not exists signalements_ip_date_idx
  on public.signalements (ip, cree_le);
create index if not exists signalements_ip_artisan_date_idx
  on public.signalements (ip, artisan_id, cree_le);
create index if not exists signalements_statut_date_idx
  on public.signalements (statut, cree_le desc);

-- ============================================================
-- SÉCURITÉ (RLS)
-- ------------------------------------------------------------
--  On active la sécurité au niveau des lignes SANS aucune règle
--  d'accès public : ni les visiteurs, ni les artisans ne peuvent
--  lire ou écrire dans cette table. Les signalements sont créés et
--  consultés UNIQUEMENT par le serveur, via la clé secrète du projet
--  (client "admin"), qui n'est pas soumise à ces règles.
-- ============================================================
alter table public.signalements enable row level security;

-- ============================================================
-- FIN
-- ============================================================
