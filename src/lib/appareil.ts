"use client";

import { useEffect, useState } from "react";

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
    const image = requestAnimationFrame(() => {
      setMobile(document.documentElement.dataset.appareil === "mobile");
    });
    return () => cancelAnimationFrame(image);
  }, []);
  return mobile;
}
