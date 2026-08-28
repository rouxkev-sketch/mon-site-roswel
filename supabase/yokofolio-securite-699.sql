-- ============================================================
--  YOKOFOLIO — LES VERROUS DE SÉCURITÉ (passe nº 699)
--  (à passer quand tu veux — sans ordre imposé, rejouable)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : tout est écrit en « drop … if exists »
--  puis « create ».
--
--  CE QUE CE FICHIER CORRIGE
--  --------------------------
--  Trois points de l'audit nº 698, dans l'ordre de gravité. Aucun ne
--  change ce que le site affiche : ce sont des verrous, pas des
--  fonctionnalités.
--
--   1. TROIS VUES LAISSAIENT LIRE LES ADRESSES DE TOUS LES
--      PORTFOLIOS — brouillons, refusés et supprimés compris — à
--      n'importe quel visiteur, même non connecté.
--   2. LE GARDE-FOU DU PORTFOLIO ne protégeait qu'UNE colonne : un
--      tatoueur pouvait annuler lui-même la suppression décidée par
--      l'administration.
--   3. LES RÈGLES D'ACCÈS des tables du produit artisans étaient
--      justes mais IMPLICITES : elles s'appliquaient à « tout le
--      monde », et ne fermaient la porte aux visiteurs anonymes que
--      par un effet de bord. On l'écrit noir sur blanc.
--
--  ⚠️ LES BLOCS DE VÉRIFICATION SONT À LA FIN. Passe-les après, ils
--  n'écrivent rien et disent si le fichier a bien fait son travail.
-- ============================================================


-- ------------------------------------------------------------
-- 1) LES TROIS VUES QUI LAISSAIENT FUIR LES ADRESSES
-- ------------------------------------------------------------
--  LE DÉFAUT, EN UNE PHRASE : `points_tatoueur`, `zones_tatoueur` et
--  `lieux_tatoueur` lisent la table `tatoueurs` SANS filtre de
--  visibilité, et une vue PostgreSQL n'applique PAS, par défaut, les
--  règles d'accès des tables qu'elle lit. Comme elles étaient
--  ouvertes à `anon`, un visiteur non connecté pouvait lire l'adresse
--  et les coordonnées GPS de TOUS les portfolios — y compris ceux
--  qui ne sont pas publiés. Pour un tatoueur qui travaille chez lui,
--  c'est son adresse personnelle.
--
--  CE QU'ON FAIT, ET SURTOUT CE QU'ON NE FAIT PAS. On ne touche pas à
--  la DÉFINITION des vues : elles sont lues par les grosses fonctions
--  de recherche (`rechercher_tatoueurs` et ses variantes), et y
--  ajouter un filtre demanderait de rejouer ces fonctions entières —
--  un chantier, pas un verrou. ON RETIRE SIMPLEMENT LE DROIT DE
--  LECTURE aux deux rôles du navigateur.
--
--  ⚠️ ET LE SITE CONTINUE DE MARCHER : aucune ligne du code ne lit ces
--  vues (vérifié à la passe nº 699 : zéro `.from("points_tatoueur")`
--  et compagnie dans tout `src/`). Seules les fonctions SQL les
--  emploient, et une fonction s'exécute avec les droits de son
--  propriétaire, pas avec ceux de qui l'appelle.
--  ⚠️ `lieux_annexes_tatoueur` PART AVEC ELLES, pour la même raison :
--  elle expose les adresses des enseignes sans filtre.

revoke select on public.points_tatoueur         from anon, authenticated;
revoke select on public.zones_tatoueur          from anon, authenticated;
revoke select on public.lieux_tatoueur          from anon, authenticated;
revoke select on public.lieux_annexes_tatoueur  from anon, authenticated;


-- ------------------------------------------------------------
-- 2) LE GARDE-FOU DU PORTFOLIO, ÉTENDU
-- ------------------------------------------------------------
--  LE DÉFAUT : le garde-fou posé à la migration nº 30 protégeait
--  `publie` (et la petite notification de validation), et RIEN
--  D'AUTRE. Or la décision d'administration de la passe nº 696 —
--  « ce portfolio sera effacé dans 7 jours » — s'écrit dans DEUX
--  AUTRES colonnes : `supprime_le` et `purge_le`. Le propriétaire
--  du portfolio pouvait donc les remettre à null d'un appel direct,
--  et son portfolio revenait en ligne comme si de rien n'était. La
--  modération n'était pas exécutoire.
--
--  LA MÊME LOGIQUE, ÉLARGIE : tout ce qui relève d'une DÉCISION DE
--  L'ADMINISTRATION redevient sa valeur d'avant dès qu'un compte
--  essaie d'y toucher. Le tatoueur garde la main entière sur son
--  CONTENU (nom, bio, styles, photos, liens, adresses…) — rien de
--  cela n'est ici.
--
--  ⚠️ POURQUOI ÇA NE CASSE PAS LA SUPPRESSION DU TATOUEUR LUI-MÊME.
--  Il peut toujours demander la suppression de son portfolio et
--  l'annuler : ces deux gestes passent par une route du site qui
--  écrit AVEC LA CLÉ DE SERVICE (`/api/tatoueur/supprimer-fiche`,
--  `lib/suppression-compte`). La clé de service n'a pas d'`auth.uid()`
--  — la condition ci-dessous ne la voit même pas. Vérifié une par une
--  à la passe nº 699 : TOUTES les écritures légitimes de ces colonnes
--  passent par elle.
--  ⚠️ ET SI UNE COLONNE N'EXISTE PAS ENCORE (base à qui il manque une
--  migration) ? La fonction est écrite pour ne nommer que des
--  colonnes de la migration nº 60 et antérieures, toutes présentes
--  dès lors que `hors_ligne` et `statut` le sont. Le bloc
--  conditionnel juste en dessous s'en assure.

