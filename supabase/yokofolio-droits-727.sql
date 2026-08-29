-- ============================================================
--  nº 727 — NETTOYER LES DROITS RÉSIDUELS SUR `particuliers`
-- ============================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE (projet de PRODUCTION).
--  Sans danger : ce fichier ne crée, ne supprime et ne modifie
--  AUCUNE donnée. Il ne retire que des DROITS INUTILISÉS.
--  ⚠️ REJOUABLE AUTANT DE FOIS QU'ON VEUT : un `revoke` sur un droit
--  déjà retiré ne fait rien et ne produit aucune erreur.
--
-- ------------------------------------------------------------
--  LA MÉTHODE, ET ELLE EST IMPOSÉE PAR LA PANNE DE LA nº 726
-- ------------------------------------------------------------
--  La nº 699 a retiré des droits en supposant qu'ils n'étaient pas
--  utilisés. Elle s'est trompée, et le site est tombé. On ne
--  recommence pas : CHAQUE droit ci-dessous a été cherché dans le
--  code, et chaque retrait dit pourquoi il est sans danger.
--
--  LE CRITÈRE QUI TRANCHE, ET IL TIENT EN UNE PHRASE : la sécurité
--  par ligne (RLS) de `particuliers` couvre SELECT, INSERT, UPDATE
--  et DELETE — mais elle NE COUVRE PAS `TRUNCATE`. Vider une table
--  n'est pas « supprimer des lignes » aux yeux de PostgreSQL : c'est
--  une opération de structure, et AUCUNE politique RLS ne s'y
--  applique. C'est donc le seul droit de la liste qui soit
--  réellement exploitable, et c'est lui qu'il faut retirer en
--  premier.
--
--  LA RÈGLE DE LA nº 699 QUI TIENT TOUJOURS, pour mémoire :
--      create policy "particuliers_son_profil" on public.particuliers
--        for all to authenticated
--        using (auth.uid() = id) with check (auth.uid() = id);
--  Une personne connectée ne peut lire, écrire ou effacer QUE sa
--  propre ligne. Les routes du serveur, elles, emploient la clé de
--  service, qui passe outre.

-- ------------------------------------------------------------
--  1) LES RETRAITS — chacun justifié
-- ------------------------------------------------------------

--  a) TRUNCATE — LE SEUL VRAIMENT DANGEREUX.
--     Il permet de VIDER LA TABLE ENTIÈRE d'un coup, et la RLS ne
--     l'arrête pas (voir plus haut). Aucun code du site ne le fait,
--     aucune fonction SQL du projet non plus : ni l'application, ni
--     PostgREST — l'interface qui traduit les appels du navigateur —
--     ne savent l'émettre. Il vient du `grant all` que Supabase pose
--     par défaut sur les tables du schéma public, pas d'une décision.
revoke truncate on public.particuliers from anon, authenticated;

--  b) TRIGGER — poser un déclencheur sur la table, c'est-à-dire
--     faire exécuter du code à chaque écriture de n'importe qui.
--     Le site n'en crée aucun depuis le navigateur : tous les
--     déclencheurs du projet sont posés par les fichiers SQL, donc
--     par l'administrateur. Même origine que ci-dessus : le
--     `grant all` par défaut.
revoke trigger on public.particuliers from anon, authenticated;

--  c) REFERENCES — créer une clé étrangère qui pointe vers cette
--     table. Cela suppose de pouvoir créer une table dans le
--     schéma, ce que ni `anon` ni `authenticated` ne peuvent faire.
--     Le droit est donc inerte aujourd'hui ; on le retire parce
--     qu'un droit inerte est un droit qu'on oublie de surveiller.
revoke references on public.particuliers from anon, authenticated;

-- ------------------------------------------------------------
--  CE QU'ON GARDE, ET POURQUOI — c'est aussi important
-- ------------------------------------------------------------
--  ⚠️ LES QUATRE DROITS D'`authenticated` RESTENT. Ils sont
--  UTILISÉS par le site, et tous les quatre sont bornés par la RLS
--  à la seule ligne de la personne connectée :
--
--   · INSERT — obligatoire. Deux écrans du site créent la ligne du
--     particulier : « Mon compte » (prénom et téléphone) et le cœur
--     d'une carte, qui pose `upsert({ id })` avant d'enregistrer le
--     favori. Un `upsert` est un INSERT qui bascule en UPDATE : sans
--     INSERT, les deux cassent.
--   · UPDATE — obligatoire, pour la même raison : c'est la seconde
--     moitié de l'`upsert`, celle qui joue quand la ligne existe
--     déjà. Enregistrer son prénom une deuxième fois passe par là.
--   · SELECT — obligatoire. La page « /compte » lit le profil
--     (prénom, téléphone) avec le client SERVEUR, qui porte la
--     session du visiteur — donc le rôle `authenticated`, pas la clé
--     de service. Et l'`upsert` du navigateur relit la ligne qu'il
--     vient d'écrire.
--   · DELETE — NON UTILISÉ AUJOURD'HUI, ET POURTANT GARDÉ. La
--     suppression de compte passe par la clé de service
--     (`/api/compte/supprimer` → `auth.admin.deleteUser`), qui
--     ignore et les droits et la RLS. Mais le retirer n'apporterait
--     AUCUNE sécurité : la RLS le borne déjà à `auth.uid() = id`,
--     c'est-à-dire à sa propre ligne — effacer son propre profil est
--     le droit de chacun. Retirer un droit qui ne protège de rien,
--     c'est exactement ce qui a cassé le site à la nº 699.
--
--  ⚠️ ET `anon` N'A PLUS RIEN À LIRE NI À ÉCRIRE : la nº 699 lui a
--  retiré SELECT, INSERT, UPDATE et DELETE, et ce fichier ne les
--  rend pas. Le relevé du propriétaire le confirme — seuls
--  TRUNCATE, REFERENCES et TRIGGER restaient, et ils partent ici.

