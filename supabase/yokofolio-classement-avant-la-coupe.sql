-- =====================================================================
--  MIGRATION Nº 63 — LE CLASSEMENT S'APPLIQUE AVANT LA COUPE, VRAIMENT
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée : elle refait la seule fonction
--  `rechercher_tatoueurs`. Se relance sans risque.
--
--  ⚠️ PASSER LES Nº 61 ET 62 AVANT CELLE-CI (la vue
--  `popularite_tatoueurs` vient de la nº 62 ; ce fichier ne la recrée
--  pas).
--
--  LE DÉFAUT (passe nº 219-§4), constaté par le propriétaire
--  ----------------------------------------------------------
--  « Mes deux fiches — que je consulte sans arrêt, que je suis et que
--  j'ai aimées — n'apparaissent en tête de l'accueil qu'une fois les
--  92 portfolios chargés. » Autrement dit : le classement semblait
--  s'appliquer aux cartes DÉJÀ REÇUES, jamais au catalogue.
--
--  LA CAUSE, EXACTEMENT
--  ---------------------
--  La fonction contient DEUX `order by` sur la même sous-requête :
--
--    1. celui du `row_number() over (order by …)`, qui NUMÉROTE les
--       lignes — c'est `s.rang`, et c'est lui que suit le tri final ;
--    2. celui de la sous-requête elle-même, que suivent le `limit` et
--       l'`offset` — c'est lui qui CHOISIT quelles lignes reviennent.
--
--  La nº 62 n'avait ajouté le score qu'au PREMIER. Le second choisissait
--  donc toujours ses vingt-quatre lignes par le seul `md5` du jour, et
--  le tri final ne faisait que reclasser ces vingt-quatre-là entre
--  elles. Le classement était réel — mais il ne s'appliquait qu'à la
--  page. C'est le défaut de la nº 58, déplacé d'un cran, exactement
--  comme le propriétaire l'a écrit.
--
--  LA CORRECTION
--  --------------
--  UNE SEULE LIGNE, mais à la bonne place : `coalesce(pop.score, 0)
--  desc` entre aussi dans l'`order by` du `limit`. Les deux listes de
--  tri sont désormais IDENTIQUES, terme pour terme — ce qui est la
--  seule façon d'être sûr que la page retenue est bien le haut du
--  classement. Le départage reste `md5(id || jour)` : à score égal,
--  l'ordre ne dépend toujours pas du nombre de cartes demandées.
--
--  RIEN D'AUTRE NE CHANGE : le corps est celui de la nº 62, recopié.
-- =====================================================================

-- ------------------------------------------------------------
--  LA RECHERCHE, REFAITE À L'IDENTIQUE — sauf son dernier `order by`
-- ------------------------------------------------------------
--  ⚠️ ON SUPPRIME PUIS ON RECRÉE, comme aux nº 38, 42, 43 et 49 :
--  « create or replace » refuserait tout changement de signature et
--  laisserait deux fonctions homonymes, entre lesquelles PostgREST ne
--  saurait pas choisir. La signature ne change pas ici, mais on garde
--  le même geste — il est sûr, et il rend le fichier rejouable.
do $migration$
declare
  ancienne record;
begin
  for ancienne in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'rechercher_tatoueurs'
  loop
    execute 'drop function ' || ancienne.signature;
  end loop;
end
$migration$;

