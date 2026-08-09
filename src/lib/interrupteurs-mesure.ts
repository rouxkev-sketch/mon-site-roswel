"use client";

/**
 * LES INTERRUPTEURS DE MESURE — éteindre un suspect à la fois
 * ============================================================
 * TEMPORAIRE, comme la sonde du retour, et pour la même enquête :
 * l'écran gris du retour au balayage du doigt.
 *
 * Sept passes ont cherché ce défaut. Le dernier relevé l'a enfin cerné :
 * au BOUTON du navigateur, la première image arrive en 27 ms ; au
 * BALAYAGE DU DOIGT, en 357 à 382 ms — même page, mêmes cartes, mosaïque
 * déjà rendue, aucune requête. Quelque chose ne se produit QUE pendant le
 * geste.
 *
 * Le banc d'essai ne sait pas reproduire ce contraste : Chromium sous
 * Linux n'a pas le geste de retour d'iOS, et des événements tactiles
 * fabriqués à la main ne déclenchent aucune animation de transition.
 * La mesure doit donc se faire sur l'appareil du propriétaire — mais en
 * ISOLANT les suspects un par un, sinon on ne saura rien de plus.
 *
 * D'OÙ CES INTERRUPTEURS. On ajoute `&sans=…` à l'adresse, et le suspect
 * nommé ne s'exécute pas de la visite. Le choix est retenu pour l'onglet
 * (comme la sonde), il survit donc aux changements de page :
 *
 *   ?sonde-retour=1&sans=tactile   le zoom au pincement ne pose plus son
 *                                  écouteur `touchmove` NON PASSIF sur
 *                                  chaque carte (suspects nº 3 et nº 6)
 *   ?sonde-retour=1&sans=reserve   la réserve de hauteur ne surveille
 *                                  plus image par image — elle se libère
 *                                  du premier coup (suspect nº 5)
 *   ?sonde-retour=1&sans=memoire   la mosaïque n'est plus mise de côté
 *                                  avant la peinture, mais après
 *   ?sonde-retour=1&sans=rien      tout est rallumé (pour revenir au
 *                                  témoin sans fermer l'onglet)
 *
 * Plusieurs à la fois : `&sans=tactile,reserve`.
 *
 * ⚠️ AUCUN de ces interrupteurs ne change quoi que ce soit tant qu'on ne
 * le demande pas : par défaut, le site se comporte exactement comme
 * avant. C'est un instrument de mesure, pas un réglage.
 */

const CLE = "yokofolio:sans";

/** Les noms reconnus — une faute de frappe ne doit pas éteindre au
    hasard, ni passer inaperçue. */
export type SuspectMesure = "tactile" | "reserve" | "memoire";

function lireDemande(): string {
  if (typeof window === "undefined") return "";
  try {
    const demande = new URLSearchParams(window.location.search).get("sans");
    if (demande !== null) {
      if (demande === "rien" || demande === "") {
        sessionStorage.removeItem(CLE);
        return "";
      }
      sessionStorage.setItem(CLE, demande);
      return demande;
    }
    return sessionStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}

/** CE SUSPECT EST-IL ÉTEINT pour cette visite ? */
export function sans(suspect: SuspectMesure): boolean {
  return lireDemande()
    .split(",")
    .map((m) => m.trim())
    .includes(suspect);
}

/** Ce qui est éteint, en clair — la sonde l'écrit en tête du relevé pour
    qu'aucun chiffre ne soit lu sans savoir dans quelles conditions il a
    été pris. */
export function interrupteursEnClair(): string {
  const demande = lireDemande();
  if (!demande) return "tout est allumé (comportement normal du site)";
  return `ÉTEINT pour cette mesure : ${demande}`;
}

/* ══════════════════════════════════════════════════════════════════
 * LES ESSAIS — une correction proposée, allumée à la demande
 * ══════════════════════════════════════════════════════════════════
 * Même mécanique que les interrupteurs, mais dans l'autre sens : ici on
 * ALLUME quelque chose qui est éteint par défaut, pour le mettre à
 * l'épreuve sur l'appareil du propriétaire avant de le rendre normal.
 *
 *   ?essai=document   sur smartphone, toucher une carte fait une VRAIE
 *                     NAVIGATION DE DOCUMENT au lieu d'une navigation
 *                     interne du routeur. Le navigateur garde alors une
 *                     capture de la mosaïque, et le balayage de retour
 *                     la révèle au lieu de montrer son fond gris.
 *   ?essai=rien       revient au comportement normal.
 */
const CLE_ESSAI = "yokofolio:essai";

export type EssaiMesure = "document";

function lireEssai(): string {
  if (typeof window === "undefined") return "";
  try {
    const demande = new URLSearchParams(window.location.search).get("essai");
    if (demande !== null) {
      if (demande === "rien" || demande === "") {
        sessionStorage.removeItem(CLE_ESSAI);
        return "";
      }
      sessionStorage.setItem(CLE_ESSAI, demande);
      return demande;
    }
    return sessionStorage.getItem(CLE_ESSAI) ?? "";
  } catch {
    return "";
  }
}

/** CET ESSAI EST-IL ALLUMÉ pour cette visite ? */
export function essai(nom: EssaiMesure): boolean {
  return lireEssai()
    .split(",")
    .map((m) => m.trim())
    .includes(nom);
}

/** Ce qui est à l'essai, en clair — la sonde l'écrit avec le reste. */
export function essaisEnClair(): string {
  const demande = lireEssai();
  return demande ? `À L'ESSAI : ${demande}` : "aucun essai";
}
