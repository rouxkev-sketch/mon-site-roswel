-- ============================================================
--  YOKOFOLIO — MIGRATION Nº 33
--  Le quatrième mode, le sous-choix « en studio », les horaires
-- ============================================================
--  À PASSER DANS L'ÉDITEUR SQL DE SUPABASE, en une fois.
--  Elle est REJOUABLE : on peut l'exécuter deux fois sans dégât.
--
--  CE QU'ELLE FAIT, ET POURQUOI
--  -----------------------------
--  1) UN QUATRIÈME MODE D'ACTIVITÉ : `prive` (« Studio privé »).
--     « À domicile » et « studio privé » étaient confondus dans une
--     seule case. Ce sont pourtant deux métiers différents : recevoir
--     chez soi, ce n'est pas tenir un lieu fermé au public.
--
--  2) LE SOUS-CHOIX DU MODE « EN STUDIO » : `modes_exercice.role`,
--     qui vaut « fondateur » ou « resident ». « En studio » disait où
--     l'on tatoue, jamais à quel titre — et c'est la première chose
--     qu'un client comprend d'un studio.
--
--  3) LES HORAIRES D'OUVERTURE, sur `studios` : `horaires` (jsonb) et
--     `fuseau` (texte). CHAQUE STUDIO A LES SIENS — une enseigne à
--     Lyon et à Bordeaux n'ouvre pas aux mêmes heures.
--
--  ⚠️ AUCUN LIBELLÉ N'EST TOUCHÉ ICI. Le renommage « salon » →
--  « studio » de cette passe est un changement d'INTERFACE : les
--  valeurs `type_fiche = 'salon'` et `genre = 'salon'` restent telles
--  quelles en base. Ce sont des CLÉS, pas des mots — les renommer
--  casserait les données existantes, les politiques et les adresses
--  de recherche, pour un gain nul : personne ne lit un slug.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LE QUATRIÈME MODE
-- ------------------------------------------------------------
alter table public.modes_exercice
  drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'domicile', 'prive'));

comment on column public.modes_exercice.genre is
  'Le mode d''activité : « salon » (en studio), « guest » (session datée), « domicile » (chez soi / déplacement), « prive » (studio privé, fermé au public). ⚠️ « salon » est une CLÉ HISTORIQUE : l''interface l''affiche « En studio ».';

-- ------------------------------------------------------------
-- 2) LE SOUS-CHOIX : FONDATEUR OU RÉSIDENT
-- ------------------------------------------------------------
alter table public.modes_exercice
  add column if not exists role text;

comment on column public.modes_exercice.role is
  'EN STUDIO uniquement : « fondateur » (il a monté le lieu) ou « resident » (il y a sa place). Null pour tous les autres modes.';

--  LE RATTRAPAGE AVANT LA CONTRAINTE — et il compte.
--  Les modes « en studio » déjà en base n'ont pas de rôle : ils ont
--  été saisis quand la question n'existait pas. Leur affichage disait
--  « Résident chez X » — c'est donc « resident » qu'ils valaient, et
--  c'est ce qu'on inscrit. Sans ce rattrapage, la contrainte
--  ci-dessous refuserait des lignes parfaitement légitimes, et plus
--  aucune de ces fiches ne pourrait être enregistrée.
update public.modes_exercice
   set role = 'resident'
 where genre = 'salon'
   and role is null;

--  UNE VALEUR CONNUE, ET RIEN D'AUTRE.
alter table public.modes_exercice
  drop constraint if exists modes_exercice_role_connu;
alter table public.modes_exercice
  add constraint modes_exercice_role_connu
  check (role is null or role in ('fondateur', 'resident'));

--  LE RÔLE N'A DE SENS QUE POUR « EN STUDIO » — obligatoire là,
--  interdit ailleurs. La règle est la même à l'écran (`modeComplet`
--  dans lib/modes-exercice) et ici : deux règles différentes
--  finiraient par se contredire.
alter table public.modes_exercice
  drop constraint if exists modes_exercice_role_coherent;
alter table public.modes_exercice
  add constraint modes_exercice_role_coherent
  check (
    (genre = 'salon' and role is not null)
    or (genre <> 'salon' and role is null)
  );

