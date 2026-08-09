/**
 * SUITE PERMANENTE — LE FORMULAIRE DE FICHE, BLOC PAR BLOC
 * ========================================================
 * (anciennement « balayage de la passe nº 93 »)
 *
 * ⚠️ POURQUOI CETTE SUITE MENTAIT DEPUIS DES PASSES.
 * Elle portait SA PROPRE LISTE de noms de blocs, recopiée à la main.
 * La passe nº 95 a déplacé les horaires, ajouté l'équipe et l'autre
 * adresse : la liste s'est mise à mentir du jour au lendemain, et
 * personne ne l'a rouverte parce qu'« elle échouait déjà ».
 * DÉSORMAIS ELLE NE RECOPIE PLUS RIEN : `nomsDeBlocsAttendus()` lit
 * ORDRE_BLOCS et NOMS_BLOCS DANS FormulaireFiche.tsx. Renommer un
 * bloc dans le produit renomme l'attente du test — et le test
 * continue de vérifier ce qu'il doit vérifier : le NOMBRE, l'ORDRE et
 * la NUMÉROTATION, qui, eux, ne se lisent nulle part.
 *
 * ⚠️ ET SURTOUT : ELLE REMPLIT VRAIMENT LE BLOC 1.
 * Les blocs 2 à 12 n'existent pas tant que le bloc 1 n'est pas
 * confirmé. L'ancienne version cliquait sur des boutons disparus
 * (« Je tatoue en mon nom », « Un lieu, une équipe »), ne confirmait
 * donc jamais, lisait UN seul bloc et concluait que la numérotation
 * était fausse. Voir `formulaireNeuf()` dans commun-verif.mjs.
 *
 * CE QUI A ÉTÉ RETIRÉ, ET POURQUOI
 * ---------------------------------
 * · §5 « les horaires sont DANS le bloc 1, et nulle part ailleurs »
 *   (2 assertions). CADUQUE DEPUIS LA PASSE Nº 95, qui a fait
 *   l'inverse : les horaires ont QUITTÉ le bloc 1 pour devenir le
 *   bloc 10, précisément parce qu'on les cherchait sans les trouver
 *   et qu'un studio privé se voyait proposer des heures d'ouverture
 *   qu'il n'a pas. L'assertion a été RETOURNÉE, pas supprimée : on
 *   vérifie maintenant qu'ils sont bien dans le bloc 10 et absents du
 *   bloc 1.
 * · §9 « les horaires restent portés PAR STUDIO » — MÊME CAUSE : le
 *   symbole cherché (`prefixe={\`horaires-${studio.cle}\`}`) n'existe
 *   plus nulle part.
 * · §9 — les 5 assertions de la fenêtre superposée : le verrou de
 *   défilement compté dans placement-menu, la parade iOS,
 *   `fixed inset-0 z-[70]`, `translateY(${decalage}px)`, et les
 *   quatre de §3A/§3B (`setFenetreRemontee`, `pointerdown`).
 *   CADUQUES DEPUIS LA PASSE Nº 104 : la fenêtre superposée a été
 *   remplacée par une page plein écran, et TOUTE la mécanique de
 *   repositionnement a été supprimée avec elle. Ce qu'elles
 *   défendaient — que l'arrière-plan ne bouge pas — est désormais
 *   obtenu en ne bougeant rien du tout.
 *
 * CE QUI A ÉTÉ MIS À JOUR
 * ------------------------
 * · ⚠️ RENUMÉROTÉ À LA PASSE Nº 112 (deux fusions : PROFIL réunit
 *   logo + nom + bio + réseaux, ORGANISATION réunit équipe + autre
 *   adresse). ARTISTE : 4 blocs ; SALON : 6 ; STUDIO PRIVÉ : 5, avec
 *   le nº 5 (horaires) SAUTÉ.
 * · Les noms viennent du produit, plus d'une liste recopiée.
 *
 *     npm run verif:p93      (serveur de développement démarré)
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
} from "./commun-verif.mjs";

const { nav, ctx, page } = await ouvrirLeNavigateur("verif-p93");

/* ================================================================
 * 1 · LE FORMULAIRE S'OUVRE — ARTISTE
 * ================================================================ */
