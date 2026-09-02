/**
 * LES HORAIRES D'OUVERTURE D'UN STUDIO (yokofolio)
 * =================================================
 * UN SEUL endroit décrit ce qu'est une semaine d'horaires, comment
 * elle se range en base, et comment on en déduit « ouvert » ou
 * « fermé ». Le formulaire, la fiche pleine page et la fenêtre
 * superposée lisent tous ces fonctions — jamais leur propre version.
 *
 * (Il a longtemps eu un homonyme, `lib/horaires.ts`, qui servait le
 * produit ARTISANS — un autre format, d'autres règles, une autre
 * fiche. Les deux ont vécu côte à côte sans se connaître ; l'autre
 * est parti à la nº 760. Il ne reste que celui-ci, et plus aucune
 * confusion possible.)
 *
 * RÉSERVÉ AUX STUDIOS. Un artiste n'a pas d'horaires d'ouverture au
 * public : il reçoit sur rendez-vous. Le module n'existe donc pas sur
 * son formulaire, et sa fiche n'en montre rien.
 *
 * TROIS ÉTATS PAR JOUR, ET PAS UN DE PLUS
 * ----------------------------------------
 *   · RIEN        → fermé ce jour-là ;
 *   · UNE plage   → « 9h – 18h » ;
 *   · DEUX plages → « 9h – 12h · 14h – 19h », la coupure du midi.
 * Au-delà, on demanderait à un tatoueur de tenir un tableur. Deux
 * plages couvrent la totalité des cas réels.
 *
 * CHAQUE STUDIO A LES SIENS. Une enseigne à Lyon et à Bordeaux
 * n'ouvre pas aux mêmes heures : les horaires vivent donc sur la
 * ligne `studios`, pas sur la fiche (migration nº 33).
 *
 * FACULTATIF. Une fiche sans horaires reste valide, et n'affiche
 * simplement pas l'accordéon.
 */

/* ================================================================
 * CE QU'EST UNE SEMAINE
 * ================================================================ */

/** Une plage, en heures locales du studio : « 09:00 » → « 18:00 ». */
export type Plage = { debut: string; fin: string };

/** Les sept jours, du LUNDI (index 0) au DIMANCHE (index 6). Chaque
    jour porte 0, 1 ou 2 plages. */
export type SemaineStudio = Plage[][];

/** Les jours, dans l'ordre où on les lit. L'INDEX EST LA CLÉ : c'est
    lui qui range les plages en base, et il ne changera jamais. */
export const JOURS_STUDIO = [
  { index: 0, label: "Monday", court: "Mon" },
  { index: 1, label: "Tuesday", court: "Tue" },
  { index: 2, label: "Wednesday", court: "Wed" },
  { index: 3, label: "Thursday", court: "Thu" },
  { index: 4, label: "Friday", court: "Fri" },
  { index: 5, label: "Saturday", court: "Sat" },
  { index: 6, label: "Sunday", court: "Sun" },
] as const;

/** Deux plages par jour, pas plus : la coupure du midi, et c'est tout. */
export const PLAGES_PAR_JOUR = 2;

/** Une semaine entièrement fermée — le point de départ du formulaire. */
export function semaineVide(): SemaineStudio {
  return [[], [], [], [], [], [], []];
}

/** « 09:00 » est-il une heure valable ? */
function heureValable(valeur: unknown): valeur is string {
  return typeof valeur === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valeur);
}

/**
 * CE QUI ARRIVE DE LA BASE, RAMENÉ À UNE SEMAINE SÛRE.
 * La colonne est du JSON libre : elle peut contenir n'importe quoi
 * (fiche ancienne, saisie d'une version future, valeur bricolée à la
 * main). On ne fait donc JAMAIS confiance à sa forme — tout ce qui
 * n'est pas une plage valable est écarté en silence, et le reste
 * s'affiche. Une donnée douteuse ne doit pas faire tomber une fiche.
 */
export function semaineDepuisBase(valeur: unknown): SemaineStudio {
  const semaine = semaineVide();
  if (!Array.isArray(valeur)) return semaine;
  for (let jour = 0; jour < 7; jour++) {
    const brut = valeur[jour];
    if (!Array.isArray(brut)) continue;
    for (const plage of brut.slice(0, PLAGES_PAR_JOUR)) {
      if (!plage || typeof plage !== "object") continue;
      const { debut, fin } = plage as { debut?: unknown; fin?: unknown };
      if (!heureValable(debut) || !heureValable(fin)) continue;
      if (fin <= debut) continue; // une plage qui finit avant de commencer
      semaine[jour].push({ debut, fin });
    }
    semaine[jour].sort((a, b) => a.debut.localeCompare(b.debut));
  }
  return semaine;
}

