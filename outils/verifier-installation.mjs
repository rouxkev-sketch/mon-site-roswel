/**
 * VÉRIFIER QUE L'INSTALLATION EST COMPLÈTE — AVANT DE DÉMARRER
 * ==============================================================
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Un zip livré ne contient JAMAIS `node_modules` (c'est 1 Go de
 * bibliothèques téléchargeables). C'est donc `npm install` qui le
 * remplit, dossier par dossier — et c'est là que ça peut casser, sans
 * que personne ne le voie.
 *
 * Quand l'installation est incomplète, Next 16 se comporte d'une façon
 * PARFAITEMENT trompeuse :
 *
 *   ▲ Next.js 16.2.10 (Turbopack)
 *   - Local:  http://localhost:3000
 *   ✓ Ready in 382ms                  ← ✅ ça a l'air parti
 *     Downloading swc package @next/swc-…   ← ❌ et là, plus rien
 *
 * « ✓ Ready » est écrit AVANT que le moteur ne soit chargé (Next l'a
 * remonté exprès, pour que la durée affichée soit celle du démarrage du
 * cadre). Autrement dit : « ✓ Ready » ne veut PAS dire que le site
 * répond. Le vrai travail — charger le moteur natif, lire la
 * configuration, ouvrir le serveur — vient APRÈS.
 *
 * Et si ce moteur natif manque ou est abîmé, la suite se passe en
 * silence : soit Next part télécharger 130 Mo sans rien dire, soit le
 * processus est tué net. Dans ce dernier cas, `next dev` s'arrête avec
 * le CODE 0 ET AUCUN MESSAGE — c'est écrit dans son code : le
 * surveillant ignore volontairement les morts par signal
 * (`if (sessionStopHandled || signal) return`). Une panne invisible,
 * qui ressemble à « le site ne démarre plus depuis cette livraison »
 * alors que le code livré n'y est pour rien.
 *
 * CE FICHIER REND CETTE PANNE VISIBLE, et en une seconde :
 *   node outils/verifier-installation.mjs
 *
 * Il est aussi appelé automatiquement par `npm run dev`
 * (voir outils/demarrer.mjs).
 */

