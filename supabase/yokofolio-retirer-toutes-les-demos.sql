-- ===================================================================
-- MIGRATION Nº 68 — RETIRER TOUTES LES FICHES DE DÉMONSTRATION
-- (passe nº 280-§2)
-- ===================================================================
-- ⚠️ ELLE REMPLACE LA Nº 67 ET VA PLUS LOIN. La nº 67
-- (`yokofolio-retirer-fiches-demo.sql`) ne visait que les 72 fiches
-- de la passe nº 214, reconnaissables à leur slug `demo-p214-%`. Il en
-- restait beaucoup d'autres, plus anciennes — « Ombre Portée »,
-- « Studio Caméléon », « Ligne Claire Studio »… — insérées par
-- `tatoueurs.sql` (le jeu d'origine, 13 fiches) et par
-- `yokofolio-fiches-internationales.sql` (5 fiches). Celle-ci les
-- prend TOUTES. Passer la nº 67 avant n'est ni nécessaire ni gênant :
-- ce qu'elle a déjà retiré ne sera simplement pas recompté.
--
-- ===================================================================
-- COMMENT ON RECONNAÎT UNE FICHE DE DÉMONSTRATION — TROIS MARQUEURS
-- ===================================================================
-- Aucun de ces trois ne peut désigner une vraie fiche, et ils se
-- recoupent (la plupart des fiches en portent deux ou trois) :
--   1. SON INSTAGRAM EST UN FAUX COMPTE : il finit par `.demo/`
--      (`atelier.corvus.demo`, `ombre.portee.demo`…) ou vaut
--      `yokofolio_demo` (les fiches de la nº 214). Un vrai tatoueur
--      n'aura jamais cela ;
--   2. SA PHOTO PRINCIPALE EST UN DESSIN DU SITE : elle commence par
--      `/images-demo/`, l'adresse des SVG générés à la volée. Une
--      vraie fiche pointe vers le stockage Supabase ;
--   3. SON SLUG COMMENCE PAR `demo-p214-` (les 72 de la nº 214).
--
-- ⚠️⚠️ CE QU'ELLE NE TOUCHE JAMAIS — LISEZ CECI AVANT DE LA PASSER.
-- LES FICHES DE DÉMARCHAGE DU COMPTE ADMINISTRATEUR sont hors
-- d'atteinte : elles portent de VRAIS noms de salons et d'artistes, un
-- vrai compte Instagram (ou aucun), et leurs photos viennent du
-- stockage — aucun des trois marqueurs. Ce sont les outils de
-- prospection du propriétaire. La migration les COMPTE avant et après
-- et affiche les deux nombres : s'ils diffèrent d'une seule unité, le
-- verdict le dit et il faut faire `rollback`.
--
-- ⚠️ ET ELLE NE SUPPRIME QUE DES FICHES DE DÉMONSTRATION, jamais une
-- fiche « qui leur ressemble » : le BLOC 1 ci-dessous liste NOM PAR
-- NOM ce qu'elle va retirer. À relire avant de valider.
--
-- LES DÉPENDANCES PARTENT AVEC, ET IL N'EN RESTE AUCUNE ORPHELINE :
--   · en cascade (la base s'en charge) — photos (donc les cœurs qui
--     les visent), studios, modes d'exercice, liaisons artiste/salon,
--     abonnements, rattachements de démarchage ;
--   · à la main (la base laisserait une ligne vide de sens) — les
--     modes d'AUTRES fiches qui désignent une démo comme salon, les
--     notifications et les suggestions de style ;
--   · à la main aussi (aucune clé étrangère, rattachement par slug) —
--     les clics et les signalements.
--
-- REJOUABLE : la passer deux fois ne fait rien la seconde fois.
-- AUCUN ORDRE IMPOSÉ : elle ne dépend d'aucune autre migration.
-- ===================================================================

begin;

-- ---------- 0) CE QU'ON CIBLE, UNE FOIS POUR TOUTES ----------
create temporary table _demos on commit drop as
select id, nom, slug, ville_nom, lien_instagram, photo_principale
  from public.tatoueurs
 where slug like 'demo-p214-%'
    or lien_instagram like '%.demo/%'
    or lien_instagram like '%yokofolio_demo%'
    or photo_principale like '/images-demo/%';

-- ---------- 1) LA LISTE, À RELIRE AVANT DE VALIDER ----------
--  ⚠️ C'EST LE BLOC QUE LE PROPRIÉTAIRE A DEMANDÉ : rien n'est encore
--  supprimé quand il s'affiche (la transaction n'est pas validée).
select nom, slug, ville_nom, lien_instagram
  from _demos
 order by nom;

