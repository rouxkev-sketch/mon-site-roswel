-- =====================================================================
--  MIGRATION Nº 62 — LES PORTFOLIOS LES PLUS APPRÉCIÉS REMONTENT
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée : elle crée une VUE de lecture et
--  refait la fonction `rechercher_tatoueurs`. Se relance sans risque.
--
--  ⚠️ PASSER LA Nº 61 AVANT CELLE-CI (elle en reprend le corps).
--
--  CE QUE DEMANDE LE PROPRIÉTAIRE (passe nº 218-§5)
--  -------------------------------------------------
--  « L'ordre est stable, mais purement arbitraire. Je veux maintenant
--  que les portfolios les plus appréciés remontent » — d'après le
--  nombre de consultations, le nombre de cœurs reçus et le nombre
--  d'abonnés. Et une CONTRAINTE ABSOLUE, celle qui avait tout cassé à
--  la nº 58 : le score se calcule sur L'ENSEMBLE des fiches, AVANT la
--  pagination, jamais sur une page déjà coupée.
--
--  LA PONDÉRATION : consultations × 1 + cœurs × 3 + abonnés × 8
--  ------------------------------------------------------------
--  Elle suit le COÛT DU GESTE, du plus léger au plus engageant :
--   · UNE CONSULTATION (1) — ouvrir une fiche ne coûte rien, et une
--     partie des ouvertures sont des erreurs de parcours. C'est le
--     signal le plus abondant, donc le moins cher à l'unité ;
--   · UN CŒUR (3) — il faut avoir un compte, avoir regardé une photo,
--     et vouloir la retrouver. Trois consultations pour un cœur ;
--   · UN ABONNÉ (8) — c'est le seul geste qui engage sur la DURÉE :
--     on demande à revoir ce tatoueur plus tard. Huit consultations
--     pour un abonné.
--  Aucune de ces valeurs n'est sacrée : elles vivent dans la vue
--  ci-dessous, sur une seule ligne, et se changent d'un `create or
--  replace view` sans toucher à la recherche.
--
--  ⚠️ CE QUI EST COMPTÉ, EXACTEMENT
--  ---------------------------------
--   · CONSULTATIONS — la vue `clics_tatoueurs` (migration nº 7), déjà
--     dédoublonnée par visiteur et par jour ;
--   · CŒURS — les lignes de `favoris_photos` (nº 53) portant sur une
--     photo de cette fiche. Le cœur vit sur UNE PHOTO : les cœurs d'un
--     portfolio, ce sont ceux de toutes ses photos ;
--   · ABONNÉS — les lignes de `tatoueurs_suivis` (nº 54).
--  Une table absente rendrait la vue impossible à créer : les trois
--  migrations qui les créent sont donc des préalables (7, 53, 54).
--
--  ⚠️ POURQUOI UNE VUE, ET PAS TROIS SOUS-REQUÊTES DANS LA FONCTION
--  Parce que le SITE en a besoin AUSSI : le chemin de repli de
--  lib/tatoueurs.ts (base sans la migration nº 32) classe en
--  JavaScript, et il doit classer PAREIL. Une seule définition du
--  score, lue par les deux — sinon deux classements cohabitent, et
--  c'est exactement ce genre de désaccord qui a produit le défaut de
--  la nº 58.
-- =====================================================================

-- ------------------------------------------------------------
--  1. LA VUE — le score, en un seul endroit
-- ------------------------------------------------------------
--  ⚠️ `security_invoker` : la vue est lue avec les droits de celui qui
--  la lit, jamais avec ceux de son propriétaire. Elle n'ouvre donc
--  aucune porte sur `favoris_photos` ni sur `tatoueurs_suivis` — elle
--  n'en rend que des COMPTES, et les comptes ne nomment personne.
create or replace view public.popularite_tatoueurs
with (security_invoker = true) as
  select
    t.id,
    t.slug,
    coalesce(c.total, 0)::bigint                as consultations,
    coalesce(f.coeurs, 0)::bigint               as coeurs,
    coalesce(a.abonnes, 0)::bigint              as abonnes,
    --  LA PONDÉRATION, SUR UNE SEULE LIGNE (voir l'en-tête).
    (coalesce(c.total, 0)
       + 3 * coalesce(f.coeurs, 0)
       + 8 * coalesce(a.abonnes, 0))::bigint    as score
  from public.tatoueurs t
  left join public.clics_tatoueurs c on c.slug = t.slug
  left join lateral (
    select count(*) as coeurs
      from public.favoris_photos fp
      join public.photos_tatoueur p on p.id = fp.photo_id
     where p.tatoueur_id = t.id
  ) f on true
  left join lateral (
    select count(*) as abonnes
      from public.tatoueurs_suivis s
     where s.tatoueur_id = t.id
  ) a on true;

comment on view public.popularite_tatoueurs is
  'Le score de popularité d''un portfolio (yokofolio, nº 62) : consultations + 3 × cœurs + 8 × abonnés. LU par la recherche (rechercher_tatoueurs) ET par le chemin de repli du site — une seule définition, deux lecteurs.';

grant select on public.popularite_tatoueurs to anon, authenticated;

--  Les deux jointures de comptage passent par ces index (ils existent
--  depuis les nº 53 et 54) ; on les redemande en `if not exists` pour
--  qu'une base à qui il en manquerait un ne se traîne pas.
create index if not exists favoris_photos_photo_idx
  on public.favoris_photos (photo_id);
create index if not exists tatoueurs_suivis_tatoueur_idx
  on public.tatoueurs_suivis (tatoueur_id);

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
          --  ⚠️ LE SCORE DE POPULARITÉ (migration nº 62), ICI ET NULLE
          --  PART AILLEURS : dans le `row_number()`, donc SUR TOUT LE
          --  CATALOGUE FILTRÉ, AVANT le `limit`/`offset` de cette même
          --  sous-requête. C'est la contrainte absolue du propriétaire,
          --  et c'est le contraire exact de ce que faisait la nº 58 (un
          --  tri posé après la coupe, qui remaniait la page).
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
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Depuis la nº 42 elle interroge TOUS les lieux d''une fiche ; depuis la nº 43 une fiche d''administrateur dont `admin_publique` est allumé passe comme n''importe quelle autre ; depuis la nº 49 elle connaît la NATURE des photos (tatouage / flash) ; depuis la nº 58 LE STYLE SE LIT DANS LES PHOTOS CATALOGUÉES et non plus dans le tableau déclaré `tatoueurs.styles` — un style sans photo n''existe pas pour la recherche (le repli de la nº 56 est annulé) ; depuis la nº 61 L''ORDRE DES RÉSULTATS NE DÉPEND PLUS DE LA TAILLE DE LA PAGE — le classement par clics posé APRÈS la coupe est supprimé, `s.rang` fait seul l''ordre ; depuis la nº 62 `s.rang` intègre un SCORE DE POPULARITÉ (vue `popularite_tatoueurs` : consultations + 3 × cœurs + 8 × abonnés), calculé sur tout le catalogue filtré AVANT la coupe.';

grant execute on function public.rechercher_tatoueurs to anon, authenticated;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — n'écrit rien.
-- ------------------------------------------------------------
--  1) LE CLASSEMENT, EN CLAIR : qui remonte, et pourquoi.
--
--  select p.slug, p.consultations, p.coeurs, p.abonnes, p.score
--    from public.popularite_tatoueurs p
--    join public.tatoueurs t on t.id = p.id
--   where t.publie and t.supprime_le is null
--   order by p.score desc, p.slug
--   limit 30;
--
--  2) L'ORDRE RESTE STABLE D'UNE PAGE À L'AUTRE (le contrôle de la
--     nº 61, à repasser après celle-ci) : les vingt-quatre premières
--     lignes doivent être IDENTIQUES entre une page de 24 et une de 48.
--
--  with page1 as (
--    select row_number() over () as place, r.fiche->>'slug' as slug
--      from public.rechercher_tatoueurs(p_limite => 24,
--             p_jour => (extract(epoch from now())/86400)::int) r
--  ), page2 as (
--    select row_number() over () as place, r.fiche->>'slug' as slug
--      from public.rechercher_tatoueurs(p_limite => 48,
--             p_jour => (extract(epoch from now())/86400)::int) r
--  )
--  select p1.place, p1.slug as page_de_24, p2.slug as page_de_48,
--         case when p1.slug = p2.slug then 'ok' else '⚠️ DÉPLACÉE' end
--    from page1 p1 join page2 p2 on p2.place = p1.place
--   order by p1.place;
