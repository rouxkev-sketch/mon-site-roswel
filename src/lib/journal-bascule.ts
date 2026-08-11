"use client";

/**
 * LE JOURNAL DE LA BASCULE — il enregistre, il ne corrige rien
 * ==================================================================
 * (passe nº 173)
 *
 * LE DÉFAUT À ÉCLAIRER : sur iPhone, au clic sur l'un des deux boutons
 * de bascule, tout le contenu de la page disparaît une fraction de
 * seconde, puis revient. SYSTÉMATIQUE sur téléphone, INEXISTANT sur
 * web. Un défaut qui ne se produit que là désigne un chemin de code
 * différent — et ce chemin, seul l'appareil du propriétaire peut le
 * dire.
 *
 * CE MODULE EST LE CARNET. Les composants y écrivent une ligne quand
 * il se passe quelque chose ; la sonde (SondeBascule) le lit et
 * l'affiche. Il ne vit QUE si l'adresse porte `?sonde-bascule=1` :
 * sans elle, `noter()` sort à la première ligne et ne coûte rien.
 *
 * ⚠️ AUCUN ÉTAT REACT NULLE PART. Le journal est un tableau de module,
 * les abonnés sont des fonctions : un enregistrement ne provoque
 * jamais de rendu, et ne peut donc pas déranger ce qu'il observe.
 */

/** Une ligne : le temps depuis la première, et le texte. */
export type Ligne = { t: number; texte: string };

const LIGNES_GARDEES = 400;

const journal: Ligne[] = [];
const abonnes = new Set<() => void>();
let depart = 0;
let armeeConnue: boolean | null = null;

/** La sonde est-elle demandée ? Lu UNE FOIS, gardé ensuite. */
export function sondeBasculeArmee(): boolean {
  if (armeeConnue !== null) return armeeConnue;
  if (typeof window === "undefined") return false;
  armeeConnue =
    new URLSearchParams(window.location.search).get("sonde-bascule") === "1";
  return armeeConnue;
}

/** Écrire une ligne. Sans la sonde, ne fait STRICTEMENT rien. */
export function noter(texte: string): void {
  if (!sondeBasculeArmee()) return;
  const maintenant = performance.now();
  if (depart === 0) depart = maintenant;
  journal.push({ t: Math.round(maintenant - depart), texte });
  //  Le journal ne s'efface jamais tout seul : il oublie seulement les
  //  plus vieilles lignes quand il devient très long.
  if (journal.length > LIGNES_GARDEES) journal.splice(0, 40);
  for (const rappel of abonnes) rappel();
}

/** LES INSTANCES VIVANTES d'un composant — c'est la ligne qui compte :
    un « démontage » après un clic, et la cause est trouvée. */
const vivants = new Map<string, number>();

export function noterMontage(quoi: string, precision = ""): void {
  if (!sondeBasculeArmee()) return;
  const compte = (vivants.get(quoi) ?? 0) + 1;
  vivants.set(quoi, compte);
  noter(`MONTAGE ${quoi} · instances ${compte}${precision ? ` · ${precision}` : ""}`);
}

export function noterDemontage(quoi: string): void {
  if (!sondeBasculeArmee()) return;
  const compte = Math.max(0, (vivants.get(quoi) ?? 1) - 1);
  vivants.set(quoi, compte);
  noter(`⚠️ DÉMONTAGE ${quoi} · instances ${compte}`);
}

export function lignesDuJournal(): Ligne[] {
  return journal;
}

export function souscrireAuJournal(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}
