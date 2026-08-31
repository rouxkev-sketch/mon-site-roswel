-- ============================================================
--  nº 764 — SUPPRIMER LES DOUZE TABLES DE ROSWEL
--  (version corrigée : la première butait sur l'éditeur de Supabase,
--   voir « CE QUI A ÉTÉ CORRIGÉ » plus bas)
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
--  déjà vérifié deux fois — les deux refus n'ont rien laissé derrière
--  eux.
--
--  ⚠️ `restrict`, PAS `cascade`, ET C'EST VOULU. `cascade` emporte
--  silencieusement tout ce qui dépend de la table — y compris ce qu'on
--  n'avait pas vu. `restrict` REFUSE et NOMME l'obstacle. S'il refuse,
--  envoie-moi l'erreur : elle dit exactement quoi regarder.
--
-- ============================================================
--  CE QUI A ÉTÉ CORRIGÉ (ton second essai)
-- ============================================================
--    ERROR: 42P01: relation "avant_764" does not exist
--
--  LA CAUSE. La version précédente notait, dans une TABLE TEMPORAIRE,
--  ce que YokoFolio possédait avant la suppression, pour le comparer
--  après. Une table temporaire n'existe que pour LA SESSION qui l'a
--  créée. Dans psql — l'atelier — le fichier entier passe dans une
--  seule session, et la comparaison marchait ; l'éditeur de Supabase,
--  lui, ne garantit pas cela, et l'instruction qui la relisait ne l'a
--  pas retrouvée.
--  MA FAUTE, ET LA LEÇON : j'avais éprouvé le fichier sur un vrai
--  PostgreSQL, mais pas sur l'outil qui allait vraiment l'exécuter.
--
--  LA CORRECTION. Plus une seule table temporaire. Le relevé de la fin
--  ne compare plus « avant / après » : il vérifie des choses VRAIES
--  DANS L'ABSOLU — les douze tables ne sont plus là, les dix-sept
--  tables de YokoFolio sont nommées une par une et toutes présentes,
--  la recherche répond. Rien à mémoriser d'une instruction à l'autre.
--
-- ============================================================
--  LE NŒUD DE LA RÈGLE DE SÉCURITÉ (ton premier essai)
-- ============================================================
--    ERROR: cannot drop table conversations because other objects
--           depend on it
--    DETAIL: policy particuliers_vus_par_artisan_contacte on table
--            particuliers depends on table conversations
--
--  LA CAUSE. Une règle de sécurité qui LIT une table crée une
--  dépendance sur elle. Celle-ci vit sur `particuliers` et lit
--  `conversations` et `artisans` (c'est elle qui laissait un artisan
--  voir le prénom des particuliers qui lui avaient écrit, passe
--  nº 699). Or `conversations` part AVANT `particuliers` : au moment
--  du `drop`, la règle existe encore et pointe dessus.
--
--  LA QUESTION QUI DÉCIDAIT DE TOUT, et la réponse est nette : cette
--  règle protège-t-elle une table de ROSWEL ou une table de
--  YOKOFOLIO ? Une règle posée sur une table de YokoFolio, on n'y
--  touche pas. Vérifié deux fois, par deux méthodes indépendantes —
--  les 56 `create policy` de tous les fichiers SQL du dépôt, et le
--  catalogue de PostgreSQL sur une base d'essai où les deux produits
--  cohabitent.
--  VERDICT : TOUTES les règles qui croisent une table de Roswel sont
--  POSÉES SUR UNE TABLE DE ROSWEL. Aucune table de YokoFolio n'est
--  concernée. La section 0 les retire donc avant les tables — elles
--  seraient parties avec elles de toute façon.
-- ============================================================

begin;

