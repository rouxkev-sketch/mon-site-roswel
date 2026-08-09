-- ============================================================
--  YOKOFOLIO — LE STUDIO PRIVÉ, UNE NATURE D'ÉTABLISSEMENT
--  (migration nº 37 — à passer APRÈS yokofolio-formulaire-demande.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : tout est en « if not exists », et aucune
--  ligne existante n'est modifiée.
--
--  ⚠️ CE QU'A LAISSÉ L'ÉCHEC DU PREMIER ESSAI : RIEN. L'éditeur SQL de
--  Supabase exécute TOUT le fichier dans UNE SEULE transaction — si une
--  ligne échoue, tout est annulé, y compris ce qui avait déjà réussi.
--  L'erreur « column "horaires" does not exist » a donc emporté avec
--  elle la colonne, la contrainte et l'index créés dix lignes plus
--  haut. La base est restée EXACTEMENT comme avant : il n'y a rien à
--  réparer, rien à nettoyer — il suffit de repasser ce fichier-ci.
--  (Constaté sur une base d'essai jetable : le fichier fautif rejoué
--  en un bloc laisse zéro colonne, zéro contrainte, zéro index.)
--  Et si la colonne existait déjà, la repasser ne coûte rien non plus :
--  chaque instruction se contente alors de ne rien faire.
--
--  CE QUE CE FICHIER AJOUTE, ET RIEN DE PLUS
--  ------------------------------------------
--  UNE SEULE COLONNE : `etablissement`, valant « salon » ou « prive ».
--
--  ⚠️ POURQUOI UNE COLONNE, ET NON UNE TROISIÈME VALEUR DE `type_fiche`.
--  `type_fiche` répond à UNE question : la fiche appartient-elle à une
--  PERSONNE (« artiste ») ou à un LIEU (« salon ») ? Cette question ne
--  change pas — un studio privé reste un lieu. Y ajouter une valeur
--  aurait obligé à revoir chaque requête, chaque politique de sécurité
--  et chaque adresse de recherche qui teste `type_fiche = 'salon'` :
--  beaucoup de risque pour une précision qui tient dans un mot.
--  La nouvelle colonne PRÉCISE la nature du lieu, elle ne le
--  reclasse pas. Elle n'est lue QUE lorsque `type_fiche = 'salon'` ;
--  sur une fiche d'artiste, elle ne veut rien dire et n'est jamais
--  regardée.
--
--  CE QUE DEVIENNENT LES FICHES DÉJÀ EN BASE
--  ------------------------------------------
--  RIEN NE CHANGE POUR ELLES. La colonne arrive avec la valeur
--  « salon » par défaut : toutes les fiches de lieu existantes sont
--  donc des salons, ce qu'elles sont effectivement — aucune n'a jamais
--  pu se déclarer studio privé, l'option n'existait pas.
--  Aucune fiche ne change de type, aucune adresse ne bouge, aucun
--  slug n'est réécrit.
--
--  ⚠️ LES SALONS SANS HORAIRES NE SONT PAS TOUCHÉS. Un salon qui n'a
--  pas rempli ses horaires reste un SALON : ne pas avoir saisi une
--  information n'est pas une déclaration. Les requalifier
--  automatiquement en studio privé sur ce seul indice reviendrait à
--  décider à la place du propriétaire de la fiche. Le choix lui
--  appartient, et le formulaire le lui proposera.
--
--  ⚠️ LES ENSEIGNES À PLUSIEURS ADRESSES NE SONT PAS TOUCHÉES NON PLUS.
--  Elles gardent leurs adresses telles quelles. Le sort du multi-
--  adresses se décide à la passe C, avec le nouveau bloc 12 — cette
--  migration-ci ne fait qu'ajouter une colonne.
--  Le compte des fiches concernées est affiché en fin de fichier.
-- ============================================================

-- 1. LA COLONNE ------------------------------------------------
alter table public.tatoueurs
  add column if not exists etablissement text not null default 'salon';

-- 2. LES DEUX SEULES VALEURS ADMISES ---------------------------
--    Une contrainte plutôt qu'un type énuméré : elle se lit en clair
--    et s'étend d'un `alter` si une troisième nature apparaît un jour.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tatoueurs_etablissement_valide'
  ) then
    alter table public.tatoueurs
      add constraint tatoueurs_etablissement_valide
      check (etablissement in ('salon', 'prive'));
  end if;
end $$;

comment on column public.tatoueurs.etablissement is
  'Nature du LIEU, lue uniquement quand type_fiche = ''salon'' : '
  '''salon'' (reçoit du public, a des horaires) ou '
  '''prive'' (studio privé, sur rendez-vous, sans horaires). '
  'Sur une fiche d''artiste, cette colonne n''a pas de sens.';

