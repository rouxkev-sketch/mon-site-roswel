"use client";

import { useEffect } from "react";
import { demarrerJournal, noterRendu } from "@/lib/journal-de-bord";

/**
 * LE COMPOSANT DU JOURNAL DE BORD (nº 272-§2) — monté une fois, dans
 * la mise en page du groupe tatouage, à côté des sondes. Il ne rend
 * RIEN et ne change rien au site : il compte ses propres rendus (la
 * mise en page se re-rend avec la page — un emballement de rendus se
 * lit donc ici) et démarre les écouteurs du journal au montage.
 * Toute la mécanique vit dans src/lib/journal-de-bord.
 */
export function JournalDeBord() {
  //  À CHAQUE RENDU — c'est le compteur de rendus par seconde.
  noterRendu();
  useEffect(() => {
    demarrerJournal();
  }, []);
  return null;
}
