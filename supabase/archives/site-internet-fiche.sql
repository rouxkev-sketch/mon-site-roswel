-- ============================================================
--  SITE INTERNET DE L'ARTISAN (colonne facultative)
-- ============================================================
--  La fiche affiche désormais, dans sa ligne d'informations,
--  une colonne « Internet » : un lien « Voir le site » quand
--  l'artisan a renseigné son site, un simple tiret « — » sinon
--  (même traitement que Google ou Instagram absents sur les
--  cartes).
--
--  Le champ est FACULTATIF : beaucoup d'artisans n'ont pas de
--  site, et c'est très bien ainsi — leur fiche Roswel EST leur
--  vitrine. Il n'entre donc dans aucun calcul de score.
--
--  Script IDEMPOTENT : il peut être relancé sans risque.
--  À exécuter dans l'éditeur SQL de Supabase.
-- ============================================================

alter table public.artisans add column if not exists site_internet text;

-- L'artisan doit pouvoir écrire ce champ depuis son espace.
-- (Les droits sont accordés colonne par colonne : sans cette
--  ligne, l'enregistrement échouerait silencieusement.)
grant insert (site_internet) on table public.artisans to authenticated;
grant update (site_internet) on table public.artisans to authenticated;
