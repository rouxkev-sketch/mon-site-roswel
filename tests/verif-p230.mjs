/**
 * LE BANC DE LA PASSE Nº 230 — UNE SEULE LARGEUR (1440 px),
 * plus la mesure du §3 à 390 px
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §5 :
 *   §1 — le délai entre la dernière frappe et la liste, MESURÉ ; la
 *        roue présente pendant l'attente ; la liste précédente
 *        conservée pendant le chargement ;
 *   §2 — les cinq libellés de styles, dans le moteur, les filtres et
 *        les badges ; aucune association perdue par la migration ;
 *        une ancienne adresse de critère qui redirige en 301 ;
 *   §3 — à 390 px, une fiche ouverte depuis une fiche est une PAGE et
 *        non une fenêtre, et le retour ramène à la précédente ;
 *   §4 — l'encadré de l'adresse s'arrête avant les horaires, et le
 *        chevron n'est pas dans le lien.
 *
 * Il se lance comme les autres :  node tests/verif-p230.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §2 — LES CINQ STYLES, À LA SOURCE ET DANS LA MIGRATION
 * ================================================================== */
titre("§2 — les cinq styles, à leur source unique");
{
  const config = lire("src/config/tatouage.ts");
  const attendus = [
    ['slug: "anime-manga", label: "Anime & Manga"', "Anime & Manga"],
    ['slug: "japonais", label: "Japonais · Irezumi"', "Japonais · Irezumi"],
    ['slug: "biomecanique", label: "Biomécanique"', "Biomécanique (scindé)"],
    ['slug: "organique", label: "Organique"', "Organique (neuf)"],
    ['slug: "cyber-tribal", label: "Cyber-tribal"', "Cyber-tribal (scindé)"],
    ['slug: "cyberpunk", label: "Cyberpunk"', "Cyberpunk (neuf)"],
  ];
  for (const [motif, nom] of attendus) {
    verif(`${nom} est au catalogue`, config.includes(motif));
  }
  //  ⚠️ ON NE LIT QUE LE CATALOGUE DES STYLES : le fichier porte
  //  d'autres familles de libellés (« Salon / Studio privé » est un
  //  TYPE DE FICHE, pas un style) — les viser toutes ferait échouer un
  //  contrôle qui ne parle pas d'elles.
  const catalogue =
    config.match(/export const STYLES_TATOUAGE = \[[\s\S]*?\] as const;/)?.[0] ?? "";
  verif(
    "plus aucun libellé de STYLE à barre oblique",
    catalogue !== "" && !/label: "[^"]*\s\/\s[^"]*"/.test(catalogue)
  );

  //  UNE SEULE SOURCE : aucun libellé de style écrit ailleurs.
  const ailleurs = [];
  for (const fichier of [
    "src/lib/tatoueurs-demo.ts",
    "src/components/MoteurTatouage.tsx",
    "src/components/ContenuFiche.tsx",
  ]) {
    let texte = "";
    try {
      texte = lire(fichier);
    } catch {
      continue;
    }
    if (/"(Blackwork|Trash Polka|Anime|Cyber-tribal|Biomécanique)"/.test(texte)) {
      ailleurs.push(fichier);
    }
  }
  verif(
    "aucune seconde liste de libellés dans le code",
    ailleurs.length === 0,
    ailleurs.join(", ")
  );

  //  LA MIGRATION : elle AJOUTE, elle ne remplace jamais un style
  //  scindé — c'est la garantie « aucune association perdue ».
  const sql = lire("supabase/yokofolio-renommer-et-scinder-styles.sql");
  verif(
    "la scission AJOUTE le nouveau style (jamais de remplacement)",
    /set styles = styles \|\| array\['organique'\]/.test(sql) &&
      /set styles = styles \|\| array\['cyberpunk'\]/.test(sql)
  );
  //  ⚠️ LES LIGNES DE COMMENTAIRE SONT ÉCARTÉES : la migration CITE
  //  son propre garde-fou juste au-dessus de lui — compter les deux
  //  ferait dire trois à un contrôle qui attend deux.
  const instructions = sql
    .split("\n")
    .filter((ligne) => !ligne.trimStart().startsWith("--"))
    .join("\n");
  verif(
    "elle ne peut pas créer de doublon si on la relance",
    (instructions.match(/and not styles @> array\['(organique|cyberpunk)'\]/g) ??
      []).length === 2
  );
  verif(
    "la faute de frappe est corrigée partout (catalogue, fiches, photos)",
    /suggestions_style[\s\S]*set slug = 'neo-realisme'/.test(sql) &&
      /array_replace\(styles, 'neo-reaalisme', 'neo-realisme'\)/.test(sql) &&
      /photos_tatoueur[\s\S]*set style = 'neo-realisme'/.test(sql)
  );
  verif(
    "elle compte les associations AVANT et APRÈS",
    (sql.match(/associations_totales/g) ?? []).length >= 2
  );

  //  LES FICHES DE DÉMONSTRATION suivent la même règle.
  const demo = lire("src/lib/tatoueurs-demo.ts");
  const paires = [
    ['"biomecanique",\n      "organique"', "biomécanique → organique"],
    ['"cyber-tribal",\n      "cyberpunk"', "cyber-tribal → cyberpunk"],
  ];
  for (const [motif, nom] of paires) {
    verif(`démonstration : ${nom}, les DEUX styles`, demo.includes(motif));
  }
}

