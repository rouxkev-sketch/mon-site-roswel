"use client";

import { useEffect, useRef } from "react";
import { souscrireAdresse } from "@/lib/adresse-courante";
import { noterNavigation } from "@/lib/boite-noire";
import { estDefilementProgramme } from "@/lib/defilement-programme";

/**
 * ██ §2 (nº 660) — LE TÉMOIN DES DÉPLACEMENTS CONSTATÉS ██
 * ==================================================================
 * POURQUOI IL EXISTE, ET IL RÉPOND À UNE QUESTION PRÉCISE. Le §1 de
 * cette passe fait signer CHAQUE mécanisme du site capable de déplacer
 * la page. Reste ce qu'aucun d'eux n'explique : l'ANCRAGE de WebKit,
 * le rabotage d'un document qui rétrécit, la restauration native du
 * navigateur, une extension, un mécanisme qu'on n'a pas encore nommé.
 * Celui-ci ne demande à personne : il REGARDE la page bouger, et il
 * écrit ce qu'il voit. Si un déplacement n'a pas de signature juste
 * au-dessus de lui dans la trace, c'est qu'il vient d'ailleurs — et
 * c'est exactement ce que le propriétaire cherche.
 *
 * QUAND IL REGARDE : les TROIS SECONDES qui suivent un changement
 * d'adresse, et rien d'autre. C'est la fenêtre du défaut (« au clic,
 * j'arrive en bas »), et c'est ce qui l'empêche de bavarder pendant
 * qu'on lit tranquillement une page.
 *
 * CE QU'IL ÉCRIT, ET COMMENT IL NE NOIE PAS LA TRACE :
 *  · il ne consigne pas les événements de défilement un à un — un
 *    doigt en produit des dizaines par seconde. Il les REGROUPE : une
 *    ligne par mouvement qui S'ARRÊTE (plus rien pendant 120 ms), avec
 *    la position AVANT, la position APRÈS et l'écart ;
 *  · il dit si le site avait ANNONCÉ ce mouvement
 *    (`estDefilementProgramme`, l'attribut que pose `defilerSansGeste`) :
 *    « annoncé » veut dire qu'un mécanisme du site en est l'auteur,
 *    « NON ANNONCÉ » qu'il vient d'ailleurs ;
 *  · il s'arrête au bout de DOUZE lignes pour une même adresse : au
 *    treizième mouvement, on a compris.
 *
 * ⚠️ IL NE DÉPLACE RIEN, NE LIT AUCUNE MÉMOIRE, NE DÉCIDE DE RIEN.
 * Écouteur passif, un `Math.round(window.scrollY)` par image au plus.
 * C'est la règle de la nº 654 : observer ne doit jamais changer ce
 * qu'on observe.
 * ⚠️ IL N'EST PAS UNE SONDE : rien à armer, aucune adresse à taper. Il
 * tourne toujours, comme la boîte noire elle-même — le défaut est
 * constaté APRÈS coup, une trace qui attend qu'on l'arme ne sert à
 * rien.
 */

/** La fenêtre d'observation après un changement d'adresse. */
const FENETRE_MS = 3000;
/** Un mouvement est « fini » quand plus rien ne bouge pendant ce
    temps : c'est ce qui regroupe une rafale en UNE ligne. */
const REPOS_MS = 120;
/** Au-delà, on se tait pour cette adresse : le journal doit rester
    lisible, et douze mouvements disent déjà tout. */
const LIGNES_MAX = 12;

export function ObservateurDeplacements() {
  /** Le minuteur de fin de fenêtre, et celui de fin de mouvement. */
  const finFenetre = useRef(0);
  const finMouvement = useRef(0);

  useEffect(() => {
    let regarde = false;
    let lignes = 0;
    let adresse = "";
    /** La position au DÉBUT du mouvement en cours (null : au repos). */
    let depart: number | null = null;

    const conclure = () => {
      finMouvement.current = 0;
      if (depart === null) return;
      const arrivee = Math.round(window.scrollY);
      const ecart = arrivee - depart;
      const avant = depart;
      depart = null;
      //  Un mouvement d'un pixel ou moins n'est pas un mouvement : les
      //  moteurs en produisent au rabotage, ils ne disent rien.
      if (Math.abs(ecart) <= 1) return;
      lignes += 1;
      if (lignes > LIGNES_MAX) return;
      noterNavigation(
        `DÉPLACEMENT CONSTATÉ · ${avant} → ${arrivee} (${
          ecart > 0 ? "+" : ""
        }${ecart} px) · ${
          estDefilementProgramme() ? "annoncé par le site" : "NON ANNONCÉ"
        } · document ${Math.round(
          document.documentElement.scrollHeight
        )} · sur ${adresse}` +
        (lignes === LIGNES_MAX ? " · (dernière ligne pour cette adresse)" : "")
      );
    };

    const auDefilement = () => {
      if (!regarde) return;
      if (depart === null) depart = Math.round(window.scrollY);
      window.clearTimeout(finMouvement.current);
      finMouvement.current = window.setTimeout(conclure, REPOS_MS);
    };

    const ouvrirLaFenetre = () => {
      adresse = window.location.pathname + window.location.search;
      regarde = true;
      lignes = 0;
      depart = null;
      noterNavigation(
        `OBSERVATION · ouverte sur ${adresse} · page à ${Math.round(
          window.scrollY
        )} · document ${Math.round(document.documentElement.scrollHeight)}`
      );
      window.clearTimeout(finFenetre.current);
      finFenetre.current = window.setTimeout(() => {
        conclure();
        regarde = false;
        noterNavigation(
          `OBSERVATION · fermée sur ${adresse} · page à ${Math.round(
            window.scrollY
          )} · document ${Math.round(
            document.documentElement.scrollHeight
          )} · ${lignes} déplacement${lignes > 1 ? "s" : ""}`
        );
      }, FENETRE_MS);
    };

    //  L'ARRIVÉE DU DOCUMENT compte comme un changement d'adresse : le
    //  défaut peut naître là aussi (le script d'avant peinture pose, la
    //  page bouge ensuite).
    ouvrirLaFenetre();
    const desabonner = souscrireAdresse(ouvrirLaFenetre);
    window.addEventListener("scroll", auDefilement, { passive: true });
    const finF = finFenetre;
    const finM = finMouvement;
    return () => {
      desabonner();
      window.removeEventListener("scroll", auDefilement);
      window.clearTimeout(finF.current);
      window.clearTimeout(finM.current);
    };
  }, []);

  return null;
}
