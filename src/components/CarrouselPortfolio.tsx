"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PhotoProgressive } from "@/components/PhotoProgressive";
import { ZoomPincement } from "@/components/ZoomPincement";
import type { PhotoGalerie } from "@/lib/photo-tatoueur";

/**
 * LE CARROUSEL DU PORTFOLIO — TOUTES les photos d'un ensemble
 * ============================================================
 * Il montre l'ensemble choisi (style, catégorie, rendu) et toutes ses
 * photos, dans l'ordre du dépôt. C'est la fiche qui possède l'indice.
 *
 * ⚠️ UN DÉFILEMENT NATIF AVEC ACCROCHAGE, PLUS AUCUN CALCUL (nº 209-§7)
 * ====================================================================
 * CE QUI A ÉTÉ SUPPRIMÉ, ET POURQUOI. La piste était déplacée par une
 * translation que NOUS calculions : d'abord en pourcentage, puis (nº 207)
 * en pixels mesurés et arrondis. Les deux ont laissé la même bande
 * verticale à droite de la photo — le bord de la suivante. La cause
 * définitive est celle que le propriétaire a relevée : la mesure est
 * prise PENDANT L'OUVERTURE de la fenêtre superposée, avant qu'elle ait
 * sa taille définitive ; le pas de translation restait donc celui d'un
 * cadre qui n'existe plus. Corriger le calcul, c'était courir après la
 * mesure.
 *
 * IL N'Y A DONC PLUS DE CALCUL DU TOUT. Le cadre est un conteneur qui
 * DÉFILE (`overflow-x`), les photos sont des colonnes de 100 % de sa
 * largeur, et l'accrochage (`scroll-snap`) fait le reste. Le navigateur
 * connaît toujours sa largeur réelle, à l'instant près, pendant une
 * ouverture comme après un redimensionnement : il ne peut plus y avoir
 * d'écart entre la largeur d'une photo et le pas du défilement, parce
 * que PERSONNE ne calcule ce pas.
 *  · CE QUE LE CARROUSEL LIT : quelle photo occupe le cadre — par un
 *    `IntersectionObserver`, qui répond par un OUI/NON, sans aucune
 *    arithmétique ;
 *  · CE QUE LES FLÈCHES ET LES POINTS ÉCRIVENT : `scrollTo` vers
 *    `offsetLeft` de la photo visée — une position que le navigateur a
 *    lui-même posée. Aucune largeur n'est lue nulle part.
 *
 * DEUX ÉCRANS, DEUX GESTES :
 *  - SMARTPHONE : le doigt fait défiler (c'est désormais le défilement
 *    natif, avec son inertie et son accrochage) ; un COMPTEUR « 3/12 »
 *    vit dans l'angle haut droit ;
 *  - WEB (souris) : les flèches, et la pagination en bas de l'image.
 *
 * LA TENUE EN CHARGE — vingt photos sur un téléphone en 4G : seules la
 * photo courante et ses deux voisines existent comme IMAGES. Les autres
 * sont des colonnes vides du même format : aucune requête, et le cadre
 * garde ses dimensions.
 *
 * LES FLÈCHES SUIVENT LE POINTEUR, pas la largeur : visibles dès que
 * l'appareil a une souris (`pointer-fine`, déclarée en nº 208-§2), même
 * dans une fenêtre rétrécie. Sur un vrai écran tactile, jamais : le
 * balayage suffit.
 */

