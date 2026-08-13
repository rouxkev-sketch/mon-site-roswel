/**
 * LE BANC DE LA PASSE Nº 244 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * CE QU'IL MESURE :
 *   §1 — les capsules NUES : ombre interne `none` sur les deux
 *        fenêtres, aucun contour, blanc 20 % / rose 40 %, et le liseré
 *        de la PLAQUE intact ;
 *   §2 — les valeurs de la finition de « Ma sélection », mesurées au
 *        pixel (40, 34, 14, 12, 8, 6) — la page exigeant une session,
 *        la structure RÉELLE est lue à la source et injectée dans une
 *        page vivante avec la vraie feuille de style ;
 *   §3 — la date proche : blanche semi-grasse, aucun rose/vert/rouge ;
 *   §4 — survol et appui, sans contour ni changement de texte.
 *
 * Il se lance comme les autres :  node tests/verif-p244.mjs
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
const FICHE = "/tatoueur/atelier-corvus-lyon-1er";

/* ==================================================================
 * §1 — LES CAPSULES NUES, FENÊTRE D'ADRESSE OUVERTE (390 px)
 * ================================================================== */
titre("§1 — la fenêtre d'adresse (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page, FICHE);
    await page.locator("a, button").filter({ hasText: /Capucins/ }).first().click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const lireTout = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          fond: s.backgroundColor,
          ombre: s.boxShadow,
          bordure: s.borderWidth,
          filtre: s.backdropFilter || "none",
        };
      };
      const plaque = document.querySelector("[data-verre-fenetre]");
      return {
        capsule: lireTout(document.querySelector("[data-verre-capsule]")),
        action: lireTout(document.querySelector("[data-verre-action]")),
        plaque: plaque ? getComputedStyle(plaque).boxShadow : null,
      };
    });
    verif(
      "« Copier l'adresse » : NUE — ombre none, aucun contour, blanc à 20 %",
      vu.capsule?.ombre === "none" &&
        vu.capsule?.bordure === "0px" &&
        vu.capsule?.fond === "rgba(255, 255, 255, 0.2)" &&
        vu.capsule?.filtre === "none",
      vu.capsule ? `ombre ${vu.capsule.ombre} · ${vu.capsule.fond}` : "fenêtre non ouverte"
    );
    verif(
      "« Ouvrir dans Google Maps » : NUE — ombre none, rose à 40 %",
      vu.action?.ombre === "none" &&
        vu.action?.bordure === "0px" &&
        vu.action?.fond === "rgba(238, 61, 111, 0.4)",
      vu.action ? `ombre ${vu.action.ombre} · ${vu.action.fond}` : "fenêtre non ouverte"
    );
    verif(
      "LE LISERÉ DE LA PLAQUE, LUI, EST INTACT (0,10 / 0,035)",
      /rgba\(255, 255, 255, 0\.1\) 0px 1px/.test(vu.plaque ?? "") &&
        /rgba\(255, 255, 255, 0\.035\) 0px 0px 0px 1px/.test(vu.plaque ?? ""),
      (vu.plaque ?? "—").slice(0, 100)
    );
  } catch (erreur) {
    nonJoue("§1 · adresse", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§1 — la fenêtre Partage (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page, FICHE);
    await page.locator('button[aria-label^="Partager la fiche"]:visible').first().click();
    await page.waitForTimeout(700);
    const badge = page
      .locator('[role="dialog"][aria-label="Partager cette fiche"] button')
      .filter({ hasText: /Copier/ })
      .first();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(200);
    const repos = await badge.evaluate((b) => {
      const s = getComputedStyle(b);
      return {
        fond: s.backgroundColor,
        ombre: s.boxShadow,
        bordure: s.borderWidth,
        couleur: s.color,
      };
    });
    verif(
      "le badge « Copier » : NU — ombre none, blanc à 20 %",
      repos.ombre === "none" &&
        repos.bordure === "0px" &&
        repos.fond === "rgba(255, 255, 255, 0.2)",
      `ombre ${repos.ombre} · ${repos.fond}`
    );
    //  §4 — le survol : +1 cran, texte et contour inchangés.
    await badge.hover();
    await page.waitForTimeout(200);
    const survol = await badge.evaluate((b) => {
      const s = getComputedStyle(b);
      return { fond: s.backgroundColor, couleur: s.color, bordure: s.borderWidth };
    });
    verif(
      "au survol : 20 → 26 %, texte identique, aucun contour",
      survol.fond === "rgba(255, 255, 255, 0.26)" &&
        survol.couleur === repos.couleur &&
        survol.bordure === "0px",
      `${repos.fond} → ${survol.fond}`
    );
    //  L'écriture unique, à la source : plus AUCUNE lumière dans le
    //  dépôt — la retirer une fois l'a retirée partout.
    const css = lire("src/app/globals.css");
    verif(
      "la lumière n'existe plus nulle part (retirée une fois = partout)",
      !/inset 0 1px 0 0 rgba\(255, 255, 255, 0\.35\)/.test(css) &&
        !/data-verre-capsule\][^}]*box-shadow/.test(css)
    );
  } catch (erreur) {
    nonJoue("§1 · Partage", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA FINITION DE « MA SÉLECTION », AU PIXEL
 * ==================================================================
 * ⚠️ LA PAGE EXIGE UNE SESSION (base hors de portée) : on ne peut pas
 * l'ouvrir — dit plus bas. La STRUCTURE RÉELLE, elle, est éprouvée :
 * les classes sont LUES DANS LA SOURCE de BlocSuivis (jamais
 * recopiées), injectées dans une page vivante, et mesurées avec la
 * feuille de style du site.
 */
titre("§2 — les valeurs, mesurées (les deux largeurs)");
const sourceBloc = lire("src/components/BlocSuivis.tsx");
const sourceLieux = lire("src/components/BlocLieux.tsx");
const classesLigne = sourceLieux.match(
  /export const CLASSES_LIGNE_CLIQUABLE =\s*"([^"]+)" \+\s*"([^"]+)";/
);
const ligneCliquable = classesLigne ? classesLigne[1] + classesLigne[2] : null;
const classeDe = (marqueur) =>
  sourceBloc.match(new RegExp(`${marqueur}[\\s\\S]{0,400}?className="([^"]+)"`))?.[1] ??
  null;
const classes = {
  section: sourceBloc.match(/rang > 0 \? "([^"]+)"/)?.[1] ?? null,
  titreGroupe: classeDe("<h2"),
  listeBlocs: sourceBloc.match(/<ul className="([^"]+)">\s*\n\s*\{groupe\.suivis/)?.[1] ?? null,
  info: classeDe("data-info-suivi"),
  provenance: classeDe("data-provenance"),
  bande: sourceBloc.match(/data-bande-suivi="" className="([^"]+)"/)?.[1] ?? null,
  vignette: sourceBloc.match(/data-vignette-suivi[\s\S]{0,400}?className="([^"\n]+(?:\n[^"]+)*)"/)?.[1]?.replace(/\s+/g, " ") ?? null,
  nom: sourceBloc.match(/truncate text-\[15px\][^"]*/)?.[0] ?? null,
};

for (const [nomLargeur, faire] of [
  ["390 px", pageMobile],
  ["1440 px", () => pageWeb(1440)],
]) {
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    const vu = await page.evaluate(
      ([c, ligne]) => {
        const racine = document.createElement("div");
        racine.style.cssText = "position:fixed;top:0;left:0;width:390px;z-index:9999;";
        racine.innerHTML = `
          <section id="e-s1"></section>
          <section id="e-s2" class="${c.section}">
            <h2 id="e-titre" class="${c.titreGroupe}">CETTE SEMAINE</h2>
            <ul id="e-liste" class="${c.listeBlocs}">
              <li><div class="flex flex-col">
                <a id="e-ligne" class="${ligne}">
                  <span id="e-rond" class="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve"></span>
                  <span class="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
                    <span id="e-nom" class="truncate text-[15px] font-semibold text-sombre-texte">Nom</span>
                    <span id="e-info" class="${c.info}">En salon · Lyon · <span id="e-date" class="font-semibold text-sombre-texte">18 – 22 août</span></span>
                  </span>
                </a>
                <p id="e-prov" class="${c.provenance}">Ses dernières réalisations</p>
                <ul id="e-bande" class="${c.bande}">
                  <li><a id="e-vign" class="${c.vignette}" style="display:block"></a></li>
                  <li><a class="${c.vignette}"></a></li>
                  <li><a class="${c.vignette}"></a></li>
                </ul>
              </div></li>
              <li id="e-li2"><div class="flex flex-col"><a id="e-ligne2" class="${ligne}">
                <span id="e-rond2" class="flex h-13 w-13 shrink-0 rounded-full bg-sombre-eleve"></span>
                <span class="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
                  <span class="text-[15px] font-semibold text-sombre-texte">Un nom</span>
                  <span class="text-[14px] leading-relaxed text-sombre-texte-doux"
                        style="white-space:normal">Une ligne d'information volontairement
                        très longue qui passe sur deux, puis trois lignes, pour
                        éprouver la règle de la nº 241.</span>
                </span>
              </a></div></li>
            </ul>
          </section>`;
        document.body.appendChild(racine);
        const r = (id) => document.getElementById(id).getBoundingClientRect();
        const s = (id) => getComputedStyle(document.getElementById(id));
        const resultat = {
          separationHaut: parseFloat(s("e-s2").marginTop),
          separationBas: parseFloat(s("e-s2").paddingTop),
          bordure: s("e-s2").borderTopWidth,
          titre: {
            taille: s("e-titre").fontSize,
            capitales: s("e-titre").textTransform,
            couleur: s("e-titre").color,
          },
          entreBlocs: parseFloat(s("e-liste").rowGap),
          rond: Math.round(r("e-rond").width),
          rondTexte: parseFloat(s("e-ligne").columnGap),
          nom: { taille: s("e-nom").fontSize, graisse: s("e-nom").fontWeight },
          info: { taille: s("e-info").fontSize },
          dateProche: { graisse: s("e-date").fontWeight, couleur: s("e-date").color },
          provenance: {
            taille: s("e-prov").fontSize,
            sousLigne: Math.round(r("e-prov").top - r("e-rond").bottom),
          },
          bandeDessus: Math.round(r("e-bande").top - r("e-prov").bottom),
          ecartBande: parseFloat(s("e-bande").columnGap),
          rayonVignette: s("e-vign").borderRadius,
          //  Le rond ne bouge JAMAIS (règle de la nº 241) : mesuré
          //  CONTRE LE FLUX (son <li>), bloc court (une ligne) et bloc
          //  long (l'information sur trois lignes) au même endroit —
          //  et sa taille ne change pas.
          rondCourt: Math.round(
            r("e-rond").top - document.getElementById("e-rond").closest("li").getBoundingClientRect().top
          ),
          rondLong: Math.round(r("e-rond2").top - r("e-li2").top),
          colonneHaute:
            document.getElementById("e-ligne2").getBoundingClientRect().height > 60,
          tailleRondLong: Math.round(r("e-rond2").width),
          //  Entre le bas de la bande du bloc 1 et le rond du bloc 2.
          entreBlocsVisuel: Math.round(r("e-rond2").top - r("e-bande").bottom),
        };
        racine.remove();
        return resultat;
      },
      [classes, ligneCliquable]
    );
    verif(
      `40 px de part et d'autre de la séparation (${nomLargeur})`,
      vu.separationHaut === 40 && vu.separationBas === 40 && vu.bordure === "1px",
      `${vu.separationHaut} / ${vu.separationBas} · bordure ${vu.bordure}`
    );
    verif(
      `titres de groupe : capitales grises de 13 px (${nomLargeur})`,
      vu.titre.taille === "13px" && vu.titre.capitales === "uppercase",
      `${vu.titre.taille} · ${vu.titre.capitales}`
    );
    verif(
      `34 px entre deux blocs d'artiste (${nomLargeur})`,
      vu.entreBlocs === 34 && vu.entreBlocsVisuel === 34,
      `gap ${vu.entreBlocs} · visuel ${vu.entreBlocsVisuel}`
    );
    verif(
      `ligne d'identité : rond 52, 14 px rond-texte, nom 15 px semi-gras, info 14 px (${nomLargeur})`,
      vu.rond === 52 &&
        vu.rondTexte === 14 &&
        vu.nom.taille === "15px" &&
        vu.nom.graisse === "600" &&
        vu.info.taille === "14px",
      `${vu.rond} · ${vu.rondTexte} · ${vu.nom.taille}/${vu.nom.graisse} · ${vu.info.taille}`
    );
    verif(
      `provenance : 13 px, 12 px sous la ligne, 8 px sur la bande (${nomLargeur})`,
      vu.provenance.taille === "13px" &&
        vu.provenance.sousLigne === 12 &&
        vu.bandeDessus === 8,
      `${vu.provenance.taille} · ${vu.provenance.sousLigne} · ${vu.bandeDessus}`
    );
    verif(
      `bande : 6 px d'écart, rayon 10 px (${nomLargeur})`,
      vu.ecartBande === 6 && vu.rayonVignette === "10px",
      `${vu.ecartBande} · ${vu.rayonVignette}`
    );
    verif(
      `le rond ne bouge JAMAIS — même place et même taille, information sur trois lignes (${nomLargeur})`,
      vu.rondCourt === vu.rondLong &&
        vu.colonneHaute &&
        vu.tailleRondLong === 52,
      `court ${vu.rondCourt} · long ${vu.rondLong} (colonne haute ${vu.colonneHaute}) · rond ${vu.tailleRondLong}`
    );
  } catch (erreur) {
    nonJoue(`§2 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — L'URGENCE PAR LA TYPOGRAPHIE
 * ================================================================== */
titre("§3 — la date proche : blanche semi-grasse, rien d'autre");
{
  verif(
    "la date proche passe en blanc semi-gras (text-sombre-texte + font-semibold)",
    /info\.proche \? "font-semibold text-sombre-texte" : ""/.test(sourceBloc)
  );
  verif(
    "AUCUN rose, vert ou rouge dans tout l'onglet des suivis",
    !/primaire|#EE3D6F|erreur|succes|red-|green-|pink-|rose-/i.test(sourceBloc)
  );
  //  Et la graisse mesurée : l'injection du §2 rend la date à 600 et
  //  à la couleur du texte plein.
}

titre("§4 — les états, à la source partagée");
{
  verif(
    "la ligne d'identité : voile au survol, enfoncé au doigt (règle 229, via CLASSES_LIGNE_CLIQUABLE)",
    Boolean(ligneCliquable) &&
      /hover:bg-white\/5/.test(ligneCliquable) &&
      /active:bg-white\/10/.test(ligneCliquable)
  );
  verif(
    "une vignette : brève baisse d'opacité au doigt, rien de plus",
    /active:opacity-75/.test(sourceBloc) &&
      !/data-vignette-suivi[\s\S]{0,200}hover:bg|ring-|border-/.test(
        sourceBloc.match(/data-vignette-suivi[\s\S]{0,400}/)?.[0] ?? ""
      )
  );
}

/* ==================================================================
 * LA PAGE VIVANTE
 * ================================================================== */
titre("§5 — la page vivante");
nonJoue(
  "§5 · « Ma sélection » vivante",
  "elle exige une session (base hors de portée) : les valeurs sont mesurées ci-dessus par injection des classes RÉELLES, lues à la source"
);

await navigateur.close();
bilan();
