/*  ██ nº 797 — LE RECENSEMENT DES TEXTES FRANÇAIS ██
    ==================================================================
    USAGE :  node scripts/recenser-textes.mjs
    Il écrit le détail dans `recensement-textes.json` (à la racine,
    une SORTIE : ne pas la committer — ignoré par git depuis la nº 806,
    parce que Tailwind lisait ce JSON et en tirait des règles mortes,
    voir .gitignore) et le bilan à l'écran.
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

    ██ nº 804 — LE MODE « --francais » : LE BANC DE LA TRADUCTION ██
    ==================================================================
    USAGE :  node scripts/recenser-textes.mjs --francais --perimetre=A,B,C,G
    Le recensement de la nº 797 comptait TOUT ce qui a la forme d'un
    texte d'écran, anglais compris (le site en avait déjà : « Choose a
    style »). Pour prouver qu'une passe de traduction n'a RIEN laissé,
    il faut l'inverse : ne retenir que ce qui ressemble à du FRANÇAIS,
    et le lister. Sortie 0 si la liste est vide (hors exceptions
    déclarées ci-dessous), 1 sinon.
    CE QUI CHANGE DANS CE MODE, ET SEULEMENT DANS CE MODE — le compte
    de la nº 797 ne bouge pas :
      · la moisson JSX est plus fine : un texte coupé par une accolade
        (« Regarde le cœur {…} du logo ») est lu MORCEAU PAR MORCEAU,
        là où la moisson d'origine l'ignorait tout entier ;
      · un texte est « français » s'il porte un accent, ou un mot-outil
        français entier (le, la, les, des, une, et, ou, pour, avec…) ;
      · les EXCEPTIONS sont déclarées, avec leur raison, pas cachées.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const RACINE = process.cwd();
const ARGUMENTS = process.argv.slice(2);
const MODE_FRANCAIS = ARGUMENTS.includes("--francais");
const PERIMETRE = (ARGUMENTS.find((a) => a.startsWith("--perimetre=")) ?? "")
  .replace("--perimetre=", "")
  .split(",")
  .filter(Boolean);

/*  ██ LES EXCEPTIONS DU MODE FRANÇAIS (nº 804) ██
    Chacune dit POURQUOI. Une exception sans raison est un texte oublié
    qui se cache.
    ⚠️ nº 806 — LES INSTRUMENTS NE SONT PLUS DES EXCEPTIONS : les sondes
    (SondeNavigation, SondeVitesse, TableauDeBordDesSondes, OutilsSonde,
    BoutonEnvoyerJournal, MemoireNavigation, DefilementEnHaut), les
    signatures des modules de défilement (lib/bas-de-la-pile,
    carte-du-haut, defilement-programme, gel-du-corps, geste-toucher,
    glissement-lateral, liste-neuve, remontee-champ, vitesse) et les
    étiquettes `data-source-composant` sont traduits (décision du
    propriétaire : l'admin et /dev en anglais aussi). Leurs quatre
    exceptions sont retirées ; il n'en reste que quatre, toutes sur des
    DONNÉES, jamais sur de l'interface. */
const EXCEPTIONS = [
  /*  ── nº 805 : le périmètre D + E + J ── */
  {
    fichier: /^scripts\/engendrer-emojis\.mjs$/,
    raison: "script d'atelier : son écran est le terminal du propriétaire, et ce qu'il écrit dans emojis-donnees.ts est un commentaire (les commentaires du dépôt restent en français)",
  },
  {
    fichier: /^src\/lib\/emojis-donnees\.ts$/,
    raison: "données Unicode EN ANGLAIS (régénérées à la nº 804) : « ma'am », « 5–0 » ne sont pas du français",
  },
  {
    fichier: /^src\/lib\/tatoueurs-demo\.ts$/,
    raison: "fiches de démonstration, interdites en ligne (lib/catalogue-demonstration) : des données de banc, pas de l'interface",
  },
  {
    fichier: /^src\/lib\/adresse\.ts$/,
    raison: "tables de RECONNAISSANCE : les noms français (Californie, Québec, Brésil, République française…) servent à reconnaître ce que rend le géocodeur ou ce que porte une vieille fiche, jamais à l'afficher — ce qui s'affiche est la colonne de droite, anglaise depuis la nº 805 (USA, UK, Germany, TX, QC)",
  },
];

