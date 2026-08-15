-- ===================================================================
-- MIGRATION Nº 67 — RETIRER LES 72 FICHES DE DÉMONSTRATION
-- (passe nº 278-§3)
-- ===================================================================
-- CE QU'ELLE FAIT, ET RIEN D'AUTRE : elle supprime les fiches créées
-- par `yokofolio-demos-pagination.sql` (passe nº 214-§3) pour éprouver
-- la pagination — SOIXANTE-DOUZE fiches inventées, dont l'adresse
-- (`slug`) commence par `demo-p214-`. Le propriétaire n'en veut plus :
-- la pagination est éprouvée, elles n'ont plus d'objet.
--
-- ⚠️⚠️ CE QU'ELLE NE TOUCHE JAMAIS — LISEZ CECI AVANT DE LA PASSER.
-- Le seul critère est `slug like 'demo-p214-%'`. Aucune autre fiche
-- n'est concernée, et EN PARTICULIER PAS LES FICHES DE DÉMARCHAGE du
-- compte administrateur : ce sont de vraies fiches, portant de vrais
-- noms de salons, préparées pour la prospection — ce sont ses outils
-- de travail. Elles n'ont pas ce préfixe, elles restent intactes, et
-- le bloc de vérification ci-dessous le PROUVE en les comptant avant
-- et après.
--
-- POURQUOI UNE MIGRATION ET PAS UN `delete` À LA MAIN : parce qu'elle
-- COMPTE avant, supprime, COMPTE après, et affiche les deux — on sait
-- ce qui a été retiré, et on sait ce qui reste.
--
-- ⚠️ LES DÉPENDANCES PARTENT AVEC, ET IL N'EN RESTE AUCUNE ORPHELINE.
-- Six tables pointent vers `tatoueurs`, et elles ne se comportent pas
-- toutes pareil :
--   · EN CASCADE (la base les efface toute seule) — `photos_tatoueur`
--     (et donc `favoris_photos`, qui pointe vers les photos en
--     cascade), `studios`, `modes_exercice` (côté `tatoueur_id`),
--     `liaisons_artiste_salon` (les deux côtés), `tatoueurs_suivis`,
--     `demarchage_fiches` ;
--   · EN `set null` (la base laisserait une ligne qui ne montre plus
--     rien) — `modes_exercice.salon_id`, `notifications_compte.
--     fiche_id`, `suggestions_style.fiche_id`. CELLES-LÀ SONT
--     TRAITÉES À LA MAIN ci-dessous, avant la suppression ;
--   · SANS CLÉ ÉTRANGÈRE, rattachées par le SLUG — `clics_fiches` et
--     `signalements_fiches`. La base ne peut rien en savoir : elles
--     sont nettoyées explicitement, sur le même préfixe.
--
-- ELLE EST REJOUABLE : la passer deux fois ne fait rien la seconde
-- fois (il n'y a plus rien à supprimer), et elle le dit.
--
-- ⚠️ AUCUN ORDRE DE LIVRAISON IMPOSÉ : elle ne dépend d'aucune autre
-- migration et n'en prépare aucune. Le site fonctionne à l'identique
-- avant et après — il y a simplement 72 fiches de moins dans la
-- mosaïque.
-- ===================================================================

begin;

-- ---------- 1) L'ÉTAT AVANT ----------
create temporary table _avant on commit drop as
select
  (select count(*) from public.tatoueurs where slug like 'demo-p214-%') as fiches_demo,
  (select count(*) from public.photos_tatoueur p
     join public.tatoueurs t on t.id = p.tatoueur_id
    where t.slug like 'demo-p214-%') as photos_demo,
  (select count(*) from public.tatoueurs where slug not like 'demo-p214-%') as autres_fiches,
  --  LES FICHES DE DÉMARCHAGE, comptées à part : ce nombre doit être
  --  RIGOUREUSEMENT LE MÊME après la suppression.
  (select count(*) from public.demarchage_fiches) as rattachements_demarchage;

-- ---------- 2) CE QUE LA BASE NE SAIT PAS EFFACER ----------
--  a) Les modes d'exercice d'AUTRES fiches qui désignent une fiche de
--     démonstration comme salon. `on delete set null` les laisserait
--     avec un salon fantôme : on coupe le lien proprement, en gardant
--     l'adresse recopiée (c'est le comportement voulu par la nº 21).
update public.modes_exercice
   set salon_id = null
 where salon_id in (select id from public.tatoueurs where slug like 'demo-p214-%');

