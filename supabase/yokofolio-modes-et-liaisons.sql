-- ============================================================
--  YOKOFOLIO — MODES D'EXERCICE CUMULATIFS, STUDIOS MULTIPLES
--  ET LIAISONS ARTISTE ↔ SALON
--  (migration nº 26 — à passer APRÈS yokofolio-notifications.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : tout est en « if not exists », et la
--  reprise des données ne touche que ce qui n'a pas encore été repris.
--
--  CE QUI CHANGE, ET POURQUOI
--  ---------------------------
--  Un artiste devait choisir UN statut parmi trois (« en salon »,
--  « sur zone », « itinérant »), écrit dans une colonne unique
--  `mode_exercice`. La réalité du métier ne tient pas dans une case :
--  on est résident d'un salon À LYON, on part en guest À PARIS quinze
--  jours en septembre, et on reçoit chez soi le reste du temps. Les
--  trois en même temps.
--
--  Le mode d'exercice cesse donc d'être UNE COLONNE et devient DES
--  LIGNES : autant que l'artiste en déclare, sans limite.
--
--  Symétriquement, une enseigne de salon peut tenir PLUSIEURS
--  adresses (Lyon et Paris) : les studios deviennent eux aussi des
--  lignes, et non plus l'unique adresse de la fiche.
--
--  Enfin, artistes et salons se LIENT : l'artiste déclare travailler
--  dans un salon inscrit, le salon confirme, et l'avatar de l'artiste
--  rejoint le bloc « Équipe » de la fiche du salon. La demande peut
--  partir des deux côtés ; elle n'est jamais acquise sans un OUI de
--  l'autre.
--
--  TROIS TABLES, ET C'EST TOUT
--  ----------------------------
--   1. `modes_exercice`          — les modes d'un ARTISTE (0..n) ;
--   2. `studios`                 — les adresses d'un SALON (0..n) ;
--   3. `liaisons_artiste_salon`  — les rattachements, avec leur état.
--
--  LES ANCIENNES COLONNES NE SONT PAS SUPPRIMÉES : `mode_exercice`,
--  `rayon_zone_km` et `villes` restent en base, figées, le temps que
--  chacun réenregistre sa fiche. Elles ne sont plus lues par le site.
--  Les effacer maintenant rendrait toute marche arrière impossible.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LES MODES D'EXERCICE D'UN ARTISTE
-- ------------------------------------------------------------
--  TROIS GENRES, cumulables, répétables :
--   · `salon`    — résident d'un studio (lié à un salon inscrit, ou
--                  adresse saisie à la main) ;
--   · `guest`    — session temporaire, AVEC UNE DATE DE DÉBUT ET UNE
--                  DATE DE FIN : passé la fin, le mode s'efface tout
--                  seul de l'affichage (voir la vue plus bas) ;
--   · `domicile` — à domicile ou en studio privé. L'artiste saisit ce
--                  qu'il veut (une ville, une adresse complète) ; le
--                  public NE VOIT QUE la ville et le code postal.
--                  La rue reste en base — elle sert au référencement
--                  géographique — mais n'est jamais affichée.
create table if not exists public.modes_exercice (
  id uuid primary key default gen_random_uuid(),
  tatoueur_id uuid not null references public.tatoueurs(id) on delete cascade,
  genre text not null,

  -- LE SALON INSCRIT, quand il y en a un. `on delete set null` : si le
  -- salon efface sa fiche, le mode subsiste avec son adresse — ce qui
  -- reste vrai, c'est que l'artiste travaille là.
  salon_id uuid references public.tatoueurs(id) on delete set null,

  -- L'ADRESSE — celle du salon lié, recopiée, ou celle saisie à la
  -- main. Recopiée exprès : la fiche doit rester lisible même si le
  -- salon disparaît, et l'affichage ne doit pas dépendre d'une
  -- jointure de plus à chaque carte.
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

  -- GUEST seulement : les bornes de la session.
  debut_le date,
  fin_le date,

  ordre integer not null default 0,
  cree_le timestamptz not null default now()
);

