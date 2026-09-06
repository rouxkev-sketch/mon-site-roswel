"use client";

/**
 * ██ LE JOURNAL DU DIAGNOSTIC — VINGT LIGNES, ET RIEN SANS ARMEMENT ██
 * ==================================================================
 * (passe nº 884, à la demande du propriétaire)
 *
 * POURQUOI IL EXISTE. Le défaut que le propriétaire poursuit ne se
 * produit que sur CHROME iOS : une page ouverte depuis une page
 * légèrement défilée paraît défilée de quelques pixels, et la barre
 * fixe comme le va-et-vient restent INTOUCHABLES jusqu'au premier
 * défilement. Aucun atelier ici ne le reproduit — Chromium de bureau
 * ne replie pas de barre d'adresse, et WebKit n'est pas installé. La
 * seule mesure possible est donc CELLE QU'IL FERA LUI-MÊME, sur son
 * téléphone : ce journal et le bandeau qui le montre
 * (components/BandeauDiagnostic).
 *
 * CE QU'IL ENREGISTRE — les quatre moments qui décident, chacun écrit
 * là où il se produit et nulle part ailleurs :
 *  · l'ARRIVÉE d'une page (DefilementEnHaut) ;
 *  · chaque POSE DE ZÉRO (lib/arrivee-en-haut, seule écriture du
 *    site) ;
 *  · la GARDE DE POSITION armée, et éteinte AVEC SA RAISON
 *    (lib/defilement-programme) ;
 *  · chaque TOUCHER reçu, avec sa cible (lib/geste-toucher) — c'est
 *    LA question du propriétaire : le toucher arrive-t-il seulement ?
 *
 * ⚠️ DÉSARMÉ, IL NE COÛTE QU'UN TEST DE BOOLÉEN. Aucune écriture,
 * aucun écouteur, aucun abonnement, aucune allocation : `noterDiag`
 * sort à sa première ligne. C'est la règle des sondes du site
 * (lib/sondes-armees, nº 343) — mais SANS mémoire durable : ce
 * journal-ci meurt avec la page, et ne s'arme que par l'adresse
 * (`?diag=1`) ET pour l'administration.
 *
 * ⚠️ IL NE DÉPLACE RIEN, ne pose aucune entrée d'historique, ne gèle
 * rien : il observe.
 */

/**
 * QUARANTE LIGNES DEPUIS LA nº 885 (vingt à la nº 884). Le journal
 * enregistre désormais aussi les CLICS, les appels de NAVIGATION et
 * les défilements d'après la garde : vingt lignes se remplissaient en
 * un seul geste, et la cause partait par le haut avant d'être lue.
 */
export const LIGNES_GARDEES = 40;

let arme = false;
const lignes: string[] = [];
const abonnes = new Set<() => void>();

/** L'HEURE LISIBLE — c'est le propriétaire qui lira, pas une machine. */
function horodatage(): string {
  const d = new Date();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}.${String(
    d.getMilliseconds()
  ).padStart(3, "0")}`;
}

/** ARMER — appelé par le bandeau, et par lui seul. */
export function armerLeDiagnostic(): void {
  arme = true;
}

/** LE JOURNAL EST-IL ARMÉ ? (le bandeau le demande à son montage.) */
export function diagnosticArme(): boolean {
  return arme;
}

/**
 * NOTER UNE LIGNE. Désarmé : ne fait rien, et ne coûte rien.
 * ⚠️ `quoi` est déjà écrit par l'appelant — on ne calcule RIEN ici
 * tant qu'on n'est pas armé, et les appelants ne construisent leur
 * chaîne qu'après avoir demandé `diagnosticArme()` quand elle coûte
 * (une lecture de DOM, par exemple).
 */
export function noterDiag(quoi: string): void {
  if (!arme) return;
  lignes.push(`${horodatage()}  ${quoi}`);
  if (lignes.length > LIGNES_GARDEES) lignes.shift();
  for (const rappel of abonnes) rappel();
}

/** LES LIGNES, de la plus ancienne à la plus récente. */
export function lignesDuDiagnostic(): string[] {
  return lignes.slice();
}

/** S'ABONNER AUX NOUVELLES LIGNES. Rend le désabonnement. */
export function auJournalDiagnostic(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

/** NOMMER UN NŒUD en une ligne lisible — la balise, son rôle, sa
    classe raccourcie. Sert au journal comme au bandeau. */
export function nommerLeNoeud(noeud: Element | null): string {
  if (!noeud) return "(aucun)";
  const balise = noeud.tagName.toLowerCase();
  const role = noeud.getAttribute("aria-label");
  const donnees = [...noeud.attributes]
    .map((a) => a.name)
    .filter((n) => n.startsWith("data-"))
    .slice(0, 3)
    .join(",");
  const classe = (noeud.getAttribute("class") ?? "").replace(/\s+/g, " ").slice(0, 40);
  return `${balise}${role ? `[${role}]` : ""}${donnees ? `{${donnees}}` : ""}${
    classe ? ` .${classe}` : ""
  }`;
}
