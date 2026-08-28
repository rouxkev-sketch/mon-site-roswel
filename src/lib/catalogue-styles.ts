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
//  §1 (nº 694) — la règle « en ligne » du site entier, posée sur une
//  lecture. Une seule écriture (voir sa note dans lib/tatoueurs).
import { listeEnLigne } from "@/lib/tatoueurs";

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
 *  · L'ORDRE (nº 634) : du compte le plus grand au plus petit ; À
 *    COMPTE ÉGAL, LE TOTAL DES FAVORIS DU STYLE, du plus grand au plus
 *    petit ; et à égalité de favoris, L'ORDRE ALPHABÉTIQUE DU NOM —
 *    le seul départage qui ne dépende ni de l'heure, ni du chemin de
 *    lecture, ni du hasard, et le seul qui garantisse que deux
 *    régénérations de l'accueil prérendu rangent les cartes pareil ;
 *  · À ÉGALITÉ DE CŒURS entre deux photos, LA NOTE DE LEUR GALERIE
 *    (popularité ÷ âge, la formule unique de `scoreDuCarrousel`,
 *    nº 283), puis la clé de la photo. Personne à zéro cœur n'est
 *    donc laissé sans ordre : voir la note du relevé plus bas.
 *    ⚠️ CETTE NOTE A CHANGÉ À LA nº 636 (vieillissement adouci, faveur
 *    de nouveauté de sept jours), ET LA CONSÉQUENCE EST DITE : entre
 *    deux galeries À ÉGALITÉ DE CŒURS, une galerie de moins d'une
 *    semaine peut désormais gagner la place de la photo là où elle la
 *    perdait. C'est cohérent — une carte de style qui montre une
 *    image fraîche n'est pas un défaut — et c'est le SEUL effet de la
 *    nº 636 ici : L'ORDRE DES STYLES, lui, ne dépend pas de cette note
 *    (portfolios, puis favoris du style, puis alphabet — nº 634).
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
 * La lecture 4 ne sert QU'À CHOISIR LA PHOTO.
 *
 * ██ ⚠️ DEUX COMPTES DE CŒURS DANS CETTE FONCTION, ET ILS NE DOIVENT
 * JAMAIS ÊTRE CONFONDUS (nº 634) ██
 * ------------------------------------------------------------------
 * Ils sortent de LA MÊME lecture (la nº 3) et ne comptent PAS la même
 * chose. Une passe future qui les mélangerait casserait l'un ou
 * l'autre sans que rien ne le dise :
 *  · LE CHOIX DE LA PHOTO ne regarde que LES PREMIÈRES PHOTOS des
 *    galeries — c'est la règle 1 du carrousel (nº 278), et elle n'a pas
 *    bougé : une carte ne montre que la photo de tête, il serait absurde
 *    d'élire une image que personne ne verra ;
 *  · LE DÉPARTAGE DES STYLES additionne LES CŒURS DE TOUTES LES PHOTOS
 *    du style — c'est la popularité du STYLE qu'on pèse, pas celle
 *    d'une image. Une galerie dont la deuxième photo fait tout le
 *    succès compte pour ce qu'elle vaut.
 * CE QUE LA nº 634 A CHANGÉ À LA LECTURE nº 3, ET RIEN D'AUTRE : elle
 * ne demandait que les cœurs des PREMIÈRES photos (`.in(photo_id, …)`),
 * elle rend maintenant la vue ENTIÈRE. Voir sa note, plus bas — c'est
 * toujours UNE seule lecture, et elle est plus sûre qu'avant.
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
  /** ██ §1 (nº 624) — LE COMPTE : DES GALERIES, PLUS DES ARTISTES ██
      C'est le nombre de CARTES que la recherche de ce style affichera
      — l'unité de la mosaïque depuis la nº 279 (`cleDuCarrousel`). La
      nº 620 comptait des artistes distincts, comme le menu
      « Explorer » ; les deux chiffres se contredisaient dès qu'un
      artiste avait deux galeries dans un style, et c'est le défaut que
      cette passe ferme — partout à la fois.
      ⚠️ CE CHAMP REMPLACE `artistes` ET `galeries` À LA FOIS : le
      compte étant devenu le nombre de galeries, les deux disaient la
      même chose. L'orphelin signalé à la nº 622 disparaît avec eux. */
  portfolios: number;
  /** ██ §1 (nº 634) — LE TOTAL DES FAVORIS DU STYLE ██
      La somme des cœurs de TOUTES SES PHOTOS — pas seulement celles de
      tête. C'est le SECOND critère de l'ordre, celui qui départage deux
      styles à nombre de portfolios égal.
      ⚠️ NE PAS LE CONFONDRE AVEC `photo.coeurs`, qui ne compte que la
      photo affichée sur la carte : d'où le nom, choisi long exprès. Le
      grand bloc en tête de fichier explique pourquoi les deux existent.
      ⚠️ IL N'EST PAS AFFICHÉ. La carte n'en montre rien (le texte est
      celui des nº 623 et nº 629) ; il voyage jusqu'à elle pour une
      seule raison, dite à la nº 634 : le propriétaire doit pouvoir
      vérifier l'ordre de ses yeux, et la carte le pose en attribut
      (`data-favoris-du-style`) — aucun pixel n'en dépend. */
  coeursDuStyle: number;
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

    /* ---- 1. LES FICHES EN LIGNE ----
       §1 (nº 694) — ET « EN LIGNE » VEUT DIRE `estEnLigne`, plus
       `publie` tout seul : sans quoi les photos d'un portfolio en
       suppression différée continuaient d'être comptées dans les
       nombres affichés. Même écriture que partout (`listeEnLigne`). */
    const fiches = await listeEnLigne<{ id: string; slug: string }>((verrous) =>
      supabase.from("tatoueurs").select(`id, slug, ${verrous}`)
    );
    const slugParFiche = new Map<string, string>();
    for (const ligne of fiches) {
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

    /* ---- 3. LE COMPTE EST CELUI DES GALERIES (§1 nº 624) ----
       IL N'Y A PLUS DE DÉNOMBREMENT SÉPARÉ : le compte d'un style EST
       le nombre de ses galeries, c'est-à-dire `galeriesParStyle` plus
       bas. La nº 620 comptait ici des `tatoueur_id` distincts — le
       chiffre du menu — et il ne disait pas la même chose que la
       mosaïque, qui affiche des carrousels (nº 279) : un artiste ayant
       deux galeries dans un style annonçait « 1 » et montrait deux
       cartes. On compte désormais ce qui s'affiche. */

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

    /* ---- 6. LES CŒURS DE TOUTES LES PHOTOS ----
       ⚠️ UNE VUE, PAS LA TABLE : `favoris_photos` est privée (RLS de la
       migration nº 53) ; `coeurs_par_photo` n'en rend qu'un compte, qui
       ne nomme personne. Et elle peut ne pas exister : la lecture échoue
       alors, tout le monde est à zéro, et le départage par la note
       prend le relais — l'ordre tient.

       ██ §1 (nº 634) — LA VUE ENTIÈRE, ET NON PLUS UNE LISTE D'IDENTIFIANTS ██
       ------------------------------------------------------------------
       POURQUOI ÉLARGIR : le départage des styles a besoin des cœurs de
       TOUTES les photos, pas seulement de celles de tête. Le choix de
       la photo, lui, ne regarde toujours que les premières — il lit
       simplement dans la même carte, qui est devenue plus grande (voir
       le bloc « DEUX COMPTES » en tête de fichier).
       POURQUOI SANS FILTRE, ET C'EST LE POINT DÉLICAT : la façon
       évidente aurait été d'allonger le `.in("photo_id", …)` d'avant.
       Elle nous aurait menés dans un mur. PostgREST met cette liste
       DANS L'ADRESSE : un identifiant pèse une quarantaine d'octets, et
       la liste passait déjà d'une par galerie à une par PHOTO — jusqu'à
       vingt fois plus (`PLAFOND_GALERIE`). Quelques centaines de photos
       suffisaient à dépasser la longueur d'adresse qu'un serveur
       accepte, et la lecture aurait échoué EN SILENCE (l'erreur est
       avalée trois lignes plus bas) : tous les styles à zéro cœur, et
       un ordre qui redevient alphabétique sans que rien ne le dise. On
       demande donc la vue TELLE QUELLE — une seule lecture, comme
       avant, et une adresse courte.
       ⚠️ ELLE NE PORTE QUE LES PHOTOS AIMÉES : une photo sans cœur n'y
       a pas de ligne. La vue est donc bien plus petite que la table des
       photos, et ce qui en revient et ne nous concerne pas (un flash,
       une fiche dépubliée) n'est jamais lu — on ne consulte cette carte
       que par les identifiants qu'on a déjà en main.
       ⚠️ LE PLAFOND EST ÉCRIT, ET IL EST HAUT : sans lui, la base en
       rendrait mille (le défaut de PostgREST) et le compte serait faux
       sans prévenir. Si le site en dépasse un jour la valeur, c'est le
       jour où ce catalogue devra demander une somme à la base plutôt
       que de l'additionner ici — et la note le dit d'avance. */
    const PLAFOND_LIGNES_COEURS = 50000;
    const coeursParPhoto = new Map<string, number>();
    {
      const comptes = await supabase
        .from("coeurs_par_photo")
        .select("photo_id, coeurs")
        .limit(PLAFOND_LIGNES_COEURS);
      for (const ligne of (comptes.error
        ? []
        : (comptes.data ?? [])) as unknown as Array<{
        photo_id: string;
        coeurs: number | null;
      }>) {
        coeursParPhoto.set(ligne.photo_id, Number(ligne.coeurs ?? 0));
      }
    }

    /* ---- 6 bis. LE TOTAL DES FAVORIS PAR STYLE (§1 nº 634) ----
       On additionne sur `photos` — la liste DÉJÀ filtrée : fiches en
       ligne, réalisations seules, styles connus. Le total d'un style ne
       peut donc contenir ni un flash, ni la photo d'une fiche retirée.
       ⚠️ C'EST LE SECOND CRITÈRE DE L'ORDRE, ET RIEN D'AUTRE : aucune
       carte ne l'affiche, aucun compte n'en dépend. */
    const coeursParStyle = new Map<string, number>();
    for (const photo of photos) {
      const coeurs = coeursParPhoto.get(photo.id) ?? 0;
      if (coeurs === 0) continue;
      coeursParStyle.set(
        photo.style,
        (coeursParStyle.get(photo.style) ?? 0) + coeurs
      );
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
        //  §1 (nº 624) — LE COMPTE EST LE NOMBRE DE GALERIES, donc le
        //  nombre de cartes que la recherche de ce style affichera.
        portfolios: galeries.length,
        //  §1 (nº 634) — le second critère de l'ordre, calculé au 6 bis.
        coeursDuStyle: coeursParStyle.get(style) ?? 0,
        photo: {
          id: meilleure.premiere.id,
          url: meilleure.premiere.url,
          miniature: meilleure.premiere.miniature || meilleure.premiere.url,
          tatoueur: meilleure.tatoueurSlug,
          coeurs: coeursParPhoto.get(meilleure.premiere.id) ?? 0,
        },
      });
    }
    /*  ██ §1 (nº 634) — TROIS CRITÈRES, DANS CET ORDRE ██
        1. LE NOMBRE DE PORTFOLIOS, du plus grand au plus petit — le
           premier critère n'a pas bougé depuis la nº 620 ;
        2. À NOMBRE ÉGAL, LE TOTAL DES FAVORIS DU STYLE (nº 634) :
           « Néo-japonais · 2 portfolios · 100 favoris » passe devant
           « Anime & Manga · 2 portfolios · 99 favoris » ;
        3. À FAVORIS ÉGAUX, L'ALPHABET — et il reste en DERNIER RECOURS
           par nécessité, pas par habitude. Deux styles que les deux
           premiers critères n'ont pas séparés sont vraiment
           indiscernables ; il faut alors un ordre qui ne dépende ni de
           l'heure, ni de l'ordre où la base a rendu ses lignes. Sans
           lui, l'accueil — qui est PRÉRENDU et régénéré toutes les cinq
           minutes — pourrait ranger ses cartes autrement d'une
           régénération à l'autre, et le propriétaire verrait le
           catalogue se remélanger tout seul. */
    return entrees.sort(
      (a, b) =>
        b.portfolios - a.portfolios ||
        b.coeursDuStyle - a.coeursDuStyle ||
        a.label.localeCompare(b.label)
    );
  } catch {
    //  Injoignable : pas de catalogue, et rien ne casse. La page qui
    //  l'appellera saura n'afficher aucune carte plutôt qu'une erreur.
    return [];
  }
}