/**
 * COMBIEN DE PHOTOS DE PART ET D'AUTRE GARDENT UNE IMAGE MONTÉE.
 *
 * ⚠️ DEUX, ET C'EST LA CORRECTION DE §5 ET §6 (nº 217)
 * ==================================================================
 * À UNE VOISINE, l'ensemble monté était {i−1, i, i+1}. Dès que
 * l'indice passait à i+1 — c'est-à-dire À L'INSTANT OÙ LA PHOTO
 * S'IMMOBILISE —, la colonne i+2 naissait et la colonne i−1 mourait.
 * Or i+2 TOUCHE la colonne regardée : pendant que l'accrochage finit
 * sa course, on en voit la tranche. Son image apparaissait donc au
 * beau milieu du mouvement, puis sortait du cadre — un scintillement
 * sur un appareil rapide, et sur un iPhone 8, où le rendu arrive
 * après l'arrêt, LA MOITIÉ D'UNE IMAGE, coupée à la verticale, qui se
 * superpose un instant.
 *
 * À DEUX VOISINES, l'ensemble monté est {i−2 … i+2}. Quand l'indice
 * passe à i+1, la colonne qui naît est i+3 et celle qui meurt est
 * i−2 : toutes deux à DEUX cadres de la photo regardée, donc
 * strictement invisibles — le cadre ne peut jamais en montrer que
 * deux à la fois. Plus rien n'apparaît ni ne disparaît dans le champ
 * de vision au moment où la photo s'arrête.
 *
 * CE QUE ÇA COÛTE : cinq colonnes montées au lieu de trois, soit deux
 * MINIATURES de plus (~25 ko chacune, `lazy`). La pleine résolution,
 * elle, reste demandée pour la seule photo regardée — c'est elle qui
 * pèse, et rien n'a changé de ce côté.
 */
const VOISINES = 2;

