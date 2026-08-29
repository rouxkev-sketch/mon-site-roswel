-- ============================================================
--  nº 726 — RÉPARER LA PANNE : « permission denied for view
--           lieux_annexes_tatoueur »
-- ============================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, en une seule fois.
--  Sans danger : ce fichier ne crée, ne supprime et ne modifie
--  AUCUNE donnée. Il ne touche qu'à des DROITS DE LECTURE.
--
-- ------------------------------------------------------------
--  CE QUI S'EST PASSÉ, ET LA CAUSE — nommée, pas devinée
-- ------------------------------------------------------------
--  La passe nº 699 a retiré le droit de lecture de quatre vues
--  aux deux rôles du navigateur (`anon` et `authenticated`) :
--
--      revoke select on public.points_tatoueur        from anon, authenticated;
--      revoke select on public.zones_tatoueur         from anon, authenticated;
--      revoke select on public.lieux_tatoueur         from anon, authenticated;
--      revoke select on public.lieux_annexes_tatoueur from anon, authenticated;
--
--  Elle s'appuyait sur une phrase écrite noir sur blanc dans son
--  propre commentaire :
--
--      « une fonction s'exécute avec les droits de son
--        propriétaire, pas avec ceux de qui l'appelle »
--
--  CETTE PHRASE EST FAUSSE ICI, et c'est toute la panne. En
--  PostgreSQL, une fonction ne s'exécute avec les droits de son
--  propriétaire QUE si elle est déclarée `security definer`.
--  Sans cette mention — c'est le cas de `rechercher_tatoueurs`,
--  déclarée `language sql / stable / parallel safe` et rien de
--  plus — le défaut est `security invoker` : la fonction emprunte
--  les droits de CELUI QUI L'APPELLE, c'est-à-dire `anon`.
--
--  Donc : `anon` appelle `rechercher_tatoueurs`, la fonction lit
--  `lieux_annexes_tatoueur` avec les droits d'`anon`, et `anon`
--  n'a plus ce droit depuis la nº 699. D'où l'erreur 42501, trente
--  fois par heure, et « momentanément indisponible » sur
--  /recherche.
--
--  ⚠️ ET IL N'Y A PAS UNE SEULE VUE EN CAUSE, MÊME SI LE JOURNAL
--  N'EN NOMME QU'UNE. La version courante de `rechercher_tatoueurs`
--  lit TROIS des quatre vues révoquées :
--      zones_tatoueur          — 6 fois
--      lieux_annexes_tatoueur  — 4 fois   ← celle du journal
--      lieux_tatoueur          — 1 fois
--  PostgreSQL s'arrête à la PREMIÈRE lecture refusée : il n'a
--  jamais eu l'occasion de se plaindre des deux autres. Rouvrir la
--  seule vue nommée dans le journal ferait donc retomber la panne
--  aussitôt, sur la suivante. On rouvre les trois.
--
--  ⚠️ `points_tatoueur` N'EST PAS ROUVERTE : la fonction courante
--  ne la lit pas (vérifié, zéro occurrence). La protection posée
--  par la nº 699 tient donc entièrement sur celle-là.

-- ------------------------------------------------------------
--  1) LA RÉPARATION
-- ------------------------------------------------------------
--  On rend aux deux rôles du navigateur le droit de LIRE ces trois
--  vues — rien d'autre : pas d'écriture, pas de suppression, et
--  aucune autre table n'est touchée.

grant select on public.zones_tatoueur          to anon, authenticated;
grant select on public.lieux_tatoueur          to anon, authenticated;
grant select on public.lieux_annexes_tatoueur  to anon, authenticated;

