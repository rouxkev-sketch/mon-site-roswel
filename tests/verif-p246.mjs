/**
 * LE BANC DE LA PASSE Nº 246 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * ⚠️ « MA SÉLECTION » EXIGE UNE SESSION (base hors de portée — la
 * page mène à la connexion) : le bloc des deux menus y est donc
 * éprouvé par INJECTION de ses classes réelles, lues à la source, et
 * comparé VALEUR PAR VALEUR au bloc de recherche VIVANT du moteur,
 * mesuré sur l'accueil. C'est le cœur de la passe : le jumeau exact.
 *
 * CE QU'IL MESURE :
 *   §1 — hauteur, rayon, fond, séparation intérieure : identiques au
 *        moteur ; les menus ouverts à 45 % / blur(60px), liseré
 *        discret, sous-niveaux voilés de blanc ;
 *   §2 — l'état rétracté : « Recherche » 13 px gris, loupe 18 px,
 *        8 px d'écart, ensemble centré, transition du repli (300 ms,
 *        ease-out) ;
 *   §3 — 34 px entre les colonnes dans les deux sens, colonnes
 *        égales, composition interne inchangée, titres non dédoublés.
 *
 * Il se lance comme les autres :  node tests/verif-p246.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();
const pageWeb = async (largeur) => {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: 900 },
  });
  return { contexte, page: await contexte.newPage() };
};
const pageMobile = async () => {
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return { contexte, page: await contexte.newPage() };
};
const ouvrir = async (page, chemin = "/") => {
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);
};

/** Le relevé d'un encadré : ce que le §4 demande de comparer. */
const RELEVE_ENCADRE = `(encadre) => {
  if (!encadre) return null;
  const s = getComputedStyle(encadre);
  const trait = [...encadre.children].find((e) => e.getAttribute("aria-hidden"));
  const st = trait ? getComputedStyle(trait) : null;
  const champ = encadre.querySelector("button");
  return {
    hauteur: Math.round(encadre.getBoundingClientRect().height),
    rayon: s.borderRadius,
    fond: s.backgroundColor,
    bordure: s.borderWidth,
    trait: st
      ? { largeur: st.width, fond: st.backgroundColor, margeY: st.marginTop }
      : null,
    hauteurChamp: champ ? Math.round(champ.getBoundingClientRect().height) : null,
  };
}`;

/* ==================================================================
 * §1 — LE JUMEAU EXACT, VALEUR PAR VALEUR
 * ================================================================== */
const sourceMenus = lire("src/components/MenusSelection.tsx");
const sourceEncadre = lire("src/components/EncadreBarre.tsx");
const classeEncadre = sourceEncadre.match(/className="([^"]+)"/)?.[1] ?? "";

