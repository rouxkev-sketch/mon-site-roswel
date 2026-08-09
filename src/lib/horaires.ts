/**
 * HORAIRES D'OUVERTURE
 * --------------------
 * Format enregistré en base : un objet avec les 7 jours, chaque
 * jour valant :
 *  - null → fermé ;
 *  - "24h24" → ouvert 24h/24 ;
 *  - un tableau de créneaux "HH:MM-HH:MM" (un ou plusieurs) :
 *    ["08:00-12:00", "14:00-18:00"].
 * Exemple : { "lundi": ["08:00-12:00", "14:00-18:00"],
 *             "samedi": "24h24", "dimanche": null, … }
 *
 * Compatibilité : l'ANCIEN format (une seule plage "08:00-19:00" en
 * texte) est encore lu partout, comme un tableau d'un créneau.
 *
 * « Travaille la nuit » et « travaille le week-end » ne sont PLUS
 * des cases à cocher : elles sont DÉDUITES de ces horaires (voir
 * travailleNuit / travailleWeekend) et enregistrées par le serveur.
 */

export const JOURS_SEMAINE = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type JourSemaine = (typeof JOURS_SEMAINE)[number];

/** Un jour : fermé (null), 24h/24, ou une liste de créneaux.
    (string seule = ancien format, lu comme un créneau unique) */
export type HorairesJour = string[] | "24h24" | string | null;

export type HorairesSemaine = Partial<Record<JourSemaine, HorairesJour>>;

// L'heure de référence du site (les artisans sont en France)
const FUSEAU_HORAIRE = "Europe/Paris";

// La « nuit » au sens du filtre : de 22 h à 6 h
const NUIT_DEBUT = 22 * 60;
const NUIT_FIN = 6 * 60;

/** "8h30", "08:30" ou "8h" → minutes depuis minuit (null si illisible) */
export function enMinutes(heure: string): number | null {
  const morceaux = heure.trim().match(/^(\d{1,2})(?:[h:](\d{2})?)?$/);
  if (!morceaux) return null;
  const heures = Number(morceaux[1]);
  const minutes = Number(morceaux[2] ?? 0);
  if (heures > 23 || minutes > 59) return null;
  return heures * 60 + minutes;
}

/** La valeur d'un jour, mise à plat : null (fermé), "24h24", ou la
    liste des créneaux [{debut, fin}] en minutes (créneaux illisibles
    écartés). Accepte l'ancien format texte. */
export function lireJour(
  valeur: HorairesJour | undefined
): "24h24" | Array<{ debut: number; fin: number }> | null {
  if (valeur == null) return null;
  if (valeur === "24h24") return "24h24";
  const plages = Array.isArray(valeur) ? valeur : [valeur]; // ancien format
  const creneaux: Array<{ debut: number; fin: number }> = [];
  for (const plage of plages) {
    const [debutBrut, finBrut] = String(plage).split("-");
    const debut = enMinutes(debutBrut ?? "");
    const fin = enMinutes(finBrut ?? "");
    if (debut != null && fin != null) creneaux.push({ debut, fin });
  }
  return creneaux.length > 0 ? creneaux : null;
}

/** Jour ("lundi") et heure (minutes) actuels, à l'heure française */
function maintenantEnFrance(date: Date): { jour: string; minutes: number } {
  const morceaux = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU_HORAIRE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lire = (type: string) =>
    morceaux.find((m) => m.type === type)?.value ?? "";
  return {
    jour: lire("weekday").toLowerCase(),
    minutes: Number(lire("hour")) * 60 + Number(lire("minute")),
  };
}

/** Le jour de la semaine précédent ("lundi" → "dimanche") */
function jourPrecedent(jour: string): JourSemaine {
  const indice = JOURS_SEMAINE.indexOf(jour as JourSemaine);
  return JOURS_SEMAINE[(indice + 6) % 7];
}

/**
 * L'artisan est-il ouvert en ce moment ?
 * Renvoie null quand il n'y a pas d'horaires exploitables
 * (dans ce cas, on n'affiche simplement rien — jamais de faux "fermé").
 * Gère « 24h/24 », plusieurs créneaux par jour, et les créneaux de
 * nuit qui passent minuit (ex. "22:00-06:00" : la fin déborde sur le
 * jour suivant).
 */
export function estOuvertMaintenant(
  horaires: HorairesSemaine | null,
  date: Date = new Date()
): boolean | null {
  if (!horaires) return null;

  const { jour, minutes } = maintenantEnFrance(date);
  const veille = jourPrecedent(jour);
  if (!(jour in horaires) && !(veille in horaires)) return null;

  // Le jour courant
  const duJour = lireJour(horaires[jour as JourSemaine]);
  if (duJour === "24h24") return true;
  if (duJour) {
    for (const { debut, fin } of duJour) {
      if (fin < debut) {
        // Créneau de nuit : la partie « avant minuit » de ce jour
        if (minutes >= debut) return true;
      } else if (minutes >= debut && minutes < fin) {
        return true;
      }
    }
  }

  // La veille peut déborder sur ce matin (créneau passant minuit)
  const deLaVeille = lireJour(horaires[veille]);
  if (Array.isArray(deLaVeille)) {
    for (const { debut, fin } of deLaVeille) {
      if (fin < debut && minutes < fin) return true;
    }
  }

  return false;
}