/** Y a-t-il seulement quelque chose à afficher ? Une semaine
    entièrement vide n'est pas « fermé toute la semaine » : c'est un
    studio qui n'a rien renseigné, et l'accordéon n'existe pas. */
export function semaineRenseignee(
  semaine: SemaineStudio | null | undefined
): boolean {
  return (semaine ?? []).some((jour) => jour.length > 0);
}

/**
 * CE STUDIO A-T-IL DES HORAIRES, TELS QU'ILS ARRIVENT DE LA BASE ?
 * ⚠️ À APPELER PAR CELUI QUI DESSINE LE CADRE, pas seulement par
 * l'accordéon. L'accordéon savait déjà se taire (il rend `null`),
 * mais la fiche posait quand même AUTOUR de lui son trait de
 * séparation et ses marges : un studio sans horaires affichait donc
 * une ligne de séparation toute seule, sans rien dessous. Un blanc
 * qui n'annonce rien est pire qu'une information absente.
 */
export function aDesHoraires(valeur: unknown): boolean {
  return semaineRenseignee(semaineDepuisBase(valeur));
}

/** La semaine telle qu'elle part en base — les jours vides compris,
    pour que l'index reste la clé du jour. Rend `null` quand rien
    n'est renseigné : une colonne vide vaut mieux qu'un tableau de
    sept listes vides, qui ferait croire à une saisie. */
export function semaineVersBase(semaine: SemaineStudio): Plage[][] | null {
  const propre = semaine.map((jour) =>
    jour
      .filter((plage) => heureValable(plage.debut) && heureValable(plage.fin))
      .filter((plage) => plage.fin > plage.debut)
      .slice(0, PLAGES_PAR_JOUR)
      .map((plage) => ({ debut: plage.debut, fin: plage.fin }))
  );
  return propre.some((jour) => jour.length > 0) ? propre : null;
}

/* ================================================================
 * LE FUSEAU HORAIRE DU STUDIO — le piège de ce module
 * ================================================================
 * ⚠️ « OUVERT MAINTENANT » N'A DE SENS QUE QUELQUE PART. Un studio de
 * Montréal ne doit pas être annoncé ouvert parce qu'il est 15 h à
 * Paris. L'état se calcule donc TOUJOURS dans le fuseau du studio,
 * jamais dans celui du visiteur ni dans celui du serveur.
 *
 * D'OÙ VIENT CE FUSEAU ? On le DÉDUIT de l'adresse, au moment où elle
 * est enregistrée, et on le RANGE sur la ligne du studio
 * (`studios.fuseau`, migration nº 33) :
 *   1. le CODE PAYS donne le fuseau dans l'immense majorité des cas —
 *      un pays, une heure ;
 *   2. les pays à PLUSIEURS fuseaux (États-Unis, Canada, Russie,
 *      Australie, Brésil, Mexique, Indonésie, Kazakhstan, Chili) sont
 *      tranchés par la LONGITUDE, qu'on a déjà : elle vient du même
 *      choix d'adresse ;
 *   3. pays inconnu de la table : on retombe sur le décalage moyen de
 *      la longitude (`Etc/GMT±n`). Approximatif à une heure près, et
 *      sans heure d'été — mais infiniment plus juste que d'annoncer
 *      l'heure de Paris à Tokyo.
 *
 * POURQUOI PAS DEMANDER LE FUSEAU AU STUDIO ? Parce qu'un menu de
 * quatre cents fuseaux au milieu d'un formulaire d'horaires, c'est
 * l'abandon assuré — et parce que la réponse est déjà dans l'adresse
 * qu'il vient de saisir.
 *
 * POURQUOI PAS LE FUSEAU DU NAVIGATEUR QUI REMPLIT ? Parce que la
 * personne qui crée la fiche n'est pas forcément sur place (un gérant
 * en déplacement, nous-mêmes pour une fiche de démonstration).
 */

