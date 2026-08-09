-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 35 : LES FILTRES « BESOINS » ET « RENDU »
--                                FILTRENT ENFIN
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 34
--  (yokofolio-youtube.sql).
--
--  LE DÉFAUT. Les deux groupes existaient partout — dans le panneau
--  du moteur, dans l'adresse, dans l'API, dans cette fonction — et
--  pourtant éteindre « Cicatrice » ou « Noir et gris » ne retirait
--  jamais personne. La plomberie était complète ; c'est la RÈGLE qui
--  les annulait.
--
--  LA RÈGLE FAUTIVE. « Une fiche qui n'a RIEN déclaré dans un groupe
--  n'est jamais écartée. » Elle est juste pour Technique et
--  Composition : le formulaire y EXIGE au moins une case, donc une
--  fiche muette est forcément une fiche d'avant ces groupes, et
--  l'écarter serait injuste. Elle est fausse pour les deux autres :
--    · BESOINS est facultatif au formulaire — presque personne ne le
--      remplit, donc presque toutes les fiches étaient « muettes »,
--      donc épargnées : le filtre ne retirait jamais rien ;
--    · RENDU ne se déclare pas, il se lit dans les tags des photos —
--      une fiche sans photo taguée n'est ni noir et gris ni couleur,
--      elle ne peut pas répondre « oui » à l'un des deux.
--
--  CE QUE FAIT CETTE MIGRATION. Elle recrée la fonction de recherche
--  à l'identique, à trois différences près :
--    1. le silence n'épargne plus dans « besoins » ;
--    2. le silence n'épargne plus dans « rendu » ;
--    3. la fiche rendue porte « lien_youtube » (migration nº 34).
--  Technique, Composition et le type de fiche gardent la règle
--  d'origine, au mot près.
--
--  LE MÊME PARTAGE EST ÉCRIT DANS LE CODE (GROUPES_SANS_INDULGENCE,
--  src/lib/tatoueurs.ts) : le chemin de secours, quand la base est
--  injoignable, doit répondre exactement pareil.
--
--  SANS RISQUE : « create or replace » sur une fonction, aucune
--  donnée touchée, rejouable autant de fois qu'on veut.
--  ⚠️ ELLE SUPPOSE LA Nº 34 PASSÉE (colonne lien_youtube).
-- =====================================================================

