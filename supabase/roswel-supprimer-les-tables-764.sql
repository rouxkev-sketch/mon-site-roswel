-- ============================================================
--  nº 764 — SUPPRIMER LES DOUZE TABLES DE ROSWEL
--  (remplace le brouillon de la nº 758, qui butait sur une règle
--   de sécurité — voir « CE QUI A CHANGÉ » ci-dessous)
-- ============================================================
--  ⚠️ C'EST LE GESTE IRRÉVERSIBLE DU MÉNAGE. À coller quand tu as :
--    1. fait ta sauvegarde (`node outils/sauvegarde.mjs`) — les
--       35 000 communes et l'historique des artisans ne se
--       reconstruisent pas d'un clic ;
--    2. déployé le site sans Roswel (passes nº 759 à 761) : plus une
--       ligne de code ne lit ces tables.
--
--  ⚠️ TOUT EN UNE TRANSACTION. L'éditeur SQL de Supabase exécute le
--  fichier entier d'un bloc : ou tout passe, ou rien ne passe. Tu l'as
--  déjà vérifié à tes dépens en collant le brouillon de la nº 758 —
--  il a refusé, et il n'a rien laissé derrière lui.
--
--  ⚠️ `restrict`, PAS `cascade`, ET C'EST VOULU. `cascade` emporte
--  silencieusement tout ce qui dépend de la table — y compris ce qu'on
--  n'avait pas vu. `restrict` REFUSE et NOMME l'obstacle. S'il refuse,
--  envoie-moi l'erreur : elle dit exactement quoi regarder.
--
-- ============================================================
--  CE QUI A CHANGÉ DEPUIS LE BROUILLON DE LA nº 758
-- ============================================================
--  TON ERREUR, MOT POUR MOT, ET ELLE ÉTAIT JUSTE :
--
--    ERROR: cannot drop table conversations because other objects
--           depend on it
--    DETAIL: policy particuliers_vus_par_artisan_contacte on table
--            particuliers depends on table conversations
--
--  LA CAUSE. Une règle de sécurité qui LIT une table crée une
--  dépendance sur elle. Celle-ci vit sur `particuliers` et lit
--  `conversations` et `artisans` (c'est elle qui laissait un artisan
--  voir le prénom des particuliers qui lui avaient écrit, passe
--  nº 699). Or `conversations` est supprimée AVANT `particuliers` :
--  au moment du `drop`, la règle existe encore et pointe dessus.
--  `restrict` a fait son travail.
--
--  LA QUESTION QUI DÉCIDAIT DE TOUT — et la réponse est nette.
--  Cette règle protège-t-elle une table de ROSWEL ou une table de
--  YOKOFOLIO ? Une règle posée sur une table de YokoFolio, on n'y
--  touche pas (leçon des nº 699/726 : les droits de cette base sont
--  délicats). Vérifié DEUX FOIS, par deux méthodes indépendantes :
--   · en lisant les 56 `create policy` de tous les fichiers SQL du
--     dépôt — ce sont eux qui ont bâti la base ;
--   · en interrogeant le catalogue de PostgreSQL (`pg_depend`) sur une
--     base d'essai où Roswel et YokoFolio cohabitent.
--  VERDICT : TOUTES les règles qui croisent une table de Roswel sont
--  POSÉES SUR UNE TABLE DE ROSWEL. AUCUNE table de YokoFolio n'est
--  concernée — ni de près, ni de loin.
--
--  LA CORRECTION est donc la section 0 ci-dessous : on retire ces
--  règles-là AVANT les tables. Elles seraient parties avec leurs
--  tables de toute façon ; les retirer d'abord enlève simplement
--  l'ordre de passage du chemin.
-- ============================================================

begin;

--  ── LE COMPTE D'AVANT, pour le relevé de la fin ──
--  On note ce que YokoFolio possède AVANT de toucher à quoi que ce
--  soit : le relevé final le comparera à ce qui reste. Aucun chiffre à
--  connaître par cœur, aucun tableau à comparer à la main.
create temporary table avant_764 on commit drop as
select
  (select count(*) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname not in (
        'artisans','artisan_metiers','artisans_prospects','particuliers',
        'favoris','conversations','messages','demandes_rdv',
        'messages_contact','signalements','communes','prospection_envois')
  ) as tables_yokofolio,
  (select count(*) from pg_policy pol
     join pg_class c on c.oid = pol.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname not in (
        'artisans','artisan_metiers','artisans_prospects','particuliers',
        'favoris','conversations','messages','demandes_rdv',
        'messages_contact','signalements','communes','prospection_envois')
  ) as regles_yokofolio;

