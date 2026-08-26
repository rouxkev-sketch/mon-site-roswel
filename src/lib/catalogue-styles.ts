import { creerClientSupabaseAnonyme } from "@/lib/supabase/server";
import { libelleStyle, styleConnu } from "@/config/tatouage";
import {
  cleDEnsemble,
  galerieOrdonnee,
  NATURE_PAR_DEFAUT,
  natureConnue,
  type PhotoTatoueur,
} from "@/lib/photos-tatoueur";
import {
  ageEnJours,
  jourCourant,
  scoreDuCarrousel,
} from "@/lib/classement-carrousels";
import { lirePopularite } from "@/lib/tatoueurs";

/**
 * ██ LE CATALOGUE DES STYLES — LA LECTURE (passe nº 620) ██
 * ==================================================================
 * Le chantier « accueil = catalogue de styles » s'est fait en trois
 * passes : la nº 620 a écrit cette lecture, la nº 621 l'a affichée
 * (components/CarteStyle), la nº 622 a fait le ménage.
 * ⚠️ CE MODULE EST DÉSORMAIS APPELÉ PAR L'ACCUEIL — la note d'origine
 * disait « aucune page », c'était vrai le temps d'une passe (piège des
 * commentaires, nº 472). Son unique appelant est
 * `app/(tatouage)/_accueil/rendu`, et SEULEMENT quand aucun critère de
 * recherche n'est posé.
 * ⚠️ LA ROUTE DE RELEVÉ `api/yokofolio/catalogue-styles` A ÉTÉ RETIRÉE
 * à la nº 622 : elle n'avait servi qu'à montrer au propriétaire ce que
 * cette fonction produit, avant qu'on l'affiche.
 *
 * CE QU'IL REND, POUR CHAQUE STYLE DE RÉALISATION :
 *  · LE NOM du style (l'écriture unique, `libelleStyle`) ;
 *  · LE COMPTE DU MENU DÉROULANT — des ARTISTES DISTINCTS, pas des
 *    photos ni des galeries. C'est le chiffre que
 *    `api/yokofolio/creations-par-style` calcule pour le menu
 *    « Explorer » (des `tatoueur_id` distincts), et le propriétaire a
 *    tranché : c'est celui-là que la carte annoncera. Le décompte est
 *    REFAIT ICI SUR LES MÊMES LIGNES, à partir de la même lecture —
 *    ce n'est pas une seconde règle, c'est le même dénombrement
 *    appliqué aux photos qu'on a déjà en main ;
 *  · LA PHOTO À AFFICHER : parmi TOUTES LES PREMIÈRES PHOTOS des
 *    galeries de ce style, celle qui a LE PLUS DE CŒURS.
 *
 * LES RÈGLES, TOUTES ARRÊTÉES AVANT D'ÉCRIRE :
 *  · SEULE LA PREMIÈRE PHOTO D'UNE GALERIE concourt — c'est elle, et
 *    elle seule, qu'une carte montre (règle 1 du carrousel, nº 278) ;
 *  · LES FLASHS SONT EXCLUS (acquis nº 619) : ce catalogue-ci ne parle
 *    que de réalisations ;
 *  · UN STYLE SANS AUCUNE GALERIE N'APPARAÎT PAS. Un style déclaré
 *    mais jamais rempli n'a pas de photo à montrer — la même règle que
 *    le sélecteur d'une fiche (`stylesDuPortfolio`) ;
 *  · L'ORDRE : du compte le plus grand au plus petit. À COMPTE ÉGAL,
 *    L'ORDRE ALPHABÉTIQUE DU NOM — le seul départage qui ne dépende ni
 *    de l'heure, ni du chemin de lecture, ni du hasard ;
 *  · À ÉGALITÉ DE CŒURS entre deux photos, LA NOTE DE LEUR GALERIE
 *    (popularité ÷ âge, la formule unique de `scoreDuCarrousel`,
 *    nº 283), puis la clé de la photo. Personne à zéro cœur n'est
 *    donc laissé sans ordre : voir la note du relevé plus bas.
 *
 * ⚠️ QUATRE LECTURES, ET AUCUNE MIGRATION :
 *   1. `tatoueurs` — les fiches en ligne (`publie = true`) ;
 *   2. `photos_tatoueur` — les photos de ces fiches ;
 *   3. `coeurs_par_photo` — LA VUE PUBLIQUE, pas la table : les
 *      favoris sont privés (RLS, migration nº 53), cette vue n'en rend
 *      qu'un COMPTE, qui ne nomme personne. Elle est déjà lue par
 *      `favoris-serveur` — rien de neuf n'est demandé à la base ;
 *   4. `popularite_tatoueurs`, par `lirePopularite` — l'écriture
 *      unique du score, jamais recopiée.
 * Les lectures 3 et 4 ne servent QU'À CHOISIR LA PHOTO. La lecture 3
 * ne porte que sur les PREMIÈRES photos, jamais sur toute la galerie.
 *
 * ⚠️ ELLE NE LIT NI COOKIE NI EN-TÊTE, et c'est délibéré : l'accueil
 * est PRÉRENDU (`○ /`, nº 357), et la nº 621 devra pouvoir l'appeler
 * sans lui faire perdre son prérendu. Une seule lecture de requête
 * suffirait à le rendre dynamique.
 *
 * ⚠️ JAMAIS BLOQUANTE : base injoignable, vue absente, table vide —
 * elle rend une liste vide ou des photos sans cœurs, et rien ne casse.
 */