-- ------------------------------------------------------------
-- 3) LES HORAIRES D'OUVERTURE D'UN STUDIO
-- ------------------------------------------------------------
--  LA FORME : un tableau de SEPT entrées, du lundi (index 0) au
--  dimanche (index 6). Chaque entrée est un tableau de 0, 1 ou 2
--  plages { "debut": "HH:MM", "fin": "HH:MM" }.
--
--      [ [],                                            -- lundi : fermé
--        [{"debut":"11:00","fin":"19:00"}],             -- mardi
--        …,
--        [{"debut":"10:00","fin":"13:00"},
--         {"debut":"14:00","fin":"18:00"}],             -- samedi, coupure
--        [] ]                                           -- dimanche : fermé
--
--  POURQUOI L'INDEX PLUTÔT QUE LE NOM DU JOUR ? Parce qu'un index ne
--  se traduit pas. Le site sera traduit ; « lundi » deviendrait un
--  boulet, exactement comme les slugs de filtres en anglais.
--
--  POURQUOI PAS UNE TABLE `horaires_studio` ? Parce qu'on ne cherche
--  JAMAIS par horaire — on les lit avec le studio, et seulement là.
--  Une table de plus, c'est une jointure de plus sur chaque fiche,
--  pour un tableau de sept lignes qui ne bouge presque jamais.
alter table public.studios
  add column if not exists horaires jsonb;

comment on column public.studios.horaires is
  'Les horaires d''ouverture : sept entrées (lundi = 0 … dimanche = 6), chacune 0 à 2 plages {debut,fin} en HH:MM, heure LOCALE du studio. Null = rien renseigné (l''accordéon ne s''affiche pas). Facultatif.';

--  LE FUSEAU HORAIRE — sans lui, les horaires ne veulent rien dire.
--  « Ouvert maintenant » n'a de sens que quelque part : un studio de
--  Montréal ne doit pas être annoncé ouvert parce qu'il est 15 h à
--  Paris. Le site le DÉDUIT de l'adresse au moment de
--  l'enregistrement (code pays, puis longitude pour les pays à
--  plusieurs fuseaux — voir src/lib/horaires-studio.ts) et le range
--  ici. Il n'est jamais demandé à la personne : la réponse est déjà
--  dans l'adresse qu'elle vient de saisir.
alter table public.studios
  add column if not exists fuseau text;

comment on column public.studios.fuseau is
  'Le fuseau horaire IANA du studio (« Europe/Paris », « America/Montreal »), déduit de son adresse à l''enregistrement. C''est LUI qui décide de « ouvert maintenant ». Null = on retombe sur Europe/Paris.';

--  UNE FORME PLAUSIBLE, ET RIEN DE PLUS. La colonne est du JSON
--  libre : on vérifie ici qu'elle est bien un TABLEAU DE SEPT
--  entrées, et le code, lui, écarte silencieusement toute plage
--  douteuse à la lecture (`semaineDepuisBase`). Deux filets, parce
--  qu'une donnée bricolée à la main ne doit jamais faire tomber une
--  page publique.
alter table public.studios
  drop constraint if exists studios_horaires_sept_jours;
alter table public.studios
  add constraint studios_horaires_sept_jours
  check (
    horaires is null
    or (jsonb_typeof(horaires) = 'array' and jsonb_array_length(horaires) = 7)
  );

-- ------------------------------------------------------------
-- 4) VÉRIFICATION — à lire après avoir passé la migration
-- ------------------------------------------------------------
--  Les trois colonnes sont-elles là ?
--     select column_name, data_type
--       from information_schema.columns
--      where (table_name = 'modes_exercice' and column_name = 'role')
--         or (table_name = 'studios' and column_name in ('horaires','fuseau'));
--
--  Les modes « en studio » ont-ils tous un rôle ?
--     select role, count(*) from public.modes_exercice
--      where genre = 'salon' group by role;
--     -- attendu : aucune ligne avec role null
--
--  Le quatrième mode est-il accepté ?
--     -- (à ne lancer que sur une fiche d'essai)
--     -- insert into public.modes_exercice (tatoueur_id, genre, latitude, longitude)
--     -- values ('<id>', 'prive', 45.76, 4.83);
