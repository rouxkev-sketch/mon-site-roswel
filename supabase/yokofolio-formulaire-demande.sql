-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 36 : LE FORMULAIRE DE DEMANDE D'UNE FICHE
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 35
--  (yokofolio-filtres-besoins-rendu.sql).
--
--  POURQUOI. Beaucoup de tatoueurs ne prennent plus les demandes par
--  message : ils renvoient vers un FORMULAIRE hébergé ailleurs — un
--  Google Forms, une page de leur site, un service de réservation —
--  où le client décrit son projet, sa zone, sa taille, ses références.
--  Ce lien n'avait nulle part où aller : il finissait dans la bio, en
--  toutes lettres, non cliquable. Il devient un champ à part entière,
--  au même endroit du formulaire que les réseaux, et au même format
--  sur la fiche publique.
--
--  FACULTATIF, comme TikTok, YouTube et le site : une fiche sans
--  formulaire reste parfaitement valide, et la ligne ne s'affiche tout
--  simplement pas.
--
--  VALIDÉ COMME UNE ADRESSE WEB, et rien de plus : n'importe quel
--  service fait l'affaire, on ne va pas dresser la liste de ceux qu'on
--  accepte. Le formulaire du site vérifie la forme (nom de domaine +
--  extension, chemin libre) et ajoute « https:// » si le tatoueur ne
--  l'a pas écrit, avant d'écrire ici.
--
--  SANS RISQUE : la colonne s'ajoute vide, aucune ligne existante
--  n'est touchée, et le site fonctionne déjà sans elle (le code
--  retombe sur l'ancien jeu de colonnes quand elle manque — voir
--  `colonneAbsente` dans src/lib/tatoueurs.ts).
--  Rejouable sans dommage (`if not exists`).
-- =====================================================================

alter table public.tatoueurs
  add column if not exists formulaire_demande text;

comment on column public.tatoueurs.formulaire_demande is
  'Lien vers le formulaire de demande du tatoueur, hébergé ailleurs '
  '(Google Forms, son propre site, un service de réservation…). '
  'Facultatif. Adresse complète https://, validée comme une adresse '
  'web par le formulaire avant d''être écrite.';

-- ---------------------------------------------------------------------
--  VÉRIFICATION — la colonne est là, et elle est vide.
-- ---------------------------------------------------------------------
--  select count(*) filter (where formulaire_demande is not null)
--           as avec_formulaire,
--         count(*) as total
--    from public.tatoueurs;
