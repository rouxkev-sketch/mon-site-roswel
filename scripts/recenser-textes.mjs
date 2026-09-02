/*  ██ nº 797 — LE RECENSEMENT DES TEXTES FRANÇAIS ██
    ==================================================================
    USAGE :  node scripts/recenser-textes.mjs
    Il écrit le détail dans `recensement-textes.json` (à la racine,
    une SORTIE : ne pas la committer) et le bilan à l'écran.
    Le document qu'il alimente : docs/INVENTAIRE-TRADUCTION.md.

    ON COMPTE, ON NE TRADUIT RIEN.

    ⚠️ PIÈGE Nº 1 — CE DÉPÔT EST ÉCRIT EN FRANÇAIS : commentaires, noms
    de variables, noms de fichiers. Un compteur naïf annoncerait des
    dizaines de milliers de « textes » dont aucun n'est vu par un
    visiteur. On ÔTE donc les commentaires avant de compter, avec un
    découpeur qui sait distinguer un `//` d'un « https:// ».

    ⚠️ PIÈGE Nº 2 — TOUT LITTÉRAL N'EST PAS DU TEXTE D'ÉCRAN. Chemins
    d'import, classes Tailwind, clés techniques, limaces d'adresse
    (`neo-japonais`) : écartés par leur forme.

    ⚠️ PIÈGE Nº 3 — CELUI QUI M'A EU AU PREMIER JET, ET QUI EST CORRIGÉ
    ICI. Contrôle à la main sur `BoutonHorsLigne.tsx` : le compteur
    annonçait 7 textes, il y en a 6.
      · il COMPTAIT DEUX FOIS le même texte, vu une fois comme attribut
        et une fois comme littéral (« Note pour le tatoueur ») ;
      · il découpait un gabarit en morceaux et comptait le morceau EN
        PLUS du gabarit entier ;
      · et surtout il RATAIT « Mettre le portfolio hors ligne » : sans
        accent et avec un seul mot-outil, sa règle « deux mots-outils
        au moins » le rejetait. Un compteur qui rate du texte visible
        est pire qu'inutile pour une liste de contrôle.
    D'où la règle d'aujourd'hui : on ne cherche plus à PROUVER que
    c'est du français — le site l'est tout entier. On retient ce qui a
    LA FORME D'UNE PHRASE D'ÉCRAN, et l'on écarte ce qui a la forme
    d'une valeur technique. Le doute penche du côté du recensement :
    mieux vaut une ligne à écarter en 798 qu'un texte oublié.

    ⚠️ CE QUE L'INSTRUMENT NE SAIT PAS FAIRE, et le rapport le dit : il
    ne distingue pas une chaîne AFFICHÉE d'une chaîne seulement
    journalisée. Les natures « attribut », « métadonnée » et « texte
    JSX » sont sûres ; « littéral » demande un œil.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const RACINE = process.cwd();


/*  ██ 1 · ÔTER LES COMMENTAIRES, SANS ABÎMER LES CHAÎNES ██ */
function sansCommentaires(source) {
  let dehors = "";
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const suivant = source[i + 1];
    if (c === "/" && suivant === "/") {
      while (i < n && source[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && suivant === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const guillemet = c;
      dehors += c;
      i++;
      while (i < n) {
        if (source[i] === "\\") {
          dehors += source[i] + (source[i + 1] ?? "");
          i += 2;
          continue;
        }
        dehors += source[i];
        if (source[i] === guillemet) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    dehors += c;
    i++;
  }
  return dehors;
}

/*  ██ 2 · A-T-IL LA FORME D'UNE VALEUR TECHNIQUE ? ██ */
const JETONS_TAILWIND =
  /(^|[\s:])(flex|grid|text|bg|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|w|h|min|max|gap|rounded|border|absolute|relative|fixed|sticky|hidden|block|inline|inline-block|opacity|z|top|left|right|bottom|overflow|items|justify|self|font|leading|tracking|shadow|transition|duration|ease|scale|rotate|translate|cursor|select|pointer|whitespace|truncate|aspect|object|col|row|space|divide|ring|outline|backdrop|blur|from|via|to|antialiased|sr|not|group|peer|placeholder|caret|accent|list|order|basis|grow|shrink|contain|isolate|mix|filter|invert|saturate|brightness|contrast|grayscale|sepia|hue)(-|$)/;

function estTechnique(texte) {
  const t = texte.trim();
  if (!t) return true;
  if (t.length < 3) return true;
  if (/^[@./]/.test(t)) return true; //  chemin d'import
  if (/^https?:|^mailto:|^tel:|^data:|^#/.test(t)) return true; //  adresse
  if (/^[a-z0-9_-]+$/.test(t)) return true; //  limace, clé, mot seul minuscule
  if (/^[A-Z0-9_]+$/.test(t)) return true; //  constante
  if (/^[a-z0-9-]+(\/[a-z0-9-]*)+$/.test(t)) return true; //  chemin
  if (/^[\w-]+\.(png|jpg|jpeg|webp|svg|ico|css|js|mjs|ts|tsx|html|json|txt|xml)$/i.test(t))
    return true;
  if (/^[\d\s.,:;%+-]+$/.test(t)) return true; //  nombres, durées
  if (/^[a-z-]+\s*:\s*[^;]+;?$/i.test(t) && !/\s\w+\s\w+\s/.test(t)) return true; //  style CSS
  //  Classe(s) Tailwind : que des jetons de mise en forme.
  if (/^[a-zA-Z0-9:_\-[\]/.%()#! ]+$/.test(t) && JETONS_TAILWIND.test(t)) return true;
  //  Requête de sélecteur CSS / attribut de données.
  if (/^\[?data-[\w-]+/.test(t) || /^[.#][\w-]+/.test(t)) return true;
  /*  Le vocabulaire technique à deux mots, que la règle « plusieurs
      mots » laissait passer : directives, en-têtes, types MIME. */
  /*  ██ LES TRACÉS SVG ██ `Icones.tsx` en aligne soixante : « M12 20.5
      C7.5 17.2… ». Majuscule en tête, plusieurs « mots », aucun accent
      — ils passaient toutes les règles de forme et gonflaient
      l'inventaire de 62 « textes » qui ne sont que du dessin. Un tracé
      commence par une commande SVG suivie d'un chiffre, et n'est fait
      que de commandes, de nombres et de séparateurs. */
  if (/^[MmLlHhVvCcSsQqTtAaZz][\s\d.,-]/.test(t) && /^[MmLlHhVvCcSsQqTtAaZz\s\d.,-]+$/.test(t))
    return true;
  if (/^[A-Z][a-z]+\/[A-Z][a-z_]+$/.test(t)) return true; //  fuseau horaire
  if (/^use (client|server|cache)$/.test(t)) return true;
  if (/^[A-Z][a-z]+-[A-Z][a-z]+$/.test(t)) return true; //  Content-Type, Cache-Control
  if (/^[a-z]+\/[a-z0-9.+-]+$/.test(t)) return true; //  application/json
  if (/^(no-store|no-cache|max-age|same-origin|force-dynamic|force-cache)/.test(t)) return true;
  /*  Du CODE pris pour du texte : c'est le piège des GÉNÉRIQUES
      TYPESCRIPT. `Promise<Tatoueur | null>` porte un « < » et un
      « > » : le moissonneur de texte JSX y voyait une balise, et
      ramenait « | null = null; function … » comme s'il s'agissait
      d'une phrase. Aucune phrase d'écran ne contient de point-virgule,
      de flèche, ni de mot-clé du langage. */
  /*  ⚠️ ON ÔTE D'ABORD LES TROUS DE GABARIT. Sans cela, la règle des
      accolades tuait TOUTE phrase à trou — « Mettre le portfolio de
      ${nom} hors ligne » disparaissait de l'inventaire alors que c'est
      un texte d'écran, et des plus visibles. Un trou de gabarit n'est
      pas une accolade de code. */
  const sansTrous = t.replace(/\$\{[^}]*\}/g, "⟨⟩");
  if (/[;{}]|=>|\+\+|&&|\|\|/.test(sansTrous)) return true;
  if (/\b(function|const|let|var|return|await|async|typeof|interface|extends|readonly|null|undefined|void|Promise|Record|Array)\b/.test(sansTrous))
    return true;
  return false;
}

/*  ██ 3 · A-T-IL LA FORME D'UNE PHRASE D'ÉCRAN ? ██
    Un texte d'interface porte au moins un de ces signes : plusieurs
    mots, une majuscule initiale, un accent, ou une ponctuation de
    phrase. Les valeurs techniques, elles, n'en portent aucun. */
const ACCENTS = /[éèêëàâäçùûüôöîïœÉÈÊËÀÂÄÇÙÛÔÎÏŒ]/;
function ressembleAUnTexteDEcran(texte) {
  const t = texte.trim();
  if (t.length < 3) return false;
  if (!/[a-zA-ZéèêëàâäçùûüôöîïœÉÈÊÀÂÇÙÔÎ]/.test(t)) return false;
  if (ACCENTS.test(t)) return true;
  if (/\s/.test(t) && /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(t)) return true;
  if (/[.!?…]$/.test(t)) return true;
  if (/^[A-ZÉÈÀÇ]/.test(t) && t.length > 4) return true;
  return false;
}

/*  ██ 4 · LA MOISSON ██ */
const ATTRIBUTS_D_ECRAN =
  /\b(placeholder|aria-label|aria-description|aria-placeholder|aria-roledescription|alt|title|label)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*[`"']([^`"']*)[`"']\s*\})/g;
const CLES_DE_METADONNEES =
  /\b(title|description|siteName|applicationName|short_name|name|ogTitle|ogDescription)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;

/*  L'ordre dit la certitude : le premier qui prend un texte le garde,
    et l'on ne le recompte plus sous une autre nature (le doublon du
    premier jet). */
const NATURES = ["attribut", "métadonnée", "texte JSX", "littéral"];

function moissonner(source) {
  const propre = sansCommentaires(source);
  const parTexte = new Map();
  const ajouter = (brut, nature) => {
    const t = brut.replace(/\s+/g, " ").trim();
    if (!t || estTechnique(t) || !ressembleAUnTexteDEcran(t)) return;
    const deja = parTexte.get(t);
    if (deja && NATURES.indexOf(deja) <= NATURES.indexOf(nature)) return;
    parTexte.set(t, nature);
  };

  for (const m of propre.matchAll(ATTRIBUTS_D_ECRAN)) {
    ajouter(m[2] ?? m[3] ?? m[4] ?? "", "attribut");
  }
  for (const m of propre.matchAll(CLES_DE_METADONNEES)) {
    ajouter(m[2] ?? m[3] ?? m[4] ?? "", "métadonnée");
  }
  //  Le texte JSX : entre une balise fermante et la suivante.
  for (const m of propre.matchAll(/>([^<>{}]{3,})</g)) {
    ajouter(m[1], "texte JSX");
  }
  /*  Les littéraux. UN GABARIT RESTE ENTIER : ses trous gardent leur
      `${…}`, et il compte pour UN texte — c'est bien une seule phrase
      à traduire. (Le premier jet le découpait et comptait les
      morceaux en plus du tout.) */
  for (const m of propre.matchAll(/"([^"\n]{3,})"|'([^'\n]{3,})'|`([^`]{3,})`/g)) {
    ajouter(m[1] ?? m[2] ?? m[3] ?? "", "littéral");
  }
  return [...parTexte].map(([texte, nature]) => ({ texte, nature }));
}

/*  ██ 5 · LE CLASSEMENT PAR DOMAINE ██ */
function domaine(chemin) {
  if (/^src\/app\/dev\//.test(chemin) || /api\/dev\//.test(chemin))
    return "H · page /dev (verrouillée admin)";
  if (/admin|Admin/.test(chemin)) return "F · espace admin";
  if (/^src\/lib\/email\.ts$/.test(chemin)) return "D · courriels";
  if (/^src\/app\/api\//.test(chemin)) return "E · code serveur (API)";
  if (/^src\/app\/\(tatouage\)\/(qui-sommes-nous|contact|mentions-legales)/.test(chemin))
    return "C · pages éditoriales";
  if (/^src\/app\/(manifest|sitemap|robots|not-found|icon|opengraph)/.test(chemin))
    return "G · manifeste, 404, métadonnées";
  if (/^src\/app\/.*\/(page|layout|template|not-found|error)\.tsx$/.test(chemin))
    return "B · pages et gabarits";
  if (/^src\/components\//.test(chemin)) return "A · composants d'interface";
  if (/^src\/config\//.test(chemin)) return "I · listes de référence (config)";
  return "J · bibliothèque (lib)";
}

/* ══════════ LA MOISSON ══════════ */
const fichiers = execSync(
  `cd ${RACINE} && git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'src/*.ts' 'scripts/*.mjs' 'outils/*.mjs'`,
  { encoding: "utf8" }
)
  .split("\n")
  .filter(Boolean)
  /*  L'atelier ne part pas en production — et ce script ne se compte
      pas lui-même : il parle français, il n'est vu par personne. */
  .filter((f) => !/^outils\//.test(f) && f !== "scripts/recenser-textes.mjs");

const parFichier = [];
for (const chemin of fichiers) {
  const trouvailles = moissonner(readFileSync(`${RACINE}/${chemin}`, "utf8"));
  if (trouvailles.length === 0) continue;
  parFichier.push({ chemin, domaine: domaine(chemin), trouvailles });
}
parFichier.sort(
  (a, b) => a.domaine.localeCompare(b.domaine) || b.trouvailles.length - a.trouvailles.length
);
writeFileSync("recensement-textes.json", JSON.stringify(parFichier, null, 1));

/* ══════════ LE BILAN ══════════ */
const parDomaine = new Map();
let total = 0;
for (const f of parFichier) {
  const d = parDomaine.get(f.domaine) ?? { fichiers: 0, textes: 0 };
  d.fichiers++;
  d.textes += f.trouvailles.length;
  parDomaine.set(f.domaine, d);
  total += f.trouvailles.length;
}
console.log(`fichiers examinés            : ${fichiers.length}`);
console.log(`fichiers porteurs de texte   : ${parFichier.length}`);
console.log(`textes retenus               : ${total}\n`);
for (const [d, v] of [...parDomaine].sort()) {
  console.log(
    `   ${d.padEnd(40)} ${String(v.fichiers).padStart(3)} fich. · ${String(v.textes).padStart(4)} textes`
  );
}
console.log("\n── les 18 fichiers les plus chargés ──");
for (const f of [...parFichier].sort((a, b) => b.trouvailles.length - a.trouvailles.length).slice(0, 18)) {
  console.log(`   ${String(f.trouvailles.length).padStart(4)}  ${f.chemin}`);
}
