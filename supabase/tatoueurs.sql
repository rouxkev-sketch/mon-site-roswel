-- ============================================================
--  YOKOFOLIO — L'INDEX DES TATOUEURS (création de la table)
-- ============================================================
--  ⚠️ CE FICHIER NE SUFFIT PLUS À LUI SEUL.
--  Passer ENSUITE supabase/yokofolio-photos-par-style.sql, qui ajoute
--  la photo par style et le lien TikTok. Sans lui, le site tourne
--  quand même (une seule photo par tatoueur), mais la règle « une
--  photo par style » ne s'applique pas.
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Réexécutable sans danger : la table n'est créée que si elle
--  n'existe pas, et les douze tatoueurs de démonstration sont
--  réinsérés SANS doublon (leur `slug` est unique).
--
--  CE QUE ÇA CRÉE
--  --------------
--   1. la table `tatoueurs` ;
--   2. la colonne `tatoueur_id` dans la table `favoris` déjà en
--      place (le cœur de la fiche tatoueur écrit dedans) ;
--   3. douze tatoueurs de DÉMONSTRATION.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien du projet artisans : ni la table `artisans`, ni
--  `artisans_prospects`, ni `communes`, ni aucune de leurs règles.
--  Les pages artisans continuent de fonctionner exactement pareil.
--
--  ⚠️ LES DOUZE TATOUEURS SONT INVENTÉS
--  Aucun n'existe, et leurs images sont de simples aplats de
--  couleur portant le nom du style (dessinés par le site, à
--  l'adresse /images-demo/tatouage/…). Le travail d'un tatoueur lui
--  appartient : AUCUNE vraie photo de tatouage n'est publiée sans
--  l'accord de son auteur. Ces douze lignes se suppriment d'un coup :
--      delete from tatoueurs where slug like '%' and id in (
--        select id from tatoueurs order by cree_le limit 12);
--  (ou plus simplement, une par une depuis l'éditeur de tables).
-- ============================================================

create table if not exists tatoueurs (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),

  -- L'IDENTITÉ
  nom text not null,
  -- Le slug fait l'adresse de la fiche (/tatoueur/atelier-corvus) :
  -- unique, et à ne plus changer une fois la page indexée.
  slug text not null unique,

  -- LA VILLE. Le code INSEE relie à la table `communes` déjà en
  -- place ; le nom et le slug sont recopiés ici pour que l'affichage
  -- d'une carte ne demande pas une seconde lecture.
  ville_code_insee text not null,
  ville_nom text not null,
  ville_slug text not null,
  -- Les coordonnées servent à la recherche par rayon (même formule
  -- de distance que les artisans — voir src/lib/geo.ts).
  latitude double precision not null,
  longitude double precision not null,

  -- LES STYLES : SANS LIMITE — un tatoueur peut couvrir tous les
  -- styles du site. Ce qui est limité, c'est la photo : une par style
  -- (voir yokofolio-photos-par-style.sql).
  styles text[] not null default '{}'::text[],

  -- LE PORTFOLIO
  lien_instagram text not null,
  photo_principale text not null,
  photos text[] not null default '{}'::text[],

  -- La fiche n'est visible que si elle est publiée.
  publie boolean not null default false
);

create index if not exists idx_tatoueurs_ville on tatoueurs (ville_slug);
create index if not exists idx_tatoueurs_styles on tatoueurs using gin (styles);
create index if not exists idx_tatoueurs_publie on tatoueurs (publie);

-- ------------------------------------------------------------
--  SÉCURITÉ : lecture publique des fiches PUBLIÉES, et rien d'autre
-- ------------------------------------------------------------
--  Une fiche publiée est faite pour être vue : le site la lit sans
--  connexion. Tout le reste (écriture, fiches non publiées) passe par
--  la clé secrète du serveur, qui n'est soumise à aucune règle.
alter table tatoueurs enable row level security;

drop policy if exists "lecture publique des tatoueurs publies" on tatoueurs;
create policy "lecture publique des tatoueurs publies"
  on tatoueurs for select
  using (publie = true);

-- ------------------------------------------------------------
--  LES FAVORIS : une colonne de plus, rien de retiré
-- ------------------------------------------------------------
--  La table `favoris` existe déjà et porte `artisan_id`. On lui
--  ajoute `tatoueur_id`, NULLABLE : une ligne de favori concerne
--  soit un artisan, soit un tatoueur. Les favoris déjà enregistrés
--  ne sont pas touchés.
alter table favoris
  add column if not exists tatoueur_id uuid references tatoueurs(id) on delete cascade;

create index if not exists idx_favoris_tatoueur on favoris (tatoueur_id);

-- Un même visiteur ne met un tatoueur en favori qu'une fois.
create unique index if not exists idx_favoris_particulier_tatoueur
  on favoris (particulier_id, tatoueur_id)
  where tatoueur_id is not null;

-- ============================================================
--  LES TREIZE TATOUEURS DE DÉMONSTRATION (tous inventés)
-- ============================================================
--  Répartis sur huit villes (Lyon, Villeurbanne, Marseille, Paris,
--  Bordeaux, Nantes, Toulouse, Lille, Strasbourg) et sur les dix
--  styles, pour que la recherche par style, par ville et par rayon
--  soit vérifiable dès la première minute.
insert into tatoueurs
  (nom, slug, ville_code_insee, ville_nom, ville_slug, latitude, longitude,
   styles, lien_instagram, photo_principale, photos, publie)
values
  ('Atelier Corvus', 'atelier-corvus', '69381', 'Lyon 1er', 'lyon-1er', 45.7679, 4.8343, array['blackwork', 'geometrique']::text[], 'https://www.instagram.com/atelier.corvus.demo/', '/images-demo/tatouage/blackwork-1.svg', array['/images-demo/tatouage/blackwork-2.svg', '/images-demo/tatouage/geometrique-1.svg']::text[], true),
  ('Studio Mille Traits', 'studio-mille-traits', '69386', 'Lyon 6e', 'lyon-6e', 45.7714, 4.8497, array['fine-line', 'minimaliste', 'floral']::text[], 'https://www.instagram.com/mille.traits.demo/', '/images-demo/tatouage/fine-line-1.svg', array['/images-demo/tatouage/minimaliste-1.svg', '/images-demo/tatouage/floral-1.svg', '/images-demo/tatouage/fine-line-2.svg']::text[], true),
  ('Nadège Roux', 'nadege-roux', '69266', 'Villeurbanne', 'villeurbanne', 45.7719, 4.8902, array['realisme']::text[], 'https://www.instagram.com/nadege.roux.demo/', '/images-demo/tatouage/realisme-1.svg', array['/images-demo/tatouage/realisme-2.svg']::text[], true),
  ('Encre & Sel', 'encre-et-sel', '13201', 'Marseille 1er', 'marseille-1er', 43.2988, 5.3796, array['old-school', 'neo-traditionnel']::text[], 'https://www.instagram.com/encre.et.sel.demo/', '/images-demo/tatouage/old-school-1.svg', array['/images-demo/tatouage/neo-traditionnel-1.svg', '/images-demo/tatouage/old-school-2.svg']::text[], true),
  ('Hokusai Mécanique', 'hokusai-mecanique', '75111', 'Paris 11e', 'paris-11e', 48.8594, 2.3765, array['japonais', 'blackwork']::text[], 'https://www.instagram.com/hokusai.mecanique.demo/', '/images-demo/tatouage/japonais-1.svg', array['/images-demo/tatouage/japonais-2.svg', '/images-demo/tatouage/blackwork-1.svg']::text[], true),
  ('Camille Fauve', 'camille-fauve', '75118', 'Paris 18e', 'paris-18e', 48.8925, 2.3444, array['floral', 'fine-line']::text[], 'https://www.instagram.com/camille.fauve.demo/', '/images-demo/tatouage/floral-1.svg', array['/images-demo/tatouage/fine-line-1.svg']::text[], true),
  ('Typo Sauvage', 'typo-sauvage', '33063', 'Bordeaux', 'bordeaux', 44.8378, -0.5792, array['lettering', 'old-school']::text[], 'https://www.instagram.com/typo.sauvage.demo/', '/images-demo/tatouage/lettering-1.svg', array['/images-demo/tatouage/old-school-1.svg']::text[], true),
  ('Ligne Claire Studio', 'ligne-claire-studio', '44109', 'Nantes', 'nantes', 47.2184, -1.5536, array['minimaliste', 'geometrique']::text[], 'https://www.instagram.com/ligne.claire.demo/', '/images-demo/tatouage/minimaliste-1.svg', array['/images-demo/tatouage/geometrique-1.svg', '/images-demo/tatouage/minimaliste-2.svg']::text[], true),
  ('Ombre Portée', 'ombre-portee', '31555', 'Toulouse', 'toulouse', 43.6045, 1.4442, array['realisme', 'blackwork']::text[], 'https://www.instagram.com/ombre.portee.demo/', '/images-demo/tatouage/realisme-2.svg', array['/images-demo/tatouage/blackwork-2.svg']::text[], true),
  ('Maison Vermillon', 'maison-vermillon', '59350', 'Lille', 'lille', 50.6292, 3.0573, array['neo-traditionnel', 'floral', 'lettering']::text[], 'https://www.instagram.com/maison.vermillon.demo/', '/images-demo/tatouage/neo-traditionnel-1.svg', array['/images-demo/tatouage/floral-1.svg', '/images-demo/tatouage/lettering-1.svg']::text[], true),
  ('Kōsei Tattoo', 'kosei-tattoo', '69382', 'Lyon 2e', 'lyon-2e', 45.7485, 4.8272, array['japonais']::text[], 'https://www.instagram.com/kosei.tattoo.demo/', '/images-demo/tatouage/japonais-2.svg', '{}'::text[], true),
  ('Trait Nord', 'trait-nord', '67482', 'Strasbourg', 'strasbourg', 48.5734, 7.7521, array['geometrique', 'minimaliste']::text[], 'https://www.instagram.com/trait.nord.demo/', '/images-demo/tatouage/geometrique-1.svg', array['/images-demo/tatouage/minimaliste-1.svg', '/images-demo/tatouage/geometrique-2.svg']::text[], true),
  -- Le treizième : SEPT styles — la preuve vivante qu'aucune limite ne
  -- subsiste. Son adresse et ses photos par style arrivent avec
  -- yokofolio-styles-adresse.sql.
  ('Studio Caméléon', 'studio-cameleon', '33063', 'Bordeaux', 'bordeaux', 44.8496, -0.5722, array['realisme', 'fine-line', 'old-school', 'japonais', 'blackwork', 'floral', 'geometrique']::text[], 'https://www.instagram.com/studio.cameleon.demo/', '/images-demo/tatouage/realisme-1.svg', array['/images-demo/tatouage/japonais-1.svg', '/images-demo/tatouage/blackwork-1.svg', '/images-demo/tatouage/floral-1.svg']::text[], true)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select nom, ville_nom, styles from tatoueurs order by nom;
--  select unnest(styles) as style, count(*)
--    from tatoueurs where publie group by 1 order by 2 desc;
