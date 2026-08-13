import {
  libelleLieuDuMode,
  libelleSecteurDuMode,
  modesOrdonnes,
  type ModeExerciceFiche,
} from "@/lib/modes-exercice";
import { genreMode, libelleTypeFiche } from "@/config/tatouage";
import type { PhotoDuSuivi, PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";

/**
 * L'ONGLET « TATOUEURS » DE MA SÉLECTION — LES RÈGLES, SANS UN PIXEL
 * ==================================================================
 * (passe nº 243-§2, §3 et §4)
 *
 * TOUT CE QUI SE DÉCIDE VIT ICI, et rien de ce qui se dessine : le
 * classement en trois groupes, le tri de chacun, le choix des trois
 * photos et la petite ligne qui dit d'où elles viennent. Le composant
 * n'a plus qu'à poser ce que ces fonctions rendent — et le banc peut
 * les vérifier sans ouvrir un navigateur.
 *
 * ⚠️ AUCUNE SECONDE SOURCE. Les dates de guest viennent des modes
 * d'exercice (migration nº 21), les libellés de `libelleLieuDuMode`,
 * `libelleSecteurDuMode` et `genreMode` — rien n'est réécrit ici.
 */

/** Les sept jours qui font « cette semaine ». */
export const JOURS_PROCHES = 7;

export type GroupeSuivis = {
  cle: "semaine" | "avenir" | "tous";
  titre: string;
  suivis: TatoueurSuivi[];
};

/** LE JOUR CIVIL, en « AAAA-MM-JJ » — la forme des dates en base, donc
    comparable telle quelle, sans fuseau ni objet Date. */
export function jourCivil(decalageEnJours = 0): string {
  const maintenant = new Date();
  maintenant.setDate(maintenant.getDate() + decalageEnJours);
  return maintenant.toISOString().slice(0, 10);
}

/**
 * LA SESSION GUEST QUI COMPTE POUR CE SUIVI — la plus proche qui
 * N'EST PAS TERMINÉE. Une session finie n'apparaît dans aucun groupe
 * daté (§2), et c'est ici, une seule fois, que la règle est écrite.
 */
export function guestDuSuivi(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): ModeExerciceFiche | null {
  const guests = modesOrdonnes(suivi.modes).filter(
    (mode) =>
      mode.genre === "guest" &&
      mode.debut_le &&
      //  La date de fin est INCLUSE : on est encore guest le dernier
      //  jour annoncé (la règle de `sessionTerminee`, lib/modes).
      (!mode.fin_le || mode.fin_le >= aujourdhui)
  );
  return guests[0] ?? null;
}

/**
 * LES TROIS GROUPES, DANS L'ORDRE (§2) — « cette semaine » d'abord :
 * ce qui arrive le plus tôt se lit en premier.
 *  · CETTE SEMAINE — une session guest commence ou se déroule dans les
 *    sept prochains jours (donc déjà commencée et pas finie, aussi) ;
 *  · À VENIR — elle commence au-delà de sept jours ;
 *  · TOUS LES SUIVIS — tous les autres.
 * Tri : par date de début croissante dans les deux premiers, par
 * publication la plus récente dans le troisième.
 * ⚠️ UN GROUPE VIDE N'EST PAS RENDU : il n'est pas dans la liste.
 */
export function groupesDeSuivis(
  suivis: TatoueurSuivi[],
  aujourdhui = jourCivil()
): GroupeSuivis[] {
  const limite = jourCivilDepuis(aujourdhui, JOURS_PROCHES);
  const semaine: TatoueurSuivi[] = [];
  const avenir: TatoueurSuivi[] = [];
  const tous: TatoueurSuivi[] = [];

  for (const suivi of suivis) {
    const guest = guestDuSuivi(suivi, aujourdhui);
    if (!guest || !guest.debut_le) {
      tous.push(suivi);
      continue;
    }
    if (guest.debut_le <= limite) semaine.push(suivi);
    else avenir.push(suivi);
  }

  const parDebut = (a: TatoueurSuivi, b: TatoueurSuivi) =>
    (guestDuSuivi(a, aujourdhui)?.debut_le ?? "").localeCompare(
      guestDuSuivi(b, aujourdhui)?.debut_le ?? ""
    );
  //  « Publication la plus récente » : la date de la photo la plus
  //  fraîche (les publications arrivent déjà triées).
  const parPublication = (a: TatoueurSuivi, b: TatoueurSuivi) =>
    (b.recentes[0]?.creeLe ?? "").localeCompare(a.recentes[0]?.creeLe ?? "");

  return [
    { cle: "semaine" as const, titre: "Cette semaine", suivis: semaine.sort(parDebut) },
    { cle: "avenir" as const, titre: "À venir", suivis: avenir.sort(parDebut) },
    { cle: "tous" as const, titre: "Tous les suivis", suivis: tous.sort(parPublication) },
  ].filter((groupe) => groupe.suivis.length > 0);
}

/** Le jour civil obtenu en avançant de N jours à partir d'un autre. */
export function jourCivilDepuis(jour: string, jours: number): string {
  const date = new Date(`${jour}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/* ==================================================================
 * LA LIGNE D'INFORMATION (§3)
 * ================================================================== */

/** « 3 – 8 mars » — les deux bornes d'une session, au plus court.
    Le mois n'est écrit qu'une fois quand il est le même. */
const MOIS_COURTS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
export function periodeDuGuest(mode: {
  debut_le: string | null;
  fin_le: string | null;
}): string {
  if (!mode.debut_le) return "";
  const [, moisD, jourD] = mode.debut_le.split("-");
  const jour = (valeur: string) => String(Number(valeur));
  const nom = (valeur: string) => MOIS_COURTS[Number(valeur) - 1] ?? "";
  if (!mode.fin_le) return `${jour(jourD)} ${nom(moisD)}`;
  const [, moisF, jourF] = mode.fin_le.split("-");
  return moisD === moisF
    ? `${jour(jourD)} – ${jour(jourF)} ${nom(moisF)}`
    : `${jour(jourD)} ${nom(moisD)} – ${jour(jourF)} ${nom(moisF)}`;
}

/**
 * CE QUI S'ÉCRIT SOUS LE NOM (§3), selon le cas :
 *  · artiste en salon   → « En salon · Lyon 1er »
 *  · artiste à domicile → « À domicile · Bordeaux »
 *  · guest              → « Guest à Lyon · 3 – 8 mars »
 *  · salon ou studio    → « Salon · Lyon 2e »
 * Les mots viennent de `genreMode` et de `libelle…DuMode` : aucun
 * libellé n'est inventé ici.
 */
export function ligneDInformation(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): { texte: string; avant: string; date: string; guest: boolean; proche: boolean } {
  const guest = guestDuSuivi(suivi, aujourdhui);
  if (guest) {
    const lieu = guest.ville ?? guest.intitule ?? suivi.ville;
    const periode = periodeDuGuest(guest);
    const proche =
      Boolean(guest.debut_le) &&
      guest.debut_le! <= jourCivilDepuis(aujourdhui, JOURS_PROCHES);
    //  ⚠️ LA DATE EST RENDUE À PART (`date`), pour que le composant
    //  puisse la traiter seule (nº 244-§3 : l'urgence par la
    //  TYPOGRAPHIE — la date proche passe en blanc semi-gras, rien
    //  d'autre). `texte` reste la ligne entière.
    const avant = `${genreMode("guest").label}${lieu ? ` à ${lieu}` : ""}`;
    return {
      texte: [avant, periode].filter(Boolean).join(" · "),
      avant,
      date: periode,
      guest: true,
      proche,
    };
  }
  //  Pas de guest en cours : le premier mode de l'ordre officiel.
  const mode = modesOrdonnes(suivi.modes)[0];
  if (!mode) {
    //  Un salon ou un studio n'a pas de mode d'exercice : il EST le
    //  lieu — « Salon · Lyon 2e ». Le mot vient de `libelleTypeFiche`,
    //  celui des cartes ; la ville, de sa fiche.
    const texteLieu = [libelleTypeFiche(suivi.typeFiche, suivi.etablissement), suivi.ville]
      .filter(Boolean)
      .join(" · ");
    return { texte: texteLieu, avant: texteLieu, date: "", guest: false, proche: false };
  }
  const lieu =
    mode.genre === "domicile" || mode.genre === "prive"
      ? libelleSecteurDuMode(mode)
      : libelleLieuDuMode(mode);
  const texteMode = [genreMode(mode.genre).label, lieu].filter(Boolean).join(" · ");
  return { texte: texteMode, avant: texteMode, date: "", guest: false, proche: false };
}

/* ==================================================================
 * LES TROIS PHOTOS, ET LEUR PROVENANCE (§4)
 * ================================================================== */

export type BandeDeTrois = {
  photos: PhotoDuSuivi[];
  /** La petite ligne du §3.2 — elle dit lequel des trois cas joue. */
  provenance: string;
  cas: "aimees" | "realisations" | "flashs";
};

/**
 * L'ORDRE EST STRICT (§4) :
 *  1. les photos de cet artiste QUE LE VISITEUR A AIMÉES — les trois
 *     plus récemment aimées (`favoris` arrive déjà dans cet ordre) ;
 *  2. aucune aimée → ses trois RÉALISATIONS les plus récentes. Jamais
 *     un flash : un flash est un dessin proposé, il ne montre pas sa
 *     main sur la peau ;
 *  3. aucune réalisation publiée → ses trois derniers FLASHS.
 * Aucun tri par rendu — noir et gris et couleur se mélangent, c'est
 * la vérité de son éventail. Moins de trois : on n'affiche que ce qui
 * existe, jamais un doublon, jamais une case comblée.
 */
export function bandeDeTrois(
  suivi: TatoueurSuivi,
  favoris: PhotoFavorite[]
): BandeDeTrois {
  const aimees = favoris
    .filter((photo) => photo.tatoueurId === suivi.id)
    .slice(0, 3)
    .map((photo) => ({
      id: photo.id,
      url: photo.url,
      miniature: photo.miniature,
      style: photo.style,
      rendu: photo.rendu,
      nature: photo.nature,
      creeLe: "",
    }));
  if (aimees.length > 0) {
    return { photos: aimees, provenance: "Vos coups de cœur", cas: "aimees" };
  }
  const realisations = suivi.recentes
    .filter((photo) => photo.nature !== "flash")
    .slice(0, 3);
  if (realisations.length > 0) {
    return {
      photos: realisations,
      provenance: "Ses dernières réalisations",
      cas: "realisations",
    };
  }
  return {
    photos: suivi.recentes.filter((photo) => photo.nature === "flash").slice(0, 3),
    provenance: "Ses derniers flashs",
    cas: "flashs",
  };
}

/** « 3 nouvelles réalisations » — le compte du §5, jamais à zéro. */
export function libelleNouveautes(nombre: number): string {
  if (nombre <= 0) return "";
  return `${nombre} nouvelle${nombre > 1 ? "s" : ""} réalisation${
    nombre > 1 ? "s" : ""
  }`;
}
