-- =====================================================================
--  MIGRATION nº 44 — LE RÔLE VAUT AUSSI POUR UN STUDIO PRIVÉ
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 43
--  (yokofolio-fiche-admin-publique.sql).
--
--  CE QU'ELLE FAIT : UNE SEULE CHOSE, ET ELLE N'AJOUTE RIEN.
--  Elle desserre la contrainte `modes_exercice_role_coherent`, posée
--  par la migration nº 33. Aucune colonne, aucun index, aucune
--  fonction : la colonne `role` existe depuis la nº 26.
--
--  POURQUOI. La contrainte disait : « un rôle EST OBLIGATOIRE pour le
--  genre "salon", et INTERDIT partout ailleurs ». Le formulaire ne
--  posait en effet la question qu'en salon — fondateur, ou résident ?
--  Or un STUDIO PRIVÉ se tient très souvent à deux ou trois : ne pas
--  lui poser la question revenait à décider pour lui, et à faire
--  disparaître de sa fiche publique une information que le salon d'à
--  côté affiche.
--
--  ⚠️ LE RÔLE RESTE FACULTATIF POUR « prive », VOLONTAIREMENT.
--  On aurait pu l'exiger, comme pour « salon ». Il aurait alors fallu
--  REMPLIR d'office toutes les lignes déjà en base — c'est-à-dire
--  décider à la place de gens qui n'ont jamais répondu à la question,
--  et l'écrire dans leur fiche. On préfère une contrainte qui accepte
--  le silence : les anciennes lignes restent telles quelles, et le
--  formulaire, lui, pose désormais la question à tout le monde.
--  AUCUNE DONNÉE N'EST DONC MODIFIÉE PAR CE FICHIER — pas un `update`.
--
--  CE QUI NE CHANGE PAS :
--   · « salon » exige toujours un rôle ;
--   · « guest » et « domicile » l'interdisent toujours — un artiste
--     invité quinze jours n'est ni fondateur ni résident ;
--   · les deux seules valeurs admises restent 'fondateur' et
--     'resident' (contrainte `modes_exercice_role_connu`, intacte).
--
--  RELANÇABLE SANS RISQUE : la contrainte est retirée puis reposée.
--  La repasser deux fois de suite ne produit aucune erreur.
-- =====================================================================

--  ⚠️ L'ÉDITEUR SQL DE SUPABASE EXÉCUTE TOUT LE FICHIER DANS UNE SEULE
--  TRANSACTION. Si une ligne échoue, TOUT est annulé — y compris ce
--  qui avait déjà réussi. Un fichier en erreur ne laisse donc rien
--  derrière lui : on corrige, et on repasse.

alter table public.modes_exercice
  drop constraint if exists modes_exercice_role_coherent;

alter table public.modes_exercice
  add constraint modes_exercice_role_coherent
  check (
    --  EN SALON : le rôle est obligatoire (inchangé depuis la nº 33).
    (genre = 'salon' and role is not null)
    --  EN STUDIO PRIVÉ : le rôle est ACCEPTÉ, jamais exigé. C'est la
    --  seule ligne que cette migration ajoute.
    or genre = 'prive'
    --  PARTOUT AILLEURS : aucun rôle. Un guest n'est pas résident du
    --  lieu qui l'accueille, et l'on n'est pas « fondateur » de chez
    --  soi.
    or (genre not in ('salon', 'prive') and role is null)
  );

comment on column public.modes_exercice.role is
  'Fondateur ou résident. OBLIGATOIRE pour le genre ''salon'', FACULTATIF pour ''prive'' (migration nº 44), interdit pour ''guest'' et ''domicile''.';

-- ---------------------------------------------------------------------
--  VÉRIFICATION — à lire après exécution. N''écrit rien.
-- ---------------------------------------------------------------------
select
  case
    when pg_get_constraintdef(oid) like '%prive%'
      then '✅ PASSÉE — un studio privé peut porter un rôle'
    else '❌ MANQUANTE — la contrainte est restée celle de la nº 33'
  end as etat_migration_44
from pg_constraint
where conname = 'modes_exercice_role_coherent';
