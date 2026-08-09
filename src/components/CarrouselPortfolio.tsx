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
 *    dans l'angle haut droit (aucun s'il n'y a qu'une photo) ; les
 *    POINTS vivent SOUS la photo ;
 *  - WEB (souris) : les flèches, et les points en bas de l'image.
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
  selecteur,
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
  /** LE SÉLECTEUR DE STYLE, posé sur l'image (haut gauche sur le web,
      bas gauche au doigt) — il ne s'efface jamais. */
  selecteur?: React.ReactNode;
  /** Posé PAR-DESSUS la photo (le partage, angle haut droit). */
  children?: React.ReactNode;
}) {
  const n = photos.length;

  /* SMARTPHONE : LE COMPTEUR s'efface en fondu après 3 secondes sans
     toucher, et revient dès que le doigt se pose n'importe où — puis
     le délai repart. Visible à l'ouverture de la page. Le sélecteur de
     style, lui, n'est PAS concerné : il reste. */
  const [compteurVisible, setCompteurVisible] = useState(true);
  const minuteurCompteur = useRef<number | null>(null);
  useEffect(() => {
    const armer = () => {
      if (minuteurCompteur.current) window.clearTimeout(minuteurCompteur.current);
      minuteurCompteur.current = window.setTimeout(
        () => setCompteurVisible(false),
        3000
      );
    };
    const auToucher = () => {
      setCompteurVisible(true);
      armer();
    };
    armer(); // visible à l'arrivée, puis 3 s
    document.addEventListener("touchstart", auToucher, { passive: true });
    return () => {
      if (minuteurCompteur.current) window.clearTimeout(minuteurCompteur.current);
      document.removeEventListener("touchstart", auToucher);
    };
  }, []);
  const fonduCompteur = `transition-opacity duration-500 ${
    compteurVisible ? "opacity-100" : "opacity-0"
  }`;

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

  /* SMARTPHONE : le compteur « 3/12 », angle haut droit de la photo.
     AUCUN quand le style n'a qu'une photo. */
  const compteur = n > 1 && (
    <span
      className={`hidden mobile:inline-block absolute top-3 right-3 z-[2] rounded-full
                 bg-black/60 backdrop-blur px-2.5 py-1 text-[12px] font-semibold
                 text-white tabular-nums ${fonduCompteur}`}
    >
      {indice + 1}/{n}
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

  /** LES POINTS — au-delà d'une poignée de photos, ils cesseraient
      d'être un repère pour devenir une frise illisible : à partir de
      douze, le compteur suffit (il est déjà là, sur les deux écrans). */
  const pointsLisibles = n > 1 && n <= 12;
  const points = (surLimage: boolean) => (
    <div
      className={
        surLimage
          ? "flex mobile:hidden absolute bottom-3 inset-x-0 z-[2] justify-center items-center gap-1.5"
          : "hidden mobile:flex mt-3 justify-center items-center gap-1.5"
      }
    >
      {photos.map((photo, rang) => (
        <button
          key={photo.cle}
          type="button"
          aria-label={`Voir la photo ${rang + 1} sur ${n}`}
          aria-current={rang === indice ? "true" : undefined}
          onClick={() => surChangement(rang)}
          className={`rounded-full transition-all ${
            rang === indice
              ? "w-[5px] h-[5px] bg-white"
              : surLimage
                ? "w-1 h-1 bg-white/45 hover:bg-white/75"
                : "w-1 h-1 bg-sombre-bordure"
          }`}
        />
      ))}
    </div>
  );

  /** LE COMPTEUR DU WEB — il ne paraît QUE lorsque les points ont
      renoncé (galerie longue) : sans lui, on ne saurait plus où l'on
      en est dans une série de quarante photos. */
  const compteurWeb = n > 12 && (
    <span
      className="mobile:hidden absolute bottom-3 right-3 z-[2] rounded-full
                 bg-black/55 backdrop-blur px-2.5 py-1 text-[12px]
                 font-semibold text-white tabular-nums"
    >
      {indice + 1}/{n}
    </span>
  );

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
        {selecteur}
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
                transform: `translateX(calc(${-indice * 100}% + ${glisse ?? 0}px))`,
              }}
            >
              {photos.map((photo, rang) => {
                const ecart = Math.abs(rang - indice);
                return (
                  <div
                    key={photo.cle}
                    className="relative w-full shrink-0 aspect-[4/5]"
                    aria-hidden={rang !== indice}
                    // Le temps du pincement, les voisines s'effacent :
                    // le cadre ne rogne plus, elles apparaîtraient de
                    // part et d'autre de la photo agrandie.
                    style={
                      zoomDebordant && rang !== indice
                        ? { visibility: "hidden" }
                        : undefined
                    }
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
        {compteurWeb}
        {selecteur}
        {children}

        {/* WEB : les points EN BAS DE L'IMAGE — menus, l'actif en
            BLANC : un repère, pas un ornement. */}
        {pointsLisibles && points(true)}
      </div>

      {/* SMARTPHONE : les points SOUS la photo. */}
      {pointsLisibles && points(false)}
    </div>
  );
}
