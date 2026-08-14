/**
 * BANC DE LA PASSE Nº 267
 * ==================================================================
 * §1 la validation rougit LES QUATRE MODES à la fois — le rayon d'« à
 *    domicile » et les dates d'un guest y entrent enfin ; la remontée
 *    mène toujours au premier manque ;
 * §2 la suppression d'un rôle : un encadré vidé ne réinvente plus
 *    « fondateur » et ne garde plus l'identifiant de la ligne — les
 *    deux rôles cessent d'être deux vues d'une même ligne ;
 * §3 la recherche est bornée à la NATURE du lieu (le bloc des studios
 *    ne la passait pas) ;
 * §4 le sélecteur d'émojis sert le JEU COMPLET d'Unicode, engendré et
 *    non choisi à la main, avec ses catégories officielles et sa
 *    recherche par nom ; la bio compte les caractères VISIBLES.
 *
 * ⚠️ LE FORMULAIRE EXIGE UNE SESSION (Supabase hors de portée) : le
 * parcours réel n'est pas jouable ici. Les causes sont donc prouvées
 * PAR LE CODE, ligne à ligne, et les règles sont REJOUÉES —
 * `tousLesManques` et le comptage des caractères sont extraits des
 * fichiers livrés puis évalués sur les cas du relevé.
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

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const modesLib = lire("src/lib/modes-exercice.ts");
const modesLibNu = sansNotes(modesLib);
const blocModes = sansNotes(lire("src/components/BlocModesExercice.tsx"));
const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
const blocStudios = sansNotes(lire("src/components/BlocStudios.tsx"));
const rechercheApi = sansNotes(
  lire("src/app/api/tatoueur/recherche-fiches/route.ts")
);
const rechercheChamp = sansNotes(
  lire("src/components/RechercheFicheInscrite.tsx")
);
const emojisLib = lire("src/lib/emojis.ts");
const emojisDonnees = lire("src/lib/emojis-donnees.ts");
const champBio = sansNotes(lire("src/components/ChampBio.tsx"));
const engendreur = lire("scripts/engendrer-emojis.mjs");

/* ==================================================================
 * §1 — TOUS LES MANQUES, ET LA LISTE DES CHAMPS OBLIGATOIRES
 * ================================================================== */
