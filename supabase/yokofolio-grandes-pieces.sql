-- ============================================================
-- YOKOFOLIO — COMPOSITION RÉDUITE À TROIS ENTRÉES (17e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-vingt-deux-styles.sql
--  (16e). Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  Le groupe « Composition » ne compte plus que TROIS entrées :
--    petit-tatouage · patchwork · sleeve
--  « sleeve » garde son slug mais devient, à l'écran,
--  « Grandes pièces — sleeve, dos, torse, bodysuit ».
--
--  Les anciennes entrées « piece-dos », « piece-torse » et
--  « bodysuit » disparaissent : toute fiche qui les avait déclarées
--  est BASCULÉE sur « sleeve », SANS doublon si elle l'avait déjà.
--  La bascule est faite :
--   1. dans la colonne `filtres_composition` (fiches publiées et en
--      attente) ;
--   2. dans le `brouillon` des fiches en ligne dont une modification
--      attend la validation (le brouillon transporte ses propres
--      filtres).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, aucun autre
--  champ de `tatoueurs`.

-- 1) La colonne elle-même : remplacer les trois anciens slugs par
--    « sleeve », en dédoublonnant (array_agg(distinct …)).
update public.tatoueurs
set filtres_composition = coalesce(
  (
    select array_agg(distinct
      case
        when valeur in ('piece-dos', 'piece-torse', 'bodysuit') then 'sleeve'
        else valeur
      end
    )
    from unnest(filtres_composition) as valeur
  ),
  '{}'
)
where filtres_composition && array['piece-dos', 'piece-torse', 'bodysuit'];

-- 2) Le brouillon (jsonb) des fiches dont une modification attend la
--    validation : même bascule, même dédoublonnage.
update public.tatoueurs
set brouillon = jsonb_set(
  brouillon,
  '{filtres_composition}',
  coalesce(
    (
      select jsonb_agg(distinct
        case
          when valeur in ('piece-dos', 'piece-torse', 'bodysuit') then 'sleeve'
          else valeur
        end
      )
      from jsonb_array_elements_text(brouillon -> 'filtres_composition') as valeur
    ),
    '[]'::jsonb
  )
)
where brouillon is not null
  and brouillon ? 'filtres_composition'
  and brouillon -> 'filtres_composition' ?| array['piece-dos', 'piece-torse', 'bodysuit'];

-- 3) Le commentaire de la colonne suit la nouvelle liste.
comment on column public.tatoueurs.filtres_composition is
  'Compositions pratiquées : petit-tatouage, patchwork, sleeve (affiché « Grandes pièces — sleeve, dos, torse, bodysuit »).';
