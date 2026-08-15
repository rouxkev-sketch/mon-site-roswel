-- =====================================================================
--  MIGRATION Nº 69 — UN CARROUSEL N'EST JAMAIS COUPÉ
--  (passe nº 283 · règles 2 et 3)
-- =====================================================================
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée : elle refait la seule fonction
--  `rechercher_tatoueurs`. Se relance sans risque.
--
--  ⚠️ PASSER LES Nº 61, 62, 63 ET 66 AVANT CELLE-CI : ce fichier
--  repart du corps de la nº 66 (le classement par popularité dans LES
--  DEUX `order by`, sans le masquage par compte) et n'y change QUE la
--  façon dont les photos sont ramassées. La vue `popularite_tatoueurs`
--  vient de la nº 62 ; ce fichier ne la recrée pas.
--
--  LE DÉFAUT QU'ELLE CORRIGE — ET IL EST GRAVE
--  -------------------------------------------------------------
--  La fonction ramassait AU PLUS `p_photos_max` PHOTOS PAR FICHE
--  (l'accueil en demandait vingt). Ce plafond date de la nº 212, et il
--  était alors inoffensif : une carte valait UN ARTISTE, le plafond ne
--  faisait que raccourcir la galerie qu'on emportait avec elle.
--
--  DEPUIS LA PASSE Nº 279, UNE CARTE VAUT UN CARROUSEL — toutes les
--  photos d'un artiste qui partagent le même style, la même nature et
--  le même rendu. Le plafond a donc changé de nature sans que personne
--  n'y touche : il ne raccourcit plus une galerie, IL FAIT DISPARAÎTRE
--  DES CARTES ENTIÈRES. Un salon à cinq styles dont les vingt
--  premières photos sont du réalisme n'existe plus, sur l'accueil, que
--  par son réalisme ; ses quatre autres galeries ne sont ramassées
--  nulle part, donc introuvables — pour toujours, et sans message.
--  Le plafond punit exactement les comptes les plus fournis.
--
--  CE QU'ELLE CHANGE, ET RIEN D'AUTRE
--  -------------------------------------------------------------
--  UNE SEULE CLAUSE : celle qui ramasse les photos d'une fiche.
--   · AVANT — les photos étaient triées par pertinence puis par
--     `ordre`, et l'on gardait les `p_photos_max` PREMIÈRES DE LA
--     FICHE ;
--   · APRÈS — les photos sont numérotées DANS CHAQUE CARROUSEL
--     (style · nature · rendu), et l'on garde les DIX PREMIÈRES DE
--     CHAQUE CARROUSEL, dans l'ordre de l'artiste.
--  Aucun carrousel ne peut plus être écarté (règle 2), et aucun ne
--  dépasse dix photos (règle 3).
--
--  ⚠️ CE QUE ÇA COÛTE, DIT FRANCHEMENT. Une fiche rapporte désormais
--  jusqu'à `10 × son nombre de carrousels` photos au lieu de vingt.
--  Une fiche à un seul carrousel en rapporte DIX au lieu de vingt (moitié
--  moins) ; une fiche à cinq carrousels en rapporte jusqu'à cinquante au
--  lieu de vingt (deux fois et demie plus). Ce sont des LIGNES, pas des
--  images : rien de plus n'est téléchargé à l'écran.
--
--  ⚠️ LE SITE N'EXIGE PAS CETTE MIGRATION POUR ÊTRE CORRECT. La passe
--  nº 283 demande à la base TOUTES les photos utiles et coupe elle-même
--  à dix par carrousel : avant cette migration l'accueil est déjà juste,
--  simplement plus bavard. Cette migration rend la coupe à la base, là
--  où elle ne coûte rien. Aucune version du site ne dépend de l'autre.
-- =====================================================================
-- ------------------------------------------------------------
--  ON SUPPRIME PUIS ON RECRÉE — obligatoire ici : la SIGNATURE
--  change (un paramètre de moins). Un « create or replace » le
--  refuserait, et laisserait deux fonctions homonymes entre
--  lesquelles PostgREST ne saurait pas choisir.
-- ------------------------------------------------------------
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

  --  ------------------------------------------------------------
  --  LES PHOTOS — AU PLUS DIX PAR CARROUSEL, JAMAIS UN CARROUSEL
  --  ENTIER (migration nº 69, passe nº 283 · règles 2 et 3)
  --  ------------------------------------------------------------
  --  CE QUI ÉTAIT ÉCRIT ICI, ET CE QUE ÇA COÛTAIT.
  --      order by <pertinence>, p2.ordre
  --      limit greatest(coalesce(p_photos_max, 1), 1)
  --  Un plafond DE PHOTOS PAR FICHE. Tant qu'une carte valait un
  --  ARTISTE, il était inoffensif : il ne faisait que raccourcir la
  --  galerie qu'on emportait. Depuis que la mosaïque liste des
  --  CARROUSELS (passe nº 279), il ne raccourcit plus rien — IL FAIT
  --  DISPARAÎTRE DES CARTES. Un salon à cinq styles dont les vingt
  --  premières photos sont du réalisme n'existait plus que par son
  --  réalisme : ses quatre autres galeries n'arrivaient jamais
  --  jusqu'ici, donc jamais jusqu'à l'accueil. Le plafond punissait
  --  exactement les comptes les plus fournis.
  --
  --  LA LIMITE SE POSE DÉSORMAIS DANS LE CARROUSEL. On numérote les
  --  photos DANS CHAQUE GROUPE style · nature · rendu — les trois
  --  tags qui font un carrousel (règle 1) — et l'on garde les dix
  --  premières DE CHAQUE GROUPE. Aucun groupe ne peut plus être
  --  écarté : chaque carrousel d'une fiche en ligne arrive, quel que
  --  soit le nombre de photos qui le précèdent.
  --
  --  ⚠️ LES TROIS REPLIS SONT CEUX DU SITE, AU MOT PRÈS (voir
  --  `cleDEnsemble`, src/lib/photos-tatoueur.ts) : pas de style =
  --  chaîne vide, nature inconnue = 'tatouage' (nº 49), rendu absent
  --  = 'black_and_grey' (nº 48). Si ces trois replis divergeaient, la
  --  base et le site ne compteraient pas les mêmes carrousels — et la
  --  coupe tomberait au mauvais endroit.
  --
  --  ⚠️ L'ORDRE DE PERTINENCE A DISPARU, ET C'EST VOULU. Il servait à
  --  choisir QUELLES photos survivaient à la coupe par fiche : la
  --  nature cherchée d'abord, puis le style, puis le rendu. Il n'y a
  --  plus rien à sacrifier — tous les carrousels passent — et l'ordre
  --  qui compte est celui de l'ARTISTE (règle 3), celui qu'il a posé
  --  dans `ordre`. Le site choisit ensuite le carrousel à montrer.
  --
  --  ⚠️ `p_photos_max` GARDE SON NOM ET SA PLACE DANS LA SIGNATURE,
  --  et il est BORNÉ À DIX : un appelant qui demande une seule photo
  --  en reçoit une par carrousel (ce qu'il faut pour une carte), un
  --  appelant qui en demande cent en reçoit dix. Le site n'exige donc
  --  aucune version : avant cette migration il recevait tout et
  --  coupait lui-même, après il reçoit déjà la bonne quantité.
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
          from (
            select p3.*,
                   row_number() over (
                     partition by
                       coalesce(p3.style, ''),
                       case when p3.nature in ('tatouage', 'flash')
                            then p3.nature else 'tatouage' end,
                       coalesce(p3.rendu, 'black_and_grey')
                     order by p3.ordre
                   ) as rang_dans_le_carrousel
              from public.photos_tatoueur p3
             where p3.tatoueur_id = s.id
          ) p2
         where p2.rang_dans_le_carrousel
               <= least(greatest(coalesce(p_photos_max, 1), 1), 10)
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
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Depuis la nº 42 elle interroge TOUS les lieux d''une fiche ; depuis la nº 49 elle connaît la NATURE des photos (tatouage / flash) ; depuis la nº 58 LE STYLE SE LIT DANS LES PHOTOS CATALOGUÉES et non plus dans le tableau déclaré `tatoueurs.styles` ; depuis la nº 61 L''ORDRE DES RÉSULTATS NE DÉPEND PLUS DE LA TAILLE DE LA PAGE ; depuis la nº 62 elle intègre un SCORE DE POPULARITÉ (vue `popularite_tatoueurs`) ; depuis la nº 63 ce score est dans LES DEUX `order by` ; depuis la nº 66 ELLE NE MASQUE PLUS AUCUN COMPTE ; depuis la nº 69 ELLE NE COUPE PLUS PAR FICHE MAIS PAR CARROUSEL — au plus dix photos par groupe style · nature · rendu, dans l''ordre de l''artiste, de sorte qu''AUCUN carrousel d''une fiche en ligne ne peut plus disparaître de la mosaïque, si fournie que soit la fiche.';

grant execute on function public.rechercher_tatoueurs to anon, authenticated;

-- ------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
--  La mesure nº 6 est celle qui compte : elle dit combien de
--  carrousels étaient INVISIBLES avant cette migration.
-- ------------------------------------------------------------
with photos_publiques as (
  select p.tatoueur_id,
         coalesce(p.style, '') as style,
         case when p.nature in ('tatouage', 'flash')
              then p.nature else 'tatouage' end as nature,
         coalesce(p.rendu, 'black_and_grey') as rendu,
         row_number() over (
           partition by p.tatoueur_id order by p.ordre
         ) as rang_dans_la_fiche
    from public.photos_tatoueur p
    join public.tatoueurs t on t.id = p.tatoueur_id
   where t.publie and t.supprime_le is null
),
carrousels as (
  select tatoueur_id, style, nature, rendu,
         min(rang_dans_la_fiche) as premiere_photo,
         count(*) as photos
    from photos_publiques
   group by tatoueur_id, style, nature, rendu
)
select mesure, valeur
from (values
  (1, 'La fonction existe', (
    select case when exists (
      select 1 from pg_proc where proname = 'rechercher_tatoueurs')
      then 'oui' else 'NON' end)),
  (2, 'Elle coupe PAR CARROUSEL (doit être « oui »)', (
    select case when exists (
      select 1 from pg_proc
       where proname = 'rechercher_tatoueurs'
         and prosrc like '%rang_dans_le_carrousel%')
      then 'oui' else 'NON' end)),
  (3, 'Une seule fonction rechercher_tatoueurs (doit être 1)', (
    select count(*)::text from pg_proc where proname = 'rechercher_tatoueurs')),
  (4, 'Le classement par popularité est intact (doit être « oui »)', (
    select case when exists (
      select 1 from pg_proc
       where proname = 'rechercher_tatoueurs'
         and prosrc like '%popularite_tatoueurs%')
      then 'oui' else 'NON' end)),
  (5, 'Fiches visibles du public, aujourd''hui', (
    select count(*)::text from public.tatoueurs
     where publie and supprime_le is null)),
  (6, 'Carrousels visibles du public, aujourd''hui', (
    select count(*)::text from carrousels)),
  (7, 'Carrousels QUE CETTE MIGRATION REND VISIBLES (leur première photo venait après la vingtième de la fiche)', (
    select count(*)::text from carrousels where premiere_photo > 20)),
  (8, 'Carrousels de plus de dix photos (ils en montreront dix)', (
    select count(*)::text from carrousels where photos > 10))
) as etat(ordre, mesure, valeur)
order by ordre;
