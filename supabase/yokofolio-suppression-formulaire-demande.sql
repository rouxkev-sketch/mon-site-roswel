-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 47 : LE « FORMULAIRE DE DEMANDE » S'EN VA
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 46
--  (yokofolio-page-de-liens.sql).
--
--  ⚠️⚠️ CETTE MIGRATION SUPPRIME UNE COLONNE ET SON CONTENU.
--  C'est la consigne, écrite mot pour mot : « supprime le champ,
--  partout où il est, son affichage public, son icône, ET la colonne
--  en base. Rien à conserver. » Ce fichier fait donc ce que les
--  autres ne font jamais : il efface.
--
--  CE QUI DISPARAÎT AVEC ELLE : les adresses de formulaire saisies par
--  les tatoueurs (Google Forms, page de leur site, service de
--  réservation). Elles ne sont NI copiées ailleurs, NI sauvegardées :
--  la demande était explicite. Le champ, son affichage sur les fiches
--  publiques et son icône sont partis du code à la même passe (nº 102).
--
--  ⚠️ SI TU HÉSITES, VOICI LE FILET, ET IL EST À TIRER AVANT :
--  la requête ci-dessous, exécutée SEULE et AVANT le `drop`, montre ce
--  qui va être perdu. Elle n'est pas décommentée : c'est un geste
--  volontaire, pas un défaut.
--
--    -- select nom, slug, formulaire_demande
--    --   from public.tatoueurs
--    --  where formulaire_demande is not null
--    --  order by nom;
--
--  IRRÉVERSIBLE : une colonne supprimée ne se retrouve pas. Rejouable
--  sans erreur (`if exists`), mais la première exécution suffit.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) COMBIEN DE LIGNES SONT CONCERNÉES — avant de couper.
-- ---------------------------------------------------------------------
--  ⚠️ CETTE MESURE NE PROTÈGE RIEN, elle informe : elle s'affiche dans
--  l'éditeur SQL, au-dessus du résultat final. Elle est là pour que
--  personne ne découvre APRÈS coup combien de tatoueurs avaient
--  rempli ce champ.
do $$
declare combien integer;
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'tatoueurs'
       and column_name = 'formulaire_demande'
  ) then
    execute 'select count(*) from public.tatoueurs
              where formulaire_demande is not null'
       into combien;
    raise notice 'Formulaires de demande sur le point d''être effacés : %',
      combien;
  else
    raise notice 'La colonne formulaire_demande n''existe déjà plus.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) LA COLONNE S'EN VA
-- ---------------------------------------------------------------------
alter table public.tatoueurs
  drop column if exists formulaire_demande;

-- ---------------------------------------------------------------------
-- 3) LE MOTIF DE MODÉRATION QUI LA DÉSIGNAIT
-- ---------------------------------------------------------------------
--  « formulaire-non-conforme » renvoyait une fiche en correction en
--  pointant CE champ. Le champ n'existant plus, le motif encadrerait
--  du vide : la fiche serait renvoyée sans que rien ne soit
--  corrigeable. On le retire des fiches qui le portaient encore.
--  ⚠️ SEUL CE MOTIF PART. Les autres motifs de la même fiche restent :
--  ils désignent des champs qui, eux, existent toujours.
update public.tatoueurs
   set motifs_moderation =
         nullif(array_remove(motifs_moderation, 'formulaire-non-conforme'),
                '{}')
 where motifs_moderation is not null
   and 'formulaire-non-conforme' = any(motifs_moderation);

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'La colonne formulaire_demande existe encore ? (doit être « non »)', (
    select case when exists (
        select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'tatoueurs'
           and column_name = 'formulaire_demande')
      then 'OUI — la suppression n''est pas passée' else 'non' end)),
  (2, 'La colonne page_de_liens est bien là (migration nº 46)', (
    select case when exists (
        select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'tatoueurs'
           and column_name = 'page_de_liens')
      then 'oui' else 'NON — passe d''abord la nº 46' end)),
  (3, 'Fiches portant encore le motif « formulaire-non-conforme »', (
    select count(*)::text from public.tatoueurs
     where motifs_moderation is not null
       and 'formulaire-non-conforme' = any(motifs_moderation)))
) as etat(ordre, mesure, valeur)
order by ordre;
