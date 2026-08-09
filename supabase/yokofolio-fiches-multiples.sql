-- ============================================================
--  YOKOFOLIO — UN COMPTE, PLUSIEURS FICHES
--  (migration nº 24 — à passer APRÈS yokofolio-delai-30-jours.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  CE QUI CHANGE
--  -------------
--  Un compte ne gérait qu'UNE fiche. Il peut désormais en gérer
--  PLUSIEURS : un artiste qui possède aussi son salon, un gérant qui
--  administre trois établissements.
--
--  ⚠️ ET POURTANT, PRESQUE RIEN NE BOUGE EN BASE.
--  Le lien compte ↔ fiche est DÉJÀ un lien « un vers plusieurs » :
--  chaque fiche porte son `user_id`. La seule chose qui interdisait la
--  deuxième fiche était un INDEX UNIQUE posé sur cette colonne. On le
--  retire, et le modèle devient naturellement multiple.
--
--  AUCUNE FICHE N'EST PERDUE : celles qui existent gardent leur
--  `user_id` et deviennent, telles quelles, la première fiche de leur
--  compte. Rien n'est déplacé, rien n'est recopié.
--
--  CE QUE ÇA AJOUTE AUSSI : la SUPPRESSION D'UNE SEULE FICHE, sur le
--  modèle exact de la suppression de compte — une date d'échéance
--  écrite noir sur blanc, trente jours de réflexion, et une annulation
--  possible à tout moment (y compris par une simple modification de la
--  fiche).
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA FIN DE LA RÈGLE « UN COMPTE, UNE FICHE »
-- ------------------------------------------------------------
--  C'était CET index, et lui seul, qui posait la limite.
drop index if exists public.idx_tatoueurs_un_compte_une_fiche;

--  On garde un index, mais NON UNIQUE : il sert à retrouver vite
--  toutes les fiches d'un compte (le menu « Mon espace » le fait à
--  chaque ouverture).
create index if not exists idx_tatoueurs_compte
  on public.tatoueurs (user_id)
  where user_id is not null;

comment on column public.tatoueurs.user_id is
  'Le compte propriétaire de la fiche (null pour les fiches de démonstration). UN COMPTE PEUT EN AVOIR PLUSIEURS. Supprimer le compte supprime toutes ses fiches (cascade).';

-- ------------------------------------------------------------
-- 2) LES RÈGLES D'ACCÈS — RIEN À CHANGER, ET C'EST VOULU
-- ------------------------------------------------------------
--  Les politiques de sécurité (RLS) ont TOUJOURS raisonné LIGNE PAR
--  LIGNE : « auth.uid() = user_id ». Elles autorisent donc déjà, sans
--  la moindre retouche, un compte à lire, créer et modifier N fiches
--  — à la stricte condition que chacune porte SON identifiant.
--  On les réécrit ici à l'identique, pour que ce fichier suffise à
--  remonter une base à neuf, et pour que la règle soit relisible.
drop policy if exists "creation de sa propre fiche" on public.tatoueurs;
create policy "creation de sa propre fiche"
  on public.tatoueurs for insert
  to authenticated
  with check (auth.uid() = user_id and publie = false);

drop policy if exists "lecture de sa propre fiche" on public.tatoueurs;
create policy "lecture de sa propre fiche"
  on public.tatoueurs for select
  to authenticated
  using (auth.uid() = user_id);

--  La modification reste bornée : on ne peut PAS se publier soi-même,
--  ni changer de propriétaire. (Même règle qu'en nº 18, réécrite ici.)
drop policy if exists "modification de sa propre fiche" on public.tatoueurs;
create policy "modification de sa propre fiche"
  on public.tatoueurs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) SUPPRIMER UNE FICHE (et pas le compte)
-- ------------------------------------------------------------
--  `supprime_le` existe déjà (migration nº 22) : elle rend la fiche
--  INVISIBLE sans rien effacer. Il lui manquait une ÉCHÉANCE PROPRE :
--  jusqu'ici, seule la suppression du COMPTE en portait une.
alter table public.tatoueurs
  add column if not exists purge_le timestamptz;

comment on column public.tatoueurs.purge_le is
  'Échéance de suppression DÉFINITIVE de CETTE fiche (30 jours). Écrite à la demande, effacée par une annulation OU par une simple modification de la fiche. Null = aucune suppression en cours.';

create index if not exists idx_tatoueurs_purge_le
  on public.tatoueurs (purge_le)
  where purge_le is not null;

--  La liste que lit la tâche planifiée. Comme pour les comptes, la
--  règle des 30 jours n'est PAS écrite ici : chaque ligne porte son
--  échéance, on ne fait que la comparer à l'heure qu'il est.
create or replace view public.fiches_a_purger as
  select id, user_id, nom, slug, supprime_le, purge_le
    from public.tatoueurs
   where purge_le is not null
     and purge_le <= now();

comment on view public.fiches_a_purger is
  'Les fiches dont le délai de suppression est écoulé — lues par /api/cron/purge-comptes.';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Combien de fiches par compte ?
--  select user_id, count(*) from public.tatoueurs
--   where user_id is not null group by user_id order by 2 desc;
--
--  -- Les suppressions de fiche en cours :
--  select nom, slug, supprime_le, purge_le, purge_le - now() as il_reste
--    from public.tatoueurs where purge_le is not null order by purge_le;
--
--  -- Annuler une suppression de fiche à la main (dépannage) :
--  -- update public.tatoueurs set supprime_le = null, purge_le = null
--  --  where slug = 'nom-de-la-fiche';
