"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoProgressive } from "@/components/PhotoProgressive";
import { ZoomPincement } from "@/components/ZoomPincement";
import type { PhotoGalerie } from "@/lib/photo-tatoueur";

/**
 * LE CARROUSEL DU PORTFOLIO — TOUTES les photos d'un style
 * =========================================================
 * ⚠️ IL NE MONTRE PLUS « une photo par style ». Il montre LE STYLE
 * CHOISI, et toutes ses photos, dans l'ordre du dépôt (les zones dans
 * l'ordre de la liste, le noir et gris avant la couleur). Changer de
 * style — au sélecteur posé sur l'image — change le contenu du
 * carrousel : c'est la fiche qui possède le style ET l'indice.
 *
 * LE DÉFILEMENT A UN DÉBUT ET UNE FIN : butée franche à la première
 * et à la dernière photo — aucune boucle.
 *
 * DEUX ÉCRANS, DEUX GESTES :
 *  - SMARTPHONE : le doigt fait défiler ; un COMPTEUR « 3/12 » vit
 *    dans l'angle haut droit (aucun s'il n'y a qu'une photo). ⚠️ PLUS
 *    AUCUN POINT SOUS LA PHOTO (nº 207-§5) : le compteur dit déjà où
 *    l'on en est, et il le dit mieux — les points ne servaient qu'à
 *    répéter la même chose en moins lisible ;
 *  - WEB (souris) : les flèches, et la pagination en bas de l'image.
 *
 * CE QUI S'EFFACE, ET CE QUI RESTE (règle changée) :
 *  · LE COMPTEUR garde son fondu après 3 secondes, et revient au
 *    toucher — il informe, il n'agit pas ;
 *  · LE SÉLECTEUR DE STYLE, lui, NE S'EFFACE PLUS JAMAIS. C'est la
 *    navigation de la fiche : elle doit être là quand la main arrive.
 *    Il est rendu par la fiche (`selecteur`), le carrousel se
 *    contente de lui garder sa place.
 *
 * LA TENUE EN CHARGE — vingt photos dans un style, sur un téléphone
 * en 4G :
 *  1. SEULES LA PHOTO COURANTE ET SES DEUX VOISINES existent comme
 *     images. Les autres sont des cases vides du même format : aucune
 *     requête, et la piste garde ses dimensions ;
 *  2. la courante demande la PLEINE RÉSOLUTION, les voisines se
 *     contentent de leur MINIATURE (voir PhotoProgressive) — le
 *     balayage a donc toujours quelque chose à montrer, tout de
 *     suite, et le réseau ne charge que ce qui va être vu.
 *
 * LES FLÈCHES SUIVENT LE POINTEUR, pas la largeur : visibles dès que
 * l'appareil a une SOURIS (`pointer-fine`) — même dans une fenêtre
 * rétrécie au format mobile. Sur un vrai écran tactile, jamais : le
 * balayage suffit.
 */

/** Sous ce déplacement (px), un glissement au doigt est un simple tap. */
const SEUIL_GLISSEMENT = 48;

/** Combien de photos de part et d'autre gardent une image montée. */
const VOISINES = 1;