comment on table public.modes_exercice is
  'Les modes d''exercice d''un ARTISTE — cumulatifs et répétables : salon (résident), guest (session datée), domicile (studio privé). Remplace l''ancienne colonne tatoueurs.mode_exercice.';
comment on column public.modes_exercice.genre is
  'salon | guest | domicile.';
comment on column public.modes_exercice.salon_id is
  'La fiche SALON liée, quand l''artiste l''a trouvée dans la recherche interne. Null = adresse saisie à la main.';
comment on column public.modes_exercice.debut_le is
  'Début de la session — GUEST uniquement.';
comment on column public.modes_exercice.fin_le is
  'Fin de la session — GUEST uniquement. Passée cette date, le mode disparaît de la fiche et l''artiste sort de l''équipe du salon.';

alter table public.modes_exercice drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'domicile'));

--  UN GUEST A DEUX DATES, DANS LE BON ORDRE ; les autres genres n'en
--  ont aucune. La règle est écrite ici, pas seulement dans le
--  formulaire : une donnée fausse ne doit pas pouvoir entrer.
alter table public.modes_exercice drop constraint if exists modes_exercice_dates_coherentes;
alter table public.modes_exercice
  add constraint modes_exercice_dates_coherentes
  check (
    (genre = 'guest' and debut_le is not null and fin_le is not null and fin_le >= debut_le)
    or (genre <> 'guest' and debut_le is null and fin_le is null)
  );

--  UN MODE SITUE TOUJOURS QUELQUE CHOSE : soit un salon inscrit, soit
--  un point sur la carte. Sans l'un ni l'autre, il n'apprend rien et
--  ne référence rien.
alter table public.modes_exercice drop constraint if exists modes_exercice_situe;
alter table public.modes_exercice
  add constraint modes_exercice_situe
  check (salon_id is not null or (latitude is not null and longitude is not null));

create index if not exists idx_modes_exercice_fiche
  on public.modes_exercice (tatoueur_id, ordre);
create index if not exists idx_modes_exercice_salon
  on public.modes_exercice (salon_id)
  where salon_id is not null;
--  La recherche géographique lit ces points : elle doit les balayer
--  vite, et seulement ceux qui en ont.
create index if not exists idx_modes_exercice_point
  on public.modes_exercice (latitude, longitude)
  where latitude is not null;

-- ------------------------------------------------------------
-- 2) LES STUDIOS D'UN SALON
-- ------------------------------------------------------------
--  Une enseigne, plusieurs adresses. Le premier studio est celui de
--  la fiche elle-même (`principal`) : c'est lui qui porte le nom, les
--  coordonnées et le slug. Les autres s'ajoutent à côté.
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  tatoueur_id uuid not null references public.tatoueurs(id) on delete cascade,
  --  Le nom de CE studio (« Encre Noire — Croix-Rousse »). Vide = on
  --  reprend le nom de l'enseigne.
  nom text,
  intitule text,
  adresse text,
  code_postal text,
  ville text,
  region text,
  pays text,
  code_pays text,
  latitude double precision not null,
  longitude double precision not null,
  lieu_id text,
  principal boolean not null default false,
  ordre integer not null default 0,
  cree_le timestamptz not null default now()
);

comment on table public.studios is
  'Les adresses d''une enseigne de SALON — une par studio. Le studio « principal » est celui de la fiche ; les autres s''affichent dessous, chacun avec son lien.';
comment on column public.studios.principal is
  'Vrai pour le studio porté par la fiche elle-même (nom, slug, coordonnées). Un seul par fiche.';

--  UN SEUL studio principal par fiche — l'index le garantit.
create unique index if not exists idx_studios_un_principal
  on public.studios (tatoueur_id)
  where principal;

create index if not exists idx_studios_fiche
  on public.studios (tatoueur_id, ordre);
create index if not exists idx_studios_point
  on public.studios (latitude, longitude);