-- ---------- 2) L'ÉTAT AVANT ----------
create temporary table _avant on commit drop as
select
  (select count(*) from _demos)                                as fiches_demo,
  (select count(*) from public.photos_tatoueur p
     where p.tatoueur_id in (select id from _demos))           as photos_demo,
  (select count(*) from public.tatoueurs
    where id not in (select id from _demos))                   as autres_fiches,
  --  LES FICHES DE DÉMARCHAGE — comptées à part, et deux fois : par
  --  la table de rattachement ET par les fiches elles-mêmes.
  (select count(*) from public.demarchage_fiches)              as rattachements_demarchage,
  (select count(*) from public.tatoueurs t
    where exists (select 1 from public.demarchage_fiches d where d.tatoueur_id = t.id))
                                                               as fiches_demarchage;

--  ⚠️ GARDE-FOU : une fiche de démarchage ne doit JAMAIS être dans la
--  cible. Si ce compte n'est pas zéro, ARRÊTEZ TOUT (rollback) et
--  dites-le — un marqueur aurait attrapé une vraie fiche.
select count(*) as demarchage_dans_la_cible_DOIT_ETRE_ZERO
  from _demos d
 where exists (select 1 from public.demarchage_fiches x where x.tatoueur_id = d.id);

-- ---------- 3) CE QUE LA BASE NE SAIT PAS EFFACER ----------
update public.modes_exercice
   set salon_id = null
 where salon_id in (select id from _demos);

delete from public.notifications_compte
 where fiche_id in (select id from _demos);

delete from public.suggestions_style
 where fiche_id in (select id from _demos);

delete from public.clics_fiches
 where tatoueur_slug in (select slug from _demos);

delete from public.signalements_fiches
 where tatoueur_slug in (select slug from _demos);

-- ---------- 4) LES FICHES ----------
--  Tout le reste part EN CASCADE : photos (et leurs cœurs), studios,
--  modes, liaisons, abonnements, rattachements de démarchage.
delete from public.tatoueurs where id in (select id from _demos);

-- ---------- 5) L'ÉTAT APRÈS, ET LE VERDICT ----------
select
  a.fiches_demo                                                as demos_avant,
  (select count(*) from public.tatoueurs
    where slug like 'demo-p214-%'
       or lien_instagram like '%.demo/%'
       or lien_instagram like '%yokofolio_demo%'
       or photo_principale like '/images-demo/%')              as demos_apres,
  a.photos_demo                                                as photos_demo_avant,
  a.autres_fiches                                              as autres_fiches_avant,
  (select count(*) from public.tatoueurs)                      as autres_fiches_apres,
  a.rattachements_demarchage                                   as demarchage_avant,
  (select count(*) from public.demarchage_fiches)              as demarchage_apres,
  a.fiches_demarchage                                          as fiches_demarchage_avant,
  (select count(*) from public.tatoueurs t
    where exists (select 1 from public.demarchage_fiches d where d.tatoueur_id = t.id))
                                                               as fiches_demarchage_apres,
  case
    when (select count(*) from public.tatoueurs
           where slug like 'demo-p214-%'
              or lien_instagram like '%.demo/%'
              or lien_instagram like '%yokofolio_demo%'
              or photo_principale like '/images-demo/%') = 0
     and (select count(*) from public.tatoueurs) = a.autres_fiches
     and (select count(*) from public.demarchage_fiches) = a.rattachements_demarchage
    then '✅ toutes les fiches de démonstration sont parties ; AUCUNE autre fiche, AUCUNE fiche de démarchage n''a bougé'
    else '⚠️ VÉRIFIER : un compte ne correspond pas — faire rollback, ne pas valider'
  end                                                          as verdict
from _avant a;

-- ---------- 6) AUCUNE LIGNE ORPHELINE ----------
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
  (select count(*) from public.notifications_compte n
    where n.fiche_id is not null
      and not exists (select 1 from public.tatoueurs t where t.id = n.fiche_id))
                                                               as notifications_fantomes;

commit;

-- ===================================================================
-- SI QUELQUE CHOSE NE VA PAS : remplacer `commit;` par `rollback;` et
-- repasser le fichier — rien n'aura été écrit. Les blocs 1, 2, 5 et 6
-- s'affichent AVANT la validation, c'est fait pour.
--
-- CE QUE LA LISTE DU BLOC 1 DEVRAIT CONTENIR (état connu du dépôt) :
--   · 13 fiches du jeu d'origine (`tatoueurs.sql`) — Atelier Corvus,
--     Studio Mille Traits, Nadège Roux, Encre & Sel, Hokusai
--     Mécanique, Camille Fauve, Typo Sauvage, Ligne Claire Studio,
--     Ombre Portée, Maison Vermillon, Kōsei Tattoo, Trait Nord,
--     Studio Caméléon ;
--   · 5 fiches internationales — Kreuzberg Nadel, Isar Studio, Tinta
--     Gòtica, Lone Star Ink, Atelier Boréal ;
--   · 72 fiches de pagination — slugs `demo-p214-…` (déjà parties si
--     la nº 67 a été passée).
-- Toute fiche de la liste qui ne serait dans AUCUNE de ces trois
-- familles doit être signalée AVANT de valider.
-- ===================================================================
