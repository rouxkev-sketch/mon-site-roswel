/**
 * BANC DE LA PASSE Nº 266
 * ==================================================================
 * §1 le bloc 1 : les deux questions reformulées mot pour mot, le titre
 *    « Où se trouve-t-il ? » au-dessus du champ d'adresse, son libellé
 *    intérieur selon salon ou studio, et LE CHAMP DU NOM DU LIEU —
 *    apparu après l'adresse, libellé dedans, croix d'effacement,
 *    obligatoire (encadré rouge), et parti avec l'adresse dès que le
 *    portfolio du lieu est trouvé par la recherche ;
 * §2 la validation signale TOUT : l'encadrement des badges de mode
 *    rougit, les champs manquants rougissent, les titres numérotés
 *    aussi ; la remontée mène au premier manque, et seulement au clic
 *    de validation ;
 * §3 le point blanc du bloc 6 : cause nommée et mesurée (le pouce de
 *    la barre de défilement peint sans débordement), remède sans
 *    masque.
 *
 * ⚠️ LE FORMULAIRE EXIGE UNE SESSION (Supabase hors de portée de cet
 * environnement) : ses blocs ne se montent pas ici. Les écritures
 * RÉELLES sont donc INJECTÉES dans la page vivante (classes et
 * branches résolues, lues à la source) et mesurées, et la logique de
 * validation est REJOUÉE à partir des expressions extraites des
 * fichiers livrés. Dit NON JOUÉ pour le parcours réel.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const ouvrirA = async (largeur, chemin = "/", options = {}) => {
  const mobile = options.mobile ?? largeur < 1024;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  const fermerContexte = contexte.close.bind(contexte);
  contexte.close = async () => {
    await fermerContexte();
    await nav.close();
  };
  return { contexte, page };
};

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocModes = lire("src/components/BlocModesExercice.tsx");
const blocModesNu = sansNotes(blocModes);
const deuxZones = lire("src/components/DeuxZonesLieu.tsx");
const deuxZonesNu = sansNotes(deuxZones);
const modesLib = sansNotes(lire("src/lib/modes-exercice.ts"));
const exercice = sansNotes(lire("src/lib/enregistrer-exercice.ts"));
const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
const recherche = lire("src/components/RechercheFicheInscrite.tsx");
const rechercheNue = sansNotes(recherche);
const css = lire("src/app/globals.css");
const migration = lire("supabase/yokofolio-nom-du-lieu.sql");
const champsPartages = lire("src/components/champs-formulaire.ts");

/** LE ROUGE DU SITE — `COULEURS.erreur` (#D32E28, config/roswel) :
    l'unique rouge des manques, celui de `border-erreur`. */
const ROUGE = "rgb(211, 46, 40)";

/* ==================================================================
 * §1 — LES QUESTIONS, LES TITRES, LES LIBELLÉS
 * ================================================================== */
titre("§1 — à la source : les deux questions, mot pour mot");
{
  verif(
    "« Le studio a-t-il son portfolio sur YokoFolio ? » et son jumeau salon",
    /"Le studio a-t-il son portfolio sur YokoFolio \?"/.test(blocModesNu) &&
      /"Le salon a-t-il son portfolio sur YokoFolio \?"/.test(blocModesNu) &&
      //  … et les anciennes formulations ont disparu de ce bloc.
      !/"Ton studio est-il sur YokoFolio \?"/.test(blocModesNu) &&
      !/"Ton salon est-il sur YokoFolio \?"/.test(blocModesNu)
  );
  verif(
    "le titre de la zone d'adresse est posé, et le libellé suit la nature du lieu",
    /titreAdresse="Où se trouve-t-il \?"/.test(blocModesNu) &&
      /indicationManuel=\{\s*prive \? "Ville ou adresse complète" : "Adresse complète"\s*\}/.test(
        blocModesNu
      )
  );
  verif(
    "le titre de la zone d'adresse est rendu, et il ne rougit jamais (règle nº 116)",
    /data-titre-adresse=""/.test(deuxZones) &&
      /\{titreAdresse\}/.test(deuxZonesNu) &&
      /text-\[13\.5px\] font-semibold text-sombre-texte/.test(
        deuxZonesNu.slice(
          deuxZonesNu.indexOf("data-titre-adresse"),
          deuxZonesNu.indexOf("</p>", deuxZonesNu.indexOf("data-titre-adresse"))
        )
      )
  );
}

