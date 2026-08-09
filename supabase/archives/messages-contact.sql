-- ============================================================
--  ROSWEL — TABLE messages_contact (formulaire /contact)
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
-- TABLE messages_contact — une ligne par message envoyé depuis
-- la page /contact
-- ------------------------------------------------------------
--  Le message est aussi transmis par email à l'exploitant ; cette
--  table en garde une trace et sert au garde-fou anti-spam (au plus
--  3 envois par IP toutes les 24 h). L'adresse IP n'est utilisée que
--  pour ce garde-fou.
-- ============================================================
create table if not exists public.messages_contact (
  id uuid primary key default gen_random_uuid(),

  nom text not null,
  email text not null,
  -- clé du sujet (voir SUJETS_CONTACT dans src/config/roswel.ts)
  sujet text not null,
  -- message obligatoire (longueur imposée côté site : 20 à 1000)
  message text not null,

  -- Adresse IP (garde-fou anti-spam)
  ip text,

  cree_le timestamptz not null default now()
);

-- Index pour le garde-fou anti-spam par IP
create index if not exists messages_contact_ip_date_idx
  on public.messages_contact (ip, cree_le);

-- ============================================================
-- SÉCURITÉ (RLS)
-- ------------------------------------------------------------
--  Sécurité au niveau des lignes activée SANS aucune règle d'accès
--  public : ni les visiteurs, ni les artisans ne peuvent lire ou
--  écrire dans cette table. Les messages sont créés UNIQUEMENT par le
--  serveur, via la clé secrète du projet (client "admin"), qui n'est
--  pas soumise à ces règles.
-- ============================================================
alter table public.messages_contact enable row level security;

-- ============================================================
-- FIN
-- ============================================================