--  ══ 0. LES RÈGLES DE SÉCURITÉ QUI CROISENT DEUX TABLES ══
--  Toutes posées sur des tables de Roswel. `if exists` : si l'une
--  manque déjà sur ta base, la ligne passe sans bruit.
--  ⚠️ AUCUNE RÈGLE DE YOKOFOLIO N'EST NOMMÉE ICI. Relis la liste :
--  particuliers, conversations, messages, artisan_metiers — quatre
--  tables de Roswel, et rien d'autre.
drop policy if exists "particuliers_vus_par_artisan_contacte" on public.particuliers;
drop policy if exists "conversations_participants_lecture"    on public.conversations;
drop policy if exists "conversations_participants_maj"        on public.conversations;
drop policy if exists "conversations_ouverture_par_particulier" on public.conversations;
drop policy if exists "messages_participants_lecture"         on public.messages;
drop policy if exists "messages_envoi_par_participant"        on public.messages;
drop policy if exists "messages_participants_maj"             on public.messages;
drop policy if exists "metiers_lecture_publique"              on public.artisan_metiers;
drop policy if exists "metiers_gestion_par_artisan"           on public.artisan_metiers;

--  ══ 1. CE QUI POINTE VERS LE RESTE (les feuilles) ══
--  Les envois de démarchage artisans, la messagerie, les demandes.
drop table if exists public.prospection_envois restrict;
drop table if exists public.messages           restrict;
drop table if exists public.conversations      restrict;
drop table if exists public.demandes_rdv       restrict;
drop table if exists public.messages_contact   restrict;
drop table if exists public.signalements       restrict;
drop table if exists public.favoris            restrict;
drop table if exists public.artisan_metiers    restrict;

--  ══ 2. LES TABLES CENTRALES ══
drop table if exists public.artisans_prospects restrict;
drop table if exists public.artisans           restrict;
drop table if exists public.particuliers       restrict;

--  ══ 3. LES 35 000 COMMUNES ══
--  Le plus gros morceau, et le plus rassurant : son SEUL lecteur
--  vivant était `api/verif-supabase`, un outil de diagnostic éteint en
--  production — et cette route a été supprimée à la nº 760. Le repli
--  du champ de localité, lui, lit `tatoueurs` : il ne perd rien.
drop table if exists public.communes restrict;

--  ══ 4. CE QUE JE N'AI PAS PU VOIR DEPUIS LE CODE ══
--  Trois tables nommées par du code mort, introuvables dans la moindre
--  requête : elles n'existent peut-être pas. `if exists` les passe
--  sans bruit si c'est le cas.
drop table if exists public.desinscriptions restrict;
drop table if exists public.avis_google     restrict;
drop table if exists public.quotas_google   restrict;

-- ============================================================
--  LE RELEVÉ — il s'affiche dans la même exécution.
--  Les quatre lignes doivent dire « ✅ ». S'il en manque une seule,
--  envoie-moi le tableau tel quel.
-- ============================================================
select
  '1. les 12 tables de Roswel sont parties' as verification,
  count(*)::text as constate,
  '0' as attendu,
  case when count(*) = 0 then '✅' else '⚠️ IL EN RESTE' end as verdict
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and c.relname in (
     'artisans','artisan_metiers','artisans_prospects','particuliers',
     'favoris','conversations','messages','demandes_rdv',
     'messages_contact','signalements','communes','prospection_envois')

union all

--  LA LIGNE QUI COMPTE VRAIMENT : YokoFolio n'a rien perdu.
select
  '2. les tables de YokoFolio, toutes là',
  count(*)::text,
  (select tables_yokofolio::text from avant_764),
  case when count(*) = (select tables_yokofolio from avant_764)
       then '✅' else '⚠️ UNE TABLE MANQUE' end
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and c.relname not in (
     'artisans','artisan_metiers','artisans_prospects','particuliers',
     'favoris','conversations','messages','demandes_rdv',
     'messages_contact','signalements','communes','prospection_envois')

union all

select
  '3. les règles de sécurité de YokoFolio, intactes',
  count(*)::text,
  (select regles_yokofolio::text from avant_764),
  case when count(*) = (select regles_yokofolio from avant_764)
       then '✅' else '⚠️ UNE RÈGLE A SAUTÉ' end
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname not in (
     'artisans','artisan_metiers','artisans_prospects','particuliers',
     'favoris','conversations','messages','demandes_rdv',
     'messages_contact','signalements','communes','prospection_envois')

union all

--  LE SITE RÉPOND : la recherche est le cœur de YokoFolio.
select
  '4. la recherche répond toujours',
  (select count(*)::text from public.rechercher_tatoueurs(
     p_style => null, p_niveau => null, p_latitude => null,
     p_longitude => null, p_rayon_km => 0, p_ville_nom => null,
     p_ville_slug => null, p_code_pays => null, p_region => null,
     p_types => null, p_modes => null, p_technique => null,
     p_composition => null, p_besoins => null, p_rendus => null,
     p_nature => null, p_photo_rendu => null, p_limite => 5,
     p_decalage => 0, p_photos_max => 5, p_prioriser_clics => false,
     p_jour => 0)),
  'de 0 à 5 fiches',
  '✅ si elle ne rend pas d''erreur';

commit;

-- ============================================================
--  ET APRÈS ? Le champ de localité connaît ses villes par la table
--  `tatoueurs`, jamais par `communes` : ce compte ne bouge pas d'un
--  cheveu après la suppression. Tu peux le vérifier d'un coup d'œil.
-- ============================================================
select
  'les villes du champ de localité' as verification,
  count(distinct ville_nom)::text as villes_connues
  from public.tatoueurs
 where publie = true and supprime_le is null and ville_nom is not null;
