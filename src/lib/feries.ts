/**
 * JOURS FÉRIÉS FRANÇAIS (métropole)
 * ---------------------------------
 * Calculés LOCALEMENT, sans appel réseau : les fériés fixes + les
 * fériés liés à Pâques (lundi de Pâques, Ascension, lundi de
 * Pentecôte), via l'algorithme officiel de calcul de la date de
 * Pâques (méthode de Butcher-Meeus, valable pour toutes les années
 * du calendrier grégorien).
 *
 * Utilisé par le filtre Urgence : un jour férié, seuls les artisans
 * « j'interviens les jours fériés » ressortent.
 */

const FUSEAU_HORAIRE = "Europe/Paris";

/** Le dimanche de Pâques d'une année donnée → { mois (1-12), jour } */
function paques(annee: number): { mois: number; jour: number } {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return { mois, jour };
}

/** "AAAA-MM-JJ" d'une date décalée de n jours après Pâques */
function apresPaques(annee: number, decalage: number): string {
  const { mois, jour } = paques(annee);
  const date = new Date(Date.UTC(annee, mois - 1, jour + decalage));
  return date.toISOString().slice(0, 10);
}

/** Tous les jours fériés d'une année, au format "AAAA-MM-JJ" */
export function joursFeries(annee: number): string[] {
  const fixe = (mois: number, jour: number) =>
    `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
  return [
    fixe(1, 1),   // Jour de l'an
    apresPaques(annee, 1),  // Lundi de Pâques
    fixe(5, 1),   // Fête du Travail
    fixe(5, 8),   // Victoire 1945
    apresPaques(annee, 39), // Ascension
    apresPaques(annee, 50), // Lundi de Pentecôte
    fixe(7, 14),  // Fête nationale
    fixe(8, 15),  // Assomption
    fixe(11, 1),  // Toussaint
    fixe(11, 11), // Armistice 1918
    fixe(12, 25), // Noël
  ];
}

/** Sommes-nous un jour férié (à la date française du moment) ? */
export function estJourFerie(date: Date = new Date()): boolean {
  const aujourdHui = new Intl.DateTimeFormat("fr-CA", {
    timeZone: FUSEAU_HORAIRE,
  }).format(date); // "AAAA-MM-JJ"
  const annee = Number(aujourdHui.slice(0, 4));
  return joursFeries(annee).includes(aujourdHui);
}
