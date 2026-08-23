"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  blocEpargne,
  poserLeVoile,
  retirerLeVoile,
  sAbonnerAuVoile,
  voilePose,
} from "@/lib/voile-de-la-page";

/**
 * ██ LE VOILE DE LA PAGE — §2 (nº 293), REFAIT §3 (nº 294) ██
 * ==================================================================
 * CE QUI CHANGE À LA nº 294, ET POURQUOI C'EST PLUS SIMPLE. Le voile
 * de la nº 293 s'arrêtait au bas de la barre, pour ne pas passer
 * SOUS elle — une plaque de verre floute ce qui est peint dessous, et
 * la barre se serait assombrie deux fois. Résultat : deux couleurs à
 * l'écran, avec un raccord visible juste sous la barre.
 * IL PASSE DÉSORMAIS AU-DESSUS DE TOUT, la barre comprise. La question
 * du verre ne se pose plus du tout : la barre continue de flouter la
 * page, le voile assombrit le résultat, et il n'y a plus qu'UNE SEULE
 * COULEUR sur tout l'écran. L'empilement est
 * page < barre < voile < panneau ouvert.
 *
 * ⚠️ L'EXCEPTION, ET ELLE EST NÉCESSAIRE : LE BLOC QUI CONTIENT
 * L'ÉLÉMENT OUVERT RESTE CLAIR — sinon on ne lit plus ce qu'on écrit.
 * ET C'EST LE BLOC ENTIER : sur « Ma sélection », l'encadré
 * favoris/suivis est UN SEUL BLOC, celui du moteur aussi. Si l'un de
 * leurs segments ouvre un menu, TOUT l'encadré reste clair — on ne
 * coupe pas un bloc en deux luminosités.
 *
 * ⚠️ COMMENT LE BLOC RESTE CLAIR — ET PAS PAR UN `z-index`. La barre
 * est un contexte d'empilement (`sticky z-50`) : un enfant ne peut pas
 * en sortir, quel que soit son `z-index`. LE VOILE EST DONC PERCÉ :
 * il est peint en QUATRE RECTANGLES autour du bloc épargné (au-dessus,
 * en dessous, à gauche, à droite). Rien n'est peint sur le bloc, donc
 * rien ne l'assombrit — et rien ne l'intercepte non plus, ses clics
 * lui arrivent normalement. Sans bloc à épargner, un seul rectangle
 * plein écran.
 *
 * ⚠️ AUCUN FONDU, AUCUNE TRANSFORMATION (défaut nº 234). Le voile
 * apparaît et disparaît net ; il vit dans un PORTAIL au corps du
 * document, donc frère des plaques de verre et jamais leur ancêtre.
 *
 * ⚠️ CLIQUER DESSUS REFERME, ET AUCUN MÉCANISME N'A ÉTÉ ÉCRIT POUR
 * CELA. Les rectangles sont des frères des plaques dans le corps du
 * document : un clic dessus est, pour chaque surface ouverte, un clic
 * À L'EXTÉRIEUR de son conteneur — les fermetures au clic extérieur
 * qui existent déjà s'en chargent. Ils ne retiennent aucun événement.
 *
 * ⚠️ WEB UNIQUEMENT. Au doigt, rien ne change.
 */

/**
 * L'ASSOMBRISSEMENT — 28 %.
 * ⚠️ IL MONTE DEPUIS LES 18 % DE LA nº 293, et le nombre suit le
 * changement de place : sous la barre, le voile se cumulait au flou
 * de la plaque, qui assombrissait déjà ; au-dessus, il agit seul sur
 * une barre restée à pleine lumière. À 18 % elle aurait à peine
 * bougé. 28 % pose une ombre franche sans noircir — le panneau ouvert
 * reste, de loin, la chose la plus claire de l'écran.
 */
const NOIRCEUR = "rgba(0, 0, 0, 0.28)";

/** Au-dessus de la barre (50) et des fenêtres de fiche, sous les
    plaques des menus (80) : elles doivent rester claires. */
const ETAGE = 60;

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  /** §4 (nº 449, §1 nº 450) — les rayons des coins de la découpe :
      gauche puis droite. Lus sur le border-radius CALCULÉ de chaque
      élément épargné : la découpe ÉPOUSE les arrondis au lieu de
      couper à angles droits. */
  rayonGauche: number;
  rayonDroit: number;
};

