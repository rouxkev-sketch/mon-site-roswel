-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 55 : LES PORTFOLIOS QUE LA Nº 31 A OUBLIÉS
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 54.
--  Se relance sans risque : elle ne touche QUE les fiches dont le
--  portfolio catalogué est ENTIÈREMENT vide.
--
--  POURQUOI ELLE EXISTE — LE CŒUR QUI NE S'AFFICHAIT NULLE PART
--  -------------------------------------------------------------
--  Le cœur des favoris enregistre UNE PHOTO, pas une fiche : la ligne
--  de `favoris_photos` pointe `photos_tatoueur(id)` (migration nº 53).
--  Une photo qui n'a pas de ligne dans `photos_tatoueur` n'a donc pas
--  d'identité : le site ne peut pas l'enregistrer, et il n'affiche pas
--  un cœur qui échouerait — c'est la règle posée à la passe nº 137.
--
--  Or la REPRISE livrée avec la migration nº 31 ne lisait QU'UNE seule
--  source : la colonne `photos_styles`. Toutes les fiches dont les
--  images vivent dans `photo_principale` (et `photos`) — à commencer
--  par les treize fiches semées par `supabase/tatoueurs.sql`, écrites
--  AVANT que `photos_styles` n'existe — n'ont donc JAMAIS été
--  cataloguées. Leur galerie est vide ; leurs cartes et leurs fiches
--  affichent leurs images (le site retombe sur l'ancien modèle), mais
--  aucune de ces images n'existe en base.
--
--  RÉSULTAT VU DE L'ÉCRAN : aucune carte de la mosaïque ne porte de
--  cœur, et seules les fiches dont le portfolio a VRAIMENT été déposé
--  par le formulaire en portent un. C'est exactement le défaut
--  constaté. Cette migration finit le travail de la nº 31.
--
--  CE QU'ELLE ÉCRIT, ET RIEN DE PLUS
--  ----------------------------------
--  UNE LIGNE PAR STYLE DÉCLARÉ, avec l'image que la fiche montre déjà
--  pour ce style — `photos_styles[style]` s'il y en a une, sinon
--  `photo_principale`. C'est MOT POUR MOT ce que le site affiche
--  aujourd'hui (voir `galerieParStyles`, branche « ancien modèle » de
--  src/lib/photo-tatoueur.ts) : après la migration, la même fiche
--  montre les mêmes images, dans le même ordre. Rien ne bouge à
--  l'écran — sauf le cœur, qui apparaît.
--
--  ⚠️ LE RENDU EST OBLIGATOIRE, ET C'EST TOUT LE SUJET DE CETTE
--  VERSION-CI. La première mouture de ce fichier laissait `rendu` à
--  NULL, « pour ne rien inventer ». Elle ne pouvait pas passer : la
--  migration nº 48 a rendu la colonne NOT NULL et l'a bornée à deux
--  valeurs (`black_and_grey`, `color`). Une photo SANS rendu n'existe
--  plus — il n'y a pas de troisième case « on ne sait pas ».
--
--      ERROR: 23502: null value in column "rendu" of relation
--      "photos_tatoueur" violates not-null constraint
--
--  IL FAUT DONC CHOISIR, et le choix est `black_and_grey` :
--   · c'est le rendu MAJORITAIRE du tatouage, donc celui qui se
--     trompe le moins souvent ;
--   · il ne fait entrer AUCUNE fiche dans un résultat où elle n'a
--     rien à faire : chercher « Couleur » ne remontera pas ces
--     photos-là. Le défaut inverse — tout marquer « color » — aurait
--     fait apparaître des photos en noir et gris dans une recherche
--     de couleur, c'est-à-dire le « mensonge d'affichage » que le
--     moteur combat depuis la passe nº 110 ;
--   · il se corrige d'un geste : le tatoueur rouvre son portfolio et
--     retague ses photos, et la requête de la fin de ce fichier
--     permet de rectifier un lot d'un coup si besoin.
--  Ce choix est INEXACT pour les quelques images de démonstration qui
--  sont en couleur. C'est assumé : sans lui, il n'y a pas de cœur
--  du tout.
--
--  ⚠️ ON N'INVENTE RIEN D'AUTRE. `nature` prend son défaut
--  (« tatouage »), qui est déjà ce que le code lit pour une nature
--  absente (migration nº 49). `miniature` reste nul : on retombe sur
--  la pleine résolution, exactement comme aujourd'hui.
--
--  ⚠️ UNE FICHE SANS AUCUN STYLE DÉCLARÉ N'EST PAS TOUCHÉE. Il n'y
--  aurait aucun style honnête à écrire, et `photos_tatoueur.style`
--  est obligatoire. Sa galerie reste vide, et son cœur absent : c'est
--  la seule situation qui subsiste après cette migration, et elle se
--  règle en déclarant un style sur la fiche.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) L'ÉTAT AVANT — à lire, puis à comparer avec le point 3
-- ---------------------------------------------------------------------
do $etat$
declare
  vides integer;