/** Le repli de dernier recours : le fuseau du plus gros du public. */
export const FUSEAU_DEFAUT = "Europe/Paris";

/** Un fuseau par pays — le cas général : un pays, une heure. */
const FUSEAU_PAR_PAYS: Record<string, string> = {
  FR: "Europe/Paris", BE: "Europe/Brussels", CH: "Europe/Zurich",
  LU: "Europe/Luxembourg", MC: "Europe/Monaco", DE: "Europe/Berlin",
  AT: "Europe/Vienna", NL: "Europe/Amsterdam", IT: "Europe/Rome",
  ES: "Europe/Madrid", PT: "Europe/Lisbon", GB: "Europe/London",
  IE: "Europe/Dublin", DK: "Europe/Copenhagen", NO: "Europe/Oslo",
  SE: "Europe/Stockholm", FI: "Europe/Helsinki", PL: "Europe/Warsaw",
  CZ: "Europe/Prague", SK: "Europe/Bratislava", HU: "Europe/Budapest",
  RO: "Europe/Bucharest", BG: "Europe/Sofia", GR: "Europe/Athens",
  HR: "Europe/Zagreb", SI: "Europe/Ljubljana", RS: "Europe/Belgrade",
  UA: "Europe/Kyiv", EE: "Europe/Tallinn", LV: "Europe/Riga",
  LT: "Europe/Vilnius", IS: "Atlantic/Reykjavik", MT: "Europe/Malta",
  CY: "Asia/Nicosia", TR: "Europe/Istanbul",
  MA: "Africa/Casablanca", TN: "Africa/Tunis", DZ: "Africa/Algiers",
  EG: "Africa/Cairo", ZA: "Africa/Johannesburg", NG: "Africa/Lagos",
  KE: "Africa/Nairobi", SN: "Africa/Dakar", CI: "Africa/Abidjan",
  JP: "Asia/Tokyo", KR: "Asia/Seoul", CN: "Asia/Shanghai",
  TW: "Asia/Taipei", HK: "Asia/Hong_Kong", SG: "Asia/Singapore",
  TH: "Asia/Bangkok", VN: "Asia/Ho_Chi_Minh", PH: "Asia/Manila",
  MY: "Asia/Kuala_Lumpur", IN: "Asia/Kolkata", AE: "Asia/Dubai",
  IL: "Asia/Jerusalem", NZ: "Pacific/Auckland",
  AR: "America/Argentina/Buenos_Aires", UY: "America/Montevideo",
  CO: "America/Bogota", PE: "America/Lima", VE: "America/Caracas",
  CR: "America/Costa_Rica", PA: "America/Panama", CU: "America/Havana",
};

/** Les pays à PLUSIEURS fuseaux — tranchés par la longitude. Chaque
    liste est lue de l'OUEST vers l'EST : le premier seuil que la
    longitude ne dépasse pas donne le fuseau. */
const FUSEAUX_PAR_LONGITUDE: Record<
  string,
  Array<{ jusqua: number; fuseau: string }>
> = {
  US: [
    { jusqua: -140, fuseau: "Pacific/Honolulu" },
    { jusqua: -130, fuseau: "America/Anchorage" },
    { jusqua: -115, fuseau: "America/Los_Angeles" },
    { jusqua: -101, fuseau: "America/Denver" },
    { jusqua: -87, fuseau: "America/Chicago" },
    { jusqua: 180, fuseau: "America/New_York" },
  ],
  CA: [
    { jusqua: -120, fuseau: "America/Vancouver" },
    { jusqua: -102, fuseau: "America/Edmonton" },
    { jusqua: -90, fuseau: "America/Winnipeg" },
    { jusqua: -68, fuseau: "America/Toronto" },
    { jusqua: 180, fuseau: "America/Halifax" },
  ],
  BR: [
    { jusqua: -60, fuseau: "America/Manaus" },
    { jusqua: 180, fuseau: "America/Sao_Paulo" },
  ],
  MX: [
    { jusqua: -110, fuseau: "America/Tijuana" },
    { jusqua: -102, fuseau: "America/Chihuahua" },
    { jusqua: 180, fuseau: "America/Mexico_City" },
  ],
  AU: [
    { jusqua: 129, fuseau: "Australia/Perth" },
    { jusqua: 141, fuseau: "Australia/Adelaide" },
    { jusqua: 180, fuseau: "Australia/Sydney" },
  ],
  RU: [
    { jusqua: 40, fuseau: "Europe/Moscow" },
    { jusqua: 60, fuseau: "Asia/Yekaterinburg" },
    { jusqua: 90, fuseau: "Asia/Novosibirsk" },
    { jusqua: 120, fuseau: "Asia/Irkutsk" },
    { jusqua: 180, fuseau: "Asia/Vladivostok" },
  ],
  ID: [
    { jusqua: 115, fuseau: "Asia/Jakarta" },
    { jusqua: 135, fuseau: "Asia/Makassar" },
    { jusqua: 180, fuseau: "Asia/Jayapura" },
  ],
  KZ: [
    { jusqua: 62, fuseau: "Asia/Aqtobe" },
    { jusqua: 180, fuseau: "Asia/Almaty" },
  ],
  CL: [
    { jusqua: -100, fuseau: "Pacific/Easter" },
    { jusqua: 180, fuseau: "America/Santiago" },
  ],
};

