"use client";

import { useEffect, useRef, useState } from "react";
//  ⚠️ TEMPORAIRE (nº 173) — la sonde-journal enregistre la valeur de ce
//  crochet à chaque changement. Elle n'écrit RIEN sans `?sonde-bascule=1`.
import { noter } from "@/lib/journal-bascule";

/**
 * SUIS-JE SUR UN VRAI MOBILE ?
 * =============================
 * La réponse est posée UNE SEULE FOIS, par le script en tête de page
 * (voir app/(tatouage)/layout.tsx) : `data-appareil="mobile"` sur
 * <html>, d'après `matchMedia("(pointer: coarse)")`. Un doigt, pas une
 * largeur de fenêtre — c'est la règle du site depuis P60, et elle ne
 * change pas ici.
 *
 * CE CROCHET NE FAIT QUE LA LIRE, après le premier rendu : le serveur
 * ne connaît pas l'appareil, il ne doit donc jamais rendre autre chose
 * que la version « web ». Le premier rendu du navigateur dit la même
 * chose, puis l'effet corrige — aucune discordance d'hydratation.
 */
export function useAppareilMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    // Dans un effet, et par une fonction : rien n'est posé dans le
    // corps de l'effet (React le déconseille).
    const lire = () => {
      setMobile(document.documentElement.dataset.appareil === "mobile");
    };
    const image = requestAnimationFrame(lire);
    /*  §2 (nº 431) — ET RESTER JUSTE, PAS SEULEMENT L'ÊTRE UNE FOIS :
        le script d'avant-peinture RECALE `data-appareil` aux instants
        fiables (première image, pageshow, changement du média) — le
        relevé du propriétaire a montré `matchMedia("(pointer:
        coarse)")` répondant FAUX à l'analyse du document d'un
        rechargement tiré du doigt. Une lecture unique figeait alors
        « web » pour toute la vie du composant. Le crochet suit
        désormais les mêmes instants : il relit l'attribut — jamais le
        média directement, l'écrivain reste unique. (Les abonnements
        du script tournent avant les nôtres : à `pageshow`, l'attribut
        est déjà recalé quand on le lit.) */
    const media = matchMedia("(pointer: coarse)");
    media.addEventListener?.("change", lire);
    window.addEventListener("pageshow", lire);
    return () => {
      cancelAnimationFrame(image);
      media.removeEventListener?.("change", lire);
      window.removeEventListener("pageshow", lire);
    };
  }, []);
  //  ⚠️ TEMPORAIRE (nº 173) — LE JOURNAL, à chaque CHANGEMENT de la
  //  valeur rendue : la valeur, la largeur du moment, et le critère qui
  //  l'a produite. Il n'y a AUCUN SEUIL DE LARGEUR ici (c'est la règle
  //  du site depuis la nº 60) : la réponse vient de
  //  `matchMedia("(pointer: coarse)")`, lu avant la peinture et écrit en
  //  `data-appareil` sur <html>. La largeur est journalisée quand même,
  //  pour la mettre en regard des lignes FENÊTRE et VISUEL.
  const connue = useRef<boolean | null>(null);
  useEffect(() => {
    if (connue.current === mobile) return;
    connue.current = mobile;
    noter(
      `CROCHET useAppareilMobile = ${mobile} · largeur ${window.innerWidth} · ` +
        `data-appareil="${document.documentElement.dataset.appareil ?? "(absent)"}" · ` +
        `critère pointer:coarse — aucun seuil de largeur`
    );
  }, [mobile]);
  return mobile;
}
