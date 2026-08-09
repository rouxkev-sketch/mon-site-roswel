-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 34 : LA CHAÎNE YOUTUBE D'UNE FICHE
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 33
--  (yokofolio-studio-horaires.sql).
--
--  POURQUOI. Beaucoup de tatoueurs filment leurs séances : c'est un
--  portfolio en mouvement, et il n'avait pas sa place sur la fiche. Le
--  champ rejoint Instagram et TikTok, au même endroit du formulaire et
--  au même format sur la fiche publique.
--
--  FACULTATIF, comme TikTok et le site : une fiche sans YouTube reste
--  parfaitement valide, et le badge ne s'affiche tout simplement pas.
--
--  SANS RISQUE : la colonne s'ajoute vide, aucune ligne existante
--  n'est touchée, et le site fonctionnait déjà sans elle (le code
--  retombe sur l'ancien jeu de colonnes quand elle manque — voir
--  `colonneAbsente` dans src/lib/tatoueurs.ts).
--  Rejouable sans dommage (`if not exists`).
-- =====================================================================

alter table public.tatoueurs
  add column if not exists lien_youtube text;

comment on column public.tatoueurs.lien_youtube is
  'Chaîne YouTube du tatoueur (facultatif). Adresse complète https://, '
  'sous l''une de ses quatre formes : /@pseudo, /channel/UC…, /c/… ou '
  '/user/…. Le formulaire valide la forme avant d''écrire.';

-- ---------------------------------------------------------------------
--  VÉRIFICATION — la colonne est là, et elle est vide.
-- ---------------------------------------------------------------------
--  select count(*) filter (where lien_youtube is not null) as avec_youtube,
--         count(*) as total
--    from public.tatoueurs;
