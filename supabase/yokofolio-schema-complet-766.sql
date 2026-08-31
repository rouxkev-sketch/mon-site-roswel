-- ============================================================
--  nº 766 — LE SCHÉMA COMPLET DE YOKOFOLIO
--  À coller D'UN BLOC dans l'éditeur SQL du NOUVEAU projet (USA Est),
--  quand il est encore VIDE.
-- ============================================================
--  D'OÙ IL VIENT, ET POURQUOI ON PEUT S'Y FIER. Il n'est pas écrit à
--  la main : les migrations du dépôt ont été REJOUÉES sur un
--  PostgreSQL 16 neuf, dans l'ordre du LISEZ-MOI, puis l'état obtenu a
--  été relevé par `pg_dump`. Ce fichier décrit donc ce que les
--  migrations PRODUISENT, pas ce qu'on croit qu'elles produisent.
--
--  CE QU'IL POSE :
--     17 tables · 11 vues · 9 fonctions · 30 règles de sécurité (RLS)
--     2 déclencheurs · 25 droits de lecture/écriture
--  Aucune table du produit artisans : elles ont été supprimées à la
--  nº 764, et le nouveau projet n'a aucune raison de les connaître.
--
--  ⚠️ IL NE CONTIENT AUCUNE DONNÉE. Les lignes (fiches, photos,
--  conventions…) voyagent à part — voir `outils/demenager-donnees`.
--
--  ⚠️ IL NE CONTIENT NI COMPTE NI PHOTO. Les comptes se recréent avec
--  `outils/restaurer-comptes`, les photos avec
--  `outils/demenager-photos`. Voir la marche à suivre :
--  docs/DEMENAGEMENT-766.md.
--
--  ⚠️ SI UNE LIGNE ÉCHOUE, TOUT EST ANNULÉ (l'éditeur de Supabase
--  exécute le fichier d'un bloc). Envoie-moi l'erreur telle quelle.
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: fiche_en_ligne(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fiche_en_ligne(p_tatoueur_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
      from public.tatoueurs t
     where t.id = p_tatoueur_id
       and t.publie = true
       and t.supprime_le is null
       and coalesce((to_jsonb(t)->>'hors_ligne')::boolean, false) = false
       and coalesce(to_jsonb(t)->>'statut', '') <> 'refusee'
  );
$$;


--
-- Name: rechercher_tatoueurs(text, text, double precision, double precision, double precision, text, text, text, text, text[], text[], text[], text[], text[], text, text[], text, integer, integer, integer, boolean, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rechercher_tatoueurs(p_style text DEFAULT NULL::text, p_niveau text DEFAULT NULL::text, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision, p_rayon_km double precision DEFAULT 0, p_ville_nom text DEFAULT NULL::text, p_ville_slug text DEFAULT NULL::text, p_code_pays text DEFAULT NULL::text, p_region text DEFAULT NULL::text, p_types text[] DEFAULT NULL::text[], p_modes text[] DEFAULT NULL::text[], p_technique text[] DEFAULT NULL::text[], p_composition text[] DEFAULT NULL::text[], p_besoins text[] DEFAULT NULL::text[], p_nature text DEFAULT NULL::text, p_rendus text[] DEFAULT NULL::text[], p_photo_rendu text DEFAULT NULL::text, p_limite integer DEFAULT 24, p_decalage integer DEFAULT 0, p_photos_max integer DEFAULT 1, p_prioriser_clics boolean DEFAULT false, p_jour integer DEFAULT 0) RETURNS TABLE(fiche jsonb, distance_km double precision, total_resultats bigint)
    LANGUAGE sql STABLE PARALLEL SAFE
    SET search_path TO 'public'
    AS $$
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
      --  nº 413 — LA COLONNE QUI MANQUAIT (voir l'en-tête).
      'etablissement', s.etablissement,
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


--
-- Name: tatoueurs_garde_fou(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tatoueurs_garde_fou() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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


--
-- Name: tatoueurs_verrou_exercice(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tatoueurs_verrou_exercice() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- Administration (clé de service) : rien n'est retenu.
  if auth.uid() is null then
    return new;
  end if;

  if old.exercice_verrouille then
    new.type_fiche := old.type_fiche;
    new.exercice_verrouille := true;
    -- La trace de déblocage n'appartient pas non plus au tatoueur.
    new.exercice_debloque_le := old.exercice_debloque_le;
    new.exercice_debloque_par := old.exercice_debloque_par;
  end if;

  return new;
end;
$$;


--
-- Name: yf_commune(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.yf_commune(texte text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $_$
  select public.yf_normaliser(
    regexp_replace(coalesce(texte, ''), '\s+\d+\s*(er|e|ème|eme)?\s*$', '', 'i')
  );
$_$;


--
-- Name: yf_distance_km(double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.yf_distance_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision) RETURNS double precision
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;


--
-- Name: yf_normaliser(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.yf_normaliser(texte text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
  select btrim(regexp_replace(
    lower(translate(
      coalesce(texte, ''),
      'àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôõöÒÓÔÕÖùúûüÙÚÛÜýÿÝ',
      'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY'
    )),
    '[^a-z0-9]+', ' ', 'g'));
$$;


--
-- Name: yf_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.yf_slug(texte text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
  select btrim(
    regexp_replace(
      lower(translate(
        replace(replace(coalesce(texte, ''), 'œ', 'oe'), 'æ', 'ae'),
        'àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôõöÒÓÔÕÖùúûüÙÚÛÜýÿÝ',
        'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY'
      )),
      '[^a-z0-9]+', '-', 'g'),
    '-');
$$;


--
-- Name: yokofolio_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.yokofolio_slug(texte text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  select trim(both '-' from
    regexp_replace(
      lower(
        translate(
          replace(replace(replace(coalesce(texte, ''), 'œ', 'oe'), 'Œ', 'oe'), 'æ', 'ae'),
          'àáâãäåāăçćčđèéêëēĕėęěìíîïīĭįñńňòóôõöōŏőøùúûüūŭůűýÿŷšśşžźżłĺľťţďřŕ' ||
          'ÀÁÂÃÄÅĀĂÇĆČĐÈÉÊËĒĔĖĘĚÌÍÎÏĪĬĮÑŃŇÒÓÔÕÖŌŎŐØÙÚÛÜŪŬŮŰÝŸŶŠŚŞŽŹŻŁĹĽŤŢĎŘŔ',
          'aaaaaaaacccdeeeeeeeeeiiiiiiinnnooooooooouuuuuuuuyyyssszzzlllttdrr' ||
          'AAAAAAAACCCDEEEEEEEEEIIIIIIINNNOOOOOOOOOUUUUUUUUYYYSSSZZZLLLTTDRR'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clics_fiches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clics_fiches (
    id bigint NOT NULL,
    tatoueur_slug text NOT NULL,
    visiteur text NOT NULL,
    jour date DEFAULT ((now() AT TIME ZONE 'utc'::text))::date NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clics_fiches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clics_fiches ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.clics_fiches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clics_tatoueurs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.clics_tatoueurs AS
 SELECT tatoueur_slug AS slug,
    count(*) AS total
   FROM public.clics_fiches
  GROUP BY tatoueur_slug;


--
-- Name: favoris_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoris_photos (
    utilisateur_id uuid NOT NULL,
    photo_id uuid NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coeurs_par_photo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.coeurs_par_photo WITH (security_invoker='false') AS
 SELECT photo_id,
    count(*) AS coeurs
   FROM public.favoris_photos f
  GROUP BY photo_id;


--
-- Name: suppressions_comptes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppressions_comptes (
    user_id uuid NOT NULL,
    demandee_le timestamp with time zone DEFAULT now() NOT NULL,
    purge_le timestamp with time zone NOT NULL,
    courriel text
);


--
-- Name: comptes_a_purger; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.comptes_a_purger AS
 SELECT user_id,
    demandee_le,
    purge_le,
    courriel
   FROM public.suppressions_comptes
  WHERE (purge_le <= now());


--
-- Name: conventions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conventions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    propose text NOT NULL,
    nom text,
    slug text,
    code_pays text NOT NULL,
    ville text,
    region text,
    latitude double precision,
    longitude double precision,
    debut_le date,
    fin_le date,
    etat text DEFAULT 'en_attente'::text NOT NULL,
    propose_par uuid,
    fiche_id uuid,
    fiche_nom text,
    message text,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    traite_le timestamp with time zone,
    CONSTRAINT conventions_code_pays_check CHECK ((code_pays ~ '^[A-Z]{2}$'::text)),
    CONSTRAINT conventions_etat_check CHECK ((etat = ANY (ARRAY['en_attente'::text, 'acceptee'::text, 'refusee'::text])))
);


--
-- Name: demarchage_fiches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demarchage_fiches (
    demarchage_id uuid NOT NULL,
    tatoueur_id uuid NOT NULL
);


--
-- Name: demarchages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demarchages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    jeton text NOT NULL,
    statut text DEFAULT 'envoye'::text NOT NULL,
    envoye_le timestamp with time zone DEFAULT now() NOT NULL,
    rattache_le timestamp with time zone,
    retire_le timestamp with time zone,
    rattache_a uuid,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT demarchages_statut_connu CHECK ((statut = ANY (ARRAY['envoye'::text, 'compte_cree'::text, 'supprime'::text])))
);


--
-- Name: liaisons_artiste_salon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liaisons_artiste_salon (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artiste_id uuid NOT NULL,
    salon_id uuid NOT NULL,
    mode_id uuid,
    origine text NOT NULL,
    statut text DEFAULT 'demande'::text NOT NULL,
    demandee_le timestamp with time zone DEFAULT now() NOT NULL,
    repondu_le timestamp with time zone,
    CONSTRAINT liaisons_origine_connue CHECK ((origine = ANY (ARRAY['artiste'::text, 'salon'::text, 'adresse'::text]))),
    CONSTRAINT liaisons_pas_soi_meme CHECK ((artiste_id <> salon_id)),
    CONSTRAINT liaisons_statut_connu CHECK ((statut = ANY (ARRAY['demande'::text, 'validee'::text, 'refusee'::text])))
);


--
-- Name: modes_exercice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modes_exercice (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tatoueur_id uuid NOT NULL,
    genre text NOT NULL,
    salon_id uuid,
    intitule text,
    adresse text,
    code_postal text,
    ville text,
    region text,
    pays text,
    code_pays text,
    latitude double precision,
    longitude double precision,
    lieu_id text,
    debut_le date,
    fin_le date,
    ordre integer DEFAULT 0 NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    role text,
    rayon_km integer,
    nature_lieu text,
    nom_lieu text,
    convention_id uuid,
    statut text,
    CONSTRAINT modes_exercice_dates_coherentes CHECK ((((genre = ANY (ARRAY['guest'::text, 'convention'::text])) AND (debut_le IS NOT NULL) AND (fin_le IS NOT NULL) AND (fin_le >= debut_le)) OR ((genre <> ALL (ARRAY['guest'::text, 'convention'::text])) AND (debut_le IS NULL) AND (fin_le IS NULL)))),
    CONSTRAINT modes_exercice_genre_connu CHECK ((genre = ANY (ARRAY['salon'::text, 'guest'::text, 'prive'::text, 'disponible'::text, 'convention'::text, 'independent'::text]))),
    CONSTRAINT modes_exercice_nature_connue CHECK (((nature_lieu IS NULL) OR (nature_lieu = ANY (ARRAY['salon'::text, 'prive'::text])))),
    CONSTRAINT modes_exercice_rayon_connu CHECK (((rayon_km IS NULL) OR (rayon_km = ANY (ARRAY[10, 25, 50, 100, 200])))),
    CONSTRAINT modes_exercice_role_coherent CHECK ((((genre = 'salon'::text) AND (role IS NOT NULL)) OR (genre = 'prive'::text) OR ((genre <> ALL (ARRAY['salon'::text, 'prive'::text])) AND (role IS NULL)))),
    CONSTRAINT modes_exercice_role_connu CHECK (((role IS NULL) OR (role = ANY (ARRAY['fondateur'::text, 'resident'::text])))),
    CONSTRAINT modes_exercice_situe CHECK (((salon_id IS NOT NULL) OR ((latitude IS NOT NULL) AND (longitude IS NOT NULL)))),
    CONSTRAINT modes_exercice_statut_connu CHECK (((statut IS NULL) OR (statut = ANY (ARRAY['guest_spots_only'::text, 'conventions_only'::text, 'guest_spots_and_conventions'::text, 'on_break'::text, 'available_on_request'::text]))))
);


--
-- Name: tatoueurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tatoueurs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    nom text NOT NULL,
    slug text NOT NULL,
    ville_code_insee text,
    ville_nom text NOT NULL,
    ville_slug text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    styles text[] DEFAULT '{}'::text[] NOT NULL,
    lien_instagram text NOT NULL,
    photo_principale text NOT NULL,
    photos text[] DEFAULT '{}'::text[] NOT NULL,
    publie boolean DEFAULT false NOT NULL,
    photos_styles jsonb DEFAULT '{}'::jsonb NOT NULL,
    lien_tiktok text,
    adresse text,
    code_postal text,
    bio text,
    user_id uuid,
    statut text DEFAULT 'en_attente'::text NOT NULL,
    site_web text,
    filtres_technique text[] DEFAULT '{}'::text[] NOT NULL,
    filtres_composition text[] DEFAULT '{}'::text[] NOT NULL,
    motifs_moderation text[],
    note_moderation text,
    decide_le timestamp with time zone,
    brouillon jsonb,
    validation_a_notifier boolean DEFAULT false NOT NULL,
    hors_ligne boolean DEFAULT false NOT NULL,
    region text,
    pays text,
    code_pays text,
    lieu_id text,
    type_fiche text DEFAULT 'salon'::text NOT NULL,
    mode_exercice text DEFAULT 'adresse'::text NOT NULL,
    rayon_zone_km integer,
    villes jsonb DEFAULT '[]'::jsonb NOT NULL,
    photo_profil text,
    ancien_slug text,
    supprime_le timestamp with time zone,
    purge_le timestamp with time zone,
    annonce_vue_le timestamp with time zone,
    exercice_verrouille boolean DEFAULT false NOT NULL,
    exercice_debloque_le timestamp with time zone,
    exercice_debloque_par text,
    filtres_besoins text[] DEFAULT '{}'::text[] NOT NULL,
    lien_youtube text,
    etablissement text DEFAULT 'salon'::text NOT NULL,
    admin_publique boolean DEFAULT false NOT NULL,
    page_de_liens text,
    titre_site_web text,
    titre_page_de_liens text,
    booking text,
    booking_mois integer,
    dm_instagram boolean DEFAULT false NOT NULL,
    CONSTRAINT tatoueurs_booking_mois_valide CHECK (((booking_mois IS NULL) OR ((booking_mois >= 1) AND (booking_mois <= 12)))),
    CONSTRAINT tatoueurs_booking_valide CHECK (((booking IS NULL) OR (booking = ANY (ARRAY['ouvert'::text, 'delai'::text, 'ferme'::text])))),
    CONSTRAINT tatoueurs_etablissement_valide CHECK ((etablissement = ANY (ARRAY['salon'::text, 'prive'::text]))),
    CONSTRAINT tatoueurs_photos_styles_objet CHECK ((jsonb_typeof(photos_styles) = 'object'::text)),
    CONSTRAINT tatoueurs_statut_check CHECK ((statut = ANY (ARRAY['en_attente'::text, 'validee'::text, 'refusee'::text, 'modifications'::text]))),
    CONSTRAINT tatoueurs_titre_page_de_liens_longueur CHECK (((titre_page_de_liens IS NULL) OR ((char_length(titre_page_de_liens) >= 1) AND (char_length(titre_page_de_liens) <= 30)))),
    CONSTRAINT tatoueurs_titre_site_web_longueur CHECK (((titre_site_web IS NULL) OR ((char_length(titre_site_web) >= 1) AND (char_length(titre_site_web) <= 30)))),
    CONSTRAINT tatoueurs_type_fiche_connu CHECK ((type_fiche = ANY (ARRAY['artiste'::text, 'salon'::text])))
);


--
-- Name: equipe_salon; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.equipe_salon AS
 SELECT l.salon_id,
    l.artiste_id,
    a.nom AS artiste_nom,
    a.slug AS artiste_slug,
    a.photo_profil AS artiste_photo,
    m.genre,
    m.role,
    m.debut_le,
    m.fin_le,
    l.demandee_le,
    l.id AS liaison_id,
    l.mode_id
   FROM ((public.liaisons_artiste_salon l
     JOIN public.tatoueurs a ON ((a.id = l.artiste_id)))
     LEFT JOIN public.modes_exercice m ON ((m.id = l.mode_id)))
  WHERE ((l.statut = 'validee'::text) AND (a.publie = true) AND (a.hors_ligne = false) AND (a.supprime_le IS NULL) AND ((m.fin_le IS NULL) OR (m.fin_le >= CURRENT_DATE)));


--
-- Name: fiches_a_purger; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.fiches_a_purger AS
 SELECT id,
    user_id,
    nom,
    slug,
    supprime_le,
    purge_le
   FROM public.tatoueurs
  WHERE ((purge_le IS NOT NULL) AND (purge_le <= now()));


--
-- Name: modes_exercice_actifs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.modes_exercice_actifs AS
 SELECT id,
    tatoueur_id,
    genre,
    salon_id,
    intitule,
    adresse,
    code_postal,
    ville,
    region,
    pays,
    code_pays,
    latitude,
    longitude,
    lieu_id,
    debut_le,
    fin_le,
    ordre,
    cree_le,
    role,
    rayon_km,
    nature_lieu
   FROM public.modes_exercice m
  WHERE ((fin_le IS NULL) OR (fin_le >= CURRENT_DATE));


--
-- Name: studios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tatoueur_id uuid NOT NULL,
    nom text,
    intitule text,
    adresse text,
    code_postal text,
    ville text,
    region text,
    pays text,
    code_pays text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    lieu_id text,
    principal boolean DEFAULT false NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    horaires jsonb,
    fuseau text,
    CONSTRAINT studios_horaires_sept_jours CHECK (((horaires IS NULL) OR ((jsonb_typeof(horaires) = 'array'::text) AND (jsonb_array_length(horaires) = 7))))
);


--
-- Name: lieux_annexes_tatoueur; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lieux_annexes_tatoueur AS
 SELECT s.tatoueur_id,
    1 AS rang,
    'studio'::text AS provenance,
    NULL::text AS genre,
    s.adresse,
    s.code_postal,
    s.ville,
    public.yf_slug(s.ville) AS ville_slug,
    s.region,
    s.pays,
    s.code_pays,
    s.latitude,
    s.longitude,
    s.lieu_id,
    0 AS rayon_km
   FROM public.studios s
UNION ALL
 SELECT m.tatoueur_id,
    2 AS rang,
    'mode'::text AS provenance,
    m.genre,
    m.adresse,
    m.code_postal,
    m.ville,
    public.yf_slug(m.ville) AS ville_slug,
    m.region,
    m.pays,
    m.code_pays,
    m.latitude,
    m.longitude,
    m.lieu_id,
        CASE
            WHEN (m.genre = ANY (ARRAY['disponible'::text, 'independent'::text])) THEN COALESCE(m.rayon_km, 0)
            ELSE 0
        END AS rayon_km
   FROM public.modes_exercice_actifs m
  WHERE ((m.latitude IS NOT NULL) AND (m.longitude IS NOT NULL));


--
-- Name: lieux_tatoueur; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lieux_tatoueur AS
 SELECT t.id AS tatoueur_id,
    0 AS rang,
    'fiche'::text AS provenance,
    NULL::text AS genre,
    t.adresse,
    t.code_postal,
    t.ville_nom AS ville,
    t.ville_slug,
    t.region,
    t.pays,
    t.code_pays,
    t.latitude,
    t.longitude,
    t.lieu_id,
    0 AS rayon_km
   FROM public.tatoueurs t
UNION ALL
 SELECT s.tatoueur_id,
    1 AS rang,
    'studio'::text AS provenance,
    NULL::text AS genre,
    s.adresse,
    s.code_postal,
    s.ville,
    public.yf_slug(s.ville) AS ville_slug,
    s.region,
    s.pays,
    s.code_pays,
    s.latitude,
    s.longitude,
    s.lieu_id,
    0 AS rayon_km
   FROM public.studios s
UNION ALL
 SELECT m.tatoueur_id,
    2 AS rang,
    'mode'::text AS provenance,
    m.genre,
    m.adresse,
    m.code_postal,
    m.ville,
    public.yf_slug(m.ville) AS ville_slug,
    m.region,
    m.pays,
    m.code_pays,
    m.latitude,
    m.longitude,
    m.lieu_id,
        CASE
            WHEN (m.genre = ANY (ARRAY['disponible'::text, 'independent'::text])) THEN COALESCE(m.rayon_km, 0)
            ELSE 0
        END AS rayon_km
   FROM public.modes_exercice_actifs m
  WHERE ((m.latitude IS NOT NULL) AND (m.longitude IS NOT NULL));


--
-- Name: messages_yokofolio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages_yokofolio (
    id bigint NOT NULL,
    nom text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    ip text,
    traite boolean DEFAULT false NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_yokofolio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.messages_yokofolio ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.messages_yokofolio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications_compte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications_compte (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    fiche_id uuid,
    fiche_nom text,
    genre text NOT NULL,
    titre text NOT NULL,
    detail text,
    motifs text[],
    creee_le timestamp with time zone DEFAULT now() NOT NULL,
    lue_le timestamp with time zone,
    liaison_id uuid
);


--
-- Name: photos_tatoueur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos_tatoueur (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tatoueur_id uuid NOT NULL,
    style text NOT NULL,
    rendu text NOT NULL,
    url text NOT NULL,
    miniature text,
    ordre integer DEFAULT 0 NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    nature text DEFAULT 'tatouage'::text NOT NULL,
    en_attente boolean DEFAULT false NOT NULL,
    CONSTRAINT photos_nature_connue CHECK ((nature = ANY (ARRAY['tatouage'::text, 'flash'::text]))),
    CONSTRAINT photos_rendu_connu CHECK ((rendu = ANY (ARRAY['black'::text, 'black_and_grey'::text, 'color'::text])))
);


--
-- Name: zones_tatoueur; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.zones_tatoueur AS
 SELECT t.id AS tatoueur_id,
    t.latitude,
    t.longitude,
    0 AS rayon_km
   FROM public.tatoueurs t
UNION ALL
 SELECT s.tatoueur_id,
    s.latitude,
    s.longitude,
    0 AS rayon_km
   FROM public.studios s
UNION ALL
 SELECT m.tatoueur_id,
    m.latitude,
    m.longitude,
        CASE
            WHEN (m.genre = ANY (ARRAY['disponible'::text, 'independent'::text])) THEN COALESCE(m.rayon_km, 0)
            ELSE 0
        END AS rayon_km
   FROM public.modes_exercice_actifs m
  WHERE ((m.latitude IS NOT NULL) AND (m.longitude IS NOT NULL));


--
-- Name: points_tatoueur; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.points_tatoueur AS
 SELECT tatoueur_id,
    latitude,
    longitude
   FROM public.zones_tatoueur z;


--
-- Name: tatoueurs_suivis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tatoueurs_suivis (
    utilisateur_id uuid NOT NULL,
    tatoueur_id uuid NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: popularite_tatoueurs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.popularite_tatoueurs WITH (security_invoker='false') AS
 SELECT t.id,
    t.slug,
    COALESCE(c.total, (0)::bigint) AS consultations,
    COALESCE(f.coeurs, (0)::bigint) AS coeurs,
    COALESCE(a.abonnes, (0)::bigint) AS abonnes,
    ((COALESCE(c.total, (0)::bigint) + (3 * COALESCE(f.coeurs, (0)::bigint))) + (8 * COALESCE(a.abonnes, (0)::bigint))) AS score
   FROM (((public.tatoueurs t
     LEFT JOIN public.clics_tatoueurs c ON ((c.slug = t.slug)))
     LEFT JOIN LATERAL ( SELECT count(*) AS coeurs
           FROM (public.favoris_photos fp
             JOIN public.photos_tatoueur p ON ((p.id = fp.photo_id)))
          WHERE (p.tatoueur_id = t.id)) f ON (true))
     LEFT JOIN LATERAL ( SELECT count(*) AS abonnes
           FROM public.tatoueurs_suivis s
          WHERE (s.tatoueur_id = t.id)) a ON (true));


--
-- Name: signalements_fiches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signalements_fiches (
    id bigint NOT NULL,
    tatoueur_slug text NOT NULL,
    motifs text[] NOT NULL,
    details text,
    traite boolean DEFAULT false NOT NULL,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    note text
);


--
-- Name: signalements_fiches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.signalements_fiches ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.signalements_fiches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: suggestions_style; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suggestions_style (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    fiche_id uuid,
    fiche_nom text,
    propose text NOT NULL,
    etat text DEFAULT 'en_attente'::text NOT NULL,
    label text,
    slug text,
    famille text,
    message text,
    cree_le timestamp with time zone DEFAULT now() NOT NULL,
    traite_le timestamp with time zone,
    CONSTRAINT suggestions_style_acceptee_complete CHECK (((etat <> 'acceptee'::text) OR ((label IS NOT NULL) AND (btrim(label) <> ''::text) AND (slug IS NOT NULL)))),
    CONSTRAINT suggestions_style_etat CHECK ((etat = ANY (ARRAY['en_attente'::text, 'acceptee'::text, 'refusee'::text]))),
    CONSTRAINT suggestions_style_famille CHECK (((famille IS NULL) OR (famille = 'cultures-du-monde'::text))),
    CONSTRAINT suggestions_style_propose_longueur CHECK (((char_length(btrim(propose)) >= 2) AND (char_length(btrim(propose)) <= 40))),
    CONSTRAINT suggestions_style_slug_forme CHECK (((slug IS NULL) OR (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)))
);


--
-- Name: visites_selection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visites_selection (
    utilisateur_id uuid NOT NULL,
    vu_le timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clics_fiches clics_fiches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clics_fiches
    ADD CONSTRAINT clics_fiches_pkey PRIMARY KEY (id);


--
-- Name: conventions conventions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conventions
    ADD CONSTRAINT conventions_pkey PRIMARY KEY (id);


--
-- Name: demarchage_fiches demarchage_fiches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchage_fiches
    ADD CONSTRAINT demarchage_fiches_pkey PRIMARY KEY (demarchage_id, tatoueur_id);


--
-- Name: demarchages demarchages_jeton_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchages
    ADD CONSTRAINT demarchages_jeton_key UNIQUE (jeton);


--
-- Name: demarchages demarchages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchages
    ADD CONSTRAINT demarchages_pkey PRIMARY KEY (id);


--
-- Name: favoris_photos favoris_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris_photos
    ADD CONSTRAINT favoris_photos_pkey PRIMARY KEY (utilisateur_id, photo_id);


--
-- Name: liaisons_artiste_salon liaisons_artiste_salon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liaisons_artiste_salon
    ADD CONSTRAINT liaisons_artiste_salon_pkey PRIMARY KEY (id);


--
-- Name: messages_yokofolio messages_yokofolio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages_yokofolio
    ADD CONSTRAINT messages_yokofolio_pkey PRIMARY KEY (id);


--
-- Name: modes_exercice modes_exercice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modes_exercice
    ADD CONSTRAINT modes_exercice_pkey PRIMARY KEY (id);


--
-- Name: notifications_compte notifications_compte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_compte
    ADD CONSTRAINT notifications_compte_pkey PRIMARY KEY (id);


--
-- Name: photos_tatoueur photos_tatoueur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos_tatoueur
    ADD CONSTRAINT photos_tatoueur_pkey PRIMARY KEY (id);


--
-- Name: signalements_fiches signalements_fiches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements_fiches
    ADD CONSTRAINT signalements_fiches_pkey PRIMARY KEY (id);


--
-- Name: studios studios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_pkey PRIMARY KEY (id);


--
-- Name: suggestions_style suggestions_style_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions_style
    ADD CONSTRAINT suggestions_style_pkey PRIMARY KEY (id);


--
-- Name: suppressions_comptes suppressions_comptes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppressions_comptes
    ADD CONSTRAINT suppressions_comptes_pkey PRIMARY KEY (user_id);


--
-- Name: tatoueurs tatoueurs_bio_longueur; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.tatoueurs
    ADD CONSTRAINT tatoueurs_bio_longueur CHECK (((bio IS NULL) OR (char_length(bio) <= 150))) NOT VALID;


--
-- Name: tatoueurs tatoueurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs
    ADD CONSTRAINT tatoueurs_pkey PRIMARY KEY (id);


--
-- Name: tatoueurs tatoueurs_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs
    ADD CONSTRAINT tatoueurs_slug_key UNIQUE (slug);


--
-- Name: tatoueurs_suivis tatoueurs_suivis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs_suivis
    ADD CONSTRAINT tatoueurs_suivis_pkey PRIMARY KEY (utilisateur_id, tatoueur_id);


--
-- Name: visites_selection visites_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visites_selection
    ADD CONSTRAINT visites_selection_pkey PRIMARY KEY (utilisateur_id);


--
-- Name: clics_fiches_par_fiche; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clics_fiches_par_fiche ON public.clics_fiches USING btree (tatoueur_slug);


--
-- Name: clics_fiches_unicite; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clics_fiches_unicite ON public.clics_fiches USING btree (tatoueur_slug, visiteur, jour);


--
-- Name: conventions_slug_pays_uniques; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX conventions_slug_pays_uniques ON public.conventions USING btree (slug, code_pays) WHERE ((etat = 'acceptee'::text) AND (slug IS NOT NULL));


--
-- Name: favoris_photos_photo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX favoris_photos_photo_idx ON public.favoris_photos USING btree (photo_id);


--
-- Name: idx_clics_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clics_slug ON public.clics_fiches USING btree (tatoueur_slug);


--
-- Name: idx_demarchage_fiches_envoi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demarchage_fiches_envoi ON public.demarchage_fiches USING btree (demarchage_id);


--
-- Name: idx_demarchage_fiches_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_demarchage_fiches_unique ON public.demarchage_fiches USING btree (tatoueur_id);


--
-- Name: idx_demarchages_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demarchages_statut ON public.demarchages USING btree (statut, envoye_le DESC);


--
-- Name: idx_favoris_photos_par_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoris_photos_par_compte ON public.favoris_photos USING btree (utilisateur_id, cree_le DESC);


--
-- Name: idx_favoris_photos_par_photo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoris_photos_par_photo ON public.favoris_photos USING btree (photo_id);


--
-- Name: idx_liaisons_artiste; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_liaisons_artiste ON public.liaisons_artiste_salon USING btree (artiste_id, statut);


--
-- Name: idx_liaisons_salon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_liaisons_salon ON public.liaisons_artiste_salon USING btree (salon_id, statut);


--
-- Name: idx_liaisons_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_liaisons_unique ON public.liaisons_artiste_salon USING btree (artiste_id, salon_id, COALESCE(mode_id, '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: idx_modes_avec_rayon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_avec_rayon ON public.modes_exercice USING btree (latitude, longitude) WHERE ((rayon_km IS NOT NULL) AND (rayon_km > 0));


--
-- Name: idx_modes_commune; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_commune ON public.modes_exercice USING btree (public.yf_commune(ville));


--
-- Name: idx_modes_exercice_fiche; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_exercice_fiche ON public.modes_exercice USING btree (tatoueur_id, ordre);


--
-- Name: idx_modes_exercice_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_exercice_point ON public.modes_exercice USING btree (latitude, longitude) WHERE (latitude IS NOT NULL);


--
-- Name: idx_modes_exercice_salon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_exercice_salon ON public.modes_exercice USING btree (salon_id) WHERE (salon_id IS NOT NULL);


--
-- Name: idx_modes_pays; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_pays ON public.modes_exercice USING btree (upper(code_pays));


--
-- Name: idx_modes_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_region ON public.modes_exercice USING btree (public.yf_normaliser(region));


--
-- Name: idx_modes_ville_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modes_ville_slug ON public.modes_exercice USING btree (public.yf_slug(ville));


--
-- Name: idx_notifications_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_compte ON public.notifications_compte USING btree (user_id, creee_le DESC);


--
-- Name: idx_notifications_non_lues; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_non_lues ON public.notifications_compte USING btree (user_id) WHERE (lue_le IS NULL);


--
-- Name: idx_photos_fiche_rendu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_fiche_rendu ON public.photos_tatoueur USING btree (tatoueur_id, rendu);


--
-- Name: idx_studios_commune; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_commune ON public.studios USING btree (public.yf_commune(ville));


--
-- Name: idx_studios_fiche; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_fiche ON public.studios USING btree (tatoueur_id, ordre);


--
-- Name: idx_studios_pays; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_pays ON public.studios USING btree (upper(code_pays));


--
-- Name: idx_studios_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_point ON public.studios USING btree (latitude, longitude);


--
-- Name: idx_studios_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_region ON public.studios USING btree (public.yf_normaliser(region));


--
-- Name: idx_studios_un_principal; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_studios_un_principal ON public.studios USING btree (tatoueur_id) WHERE principal;


--
-- Name: idx_studios_ville_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studios_ville_slug ON public.studios USING btree (public.yf_slug(ville));


--
-- Name: idx_suggestions_style_acceptees; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suggestions_style_acceptees ON public.suggestions_style USING btree (etat) WHERE (etat = 'acceptee'::text);


--
-- Name: idx_suggestions_style_attente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suggestions_style_attente ON public.suggestions_style USING btree (cree_le DESC);


--
-- Name: idx_suggestions_style_par_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suggestions_style_par_compte ON public.suggestions_style USING btree (user_id, cree_le DESC);


--
-- Name: idx_suggestions_style_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_suggestions_style_slug_unique ON public.suggestions_style USING btree (slug) WHERE (etat = 'acceptee'::text);


--
-- Name: idx_suppressions_purge; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppressions_purge ON public.suppressions_comptes USING btree (purge_le);


--
-- Name: idx_tatoueurs_admin_publique; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_admin_publique ON public.tatoueurs USING btree (id) WHERE admin_publique;


--
-- Name: idx_tatoueurs_ancien_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_ancien_slug ON public.tatoueurs USING btree (ancien_slug) WHERE (ancien_slug IS NOT NULL);


--
-- Name: idx_tatoueurs_besoins; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_besoins ON public.tatoueurs USING gin (filtres_besoins);


--
-- Name: idx_tatoueurs_code_pays_haut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_code_pays_haut ON public.tatoueurs USING btree (upper(code_pays));


--
-- Name: idx_tatoueurs_commune; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_commune ON public.tatoueurs USING btree (public.yf_commune(ville_nom));


--
-- Name: idx_tatoueurs_composition; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_composition ON public.tatoueurs USING gin (filtres_composition);


--
-- Name: idx_tatoueurs_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_compte ON public.tatoueurs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_tatoueurs_exercice_verrouille; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_exercice_verrouille ON public.tatoueurs USING btree (exercice_verrouille) WHERE (exercice_verrouille = false);


--
-- Name: idx_tatoueurs_pays; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_pays ON public.tatoueurs USING btree (code_pays);


--
-- Name: idx_tatoueurs_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_position ON public.tatoueurs USING btree (latitude, longitude);


--
-- Name: idx_tatoueurs_publie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_publie ON public.tatoueurs USING btree (publie);


--
-- Name: idx_tatoueurs_purge_le; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_purge_le ON public.tatoueurs USING btree (purge_le) WHERE (purge_le IS NOT NULL);


--
-- Name: idx_tatoueurs_region_normalisee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_region_normalisee ON public.tatoueurs USING btree (public.yf_normaliser(region));


--
-- Name: idx_tatoueurs_styles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_styles ON public.tatoueurs USING gin (styles);


--
-- Name: idx_tatoueurs_suivis_par_compte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_suivis_par_compte ON public.tatoueurs_suivis USING btree (utilisateur_id, cree_le DESC);


--
-- Name: idx_tatoueurs_suivis_par_tatoueur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_suivis_par_tatoueur ON public.tatoueurs_suivis USING btree (tatoueur_id);


--
-- Name: idx_tatoueurs_supprime_le; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_supprime_le ON public.tatoueurs USING btree (supprime_le) WHERE (supprime_le IS NOT NULL);


--
-- Name: idx_tatoueurs_technique; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_technique ON public.tatoueurs USING gin (filtres_technique);


--
-- Name: idx_tatoueurs_ville; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_ville ON public.tatoueurs USING btree (ville_slug);


--
-- Name: idx_tatoueurs_visibles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tatoueurs_visibles ON public.tatoueurs USING btree (id) WHERE (publie AND (supprime_le IS NULL));


--
-- Name: messages_yokofolio_par_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_yokofolio_par_ip ON public.messages_yokofolio USING btree (ip, cree_le DESC);


--
-- Name: photos_tatoueur_en_attente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX photos_tatoueur_en_attente_idx ON public.photos_tatoueur USING btree (tatoueur_id) WHERE en_attente;


--
-- Name: photos_tatoueur_galerie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX photos_tatoueur_galerie ON public.photos_tatoueur USING btree (tatoueur_id, ordre);


--
-- Name: photos_tatoueur_nature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX photos_tatoueur_nature ON public.photos_tatoueur USING btree (nature, style);


--
-- Name: photos_tatoueur_rendu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX photos_tatoueur_rendu ON public.photos_tatoueur USING btree (rendu);


--
-- Name: photos_tatoueur_style; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX photos_tatoueur_style ON public.photos_tatoueur USING btree (style);


--
-- Name: signalements_fiches_a_traiter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signalements_fiches_a_traiter ON public.signalements_fiches USING btree (traite, cree_le DESC);


--
-- Name: tatoueurs_etablissement_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tatoueurs_etablissement_idx ON public.tatoueurs USING btree (etablissement) WHERE (type_fiche = 'salon'::text);


--
-- Name: tatoueurs_suivis_tatoueur_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tatoueurs_suivis_tatoueur_idx ON public.tatoueurs_suivis USING btree (tatoueur_id);


--
-- Name: tatoueurs tatoueurs_garde_fou; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tatoueurs_garde_fou BEFORE UPDATE ON public.tatoueurs FOR EACH ROW EXECUTE FUNCTION public.tatoueurs_garde_fou();


--
-- Name: tatoueurs trg_tatoueurs_verrou_exercice; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tatoueurs_verrou_exercice BEFORE UPDATE ON public.tatoueurs FOR EACH ROW EXECUTE FUNCTION public.tatoueurs_verrou_exercice();


--
-- Name: conventions conventions_fiche_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conventions
    ADD CONSTRAINT conventions_fiche_id_fkey FOREIGN KEY (fiche_id) REFERENCES public.tatoueurs(id) ON DELETE SET NULL;


--
-- Name: conventions conventions_propose_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conventions
    ADD CONSTRAINT conventions_propose_par_fkey FOREIGN KEY (propose_par) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: demarchage_fiches demarchage_fiches_demarchage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchage_fiches
    ADD CONSTRAINT demarchage_fiches_demarchage_id_fkey FOREIGN KEY (demarchage_id) REFERENCES public.demarchages(id) ON DELETE CASCADE;


--
-- Name: demarchage_fiches demarchage_fiches_tatoueur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchage_fiches
    ADD CONSTRAINT demarchage_fiches_tatoueur_id_fkey FOREIGN KEY (tatoueur_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: demarchages demarchages_rattache_a_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demarchages
    ADD CONSTRAINT demarchages_rattache_a_fkey FOREIGN KEY (rattache_a) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: favoris_photos favoris_photos_photo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris_photos
    ADD CONSTRAINT favoris_photos_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos_tatoueur(id) ON DELETE CASCADE;


--
-- Name: favoris_photos favoris_photos_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoris_photos
    ADD CONSTRAINT favoris_photos_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: liaisons_artiste_salon liaisons_artiste_salon_artiste_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liaisons_artiste_salon
    ADD CONSTRAINT liaisons_artiste_salon_artiste_id_fkey FOREIGN KEY (artiste_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: liaisons_artiste_salon liaisons_artiste_salon_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liaisons_artiste_salon
    ADD CONSTRAINT liaisons_artiste_salon_mode_id_fkey FOREIGN KEY (mode_id) REFERENCES public.modes_exercice(id) ON DELETE CASCADE;


--
-- Name: liaisons_artiste_salon liaisons_artiste_salon_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liaisons_artiste_salon
    ADD CONSTRAINT liaisons_artiste_salon_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: modes_exercice modes_exercice_convention_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modes_exercice
    ADD CONSTRAINT modes_exercice_convention_id_fkey FOREIGN KEY (convention_id) REFERENCES public.conventions(id) ON DELETE SET NULL;


--
-- Name: modes_exercice modes_exercice_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modes_exercice
    ADD CONSTRAINT modes_exercice_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.tatoueurs(id) ON DELETE SET NULL;


--
-- Name: modes_exercice modes_exercice_tatoueur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modes_exercice
    ADD CONSTRAINT modes_exercice_tatoueur_id_fkey FOREIGN KEY (tatoueur_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: notifications_compte notifications_compte_fiche_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_compte
    ADD CONSTRAINT notifications_compte_fiche_id_fkey FOREIGN KEY (fiche_id) REFERENCES public.tatoueurs(id) ON DELETE SET NULL;


--
-- Name: notifications_compte notifications_compte_liaison_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_compte
    ADD CONSTRAINT notifications_compte_liaison_id_fkey FOREIGN KEY (liaison_id) REFERENCES public.liaisons_artiste_salon(id) ON DELETE CASCADE;


--
-- Name: notifications_compte notifications_compte_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_compte
    ADD CONSTRAINT notifications_compte_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: photos_tatoueur photos_tatoueur_tatoueur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos_tatoueur
    ADD CONSTRAINT photos_tatoueur_tatoueur_id_fkey FOREIGN KEY (tatoueur_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: studios studios_tatoueur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_tatoueur_id_fkey FOREIGN KEY (tatoueur_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: suggestions_style suggestions_style_fiche_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions_style
    ADD CONSTRAINT suggestions_style_fiche_id_fkey FOREIGN KEY (fiche_id) REFERENCES public.tatoueurs(id) ON DELETE SET NULL;


--
-- Name: suggestions_style suggestions_style_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions_style
    ADD CONSTRAINT suggestions_style_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: suppressions_comptes suppressions_comptes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppressions_comptes
    ADD CONSTRAINT suppressions_comptes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tatoueurs_suivis tatoueurs_suivis_tatoueur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs_suivis
    ADD CONSTRAINT tatoueurs_suivis_tatoueur_id_fkey FOREIGN KEY (tatoueur_id) REFERENCES public.tatoueurs(id) ON DELETE CASCADE;


--
-- Name: tatoueurs_suivis tatoueurs_suivis_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs_suivis
    ADD CONSTRAINT tatoueurs_suivis_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tatoueurs tatoueurs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tatoueurs
    ADD CONSTRAINT tatoueurs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visites_selection visites_selection_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visites_selection
    ADD CONSTRAINT visites_selection_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clics_fiches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clics_fiches ENABLE ROW LEVEL SECURITY;

--
-- Name: conventions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs creation de sa propre fiche; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "creation de sa propre fiche" ON public.tatoueurs FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (publie = false)));


--
-- Name: liaisons_artiste_salon creer un rattachement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "creer un rattachement" ON public.liaisons_artiste_salon FOR INSERT TO authenticated WITH CHECK (((statut = 'validee'::text) AND (((origine = 'salon'::text) AND (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = liaisons_artiste_salon.salon_id) AND (t.user_id = auth.uid()))))) OR ((origine = ANY (ARRAY['artiste'::text, 'adresse'::text])) AND (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = liaisons_artiste_salon.artiste_id) AND (t.user_id = auth.uid()))))))));


--
-- Name: demarchage_fiches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demarchage_fiches ENABLE ROW LEVEL SECURITY;

--
-- Name: demarchages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demarchages ENABLE ROW LEVEL SECURITY;

--
-- Name: visites_selection ecrire sa visite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ecrire sa visite" ON public.visites_selection FOR INSERT WITH CHECK ((auth.uid() = utilisateur_id));


--
-- Name: modes_exercice ecriture de ses modes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ecriture de ses modes" ON public.modes_exercice TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = modes_exercice.tatoueur_id) AND (t.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = modes_exercice.tatoueur_id) AND (t.user_id = auth.uid())))));


--
-- Name: photos_tatoueur ecriture de ses photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ecriture de ses photos" ON public.photos_tatoueur TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = photos_tatoueur.tatoueur_id) AND (t.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = photos_tatoueur.tatoueur_id) AND (t.user_id = auth.uid())))));


--
-- Name: studios ecriture de ses studios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ecriture de ses studios" ON public.studios TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = studios.tatoueur_id) AND (t.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = studios.tatoueur_id) AND (t.user_id = auth.uid())))));


--
-- Name: favoris_photos enregistrer une photo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "enregistrer une photo" ON public.favoris_photos FOR INSERT WITH CHECK ((auth.uid() = utilisateur_id));


--
-- Name: favoris_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favoris_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs lecture de sa propre fiche; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture de sa propre fiche" ON public.tatoueurs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: conventions lecture de ses demandes de convention; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture de ses demandes de convention" ON public.conventions FOR SELECT TO authenticated USING ((auth.uid() = propose_par));


--
-- Name: notifications_compte lecture de ses notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture de ses notifications" ON public.notifications_compte FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: suggestions_style lecture de ses suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture de ses suggestions" ON public.suggestions_style FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: liaisons_artiste_salon lecture publique des liaisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture publique des liaisons" ON public.liaisons_artiste_salon FOR SELECT TO anon, authenticated USING ((public.fiche_en_ligne(artiste_id) OR public.fiche_en_ligne(salon_id) OR (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = ANY (ARRAY[liaisons_artiste_salon.artiste_id, liaisons_artiste_salon.salon_id])) AND (t.user_id = auth.uid()))))));


--
-- Name: modes_exercice lecture publique des modes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture publique des modes" ON public.modes_exercice FOR SELECT TO anon, authenticated USING ((public.fiche_en_ligne(tatoueur_id) OR (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = modes_exercice.tatoueur_id) AND (t.user_id = auth.uid()))))));


--
-- Name: photos_tatoueur lecture publique des photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture publique des photos" ON public.photos_tatoueur FOR SELECT TO anon, authenticated USING ((public.fiche_en_ligne(tatoueur_id) OR (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = photos_tatoueur.tatoueur_id) AND (t.user_id = auth.uid()))))));


--
-- Name: studios lecture publique des studios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture publique des studios" ON public.studios FOR SELECT TO anon, authenticated USING ((public.fiche_en_ligne(tatoueur_id) OR (EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = studios.tatoueur_id) AND (t.user_id = auth.uid()))))));


--
-- Name: tatoueurs lecture publique des tatoueurs publies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lecture publique des tatoueurs publies" ON public.tatoueurs FOR SELECT TO anon, authenticated USING (((publie = true) AND (supprime_le IS NULL) AND (COALESCE(((to_jsonb(tatoueurs.*) ->> 'hors_ligne'::text))::boolean, false) = false) AND (COALESCE((to_jsonb(tatoueurs.*) ->> 'statut'::text), ''::text) <> 'refusee'::text)));


--
-- Name: conventions les conventions acceptees sont publiques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "les conventions acceptees sont publiques" ON public.conventions FOR SELECT TO anon, authenticated USING ((etat = 'acceptee'::text));


--
-- Name: suggestions_style les styles acceptes sont publics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "les styles acceptes sont publics" ON public.suggestions_style FOR SELECT TO anon, authenticated USING ((etat = 'acceptee'::text));


--
-- Name: liaisons_artiste_salon; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.liaisons_artiste_salon ENABLE ROW LEVEL SECURITY;

--
-- Name: visites_selection lire sa visite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lire sa visite" ON public.visites_selection FOR SELECT USING ((auth.uid() = utilisateur_id));


--
-- Name: favoris_photos lire ses photos enregistrees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lire ses photos enregistrees" ON public.favoris_photos FOR SELECT USING ((auth.uid() = utilisateur_id));


--
-- Name: tatoueurs_suivis lire ses suivis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "lire ses suivis" ON public.tatoueurs_suivis FOR SELECT USING ((auth.uid() = utilisateur_id));


--
-- Name: notifications_compte marquer ses notifications comme lues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "marquer ses notifications comme lues" ON public.notifications_compte FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages_yokofolio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages_yokofolio ENABLE ROW LEVEL SECURITY;

--
-- Name: modes_exercice; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modes_exercice ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs modification de sa propre fiche; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "modification de sa propre fiche" ON public.tatoueurs FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: tatoueurs_suivis ne plus suivre; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ne plus suivre" ON public.tatoueurs_suivis FOR DELETE USING ((auth.uid() = utilisateur_id));


--
-- Name: notifications_compte; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications_compte ENABLE ROW LEVEL SECURITY;

--
-- Name: photos_tatoueur; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photos_tatoueur ENABLE ROW LEVEL SECURITY;

--
-- Name: suggestions_style proposer un style; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "proposer un style" ON public.suggestions_style FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (etat = 'en_attente'::text) AND (label IS NULL) AND (slug IS NULL) AND (message IS NULL)));


--
-- Name: conventions proposer une convention; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "proposer une convention" ON public.conventions FOR INSERT TO authenticated WITH CHECK (((auth.uid() = propose_par) AND (etat = 'en_attente'::text) AND (nom IS NULL) AND (slug IS NULL) AND (traite_le IS NULL)));


--
-- Name: visites_selection remplacer sa visite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "remplacer sa visite" ON public.visites_selection FOR UPDATE USING ((auth.uid() = utilisateur_id)) WITH CHECK ((auth.uid() = utilisateur_id));


--
-- Name: liaisons_artiste_salon retirer sa liaison; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "retirer sa liaison" ON public.liaisons_artiste_salon FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tatoueurs t
  WHERE ((t.id = ANY (ARRAY[liaisons_artiste_salon.artiste_id, liaisons_artiste_salon.salon_id])) AND (t.user_id = auth.uid())))));


--
-- Name: favoris_photos retirer une photo enregistree; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "retirer une photo enregistree" ON public.favoris_photos FOR DELETE USING ((auth.uid() = utilisateur_id));


--
-- Name: signalements_fiches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signalements_fiches ENABLE ROW LEVEL SECURITY;

--
-- Name: studios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

--
-- Name: suggestions_style; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suggestions_style ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs_suivis suivre un tatoueur; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "suivre un tatoueur" ON public.tatoueurs_suivis FOR INSERT WITH CHECK ((auth.uid() = utilisateur_id));


--
-- Name: suppressions_comptes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppressions_comptes ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tatoueurs ENABLE ROW LEVEL SECURITY;

--
-- Name: tatoueurs_suivis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tatoueurs_suivis ENABLE ROW LEVEL SECURITY;

--
-- Name: visites_selection; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visites_selection ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION fiche_en_ligne(p_tatoueur_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fiche_en_ligne(p_tatoueur_id uuid) TO anon;
GRANT ALL ON FUNCTION public.fiche_en_ligne(p_tatoueur_id uuid) TO authenticated;


--
-- Name: FUNCTION rechercher_tatoueurs(p_style text, p_niveau text, p_latitude double precision, p_longitude double precision, p_rayon_km double precision, p_ville_nom text, p_ville_slug text, p_code_pays text, p_region text, p_types text[], p_modes text[], p_technique text[], p_composition text[], p_besoins text[], p_nature text, p_rendus text[], p_photo_rendu text, p_limite integer, p_decalage integer, p_photos_max integer, p_prioriser_clics boolean, p_jour integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rechercher_tatoueurs(p_style text, p_niveau text, p_latitude double precision, p_longitude double precision, p_rayon_km double precision, p_ville_nom text, p_ville_slug text, p_code_pays text, p_region text, p_types text[], p_modes text[], p_technique text[], p_composition text[], p_besoins text[], p_nature text, p_rendus text[], p_photo_rendu text, p_limite integer, p_decalage integer, p_photos_max integer, p_prioriser_clics boolean, p_jour integer) TO anon;
GRANT ALL ON FUNCTION public.rechercher_tatoueurs(p_style text, p_niveau text, p_latitude double precision, p_longitude double precision, p_rayon_km double precision, p_ville_nom text, p_ville_slug text, p_code_pays text, p_region text, p_types text[], p_modes text[], p_technique text[], p_composition text[], p_besoins text[], p_nature text, p_rendus text[], p_photo_rendu text, p_limite integer, p_decalage integer, p_photos_max integer, p_prioriser_clics boolean, p_jour integer) TO authenticated;


--
-- Name: TABLE clics_tatoueurs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.clics_tatoueurs TO anon;
GRANT SELECT ON TABLE public.clics_tatoueurs TO authenticated;


--
-- Name: TABLE coeurs_par_photo; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.coeurs_par_photo TO anon;
GRANT SELECT ON TABLE public.coeurs_par_photo TO authenticated;


--
-- Name: TABLE liaisons_artiste_salon; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.liaisons_artiste_salon TO anon;
GRANT SELECT ON TABLE public.liaisons_artiste_salon TO authenticated;


--
-- Name: TABLE modes_exercice; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.modes_exercice TO anon;
GRANT SELECT ON TABLE public.modes_exercice TO authenticated;


--
-- Name: TABLE tatoueurs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.tatoueurs TO anon;
GRANT SELECT ON TABLE public.tatoueurs TO authenticated;


--
-- Name: TABLE modes_exercice_actifs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.modes_exercice_actifs TO anon;
GRANT SELECT ON TABLE public.modes_exercice_actifs TO authenticated;


--
-- Name: TABLE studios; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.studios TO anon;
GRANT SELECT ON TABLE public.studios TO authenticated;


--
-- Name: TABLE photos_tatoueur; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.photos_tatoueur TO anon;
GRANT SELECT ON TABLE public.photos_tatoueur TO authenticated;


--
-- Name: TABLE popularite_tatoueurs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.popularite_tatoueurs TO anon;
GRANT SELECT ON TABLE public.popularite_tatoueurs TO authenticated;


--
-- PostgreSQL database dump complete
--


