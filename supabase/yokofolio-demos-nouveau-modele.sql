-- ============================================================
--  YOKOFOLIO — LES FICHES DE DÉMONSTRATION, AU NOUVEAU MODÈLE
--  (migration nº 30 — à passer APRÈS
--   yokofolio-debloquer-fiches-existantes.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : chaque insertion vérifie d'abord qu'elle
--  n'a pas déjà eu lieu.
--
--  POURQUOI CE FICHIER
--  -------------------
--  La migration nº 21 avait basculé TOUTES les fiches en « salon » à
--  une adresse. Prudent sur le moment, mais la démonstration s'est
--  retrouvée sans un seul artiste, sans une seule équipe, sans une
--  seule session guest — donc sans rien de ce qui a été construit
--  depuis : modes d'exercice, rattachements, expiration automatique.
--  On ne pouvait plus rien montrer, ni rien vérifier.
--
--  CE FICHIER LES REBÂTIT, et couvre TOUS les cas :
--   · artiste EN SALON, rattaché à un salon inscrit (Nadège Roux) ;
--   · artiste EN SALON, adresse saisie à la main (Typo Sauvage) ;
--   · artiste GUEST, rattaché, dates EN COURS (Kōsei Tattoo) ;
--   · artiste GUEST, adresse manuelle, dates À VENIR (Kōsei encore :
--     DEUX sessions, dans le même mode d'exercice) ;
--   · artiste GUEST, dates TERMINÉES — il doit DISPARAÎTRE des
--     équipes tout seul (Trait Nord, Studio Caméléon) ;
--   · artiste À DOMICILE (Trait Nord, Studio Caméléon) ;
--   · artiste CUMULANT trois modes (Studio Caméléon) ;
--   · salon à UNE adresse (la plupart) ;
--   · salon MULTI-ADRESSES (Atelier Corvus, deux studios) ;
--   · salon avec ÉQUIPE constituée — résidents ET guest (Corvus) ;
--   · et une liaison venue du SENS INVERSE, salon → artiste
--     (Hokusai Mécanique invite Camille Fauve).
--
--  TOUTES LES LIAISONS SONT À L'ÉTAT « validee » : sans quoi les
--  équipes resteraient vides, et il n'y aurait rien à regarder.
--
--  ⚠️ CE FICHIER CHANGE DES `type_fiche` DE FICHES VERROUILLÉES.
--  C'est possible ICI, et seulement ici : l'éditeur SQL travaille
--  avec la clé de service, pour laquelle `auth.uid()` est null — le
--  déclencheur de la migration nº 28 la laisse passer. Depuis un
--  navigateur, la même requête serait ignorée. C'est exactement la
--  protection voulue.
--
--  ⚠️ AUCUNE DE CES FICHES N'EXISTE, et aucune de ces images n'est
--  une vraie photo de tatouage. Elles doublent, à l'identique, les
--  fiches de src/lib/tatoueurs-demo.ts.
-- ============================================================

-- ------------------------------------------------------------
-- 0) LE TYPE DE CHAQUE FICHE DE DÉMONSTRATION
-- ------------------------------------------------------------
update public.tatoueurs set type_fiche = 'artiste'
 where slug in (
   'nadege-roux-villeurbanne',
   'camille-fauve-paris-18e',
   'typo-sauvage-bordeaux',
   'kosei-tattoo-lyon-2e',
   'trait-nord-strasbourg',
   'studio-cameleon-bordeaux'
 );

update public.tatoueurs set type_fiche = 'salon'
 where slug in (
   'atelier-corvus-lyon-1er',
   'studio-mille-traits-lyon-6e',
   'encre-sel-marseille-1er',
   'hokusai-mecanique-paris-11e',
   'ligne-claire-studio-nantes',
   'ombre-portee-toulouse',
   'maison-vermillon-lille',
   'kreuzberg-nadel-berlin',
   'isar-studio-munich',
   'tinta-gotica-barcelone',
   'lone-star-ink-austin',
   'atelier-boreal-montreal'
 );

--  ET ELLES SONT CONSIDÉRÉES CONFIRMÉES : sans cela, elles
--  retomberaient dans l'encadré « Confirme ce premier bloc ».
update public.tatoueurs set exercice_verrouille = true
 where slug in (
   'atelier-corvus-lyon-1er', 'studio-mille-traits-lyon-6e',
   'nadege-roux-villeurbanne', 'encre-sel-marseille-1er',
   'hokusai-mecanique-paris-11e', 'camille-fauve-paris-18e',
   'typo-sauvage-bordeaux', 'ligne-claire-studio-nantes',
   'ombre-portee-toulouse', 'maison-vermillon-lille',
   'kosei-tattoo-lyon-2e', 'trait-nord-strasbourg',
   'studio-cameleon-bordeaux', 'kreuzberg-nadel-berlin',
   'isar-studio-munich', 'tinta-gotica-barcelone',
   'lone-star-ink-austin', 'atelier-boreal-montreal'
 );

-- ------------------------------------------------------------
-- 1) ON REPART DE ZÉRO POUR CES DIX-HUIT FICHES
-- ------------------------------------------------------------
--  Uniquement pour ELLES : les fiches de vrais tatoueurs ne sont
--  jamais touchées par ce fichier.
create temporary table demos_yokofolio on commit drop as
  select id, slug, type_fiche, nom, adresse, code_postal, ville_nom,
         region, pays, code_pays, latitude, longitude, lieu_id
    from public.tatoueurs
   where slug in (
     'atelier-corvus-lyon-1er', 'studio-mille-traits-lyon-6e',
     'nadege-roux-villeurbanne', 'encre-sel-marseille-1er',
     'hokusai-mecanique-paris-11e', 'camille-fauve-paris-18e',
     'typo-sauvage-bordeaux', 'ligne-claire-studio-nantes',
     'ombre-portee-toulouse', 'maison-vermillon-lille',
     'kosei-tattoo-lyon-2e', 'trait-nord-strasbourg',
     'studio-cameleon-bordeaux', 'kreuzberg-nadel-berlin',
     'isar-studio-munich', 'tinta-gotica-barcelone',
     'lone-star-ink-austin', 'atelier-boreal-montreal'
   );

