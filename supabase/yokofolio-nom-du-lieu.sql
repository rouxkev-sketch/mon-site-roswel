-- ============================================================
-- YOKOFOLIO — LE NOM DU LIEU NON INSCRIT (passe nº 266, §1)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  Une colonne, `modes_exercice.nom_lieu` : le NOM du salon ou du
--  studio où l'artiste travaille QUAND CE LIEU N'A PAS SON PORTFOLIO
--  sur YokoFolio. Jusqu'ici, un mode saisi à la main portait une
--  adresse et rien d'autre : la fiche disait OÙ l'on travaille sans
--  dire CHEZ QUI.
--
--  ⚠️ ELLE NE VAUT QUE POUR LES LIEUX SANS FICHE. Un lieu trouvé par
--  la recherche porte déjà son nom — celui de sa fiche, lu depuis
--  elle (`salon_id`), jamais recopié : c'est la leçon de la nº 265,
--  et cette colonne ne la défait pas. Le formulaire écrit donc
--  `nom_lieu` seulement là où `salon_id` est nul.
--
--  ⚠️ FACULTATIVE POUR LA BASE, OBLIGATOIRE À L'ÉCRAN : la colonne
--  accepte NULL (les lignes déjà enregistrées restent valables, et
--  celles qui pointent une fiche n'en ont pas besoin) ; c'est le
--  formulaire qui exige le nom là où il pose la question — « Je
--  confirme mon choix » n'aboutit pas sans lui.
--
--  ⚠️ AUCUNE VERSION DU SITE N'EN DÉPEND : tant que cette migration
--  n'est pas passée, l'enregistrement retire la colonne inconnue et
--  le reste part normalement (lib/enregistrer-exercice).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans.

alter table public.modes_exercice
  add column if not exists nom_lieu text;

comment on column public.modes_exercice.nom_lieu is
  'Nom du salon / studio quand ce lieu n''a pas de fiche sur YokoFolio (salon_id nul). Lu depuis la fiche du lieu dans le cas contraire — jamais recopié.';

-- LE RELEVÉ, à lire dans le panneau de résultats : la colonne existe.
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'modes_exercice'
   and column_name = 'nom_lieu';