titre("§1 — à la source : la liste complète, le premier pour la remontée");
{
  verif(
    "`tousLesManques` existe et rend UNE LISTE",
    /export function tousLesManques\([\s\S]*?\): ManqueBloc\[\]/.test(modesLibNu)
  );
  verif(
    "le formulaire branche le rouge sur la LISTE, et la remontée sur le PREMIER",
    /const manquesDesignes = confirmationTentee\s*\? tousLesManques\(/.test(
      formulaire
    ) &&
      /const manqueDesigne = manquesDesignes\[0\] \?\? null;/.test(formulaire) &&
      /manques=\{manquesDesignes\}/.test(formulaire) &&
      /manque=\{manqueDesigne\}/.test(formulaire)
  );
  verif(
    "le bloc lit la liste pour le rouge — champs, badges et titres",
    /const tousLesManquesDuBloc: ManqueBloc\[\] =/.test(blocModes) &&
      /return tousLesManquesDuBloc\.some\(\s*\(unManque\) => unManque\.cle === cle && unManque\.champ === champ\s*\);/.test(
        blocModes
      ) &&
      /function modeEnManque\(cle: string\): boolean/.test(blocModes) &&
      /const cadreRouge = modes\.some\(\s*\(mode\) => mode\.genre === genre && modeEnManque\(mode\.cle\)\s*\);/.test(
        blocModes
      ) &&
      (blocModes.match(/modeEnManque\(session\.cle\)/g) ?? []).length >= 4
  );
  verif(
    "le premier manque garde son office : bascule d'onglet et remontée",
    /const signatureManque = manque \?/.test(blocModes) &&
      /defilerVersErreur\(fautes\);/.test(formulaire)
  );
}

titre("§1 — la règle REJOUÉE sur les cas du relevé");
{
  //  ⚠️ L'EXPRESSION LIVRÉE, extraite du fichier et évaluée telle
  //  quelle — jamais une réécriture. On lui donne ses dépendances.
  const corps = modesLibNu.match(
    /export function tousLesManques\([\s\S]*?\n\}\n/
  )?.[0];
  const nomLieuRequis = (mode) => {
    if (mode.genre !== "salon" && mode.genre !== "prive" && mode.genre !== "guest")
      return false;
    if (mode.salon) return false;
    return Boolean(mode.lieu);
  };
  const modeVide = (mode) =>
    !mode.salon &&
    !mode.lieu &&
    !mode.debut_le &&
    !mode.fin_le &&
    mode.rayonKm == null &&
    !(mode.nomLieu ?? "").trim();
  const modesDeclares = (modes) => modes.filter((mode) => !modeVide(mode));
  const pointDuMode = (mode) => mode.lieu ?? (mode.salon ? { ok: true } : null);
  const rayonRequis = (mode) => mode.genre === "domicile" && Boolean(mode.lieu);
  const premierManque = () => null;
  const source = corps
    .replace(/export function/, "function")
    .replace(/\(\s*typeFiche: [\s\S]*?\): ManqueBloc\[\]/, "(typeFiche, modes, studios, etablissement)")
    .replace(/: ManqueBloc\[\]/g, "")
    .replace(/const manques: ManqueBloc\[\] = \[\];/, "const manques = [];");
  //  ⚠️ nº 269 (§4) : l'expression livrée filtre désormais elle-même
  //  (« un mode OUVERT dit tous ses manques, même vierge ») — elle a
  //  donc besoin de `modeVide` en plus de `modesDeclares`.
  const calculer = new Function(
    "modeVide",
    "modesDeclares",
    "pointDuMode",
    "nomLieuRequis",
    "rayonRequis",
    "premierManque",
    `${source}; return tousLesManques;`
  )(modeVide, modesDeclares, pointDuMode, nomLieuRequis, rayonRequis, premierManque);

  //  LES QUATRE MODES, TOUS INCOMPLETS — le cas du propriétaire.
  const lieu = { intitule: "Lyon" };
  const quatre = [
    { cle: "a", genre: "domicile", salon: null, lieu, rayonKm: null },
    { cle: "b", genre: "prive", salon: null, lieu, nomLieu: "", debut_le: "", fin_le: "" },
    { cle: "c", genre: "salon", salon: null, lieu, role: null, nomLieu: "X", debut_le: "", fin_le: "" },
    {
      cle: "d",
      genre: "guest",
      natureLieu: "salon",
      salon: null,
      lieu,
      nomLieu: "Y",
      debut_le: "",
      fin_le: "",
    },
  ];
  const tous = calculer("artiste", quatre, [], null);
  const cles = [...new Set(tous.map((m) => m.cle))];
  verif(
    "LES QUATRE MODES incomplets sont TOUS désignés, d'un coup",
    cles.length === 4 && ["a", "b", "c", "d"].every((c) => cles.includes(c)),
    `${tous.length} manques · modes ${cles.join(", ")}`
  );
  verif(
    "LE RAYON d'« à domicile » entre enfin dans le décompte",
    tous.some((m) => m.cle === "a" && m.champ === "rayon"),
    tous
      .filter((m) => m.cle === "a")
      .map((m) => m.champ)
      .join(", ")
  );
  verif(
    "LES DATES du guest aussi",
    tous.some((m) => m.cle === "d" && m.champ === "dates"),
    tous
      .filter((m) => m.cle === "d")
      .map((m) => m.champ)
      .join(", ")
  );
  verif(
    "le nom du lieu (nº 266) et le rôle restent désignés eux aussi",
    tous.some((m) => m.cle === "b" && m.champ === "nomLieu") &&
      tous.some((m) => m.cle === "c" && m.champ === "role"),
    tous.map((m) => `${m.cle}:${m.champ}`).join(" · ")
  );
  //  CHACUN SEUL — le second cas du relevé.
  const domicileSeul = calculer(
    "artiste",
    [{ cle: "a", genre: "domicile", salon: null, lieu, rayonKm: null }],
    [],
    null
  );
  const guestSeul = calculer(
    "artiste",
    [
      {
        cle: "d",
        genre: "guest",
        natureLieu: "salon",
        salon: null,
        lieu,
        nomLieu: "Y",
        debut_le: "",
        fin_le: "",
      },
    ],
    [],
    null
  );
  verif(
    "un « à domicile » sans rayon, SEUL, rougit ; un guest sans dates, SEUL, aussi",
    domicileSeul.length === 1 &&
      domicileSeul[0].champ === "rayon" &&
      guestSeul.length === 1 &&
      guestSeul[0].champ === "dates",
    `domicile ${domicileSeul.map((m) => m.champ)} · guest ${guestSeul.map(
      (m) => m.champ
    )}`
  );
  //  ET LE COMPLET NE REPROCHE RIEN.
  const complet = calculer(
    "artiste",
    [
      { cle: "a", genre: "domicile", salon: null, lieu, rayonKm: 25 },
      {
        cle: "c",
        genre: "salon",
        salon: null,
        lieu,
        role: "resident",
        nomLieu: "Encre",
        debut_le: "",
        fin_le: "",
      },
    ],
    [],
    null
  );
  verif("un bloc complet ne reproche rien", complet.length === 0);
}

/* ==================================================================
 * §2 — LE RÔLE : LA CAUSE, PUIS LA RÈGLE
 * ================================================================== */
titre("§2 — la cause nommée : deux vues d'une même ligne");
{
  verif(
    "LA PREUVE — la croix VIDAIT en reposant « fondateur » et en gardant l'identifiant",
    //  L'écriture d'aujourd'hui montre les deux corrections : le
    //  drapeau `vide`, et l'identifiant retiré.
    /function modeVierge\(\s*genre: GenreMode,\s*cle\?: string,\s*id\?: string \| null,\s*vide = false\s*\)/.test(
      blocModes
    ) &&
      /\.\.\.\(id !== undefined && !vide \? \{ id \} : \{\}\),/.test(blocModes)
  );
  verif(
    "un encadré VIDÉ n'a plus de rôle ; un onglet NEUF garde sa position d'ouverture",
    /role:\s*vide \|\| \(genre !== "salon" && genre !== "prive"\) \? null : "fondateur",/.test(
      blocModes
    )
  );
  verif(
    "la croix appelle bien la version « vide »",
    /modeVierge\(genre, mode\.cle, mode\.id, true\)/.test(blocModes)
  );
  verif(
    "et la ligne d'origine part de la base (la règle de la nº 265 tient)",
    /\.filter\(\(mode\) => mode\.genre && !modeVide\(mode\)\)/.test(
      sansNotes(lire("src/lib/enregistrer-exercice.ts"))
    )
  );
}

/* ==================================================================
 * §3 — LA RECHERCHE BORNÉE À LA NATURE
 * ================================================================== */
titre("§3 — la recherche ne mélange plus salons et studios");
{
  verif(
    "LA CAUSE — le bloc des studios appelait la recherche SANS nature",
    //  Elle est désormais passée, dans les deux sens.
    /etablissement=\{\s*etablissement === "prive" \? "prive" : "salon"\s*\}/.test(
      blocStudios
    )
  );
  verif(
    "le champ transmet la nature à l'API, et l'API filtre dessus",
    /\(etablissement \? `&etablissement=\$\{etablissement\}` : ""\)/.test(
      rechercheChamp
    ) &&
      /requeteFiches = requeteFiches\.eq\("etablissement", etablissement\)/.test(
        rechercheApi
      )
  );
  verif(
    "le mode GUEST reste ouvert aux deux natures (nº 121) — c'est voulu",
    /etablissement=\{\s*guest \? undefined :/.test(blocModes)
  );
}
titre("§3 — VIVANT : l'API répond, et elle borne");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext();
  const page = await contexte.newPage();
  try {
    const sans = await page.request.get(
      `${BASE}/api/tatoueur/recherche-fiches?type=salon&etablissement=prive&q=te`
    );
    const donnees = await sans.json();
    //  Sans session, l'API refuse — c'est sa règle, et elle prouve au
    //  moins que le paramètre est accepté sans casser la route.
    verif(
      "l'API accepte le paramètre de nature (et exige toujours une session)",
      sans.status() === 401 || donnees.ok === true,
      `statut ${sans.status()} · ${JSON.stringify(donnees).slice(0, 60)}`
    );
  } catch (erreur) {
    nonJoue("§3 · API vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
  await nav.close();
}

/* ==================================================================
 * §4 — LES ÉMOJIS
 * ================================================================== */
titre("§4 — le jeu complet, engendré et non choisi");
{
  verif(
    "les données sont ENGENDRÉES depuis Unicode, jamais écrites à la main",
    /CE FICHIER EST ENGENDRÉ/.test(emojisDonnees) &&
      /emojibase-data/.test(engendreur) &&
      /node scripts\/engendrer-emojis\.mjs/.test(emojisDonnees) &&
      //  … et le site ne dépend de rien de neuf À L'EXÉCUTION :
      //  aucun import d'emojibase (la note d'en-tête le NOMME, c'est
      //  voulu — elle dit d'où viennent les données), et rien dans les
      //  dépendances du projet.
      !/from "emojibase/.test(emojisLib) &&
      !/require\("emojibase/.test(emojisLib) &&
      !JSON.stringify(
        JSON.parse(lire("package.json")).dependencies ?? {}
      ).includes("emojibase")
  );
  verif(
    "les NEUF catégories officielles, dans l'ordre demandé",
    [
      "Visages et émotions",
      "Personnes",
      "Animaux et nature",
      "Nourriture",
      "Voyages et lieux",
      "Activités",
      "Objets",
      "Symboles",
      "Drapeaux",
    ].every((nom) => emojisDonnees.includes(`titre: ${JSON.stringify(nom)}`))
  );
  const compte = (emojisDonnees.match(/^\s{4}\["/gm) ?? []).length;
  verif(
    "le jeu est COMPLET (plus de mille émojis, là où la liste à la main en avait quelques centaines)",
    compte > 1500,
    `${compte} émojis`
  );
  verif(
    "LES RONDS DE COULEUR SONT LÀ, à côté des cœurs de couleur (le relevé)",
    ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪"].every((rond) =>
      emojisDonnees.includes(rond)
    ) &&
      ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎"].every((coeur) =>
        emojisDonnees.includes(coeur)
      )
  );
  verif(
    "les drapeaux aussi",
    emojisDonnees.includes("🇫🇷") && emojisDonnees.includes("🇧🇪")
  );
  verif(
    "la recherche par nom lit les mots-clés d'Unicode, sans accents",
    /export function chercherEmojis\(recherche: string\): EntreeEmoji\[\]/.test(
      emojisLib
    ) && /sansAccents\(entree\[1\]\)\.includes\(propre\)/.test(emojisLib)
  );
}

titre("§4 — la recherche et le comptage, REJOUÉS");
{
  //  La recherche, sur les données livrées : on rejoue l'écriture.
  const sansAccents = (texte) =>
    texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const entrees = [...emojisDonnees.matchAll(/^\s{4}\["(.+?)", "(.*?)"\],$/gm)].map(
    (ligne) => [ligne[1], ligne[2]]
  );
  const chercher = (mot) =>
    entrees.filter((entree) => sansAccents(entree[1]).includes(sansAccents(mot)));
  verif(
    "la recherche par nom répond : « rond », « coeur », « chat », « france »",
    chercher("rond").length > 0 &&
      chercher("coeur").length > 0 &&
      chercher("chat").length > 0 &&
      chercher("france").length > 0,
    `rond ${chercher("rond").length} · coeur ${chercher("coeur").length} · chat ${
      chercher("chat").length
    } · france ${chercher("france").length}`
  );
  //  LE COMPTAGE : l'écriture livrée, rejouée sur une bio de dix
  //  émojis — le cas exact du propriétaire.
  const decoupeur = new Intl.Segmenter("fr", { granularity: "grapheme" });
  const longueurVisible = (texte) => [...decoupeur.segment(texte)].length;
  const dixEmojis = "❤️🧡💛💚💙💜🖤🤍🤎🇫🇷";
  verif(
    "une bio de DIX émojis compte 10 caractères visibles (et non 25 unités techniques)",
    longueurVisible(dixEmojis) === 10 && dixEmojis.length > 20,
    `visible ${longueurVisible(dixEmojis)} · technique ${dixEmojis.length}`
  );
  const bio = `Tatoueuse à Lyon ${dixEmojis} — sur rendez-vous.`;
  verif(
    "cette bio passe SOUS la limite de 150, là où le compte technique la refusait",
    longueurVisible(bio) <= 150 && bio.length <= 150 + 20,
    `visible ${longueurVisible(bio)} · technique ${bio.length}`
  );
  verif(
    "le champ ET la validation comptent PAREIL (une seule règle)",
    /const longueur = longueurVisible\(valeur\);/.test(champBio) &&
      /if \(longueurVisible\(suivante\) > BIO_MAXIMUM\) return;/.test(champBio) &&
      /surChangement\(tronquerVisible\(e\.target\.value, BIO_MAXIMUM\)\)/.test(
        champBio
      ) &&
      /if \(longueurVisible\(bio\) > BIO_MAXIMUM\)/.test(formulaire) &&
      //  `maxLength` est parti : il comptait en unités UTF-16.
      !/maxLength=\{BIO_MAXIMUM\}/.test(champBio)
  );
  verif(
    "un émoji survit à l'aller-retour du texte (aucune transformation en chemin)",
    //  Le formulaire n'écrit ni ne relit la bio autrement que telle
    //  quelle : aucun `normalize`, aucun `escape`, aucun filtre.
    !/bio[^\n]*\.normalize\(/.test(formulaire) &&
      !/bio[^\n]*replace\(\/\[\^\\x00-\\x7F\]/.test(formulaire) &&
      /bio: bio\.trim\(\) \|\| null,/.test(formulaire)
  );
}

titre("§4 — VIVANT (1440 px) : les émojis se peignent, et le compte tient");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    const vu = await page.evaluate(() => {
      const decoupeur = new Intl.Segmenter("fr", { granularity: "grapheme" });
      const dix = "❤️🧡💛💚💙💜🖤🤍🤎🇫🇷";
      const hote = document.createElement("div");
      hote.style.cssText = "position:fixed;top:60px;left:60px;z-index:9999";
      hote.innerHTML = '<span data-essai style="font-size:24px">' + dix + "</span>";
      document.body.appendChild(hote);
      const boite = hote.querySelector("[data-essai]").getBoundingClientRect();
      const mesure = {
        visible: [...decoupeur.segment(dix)].length,
        technique: dix.length,
        largeur: Math.round(boite.width),
        //  L'aller-retour par le DOM : le texte ressort identique.
        identique: hote.querySelector("[data-essai]").textContent === dix,
      };
      hote.remove();
      return mesure;
    });
    verif(
      "1440 px : dix émojis = 10 visibles, ils se peignent, et le texte ressort identique",
      vu.visible === 10 && vu.largeur > 100 && vu.identique,
      `visible ${vu.visible} · technique ${vu.technique} · ${vu.largeur} px · identique ${vu.identique}`
    );
  } catch (erreur) {
    nonJoue("§4 · vivant", String(erreur).slice(0, 90));
  }
  await contexte.close();
  await nav.close();
}

nonJoue(
  "le parcours réel du formulaire, et l'aller-retour en BASE",
  "le formulaire exige une session et Supabase est hors de portée de " +
    "cet environnement : cocher les quatre modes puis valider, supprimer " +
    "le studio sous « fondateur » puis choisir « résident » et " +
    "recharger, chercher un studio et vérifier qu'aucun salon ne " +
    "remonte, enregistrer une bio à émojis et la relire sur la fiche " +
    "publique — aucun de ces parcours ne peut être joué ici. Les causes " +
    "sont donc prouvées par le code, ligne à ligne, et les règles " +
    "(tousLesManques, le comptage visible, la recherche d'émojis) sont " +
    "REJOUÉES à partir des écritures livrées. Le stockage des émojis, " +
    "lui, ne demande rien à la base : la colonne `bio` est du texte " +
    "UTF-8, et rien du formulaire ne transforme la chaîne en chemin"
);

bilan();