delete from public.liaisons_artiste_salon
 where artiste_id in (select id from demos_yokofolio)
    or salon_id in (select id from demos_yokofolio);
delete from public.modes_exercice
 where tatoueur_id in (select id from demos_yokofolio);
delete from public.studios
 where tatoueur_id in (select id from demos_yokofolio);

-- ------------------------------------------------------------
-- 2) LES STUDIOS DES SALONS
-- ------------------------------------------------------------
--  2a. LE STUDIO PRINCIPAL — l'adresse de la fiche, telle quelle.
insert into public.studios (
  tatoueur_id, nom, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, lieu_id, principal, ordre
)
select d.id, null, coalesce(d.adresse, d.ville_nom), d.adresse,
       d.code_postal, d.ville_nom, d.region, d.pays, d.code_pays,
       d.latitude, d.longitude, d.lieu_id, true, 0
  from demos_yokofolio d
 where d.type_fiche = 'salon';

--  2b. LA SECONDE ADRESSE D'ATELIER CORVUS — le cas multi-studios.
insert into public.studios (
  tatoueur_id, nom, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, principal, ordre
)
select d.id, null, '18 cours Gambetta, 69007 Lyon', '18 cours Gambetta',
       '69007', 'Lyon 7e', d.region, d.pays, d.code_pays,
       45.7508, 4.8442, false, 1
  from demos_yokofolio d
 where d.slug = 'atelier-corvus-lyon-1er';

-- ------------------------------------------------------------
-- 3) LES MODES D'EXERCICE DES ARTISTES
-- ------------------------------------------------------------
--  3a. LES MODES RATTACHÉS À UN SALON INSCRIT — l'adresse du mode
--      est CELLE DU SALON, recopiée : la ligne doit rester lisible
--      même si le salon disparaît un jour.
insert into public.modes_exercice (
  tatoueur_id, genre, salon_id, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, lieu_id,
  debut_le, fin_le, ordre
)
select a.id, m.genre, s.id,
       coalesce(s.adresse, s.ville_nom), s.adresse, s.code_postal,
       s.ville_nom, s.region, s.pays, s.code_pays,
       s.latitude, s.longitude, s.lieu_id,
       m.debut_le, m.fin_le, m.ordre
  from (values
    -- artiste                      salon                            genre      du            au            rang
    ('nadege-roux-villeurbanne', 'atelier-corvus-lyon-1er',      'salon', null::date,      null::date,      0),
    ('camille-fauve-paris-18e',  'hokusai-mecanique-paris-11e',  'salon', null,            null,            0),
    -- EN COURS : la session guest qui fait apparaître Kōsei dans
    -- l'équipe de Corvus, au rang « Guest ».
    ('kosei-tattoo-lyon-2e',     'atelier-corvus-lyon-1er',      'guest', date '2026-07-20', date '2026-08-31', 0),
    -- TERMINÉE : Studio Caméléon a été guest chez Ligne Claire, et
    -- n'y figure plus — sans que personne ait rien effacé.
    ('studio-cameleon-bordeaux', 'ligne-claire-studio-nantes',   'guest', date '2026-03-02', date '2026-03-12', 1)
  ) as m(artiste_slug, salon_slug, genre, debut_le, fin_le, ordre)
  join demos_yokofolio a on a.slug = m.artiste_slug
  join demos_yokofolio s on s.slug = m.salon_slug;

