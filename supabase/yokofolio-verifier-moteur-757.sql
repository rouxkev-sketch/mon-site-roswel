-- ============================================================
-- nº 757 — VÉRIFIER QUE LE MOTEUR CONNAÎT LES NOUVEAUX MODES
-- ============================================================
-- ⚠️ CE FICHIER NE MODIFIE RIEN. Pas un `create`, pas un `alter`, pas
-- une ligne écrite : SEPT LECTURES, chacune avec la valeur attendue en
-- face. Il se colle dans l'éditeur SQL de Supabase quand tu veux, et
-- se rejoue autant de fois que tu veux.
--
-- POURQUOI IL EXISTE, ALORS QUE LA PASSE nº 757 N'A PAS DE MIGRATION.
-- La passe a prouvé, sur un vrai PostgreSQL monté à partir des
-- fichiers de ce dossier, que la recherche par ville trouve DÉJÀ les
-- trois nouveaux cas — une zone du mode « Autre », un guest sans lieu
-- pendant ses dates, un artiste en convention pendant les siennes — et
-- qu'une session ou une convention terminée disparaît toute seule.
-- Rien à coller, donc. Mais « rien à coller » se démontre : ces sept
-- lectures disent si TA base est bien dans cet état. Si l'une d'elles
-- ne rend pas la valeur attendue, c'est qu'un fichier n'est pas passé
-- chez toi — dis-le-moi, ne colle rien d'autre.
--
-- CE QUE CHAQUE LIGNE VÉRIFIE, en clair :
--  1. la contrainte de genre accepte les six genres (nº 748) ;
--  2. `modes_exercice_actifs` écarte ce dont la date de fin est
--     passée — c'est ELLE qui fait expirer guests ET conventions ;
--  3. `zones_tatoueur` prend TOUS les genres (elle ne nomme aucun
--     genre dans son `from`) : une zone, un guest sans lieu et une
--     convention y entrent au même titre qu'un salon ;
--  4. `lieux_annexes_tatoueur` aussi — c'est par elle que passe la
--     recherche PAR VILLE (nom et slug) ;
--  5. la fonction de recherche compare les genres GÉNÉRIQUEMENT
--     (`m.genre = any (p_modes)`) : rien à y ajouter pour deux genres
--     de plus ;
--  6. combien de lignes de chaque nouveau genre tu as en base, et
--     combien sont ENCORE ACTIVES (le reste a expiré tout seul) ;
--  7. combien de ces lignes sont SITUÉES (latitude et longitude
--     posées) : une ligne sans point ne peut être trouvée par aucune
--     recherche géographique — c'est le seul cas qui demanderait une
--     correction, et il se lit ici.
-- ============================================================

select
  'nº 757 · 1. les six genres sont acceptés' as verification,
  case when pg_get_constraintdef(oid) like '%convention%'
        and pg_get_constraintdef(oid) like '%independent%'
       then 'OK' else 'MANQUE — colle yokofolio-conventions-et-independent.sql' end as resultat,
  'attendu : OK' as attendu
  from pg_constraint where conname = 'modes_exercice_genre_connu'

union all
select
  'nº 757 · 2. les modes expirés sortent d''eux-mêmes',
  case when pg_get_viewdef('public.modes_exercice_actifs'::regclass)
            like '%fin_le >= CURRENT_DATE%'
       then 'OK' else 'MANQUE — la vue n''expire rien' end,
  'attendu : OK'

union all
select
  'nº 757 · 3. zones_tatoueur prend tous les genres',
  case when pg_get_viewdef('public.zones_tatoueur'::regclass)
            like '%modes_exercice_actifs%'
       then 'OK' else 'MANQUE — colle yokofolio-conventions-et-independent.sql' end,
  'attendu : OK'

union all
select
  'nº 757 · 4. lieux_annexes_tatoueur aussi (recherche par ville)',
  case when pg_get_viewdef('public.lieux_annexes_tatoueur'::regclass)
            like '%modes_exercice_actifs%'
       then 'OK' else 'MANQUE — colle yokofolio-conventions-et-independent.sql' end,
  'attendu : OK'

union all
select
  'nº 757 · 5. la recherche compare les genres génériquement',
  case when pg_get_functiondef(oid) like '%m.genre = any (p_modes)%'
         or pg_get_functiondef(oid) like '%m.genre = any(p_modes)%'
       then 'OK' else 'À REGARDER — la fonction nomme des genres en dur' end,
  'attendu : OK'
  from pg_proc where proname = 'rechercher_tatoueurs'

union all
select
  'nº 757 · 6. lignes des nouveaux genres (total / encore actives)',
  coalesce((select count(*)::text from public.modes_exercice
             where genre in ('convention','independent')), '0')
    || ' / '
    || coalesce((select count(*)::text from public.modes_exercice_actifs
                  where genre in ('convention','independent')), '0'),
  'informatif — les actives seules sont cherchables'

union all
select
  'nº 757 · 7. nouveaux modes SANS point (introuvables en recherche)',
  coalesce((select count(*)::text from public.modes_exercice
             where genre in ('convention','independent','guest')
               and (latitude is null or longitude is null)), '0'),
  'attendu : 0 — sinon dis-le-moi'
;
