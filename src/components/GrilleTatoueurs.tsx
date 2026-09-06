"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { ClavierCartes } from "@/components/ClavierCartes";
import { FenetreFiche } from "@/components/FenetreFiche";
import { positionSousLeGel } from "@/lib/gel-du-corps";
import { PileFiches } from "@/components/PileFiches";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { reposerLaCarteDuHaut } from "@/lib/carte-du-haut";
import { ficheComplete, ficheCompleteImmediate } from "@/lib/fiche-complete";
import {
  useDispositionGrille,
  useVuePhototheque,
} from "@/components/AffichageMosaique";
import type { Tatoueur } from "@/lib/tatoueurs";
//  §1 (nº 438) — la fermeture passe par history.back() : elle se
//  déclare, pour que le rattrapage du filet ne la prenne jamais pour
//  un atterrissage accidentel au fond de la pile.
import { annoncerRepriseDuSite } from "@/lib/navigation-session";
//  §3 (nº 878) — la marque du cran du retour : quand l'entrée courante
//  EST le cran, la fenêtre le remplace au lieu de s'empiler dessus.
import { MARQUE_DU_CRAN } from "@/lib/bas-de-la-pile";
//  §1 (nº 660) — la trace permanente : ce défilement se signe.

/** UN PIXEL TRANSPARENT — ce qu'une image lointaine porte à la place
    de sa source (nº 224-§4). Une chaîne, aucune requête réseau. */
