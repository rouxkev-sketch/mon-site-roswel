-- ============================================================
-- nº 404 — LE RENDU « NOIR » (troisième rendu, et migration)
-- ============================================================
-- LE SITE GAGNE UN TROISIÈME RENDU : « Noir » (`black`), à côté de
-- « Noir et gris » (`black_and_grey`) et « Couleur » (`color`). C'est
-- le rendu des STYLES MONOCHROMES — l'étiquette `monochrome` posée au
-- catalogue par la passe nº 400 (config/tatouage.ts) ; aujourd'hui un
-- seul style la porte : `blackwork`. Cette migration fait deux choses,
-- dans cet ordre :
--  1. ÉLARGIR la contrainte `photos_rendu_connu` pour qu'elle accepte
--     `black` — SANS elle, tout dépôt d'une photo sur un style
--     monochrome est REFUSÉ par la base une fois le site nº 404
--     déployé (le formulaire y écrit `black`) ;
--  2. BASCULER les photos des styles monochromes enregistrées en
--     `black_and_grey` vers `black`. On ne vise PAS une fiche par son
--     nom : on vise TOUTES les photos dont le STYLE est marqué
--     monochrome — aujourd'hui la seule fiche concernée est
--     « Hand In Glove Tattoo », mais la requête reste juste demain.
--
-- ⚠️ L'ORDRE ENTRE MIGRATION ET DÉPLOIEMENT : CETTE MIGRATION D'ABORD,
-- le déploiement ensuite. Entre les deux, l'ancien site n'écrit que
-- `black_and_grey` et `color`, tous deux toujours admis : rien ne
-- casse. Dans l'ordre inverse (site nº 404 déployé, migration pas
-- encore passée), RIEN NE DISPARAÎT — les photos déjà enregistrées
-- restent lisibles et affichées avec leur rendu d'origine — mais
-- DÉPOSER une photo sur un style monochrome échoue (la contrainte
-- refuse `black`), et le formulaire du blackwork montre encore les
-- trois encadrés (ses photos vivent hors de « Noir » : le repli de la
-- nº 400 les protège, il ne cache jamais une photo existante).
--
-- ⚠️ LES PHOTOS `color` D'UN STYLE MONOCHROME (s'il en existe) NE SONT
-- PAS BASCULÉES : le propriétaire a demandé « noir-et-gris vers
-- noir », et requalifier d'office une photo que son artiste a rangée
-- en couleur serait une décision, pas une migration. Le formulaire les
-- montre (les trois encadrés restent tant qu'elles existent), et la
-- requête de vérification (b) les liste.
--
-- ⚠️ LA LISTE `styles_monochromes` EST LA COPIE DE L'ÉTIQUETTE DU
-- CATALOGUE (`monochrome: true`, config/tatouage.ts) : la base ne la
-- connaît pas. Si un style devient monochrome un jour, l'ajouter ici
-- ET dans le catalogue.
--
-- IDEMPOTENTE : rejouable telle quelle — la seconde fois, la
-- contrainte est reposée à l'identique et l'update ne trouve plus une
-- seule ligne.
-- ============================================================

begin;

-- 1) La contrainte connaît « black » — AVANT toute écriture.
alter table public.photos_tatoueur
  drop constraint if exists photos_rendu_connu;
alter table public.photos_tatoueur
  add constraint photos_rendu_connu check (
    rendu in ('black', 'black_and_grey', 'color')
  );

comment on column public.photos_tatoueur.rendu is
  'black | black_and_grey | color — identifiant ANGLAIS figé, OBLIGATOIRE depuis la migration nº 48 ; « black » (le rendu des styles monochromes) depuis la passe nº 404. Le libellé français vit dans le code.';

-- 2) Les photos des styles monochromes passent de « noir et gris » à
--    « noir » — toutes fiches confondues, jamais par nom de fiche.
update public.photos_tatoueur
   set rendu = 'black'
 where style in ('blackwork')          -- = les styles `monochrome: true` du catalogue
   and rendu = 'black_and_grey';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; trois requêtes)
-- ============================================================
-- a) La contrainte porte bien les trois valeurs :
--    select pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname = 'photos_rendu_connu';
--
-- b) Doit rendre 0 ligne — plus une photo de style monochrome en
--    « noir et gris » (les éventuelles lignes restantes seraient des
--    photos `color`, volontairement laissées) :
--    select t.nom, p.rendu, count(*)
--      from public.photos_tatoueur p
--      join public.tatoueurs t on t.id = p.tatoueur_id
--     where p.style in ('blackwork')
--       and p.rendu <> 'black'
--     group by t.nom, p.rendu;
--
-- c) Le résultat de la bascule, fiche par fiche (« Hand In Glove
--    Tattoo » attendue) :
--    select t.nom, count(*) as photos_en_noir
--      from public.photos_tatoueur p
--      join public.tatoueurs t on t.id = p.tatoueur_id
--     where p.style in ('blackwork')
--       and p.rendu = 'black'
--     group by t.nom;
