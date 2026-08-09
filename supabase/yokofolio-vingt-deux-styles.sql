-- ============================================================
-- YOKOFOLIO — LES 22 STYLES (16e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-fiche-brouillon.sql
--  (15e). Réexécutable sans danger (UPDATE par slug).
--
--  CE QUE ÇA CHANGE
--  ----------------
--  La LISTE des styles vit dans le code (src/config/tatouage.ts), pas
--  dans la base : les quatre NOUVEAUX styles (Trash Polka,
--  Biomécanique / Organique, Ignorant Style, Cyber-tribal / Cyberpunk)
--  n'exigent donc AUCUN changement de schéma.
--
--  LE RENOMMAGE « Japonais » → « Japonais (Irezumi) » est un
--  changement de LIBELLÉ UNIQUEMENT : la base ne stocke que le slug
--  `japonais`, qui ne bouge pas (les adresses publiées ne cassent
--  jamais). Aucune ligne à mettre à jour pour lui — ce fichier le
--  consigne pour mémoire.
--
--  Ce qui suit met seulement les fiches de DÉMONSTRATION au diapason :
--   - Hokusai Mécanique   + biomecanique   (ça lui va bien) ;
--   - Ligne Claire Studio + cyber-tribal ;
--   - Ombre Portée        + trash-polka ;
--   - Trait Nord          + ignorant-style ;
--   - Studio Caméléon     + les quatre (le « tous styles » passe à
--     douze styles, sa bio suit).
--  Les images de démonstration restent dessinées à la volée d'après
--  le slug (/images-demo/tatouage/…), rien à déposer.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, et aucune
--  fiche de vrai tatoueur.

update public.tatoueurs set
  styles = '{japonais,blackwork,tribal,biomecanique}',
  photos_styles = '{"japonais":"/images-demo/tatouage/japonais-1.svg","blackwork":"/images-demo/tatouage/blackwork-2.svg","tribal":"/images-demo/tatouage/tribal-3.svg","biomecanique":"/images-demo/tatouage/biomecanique-4.svg"}'::jsonb
  where slug = 'hokusai-mecanique';

update public.tatoueurs set
  styles = '{geometrique,minimaliste,abstrait,cyber-tribal}',
  photos_styles = '{"geometrique":"/images-demo/tatouage/geometrique-1.svg","minimaliste":"/images-demo/tatouage/minimaliste-2.svg","abstrait":"/images-demo/tatouage/abstrait-3.svg","cyber-tribal":"/images-demo/tatouage/cyber-tribal-4.svg"}'::jsonb
  where slug = 'ligne-claire-studio';

update public.tatoueurs set
  styles = '{realisme,blackwork,dotwork,trash-polka}',
  photos_styles = '{"realisme":"/images-demo/tatouage/realisme-1.svg","blackwork":"/images-demo/tatouage/blackwork-2.svg","dotwork":"/images-demo/tatouage/dotwork-3.svg","trash-polka":"/images-demo/tatouage/trash-polka-4.svg"}'::jsonb
  where slug = 'ombre-portee';

update public.tatoueurs set
  styles = '{minimaliste,geometrique,dotwork,ignorant-style}',
  photos_styles = '{"minimaliste":"/images-demo/tatouage/minimaliste-1.svg","geometrique":"/images-demo/tatouage/geometrique-2.svg","dotwork":"/images-demo/tatouage/dotwork-3.svg","ignorant-style":"/images-demo/tatouage/ignorant-style-4.svg"}'::jsonb
  where slug = 'trait-nord';

update public.tatoueurs set
  styles = '{realisme,japonais,old-school,blackwork,illustratif,fine-line,geometrique,anime-manga,trash-polka,biomecanique,ignorant-style,cyber-tribal}',
  photos_styles = '{"realisme":"/images-demo/tatouage/realisme-1.svg","japonais":"/images-demo/tatouage/japonais-2.svg","old-school":"/images-demo/tatouage/old-school-3.svg","blackwork":"/images-demo/tatouage/blackwork-4.svg","illustratif":"/images-demo/tatouage/illustratif-5.svg","fine-line":"/images-demo/tatouage/fine-line-6.svg","geometrique":"/images-demo/tatouage/geometrique-7.svg","anime-manga":"/images-demo/tatouage/anime-manga-8.svg","trash-polka":"/images-demo/tatouage/trash-polka-9.svg","biomecanique":"/images-demo/tatouage/biomecanique-10.svg","ignorant-style":"/images-demo/tatouage/ignorant-style-11.svg","cyber-tribal":"/images-demo/tatouage/cyber-tribal-12.svg"}'::jsonb,
  bio = 'Un studio qui change de peau : douze styles pratiqués sérieusement, une photo à l''appui pour chacun. Dis-nous ton univers, on te guide.'
  where slug = 'studio-cameleon';