create or replace function public.rechercher_tatoueurs(
  --  LE STYLE, ou null pour tous.
  p_style text default null,
  --  LE LIEU : ses coordonnées, sa précision, et ce qui l'identifie.
  p_niveau text default null,               -- adresse | ville | region | pays
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_rayon_km double precision default 0,
  p_ville_nom text default null,
  --  LE SLUG DE LA VILLE d'une page « style + ville » : c'est lui qui
  --  fait la page /tatouage/blackwork/lyon-1er, quel que soit le pays.
  p_ville_slug text default null,
  p_code_pays text default null,
  p_region text default null,
  --  LES INTERRUPTEURS ENCORE ALLUMÉS, groupe par groupe.
  --  NULL = groupe intact, aucun filtrage.
  p_types text[] default null,              -- artiste | salon
  p_technique text[] default null,
  p_composition text[] default null,
  p_besoins text[] default null,
  p_rendus text[] default null,
  --  LES COMPTES DONT LES FICHES SONT MASQUÉES DU PUBLIC
  --  (administrateurs — voir src/lib/fiches-admin.ts).
  p_comptes_masques text[] default '{}'::text[],
  --  LE RENDU CHERCHÉ, quand il n'en reste qu'un : il décide QUELLE
  --  photo la carte montre.
  p_photo_rendu text default null,
  --  LA PAGE demandée.
  p_limite integer default 24,
  p_decalage integer default 0,
  --  COMBIEN DE PHOTOS par fiche : UNE pour une carte. La fiche
  --  complète, elle, ne passe pas par ici.
  p_photos_max integer default 1,
  --  CLASSER PAR POPULARITÉ AVANT DE COUPER : c'est ce que font les
  --  pages « style + ville » (elles montrent les plus consultés de la
  --  ville). L'accueil, lui, tire au hasard du jour puis reclasse la
  --  page seule — le comportement d'origine, préservé.
  p_prioriser_clics boolean default false,
  --  LE NUMÉRO DU JOUR — la graine du mélange (le code l'envoie pour
  --  que le serveur et le navigateur tirent la même chose).
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
      'ville_nom', s.ville_nom,
      'ville_slug', s.ville_slug,
      'latitude', s.latitude,
      'longitude', s.longitude,
      'styles', to_jsonb(s.styles),
      'lien_instagram', s.lien_instagram,
      'lien_tiktok', s.lien_tiktok,
      'lien_youtube', s.lien_youtube,
      'site_web', s.site_web,
      'adresse', s.adresse,
      'code_postal', s.code_postal,
      'bio', s.bio,
      'region', s.region,
      'pays', s.pays,
      'code_pays', s.code_pays,
      'lieu_id', s.lieu_id,
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
      --  LA PHOTO DE LA CARTE — et elle seule. La règle est celle de
      --  `photoChoisie` : ce qui coche le style ET le rendu cherchés
      --  d'abord, puis le style, puis le rendu, puis la première de
      --  la galerie (celle que le tatoueur a mise en vitrine).
      'galerie', coalesce(g.photos, '[]'::jsonb)
    ) as fiche,
    s.km as distance_km,
    s.total as total_resultats
  from (
    select
      t.*,
      count(*) over () as total,
      --  LA DISTANCE au plus proche des points de la fiche — calculée
      --  UNE SEULE FOIS (jointure latérale), et seulement pour les
      --  fiches qui ont passé les filtres.
      d.km,
      row_number() over (
        order by
          --  LES PLUS CONSULTÉS D'ABORD, quand la page le demande.
          --  ⚠️ Le `case` n'est PAS décoratif : sans lui, la base
          --  compterait les clics de TOUTES les fiches retenues alors
          --  que la page d'accueil n'en a que faire.
          case when p_prioriser_clics
               then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
               end desc nulls last,
          --  AUTOUR D'UN POINT : le plus proche d'abord.
          case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
               then d.km end asc nulls last,
          --  SINON : le mélange du jour.
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
    --  LA DISTANCE, UNE SEULE FOIS. Le `p_latitude is not null` est À
    --  L'INTÉRIEUR : sans lieu, la base n'ouvre même pas la table des
    --  points.
    left join lateral (
      select min(public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude)) as km
        from public.points_tatoueur pt
       where p_latitude is not null and p_longitude is not null
         and pt.tatoueur_id = t.id
    ) d on true
    where t.publie
      and t.supprime_le is null
      --  LES FICHES D'ESSAI D'UN ADMINISTRATEUR N'EXISTENT PAS POUR
      --  LE PUBLIC.
      and (
        coalesce(cardinality(p_comptes_masques), 0) = 0
        or t.user_id is null
        or t.user_id::text <> all (p_comptes_masques)
      )
      --  LE STYLE.
      and (p_style is null or t.styles @> array[p_style])
      --  LA VILLE D'UNE PAGE DE RÉFÉRENCEMENT.
      and (p_ville_slug is null or t.ville_slug = p_ville_slug)
      --  LES INTERRUPTEURS. « Rien de déclaré » n'écarte personne.
      and (p_types is null or coalesce(t.type_fiche, 'salon') = any (p_types))
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
      --  ⚠️ MIGRATION Nº 35 : LE SILENCE NE PROTÈGE PLUS.
      --  « or cardinality(...) = 0 » épargnait toute fiche n'ayant
      --  rien déclaré. Le groupe étant FACULTATIF au formulaire,
      --  presque aucune fiche ne déclarait rien — donc presque toutes
      --  étaient épargnées, et le filtre ne retirait jamais personne.
      --  Un besoin n'est pas un goût : chercher un cover, c'est
      --  chercher quelqu'un qui l'a DIT.
      and (
        p_besoins is null
        or t.filtres_besoins && p_besoins
      )
      --  LE RENDU ne se déclare pas : il se déduit des photos.
      --  ⚠️ MIGRATION Nº 35, MÊME RAISON. « not exists (… rendu is
      --  not null) » laissait passer toute fiche dont aucune photo
      --  n'était taguée. Une fiche sans photo taguée n'est ni noir et
      --  gris ni couleur : elle ne peut pas répondre « oui » à l'un
      --  des deux.
      and (
        p_rendus is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.rendu = any (p_rendus)
        )
      )
      --  LE LIEU, selon SA PRÉCISION.
      and (
        case coalesce(p_niveau, 'ville')
          --  TOUT LE PAYS.
          when 'pays' then
            p_code_pays is null
            or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
          --  TOUTE LA RÉGION (dans ce pays, quand on le connaît).
          when 'region' then
            p_region is null
            or (
              public.yf_normaliser(t.region) = public.yf_normaliser(p_region)
              and (
                p_code_pays is null
                or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
              )
            )
          --  AUTOUR D'UN POINT.
          else
            p_latitude is null or p_longitude is null
            or case
              --  AVEC RAYON : le plus proche des points de la fiche
              --  doit y tenir. Le cadre en degrés écarte d'abord le
              --  gros des fiches sans calculer une seule distance.
              --  ⚠️ ON PART DES POINTS, PAS DES FICHES. Chercher « les
              --  fiches dont un point est proche » obligerait à ouvrir
              --  les points de chaque fiche, une par une. On demande
              --  donc d'abord LES POINTS du cadre — c'est un balayage
              --  d'index, très court — puis les fiches qui vont avec.
              when p_rayon_km > 0 then t.id in (
                select pt.tatoueur_id from public.points_tatoueur pt
                 where pt.latitude between p_latitude - (p_rayon_km / 111.045)
                                       and p_latitude + (p_rayon_km / 111.045)
                   and pt.longitude between p_longitude - (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                                        and p_longitude + (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                   and public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude) <= p_rayon_km
              )
              --  SANS RAYON : LA COMMUNE CHOISIE, arrondissements
              --  compris. Sans nom de ville (cas rare), un très petit
              --  rayon prend le relais.
              when p_ville_nom is not null then
                public.yf_commune(t.ville_nom) = public.yf_commune(p_ville_nom)
              else t.id in (
                select pt.tatoueur_id from public.points_tatoueur pt
                 where pt.latitude between p_latitude - 0.03 and p_latitude + 0.03
                   and pt.longitude between p_longitude - 0.05 and p_longitude + 0.05
                   and public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude) <= 2
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
    select jsonb_agg(
             jsonb_build_object(
               'id', p.id, 'style', p.style, 'zone', p.zone,
               'rendu', p.rendu, 'url', p.url, 'miniature', p.miniature,
               'ordre', p.ordre
             ) order by p.ordre
           ) as photos
      from (
        select p2.*
          from public.photos_tatoueur p2
         where p2.tatoueur_id = s.id
         order by
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
  --  LA PAGE EST RECLASSÉE PAR POPULARITÉ — les fiches les plus
  --  consultées d'abord, à égalité l'ordre ci-dessus. C'est bien LA
  --  PAGE qu'on reclasse, pas la recherche : exactement comme
  --  `classerParPopularite` aujourd'hui.
  --  LA PAGE EST RECLASSÉE PAR POPULARITÉ — mais seulement ses 24
  --  lignes : le compte des clics n'est lu que pour elles.
  order by
    case when p_prioriser_clics then 0
         else -coalesce((select c.total from public.clics_tatoueurs c where c.slug = s.slug), 0)
    end,
    s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Rend une page de fiches en JSON, leur distance, et le nombre total de résultats.';

grant execute on function public.rechercher_tatoueurs(
  text, text, double precision, double precision, double precision, text, text, text, text,
  text[], text[], text[], text[], text[], text[], text, integer, integer, integer, boolean, integer
) to anon, authenticated;