const ACCENTS_FRANCAIS = /[éèêëàâçùûôîïœÉÈÊËÀÂÇÙÛÔÎÏŒ]/;
const MOTS_OUTILS_FRANCAIS = new Set([
  "le", "les", "des", "une", "un", "du", "et", "ou", "pour", "avec", "sur",
  "dans", "ce", "cette", "ces", "cet", "ta", "tes", "mon", "ma", "mes",
  "votre", "vos", "notre", "nos", "sont", "pas", "ne", "qui", "que", "quoi",
  "au", "aux", "chez", "tout", "tous", "toute", "toutes", "rien", "aucun",
  "aucune", "encore", "depuis", "vers", "entre", "sous", "puis", "donc",
  "alors", "enfin", "bien", "mais", "comme", "oui", "ici", "moins", "trop",
  "peu", "beaucoup", "autre", "autres", "aussi", "ainsi", "toujours",
  "jamais", "souvent", "maintenant", "avant", "pendant", "contre", "selon",
  "parmi", "afin", "lorsque", "tandis", "ni", "soit", "voici", "merci",
  "bonjour", "je", "tu", "il", "ils", "elle", "elles", "nous", "vous", "lui",
  "leur", "leurs", "ses", "sa", "celui", "celle", "ceux", "quel", "quelle",
  "quels", "quelles", "quand", "comment", "pourquoi", "parce", "en",
  "être", "avoir", "fait", "faire", "peut", "peux", "doit", "dois", "suis",
  "sera", "seront", "cliquer", "choisir", "envoyer", "ajouter", "supprimer",
  "modifier", "enregistrer", "fermer", "ouvrir", "voir", "chercher",
  "rechercher", "trouver", "retirer", "annuler", "valider", "continuer",
  "suivre", "suivi", "compris", "envoi", "retour", "accueil", "connexion",
  "recherche", "chargement", "lecture", "nouveau", "nouvelle", "mois",
  "jour", "jours", "heures", "semaine", "ville", "pays", "nom", "tatoueur",
  "tatoueurs", "tatouage", "rendu", "mot", "passe", "se", "te",
  /*  ██ nº 820 — LES VERBES QUI MANQUAIENT, ET CE QU'ILS ONT LAISSÉ
      PASSER ██
      LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : « Changer d'e-mail » est
      resté en français sur la page Sécurité, sous les yeux d'un
      recenseur qui rendait « 0 texte français ». La moisson, elle,
      l'avait bien pris (tout littéral de trois caractères est lu) : ce
      qui a manqué, c'est le JUGEMENT — le texte n'a pas d'accent, et
      « changer » n'était pas dans cette liste. Un mot absent, un texte
      invisible.
      LA RÉPARATION : les verbes d'interface français les plus courants
      qui n'y figuraient pas. ⚠️ CHACUN EST FRANÇAIS ET FRANÇAIS SEUL —
      aucun n'existe en anglais (« change », « place », « note » ne
      sont donc PAS dans la liste) : un texte anglais ne peut pas être
      accusé par eux. */
  "changer", "afficher", "masquer", "copier", "coller", "remplir",
  "vider", "trier", "classer", "revenir", "retourner", "commencer",
  "terminer", "essayer", "vérifier", "corriger", "remplacer",
  "télécharger", "déplacer", "glisser", "appuyer", "toucher", "saisir",
  "écrire", "lire", "aider", "prévenir", "partager", "publier",
  "quitter", "rejoindre", "créer", "gérer",
]);
/*  ⚠️ N'Y FIGURENT PAS, PARCE QU'ILS SONT AUSSI ANGLAIS : « la », « on »,
    « a », « son », « ton », « est », « plus », « sans », « photo »,
    « portfolio », « message », « instant », « me », « non ». Un texte
    français qui ne tiendrait que par eux est trop court pour tromper
    l'œil ; et l'accent, lui, ne ment jamais. */