-- ------------------------------------------------------------
-- 3) LES LIAISONS ARTISTE ↔ SALON
-- ------------------------------------------------------------
--  UNE DEMANDE, PUIS UNE RÉPONSE — jamais un rattachement d'office.
--  Qui demande n'est pas qui valide : `origine` dit d'où part la
--  demande, et c'est TOUJOURS L'AUTRE qui répond. Un artiste ne peut
--  donc pas s'inscrire seul dans l'équipe d'un salon, et un salon ne
--  peut pas s'attribuer un artiste.
create table if not exists public.liaisons_artiste_salon (
  id uuid primary key default gen_random_uuid(),
  artiste_id uuid not null references public.tatoueurs(id) on delete cascade,
  salon_id uuid not null references public.tatoueurs(id) on delete cascade,
  --  Le mode d'exercice qui la porte, côté artiste (résident ou
  --  guest). Supprimer le mode retire la liaison : c'est le point 4.
  mode_id uuid references public.modes_exercice(id) on delete cascade,
  origine text not null,
  statut text not null default 'demande',
  demandee_le timestamptz not null default now(),
  repondu_le timestamptz
);

comment on table public.liaisons_artiste_salon is
  'Le rattachement d''un artiste à un salon inscrit : demandé d''un côté, validé (ou refusé) de l''autre. Seules les liaisons « validee » font apparaître l''artiste dans l''équipe du salon.';
comment on column public.liaisons_artiste_salon.origine is
  'artiste | salon — qui a demandé. L''AUTRE répond.';
comment on column public.liaisons_artiste_salon.statut is
  'demande | validee | refusee.';

alter table public.liaisons_artiste_salon drop constraint if exists liaisons_origine_connue;
alter table public.liaisons_artiste_salon
  add constraint liaisons_origine_connue check (origine in ('artiste', 'salon'));

alter table public.liaisons_artiste_salon drop constraint if exists liaisons_statut_connu;
alter table public.liaisons_artiste_salon
  add constraint liaisons_statut_connu check (statut in ('demande', 'validee', 'refusee'));

alter table public.liaisons_artiste_salon drop constraint if exists liaisons_pas_soi_meme;
alter table public.liaisons_artiste_salon
  add constraint liaisons_pas_soi_meme check (artiste_id <> salon_id);

--  UNE SEULE liaison par (artiste, salon, mode) : redemander ne
--  duplique pas, cela met à jour la demande existante.
create unique index if not exists idx_liaisons_unique
  on public.liaisons_artiste_salon (artiste_id, salon_id, coalesce(mode_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists idx_liaisons_salon
  on public.liaisons_artiste_salon (salon_id, statut);
create index if not exists idx_liaisons_artiste
  on public.liaisons_artiste_salon (artiste_id, statut);

--  LA NOTIFICATION QUI PORTE UNE DEMANDE. Les nouvelles du compte
--  (migration nº 25) savent déjà nommer une fiche ; une demande de
--  rattachement, elle, doit pouvoir être RÉPONDUE depuis la boîte de
--  nouvelles. Elle porte donc l'identifiant de la liaison — et
--  disparaît avec elle (`on delete cascade`) : une demande retirée ne
--  laisse pas un bouton « Valider » qui ne mène nulle part.
alter table public.notifications_compte
  add column if not exists liaison_id uuid
  references public.liaisons_artiste_salon(id) on delete cascade;

comment on column public.notifications_compte.liaison_id is
  'La demande de rattachement à laquelle cette nouvelle permet de répondre (genre « liaison »). Null pour toutes les autres.';

-- ------------------------------------------------------------
-- 4) L'ÉQUIPE D'UN SALON — une VUE, pas une table
-- ------------------------------------------------------------
--  L'équipe n'est jamais « écrite » : elle se DÉDUIT, à la seconde
--  où on la lit. C'est ce qui rend gratuits les trois retraits
--  automatiques demandés :
--   · l'artiste passe HORS LIGNE ou dépublie   → il sort ;
--   · l'artiste SUPPRIME sa fiche (supprime_le) → il sort ;
--   · sa session GUEST est TERMINÉE             → il sort.
--  Aucune tâche planifiée, aucun risque d'oubli : la condition est
--  dans la lecture.
create or replace view public.equipe_salon as
  select
    l.salon_id,
    l.artiste_id,
    a.nom          as artiste_nom,
    a.slug         as artiste_slug,
    a.photo_profil as artiste_photo,
    m.genre        as genre,
    m.debut_le,
    m.fin_le,
    l.demandee_le
  from public.liaisons_artiste_salon as l
  join public.tatoueurs as a on a.id = l.artiste_id
  left join public.modes_exercice as m on m.id = l.mode_id
  where l.statut = 'validee'
    and a.publie = true
    and a.hors_ligne = false
    and a.supprime_le is null
    -- Un guest expiré n'est plus de l'équipe. Un mode sans dates
    -- (résident) n'expire jamais.
    and (m.fin_le is null or m.fin_le >= current_date);

comment on view public.equipe_salon is
  'L''équipe visible d''un salon : liaisons validées, artiste en ligne, session guest non expirée. Rien n''est stocké — la règle est dans la lecture.';

--  LES MODES ENCORE VALABLES d'une fiche : même principe, la date de
--  fin d'un guest se compare à AUJOURD'HUI au moment de la lecture.
create or replace view public.modes_exercice_actifs as
  select *
    from public.modes_exercice
   where fin_le is null or fin_le >= current_date;

comment on view public.modes_exercice_actifs is
  'Les modes d''exercice à afficher : tous, sauf les sessions guest dont la date de fin est passée.';

-- ------------------------------------------------------------
-- 5) LES RÈGLES D'ACCÈS
-- ------------------------------------------------------------
alter table public.modes_exercice enable row level security;
alter table public.studios enable row level security;
alter table public.liaisons_artiste_salon enable row level security;