-- ------------------------------------------------------------
--  CE QUE CELA ROUVRE, ET JE LE DIS FRANCHEMENT
-- ------------------------------------------------------------
--  La nº 699 avait une bonne raison : ces vues lisent les adresses
--  et les coordonnées GPS SANS filtre de visibilité. Rouvertes,
--  elles redeviennent lisibles directement par un visiteur non
--  connecté — y compris, en théorie, pour des portfolios non
--  publiés. Pour un tatoueur qui travaille chez lui, c'est son
--  adresse personnelle.
--
--  CE FICHIER REMET DONC L'ÉTAT D'AVANT LA nº 699 POUR CES TROIS
--  VUES. C'est un choix assumé : rétablir le service d'abord,
--  proprement, sans poser en urgence sur une base en panne un
--  verrou que je ne peux pas éprouver depuis l'atelier.
--
--  LE VERROU JUSTE EXISTE, ET IL EST ÉCRIT PLUS BAS (section 4) :
--  il ferme la fuite MIEUX que l'interdiction, et sans casser la
--  recherche. Mais il demande une vérification préalable — c'est
--  un sujet à part, pas une réparation d'urgence.

-- ------------------------------------------------------------
--  2) LA VÉRIFICATION — à lancer JUSTE APRÈS, dans le même éditeur
-- ------------------------------------------------------------
--  Trois questions, trois réponses attendues. Si les trois sont
--  bonnes, le site remarche et les protections de la nº 699
--  tiennent toujours.

--  a) LA LECTURE EST-ELLE RÉTABLIE ? Attendu : trois lignes,
--     `anon` et `authenticated` pour chacune des trois vues.
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('zones_tatoueur', 'lieux_tatoueur', 'lieux_annexes_tatoueur')
   and grantee in ('anon', 'authenticated')
   and privilege_type = 'SELECT'
 order by table_name, grantee;

--  b) LA RECHERCHE RÉPOND-ELLE ? C'est LE test qui compte.
--     ⚠️ ET IL SE FAIT « DANS LA PEAU D'anon », SANS QUOI IL NE
--     PROUVE RIEN : l'éditeur SQL de Supabase vous connecte en
--     administrateur, un rôle qui a TOUS les droits. Lancée telle
--     quelle, la requête réussirait même si la panne était intacte.
--     `set local role anon` fait tourner la suite avec les droits
--     du visiteur non connecté — exactement ceux qui échouaient.
--     Le `reset role` de la fin vous rend vos droits d'administrateur.
--     Attendu : un nombre (même 0 est une réussite — ce qui compte,
--     c'est l'ABSENCE d'erreur 42501).
begin;
  set local role anon;
  select count(*) as fiches_trouvees
    from public.rechercher_tatoueurs(
      p_style => null,
      p_limite => 5
    );
commit;
reset role;

--  c) LES PROTECTIONS DE LA nº 699 TIENNENT-ELLES ? Attendu :
--     AUCUNE ligne. Si `points_tatoueur` apparaît, c'est que
--     quelqu'un l'a rouverte — ce fichier ne le fait pas.
select table_name, grantee
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name = 'points_tatoueur'
   and grantee in ('anon', 'authenticated')
   and privilege_type = 'SELECT';

--  d) ET LA TABLE `particuliers`, fermée par la nº 699 : elle doit
--     rester fermée. Attendu : AUCUNE ligne.
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name = 'particuliers'
   and grantee in ('anon', 'authenticated');

-- ------------------------------------------------------------
--  3) L'ORDRE EXACT DES GESTES
-- ------------------------------------------------------------
--   1. Ouvrir l'éditeur SQL de Supabase (projet de PRODUCTION).
--   2. Coller la section 1 (les trois `grant`) et l'exécuter.
--      Elle rend « Success. No rows returned ».
--   3. Recharger https://…/recherche dans le navigateur : la page
--      doit afficher des portfolios, plus le message
--      « momentanément indisponible ». C'est immédiat — aucun
--      redéploiement du site n'est nécessaire, RIEN dans le code
--      n'a changé.
--   4. Coller les quatre requêtes de la section 2, une par une, et
--      comparer aux réponses attendues écrites au-dessus de chacune.
--   5. Rouvrir les journaux Supabase : plus aucune erreur 42501 ne
--      doit apparaître après l'heure de l'exécution.

