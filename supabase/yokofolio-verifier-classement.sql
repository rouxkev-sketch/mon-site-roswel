-- =====================================================================
--  OUTIL — VÉRIFIER LE CLASSEMENT PAR POPULARITÉ (passe nº 220-§1)
--  ---------------------------------------------------------------------
--  CE FICHIER N'EST PAS UNE MIGRATION. Il n'écrit RIEN, ne crée rien,
--  ne modifie rien : il REGARDE. On peut le passer à n'importe quel
--  moment, autant de fois qu'on veut, dans l'éditeur SQL de Supabase.
--
--  Il répond à quatre questions, dans cet ordre :
--    1. quelles migrations de classement sont réellement passées ;
--    2. le compteur de consultations s'incrémente-t-il vraiment ;
--    3. quel est le classement du catalogue ;
--    4. LES VINGT-QUATRE PREMIÈRES LIGNES, telles que le serveur les
--       choisit pour l'accueil — nom, consultations, cœurs, abonnés,
--       score.
--
--  ⚠️ TOUT COLLER D'UN COUP : l'éditeur Supabase n'affiche que le
--  résultat de la DERNIÈRE requête. Passer les blocs UN PAR UN.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1) QUELLES MIGRATIONS SONT PASSÉES ?
-- ---------------------------------------------------------------------
--  Elle lit le CODE SOURCE de la fonction installée et compte combien
--  de fois le score y apparaît. C'est la réponse à « n'ai-je passé que
--  la nº 62 ? ».
--
--   · score trouvé 0 fois → ni la nº 62 ni la nº 63 : le classement
--     n'existe pas encore ;
--   · score trouvé 1 fois → SEULE LA Nº 62 est passée. Le score ne
--     sert qu'à numéroter les lignes DÉJÀ choisies : la première page
--     ne contient pas les plus populaires. Passer la nº 63 ;
--   · score trouvé 2 fois → les nº 62 ET 63 sont passées. C'est l'état
--     attendu.
select
  case when p.oid is null then '❌ la fonction rechercher_tatoueurs est ABSENTE'
       else '✅ fonction présente'
  end                                                       as fonction,
  coalesce(
    (length(p.prosrc) - length(replace(p.prosrc, 'pop.score', '')))
      / length('pop.score'),
    0)                                                      as score_trouve_n_fois,
  case
    when p.oid is null then '—'
    when p.prosrc not like '%pop.score%'
      then '❌ NI la nº 62 NI la nº 63 — aucun classement'
    when (length(p.prosrc) - length(replace(p.prosrc, 'pop.score', '')))
           / length('pop.score') < 2
      then '⚠️ SEULE la nº 62 est passée — passer la nº 63'
    else '✅ nº 62 ET nº 63 passées'
  end                                                       as verdict,
  case when v.viewname is null then '❌ vue popularite_tatoueurs ABSENTE (nº 62)'
       when exists (
         select 1 from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relname = 'popularite_tatoueurs'
           and c.reloptions::text like '%security_invoker=true%'
       ) then '⚠️ vue en security_invoker — cœurs et abonnés à ZÉRO, passer la nº 64'
       else '✅ vue lisible (nº 64)'
  end                                                       as vue
from (select 1) x
left join pg_proc p
  on p.proname = 'rechercher_tatoueurs'
 and p.pronamespace = 'public'::regnamespace
left join pg_views v
  on v.schemaname = 'public' and v.viewname = 'popularite_tatoueurs';


-- ---------------------------------------------------------------------
--  2) LE COMPTEUR DE CONSULTATIONS S'INCRÉMENTE-T-IL ?
-- ---------------------------------------------------------------------
--  Si `lignes_enregistrees` vaut 0, la table est vide : personne n'a
--  jamais été compté, et le classement ne peut rien trier.
--  ⚠️ UNE CONSULTATION PAR VISITEUR, PAR FICHE ET PAR JOUR — c'est le
--  dédoublonnage voulu (index unique de la nº 7). Ouvrir cent fois la
--  même fiche dans la même journée compte donc UNE fois : c'est normal,
--  et c'est ce qui empêche n'importe qui de gonfler son propre score.
select
  count(*)                                    as lignes_enregistrees,
  count(distinct tatoueur_slug)               as fiches_consultees,
  count(distinct visiteur)                    as visiteurs_distincts,
  min(jour)                                   as premier_jour,
  max(jour)                                   as dernier_jour
from public.clics_fiches;

--  Et le détail, fiche par fiche, du plus consulté au moins consulté :
--
--  select tatoueur_slug, count(*) as consultations, max(jour) as dernier
--    from public.clics_fiches
--   group by tatoueur_slug
--   order by consultations desc, tatoueur_slug
--   limit 30;


-- ---------------------------------------------------------------------
--  3) LE CLASSEMENT DU CATALOGUE — qui remonte, et pourquoi
-- ---------------------------------------------------------------------
--  Les trente meilleurs scores parmi les fiches EN LIGNE. C'est le
--  classement que la recherche est censée appliquer.
select
  t.nom,
  p.slug,
  p.consultations,
  p.coeurs,
  p.abonnes,
  p.score
from public.popularite_tatoueurs p
join public.tatoueurs t on t.id = p.id
where t.publie
  and t.supprime_le is null
  and coalesce(t.hors_ligne, false) = false
  and coalesce(t.statut, 'validee') <> 'refusee'
order by p.score desc, p.slug
limit 30;


-- ---------------------------------------------------------------------
--  4) LES VINGT-QUATRE PREMIÈRES LIGNES, TELLES QUE LE SERVEUR LES
--     CHOISIT POUR L'ACCUEIL
-- ---------------------------------------------------------------------
--  ⚠️ C'EST LA REQUÊTE QUI RÉPOND À LA QUESTION. Elle appelle la VRAIE
--  fonction de recherche, avec les paramètres exacts de l'accueil nu
--  (aucun style, aucun lieu, vingt-quatre cartes, le tirage du jour),
--  et affiche pour chaque ligne son rang, son nom et son score détaillé.
--
--  CE QU'ON DOIT VOIR : `score` qui DÉCROÎT du rang 1 au rang 24. Si
--  les scores sont dans le désordre, c'est que la nº 63 n'est pas
--  passée. S'ils sont tous à zéro, voir les blocs 1 et 2 ci-dessus.
with page as (
  select
    row_number() over ()          as rang,
    r.fiche->>'slug'              as slug,
    r.fiche->>'nom'               as nom,
    (r.total_resultats)::bigint   as total_catalogue
  from public.rechercher_tatoueurs(
         p_limite  => 24,
         p_jour    => (extract(epoch from now()) / 86400)::int
       ) r
)
select
  page.rang,
  page.nom,
  coalesce(pop.consultations, 0) as consultations,
  coalesce(pop.coeurs, 0)        as coeurs,
  coalesce(pop.abonnes, 0)       as abonnes,
  coalesce(pop.score, 0)         as score,
  page.total_catalogue
from page
left join public.popularite_tatoueurs pop on pop.slug = page.slug
order by page.rang;
