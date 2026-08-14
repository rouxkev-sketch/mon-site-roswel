/**
 * LE HARNAIS DES RÈGLES DE LA PASSE Nº 257 — il exécute les VRAIS
 * modules (`lib/filtres-selection`, `lib/selection-suivis`), jamais
 * une réécriture, et rend leurs réponses en JSON. Le banc l'appelle en
 * sous-processus :
 *
 *   node --experimental-strip-types tests/regles-p257.harnais.mjs
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

const { entreesDesStyles, entreesDuFiltre, lireSelection, valeurDuMenu } =
  await import(pathToFileURL(RACINE + "/src/lib/filtres-selection.ts").href);
const { comptesDesFavoris, comptesDesSuivis } = await import(
  pathToFileURL(RACINE + "/src/lib/selection-suivis.ts").href
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
const suivi = (id, photos) => ({
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
  modes: [],
  recentes: photos,
  nouveautes: 0,
});

/*  TROIS SUIVIS : « huit » fait du maori (famille Cultures du monde)
    EN RÉALISATION ET EN FLASH — il ne doit compter qu'UNE fois par
    style ; « deux » du réalisme ; « trois » de l'aquarelle en flash
    seulement. */
const suivis = [
  suivi("huit", [
    photoSuivi("h1", "maori", "tatouage"),
    photoSuivi("h2", "maori", "flash"),
    photoSuivi("h3", "realisme", "tatouage"),
  ]),
  suivi("deux", [photoSuivi("d1", "realisme", "tatouage")]),
  suivi("trois", [photoSuivi("t1", "aquarelle", "flash")]),
];

/*  DES FAVORIS pour la contre-épreuve : leur menu garde ses portes. */
const photosAimees = [
  favori("1", "realisme", "tatouage"),
  favori("2", "aquarelle", "flash"),
  favori("3", "maori", "flash"),
];

const sortie = {
  //  §1 — le menu des suivis : les styles seuls.
  entreesSuivis: entreesDesStyles(comptesDesSuivis(suivis)),
  //  Aucun suivi : aucun menu.
  entreesVides: entreesDesStyles(comptesDesSuivis([])),
  //  La contre-épreuve : les favoris gardent leurs deux portes.
  entreesFavoris: entreesDuFiltre(comptesDesFavoris(photosAimees)),
  //  §1 — l'adresse : sur « suivis », le reste est UN STYLE.
  adresses: {
    suivisStyle: lireSelection("selection=suivis:maori"),
    suivisNu: lireSelection("selection=suivis"),
    //  L'ancienne forme couple retombe proprement (aucun filtre).
    suivisCouple: lireSelection("selection=suivis:tatouage:maori"),
    suivisStyleInconnu: lireSelection("selection=suivis:pas-un-style"),
    favorisCouple: lireSelection("selection=favoris:flash:maori"),
  },
  //  §1 — la valeur du champ suit le menu.
  valeurs: {
    suivisMaori: valeurDuMenu(
      lireSelection("selection=suivis:maori"),
      "suivis"
    ),
    favorisFlashMaori: valeurDuMenu(
      lireSelection("selection=favoris:flash:maori"),
      "favoris"
    ),
  },
};

console.log(JSON.stringify(sortie));
