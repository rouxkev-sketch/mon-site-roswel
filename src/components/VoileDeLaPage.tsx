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
  /** §4 (nº 449) — les rayons des coins de la découpe : gauche puis
      droite. Lus sur le bloc épargné (`data-voile-rayons`, sinon son
      border-radius calculé) : la découpe ÉPOUSE les arrondis au lieu
      de couper à angles droits. */
  rayonGauche: number;
  rayonDroit: number;
};

/** §4 (nº 449) — LES RAYONS DE LA DÉCOUPE. La rangée du moteur les
    DÉCLARE (`data-voile-rayons="12 23"` — elle n'a pas de
    border-radius à elle) ; un encadré ordinaire les porte déjà dans
    son style calculé (l'encadré capsule de « Ma sélection » rend ses
    26 px tout seul). Bornés à la demi-hauteur : un rayon ne peut pas
    dépasser le demi-côté. */
function rayonsDeLaDecoupe(bloc: HTMLElement, hauteur: number): [number, number] {
  const declares = bloc.dataset.voileRayons;
  const plafond = hauteur / 2;
  if (declares) {
    const [gauche = 0, droite = 0] = declares.split(" ").map(Number);
    return [Math.min(gauche || 0, plafond), Math.min(droite || 0, plafond)];
  }
  const calcule = getComputedStyle(bloc);
  return [
    Math.min(parseFloat(calcule.borderTopLeftRadius) || 0, plafond),
    Math.min(parseFloat(calcule.borderTopRightRadius) || 0, plafond),
  ];
}

export function VoileDeLaPage() {
  const [actif, setActif] = useState(false);
  const [trou, setTrou] = useState<Rect | null>(null);
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
      const frais = bloc
        ? (() => {
            const boite = bloc.getBoundingClientRect();
            //  §4 (nº 449) — les rayons voyagent avec le rectangle :
            //  la découpe les épouse (voir les quatre coins plus bas).
            const [rayonGauche, rayonDroit] = rayonsDeLaDecoupe(
              bloc,
              boite.height
            );
            return {
              top: boite.top,
              left: boite.left,
              width: boite.width,
              height: boite.height,
              rayonGauche,
              rayonDroit,
            };
          })()
        : null;
      const signature = JSON.stringify(frais);
      if (signature === empreinte.current) return;
      empreinte.current = signature;
      setTrou(frais);
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

  //  SANS BLOC À ÉPARGNER : un seul pan, plein écran.
  const pans = !trou
    ? [pan("plein", { inset: 0 })]
    : [
        //  AU-DESSUS DU BLOC, puis EN DESSOUS, puis les deux CÔTÉS à sa
        //  hauteur : les quatre pans se touchent sans se recouvrir, et
        //  le bloc reste entièrement à découvert.
        pan("haut", { top: 0, left: 0, right: 0, height: Math.max(0, trou.top) }),
        pan("bas", { top: trou.top + trou.height, left: 0, right: 0, bottom: 0 }),
        pan("gauche", {
          top: trou.top,
          left: 0,
          width: Math.max(0, trou.left),
          height: trou.height,
        }),
        pan("droite", {
          top: trou.top,
          left: trou.left + trou.width,
          right: 0,
          height: trou.height,
        }),
        //  §4 (nº 449) — les quatre coins, chacun masqué par SON quart
        //  de cercle : rayon gauche pour les coins gauches, droit pour
        //  les droits (l'encadré et le bouton rond n'ont pas le même).
        coin("coin-hg", trou.left, trou.top, trou.rayonGauche, "100% 100%"),
        coin(
          "coin-hd",
          trou.left + trou.width - trou.rayonDroit,
          trou.top,
          trou.rayonDroit,
          "0% 100%"
        ),
        coin(
          "coin-bg",
          trou.left,
          trou.top + trou.height - trou.rayonGauche,
          trou.rayonGauche,
          "100% 0%"
        ),
        coin(
          "coin-bd",
          trou.left + trou.width - trou.rayonDroit,
          trou.top + trou.height - trou.rayonDroit,
          trou.rayonDroit,
          "0% 0%"
        ),
      ];

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
