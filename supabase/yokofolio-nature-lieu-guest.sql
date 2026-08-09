-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 41 : SALON OU STUDIO PRIVÉ, POUR UN GUEST
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 40
--  (yokofolio-rayon-domicile.sql).
--
--  CE QU'ELLE AJOUTE : UNE COLONNE, `modes_exercice.nature_lieu`.
--  Une session guest disait OÙ elle avait lieu, jamais DANS QUOI. Le
--  formulaire demandait « le studio qui t'accueille » — un mot qui
--  désignait aussi bien un salon avec vitrine qu'un studio privé sur
--  rendez-vous, et la recherche ramenait les deux mélangés. Le
--  formulaire pose désormais la question EN PREMIER, et la réponse se
--  range ici.
--
--  ⚠️ CE N'EST PAS LE GENRE DU MODE. Le genre reste « guest » dans
--  les deux cas : c'est bien la même chose qu'on fait — aller tatouer
--  ailleurs pendant quelques jours. Ce qui change, c'est la NATURE DE
--  L'ÉTABLISSEMENT VISITÉ. La distinction est exactement celle de
--  `tatoueurs.etablissement` (migration nº 37), et elle emprunte ses
--  deux mots : 'salon' et 'prive'.
--
--  ⚠️ ELLE NE VAUT QUE POUR « GUEST ». Partout ailleurs elle est null,
--  et le formulaire l'écrit ainsi (voir `ecrireModes`) : un artiste
--  résident de son propre salon n'est visiteur de rien.
--
--  CE QU'ELLE NE FAIT PAS : TOUCHER AUX SESSIONS DÉJÀ ENREGISTRÉES.
--  Elles restent à null, et le formulaire les relit comme des séjours
--  EN SALON — c'est le seul sens que « guest » avait avant elle. On
--  n'écrit donc rien en base pour une réponse que personne n'a
--  donnée ; c'est à la lecture qu'on la suppose, et le premier
--  enregistrement la consigne.
--
--  SANS RISQUE : une colonne facultative, aucune ligne modifiée.
--  Rejouable autant de fois qu'on veut.
-- =====================================================================

alter table public.modes_exercice
  add column if not exists nature_lieu text;

comment on column public.modes_exercice.nature_lieu is
  'GUEST uniquement — la nature du lieu qui accueille : ''salon'' ou ''prive'' (même vocabulaire que tatoueurs.etablissement). Null pour tous les autres genres, et null sur les sessions enregistrées avant la migration nº 41 : celles-là se relisent comme des séjours en salon.';

--  LES DEUX VALEURS ADMISES, ou rien.
--  ⚠️ LE GARDE-FOU `if not exists` EST INDISPENSABLE : `add
--  constraint` n'a pas de forme « si absente », et l'éditeur SQL de
--  Supabase exécute TOUT LE FICHIER DANS UNE SEULE TRANSACTION — une
--  erreur ici annulerait aussi la colonne ajoutée plus haut, comme
--  c'est arrivé à la migration nº 37.
do $migration$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'modes_exercice_nature_connue'
  ) then
    alter table public.modes_exercice
      add constraint modes_exercice_nature_connue
      check (nature_lieu is null or nature_lieu in ('salon', 'prive'));
  end if;
end
$migration$;

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
--  ⚠️ UNE SEULE REQUÊTE, ET C'EST VOULU : l'éditeur SQL de Supabase
--  n'affiche QUE LE DERNIER résultat. Plusieurs `select` à la suite,
--  et on ne verrait que le dernier.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Colonne nature_lieu présente', (
    select case when exists (
      select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'modes_exercice'
         and column_name = 'nature_lieu') then 'oui' else 'NON' end)),
  (2, 'Contrainte des deux valeurs posée', (
    select case when exists (
      select 1 from pg_constraint
       where conname = 'modes_exercice_nature_connue') then 'oui' else 'NON' end)),
  (3, 'Sessions guest en tout', (
    select count(*)::text from public.modes_exercice where genre = 'guest')),
  (4, '  dont chez un salon', (
    select count(*)::text from public.modes_exercice
     where genre = 'guest' and nature_lieu = 'salon')),
  (5, '  dont chez un studio privé', (
    select count(*)::text from public.modes_exercice
     where genre = 'guest' and nature_lieu = 'prive')),
  (6, '  dont sans réponse (relues comme « salon »)', (
    select count(*)::text from public.modes_exercice
     where genre = 'guest' and nature_lieu is null)),
  (7, 'Nature posée hors guest (doit être 0)', (
    select count(*)::text from public.modes_exercice
     where genre <> 'guest' and nature_lieu is not null))
) as etat(ordre, mesure, valeur)
order by ordre;