do $$
declare
  manquantes text;
begin
  select string_agg(c, ', ') into manquantes
    from unnest(array[
      'publie', 'supprime_le', 'purge_le', 'hors_ligne', 'statut',
      'motifs_moderation', 'note_moderation', 'decide_le',
      'validation_a_notifier'
    ]) as c
   where not exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tatoueurs'
        and column_name = c
   );
  if manquantes is not null then
    raise exception
      'Colonnes absentes de public.tatoueurs : %. Passe d''abord les migrations manquantes (voir LISEZ-MOI-ordre-des-migrations.md).',
      manquantes;
  end if;
end
$$;

create or replace function public.tatoueurs_garde_fou()
returns trigger
language plpgsql
security definer
as $$
begin
  --  auth.uid() non nul = requête d'un COMPTE (le tatoueur lui-même) ;
  --  la clé de service de l'administration, elle, n'a pas d'uid.
  if auth.uid() is not null then
    --  LA PUBLICATION — le verrou d'origine (migration nº 30).
    new.publie := old.publie;

    --  §1 (nº 699) — LES DEUX DATES DE LA SUPPRESSION. C'est le cœur
    --  de ce fichier : sans elles, la décision de l'administration
    --  (7 jours, passe nº 696) s'annulait d'un appel direct.
    new.supprime_le := old.supprime_le;
    new.purge_le    := old.purge_le;

    --  §1 (nº 699) — LES DÉCISIONS DE MODÉRATION. `hors_ligne` est une
    --  sanction ; `statut` dit où en est le dossier ; les motifs, la
    --  note et la date sont la trace écrite de la décision. Aucun de
    --  ces cinq champs n'appartient au tatoueur.
    new.hors_ligne         := old.hors_ligne;
    new.statut             := old.statut;
    new.motifs_moderation  := old.motifs_moderation;
    new.note_moderation    := old.note_moderation;
    new.decide_le          := old.decide_le;

    --  Prendre acte (vrai → faux) est permis ; s'inventer une
    --  notification (faux → vrai) ne l'est pas.
    if old.validation_a_notifier = false then
      new.validation_a_notifier := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tatoueurs_garde_fou on public.tatoueurs;
create trigger tatoueurs_garde_fou
  before update on public.tatoueurs
  for each row execute function public.tatoueurs_garde_fou();


-- ------------------------------------------------------------
-- 3) LES RÈGLES DES TABLES DU PRODUIT ARTISANS, RENDUES EXPLICITES
-- ------------------------------------------------------------
--  CE QUI EST VRAI AUJOURD'HUI, ET IL FAUT LE DIRE : ces tables ne
--  fuient pas. Leurs règles disent « uniquement sa propre ligne »
--  (`auth.uid() = id`), et pour un visiteur non connecté `auth.uid()`
--  vaut NULL : la comparaison n'est jamais vraie, donc aucune ligne
--  ne sort.
--
--  CE QUI N'ALLAIT PAS QUAND MÊME : ces règles ne nommaient AUCUN
--  rôle. En PostgreSQL, une règle sans `to …` s'applique à TOUT LE
--  MONDE, `anon` compris. La porte n'était donc fermée que par un
--  effet de bord de la condition — pas par une intention écrite. Le
--  jour où quelqu'un ajoute une règle un peu large, l'anonyme entre
--  avec.
--  On écrit l'intention : `to authenticated`, et le droit de lecture
--  retiré à `anon` par-dessus. Deux verrous plutôt qu'un.
--
--  ⚠️ AUCUN CHANGEMENT POUR L'USAGE NORMAL : une personne connectée
--  est `authenticated`, et les routes du serveur emploient la clé de
--  service, qui passe outre les deux.

--  ----- particuliers : son profil, et rien d'autre -----
drop policy if exists "particuliers_son_profil" on public.particuliers;
create policy "particuliers_son_profil" on public.particuliers
  for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

