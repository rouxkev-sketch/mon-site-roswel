/**
 * SUITE PONCTUELLE — LA PASSE nº 92 (blocs, icône world, formulaire)
 * ==================================================================
 *
 * ⚠️⚠️ LIS CECI AVANT DE LA FAIRE TOURNER : ELLE FAIT DOUBLE EMPLOI.
 * ------------------------------------------------------------------
 * CETTE SUITE EST ENTIÈREMENT RECOUVERTE PAR verif-p93.mjs.
 * Elle a été écrite pour la passe nº 92 ; la passe nº 93 a repris le
 * MÊME fichier, ligne pour ligne, en a corrigé deux points, et l'a
 * enrichi. Ce qui reste ici de propre à p92 : RIEN. Chacune de ses
 * assertions se retrouve, à l'identique ou en mieux, dans p93.
 *
 * PIRE : SUR UN POINT, LES DEUX SE CONTREDISAIENT.
 * p92 exigeait que le sélecteur de langue de la barre fixe porte
 * l'image `/icone-world.png` en masque CSS. La passe nº 93 a fait
 * l'inverse — elle a RENDU le globe dessiné en <svg> à la barre fixe,
 * parce qu'une image en masque ne suit pas la couleur du bouton. Les
 * deux suites ne pouvaient donc plus passer en même temps : celle qui
 * disait vrai était forcément l'autre.
 * → LA SECTION §6 (icône world dans la barre) A ÉTÉ RETIRÉE.
 *   CADUQUE DEPUIS LA PASSE Nº 93, nommément.
 *
 * ➜ RECOMMANDATION : SUPPRIMER CE FICHIER. Elle n'est pas appliquée
 *   ici — c'est au propriétaire de trancher (voir
 *   tests/LISEZ-MOI-les-suites.md). En attendant, la suite est
 *   REMISE D'APLOMB et passe intégralement, pour qu'elle ne pourrisse
 *   pas une passe de plus.
 *
 * CE QUI A ÉTÉ MIS À JOUR POUR QU'ELLE PASSE
 * -------------------------------------------
 * · L'ouverture du formulaire : les boutons « Je tatoue en mon nom »
 *   et « Un lieu, une équipe » n'existent plus depuis la passe nº 95
 *   (trois cartes : Artiste · Salon · Studio privé). Le bloc 1 doit
 *   en outre être REMPLI avant de se confirmer — sans quoi aucun des
 *   blocs suivants n'existe. Voir `formulaireNeuf()`.
 * · Les listes de noms de blocs, recopiées à la main, sont remplacées
 *   par `nomsDeBlocsAttendus()`, qui les lit dans le produit.
 * · ARTISTE : 9 blocs (inchangé). STUDIO : 11 → 12 (passe nº 95 :
 *   horaires en 10, équipe en 11, autre adresse en 12).
 * · §9 « les acquis » : les 4 assertions qui lisaient la mécanique de
 *   la fenêtre superposée (`translateY(${decalage}px)`,
 *   `fixed inset-0 z-[70]`, le verrou de défilement compté dans
 *   placement-menu, la parade iOS) ont été RETIRÉES — CADUQUES DEPUIS
 *   LA PASSE Nº 104, qui a remplacé la fenêtre par une page plein
 *   écran et supprimé toute la mécanique avec elle.
 * · §9 « horaires portés PAR STUDIO » : RETIRÉE, passe nº 95 — le
 *   symbole cherché n'existe plus.
 *
 *     npm run verif:p92      (serveur de développement démarré)
 */

import {
  BASE,
  lire,
  verif,
  titre,
  nonJoue,
  bilan,
  ouvrirLeNavigateur,
  formulaireNeuf,
  blocs,
  nomsDeBlocsAttendus,
  RAISON_SANS_SESSION,
  //  ⚠️ LE SOCLE EST RESTÉ DANS tests/, D'OÙ LE `../` : cette suite a
  //  été rangée dans les archives à la passe nº 99, `commun-verif.mjs`
  //  non — il sert aux suites permanentes.
} from "../commun-verif.mjs";

