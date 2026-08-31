-- ============================================================
--  LES ADRESSES DES PHOTOS APRÈS LE DÉMÉNAGEMENT
--  À coller dans le NOUVEAU projet (yokofolio-us).
-- ============================================================
--  LE DÉFAUT QUE CE FICHIER RÉPARE, vu en production :
--  beaucoup de photos ne s'affichent plus — un point d'interrogation
--  dans un carré (l'image cassée du navigateur).
--
--  LA CAUSE. La base ne garde pas des CHEMINS, elle garde des ADRESSES
--  ENTIÈRES :
--    https://<projet>.supabase.co/storage/v1/object/public/<seau>/<…>
--  Le déménagement a copié les FICHIERS vers le nouveau projet, mais
--  les LIGNES, elles, nomment toujours l'ancien. Et `next.config.ts`
--  n'autorise l'optimiseur d'images QUE sur le domaine du projet
--  courant : chaque photo restée à l'ancienne adresse est refusée.
--  D'où l'image cassée — le fichier existe pourtant, des deux côtés.
--
--  ⚠️ COLLE UN BLOC À LA FOIS. Le bloc 1 ne fait que compter ; c'est
--  lui qui te dit quoi mettre dans les deux autres.
-- ============================================================


-- ────────────────────────────────────────────────────────────
--  BLOC 1 · LE CONSTAT — il ne modifie rien.
--  Il compte les adresses par DOMAINE et par SEAU. C'est lui qui
--  répond aux trois questions : combien pointent encore vers
--  l'Irlande, combien vers le nouveau projet, et combien nomment le
--  vieux seau `photos-artisans`.
-- ────────────────────────────────────────────────────────────
with toutes as (
  select 'photos_tatoueur.url'        as colonne, url        as adresse from public.photos_tatoueur
  union all
  select 'photos_tatoueur.miniature', miniature              from public.photos_tatoueur
  union all
  select 'tatoueurs.photo_profil',    photo_profil           from public.tatoueurs
  union all
  select 'tatoueurs.photo_principale', photo_principale      from public.tatoueurs
  union all
  select 'tatoueurs.photos',          unnest(coalesce(photos, array[]::text[])) from public.tatoueurs
  union all
  select 'tatoueurs.photos_styles',   v
    from public.tatoueurs, lateral jsonb_each_text(coalesce(photos_styles, '{}'::jsonb)) as e(k, v)
),
lues as (
  select
    colonne,
    case
      when adresse is null or adresse = ''            then '(vide)'
      when adresse like '/%'                          then '(chemin local, images de démonstration)'
      when adresse ~ '^https?://'
        then split_part(split_part(adresse, '//', 2), '/', 1)
      else '(autre)'
    end as domaine,
    case
      when adresse like '%/storage/v1/object/%'
        then split_part(
               regexp_replace(adresse, '^.*/storage/v1/object/(public|sign|authenticated)/', ''),
               '/', 1)
      else '(hors stockage)'
    end as seau
  from toutes
)
select domaine, seau, count(*) as combien
from lues
group by domaine, seau
order by combien desc;


-- ────────────────────────────────────────────────────────────
--  BLOC 2 · LA RÉÉCRITURE — l'ancien domaine devient le nouveau.
--  ------------------------------------------------------------
--  ⚠️ REMPLACE LES DEUX NOMS DE LA PREMIÈRE LIGNE par ce que le
--  bloc 1 t'a montré :
--    · `ancien` = le domaine qui revient le plus (celui d'Irlande) ;
--    · `nouveau` = le domaine de yokofolio-us (Settings ▸ Data API ▸
--      « Project URL », sans le `https://`).
--  Rien d'autre à changer.
--
--  ⚠️ IL NE TOUCHE QUE LE DOMAINE. Le chemin du fichier, le seau, le
--  nom : inchangés. Une adresse locale (`/images-demo/…`) n'est pas
--  concernée, une adresse déjà à jour non plus.
--
--  ⚠️ IL EST REJOUABLE : relancé, il ne trouve plus rien à changer.
-- ────────────────────────────────────────────────────────────
do $$
declare
  ancien  text := 'REMPLACE-MOI-ancien.supabase.co';
  nouveau text := 'REMPLACE-MOI-nouveau.supabase.co';
  n1 int; n2 int; n3 int; n4 int; n5 int; n6 int;
begin
  if ancien like 'REMPLACE-MOI%' or nouveau like 'REMPLACE-MOI%' then
    raise exception 'Renseigne d abord les deux domaines dans ce bloc.';
  end if;

  update public.photos_tatoueur set url = replace(url, ancien, nouveau)
   where url like '%' || ancien || '%';
  get diagnostics n1 = row_count;

  update public.photos_tatoueur set miniature = replace(miniature, ancien, nouveau)
   where miniature like '%' || ancien || '%';
  get diagnostics n2 = row_count;

  update public.tatoueurs set photo_profil = replace(photo_profil, ancien, nouveau)
   where photo_profil like '%' || ancien || '%';
  get diagnostics n3 = row_count;

  update public.tatoueurs set photo_principale = replace(photo_principale, ancien, nouveau)
   where photo_principale like '%' || ancien || '%';
  get diagnostics n4 = row_count;

  --  LE TABLEAU : chaque case est retraitée, l'ordre est gardé.
  update public.tatoueurs t
     set photos = (select array_agg(replace(x, ancien, nouveau) order by n)
                     from unnest(t.photos) with ordinality as u(x, n))
   where t.photos is not null
     and array_to_string(t.photos, ' ') like '%' || ancien || '%';
  get diagnostics n5 = row_count;

  --  LE JSON : on le traverse en texte, puis on le remet en JSON. Le
  --  domaine n'apparaît que dans les valeurs d'adresse — jamais dans
  --  un nom de style.
  update public.tatoueurs
     set photos_styles = replace(photos_styles::text, ancien, nouveau)::jsonb
   where photos_styles::text like '%' || ancien || '%';
  get diagnostics n6 = row_count;

  raise notice 'photos_tatoueur.url % · miniature % · photo_profil % · photo_principale % · photos % · photos_styles %',
    n1, n2, n3, n4, n5, n6;
end $$;


-- ────────────────────────────────────────────────────────────
--  BLOC 3 · LA VÉRIFICATION — relance le BLOC 1.
--  Plus aucune ligne ne doit porter l'ancien domaine. S'il en reste,
--  envoie-moi le tableau : c'est une colonne que je n'ai pas vue.
-- ────────────────────────────────────────────────────────────