create function public.rechercher_tatoueurs(
  p_style text default null,
  p_niveau text default null,               -- adresse | ville | region | pays
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_rayon_km double precision default 0,
  p_ville_nom text default null,
  p_ville_slug text default null,
  p_code_pays text default null,
  p_region text default null,
  p_types text[] default null,
  p_modes text[] default null,
  p_technique text[] default null,
  p_composition text[] default null,
  p_besoins text[] default null,
  --  LA NATURE DE PHOTO cherchée — 'tatouage' | 'flash'
  --  (migration nº 49). Null = on ne cherche pas par nature.
  p_nature text default null,
  p_rendus text[] default null,
  p_comptes_masques text[] default '{}'::text[],
  p_photo_rendu text default null,
  p_limite integer default 24,
  p_decalage integer default 0,
  p_photos_max integer default 1,
  p_prioriser_clics boolean default false,
  p_jour integer default 0
)
returns table (
  fiche jsonb,
  distance_km double precision,
  total_resultats bigint
)
language sql
stable
parallel safe
set search_path = public
as $$
  select
    jsonb_build_object(
      'id', s.id,
      'nom', s.nom,
      'slug', s.slug,
      'ville_nom', coalesce(lc.ville, s.ville_nom),
      'ville_slug', coalesce(lc.ville_slug, s.ville_slug),
      'latitude', coalesce(lc.latitude, s.latitude),
      'longitude', coalesce(lc.longitude, s.longitude),
      'adresse', coalesce(lc.adresse, s.adresse),
      'code_postal', coalesce(lc.code_postal, s.code_postal),
      'region', coalesce(lc.region, s.region),
      'pays', coalesce(lc.pays, s.pays),
      'code_pays', coalesce(lc.code_pays, s.code_pays),
      'lieu_id', coalesce(lc.lieu_id, s.lieu_id),
      'styles', to_jsonb(s.styles),
      'lien_instagram', s.lien_instagram,
      'lien_tiktok', s.lien_tiktok,
      'lien_youtube', s.lien_youtube,
      'site_web', s.site_web,
      'bio', s.bio,
      'type_fiche', s.type_fiche,
      'mode_exercice', s.mode_exercice,
      'rayon_zone_km', s.rayon_zone_km,
      'villes', s.villes,
      'photo_principale', s.photo_principale,
      'photo_profil', s.photo_profil,
      'photos', to_jsonb(s.photos),
      'photos_styles', s.photos_styles,
      'filtres_technique', to_jsonb(s.filtres_technique),
      'filtres_composition', to_jsonb(s.filtres_composition),
      'filtres_besoins', to_jsonb(s.filtres_besoins),
      'ancien_slug', s.ancien_slug,
      'publie', s.publie,
      'galerie', coalesce(g.photos, '[]'::jsonb)
    ) as fiche,
    s.km as distance_km,
    s.total as total_resultats
  from (
    select
      t.*,
      count(*) over () as total,
      d.km,
      row_number() over (
        order by
          case when p_prioriser_clics
               then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
               end desc nulls last,
          case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
               then d.km end asc nulls last,
          --  ⚠️ LE SCORE DE POPULARITÉ — ET IL EST RÉPÉTÉ À
          --  L'IDENTIQUE dans l'`order by` du `limit`, plus bas
          --  (migration nº 63). Ici il NUMÉROTE, là-bas il CHOISIT :
          --  les deux doivent dire exactement la même chose.
          --  Il vient de la vue `popularite_tatoueurs`, définie une
          --  seule fois plus haut : consultations + cœurs + abonnés.
          coalesce(pop.score, 0) desc,
          --  LE DÉPARTAGE, INCHANGÉ ET TOTAL : deux fiches de même score
          --  — le cas de l'immense majorité, à zéro — gardent le tirage
          --  du jour, identique d'une requête à l'autre.
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
    --  LE SCORE DE LA FICHE — une lecture de vue, jamais un calcul
    --  répété : la vue agrège les trois tables une fois pour toutes.
    left join public.popularite_tatoueurs pop on pop.id = t.id
    left join lateral (
      select min(greatest(
               public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                 - z.rayon_km, 0)) as km
        from public.zones_tatoueur z
       where p_latitude is not null and p_longitude is not null
         and z.tatoueur_id = t.id
    ) d on true
    where t.publie
      and t.supprime_le is null
      --  ============================================================
      --  LES FICHES D'ESSAI D'UN ADMINISTRATEUR — ET LEUR EXCEPTION.
      --  ⚠️ `or t.admin_publique` EST LA SEULE LIGNE QUE LA Nº 43
      --  AJOUTE À CETTE FONCTION. Éteinte (le cas par défaut), la
      --  fiche reste écartée exactement comme avant ; allumée, elle
      --  passe comme n'importe quelle autre.
      --  ============================================================
      and (
        coalesce(cardinality(p_comptes_masques), 0) = 0
        or t.user_id is null
        or t.user_id::text <> all (p_comptes_masques)
        or t.admin_publique
      )
      --  ============================================================
      --  LE STYLE SE LIT DANS LES PHOTOS (migration nº 58)
      --  ------------------------------------------------------------
      --  AVANT : `t.styles @> array[p_style]` — la DÉCLARATION de la
      --  fiche. Un style annoncé et jamais rempli remontait donc dans
      --  une photothèque, pour n'y rien montrer.
      --  MAINTENANT : il faut une PHOTO CATALOGUÉE de ce style. C'est
      --  la seule preuve qu'il y a quelque chose à regarder — et elle
      --  se vérifie d'un coup d'œil, contrairement à une déclaration.
      --  ============================================================
      and (
        p_style is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.style = p_style
        )
      )
      and (
        p_ville_slug is null
        or t.ville_slug = p_ville_slug
        or t.id in (
          select l.tatoueur_id from public.lieux_annexes_tatoueur l
           where l.ville_slug = p_ville_slug
        )
      )
      and (
        p_types is null
        or (case
              when coalesce(t.type_fiche, 'salon') = 'artiste' then 'artiste'
              when coalesce(t.etablissement, 'salon') = 'prive' then 'studio-prive'
              else 'salon'
            end) = any (p_types)
      )
      and (
        p_modes is null
        or coalesce(t.type_fiche, 'salon') <> 'artiste'
        or not exists (
          select 1 from public.modes_exercice_actifs m
           where m.tatoueur_id = t.id
        )
        or exists (
          select 1 from public.modes_exercice_actifs m
           where m.tatoueur_id = t.id
             and m.genre = any (p_modes)
        )
      )
      and (
        p_technique is null
        or coalesce(cardinality(t.filtres_technique), 0) = 0
        or t.filtres_technique && p_technique
      )
      and (
        p_composition is null
        or coalesce(cardinality(t.filtres_composition), 0) = 0
        or t.filtres_composition && p_composition
      )
      and (
        p_besoins is null
        or t.filtres_besoins && p_besoins
      )
      and (
        p_rendus is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.rendu = any (p_rendus)
        )
      )
      --  ============================================================
      --  LA NATURE (migration nº 49) — ELLE SE LIT DANS LES PHOTOS.
      --  C'est toute la différence avec l'ancienne case « Flash » :
      --  on ne croit personne sur parole, on regarde ce qui est
      --  déposé. Et elle se croise AVEC LE STYLE quand il y en a
      --  un — « des flashs EN réalisme », pas « des flashs ET du
      --  réalisme » : sans ce croisement, un tatoueur qui fait du
      --  réalisme et des flashs de old school répondrait « oui » à
      --  « Flashs · Réalisme », ce qui est faux.
      --  ============================================================
      and (
        p_nature is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id
             and p.nature = p_nature
             and (p_style is null or p.style = p_style)
        )
        --  ============================================================
        --  ⚠️ LE REPLI DE LA Nº 56 A ÉTÉ RETIRÉ ICI (migration nº 58).
        --  Il gardait une fiche « quand on n'avait rien à lui
        --  opposer » : aucune photo cataloguée pour le style cherché,
        --  donc le style DÉCLARÉ faisait foi. C'est exactement ce que
        --  le propriétaire a annulé — un style sans photo n'a rien à
        --  montrer, il ne doit pas remonter. La nature redevient donc
        --  ce qu'elle a toujours dû être : une lecture des photos, et
        --  rien d'autre.
        --  ============================================================
      )
      --  LE LIEU, sur TOUS les lieux de la fiche (migration nº 42).
      and (
        case coalesce(p_niveau, 'ville')
          when 'pays' then
            p_code_pays is null
            or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
            or t.id in (
              select l.tatoueur_id from public.lieux_annexes_tatoueur l
               where upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
            )
          when 'region' then
            p_region is null
            or (
              public.yf_normaliser(t.region) = public.yf_normaliser(p_region)
              and (
                p_code_pays is null
                or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
              )
            )
            or t.id in (
              select l.tatoueur_id from public.lieux_annexes_tatoueur l
               where public.yf_normaliser(l.region) = public.yf_normaliser(p_region)
                 and (
                   p_code_pays is null
                   or upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
                 )
            )
          else
            p_latitude is null or p_longitude is null
            or case
              when p_rayon_km > 0 then t.id in (
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km = 0
                   and z.latitude between p_latitude - (p_rayon_km / 111.045)
                                      and p_latitude + (p_rayon_km / 111.045)
                   and z.longitude between p_longitude - (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                                       and p_longitude + (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude) <= p_rayon_km
                union all
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km > 0
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                       <= p_rayon_km + z.rayon_km
              )
              when p_ville_nom is not null then
                public.yf_commune(t.ville_nom) = public.yf_commune(p_ville_nom)
                or t.id in (
                  select l.tatoueur_id from public.lieux_annexes_tatoueur l
                   where public.yf_commune(l.ville) = public.yf_commune(p_ville_nom)
                  union all
                  select z.tatoueur_id from public.zones_tatoueur z
                   where z.rayon_km > 0
                     and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                         <= z.rayon_km
                )
              else t.id in (
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km = 0
                   and z.latitude between p_latitude - 0.03 and p_latitude + 0.03
                   and z.longitude between p_longitude - 0.05 and p_longitude + 0.05
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude) <= 2
                union all
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km > 0
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                       <= 2 + z.rayon_km
              )
            end
        end
      )
    --  ============================================================
    --  ⚠️ C'EST CET `order by` QUI DÉCIDE DE LA PAGE (migration nº 63)
    --  ============================================================
    --  LE DÉFAUT DE LA Nº 62 : elle avait mis le score dans le
    --  `row_number()` ci-dessus — donc dans `s.rang`, qui sert au tri
    --  FINAL — mais PAS ici. Or c'est ce tri-ci que suivent le `limit`
    --  et l'`offset` : il choisissait les vingt-quatre lignes par le
    --  seul `md5` du jour, et le tri final ne faisait que reclasser
    --  ces vingt-quatre-là entre elles. Vu de l'écran : les fiches les
    --  plus populaires n'arrivaient en tête qu'une fois TOUT le
    --  catalogue chargé — le classement s'appliquait à ce qui était
    --  déjà reçu, pas au catalogue.
    --  LES DEUX `order by` SONT DÉSORMAIS IDENTIQUES, terme pour
    --  terme. Ils doivent l'être : celui-ci CHOISIT les lignes, celui
    --  du `row_number()` les NUMÉROTE, et deux règles différentes pour
    --  un même classement, c'est la panne assurée.
    order by
      case when p_prioriser_clics
           then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
           end desc nulls last,
      case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
           then d.km end asc nulls last,
      coalesce(pop.score, 0) desc,
      md5(t.id::text || '-' || p_jour::text)
    limit greatest(coalesce(p_limite, 24), 0)
    offset greatest(coalesce(p_decalage, 0), 0)
  ) s

  left join lateral (
    select l.*
      from public.lieux_tatoueur l
     where (p_latitude is not null or p_code_pays is not null
            or p_region is not null)
       and l.tatoueur_id = s.id
       and case coalesce(p_niveau, 'ville')
             when 'pays' then
               p_code_pays is not null
               and upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
             when 'region' then
               p_region is not null
               and public.yf_normaliser(l.region) = public.yf_normaliser(p_region)
               and (p_code_pays is null
                    or upper(coalesce(l.code_pays, '')) = upper(p_code_pays))
             else
               p_latitude is not null and p_longitude is not null
               and l.latitude is not null and l.longitude is not null
               and public.yf_distance_km(p_latitude, p_longitude, l.latitude, l.longitude)
                   <= greatest(p_rayon_km, 2) + l.rayon_km
           end
     order by
       case when p_latitude is not null
            then greatest(public.yf_distance_km(p_latitude, p_longitude, l.latitude, l.longitude)
                          - l.rayon_km, 0)
            end asc nulls last,
       l.rang
     limit 1
  ) lc on true

  left join lateral (
    select jsonb_agg(
             jsonb_build_object(
               'id', p.id, 'style', p.style,
               'rendu', p.rendu, 'nature', p.nature,
               'url', p.url, 'miniature', p.miniature,
               'ordre', p.ordre
             ) order by p.ordre
           ) as photos
      from (
        select p2.*
          from public.photos_tatoueur p2
         where p2.tatoueur_id = s.id
         order by
           --  ⚠️ LA NATURE PASSE AVANT TOUT (migration nº 49) :
           --  chercher des flashs et voir une photo de tatouage
           --  serait le même mensonge d'affichage que chercher
           --  « couleur » et voir du noir et gris.
           case when p_nature is not null and p2.nature <> p_nature
                then 1 else 0 end,
           case
             when (p_style is null or p2.style = p_style)
              and (p_photo_rendu is null or p2.rendu = p_photo_rendu) then 0
             when p_style is not null and p2.style = p_style then 1
             when p_photo_rendu is not null and p2.rendu = p_photo_rendu then 2
             else 3
           end,
           p2.ordre
         limit greatest(coalesce(p_photos_max, 1), 1)
      ) p
  ) g on true
  --  ------------------------------------------------------------
  --  L'ORDRE EST CELUI DE `s.rang`, ET RIEN D'AUTRE (migration nº 61)
  --  ------------------------------------------------------------
  --  ⚠️ CE QUI ÉTAIT ÉCRIT ICI, ET QUI RENDAIT LA PAGINATION
  --  INSTABLE :
  --      case when p_prioriser_clics then 0
  --           else -coalesce((select c.total from clics_tatoueurs …), 0)
  --      end,
  --      s.rang
  --  Ce tri s'appliquait à `s`, c'est-à-dire à la page DÉJÀ COUPÉE
  --  (le `limit`/`offset` est dans la sous-requête). Les vingt-quatre
  --  premières cartes étaient donc reclassées par nombre de clics
  --  ENTRE ELLES ; en demander quarante-huit reclassait un AUTRE
  --  ensemble, et une fiche très consultée qui occupait le rang 30
  --  remontait en tête de la mosaïque. Vu de l'écran : « Voir plus »
  --  fait apparaître des cartes AU-DESSUS de celles déjà affichées.
  --
  --  `s.rang` est un ordre TOTAL et DÉTERMINÉ : il départage tout,
  --  jusqu'à `md5(id || jour)` qui ne laisse aucune égalité. Il ne
  --  dépend pas du nombre de lignes demandées — la page 1 garde donc
  --  exactement le même début quand on charge la page 2.
  --
  --  LA POPULARITÉ VIT DANS `s.rang` (voir le `row_number()` plus
  --  haut), donc AVANT la coupe, sur le catalogue filtré ENTIER. Un
  --  tri qui s'applique après la coupe n'est pas un classement : c'est
  --  un remaniement de page — c'est ce que faisait la nº 58, et c'est
  --  ce qui faisait remonter des cartes au-dessus de celles déjà
  --  affichées.
  order by s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Depuis la nº 42 elle interroge TOUS les lieux d''une fiche ; depuis la nº 43 une fiche d''administrateur dont `admin_publique` est allumé passe comme n''importe quelle autre ; depuis la nº 49 elle connaît la NATURE des photos (tatouage / flash) ; depuis la nº 58 LE STYLE SE LIT DANS LES PHOTOS CATALOGUÉES et non plus dans le tableau déclaré `tatoueurs.styles` — un style sans photo n''existe pas pour la recherche (le repli de la nº 56 est annulé) ; depuis la nº 61 L''ORDRE DES RÉSULTATS NE DÉPEND PLUS DE LA TAILLE DE LA PAGE — le classement par clics posé APRÈS la coupe est supprimé, `s.rang` fait seul l''ordre ; depuis la nº 62 elle intègre un SCORE DE POPULARITÉ (vue `popularite_tatoueurs` : consultations + 3 × cœurs + 8 × abonnés) ; depuis la nº 63 ce score est dans LES DEUX `order by` — celui qui numérote (`row_number`) ET celui que suivent le `limit`/`offset`, donc la première page contient bien les portfolios les plus populaires du catalogue.';

grant execute on function public.rechercher_tatoueurs to anon, authenticated;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — n'écrit rien.
-- ------------------------------------------------------------
--  LA PREMIÈRE PAGE CONTIENT-ELLE BIEN LE HAUT DU CLASSEMENT ?
--  Les vingt-quatre premières lignes rendues doivent être les
--  vingt-quatre meilleurs scores du catalogue publié.
--
--  with page as (
--    select row_number() over () as place, r.fiche->>'slug' as slug
--      from public.rechercher_tatoueurs(p_limite => 24,
--             p_jour => (extract(epoch from now())/86400)::int) r
--  )
--  select p.place, p.slug, pop.consultations, pop.coeurs, pop.abonnes,
--         pop.score
--    from page p
--    join public.popularite_tatoueurs pop on pop.slug = p.slug
--   order by p.place;
--
--  ET LE CONTRÔLE DE STABILITÉ DE LA Nº 61 RESTE VALABLE : les
--  vingt-quatre premières lignes doivent être identiques entre une
--  page de 24 et une page de 48.