/** UNE ENTRÉE DU CATALOGUE — ce qu'une carte de la nº 621 recevra. */
export type StyleDuCatalogue = {
  /** Le slug du style — celui de l'adresse de recherche. */
  slug: string;
  /** Le nom affiché (`libelleStyle`, l'écriture unique du site). */
  label: string;
  /** LE COMPTE DU MENU : des artistes publiés distincts. */
  artistes: number;
  /** ██ §2 (nº 622) — CE CHAMP N'EST PLUS LU PAR PERSONNE ██
      Il servait au relevé de la nº 620, dont la route temporaire est
      partie avec cette passe. IL RESTE, ET C'EST UN CHOIX : il coûte
      un `.length` sur une liste qu'on tient déjà en main, et il dit
      d'un coup d'œil sur quoi le choix de la photo a porté. Le
      supprimer ne rendrait pas une ligne de calcul. */
  galeries: number;
  /** LA PHOTO RETENUE, ou `null` — mais un style sans photo n'entre
      pas dans la liste, ce cas ne peut donc pas s'y produire.
      ⚠️ §2 (nº 622) — SEULES `url` ET `miniature` SONT AFFICHÉES. Les
      trois autres ne sont plus lues depuis le retrait de la route de
      relevé ; elles restent pour la même raison que `galeries` — elles
      sont déjà calculées pour choisir la photo, et elles disent
      POURQUOI c'est celle-là. */
  photo: {
    id: string;
    url: string;
    miniature: string;
    /** Le slug de l'artiste qui l'a déposée. */
    tatoueur: string;
    /** Ses cœurs, tels que la vue les compte. */
    coeurs: number;
  } | null;
};

/** Une ligne de `photos_tatoueur`, telle qu'on la lit ici. */
type LignePhoto = {
  id: string;
  tatoueur_id: string;
  style: string;
  rendu: string | null;
  nature: string | null;
  url: string;
  miniature: string | null;
  ordre: number | null;
  cree_le: string | null;
};

/** Une galerie de réalisation, réduite à ce que le choix demande. */
type GalerieDuStyle = {
  premiere: PhotoTatoueur;
  tatoueurSlug: string;
  /** La note de la galerie — le départage à cœurs égaux. */
  note: number;
};

