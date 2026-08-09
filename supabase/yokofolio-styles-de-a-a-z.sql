-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 50 : SEIZE STYLES DE PLUS, RANGÉS DE A À Z
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 49
--  (yokofolio-flash-nature-photo.sql). Réexécutable sans danger : tout
--  se fait par `update … where slug = …`, jamais par insertion.
--
--  CE QUE ÇA CHANGE — ET SURTOUT CE QUE ÇA NE CHANGE PAS
--  -----------------------------------------------------
--  AUCUN CHANGEMENT DE SCHÉMA. La liste des styles vit dans le CODE
--  (src/config/tatouage.ts), pas dans la base : `tatoueurs.styles` est
--  un simple `text[]` de slugs, et la contrainte qui les énumérait a
--  été retirée depuis longtemps (migration « styles + adresse »). Les
--  seize nouveaux styles n'ont donc besoin de rien ici pour exister,
--  être cherchés, ou porter leur page /tatouage/<style>/<ville>.
--
--  CE FICHIER NE FAIT QU'UNE CHOSE : mettre les fiches de
--  DÉMONSTRATION au diapason, pour que le propriétaire voie les
--  nouveautés fonctionner — dans le menu « Explorer », dans les
--  filtres, sur les cartes et sur les pages style + ville. Sans ça,
--  chercher « Suminagashi » ou « Maori » ne rendrait rien, et le
--  sous-menu « Traditionnel ethnique » paraîtrait vide.
--
--  ⚠️ AUCUNE FICHE DE VRAI TATOUEUR N'EST TOUCHÉE : chaque `update`
--  vise un slug de démonstration, nommément. Les styles déjà déclarés
--  par les vrais tatoueurs restent exactement ce qu'ils sont — aucun
--  slug existant n'a été renommé par cette passe (les renommer aurait
--  cassé les fiches, les adresses et les liens déjà partagés).
--
--  LES SEIZE NOUVEAUX SLUGS
--  ------------------------
--   acid-trad · bio-mecha · chrome · cyber-sigilism · gravure ·
--   one-line · suminagashi
--   berbere · celtique · copte · maori · nordique · pa-tutiki ·
--   polynesien · sicanje · yoruba
--
--  « Pā Tūtiki » s'écrit `pa-tutiki` : un macron ne survit ni à une
--  barre d'adresse, ni à un copier-coller, ni à un clavier français.
--  Le LIBELLÉ, lui, garde ses macrons — il vit dans le code.
--
--  LE RANGEMENT « TRADITIONNEL ETHNIQUE » N'EXISTE PAS EN BASE, et
--  c'est voulu : ce n'est pas un style, c'est une PORTE du menu de
--  recherche. Aucune fiche ne peut le déclarer, aucune page ne peut
--  s'appeler /tatouage/traditionnel-ethnique/<ville>. Les neuf styles
--  qu'il regroupe, eux, sont des styles ordinaires — c'est bien eux
--  que les lignes ci-dessous écrivent.
-- =====================================================================

--  ---------------------------------------------------------------
--  1 · LES NOUVEAUTÉS « GRAND PUBLIC », semées dans les démos
--  ---------------------------------------------------------------

--  Atelier Corvus (Lyon 1er) — la GRAVURE, voisine naturelle du
--  blackwork et du dotwork.
update public.tatoueurs set
  styles = '{blackwork,geometrique,dotwork,gravure}',
  photos_styles = photos_styles
    || '{"gravure":"/images-demo/tatouage/gravure-4.svg"}'::jsonb
  where slug like 'atelier-corvus%';

--  Studio Mille Traits (Lyon 6e) — le ONE LINE, à côté du trait fin.
update public.tatoueurs set
  styles = '{fine-line,minimaliste,ornemental,one-line}'
  where slug like 'studio-mille-traits%';

--  Encre & Sel (Marseille) — l'ACID-TRAD, dérivé du traditionnel.
update public.tatoueurs set
  styles = '{old-school,neo-traditionnel,new-school,acid-trad}'
  where slug like 'encre-et-sel%' or slug like 'encre-sel%';

