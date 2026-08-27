--  ██ MESURER LA RECHERCHE SUR LA VRAIE BASE (passe nº 682) ██
--  ==================================================================
--  CE FICHIER NE MODIFIE RIEN. Aucun `create`, aucun `alter`, aucun
--  `drop` : il LIT et il MESURE. On peut le lancer en production sans
--  rien risquer, autant de fois qu'on veut.
--
--  POURQUOI IL EXISTE, ET C'EST LE POINT HONNÊTE DE LA PASSE. Le banc
--  du site tourne contre une DOUBLURE écrite en JavaScript (nº 670) :
--  son `rechercher_tatoueurs` est un faux qui filtre un tableau en
--  mémoire. Il ne dit RIEN du coût de la vraie fonction SQL — ni le
--  plan choisi, ni les index utilisés, ni le volume lu.
--
--  CE QUE LE BANC A QUAND MÊME TRANCHÉ, et qui vaut d'être su avant de
--  toucher au SQL : le temps serveur de « /recherche » suit une droite
--  contre la latence de base simulée —
--        latence   0 ms →   38 ms
--        latence 120 ms →  518 ms
--        latence 240 ms → 1000 ms
--  Pente 4,01 : le coût était QUATRE ALLERS-RETOURS EN SÉRIE, et 38 ms
--  de calcul. La passe nº 682 en a supprimé un (le score de popularité
--  part maintenant avec la recherche au lieu de l'attendre) ; il en
--  reste trois. Autrement dit : sur ce banc-là, le RPC n'était pas le
--  coupable. Reste à savoir ce qu'il coûte VRAIMENT, et cela ne se sait
--  que sur la vraie base — d'où ce fichier.
--
--  COMMENT ON S'EN SERT : ouvrir l'éditeur SQL de Supabase, coller ce
--  fichier, lire les résultats de haut en bas. Les trois blocs
--  répondent à trois questions, dans l'ordre où elles se posent.

--  ══════════════════════════════════════════════════════════════════
--  1) COMBIEN DE TEMPS PREND LA FONCTION, ET OÙ ?
--  ══════════════════════════════════════════════════════════════════
--  ⚠️ REMPLACER LES PARAMÈTRES par ceux d'une vraie recherche du site.
--  Ceux d'origine sont l'adresse la plus courante : un style, une
--  nature, pas de lieu.
--
--  CE QU'ON LIT DANS LA SORTIE, et dans cet ordre :
--   · « Execution Time » tout en bas — LE chiffre. S'il est sous 50 ms,
--     le RPC n'est pas le problème et il faut chercher ailleurs ;
--   · « Seq Scan on tatoueurs » — un balayage complet de la table. Sur
--     quelques centaines de fiches c'est normal et rapide ; au-delà de
--     quelques milliers, c'est le premier index à poser ;
--   · « rows removed by filter » — ce qui a été lu pour rien ;
--   · « Buffers: shared read=… » — les pages allées chercher sur le
--     disque plutôt qu'en mémoire. Beaucoup de `read` et peu de `hit`
--     signale une table plus grosse que le cache.

explain (analyze, buffers, verbose off)
select * from public.rechercher_tatoueurs(
  p_style      => 'realisme',
  p_nature     => 'tatouage',
  p_limite     => 200,
  p_decalage   => 0,
  p_photos_max => 1,
  p_jour       => 0
);

--  ══════════════════════════════════════════════════════════════════
--  2) LES INDEX EXISTENT-ILS SUR CE QUE LA RECHERCHE FILTRE ET TRIE ?
--  ══════════════════════════════════════════════════════════════════
--  CE QUE LA FONCTION INTERROGE VRAIMENT (relevé dans
--  `yokofolio-recherche-etablissement.sql`, la définition en vigueur) :
--   · `tatoueurs` filtrée sur `publie` et `supprime_le is null` — la
--     condition de TOUTES les recherches, sans exception ;
--   · `photos_tatoueur` sur `tatoueur_id` + `style`, `rendu`, `nature`
--     — trois `exists` séparés, un par filtre ;
--   · `zones_tatoueur` sur `tatoueur_id`, puis sur latitude/longitude ;
--   · `lieux_annexes_tatoueur` sur `ville_slug`, `code_pays`, `region`.
--
--  ⚠️ CE TABLEAU NE DIT PAS S'IL FAUT AJOUTER UN INDEX. Il dit ce qui
--  existe. Un index se pose quand le plan du bloc 1 montre un balayage
--  coûteux SUR CETTE COLONNE-LÀ — jamais « au cas où » : chaque index
--  ralentit les écritures et occupe de la place.

select
  t.relname                             as table_lue,
  i.relname                             as index_pose,
  pg_size_pretty(pg_relation_size(i.oid)) as taille,
  array_to_string(array_agg(a.attname order by k.n), ', ') as colonnes
from pg_class t
join pg_index x        on x.indrelid = t.oid
join pg_class i        on i.oid = x.indexrelid
join lateral unnest(x.indkey) with ordinality as k(attnum, n) on true
join pg_attribute a    on a.attrelid = t.oid and a.attnum = k.attnum
join pg_namespace ns   on ns.oid = t.relnamespace
where ns.nspname = 'public'
  and t.relname in ('tatoueurs', 'photos_tatoueur', 'zones_tatoueur',
                    'lieux_annexes_tatoueur', 'lieux_tatoueur',
                    'modes_exercice')
group by t.relname, i.relname, i.oid
order by t.relname, i.relname;

--  ══════════════════════════════════════════════════════════════════
--  3) QUELLE EST LA TAILLE DU PROBLÈME ?
--  ══════════════════════════════════════════════════════════════════
--  Un plan lent sur trois cents lignes et un plan lent sur trois cent
--  mille ne se soignent pas pareil. Ce bloc donne l'échelle — et il
--  répond d'avance à la question « faut-il descendre le classement en
--  base ? » que la note de `listerTatoueurs` garde en réserve.

select 'tatoueurs publiées'  as quoi,
       count(*)              as combien
  from public.tatoueurs where publie and supprime_le is null
union all
select 'photos cataloguées', count(*) from public.photos_tatoueur
union all
select 'zones', count(*) from public.zones_tatoueur
union all
select 'lieux annexes', count(*) from public.lieux_annexes_tatoueur;

--  ══════════════════════════════════════════════════════════════════
--  CE QUE JE N'AI PAS FAIT, ET POURQUOI
--  ══════════════════════════════════════════════════════════════════
--  AUCUN INDEX N'EST CRÉÉ ICI, et aucune colonne n'est retirée du
--  `select` de la fonction — alors que les deux figuraient au menu de
--  la passe. La raison tient en une phrase : JE NE PEUX PAS LES
--  MESURER. Le banc ne fait pas tourner Postgres ; poser un index ou
--  réécrire le `t.*` du sous-select sans plan d'exécution avant/après,
--  ce serait corriger à l'aveugle, et c'est précisément ce que le
--  propriétaire a demandé de ne plus faire.
--
--  LE SUSPECT STRUCTUREL, pour le jour où l'on aura le plan : le
--  sous-select intérieur prend `t.*` — TOUTES les colonnes de
--  `tatoueurs` — et porte un `count(*) over ()`. La fenêtre oblige
--  Postgres à traverser toutes les lignes retenues AVANT la coupe, en
--  transportant chaque colonne. Sur une grande table, restreindre ce
--  `t.*` aux quelque trente colonnes que l'objet final utilise se voit
--  dans le plan. Sur trois cents fiches, cela ne se verra pas. Le bloc
--  3 dit dans quel cas on se trouve.
