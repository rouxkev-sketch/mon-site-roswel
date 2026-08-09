--  ====================================================================
--  YOKOFOLIO — LES LIENS LIBRES DU PROFIL (migration nº 51)
--  ====================================================================
--  LA PASSE Nº 116 A REFAIT LES LIENS DU FORMULAIRE : les champs
--  « Site web » et « Linktree » ont disparu, remplacés par DEUX
--  EMPLACEMENTS LIBRES — une URL et un TITRE choisi par le tatoueur
--  (« Mon book », « Prendre RDV »…), 16 caractères au plus. Plus
--  aucun service n'est deviné : le titre appartient à la personne.
--
--  CE QUE CETTE MIGRATION FAIT, ET RIEN D'AUTRE :
--   · deux colonnes NOUVELLES sur `tatoueurs` — `titre_site_web` et
--     `titre_page_de_liens` — qui portent les titres des deux
--     emplacements ;
--   · une contrainte de longueur sur chacune (1 à 16 caractères),
--     la même borne que le champ du formulaire.
--
--  ⚠️ LES COLONNES HISTORIQUES NE BOUGENT PAS. `site_web` et
--  `page_de_liens` continuent de porter les URL : le premier
--  emplacement s'écrit dans la première, le second dans la seconde.
--  Aucune fiche existante ne casse, aucune clé ne change.
--
--  ⚠️ AUCUN REMPLISSAGE DES TITRES EXISTANTS, ET C'EST VOULU. Une
--  fiche d'avant cette migration garde ses titres à NULL : le site
--  affiche alors EXACTEMENT ce qu'il affichait déjà (le nom du
--  service — « Linktree », « Beacons » — ou le domaine du site, via
--  `libelleDuLien`). Écrire « Site web » en dur dans la colonne
--  aurait CHANGÉ l'affichage des fiches en ligne sans que leurs
--  propriétaires aient rien demandé. Les titres se remplissent au
--  premier enregistrement du formulaire, par la personne elle-même.
--
--  Idempotente : rejouable sans dégât.
--  ====================================================================

alter table public.tatoueurs
  add column if not exists titre_site_web text,
  add column if not exists titre_page_de_liens text;

comment on column public.tatoueurs.titre_site_web is
  'Le titre du premier lien libre (passe nº 116) — choisi par le '
  'tatoueur, 16 caractères au plus. Null : l''affichage retombe sur '
  'le libellé historique (service ou domaine).';

comment on column public.tatoueurs.titre_page_de_liens is
  'Le titre du second lien libre (passe nº 116) — même règle que le '
  'premier.';

--  LA MÊME BORNE QUE LE CHAMP : de 1 à 16 caractères, ou rien. Un
--  titre vide n'existe pas — le formulaire refuse un lien sans titre.
alter table public.tatoueurs
  drop constraint if exists tatoueurs_titre_site_web_longueur;
alter table public.tatoueurs
  add constraint tatoueurs_titre_site_web_longueur
  check (titre_site_web is null
         or char_length(titre_site_web) between 1 and 16);

alter table public.tatoueurs
  drop constraint if exists tatoueurs_titre_page_de_liens_longueur;
alter table public.tatoueurs
  add constraint tatoueurs_titre_page_de_liens_longueur
  check (titre_page_de_liens is null
         or char_length(titre_page_de_liens) between 1 and 16);

--  --------------------------------------------------------------------
--  LE CONTRÔLE FINAL — deux colonnes, deux contraintes.
--  --------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'tatoueurs'
      and column_name in ('titre_site_web', 'titre_page_de_liens'))
    as colonnes_attendues_2,
  (select count(*) from pg_constraint
    where conname in ('tatoueurs_titre_site_web_longueur',
                      'tatoueurs_titre_page_de_liens_longueur'))
    as contraintes_attendues_2;
