"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { poserLeVoile, retirerLeVoile, sAbonnerAuVoile } from "@/lib/voile-de-la-page";

/**
 * ██ LE VOILE DE LA PAGE — §2 (nº 293) ██
 * ==================================================================
 * ⚠️ LE PIÈGE, ET IL A DÉJÀ COÛTÉ UNE PASSE (défaut nº 234). Une
 * plaque de verre floute TOUT CE QUI EST PEINT SOUS ELLE dans sa
 * racine d'arrière-plan. Un voile glissé entre la page et la plaque
 * est donc flouté À LA PLACE de la page — et la plaque, au lieu de
 * montrer la page adoucie, montre un aplat gris sale.
 *
 * COMMENT ON S'EN ASSURE, EN TROIS POINTS ET AUCUN N'EST FACULTATIF :
 *  1. LE VOILE EST LÉGER (18 %). C'est le remède exact de la nº 234,
 *     qui avait ramené un voile de 55 % à 25 % : la plaque continue de
 *     lire la page à travers lui. Un aplat dense, quelle que soit sa
 *     place, rendrait toute plaque grise ;
 *  2. AUCUN FONDU, AUCUNE TRANSFORMATION — ni sur le voile, ni sur les
 *     plaques. Une opacité partielle ou un `transform` sur un ancêtre
 *     crée une NOUVELLE racine d'arrière-plan : la plaque cesserait
 *     alors de voir la page du tout (c'est l'autre moitié du nº 234).
 *     Le voile apparaît et disparaît net ;
 *  3. IL VIT DANS UN PORTAIL AU CORPS DU DOCUMENT, comme les plaques
 *     elles-mêmes. Il est donc leur FRÈRE, jamais leur ancêtre : il ne
 *     peut pas leur fabriquer une racine d'arrière-plan, et son
 *     empilement se règle au seul `z-index`.
 *
 * ⚠️ IL PASSE SOUS LA BARRE, ET LA BARRE RESTE CLAIRE. Pas par
 * `z-index` — la barre est elle-même une plaque de verre, elle
 * flouterait le voile posé dessous et s'assombrirait avec lui. Le
 * voile COMMENCE donc au bas de la barre : il ne passe jamais
 * derrière elle, il n'y a rien à flouter.
 *
 * ⚠️ CLIQUER DESSUS REFERME, ET AUCUN MÉCANISME N'A ÉTÉ ÉCRIT POUR
 * CELA. Le voile est un frère des plaques dans le corps du document :
 * un clic dessus est, pour chaque surface ouverte, un clic À
 * L'EXTÉRIEUR de son conteneur — les fermetures au clic extérieur qui
 * existent déjà s'en chargent. Il ne retient donc aucun événement, et
 * n'en arrête aucun.
 *
 * ⚠️ WEB UNIQUEMENT. Au doigt, rien ne change : ces surfaces s'y
 * ouvrent en feuilles et en pages entières, qui n'ont rien à
 * assombrir derrière elles.
 */
export function VoileDeLaPage() {
  const [actif, setActif] = useState(false);
  const [hautDeLaBarre, setHautDeLaBarre] = useState(0);

  useEffect(() => sAbonnerAuVoile(setActif), []);

  useEffect(() => {
    if (!actif) return;
    //  LE BAS DE LA BARRE, mesuré — jamais une hauteur recopiée : la
    //  barre change de taille selon la page et le repli.
    const mesurer = () => {
      const barre = document.querySelector("header");
      setHautDeLaBarre(barre ? barre.getBoundingClientRect().bottom : 0);
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    window.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("scroll", mesurer);
    };
  }, [actif]);

  if (!actif) return null;
  return createPortal(
    <div
      data-voile-page=""
      aria-hidden="true"
      style={{
        position: "fixed",
        top: hautDeLaBarre,
        left: 0,
        right: 0,
        bottom: 0,
        //  ⚠️ SOUS TOUTES LES PLAQUES (elles montent à 50 et au-delà) et
        //  au-dessus de la page. Aucune transition, aucune transformation.
        zIndex: 30,
        backgroundColor: "rgba(0, 0, 0, 0.18)",
        //  ⚠️ ÉCRIT, PAS HÉRITÉ : aucune transition ne doit pouvoir
        //  s'accrocher au voile — un fondu sous une plaque de verre,
        //  c'est le défaut nº 234.
        transition: "none",
      }}
    />,
    document.body
  );
}

/**
 * LE CROCHET QUE LES SURFACES APPELLENT — un booléen, rien de plus.
 * ⚠️ WEB UNIQUEMENT, et la décision est prise AU MOMENT OÙ LA SURFACE
 * S'OUVRE (jamais au rendu du serveur, qui ne connaît pas l'appareil).
 */
export function useVoileDeLaPage(ouvert: boolean): void {
  useEffect(() => {
    if (!ouvert) return;
    if (document.documentElement.dataset.appareil === "mobile") return;
    poserLeVoile();
    return retirerLeVoile;
  }, [ouvert]);
}
