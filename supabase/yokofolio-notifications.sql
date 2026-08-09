-- ============================================================
--  YOKOFOLIO — LES NOTIFICATIONS DU COMPTE
--  (migration nº 25 — à passer APRÈS yokofolio-fiches-multiples.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  CE QUE ÇA CRÉE
--  --------------
--  Une boîte de nouvelles, par compte. Jusqu'ici, une décision de
--  l'administration (fiche validée, modifications demandées, fiche
--  retirée) n'existait que dans l'état de LA fiche — et un compte qui
--  en a trois ne savait plus laquelle avait bougé.
--
--  CHAQUE NOTIFICATION DIT DONC DE QUELLE FICHE ELLE PARLE : elle
--  garde le nom de la fiche EN DUR (`fiche_nom`) en plus du lien
--  (`fiche_id`), pour rester lisible même après la suppression de
--  cette fiche — « Ton salon de Lille a été supprimé » doit survivre
--  au salon de Lille.
--
--  QUI ÉCRIT : le SERVEUR seul (clé de service) — les routes
--  d'administration et les routes de suppression. Personne ne peut
--  s'écrire une notification à soi-même.
--  QUI LIT : le propriétaire, et lui seul.
--  QUI MARQUE COMME LUE : le propriétaire (c'est la seule chose qu'il
--  peut modifier — voir la politique plus bas).
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA TABLE
-- ------------------------------------------------------------
create table if not exists public.notifications_compte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- La fiche concernée. `on delete set null` : la fiche peut
  -- disparaître, la nouvelle reste lisible grâce à `fiche_nom`.
  fiche_id uuid references public.tatoueurs(id) on delete set null,
  fiche_nom text,
  -- validee | modifications | hors_ligne | suppression_fiche |
  -- suppression_compte | annulation
  genre text not null,
  titre text not null,
  detail text,
  -- Les motifs cochés par l'administration, quand il y en a.
  motifs text[],
  creee_le timestamptz not null default now(),
  lue_le timestamptz
);

comment on table public.notifications_compte is
  'Les nouvelles adressées à un compte (validation, refus, mise hors ligne, suppression programmée ou annulée). Écrites par le serveur, lues et marquées comme lues par le propriétaire.';

-- La lecture courante : « mes notifications, les plus récentes
-- d''abord » — et le compteur des non lues.
create index if not exists idx_notifications_compte
  on public.notifications_compte (user_id, creee_le desc);

create index if not exists idx_notifications_non_lues
  on public.notifications_compte (user_id)
  where lue_le is null;

-- ------------------------------------------------------------
-- 2) LES RÈGLES D'ACCÈS
-- ------------------------------------------------------------
alter table public.notifications_compte enable row level security;

-- LIRE : les siennes, rien d'autre.
drop policy if exists "lecture de ses notifications" on public.notifications_compte;
create policy "lecture de ses notifications"
  on public.notifications_compte for select
  to authenticated
  using (auth.uid() = user_id);

-- MARQUER COMME LUE : une modification, sur ses propres lignes, et
-- qui ne peut pas changer de propriétaire. Le contenu, lui, n'a aucune
-- raison d'être retouché — mais l'interface n'écrit que `lue_le`.
drop policy if exists "marquer ses notifications comme lues" on public.notifications_compte;
create policy "marquer ses notifications comme lues"
  on public.notifications_compte for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- AUCUNE politique d'INSERT ni de DELETE : personne, hors clé de
-- service. C'est voulu — une notification est une PAROLE DU SITE,
-- pas quelque chose que l'on s'écrit à soi-même.

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Les non lues, par compte :
--  select user_id, count(*) from public.notifications_compte
--   where lue_le is null group by user_id order by 2 desc;
--
--  -- Les dernières nouvelles :
--  select creee_le, genre, fiche_nom, titre, lue_le
--    from public.notifications_compte order by creee_le desc limit 20;
