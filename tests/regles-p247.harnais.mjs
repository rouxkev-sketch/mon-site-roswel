/**
 * LE HARNAIS DES RÈGLES DE LA PASSE Nº 247 — il exécute les VRAIS
 * modules (`lib/filtres-selection`, `lib/selection-suivis`,
 * `lib/photo-tatoueur`), jamais une réécriture, et rend leurs réponses
 * en JSON. Le banc l'appelle en sous-processus :
 *
 *   node --experimental-strip-types tests/regles-p247.harnais.mjs
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

const { entreesDuFiltre, lireSelection } = await import(
  pathToFileURL(RACINE + "/src/lib/filtres-selection.ts").href
);
const {
  comptesDesFavoris,
  photoDuChoix,
  suivisDuChoix,
  lignesDInformation,
  bandeDeTrois,
  VIGNETTES_MAX,
} = await import(pathToFileURL(RACINE + "/src/lib/selection-suivis.ts").href);
const { serieMontree, photoChoisie } = await import(
  pathToFileURL(RACINE + "/src/lib/photo-tatoueur.ts").href
);

/* ---------------- LE JEU D'ESSAI ---------------- */
const favori = (id, style, nature, tatoueur = "a") => ({
  id,
  url: `/p/${id}`,
  miniature: `/m/${id}`,
  style,
  rendu: "black_and_grey",
  nature,
  tatoueurId: tatoueur,
  tatoueurNom: tatoueur,
  tatoueurSlug: tatoueur,
  ville: "Lyon",
  region: null,
  pays: "France",
  codePays: "FR",
  typeFiche: "artiste",
  etablissement: "artiste",
  photoProfil: null,
});
const photoSuivi = (id, style, nature) => ({
  id,
  url: `/p/${id}`,
  miniature: `/m/${id}`,
  style,
  rendu: null,
  nature,
  creeLe: "2026-08-10T10:00:00Z",
});
const suivi = (id, photos, modes = []) => ({
  id,
  nom: id,
  slug: id,
  ville: "Lyon",
  region: null,
  pays: "France",
  codePays: "FR",
  photoProfil: null,
  typeFiche: "artiste",
  etablissement: "artiste",
  modes,
  recentes: photos,
  nouveautes: 0,
});
const mode = (surcharges) => ({
  id: surcharges.id ?? "m",
  genre: "salon",
  role: null,
  salon_id: null,
  intitule: null,
  adresse: null,
  code_postal: null,
  ville: "Lyon",
  region: null,
  pays: "France",
  code_pays: "FR",
  latitude: null,
  longitude: null,
  debut_le: null,
  fin_le: null,
  actif: true,
  ordre: 0,
  ...surcharges,
});

/* ---- §3 : les entrées d'un menu — DEUX portes, une famille ---- */
const photosAimees = [
  favori("1", "realisme", "tatouage"),
  favori("2", "aquarelle", "flash"),
  favori("3", "maori", "flash"),
];
const entreesFavoris = entreesDuFiltre(comptesDesFavoris(photosAimees));

//  Un portfolio sans le moindre flash : la porte « Flashs » n'existe
//  pas du tout dans son menu.
const sansFlash = entreesDuFiltre(
  comptesDesFavoris([favori("4", "realisme", "tatouage")])
);

/* ---- §2 : l'adresse, et un seul paramètre ---- */
const adresses = {
  vide: lireSelection(""),
  suivis: lireSelection("selection=suivis"),
  favorisFlash: lireSelection("selection=favoris:flash"),
  suivisMaori: lireSelection("selection=suivis:tatouage:maori"),
  menuInconnu: lireSelection("selection=nimporte:flash"),
  styleInconnu: lireSelection("selection=favoris:flash:pas-un-style"),
};

/* ---- §2 : les deux menus sont exclusifs ---- */
const suivisEssai = [
  suivi("huit", [
    photoSuivi("h1", "realisme", "tatouage"),
    photoSuivi("h2", "maori", "flash"),
  ]),
  suivi("deux", [photoSuivi("d1", "realisme", "tatouage")]),
];
const filtrage = {
  //  Le menu « Mes favoris » sur les flashs : deux photos gardées.
  favorisFlash: photosAimees
    .filter((photo) => photoDuChoix(photo, { nature: "flash", style: "" }))
    .map((photo) => photo.id),
  favorisFlashMaori: photosAimees
    .filter((photo) => photoDuChoix(photo, { nature: "flash", style: "maori" }))
    .map((photo) => photo.id),
  suivisTous: suivisDuChoix(suivisEssai, { nature: "", style: "" }).map(
    (s) => s.id
  ),
  suivisFlash: suivisDuChoix(suivisEssai, { nature: "flash", style: "" }).map(
    (s) => s.id
  ),
  suivisRealisme: suivisDuChoix(suivisEssai, {
    nature: "tatouage",
    style: "realisme",
  }).map((s) => s.id),
};