export async function catalogueDesStyles(): Promise<StyleDuCatalogue[]> {
  try {
    const supabase = creerClientSupabaseAnonyme();

    /* ---- 1. LES FICHES EN LIGNE — `publie = true`, comme partout ---- */
    const { data: fiches } = await supabase
      .from("tatoueurs")
      .select("id, slug")
      .eq("publie", true);
    const slugParFiche = new Map<string, string>();
    for (const ligne of (fiches ?? []) as Array<{ id: string; slug: string }>) {
      slugParFiche.set(ligne.id, ligne.slug);
    }
    if (slugParFiche.size === 0) return [];

    /* ---- 2. LEURS PHOTOS ---- */
    const { data: brutes } = await supabase
      .from("photos_tatoueur")
      .select(
        "id, tatoueur_id, style, rendu, nature, url, miniature, ordre, cree_le"
      );
    const photos = ((brutes ?? []) as unknown as LignePhoto[]).filter(
      (photo) =>
        slugParFiche.has(photo.tatoueur_id) &&
        //  LES FLASHS SONT ÉCARTÉS ICI, AU PLUS TÔT (acquis nº 619) :
        //  ni le compte, ni les galeries, ni le choix de la photo ne
        //  doivent les voir.
        natureConnue(photo.nature) === NATURE_PAR_DEFAUT &&
        //  UN STYLE QUE LE SITE NE CONNAÎT PAS n'a ni nom ni page de
        //  recherche : il n'a rien à faire dans un catalogue.
        //  `styleConnu` est l'écriture unique de cette question.
        Boolean(styleConnu(photo.style))
    );
    if (photos.length === 0) return [];

    /* ---- 3. LE COMPTE DU MENU : des artistes DISTINCTS par style ----
       Le même dénombrement que `creations-par-style` — des ensembles
       de fiches, jamais des additions : un artiste qui a déposé vingt
       photos d'un style n'y entre qu'une fois. */
    const artistesParStyle = new Map<string, Set<string>>();
    for (const photo of photos) {
      const vus = artistesParStyle.get(photo.style);
      if (vus) vus.add(photo.tatoueur_id);
      else artistesParStyle.set(photo.style, new Set([photo.tatoueur_id]));
    }

    /* ---- 4. LES GALERIES, ET LEUR PREMIÈRE PHOTO ----
       Une galerie, c'est le trio style + catégorie + rendu d'UNE fiche
       (`cleDEnsemble`, la définition nº 278-§0). Sa première photo est
       celle que l'artiste a mise en tête — d'où `galerieOrdonnee`, le
       tri par `ordre` du formulaire, et jamais un tri à nous. */
    const parGalerie = new Map<string, PhotoTatoueur[]>();
    for (const photo of photos) {
      const cle = `${photo.tatoueur_id}·${cleDEnsemble(photo)}`;
      const liste = parGalerie.get(cle);
      const entree: PhotoTatoueur = {
        id: photo.id,
        style: photo.style,
        rendu: photo.rendu,
        nature: photo.nature,
        url: photo.url,
        miniature: photo.miniature,
        ordre: photo.ordre ?? 0,
        cree_le: photo.cree_le,
      };
      if (liste) liste.push(entree);
      else parGalerie.set(cle, [entree]);
    }

    /* ---- 5. LA NOTE DE CHAQUE GALERIE — le départage à cœurs égaux ---- */
    const popularite = await lirePopularite();
    const jour = jourCourant();
    const galeriesParStyle = new Map<string, GalerieDuStyle[]>();
    for (const [cle, membres] of parGalerie) {
      const ordonnees = galerieOrdonnee(membres);
      const premiere = ordonnees[0];
      if (!premiere) continue;
      const tatoueurId = cle.slice(0, cle.indexOf("·"));
      const tatoueurSlug = slugParFiche.get(tatoueurId) ?? "";
      //  L'ÂGE DE LA GALERIE : celui de sa photo LA PLUS RÉCENTE — la
      //  règle de `carrouselsDeLaFiche`, mot pour mot.
      const derniere = membres
        .map((photo) => photo.cree_le ?? null)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1);
      const galerie: GalerieDuStyle = {
        premiere,
        tatoueurSlug,
        note: scoreDuCarrousel({
          popularite: popularite.get(tatoueurSlug) ?? 0,
          ageJours: ageEnJours(derniere, jour),
          //  AUCUNE LOCALITÉ N'EST CHERCHÉE ICI : la proximité ne joue
          //  pas, et le facteur vaut 1 (voir `facteurDeProximite`).
          distanceKm: null,
          personnalisation: 0,
          photos: membres.length,
        }),
      };
      const liste = galeriesParStyle.get(premiere.style);
      if (liste) liste.push(galerie);
      else galeriesParStyle.set(premiere.style, [galerie]);
    }

    /* ---- 6. LES CŒURS DES SEULES PREMIÈRES PHOTOS ----
       ⚠️ UNE VUE, PAS LA TABLE : `favoris_photos` est privée (RLS de la
       migration nº 53) ; `coeurs_par_photo` n'en rend qu'un compte, qui
       ne nomme personne. Et elle peut ne pas exister : la lecture échoue
       alors, tout le monde est à zéro, et le départage par la note
       prend le relais — l'ordre tient. */
    const premieres = [...galeriesParStyle.values()]
      .flat()
      .map((galerie) => galerie.premiere.id);
    const coeursParPhoto = new Map<string, number>();
    if (premieres.length > 0) {
      const comptes = await supabase
        .from("coeurs_par_photo")
        .select("photo_id, coeurs")
        .in("photo_id", premieres);
      for (const ligne of (comptes.error
        ? []
        : (comptes.data ?? [])) as unknown as Array<{
        photo_id: string;
        coeurs: number | null;
      }>) {
        coeursParPhoto.set(ligne.photo_id, Number(ligne.coeurs ?? 0));
      }
    }

    /* ---- 7. UNE ENTRÉE PAR STYLE, PUIS L'ORDRE ---- */
    const entrees: StyleDuCatalogue[] = [];
    for (const [style, galeries] of galeriesParStyle) {
      const meilleure = [...galeries].sort((a, b) => {
        const coeursA = coeursParPhoto.get(a.premiere.id) ?? 0;
        const coeursB = coeursParPhoto.get(b.premiere.id) ?? 0;
        return (
          coeursB - coeursA ||
          b.note - a.note ||
          a.premiere.id.localeCompare(b.premiere.id)
        );
      })[0];
      entrees.push({
        slug: style,
        label: libelleStyle(style),
        artistes: artistesParStyle.get(style)?.size ?? 0,
        galeries: galeries.length,
        photo: {
          id: meilleure.premiere.id,
          url: meilleure.premiere.url,
          miniature: meilleure.premiere.miniature || meilleure.premiere.url,
          tatoueur: meilleure.tatoueurSlug,
          coeurs: coeursParPhoto.get(meilleure.premiere.id) ?? 0,
        },
      });
    }
    return entrees.sort(
      (a, b) => b.artistes - a.artistes || a.label.localeCompare(b.label)
    );
  } catch {
    //  Injoignable : pas de catalogue, et rien ne casse. La page qui
    //  l'appellera saura n'afficher aucune carte plutôt qu'une erreur.
    return [];
  }
}