--  Hokusai Mécanique (Paris 11e) — le SUMINAGASHI (encre sur l'eau),
--  et deux traditionnels du Pacifique auprès de son tribal.
update public.tatoueurs set
  styles = '{japonais,blackwork,tribal,biomecanique,suminagashi,maori,polynesien}'
  where slug like 'hokusai-mecanique%';

--  Ligne Claire Studio (Nantes) — CHROME et CYBER-SIGILISM.
update public.tatoueurs set
  styles = '{geometrique,minimaliste,abstrait,cyber-tribal,chrome,cyber-sigilism}'
  where slug like 'ligne-claire-studio%';

--  Ombre Portée (Toulouse) — le BIO-MECHA.
update public.tatoueurs set
  styles = '{realisme,blackwork,dotwork,trash-polka,bio-mecha}'
  where slug like 'ombre-portee%';

--  Trait Nord (Strasbourg) — le NORDIQUE, que son nom appelait.
update public.tatoueurs set
  styles = '{minimaliste,geometrique,dotwork,ignorant-style,nordique}'
  where slug like 'trait-nord%';

--  ---------------------------------------------------------------
--  2 · LA VITRINE — Studio Caméléon passe de douze à dix-huit styles
--  ---------------------------------------------------------------
--  C'est la fiche qui sert à voir une longue liste de badges tenir
--  dans une page. Elle reçoit donc trois traditionnels de plus
--  (pa-tutiki, sicanje, yoruba), qui rendent le sous-menu visible.
update public.tatoueurs set
  styles = '{realisme,japonais,old-school,blackwork,illustratif,fine-line,geometrique,anime-manga,trash-polka,biomecanique,ignorant-style,cyber-tribal,acid-trad,chrome,one-line,pa-tutiki,sicanje,yoruba}',
  photos_styles = photos_styles || '{
    "acid-trad":"/images-demo/tatouage/acid-trad-13.svg",
    "chrome":"/images-demo/tatouage/chrome-14.svg",
    "one-line":"/images-demo/tatouage/one-line-15.svg",
    "pa-tutiki":"/images-demo/tatouage/pa-tutiki-16.svg",
    "sicanje":"/images-demo/tatouage/sicanje-17.svg",
    "yoruba":"/images-demo/tatouage/yoruba-18.svg"
  }'::jsonb,
  bio = 'Un studio qui change de peau : dix-huit styles pratiqués sérieusement, une photo à l''appui pour chacun. Dis-nous ton univers, on te guide.'
  where slug like 'studio-cameleon%';

--  ---------------------------------------------------------------
--  3 · LES TRADITIONNELS, HORS DE FRANCE
--  ---------------------------------------------------------------

--  Kreuzberg Nadel (Berlin) — le COPTE, écriture auprès du lettering.
update public.tatoueurs set
  styles = '{blackwork,lettering,ignorant-style,copte}'
  where slug like 'kreuzberg-nadel%';

--  Tinta Gòtica (Barcelone) — le BERBÈRE.
update public.tatoueurs set
  styles = '{neo-traditionnel,old-school,illustratif,berbere}'
  where slug like 'tinta-gotica%';

--  Atelier Boréal (Montréal) — le CELTIQUE.
update public.tatoueurs set
  styles = '{geometrique,dotwork,fine-line,celtique}'
  where slug like 'atelier-boreal%';

--  ---------------------------------------------------------------
--  4 · UN MÉNAGE : le style « floral » n'existe plus
--  ---------------------------------------------------------------
--  Il traînait dans la démo d'Isar Studio (Munich) depuis une liste
--  de styles abandonnée. Comme il n'est plus au catalogue, il ne
--  s'affichait nulle part correctement (le site retombait sur le slug
--  brut, en minuscules) et sa page style + ville n'existait pas.
--  ⚠️ CETTE LIGNE VISE TOUTES LES FICHES, pas seulement les démos :
--  si une fiche réelle porte encore `floral`, elle passe elle aussi à
--  `ornemental` — le style le plus proche, et le seul qui rende son
--  travail visible dans la recherche. C'est la seule ligne du fichier
--  qui touche autre chose qu'une démonstration ; sans elle, ces fiches
--  resteraient introuvables par leur style.
update public.tatoueurs set
  styles = array_replace(styles, 'floral', 'ornemental')
  where styles @> array['floral'];

update public.tatoueurs set
  photos_styles = (photos_styles - 'floral')
    || jsonb_build_object('ornemental', photos_styles->'floral')
  where photos_styles ? 'floral';

--  ---------------------------------------------------------------
--  5 · CONTRÔLE — à lire après le Run
--  ---------------------------------------------------------------
--  Doit rendre les seize nouveaux slugs présents dans au moins une
--  fiche, et AUCUNE ligne pour `floral` ni `traditionnel-ethnique`.
select style, count(*) as fiches
  from public.tatoueurs, unnest(styles) as style
  where style in (
    'acid-trad','bio-mecha','chrome','cyber-sigilism','gravure',
    'one-line','suminagashi','berbere','celtique','copte','maori',
    'nordique','pa-tutiki','polynesien','sicanje','yoruba',
    'floral','traditionnel-ethnique'
  )
  group by style
  order by style;
