-- ============================================================
-- YOKOFOLIO — MISE HORS LIGNE, MOTIFS PAR CHAMP, BIO LIBRE
--             (18e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-grandes-pieces.sql
--  (17e). Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. LA MISE HORS LIGNE (action d'administration) : nouvelle
--      colonne `hors_ligne`. L'admin dépublie une fiche depuis la
--      fiche elle-même (publie=false + hors_ligne=true + statut
--      « modifications » + motifs cochés). La fiche disparaît du
--      public (la politique de lecture `publie = true` s'en charge
--      déjà) mais le TATOUEUR GARDE SON ESPACE : il corrige les
--      champs signalés, réenregistre, et la fiche repart en
--      validation. La validation par l'admin remet hors_ligne à
--      false.
--   2. LES MOTIFS DE MODÉRATION RATTACHÉS AUX CHAMPS : la liste du
--      code (MOTIFS_MODERATION) a changé — chaque motif désigne
--      désormais UN champ du formulaire. Les motifs déjà enregistrés
--      avec les ANCIENS slugs sont REMAPPÉS vers les nouveaux (sans
--      doublon).
--   3. LA BIO DEVIENT FACULTATIVE : plus de minimum de 80
--      caractères — seule la borne haute (150) demeure. La
--      contrainte `tatoueurs_bio_longueur` est refaite en
--      conséquence.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, aucune
--  politique d'accès (la lecture publique reste `publie = true`).

-- 1) La colonne de mise hors ligne.
alter table public.tatoueurs
  add column if not exists hors_ligne boolean not null default false;

comment on column public.tatoueurs.hors_ligne is
  'Vrai quand l''ADMIN a retiré la fiche du public (publie=false, statut modifications, motifs cochés). Le compte reste actif : le tatoueur corrige puis réenregistre ; la validation remet le drapeau à false.';

-- 2) Le remappage des anciens motifs vers la nouvelle liste
--    (photo-non-conforme, bio-inappropriee, nom-incorrect,
--     adresse-incorrecte, instagram-ne-correspond-pas,
--     tiktok-ne-correspond-pas, styles-non-conformes,
--     site-web-non-conforme, autre) — dédoublonné.
update public.tatoueurs
set motifs_moderation = coalesce(
  (
    select array_agg(distinct
      case valeur
        when 'photo-hors-sujet'        then 'photo-non-conforme'
        when 'photo-mauvaise-qualite'  then 'photo-non-conforme'
        when 'compte-ne-correspond-pas' then 'instagram-ne-correspond-pas'
        when 'adresse-ne-correspond-pas' then 'adresse-incorrecte'
        when 'style-mal-choisi'        then 'styles-non-conformes'
        else valeur
      end
    )
    from unnest(motifs_moderation) as valeur
  ),
  '{}'
)
where motifs_moderation && array[
  'photo-hors-sujet',
  'photo-mauvaise-qualite',
  'compte-ne-correspond-pas',
  'adresse-ne-correspond-pas',
  'style-mal-choisi'
];

comment on column public.tatoueurs.motifs_moderation is
  'Motifs cochés par l''admin (refus de validation OU mise hors ligne), chacun rattaché à un champ du formulaire : photo-non-conforme, bio-inappropriee, nom-incorrect, adresse-incorrecte, instagram-ne-correspond-pas, tiktok-ne-correspond-pas, styles-non-conformes, site-web-non-conforme, autre.';

-- 3) La bio, FACULTATIVE : au plus 150 caractères, plus aucun
--    minimum. `not valid` : les lignes existantes ne bloquent pas la
--    migration ; toute nouvelle écriture est contrôlée.
alter table public.tatoueurs drop constraint if exists tatoueurs_bio_longueur;
alter table public.tatoueurs add constraint tatoueurs_bio_longueur
  check (bio is null or char_length(bio) <= 150) not valid;

comment on column public.tatoueurs.bio is
  'Présentation libre du tatoueur — FACULTATIVE, 150 caractères au plus, affichée sur la fiche juste sous le nom.';
