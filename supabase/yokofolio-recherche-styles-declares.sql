-- =====================================================================
--  MIGRATION Nº 56 — LA RECHERCHE PAR STYLE RÉPARÉE
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée : elle refait la seule fonction
--  `rechercher_tatoueurs`. Se relance sans risque.
--
--  LE DÉFAUT QU'ELLE CORRIGE
--  --------------------------
--  Chercher un style depuis le menu « Explorer » ne remontait plus
--  qu'une partie des fiches — parfois aucune. Une fiche pourtant
--  VALIDÉE, EN LIGNE et qui DÉCLARE le style cherché restait
--  invisible.
--
--  LA CAUSE, mesurée sur une base neuve où les 55 migrations ont été
--  rejouées :
--
--   1. le menu « Explorer » ne cherche jamais un style tout seul : il
--      envoie toujours une CATÉGORIE avec — « Réalisations »
--      (nature = tatouage) ou « Flashs » (nature = flash) ;
--   2. depuis la nº 49, la nature ne se lit PAS dans la fiche mais
--      dans ses PHOTOS CATALOGUÉES (table `photos_tatoueur`), et elle
--      se croise avec le style : il fallait une photo portant À LA
--      FOIS la bonne nature ET le bon style ;
--   3. or le catalogue est incomplet. La nº 31 l'a créé pour les
--      portfolios déposés depuis ; la nº 55 a rattrapé les fiches
--      ENTIÈREMENT vides — mais pas celles qui ont une photo dans UN
--      style et en déclarent d'autres.
--
--  Résultat mesuré sur le banc : « Aquarelle » SANS nature rendait 4
--  fiches ; « Aquarelle » dans « Réalisations » n'en rendait que 3 —
--  la fiche qui déclare le style sans photo taguée avait disparu.
--
--  LA CORRECTION
--  --------------
--  Quand la fiche n'a AUCUNE photo cataloguée pour le style cherché,
--  on n'a rien à lui opposer : son STYLE DÉCLARÉ fait foi, et elle
--  répond à la nature par défaut (« tatouage »). Un FLASH, lui, se
--  déclare — on n'en invente jamais, et le croisement voulu par la
--  nº 49 tient toujours : un tatoueur qui a des photos en japonais et
--  des flashs old-school ne répond pas à « Flashs · Japonais ».
--
--  ⚠️ LA MIGRATION Nº 57 COMPLÈTE LE CATALOGUE (une photo par style
--  déclaré). Les deux sont utiles et indépendantes : celle-ci fait que
--  le site marche même avec un catalogue incomplet — aucune version du
--  site n'exige une migration —, celle-là rend le catalogue complet
--  pour les cœurs et la photothèque.
-- =====================================================================

-- ------------------------------------------------------------
--  LA RECHERCHE, REFAITE À L'IDENTIQUE — sauf la clause de nature
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
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
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
      and (p_style is null or t.styles @> array[p_style])
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
        --  LE REPLI SUR LE STYLE DÉCLARÉ (migration nº 56) — ET C'EST
        --  LUI QUI RÉPARE LA RECHERCHE.
        --  La clause ci-dessus demande une PHOTO CATALOGUÉE portant à
        --  la fois la nature et le style. Or le menu « Explorer »
        --  envoie TOUJOURS une nature : une fiche qui DÉCLARE un style
        --  sans avoir encore de photo taguée sous ce style-là
        --  disparaissait donc de TOUTE recherche par style. C'était le
        --  cas de la plupart des fiches reprises : la nº 55 ne
        --  complétait que les portfolios ENTIÈREMENT vides.
        --  On garde donc la fiche quand ON N'A RIEN À LUI OPPOSER :
        --  aucune photo cataloguée pour ce style (ou aucune photo du
        --  tout si l'on ne cherche pas de style). Le style déclaré,
        --  déjà vérifié plus haut, fait alors foi.
        --  ⚠️ POUR LA NATURE PAR DÉFAUT SEULEMENT. « tatouage » est ce
        --  qu'est une image déposée sans rien préciser (nº 49) ; un
        --  FLASH, lui, se déclare — on n'en invente jamais. Le
        --  croisement voulu tient donc toujours : un tatoueur qui a
        --  des photos en japonais et des flashs old-school ne répond
        --  pas à « Flashs · Japonais ».
        --  ============================================================
        or (
          p_nature = 'tatouage'
          and not exists (
            select 1 from public.photos_tatoueur p
             where p.tatoueur_id = t.id
               and (p_style is null or p.style = p_style)
          )
        )
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
    order by
      case when p_prioriser_clics
           then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
           end desc nulls last,
      case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
           then d.km end asc nulls last,
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
  order by
    case when p_prioriser_clics then 0
         else -coalesce((select c.total from public.clics_tatoueurs c where c.slug = s.slug), 0)
    end,
    s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Depuis la nº 42 elle interroge TOUS les lieux d''une fiche ; depuis la nº 43 une fiche d''administrateur dont `admin_publique` est allumé passe comme n''importe quelle autre ; depuis la nº 49 elle connaît la NATURE des photos (tatouage / flash) ; depuis la nº 56 une fiche qui DÉCLARE un style sans photo encore taguée sous ce style répond à la nature par défaut (« tatouage ») — c''est ce qui répare la recherche par style sur un catalogue incomplet.';

grant execute on function public.rechercher_tatoueurs to anon, authenticated;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — n'écrit rien.
--  Colle ces requêtes après la migration : la première dit combien de
--  fiches répondent au style choisi AVEC et SANS la catégorie ; elles
--  doivent désormais donner le MÊME nombre pour « Réalisations ».
-- ------------------------------------------------------------
-- select 'avec la catégorie Réalisations' as chemin, count(*)
--   from rechercher_tatoueurs(p_style => 'aquarelle', p_nature => 'tatouage')
-- union all
-- select 'sans catégorie', count(*)
--   from rechercher_tatoueurs(p_style => 'aquarelle');
--
--  Et la liste des fiches qui déclarent un style sans photo taguée —
--  celles que la nº 57 catalogue :
-- select t.nom, s.style
--   from public.tatoueurs t
--   cross join lateral unnest(t.styles) as s(style)
--  where t.publie and t.supprime_le is null
--    and not exists (select 1 from public.photos_tatoueur p
--                     where p.tatoueur_id = t.id and p.style = s.style)
--  order by t.nom, s.style;