/** LE FUSEAU HORAIRE D'UNE ADRESSE. Calculé au moment de
    l'enregistrement, et rangé tel quel sur la ligne du studio. */
export function fuseauDuLieu(
  codePays: string | null | undefined,
  longitude: number | null | undefined
): string {
  const pays = (codePays ?? "").trim().toUpperCase();
  const tranches = FUSEAUX_PAR_LONGITUDE[pays];
  if (tranches && typeof longitude === "number") {
    for (const tranche of tranches) {
      if (longitude <= tranche.jusqua) return tranche.fuseau;
    }
  }
  const direct = FUSEAU_PAR_PAYS[pays];
  if (direct) return direct;
  // Pays inconnu : le décalage moyen de la longitude. ⚠️ `Etc/GMT` a
  // le SIGNE INVERSÉ par convention (Etc/GMT+5 = UTC−5) — d'où le
  // moins ci-dessous. Sans lui, un studio de New York afficherait
  // l'heure de Karachi.
  if (typeof longitude === "number" && Number.isFinite(longitude)) {
    const decalage = Math.max(-12, Math.min(12, Math.round(longitude / 15)));
    if (decalage === 0) return "Etc/GMT";
    return `Etc/GMT${decalage > 0 ? "-" : "+"}${Math.abs(decalage)}`;
  }
  return FUSEAU_DEFAUT;
}

/* ================================================================
 * OUVERT, OU FERMÉ ?
 * ================================================================ */

/** Les jours en anglais, tels qu'`Intl` les rend : c'est la seule
    forme STABLE d'un jour de semaine, quelle que soit la langue de la
    machine. On la traduit ensuite nous-mêmes. */
const INDEX_DU_JOUR: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

/**
 * L'INSTANT PRÉSENT, VU DU STUDIO — le jour de la semaine et l'heure,
 * dans SON fuseau. C'est la seule fonction de tout le module qui
 * regarde une horloge : tout le reste en découle.
 * Un fuseau inconnu ne fait jamais tomber la page — on retombe sur
 * Paris, et l'accordéon reste lisible.
 */
