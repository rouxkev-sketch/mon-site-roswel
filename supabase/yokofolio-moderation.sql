-- ============================================================
-- YOKOFOLIO — LA MODÉRATION DES FICHES (motifs de l'admin)
-- ============================================================
-- À passer APRÈS yokofolio-filtres.sql (10e de la chaîne).
--
-- Ce qu'il fait :
--   - autorise le statut « modifications » (demande de modifications,
--     fiche gardée hors ligne) en plus de en_attente/validee/refusee ;
--   - ajoute les colonnes de la DÉCISION : motifs cochés (liste
--     pré-enregistrée MOTIFS_MODERATION du code), note libre, date.
-- Tant que ce fichier n'est pas passé, l'admin fonctionne quand même :
-- la demande de modifications retombe sur le statut « refusee », sans
-- motifs enregistrés. Rejouable sans dommage.

alter table public.tatoueurs
  add column if not exists motifs_moderation text[],
  add column if not exists note_moderation text,
  add column if not exists decide_le timestamptz;

comment on column public.tatoueurs.motifs_moderation is
  'Motifs cochés par l''admin avec la décision « demander des modifications » (photo-hors-sujet, photo-mauvaise-qualite, compte-ne-correspond-pas, adresse-ne-correspond-pas, bio-inappropriee, style-mal-choisi, autre).';

-- La contrainte de statut, élargie au nouveau statut « modifications ».
do $$
begin
  alter table public.tatoueurs drop constraint if exists tatoueurs_statut_check;
  alter table public.tatoueurs
    add constraint tatoueurs_statut_check
    check (statut in ('en_attente', 'validee', 'refusee', 'modifications'));
exception when undefined_column then
  -- La colonne statut n'existe pas encore (yokofolio-fiches-tatoueurs
  -- non passé) : rien à contraindre ici.
  null;
end $$;
