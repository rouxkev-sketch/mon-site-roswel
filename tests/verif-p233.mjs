/**
 * LE BANC DE LA PASSE Nº 233 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §6
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §6 :
 *   §1 — la colonne d'icônes à 22 px, liseré d'1 px mesuré sur les
 *        pixels rendus (écart ≤ 0,5), glyphe centré, site.png à 20 ;
 *   §2 — le glyphe adresse.png à 28 px dans le rond gris de 52 ;
 *   §3 — le badge Suivre : 30 px, extrémités rondes, typographie
 *        inchangée ;
 *   §4 — le verre liquide : plaque à 30 % / flou 40 / saturation 200,
 *        capsules translucides SANS filtre propre ;
 *   §5 — les liens en deux colonnes égales : TikTok sous le deuxième
 *        lien, même écart de colonne sur les deux lignes.
 *
 * Il se lance comme les autres :  node tests/verif-p233.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ
 * avant la mesure).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §3 et §4 — LES MÉCANIQUES, À LA SOURCE
 * ================================================================== */
titre("§3 et §4 — les mécaniques, à la source");
{
  const suivre = lire("src/components/BoutonSuivre.tsx");
  verif(
    "Suivre : 30 px, extrémités RONDES, retrait et typographie tenus",
    suivre.includes("min-h-[30px]") &&
      suivre.includes("rounded-full") &&
      suivre.includes("px-3.5") &&
      suivre.includes("text-[14px] font-semibold")
  );

  const css = lire("src/app/globals.css");
  const plaque = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    //  ⚠️ 22 % depuis la nº 234-§2 (30 à la 233) : la plaque a été
    //  éclaircie une fois la cause STRUCTURELLE corrigée.
    "la plaque : 22 %, flou 40, saturation 200 — les deux lignes littérales",
    plaque.includes("background-color: rgba(26, 26, 29, 0.22);") &&
      plaque.includes("-webkit-backdrop-filter: blur(40px) saturate(200%);") &&
      plaque.includes("\n  backdrop-filter: blur(40px) saturate(200%);") &&
      plaque.indexOf("-webkit-backdrop-filter") <
        plaque.lastIndexOf("  backdrop-filter:")
  );
  verif("la plaque : aucun var() dans le filtre", !/backdrop-filter:[^;]*var\(/.test(plaque));
  verif(
    //  ⚠️ ATTÉNUÉ à la nº 234-§2 : 0,10 / 0,035 (0,16 / 0,06 à la 233).
    "le liseré, encore atténué, garde sa nuance haut/bas",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.1\)/.test(plaque) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.035\)/.test(plaque)
  );
  const capsule = css.match(/\[data-verre-capsule\]\s*\{[^}]+\}/)?.[0] ?? "";
  const action = css.match(/\[data-verre-action\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "les capsules : PLUS CLAIRES que la plaque (blanc 20 %, rose 40 %)",
    capsule.includes("background-color: rgba(255, 255, 255, 0.2);") &&
      action.includes("background-color: rgba(238, 61, 111, 0.4);")
  );
  verif(
    "et AUCUN filtre d'arrière-plan sur elles — celui de la plaque suffit",
    !capsule.includes("backdrop-filter") && !action.includes("backdrop-filter")
  );
  //  Le piège du @supports, pour la seule règle qui filtre encore.
  const avant = css.slice(0, css.indexOf("[data-verre-fenetre]"));
  const ouvertures = (avant.match(/@supports[^{]*\{/g) ?? []).length;
  verif(
    "la plaque vit hors de tout @supports",
    ouvertures === 0 || (avant.match(/\}/g) ?? []).length >= ouvertures * 2
  );
}

/* ==================================================================
 * §1 et §5 — LA FICHE, AU LARGE (1440 px)
 * ================================================================== */
const contexteWeb = await navigateur.newContext({
  viewport: { width: 1440, height: 950 },
});
const web = await contexteWeb.newPage();
let fiche = false;
try {
  await web.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await web.waitForSelector("main h1", { timeout: 30000 });
  await web.waitForTimeout(2500);
  fiche = true;
} catch {
  fiche = false;
}

if (!fiche) {
  nonJoue("§1 et §5 (1440 px)", "la fiche de démonstration n'a pas répondu");
} else {
  titre("§1 — le liseré d'1 px, mesuré sur les pixels rendus");
  {
    const mesures = await web.evaluate(async () => {
      const resultats = { colonnes: [] };
      for (const nom of ["Instagram", "TikTok"]) {
        const lien = [...document.querySelectorAll('main a[target="_blank"]')].find(
          (a) => a.textContent.trim() === nom
        );
        const colonne = lien?.querySelector("span");
        const disque = lien?.querySelector("span span.rounded-full");
        const img = disque?.querySelector("img");
        if (!colonne || !disque || !img) {
          resultats[nom] = null;
          continue;
        }
        resultats.colonnes.push(Math.round(colonne.getBoundingClientRect().width));
        if (!img.complete) await img.decode().catch(() => {});
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const donnees = ctx.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, x1 = -1, y0 = c.height, y1 = -1;
        for (let y = 0; y < c.height; y += 1) {
          for (let x = 0; x < c.width; x += 1) {
            if (donnees[(y * c.width + x) * 4 + 3] > 16) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        const bd = disque.getBoundingClientRect();
        const bi = img.getBoundingClientRect();
        const ex = bi.width / c.width;
        const ey = bi.height / c.height;
        const cotes = {
          gauche: bi.left + x0 * ex - bd.left,
          droite: bd.right - (bi.left + (x1 + 1) * ex),
          haut: bi.top + y0 * ey - bd.top,
          bas: bd.bottom - (bi.top + (y1 + 1) * ey),
        };
        const valeurs = Object.values(cotes);
        resultats[nom] = {
          disque: Math.round(bd.width),
          cotes: Object.fromEntries(
            Object.entries(cotes).map(([k, v]) => [k, Math.round(v * 100) / 100])
          ),
          ecartMax:
            Math.round((Math.max(...valeurs) - Math.min(...valeurs)) * 100) / 100,
          decentrage:
            Math.round(
              Math.hypot(
                (cotes.gauche - cotes.droite) / 2,
                (cotes.haut - cotes.bas) / 2
              ) * 100
            ) / 100,
        };
      }
      const site = [...document.querySelectorAll('main a[target="_blank"]')].find(
        (a) => !["Instagram", "TikTok"].includes(a.textContent.trim())
      );
      const imgSite = site?.querySelector("img");
      resultats.site = imgSite
        ? {
            colonne: Math.round(site.querySelector("span").getBoundingClientRect().width),
            largeur: Math.round(imgSite.getBoundingClientRect().width),
            ajustement: getComputedStyle(imgSite).objectFit,
          }
        : null;
      return resultats;
    });
    for (const nom of ["Instagram", "TikTok"]) {
      const m = mesures[nom];
      if (!m) {
        nonJoue(`§1 · ${nom}`, "le lien n'est pas sur cette fiche");
        continue;
      }
      const valeurs = Object.values(m.cotes);
      verif(
        //  ⚠️ 0,5 px depuis la nº 235-§1 (1 px à la 233) : le glyphe
        //  passe à 21 dans le disque de 22 — le contrôle suit la
        //  dernière demande.
        `${nom} : disque de 22, liseré de 0,5 px sur les QUATRE côtés (écart ≤ 0,25)`,
        m.disque === 22 &&
          valeurs.every((v) => v >= 0.25 && v <= 0.75) &&
          m.ecartMax <= 0.25,
        `disque ${m.disque} — G ${m.cotes.gauche} · D ${m.cotes.droite} · H ${m.cotes.haut} · B ${m.cotes.bas}`
      );
      verif(
        `${nom} : le glyphe est centré au pixel (± 0,5)`,
        m.decentrage <= 0.5,
        `décentrage ${m.decentrage} px`
      );
    }
    verif(
      "la colonne fait 22 px pour les trois liens",
      mesures.colonnes.every((c) => c === 22) &&
        mesures.site?.colonne === 22,
      `réseaux ${mesures.colonnes.join("/")} · site ${mesures.site?.colonne}`
    );
    if (!mesures.site) {
      nonJoue("§1 · site.png", "aucun lien de site sur cette fiche");
    } else {
      verif(
        "site.png : 20 px, object-contain, jamais rognée",
        mesures.site.largeur === 20 && mesures.site.ajustement === "contain",
        `${mesures.site.largeur} px · ${mesures.site.ajustement}`
      );
    }
  }

  titre("§5 — les liens en deux colonnes égales");
  {
    const grille = await web.evaluate(() => {
      const de = (mot) =>
        [...document.querySelectorAll('main a[target="_blank"]')].find(
          (a) => a.textContent.trim() === mot
        );
      const instagram = de("Instagram");
      const tiktok = de("TikTok");
      const bloc = instagram?.closest('div[class*="flex-col"]');
      if (!instagram || !tiktok || !bloc) return null;
      const rangees = [...bloc.children];
      if (rangees.length !== 2) return null;
      const sites = [...rangees[0].querySelectorAll("a")];
      const bi = instagram.getBoundingClientRect();
      const bt = tiktok.getBoundingClientRect();
      const b1 = sites[0]?.getBoundingClientRect();
      const b2 = sites[1]?.getBoundingClientRect();
      return {
        deuxSites: sites.length === 2,
        colonne1: b1 && Math.abs(bi.left - b1.left),
        colonne2: b2 && Math.abs(bt.left - b2.left),
        pasDeColonne:
          b1 && b2 ? Math.round((bt.left - bi.left) - (b2.left - b1.left)) : null,
        entreLignes: Math.round(
          rangees[1].getBoundingClientRect().top -
            rangees[0].getBoundingClientRect().bottom
        ),
      };
    });
    if (!grille || !grille.deuxSites) {
      nonJoue("§5", "il faut deux liens de site et les deux réseaux sur la fiche");
    } else {
      verif(
        "Instagram s'aligne sous le premier lien, TikTok sous le deuxième",
        grille.colonne1 <= 1 && grille.colonne2 <= 1,
        `écarts ${grille.colonne1?.toFixed(1)} / ${grille.colonne2?.toFixed(1)} px`
      );
      verif(
        "le pas de colonne est LE MÊME sur les deux lignes",
        grille.pasDeColonne === 0,
        `différence ${grille.pasDeColonne} px`
      );
      verif(
        "les 16 px entre les deux lignes ne bougent pas (nº 229)",
        grille.entreLignes === 16,
        `${grille.entreLignes} px`
      );
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §2 et §4 — LE RENDU À 390 px
 * ================================================================== */
titre("§2 — le glyphe des pastilles grises (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();

  //  LA FICHE AU SALON SAISI À LA MAIN : sa pastille de lieu n'a pas
  //  de photo — c'est le glyphe d'adresse qu'on mesure.
  let servie = false;
  try {
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2000);
    servie = true;
  } catch {
    servie = false;
  }
  if (!servie) {
    nonJoue("§2", "la fiche de démonstration n'a pas répondu");
  } else {
    const glyphe = await page.evaluate(() => {
      const img = document.querySelector(
        'main span.rounded-full img[src*="adresse"]'
      );
      if (!img) return null;
      const rond = img.closest("span.rounded-full");
      return {
        taille: Math.round(img.getBoundingClientRect().width),
        rond: Math.round(rond.getBoundingClientRect().width),
      };
    });
    if (!glyphe) {
      nonJoue("§2", "aucune pastille au glyphe d'adresse sur cette fiche");
    } else {
      verif(
        "le glyphe adresse.png fait 28 px dans son rond de 52",
        glyphe.taille === 28 && glyphe.rond === 52,
        `glyphe ${glyphe.taille} · rond ${glyphe.rond}`
      );
    }
  }

  titre("§4 — le verre liquide, mesuré (390 px)");
  //  LA FENÊTRE D'ADRESSE — sur la fiche de démonstration principale.
  let corvus = false;
  try {
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2000);
    corvus = true;
  } catch {
    corvus = false;
  }
  if (!corvus) {
    nonJoue("§4", "la fiche de démonstration n'a pas répondu");
  } else {
    const lien = page.locator('a[href*="google.com/maps"]').first();
    await lien.scrollIntoViewIfNeeded();
    await lien.click();
    const fenetre = page.locator("[data-verre-fenetre]");
    await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
    if ((await fenetre.count()) !== 1) {
      nonJoue("§4", "la fenêtre d'adresse ne s'est pas ouverte");
    } else {
      const verre = await page.evaluate(() => {
        const plaque = document.querySelector("[data-verre-fenetre]");
        const s = getComputedStyle(plaque);
        const capsule = plaque.querySelector("[data-verre-capsule]");
        const action = plaque.querySelector("[data-verre-action]");
        return {
          fond: s.backgroundColor,
          filtre: s.backdropFilter,
          fondCapsule: capsule ? getComputedStyle(capsule).backgroundColor : "",
          filtreCapsule: capsule ? getComputedStyle(capsule).backdropFilter : "",
          fondAction: action ? getComputedStyle(action).backgroundColor : "",
          filtreAction: action ? getComputedStyle(action).backdropFilter : "",
        };
      });
      verif(
        "la plaque : anthracite 22 %, flou 40, saturation 200",
        verre.fond === "rgba(26, 26, 29, 0.22)" &&
          verre.filtre.includes("blur(40px)") &&
          verre.filtre.includes("saturate(2)"),
        `${verre.fond} · ${verre.filtre}`
      );
      verif(
        "la capsule blanche : 20 %, SANS filtre propre",
        verre.fondCapsule === "rgba(255, 255, 255, 0.2)" &&
          verre.filtreCapsule === "none",
        `${verre.fondCapsule} · filtre ${verre.filtreCapsule}`
      );
      verif(
        "la capsule rose : 40 %, SANS filtre propre",
        verre.fondAction === "rgba(238, 61, 111, 0.4)" &&
          verre.filtreAction === "none",
        `${verre.fondAction} · filtre ${verre.filtreAction}`
      );
      //  On referme proprement (le voile), la mesure est faite.
      await page
        .locator('button[aria-label="Fermer"]')
        .first()
        .click({ position: { x: 10, y: 10 } });
    }
  }
  await contexte.close();
}

await navigateur.close();
bilan();