import { existsSync, readFileSync, openSync, readSync, closeSync, statSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
export const RACINE = dirname(ICI);

/** Le tapis rouge des messages : rouge pour ce qui bloque, jaune pour
    ce qui mérite un œil, vert pour ce qui va bien. */
const ROUGE = "\u001B[31m";
const JAUNE = "\u001B[33m";
const VERT = "\u001B[32m";
const GRAS = "\u001B[1m";
const FIN = "\u001B[0m";

/**
 * LE MOTEUR NATIF DE NEXT, SELON LA MACHINE
 * ------------------------------------------
 * Next ne compile pas le site en JavaScript : il le fait en Rust, via
 * un fichier `.node` compilé POUR CETTE MACHINE-LÀ. Il y en a un par
 * système et par processeur, et `npm install` n'installe que le bon —
 * il est marqué « optionnel » dans package-lock.json, ce qui veut dire
 * que npm a le droit de RENONCER À L'INSTALLER SANS PRÉVENIR si le
 * téléchargement échoue. C'est précisément le piège.
 *
 * Une machine peut avoir plusieurs candidats valables (sous Linux :
 * glibc ou musl) : un seul suffit.
 */
function moteursAttendus() {
  const clef = `${process.platform}-${process.arch}`;
  const table = {
    "darwin-arm64": ["@next/swc-darwin-arm64"], // Mac Apple Silicon (M1…M4)
    "darwin-x64": ["@next/swc-darwin-x64"], // Mac Intel
    "win32-x64": ["@next/swc-win32-x64-msvc"], // Windows
    "win32-arm64": ["@next/swc-win32-arm64-msvc"],
    "linux-x64": ["@next/swc-linux-x64-gnu", "@next/swc-linux-x64-musl"],
    "linux-arm64": ["@next/swc-linux-arm64-gnu", "@next/swc-linux-arm64-musl"],
  };
  return table[clef] ?? [];
}

/**
 * UN FICHIER `.node` EST-IL UN VRAI BINAIRE ?
 * --------------------------------------------
 * Un téléchargement interrompu laisse un fichier qui EXISTE mais qui
 * n'est pas un programme : npm le croit installé et ne le retéléchargera
 * jamais. On regarde donc les tout premiers octets — chaque système a sa
 * signature — et la taille (ces moteurs pèsent plus de 40 Mo ; un fichier
 * d'un kilo-octet est forcément un débris).
 */
function binaireValide(chemin) {
  try {
    if (statSync(chemin).size < 1_000_000) return false;
    const tampon = Buffer.alloc(4);
    const descripteur = openSync(chemin, "r");
    readSync(descripteur, tampon, 0, 4, 0);
    closeSync(descripteur);
    const signature = tampon.toString("hex");
    return (
      signature.startsWith("7f454c46") || // ELF — Linux
      signature.startsWith("cffaedfe") || // Mach-O 64 bits — macOS
      signature.startsWith("feedfacf") ||
      signature.startsWith("cafebabe") || // Mach-O universel — macOS
      signature.startsWith("4d5a") // MZ — Windows (.dll)
    );
  } catch {
    return false;
  }
}

/** Le contenu d'un JSON, ou `null` s'il est absent ou illisible. */
function lireJson(chemin) {
  try {
    return JSON.parse(readFileSync(chemin, "utf8"));
  } catch {
    return null;
  }
}

/**
 * LE CONTRÔLE COMPLET.
 * Rend { bloquants: string[], remarques: string[] } — jamais d'exception,
 * jamais de sortie de processus : c'est l'appelant qui décide quoi faire.
 */
export function verifierInstallation() {
  const bloquants = [];
  const remarques = [];

  const paquet = lireJson(join(RACINE, "package.json"));
  if (!paquet) {
    bloquants.push(
      "package.json est introuvable ou illisible — le dossier n'est pas celui du projet."
    );
    return { bloquants, remarques };
  }

  // 1. LE DOSSIER node_modules EXISTE-T-IL SEULEMENT ?
  if (!existsSync(join(RACINE, "node_modules"))) {
    bloquants.push(
      "node_modules est absent : les bibliothèques n'ont jamais été installées ici."
    );
    return { bloquants, remarques };
  }

  // 2. CHAQUE BIBLIOTHÈQUE ANNONCÉE EST-ELLE VRAIMENT LÀ, À LA BONNE
  //    VERSION ? Le verrou (package-lock.json) dit la version exacte
  //    attendue ; on compare avec celle réellement posée sur le disque.
  const verrou = lireJson(join(RACINE, "package-lock.json"));
  const attendues = {
    ...(paquet.dependencies ?? {}),
    ...(paquet.devDependencies ?? {}),
  };
  const manquantes = [];
  const desaccordees = [];
  for (const nom of Object.keys(attendues)) {
    const surDisque = lireJson(join(RACINE, "node_modules", nom, "package.json"));
    if (!surDisque) {
      manquantes.push(nom);
      continue;
    }
    const verrouillee = verrou?.packages?.[`node_modules/${nom}`]?.version;
    if (verrouillee && surDisque.version !== verrouillee) {
      desaccordees.push(`${nom} (${surDisque.version} au lieu de ${verrouillee})`);
    }
  }
  if (manquantes.length > 0) {
    bloquants.push(
      `${manquantes.length} bibliothèque(s) annoncée(s) mais absente(s) de node_modules : ${manquantes.join(", ")}.`
    );
  }
  if (desaccordees.length > 0) {
    remarques.push(
      `Version différente de celle du verrou : ${desaccordees.join(", ")}.`
    );
  }

  // 3. LE MOTEUR NATIF DE NEXT — LE PIÈGE PRINCIPAL.
  const candidats = moteursAttendus();
  if (candidats.length === 0) {
    remarques.push(
      `Machine non répertoriée (${process.platform}/${process.arch}) : le moteur natif n'a pas pu être contrôlé.`
    );
  } else {
    const trouves = [];
    const abimes = [];
    for (const nom of candidats) {
      const dossier = join(RACINE, "node_modules", ...nom.split("/"));
      if (!existsSync(dossier)) continue;
      const description = lireJson(join(dossier, "package.json"));
      const fichier = description?.main ? join(dossier, description.main) : null;
      if (fichier && existsSync(fichier) && binaireValide(fichier)) trouves.push(nom);
      else abimes.push(nom);
    }
    if (trouves.length === 0) {
      bloquants.push(
        abimes.length > 0
          ? `Le moteur natif de Next est ABÎMÉ (${abimes.join(", ")}) : le fichier est là, mais ce n'est pas un programme valide.`
          : `Le moteur natif de Next est ABSENT (attendu : ${candidats.join(" ou ")}).` +
              "\n     C'est LA panne qui affiche « ✓ Ready » puis laisse le site muet :" +
              "\n     npm a le droit de renoncer à ce paquet sans le dire (il est « optionnel »)."
      );
    }
  }

  // 4. LE PIÈGE DU DOSSIER PARENT.
  //    Si un package.json ou un node_modules traîne PLUS HAUT dans
  //    l'arborescence (dans le dossier utilisateur, typiquement), npm
  //    considère que la racine du projet est LÀ-HAUT : `npm install`
  //    lancé ici installe alors les bibliothèques ailleurs, et laisse ce
  //    dossier-ci à moitié vide. C'est invisible, et ça survit à autant
  //    de `npm install` qu'on voudra.
  let dossier = dirname(RACINE);
  const sommet = parse(RACINE).root;
  while (dossier && dossier !== sommet) {
    if (
      existsSync(join(dossier, "package.json")) ||
      existsSync(join(dossier, "package-lock.json"))
    ) {
      remarques.push(
        `Un package.json ou package-lock.json traîne dans un dossier PARENT : ${dossier}` +
          "\n     npm risque d'installer les bibliothèques là-haut plutôt qu'ici." +
          "\n     Supprime-le, puis refais une installation propre (voir ci-dessous)."
      );
      break;
    }
    const parent = dirname(dossier);
    if (parent === dossier) break;
    dossier = parent;
  }

  return { bloquants, remarques };
}

/** Le mode d'emploi de la réparation — toujours le même, et il marche. */
export const REPARATION = [
  `${GRAS}Comment réparer (30 secondes à quelques minutes) :${FIN}`,
  "",
  "  1. Se placer dans le dossier du site (celui qui contient package.json)",
  "  2. Supprimer l'installation abîmée :",
  "         Mac / Linux :  rm -rf node_modules",
  "         Windows     :  rmdir /s /q node_modules",
  "  3. Réinstaller PROPREMENT — `npm ci`, surtout pas `npm install` :",
  "         npm ci",
  "",
  `     ${GRAS}Pourquoi npm ci et pas npm install ?${FIN} Parce que « npm install »`,
  "     considère qu'un paquet déjà présent n'a pas à être retéléchargé —",
  "     y compris quand il est abîmé. C'est pour ça que réinstaller ne",
  "     changeait rien. « npm ci » repart du verrou et échoue BRUYAMMENT",
  "     si quelque chose ne passe pas.",
  "",
  "  4. Redémarrer :  npm run dev",
].join("\n");

/**
 * L'AFFICHAGE. Rend `true` si tout va bien.
 * (Séparé du contrôle : `npm run dev` s'en sert aussi.)
 */
export function afficherVerification({ silencieuxSiOk = false } = {}) {
  const { bloquants, remarques } = verifierInstallation();

  for (const remarque of remarques) {
    console.log(`${JAUNE}⚠  ${remarque}${FIN}`);
  }

  if (bloquants.length === 0) {
    if (!silencieuxSiOk) {
      console.log(`${VERT}✓  Installation complète : le site peut démarrer.${FIN}`);
    }
    return true;
  }

  console.log("");
  console.log(`${ROUGE}${GRAS}✗  L'INSTALLATION DE CE DOSSIER EST INCOMPLÈTE.${FIN}`);
  console.log("");
  for (const bloquant of bloquants) console.log(`${ROUGE}   • ${bloquant}${FIN}`);
  console.log("");
  console.log(
    "   Ce n'est PAS le code du site : c'est le contenu de node_modules,"
  );
  console.log(
    "   qui est refait à chaque `npm install` et ne voyage jamais dans le zip."
  );
  console.log("");
  console.log(REPARATION);
  console.log("");
  return false;
}

// Lancé directement (`node outils/verifier-installation.mjs`) : on
// affiche et on rend un code de sortie exploitable.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(afficherVerification() ? 0 : 1);
}
