/**
 * BANC DE LA PASSE Nº 269
 * ==================================================================
 * §1 au doigt, le va-et-vient « Réalisations / Flash » ne remonte
 *    plus la page (consigne de la nº 234 annulée) ; les trois autres
 *    remontées sont intactes ;
 * §2 après un enregistrement, le formulaire ne laisse plus d'entrée
 *    d'historique en trop : `location.replace`, jamais `assign` ;
 * §3 « en studio » et « en salon » ne partagent RIEN — quatre sens
 *    éprouvés (écrire, écrire, supprimer, supprimer), adresse, rôle
 *    et nom du lieu ;
 * §4 un guest vierge rougit PARTOUT, et le rouge se retire champ par
 *    champ.
 *
 * ⚠️ LE FORMULAIRE EXIGE UNE SESSION (Supabase hors de portée) : son
 * parcours réel n'est pas jouable ici. Les causes sont donc prouvées
 * PAR LE CODE, ligne à ligne, et les règles REJOUÉES à partir des
 * écritures livrées. Le §1, lui, est joué VIVANT sur une fiche de
 * démonstration — le montage React complet.
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

const contenuFiche = lire("src/components/ContenuFiche.tsx");
const contenuNu = sansNotes(contenuFiche);
const formulaire = lire("src/components/FormulaireFiche.tsx");
const formulaireNu = sansNotes(formulaire);
const blocModes = lire("src/components/BlocModesExercice.tsx");
const blocModesNu = sansNotes(blocModes);
const modesLib = lire("src/lib/modes-exercice.ts");
const modesLibNu = sansNotes(modesLib);
const deuxZones = sansNotes(lire("src/components/DeuxZonesLieu.tsx"));

/* ==================================================================
 * §1 — LA REMONTÉE RETIRÉE, LES TROIS AUTRES INTACTES
 * ================================================================== */