begin
  select count(*) into vides
    from public.tatoueurs t
   where cardinality(t.styles) > 0
     and not exists (
       select 1 from public.photos_tatoueur p where p.tatoueur_id = t.id
     );
  raise notice 'Fiches à cataloguer (galerie vide, au moins un style) : %', vides;
end
$etat$;

-- ---------------------------------------------------------------------
-- 2) LA REPRISE — une ligne par style déclaré
-- ---------------------------------------------------------------------
--  L'ORDRE reprend celui des styles de la fiche : la photo de rang 0
--  est donc celle du premier style déclaré, c'est-à-dire exactement la
--  vignette que les cartes montrent aujourd'hui.
--
--  LA CONDITION QUI REND LA MIGRATION SÛRE : `not exists (… p.tatoueur_id
--  = t.id)`. On ne touche QUE les fiches sans AUCUNE photo cataloguée.
--  Un portfolio déposé par son tatoueur — même incomplet, même à un
--  seul style — n'est jamais complété d'office par cette migration, et
--  relancer le fichier ne crée aucun doublon.
insert into public.photos_tatoueur (tatoueur_id, style, url, ordre, rendu)
select t.id,
       s.style,
       coalesce(
         nullif(t.photos_styles ->> s.style, ''),
         nullif(t.photo_principale, '')
       ),
       s.rang - 1,
       --  LE RENDU PAR DÉFAUT — voir l'en-tête : la colonne est
       --  obligatoire depuis la nº 48, et « noir et gris » est le
       --  choix qui se trompe le moins.
       'black_and_grey'
  from public.tatoueurs t
  cross join lateral unnest(t.styles) with ordinality as s(style, rang)
 where not exists (
         select 1 from public.photos_tatoueur p where p.tatoueur_id = t.id
       )
   and coalesce(
         nullif(t.photos_styles ->> s.style, ''),
         nullif(t.photo_principale, '')
       ) is not null;

-- ---------------------------------------------------------------------
-- 3) L'ÉTAT APRÈS — ce qui reste sans cœur, et pourquoi
-- ---------------------------------------------------------------------
do $bilan$
declare
  catalogues integer;
  sans_style integer;
begin
  select count(*) into catalogues from public.photos_tatoueur;
  select count(*) into sans_style
    from public.tatoueurs t
   where not exists (
       select 1 from public.photos_tatoueur p where p.tatoueur_id = t.id
     );
  raise notice 'Photos cataloguées en tout : %', catalogues;
  raise notice 'Fiches encore sans photo cataloguée (aucun style déclaré) : %', sans_style;
end
$bilan$;

-- ---------------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à passer après coup
-- ---------------------------------------------------------------------
--  -- Les fiches publiées qui n'ont toujours pas de photo cataloguée :
--  -- ce sont les SEULES dont les cartes n'auront pas de cœur.
--  select t.slug, t.nom, cardinality(t.styles) as styles
--    from public.tatoueurs t
--   where t.publie = true
--     and not exists (
--       select 1 from public.photos_tatoueur p where p.tatoueur_id = t.id
--     )
--   order by t.nom;
--
--  -- Le portfolio d'une fiche reprise, dans l'ordre :
--  select p.style, p.rendu, p.nature, p.ordre, p.url
--    from public.photos_tatoueur p
--    join public.tatoueurs t on t.id = p.tatoueur_id
--   where t.slug = 'atelier-corvus'
--   order by p.ordre;
--
--  -- CORRIGER LE RENDU d'une photo reprise à tort (une, ou un lot) :
--  update public.photos_tatoueur
--     set rendu = 'color'
--   where url like '%/nom-du-fichier%';