export function momentChezLeStudio(
  fuseau: string | null | undefined,
  maintenant: Date = new Date()
): { jour: number; minutes: number } {
  for (const candidat of [fuseau || FUSEAU_DEFAUT, FUSEAU_DEFAUT]) {
    try {
      const morceaux = new Intl.DateTimeFormat("en-US", {
        timeZone: candidat,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(maintenant);
      const lire = (type: string) =>
        morceaux.find((m) => m.type === type)?.value ?? "";
      const jour = INDEX_DU_JOUR[lire("weekday")];
      const heures = Number(lire("hour"));
      const minutes = Number(lire("minute"));
      if (jour === undefined || !Number.isFinite(heures)) continue;
      return { jour, minutes: heures * 60 + minutes };
    } catch {
      // Fuseau refusé par le navigateur : on tente le repli.
    }
  }
  return { jour: 0, minutes: 0 };
}

/** « 09:30 » → 570 minutes depuis minuit. */
function enMinutes(heure: string): number {
  const [h, m] = heure.split(":");
  return Number(h) * 60 + Number(m);
}

/** « 09:00 » → « 9h » ; « 09:30 » → « 9h30 ». Le zéro inutile alourdit
    une information qu'on lit d'un coup d'œil. */
export function heureCourte(heure: string): string {
  const [h, m] = heure.split(":");
  //  nº 805 — L'HORLOGE AMÉRICAINE : « 9 AM », « 6:30 PM ». Le site
  //  écrivait « 9h », « 18h30 » ; un Texan lit sur douze heures.
  const heures = Number(h);
  const moment = heures >= 12 ? "PM" : "AM";
  const cadran = heures % 12 || 12;
  return m === "00" ? `${cadran} ${moment}` : `${cadran}:${m} ${moment}`;
}

/** « 9h – 12h · 14h – 19h » — les plages d'un jour, en toutes lettres.
    Un jour sans plage est FERMÉ, et le dit. */
export function libelleDuJour(plages: Plage[]): string {
  if (plages.length === 0) return "Closed";
  return plages
    .map((plage) => `${heureCourte(plage.debut)} – ${heureCourte(plage.fin)}`)
    .join(" · ");
}

/** L'ÉTAT D'UN STUDIO À UN INSTANT DONNÉ. */
export type EtatOuverture = {
  ouvert: boolean;
  /** La phrase complète : « Ouvert • Ferme à 19h ». */
  libelle: string;
};

/**
 * OUVERT MAINTENANT, OU PAS — ET CE QUI SE PASSE ENSUITE.
 * Quatre phrases, exactement celles du cahier des charges :
 *   · « Ouvert • Ferme à 19h »
 *   · « Fermé • Ouvre à 14h »        (coupure : on rouvre aujourd'hui)
 *   · « Fermé • Ouvre demain à 10h »
 *   · « Fermé • Ouvre mardi à 10h »  (fermé plusieurs jours)
 *
 * ⚠️ TOUT EST CALCULÉ DANS LE FUSEAU DU STUDIO (voir plus haut).
 * `maintenant` est un PARAMÈTRE — c'est ce qui rend cette fonction
 * vérifiable : on lui donne une heure, elle rend une phrase, sans
 * qu'il faille attendre mardi 10 h pour en juger.
 */
export function etatOuverture(
  semaine: SemaineStudio,
  fuseau: string | null | undefined,
  maintenant: Date = new Date()
): EtatOuverture {
  const { jour, minutes } = momentChezLeStudio(fuseau, maintenant);

  // 1. OUVERT ? Une plage d'aujourd'hui contient-elle l'heure qu'il est ?
  for (const plage of semaine[jour] ?? []) {
    if (minutes >= enMinutes(plage.debut) && minutes < enMinutes(plage.fin)) {
      return {
        ouvert: true,
        libelle: `Open • Closes at ${heureCourte(plage.fin)}`,
      };
    }
  }

  // 2. FERMÉ. La prochaine ouverture est-elle encore aujourd'hui ?
  //    (le cas de la coupure : il est 13 h, on rouvre à 14 h)
  const restantAujourdhui = (semaine[jour] ?? [])
    .filter((plage) => enMinutes(plage.debut) > minutes)
    .sort((a, b) => enMinutes(a.debut) - enMinutes(b.debut))[0];
  if (restantAujourdhui) {
    return {
      ouvert: false,
      libelle: `Closed • Opens at ${heureCourte(restantAujourdhui.debut)}`,
    };
  }

  // 3. LE PROCHAIN JOUR OUVERT — on regarde les sept suivants, et on
  //    s'arrête au premier. Sept, et pas plus : au-delà la semaine
  //    recommence, et un studio fermé sept jours sur sept est fermé.
  for (let ecart = 1; ecart <= 7; ecart++) {
    const suivant = (jour + ecart) % 7;
    const premiere = (semaine[suivant] ?? [])
      .slice()
      .sort((a, b) => enMinutes(a.debut) - enMinutes(b.debut))[0];
    if (!premiere) continue;
    const heure = heureCourte(premiere.debut);
    if (ecart === 1) {
      return { ouvert: false, libelle: `Closed • Opens tomorrow at ${heure}` };
    }
    return {
      ouvert: false,
      libelle: `Closed • Opens ${JOURS_STUDIO[suivant].label} at ${heure}`,
    };
  }

  // 4. Aucune plage nulle part : le module ne devrait même pas
  //    s'afficher (voir `semaineRenseignee`), mais on ne ment pas.
  return { ouvert: false, libelle: "Closed" };
}