/**
 * Les lignes d'affichage d'un jour, UNE PAR CRÉNEAU :
 * ["Fermé"], ["Ouvert 24h/24"], ou ["08:00 – 12:00", "14:00 – 18:00"]
 * (la fiche les empile — jamais deux créneaux sur la même ligne).
 */
export function lignesJour(valeur: HorairesJour | undefined): string[] {
  const jour = lireJour(valeur);
  if (jour === null) return ["Fermé"];
  if (jour === "24h24") return ["Ouvert 24h/24"];
  const enTexte = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`;
  return jour.map(({ debut, fin }) => `${enTexte(debut)} – ${enTexte(fin)}`);
}

/**
 * Les lignes d'affichage d'un jour pour le CALENDRIER de la fiche
 * (≥ 768 px) : identiques à `lignesJour`, sauf le jour non travaillé
 * qui s'écrit « Indisponible » et non « Fermé » — le site n'emploie
 * que deux mots pour la joignabilité, « Joignable » et « Indisponible ».
 */
export function lignesJourCalendrier(valeur: HorairesJour | undefined): string[] {
  const jour = lireJour(valeur);
  if (jour === null) return ["Indisponible"];
  return lignesJour(valeur);
}

/**
 * LES 7 PROCHAINS JOURS (calendrier glissant de la fiche)
 * -------------------------------------------------------
 * Toujours 7 lignes : la PREMIÈRE est le jour COURANT (heure
 * française), puis les six suivants. Un samedi 25 juillet, la liste
 * commence donc par « Samedi 25 juillet » et finit par
 * « Vendredi 31 juillet » — sans aucune intervention.
 *
 * Chaque jour est ancré à MIDI (UTC) : à cette heure-là, la date
 * française est la même toute l'année, y compris les deux week-ends
 * de changement d'heure (où un jour dure 23 ou 25 heures).
 */
export function septProchainsJours(date: Date = new Date()): Array<{
  /** La clé de lecture des horaires : « lundi », « mardi »… */
  jour: JourSemaine;
  /** « Samedi », « Dimanche »… (majuscule initiale) */
  libelleJour: string;
  /** « 25 juillet » */
  libelleDate: string;
  /** Vrai pour la première ligne seulement */
  aujourdHui: boolean;
}> {
  // La date française d'aujourd'hui, en « AAAA-MM-JJ »
  const [annee, mois, jourDuMois] = new Intl.DateTimeFormat("fr-CA", {
    timeZone: FUSEAU_HORAIRE,
  })
    .format(date)
    .split("-")
    .map(Number);

  const format = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return Array.from({ length: 7 }, (_, decalage) => {
    const morceaux = format.formatToParts(
      new Date(Date.UTC(annee, mois - 1, jourDuMois + decalage, 12))
    );
    const lire = (type: string) =>
      morceaux.find((m) => m.type === type)?.value ?? "";
    const nomJour = lire("weekday");
    return {
      jour: nomJour.toLowerCase() as JourSemaine,
      libelleJour: nomJour.charAt(0).toUpperCase() + nomJour.slice(1),
      libelleDate: `${lire("day")} ${lire("month")}`,
      aujourdHui: decalage === 0,
    };
  });
}

/** Affichage d'un jour sur une seule ligne (créneaux séparés par une virgule) */
export function formaterJour(valeur: HorairesJour | undefined): string {
  return lignesJour(valeur).join(", ");
}

/** Ouvert 24h/24 TOUS les jours de la semaine ? (badge « 24/7 ») */
export function semaineEntiere24(horaires: HorairesSemaine | null): boolean {
  if (!horaires) return false;
  return JOURS_SEMAINE.every((jour) => lireJour(horaires[jour]) === "24h24");
}

/** Le jour EN COURS (heure française) est-il en 24h/24 ? (badge « 24/24 ») */
export function jourActuel24(
  horaires: HorairesSemaine | null,
  date: Date = new Date()
): boolean {
  if (!horaires) return false;
  const { jour } = maintenantEnFrance(date);
  return lireJour(horaires[jour as keyof HorairesSemaine]) === "24h24";
}

/**
 * L'heure de FIN (en minutes) du créneau actuellement en cours —
 * « Joignable jusqu'à 17h30 ». Gère le créneau de la veille qui
 * passe minuit. Renvoie null si fermé ou en 24h/24 (ces cas ont
 * leurs propres libellés).
 */
export function finCreneauActuel(
  horaires: HorairesSemaine | null,
  date: Date = new Date()
): number | null {
  if (!horaires) return null;
  const { jour, minutes } = maintenantEnFrance(date);
  const duJour = lireJour(horaires[jour as keyof HorairesSemaine]);
  if (duJour === "24h24") return null;
  if (Array.isArray(duJour)) {
    for (const { debut, fin } of duJour) {
      if (fin >= debut) {
        if (minutes >= debut && minutes < fin) return fin;
      } else if (minutes >= debut) {
        return fin; // créneau entamé ce soir, fin après minuit
      }
    }
  }
  // Le créneau de la veille peut déborder sur ce matin
  const indexJour = JOURS_SEMAINE.indexOf(jour as (typeof JOURS_SEMAINE)[number]);
  const veille = JOURS_SEMAINE[(indexJour + 6) % 7];
  const deLaVeille = lireJour(horaires[veille]);
  if (Array.isArray(deLaVeille)) {
    for (const { debut, fin } of deLaVeille) {
      if (fin < debut && minutes < fin) return fin;
    }
  }
  return null;
}

/** DÉDUIT : au moins un créneau (ou 24h/24) le samedi ou le dimanche */
export function travailleWeekend(horaires: HorairesSemaine | null): boolean {
  if (!horaires) return false;
  return (["samedi", "dimanche"] as const).some(
    (jour) => lireJour(horaires[jour]) !== null
  );
}

/** DÉDUIT : un jour 24h/24, ou un créneau touchant la nuit (22 h – 6 h) */
export function travailleNuit(horaires: HorairesSemaine | null): boolean {
  if (!horaires) return false;
  for (const jour of JOURS_SEMAINE) {
    const valeur = lireJour(horaires[jour]);
    if (valeur === "24h24") return true;
    if (!valeur) continue;
    for (const { debut, fin } of valeur) {
      if (fin < debut) return true; // passe minuit : forcément la nuit
      if (debut < NUIT_FIN || fin > NUIT_DEBUT) return true;
    }
  }
  return false;
}

/**
 * LA PROCHAINE REPRISE : quand l'artisan (actuellement fermé)
 * rouvre-t-il ? Parcourt jusqu'à 8 jours en avant dans ses
 * horaires ; les jours fériés sont sautés si l'artisan
 * n'intervient pas les fériés. Renvoie null si aucun horaire
 * exploitable (dans ce cas, aucun badge n'est affiché).
 */
export function prochaineOuverture(
  horaires: HorairesSemaine | null,
  intervientFeries: boolean,
  estFerie: (date: Date) => boolean,
  date: Date = new Date()
): {
  memeJour: boolean;
  jour: JourSemaine;
  minutes: number;
  /** Nombre de jours d'ici la reprise : 0 = aujourd'hui, 1 = demain, … */
  decalage: number;
} | null {
  if (!horaires) return null;

  for (let decalage = 0; decalage <= 7; decalage += 1) {
    const candidate = new Date(date.getTime() + decalage * 24 * 3600 * 1000);
    if (!intervientFeries && estFerie(candidate)) continue;

    const { jour, minutes } = maintenantEnFrance(candidate);
    const valeur = lireJour(horaires[jour as JourSemaine]);
    if (valeur === null) continue;

    if (valeur === "24h24") {
      // Un jour 24h/24 dans le futur : reprise à minuit ce jour-là.
      // (Aujourd'hui 24h/24 = déjà ouvert : ce cas ne se présente pas.)
      if (decalage === 0) continue;
      return { memeJour: false, jour: jour as JourSemaine, minutes: 0, decalage };
    }

    // Aujourd'hui : seulement les créneaux qui n'ont pas encore commencé
    const seuil = decalage === 0 ? minutes : -1;
    const prochain = valeur
      .filter((c) => c.debut > seuil)
      .sort((a, b) => a.debut - b.debut)[0];
    if (prochain) {
      return {
        memeJour: decalage === 0,
        jour: jour as JourSemaine,
        minutes: prochain.debut,
        decalage,
      };
    }
  }
  return null;
}

/** 870 → « 14h30 » ; 450 → « 07h30 » (heures à la française) */
export function heureEnTexte(minutes: number): string {
  const heures = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${heures}h${mins}`;
}

/**
 * L'artisan est-il en période de fermeture (absence déclarée) ?
 * Bornes incluses ; après la date de fin, tout redevient normal
 * automatiquement. Comparaison sur la date française du moment.
 */
export function estEnAbsence(
  debut: string | null | undefined,
  fin: string | null | undefined,
  date: Date = new Date()
): boolean {
  if (!debut || !fin) return false;
  const aujourdHui = new Intl.DateTimeFormat("fr-CA", {
    timeZone: FUSEAU_HORAIRE,
  }).format(date); // "AAAA-MM-JJ"
  return debut <= aujourdHui && aujourdHui <= fin;
}
