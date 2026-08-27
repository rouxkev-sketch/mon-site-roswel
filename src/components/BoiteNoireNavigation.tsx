"use client";

import { useEffect, useRef } from "react";
import { souscrireAdresse } from "@/lib/adresse-courante";
import { noterNavigation } from "@/lib/boite-noire";

/**
 * ██ §1 (nº 654) — LES DEUX ÉCOUTES DE LA BOÎTE NOIRE ██
 * ==================================================================
 * Ce composant N'AFFICHE RIEN et ne décide RIEN. Il écoute deux
 * choses, et les écrit dans la boîte noire (lib/boite-noire) :
 *
 *  1. LA NAVIGATION DEMANDÉE — le clic sur un lien, avec l'adresse
 *     visée et QUI porte ce lien. Le porteur se lit sur la page
 *     elle-même : le plus proche marqueur `data-source-composant` (les
 *     surfaces en posent déjà un) ou, à défaut, le premier repère
 *     `data-…` rencontré en remontant. Aucun composant n'a eu à se
 *     déclarer, aucun fichier n'a été touché pour ça.
 *  2. LE CHANGEMENT D'ADRESSE CONSTATÉ — après coup, avec l'adresse
 *     d'AVANT. L'écoute est celle qui existe déjà (`souscrireAdresse`,
 *     nº 361) : elle couvre `pushState`, `replaceState` ET le retour du
 *     navigateur. Rien de neuf n'est posé sur l'historique.
 *
 * ⚠️ CE QUE ÇA NE COUVRE PAS, ET JE LE DIS : une navigation demandée
 * par du code (`router.push`) n'est pas un clic — elle est notée là où
 * elle est écrite, chez son appelant (EnTeteTatouage). Le changement
 * d'adresse, lui, est vu ici dans tous les cas.
 *
 * ⚠️ EN CAPTURE, ET SANS RIEN CONSOMMER : l'écouteur ne lit que
 * l'événement. Il n'appelle ni `preventDefault`, ni `stopPropagation` —
 * observer ne doit jamais changer ce qu'on observe.
 */
export function BoiteNoireNavigation() {
  /** L'adresse d'avant, pour dire d'où l'on vient. */
  const precedente = useRef<string>("");

  useEffect(() => {
    precedente.current = window.location.pathname + window.location.search;
    noterNavigation(`DOCUMENT · ouvert sur ${precedente.current}`);

    const auClic = (evenement: MouseEvent) => {
      const cible = evenement.target;
      if (!(cible instanceof Element)) return;
      const lien = cible.closest("a");
      if (!lien) return;
      const href = lien.getAttribute("href") ?? "(sans href)";
      const porteur =
        lien.closest("[data-source-composant]")?.getAttribute(
          "data-source-composant"
        ) ??
        nomDuPorteur(lien) ??
        "(porteur inconnu)";
      const mot = (lien.textContent ?? "").trim().slice(0, 30);
      noterNavigation(
        `CLIC LIEN · ${porteur} · vers ${href}${mot ? ` · « ${mot} »` : ""}`
      );
    };
    window.addEventListener("click", auClic, true);

    const auChangement = () => {
      const nouvelle = window.location.pathname + window.location.search;
      if (nouvelle === precedente.current) return;
      noterNavigation(`ADRESSE · ${precedente.current} → ${nouvelle}`);
      precedente.current = nouvelle;
    };
    const desabonner = souscrireAdresse(auChangement);

    return () => {
      window.removeEventListener("click", auClic, true);
      desabonner();
    };
  }, []);

  return null;
}

/**
 * QUI PORTE CE LIEN, quand aucune surface ne s'est nommée : on remonte
 * jusqu'au premier attribut `data-…` du site, qui suffit presque
 * toujours à reconnaître l'endroit (`data-lien-carte`,
 * `data-tete-compte`, `data-rangee-moteur`…). `null` si l'on remonte
 * jusqu'au corps sans rien trouver.
 */
function nomDuPorteur(depart: Element): string | null {
  let noeud: Element | null = depart;
  while (noeud && noeud !== document.body) {
    for (const nom of noeud.getAttributeNames()) {
      if (nom.startsWith("data-") && nom !== "data-source-composant") {
        return nom;
      }
    }
    noeud = noeud.parentElement;
  }
  return null;
}
