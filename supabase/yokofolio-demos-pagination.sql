-- ============================================================
--  YOKOFOLIO — DES FICHES DE DÉMONSTRATION EN NOMBRE
--  (passe nº 214-§3)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--
--  POURQUOI CE FICHIER
--  -------------------
--  Le jeu de démonstration existant tient sur une seule page : le bas
--  de la mosaïque et le bouton « Voir plus de tatoueurs » ne
--  s'affichaient donc jamais, et rien ne permettait de les éprouver.
--  Ce fichier crée SOIXANTE-DOUZE fiches — trois pages pleines de
--  vingt-quatre (CARTES_PAR_PAGE) — pour que la pagination se
--  déclenche deux fois.
--
--  CE QU'ELLES PORTENT, et c'est fait pour éprouver le site :
--   · DEUX STYLES chacune, pris dans une liste tournante — la mosaïque
--     et les filtres ont donc de quoi trier ;
--   · HUIT PHOTOS réparties en TROIS ENSEMBLES (style + catégorie +
--     rendu), dont un de QUATRE photos : c'est celui que la carte
--     montre, et c'est lui qui permet de faire défiler les photos DANS
--     la carte en pleine largeur (nº 211-§5) ;
--   · les deux catégories (réalisation, flash) et les deux rendus
--     (noir et gris, couleur) ;
--   · des villes réelles avec leurs coordonnées, pour que la recherche
--     par lieu et par rayon ait un sens.
--
--  ⚠️ AUCUNE DE CES FICHES N'EXISTE, et aucune de ces images n'est une
--  photo de tatouage : ce sont des aplats de couleur dessinés à la
--  volée (SVG en adresse de données), une couleur par photo — c'est ce
--  qui rend le défilement VISIBLE d'un coup d'œil.
--
--  ⚠️ ELLES SE RECONNAISSENT À LEUR SLUG : toutes commencent par
--  « demo-p214- ». Leur nom commence par « Démo » et leur bio le dit
--  en toutes lettres — on ne peut pas les confondre avec une vraie
--  fiche.
--
--  RELANÇABLE : le fichier efface d'abord ses propres fiches, puis les
--  recrée. Le passer deux fois donne exactement le même résultat.
--
--  POUR LES SUPPRIMER TOUTES, PLUS TARD — une seule ligne :
--
--      delete from public.tatoueurs where slug like 'demo-p214-%';
--
--  (les photos, les studios et tout ce qui pend à ces fiches partent
--  avec elles : les clés étrangères sont en « on delete cascade ».)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 0) ON REPART DE ZÉRO — c'est ce qui rend le fichier relançable.
-- ------------------------------------------------------------
delete from public.tatoueurs where slug like 'demo-p214-%';