-- ------------------------------------------------------------
--  4) LE VERROU JUSTE — À NE PAS EXÉCUTER AUJOURD'HUI
-- ------------------------------------------------------------
--  ⚠️ CETTE SECTION EST UN CONSTAT ET UNE PROPOSITION. Elle n'est
--  PAS à coller maintenant : elle demande une vérification que je
--  ne peux pas faire depuis l'atelier, sur une base en panne.
--
--  LE BON OUTIL EXISTE, et le projet s'en sert déjà ailleurs
--  (`yokofolio-popularite-lisible.sql`, `yokofolio-coeur-une-photo.sql`) :
--
--      alter view public.lieux_annexes_tatoueur set (security_invoker = on);
--
--  CE QU'IL FAIT : la vue cesse de lire ses tables avec les droits
--  de SON propriétaire et les lit avec ceux de l'appelant — les
--  règles de sécurité par ligne (RLS) des tables s'appliquent donc
--  enfin. Un visiteur anonyme ne verrait QUE les lieux des
--  portfolios en ligne, parce que c'est exactement ce que dit la
--  règle de `studios` :
--      using ( public.fiche_en_ligne(studios.tatoueur_id) or … )
--  La fuite que la nº 699 visait serait alors fermée PAR LA DONNÉE,
--  et non par une interdiction qui casse la recherche.
--
--  CE QU'IL FAUT VÉRIFIER AVANT, ET POURQUOI JE NE LE FAIS PAS ICI :
--  `lieux_annexes_tatoueur` ne lit pas `tatoueurs` directement —
--  elle lit `studios` ET `modes_exercice_actifs`, qui est
--  elle-même une VUE. La chaîne de droits a donc trois maillons, et
--  poser `security_invoker` sur un seul peut faire disparaître des
--  lieux de la recherche sans prévenir. Cela se mesure sur une base
--  saine, en comparant le nombre de résultats avant et après —
--  c'est une passe à soi seule.

-- ------------------------------------------------------------
--  5) LES ALERTES « SECURITY DEFINER VIEW » DU TABLEAU DE BORD
-- ------------------------------------------------------------
--  CONSTAT SEULEMENT — rien n'est corrigé ici, à la demande du
--  propriétaire.
--
--  CE QUE L'ALERTE DIT, EN CLAIR : « cette vue lit ses tables avec
--  les droits de son propriétaire, donc elle CONTOURNE les règles
--  de sécurité par ligne ». C'est le comportement par défaut de
--  PostgreSQL pour toute vue créée sans `security_invoker`.
--
--  EST-CE DANGEREUX CHEZ NOUS ? Cela dépend de ce que la vue
--  montre, et il faut les séparer :
--
--   · `clics_tatoueurs`, `coeurs_par_photo`, `modes_exercice_actifs`
--     — BÉNIN. Ce sont des COMPTES et des états d'activité, pas des
--     données personnelles : savoir qu'un portfolio a été consulté
--     douze fois n'apprend rien sur personne.
--
--   · `equipe_salon` — À REGARDER. Elle relie des comptes entre eux ;
--     une liaison en attente ou refusée n'a pas à être publique.
--
--   · `lieux_annexes_tatoueur`, `lieux_tatoueur`, `zones_tatoueur`,
--     `points_tatoueur` — LES SEULES QUI COMPTENT VRAIMENT, et ce
--     sont précisément celles de cette panne : elles portent des
--     ADRESSES et des COORDONNÉES GPS. C'est ce que la nº 699 avait
--     bien vu ; c'est le remède qu'elle a mal choisi.
--
--  LA CONCLUSION, ET ELLE EST SIMPLE : ces alertes ne sont pas du
--  bruit, mais elles ne se règlent pas par un `revoke` — la panne
--  d'aujourd'hui en est la démonstration. Elles se règlent vue par
--  vue, avec `security_invoker`, en mesurant à chaque fois ce que
--  la recherche continue de voir. Une passe, une vue, une mesure.