--  3b. LES MODES SITUÉS À LA MAIN — aucun salon lié, une adresse.
insert into public.modes_exercice (
  tatoueur_id, genre, salon_id, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude,
  debut_le, fin_le, ordre
)
select a.id, m.genre, null,
       m.intitule, m.adresse, m.code_postal, m.ville,
       a.region, a.pays, a.code_pays, m.latitude, m.longitude,
       m.debut_le, m.fin_le, m.ordre
  from (values
    -- EN SALON, adresse manuelle.
    ('typo-sauvage-bordeaux', 'salon',
     '31 rue Sainte-Catherine, 33000 Bordeaux', '31 rue Sainte-Catherine',
     '33000', 'Bordeaux', 44.8378::numeric, -0.5792::numeric,
     null::date, null::date, 0),
    -- GUEST À VENIR, adresse manuelle : la SECONDE session de Kōsei.
    ('kosei-tattoo-lyon-2e', 'guest',
     '9 rue Notre-Dame, 33000 Bordeaux', '9 rue Notre-Dame',
     '33000', 'Bordeaux', 44.8506, -0.5714,
     date '2026-09-10', date '2026-09-20', 1),
    -- GUEST TERMINÉE, adresse manuelle.
    ('trait-nord-strasbourg', 'guest',
     '12 quai des Bateliers, 67000 Strasbourg', '12 quai des Bateliers',
     '67000', 'Strasbourg', 48.5806, 7.7529,
     date '2026-05-01', date '2026-05-15', 0),
    -- À DOMICILE : ni rue ni numéro à l'affichage (la promesse de
    -- vie privée est tenue par le code, pas par la base).
    ('trait-nord-strasbourg', 'domicile',
     'Strasbourg', null, '67000', 'Strasbourg', 48.5734, 7.7521,
     null, null, 1),
    ('studio-cameleon-bordeaux', 'salon',
     '5 place Fernand-Lafargue, 33000 Bordeaux', '5 place Fernand-Lafargue',
     '33000', 'Bordeaux', 44.8383, -0.5707,
     null, null, 0),
    ('studio-cameleon-bordeaux', 'domicile',
     'Bordeaux', null, '33000', 'Bordeaux', 44.8496, -0.5722,
     null, null, 2)
  ) as m(artiste_slug, genre, intitule, adresse, code_postal, ville,
         latitude, longitude, debut_le, fin_le, ordre)
  join demos_yokofolio a on a.slug = m.artiste_slug;

-- ------------------------------------------------------------
-- 4) LES RATTACHEMENTS — TOUS VALIDÉS
-- ------------------------------------------------------------
--  L'ORIGINE COMPTE, et c'est tout l'intérêt de la démonstration :
--   · Nadège Roux et Kōsei Tattoo se sont DÉCLARÉS chez leur salon
--     (origine « artiste »), et le salon a confirmé ;
--   · Camille Fauve a été INVITÉE par Hokusai Mécanique (origine
--     « salon »), et elle a accepté. C'est le chemin inverse, celui
--     qui n'avait aucune interface jusqu'à la passe précédente.
--  Chaque liaison pend au MODE qui la porte : c'est lui qui décide
--  si le rattachement est celui d'un résident ou d'un guest daté.
insert into public.liaisons_artiste_salon (
  artiste_id, salon_id, mode_id, origine, statut, demandee_le, repondu_le
)
select m.tatoueur_id, m.salon_id, m.id,
       case when a.slug = 'camille-fauve-paris-18e' then 'salon'
            else 'artiste' end,
       'validee', now() - interval '30 days', now() - interval '29 days'
  from public.modes_exercice m
  join demos_yokofolio a on a.id = m.tatoueur_id
 where m.salon_id is not null;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Qui est quoi :
--  select nom, type_fiche, exercice_verrouille from public.tatoueurs
--   where slug like '%-%' order by type_fiche, nom;
--
--  -- Les modes de chaque artiste :
--  select t.nom, m.genre, m.ville, m.debut_le, m.fin_le
--    from public.modes_exercice m join public.tatoueurs t on t.id = m.tatoueur_id
--   order by t.nom, m.ordre;
--
--  -- LES ÉQUIPES TELLES QUE LE PUBLIC LES VOIT (les sessions
--  -- terminées ne doivent PAS y figurer) :
--  select s.nom as salon, e.artiste_nom, e.genre, e.fin_le
--    from public.equipe_salon e join public.tatoueurs s on s.id = e.salon_id
--   order by s.nom, e.artiste_nom;