--  Un artisan voit le prénom et le téléphone des particuliers qui lui
--  ont écrit — jamais leur adresse e-mail, qui n'est pas dans cette
--  table. La règle d'origine (schema.sql) est conservée mot pour mot,
--  seul le rôle est nommé.
drop policy if exists "particuliers_vus_par_artisan_contacte" on public.particuliers;
create policy "particuliers_vus_par_artisan_contacte" on public.particuliers
  for select to authenticated
  using (
    exists (
      select 1
        from public.conversations c
        join public.artisans a on a.id = c.artisan_id
       where c.particulier_id = particuliers.id
         and a.user_id = auth.uid()
    )
  );

--  ----- favoris (artisans) : les siens -----
drop policy if exists "favoris_les_siens" on public.favoris;
create policy "favoris_les_siens" on public.favoris
  for all to authenticated
  using (auth.uid() = particulier_id)
  with check (auth.uid() = particulier_id);

--  ----- conversations : les deux participants -----
drop policy if exists "conversations_participants_lecture" on public.conversations;
create policy "conversations_participants_lecture" on public.conversations
  for select to authenticated
  using (
    auth.uid() = particulier_id
    or exists (
      select 1 from public.artisans a
       where a.id = artisan_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "conversations_ouverture_par_particulier" on public.conversations;
create policy "conversations_ouverture_par_particulier" on public.conversations
  for insert to authenticated
  with check (
    auth.uid() = particulier_id
    and exists (
      select 1 from public.artisans a
       where a.id = artisan_id and a.statut_validation = 'valide'
    )
  );

drop policy if exists "conversations_participants_maj" on public.conversations;
create policy "conversations_participants_maj" on public.conversations
  for update to authenticated
  using (
    auth.uid() = particulier_id
    or exists (
      select 1 from public.artisans a
       where a.id = artisan_id and a.user_id = auth.uid()
    )
  );

--  ----- LE SECOND VERROU : plus rien pour l'anonyme -----
--  Même si une règle devenait trop large un jour, `anon` n'a plus le
--  droit de lire ces quatre tables du tout.
revoke select, insert, update, delete on public.particuliers  from anon;
revoke select, insert, update, delete on public.favoris       from anon;
revoke select, insert, update, delete on public.conversations from anon;
revoke select, insert, update, delete on public.messages      from anon;


-- ============================================================
--  VÉRIFICATIONS — elles n'écrivent RIEN.
--  ⚠️ LE BLOC E SE PASSE DEUX FOIS : une fois AVANT le fichier (pour
--  voir le défaut), une fois APRÈS (pour voir qu'il est fermé). Les
--  autres n'ont de sens qu'après.
-- ============================================================

-- ------------------------------------------------------------
--  A) LES VUES NE SONT PLUS LISIBLES PAR LE NAVIGATEUR
--     Attendu : ZÉRO ligne.
-- ------------------------------------------------------------
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and grantee in ('anon', 'authenticated')
   and table_name in ('points_tatoueur', 'zones_tatoueur',
                      'lieux_tatoueur', 'lieux_annexes_tatoueur');

-- ------------------------------------------------------------
--  B) LE GARDE-FOU PROTÈGE BIEN LES HUIT COLONNES
--     Attendu : « 8 colonnes verrouillées ».
-- ------------------------------------------------------------
select
  (select count(*) from unnest(array[
     'new.publie', 'new.supprime_le', 'new.purge_le', 'new.hors_ligne',
     'new.statut', 'new.motifs_moderation', 'new.note_moderation',
     'new.decide_le'
   ]) c
   where position(c in (select prosrc from pg_proc
                         where proname = 'tatoueurs_garde_fou')) > 0)
  || ' colonnes verrouillées (attendu : 8)' as resultat;

-- ------------------------------------------------------------
--  C) LES QUATRE TABLES PRIVÉES SONT FERMÉES À L'ANONYME
--     Attendu : ZÉRO ligne.
-- ------------------------------------------------------------
select table_name, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'anon'
   and table_name in ('particuliers', 'favoris', 'conversations', 'messages');

-- ------------------------------------------------------------
--  D) TOUTES LES RÈGLES DE CES TABLES NOMMENT UN RÔLE
--     Attendu : la colonne « roles » dit {authenticated} partout.
-- ------------------------------------------------------------
select tablename, policyname, cmd, roles::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('particuliers', 'favoris', 'conversations')
 order by tablename, cmd;

-- ------------------------------------------------------------
--  E) L'ÉPREUVE PAR LE HAUT : ce qu'un VISITEUR NON CONNECTÉ voit.
--     Attendu : les quatre premières ÉCHOUENT (« permission denied »),
--     la cinquième rend un nombre (les portfolios en ligne, c'est
--     normal et voulu).
-- ------------------------------------------------------------
--  set role anon;
--  select count(*) from public.particuliers;      -- doit ÉCHOUER
--  select count(*) from public.conversations;     -- doit ÉCHOUER
--  select count(*) from public.messages;          -- doit ÉCHOUER
--  select count(*) from public.points_tatoueur;   -- doit ÉCHOUER
--  select count(*) from public.tatoueurs;         -- un nombre : normal
--  reset role;
