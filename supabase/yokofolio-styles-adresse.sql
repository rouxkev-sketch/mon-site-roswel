-- ============================================================
--  YOKOFOLIO — STYLES SANS LIMITE, ET L'ADRESSE DU SALON
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  ⚠️ ORDRE DES MIGRATIONS : tatoueurs.sql d'abord, puis
--  yokofolio-photos-par-style.sql, puis CE FICHIER, puis
--  yokofolio-bio.sql.
--  Réexécutable sans danger : chaque étape vérifie l'existant.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. PLUS DE LIMITE DE STYLES. La table plafonnait à trois styles
--      par tatoueur ; un tatoueur peut désormais couvrir TOUS les
--      styles du site. Ce qui reste limité, c'est la photo — une par
--      style (photos_styles) : couvrir un style, c'est le montrer.
--
--   2. L'ADRESSE DU SALON : deux colonnes, `adresse` (numéro et rue)
--      et `code_postal`. La fiche affiche désormais l'adresse
--      complète — rue, code postal, ville.
--
--   3. Un treizième tatoueur de démonstration, « Studio Caméléon »,
--      à SEPT styles : c'est lui qui prouve, à l'écran, que la
--      limite a bien disparu. Inventé, comme les douze autres.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien des autres produits : ni `artisans`, ni `communes`, ni
--  `favoris`, ni aucune de leurs règles.
-- ============================================================

-- ------------------------------------------------------------
--  1. LA LIMITE DE TROIS STYLES DISPARAÎT
-- ------------------------------------------------------------
--  La contrainte a été créée sans nom explicite : PostgreSQL l'a
--  baptisée d'après la table et la colonne. Les deux noms possibles
--  sont couverts.
alter table tatoueurs drop constraint if exists tatoueurs_styles_check;
alter table tatoueurs drop constraint if exists styles_check;

-- ------------------------------------------------------------
--  2. L'ADRESSE DU SALON
-- ------------------------------------------------------------
alter table tatoueurs add column if not exists adresse text;
alter table tatoueurs add column if not exists code_postal text;

comment on column tatoueurs.adresse is
  'Numéro et rue du salon (ex. « 4 rue des Capucins »). La ville vit déjà dans ville_nom.';
comment on column tatoueurs.code_postal is
  'Code postal du salon (ex. « 69001 »).';

-- ------------------------------------------------------------
--  3. LE TREIZIÈME TATOUEUR — sept styles, une photo par style
-- ------------------------------------------------------------
insert into tatoueurs
  (nom, slug, ville_code_insee, ville_nom, ville_slug, latitude, longitude,
   styles, lien_instagram, photo_principale, photos, publie)
values
  ('Studio Caméléon', 'studio-cameleon', '33063', 'Bordeaux', 'bordeaux', 44.8496, -0.5722,
   array['realisme', 'fine-line', 'old-school', 'japonais', 'blackwork', 'floral', 'geometrique']::text[],
   'https://www.instagram.com/studio.cameleon.demo/',
   '/images-demo/tatouage/realisme-1.svg',
   array['/images-demo/tatouage/japonais-1.svg', '/images-demo/tatouage/blackwork-1.svg', '/images-demo/tatouage/floral-1.svg']::text[],
   true)
on conflict (slug) do nothing;

update tatoueurs
set photos_styles = '{
      "realisme":    "/images-demo/tatouage/realisme-1.svg",
      "fine-line":   "/images-demo/tatouage/fine-line-1.svg",
      "old-school":  "/images-demo/tatouage/old-school-1.svg",
      "japonais":    "/images-demo/tatouage/japonais-1.svg",
      "blackwork":   "/images-demo/tatouage/blackwork-1.svg",
      "floral":      "/images-demo/tatouage/floral-1.svg",
      "geometrique": "/images-demo/tatouage/geometrique-1.svg"
    }'::jsonb,
    lien_tiktok = 'https://www.tiktok.com/@studio.cameleon.demo'
where slug = 'studio-cameleon';

-- ------------------------------------------------------------
--  4. LES ADRESSES DES TREIZE DÉMONSTRATIONS (inventées)
-- ------------------------------------------------------------
update tatoueurs set adresse = '4 rue des Capucins',           code_postal = '69001' where slug = 'atelier-corvus';
update tatoueurs set adresse = '18 cours Franklin-Roosevelt',  code_postal = '69006' where slug = 'studio-mille-traits';
update tatoueurs set adresse = '27 rue Anatole-France',        code_postal = '69100' where slug = 'nadege-roux';
update tatoueurs set adresse = '9 rue Sainte',                 code_postal = '13001' where slug = 'encre-et-sel';
update tatoueurs set adresse = '31 rue de la Roquette',        code_postal = '75011' where slug = 'hokusai-mecanique';
update tatoueurs set adresse = '6 rue des Abbesses',           code_postal = '75018' where slug = 'camille-fauve';
update tatoueurs set adresse = '14 rue Sainte-Catherine',      code_postal = '33000' where slug = 'typo-sauvage';
update tatoueurs set adresse = '22 rue Crébillon',             code_postal = '44000' where slug = 'ligne-claire-studio';
update tatoueurs set adresse = '11 rue des Filatiers',         code_postal = '31000' where slug = 'ombre-portee';
update tatoueurs set adresse = '35 rue de Béthune',            code_postal = '59000' where slug = 'maison-vermillon';
update tatoueurs set adresse = '2 rue Mercière',               code_postal = '69002' where slug = 'kosei-tattoo';
update tatoueurs set adresse = '17 rue des Frères',            code_postal = '67000' where slug = 'trait-nord';
update tatoueurs set adresse = '40 quai des Chartrons',        code_postal = '33000' where slug = 'studio-cameleon';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select nom, array_length(styles, 1) as nb_styles, adresse, code_postal
--    from tatoueurs order by nb_styles desc nulls last;
