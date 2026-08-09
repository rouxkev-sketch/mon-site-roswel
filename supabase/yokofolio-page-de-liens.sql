-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 46 : LE SITE ET LA PAGE DE LIENS
--                                SE SÉPARENT
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 45
--  (yokofolio-politique-rattachements.sql).
--
--  POURQUOI. Le formulaire n'avait qu'un champ, « Site web, Linktree
--  ou Beacons », écrit dans la colonne `site_web`. Or ce ne sont pas
--  la même chose pour le visiteur : un SITE, on le visite ; une PAGE
--  DE LIENS (Linktree, Beacons), on y cherche un bouton de prise de
--  rendez-vous. Et beaucoup de tatoueurs ont LES DEUX — le champ
--  unique les obligeait à en sacrifier un.
--
--  CE QUE FAIT CE FICHIER
--  -----------------------
--   1. Il ajoute la colonne `page_de_liens`, vide.
--   2. Il DÉMÉNAGE dans cette colonne les valeurs de `site_web` qui
--      SONT déjà des pages de liens — celles dont le domaine est
--      linktr.ee, linktree.com, beacons.ai ou beacons.page. Elles
--      avaient été saisies dans le seul champ disponible ; les
--      laisser sous l'étiquette « Site web » afficherait le mauvais
--      libellé sur la fiche publique.
--
--  ⚠️ CE DÉMÉNAGEMENT NE PERD RIEN. Chaque adresse déplacée est
--  ÉCRITE dans `page_de_liens` AVANT d'être effacée de `site_web`, et
--  les deux gestes tiennent dans UNE SEULE instruction : ou tout
--  passe, ou rien ne bouge. Une fiche qui avait un vrai site le garde
--  intact, à sa place.
--
--  ⚠️ LE CHOIX ASSUMÉ : après cette migration, une fiche qui n'avait
--  qu'un Linktree n'a plus de site web — parce qu'elle n'en avait
--  jamais eu. Elle a une page de liens, ce qu'elle a toujours été.
--
--  SANS RISQUE : une colonne ajoutée, aucune supprimée, aucune ligne
--  effacée. Rejouable sans dommage (`if not exists`, et le
--  déménagement ne trouve plus rien à déplacer au second passage).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LA COLONNE
-- ---------------------------------------------------------------------
alter table public.tatoueurs
  add column if not exists page_de_liens text;

comment on column public.tatoueurs.page_de_liens is
  'Page de liens du tatoueur : Linktree ou Beacons. Facultative, et '
  'DISTINCTE de site_web depuis la migration nº 46 — beaucoup de '
  'tatoueurs ont les deux. Adresse complète https://, validée par le '
  'formulaire, qui refuse ici tout ce qui n''est pas l''un de ces '
  'deux services.';

-- ---------------------------------------------------------------------
-- 2) LE DÉMÉNAGEMENT DES ADRESSES DÉJÀ SAISIES
-- ---------------------------------------------------------------------
--  ⚠️ LA RECONNAISSANCE PORTE SUR LE DOMAINE, jamais sur l'adresse
--  entière — exactement comme dans le code (src/lib/liens-fiche.ts).
--  « mon-site.fr/mon-linktree » RESTE un site : sinon un simple mot
--  dans un chemin suffirait à déplacer l'adresse de quelqu'un.
update public.tatoueurs
   set page_de_liens = site_web,
       site_web = null
 where site_web is not null
   and page_de_liens is null
   and (
     --  Le domaine se lit entre « // » (s'il y a un protocole) et le
     --  premier « / » ou « ? » qui suit. On enlève aussi « www. ».
     regexp_replace(
       regexp_replace(lower(site_web), '^https?://', ''),
       '^(www\.)?([^/?#]+).*$', '\2'
     ) in ('linktr.ee', 'linktree.com', 'beacons.ai', 'beacons.page')
   );

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Fiches avec un site web', (
    select count(*)::text from public.tatoueurs
     where site_web is not null and supprime_le is null)),
  (2, 'Fiches avec une page de liens', (
    select count(*)::text from public.tatoueurs
     where page_de_liens is not null and supprime_le is null)),
  (3, '  dont les deux à la fois', (
    select count(*)::text from public.tatoueurs
     where site_web is not null and page_de_liens is not null
       and supprime_le is null)),
  (4, 'Reste-t-il un Linktree/Beacons rangé en « site » ? (doit être 0)', (
    select count(*)::text from public.tatoueurs
     where site_web is not null
       and regexp_replace(
             regexp_replace(lower(site_web), '^https?://', ''),
             '^(www\.)?([^/?#]+).*$', '\2'
           ) in ('linktr.ee', 'linktree.com', 'beacons.ai', 'beacons.page')))
) as etat(ordre, mesure, valeur)
order by ordre;
