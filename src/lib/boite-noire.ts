"use client";

/**
 * ██ §1 (nº 654) — LA BOÎTE NOIRE DE NAVIGATION ██
 * ==================================================================
 * POURQUOI ELLE EXISTE, ET POURQUOI ELLE NE RESSEMBLE À AUCUNE SONDE.
 * Le défaut relevé au web est ALÉATOIRE : un clic sur un style ouvre
 * parfois « toutes les réalisations » au lieu du style demandé, et
 * L'ADRESSE ELLE-MÊME est fausse — quelque chose a réécrit la
 * destination en route. Une sonde qu'on arme AVANT ne sert à rien : au
 * moment où le défaut frappe, elle n'était pas armée.
 * D'OÙ LE RENVERSEMENT : ce journal-ci tourne TOUJOURS, en silence, et
 * ne s'affiche QUE si on le demande APRÈS COUP (`?sonde-boite-noire=1`).
 * Rien à rejouer, rien à prévoir — la trace est déjà là.
 *
 * CE QU'ELLE COÛTE, ET C'EST TOUT CE QU'ELLE COÛTE : une lecture et une
 * écriture de `sessionStorage` par ÉVÉNEMENT DE NAVIGATION — quelques
 * lignes par page, jamais dans une boucle, jamais pendant une
 * animation. Aucun rendu, aucun abonnement, aucun travail au repos.
 * ⚠️ ELLE NE JUGE RIEN ET NE RÉPARE RIEN : elle écrit ce qui s'est
 * passé, dans l'ordre. Toute décision reste où elle était.
 *
 * ⚠️ MÉMOIRE DE SESSION, ET C'EST VOULU : la trace suit l'onglet — elle
 * survit aux navigations de document (c'est indispensable, le défaut
 * traverse justement des rechargements) et meurt avec l'onglet. Rien
 * n'est envoyé nulle part.
 */

/** La clé de rangement. Le script d'avant peinture écrit sous LA MÊME
    (il ne peut pas importer ce module, il le recopie une fois — voir
    `CLE_BOITE_NOIRE` employée dans lib/script-avant-peinture). */
export const CLE_BOITE_NOIRE = "roswel:boite-noire";

/** Le nombre de lignes gardées. Cinquante : de quoi couvrir la
    poignée de pages qui précède un défaut, sans jamais peser. */
export const LIGNES_BOITE_NOIRE = 50;

export type LigneBoiteNoire = {
  /** L'heure de l'événement, à la milliseconde. */
  h: number;
  /** Ce qui s'est passé, en clair. */
  texte: string;
};

function lireLeJournal(): LigneBoiteNoire[] {
  try {
    const brut = sessionStorage.getItem(CLE_BOITE_NOIRE);
    const lu = brut ? (JSON.parse(brut) as unknown) : null;
    return Array.isArray(lu) ? (lu as LigneBoiteNoire[]) : [];
  } catch {
    //  Mémoire indisponible (fenêtre privée d'un vieux navigateur,
    //  stockage refusé) : la boîte noire se tait, le site continue.
    return [];
  }
}

/**
 * ÉCRIRE UNE LIGNE. Le seul geste de ce module, et il ne peut pas
 * échouer bruyamment : tout est enveloppé.
 */
export function noterNavigation(texte: string): void {
  if (typeof window === "undefined") return;
  try {
    const lignes = lireLeJournal();
    lignes.push({ h: Date.now(), texte });
    //  On ne garde que la fin : les cinquante derniers événements.
    const gardees =
      lignes.length > LIGNES_BOITE_NOIRE
        ? lignes.slice(lignes.length - LIGNES_BOITE_NOIRE)
        : lignes;
    sessionStorage.setItem(CLE_BOITE_NOIRE, JSON.stringify(gardees));
  } catch {
    //  Voir `lireLeJournal` : on ne dérange personne pour un journal.
  }
}

/** LE JOURNAL, POUR L'AFFICHAGE. Lu au moment où on le demande. */
export function lignesDeLaBoiteNoire(): LigneBoiteNoire[] {
  if (typeof window === "undefined") return [];
  return lireLeJournal();
}

/** L'heure lisible d'une ligne — heure:minute:seconde.milliseconde. */
export function heureLisible(h: number): string {
  const d = new Date(h);
  const deux = (n: number) => String(n).padStart(2, "0");
  return (
    `${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}` +
    `.${String(d.getMilliseconds()).padStart(3, "0")}`
  );
}

/** Le relevé entier, prêt à copier. */
export function releveDeLaBoiteNoire(): string {
  const lignes = lignesDeLaBoiteNoire();
  if (lignes.length === 0) return "BOÎTE NOIRE · aucune ligne";
  return lignes
    .map((ligne) => `${heureLisible(ligne.h)} · ${ligne.texte}`)
    .join("\n");
}

/** Effacer — pour repartir d'une trace propre avant un essai. */
export function viderLaBoiteNoire(): void {
  try {
    sessionStorage.removeItem(CLE_BOITE_NOIRE);
  } catch {
    // Rien à faire : voir `lireLeJournal`.
  }
}