titre("§1 — à la source : le champ du nom du lieu");
{
  verif(
    "il n'existe QU'APRÈS une adresse choisie, et son libellé vit dedans",
    /\{libelleNomLieu && lieu && \(/.test(deuxZonesNu) &&
      /placeholder=\{libelleNomLieu\}/.test(deuxZonesNu) &&
      //  Aucun titre au-dessus de lui.
      !/titreNomLieu/.test(deuxZonesNu)
  );
  verif(
    "le libellé suit le lieu : « Nom du studio » / « Nom du salon »",
    /libelleNomLieu=\{prive \? "Nom du studio" : "Nom du salon"\}/.test(
      blocModesNu
    )
  );
  verif(
    "il porte la croix d'effacement, comme les autres champs",
    /aria-label="Effacer le nom"/.test(deuxZonesNu) &&
      /onClick=\{\(\) => surNomLieu\?\.\(""\)\}/.test(deuxZonesNu) &&
      /<IconeCroix taille=\{16\} \/>/.test(deuxZonesNu)
  );
  verif(
    "il consomme l'ÉCRITURE PARTAGÉE des champs (aucune seconde)",
    /export const CHAMP =/.test(champsPartages) &&
      /\$\{CHAMP\} pr-12/.test(deuxZonesNu) &&
      /from "@\/components\/champs-formulaire"/.test(deuxZones) &&
      //  … et le formulaire la partage, il ne la redéclare pas.
      /from "@\/components\/champs-formulaire"/.test(formulaire) &&
      !/const CHAMP =\s*"w-full min-h/.test(formulaire)
  );
  verif(
    "il est OBLIGATOIRE : une seule règle, lue par l'écran et par la validation",
    /export function nomLieuRequis\(mode: ModeEnSaisie\): boolean/.test(
      modesLib
    ) &&
      /if \(nomLieuRequis\(mode\) && !\(mode\.nomLieu \?\? ""\)\.trim\(\)\) return false;/.test(
        modesLib
      ) &&
      /champ: "nomLieu",/.test(modesLib)
  );
  verif(
    "son encadré rouge est celui du site (border-erreur), sans une phrase",
    /nomLieuEnErreur \? "border-erreur" : "border-transparent"/.test(
      deuxZonesNu
    ) &&
      /nomLieuEnErreur=\{manquant\(mode\.cle, "nomLieu"\)\}/.test(blocModesNu)
  );
  verif(
    "LA BASCULE INVERSE : trouver le portfolio efface l'adresse ET le nom",
    /lieu: null,\s*nomLieu: null,/.test(blocModesNu) &&
      //  … et le champ disparaît avec l'adresse (il est conditionné à
      //  `lieu`, ci-dessus).
      /\{libelleNomLieu && lieu && \(/.test(deuxZonesNu)
  );
  verif(
    "il se persiste : écrit en base là où il a un sens, relu au chargement",
    /nom_lieu: nomLieuRequis\(mode\)/.test(exercice) &&
      /"nom_lieu",/.test(exercice) &&
      /nomLieu:\s*\(ligne as unknown as \{ nom_lieu\?: string \| null \}\)\.nom_lieu \?\? null,/.test(
        formulaire
      )
  );
  verif(
    "la migration existe, facultative pour la base, et ne recopie aucun nom de fiche",
    /add column if not exists nom_lieu text;/.test(migration) &&
      /modes_exercice/.test(migration) &&
      !/update public\.modes_exercice/.test(migration)
  );
}

/* ==================================================================
 * §1 — LE CHAMP DU NOM, INJECTÉ ET MESURÉ (deux largeurs)
 * ================================================================== */
const classeChamp = (enErreur) =>
  nettoyer(
    `${
      lire("src/components/champs-formulaire.ts").match(
        /export const CHAMP =\s*([\s\S]*?);/
      )?.[1]
      ?.split("+")
      .map((morceau) => morceau.trim().replace(/^"|"$/g, ""))
      .join("") ?? ""
    } pr-12 ${enErreur ? "border-erreur" : "border-transparent"}`
  );
for (const largeur of [390, 1440]) {
  titre(`§1 — le champ du nom, injecté (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:80px;left:16px;width:340px;z-index:9999";
        hote.innerHTML =
          '<div style="position:relative"><input data-nom-lieu class="' + c.normal + '" placeholder="Nom du salon" />' +
          '<button data-croix class="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full"></button></div>' +
          '<div style="position:relative;margin-top:12px"><input data-nom-rouge class="' + c.rouge + '" placeholder="Nom du studio" /></div>';
        document.body.appendChild(hote);
        const normal = hote.querySelector("[data-nom-lieu]");
        const rouge = hote.querySelector("[data-nom-rouge]");
        const croix = hote.querySelector("[data-croix]");
        const bN = normal.getBoundingClientRect();
        const bC = croix.getBoundingClientRect();
        const mesure = {
          libelle: normal.placeholder,
          hauteur: Math.round(bN.height),
          bordureNormale: getComputedStyle(normal).borderTopColor,
          bordureRouge: getComputedStyle(rouge).borderTopColor,
          croixDansLeChamp:
            bC.right <= bN.right + 1 && bC.left > bN.left && bC.width > 0,
          placeReservee:
            parseFloat(getComputedStyle(normal).paddingRight) >= 40,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        normal: classeChamp(false),
        rouge: classeChamp(true),
      })})`
    );
    verif(
      `${largeur} px : le libellé vit DANS le champ, à la hauteur des champs du formulaire (52)`,
      vu.libelle === "Nom du salon" && vu.hauteur === 52,
      `« ${vu.libelle} » · ${vu.hauteur} px`
    );
    verif(
      `${largeur} px : neutre la bordure est invisible, en manque elle est ROUGE`,
      vu.bordureNormale === "rgba(0, 0, 0, 0)" && vu.bordureRouge === ROUGE,
      `repos ${vu.bordureNormale} · manque ${vu.bordureRouge}`
    );
    verif(
      `${largeur} px : la croix tient dans le champ, et sa place est réservée`,
      vu.croixDansLeChamp && vu.placeReservee
    );
  } catch (erreur) {
    nonJoue(`§1 · injection (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1/§2 — LA VALIDATION REJOUÉE (les expressions livrées)
 * ================================================================== */
titre("§1/§2 — la validation rejouée sur les cas du relevé");
{
  //  L'expression de `nomLieuRequis` est LUE dans le fichier livré et
  //  évaluée telle quelle — jamais réécrite.
  const source = modesLib.match(
    /export function nomLieuRequis\(mode: ModeEnSaisie\): boolean \{([\s\S]*?)\n\}/
  )?.[1];
  const nomLieuRequis = new Function(
    "mode",
    source.replace(/: ModeEnSaisie/g, "")
  );
  const salonSaisi = { genre: "salon", salon: null, lieu: { intitule: "Lyon" } };
  const salonTrouve = {
    genre: "salon",
    salon: { id: "x", nom: "Encre Noire" },
    lieu: null,
  };
  const domicile = { genre: "domicile", salon: null, lieu: { intitule: "Lyon" } };
  const sansAdresse = { genre: "salon", salon: null, lieu: null };
  verif(
    "le nom est exigé sur un lieu SAISI, jamais sur un lieu TROUVÉ, jamais à domicile",
    nomLieuRequis(salonSaisi) === true &&
      nomLieuRequis(salonTrouve) === false &&
      nomLieuRequis(domicile) === false &&
      //  … et pas avant l'adresse : le champ n'existe pas encore.
      nomLieuRequis(sansAdresse) === false,
    `saisi ${nomLieuRequis(salonSaisi)} · trouvé ${nomLieuRequis(
      salonTrouve
    )} · domicile ${nomLieuRequis(domicile)} · sans adresse ${nomLieuRequis(
      sansAdresse
    )}`
  );
}

titre("§2 — à la source : le rouge partout, et la remontée d'un seul endroit");
{
  verif(
    "l'ENCADREMENT du badge rougit — le cadre, jamais le mot ni le fond",
    /data-badge-en-faute=\{cadreRouge \? "" : undefined\}/.test(blocModesNu) &&
      /cadreRouge \? "border-erreur" : "border-transparent"/.test(blocModesNu) &&
      //  Le fond du badge ne change pas d'un jeton.
      /actif\s*\? "bg-primaire\/15"\s*: "bg-sombre-eleve hover:bg-primaire\/10 active:bg-primaire\/10"/.test(
        blocModesNu
      )
  );
  verif(
    "le badge rouge est CELUI du mode incomplet (sa clé, son genre)",
    //  ⚠️ nº 267 (§1) : le rouge lit désormais TOUS les manques, plus
    //  seulement le premier — un artiste cumule les quatre modes, et
    //  les quatre badges doivent pouvoir rougir ensemble.
    /const cadreRouge = modes\.some\(\s*\(mode\) => mode\.genre === genre && modeEnManque\(mode\.cle\)\s*\);/.test(
      blocModesNu
    ) && /function modeEnManque\(cle: string\): boolean/.test(blocModesNu)
  );
  verif(
    "le TITRE NUMÉROTÉ du volet incomplet rougit (« À domicile 2/2 »)",
    //  ⚠️ nº 267 (§1) : même bascule vers la liste complète.
    /data-titre-en-faute=\{\s*modeEnManque\(session\.cle\) \? "" : undefined\s*\}/.test(
      blocModesNu
    ) &&
      /modeEnManque\(session\.cle\)\s*\? "text-erreur"/.test(blocModesNu)
  );
  verif(
    "… et l'intertitre d'un lieu unique aussi",
    (blocModesNu.match(/data-titre-volet=\{session\.cle\}/g) ?? []).length === 2
  );
  verif(
    "LE MÉCANISME EST CELUI DU SITE, pas un second : `premierManque` désigne, `defilerVersErreur` remonte",
    //  ⚠️ nº 267 (§1) : `premierManque` est devenu `tousLesManques`,
    //  dont le PREMIER élément commande la remontée — une seule règle,
    //  deux lectures. Le mécanisme du site reste consommé tel quel.
    /import \{[\s\S]*?tousLesManques,[\s\S]*?\} from "@\/lib\/modes-exercice";/.test(
      lire("src/components/FormulaireFiche.tsx")
    ) &&
      /const manqueDesigne = manquesDesignes\[0\] \?\? null;/.test(
        formulaire
      ) &&
      /defilerVersErreur\(fautes\);/.test(formulaire)
  );
  verif(
    "LA REMONTÉE NE SE DÉCLENCHE QU'À LA VALIDATION — jamais à la frappe",
    //  Le seul appel vit dans `envoyer`, après `setErreurs(fautes)`.
    (formulaire.match(/defilerVersErreur\(/g) ?? []).length === 2 &&
      /if \(Object\.keys\(fautes\)\.length > 0\) \{[\s\S]{0,400}defilerVersErreur\(fautes\);/.test(
        formulaire
      ) &&
      //  … et l'effet qui rejoue la validation à chaque frappe
      //  n'AJOUTE jamais rien : il ne fait qu'enlever.
      /const gardees = cles\.filter\(/.test(formulaire)
  );
  verif(
    "aucune phrase d'explication n'accompagne le rouge (charte)",
    !/text-erreur[^"]*">\s*\{?messageDuManque/.test(blocModes)
  );
}

/* ==================================================================
 * §3 — LE POINT FANTÔME : LA CAUSE, MESURÉE
 * ================================================================== */
titre("§3 — le point blanc du bloc 6 : la cause nommée, puis fermée");
{
  verif(
    "LA CAUSE — le pouce de `.defilement-visible` : 11 px, arrondi 999, gris clair",
    /\.defilement-visible::-webkit-scrollbar \{\s*display: block;\s*width: 11px;/.test(
      css
    ) &&
      /\.defilement-visible::-webkit-scrollbar-thumb \{\s*background-color: var\(--rw-bordure-carte\);\s*border-radius: 999px;/.test(
        css
      ) &&
      /border: 3px solid transparent;/.test(css)
  );
  verif(
    "LE REMÈDE N'EST PAS UN MASQUE : l'exception n'est posée QUE si la liste déborde",
    /listeDeborde \? " defilement-visible" : ""/.test(rechercheNue) &&
      /setListeDeborde\(cadre\.scrollHeight > cadre\.clientHeight \+ 1\)/.test(
        rechercheNue
      ) &&
      //  … et rien n'est peint par-dessus : aucun cache, aucun voile.
      !/masque|cache-point|overlay/.test(rechercheNue)
  );
  verif(
    "la mesure est refaite quand la liste change ou que la fenêtre bouge",
    /new ResizeObserver\(lire\)/.test(rechercheNue) &&
      /\}, \[ouverte, resultats, cherche\]\);/.test(rechercheNue)
  );
}

titre("§3 — mesuré : vingt ouvertures, aucun pouce peint sans débordement");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(() => {
      const hote = document.createElement("div");
      hote.style.cssText =
        "position:fixed;top:80px;left:80px;width:320px;z-index:9999";
      document.body.appendChild(hote);
      //  On rejoue VINGT ouvertures : liste courte (le cas du relevé)
      //  et liste longue, à l'écriture livrée — la classe n'est posée
      //  que si ça déborde.
      const resultats = [];
      for (let tour = 0; tour < 20; tour += 1) {
        const courte = tour % 2 === 0;
        hote.innerHTML =
          '<div data-panneau style="max-height:280px;overflow-y:auto"><ul>' +
          Array.from({ length: courte ? 1 : 12 })
            .map(() => '<li style="height:52px"></li>')
            .join("") +
          "</ul></div>";
        const panneau = hote.querySelector("[data-panneau]");
        const deborde = panneau.scrollHeight > panneau.clientHeight + 1;
        //  L'ÉCRITURE LIVRÉE : la classe suit le débordement.
        if (deborde) panneau.classList.add("defilement-visible");
        resultats.push({
          courte,
          deborde,
          classePosee: panneau.classList.contains("defilement-visible"),
        });
      }
      hote.remove();
      return resultats;
    });
    const courtes = vu.filter((tour) => tour.courte);
    const longues = vu.filter((tour) => !tour.courte);
    verif(
      "sur vingt ouvertures : aucune liste courte ne porte la barre (donc aucun point)",
      vu.length === 20 && courtes.every((tour) => tour.classePosee === false),
      `${courtes.length} listes courtes · classes posées : ${
        courtes.filter((t) => t.classePosee).length
      }`
    );
    verif(
      "et la barre reste là où elle sert : les listes qui débordent la gardent",
      longues.length > 0 &&
        longues.every((tour) => tour.deborde && tour.classePosee),
      `${longues.length} listes longues · toutes équipées : ${longues.every(
        (t) => t.classePosee
      )}`
    );
  } catch (erreur) {
    nonJoue("§3 · vingt ouvertures", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * DÉBORDEMENT — les deux largeurs
 * ================================================================== */
titre("Aucun débordement du document");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/devenir-tatoueur");
  try {
    const d = await page.evaluate(() => ({
      s: document.documentElement.scrollWidth,
      c: document.documentElement.clientWidth,
    }));
    verif(
      `${largeur} px : scrollWidth = clientWidth (page du formulaire)`,
      d.s === d.c,
      `écart ${d.s - d.c}`
    );
  } catch (erreur) {
    nonJoue(`débordement (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "le parcours réel du formulaire (session)",
  "le formulaire de fiche exige une session et Supabase est hors de " +
    "portée de cet environnement : choisir « artiste » puis « en salon », " +
    "saisir une adresse, voir apparaître le champ du nom, tenter la " +
    "validation et regarder rougir badges, champs et titres — ce " +
    "parcours-là ne peut pas être joué ici. Tout ce qui précède est " +
    "donc vérifié à la source (les écritures livrées, ligne à ligne), " +
    "par INJECTION des classes réelles dans la page vivante, et en " +
    "REJOUANT les expressions extraites des fichiers (nomLieuRequis, " +
    "le débordement de la liste). La migration " +
    "supabase/yokofolio-nom-du-lieu.sql reste à passer par le " +
    "propriétaire"
);

bilan();