-- ------------------------------------------------------------
-- 1) LES SOIXANTE-DOUZE FICHES
-- ------------------------------------------------------------
--  Les listes tournent avec le numéro de la fiche : chacune reçoit
--  deux styles, une ville, un type et une couleur qui lui sont
--  propres, sans qu'on ait à écrire soixante-douze fois la même chose.
with styles(liste) as (
  select array['realisme','fine-line','blackwork','japonais','aquarelle',
               'chicano','geometrique','old-school','dotwork','lettering',
               'neo-traditionnel','abstrait']
),
villes(rang, nom, slug, insee, lat, lon) as (
  values
    (0, 'Paris',     'paris',     '75056', 48.8566,  2.3522),
    (1, 'Lyon',      'lyon',      '69123', 45.7640,  4.8357),
    (2, 'Marseille', 'marseille', '13055', 43.2965,  5.3698),
    (3, 'Bordeaux',  'bordeaux',  '33063', 44.8378, -0.5792),
    (4, 'Lille',     'lille',     '59350', 50.6292,  3.0573),
    (5, 'Nantes',    'nantes',    '44109', 47.2184, -1.5536)
),
fiches as (
  select
    n,
    s.liste[1 + (n % 12)]       as style_un,
    s.liste[1 + ((n + 5) % 12)] as style_deux,
    v.nom, v.slug as ville_slug, v.insee, v.lat, v.lon,
    case when n % 3 = 0 then 'artiste' else 'salon' end as type_fiche
  from generate_series(1, 72) as n
  cross join styles s
  join villes v on v.rang = n % 6
)
insert into public.tatoueurs (
  nom, slug, type_fiche, etablissement,
  ville_code_insee, ville_nom, ville_slug, latitude, longitude,
  pays, code_pays,
  styles, lien_instagram, photo_principale, photos, publie, statut,
  photo_profil, bio
)
select
  'Démo ' || lpad(f.n::text, 2, '0') || ' · ' || f.nom,
  'demo-p214-' || lpad(f.n::text, 2, '0') || '-' || f.ville_slug,
  f.type_fiche,
  --  ⚠️ `etablissement` EST « NOT NULL » (défaut « salon ») : la
  --  nº 215 la croyait nullable pour les artistes, et l'insertion
  --  était refusée. Elle vaut donc « salon » pour tout le monde — sur
  --  une fiche d'artiste, le site ne la lit pas (voir
  --  config/tatouage : natureDeLaFiche).
  'salon',
  f.insee, f.nom, f.ville_slug, f.lat, f.lon,
  'France', 'FR',
  array[f.style_un, f.style_deux],
  'https://www.instagram.com/yokofolio_demo/',
  --  La photo principale : un aplat, comme les photos du portfolio.
  'data:image/svg+xml;charset=utf-8,' ||
    replace(replace(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">'
      '<rect width="1080" height="1350" fill="hsl(' || ((f.n * 37) % 360) ||
      ',38%,42%)"/></svg>', '<', '%3C'), '>', '%3E'),
  '{}'::text[],
  --  « EN LIGNE », C'EST `publie = true` (migration nº 60) — le statut
  --  n'entre pas dans la règle d'affichage. On le pose quand même à
  --  « validee », comme les autres fiches de démonstration : une fiche
  --  sans compte n'a personne pour la faire valider.
  true,
  'validee',
  'data:image/svg+xml;charset=utf-8,' ||
    replace(replace(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">'
      '<rect width="256" height="256" fill="hsl(' || ((f.n * 61) % 360) ||
      ',30%,35%)"/></svg>', '<', '%3C'), '>', '%3E'),
  --  ⚠️ 132 CARACTÈRES, pour une borne à 150 (contrainte
  --  `tatoueurs_bio_longueur`, migration nº 62) : la bio de la nº 214
  --  en faisait 176 et le fichier était refusé.
  'Fiche de DÉMONSTRATION (passe nº 214) : ce tatoueur n''existe pas, '
  'et les images sont des aplats de couleur, jamais de vraies photos.'
from fiches f;

-- ------------------------------------------------------------
-- 2) LEURS PHOTOS — huit par fiche, en trois ensembles
-- ------------------------------------------------------------
--  · rangs 0 à 3 : style un · réalisation · noir et gris  (QUATRE —
--    c'est l'ensemble que la carte montre, et celui qui se fait
--    défiler dans la mosaïque en pleine largeur) ;
--  · rangs 4 et 5 : style un · réalisation · couleur ;
--  · rangs 6 et 7 : style deux · flash · couleur.
insert into public.photos_tatoueur (
  tatoueur_id, style, rendu, nature, url, miniature, ordre
)
select
  t.id,
  case when p.rang < 6 then t.styles[1] else t.styles[2] end,
  case when p.rang < 4 then 'black_and_grey' else 'color' end,
  case when p.rang < 6 then 'tatouage' else 'flash' end,
  'data:image/svg+xml;charset=utf-8,' ||
    replace(replace(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">'
      '<rect width="1080" height="1350" fill="hsl(' ||
      ((abs(hashtext(t.slug) % 100000) + p.rang * 41) % 360) || ',42%,' ||
      (30 + p.rang * 5) || '%)"/>'
      '<text x="540" y="700" font-size="180" fill="white" '
      'text-anchor="middle" font-family="sans-serif">' || (p.rang + 1) ||
      '</text></svg>', '<', '%3C'), '>', '%3E'),
  'data:image/svg+xml;charset=utf-8,' ||
    replace(replace(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400">'
      '<rect width="320" height="400" fill="hsl(' ||
      ((abs(hashtext(t.slug) % 100000) + p.rang * 41) % 360) || ',42%,' ||
      (30 + p.rang * 5) || '%)"/>'
      '<text x="160" y="230" font-size="90" fill="white" '
      'text-anchor="middle" font-family="sans-serif">' || (p.rang + 1) ||
      '</text></svg>', '<', '%3C'), '>', '%3E'),
  p.rang
from public.tatoueurs t
cross join generate_series(0, 7) as p(rang)
where t.slug like 'demo-p214-%';

commit;

-- ------------------------------------------------------------
-- 3) VÉRIFICATION — à lancer après coup, pour voir ce qui est entré.
-- ------------------------------------------------------------
--  select count(*) as fiches from public.tatoueurs
--   where slug like 'demo-p214-%';                       -- attendu : 72
--
--  select count(*) as photos from public.photos_tatoueur p
--    join public.tatoueurs t on t.id = p.tatoueur_id
--   where t.slug like 'demo-p214-%';                     -- attendu : 576