function estFrancais(texte) {
  if (/sans-serif/.test(texte)) return false;
  //  Les trous de gabarit et les chemins ne sont pas du texte : on lit
  //  ce qu'il reste une fois qu'ils sont ôtés.
  const lisible = texte
    .replace(/\$\{[^}]*\}/g, " ")
    .replace(/\S+\/\S+|\S+\.\S+/g, " ")
    //  nº 805 — un IDENTIFIANT EN MAJUSCULES n'est pas un mot : « NOM_
    //  CONVENTION_MAXIMUM » se lisait « nom », un mot-outil français.
    .replace(/\b[A-Z0-9_]{2,}\b/g, " ");
  if (ACCENTS_FRANCAIS.test(lisible)) return true;
  const mots = lisible.toLowerCase().match(/[a-zà-ü']+/g) ?? [];
  return mots.some((m) => MOTS_OUTILS_FRANCAIS.has(m));
}

function estUneException(chemin, texte) {
  return EXCEPTIONS.find(
    (e) => (!e.fichier || e.fichier.test(chemin)) && (!e.texte || e.texte.test(texte))
  );
}

/** Le texte JSX lu morceau par morceau : on retire les accolades (un
    niveau d'imbrication suffit à ce dépôt) et l'on garde les bouts. */
function morceauxJsx(segment) {
  const morceaux = [];
  let profondeur = 0;
  let courant = "";
  for (const c of segment) {
    if (c === "{") {
      if (profondeur === 0 && courant.trim()) morceaux.push(courant);
      courant = "";
      profondeur++;
      continue;
    }
    if (c === "}") {
      profondeur = Math.max(0, profondeur - 1);
      continue;
    }
    if (profondeur === 0) courant += c;
  }
  if (courant.trim()) morceaux.push(courant);
  return morceaux;
}


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
    /*  nº 805 — UN LITTÉRAL D'EXPRESSION RÉGULIÈRE N'EST PAS UNE CHAÎNE,
        et c'est un défaut d'instrument corrigé sur le fait : dans
        `tatoueurs.ts`, `/column\s+(?:"?[a-z0-9_]+"?\.)?…/i` porte des
        guillemets. Le découpeur y voyait une chaîne ouverte, se
        désynchronisait, et prenait ensuite les COMMENTAIRES pour du code
        — trente « textes » qui n'en étaient pas. Un `/` qui suit une
        parenthèse, une virgule, un `=`, un `:`, un `!`, un `&`, un `|`,
        un `?`, un `{`, un `;`, un crochet ouvrant ou le mot `return`
        ouvre une expression régulière : on la recopie telle quelle
        jusqu'à sa barre fermante (hors classe `[…]`), puis ses drapeaux. */
    if (c === "/" && suivant !== "/" && suivant !== "*") {
      const avant = dehors.replace(/\s+$/, "");
      const ouvreUneRegex =
        avant === "" || /[(,=:!&|?{;\[]$/.test(avant) || /\breturn$/.test(avant);
      if (ouvreUneRegex) {
        let j = i + 1;
        let dansClasse = false;
        while (j < n && source[j] !== "\n") {
          if (source[j] === "\\") {
            j += 2;
            continue;
          }
          if (source[j] === "[") dansClasse = true;
          else if (source[j] === "]") dansClasse = false;
          else if (source[j] === "/" && !dansClasse) break;
          j++;
        }
        if (j < n && source[j] === "/") {
          j++;
          while (j < n && /[a-z]/.test(source[j])) j++;
          dehors += source.slice(i, j);
          i = j;
          continue;
        }
      }
    }
    if (c === '"' || c === "'" || c === "`") {
      const guillemet = c;
      dehors += c;
      i++;
      /*  nº 804 — DANS UN GABARIT, LES TROUS `${…}` SONT DU CODE : ils
          peuvent porter des commentaires (« ${ // pourquoi … } »), que
          le premier jet recopiait comme du texte. On les ôte comme
          ailleurs, en suivant la profondeur des accolades. */
      let profondeurTrou = 0;
      while (i < n) {
        if (source[i] === "\\") {
          dehors += source[i] + (source[i + 1] ?? "");
          i += 2;
          continue;
        }
        if (guillemet === "`" && profondeurTrou > 0) {
          if (source[i] === "/" && source[i + 1] === "/") {
            while (i < n && source[i] !== "\n") i++;
            continue;
          }
          if (source[i] === "/" && source[i + 1] === "*") {
            i += 2;
            while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i++;
            i += 2;
            continue;
          }
          if (source[i] === '"' || source[i] === "'") {
            //  une chaîne dans le trou : recopiée telle quelle
            const g = source[i];
            dehors += source[i];
            i++;
            while (i < n && source[i] !== g) {
              if (source[i] === "\\") {
                dehors += source[i];
                i++;
              }
              dehors += source[i];
              i++;
            }
            dehors += source[i] ?? "";
            i++;
            continue;
          }
          if (source[i] === "{") profondeurTrou++;
          if (source[i] === "}") profondeurTrou--;
          dehors += source[i];
          i++;
          continue;
        }
        if (guillemet === "`" && source[i] === "$" && source[i + 1] === "{") {
          profondeurTrou = 1;
          dehors += "${";
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

function moissonner(source, chemin = "") {
  const propre = sansCommentaires(source);
  const parTexte = new Map();
  const ajouter = (brut, nature) => {
    const t = brut.replace(/\s+/g, " ").trim();
    /*  nº 804, mode français : un texte qui COMMENCE PAR UN SIGNE
        (« + Ajouter … ») n'a pas la forme d'une phrase pour la règle
        d'origine, qui le laissait passer — c'est ainsi que
        « + Ajouter a tattoo shop » a survécu au premier banc. Ici, un
        signe suivi d'un mot suffit à mériter la lecture — et RIEN DE
        PLUS LARGE : le premier élargissement (« un mot de trois
        lettres ») ramenait 35 bouts de code pris pour du texte. */
    const aLaFormeDUnTexte =
      ressembleAUnTexteDEcran(t) || (MODE_FRANCAIS && /^[+\-–—•·*]\s+[A-Za-zÀ-ü]{3,}/.test(t));
    if (!t || estTechnique(t) || !aLaFormeDUnTexte) return;
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
  //  nº 806 — DANS LES SEULS FICHIERS `.tsx` : un `.ts` ne peut pas
  //  porter de JSX, et « (quand) => Date.now() - quand < FENETRE » (lib/
  //  journal-de-bord) se lisait comme un texte entre deux balises. Le
  //  défaut dormait derrière l'exception « modules-sondes » retirée
  //  cette passe.
  const peutPorterDuJsx = chemin.endsWith(".tsx");
  for (const m of peutPorterDuJsx ? propre.matchAll(/>([^<>{}]{3,})</g) : []) {
    ajouter(m[1], "texte JSX");
  }
  //  nº 804, mode français seulement : le texte JSX coupé par des
  //  accolades, lu morceau par morceau.
  if (MODE_FRANCAIS && peutPorterDuJsx) {
    for (const m of propre.matchAll(/>([^<>]*\{[^<>]*)</g)) {
      for (const morceau of morceauxJsx(m[1])) ajouter(morceau, "texte JSX");
    }
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
  //  nº 811 — les dossiers s'appellent `about`, `contact`, `legal` ;
  //  nº 814 — et `terms`.
  if (/^src\/app\/\(tatouage\)\/(about|contact|legal|terms)\//.test(chemin))
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
  const d = domaine(chemin);
  if (PERIMETRE.length && !PERIMETRE.includes(d[0])) continue;
  let trouvailles = moissonner(readFileSync(`${RACINE}/${chemin}`, "utf8"), chemin);
  if (MODE_FRANCAIS) trouvailles = trouvailles.filter((t) => estFrancais(t.texte));
  if (trouvailles.length === 0) continue;
  parFichier.push({ chemin, domaine: d, trouvailles });
}

/* ══════════ LE BANC DE LA TRADUCTION (nº 804) ══════════ */
if (MODE_FRANCAIS) {
  let restes = 0;
  let exceptes = 0;
  for (const f of parFichier) {
    const lignes = [];
    for (const t of f.trouvailles) {
      const exception = estUneException(f.chemin, t.texte);
      if (exception) {
        exceptes++;
        continue;
      }
      restes++;
      lignes.push(`      [${t.nature[0]}] ${t.texte}`);
    }
    if (lignes.length) {
      console.log(`\n   ${f.chemin}`);
      for (const l of lignes) console.log(l);
    }
  }
  console.log(
    `\n── périmètre ${PERIMETRE.join("+") || "entier"} · textes français restants : ${restes} · exceptions déclarées : ${exceptes}`
  );
  console.log(restes === 0 ? "── PLUS AUCUN TEXTE FRANÇAIS ✔" : "── IL EN RESTE ✖");
  process.exit(restes === 0 ? 0 : 1);
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
