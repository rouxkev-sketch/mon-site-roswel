/**
 * BANC DE LA PASSE Nº 291 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 le catalogue : « Bio-organique » (libellé seul, slug intact),
 *    « Tribal » dans la famille, « Japonais · Irezumi » AUX DEUX
 *    ENDROITS sans jamais se compter deux fois, « Chicano » immobile ;
 * §2 la sonde `?sonde-photo=1` — elle relève, elle ne corrige rien,
 *    et surtout elle ne déplace RIEN de ce qu'elle mesure.
 * ⚠️ UNE SEULE LARGEUR (1440 px), un seul navigateur, aucun banc de
 * régression rejoué ici : c'est la consigne de livraison rapide.
 */
import { rmSync, writeFileSync } from "node:fs";
import {
  BASE,
  RACINE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const config = sansNotes(lire("src/config/tatouage.ts"));
const menu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const sonde = sansNotes(lire("src/components/SondePhoto.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));

titre("§1 — le catalogue, à la source");
{
  verif(
    "« Bio-organique » : le LIBELLÉ change, le slug `bio-mecha` reste — " +
      "donc aucune migration, et `?style=bio-mecha` répond encore",
    /\{ slug: "bio-mecha", label: "Bio-organique", couleur: "#4A4550" \}/.test(
      config
    )
  );
  verif(
    "« Biomécanique » N'A PAS BOUGÉ : deux styles distincts, jamais " +
      "fusionnés (le métal sous la peau, la chair et l'os)",
    /\{ slug: "biomecanique", label: "Biomécanique", couleur: "#44575B" \}/.test(
      config
    )
  );
  const famille = config.slice(
    config.indexOf("export const FAMILLES_STYLES"),
    config.indexOf("export function famillesStyles")
  );
  verif(
    "« Tribal » a rejoint la famille — il quitte le premier niveau ; " +
      "son slug et sa page /tatouage/tribal/<ville> ne bougent pas",
    /"sicanje",\s*"tribal",\s*"yoruba",/.test(famille.replace(/\s+/g, " "))
  );
  verif(
    "« Japonais · Irezumi » est dans `aussi` — la famille le montre " +
      "SANS qu'il quitte sa lettre",
    /aussi: \["japonais"\],/.test(famille)
  );
  verif(
    "DEUX LECTURES SÉPARÉES, et c'est tout le mécanisme : la famille " +
      "MONTRE `styles + aussi`, mais seul `styles` QUITTE le premier " +
      "niveau — `aussi` n'entre jamais dans `stylesRangesEnFamille`",
    /famille\.styles,\s*\.\.\.famille\.aussi,/.test(
      config
        .slice(config.indexOf("export function famillesStyles"))
        .replace(/\s+/g, " ")
        .replace(/\.\.\. /g, "...")
    ) &&
      !/aussi/.test(
        config.slice(
          config.indexOf("function stylesRangesEnFamille"),
          config.indexOf("export function stylesAlphabetiques")
        )
      ) &&
      /const enFamille = stylesRangesEnFamille\(\);/.test(config)
  );
  verif(
    "« Chicano » NE BOUGE PAS : premier niveau, à sa lettre",
    /\{ slug: "chicano", label: "Chicano", couleur: "#57544B" \}/.test(config) &&
      !/"chicano"/.test(famille)
  );
  //  ⚠️ SUR LE FICHIER NU, PAS SUR `config` : les nombres périmés
  //  vivaient DANS les commentaires, que `sansNotes` efface. Vérifier
  //  là aurait été vert quoi qu'il arrive.
  const brut = lire("src/config/tatouage.ts");
  verif(
    "LES COMMENTAIRES PÉRIMÉS SONT REFAITS : plus un seul " +
      "« trente-huit », « vingt-neuf isolés » ni « TRENTE ENTRÉES » " +
      "hors de la note qui les date",
    !/trente-huit styles|trente-huit d’origine|trente-huit entrées/.test(brut) &&
      !/Vingt-neuf styles isolés/.test(brut) &&
      /LES TRENTE ET UNE ENTRÉES DU MENU/.test(brut) &&
      /QUARANTE styles au/.test(brut) &&
      //  Les vieux nombres n'ont droit qu'à UN endroit : la note qui
      //  dit d'où ils venaient et pourquoi ils étaient faux.
      (brut.match(/trente-huit/g) ?? []).length === 1
  );
}

titre("§1 — le catalogue, rejoué sur le vrai code");
{
  //  ⚠️ LE VRAI FICHIER, PAS UNE COPIE DE SES NOMBRES. On le recopie
  //  À L'INSTANT sous une extension que Node sait charger (il
  //  n'importe rien, donc aucun alias à réécrire), on interroge ses
  //  vraies fonctions, et on efface la copie. Un catalogue recopié à
  //  la main dans un banc, c'est un banc qui prouve sa propre copie.
  const copie = `${RACINE}/tests/_catalogue-p291.mts`;
  writeFileSync(copie, lire("src/config/tatouage.ts"));
  const { entreesExplorer, stylesAlphabetiques, libelleStyle } = await import(
    `file://${copie}?${Date.now()}`
  );
  rmSync(copie, { force: true });
  const entrees = entreesExplorer();
  const familles = entrees.filter((e) => e.genre === "famille");
  const isoles = entrees.filter((e) => e.genre === "style");
  const cultures = familles[0];
  const dansLaFamille = cultures.styles.map((s) => s.label);

  verif(
    "QUARANTE styles au catalogue, chacun UNE SEULE FOIS — la seconde " +
      "place de Japonais est un affichage, pas une ligne de plus",
    stylesAlphabetiques().length === 40 &&
      new Set(stylesAlphabetiques().map((s) => s.slug)).size === 40,
    `${stylesAlphabetiques().length}`
  );
  verif(
    "TRENTE ET UNE entrées de menu : trente styles au premier niveau " +
      "+ une porte de famille",
    entrees.length === 31 && isoles.length === 30 && familles.length === 1,
    `${entrees.length} entrées · ${isoles.length} isolés · ${familles.length} famille`
  );
  verif(
    //  ⚠️ AMENDÉE À LA nº 292-§2, SUR CONSIGNE : sous la porte, le
    //  style s'écrit désormais « Irezumi » tout court. Le fait vérifié
    //  ne change pas — c'est bien `japonais` qui est là, et il y est
    //  toujours ; seul le mot affiché a changé.
    "LA FAMILLE EN MONTRE ONZE, dans l'ordre alphabétique — Tribal " +
      "dedans, Japonais dedans (« Irezumi » depuis la nº 292)",
    dansLaFamille.length === 11 &&
      dansLaFamille.includes("Tribal") &&
      dansLaFamille.includes("Irezumi"),
    dansLaFamille.join(" · ")
  );
  verif(
    "« Japonais · Irezumi » EST AUX DEUX ENDROITS — et « Tribal » " +
      "n'est plus qu'à un seul",
    isoles.some((e) => e.slug === "japonais") &&
      !isoles.some((e) => e.slug === "tribal"),
    `premier niveau : ${isoles.map((e) => e.label).join(", ").slice(0, 90)}…`
  );
  verif(
    "« Bio-organique » est le libellé rendu POUR LE SLUG `bio-mecha` : " +
      "un lien déjà partagé désigne toujours le même style",
    libelleStyle("bio-mecha") === "Bio-organique" &&
      libelleStyle("biomecanique") === "Biomécanique",
    `${libelleStyle("bio-mecha")} / ${libelleStyle("biomecanique")}`
  );
  verif(
    "AUCUN SLUG N'A CHANGÉ : les quarante d'aujourd'hui sont, un à un, " +
      "ceux d'hier — donc aucune adresse cassée, et aucune migration",
    [
      "realisme", "fine-line", "minimaliste", "blackwork", "dotwork",
      "geometrique", "ornemental", "old-school", "neo-traditionnel",
      "new-school", "japonais", "chicano", "tribal", "aquarelle",
      "illustratif", "anime-manga", "abstrait", "trash-polka",
      "biomecanique", "organique", "ignorant-style", "cyber-tribal",
      "cyberpunk", "lettering", "acid-trad", "bio-mecha", "chrome",
      "cyber-sigilism", "gravure", "one-line", "suminagashi", "berbere",
      "celtique", "copte", "maori", "nordique", "pa-tutiki",
      "polynesien", "sicanje", "yoruba",
    ].every((slug) => stylesAlphabetiques().some((s) => s.slug === slug))
  );
}

titre("§1 — deux places, jamais deux comptes (le rendu)");
{
  verif(
    "LA CLÉ DE RENDU N'EST PLUS LA VALEUR : deux entrées d'une même " +
      "liste peuvent porter la même `value` sans se mélanger",
    /cle: `\$\{option\.groupe \?\? ""\}▸\$\{option\.sousGroupe \?\? ""\}▸\$\{option\.value\}`/.test(
      menu
    ) &&
      /<li key=\{cle\}>/.test(menu) &&
      !/<li key=\{option\.value\}>/.test(menu) &&
      !/<li key=\{value\}>/.test(menu)
  );
  verif(
    "LE REPLI PRÉFÈRE LE PREMIER NIVEAU : choisir Japonais dans la " +
      "liste alphabétique n'ouvre pas la famille au rendez-vous suivant",
    /options\.find\(\(option\) => option\.value === valeur && !option\.sousGroupe\) \?\?/.test(
      menu.replace(/\s+/g, " ")
    )
  );
}

titre("§2 — la sonde : elle relève, elle ne touche à rien");
{
  verif(
    "elle ne s'arme QUE sur `?sonde-photo=1`, et sans lui aucune " +
      "boucle n'est même lancée",
    /get\("sonde-photo"\) === "1"/.test(sonde) &&
      /if \(!demandee\) return;/.test(sonde)
  );
  verif(
    "son bandeau part dans un PORTAIL vers `document.body`, en " +
      "`position: fixed` : hors du flux, il ne déplace rien",
    /createPortal\(/.test(sonde) &&
      /position: "fixed"/.test(sonde) &&
      /document\.body\s*\);/.test(sonde)
  );
  verif(
    "AUCUNE API QUE SAFARI POURRAIT REFUSER en travers du relevé : " +
      "pas de ResizeObserver, et le presse-papier n'est qu'un confort",
    !/ResizeObserver/.test(sonde) &&
      /requestAnimationFrame/.test(sonde) &&
      /document\.execCommand\("copy"\)/.test(sonde) &&
      /user-select|userSelect/.test(sonde)
  );
  verif(
    "LA LIGNE QUI DÉCIDE existe, avec ses trois issues — et elle avoue " +
      "quand les deux formules donnent le même nombre",
    /MESURE APPLIQUÉE/.test(sonde) &&
      /REPLI 119 px ENCORE EN VIGUEUR/.test(sonde) &&
      /INDÉCIDABLE ICI/.test(sonde)
  );
  verif(
    "elle est montée DANS la fiche — donc sur « Mon portfolio » aussi, " +
      "qui rend ce même composant en aperçu, et la racine dit laquelle",
    /<SondePhoto \/>/.test(fiche) &&
      /data-fiche-vue=\{apercu \? "apercu" : "publique"\}/.test(fiche)
  );
}

titre("vivant (1440 px) — le relevé, et l'absence d'effet de bord");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await contexte.newPage();
    const plaintes = [];
    page.on("console", (message) => {
      if (message.type() === "error") plaintes.push(message.text());
    });

    /*  LA MÊME PAGE, DEUX FOIS : avec la sonde et sans elle. Les
        nombres doivent être IDENTIQUES — une sonde qui déplace ce
        qu'elle mesure ne prouve rien. */
    const geometrie = async (adresse) => {
      await page.goto(adresse, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
      await page.waitForTimeout(2200);
      return page.evaluate(() => {
        const boite = document
          .querySelector("[data-photo-fiche]")
          .getBoundingClientRect();
        return { haut: boite.top, hauteur: boite.height, largeur: boite.width };
      });
    };
    const sans = await geometrie(`${BASE}/tatoueur/typo-sauvage-bordeaux`);
    verif(
      "SANS le paramètre, la sonde n'existe pas : aucun bandeau dans la page",
      (await page.locator("#sonde-photo-texte").count()) === 0
    );

    const avec = await geometrie(
      `${BASE}/tatoueur/typo-sauvage-bordeaux?sonde-photo=1`
    );
    verif(
      "AVEC le paramètre, la photo est AU PIXEL au même endroit et de " +
        "la même taille — la sonde ne modifie rien de ce qu'elle mesure",
      avec.haut === sans.haut &&
        avec.hauteur === sans.hauteur &&
        avec.largeur === sans.largeur,
      `${sans.largeur.toFixed(3)}×${sans.hauteur.toFixed(3)} → ` +
        `${avec.largeur.toFixed(3)}×${avec.hauteur.toFixed(3)}`
    );

    const releve = await page.evaluate(
      () => document.getElementById("sonde-photo-texte").innerText
    );
    verif(
      "LE RELEVÉ PORTE TOUT CE QUI A ÉTÉ DEMANDÉ — et il nomme sa page",
      [
        "▶ CE QUI TIENT LA PAGE",
        "--photo-hauteur-libre posée",
        "fenêtre (innerHeight × innerWidth)",
        "devicePixelRatio",
        "cadre · haut",
        "cadre · bas",
        "cadre · hauteur",
        "cadre · largeur",
        "cadre calculé · height",
        "cadre calculé · width",
        "nº 290 · haut de la photo (document)",
        "nº 290 · marge du bas (racine)",
        "largeur RÉELLEMENT appliquée",
        "document.scrollHeight",
        "fiche publique (pleine page)",
      ].every((attendu) => releve.includes(attendu)),
      `${releve.split("\n").length} lignes`
    );
    verif(
      "les valeurs sont AU MILLIÈME, virgule française",
      /cadre · hauteur : \d+,\d{3} px/.test(releve),
      releve.split("\n").find((l) => l.startsWith("cadre · hauteur")) ?? ""
    );
    verif(
      "et le relevé est SÉLECTIONNABLE à la main, si la copie échoue",
      (await page.evaluate(() =>
        getComputedStyle(document.getElementById("sonde-photo-texte"))
          .webkitUserSelect
      )) === "text"
    );

    /* ---------- §1 — le menu, en vivant --------------------------- */
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(800);
    await page.locator('[role="listbox"] button').first().click();
    await page.waitForTimeout(700);
    const premierNiveau = await page.evaluate(() =>
      [...document.querySelectorAll('[role="listbox"] button')]
        .map((b) => (b.textContent ?? "").replace(/\d+$/, "").trim())
        .filter(Boolean)
    );
    verif(
      "PREMIER NIVEAU : « Bio-organique » a remplacé « Bio-mecha », " +
        "« Biomécanique » est toujours là à côté, « Chicano » aussi, " +
        "et « Tribal » n'y est plus",
      premierNiveau.includes("Bio-organique") &&
        premierNiveau.includes("Biomécanique") &&
        premierNiveau.includes("Chicano") &&
        premierNiveau.includes("Japonais · Irezumi") &&
        !premierNiveau.includes("Tribal"),
      premierNiveau.slice(0, 12).join(" · ")
    );
    await page.locator('[data-sous-porte="Cultures du monde"]').click();
    await page.waitForTimeout(600);
    const apresPorte = await page.evaluate(() =>
      [...document.querySelectorAll('[role="listbox"] button')]
        .map((b) => (b.textContent ?? "").replace(/\d+$/, "").trim())
        .filter(Boolean)
    );
    verif(
      //  ⚠️ AMENDÉE À LA nº 292-§2, SUR CONSIGNE : le style se lit
      //  toujours AUX DEUX ENDROITS de la même liste — mais sous deux
      //  libellés, « Japonais · Irezumi » à sa lettre et « Irezumi »
      //  sous la porte. C'est ce couple que la vérification compte.
      "LA FAMILLE OUVERTE montre Tribal ET le japonais — qui se lit " +
        "alors AUX DEUX ENDROITS de la même liste, sous ses deux " +
        "libellés (nº 292-§2)",
      apresPorte.includes("Tribal") &&
        apresPorte.filter((mot) => mot === "Japonais · Irezumi").length === 1 &&
        apresPorte.filter((mot) => mot === "Irezumi").length === 1,
      `« Japonais · Irezumi » ×${apresPorte.filter((m) => m === "Japonais · Irezumi").length}` +
        ` · « Irezumi » ×${apresPorte.filter((m) => m === "Irezumi").length}`
    );
    verif(
      "…et le navigateur ne se plaint de RIEN : deux entrées de même " +
        "valeur, mais deux clés de rendu distinctes",
      plaintes.filter((texte) => /key|Warning|Each child/i.test(texte))
        .length === 0,
      plaintes.slice(0, 2).join(" | ") || "aucune plainte"
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§2 dans Safari, et sur la vraie page « Mon portfolio »",
  "je n'ai ni WebKit ni session dans ce conteneur — c'est précisément " +
    "pourquoi cette sonde existe : le relevé viendra de l'écran du " +
    "propriétaire, pas du mien. Ce qui est prouvé ici, c'est qu'elle " +
    "relève juste et qu'elle ne déplace rien"
);

process.exit(bilan());
