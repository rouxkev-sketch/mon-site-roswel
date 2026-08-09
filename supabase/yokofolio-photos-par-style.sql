-- ============================================================
--  YOKOFOLIO — UNE PHOTO PAR STYLE, ET TIKTOK
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  ⚠️ À PASSER APRÈS supabase/tatoueurs.sql, qui crée la table,
--  et AVANT supabase/yokofolio-styles-adresse.sql.
--  Réexécutable sans danger : les colonnes ne sont ajoutées que si
--  elles n'existent pas, et les mises à jour sont idempotentes.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. `photos_styles` : UNE PHOTO PAR STYLE.
--      Le tatoueur qui coche « réalisme » et « floral » fournit une
--      image pour CHACUN. Quand quelqu'un cherche « réalisme », sa
--      carte montre SON réalisme — pas sa première photo.
--      Sans style cherché (« Tous les styles »), c'est
--      `photo_principale` qui s'affiche : elle reste donc utile, et
--      n'est pas supprimée.
--
--   2. `lien_tiktok` : le second réseau, facultatif. Vide = aucun
--      bouton TikTok n'apparaît (jamais de bouton mort).
--
--  POURQUOI DU JSON, et pas une table de plus ? Parce qu'un tatoueur
--  a AU PLUS TROIS styles (contrainte déjà en base) : trois adresses
--  d'images, lues et écrites d'un bloc avec la fiche. Une table
--  séparée ajouterait une jointure à chaque carte affichée, pour
--  stocker au maximum trois lignes.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien du produit artisans, rien de l'agence. Ni la table
--  `artisans`, ni `communes`, ni `favoris`, ni aucune de leurs règles.
-- ============================================================

-- ------------------------------------------------------------
--  1. LES DEUX NOUVELLES COLONNES
-- ------------------------------------------------------------
alter table tatoueurs
  add column if not exists photos_styles jsonb not null default '{}'::jsonb;

alter table tatoueurs
  add column if not exists lien_tiktok text;

comment on column tatoueurs.photos_styles is
  'Une photo par style : {"realisme": "https://…", "floral": "https://…"}. '
  'Les clés sont les slugs de STYLES_TATOUAGE (src/config/tatouage.ts).';
comment on column tatoueurs.lien_tiktok is
  'Compte TikTok du tatoueur. Vide = aucun bouton TikTok sur la fiche.';

-- Un garde-fou : `photos_styles` doit être un OBJET, pas un tableau
-- ni un nombre. Une interface peut être contournée, pas une
-- contrainte.
alter table tatoueurs drop constraint if exists tatoueurs_photos_styles_objet;
alter table tatoueurs
  add constraint tatoueurs_photos_styles_objet
  check (jsonb_typeof(photos_styles) = 'object');

-- ------------------------------------------------------------
--  2. LES FICHES DÉJÀ EN BASE
-- ------------------------------------------------------------
--  Personne n'a encore déposé de photo par style : on part de la
--  photo principale, attribuée au PREMIER style de chaque fiche.
--  C'est un point de départ honnête — l'image existe vraiment et
--  correspond bien à ce tatoueur — que l'inscription (étape 2)
--  remplacera style par style.
update tatoueurs
set photos_styles = jsonb_build_object(styles[1], photo_principale)
where photos_styles = '{}'::jsonb
  and array_length(styles, 1) >= 1
  and photo_principale is not null;

-- ------------------------------------------------------------
--  3. LES DOUZE TATOUEURS DE DÉMONSTRATION
-- ------------------------------------------------------------
--  Chacun reçoit une image pour CHACUN de ses styles, et sept
--  d'entre eux un TikTok. Les cinq autres n'en ont pas : c'est ce qui
--  permet de vérifier que le bouton TikTok n'apparaît QUE lorsque le
--  lien existe.
--
--  Les images restent des aplats de couleur dessinés par le site
--  (/images-demo/tatouage/…). AUCUNE vraie photo de tatouage n'est
--  publiée sans l'accord de son auteur.
update tatoueurs t
set photos_styles = (
  select jsonb_object_agg(style, '/images-demo/tatouage/' || style || '-1.svg')
  from unnest(t.styles) as style
)
where t.slug in (
  'atelier-corvus', 'studio-mille-traits', 'nadege-roux', 'encre-et-sel',
  'hokusai-mecanique', 'camille-fauve', 'typo-sauvage', 'ligne-claire-studio',
  'maison-vermillon', 'trait-nord'
);

-- Ces deux-là ont une photo principale numérotée 2 : leurs images de
-- style suivent, pour que la fiche et la carte montrent la même chose.
update tatoueurs
set photos_styles = '{"realisme": "/images-demo/tatouage/realisme-2.svg",
                      "blackwork": "/images-demo/tatouage/blackwork-2.svg"}'::jsonb
where slug = 'ombre-portee';

update tatoueurs
set photos_styles = '{"japonais": "/images-demo/tatouage/japonais-2.svg"}'::jsonb
where slug = 'kosei-tattoo';

-- Les sept comptes TikTok de démonstration (inventés, comme le reste).
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@atelier.corvus.demo'      where slug = 'atelier-corvus';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@studio.mille.traits.demo' where slug = 'studio-mille-traits';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@encre.et.sel.demo'        where slug = 'encre-et-sel';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@camille.fauve.demo'       where slug = 'camille-fauve';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@ligne.claire.studio.demo' where slug = 'ligne-claire-studio';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@maison.vermillon.demo'    where slug = 'maison-vermillon';
update tatoueurs set lien_tiktok = 'https://www.tiktok.com/@trait.nord.demo'          where slug = 'trait-nord';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select nom, styles, photos_styles, lien_tiktok
--    from tatoueurs order by nom;
--
--  Aucune fiche publiée sans photo pour l'un de ses styles :
--  select nom, style from tatoueurs t, unnest(t.styles) as style
--   where t.publie and not (t.photos_styles ? style);
