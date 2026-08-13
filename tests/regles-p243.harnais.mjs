/**
 * LE HARNAIS DES RÈGLES DE LA PASSE Nº 243 — il exécute le VRAI module
 * `src/lib/selection-suivis.ts` (jamais une réécriture) et rend ses
 * réponses en JSON. Le banc l'appelle en sous-processus :
 *
 *   node --experimental-strip-types tests/regles-p243.harnais.mjs
 *
 * (le drapeau retire les types à la volée ; le petit chargeur ci-
 * dessous résout l'alias « @/ » du projet).
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const RACINE = path.resolve(new URL(".", import.meta.url).pathname, "..");
register(
  new URL(
    "data:text/javascript," +
      encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) {
    const base = ${JSON.stringify(pathToFileURL(RACINE + "/src/").href)};
    for (const fin of [".ts", ".tsx", "/index.ts"]) {
      try { return await next(base + spec.slice(2) + fin, ctx); } catch {}
    }
  }
  return next(spec, ctx);
}
`)
  )
);

const {
  groupesDeSuivis,
  guestDuSuivi,
  ligneDInformation,
  bandeDeTrois,
  libelleNouveautes,
  jourCivilDepuis,
} = await import(pathToFileURL(RACINE + "/src/lib/selection-suivis.ts").href);

/* ------------------------------------------------------------------
 * LE JEU D'ESSAI — un jour fixe, des dates relatives : déterministe.
 * ------------------------------------------------------------------ */
const JOUR = "2026-08-13";
const J = (n) => jourCivilDepuis(JOUR, n);

const mode = (surcharges) => ({
  id: "m",
  genre: "salon",
  role: null,
  salon_id: null,
  intitule: null,
  adresse: null,
  code_postal: null,
  ville: null,
  region: null,
  pays: null,
  code_pays: null,
  latitude: null,
  longitude: null,
  debut_le: null,
  fin_le: null,
  ordre: 0,
  ...surcharges,
});
const suivi = (id, surcharges) => ({
  id,
  nom: id,
  slug: id,
  ville: "Lyon 2e",
  region: null,
  pays: "France",
  codePays: "FR",
  photoProfil: null,
  typeFiche: "artiste",
  etablissement: "artiste",
  modes: [],
  recentes: [],
  nouveautes: 0,
  ...surcharges,
});
const photo = (id, nature, creeLe) => ({
  id,
  url: `/p/${id}`,
  miniature: `/m/${id}`,
  style: "realisme",
  rendu: null,
  nature,
  creeLe,
});

/* ---- §2 : les groupes ---- */
const enCours = suivi("guest-en-cours", {
  modes: [mode({ id: "g1", genre: "guest", ville: "Lyon", debut_le: J(-2), fin_le: J(3) })],
});
const cetteSemaine = suivi("guest-semaine", {
  modes: [mode({ id: "g2", genre: "guest", ville: "Paris", debut_le: J(5), fin_le: J(9) })],
});
const aVenir = suivi("guest-a-venir", {
  modes: [mode({ id: "g3", genre: "guest", ville: "Nice", debut_le: J(20), fin_le: J(25) })],
});
const termine = suivi("guest-termine", {
  modes: [mode({ id: "g4", genre: "guest", ville: "Metz", debut_le: J(-20), fin_le: J(-10) })],
  recentes: [photo("t1", "realisation", "2026-08-01T10:00:00Z")],
});
const salonSuivi = suivi("salon-suivi", {
  typeFiche: "salon",
  etablissement: "salon",
  recentes: [photo("s1", "realisation", "2026-08-10T10:00:00Z")],
});
const groupes = groupesDeSuivis(
  [salonSuivi, aVenir, termine, cetteSemaine, enCours],
  JOUR
);

/* ---- §2 : groupes vides absents ---- */
const groupesSansGuests = groupesDeSuivis([salonSuivi, termine], JOUR);

/* ---- §3 : les quatre lignes ---- */
const enSalon = suivi("artiste-salon", {
  modes: [mode({ genre: "salon", ville: "Lyon 1er", adresse: "4 rue X", pays: "France", code_pays: "FR" })],
});
const aDomicile = suivi("artiste-domicile", {
  modes: [mode({ genre: "domicile", ville: "Bordeaux", pays: "France", code_pays: "FR", rayon_km: 50 })],
});
const guestMars = suivi("artiste-guest", {
  modes: [mode({ genre: "guest", ville: "Lyon", debut_le: "2027-03-03", fin_le: "2027-03-08" })],
});

/* ---- §4 : les trois cas ---- */
const artistePhotos = suivi("artiste-photos", {
  recentes: [
    photo("r1", "realisation", "2026-08-10T00:00:00Z"),
    photo("f1", "flash", "2026-08-09T00:00:00Z"),
    photo("r2", "realisation", "2026-08-08T00:00:00Z"),
    photo("r3", "realisation", "2026-08-07T00:00:00Z"),
    photo("r4", "realisation", "2026-08-06T00:00:00Z"),
  ],
});
const favorisDeLui = [
  { tatoueurId: "artiste-photos", id: "aimee-1", url: "/p/a1", miniature: "/m/a1", style: "realisme", rendu: null, nature: "realisation" },
  { tatoueurId: "un-autre", id: "aimee-x", url: "/p/x", miniature: "/m/x", style: "realisme", rendu: null, nature: "realisation" },
];
const artisteFlashsSeuls = suivi("artiste-flashs", {
  recentes: [
    photo("f2", "flash", "2026-08-10T00:00:00Z"),
    photo("f3", "flash", "2026-08-09T00:00:00Z"),
  ],
});

console.log(
  JSON.stringify({
    groupes: groupes.map((g) => ({
      cle: g.cle,
      titre: g.titre,
      suivis: g.suivis.map((s) => s.id),
    })),
    groupesSansGuests: groupesSansGuests.map((g) => ({
      cle: g.cle,
      suivis: g.suivis.map((s) => s.id),
    })),
    guestDuTermine: guestDuSuivi(termine, JOUR),
    lignes: {
      salon: ligneDInformation(enSalon, JOUR),
      domicile: ligneDInformation(aDomicile, JOUR),
      guest: ligneDInformation(guestMars, JOUR),
      guestProche: ligneDInformation(cetteSemaine, JOUR),
      lieu: ligneDInformation(salonSuivi, JOUR),
    },
    bandes: {
      aimees: bandeDeTrois(artistePhotos, favorisDeLui),
      realisations: bandeDeTrois(artistePhotos, []),
      flashs: bandeDeTrois(artisteFlashsSeuls, []),
    },
    nouveautes: {
      zero: libelleNouveautes(0),
      une: libelleNouveautes(1),
      trois: libelleNouveautes(3),
    },
  })
);