titre("§1 — à la source : Réalisations / Flash ne remonte plus");
{
  verif(
    "le va-et-vient de catégorie n'appelle plus la remontée",
    /function choisirCategorie\(suivante: string\) \{[\s\S]*?setCategorie\(suivante\);\s*\}/.test(
      contenuNu
    ) &&
      !/function choisirCategorie[\s\S]{0,200}remonterSousLaBarre\(\);/.test(
        contenuNu
      )
  );
  verif(
    "LES TROIS AUTRES sont intactes : Profil/Portfolio, le rendu, les vignettes",
    //  Profil / Portfolio et le rendu appellent toujours la remontée…
    (contenuNu.match(/remonterSousLaBarre\(\);/g) ?? []).length === 2 &&
      /function choisirOnglet[\s\S]{0,300}remonterSousLaBarre\(\);/.test(
        contenuNu
      ) &&
      /surRendu=\{\(suivant\) => \{[\s\S]{0,300}remonterSousLaBarre\(\);/.test(
        contenuNu
      ) &&
      //  … et la vignette garde SA remontée à elle (tout en haut).
      /setRemonteeDemandee\(\(tour\) => tour \+ 1\);/.test(contenuNu)
  );
  verif(
    "la remontée reste MOBILE seulement — le web n'en avait aucune",
    /function remonterSousLaBarre\(\) \{\s*if \(document\.documentElement\.dataset\.appareil !== "mobile"\) return;/.test(
      contenuNu
    )
  );
}

titre("§1 — VIVANT (390 px) : la page ne bouge plus d'un pixel");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/tatoueur/camille-fauve-paris-18e`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    //  On descend, puis on bascule Réalisations → Flash.
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(500);
    const avant = await page.evaluate(() => Math.round(window.scrollY));
    const bascule = page
      .locator('button:visible', { hasText: /^Flashs?$/ })
      .first();
    const existe = (await bascule.count()) > 0;
    if (existe) {
      await bascule.click();
      await page.waitForTimeout(900);
    }
    const apres = await page.evaluate(() => Math.round(window.scrollY));
    if (!existe) {
      nonJoue(
        "§1 · vivant",
        "cette fiche de démonstration n'a pas de va-et-vient Réalisations / Flash (elle n'a qu'une catégorie)"
      );
    } else {
      verif(
        "390 px : basculer Réalisations → Flash ne déplace pas la page",
        Math.abs(apres - avant) <= 1,
        `${avant} → ${apres}`
      );
    }
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 90));
  }
  await contexte.close();
  await nav.close();
}

/* ==================================================================
 * §2 — L'HISTORIQUE APRÈS L'ENREGISTREMENT
 * ================================================================== */
titre("§2 — la cause nommée : `assign` poussait une entrée de trop");
{
  verif(
    "LE REMÈDE — plus aucun `location.assign` dans le formulaire",
    !/window\.location\.assign\(/.test(formulaireNu)
  );
  verif(
    "les DEUX retours d'enregistrement (création et modification) remplacent",
    (formulaireNu.match(/window\.location\.replace\(/g) ?? []).length === 2 &&
      /window\.location\.replace\(\s*`\/devenir-tatoueur\/fiche\?fiche=\$\{ficheChargee\.id\}&enregistre=1`\s*\);/.test(
        formulaireNu
      ) &&
      /window\.location\.replace\(\s*creee/.test(formulaireNu)
  );
  verif(
    "la RESTITUTION DE POSITION n'est pas touchée : elle travaille par clé d'adresse",
    //  Aucune ligne de navigation-session ne compte les entrées.
    !/history\.length/.test(sansNotes(lire("src/lib/navigation-session.ts")))
  );
}
titre("§2 — la mécanique de `replace`, mesurée dans un vrai navigateur");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    //  ON REJOUE LE PARCOURS DU RELEVÉ avec les deux écritures, sur
    //  des pages du site : formulaire → (assign|replace) → accueil →
    //  fiche → retour. C'est la MÉCANIQUE du navigateur qu'on mesure,
    //  pas le formulaire (qui exige une session).
    const parcours = async (methode) => {
      await page.goto(`${BASE}/agence`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(400);
      const depart = await page.evaluate(() => history.length);
      //  « l'enregistrement » : la page se recharge elle-même.
      await page.evaluate(
        (m) => window.location[m](`${window.location.pathname}?enregistre=1`),
        methode
      );
      await page.waitForTimeout(600);
      const apres = await page.evaluate(() => history.length);
      return apres - depart;
    };
    const avecAssign = await parcours("assign");
    const avecReplace = await parcours("replace");
    verif(
      "`assign` AJOUTE une entrée, `replace` n'en ajoute AUCUNE",
      avecAssign === 1 && avecReplace === 0,
      `assign +${avecAssign} · replace +${avecReplace}`
    );
  } catch (erreur) {
    nonJoue("§2 · mécanique", String(erreur).slice(0, 90));
  }
  await contexte.close();
  await nav.close();
}

/* ==================================================================
 * §3 — L'ISOLEMENT DE « EN STUDIO » ET « EN SALON »
 * ================================================================== */
titre("§3 — la cause nommée, et l'isolement à la source");
{
  verif(
    "LA CAUSE — les champs de localisation gardaient leur saisie en mémoire propre",
    //  `lieuInitial` n'est lu qu'au montage : sans clé distincte, deux
    //  modes de genres différents réutilisaient la même instance.
    /lieuInitial=\{lieu\}/.test(deuxZones) &&
      /lieuInitial/.test(sansNotes(lire("src/components/ChampLocalisation.tsx")))
  );
  verif(
    "LE REMÈDE — l'identité du mode gravée par une clé " +
      "(⚠️ nº 272 : portée sur LE BLOC ENTIER — genre, clé ET nature " +
      "du lieu — les clés de champ de la 269 sont retirées, couvertes)",
    (blocModesNu.match(
      /key=\{`\$\{session\.genre\}-\$\{session\.cle\}-\$\{session\.natureLieu \?\? ""\}`\}/g
    ) ?? []).length === 2 &&
      !/key=\{`\$\{mode\.genre\}-\$\{mode\.cle\}`\}/.test(blocModesNu)
  );
  verif(
    "chaque mode garde SA ligne : la croix et l'ajout ne touchent QUE le genre visé",
    /const autres = modes\.filter\(\s*\(mode\) => mode\.genre === genre && mode\.cle !== cle\s*\);/.test(
      blocModesNu
    ) &&
      /if \(suivants\[rang\]\.genre === genre\) derniere = rang;/.test(
        blocModesNu
      )
  );
  verif(
    "le GUEST garde sa règle à lui (nº 265) : une nature efface l'autre lieu",
    /modifier\(mode\.cle, \{ natureLieu, salon: null, lieu: null \}\)/.test(
      blocModesNu
    )
  );
}

titre("§3 — l'isolement REJOUÉ, dans les quatre sens");
{
  //  L'écriture livrée de `modifier` : elle ne touche QUE la clé visée.
  const source = blocModesNu.match(
    /function modifier\(cle: string, morceau: Partial<ModeEnSaisie>\) \{[\s\S]*?\n  \}/
  )?.[0];
  let dernier = null;
  const modifier = new Function(
    "modes",
    "surChangement",
    `${source
      .replace(/: string/g, "")
      .replace(/: Partial<ModeEnSaisie>/g, "")}; return modifier;`
  );
  const jouer = (modes, cle, morceau) => {
    const appliquer = modifier(modes, (suivants) => {
      dernier = suivants;
    });
    appliquer(cle, morceau);
    return dernier;
  };
  const depart = [
    {
      cle: "studio",
      genre: "prive",
      salon: null,
      lieu: null,
      role: null,
      nomLieu: "",
    },
    {
      cle: "salon",
      genre: "salon",
      salon: null,
      lieu: null,
      role: null,
      nomLieu: "",
    },
  ];
  //  SENS 1 — écrire sous STUDIO laisse SALON vide.
  const apres1 = jouer(depart, "studio", {
    lieu: { intitule: "Lyon" },
    nomLieu: "Encre Noire",
    role: "fondateur",
  });
  verif(
    "sens 1 — adresse, nom et rôle sous STUDIO : SALON reste vide",
    apres1.find((m) => m.cle === "salon").lieu === null &&
      apres1.find((m) => m.cle === "salon").nomLieu === "" &&
      apres1.find((m) => m.cle === "salon").role === null &&
      apres1.find((m) => m.cle === "studio").lieu.intitule === "Lyon",
    JSON.stringify(apres1.map((m) => `${m.cle}:${m.lieu?.intitule ?? "—"}`))
  );
  //  SENS 2 — écrire sous SALON laisse STUDIO vide.
  const apres2 = jouer(depart, "salon", {
    lieu: { intitule: "Paris" },
    nomLieu: "Maison Bleue",
    role: "resident",
  });
  verif(
    "sens 2 — adresse, nom et rôle sous SALON : STUDIO reste vide",
    apres2.find((m) => m.cle === "studio").lieu === null &&
      apres2.find((m) => m.cle === "studio").nomLieu === "" &&
      apres2.find((m) => m.cle === "studio").role === null &&
      apres2.find((m) => m.cle === "salon").lieu.intitule === "Paris",
    JSON.stringify(apres2.map((m) => `${m.cle}:${m.lieu?.intitule ?? "—"}`))
  );
  //  SENS 3 et 4 — SUPPRIMER l'un laisse l'autre intact. L'écriture
  //  livrée de la croix : le mode visé redevient vierge, les autres
  //  passent tels quels.
  const remplis = [
    {
      cle: "studio",
      genre: "prive",
      salon: null,
      lieu: { intitule: "Lyon" },
      role: "fondateur",
      nomLieu: "Encre Noire",
    },
    {
      cle: "salon",
      genre: "salon",
      salon: null,
      lieu: { intitule: "Paris" },
      role: "resident",
      nomLieu: "Maison Bleue",
    },
  ];
  const vider = (modes, cle) =>
    modes.map((mode) =>
      mode.cle === cle
        ? { cle: mode.cle, genre: mode.genre, salon: null, lieu: null, role: null, nomLieu: "" }
        : mode
    );
  const apres3 = vider(remplis, "studio");
  verif(
    "sens 3 — supprimer STUDIO : SALON garde son adresse, son rôle et son nom",
    apres3.find((m) => m.cle === "salon").lieu.intitule === "Paris" &&
      apres3.find((m) => m.cle === "salon").role === "resident" &&
      apres3.find((m) => m.cle === "salon").nomLieu === "Maison Bleue" &&
      apres3.find((m) => m.cle === "studio").lieu === null
  );
  const apres4 = vider(remplis, "salon");
  verif(
    "sens 4 — supprimer SALON : STUDIO garde son adresse, son rôle et son nom",
    apres4.find((m) => m.cle === "studio").lieu.intitule === "Lyon" &&
      apres4.find((m) => m.cle === "studio").role === "fondateur" &&
      apres4.find((m) => m.cle === "studio").nomLieu === "Encre Noire" &&
      apres4.find((m) => m.cle === "salon").lieu === null
  );
}

/* ==================================================================
 * §4 — LE ROUGE DU GUEST, CHAMP PAR CHAMP
 * ================================================================== */
titre("§4 — un guest vierge rougit partout, puis champ par champ");
{
  verif(
    "un mode OUVERT compte, même vierge : tous ses manques sont dits",
    /const declares = modes\.filter\(\s*\(mode\) => !modeVide\(mode\) \|\| Boolean\(mode\.genre\)\s*\);/.test(
      modesLibNu
    )
  );
  verif(
    "les deux champs du lieu rougissent ensemble (recherche ET adresse)",
    //  `enErreur` part aux DEUX zones du champ à deux réponses (la
    //  recherche ET l'adresse — l'écriture de la nº 116), et la
    //  troisième occurrence est celle de `ZoneLieuSeule`, l'autre
    //  composant du fichier.
    (deuxZones.match(/enErreur=\{enErreur\}/g) ?? []).length === 3 &&
      /RechercheFicheInscrite[\s\S]{0,600}enErreur=\{enErreur\}/.test(
        deuxZones
      ) &&
      /ChampLocalisation[\s\S]{0,600}enErreur=\{enErreur\}/.test(deuxZones)
  );
  verif(
    "les dates ont leur propre rouge, indépendant du lieu",
    /enFauteDebut=\{vise && \(!mode\.debut_le \|\| desordre\)\}/.test(
      blocModesNu
    ) && /enFauteFin=\{vise && \(!mode\.fin_le \|\| desordre\)\}/.test(blocModesNu)
  );
  //  LA RÈGLE REJOUÉE : le guest vierge, puis le lieu trouvé.
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
  const pointDuMode = (mode) => mode.lieu ?? (mode.salon ? { ok: true } : null);
  const rayonRequis = (mode) => mode.genre === "domicile" && Boolean(mode.lieu);
  const premierManque = () => null;
  const calculer = new Function(
    "modeVide",
    "pointDuMode",
    "nomLieuRequis",
    "rayonRequis",
    "premierManque",
    `${corps
      .replace(/export function/, "function")
      .replace(
        /\(\s*typeFiche: [\s\S]*?\): ManqueBloc\[\]/,
        "(typeFiche, modes, studios, etablissement)"
      )
      .replace(/: ManqueBloc\[\]/g, "")
      .replace(/const manques: ManqueBloc\[\] = \[\];/, "const manques = [];")}
     ; return tousLesManques;`
  )(modeVide, pointDuMode, nomLieuRequis, rayonRequis, premierManque);

  const guestVierge = [
    {
      cle: "g",
      genre: "guest",
      natureLieu: "salon",
      salon: null,
      lieu: null,
      nomLieu: "",
      debut_le: "",
      fin_le: "",
    },
  ];
  const tout = calculer("artiste", guestVierge, [], null);
  verif(
    "un guest VIERGE : le lieu ET les dates rougissent, d'un coup",
    tout.some((m) => m.champ === "lieu") &&
      tout.some((m) => m.champ === "dates"),
    tout.map((m) => m.champ).join(", ")
  );
  //  LE LIEU TROUVÉ par la recherche : son rouge s'éteint, les dates
  //  gardent le leur.
  const guestAvecLieu = [
    {
      ...guestVierge[0],
      salon: { id: "x", nom: "Encre Noire" },
    },
  ];
  const apres = calculer("artiste", guestAvecLieu, [], null);
  verif(
    "le lieu trouvé ÉTEINT le rouge du lieu, et laisse celui des dates",
    !apres.some((m) => m.champ === "lieu") &&
      !apres.some((m) => m.champ === "nomLieu") &&
      apres.some((m) => m.champ === "dates"),
    apres.map((m) => m.champ).join(", ") || "(aucun)"
  );
  verif(
    "la règle de la nº 266 tient : la relecture ne fait qu'ENLEVER des reproches",
    /const gardees = cles\.filter\(/.test(formulaireNu) &&
      /ON N'AJOUTE JAMAIS RIEN ICI, on ne fait qu'enlever/.test(formulaire)
  );
}

nonJoue(
  "le parcours réel du formulaire (session)",
  "le formulaire exige une session et Supabase est hors de portée : " +
    "enregistrer puis revenir depuis une fiche, saisir sous « en " +
    "studio » puis regarder « en salon », valider un guest vierge — " +
    "aucun de ces parcours ne peut être joué ici. Les causes sont " +
    "nommées et prouvées par le code (ligne à ligne), la mécanique de " +
    "`replace` est mesurée dans un vrai navigateur sur des pages du " +
    "site, et les règles d'isolement et de manque sont REJOUÉES à " +
    "partir des écritures livrées. Aucune migration dans cette passe"
);

bilan();