const { nav, ctx, page } = await ouvrirLeNavigateur("verif-p92");

/* ================================================================
 * 1 · SESSION CONNECTÉE, FORMULAIRE RENDU
 * ================================================================ */
titre("1 · Session connectée, formulaire rendu");
const artisteOuvert = await formulaireNeuf(page, "artiste");
verif(
  "le formulaire de création est RENDU, et le bloc 1 se confirme",
  artisteOuvert,
  artisteOuvert ? "" : RAISON_SANS_SESSION
);

/* ================================================================
 * 2 · §5 — LES BLOCS D'UN ARTISTE : NEUF, NUMÉROTÉS 1 À 9
 * ================================================================ */
titre("2 · §5 — ARTISTE : neuf blocs, aucun doublon");
let artiste = [];
if (!artisteOuvert) {
  nonJoue("§5 · blocs artiste", RAISON_SANS_SESSION);
} else {
  artiste = await blocs(page);
  console.log("    " + artiste.map((b) => `${b.numero}·${b.titre}`).join("   "));
  const attendus = ["Qui es-tu ?", ...nomsDeBlocsAttendus("artiste").slice(0, 8)];
  verif("neuf blocs, pas un de plus", artiste.length === 9, `${artiste.length}`);
  verif(
    "numérotés 1 à 9, sans doublon",
    artiste.map((b) => b.numero).join(",") === "1,2,3,4,5,6,7,8,9",
    artiste.map((b) => b.numero).join(",")
  );
  attendus.forEach((attendu, rang) => {
    verif(
      `bloc ${rang + 1} = « ${attendu} »`,
      artiste[rang]?.titre === attendu,
      artiste[rang]?.titre ?? "(absent)"
    );
  });
  verif(
    "aucun bloc d'horaires chez un artiste",
    !artiste.some((b) => /horaires/i.test(b.titre))
  );
}

/* ================================================================
 * 3 · §4 — LES TEXTES EXPLICATIFS ONT DISPARU
 * ================================================================ */
titre("3 · §4 — les trois textes explicatifs ont disparu");
if (!artisteOuvert) {
  nonJoue("§4 · textes retirés", RAISON_SANS_SESSION);
} else {
  const texteArtiste = await page.locator("form").innerText();
  verif(
    "« Choisis un style, puis dépose tes photos… » n'est plus là",
    !texteArtiste.includes("dépose tes photos")
  );
}

/* ================================================================
 * 4 · §5 — LES BLOCS D'UN STUDIO
 * ================================================================ */
titre("4 · §5 — STUDIO : douze blocs");
const studioOuvert = await formulaireNeuf(page, "salon");
let studio = [];
if (!studioOuvert) {
  nonJoue("§5 · blocs studio", RAISON_SANS_SESSION);
} else {
  studio = await blocs(page);
  console.log("    " + studio.map((b) => `${b.numero}·${b.titre}`).join("   "));
  const attendus = ["Qui es-tu ?", ...nomsDeBlocsAttendus("salon")];
  //  MIS À JOUR (passe nº 95) : c'était « onze blocs (dix + les
  //  horaires) ». Les horaires sont devenus le bloc 10, l'équipe le
  //  11, l'autre adresse le 12.
  verif("douze blocs", studio.length === 12, `${studio.length}`);
  verif(
    "numérotés 1 à 12, sans doublon",
    studio.map((b) => b.numero).join(",") === "1,2,3,4,5,6,7,8,9,10,11,12",
    studio.map((b) => b.numero).join(",")
  );
  attendus.forEach((attendu, rang) => {
    verif(
      `bloc ${rang + 1} = « ${attendu} »`,
      studio[rang]?.titre === attendu,
      studio[rang]?.titre ?? "(absent)"
    );
  });
  verif(
    "LES NOMS CHANGENT bien entre Artiste et Studio",
    artiste.length > 4 &&
      artiste[1].titre !== studio[1].titre &&
      artiste[2].titre !== studio[2].titre &&
      artiste[4].titre !== studio[4].titre,
    `${artiste[2]?.titre} → ${studio[2]?.titre}`
  );
}