--  LIRE : tout le monde, mais seulement ce qui appartient à une fiche
--  PUBLIÉE — c'est exactement la règle des fiches elles-mêmes. Un
--  brouillon ne fuit pas par ses modes d'exercice.
drop policy if exists "lecture publique des modes" on public.modes_exercice;
create policy "lecture publique des modes"
  on public.modes_exercice for select
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id = modes_exercice.tatoueur_id
         and (t.publie = true or t.user_id = auth.uid())
    )
  );

drop policy if exists "lecture publique des studios" on public.studios;
create policy "lecture publique des studios"
  on public.studios for select
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id = studios.tatoueur_id
         and (t.publie = true or t.user_id = auth.uid())
    )
  );

--  ÉCRIRE SES PROPRES MODES ET STUDIOS : le propriétaire de la fiche,
--  et lui seul. La même phrase que partout ailleurs — `auth.uid()`
--  comparé au `user_id` de la fiche visée.
drop policy if exists "ecriture de ses modes" on public.modes_exercice;
create policy "ecriture de ses modes"
  on public.modes_exercice for all
  to authenticated
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id = modes_exercice.tatoueur_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tatoueurs t
       where t.id = modes_exercice.tatoueur_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "ecriture de ses studios" on public.studios;
create policy "ecriture de ses studios"
  on public.studios for all
  to authenticated
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id = studios.tatoueur_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tatoueurs t
       where t.id = studios.tatoueur_id and t.user_id = auth.uid()
    )
  );