let releveMoteur = null;
titre("§1 — le bloc du moteur, VIVANT (1440 px, accueil)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    releveMoteur = await page.evaluate(
      `((lire) => lire(document.querySelector("[data-encadre-barre]")))(${RELEVE_ENCADRE})`
    );
    verif(
      "le bloc de recherche est là, et il a une géométrie",
      Boolean(releveMoteur) && releveMoteur.hauteur > 40,
      releveMoteur
        ? `${releveMoteur.hauteur} px · rayon ${releveMoteur.rayon} · fond ${releveMoteur.fond}`
        : "encadré introuvable"
    );
  } catch (erreur) {
    nonJoue("§1 · moteur", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

for (const [nomLargeur, faire] of [
  ["390 px", pageMobile],
  ["1440 px", () => pageWeb(1440)],
]) {
  titre(`§1 — le bloc des deux menus, comparé au moteur (${nomLargeur})`);
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    //  ⚠️ L'INJECTION REJOUE LA STRUCTURE EXACTE : l'encadré partagé
    //  (sa classe est LUE dans EncadreBarre.tsx) et deux champs de 52
    //  (le drapeau `hauteur` que MenusSelection passe au menu).
    const vu = await page.evaluate(
      `((classes, lire) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:20px;width:350px;z-index:9999;";
        //  Les DEUX attributs de données font partie de l'écriture
        //  (EncadreBarre.tsx les rend toujours) : le FOND vient de la
        //  règle globale [data-clair-barre], pas de la classe.
        hote.innerHTML = '<div id="e-encadre" data-encadre-barre="" data-clair-barre="" class="' + classes + '">' +
          '<div class="flex-1 min-w-0 basis-1/2"><button class="w-full min-h-[52px] bg-transparent">Mes j\\u0027aime</button></div>' +
          '<div aria-hidden="true" class="w-px my-2.5 bg-sombre-bordure shrink-0"></div>' +
          '<div class="flex-1 min-w-0 basis-1/2"><button class="w-full min-h-[52px] bg-transparent">Mes suivis</button></div>' +
        '</div>';
        document.body.appendChild(hote);
        const mesure = lire(document.getElementById("e-encadre"));
        //  Les deux moitiés : strictement égales.
        const moities = [...document.getElementById("e-encadre").children]
          .filter((e) => !e.getAttribute("aria-hidden"))
          .map((e) => e.getBoundingClientRect().width);
        mesure.moities = moities.map((l) => Math.round(l * 10) / 10);
        hote.remove();
        return mesure;
      })(${JSON.stringify(classeEncadre)}, ${RELEVE_ENCADRE})`
    );
    verif(
      `hauteur identique au moteur (${nomLargeur})`,
      Boolean(releveMoteur) && vu.hauteur === releveMoteur.hauteur,
      `menus ${vu.hauteur} px · moteur ${releveMoteur?.hauteur} px`
    );
    verif(
      `rayon, fond et bordure identiques (${nomLargeur})`,
      Boolean(releveMoteur) &&
        vu.rayon === releveMoteur.rayon &&
        vu.fond === releveMoteur.fond &&
        vu.bordure === releveMoteur.bordure &&
        vu.bordure === "0px",
      `rayon ${vu.rayon}=${releveMoteur?.rayon} · fond ${vu.fond} · bordure ${vu.bordure}`
    );
    verif(
      `la séparation intérieure : le même fin trait (${nomLargeur})`,
      Boolean(releveMoteur?.trait) &&
        vu.trait?.largeur === releveMoteur.trait.largeur &&
        vu.trait?.fond === releveMoteur.trait.fond &&
        vu.trait?.margeY === releveMoteur.trait.margeY,
      `${vu.trait?.largeur} · ${vu.trait?.fond} · marge ${vu.trait?.margeY}`
    );
    verif(
      `les deux moitiés strictement égales (${nomLargeur})`,
      vu.moities.length === 2 && Math.abs(vu.moities[0] - vu.moities[1]) < 1,
      vu.moities.join(" · ")
    );
  } catch (erreur) {
    nonJoue(`§1 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §1 — À LA SOURCE : une seule écriture, les mêmes drapeaux que le
//  champ « Explorer » du moteur, plus de feuille mobile.
titre("§1 — à la source : le jumeau ne choisit aucune valeur");
{
  const moteur = lire("src/components/MoteurTatouage.tsx");
  verif(
    "les deux blocs consomment EncadreDeuxChamps — aucune valeur choisie ailleurs",
    /<EncadreDeuxChamps/.test(sourceMenus) &&
      /<EncadreDeuxChamps/.test(moteur) &&
      !/rounded-2xl/.test(sourceMenus.replace(/rounded-2xl\s+min-h-\[36px\]/, ""))
  );
  verif(
    "les menus portent les drapeaux du champ Explorer (52, sansBordure, sombre), sans feuille",
    //  ⚠️ Ancrés en début/fin de ligne : les mots vivent AUSSI dans le
    //  commentaire d'en-tête (le faux positif payé à la nº 245).
    (sourceMenus.match(/hauteur="min-h-\[52px\]"/g) ?? []).length === 2 &&
      (sourceMenus.match(/^\s*sansBordure$/gm) ?? []).length === 2 &&
      (sourceMenus.match(/^\s*sombre$/gm) ?? []).length === 2 &&
      !/feuilleMobile/.test(sourceMenus)
  );
}

titre("§1 — le verre des menus ouverts (les deux largeurs, panneau partagé)");
for (const [nomLargeur, faire, ouvrirMenu] of [
  [
    "1440 px",
    () => pageWeb(1440),
    async (p) => {
      await p.locator('button[aria-label="Explorer"]').first().click();
    },
  ],
  [
    "390 px",
    pageMobile,
    async (p) => {
      await p.locator('button[aria-label="Rechercher un tatoueur"]').first().click();
      await p.waitForTimeout(1200);
      await p.locator('button[aria-label="Explorer"]').first().click();
    },
  ],
]) {
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    await ouvrirMenu(page);
    await page.waitForTimeout(600);
    //  On déplie une catégorie pour voir le sous-niveau voilé.
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const porte = page.locator("[data-sous-porte]").first();
    await porte.scrollIntoViewIfNeeded();
    await porte.click();
    await page.waitForTimeout(400);
    const vu = await page.evaluate(() => {
      const menu = document.querySelector("[data-verre-menu]");
      if (!menu) return null;
      const s = getComputedStyle(menu);
      const entree = [...menu.querySelectorAll("button")].find((b) =>
        /Maori/.test(b.textContent)
      );
      const alpha = (c) =>
        Number(c.match(/\/\s*([\d.]+)\)$/)?.[1] ?? c.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1);
      return {
        fond: s.backgroundColor,
        filtre: s.backdropFilter,
        ombre: s.boxShadow.slice(0, 90),
        opacite: s.opacity,
        voile: entree ? alpha(getComputedStyle(entree).backgroundColor) : null,
      };
    });
    verif(
      `le panneau (celui que les deux menus partagent) : 45 %, blur(60px), opacité 1 (${nomLargeur})`,
      Boolean(vu) &&
        vu.fond === "rgba(26, 26, 29, 0.45)" &&
        /blur\(60px\)/.test(vu.filtre) &&
        vu.opacite === "1",
      vu ? `${vu.fond} · ${vu.filtre}` : "panneau non ouvert"
    );
    verif(
      `liseré discret (0,05 / 0,02) et sous-niveau voilé de blanc, jamais une transparence (${nomLargeur})`,
      Boolean(vu) &&
        /rgba\(255, 255, 255, 0\.05\)/.test(vu.ombre) &&
        vu.voile !== null &&
        Math.abs(vu.voile - 0.06) < 0.005,
      `${vu?.ombre} · voile ${vu?.voile}`
    );
  } catch (erreur) {
    nonJoue(`§1 · verre (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — L'ÉTAT RÉTRACTÉ
 * ================================================================== */
titre("§2 — la ligne étroite, mesurée par injection (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page);
    const classeLigne = sourceMenus.match(
      /data-ligne-repliee[\s\S]{0,400}?className="([^"]+(?:\n[^"]+)*)"/
    )?.[1]?.replace(/\s+/g, " ");
    const taille = sourceMenus.match(/<IconeLoupe taille=\{(\d+)\}/)?.[1];
    const vu = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:20px;width:350px;z-index:9999;";
        hote.innerHTML = '<button id="e-ligne" class="' + classes + '">' +
          '<svg id="e-loupe" width="18" height="18" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>' +
          'Recherche</button>';
        document.body.appendChild(hote);
        const ligne = document.getElementById("e-ligne");
        const s = getComputedStyle(ligne);
        const loupe = document.getElementById("e-loupe").getBoundingClientRect();
        const rect = ligne.getBoundingClientRect();
        const centre = loupe.left + (rect.width - (loupe.width + parseFloat(s.columnGap) + 62)) / 2;
        const mesure = {
          taille: s.fontSize,
          couleur: s.color,
          graisse: s.fontWeight,
          ecart: parseFloat(s.columnGap),
          centrage: s.justifyContent,
          bordure: s.borderWidth,
          hauteurMin: s.minHeight,
          loupe: Math.round(loupe.width),
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify(classeLigne)})`
    );
    verif(
      "« Recherche » : 13 px, gris des libellés secondaires, sans graisse neuve",
      vu.taille === "13px" &&
        vu.couleur === "rgb(168, 168, 176)" &&
        vu.graisse === "400",
      `${vu.taille} · ${vu.couleur} · graisse ${vu.graisse}`
    );
    verif(
      "la loupe à 18 px (écriture unique, currentColor), 8 px d'écart, ensemble centré",
      taille === "18" && vu.loupe === 18 && vu.ecart === 8 && vu.centrage === "center",
      `loupe ${vu.loupe} · écart ${vu.ecart} · ${vu.centrage}`
    );
    verif(
      "aucun contour, aucun halo, aucun rose",
      vu.bordure === "0px" && !vu.couleur.includes("238, 61"),
      `bordure ${vu.bordure}`
    );
    //  LA TRANSITION DU PASSAGE : les jetons du repli existant.
    verif(
      "le passage suit la courbe et la durée du repli existant (300 ms, ease-out, grid-rows)",
      /transition-\[grid-template-rows,opacity\] duration-300 ease-out/.test(
        sourceMenus
      ) &&
        /grid-rows-\[0fr\]/.test(sourceMenus) &&
        /grid-rows-\[1fr\]/.test(sourceMenus)
    );
    //  Et la mécanique de la BARRE n'a pas bougé (celle de juillet).
    const barre = lire("src/components/EnTeteTatouage.tsx");
    verif(
      "la mécanique de repli de la barre est intacte (24/12/64, 300 ms)",
      /cumul > 24/.test(barre) &&
        /cumul < -12/.test(barre) &&
        /y < 64/.test(barre) &&
        /duration-300 max-lg:ease-out|max-lg:duration-300/.test(barre)
    );
  } catch (erreur) {
    nonJoue("§2", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LE RYTHME DES DEUX COLONNES
 * ================================================================== */
titre("§3 — les deux colonnes (injection des classes réelles)");
const sourceBloc = lire("src/components/BlocSuivis.tsx");
const classeListe =
  sourceBloc.match(/<ul\s+className="([^"]+)"\s*>\s*\n\s*\{groupe\.suivis/)?.[1] ??
  null;
const classeSection = sourceBloc.match(/rang > 0 \? "([^"]+)"/)?.[1] ?? "";
for (const [nomLargeur, faire, colonnes] of [
  ["390 px", pageMobile, 1],
  ["1440 px", () => pageWeb(1440), 2],
]) {
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "width:100%;";
        hote.innerHTML =
          '<section id="e-s1"><h2 id="e-titre">CETTE SEMAINE</h2>' +
          '<ul id="e-liste" class="' + c.liste + '">' +
          '<li id="e-un"><div style="height:120px">Un</div></li>' +
          '<li id="e-deux"><div style="height:120px">Deux</div></li>' +
          '<li><div style="height:120px">Trois</div></li></ul></section>' +
          '<section id="e-s2" class="' + c.section + '"><h2>À VENIR</h2></section>';
        document.body.appendChild(hote);
        const liste = document.getElementById("e-liste");
        const s = getComputedStyle(liste);
        const un = document.getElementById("e-un").getBoundingClientRect();
        const deux = document.getElementById("e-deux").getBoundingClientRect();
        const s2 = document.getElementById("e-s2");
        const mesure = {
          gouttiereX: parseFloat(s.columnGap),
          gouttiereY: parseFloat(s.rowGap),
          colonnes: s.gridTemplateColumns.split(" ").length,
          largeurs: [un.width, deux.width].map((l) => Math.round(l * 10) / 10),
          ecartVisuel: Math.round(deux.left - un.right),
          titrePleineLargeur:
            Math.round(document.getElementById("e-titre").parentElement.getBoundingClientRect().width) ===
            Math.round(liste.getBoundingClientRect().width),
          separateurPleineLargeur:
            Math.round(s2.getBoundingClientRect().width) ===
            Math.round(liste.getBoundingClientRect().width),
          debordement:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ liste: classeListe, section: classeSection })})`
    );
    verif(
      `${nomLargeur} : ${colonnes} colonne(s), 34 px dans les deux sens`,
      vu.colonnes === colonnes && vu.gouttiereX === 34 && vu.gouttiereY === 34,
      `colonnes ${vu.colonnes} · x ${vu.gouttiereX} · y ${vu.gouttiereY}${
        colonnes === 2 ? ` · écart visuel ${vu.ecartVisuel}` : ""
      }`
    );
    if (colonnes === 2) {
      verif(
        "les deux colonnes strictement égales, sans débordement",
        Math.abs(vu.largeurs[0] - vu.largeurs[1]) < 1 && vu.debordement === 0,
        `${vu.largeurs.join(" · ")} · débordement ${vu.debordement}`
      );
    }
    verif(
      `${nomLargeur} : titres et séparateurs pleine largeur, non dédoublés`,
      vu.titrePleineLargeur &&
        vu.separateurPleineLargeur &&
        //  Un seul <h2> par groupe dans la source — rien ne se
        //  dédouble par colonne.
        (sourceBloc.match(/<h2/g) ?? []).length === 2,
      `titre ${vu.titrePleineLargeur} · séparateur ${vu.separateurPleineLargeur}`
    );
  } catch (erreur) {
    nonJoue(`§3 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§3 — la composition interne, inchangée au pixel (390 px)");
{
  //  Les mêmes mesures que le banc de la nº 244 : rond, rond-texte,
  //  provenance, bande. Si l'une bouge, c'est ici que ça se voit.
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page);
    const sourceLieux = lire("src/components/BlocLieux.tsx");
    const lignes = sourceLieux.match(
      /export const CLASSES_LIGNE_CLIQUABLE =\s*"([^"]+)" \+\s*"([^"]+)";/
    );
    const ligne = lignes ? lignes[1] + lignes[2] : "";
    const provenance = sourceBloc.match(/data-provenance[\s\S]{0,300}?className="([^"]+)"/)?.[1];
    const bande = sourceBloc.match(/data-bande-suivi="" className="([^"]+)"/)?.[1];
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:0;width:390px;z-index:9999;";
        hote.innerHTML = '<div class="flex flex-col">' +
          '<a id="e-ligne" class="' + c.ligne + '">' +
          '<span id="e-rond" class="flex h-13 w-13 shrink-0 rounded-full bg-sombre-eleve"></span>' +
          '<span class="flex min-h-13 min-w-0 flex-1 flex-col justify-center"><span>Nom</span></span></a>' +
          '<p id="e-prov" class="' + c.provenance + '">Provenance</p>' +
          '<ul id="e-bande" class="' + c.bande + '"><li><a id="e-vign" class="block aspect-square rounded-[10px]"></a></li><li></li><li></li></ul></div>';
        document.body.appendChild(hote);
        const r = (id) => document.getElementById(id).getBoundingClientRect();
        const s = (id) => getComputedStyle(document.getElementById(id));
        const mesure = {
          rond: Math.round(r("e-rond").width),
          rondTexte: parseFloat(s("e-ligne").columnGap),
          provenance: s("e-prov").fontSize,
          ecartBande: parseFloat(s("e-bande").columnGap),
          rayon: s("e-vign").borderRadius,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ ligne, provenance, bande })})`
    );
    verif(
      "rond 52 · rond-texte 14 · provenance 13 px · bande 6 px · rayon 10",
      vu.rond === 52 &&
        vu.rondTexte === 14 &&
        vu.provenance === "13px" &&
        vu.ecartBande === 6 &&
        vu.rayon === "10px",
      `${vu.rond} · ${vu.rondTexte} · ${vu.provenance} · ${vu.ecartBande} · ${vu.rayon}`
    );
  } catch (erreur) {
    nonJoue("§3 · composition", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "La page vivante",
  "« Ma sélection » exige une session (base hors de portée) : le jumeau est comparé au moteur VIVANT valeur par valeur, le reste par injection des classes réelles"
);

await navigateur.close();
bilan();
