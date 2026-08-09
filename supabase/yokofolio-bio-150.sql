-- ============================================================
-- YOKOFOLIO — LA BIO PASSE À 150 CARACTÈRES MAXIMUM (13e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-contact.sql (12e).
--  Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. LES TREIZE BIOS DE DÉMONSTRATION sont raccourcies (mêmes
--      textes que src/lib/tatoueurs-demo.ts) : la bio remonte
--      désormais juste sous le nom de la fiche, elle doit se lire
--      d'un coup d'œil.
--   2. LA BORNE EN BASE passe de « 80 à 400 » à « 80 à 150 »
--      caractères. La contrainte est posée en `not valid` : elle
--      s'applique à toute NOUVELLE saisie, sans bloquer la migration
--      si une vraie fiche existante portait déjà une bio plus longue
--      (celle-ci sera raccourcie naturellement à sa prochaine
--      modification — le champ de saisie coupe à 150).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, aucune
--  autre colonne de `tatoueurs`.

update public.tatoueurs set bio='Atelier de la Croix-Rousse : blackwork dense, géométrie et grands aplats noirs. Dessin sur mesure, encres véganes, devis clair avant la séance.' where slug='atelier-corvus';
update public.tatoueurs set bio='Le trait fin comme signature : pièces délicates, fleurs et minimalisme qui vieillissent bien. On dessine ensemble avant de piquer, sur rendez-vous.' where slug='studio-mille-traits';
update public.tatoueurs set bio='Dix ans de réalisme noir et gris : portraits, animaux, matières. Dessin validé avant la séance, une seule pièce par jour.' where slug='nadege-roux';
update public.tatoueurs set bio='Tatouage traditionnel à Marseille : lignes franches, couleurs pleines, motifs marins. Flashs au comptoir, projets sur rendez-vous.' where slug='encre-et-sel';
update public.tatoueurs set bio='Pièces japonaises amples — dragons, carpes, pivoines — et blackwork architectural. Les grands formats se construisent séance après séance.' where slug='hokusai-mecanique';
update public.tatoueurs set bio='Des fleurs, presque uniquement : bouquets et herbiers au trait fin, ombrages doux. Réponse en quelques jours, croquis à l''appui.' where slug='camille-fauve';
update public.tatoueurs set bio='Le lettrage comme un métier : calligraphie, gothiques et scripts posés après une vraie étude typographique. On choisit ensemble, lettre par lettre.' where slug='typo-sauvage';
update public.tatoueurs set bio='Géométrie, symétries et minimalisme tirés au cordeau, ajustés au millimètre sur ta morphologie. Studio calme en plein centre de Nantes.' where slug='ligne-claire-studio';
update public.tatoueurs set bio='Réalisme noir et gris, contrastes marqués, blackwork massif. Apporte ton idée, je m''occupe de la lumière. Réponse rapide par Instagram.' where slug='ombre-portee';
update public.tatoueurs set bio='Couleurs riches et contours francs : le néo-traditionnel est notre langue maternelle. Dessin validé ensemble, retouche offerte.' where slug='maison-vermillon';
update public.tatoueurs set bio='L''irezumi, patiemment : manches, dos complets et motifs traditionnels étudiés à la source. Les grandes pièces se réservent des mois à l''avance.' where slug='kosei-tattoo';
update public.tatoueurs set bio='Des formes simples qui tiennent leurs promesses : géométrie, points et lignes fines. Un studio pensé pour les premiers tatouages, à Strasbourg.' where slug='trait-nord';
update public.tatoueurs set bio='Un studio qui change de peau : huit styles pratiqués sérieusement, une photo à l''appui pour chacun. Dis-nous ton univers, on te guide.' where slug='studio-cameleon';

-- La nouvelle borne (80 à 150), sans bloquer sur l'existant.
alter table public.tatoueurs drop constraint if exists tatoueurs_bio_longueur;
alter table public.tatoueurs add constraint tatoueurs_bio_longueur
  check (bio is null or char_length(bio) between 80 and 150) not valid;

comment on column public.tatoueurs.bio is
  'Présentation libre du tatoueur (80 à 150 caractères), affichée sur la fiche juste sous le nom.';