titre("§2 — l'ancienne adresse redirige");
{
  const reponse = await fetch(`${BASE}/tatouage/neo-reaalisme/lyon`, {
    redirect: "manual",
  }).catch(() => null);
  if (!reponse) {
    nonJoue("§2 · redirection", "le site n'a pas répondu");
  } else {
    verif(
      "301 définitif de neo-reaalisme vers neo-realisme",
      reponse.status === 301 &&
        (reponse.headers.get("location") ?? "").endsWith(
          "/tatouage/neo-realisme/lyon"
        ),
      `${reponse.status} → ${reponse.headers.get("location")}`
    );
  }
}

/* ==================================================================
 * §1 — LES SUGGESTIONS : le délai, la roue, la liste conservée
 * ================================================================== */
titre("§1 — les suggestions d'adresse (1440 px)");
const contexteWeb = await navigateur.newContext({
  viewport: { width: 1440, height: 950 },
});
const web = await contexteWeb.newPage();
let accueil = false;
try {
  await web.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await web.waitForSelector("#moteur-tatouage-lieu", { timeout: 30000 });
  await web.waitForTimeout(3000);
  accueil = true;
} catch {
  accueil = false;
}

if (!accueil) {
  nonJoue("§1", "le moteur n'a pas répondu");
} else {
  const champ = web.locator("#moteur-tatouage-lieu");
  await champ.click();

  //  LA ROUE — présente PENDANT l'attente. On tape et on regarde tout
  //  de suite après la pause de frappe, avant que la liste n'arrive.
  await web.keyboard.type("bordeaux", { delay: 50 });
  const roueVue = await web
    .waitForFunction(
      () => Boolean(document.querySelector(".animate-spin")),
      null,
      { timeout: 3000 }
    )
    .then(() => true)
    .catch(() => false);
  verif("une roue tourne dans le champ pendant l'attente", roueVue);

  await web
    .waitForFunction(
      () => document.querySelectorAll('[role="option"]').length > 0,
      null,
      { timeout: 15000 }
    )
    .catch(() => {});
  const rouePartie = await web.evaluate(
    () => !document.querySelector(".animate-spin")
  );
  verif("elle disparaît dès que la liste arrive", rouePartie);

  //  LE DÉLAI, MESURÉ : dernière frappe → première suggestion.
  const delais = [];
  for (const mot of ["lyon", "paris", "nantes"]) {
    await champ.click();
    await web.keyboard.press("Control+A");
    await web.keyboard.press("Backspace");
    await web.waitForTimeout(400);
    await web.keyboard.type(mot, { delay: 50 });
    const depart = Date.now();
    const arrivee = await web
      .waitForFunction(
        () => document.querySelectorAll('[role="option"]').length > 0,
        null,
        { timeout: 15000 }
      )
      .then(() => Date.now() - depart)
      .catch(() => null);
    if (arrivee !== null) delais.push(arrivee);
  }
  if (delais.length === 0) {
    nonJoue("§1 · délai", "aucune liste n'est apparue");
  } else {
    const moyenne = Math.round(delais.reduce((a, b) => a + b, 0) / delais.length);
    verif(
      "la liste arrive en moins d'une demi-seconde après la frappe",
      moyenne < 500,
      `moyenne ${moyenne} ms (${delais.join(", ")} ms)`
    );
  }

  //  LA LISTE PRÉCÉDENTE RESTE PENDANT LE CHARGEMENT SUIVANT.
  //  ⚠️ ON ÉCHANTILLONNE PENDANT la demande (toutes les 25 ms) au lieu
  //  de regarder une fois après coup : une VRAIE réponse vide a le
  //  droit de vider la liste — ce qu'on interdit, c'est le vide
  //  PENDANT que la roue tourne.
  await champ.click();
  await web.keyboard.press("Control+A");
  await web.keyboard.press("Backspace");
  await web.keyboard.type("lyon", { delay: 50 });
  await web
    .waitForFunction(
      () => document.querySelectorAll('[role="option"]').length > 0,
      null,
      { timeout: 15000 }
    )
    .catch(() => {});
  const avant = await web.evaluate(
    () => document.querySelectorAll('[role="option"]').length
  );
  await web.keyboard.type(" 1", { delay: 50 });
  const pendant = await web.evaluate(async () => {
    const releves = [];
    for (let i = 0; i < 28; i += 1) {
      releves.push({
        roue: Boolean(document.querySelector(".animate-spin")),
        n: document.querySelectorAll('[role="option"]').length,
      });
      await new Promise((r) => setTimeout(r, 25));
    }
    return releves;
  });
  const videPendantLaRoue = pendant.some((r) => r.roue && r.n === 0);
  const roueObservee = pendant.some((r) => r.roue);
  const toujoursPleine = pendant.every((r) => r.n > 0);
  verif(
    "la liste précédente reste affichée pendant le chargement",
    avant > 0 && !videPendantLaRoue && (roueObservee || toujoursPleine),
    `${avant} suggestions au départ · roue vue : ${roueObservee}`
  );

  //  LE CACHE DU SERVEUR — lu à la source : ici le géocodeur est hors
  //  d'atteinte, la route ne peut donc jamais répondre « cache ».
  const route = lire("src/app/api/lieux/route.ts");
  verif(
    "la route garde ses réponses en mémoire vive",
    route.includes("const cache = new Map") &&
      /source: "cache"/.test(route)
  );
  verif(
    "et pose un Cache-Control sur la réponse",
    /"Cache-Control": "public, max-age=60, s-maxage=900"/.test(route)
  );
  const geo = lire("src/lib/geocodage/index.ts");
  verif(
    "temporisation de 250 ms, deux caractères minimum",
    /PAUSE_FRAPPE_MS = 250/.test(geo) && /SAISIE_MINIMUM = 2/.test(geo)
  );
  verif(
    "une demande en cours est abandonnée quand la suivante part",
    /enCours\?\.abort\(\)/.test(geo) && /new AbortController\(\)/.test(geo)
  );
}