/** §4 (nº 449, simplifié §1 nº 450) — LES RAYONS DE LA DÉCOUPE, lus
    sur L'ÉLÉMENT LUI-MÊME (son border-radius calculé) : l'encadré
    rend ses 12 px, le bouton rond son 9999 — borné à la demi-hauteur,
    donc son cercle exact. Plus aucun rayon déclaré à la main :
    l'attribut `data-voile-rayons` de la nº 449 a disparu avec le trou
    unique. */
function rayonsDeLaDecoupe(bloc: HTMLElement, hauteur: number): [number, number] {
  const plafond = hauteur / 2;
  const calcule = getComputedStyle(bloc);
  return [
    Math.min(parseFloat(calcule.borderTopLeftRadius) || 0, plafond),
    Math.min(parseFloat(calcule.borderTopRightRadius) || 0, plafond),
  ];
}

export function VoileDeLaPage() {
  const [actif, setActif] = useState(false);
  /** §1 (nº 450) — DES TROUS, AU PLURIEL : le voile épargne chaque
      ÉLÉMENT marqué du périmètre, séparément (l'encadré ET le bouton
      rond) — l'air entre eux est assombri comme le reste. */
  const [trous, setTrous] = useState<Rect[] | null>(null);
  const empreinte = useRef("");

  useEffect(() => sAbonnerAuVoile(() => setActif(voilePose())), []);

  /**
   * LE TROU SE MESURE À CHAQUE IMAGE tant que le voile est posé : le
   * bloc peut se déplacer (la barre se replie au défilement, la
   * fenêtre se redimensionne). On ne repose l'état que si un nombre a
   * changé — sinon on rendrait soixante fois par seconde pour rien.
   */
  useEffect(() => {
    if (!actif) return;
    let vivante = true;
    let trame = 0;
    const suivre = () => {
      if (!vivante) return;
      trame = requestAnimationFrame(suivre);
      const bloc = blocEpargne();
      /*  §1 (nº 450) — LES ÉLÉMENTS DU PÉRIMÈTRE, chacun son trou. Le
          périmètre (la rangée du moteur) CONTIENT les éléments
          marqués — l'encadré (`data-encadre-barre`) et le bouton rond
          (`data-voile-element`) : chacun devient un trou à ses
          propres arrondis, et l'air entre eux reste au voile. Sans
          élément marqué dedans (« Ma sélection », dont le bloc EST
          l'encadré), le bloc entier reste l'unique trou — le
          comportement de la nº 449, inchangé.
          ⚠️ L'HYPOTHÈSE GÉOMÉTRIQUE, écrite : les éléments d'un même
          périmètre vivent sur UNE RANGÉE, disjoints horizontalement —
          c'est le cas des deux nôtres, et le tri par gauche rend le
          rendu par colonnes correct. */
      let frais: Rect[] | null = null;
      if (bloc) {
        const marques = bloc.querySelectorAll<HTMLElement>(
          "[data-encadre-barre], [data-voile-element]"
        );
        const cibles = marques.length > 0 ? Array.from(marques) : [bloc];
        frais = cibles
          .map((element) => {
            const boite = element.getBoundingClientRect();
            /**
             * ██ §2 (nº 529) — LE TROU SE CALE SUR LE PIXEL ██
             * ------------------------------------------------------
             * LE DÉFAUT, ET SA CAUSE EXACTE. Le voile n'est pas une
             * plaque : c'est un CARRELAGE de rectangles qui se
             * touchent bord à bord (la colonne de gauche, les pans du
             * haut et du bas, les interstices, la colonne de droite).
             * Or leurs bords sont lus sur un `getBoundingClientRect`,
             * qui rend des FRACTIONS — mesuré sur la rangée du
             * moteur : 410,921875. Deux pans semi-transparents qui se
             * rejoignent à 410,92 se partagent la colonne de pixels
             * 410 : le premier y peint 0,92 de son alpha, le second
             * 0,08. Composés, ils rendent 0,2743 au lieu de 0,28 —
             * UNE RAIE PLUS CLAIRE d'un pixel, à l'endroit exact de
             * la couture. Sur « Ma sélection », la couture la plus à
             * gauche tombe à quelques pixels du bord de la fenêtre
             * (la gouttière de la page), et la raie se lit comme une
             * bande que le voile n'aurait pas couverte — surtout
             * quand une photo claire passe dessous.
             * LE REMÈDE : le trou se cale sur des pixels ENTIERS. Les
             * bords des pans en héritent, chaque couture tombe alors
             * pile entre deux colonnes de pixels, et aucune ne se
             * partage plus. Aucun pan n'a changé de règle : ce sont
             * les NOMBRES qu'on leur donne qui sont propres.
             * ⚠️ ON ARRONDIT VERS L'EXTÉRIEUR (plancher à gauche et
             * en haut, plafond à droite et en bas) : le trou ne peut
             * ainsi que GRANDIR d'un pixel au plus, jamais rétrécir —
             * le bloc épargné ne peut pas être effleuré par le voile.
             * ⚠️ ET LE DÉCOUPAGE DE LA nº 450 NE BOUGE PAS D'UN MOT :
             * mêmes éléments épargnés, mêmes trous, même air assombri
             * entre eux. Seuls leurs bords sont désormais entiers.
             * ⚠️ BÉNÉFICE SECOND : l'empreinte ne tremble plus. Elle
             * comparait des fractions qui bougeaient au moindre
             * défilement — l'état se reposait pour rien.
             */
            const gauche = Math.floor(boite.left);
            const haut = Math.floor(boite.top);
            const largeur = Math.ceil(boite.right) - gauche;
            const hauteur = Math.ceil(boite.bottom) - haut;
            const [rayonGauche, rayonDroit] = rayonsDeLaDecoupe(
              element,
              hauteur
            );
            return {
              top: haut,
              left: gauche,
              width: largeur,
              height: hauteur,
              rayonGauche,
              rayonDroit,
            };
          })
          .sort((a, b) => a.left - b.left);
      }
      const signature = JSON.stringify(frais);
      if (signature === empreinte.current) return;
      empreinte.current = signature;
      setTrous(frais);
    };
    trame = requestAnimationFrame(suivre);
    return () => {
      vivante = false;
      cancelAnimationFrame(trame);
    };
  }, [actif]);

  if (!actif) return null;

  /** Un pan de voile. Aucun gestionnaire : il ne fait qu'assombrir. */
  const pan = (cle: string, style: React.CSSProperties) => (
    <div
      key={cle}
      data-voile-page={cle}
      aria-hidden="true"
      style={{
        position: "fixed",
        zIndex: ETAGE,
        backgroundColor: NOIRCEUR,
        //  ⚠️ ÉCRIT, PAS HÉRITÉ : aucune transition ne doit pouvoir
        //  s'accrocher au voile — un fondu près d'une plaque de verre,
        //  c'est le défaut nº 234.
        transition: "none",
        ...style,
      }}
    />
  );

  /**
   * ██ §4 (nº 449) — LES COINS DE LA DÉCOUPE ÉPOUSENT LES ARRONDIS ██
   * ------------------------------------------------------------------
   * CE QUI PRODUISAIT LES ANGLES DROITS, nommé : le trou est fait de
   * QUATRE RECTANGLES (les pans ci-dessous), et un rectangle n'a pas
   * de congé — aux quatre coins du bloc épargné, un petit carré
   * restait clair au-delà de la courbe de l'encadré (et, côté droit,
   * du bouton rond). LE REMÈDE : quatre petits carrés de la taille du
   * rayon, posés DANS les coins du trou, peints de la même noirceur
   * et MASQUÉS par un quart de cercle (`radial-gradient` centré sur
   * le coin intérieur) : le voile suit exactement la courbe.
   * `pointerEvents: none` — un clic au coin traverse vers le bloc,
   * comme aujourd'hui (le coin est dans SA boîte).
   */
  const coin = (
    cle: string,
    x: number,
    y: number,
    rayon: number,
    centre: string
  ) => {
    if (rayon <= 0) return null;
    const masque = `radial-gradient(circle at ${centre}, transparent ${
      rayon - 0.5
    }px, black ${rayon}px)`;
    return (
      <div
        key={cle}
        data-voile-page={cle}
        aria-hidden="true"
        style={{
          position: "fixed",
          zIndex: ETAGE,
          backgroundColor: NOIRCEUR,
          transition: "none",
          pointerEvents: "none",
          top: y,
          left: x,
          width: rayon,
          height: rayon,
          WebkitMaskImage: masque,
          maskImage: masque,
        }}
      />
    );
  };

  /**
   * §1 (nº 450) — LE VOILE À PLUSIEURS TROUS, PAR COLONNES.
   * ------------------------------------------------------------------
   * Les trous d'un périmètre vivent sur une rangée, triés par gauche.
   * L'écran est découpé en COLONNES PLEINE HAUTEUR : à gauche du
   * premier trou, ENTRE chaque paire (l'air entre l'encadré et le
   * bouton — assombri, désormais), à droite du dernier. Puis, dans la
   * colonne de chaque trou : un pan au-dessus, un pan en dessous, et
   * ses quatre coins masqués (nº 449). Les pans se touchent sans se
   * recouvrir ; les interstices reçoivent les clics comme le reste du
   * voile (clic extérieur = fermeture, rien de nouveau à écrire).
   */
  const pans: React.ReactNode[] = [];
  if (!trous || trous.length === 0) {
    pans.push(pan("plein", { inset: 0 }));
  } else {
    pans.push(
      pan("colonne-gauche", {
        top: 0,
        bottom: 0,
        left: 0,
        width: Math.max(0, trous[0].left),
      })
    );
    trous.forEach((trou, rang) => {
      const suivant = trous[rang + 1];
      if (suivant) {
        pans.push(
          pan(`interstice-${rang}`, {
            top: 0,
            bottom: 0,
            left: trou.left + trou.width,
            width: Math.max(0, suivant.left - (trou.left + trou.width)),
          })
        );
      }
      pans.push(
        pan(`haut-${rang}`, {
          top: 0,
          left: trou.left,
          width: trou.width,
          height: Math.max(0, trou.top),
        }),
        pan(`bas-${rang}`, {
          top: trou.top + trou.height,
          bottom: 0,
          left: trou.left,
          width: trou.width,
        }),
        //  nº 449 — les quatre coins du trou, chacun masqué par SON
        //  quart de cercle : rayon gauche pour les coins gauches,
        //  droit pour les droits.
        coin(`coin-hg-${rang}`, trou.left, trou.top, trou.rayonGauche, "100% 100%"),
        coin(
          `coin-hd-${rang}`,
          trou.left + trou.width - trou.rayonDroit,
          trou.top,
          trou.rayonDroit,
          "0% 100%"
        ),
        coin(
          `coin-bg-${rang}`,
          trou.left,
          trou.top + trou.height - trou.rayonGauche,
          trou.rayonGauche,
          "100% 0%"
        ),
        coin(
          `coin-bd-${rang}`,
          trou.left + trou.width - trou.rayonDroit,
          trou.top + trou.height - trou.rayonDroit,
          trou.rayonDroit,
          "0% 0%"
        )
      );
    });
    const dernier = trous[trous.length - 1];
    pans.push(
      pan("colonne-droite", {
        top: 0,
        bottom: 0,
        left: dernier.left + dernier.width,
        right: 0,
      })
    );
  }

  return createPortal(<>{pans}</>, document.body);
}