--  LES LIAISONS — LE POINT DÉLICAT, ET LA RÈGLE EST SIMPLE :
--   · LIRE       : tout le monde (l'équipe est publique) ;
--   · DEMANDER   : le propriétaire de la fiche D'OÙ PART la demande,
--                  et la demande naît TOUJOURS à l'état « demande » ;
--   · RÉPONDRE   : le propriétaire de la fiche VISÉE, et lui seul ;
--   · RETIRER    : chacun peut défaire son propre rattachement.
--  C'est ce découpage qui rend impossible l'auto-validation : celui
--  qui demande n'a AUCUN droit d'écriture sur le statut.
drop policy if exists "lecture publique des liaisons" on public.liaisons_artiste_salon;
create policy "lecture publique des liaisons"
  on public.liaisons_artiste_salon for select
  using (true);

drop policy if exists "demander une liaison" on public.liaisons_artiste_salon;
create policy "demander une liaison"
  on public.liaisons_artiste_salon for insert
  to authenticated
  with check (
    statut = 'demande'
    and (
      (origine = 'artiste' and exists (
        select 1 from public.tatoueurs t
         where t.id = liaisons_artiste_salon.artiste_id and t.user_id = auth.uid()))
      or
      (origine = 'salon' and exists (
        select 1 from public.tatoueurs t
         where t.id = liaisons_artiste_salon.salon_id and t.user_id = auth.uid()))
    )
  );

drop policy if exists "repondre a une liaison" on public.liaisons_artiste_salon;
create policy "repondre a une liaison"
  on public.liaisons_artiste_salon for update
  to authenticated
  using (
    -- Celui qui répond est le DESTINATAIRE : l'autre bout de la
    -- demande, jamais son auteur.
    (origine = 'artiste' and exists (
      select 1 from public.tatoueurs t
       where t.id = liaisons_artiste_salon.salon_id and t.user_id = auth.uid()))
    or
    (origine = 'salon' and exists (
      select 1 from public.tatoueurs t
       where t.id = liaisons_artiste_salon.artiste_id and t.user_id = auth.uid()))
  )
  with check (statut in ('validee', 'refusee'));

drop policy if exists "retirer sa liaison" on public.liaisons_artiste_salon;
create policy "retirer sa liaison"
  on public.liaisons_artiste_salon for delete
  to authenticated
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id in (liaisons_artiste_salon.artiste_id, liaisons_artiste_salon.salon_id)
         and t.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 6) LA REPRISE DES FICHES EXISTANTES
-- ------------------------------------------------------------
--  RIEN N'EST PERDU, RIEN N'EST DEVINÉ. Chaque ancienne fiche est
--  traduite dans le nouveau modèle par la lecture la plus littérale
--  possible de ce qu'elle disait déjà :
--
--   · SALON (type_fiche = 'salon')
--       → un STUDIO PRINCIPAL reprenant, à l'identique, l'adresse et
--         les coordonnées de la fiche. Une enseigne à une adresse est
--         simplement une enseigne à un studio.
--
--   · ARTISTE « en-salon »
--       → un mode `salon`, adresse et coordonnées de la fiche. Aucune
--         liaison n'est inventée : la fiche ne disait pas DANS QUEL
--         salon inscrit il travaillait, et deviner créerait de faux
--         rattachements que le salon n'a jamais validés.
--
--   · ARTISTE « sur-zone »
--       → un mode `domicile`, coordonnées de la ville de
--         rattachement. C'est le mode qui décrit exactement cette
--         situation : pas de vitrine, une ville, un secteur.
--         Le RAYON (`rayon_zone_km`) n'a plus d'équivalent : le
--         nouveau modèle affiche « Private / Secteur : Ville (CP) »
--         sans distance. La colonne reste en base, non lue.
--
--   · ARTISTE « itinerant »
--       → UN MODE `domicile` PAR VILLE DE TOURNÉE, dans l'ordre où
--         elles étaient déclarées. Une tournée sans dates n'est pas
--         une session guest : ce sont bien plusieurs secteurs.
--         L'artiste qui veut des dates les posera lui-même en
--         convertissant ces lignes en guest, en deux gestes.
--
--  LA REPRISE NE S'EXÉCUTE QUE POUR LES FICHES QUI N'ONT ENCORE RIEN :
--  relancer ce fichier ne crée aucun doublon, et n'écrase jamais ce
--  qu'un tatoueur aurait déjà saisi dans le nouveau formulaire.

--  6a. Les salons → leur studio principal.
insert into public.studios (
  tatoueur_id, nom, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, lieu_id, principal, ordre
)
select
  t.id, t.nom,
  coalesce(t.adresse, t.ville_nom), t.adresse, t.code_postal, t.ville_nom,
  t.region, t.pays, t.code_pays, t.latitude, t.longitude, t.lieu_id, true, 0
from public.tatoueurs as t
where coalesce(t.type_fiche, 'salon') = 'salon'
  and not exists (select 1 from public.studios s where s.tatoueur_id = t.id);

--  6b. Les artistes « en salon » → un mode `salon`.
insert into public.modes_exercice (
  tatoueur_id, genre, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, lieu_id, ordre
)
select
  t.id, 'salon',
  coalesce(t.adresse, t.ville_nom), t.adresse, t.code_postal, t.ville_nom,
  t.region, t.pays, t.code_pays, t.latitude, t.longitude, t.lieu_id, 0
