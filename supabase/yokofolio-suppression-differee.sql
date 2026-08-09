-- ============================================================
--  YOKOFOLIO — LA SUPPRESSION DE COMPTE DEVIENT DIFFÉRÉE (21 JOURS)
--  (migration nº 22 — à passer APRÈS yokofolio-type-mode-exercice.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  CE QUI CHANGE
--  -------------
--  Avant : « Supprimer mon compte » effaçait TOUT, immédiatement, sans
--  retour possible. Une fausse manœuvre coûtait la fiche entière.
--
--  Maintenant, en trois temps :
--    1. À LA CONFIRMATION — le compte et sa fiche deviennent
--       INVISIBLES tout de suite (colonne `supprime_le` sur la fiche,
--       ligne dans `suppressions_comptes`). RIEN N'EST EFFACÉ :
--       ni la fiche, ni les photos, ni le compte de connexion.
--    2. PENDANT 21 JOURS — une simple RECONNEXION annule tout : la
--       ligne de suppression part, `supprime_le` repasse à null, et la
--       fiche revient EXACTEMENT dans l'état où elle était (publiée ou
--       non, brouillon compris) : on n'a touché à aucun autre champ.
--    3. À L'ÉCHÉANCE — la purge efface pour de bon (photos, fiche,
--       compte). Elle est déclenchée par la tâche planifiée
--       /api/cron/purge-comptes (voir vercel.json), qui lit la vue
--       `comptes_a_purger` ci-dessous.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA FICHE : une date, et c'est tout
-- ------------------------------------------------------------
--  Pourquoi une DATE plutôt qu'un « masquée oui/non » : elle dit à la
--  fois QUE la fiche est retirée et DEPUIS QUAND — donc quand elle
--  sera purgée, sans autre table à consulter.
alter table public.tatoueurs
  add column if not exists supprime_le timestamptz;

comment on column public.tatoueurs.supprime_le is
  'Date de DEMANDE de suppression du compte. Non nulle = fiche invisible partout (rien n''est effacé). Une reconnexion la remet à null.';

-- La lecture publique écarte ces fiches à chaque requête : l'index
-- garde l'opération gratuite.
create index if not exists idx_tatoueurs_supprime_le
  on public.tatoueurs (supprime_le)
  where supprime_le is not null;

-- ------------------------------------------------------------
-- 2) LE REGISTRE DES SUPPRESSIONS DEMANDÉES
-- ------------------------------------------------------------
--  Une table à part, et non une colonne sur la fiche : un compte peut
--  demander sa suppression SANS avoir de fiche. C'est le compte qu'on
--  supprime, pas la fiche.
create table if not exists public.suppressions_comptes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  demandee_le timestamptz not null default now(),
  -- L'ÉCHÉANCE est écrite noir sur blanc, pas recalculée à la lecture :
  -- si le délai de 21 jours change un jour, les demandes en cours
  -- gardent celle qui a été ANNONCÉE à la personne.
  purge_le timestamptz not null,
  -- L'adresse au moment de la demande : elle sert à retrouver la
  -- trace d'une purge si quelqu'un réclame, et à rien d'autre.
  courriel text
);

comment on table public.suppressions_comptes is
  'Comptes dont la suppression est demandée. Ligne présente = compte invisible ; ligne absente = compte normal. La reconnexion supprime la ligne.';

create index if not exists idx_suppressions_purge
  on public.suppressions_comptes (purge_le);

-- ------------------------------------------------------------
-- 3) RIEN N'EST LISIBLE PAR LES VISITEURS
-- ------------------------------------------------------------
--  Cette table ne se lit QUE par la clé de service (les routes
--  serveur). Aucune règle d'accès n'est ouverte : RLS activée sans
--  aucune politique = personne, hors clé de service.
alter table public.suppressions_comptes enable row level security;

-- ------------------------------------------------------------
-- 4) LA LISTE DES COMPTES À PURGER
-- ------------------------------------------------------------
--  La tâche planifiée lit CETTE vue, et rien d'autre : la règle des
--  21 jours vit donc à UN SEUL endroit.
create or replace view public.comptes_a_purger as
  select user_id, demandee_le, purge_le, courriel
    from public.suppressions_comptes
   where purge_le <= now();

comment on view public.comptes_a_purger is
  'Les comptes dont le délai de 21 jours est écoulé — lus par /api/cron/purge-comptes.';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Les suppressions en cours et leur échéance :
--  select courriel, demandee_le, purge_le,
--         purge_le - now() as il_reste
--    from public.suppressions_comptes order by purge_le;
--
--  -- Les fiches actuellement invisibles pour cette raison :
--  select nom, slug, supprime_le from public.tatoueurs
--   where supprime_le is not null;
--
--  -- Annuler une suppression à la main (dépannage) :
--  -- delete from public.suppressions_comptes where courriel = 'x@y.fr';
--  -- update public.tatoueurs set supprime_le = null where user_id = '…';
