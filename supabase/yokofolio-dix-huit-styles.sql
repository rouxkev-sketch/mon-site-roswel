-- ============================================================
-- YOKOFOLIO — LES 18 STYLES (migration des fiches de démonstration)
-- ============================================================
-- À passer dans l'éditeur SQL de Supabase, chaîne complète :
--   1..7 : tatoueurs.sql → … → yokofolio-popularite.sql
--   8 : yokofolio-dix-huit-styles.sql   ← ce fichier
--
-- La LISTE des styles vit dans le code (src/config/tatouage.ts) — la
-- base n'a pas de table de styles. Ce fichier met seulement les DOUZE
-- fiches de démonstration au diapason des 18 nouveaux styles : leurs
-- tableaux `styles`, leurs photos par style et leur photo principale
-- (les images de démonstration sont dessinées à la volée d'après le
-- slug). « floral » disparaît (il devient le motif « Fleurs &
-- nature ») ; dotwork, ornemental, new-school, chicano, tribal,
-- aquarelle, illustratif, abstrait et anime-manga arrivent.
-- Rejouable sans dommage (UPDATE par slug).

update public.tatoueurs set
  styles = '{blackwork,geometrique,dotwork}',
  photos_styles = '{"blackwork":"/images-demo/tatouage/blackwork-1.svg","geometrique":"/images-demo/tatouage/geometrique-2.svg","dotwork":"/images-demo/tatouage/dotwork-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/blackwork-1.svg'
  where slug = 'atelier-corvus';

update public.tatoueurs set
  styles = '{fine-line,minimaliste,ornemental}',
  photos_styles = '{"fine-line":"/images-demo/tatouage/fine-line-1.svg","minimaliste":"/images-demo/tatouage/minimaliste-2.svg","ornemental":"/images-demo/tatouage/ornemental-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/fine-line-1.svg'
  where slug = 'studio-mille-traits';

update public.tatoueurs set
  styles = '{realisme,chicano}',
  photos_styles = '{"realisme":"/images-demo/tatouage/realisme-1.svg","chicano":"/images-demo/tatouage/chicano-2.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/realisme-1.svg'
  where slug = 'nadege-roux';

update public.tatoueurs set
  styles = '{old-school,neo-traditionnel,new-school}',
  photos_styles = '{"old-school":"/images-demo/tatouage/old-school-1.svg","neo-traditionnel":"/images-demo/tatouage/neo-traditionnel-2.svg","new-school":"/images-demo/tatouage/new-school-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/old-school-1.svg'
  where slug = 'encre-et-sel';

update public.tatoueurs set
  styles = '{japonais,blackwork,tribal}',
  photos_styles = '{"japonais":"/images-demo/tatouage/japonais-1.svg","blackwork":"/images-demo/tatouage/blackwork-2.svg","tribal":"/images-demo/tatouage/tribal-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/japonais-1.svg'
  where slug = 'hokusai-mecanique';

update public.tatoueurs set
  styles = '{illustratif,fine-line,aquarelle}',
  photos_styles = '{"illustratif":"/images-demo/tatouage/illustratif-1.svg","fine-line":"/images-demo/tatouage/fine-line-2.svg","aquarelle":"/images-demo/tatouage/aquarelle-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/illustratif-1.svg'
  where slug = 'camille-fauve';

update public.tatoueurs set
  styles = '{lettering,chicano}',
  photos_styles = '{"lettering":"/images-demo/tatouage/lettering-1.svg","chicano":"/images-demo/tatouage/chicano-2.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/lettering-1.svg'
  where slug = 'typo-sauvage';

update public.tatoueurs set
  styles = '{geometrique,minimaliste,abstrait}',
  photos_styles = '{"geometrique":"/images-demo/tatouage/geometrique-1.svg","minimaliste":"/images-demo/tatouage/minimaliste-2.svg","abstrait":"/images-demo/tatouage/abstrait-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/geometrique-1.svg'
  where slug = 'ligne-claire-studio';

update public.tatoueurs set
  styles = '{realisme,blackwork,dotwork}',
  photos_styles = '{"realisme":"/images-demo/tatouage/realisme-1.svg","blackwork":"/images-demo/tatouage/blackwork-2.svg","dotwork":"/images-demo/tatouage/dotwork-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/realisme-1.svg'
  where slug = 'ombre-portee';

update public.tatoueurs set
  styles = '{neo-traditionnel,new-school,aquarelle}',
  photos_styles = '{"neo-traditionnel":"/images-demo/tatouage/neo-traditionnel-1.svg","new-school":"/images-demo/tatouage/new-school-2.svg","aquarelle":"/images-demo/tatouage/aquarelle-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/neo-traditionnel-1.svg'
  where slug = 'maison-vermillon';

update public.tatoueurs set
  styles = '{japonais}',
  photos_styles = '{"japonais":"/images-demo/tatouage/japonais-1.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/japonais-1.svg'
  where slug = 'kosei-tattoo';

update public.tatoueurs set
  styles = '{realisme,japonais,old-school,blackwork,illustratif,fine-line,geometrique,anime-manga}',
  photos_styles = '{"realisme":"/images-demo/tatouage/realisme-1.svg","japonais":"/images-demo/tatouage/japonais-2.svg","old-school":"/images-demo/tatouage/old-school-3.svg","blackwork":"/images-demo/tatouage/blackwork-4.svg","illustratif":"/images-demo/tatouage/illustratif-5.svg","fine-line":"/images-demo/tatouage/fine-line-6.svg","geometrique":"/images-demo/tatouage/geometrique-7.svg","anime-manga":"/images-demo/tatouage/anime-manga-8.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/realisme-1.svg'
  where slug = 'studio-cameleon';

update public.tatoueurs set
  styles = '{minimaliste,geometrique,dotwork}',
  photos_styles = '{"minimaliste":"/images-demo/tatouage/minimaliste-1.svg","geometrique":"/images-demo/tatouage/geometrique-2.svg","dotwork":"/images-demo/tatouage/dotwork-3.svg"}'::jsonb,
  photo_principale = '/images-demo/tatouage/minimaliste-1.svg'
  where slug = 'trait-nord';