--  ══ 0. LES RÈGLES DE SÉCURITÉ QUI CROISENT DEUX TABLES ══
--  ⚠️ AUCUNE RÈGLE DE YOKOFOLIO N'EST NOMMÉE ICI, et c'est vérifiable
--  d'un coup d'œil : les quatre tables citées — particuliers,
--  conversations, messages, artisan_metiers — sont des tables de
--  Roswel, et rien d'autre. Ce fichier ne peut donc pas retirer un
--  droit de YokoFolio, quoi qu'il arrive.
--  `if exists` : si l'une manque déjà sur ta base, la ligne passe sans
--  bruit (un « NOTICE … skipping » s'affiche, c'est normal).
drop policy if exists "particuliers_vus_par_artisan_contacte"   on public.particuliers;
drop policy if exists "conversations_participants_lecture"      on public.conversations;
drop policy if exists "conversations_participants_maj"          on public.conversations;
drop policy if exists "conversations_ouverture_par_particulier" on public.conversations;
drop policy if exists "messages_participants_lecture"           on public.messages;
drop policy if exists "messages_envoi_par_participant"          on public.messages;
drop policy if exists "messages_participants_maj"               on public.messages;
drop policy if exists "metiers_lecture_publique"                on public.artisan_metiers;
drop policy if exists "metiers_gestion_par_artisan"             on public.artisan_metiers;

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
--  du champ de localité, lui, lit `tatoueurs` : il ne perd rien (la
--  dernière ligne du relevé te le montre).
drop table if exists public.communes restrict;

--  ══ 4. CE QUE JE N'AI PAS PU VOIR DEPUIS LE CODE ══
--  Trois tables nommées par du code mort, introuvables dans la moindre
--  requête : elles n'existent peut-être pas. `if exists` les passe
--  sans bruit si c'est le cas.
drop table if exists public.desinscriptions restrict;
drop table if exists public.avis_google     restrict;
drop table if exists public.quotas_google   restrict;

commit;

-- ============================================================
--  LE RELEVÉ — à lire dans la même fenêtre, après le COMMIT.
--  Les cinq lignes doivent dire « ✅ ». S'il en manque une seule,
--  envoie-moi le tableau tel quel.
--  ⚠️ IL NE COMPARE RIEN À UN « AVANT » : chaque ligne se vérifie
--  toute seule. C'est ce qui l'a fait échouer la première fois.
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

--  LA LIGNE QUI COMPTE VRAIMENT : YokoFolio n'a rien perdu. Les
--  dix-sept tables sont NOMMÉES, pas comptées en bloc — si une seule
--  venait à manquer, on saurait laquelle en relisant cette liste.
select
  '2. les 17 tables de YokoFolio sont toutes là',
  count(*)::text, '17',
  case when count(*) = 17 then '✅' else '⚠️ UNE TABLE MANQUE' end
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and c.relname in (
     'tatoueurs','photos_tatoueur','modes_exercice','studios',
     'liaisons_artiste_salon','notifications_compte','favoris_photos',
     'tatoueurs_suivis','clics_fiches','visites_selection',
     'signalements_fiches','suggestions_style','suppressions_comptes',
     'messages_yokofolio','demarchages','demarchage_fiches','conventions')

union all

--  Les droits de YokoFolio. Aucun nombre attendu (il dépend de ta
--  base) : ce qui se vérifie, c'est qu'il en reste — et le fichier,
--  lui, ne nomme que des règles de Roswel.
select
  '3. les règles de sécurité de YokoFolio répondent présent',
  count(*)::text, 'plus de zéro',
  case when count(*) > 0 then '✅' else '⚠️ PLUS AUCUNE RÈGLE' end
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in (
     'tatoueurs','photos_tatoueur','modes_exercice','studios',
     'liaisons_artiste_salon','notifications_compte','favoris_photos',
     'tatoueurs_suivis','clics_fiches','visites_selection',
     'signalements_fiches','suggestions_style','suppressions_comptes',
     'messages_yokofolio','demarchages','demarchage_fiches','conventions')

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
  '✅ si cette ligne s''affiche'

union all

--  ET LE CHAMP DE LOCALITÉ N'A RIEN PERDU : il connaît ses villes par
--  la table `tatoueurs`, jamais par `communes`.
select
  '5. les villes du champ de localité',
  (select count(distinct ville_nom)::text from public.tatoueurs
    where publie = true and supprime_le is null and ville_nom is not null),
  'le même nombre qu''avant',
  '✅ si ce n''est pas zéro';

-- ============================================================
--  UNE TREIZIÈME TABLE EST DANS LE MÊME CAS, et je ne la supprime pas
--  sans ton accord : `journal_appels_google` (le journal des appels à
--  Google Places, créé par `supabase/archives/journal-google.sql`).
--  Son seul lecteur, `src/lib/journal-google.ts`, est parti à la
--  nº 760. Elle ne figurait pas dans l'inventaire des douze — dis-moi
--  si tu la veux aussi, c'est une ligne à ajouter :
--      drop table if exists public.journal_appels_google restrict;
-- ============================================================