from public.tatoueurs as t
where t.type_fiche = 'artiste'
  and t.mode_exercice = 'en-salon'
  and not exists (select 1 from public.modes_exercice m where m.tatoueur_id = t.id);

--  6c. Les artistes « sur zone » → un mode `domicile`.
insert into public.modes_exercice (
  tatoueur_id, genre, intitule, adresse, code_postal, ville,
  region, pays, code_pays, latitude, longitude, lieu_id, ordre
)
select
  t.id, 'domicile',
  t.ville_nom, null, t.code_postal, t.ville_nom,
  t.region, t.pays, t.code_pays, t.latitude, t.longitude, t.lieu_id, 0
from public.tatoueurs as t
where t.type_fiche = 'artiste'
  and t.mode_exercice = 'sur-zone'
  and not exists (select 1 from public.modes_exercice m where m.tatoueur_id = t.id);

--  6d. Les artistes « itinérants » → un mode `domicile` PAR VILLE.
--      `jsonb_array_elements` déplie le tableau `villes` ; l'ordre
--      d'origine est conservé (`ordinality`).
insert into public.modes_exercice (
  tatoueur_id, genre, intitule, ville, region, pays, code_pays,
  latitude, longitude, lieu_id, ordre
)
select
  t.id, 'domicile',
  coalesce(v.valeur ->> 'intitule', v.valeur ->> 'ville'),
  v.valeur ->> 'ville',
  v.valeur ->> 'region',
  v.valeur ->> 'pays',
  v.valeur ->> 'code_pays',
  (v.valeur ->> 'latitude')::double precision,
  (v.valeur ->> 'longitude')::double precision,
  v.valeur ->> 'lieu_id',
  (v.rang - 1)::integer
from public.tatoueurs as t
cross join lateral jsonb_array_elements(coalesce(t.villes, '[]'::jsonb))
     with ordinality as v(valeur, rang)
where t.type_fiche = 'artiste'
  and t.mode_exercice = 'itinerant'
  and (v.valeur ->> 'latitude') is not null
  and not exists (select 1 from public.modes_exercice m where m.tatoueur_id = t.id);

-- ------------------------------------------------------------
-- 7) LA CONTRAINTE D'AUTREFOIS N'A PLUS DE SENS
-- ------------------------------------------------------------
--  `mode_exercice` n'accepte plus que ses quatre anciennes valeurs
--  parce qu'une contrainte l'y oblige. La colonne n'étant plus lue,
--  on la laisse tranquille — mais on desserre la contrainte pour que
--  rien ne bloque si une future écriture y passe autre chose.
alter table public.tatoueurs drop constraint if exists tatoueurs_mode_exercice_connu;

comment on column public.tatoueurs.mode_exercice is
  'HÉRITAGE — plus lu par le site depuis la migration nº 26 : les modes vivent dans public.modes_exercice. Conservé pour marche arrière.';
comment on column public.tatoueurs.rayon_zone_km is
  'HÉRITAGE — plus lu depuis la migration nº 26 (le mode « sur zone » est devenu « domicile », sans rayon).';
comment on column public.tatoueurs.villes is
  'HÉRITAGE — plus lu depuis la migration nº 26 : chaque ville de tournée est devenue un mode « domicile ».';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Ce que la reprise a produit, fiche par fiche :
--  select t.nom, t.type_fiche, t.mode_exercice,
--         (select count(*) from public.modes_exercice m where m.tatoueur_id = t.id) as modes,
--         (select count(*) from public.studios s where s.tatoueur_id = t.id) as studios
--    from public.tatoueurs t order by t.nom;
--
--  -- Les équipes visibles :
--  select salon_id, artiste_nom, genre, debut_le, fin_le
--    from public.equipe_salon order by salon_id, artiste_nom;
--
--  -- Les demandes en attente de réponse :
--  select origine, statut, artiste_id, salon_id, demandee_le
--    from public.liaisons_artiste_salon where statut = 'demande';
