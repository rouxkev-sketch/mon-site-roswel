-- ============================================================
-- nº 405 — LE TITRE D'UN LIEN LIBRE PASSE À 30 CARACTÈRES
-- ============================================================
-- LE SITE PORTE LE PLAFOND DE 16 À 30 (voir TITRE_LIEN_MAXIMUM,
-- components/LienLibre.tsx). LA BASE LE BORNE AUSSI : la migration
-- nº 51 (`yokofolio-liens-libres.sql`) a posé deux contraintes
-- `char_length(...) between 1 and 16` sur les colonnes qui portent ces
-- titres. Sans cette migration, un titre de 17 caractères et plus est
-- REFUSÉ PAR LA BASE au moment d'enregistrer la fiche.
--
-- ⚠️ L'ORDRE : CETTE MIGRATION D'ABORD, LE DÉPLOIEMENT ENSUITE.
--  · migration passée, ancien site déployé → il ne propose que 16
--    caractères, tous acceptés : rien ne casse, rien ne change ;
--  · site nº 405 déployé, migration PAS passée → tout se saisit
--    normalement, mais « Enregistrer » ÉCHOUE dès qu'un titre dépasse
--    16 caractères. Rien n'est perdu (la fiche n'est pas écrite), mais
--    le formulaire ne peut plus être validé tant que le titre est
--    long — c'est exactement le piège rencontré à la nº 387 avec la
--    bio.
--
-- ⚠️ AUCUNE DONNÉE N'EST TOUCHÉE : on ÉLARGIT une borne, on ne
-- réécrit aucune ligne. Tous les titres déjà enregistrés (16
-- caractères au plus) satisfont évidemment la nouvelle contrainte.
-- Le minimum de 1 reste : un titre vide n'a jamais de sens — c'est
-- `null` qui dit « pas de lien ».
--
-- IDEMPOTENTE : rejouable telle quelle, sans effet la seconde fois.
-- ============================================================

begin;

-- 1) LE TITRE DU SITE WEB.
alter table public.tatoueurs
  drop constraint if exists tatoueurs_titre_site_web_longueur;
alter table public.tatoueurs
  add constraint tatoueurs_titre_site_web_longueur
  check (titre_site_web is null
         or char_length(titre_site_web) between 1 and 30);

-- 2) LE TITRE DE LA PAGE DE LIENS.
alter table public.tatoueurs
  drop constraint if exists tatoueurs_titre_page_de_liens_longueur;
alter table public.tatoueurs
  add constraint tatoueurs_titre_page_de_liens_longueur
  check (titre_page_de_liens is null
         or char_length(titre_page_de_liens) between 1 and 30);

comment on column public.tatoueurs.titre_site_web is
  'Le mot que la fiche affiche à la place de l''URL du site — 1 à 30 caractères (30 depuis la passe nº 405, 16 auparavant). Null = aucun lien de site.';
comment on column public.tatoueurs.titre_page_de_liens is
  'Le mot que la fiche affiche à la place de l''URL de la page de liens — 1 à 30 caractères (30 depuis la passe nº 405, 16 auparavant). Null = aucune page de liens.';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; deux requêtes)
-- ============================================================
-- a) Les deux définitions doivent porter « 30 » :
--    select conname, pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname in ('tatoueurs_titre_site_web_longueur',
--                       'tatoueurs_titre_page_de_liens_longueur');
--
-- b) Le plus long titre enregistré, pour mémoire (aucune ligne ne
--    peut dépasser 30 une fois la contrainte posée) :
--    select max(char_length(titre_site_web))       as site_max,
--           max(char_length(titre_page_de_liens))  as liens_max
--      from public.tatoueurs;