-- ------------------------------------------------------------
--  2) LA VÉRIFICATION — à lancer JUSTE APRÈS
-- ------------------------------------------------------------

--  a) CE QUI RESTE SUR `particuliers`.
--     ATTENDU : EXACTEMENT QUATRE LIGNES, et pas une de plus —
--        particuliers  authenticated  DELETE
--        particuliers  authenticated  INSERT
--        particuliers  authenticated  SELECT
--        particuliers  authenticated  UPDATE
--     Aucune ligne `anon`. Aucun TRUNCATE, REFERENCES ni TRIGGER.
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name = 'particuliers'
   and grantee in ('anon', 'authenticated')
 order by grantee, privilege_type;

--  b) LE SITE MARCHE-T-IL TOUJOURS ? Le test qui compte, et il se
--     fait DANS LA PEAU d'un visiteur connecté — l'éditeur SQL vous
--     connecte en administrateur, un rôle qui a tous les droits :
--     lancé tel quel, le test réussirait même si l'on avait tout
--     cassé (la leçon de la nº 726).
--     ⚠️ ON NE VÉRIFIE QUE LE DROIT, PAS LA DONNÉE : sans session,
--     `auth.uid()` vaut null, donc la RLS ne laisse passer AUCUNE
--     ligne. C'est normal et c'est même la preuve qu'elle travaille.
--     ATTENDU : « 0 », et SURTOUT AUCUNE erreur 42501
--     (« permission denied »). Un zéro est une réussite ; une erreur
--     rouge serait l'échec.
begin;
  set local role authenticated;
  select count(*) as lignes_visibles from public.particuliers;
commit;
reset role;

--  c) ET LE VIDAGE EST-IL BIEN INTERDIT ? La preuve par l'essai.
--     ⚠️ CETTE REQUÊTE DOIT ÉCHOUER. C'est le seul endroit de tous
--     ces fichiers où une ERREUR ROUGE est le bon résultat.
--     ATTENDU : « ERROR: permission denied for table particuliers ».
--     Le `rollback` final annule tout, quoi qu'il arrive : même si
--     le vidage passait — c'est-à-dire si le retrait avait échoué —
--     AUCUNE donnée ne serait perdue.
begin;
  set local role authenticated;
  truncate table public.particuliers;
rollback;
reset role;

-- ------------------------------------------------------------
--  3) L'ORDRE EXACT DES GESTES
-- ------------------------------------------------------------
--   1. Ouvrir l'éditeur SQL de Supabase (projet de PRODUCTION).
--   2. Coller la section 1 (les trois `revoke`) et l'exécuter.
--      Elle rend « Success. No rows returned ».
--   3. Coller la vérification (a). Compter les lignes : il doit y
--      en avoir QUATRE, toutes en `authenticated`.
--   4. Coller la vérification (b). Elle doit rendre « 0 » sans
--      aucune erreur rouge.
--   5. Coller la vérification (c). Elle DOIT rendre une erreur
--      rouge « permission denied for table particuliers » — c'est
--      la preuve que le vidage est bien interdit. Rien n'est perdu :
--      la transaction est annulée.
--   6. Sur le site, se connecter avec un compte particulier et
--      faire les deux gestes qui écrivent dans cette table :
--        · « Mon compte » → enregistrer un prénom ;
--        · toucher le cœur d'une carte.
--      Les deux doivent fonctionner comme avant.
--   ⚠️ AUCUN REDÉPLOIEMENT DU SITE N'EST NÉCESSAIRE : rien dans le
--   code n'a changé pour cette passe.

-- ------------------------------------------------------------
--  4) LES AUTRES TABLES — CONSTAT SEULEMENT, RIEN N'EST RETIRÉ
-- ------------------------------------------------------------
--  ⚠️ JE NE PEUX PAS INTERROGER LA BASE DE PRODUCTION DEPUIS
--  L'ATELIER, et je ne vais donc pas deviner ce qu'elle contient.
--  La requête ci-dessous liste, pour TOUT le schéma public, les
--  trois droits qui n'ont jamais de raison d'être accordés au
--  navigateur — les mêmes que ceux retirés plus haut.
--
--  CE QU'ELLE VA PROBABLEMENT MONTRER, ET POURQUOI : Supabase pose
--  un `grant all` par défaut sur les tables du schéma public. Il y a
--  donc de fortes chances que `tatoueurs`, `studios`,
--  `favoris_photos`, `equipe_salon` et les autres portent exactement
--  les mêmes trois droits résiduels. Ce n'est pas une négligence du
--  projet : c'est le réglage d'usine.
--
--  ⚠️ NE RIEN RETIRER SUR LA FOI DE CETTE LISTE. Le nettoyage se
--  fait table par table, en cherchant d'abord ce que le code en
--  fait — c'est la méthode de cette passe-ci, et c'est la seule qui
--  ne casse rien. `TRUNCATE` sur une table est le plus urgent
--  partout ; `REFERENCES` et `TRIGGER` peuvent attendre.
--
--  ⚠️ ET SURTOUT : NE PAS TOUCHER AUX TROIS VUES ROUVERTES PAR LA
--  nº 726 (`zones_tatoueur`, `lieux_tatoueur`,
--  `lieux_annexes_tatoueur`). Le service en dépend directement.
select table_name,
       grantee,
       privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and grantee in ('anon', 'authenticated')
   and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
 order by table_name, grantee, privilege_type;
