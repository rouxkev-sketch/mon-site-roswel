"use client";

import { useEffect } from "react";
import { armerLaRemontee } from "@/lib/remontee-champ";

/**
 * TOUS LES CHAMPS DU SITE REMONTENT AU TOUCHER (passe nº 155-§1)
 * ===============================================================
 * Posé UNE FOIS dans la mise en page de yokofolio, ce composant écoute
 * `focusin` — l'événement de focus qui REMONTE (le focus lui-même ne
 * bulle pas) — et arme la remontée partagée (lib/remontee-champ) pour
 * chaque champ de saisie qui prend le doigt. Il n'affiche rien.
 *
 * POURQUOI UN ÉCOUTEUR GLOBAL, ET PAS UNE PROP SUR CHAQUE CHAMP. Le
 * site compte des dizaines de champs — connexion, création de compte,
 * portfolio, sécurité, contact, administration… En équiper un par un,
 * c'est en oublier un par passe ; la règle est GLOBALE, l'écouteur
 * l'est aussi. Un champ né demain remontera sans qu'on y pense.
 *
 * QUELS CHAMPS : tout ce qui fait venir un clavier — les `input` de
 * texte sous toutes leurs formes et les `textarea`. PAS les cases, ni
 * les boutons radio, ni les boutons : aucun clavier ne les suit, les
 * faire défiler serait un sursaut gratuit.
 *
 * VRAIS MOBILES SEULEMENT (C1, `data-appareil="mobile"`) : à la
 * souris, aucun clavier ne recouvre rien — défiler au clic serait une
 * gêne, pas un service.
 *
 * ⚠️ LE CHAMP DE LOCALITÉ GARDE SA PROPRE MÉCANIQUE
 * (`data-remonte-au-toucher`, ChampLocalisation) : elle est liée à
 * l'OUVERTURE DE SA LISTE, pas au focus — la jouer deux fois ferait
 * deux glissades. L'écouteur global le laisse passer.
 *
 * L'ANNULATION : perdre le focus avant que le clavier ne soit arrivé
 * (fermeture, bascule de champ) désarme la remontée en attente — on ne
 * fait jamais défiler vers un champ qu'on a quitté.
 */

const CHAMPS_QUI_REMONTENT =
  'input:not([type]), input[type="text"], input[type="search"], ' +
  'input[type="email"], input[type="password"], input[type="tel"], ' +
  'input[type="url"], input[type="number"], textarea';

export function RemonteeChamps() {
  useEffect(() => {
    let desarmer: (() => void) | null = null;

    function auFocus(evenement: FocusEvent) {
      // C1 — la règle du site : l'appareil, jamais la largeur.
      if (document.documentElement.dataset.appareil !== "mobile") return;
      const cible = evenement.target;
      if (!(cible instanceof HTMLElement)) return;
      if (!cible.matches(CHAMPS_QUI_REMONTENT)) return;
      // La localité s'occupe d'elle-même (voir ci-dessus).
      if (cible.hasAttribute("data-remonte-au-toucher")) return;
      desarmer?.();
      desarmer = armerLaRemontee(cible);
    }
    function auDepart() {
      desarmer?.();
      desarmer = null;
    }

    document.addEventListener("focusin", auFocus);
    document.addEventListener("focusout", auDepart);
    return () => {
      document.removeEventListener("focusin", auFocus);
      document.removeEventListener("focusout", auDepart);
      desarmer?.();
    };
  }, []);

  return null;
}