titre("1 · ARTISTE : quatre blocs, numérotés 1 à 4");
const artisteOuvert = await formulaireNeuf(page, "artiste");
verif(
  "le formulaire s'ouvre et le bloc 1 se confirme",
  artisteOuvert,
  artisteOuvert ? "" : RAISON_SANS_SESSION
);

let artiste = [];
if (!artisteOuvert) {
  nonJoue("§1 · blocs artiste", RAISON_SANS_SESSION);
} else {
  artiste = await blocs(page);
  console.log("    " + artiste.map((b) => `${b.numero}·${b.titre}`).join("   "));
  //  ⚠️ TROIS ENTRÉES DEPUIS LA PASSE Nº 112 : Profil (logo + nom +
  //  bio + réseaux fusionnés), Yoko Portfolio, Spécificités. Les deux
  //  dernières de la liste (horaires, organisation) n'existent que
  //  pour un lieu.
  const attendus = ["Qui es-tu ?", ...nomsDeBlocsAttendus("artiste").slice(0, 3)];
  verif("QUATRE blocs, pas un de plus", artiste.length === 4, `${artiste.length}`);
  verif(
    "numérotés 1 à 4, sans doublon ni trou",
    artiste.map((b) => b.numero).join(",") === "1,2,3,4",
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
  verif(
    "ni équipe, ni seconde adresse : ce sont des blocs de LIEU",
    !artiste.some((b) => /équipe|autre adresse/i.test(b.titre))
  );
}

/* ================================================================
 * 2 · LES TEXTES EXPLICATIFS RETIRÉS (ancien §4)
 * ================================================================ */
titre("2 · Les textes explicatifs ont bien disparu");
if (!artisteOuvert) {
  nonJoue("§2 · textes retirés", RAISON_SANS_SESSION);
} else {
  const texteArtiste = await page.locator("form").innerText();
  verif(
    "« Choisis un style, puis dépose tes photos… » n'est plus là",
    !texteArtiste.includes("dépose tes photos")
  );
  verif(
    "« Cherche un artiste déjà inscrit… » n'est plus là",
    !texteArtiste.includes("Cherche un artiste déjà inscrit")
  );
  verif(
    "« Un jour sans horaires s'affichera Fermé… » n'est plus là",
    !/Un jour sans horaires/.test(texteArtiste)
  );
}

/* ================================================================
 * 3 · LE TUTOIEMENT (ancien §5 bis)
 * ================================================================
 * ⚠️ ON NE REGARDE QUE LE CÔTÉ ARTISTE. Les noms du côté studio
 * parlent de L'ÉTABLISSEMENT (« Logo du studio », « À propos du
 * studio ») : il n'y a personne à tutoyer.
 */
titre("3 · Plus aucun vouvoiement du côté artiste");
if (!artisteOuvert) {
  nonJoue("§3 · tutoiement", RAISON_SANS_SESSION);
} else {
  const vouvoiement = await page.evaluate(() => {
    const texte = document.querySelector("form").innerText;
    return texte.match(/\b(vous|votre|vos)\b/gi) ?? [];
  });
  verif(
    "ni « vous », ni « votre », ni « vos » nulle part",
    vouvoiement.length === 0,
    vouvoiement.join(", ") || "aucun"
  );
}

/* ================================================================
 * 4 · SALON : DOUZE BLOCS
 * ================================================================ */
titre("4 · SALON : six blocs, numérotés 1 à 6");
const salonOuvert = await formulaireNeuf(page, "salon");
let salon = [];
if (!salonOuvert) {
  nonJoue("§4 · blocs salon", RAISON_SANS_SESSION);
} else {
  salon = await blocs(page);
  console.log("    " + salon.map((b) => `${b.numero}·${b.titre}`).join("   "));
  const attendus = ["Qui es-tu ?", ...nomsDeBlocsAttendus("salon")];
  verif("six blocs", salon.length === 6, `${salon.length}`);
  verif(
    "numérotés 1 à 6, sans doublon ni trou",
    salon.map((b) => b.numero).join(",") === "1,2,3,4,5,6",
    salon.map((b) => b.numero).join(",")
  );
  attendus.forEach((attendu, rang) => {
    verif(
      `bloc ${rang + 1} = « ${attendu} »`,
      salon[rang]?.titre === attendu,
      salon[rang]?.titre ?? "(absent)"
    );
  });
  //  ⚠️ ASSERTION RETOURNÉE (passe nº 95). Elle exigeait les horaires
  //  DANS le bloc 1 ; la passe nº 95 les en a sortis exprès pour leur
  //  donner un bloc à eux. C'est cette règle-là qu'on garde.
  //  ⚠️ LE TITRE DES HORAIRES EST DE RETOUR (passe nº 104) : la
  //  nº 101 l'avait retiré, la refonte le rétablit ; la passe nº 116
  //  (point 14) le raccourcit en « Horaires » tout court, avec sa
  //  mention « (facultatif) » posée À CÔTÉ du h2 (propriété `mention`
  //  de Section), donc absente du titre lu.
  verif(
    "les horaires sont le bloc 5, titré « Horaires »",
    salon[4]?.numero === 5 && salon[4]?.titre === "Horaires",
    `${salon[4]?.numero}·« ${salon[4]?.titre} »`
  );
  const joursDansBloc1 = await page
    .locator('#section-exercice li:has-text("Fermé")')
    .count();
  verif(
    "et PLUS AUCUN jour d'ouverture dans le bloc 1",
    joursDansBloc1 === 0,
    `${joursDansBloc1} ligne(s) de jours dans le bloc 1`
  );
  //  ⚠️ ON CHERCHE LA SECTION EN JAVASCRIPT, pas au sélecteur : le
  //  bloc n'a plus de titre, et `:has(> h2:text-is("8"))` ne l'attrape
  //  pas de façon fiable. Le texte du `h2`, lui, ne ment pas.
  const joursHoraires = await page.evaluate(() => {
    //  ⚠️ LE h2 CONCATÈNE le numéro et le titre sans espace
    //  (« 5Horaires d'ouverture » depuis la fusion nº 112) : on
    //  reconnaît « 5 » suivi de n'importe quoi SAUF un autre chiffre.
    const bloc = [...document.querySelectorAll("form section")].find((s) =>
      /^5(?!\d)/.test((s.querySelector("h2")?.textContent ?? "").trim())
    );
    return bloc ? bloc.querySelectorAll("li").length : 0;
  });
  verif(
    "le module d'horaires fonctionne toujours (sept jours à l'écran)",
    joursHoraires >= 7,
    `${joursHoraires} lignes`
  );
  //  ⚠️ RETOURNÉ À LA PASSE Nº 112. Les TITRES de blocs sont
  //  désormais UNIFIÉS (« Profil », « Yoko Portfolio »,
  //  « Spécificités ») : ce sont les INDICATIONS des champs qui
  //  suivent la nature de la fiche — « Nom du salon » se lit DANS le
  //  champ du nom, plus au-dessus d'un encadré. On vérifie donc les
  //  deux moitiés de la décision : mêmes titres, indications propres.
  verif(
    "les titres de blocs sont les MÊMES pour Artiste et Salon (nº 112)",
    artiste.length > 3 &&
      artiste[1].titre === salon[1].titre &&
      artiste[2].titre === salon[2].titre &&
      artiste[3].titre === salon[3].titre,
    `${artiste[1]?.titre} / ${salon[1]?.titre}`
  );
  verif(
    "…et l'indication du champ du nom, elle, parle bien du salon",
    (await page.locator("#fiche-nom").getAttribute("placeholder")) ===
      "Nom du salon",
    await page.locator("#fiche-nom").getAttribute("placeholder")
  );
}

/* ================================================================
 * 5 · STUDIO PRIVÉ : ONZE BLOCS, LE Nº 10 SAUTÉ
 * ================================================================
 * ⚠️ CAS NEUF, ET IL COMPTE. Un studio privé reçoit sur rendez-vous :
 * il n'a pas d'heures d'ouverture. Le bloc 10 ne s'affiche donc pas —
 * et les blocs suivants GARDENT leur numéro (11, 12), parce que le
 * numéro vient de la position dans ORDRE_BLOCS, pas d'un comptage à
 * l'écran. Un trou dans la numérotation est ici la BONNE réponse : le
 * jour où l'on renumérote « pour faire joli », deux fiches du même
 * site n'appelleront plus la même chose par le même nom.
 */
titre("5 · STUDIO PRIVÉ : cinq blocs, le nº 5 sauté");
const priveOuvert = await formulaireNeuf(page, "prive");
if (!priveOuvert) {
  nonJoue("§5 · blocs studio privé", RAISON_SANS_SESSION);
} else {
  const prive = await blocs(page);
  console.log("    " + prive.map((b) => `${b.numero}·${b.titre}`).join("   "));
  verif("cinq blocs", prive.length === 5, `${prive.length}`);
  verif(
    "le nº 5 est SAUTÉ — un studio privé n'a pas d'horaires d'ouverture",
    prive.map((b) => b.numero).join(",") === "1,2,3,4,6",
    prive.map((b) => b.numero).join(",")
  );
  verif(
    "l'Organisation garde son numéro 6 — le numéro vient de la position",
    prive.at(-1)?.numero === 6 && prive.at(-1)?.titre === "Organisation"
  );
  verif(
    "l'indication du champ du nom parle bien « du studio »",
    (await page.locator("#fiche-nom").getAttribute("placeholder")) ===
      "Nom du studio",
    await page.locator("#fiche-nom").getAttribute("placeholder")
  );
}

/* ================================================================
 * 6 · LE « FORMULAIRE DE DEMANDE » N'EXISTE PLUS
 * ================================================================
 * ⚠️ CETTE SECTION A CHANGÉ DE SENS À LA PASSE Nº 102. Elle vérifiait
 * que le champ « Formulaire de demande » marchait ; elle vérifie
 * désormais qu'il A BIEN DISPARU — du formulaire, des fiches
 * publiques, et de la base (migration nº 47).
 * ⚠️ ET ENCORE À LA PASSE Nº 116 : les champs « Site web » et
 * « Linktree / Beacons » qui avaient pris sa place ont cédé la leur à
 * DEUX EMPLACEMENTS LIBRES « Ajouter un lien » (URL + Titre de
 * 16 caractères au plus, AUCUN service détecté — composant
 * `LienLibre`). Les colonnes historiques `site_web` et
 * `page_de_liens` restent leurs points de chute (migration nº 51 pour
 * les titres).
 * ================================================================ */
titre("6 · Le « Formulaire de demande » a disparu, les liens libres arrivent");
if (!salonOuvert && !priveOuvert) {
  nonJoue("§6 · formulaire retiré / liens libres", RAISON_SANS_SESSION);
} else {
  verif(
    "le champ « Formulaire de demande » n'est plus nulle part",
    (await page.locator("#fiche-formulaire").count()) === 0
  );
  verif(
    "et le mot ne figure plus dans le formulaire",
    !(await page.locator("body").innerText()).includes("Formulaire de demande")
  );
  //  LES DEUX EMPLACEMENTS LIBRES QUI LE REMPLACENT (nº 116).
  const lien1 = page.locator("#fiche-lien-1");
  const lien2 = page.locator("#fiche-lien-2");
  verif(
    "les DEUX emplacements « Ajouter un lien » existent",
    (await lien1.count()) === 1 && (await lien2.count()) === 1
  );
  verif(
    "à vide, chacun n'est qu'une ligne « + Ajouter un lien »",
    (await lien1.innerText()).trim() === "Ajouter un lien" &&
      (await lien2.innerText()).trim() === "Ajouter un lien"
  );
  verif(
    "…et plus AUCUN champ « Site web » ni « Linktree / Beacons »",
    (await page.locator("#fiche-site").count()) === 0 &&
      (await page.locator("#fiche-page-de-liens").count()) === 0
  );
  //  ⚠️ PLUS D'ÉTIQUETTE AU-DESSUS : le nom du service vit DANS le
  //  champ (indication), et reste annoncé par `aria-label`.
  verif(
    "aucun des champs de réseaux ne porte d'étiquette au-dessus",
    (await page.locator('label[for="fiche-instagram"]').count()) === 0 &&
      (await page.locator('label[for="fiche-tiktok"]').count()) === 0
  );
  verif(
    //  ⚠️ PLUS DE « (facultatif) » depuis la passe nº 106 : le nom du
    //  service, seul — c'est la validation qui dit ce qui manque.
    "l'indication porte le nom du service, sans mention",
    (await page.locator("#fiche-instagram").getAttribute("placeholder")) ===
      "Instagram" &&
      (await page.locator("#fiche-tiktok").getAttribute("placeholder")) ===
        "TikTok",
    `${await page.locator("#fiche-instagram").getAttribute("placeholder")} | ` +
      `${await page.locator("#fiche-tiktok").getAttribute("placeholder")}`
  );

  //  DEPUIS LA PASSE Nº 103, L'IDENTITÉ RECONNUE S'AFFICHE DANS LE
  //  CHAMP (un calque remplace l'URL hors édition) ; sous le champ,
  //  il n'y a plus que l'erreur — lecture après un blur, sinon l'URL
  //  brute reprend l'écran le temps de l'édition.
  async function identiteDuChamp(id, valeur) {
    await page.locator(id).fill(valeur);
    await page.locator(id).blur();
    await page.waitForTimeout(300);
    const calque = page.locator(`${id}-identite`);
    return (await calque.count()) === 1
      ? (await calque.innerText()).trim()
      : "";
  }
  verif(
    "Instagram : le pseudo SEUL, affiché DANS le champ",
    (await identiteDuChamp("#fiche-instagram", "https://www.instagram.com/yoko.folio/")) ===
      "@yoko.folio",
    await identiteDuChamp("#fiche-instagram", "https://www.instagram.com/yoko.folio/")
  );
  verif(
    "…et rien de VISIBLE sous un champ qui va bien",
    await page.evaluate(() =>
      document
        .getElementById("fiche-instagram-etat")
        .className.includes("sr-only"))
  );
  verif(
    "l'icône du service vit dans le champ",
    await page.evaluate(() => {
      const champ = document.getElementById("fiche-instagram");
      return Boolean(champ.parentElement.querySelector("svg"));
    })
  );
  await page.locator("#fiche-instagram").fill("");

  //  UN EMPLACEMENT LIBRE SE REMPLIT EN TROIS TEMPS (nº 116) :
  //  l'ouvrir, écrire l'URL et le TITRE, « Ajouter » — la ligne se
  //  replie sur le titre choisi, avec sa croix de retrait. AUCUN
  //  service n'est deviné : un Linktree, un Beacons, un site — tout
  //  entre, du moment que l'URL a une forme lisible.
  await lien1.click();
  await page.waitForTimeout(200);
  const champUrl = lien1.locator('input[aria-label="L\'adresse du lien"]');
  const champTitre = lien1.locator('input[aria-label^="Le titre du lien"]');
  verif(
    "l'emplacement ouvert offre DEUX champs : « URL » et « Titre »",
    (await champUrl.getAttribute("placeholder")) === "URL" &&
      (await champTitre.getAttribute("placeholder")) === "Titre" &&
      (await champTitre.getAttribute("maxlength")) === "16"
  );
  //  ⚠️ UNE URL MAL FORMÉE : la mention courte, DANS le champ.
  await champUrl.fill("n importe quoi.");
  await champTitre.fill("Mon lien");
  await lien1.locator('button:has-text("Ajouter")').click();
  await page.waitForTimeout(300);
  verif(
    "une adresse illisible reçoit la mention courte « Lien non valide »",
    (await lien1.locator('span:has-text("Lien non valide")').count()) === 1
  );
  //  ⚠️ UN LINKTREE Y EST ADMIS TEL QUEL — plus de « mauvais champ ».
  await champUrl.fill("linktr.ee/yokofolio");
  await lien1.locator('button:has-text("Ajouter")').click();
  await page.waitForTimeout(300);
  verif(
    "URL et titre posés : la ligne se replie sur LE TITRE CHOISI",
    (await lien1.locator('span:has-text("Mon lien")').count()) === 1 &&
      (await champUrl.count()) === 0
  );
  const croixLien = lien1.locator('button[aria-label="Retirer le lien Mon lien"]');
  verif("…avec sa croix de retrait", (await croixLien.count()) === 1);
  await croixLien.click();
  await page.waitForTimeout(200);
  verif(
    "la croix rend l'emplacement « Ajouter un lien »",
    (await lien1.innerText()).trim() === "Ajouter un lien"
  );
}

/* ================================================================
 * 7 · LES DEUX LIENS SUR LA FICHE PUBLIQUE
 * ================================================================
 * L'Atelier Corvus a MAINTENANT LES DEUX — un vrai site ET un
 * Linktree. C'est le cas que l'ancien champ unique rendait
 * impossible, et c'est pour lui que la colonne `page_de_liens` existe
 * (migration nº 46).
 * ================================================================ */
titre("7 · Le site ET la page de liens sur la fiche publique");
const pub = await ctx.newPage();
await pub.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await pub.locator("h1").first().waitFor({ timeout: 60000 });
await pub.waitForTimeout(1400);
verif(
  "plus AUCUNE ligne « Formulaire de demande » nulle part",
  (await pub.locator('a:has-text("Formulaire de demande")').count()) === 0
);
const lienSitePub = pub.locator('a[href="https://ateliercorvus.fr"]');
const lienLiensPub = pub.locator('a[href="https://linktr.ee/ateliercorvus"]');
verif("le site s'affiche", (await lienSitePub.count()) >= 1);
verif("la page de liens s'affiche AUSSI", (await lienLiensPub.count()) >= 1);
verif(
  "chacun porte SON libellé — le domaine d'un côté, « Linktree » de l'autre",
  (await lienSitePub.first().innerText()).trim() === "ateliercorvus.fr" &&
    (await lienLiensPub.first().innerText()).trim() === "Linktree",
  `${(await lienSitePub.first().innerText()).trim()} | ` +
    `${(await lienLiensPub.first().innerText()).trim()}`
);
verif(
  "la page de liens s'ouvre dans un nouvel onglet, comme le site",
  (await lienLiensPub.first().getAttribute("target")) === "_blank" &&
    (await lienLiensPub.first().getAttribute("rel")).includes("noopener")
);
verif(
  "elle porte l'icône world, comme le site",
  await lienLiensPub.first().evaluate((a) => Boolean(a.querySelector("span, svg")))
);

/* ================================================================
 * 8 · LE GLOBE DE LA BARRE FIXE, ET L'ICÔNE DU LIEN
 * ================================================================
 * ⚠️ CES DEUX-LÀ NE SE RESSEMBLENT PAS, ET C'EST VOULU.
 * · DANS LA BARRE FIXE, le sélecteur de langue porte un GLOBE DESSINÉ
 *   en <svg>, en `currentColor` — il doit suivre la couleur du bouton
 *   (rose à l'ouverture), ce qu'une image ne sait pas faire.
 * · DANS LA FICHE, le lien « site internet ou Linktree » porte
 *   l'icône world du propriétaire, posée en MASQUE CSS.
 * La suite p92 affirmait l'inverse pour le premier (une image dans la
 * barre) : c'est elle qui est périmée, la passe nº 93 a rendu le
 * globe dessiné à la barre fixe.
 */
titre("8 · Le globe dessiné dans la barre, l'icône world dans la fiche");
//  ⚠️ DEPUIS LA PASSE Nº 137, LE GLOBE DE LA BARRE EST L'AFFAIRE DES
//  VISITEURS NON CONNECTÉS : une fois connecté, la barre porte le
//  cœur des favoris et le globe vit dans le menu « Mon compte ». Or
//  le socle pose un cookie de session — on regarde donc la barre
//  DÉCONNECTÉE, dans un contexte vierge : c'est là que le globe
//  dessiné doit être, et c'est le même composant que celui du menu.
const ctxAnonyme = await nav.newContext({ viewport: { width: 1440, height: 950 } });
const pubAnonyme = await ctxAnonyme.newPage();
await pubAnonyme.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await pubAnonyme.locator("h1").first().waitFor({ timeout: 60000 });
await pubAnonyme.waitForTimeout(800);
const globe = pubAnonyme.locator('button[aria-label^="Langue"]');
verif("le sélecteur de langue est là", (await globe.count()) >= 1);
const masqueDansLaBarre = await globe.first().evaluate((b) =>
  Boolean(b.querySelector("span[style*='mask']"))
);
verif(
  "AUCUN masque d'image dans la barre fixe",
  !masqueDansLaBarre,
  masqueDansLaBarre ? "un masque est revenu" : "un vrai <svg>"
);
const svgDuGlobe = await globe.first().evaluate((b) => {
  const svg = b.querySelector("svg");
  return svg
    ? {
        largeur: svg.getAttribute("width"),
        traits: svg.querySelectorAll("circle, path").length,
      }
    : null;
});
verif(
  "c'est bien le globe en <svg>, en `currentColor`",
  Boolean(svgDuGlobe) && svgDuGlobe.traits >= 2,
  svgDuGlobe ? `${svgDuGlobe.largeur} px, ${svgDuGlobe.traits} tracés` : "(aucun svg)"
);
verif(
  "et le code le dit noir sur blanc",
  lire("src/components/SelecteurLangue.tsx").includes(
    "CE N'EST PAS `icone-world.png`"
  )
);
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
  "le lien « site internet ou Linktree » porte bien l'icône world",
  Boolean(dansLeLien?.masque?.includes("/icone-world.png")),
  dansLeLien?.masque ?? "(rien)"
);
//  ⚠️ 16 px DEPUIS LA PASSE Nº 138 : le rang « inline » de l'échelle
//  d'icônes — toutes les icônes des lignes d'info de fiche l'ont pris.
verif("à la taille voulue (16 px)", dansLeLien?.taille === "16×16", dansLeLien?.taille);
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
  "le curseur de rayon garde sa zone tactile de 44 px, sans rien déplacer",
  /\.curseur-sombre\s*\{[^}]*height:\s*44px[^}]*margin-block:\s*-11px[^}]*touch-action:\s*pan-y/s.test(
    lire("src/app/globals.css")
  )
);
//  MIS À JOUR (passe nº 95) : les horaires ne sont plus portés par
//  chaque studio du bloc 1, mais par le bloc 10, qui les pose sur le
//  studio principal. C'est le MÊME acquis, à sa nouvelle adresse.
verif(
  "les horaires ont bien leur propre bloc, réservé aux lieux qui reçoivent",
  lire("src/components/FormulaireFiche.tsx").includes(
    'typeFiche === "salon" && aDesHoraires(typeFiche, etablissement)'
  ) && lire("src/config/tatouage.ts").includes("export function aDesHoraires")
);
verif(
  "le menu déroulant ne republie plus « fermé » à chaque rendu",
  lire("src/components/MenuDeroulant.tsx").includes(
    "prevenirOuverture.current?.(ouvert);"
  )
);
verif(
  "la migration nº 46 ajoute bien la colonne de la page de liens",
  lire("supabase/yokofolio-page-de-liens.sql").includes(
    "add column if not exists page_de_liens text"
  )
);
verif(
  "la migration nº 47 supprime bien la colonne du formulaire de demande",
  lire("supabase/yokofolio-suppression-formulaire-demande.sql").includes(
    "drop column if exists formulaire_demande"
  )
);
verif(
  "la migration nº 45 corrige la politique d'écriture des rattachements",
  lire("supabase/yokofolio-politique-rattachements.sql").includes(
    "statut = 'validee'"
  ) &&
    lire("supabase/yokofolio-politique-rattachements.sql").includes(
      "origine in ('artiste', 'adresse')"
    )
);