-- 3. LA RECHERCHE DOIT POUVOIR TRIER DESSUS --------------------
--    Index partiel : seules les fiches de lieu sont concernées, et
--    elles sont une minorité. Un index complet coûterait pour rien.
create index if not exists tatoueurs_etablissement_idx
  on public.tatoueurs (etablissement)
  where type_fiche = 'salon';

-- ============================================================
--  CE QU'IL Y A EN BASE, POUR MÉMOIRE
--  ------------------------------------------------------------
--  Ce qui suit n'écrit RIEN : c'est un état des lieux, à lire dans le
--  panneau de résultats après le « Run ».
--
--  ⚠️ LES HORAIRES ET LES ADRESSES VIVENT SUR `studios`, PAS SUR
--  `tatoueurs`. Une première version de ce fichier les cherchait sur
--  la fiche et échouait — `column "horaires" does not exist`. Le vrai
--  schéma, relu ligne à ligne dans les migrations précédentes :
--    · `public.studios` est une TABLE, UNE LIGNE PAR ADRESSE, reliée à
--      la fiche par `tatoueur_id`
--      (yokofolio-modes-et-liaisons.sql, ligne 143) ;
--    · l'adresse de la fiche elle-même EST une de ces lignes, celle
--      qui porte `principal = true` — le formulaire écrit toujours la
--      première ainsi (src/lib/enregistrer-exercice.ts). Une fiche à
--      une seule adresse a donc UNE ligne, pas zéro ;
--    · `studios.horaires` est un jsonb de sept jours
--      (yokofolio-studio-horaires.sql, ligne 107) ; `null` = rien
--      renseigné.
--  Une enseigne « multi-adresses » est donc une fiche qui a PLUSIEURS
--  LIGNES dans `studios`, et un salon « sans horaires » une fiche dont
--  aucune adresse ne porte d'horaires.
--
--  ⚠️ UNE SEULE REQUÊTE, ET NON QUATRE. L'éditeur SQL de Supabase
--  n'affiche QUE LE DERNIER résultat d'un fichier : quatre `select`
--  auraient donné trois comptes invisibles. Tout tient donc en une
--  requête qui rend une ligne par mesure — mesure à gauche, valeur à
--  droite, tout est lisible d'un coup d'œil.
-- ============================================================

select mesure, valeur
from (values

  --  1-3. LA RÉPARTITION DES FICHES.
  (1, 'Fiches d''artiste', (
    select count(*)::text from public.tatoueurs
    where supprime_le is null and type_fiche = 'artiste')),
  (2, 'Fiches de lieu', (
    select count(*)::text from public.tatoueurs
    where supprime_le is null and type_fiche = 'salon')),
  (3, '  dont studios privés', (
    select count(*)::text from public.tatoueurs
    where supprime_le is null and type_fiche = 'salon'
      and etablissement = 'prive')),

  --  4. LES SALONS SANS AUCUN HORAIRE — laissés tels quels (voir
  --     l'en-tête : ne rien avoir saisi n'est pas une déclaration).
  (4, 'Salons sans aucun horaire', (
    select count(*)::text
    from public.tatoueurs f
    where f.supprime_le is null
      and f.type_fiche = 'salon'
      and not exists (
        select 1 from public.studios s
        where s.tatoueur_id = f.id
          and s.horaires is not null
          --  ⚠️ « AVOIR DES HORAIRES » = AVOIR AU MOINS UNE PLAGE. Le
          --  site range `null` quand la semaine est entièrement vide,
          --  mais une semaine de sept jours vides écrite à la main
          --  passerait pour renseignée : on regarde donc le contenu,
          --  pas seulement la présence. `$[*][*].debut` = « une heure
          --  de début quelque part là-dedans ».
          and jsonb_path_exists(s.horaires, '$[*][*].debut')
      ))),

  --  5-6. LES ENSEIGNES À PLUSIEURS ADRESSES — à décider en passe C.
  --  Le nombre, puis les NOMS : une décision se prend sur des noms.
  (5, 'Enseignes à plusieurs adresses', (
    select count(*)::text from (
      select s.tatoueur_id
      from public.studios s
      join public.tatoueurs f on f.id = s.tatoueur_id
      where f.supprime_le is null and f.type_fiche = 'salon'
      group by s.tatoueur_id
      having count(*) > 1
    ) as multi)),
  (6, '  lesquelles', (
    select coalesce(string_agg(nom || ' (' || adresses || ')', ', '
                               order by adresses desc, nom), 'aucune')
    from (
      select f.nom as nom, count(*) as adresses
      from public.studios s
      join public.tatoueurs f on f.id = s.tatoueur_id
      where f.supprime_le is null and f.type_fiche = 'salon'
      group by f.id, f.nom
      having count(*) > 1
    ) as detail))

) as etat(ordre, mesure, valeur)
order by ordre;