export function CarrouselPortfolio({
  photos,
  nomTatoueur,
  styleLabel,
  indice,
  surChangement,
  children,
}: {
  /** LES PHOTOS DU STYLE AFFICHÉ — plus « une par style ». */
  photos: PhotoGalerie[];
  nomTatoueur: string;
  /** Le libellé du style affiché — il sert aux textes de remplacement. */
  styleLabel: string;
  /** L'indice RÉEL affiché (0..n-1) — possédé par la fiche. */
  indice: number;
  surChangement: (indice: number) => void;
  /** Posé PAR-DESSUS la photo (le partage, angle haut droit). */
  children?: React.ReactNode;
}) {
  const n = photos.length;

  /**
   * §4 (nº 198) — L'INDICATEUR DE VOLUME S'EFFACE ET REVIENT
   * ------------------------------------------------------------------
   * SMARTPHONE, angle haut droit : la capsule affiche « 1/5 ». Après
   * trois secondes sans interaction, LE TEXTE S'ESTOMPE et la capsule
   * SE RESSERRE pour ne laisser qu'une flèche minimale — vers la droite
   * s'il reste des photos après, vers la gauche en fin de galerie.
   * Cette flèche demeure : c'est le repère permanent. Au moindre geste
   * (un toucher n'importe où, un changement de photo), le texte revient
   * aussitôt, et les trois secondes repartent.
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

  /**
   * §3 (nº 207) — LA BANDE DE LA PHOTO PRÉCÉDENTE, À GAUCHE
   * ==================================================================
   * LE DÉFAUT. La piste se déplaçait de `-100 %` par photo. En CSS,
   * ce pourcentage se compte sur la LARGEUR DE LA PISTE, qui vaut
   * celle du cadre — et cette largeur n'est presque jamais un nombre
   * entier de pixels : le cadre de la fiche est calculé
   * (`(100vh-119px)*0.8`), celui de la fenêtre superposée dérive d'une
   * hauteur en `vh`. À 456,66 px, la photo affichée se peint à 456,66
   * du bord alors que le pixel 456 lui est encore visible : il reste
   * une FRACTION DE PIXEL non couverte, et c'est le bord droit de la
   * photo précédente qu'on y voit, sur toute la hauteur. Le navigateur
   * l'étire à un pixel plein — d'où la bande.
   *
   * LA CORRECTION. On mesure le cadre, on ARRONDIT AU PIXEL SUPÉRIEUR,
   * et cette largeur entière sert AUX DEUX : la largeur de chaque
   * photo ET le pas de la translation. Le déplacement devient un
   * multiple exact de la largeur d'une photo — plus aucun reste, à
   * aucune largeur d'écran. La photo dépasse alors le cadre d'un
   * demi-pixel au plus, que `overflow: hidden` rogne : elle le couvre
   * donc bord à bord, toujours.
   * (Tant que la mesure n'est pas faite — rendu serveur, première
   * image — on garde le pourcentage : il n'est jamais faux, seulement
   * imprécis d'une fraction.)
   */
  const cadre = useRef<HTMLDivElement>(null);
  const [largeurCadre, setLargeurCadre] = useState(0);
  useEffect(() => {
    const zone = cadre.current;
    if (!zone) return;
    const mesurer = () => {
      const brute = zone.getBoundingClientRect().width;
      setLargeurCadre(brute > 0 ? Math.ceil(brute) : 0);
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(zone);
    return () => observateur.disconnect();
  }, [n]);

  // Glissement au doigt en cours : décalage en px, sinon null.
  const [glisse, setGlisse] = useState<number | null>(null);
  const departX = useRef<number | null>(null);
  // La distance vit AUSSI dans une ref : les `pointermove` sont des
  // événements continus, que React repeint en différé — à la levée du
  // doigt, l'état peut avoir un geste de retard. La ref, jamais.
  const distanceCourante = useRef(0);

  /** PINCEMENT À DEUX DOIGTS (vrais mobiles) : dès que ZoomPincement
      prend la main, le balayage en cours est ABANDONNÉ — la piste
      revient en place, et plus aucun geste à un doigt n'est suivi
      tant que le zoom vit. */
  const pincementEnCours = useRef(false);
  /** LE ZOOM DÉBORDE DU CADRE — comme sur les cartes de la mosaïque.
      Pendant le geste, les deux enveloppes qui rognent passent en
      `overflow-visible` et montent d'un cran : l'image agrandie sort
      de son cadre au lieu d'y être coupée. Les photos VOISINES sont
      masquées le temps du geste. Tout se range au relâchement. */
  const [zoomDebordant, setZoomDebordant] = useState(false);
  function surPincement(actif: boolean) {
    pincementEnCours.current = actif;
    setZoomDebordant(actif);
    if (actif) {
      departX.current = null;
      distanceCourante.current = 0;
      setGlisse(null);
    }
  }
  /** Les classes de rognage — levées le temps du pincement. */
  const rognage = zoomDebordant ? "overflow-visible z-50" : "overflow-hidden";

  /** Avance (+1) ou recule (−1) — DANS les bornes, c'est tout. */
  function aller(sens: 1 | -1) {
    const cible = indice + sens;
    if (cible < 0 || cible >= n) return;
    surChangement(cible);
  }

  /* ---- Le doigt : suivre, puis décider ---- */
  function debutToucher(evenement: React.PointerEvent) {
    if (n <= 1 || evenement.pointerType === "mouse") return;
    // Un DEUXIÈME doigt vient de se poser : c'est un pincement, pas
    // un balayage — le zoom a déjà pris la main (voir surPincement).
    if (pincementEnCours.current) return;
    departX.current = evenement.clientX;
    distanceCourante.current = 0;
    setGlisse(0);
  }
  function mouvementToucher(evenement: React.PointerEvent) {
    if (departX.current === null) return;
    distanceCourante.current = evenement.clientX - departX.current;
    // AUX BUTÉES, la photo FREINE (tiers du geste) : on sent qu'il n'y
    // a rien au-delà — c'est la butée franche, communiquée par le doigt.
    const enButee =
      (indice === 0 && distanceCourante.current > 0) ||
      (indice === n - 1 && distanceCourante.current < 0);
    setGlisse(enButee ? distanceCourante.current / 3 : distanceCourante.current);
  }
  function finToucher() {
    if (departX.current === null) return;
    const distance = distanceCourante.current;
    departX.current = null;
    distanceCourante.current = 0;
    setGlisse(null);
    if (Math.abs(distance) >= SEUIL_GLISSEMENT) {
      aller(distance < 0 ? 1 : -1);
    }
    // Sous le seuil, ou en butée : la piste revient d'elle-même.
  }

  /** Le texte de remplacement d'une photo : le style, et sa légende
      quand elle est taguée (« Avant-bras · Couleur »). */
  const texteDe = (photo: PhotoGalerie) =>
    `Portfolio de ${nomTatoueur} — ${styleLabel}${
      photo.legende ? ` · ${photo.legende}` : ""
    }`;

  /* SMARTPHONE : la capsule « 3/12 », angle haut droit — AUCUNE quand
     le style n'a qu'une photo. Le texte se replie (largeur ET opacité)
     pour ne laisser que la flèche ; les deux mouvements sont doux, la
     réapparition est quasi immédiate — jamais de clignotement. */
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
   * Le glissement de la frise et les changements d'échelle partagent la
   * MÊME transition que la piste des photos (300 ms, ease-out) : tout
   * bouge d'un seul mouvement avec les flèches.
   */
  //  Un cran de frise : le rond (6 px) et son air. Sept crans au plus.
  const CRAN_FRISE = 14;
  const paginationWeb = n > 1 && (() => {
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
      <div className="flex mobile:hidden absolute bottom-3 inset-x-0 z-[2] justify-center pointer-events-none">
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
                    onClick={() => surChangement(rang)}
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
  })();

  //  ⚠️ LES POINTS DU SMARTPHONE SOUS LA PHOTO SONT SUPPRIMÉS
  //  (nº 207-§5) : la capsule « 3/12 » posée dans l'image fait ce
  //  travail, et mieux. La pagination WEB (nº 198-§5), elle, ne bouge
  //  pas d'une ligne.

  // Une seule photo : une image simple, sans piste, sans compteur,
  // sans points — un carrousel d'une photo n'est pas un carrousel.
  if (n <= 1) {
    return (
      <div className={`relative rounded-none bg-sombre-carte ${rognage}`}>
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
    <div>
      <div
        role="region"
        aria-roledescription="carrousel"
        aria-label={`Portfolio de ${nomTatoueur} — ${styleLabel}`}
        className={`relative rounded-none bg-sombre-carte select-none ${rognage}`}
      >
        {/* La fenêtre de défilement — elle écoute le doigt.
            `touch-action: pan-y` : le pouce garde le défilement
            VERTICAL de la page, le carrousel ne capte que
            l'horizontal — et le PINCEMENT n'appartient qu'au zoom. */}
        <div
          ref={cadre}
          className={rognage}
          style={{ touchAction: "pan-y" }}
          onPointerDown={debutToucher}
          onPointerMove={mouvementToucher}
          onPointerUp={finToucher}
          onPointerCancel={finToucher}
        >
          <ZoomPincement surPincement={surPincement}>
            {/* La piste dérive de l'indice — pas de boucle, pas de clone. */}
            <div
              className={`flex ${
                glisse === null ? "transition-transform duration-300 ease-out" : ""
              }`}
              style={{
                //  ⚠️ LE PAS EST LA LARGEUR ENTIÈRE MESURÉE (§3) — un
                //  multiple exact, donc jamais de reste à gauche.
                transform: largeurCadre
                  ? `translate3d(${
                      -indice * largeurCadre + (glisse ?? 0)
                    }px, 0, 0)`
                  : `translateX(calc(${-indice * 100}% + ${glisse ?? 0}px))`,
              }}
            >
              {photos.map((photo, rang) => {
                const ecart = Math.abs(rang - indice);
                return (
                  <div
                    key={photo.cle}
                    className="relative w-full shrink-0 aspect-[4/5]"
                    aria-hidden={rang !== indice}
                    style={{
                      //  LA MÊME LARGEUR ENTIÈRE QUE LE PAS (§3).
                      ...(largeurCadre ? { width: largeurCadre } : null),
                      // Le temps du pincement, les voisines s'effacent :
                      // le cadre ne rogne plus, elles apparaîtraient de
                      // part et d'autre de la photo agrandie.
                      ...(zoomDebordant && rang !== indice
                        ? { visibility: "hidden" as const }
                        : null),
                    }}
                  >
                    {ecart <= VOISINES && (
                      <PhotoProgressive
                        miniature={photo.miniature}
                        url={photo.url}
                        alt={rang === indice ? texteDe(photo) : ""}
                        pleineResolution={rang === indice}
                        prioritaire={rang === 0}
                        classe="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </ZoomPincement>
        </div>

        {indice > 0 && fleche(-1)}
        {indice < n - 1 && fleche(1)}
        {compteur}
        {children}

        {/* WEB : la pagination façon Instagram, EN BAS AU CENTRE de
            l'image (nº 198-§5). */}
        {paginationWeb}
      </div>
    </div>
  );
}