titre("5 · §4 — les deux autres textes (studio)");
if (!studioOuvert) {
  nonJoue("§4 · textes studio", RAISON_SANS_SESSION);
} else {
  const texteStudio = await page.locator("form").innerText();
  verif(
    "« Cherche un artiste déjà inscrit… » n'est plus là",
    !texteStudio.includes("Cherche un artiste déjà inscrit")
  );
  verif(
    "« Un jour sans horaires s'affichera « Fermé »… » n'est plus là",
    !/Un jour sans horaires/.test(texteStudio)
  );
  //  MIS À JOUR : le bloc s'appelait « Les horaires du studio » ; il
  //  s'appelle « Horaires d'ouverture » depuis la passe nº 95.
  const lignes = await page
    .locator('section:has-text("Horaires d\'ouverture") li')
    .count();
  verif(
    "le module d'horaires FONCTIONNE toujours (sept jours à l'écran)",
    lignes >= 7,
    `${lignes} lignes`
  );
}

/* ================================================================
 * 6 · §7 — LE CHAMP « FORMULAIRE DE DEMANDE »
 * ================================================================ */
titre("6 · §7 — le champ « Formulaire de demande »");
if (!studioOuvert) {
  nonJoue("§7 · formulaire de demande", RAISON_SANS_SESSION);
} else {
  const champForm = page.locator("#fiche-formulaire");
  verif("le champ existe", (await champForm.count()) === 1);
  verif(
    "il est annoncé « Formulaire de demande » et FACULTATIF",
    (await page.locator('label[for="fiche-formulaire"]').innerText())
      .toLowerCase()
      .includes("facultatif")
  );
  verif(
    "il est dans le bloc des réseaux et liens",
    await page.evaluate(() =>
      document
        .querySelector("#fiche-formulaire")
        .closest("section")
        .querySelector("h2")
        .textContent.includes("Réseaux & Liens")
    )
  );
  verif(
    "il est protégé du remplissage automatique comme les autres",
    await champForm.evaluate(
      (c) =>
        c.getAttribute("autocomplete") === "hors-carnet" &&
        c.hasAttribute("data-sans-remplissage") &&
        /^q[0-9a-z]{4,}$/.test(c.getAttribute("name") ?? "")
    )
  );
  await champForm.fill("pas une adresse du tout");
  await page.getByRole("button", { name: /Envoyer mon portfolio/ }).click();
  await page.waitForTimeout(1500);
  verif(
    "une adresse invalide est REFUSÉE, avec son message",
    (await page.locator("text=Cette adresse de formulaire").count()) > 0
  );
  await champForm.fill("forms.gle/abc123");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Envoyer mon portfolio/ }).click();
  await page.waitForTimeout(1500);
  verif(
    "une adresse valide ne bloque plus (sans même le https://)",
    (await page.locator("text=Cette adresse de formulaire").count()) === 0
  );
}

/* ================================================================
 * 7 · §7 — LE LIEN SUR LA FICHE PUBLIQUE
 * ================================================================ */
titre("7 · §7 — le lien sur la fiche publique");
const pub = await ctx.newPage();
await pub.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await pub.locator("h1").first().waitFor({ timeout: 60000 });
await pub.waitForTimeout(1400);
const lienForm = pub.locator('a:has-text("Formulaire de demande")');
verif("le lien s'affiche sur la fiche", (await lienForm.count()) >= 1);
verif(
  "il pointe sur l'adresse enregistrée",
  (await lienForm.first().getAttribute("href")) ===
    "https://forms.gle/ateliercorvus-demo",
  (await lienForm.first().getAttribute("href")) ?? "(aucune)"
);
verif(
  "il s'ouvre dans un nouvel onglet, comme les autres liens",
  (await lienForm.first().getAttribute("target")) === "_blank" &&
    (await lienForm.first().getAttribute("rel")).includes("noopener")
);
verif(
  "il porte son icône",
  await lienForm.first().evaluate((a) => Boolean(a.querySelector("svg")))
);

