-- ============================================================
--  YOKOFOLIO — LA BIO DU TATOUEUR (présentation libre)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  ⚠️ ORDRE DES MIGRATIONS : tatoueurs.sql d'abord, puis
--  yokofolio-photos-par-style.sql, puis yokofolio-styles-adresse.sql,
--  puis CE FICHIER, puis yokofolio-fiches-tatoueurs.sql.
--  Réexécutable sans danger : chaque étape vérifie l'existant.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. LA COLONNE `bio` : la présentation libre du tatoueur, affichée
--      sur sa fiche sous l'adresse. NULLE tant qu'il ne l'a pas
--      écrite — la fiche s'affiche très bien sans.
--
--   2. SES BORNES, gardées par la base elle-même : de 80 à 400
--      caractères (les mêmes que le champ de saisie à compteur du
--      site). Une bio vide reste permise (null) ; une bio écrite doit
--      tenir dans les bornes.
--
--   3. LES TREIZE DÉMOS reçoivent chacune une bio crédible — les
--      mêmes textes que src/lib/tatoueurs-demo.ts, pour que la base
--      et la démonstration racontent la même chose.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS
--  Rien du projet artisans, et aucune autre colonne de `tatoueurs`.
-- ============================================================

-- 1) La colonne.
alter table tatoueurs add column if not exists bio text;

comment on column tatoueurs.bio is
  'Présentation libre du tatoueur (80 à 400 caractères), affichée sur la fiche sous l''adresse.';

-- 2) Les bornes — 80 à 400 caractères, le null restant permis.
alter table tatoueurs drop constraint if exists tatoueurs_bio_longueur;
alter table tatoueurs add constraint tatoueurs_bio_longueur
  check (bio is null or char_length(bio) between 80 and 400);

-- 3) Les bios des treize démos (identiques à src/lib/tatoueurs-demo.ts).
update tatoueurs set bio = 'Atelier de la Croix-Rousse consacré au noir profond : blackwork dense, constructions géométriques et grands aplats. Chaque projet commence par un échange et un dessin sur mesure, pensé pour suivre les lignes du corps. Hygiène stricte, encres véganes, devis clair avant la séance.' where slug = 'atelier-corvus';
update tatoueurs set bio = 'Le trait fin comme signature : pièces délicates, compositions florales et motifs minimalistes qui vieillissent bien. On prend le temps de dessiner ensemble, à l''échelle de ta peau, avant de piquer. Studio lumineux du sixième, sur rendez-vous uniquement.' where slug = 'studio-mille-traits';
update tatoueurs set bio = 'Dix ans de réalisme en noir et gris : portraits, animaux, matières. Je travaille d''après tes photos, avec un passage par le dessin pour valider chaque détail avant la séance. Une seule pièce par jour, pour y consacrer toute mon attention.' where slug = 'nadege-roux';
update tatoueurs set bio = 'Maison marseillaise fidèle au tatouage traditionnel : lignes franches, couleurs pleines, motifs marins et classiques revisités en néo-traditionnel. Flashs disponibles au comptoir, projets personnalisés sur rendez-vous. Ici, on tatoue comme on navigue : proprement et sans détour.' where slug = 'encre-et-sel';
update tatoueurs set bio = 'Entre estampe et machine : pièces japonaises amples — dragons, carpes, pivoines — et blackwork architectural. Les grands formats se construisent séance après séance, avec un dessin posé directement sur le corps. Atelier de la Roquette, sur rendez-vous.' where slug = 'hokusai-mecanique';
update tatoueurs set bio = 'Des fleurs, presque uniquement : bouquets, herbiers, branches qui épousent l''épaule ou la colonne. Un trait fin et des ombrages doux, pour des pièces discrètes qui restent nettes avec les années. Je réponds à chaque demande en quelques jours, croquis à l''appui.' where slug = 'camille-fauve';
update tatoueurs set bio = 'Le lettrage comme un métier : calligraphie, gothiques, scripts et enseignes à l''ancienne, posés après une vraie étude typographique. Un mot juste vaut mieux qu''une longue phrase : on choisit ensemble, lettre par lettre. Bienvenue rue Sainte-Catherine.' where slug = 'typo-sauvage';
update tatoueurs set bio = 'La ligne claire, littéralement : motifs géométriques, symétries et tatouages minimalistes tirés au cordeau. Peu d''éléments, beaucoup de précision — chaque pièce est ajustée au millimètre sur ta morphologie. Studio calme en plein centre de Nantes.' where slug = 'ligne-claire-studio';
update tatoueurs set bio = 'Le noir dans toutes ses profondeurs : réalisme en noir et gris, contrastes marqués, blackwork massif. J''aime les projets qui racontent quelque chose — apporte ton idée, je m''occupe de la lumière. Réponse rapide par Instagram, acompte demandé à la réservation.' where slug = 'ombre-portee';
update tatoueurs set bio = 'Couleurs riches et contours francs : le néo-traditionnel est notre langue maternelle, du bouquet flamboyant au lettrage ornemental. Une maison lilloise, un seul niveau d''exigence — dessin validé ensemble, séance expliquée pas à pas, retouche offerte.' where slug = 'maison-vermillon';
update tatoueurs set bio = 'L''irezumi, patiemment : je ne fais que du japonais — manches, dos complets, motifs traditionnels étudiés à la source. Chaque projet démarre par une conversation autour de sa symbolique, puis un tracé à l''encre. Les grandes pièces se réservent plusieurs mois à l''avance.' where slug = 'kosei-tattoo';
update tatoueurs set bio = 'Des formes simples qui tiennent leurs promesses : géométrie, points, lignes fines et compositions minimalistes. Le studio est pensé pour les premiers tatouages — on explique tout, on ne pousse jamais à la grande pièce. À deux pas de la cathédrale de Strasbourg.' where slug = 'trait-nord';
update tatoueurs set bio = 'Un studio qui change de peau à chaque projet : réalisme, japonais, old school, blackwork, floral, fine line ou géométrie — sept styles pratiqués sérieusement, une photo à l''appui pour chacun. Dis-nous l''univers qui te parle, on te dirige vers la bonne main. Quai des Chartrons, Bordeaux.' where slug = 'studio-cameleon';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select slug, char_length(bio) as longueur from tatoueurs
--    order by slug;
--  (chaque longueur doit être entre 80 et 400, jamais au-delà)