const PIXEL_VIDE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * LA GRILLE DES TATOUEURS — et sa fenêtre de fiche
 * =================================================
 * La même grille sert l'accueil et les pages style + ville. Sur grand
 * écran (≥ 1024 px), cliquer une carte OUVRE LA FENÊTRE par-dessus la
 * grille (mécanique d'Instagram) au lieu de naviguer ; sur smartphone,
 * le clic navigue vers la page complète, comme avant.
 *
 * L'ADRESSE SUIT LA FENÊTRE : à l'ouverture, `pushState` écrit
 * /artist/nom dans la barre du navigateur (partage possible) — Next
 * sait lire ces pushState natifs. La fenêtre n'est montrée QUE tant
 * que l'adresse correspond : refermer, c'est faire machine arrière
 * dans l'historique, et le bouton « précédent » du navigateur referme
 * donc naturellement. Un rechargement sur /artist/nom sert la vraie
 * page — le référencement ne voit jamais la fenêtre.
 *
 * Le drapeau `data-fenetre-fiche` posé sur <html> prévient
 * DefilementEnHaut : ce changement d'adresse ne doit PAS remonter la
 * grille en haut de page. La fenêtre retire le drapeau en s'effaçant.
 *
 * LE RECHARGEMENT SURVIT (sessionStorage) : chaque ouverture note d'où
 * elle part (adresse de la grille + défilement), chaque fermeture
 * efface la note. Recharger pendant qu'une fenêtre est ouverte sert la
 * page de fiche, qui lit la note (RetourFenetreFiche) et REVIENT ici
 * avec ?fenetre=<slug> : la grille rouvre alors la fenêtre, rend le
 * défilement, et nettoie l'adresse — recherche et retour arrière
 * intacts.
 */
/**
 * COMBIEN DE CARTES CHARGER EN PRIORITÉ ?
 * ========================================
 * Celles qu'on voit SANS DÉFILER, et pas une de plus : chaque image
 * déclarée prioritaire prend de la bande passante à celle que Google
 * mesure vraiment.
 *
 * La grille fait 2 colonnes au doigt, 3 dès 768 px, 4 dès 1280, puis
 * 5 et 6 sur les très grands écrans. Une carte fait une image 4:5 plus
 * deux lignes de texte : sur un écran d'ordinateur, la première rangée
 * tient à l'écran ; sur un téléphone, les deux premières rangées de
 * deux cartes.
 * QUATRE couvre donc les deux cas — la rangée entière jusqu'à 4
 * colonnes, et les quatre premières vignettes au doigt. Au-delà, on
 * précharge des images que personne ne regarde encore.
 */
const CARTES_PRIORITAIRES = 4;

/**
 * LA GRILLE DES CARTES — L'ÉCRITURE, EN UN SEUL ENDROIT (nº 249-§4)
 * ==================================================================
 * « Ma sélection » recopiait les colonnes de la mosaïque mais PAS ses
 * gouttières de smartphone : ses cartes gardaient 16 px d'écart là où
 * la recherche colle les siennes bord à bord (2 px, le rythme
 * Instagram de la grille au doigt), et les deux pages divergeaient —
 * le défaut qui a coûté trois passes sur le verre. Les deux morceaux
 * sont donc NOMMÉS ici, et la mosaïque comme « Ma sélection » les
 * consomment : il n'existe plus de seconde écriture.
 */
/**
 * ██ §1 (nº 472) — QUATRE PHOTOS PAR RANGÉE, AU MAXIMUM ██
 * ------------------------------------------------------------------
 * CE QUI ÉTAIT ÉCRIT, ET CE QUE LE RELEVÉ nº 471 A MONTRÉ : quatre
 * colonnes dès « xl », cinq dès « 2xl », six dès « 3xl » — cela
 * faisait RÉTRÉCIR
 * les photos à mesure que l'écran grandissait — la largeur du site
 * est plafonnée à 1760 px (LARGEUR_SITE) pendant que la grille
 * ajoutait des colonnes : 397 px par photo à 1279 px de fenêtre,
 * 293 px à 1280, 282 px à 1536, 253 px à 1664. Le maximum absolu du
 * site tombait à 269 px, atteint dès 1760 px et jamais dépassé.
 * LA RÈGLE DU PROPRIÉTAIRE : deux colonnes au doigt (inchangé), TROIS
 * jusqu'à 1439 px, QUATRE au-delà — plus jamais cinq ni six. Le
 * palier de 1440 px est le `grille:` nommé dans globals.css (90 rem).
 * ⚠️ CETTE LIGNE A UNE JUMELLE : `PALIERS_COLONNES`
 * (lib/colonnes-mosaique) dit au SERVEUR combien de cartes servir.
 * Les deux doivent bouger ENSEMBLE, sans quoi la dernière rangée
 * redevient incomplète (nº 226-§1).
 */
/*  §1 (nº 473) — LA CINQUIÈME COLONNE REVIENT, À 1600 px ET PAS
    AVANT (`grille5`, 100 rem — globals.css). Le plafond de quatre de
    la nº 472 est levé d'un cran, jamais de deux : six colonnes ne
    reviennent pas. */
export const COLONNES_MOSAIQUE =
  "grid-cols-2 md:grid-cols-3 grille:grid-cols-4 grille5:grid-cols-5";
/** Le socle : gouttières web, marges de bord au doigt. */
export const SOCLE_GRILLE_CARTES = "grid gap-4 sm:gap-5 mobile:-mx-4";
/** Les gouttières du smartphone en deux colonnes — le rythme
    Instagram : 2 px entre colonnes.
    ⚠️ JAMAIS superposées à une autre gouttière `mobile:` : deux
    classes `gap` en conflit se départagent à l'ordre de la FEUILLE,
    pas du className — la grille choisit UNE écriture par état. */
export const GOUTTIERES_DEUX_COLONNES = "mobile:gap-x-[2px] mobile:gap-y-4";
/** La grille standard, entière — cartes en deux colonnes au doigt. */
export const CLASSES_GRILLE_CARTES = `${SOCLE_GRILLE_CARTES} ${GOUTTIERES_DEUX_COLONNES} ${COLONNES_MOSAIQUE}`;

/**
 * ██ §1 (nº 841) — LE FIL DES RÉSULTATS, AU DOIGT ██
 * ------------------------------------------------------------------
 * Sur un vrai mobile, LES RÉSULTATS DE RECHERCHE ne sont plus la grille
 * de deux colonnes façon Instagram (nº 443) mais un FIL : UNE carte par
 * rangée, pleine largeur (le socle saigne déjà jusqu'aux bords,
 * `mobile:-mx-4`), les rangées détachées de 24 px — la gouttière que la
 * pleine largeur d'hier s'était donnée (nº 398, « le cran au-dessous
 * dans l'échelle »). L'interstice de deux pixels des colonnes n'a plus
 * lieu d'être : il n'y a plus qu'une colonne.
 * ⚠️ CES DEUX ÉCRITURES NE VALENT QUE POUR CETTE GRILLE — celle des
 * résultats. « Ma sélection » consomme `CLASSES_GRILLE_CARTES` (juste
 * au-dessus) et garde ses deux colonnes, au pixel.
 * ⚠️ `mobile:grid-cols-1` REMPLACE `grid-cols-2` sur l'appareil — une
 * seule valeur à la fois, jamais deux empilées (piège nº 389) : c'est la
 * variante d'appareil qui tranche (règle nº 60), pas une largeur.
 */
export const COLONNE_UNIQUE_DU_FIL = "mobile:grid-cols-1";
/**
 * ██ §3 (nº 876) — LA GOUTTIÈRE D'UN FIL, AUX DEUX APPAREILS ██
 * ------------------------------------------------------------------
 * Vingt-quatre pixels entre deux cartes d'un fil. Le FIL DE GALERIES
 * (FilDeGalerie) est un fil sur les DEUX appareils depuis cette passe
 * — au web, une carte par rangée, pleine largeur dans les marges — et
 * sa liste (une colonne de flexion, sans autre gouttière) lit cette
 * écriture-ci, nue.
 * ⚠️ SA JUMELLE SOUS LE PRÉFIXE D'APPAREIL, JUSTE DESSOUS : la grille
 * des RÉSULTATS porte déjà ses gouttières web (`gap-4 sm:gap-5`, le
 * socle) et n'a le fil qu'au doigt ; lui donner la valeur nue y
 * poserait deux classes pour une même propriété (piège nº 389). Les
 * deux chaînes disent LE MÊME NOMBRE — une copie nommée, comme celle
 * du squelette (nº 710) —, et le banc 876 les garde d'accord : la
 * gouttière mesurée entre deux cartes du fil de galeries au web vaut
 * celle entre deux cartes des résultats au doigt.
 */
export const GOUTTIERE_DU_FIL = "gap-y-6";
export const GOUTTIERE_DU_FIL_AU_DOIGT = "mobile:gap-y-6";

export function GrilleTatoueurs({
  tatoueurs,
  styleRecherche = "",
  renduRecherche = "",
  natureRecherche = "",
  estompee = false,
}: {
  tatoueurs: Tatoueur[];
  /** Le style demandé dans le moteur — les cartes montrent SA photo. */
  styleRecherche?: string;
  /** LE RENDU demandé (noir et gris, ou couleur), quand la recherche
      n'en laisse qu'un allumé : les cartes montrent une photo qui y
      correspond, et la fenêtre s'ouvre dessus. */
  renduRecherche?: string;
  /** LA CATÉGORIE demandée — elle décide, avec le style et le rendu,
      de la photo que chaque carte met en avant (nº 216-§1). */
  natureRecherche?: string;
  /** §2 (nº 395) — CE QUE LA CARTE ÉCRIT SUR SA PREMIÈRE LIGNE : le
      nom de l'artiste (défaut, partout) ou le style de la photo
      montrée. La grille ne tranche pas — voir la note au passage de la
      propriété, plus bas. */
  /** Vrai pendant une recherche : la grille s'estompe. */
  estompee?: boolean;
}) {
  const pathname = usePathname();
  /** La disposition mobile (deux colonnes / une image par ligne) —
      celle de L'ADRESSE (nº 203-§1b), servie par le serveur. */
  const disposition = useDispositionGrille();
  /** LA VUE PHOTOTHÈQUE (nº 140) — les images pures. Indépendante de
      la disposition : les deux se combinent librement. */
  const phototheque = useVuePhototheque();
  /**
   * LA CARTE QU'ON REGARDE SURVIT À LA BASCULE DE DISPOSITION.
   * Le bouton a noté laquelle occupait le haut de l'écran ; ici, la
   * nouvelle disposition vient d'être calculée mais pas encore peinte
   * (`useLayoutEffect`) : on repose la page sur cette même carte, et
   * l'œil ne voit aucun saut. Sans note — premier rendu, page en
   * haut — il ne se passe rien.
   *
   * ⚠️ ET LA PHOTOTHÈQUE AUSSI (nº 154-§6B) — c'était le défaut : cet
   * effet ne se rejouait QUE sur `disposition`. Or le bouton du texte
   * des cartes note lui aussi la carte du haut (MoteurTatouage) et
   * change autant leur hauteur — la note était prise, jamais reposée.
   * La page gardait sa position en pixels, les cartes remontaient, et
   * on ne retrouvait pas celle qu'on regardait. Les deux bascules
   * passent désormais par la même remise en place.
   */
  /**
   * ⚠️ LA RECOMPOSITION SE JOUE SOUS VERROU (passe nº 162-§2), et non
   * plus en fondu posé après coup (nº 159-§2).
   *
   * CE QUI NE MARCHAIT PAS. Le fondu s'appliquait ICI, dans cet effet
   * — donc APRÈS que le magasin ait notifié et que React ait rendu.
   * Entre le clic et cette ligne, le navigateur avait le droit de
   * peindre : trois fois sur quatre il le faisait au mauvais moment, et
   * on voyait la page s'effondrer (docH 11874 → 3505 en une image). Le
   * fondu cachait le symptôme ; il n'empêchait pas la COURSE.
   *
   * CE QUE FAISAIT LA nº 162, ET POURQUOI IL N'EN RESTE RIEN. Le
   * bouton appelait alors `basculerSansSaut` : elle posait le verrou à
   * la main sur <html> — sans rendu, donc sans occasion de peindre —
   * puis faisait le changement en `flushSync`, dans la MÊME TÂCHE que
   * le clic. La nº 443 a supprimé le bouton lui-même en ramenant les
   * cartes à UNE SEULE mise en page : plus de bascule, plus de course
   * à verrouiller. Le module est resté sans appelant jusqu'à sa
   * suppression à la nº 603.
   *
   * CET EFFET RESTE LE FILET : une disposition qui changerait sans
   * passer par les boutons (restauration du magasin, autre onglet)
   * repose quand même la page sur sa carte.
   *
   * ⚠️ JAMAIS AU PREMIER RENDU : une mosaïque qui bougerait à chaque
   * arrivée serait un défaut, pas une correction.
   */
  //  Sans tableau de dépendances : à CHAQUE rendu.
  useEffect(() => {
  });

  /**
   * §4 (nº 224) — LES IMAGES TRÈS LOINTAINES RENDENT LEUR SOURCE
   * ==================================================================
   * DEUXIÈME LEVIER, après `content-visibility` (voir CarteTatoueur).
   * Une image DÉCODÉE pèse en mémoire même quand elle n'est pas
   * peinte ; à cent cartes, c'est ce qui reste et ce qui tue l'onglet.
   * Au-delà de DEUX ÉCRANS de distance, la carte rend donc sa source
   * à un substitut d'un pixel transparent — et la reprend quand elle
   * revient. Le navigateur libère alors ce qu'il avait décodé.
   *
   * ⚠️ UN SEUL OBSERVATEUR POUR TOUTE LA MOSAÏQUE, et c'est la
   * contrainte du propriétaire : « à 100 cartes, le nombre
   * d'observateurs vivants doit être borné, pas proportionnel ». Un
   * `IntersectionObserver` observe N éléments sans coûter N
   * observateurs. Il se déconnecte au démontage et à chaque
   * changement de la liste — jamais deux vivants à la fois.
   *
   * ⚠️ IL NE TOUCHE QU'À `src`, ET JAMAIS À LA MISE EN PAGE. La
   * hauteur de l'image est réservée par son cadre (`aspect-4/5`) et
   * par ses dimensions déclarées : rendre la source ne fait donc
   * bouger AUCUN pixel — c'est ce qui le rend compatible avec le §3.
   *
   * ⚠️ ÉCRIT DIRECTEMENT DANS LE DOM, sans état React : un état par
   * carte redonnerait un rendu par carte, c'est-à-dire exactement le
   * coût qu'on cherche à supprimer. La vraie source est mise de côté
   * dans `dataset.source`, et React ne la réécrit qu'au prochain
   * rendu de la carte — qui la rétablit, ce qui est sans danger.
   */
  const zoneGrille = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grille = zoneGrille.current;
    if (!grille || typeof IntersectionObserver === "undefined") return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          const carte = entree.target as HTMLElement;
          for (const image of carte.querySelectorAll("img")) {
            if (entree.isIntersecting) {
              //  ELLE REVIENT : on lui rend sa source.
              const gardee = image.dataset.source;
              if (gardee) {
                image.src = gardee;
                delete image.dataset.source;
              }
              continue;
            }
            //  ELLE S'ÉLOIGNE : on met sa source de côté, et on pose
            //  un pixel transparent à la place.
            const source = image.getAttribute("src") ?? "";
            if (!source || source === PIXEL_VIDE) continue;
            image.dataset.source = source;
            image.src = PIXEL_VIDE;
          }
        }
      },
      //  DEUX ÉCRANS DE PART ET D'AUTRE : on ne libère que ce qui est
      //  franchement loin, et on recharge bien avant que ça revienne.
      { root: null, rootMargin: "200% 0px" }
    );
    for (const carte of grille.querySelectorAll("[data-carte]")) {
      observateur.observe(carte);
    }
    return () => {
      observateur.disconnect();
    };
    //  LA LISTE DES CARTES CHANGE À CHAQUE « VOIR PLUS » : l'observateur
    //  est refait, jamais empilé (le nettoyage passe avant).
  }, [tatoueurs]);

  /**
   * ██ §1 (nº 841) — L'APPROCHE D'UNE CARTE DU FIL, UN SEUL OBSERVATEUR ██
   * ------------------------------------------------------------------
   * La consigne du propriétaire, en trois temps : la première photo
   * seule au chargement ; la SUIVANTE quand on approche ; jamais le
   * portfolio entier. Cet observateur est le second temps : quand une
   * carte arrive À MOINS D'UN ÉCRAN (une hauteur de fenêtre au-dessus
   * comme au-dessous), elle est notée « approchée » — pour toujours :
   * ce qui a été chargé le reste, et une carte qui s'éloigne ne perd
   * rien (la mémoire des images, c'est l'observateur du dessus qui la
   * tient, à deux écrans). La carte passe le drapeau à son carrousel,
   * qui monte alors la deuxième photo sans la différer.
   * ⚠️ UN SEUL OBSERVATEUR POUR TOUTES LES CARTES (la règle de la
   * nº 224-§4 : « borné, pas proportionnel »), refait à chaque « Voir
   * plus », jamais empilé. ⚠️ AU DOIGT SEULEMENT (l'appareil, jamais la
   * largeur — règle nº 60) : sur le web, la structure du fil est
   * masquée et sa deuxième photo, montée sans boîte, PARTIRAIT quand
   * même si on la marquait « sans attendre » — donc on ne marque rien.
   * ⚠️ LA CLÉ EST CELLE DE LA CARTE (`data-carte`, la même que React) :
   * un ensemble de clés, et une carte ne se rend de nouveau que si SA
   * clé y entre — les autres, mémorisées, ne bougent pas.
   */
  const [approchees, setApprochees] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const grille = zoneGrille.current;
    if (!grille || typeof IntersectionObserver === "undefined") return;
    if (document.documentElement.dataset.appareil !== "mobile") return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const nouvelles: string[] = [];
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          const cle = (entree.target as HTMLElement).dataset.carte;
          if (cle) nouvelles.push(cle);
        }
        if (!nouvelles.length) return;
        setApprochees((eues) => {
          if (nouvelles.every((cle) => eues.has(cle))) return eues;
          return new Set([...eues, ...nouvelles]);
        });
      },
      { root: null, rootMargin: "100% 0px" }
    );
    for (const carte of grille.querySelectorAll("[data-carte]")) {
      observateur.observe(carte);
    }
    return () => observateur.disconnect();
  }, [tatoueurs]);

  const premiereDisposition = useRef(true);
  useEffetAvantPeinture(() => {
    if (premiereDisposition.current) {
      premiereDisposition.current = false;
      return;
    }
    reposerLaCarteDuHaut();
  }, [disposition, phototheque]);

  const [ficheOuverte, setFicheOuverte] = useState<Tatoueur | null>(null);
  /** §2 (nº 371) — LA PHOTO SUR LAQUELLE LA FENÊTRE DOIT S'OUVRIR :
      celle que la carte affichait au clic. La fenêtre sait déjà la
      lire (`photoRecherche`, FenetreFiche → `ouvertureSurUnePhoto`) —
      personne ne la lui donnait. Elle est posée AVANT la fenêtre, donc
      la première image peinte est déjà la bonne : jamais la photo 1
      puis un saut à la 6. */
  const [photoOuverte, setPhotoOuverte] = useState("");
  /**
   * COMBIEN DE FOIS UNE FENÊTRE A ÉTÉ OUVERTE (passe nº 220-§3)
   * ------------------------------------------------------------------
   * LE DÉFAUT : on ouvre une carte, on défile jusqu'à la photo 18 sur
   * 20, on referme, on rouvre la MÊME carte — et l'on retombe sur
   * 18/20. La cause tient en un mot : la clé. Elle valait l'identifiant
   * de la fiche ; refermer ne fait que passer `tatoueur` à `null` (la
   * fenêtre rend alors `null`), le composant n'est jamais démonté, et
   * rouvrir la même fiche lui rend donc son état — l'indice de photo
   * compris.
   * Ce compteur entre dans la clé : chaque OUVERTURE est une fenêtre
   * neuve, qui repart de la première photo. Deux fiches différentes
   * changeaient déjà de clé ; c'est le cas « la même, deux fois » qui
   * manquait.
   * ⚠️ IL NE TOUCHE À RIEN D'AUTRE. La position dans la MOSAÏQUE vit
   * ailleurs (`positionGrille`, capturée au clic et rendue à la
   * fermeture) : elle continue d'être restituée exactement comme avant.
   */
  const [ouvertures, setOuvertures] = useState(0);
  // La position de la grille AU MOMENT DU CLIC : c'est elle que la
  // fenêtre fige puis restitue. Capturée ici, AVANT le pushState —
  // après lui, le routeur peut déplacer brièvement le défilement.
  const [positionGrille, setPositionGrille] = useState(0);
  /**
   * ██ §1 (nº 745) — LA COLONNE ATTEND LA FICHE COMPLÈTE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT, filmé au banc (base lente) : la fenêtre s'ouvrait avec
   * la fiche DE LA CARTE — celle du moteur de recherche, qui ne
   * construit ni `booking`, ni `dm_instagram`, ni la page de liens
   * (voir `jsonb_build_object` de rechercher_tatoueurs). La colonne
   * peignait donc « Instagram » en première case… puis la fiche
   * complète arrivait (~1 s) et la case « Booking » S'INSÉRAIT DEVANT :
   * Instagram sautait de x=871 à x=1051 sous les yeux — le
   * réarrangement relevé par le propriétaire.
   * LA RÈGLE, DÉSORMAIS : la colonne ne montre RIEN de la fiche
   * partielle. Faux tant que la complète n'est pas là, ce drapeau fait
   * afficher à la fenêtre son HABILLAGE D'ATTENTE (neutre — le contenu
   * d'un profil varie trop pour un squelette fidèle, décision du
   * propriétaire) ; tout se pose ensuite EN UNE FOIS.
   * ⚠️ CACHE CHAUD (survol assez long, réouverture) : l'ouverture se
   * fait DIRECTEMENT avec la complète (`ficheCompleteImmediate`), le
   * drapeau naît vrai — aucun habillage ne clignote.
   * ⚠️ LA PHOTO, ELLE, N'ATTEND PAS : la galerie de la carte est déjà
   * là, c'est la continuité visuelle de la nº 371.
   */
  const [contenuPret, setContenuPret] = useState(true);
  /** Le slug dont la colonne attend la fiche complète : une réponse
      qui arrive pour une AUTRE fiche (fermée entre-temps, remplacée)
      ne lève pas le drapeau de celle qui s'affiche. */
  const slugEnAttente = useRef<string | null>(null);

  /** COMBIEN DE FICHES SONT EMPILÉES PAR-DESSUS la fenêtre de base
      (nº 226-§5) — remonté par PileFiches : un membre d'équipe ouvert
      depuis la fenêtre change l'adresse, et la fenêtre de base ne
      doit pas se fermer pour autant. */
  const [profondeurPile, setProfondeurPile] = useState(0);
  /** §5 (nº 328) — CETTE GRILLE A-T-ELLE POUSSÉ L'ENTRÉE ? (point 7
      de la règle — voir `fermer`.)
      ⚠️ §3 (nº 878) — CE DRAPEAU NE DÉCIDE PLUS DE LA FERMETURE : c'est
      L'ENTRÉE COURANTE qui répond désormais (voir `fermer`). Il reste
      la trace de l'ouverture pour le reste du fichier. */
  const entreePoussee = useRef(false);

  // La fenêtre ne vit que si l'adresse est la sienne : le bouton
  // « précédent » (l'adresse redevient celle de la grille) ou une
  // recherche depuis la barre la referment sans autre mécanique.
  //  ⚠️ SAUF quand des fiches sont EMPILÉES dessus (nº 226-§5) :
  //  l'adresse est alors celle du dessus de la pile, et la fenêtre de
  //  base reste montée dessous — son contenu, sa position de colonne
  //  et son gel du corps l'attendent au retour.
  const visible =
    ficheOuverte !== null &&
    (pathname === `/artist/${ficheOuverte.slug}` || profondeurPile > 0);

  /*  ⚠️ STABLE D'UN RENDU À L'AUTRE (nº 219-§1) : c'est ce qui permet
      aux cartes d'être mémorisées. Elle ne lit aucune valeur du rendu —
      seulement l'argument reçu et deux poseurs d'état, eux-mêmes
      constants. */
  const ouvrir = useCallback((tatoueur: Tatoueur, photoRegardee = "") => {
    // La note de rechargement : d'où l'on part (adresse de la grille,
    // critères compris — chercher() la tient à jour) et où l'on en
    // était. Elle ne sert QUE si la page est rechargée fenêtre ouverte
    // — toute fermeture propre l'efface (voir plus bas).
    try {
      const note: ContexteFenetreFiche = {
        slug: tatoueur.slug,
        retour: window.location.pathname + window.location.search,
        //  §2 (nº 328) — SOUS LE GEL, jamais brute (point 4 de la
        //  règle). Ici le corps n'est normalement pas gelé — une
        //  carte de la mosaïque ne se touche pas sous un voile —
        //  mais la règle ne souffre pas d'exception locale : deux
        //  façons de lire une position, c'est deux vérités.
        defilement: positionSousLeGel(),
      };
      sessionStorage.setItem(CLE_FENETRE_FICHE, JSON.stringify(note));
    } catch {
      // Stockage indisponible : le rechargement servira la page
      // complète, comme avant — jamais bloquant.
    }
    setPositionGrille(positionSousLeGel());
    //  Une ouverture de plus : la fenêtre qui suit est une fenêtre
    //  NEUVE (voir la clé plus bas).
    setOuvertures((n) => n + 1);
    // Le drapeau AVANT le pushState : DefilementEnHaut le lit au
    // moment où l'adresse change.
    document.documentElement.setAttribute("data-fenetre-fiche", "1");
    /**
     * §2 (nº 279) — CE QUE L'OUVERTURE FAIT À L'HISTORIQUE : elle
     * AJOUTE UNE ENTRÉE (`pushState`), que la fermeture consomme
     * (`history.back()`, plus bas). C'est le même compte que sur
     * smartphone, où la carte est un vrai lien : une carte ouverte =
     * une entrée, un retour = la mosaïque, à sa place.
     * ⚠️ ET L'ADRESSE POUSSÉE PORTE LES TAGS DU CARROUSEL depuis cette
     * passe : sans eux, recharger la page fenêtre ouverte (ou coller
     * l'adresse) rouvrait TOUT le style — la règle 3 tombait au
     * premier F5. L'adresse dit maintenant exactement ce qu'on
     * regarde, et c'est la même que celle du lien du smartphone.
     */
    /*  §2 (nº 371) — ET LA PHOTO REGARDÉE VOYAGE AVEC LES TAGS, dans
        LA MÊME et UNIQUE entrée d'historique : c'est un paramètre de
        plus dans l'adresse poussée, pas une seconde poussée (règle
        332-§1). Recharger la page fenêtre ouverte, ou coller
        l'adresse, rouvre donc exactement la photo qu'on regardait —
        et le retour la referme toujours d'un seul appui (332-§4). */
    const tags = tatoueur.carrousel;
    const parametres = new URLSearchParams();
    if (tags) {
      parametres.set("style", tags.style);
      parametres.set("rendu", tags.rendu);
      parametres.set("nature", tags.nature);
    }
    if (photoRegardee) parametres.set("photo", photoRegardee);
    const requete = parametres.toString();
    const adresseDeLaFenetre = `/artist/${tatoueur.slug}${
      requete ? `?${requete}` : ""
    }`;
    /**
     * ██ §3 (nº 878) — LA FENÊTRE REMPLACE LE CRAN QUAND ELLE S'OUVRE
     * DESSUS ██
     * ==================================================================
     * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE ET REPRODUIT À LA SONDE 878
     * (recherche → carte → fenêtre → clic à côté) :
     *   · le retour ne faisait rien au premier appui, et marchait au
     *     second ;
     *   · l'avance ne rouvrait pas la fiche.
     * CE QUE LA SONDE A MONTRÉ, ÉTAPE PAR ÉTAPE : la pile portait
     * [recherche, CRAN(même adresse), fiche]. Le cran est l'entrée sans
     * adresse du filet de retour (`RetourGaranti`, nº 335), posée au
     * PREMIER APPUI FRANC — souvent le clic même qui ouvre la fenêtre.
     * Fermer revenait donc sur le CRAN : même adresse, rien à l'écran
     * qui bouge ; le retour suivant atteignait la recherche (« il ne
     * fait rien la première fois »), et l'avance retombait sur le cran
     * au lieu de la fiche.
     * LA CORRECTION, MINIMALE : quand l'entrée sur laquelle on se tient
     * EST ce cran, la fenêtre le REMPLACE (`replaceState`) au lieu de
     * pousser par-dessus. La pile redevient [recherche, fiche] : une
     * fenêtre = UNE entrée (règle 332-§1), fermer la retire, le retour
     * rend la recherche du premier appui, et l'avance rouvre la fiche.
     * ⚠️ CE QUE CELA COÛTE, ET JE LE DIS : le cran est CONSOMMÉ par la
     * fenêtre. Sur une arrivée sans rien derrière (lien partagé, onglet
     * neuf), un retour APRÈS avoir ouvert puis fermé une fiche sort donc
     * du site — le filet ne se repose pas, la pile ayant grandi
     * (`aucunePageDuSiteDerriere`). C'est le prix de l'appariement
     * demandé, et il ne se paie que dans ce cas-là : le cran garde son
     * office entier tant qu'aucune fenêtre ne s'ouvre.
     * ⚠️ LA FERMETURE NE CHANGE PAS D'UNE LIGNE : elle consomme ce
     * qu'elle a créé (`entreePoussee`, `history.back()`) — remplacer ou
     * pousser, l'entrée du dessous est la même page.
     */
    const etatCourant = window.history.state as Record<string, unknown> | null;
    const surLeCran =
      Boolean(etatCourant?.[MARQUE_DU_CRAN]) &&
      !etatCourant?.fenetreFiche &&
      !etatCourant?.fenetreCarrousel;
    if (surLeCran) {
      window.history.replaceState({ fenetreFiche: true }, "", adresseDeLaFenetre);
    } else {
      window.history.pushState({ fenetreFiche: true }, "", adresseDeLaFenetre);
    }
    entreePoussee.current = true;
    setPhotoOuverte(photoRegardee);
    /*  §1 (nº 745) — DÉJÀ EN CACHE ? L'ouverture est alors complète du
        premier rendu : ni deux-temps, ni habillage d'attente. Le
        carrousel de la CARTE est reporté (règle nº 279, ci-dessous). */
    const dejaComplete = ficheCompleteImmediate(tatoueur.slug);
    if (dejaComplete) {
      slugEnAttente.current = null;
      setFicheOuverte({ ...dejaComplete, carrousel: tatoueur.carrousel ?? null });
      setContenuPret(true);
      return;
    }
    slugEnAttente.current = tatoueur.slug;
    setFicheOuverte(tatoueur);
    setContenuPret(false);
    // LE PORTFOLIO ENTIER ARRIVE JUSTE APRÈS — la fenêtre est déjà
    // ouverte, avec sa photo. On ne remplace la fiche que si c'est
    // toujours celle-là qui est affichée.
    void ficheComplete(tatoueur.slug).then((complete) => {
      /*  §1 (nº 745) — LA COLONNE SE MONTRE dans les deux issues : la
          complète est arrivée (elle se pose en une fois), ou la
          demande a échoué (base injoignable — la fiche partielle vaut
          mieux qu'une attente sans fin). Mais SEULEMENT si c'est
          encore CETTE fiche que la fenêtre attend : la réponse d'une
          fiche fermée entre-temps ne parle pas pour la suivante. */
      if (slugEnAttente.current === tatoueur.slug) {
        slugEnAttente.current = null;
        setContenuPret(true);
      }
      if (!complete) return;
      setFicheOuverte((courante) =>
        courante && courante.slug === complete.slug
          ? //  §2 (nº 279) — LE CARROUSEL SURVIT À L'ARRIVÉE DE LA
            //  FICHE COMPLÈTE. Celle-ci apporte TOUT le portfolio (il
            //  faut bien, pour l'onglet Portfolio) mais ne sait rien
            //  du carrousel qu'on regarde : sans ce report, la fenêtre
            //  changeait de clé et rouvrait le style entier une demi-
            //  seconde après l'ouverture.
            { ...complete, carrousel: courante.carrousel ?? null }
          : courante
      );
    });
  }, []);

  /** Le survol suffit à la demander : au clic, elle est déjà là. */
  const precharger = useCallback((tatoueur: Tatoueur) => {
    if (document.documentElement.dataset.appareil === "mobile") return;
    void ficheComplete(tatoueur.slug);
  }, []);

  // Machine arrière : l'adresse de la grille revient, et `visible`
  // retombe tout seul. (Stable d'un rendu à l'autre : la fenêtre s'en
  // sert dans un effet qui ne doit tourner qu'une fois par ouverture.)
  const fermer = useCallback(() => {
  /**
   * §5 (nº 328) — UNE FERMETURE NE CONSOMME QUE CE QU'ELLE A CRÉÉ.
   * ------------------------------------------------------------------
   * C'est le POINT 7 de la règle (lib/navigation-session). `fermer`
   * faisait `history.back()` SANS CONDITION — or l'entrée n'existe que
   * si c'est bien CETTE surface qui l'a poussée. Sur smartphone,
   * l'ouverture passe par un `<Link>` ordinaire et ne pousse rien
   * d'ici : une fermeture consommerait alors l'entrée du dessous, et
   * l'on reculerait d'un cran de trop.
   * ⚠️ UN DRAPEAU, PAS UN TEST D'APPAREIL. « Ai-je poussé ? » est la
   * question exacte ; « suis-je sur un mobile ? » n'en est qu'un
   * indice, et il serait faux le jour où une largeur change d'avis.
   *
   * ██ §3 (nº 878) — ET C'EST L'ENTRÉE QUI RÉPOND, PAS UN SOUVENIR ██
   * ------------------------------------------------------------------
   * LE TROU, TROUVÉ EN ÉPROUVANT L'AVANCE : un drapeau de composant ne
   * survit pas à une TRAVERSÉE. Fermer le remettait à faux ; l'AVANCE
   * du navigateur rouvrait bien la fenêtre (l'adresse redevient celle
   * de la fiche), mais le drapeau, lui, restait faux — et la fenêtre
   * ne se refermait plus ni au voile, ni à la croix, ni par Échap.
   * LA QUESTION EXACTE SE LIT DANS L'HISTORIQUE LUI-MÊME : l'entrée sur
   * laquelle on se tient porte-t-elle notre marque (`fenetreFiche`) ?
   * Elle est posée à l'ouverture, elle voyage avec l'entrée, elle
   * revient avec elle. Le smartphone reste couvert, et pour la même
   * raison qu'avant : son ouverture est un vrai lien, son entrée n'a
   * pas cette marque, et la fermeture ne consomme donc rien.
   */
    const etatIci = window.history.state as Record<string, unknown> | null;
    if (!etatIci?.fenetreFiche) return;
    entreePoussee.current = false;
    //  §1 (nº 438) — reprise déclarée AVANT le back : le rattrapage du
    //  filet la lit au popstate et se tait (relevé nº 438 : sans elle,
    //  à pile saturée, fermer rechargeait le site vers l'accueil).
    annoncerRepriseDuSite();
    window.history.back();
  }, []);

  // FENÊTRE FERMÉE (machine arrière, croix, voile, Échap…) : la note
  // de rechargement n'a plus lieu d'être — elle ne doit survivre QU'À
  // un rechargement, jamais à une fermeture volontaire. Le drapeau
  // évite d'effacer AU MONTAGE la note qu'un rechargement vient
  // justement de laisser (l'effet de réouverture la lit juste après).
  const fenetreDejaVue = useRef(false);
  useEffect(() => {
    if (visible) {
      fenetreDejaVue.current = true;
      return;
    }
    if (!fenetreDejaVue.current) return;
    fenetreDejaVue.current = false;
    try {
      sessionStorage.removeItem(CLE_FENETRE_FICHE);
    } catch {
      // Rien : le stockage absent n'a jamais rien stocké non plus.
    }
  }, [visible]);
  // Quitter la grille fenêtre encore ouverte (fil d'Ariane…) : même
  // ménage au démontage.
  useEffect(
    () => () => {
      if (!fenetreDejaVue.current) return;
      try {
        sessionStorage.removeItem(CLE_FENETRE_FICHE);
      } catch {
        // Rien.
      }
    },
    []
  );

  // RETOUR DE RECHARGEMENT (?fenetre=<slug>) : la page de fiche nous a
  // renvoyé ici pour ROUVRIR la fenêtre. On rend d'abord le défilement
  // noté, on retire `fenetre` de l'adresse (elle doit rester l'adresse
  // PROPRE de la grille dans l'historique), puis on ouvre — l'effet ne
  // tourne qu'au premier rendu.
  const reouvertureFaite = useRef(false);
  useEffect(() => {
    if (reouvertureFaite.current) return;
    reouvertureFaite.current = true;
    if (document.documentElement.dataset.appareil === "mobile") return;
    const parametres = new URLSearchParams(window.location.search);
    const slugDemande = parametres.get("fenetre");
    if (!slugDemande) return;

    parametres.delete("fenetre");
    const requete = parametres.toString();
    const adressePropre =
      window.location.pathname + (requete ? `?${requete}` : "");

    const cible = tatoueurs.find((t) => t.slug === slugDemande);

    let defilement = 0;
    try {
      const note = JSON.parse(
        sessionStorage.getItem(CLE_FENETRE_FICHE) ?? "null"
      ) as ContexteFenetreFiche | null;
      if (note?.slug === slugDemande) defilement = note.defilement || 0;
    } catch {
      defilement = 0;
    }
    // TOUT SE JOUE UN TOUR PLUS TARD : jamais d'état posé en plein
    // montage, et surtout, à ce moment-là, Next a fini d'armer son
    // interception de l'historique — le nettoyage de l'adresse
    // (retirer `fenetre`) reçoit alors les internes du routeur, sans
    // lesquels le retour arrière ne saurait plus relire l'étape. La
    // remontée automatique d'arrivée de page (DefilementEnHaut) est
    // passée elle aussi : la position rendue ici n'est plus écrasée,
    // et `ouvrir` la capture telle quelle. « instant » : le défilement
    // doux global ferait de cette restitution une animation
    // interrompue par le rendu.
    const minuteur = window.setTimeout(() => {
      //  §2 (nº 332) — L'ÉTAT EST RECOPIÉ, plus effacé. Cette ligne
      //  ne veut que NETTOYER L'ADRESSE ; passer `null` jetait au
      //  passage les marques que le site pose dans l'étape (le filet
      //  `retourReconstruit`, l'étape d'une surface refermable), et
      //  le retour ne savait plus où il en était.
      window.history.replaceState(window.history.state, "", adressePropre);
      if (!cible) return; // la fiche n'est plus dans ces résultats.
      //  §1 (nº 660) — CE DÉFILEMENT SE SIGNE : il rend la position
      //  notée avant un rechargement de fiche, et il agit APRÈS la
      //  remontée d'arrivée. La ligne est posée à côté, l'appel ne
      //  change pas.
      window.scrollTo({ top: defilement, left: 0, behavior: "instant" });
      ouvrir(cible);
    }, 0);
    return () => window.clearTimeout(minuteur);
    // `ouvrir` et `tatoueurs` sont stables au premier rendu — l'effet
    // ne doit tourner qu'une fois, le garde-fou ci-dessus s'en charge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /*  LA PILE DES FICHES SUPERPOSÉES (nº 226-§5) : depuis la fenêtre
        de base, un membre d'équipe ou le salon d'un profil s'ouvre
        PAR-DESSUS — c'est ce fournisseur qui porte ces fenêtres-là.
        La mécanique propre de la fenêtre de base (reprise après
        rechargement, clé d'ouverture) ne change pas d'une ligne. */
    <PileFiches surProfondeur={setProfondeurPile} voileDejaPose>
      <div
        aria-busy={estompee}
        // WEB : des interstices de 20 px sur les deux axes — les
        // cartes respirent, et la localité d'une rangée garde sa
        // distance avec les images de la suivante.
        // VRAIS MOBILES : la grille d'Instagram — bord à bord (elle
        // annule les marges de la page), un interstice d'UNE ligne
        // entre les deux colonnes, angles droits (voir CarteTatoueur).
        // EN « UNE COLONNE » (bouton de disposition) : une image par
        // ligne, bord à bord, rangées bien détachées — la colonne
        // unique est posée en style EN LIGNE : aucune règle de largeur
        // ne peut la contredire. Seuls les vrais mobiles y accèdent :
        // le bouton n'existe pas ailleurs.
        // EN PHOTOTHÈQUE (nº 140), L'ÉCART HORIZONTAL EST REPORTÉ À LA
        // VERTICALE : une grille régulière dans les deux sens. Sur le
        // web l'écart des deux axes était déjà le même (gap-5) — c'est
        // la disparition des textes sous l'image qui rend l'écart
        // vertical VISUEL égal à l'horizontal. Sur smartphone, les
        // rangées reprennent l'interstice d'UNE ligne des colonnes
        // (2 px), en deux colonnes comme en pleine largeur.
        //  ⚠️ LE REPÈRE DE LA MOSAÏQUE. Il servait au verrou de la
        //  nº 162 à l'effacer pendant une bascule ; cet effacement est
        //  SUPPRIMÉ (nº 166 — il noircissait tout l'écran, et la nº 164
        //  a ôté la cause du saut qu'il masquait). Le repère reste : il
        //  nomme la mosaïque, et les bancs s'en servent.
        ref={zoneGrille}
        data-mosaique=""
        /**
         * ⚠️ `overflow-anchor: none` (passe nº 224-§3)
         * ------------------------------------------------------------
         * L'ANCRAGE DE DÉFILEMENT du navigateur choisit tout seul un
         * nœud de référence dans ce qu'on regarde, et compense les
         * changements de hauteur qui surviennent AUTOUR de lui en
         * déplaçant le défilement. C'est une bonne idée sur un fil de
         * commentaires ; sur une grille qui s'allonge par le bas et
         * dont les images se posent une à une, il déplace la page de
         * quelques pixels après chaque « Voir plus ». On le lui
         * retire : ici, la page ne doit pas bouger d'un pixel.
         */
        /**
         * ⚠️ `minmax(0, 1fr)`, ET SURTOUT PAS `1fr` (passe nº 228-§3)
         * ------------------------------------------------------------
         * LE DÉFAUT MESURÉ : à 390 px en pleine largeur, la page
         * faisait 461 px de large et glissait vers la droite.
         * LA CHAÎNE, relevée nœud par nœud (⚠️ nº 424-§3 : la carte ne
         * porte PLUS `content-visibility` — le maillon 1 est mort, mais
         * `minmax(0, 1fr)` reste : le minimum automatique d'une grille
         * peut déborder pour d'autres raisons, un contenu large suffit) :
         *  1. une carte hors champ portait `content-visibility: auto` et
         *     `contain-intrinsic-size: auto 460px` (nº 224-§4, retirés
         *     par la nº 424-§3 — la remontée par paliers) ;
         *  2. cette taille intrinsèque est écrite en UNE valeur : elle
         *     vaut donc pour LES DEUX AXES. La carte hors champ
         *     annonce 460 px de LARGE autant que de haut ;
         *  3. `1fr` veut dire `minmax(auto, 1fr)` : le minimum
         *     automatique d'un élément de grille prend cette largeur
         *     annoncée. La piste calculée valait « 460px » — mesuré
         *     dans `getComputedStyle`, pas déduit ;
         *  4. document 461 px pour une fenêtre de 390 : 71 px de trop.
         * `minmax(0, 1fr)` interdit ce minimum : la piste vaut la
         * largeur disponible, la carte est stretchée à 390, et sa
         * hauteur mémorisée continue de réserver la place (le §3 de la
         * nº 226 — la page ne bouge pas d'un pixel — est intact).
         * ⚠️ C'EST CE QU'ÉCRIVENT DÉJÀ TOUTES LES AUTRES PISTES : les
         * classes `grid-cols-2 … 3xl:grid-cols-6` compilent en
         * `repeat(N, minmax(0, 1fr))`. Seule cette colonne unique,
         * posée en style en ligne, disait `1fr` — c'est pourquoi le
         * défaut ne se voyait QU'EN PLEINE LARGEUR.
         * ⚠️ AUCUN `overflow-x: hidden` NULLE PART : on ne cache pas un
         * débordement, on retire ce qui déborde.
         */
        style={{
          ...(disposition === "une"
            ? { gridTemplateColumns: "minmax(0, 1fr)" }
            : {}),
          overflowAnchor: "none",
        }}
        //  nº 357 — le nom de la grille, pour la garde des rangées de
        //  l'accueil prérendu (globals.css, `data-mosaique-nue`).
        data-grille-tatoueurs=""
        //  ⚠️ COMPOSÉE DES MORCEAUX PARTAGÉS (nº 249-§4) : le socle,
        //  les colonnes et la gouttière deux-colonnes sont l'écriture
        //  unique — celle que « Ma sélection » consomme entière
        //  (CLASSES_GRILLE_CARTES). La photothèque et la pleine
        //  largeur, qui n'existent qu'ici, CHOISISSENT leur gouttière
        //  (jamais une superposition : deux `gap` en conflit se
        //  départagent à l'ordre de la feuille, pas du className).
        className={`${SOCLE_GRILLE_CARTES} transition-opacity ${
          phototheque
            ? disposition === "une"
              ? "mobile:gap-y-[2px]"
              : "mobile:gap-[2px]"
            : disposition === "une"
              ? //  §3 (nº 398) — L'ESPACE SOUS LA PHOTO DE PROFIL SE
                //  RESSERRE : `gap-y-8` (32 px) devient `gap-y-6`
                //  (24 px). C'est la seule gouttière du site qui vaut
                //  cet espace-là — une carte pleine largeur n'a aucun
                //  rembourrage bas, elle s'arrête sur son texte, et ce
                //  qui suit est donc cet écart. 24 px est le cran
                //  au-dessous dans l'échelle, celui du socle des
                //  grilles.
                //  ⚠️ CE SEUL CAS : la photothèque (juste au-dessus),
                //  les cartes côte à côte (GOUTTIERES_DEUX_COLONNES) et
                //  « Ma sélection » (qui consomme CLASSES_GRILLE_CARTES,
                //  jamais cette branche) ne changent pas.
                "mobile:gap-y-6"
              : //  §1 (nº 841) — LE FIL : au doigt, cette grille n'a plus
                //  qu'une colonne, et c'est sa gouttière à lui — sous le
                //  préfixe d'appareil (§3 nº 876, voir la constante).
                GOUTTIERE_DU_FIL_AU_DOIGT
        } ${
          //  L'ESTOMPE DE RECHERCHE — la seule opacité de la mosaïque
          //  désormais (nº 166) : plus rien ne l'efface à la bascule.
          `duration-200 ${estompee ? "opacity-60" : "opacity-100"}`
        } ${COLONNES_MOSAIQUE} ${COLONNE_UNIQUE_DU_FIL}`}
      >
        {/*  ⚠️ DEUX FONCTIONS CONSTANTES, ET C'EST LE POINT (nº 219-§1).
             Elles étaient fabriquées à chaque rendu — `() => ouvrir(t)` —
             donc différentes à chaque fois, donc chaque carte se
             re-rendait dès que la FENÊTRE changeait d'état. Les cartes
             sont désormais mémorisées (voir CarteTatoueur) : encore
             faut-il ne pas leur donner des propriétés neuves. Elles
             reçoivent la fiche en argument, les fonctions ne changent
             plus, et naviguer dans un portfolio ne touche plus une
             seule carte. */}
        {/*  §1 (nº 279) — UNE CARTE = UN CARROUSEL. La fiche porte
             désormais le carrousel qu'elle montre (lib/carrousels) :
             la CLÉ vient de lui (deux galeries d'un même artiste
             partageraient l'identifiant de la fiche), et ses TAGS
             priment sur les critères de la recherche — ceux-ci valent
             pour toute la page, alors que chaque carte montre SA
             galerie. Sans carrousel (aperçu, listes d'autre nature) :
             tout se comporte comme avant. */}
        {tatoueurs.map((tatoueur, rang) => (
          <CarteTatoueur
            key={tatoueur.carrousel?.cle ?? tatoueur.id}
            tatoueur={tatoueur}
            styleRecherche={tatoueur.carrousel?.style ?? styleRecherche}
            renduRecherche={tatoueur.carrousel?.rendu ?? renduRecherche}
            natureRecherche={tatoueur.carrousel?.nature ?? natureRecherche}
            prioritaire={rang < CARTES_PRIORITAIRES}
            phototheque={phototheque}
            /*  §2 (nº 395) — ELLE NE DÉCIDE RIEN, ELLE TRANSMET. Cette
                 grille sert l'accueil, son jumeau de recherche, les
                 résultats ET les vitrines : elle ne peut pas savoir
                 laquelle. Celle qui sait le lui dit (IndexTatoueurs) ;
                 les vitrines, qui la montent en direct, ne passent rien
                 et gardent le nom par le défaut de la carte. */
            surApproche={precharger}
            surOuverture={ouvrir}
            /*  §4 (nº 852) — CETTE GRILLE EST CELLE DES PAGES DE
                RÉSULTATS : la recherche, les vitrines de style et de
                ville. C'est exactement le « style ou recherche » de la
                consigne — la pastille de ses cartes s'allume donc
                d'emblée au doigt. « Ma sélection » monte SA propre
                grille (PageFavoris) et ne passe rien : ses cartes ne
                bougent pas, comme demandé. */
            pastilleDEmblee
            //  §1 (nº 841) — CETTE GRILLE EST CELLE DES RÉSULTATS : au
            //  doigt, ses cartes sont celles du fil. Et chacune sait si
            //  elle est à moins d'un écran (voir l'observateur d'approche).
            fil
            approchee={approchees.has(tatoueur.carrousel?.cle ?? tatoueur.id)}
          />
        ))}
      </div>

      {/*  §1 (nº 371) — LES FLÈCHES DU CLAVIER : un seul écouteur pour
           toute la mosaïque, qui trouve la carte SURVOLÉE et pousse son
           cadre d'une colonne. Il n'affiche rien et ne touche à aucune
           géométrie (voir ClavierCartes). */}
      <ClavierCartes />

      {/* `key` : CHAQUE OUVERTURE repart de la photo du style cherché,
          jamais de l'état d'une fenêtre précédente — y compris quand
          c'est la MÊME fiche qu'on rouvre (nº 220-§3). */}
      <FenetreFiche
        key={`${ficheOuverte?.carrousel?.cle ?? ficheOuverte?.id ?? "fermee"}-${ouvertures}`}
        tatoueur={visible ? ficheOuverte : null}
        //  §2 (nº 279) — LA FENÊTRE OUVRE LE CARROUSEL DE LA CARTE, et
        //  lui seul : ses trois tags priment sur les critères de la
        //  page (règle 3 du §0 de la nº 278).
        styleRecherche={ficheOuverte?.carrousel?.style ?? styleRecherche}
        renduRecherche={ficheOuverte?.carrousel?.rendu ?? renduRecherche}
        //  LA CATÉGORIE VA JUSQU'À LA FENÊTRE (nº 217-§3) : elle
        //  s'arrêtait à la carte depuis la nº 216.
        natureRecherche={ficheOuverte?.carrousel?.nature ?? natureRecherche}
        //  §2 (nº 371) — LA PHOTO REGARDÉE SUR LA CARTE : la fenêtre
        //  s'ouvre dessus, pas sur la première du carrousel.
        photoRecherche={photoOuverte}
        positionGrille={positionGrille}
        //  §1 (nº 440) — des fiches empilées par-dessus (nº 226-§5) :
        //  la fenêtre de base efface son fil d'Ariane et son titre
        //  tant qu'elle n'est pas le sommet, et les retrouve quand la
        //  pile se vide (profondeurPile redescend à zéro).
        habillageEfface={profondeurPile > 0}
        //  §1 (nº 745) — tant que la fiche complète n'est pas là, la
        //  colonne montre l'habillage d'attente, jamais un contenu qui
        //  se réarrangera (voir `contenuPret` plus haut).
        contenuEnAttente={!contenuPret}
        surFermeture={fermer}
      />
    </PileFiches>
  );
}