/* ---- §4 : trois modes cumulés, trois lignes ---- */
const lola = suivi("lola", [], [
  mode({ id: "d", genre: "domicile", ville: "Bordeaux", rayon_km: 50, ordre: 0 }),
  mode({ id: "s", genre: "salon", ville: "Lyon", adresse: "12 rue", ordre: 1 }),
  mode({
    id: "g",
    genre: "guest",
    ville: "Nantes",
    debut_le: "2026-08-20",
    fin_le: "2026-08-24",
    ordre: 2,
  }),
]);
//  Une session guest TERMINÉE ne s'écrit pas (règle du §2, nº 243).
const lolaPassee = suivi("lolaPassee", [], [
  mode({ id: "s", genre: "salon", ville: "Lyon", ordre: 0 }),
  mode({
    id: "g",
    genre: "guest",
    ville: "Nantes",
    debut_le: "2026-07-01",
    fin_le: "2026-07-05",
    ordre: 1,
  }),
]);
const JOUR = "2026-08-13";
const lignes = {
  troisModes: lignesDInformation(lola, JOUR),
  guestPassee: lignesDInformation(lolaPassee, JOUR),
  salonSansMode: lignesDInformation(
    { ...suivi("salon", []), typeFiche: "salon", etablissement: "salon", modes: [] },
    JOUR
  ),
};

/* ---- §5 : la bande ne dépasse jamais six vignettes ---- */
const douze = Array.from({ length: 12 }, (_, rang) =>
  photoSuivi(`p${rang}`, "realisme", "tatouage")
);
const bande = bandeDeTrois(suivi("beaucoup", douze), []);

/* ---- §1 : une catégorie demandée n'est JAMAIS violée ---- */
const galerie = [
  { cle: "a", url: "", miniature: "", rendu: "black_and_grey", nature: "tatouage", legende: "" },
  { cle: "b", url: "", miniature: "", rendu: "color", nature: "flash", legende: "" },
  { cle: "c", url: "", miniature: "", rendu: "black_and_grey", nature: "tatouage", legende: "" },
];
const series = {
  //  Le flash demandé : la seule photo flash, jamais les réalisations.
  flash: serieMontree(galerie, { nature: "flash", rendu: "" }).map((p) => p.cle),
  //  Le rendu demandé n'existe pas dans cette catégorie : on élargit à
  //  la CATÉGORIE, jamais à l'autre.
  flashRenduAbsent: serieMontree(galerie, {
    nature: "flash",
    rendu: "black_and_grey",
  }).map((p) => p.cle),
  //  Aucun flash du tout : une liste VIDE — surtout pas les
  //  réalisations à leur place.
  aucunFlash: serieMontree(
    galerie.filter((p) => p.nature === "tatouage"),
    { nature: "flash", rendu: "" }
  ).map((p) => p.cle),
  //  Rien de demandé : tout le style.
  rienDeDemande: serieMontree(galerie, null).map((p) => p.cle),
};

/* ---- §1 (l'étendue) : LA CARTE choisit sa photo AVEC la catégorie.
 *      C'est la même cascade que la fiche (`photoChoisie`), donc la
 *      carte et ce qu'elle ouvre montrent la même image. ---- */
const portfolio = {
  galerie: [
    { id: "r1", style: "realisme", rendu: "black_and_grey", nature: "tatouage", url: "", miniature: null, ordre: 0 },
    { id: "f1", style: "realisme", rendu: "color", nature: "flash", url: "", miniature: null, ordre: 1 },
    { id: "r2", style: "maori", rendu: "black_and_grey", nature: "tatouage", url: "", miniature: null, ordre: 2 },
  ],
};
const cartes = {
  flash: photoChoisie(portfolio, "", "", "flash")?.id,
  flashRealisme: photoChoisie(portfolio, "realisme", "", "flash")?.id,
  realisation: photoChoisie(portfolio, "realisme", "", "tatouage")?.id,
  //  Aucun flash en maori : la carte ne ment pas en montrant une
  //  réalisation d'un AUTRE style — elle reste dans la catégorie
  //  demandée tant qu'il y en a une quelque part.
  flashMaori: photoChoisie(portfolio, "maori", "", "flash")?.id,
  sansCategorie: photoChoisie(portfolio, "realisme", "", "")?.id,
};

console.log(
  JSON.stringify(
    {
      cartes,
      entreesFavoris,
      sansFlash,
      adresses,
      filtrage,
      lignes,
      bande: { nombre: bande.photos.length, max: VIGNETTES_MAX },
      series,
    },
    null,
    1
  )
);
