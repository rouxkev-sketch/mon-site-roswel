-- ============================================================
--  YOKOFOLIO — CINQ FICHES DE DÉMONSTRATION HORS DE FRANCE
--  (migration nº 20 — à passer APRÈS yokofolio-localisation-mondiale.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : chaque fiche est insérée par son slug,
--  et une fiche déjà présente est simplement mise à jour.
--
--  POURQUOI CE FICHIER
--  -------------------
--  Depuis la refonte de la localisation, on peut CHERCHER un pays ou
--  une région entière. Mais la base ne contenait que des fiches
--  françaises : chercher « Allemagne » ou « Texas » rendait une page
--  vide — non par bug, mais faute de fiche à trouver. Impossible,
--  dans ces conditions, de vérifier que la recherche mondiale marche.
--
--  Ces cinq fiches couvrent exactement les cas attendus :
--     Allemagne (Berlin + Bavière), Espagne, Texas, Canada.
--  Elles sont les MÊMES que celles du code (src/lib/tatoueurs-demo.ts).
--
--  ⚠️ AUCUN DE CES TATOUEURS N'EXISTE : noms, adresses et comptes
--  sont inventés, et les images sont des aplats de couleur dessinés
--  par le site. Rien n'est emprunté à un vrai tatoueur.
--
--  À SUPPRIMER quand de vraies fiches étrangères existeront :
--     delete from public.tatoueurs where slug in
--       ('kreuzberg-nadel','isar-studio','tinta-gotica',
--        'lone-star-ink','atelier-boreal');
--
--  CE QUI FAIT MARCHER LA RECHERCHE PAR PAYS ET PAR RÉGION
--  -------------------------------------------------------
--  Deux colonnes, et rien d'autre :
--    * `code_pays` — le code ISO à deux lettres (DE, ES, US, CA) :
--      c'est LUI que la recherche compare quand on choisit un pays ;
--    * `region`    — le nom de l'État, du Land, de la province :
--      c'est LUI que la recherche compare quand on choisit une région.
--  Aucune liste de pays n'est écrite dans le code : ces valeurs
--  viennent du géocodeur au moment où le tatoueur choisit son lieu.
--  Pour ces fiches de démonstration, elles sont écrites à la main,
--  telles que le géocodeur les rend en français.
-- ============================================================

insert into public.tatoueurs
  (nom, slug, adresse, code_postal, bio, site_web,
   region, pays, code_pays, lieu_id,
   ville_nom, ville_slug, latitude, longitude,
   styles, filtres_technique, filtres_composition,
   lien_instagram, lien_tiktok, photos_styles,
   photo_principale, photos, publie)
values
  ('Kreuzberg Nadel', 'kreuzberg-nadel', '12 Oranienstraße', '10999',
   'Studio de Kreuzberg : blackwork épais, trames et lettrages. On dessine avec toi, on pique proprement, on t''explique tout avant.',
   'https://kreuzberg-nadel.de',
   'Berlin', 'Allemagne', 'DE', 'demo:berlin',
   'Berlin', 'berlin', 52.5163, 13.4225,
   array['blackwork','lettering','ignorant-style']::text[],
   array['machine','handpoke']::text[],
   array['petit-tatouage']::text[],
   'https://www.instagram.com/kreuzberg.nadel.demo/',
   'https://www.tiktok.com/@kreuzberg.nadel.demo',
   '{"blackwork":"/images-demo/tatouage/blackwork-1.svg","lettering":"/images-demo/tatouage/lettering-2.svg","ignorant-style":"/images-demo/tatouage/ignorant-style-3.svg"}'::jsonb,
   '/images-demo/tatouage/blackwork-1.svg',
   array['/images-demo/tatouage/lettering-2.svg']::text[], true),

  ('Isar Studio', 'isar-studio', '7 Sendlinger Straße', '80331',
   'Fine line et floral en plein cœur de Munich. Rendez-vous calmes, projets sur mesure, et un dessin validé ensemble avant la séance.',
   null,
   'Bavière', 'Allemagne', 'DE', 'demo:munich',
   'Munich', 'munich', 48.1351, 11.5820,
   array['fine-line','floral','minimaliste']::text[],
   array['machine']::text[],
   array['petit-tatouage']::text[],
   'https://www.instagram.com/isar.studio.demo/',
   null,
   '{"fine-line":"/images-demo/tatouage/fine-line-1.svg","floral":"/images-demo/tatouage/floral-2.svg","minimaliste":"/images-demo/tatouage/minimaliste-3.svg"}'::jsonb,
   '/images-demo/tatouage/fine-line-1.svg',
   array['/images-demo/tatouage/floral-2.svg']::text[], true),

  ('Tinta Gòtica', 'tinta-gotica', '24 Carrer de Verdi', '08012',
   'Atelier de Gràcia : néo-traditionnel coloré et vieille école. On parle français, catalan et espagnol — viens avec ton idée, on la dessine.',
   'https://tintagotica.es',
   'Catalogne', 'Espagne', 'ES', 'demo:barcelone',
   'Barcelone', 'barcelone', 41.4036, 2.1568,
   array['neo-traditionnel','old-school','illustratif']::text[],
   array['machine']::text[],
   array['sleeve','patchwork']::text[],
   'https://www.instagram.com/tinta.gotica.demo/',
   'https://www.tiktok.com/@tinta.gotica.demo',
   '{"neo-traditionnel":"/images-demo/tatouage/neo-traditionnel-1.svg","old-school":"/images-demo/tatouage/old-school-2.svg","illustratif":"/images-demo/tatouage/illustratif-3.svg"}'::jsonb,
   '/images-demo/tatouage/neo-traditionnel-1.svg',
   array['/images-demo/tatouage/old-school-2.svg']::text[], true),

  ('Lone Star Ink', 'lone-star-ink', '1104 South Congress Avenue', '78704',
   'Réalisme noir et gris et grandes pièces, sur South Congress. Séances longues, devis clair, et un dessin retravaillé jusqu''à ce qu''il te plaise.',
   null,
   'Texas', 'États-Unis', 'US', 'demo:austin',
   'Austin', 'austin', 30.2504, -97.7492,
   array['realisme','blackwork','trash-polka']::text[],
   array['machine']::text[],
   array['sleeve']::text[],
   'https://www.instagram.com/lone.star.ink.demo/',
   'https://www.tiktok.com/@lone.star.ink.demo',
   '{"realisme":"/images-demo/tatouage/realisme-1.svg","blackwork":"/images-demo/tatouage/blackwork-2.svg","trash-polka":"/images-demo/tatouage/trash-polka-3.svg"}'::jsonb,
   '/images-demo/tatouage/realisme-1.svg',
   array['/images-demo/tatouage/trash-polka-3.svg']::text[], true),

  ('Atelier Boréal', 'atelier-boreal', '5412 boulevard Saint-Laurent', 'H2T 1S1',
   'Sur le Plateau, entre géométrie et dotwork. On travaille au rendez-vous, on prend le temps du dessin, et on répond en français.',
   'https://atelierboreal.ca',
   'Québec', 'Canada', 'CA', 'demo:montreal',
   'Montréal', 'montreal', 45.5254, -73.5955,
   array['geometrique','dotwork','fine-line']::text[],
   array['handpoke','machine']::text[],
   array['petit-tatouage','sleeve']::text[],
   'https://www.instagram.com/atelier.boreal.demo/',
   null,
   '{"geometrique":"/images-demo/tatouage/geometrique-1.svg","dotwork":"/images-demo/tatouage/dotwork-2.svg","fine-line":"/images-demo/tatouage/fine-line-3.svg"}'::jsonb,
   '/images-demo/tatouage/geometrique-1.svg',
   array['/images-demo/tatouage/dotwork-2.svg']::text[], true)

on conflict (slug) do update set
  nom                  = excluded.nom,
  adresse              = excluded.adresse,
  code_postal          = excluded.code_postal,
  bio                  = excluded.bio,
  site_web             = excluded.site_web,
  region               = excluded.region,
  pays                 = excluded.pays,
  code_pays            = excluded.code_pays,
  lieu_id              = excluded.lieu_id,
  ville_nom            = excluded.ville_nom,
  ville_slug           = excluded.ville_slug,
  latitude             = excluded.latitude,
  longitude            = excluded.longitude,
  styles               = excluded.styles,
  filtres_technique    = excluded.filtres_technique,
  filtres_composition  = excluded.filtres_composition,
  lien_instagram       = excluded.lien_instagram,
  lien_tiktok          = excluded.lien_tiktok,
  photos_styles        = excluded.photos_styles,
  photo_principale     = excluded.photo_principale,
  photos               = excluded.photos,
  publie               = excluded.publie;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — trois questions, trois réponses
-- ------------------------------------------------------------
--  Ce que la recherche fait, en SQL, pour les mêmes critères :
--
--  -- « Allemagne » (mode PAYS) → doit rendre 2 fiches
--  select nom, ville_nom from public.tatoueurs
--   where publie and upper(code_pays) = 'DE';
--
--  -- « Bavière » (mode RÉGION) → doit rendre 1 fiche
--  select nom, ville_nom from public.tatoueurs
--   where publie and upper(code_pays) = 'DE' and region = 'Bavière';
--
--  -- Combien de pays sont représentés ?
--  select code_pays, count(*) from public.tatoueurs
--   where publie group by code_pays order by 2 desc;