/* ================================================================
 * 8 · §6 — L'ICÔNE WORLD, CE QUI EN RESTE DE VRAI
 * ================================================================
 * ⚠️ LA MOITIÉ DE CETTE SECTION A ÉTÉ RETIRÉE — celle qui exigeait
 * `/icone-world.png` en masque dans LA BARRE FIXE (3 assertions :
 * le masque, sa couleur, sa taille de 55 %). CADUQUE DEPUIS LA PASSE
 * Nº 93, qui a rendu le globe DESSINÉ à la barre fixe : une image en
 * masque ne suit pas la couleur du bouton, et le bouton doit passer
 * au rose à l'ouverture. C'est verif-p93 §8 qui garde ce point-là,
 * dans le bon sens.
 * CE QUI RESTE VRAI, ET QU'ON GARDE : dans LA FICHE, le lien « site
 * internet ou Linktree » porte bien l'icône world du propriétaire.
 */
titre("8 · §6 — l'icône world, dans la fiche");
const lienSite = pub.locator('a[href="https://ateliercorvus.fr"]');
const dansLeLien = await lienSite.first().evaluate((a) => {
  const marque = a.querySelector("span[style]");
  if (!marque) return null;
  const style = getComputedStyle(marque);
  const boite = marque.getBoundingClientRect();
  return {
    masque: style.maskImage || style.webkitMaskImage,
    taille: `${Math.round(boite.width)}×${Math.round(boite.height)}`,
  };
});
verif(
  "le lien « site internet ou Linktree » porte l'icône world",
  Boolean(dansLeLien?.masque?.includes("/icone-world.png")),
  dansLeLien?.masque ?? "(rien)"
);
verif("à la taille d'avant (17 px)", dansLeLien?.taille === "17×17", dansLeLien?.taille);
verif(
  "plus aucune image site.png sur la fiche",
  (await pub.locator('img[src="/site.png"]').count()) === 0
);

/* ================================================================
 * 9 · LES ACQUIS QU'ON NE DOIT PAS AVOIR CASSÉS
 * ================================================================ */
titre("9 · Les acquis");
verif(
  "la neutralisation de l'autocomplétion est intacte",
  lire("src/lib/champs-sans-remplissage.ts").includes('"hors-carnet"') &&
    lire("src/app/globals.css").includes(
      "input[data-sans-remplissage]::-webkit-contacts-auto-fill-button"
    )
);
verif(
  "le curseur de rayon a bien sa zone tactile de 44 px, sans rien déplacer",
  /\.curseur-sombre\s*\{[^}]*height:\s*44px[^}]*margin-block:\s*-11px[^}]*touch-action:\s*pan-y/s.test(
    lire("src/app/globals.css")
  )
);
verif(
  "la migration nº 36 est un fichier À PART",
  lire("supabase/yokofolio-formulaire-demande.sql").includes(
    "add column if not exists formulaire_demande text"
  )
);

/* ================================================================
 * 10 · UNE FICHE SANS FORMULAIRE N'AFFICHE RIEN
 * ================================================================ */
titre("10 · Une fiche sans formulaire de demande");
const autre = await ctx.newPage();
await autre.goto(`${BASE}/tatoueur/studio-mille-traits-lyon-6e`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await autre.locator("h1").first().waitFor({ timeout: 60000 });
await autre.waitForTimeout(1200);
verif(
  "aucune ligne « Formulaire de demande » quand le champ est vide",
  (await autre.locator('a:has-text("Formulaire de demande")').count()) === 0
);
verif(
  "mais son site, lui, s'affiche toujours",
  (await autre.locator('a[href="https://studiomilletraits.fr"]').count()) >= 1
);

await nav.close();
process.exit(bilan());