/**
 * LE CROCHET QUE LES SURFACES APPELLENT.
 * `bloc` : l'élément à laisser CLAIR — et c'est le BLOC ENTIER, pas le
 * segment touché (l'encadré complet sur « Ma sélection » et sur le
 * moteur). Omis : rien n'est épargné, le voile est plein écran.
 * ⚠️ WEB UNIQUEMENT, et la décision est prise AU MOMENT OÙ LA SURFACE
 * S'OUVRE (jamais au rendu du serveur, qui ne connaît pas l'appareil).
 */
export function useVoileDeLaPage(
  ouvert: boolean,
  bloc?: React.RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (!ouvert) return;
    if (document.documentElement.dataset.appareil === "mobile") return;
    /**
     * §3 (nº 294) — DU SEGMENT AU BLOC ENTIER, EN UNE LIGNE.
     * L'appelant donne SON conteneur ; on remonte au premier ENCADRÉ
     * qui le contient (`data-encadre-barre`, l'écriture unique de
     * EncadreBarre — l'encadré favoris/suivis de « Ma sélection » et
     * celui du moteur en sont). Faute d'encadré, le conteneur lui-même.
     * C'est ce qui garantit qu'on n'épargne JAMAIS un demi-bloc.
     */
    const jeton = poserLeVoile(() => {
      const surface = bloc?.current ?? null;
      if (!surface) return null;
      /*  ██ §4 (nº 449) — LA RANGÉE MARQUÉE D'ABORD. Le moteur du web
          marque SA rangée entière (`data-voile-epargne` — l'encadré
          style+localité ET le bouton rond des filtres) : quel que
          soit le sens (menu ouvert, filtres ouverts), le voile
          épargne LA MÊME zone — le bouton rond n'est plus jamais
          assombri par le sens « menu ». Sans rangée marquée
          (« Ma sélection »), l'encadré, comme avant. */
      return (
        surface.closest<HTMLElement>("[data-voile-epargne]") ??
        surface.closest<HTMLElement>("[data-encadre-barre]") ??
        surface
      );
    });
    return () => retirerLeVoile(jeton);
  }, [ouvert, bloc]);
}