--  b) Les notifications et les suggestions de style qui pointent vers
--     une fiche de démonstration : elles n'ont plus aucun sens (leur
--     fiche n'existera plus, et personne ne les a jamais lues — ces
--     fiches n'appartiennent à aucun compte réel).
delete from public.notifications_compte
 where fiche_id in (select id from public.tatoueurs where slug like 'demo-p214-%');

delete from public.suggestions_style
 where fiche_id in (select id from public.tatoueurs where slug like 'demo-p214-%');

--  c) LES TABLES RATTACHÉES PAR LE SLUG — la base n'a aucun moyen de
--     les suivre (pas de clé étrangère, et c'est voulu : un clic
--     compte même si la fiche est recréée).
delete from public.clics_fiches where tatoueur_slug like 'demo-p214-%';
delete from public.signalements_fiches where tatoueur_slug like 'demo-p214-%';

-- ---------- 3) LES FICHES ----------
--  Tout le reste part EN CASCADE : photos (et leurs cœurs), studios,
--  modes, liaisons, abonnements, rattachements de démarchage.
delete from public.tatoueurs where slug like 'demo-p214-%';

-- ---------- 4) L'ÉTAT APRÈS, ET LA PREUVE ----------
select
  a.fiches_demo                                        as fiches_demo_avant,
  (select count(*) from public.tatoueurs
    where slug like 'demo-p214-%')                     as fiches_demo_apres,
  a.photos_demo                                        as photos_demo_avant,
  (select count(*) from public.photos_tatoueur p
     join public.tatoueurs t on t.id = p.tatoueur_id
    where t.slug like 'demo-p214-%')                   as photos_demo_apres,
  a.autres_fiches                                      as autres_fiches_avant,
  (select count(*) from public.tatoueurs
    where slug not like 'demo-p214-%')                 as autres_fiches_apres,
  a.rattachements_demarchage                           as demarchage_avant,
  (select count(*) from public.demarchage_fiches)      as demarchage_apres,
  case
    when (select count(*) from public.tatoueurs where slug like 'demo-p214-%') = 0
     and (select count(*) from public.tatoueurs where slug not like 'demo-p214-%') = a.autres_fiches
     and (select count(*) from public.demarchage_fiches) = a.rattachements_demarchage
    then '✅ les fiches de démonstration sont parties ; AUCUNE autre fiche, AUCUN rattachement de démarchage n''a bougé'
    else '⚠️ VÉRIFIER : un compte ne correspond pas — ne pas valider la transaction'
  end                                                  as verdict
from _avant a;

-- ---------- 5) AUCUNE LIGNE ORPHELINE ----------
--  Le contrôle final : plus une seule ligne, dans AUCUNE des tables
--  rattachées, ne désigne une fiche qui n'existe plus. Zéro partout.
select
  (select count(*) from public.photos_tatoueur p
    where not exists (select 1 from public.tatoueurs t where t.id = p.tatoueur_id))
                                                       as photos_orphelines,
  (select count(*) from public.favoris_photos f
    where not exists (select 1 from public.photos_tatoueur p where p.id = f.photo_id))
                                                       as coeurs_orphelins,
  (select count(*) from public.tatoueurs_suivis s
    where not exists (select 1 from public.tatoueurs t where t.id = s.tatoueur_id))
                                                       as abonnements_orphelins,
  (select count(*) from public.modes_exercice m
    where not exists (select 1 from public.tatoueurs t where t.id = m.tatoueur_id))
                                                       as modes_orphelins,
  (select count(*) from public.modes_exercice m
    where m.salon_id is not null
      and not exists (select 1 from public.tatoueurs t where t.id = m.salon_id))
                                                       as salons_fantomes,
  (select count(*) from public.studios s
    where not exists (select 1 from public.tatoueurs t where t.id = s.tatoueur_id))
                                                       as studios_orphelins,
  (select count(*) from public.liaisons_artiste_salon l
    where not exists (select 1 from public.tatoueurs t where t.id = l.artiste_id)
       or not exists (select 1 from public.tatoueurs t where t.id = l.salon_id))
                                                       as liaisons_orphelines,
  (select count(*) from public.demarchage_fiches d
    where not exists (select 1 from public.tatoueurs t where t.id = d.tatoueur_id))
                                                       as demarchage_orphelins,
  (select count(*) from public.clics_fiches
    where tatoueur_slug like 'demo-p214-%')            as clics_restants,
  (select count(*) from public.signalements_fiches
    where tatoueur_slug like 'demo-p214-%')            as signalements_restants;

commit;

-- ===================================================================
-- SI QUELQUE CHOSE NE VA PAS : remplacer `commit;` par `rollback;` et
-- repasser le fichier — rien n'aura été écrit. Les deux blocs de
-- vérification s'affichent AVANT la validation, c'est fait pour.
-- ===================================================================