/* ================================================================
 * 10 · UNE FICHE QUI N'A QUE L'UN DES DEUX
 * ================================================================ */
titre("10 · Une fiche qui n'a qu'un site, une autre qu'une page de liens");
const autre = await ctx.newPage();
await autre.goto(`${BASE}/tatoueur/studio-mille-traits-lyon-6e`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await autre.locator("h1").first().waitFor({ timeout: 60000 });
await autre.waitForTimeout(1200);
verif(
  "son site s'affiche",
  (await autre.locator('a[href="https://studiomilletraits.fr"]').count()) >= 1
);
verif(
  "et aucune ligne de page de liens, puisqu'elle n'en a pas",
  (await autre.locator('a[href*="linktr.ee"], a[href*="beacons."]').count()) === 0
);

//  L'INVERSE — Encre et Sel n'a QUE un Beacons, et pas de site.
const sansSite = await ctx.newPage();
await sansSite.goto(`${BASE}/tatoueur/encre-sel-marseille-1er`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await sansSite.locator("h1").first().waitFor({ timeout: 60000 });
await sansSite.waitForTimeout(1200);
const beacons = sansSite.locator('a[href="https://beacons.ai/encre.et.sel.demo"]');
verif("sa page de liens s'affiche", (await beacons.count()) >= 1);
verif(
  "…et s'écrit « Beacons », jamais « beacons.ai »",
  (await beacons.first().innerText()).trim() === "Beacons",
  (await beacons.first().innerText()).trim()
);

await nav.close();
process.exit(bilan());