export function CarrouselPortfolio({
  photos,
  nomTatoueur,
  styleLabel,
  indice,
  surChangement,
  variante = "fiche",
  prioritaire = false,
  lien,
  children,
}: {
  /** LES PHOTOS DE L'ENSEMBLE AFFICHÉ. */
  photos: PhotoGalerie[];
  nomTatoueur: string;
  /** Le libellé du style affiché — il sert aux textes de remplacement. */
  styleLabel: string;
  /** L'indice RÉEL affiché (0..n-1) — possédé par la fiche. */
  indice: number;
  surChangement: (indice: number) => void;
  /**
   * OÙ CE CARROUSEL VIT (nº 211-§5).
   *  · « fiche » — la photo principale : pleine résolution, compteur
   *    au doigt, flèches à la souris, pincement ;
   *  · « carte » — dans la mosaïque, en pleine largeur au doigt : LES
   *    MINIATURES SEULES (une mosaïque ne télécharge jamais de pleine
   *    résolution), aucun compteur, aucune flèche, les ronds toujours
   *    visibles, et le PINCEMENT LAISSÉ À LA CARTE, qui a déjà le sien.
   *    ⚠️ ET LE CHARGEMENT EST DIFFÉRÉ : seule la première photo est
   *    demandée tant que le doigt n'a pas touché cette carte-là.
   */
  variante?: "fiche" | "carte";
  /** En variante « carte » : cette carte est-elle dans les premières
      de la mosaïque ? Elle seule charge son image sans attendre le
      défilement — les autres restent `lazy`, donc une carte hors écran
      ne demande RIEN (nº 211-§5). */
  prioritaire?: boolean;
  /** En variante « carte » : chaque photo est un LIEN vers la fiche —
      un toucher navigue, un glissement fait défiler (le navigateur
      n'émet aucun clic après un glissement). */
  lien?: {
    href: string;
    onClick?: (evenement: React.MouseEvent) => void;
    label: string;
  };
  /** Posé PAR-DESSUS la photo (le partage, le cœur). */
  children?: React.ReactNode;
}) {
  const n = photos.length;
  const surCarte = variante === "carte";

  /**
   * §5 (nº 211) — LE CHARGEMENT DIFFÉRÉ DES CARTES
   * ==================================================================
   * À l'affichage d'une mosaïque, chaque carte ne demande QU'UNE
   * image : la première de son ensemble — exactement ce qu'elle
   * demandait avant cette passe. Les suivantes n'existent même pas
   * comme balises tant que le doigt n'a pas touché CETTE carte : une
   * mosaïque de vingt cartes charge donc vingt miniatures, et pas une
   * de plus, qu'un artiste ait publié une photo ou vingt.
   * Le réveil se fait au premier contact ou au premier défilement —
   * c'est-à-dire AVANT que la photo suivante n'entre à l'écran.
   */
  const [eveille, setEveille] = useState(false);
  const reveiller = () => {
    if (surCarte && !eveille) setEveille(true);
  };

  /**
   * §4 (nº 198) — L'INDICATEUR DE VOLUME S'EFFACE ET REVIENT
   * ------------------------------------------------------------------
   * SMARTPHONE, angle haut droit : la capsule affiche « 1/5 ». Après
   * trois secondes sans interaction, LE TEXTE S'ESTOMPE et la capsule
   * SE RESSERRE pour ne laisser qu'une flèche minimale — vers la droite
   * s'il reste des photos après, vers la gauche en fin de galerie.
   * Cette flèche demeure : c'est le repère permanent. Au moindre geste,
   * le texte revient aussitôt, et les trois secondes repartent.
   *
   * ⚠️ AUCUN setState SYNCHRONE DANS UN EFFET (la règle du projet) :
   *  · le retour au toucher vit dans l'ÉCOUTEUR (un événement, pas un
   *    effet) et incrémente un compteur de réveil ;
   *  · le retour au changement de photo est un AJUSTEMENT PENDANT LE
   *    RENDU (le motif React officiel) ;
   *  · seul le minuteur — asynchrone par nature — éteint le texte.
   */
  const [compteurVisible, setCompteurVisible] = useState(true);
  const [reveils, setReveils] = useState(0);
  //  Le changement de photo est un geste : le texte revient, pendant
  //  le rendu — jamais dans un effet.
  const [indiceVu, setIndiceVu] = useState(indice);
  if (indice !== indiceVu) {
    setIndiceVu(indice);
    setCompteurVisible(true);
  }
  useEffect(() => {
    const auToucher = () => {
      setCompteurVisible(true);
      setReveils((n) => n + 1);
    };
    document.addEventListener("touchstart", auToucher, { passive: true });
    return () => document.removeEventListener("touchstart", auToucher);
  }, []);
  //  LE CYCLE DE TROIS SECONDES — réarmé par chaque réveil et chaque
  //  changement de photo. S'il expire, le texte s'estompe en douceur.
  useEffect(() => {
    const minuteur = window.setTimeout(() => setCompteurVisible(false), 3000);
    return () => window.clearTimeout(minuteur);
  }, [reveils, indice]);

  /** LE CADRE QUI DÉFILE, et les colonnes qu'il contient. */
  const cadre = useRef<HTMLDivElement>(null);
  const colonnes = useRef<(HTMLDivElement | null)[]>([]);

  /** PINCEMENT À DEUX DOIGTS (vrais mobiles) : le temps du geste, le
      cadre ne défile plus et l'accrochage est levé — sans quoi le
      navigateur ferait glisser la piste sous les doigts. */
  const [zoomEnCours, setZoomEnCours] = useState(false);
  function surPincement(actif: boolean) {
    setZoomEnCours(actif);
  }

  /**
   * QUELLE PHOTO OCCUPE LE CADRE ? — la question posée au navigateur,
   * qui répond sans qu'on calcule quoi que ce soit. Le seuil de 60 %
   * ne peut désigner qu'une seule colonne à la fois.
   */
  /**
   * ⚠️ L'IDENTITÉ DE LA SÉRIE, PAS SON NOMBRE (nº 214-§2)
   * ==================================================================
   * LE DÉFAUT — le défilement qui « se bloque » dans le portfolio.
   * L'observateur ne se reposait QUE si `n` changeait. Or on passe
   * sans cesse d'une série à une autre (onglet, catégorie, rendu,
   * style), et deux séries ont souvent LE MÊME NOMBRE de photos :
   * l'effet ne se rejouait pas, l'observateur restait accroché aux
   * colonnes de la série PRÉCÉDENTE — des nœuds démontés. Plus aucune
   * photo n'était signalée, l'indice se figeait, et `allerA` visait
   * lui aussi d'anciens nœuds : flèches et points ne répondaient plus.
   * On dépend donc des CLÉS des photos : changer de série, c'est
   * changer cette chaîne, quel que soit le nombre.
   */
  const cleDeLaSerie = photos.map((photo) => photo.cle).join("|");
  /** LA DERNIÈRE POSITION QUE NOUS AVONS POSÉE — voir l'effet plus bas.
      ⚠️ ELLE EST AUSSI POSÉE PAR L'OBSERVATEUR (nº 217-§6) : un indice
      qui vient DU DOIGT ne doit jamais provoquer un `scrollTo` en
      retour, sans quoi on se bat avec le défilement natif. */
  const dernierPose = useRef(-1);
  useEffect(() => {
    const zone = cadre.current;
    //  Les colonnes de l'ancienne série n'ont plus rien à dire : on
    //  taille le tableau à la série courante (les refs viennent d'y
    //  reposer les nœuds neufs).
    colonnes.current.length = n;
    if (!zone || n <= 1) return;
    //  Une nouvelle série commence à sa première photo — sans quoi le
    //  cadre garderait le défilement de la précédente.
    zone.scrollLeft = 0;
    dernierPose.current = 0;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          const rang = colonnes.current.indexOf(
            entree.target as HTMLDivElement
          );
          if (rang < 0) continue;
          //  ⚠️ CET INDICE VIENT DU DÉFILEMENT LUI-MÊME : on le note
          //  comme « déjà en place » AVANT de l'annoncer, pour que
          //  l'effet de repositionnement n'aille pas rejouer un
          //  `scrollTo` par-dessus le geste en cours (nº 217-§6). Le
          //  seuil de 60 % se franchit souvent AVANT la fin de
          //  l'accrochage : la piste sautait alors à la colonne, en
          //  travers de l'élan du doigt — et l'on voyait passer la
          //  tranche d'une image.
          dernierPose.current = rang;
          surChangement(rang);
        }
      },
      { root: zone, threshold: 0.6 }
    );
    for (const colonne of colonnes.current) {
      if (colonne) observateur.observe(colonne);
    }
    return () => observateur.disconnect();
  }, [cleDeLaSerie, n, surChangement]);

  /**
   * ALLER À UNE PHOTO — les flèches, les points, et tout changement
   * venu de la fiche (choisir un ensemble remet à zéro).
   * `offsetLeft` est la position que LE NAVIGATEUR a donnée à cette
   * colonne : on ne la calcule pas, on la lit.
   */
  function allerA(rang: number, doux: boolean) {
    const zone = cadre.current;
    const colonne = colonnes.current[rang];
    if (!zone || !colonne) return;
    zone.scrollTo({
      left: colonne.offsetLeft,
      behavior: doux ? "smooth" : "instant",
    });
  }

  /** L'indice vient de la fiche : on s'y rend, sans animation (c'est un
      changement d'ensemble, pas un défilement).
      ⚠️ ET SEULEMENT DE LA FICHE : quand il vient du doigt, l'observateur
      a déjà posé `dernierPose`, et cet effet ne fait rien (nº 217-§6).
      La comparaison de position qui servait de garde-fou ne suffisait
      pas — au moment où l'observateur parle, le défilement est encore
      en route, l'écart est donc grand, et l'on téléportait la piste. */
  useEffect(() => {
    if (n <= 1) return;
    if (dernierPose.current === indice) return;
    const zone = cadre.current;
    const colonne = colonnes.current[indice];
    if (!zone || !colonne) return;
    if (Math.abs(zone.scrollLeft - colonne.offsetLeft) > 1) {
      allerA(indice, false);
    }
    dernierPose.current = indice;
  }, [indice, n]);

  /** Avance (+1) ou recule (−1) — DANS les bornes, c'est tout. */
  function aller(sens: 1 | -1) {
    const cible = indice + sens;
    if (cible < 0 || cible >= n) return;
    allerA(cible, true);
  }

  /** Le texte de remplacement d'une photo : le style, et sa légende
      quand elle est taguée (« Avant-bras · Couleur »). */
  const texteDe = (photo: PhotoGalerie) =>
    `Portfolio de ${nomTatoueur} — ${styleLabel}${
      photo.legende ? ` · ${photo.legende}` : ""
    }`;

  /* SMARTPHONE : la capsule « 3/12 », angle haut droit — AUCUNE quand
     l'ensemble n'a qu'une photo. Le texte se replie (largeur ET
     opacité) pour ne laisser que la flèche ; les deux mouvements sont
     doux, la réapparition est quasi immédiate — jamais de
     clignotement. */
  const enFinDeGalerie = indice >= n - 1;
  const compteur = n > 1 && (
    <span
      className="hidden mobile:inline-flex absolute top-3 right-3 z-[2]
                 items-center rounded-full bg-black/60 backdrop-blur
                 px-2.5 py-1.5 text-white"
    >
      <span
        aria-hidden={!compteurVisible}
        className={`overflow-hidden whitespace-nowrap text-[12px]
                   font-semibold tabular-nums
                   transition-[max-width,opacity,margin-right] ease-out ${
                     compteurVisible
                       ? "max-w-[64px] opacity-100 mr-1.5 duration-150"
                       : "max-w-0 opacity-0 mr-0 duration-500"
                   }`}
      >
        {indice + 1}/{n}
      </span>
      {/*  LA FLÈCHE MINIMALE — le repère permanent : vers la droite
           tant qu'il reste des photos, vers la gauche en fin de
           galerie. Elle pivote en douceur, elle ne clignote pas. */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-500 ${
          enFinDeGalerie ? "rotate-180" : ""
        }`}
      >
        <path
          d="M9.5 5.5 16 12l-6.5 6.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  /* POINTEUR SOURIS (toute largeur) : les deux flèches, discrètes,
     mi-hauteur — la gauche seulement après le premier défilement, la
     droite jamais à la dernière photo. */
  const fleche = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Photo suivante" : "Photo précédente"}
      onClick={() => aller(sens)}
      className={`hidden pointer-fine:flex absolute z-[2] ${
        sens === 1 ? "right-2.5" : "left-2.5"
      } top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
      bg-sombre-fond/55 backdrop-blur items-center justify-center
      text-sombre-texte hover:bg-sombre-eleve/75 transition-colors`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={sens === 1 ? "M9.5 5.5 16 12l-6.5 6.5" : "M14.5 5.5 8 12l6.5 6.5"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  /**
   * §5 (nº 198) — LA PAGINATION DU WEB, EN BAS AU CENTRE
   * ==================================================================
   * CAS A — CINQ PHOTOS OU MOINS : tous les ronds, à taille pleine,
   * fixes et centrés. Le rond actif est BLANC ILLUMINÉ (jamais rose —
   * la charte le réserve à d'autres emplois) et se déplace de rond en
   * rond. Aucun glissement, aucune réduction.
   *
   * CAS B — PLUS DE CINQ : une frise de SEPT crans au plus, en trois
   * temps :
   *  · AU DÉBUT, l'actif est à l'extrême gauche — trois ronds pleins à
   *    gauche, puis 75 % et 50 % vers la droite : le sens du défilement
   *    s'annonce ;
   *  · AU MILIEU, la frise glisse et l'actif se stabilise au centre —
   *    trois ronds pleins au milieu, les extrémités décroissent
   *    symétriquement (75 %, 50 %) ;
   *  · À LA FIN, la frise cesse de glisser et l'actif migre vers la
   *    droite jusqu'au dernier rond.
   */
  //  Un cran de frise : le rond (6 px) et son air. Sept crans au plus.
  //  ⚠️ UNE FONCTION APPELÉE DANS LE JSX, comme `fleche` — et non une
  //  valeur calculée pendant le rendu : ses boutons commandent le
  //  défilement, donc ils touchent au cadre (une ref), ce qui n'a le
  //  droit de se produire QUE dans un gestionnaire d'événement.
  const CRAN_FRISE = 14;
  function paginationWeb() {
    const crans = Math.min(n, 7);
    //  Le premier rond de la fenêtre : collée au début, puis centrée
    //  sur l'actif, puis collée à la fin — les trois temps.
    const debut = Math.max(0, Math.min(indice - 3, n - 7));
    //  La zone à taille pleine (trois ronds) : autour de l'actif quand
    //  la frise glisse, contre le bord au début et à la fin.
    const zone = n <= 5 ? 0 : Math.max(debut, Math.min(indice - 1, debut + 4));
    const echelle = (rang: number) => {
      if (n <= 5) return 1;
      const distance =
        rang < zone ? zone - rang : rang > zone + 2 ? rang - (zone + 2) : 0;
      return distance === 0 ? 1 : distance === 1 ? 0.75 : distance === 2 ? 0.5 : 0;
    };
    return (
      <div
        className={`${
          surCarte ? "flex" : "flex mobile:hidden"
        } absolute bottom-3 inset-x-0 z-[2] justify-center pointer-events-none`}
      >
        <div className="overflow-hidden" style={{ width: crans * CRAN_FRISE }}>
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${-debut * CRAN_FRISE}px)` }}
          >
            {photos.map((photo, rang) => {
              const taille = echelle(rang);
              return (
                <span
                  key={photo.cle}
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: CRAN_FRISE }}
                >
                  <button
                    type="button"
                    aria-label={`Voir la photo ${rang + 1} sur ${n}`}
                    aria-current={rang === indice ? "true" : undefined}
                    onClick={() => allerA(rang, true)}
                    tabIndex={taille === 0 ? -1 : 0}
                    //  L'actif : BLANC ILLUMINÉ — un halo, pas un
                    //  contour. Les autres : blanc voilé.
                    className={`pointer-events-auto h-1.5 w-1.5 rounded-full
                               transition-[transform,opacity,background-color,box-shadow]
                               duration-300 ease-out ${
                                 rang === indice
                                   ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.95)]"
                                   : "bg-white/45 hover:bg-white/75"
                               }`}
                    style={{ transform: `scale(${taille})`, opacity: taille === 0 ? 0 : 1 }}
                  />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Une seule photo : une image simple, sans défilement, sans compteur
  // — un carrousel d'une photo n'est pas un carrousel.
  if (n <= 1) {
    return (
      <div
        className={`relative bg-sombre-carte ${
          zoomEnCours ? "overflow-visible z-50" : "overflow-hidden"
        }`}
      >
        {photos[0] && (
          // Le pincement à deux doigts agrandit la photo (mobile).
          <ZoomPincement surPincement={surPincement}>
            <div className="relative w-full aspect-[4/5]">
              <PhotoProgressive
                miniature={photos[0].miniature}
                url={photos[0].url}
                alt={texteDe(photos[0])}
                pleineResolution
                prioritaire
                classe="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </ZoomPincement>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label={`Portfolio de ${nomTatoueur} — ${styleLabel}`}
      className="relative bg-sombre-carte select-none"
    >
      {/* LE CADRE QUI DÉFILE — le navigateur fait tout : l'inertie du
          doigt, l'accrochage d'une photo à la fois (`snap-always`), et
          les butées franches aux extrémités. La barre de défilement est
          masquée : elle n'apprendrait rien.
          ⚠️ `relative` : c'est ce qui fait de ce cadre le repère des
          colonnes — `offsetLeft` s'y rapporte, et c'est la seule
          position que les flèches utilisent.
          ⚠️ `touch-action: pan-x pan-y` — le navigateur garde les deux
          défilements, mais PAS le pincement : celui-ci est à nous
          (ZoomPincement). Le temps du zoom, le cadre cesse de défiler
          et l'accrochage est levé. */}
      <div
        ref={cadre}
        onPointerDown={reveiller}
        onScroll={reveiller}
        className={`relative flex ${
          zoomEnCours
            ? "overflow-hidden"
            : "overflow-x-auto snap-x snap-mandatory"
        } [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {photos.map((photo, rang) => {
          const ecart = Math.abs(rang - indice);
          //  SUR UNE CARTE : la première photo, et les autres seulement
          //  une fois la carte réveillée. Sur une fiche : la courante
          //  et ses deux voisines, comme toujours.
          const montee = surCarte
            ? rang === 0 || eveille
            : ecart <= VOISINES;
          const image = surCarte ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               miniature déjà découpée, servie telle quelle : c'est la
               règle des cartes depuis toujours (voir CarteTatoueur). */
            <img
              src={photo.miniature}
              alt={rang === indice ? texteDe(photo) : ""}
              //  ⚠️ `lazy` PARTOUT SAUF LES PREMIÈRES CARTES : une
              //  carte hors écran ne demande aucune image, et les
              //  photos suivantes d'une carte ne sont demandées qu'une
              //  fois montées — c'est-à-dire au premier geste.
              loading={rang === 0 && prioritaire ? undefined : "lazy"}
              fetchPriority={rang === 0 && prioritaire ? "high" : undefined}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <PhotoProgressive
              miniature={photo.miniature}
              url={photo.url}
              alt={rang === indice ? texteDe(photo) : ""}
              pleineResolution={rang === indice}
              prioritaire={rang === 0}
              classe="absolute inset-0 h-full w-full object-cover"
            />
          );
          return (
            <div
              key={photo.cle}
              ref={(element) => {
                colonnes.current[rang] = element;
              }}
              className="relative w-full shrink-0 snap-start snap-always aspect-[4/5]"
              aria-hidden={rang !== indice}
            >
              {surCarte ? (
                //  CHAQUE PHOTO EST UN LIEN : un toucher ouvre la
                //  fiche, un glissement fait défiler.
                lien ? (
                  <Link
                    href={lien.href}
                    onClick={lien.onClick}
                    aria-label={lien.label}
                    tabIndex={rang === indice ? 0 : -1}
                    className="absolute inset-0 outline-none
                               focus-visible:outline-2 focus-visible:-outline-offset-2
                               focus-visible:outline-primaire"
                  >
                    {montee && image}
                  </Link>
                ) : (
                  montee && image
                )
              ) : rang === indice ? (
                /*  §3 (nº 216) — LE ZOOM N'EST MONTÉ QUE SUR LA PHOTO
                    REGARDÉE. Il l'était sur CHAQUE colonne : vingt
                    photos, vingt écouteurs `touchmove` NON PASSIFS —
                    et un écouteur non passif oblige le navigateur à
                    consulter le fil principal avant chaque mouvement
                    de doigt. Sur un iPhone 8, cela suffit à faire
                    saccader puis bloquer le défilement ; sur un 12, la
                    marge absorbe. Les cartes de la mosaïque, elles,
                    n'en montaient aucun — d'où leur fluidité, et
                    c'était l'indice. On ne pince que ce qu'on
                    regarde : un seul écouteur, toujours. */
                <ZoomPincement surPincement={surPincement} classe="h-full w-full">
                  {montee && image}
                </ZoomPincement>
              ) : (
                montee && image
              )}
            </div>
          );
        })}
      </div>

      {!surCarte && indice > 0 && fleche(-1)}
      {!surCarte && indice < n - 1 && fleche(1)}
      {!surCarte && compteur}
      {children}

      {/* WEB : la pagination façon Instagram, EN BAS AU CENTRE de
          l'image (nº 198-§5). */}
      {n > 1 && paginationWeb()}
    </div>
  );
}