/* ==================================================================
 * §4 — L'ENCADRÉ DE L'ADRESSE, ET LES HORAIRES DEHORS
 * ================================================================== */
titre("§4 — l'encadré de la ligne d'adresse");
{
  let fiche = false;
  try {
    await web.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await web.waitForSelector("main h1", { timeout: 30000 });
    await web.waitForTimeout(2000);
    fiche = true;
  } catch {
    fiche = false;
  }
  if (!fiche) {
    nonJoue("§4", "la fiche de démonstration n'a pas répondu");
  } else {
    const mesure = await web.evaluate(() => {
      const lien = document.querySelector('main a[href*="google.com/maps"]');
      const chevron = document.querySelector("main button[aria-expanded]");
      if (!lien || !chevron) return null;
      const membre = document.querySelector('main a[href^="/tatoueur/"]');
      const classes = (n) => (n ? n.className : "");
      return {
        //  LA MÊME PRÉSENTATION QUE LA LIGNE D'UN MEMBRE : on compare
        //  les classes qui la font, pas un dessin refait.
        memeEncadre:
          /rounded-xl/.test(classes(lien)) &&
          /-m-2 p-2/.test(classes(lien)) &&
          /hover:bg-white\/5/.test(classes(lien)) &&
          /active:bg-white\/10/.test(classes(lien)),
        memeQueMembre: membre
          ? /rounded-xl/.test(classes(membre)) &&
            /hover:bg-white\/5/.test(classes(membre))
          : null,
        //  LE CHEVRON EST DEHORS : le lien n'est pas son ancêtre.
        chevronDansLeLien: lien.contains(chevron),
        //  L'ENCADRÉ S'ARRÊTE AVANT LES HORAIRES.
        encadreAuDessus:
          lien.getBoundingClientRect().bottom <=
          chevron.getBoundingClientRect().top + 1,
      };
    });
    if (!mesure) {
      nonJoue("§4", "ni adresse cliquable ni volet d'horaires sur cette fiche");
    } else {
      verif(
        "la ligne d'adresse porte l'encadré des lignes d'équipe",
        mesure.memeEncadre
      );
      if (mesure.memeQueMembre !== null) {
        verif(
          "c'est LA MÊME présentation, pas une seconde",
          mesure.memeQueMembre
        );
      }
      verif(
        "le chevron des horaires n'est PAS dans le lien",
        !mesure.chevronDansLeLien
      );
      verif("l'encadré s'arrête avant les horaires", mesure.encadreAuDessus);

      //  ET L'APPUI SUR LE CHEVRON N'OUVRE PAS LE PLAN.
      const avant = web.url();
      await web.locator("main button[aria-expanded]").first().click();
      await web.waitForTimeout(400);
      verif(
        "appuyer sur le chevron ne déclenche jamais le lien de l'adresse",
        web.url() === avant &&
          (await web.locator("[data-verre-fenetre]").count()) === 0
      );
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §3 — À 390 px, UNE FICHE LIÉE EST UNE PAGE
 * ================================================================== */
titre("§3 — au doigt, une fiche liée est une PAGE (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  let servie = false;
  try {
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2000);
    servie = true;
  } catch {
    servie = false;
  }
  const membre = page.locator('main a[href^="/tatoueur/"]').first();
  if (!servie || (await membre.count()) === 0) {
    nonJoue(
      "§3",
      "aucune fiche de démonstration ne porte de lien vers une autre fiche"
    );
  } else {
    const departUrl = page.url();
    const nomDepart = await page.locator("main h1").first().textContent();
    //  On descend, pour que le retour ait une position à rendre.
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(400);
    //  ⚠️ LA POSITION DE DÉPART EST CELLE AU MOMENT DU CLIC : le banc
    //  fait défiler jusqu'au lien pour le toucher, exactement comme un
    //  doigt — c'est CETTE place que le retour doit rendre, pas celle
    //  d'avant le défilement.
    await membre.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const defilementDepart = await page.evaluate(() => Math.round(window.scrollY));
    await membre.click();
    await page.waitForTimeout(2500);

    const apres = await page.evaluate(() => ({
      url: location.pathname,
      fenetre: document.querySelectorAll('[role="dialog"]').length,
      titre: document.querySelector("main h1")?.textContent ?? "",
    }));
    verif(
      "l'adresse a changé pour celle de la fiche cliquée",
      apres.url.startsWith("/tatoueur/") && apres.url !== departUrl,
      apres.url
    );
    verif(
      "c'est une PAGE, pas une fenêtre superposée",
      apres.fenetre === 0,
      `${apres.fenetre} fenêtre(s)`
    );
    verif(
      "et c'est bien une autre fiche",
      apres.titre.trim() !== (nomDepart ?? "").trim(),
      `« ${nomDepart?.trim()} » → « ${apres.titre.trim()} »`
    );

    //  LE RETOUR — un cran, la fiche précédente, à sa position.
    await page.goBack();
    await page.waitForTimeout(2500);
    const retour = await page.evaluate(() => ({
      url: location.pathname,
      titre: document.querySelector("main h1")?.textContent ?? "",
      defilement: Math.round(window.scrollY),
    }));
    verif(
      "le retour ramène à la fiche de départ",
      retour.url === departUrl.replace(BASE, "") ||
        retour.titre.trim() === (nomDepart ?? "").trim(),
      `${retour.url} · « ${retour.titre.trim()} »`
    );
    verif(
      "à sa position de défilement (± 80 px)",
      Math.abs(retour.defilement - defilementDepart) <= 80,
      `${defilementDepart} → ${retour.defilement}`
    );
  }
  await contexte.close();
}

//  LA RÈGLE DE LARGEUR, À LA SOURCE : une seule écriture.
{
  const pile = lire("src/components/PileFiches.tsx");
  const bloc = lire("src/components/BlocLieux.tsx");
  verif(
    "la largeur qui décide vit dans PileFiches, en un seul endroit",
    /LARGEUR_FENETRE_SUPERPOSEE = 1024/.test(pile) &&
      /laLargeurVeutUneFenetre/.test(bloc)
  );
  verif(
    "elle est lue AU CLIC, jamais pendant le rendu",
    /if \(!laLargeurVeutUneFenetre\(\)\) return;/.test(bloc)
  );
}

await navigateur.close();
bilan();
