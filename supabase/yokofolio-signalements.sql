-- ============================================================
-- YOKOFOLIO — LES SIGNALEMENTS DE FICHES
-- ============================================================
-- À passer APRÈS yokofolio-moderation.sql (11e de la chaîne).
--
-- La table des signalements envoyés par les visiteurs (fenêtre
-- « Signaler cette fiche ») : AUCUNE donnée personnelle du signaleur.
-- Écrite et lue UNIQUEMENT par l'API du site (clé d'administration) —
-- RLS activée sans aucune règle publique. L'admin les traite dans
-- /admin (section Signalements) et les archive (traite = true).
-- Rejouable sans dommage.

create table if not exists public.signalements_fiches (
  id bigint generated always as identity primary key,
  -- Le slug de la fiche visée (pas de clé étrangère : une fiche
  -- supprimée ne doit pas emporter la trace du signalement).
  tatoueur_slug text not null,
  -- Les motifs cochés (usurpation, contenu-inapproprie,
  -- compte-ne-correspond-pas, fiche-en-double, autre).
  motifs text[] not null,
  -- Le champ libre (« autre »), facultatif.
  details text,
  traite boolean not null default false,
  cree_le timestamptz not null default now()
);

create index if not exists signalements_fiches_a_traiter
  on public.signalements_fiches (traite, cree_le desc);

alter table public.signalements_fiches enable row level security;

comment on table public.signalements_fiches is
  'Signalements des fiches yokofolio (visiteurs, sans donnée personnelle). Accès uniquement par l''API du site.';
