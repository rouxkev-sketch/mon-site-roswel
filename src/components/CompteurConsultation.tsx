"use client";

import { useEffect } from "react";
import { signalerConsultation } from "@/lib/balise-popularite";

/**
 * UNE FICHE OUVERTE EST UNE FICHE CONSULTÉE (passe nº 220-§1)
 * ==================================================================
 * LE DÉFAUT : la balise de popularité n'était envoyée QUE depuis une
 * carte de mosaïque (CarteTatoueur). Ouvrir une fiche autrement — un
 * lien partagé, « Ma sélection », l'adresse tapée à la main, un
 * résultat de moteur de recherche, le bouton « Suivre » d'une
 * notification — ne comptait RIEN. Le compteur mesurait donc les clics
 * sur les cartes, pas les consultations.
 *
 * Ce composant complète le comptage à la source qui compte vraiment :
 * LA FICHE ELLE-MÊME. Posé sur la page publique, il signale la
 * consultation au montage.
 *
 * ⚠️ AUCUN RISQUE DE DOUBLE COMPTAGE. La base dédoublonne par
 * VISITEUR, par FICHE et par JOUR (index unique de la migration nº 7,
 * et l'API insère en ignorant les doublons) : venir par une carte puis
 * rester sur la fiche compte UNE fois, et ouvrir cent fois la même
 * fiche dans la journée compte UNE fois aussi. C'est ce qui empêche
 * quiconque de gonfler son propre score.
 *
 * ⚠️ JAMAIS BLOQUANT : `sendBeacon` part sans retarder l'affichage, et
 * un échec n'a aucun effet visible. La fiche s'affiche exactement
 * pareil si la migration nº 7 n'est pas passée.
 */
export function CompteurConsultation({ slug }: { slug: string }) {
  useEffect(() => {
    //  Un aperçu (« Ma fiche ») n'est pas une consultation : la page
    //  publique est la seule à poser ce composant.
    //  §2 (nº 725) — L’ENVOI EST L’ÉCRITURE UNIQUE, et c’est elle qui
    //  tient le verrou : la carte et cette page-ci se rejoignent sur le
    //  même parcours, et n’envoyaient qu’un doublon (lib/balise-popularite).
    signalerConsultation(slug);
  }, [slug]);

  return null;
}
