/**
 * LE HARNAIS DES RÈGLES DE LA PASSE Nº 245 — il exécute les VRAIS
 * modules (`lib/filtres-selection`, `lib/selection-suivis`), jamais
 * une réécriture, et rend leurs réponses en JSON. Le banc l'appelle en
 * sous-processus :
 *
 *   node --experimental-strip-types tests/regles-p245.harnais.mjs
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

/*  ⚠️ MIS À JOUR À LA nº 247-§2 et §3 (la spec a changé) : les deux
    menus sont EXCLUSIFS et distinguent les catégories. Les comptes
    sont donc indexés par la valeur d'« Explorer » (« flash:maori »),
    et le filtrage porte sur le couple catégorie + style. Les
    anciennes fonctions par style seul n'existent plus ; ce harnais
    recompose ce que ce banc daté lisait — les entrées de la seule
    catégorie « Réalisations », et le filtrage par style. */
const { entreesDuFiltre } = await import(
  pathToFileURL(RACINE + "/src/lib/filtres-selection.ts").href
);
const { suivisDuChoix, comptesDesSuivis, comptesDesJaime } = await import(
  pathToFileURL(RACINE + "/src/lib/selection-suivis.ts").href
);
const TOUS_LES_STYLES = "";
const suivisDuStyle = (suivis, style) =>
  suivisDuChoix(suivis, { nature: "", style: style === TOUS_LES_STYLES ? "" : style });
/** Les entrées telles que ce banc les lisait : les styles seuls, sans
    les portes de catégorie ni la remise à zéro. */
const sansLesPortes = (entrees) =>
  entrees
    .filter((entree) => entree.value.includes(":"))
    .map((entree) => ({ ...entree, value: entree.value.split(":")[1] }));
const { entreesExplorer } = await import(
  pathToFileURL(RACINE + "/src/config/tatouage.ts").href
);

const photo = (id, style, nature = "realisation") => ({
  id,
  url: `/p/${id}`,
  miniature: `/m/${id}`,
  style,
  rendu: null,
  nature,
  creeLe: "2026-08-10T10:00:00Z",
});
const suivi = (id, styles) => ({
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
  recentes: styles.map((style, rang) => photo(`${id}-${rang}`, style)),
  nouveautes: 0,
});
const jaime = (id, style, nature, tatoueur = "a") => ({
  id,
  url: `/p/${id}`,
  miniature: `/m/${id}`,
  style,
  rendu: null,
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

/* ---- §3 : « Mes j'aime » — du réalisme en réalisation, de
 *      l'aquarelle en flash : DEUX entrées, et rien d'autre. ---- */
const photosAimees = [
  jaime("1", "realisme", "realisation"),
  jaime("2", "aquarelle", "flash"),
];
const entreesJaime = sansLesPortes(entreesDuFiltre(comptesDesJaime(photosAimees)));

/* ---- §3 : « Mes suivis » — un artiste à huit styles les apporte
 *      tous ; un style absent n'apparaît pas. ---- */
const huit = [
  "realisme",
  "blackwork",
  "dotwork",
  "maori",
  "old-school",
  "lettering",
  "aquarelle",
  "geometrique",
];
const suivis = [suivi("huit", huit), suivi("deux", ["realisme", "maori"])];
const entreesSuivis = sansLesPortes(entreesDuFiltre(comptesDesSuivis(suivis)));

/* ---- L'ORDRE DU MOTEUR — la référence, aplatie. ---- */
const ordreDuMoteur = [];
for (const entree of entreesExplorer()) {
  if (entree.genre === "style") ordreDuMoteur.push(entree.slug);
  else for (const style of entree.styles) ordreDuMoteur.push(style.slug);
}

/* ---- Le filtrage des suivis ---- */
const filtres = {
  tous: suivisDuStyle(suivis, TOUS_LES_STYLES).map((s) => s.id),
  maori: suivisDuStyle(suivis, "maori").map((s) => s.id),
  lettering: suivisDuStyle(suivis, "lettering").map((s) => s.id),
  absent: suivisDuStyle(suivis, "suminagashi").map((s) => s.id),
};

console.log(
  JSON.stringify(
    {
      entreesJaime,
      entreesSuivis,
      ordreDuMoteur,
      filtres,
      //  Aucune donnée → aucune entrée : le menu ne s'affiche pas.
      vide: entreesDuFiltre(new Map()),
    },
    null,
    1
  )
);
