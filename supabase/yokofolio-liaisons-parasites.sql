-- ============================================================
-- nº 412 — LE NETTOYAGE DES LIAISONS PARASITES
-- ============================================================
-- LE RELEVÉ : sur la fiche du salon « Hand In Glove Tattoo », Gaston
-- apparaissait TROIS fois à l'identique après le réenregistrement de
-- sa fiche — au lieu de deux (membre + guest daté).
--
-- CE QUI S'EST PASSÉ : la table portait déjà une liaison SANS MODE
-- pour ce couple (artiste, salon) — soit une écriture d'avant que les
-- liaisons pendent aux modes, soit une invitation partie du salon.
-- La route juge le doublon PAR MODE depuis la nº 410 : cette vieille
-- ligne ne répondait à aucune des deux recherches, elle est donc
-- restée quand le réenregistrement a créé les deux liaisons par mode.
-- Trois lignes dans la vue, trois lignes à l'écran.
-- (Toutes trois disaient « Résident » pour une seconde raison, côté
-- code : la déclaration de l'artiste écrasait la vue — corrigé dans
-- cette même passe, lib/tatoueurs.)
--
-- CE QUE CETTE MIGRATION SUPPRIME, ET SUR QUEL CRITÈRE — deux classes,
-- et rien d'autre :
--  1. LA LIAISON SANS MODE DEVENUE REDONDANTE : mode_id null ALORS
--     QU'une liaison PAR MODE existe pour le même (artiste, salon).
--     La déclaration de l'artiste dit tout ce que cette ligne disait ;
--     les deux ne doivent jamais s'empiler.
--     ⚠️ UNE INVITATION LÉGITIME N'EST PAS TOUCHÉE : un artiste SANS
--     mode déclaré chez ce salon garde sa ligne sans mode — c'est le
--     seul fil qui le tient dans l'équipe.
--  2. LA LIAISON DONT LE MODE A DÉMÉNAGÉ : mode_id non nul, mais le
--     mode désigne aujourd'hui UN AUTRE salon (l'artiste a changé le
--     lieu de son encadré sans le fermer — la ligne d'ici ne dit plus
--     rien de vrai). Un mode ne vit qu'à un endroit.
--
-- CE QUI N'EST JAMAIS SUPPRIMÉ : toute liaison par mode dont le mode
-- désigne bien ce salon (les vraies lignes, résident comme guest), et
-- toute liaison sans mode qui reste le seul lien du couple.
--
-- LA ROUTE POSE DÉSORMAIS LES MÊMES RÈGLES À L'ÉCRITURE (nº 412) :
-- cette migration nettoie L'EXISTANT, la route empêche le retour.
--
-- ⚠️ AUCUN ORDRE IMPOSÉ avec le déploiement : elle ne change aucune
-- forme, elle retire des lignes que le site d'avant comme celui
-- d'après lisent de la même façon. IDEMPOTENTE : la seconde passe ne
-- trouve plus rien à supprimer.
-- ============================================================

-- LE DIAGNOSTIC, À COLLER D'ABORD SI TU VEUX VOIR L'ÉTAT (facultatif,
-- ne modifie rien) — pour Gaston et Hand In Glove Tattoo, remplace au
-- besoin les deux slugs :
--   select l.id, l.origine, l.statut, l.mode_id, m.genre as genre_du_mode,
--          m.salon_id as salon_du_mode
--     from public.liaisons_artiste_salon l
--     left join public.modes_exercice m on m.id = l.mode_id
--    where l.artiste_id = (select id from public.tatoueurs where slug = 'gaston-paris')
--      and l.salon_id   = (select id from public.tatoueurs where slug = 'hand-in-glove-tattoo-paris');

begin;

-- 1) Les liaisons sans mode devenues redondantes.
delete from public.liaisons_artiste_salon as l
 where l.mode_id is null
   and exists (
     select 1
       from public.liaisons_artiste_salon as autre
      where autre.artiste_id = l.artiste_id
        and autre.salon_id = l.salon_id
        and autre.mode_id is not null
   );

-- 2) Les liaisons dont le mode désigne un autre salon.
delete from public.liaisons_artiste_salon as l
 where l.mode_id is not null
   and exists (
     select 1
       from public.modes_exercice as m
      where m.id = l.mode_id
        and m.salon_id is distinct from l.salon_id
   );

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; deux requêtes)
-- ============================================================
-- a) Plus aucune ligne sans mode à côté d'une ligne par mode — doit
--    rendre 0 :
--    select count(*)
--      from public.liaisons_artiste_salon l
--     where l.mode_id is null
--       and exists (select 1 from public.liaisons_artiste_salon a
--                    where a.artiste_id = l.artiste_id
--                      and a.salon_id = l.salon_id
--                      and a.mode_id is not null);
--
-- b) Plus aucun mode lié ailleurs que chez son salon — doit rendre 0 :
--    select count(*)
--      from public.liaisons_artiste_salon l
--      join public.modes_exercice m on m.id = l.mode_id
--     where m.salon_id is distinct from l.salon_id;
