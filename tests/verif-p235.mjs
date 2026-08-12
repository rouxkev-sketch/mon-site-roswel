/**
 * LE BANC DE LA PASSE Nº 235 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §3
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §3 :
 *   §1 — le liseré de 0,5 px mesuré sur les pixels rendus, quatre
 *        côtés, écart ≤ 0,25, glyphe centré — sur une FICHE ;
 *   §2 — le MÊME relevé dans le PIED DE PAGE, et une seule écriture
 *        partagée par les deux endroits.
 *
 * Il se lance comme les autres :  node tests/verif-p235.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §2 — L'ÉCRITURE UNIQUE, À LA SOURCE
 * ================================================================== */
titre("§2 — une seule écriture du disque");
{
  const composant = lire("src/components/IconeReseau.tsx");
  verif(
    "IconeReseauSurDisque : disque de 22, glyphe de 21 — l'unique écriture",
    composant.includes("h-[22px] w-[22px]") &&
      composant.includes("h-[21px] w-[21px]") &&
      composant.includes("object-contain")
  );
  const contenu = lire("src/components/ContenuFiche.tsx");
  const layout = lire("src/app/(tatouage)/layout.tsx");
  verif(
    "la fiche ET le pied de page la consomment",
    contenu.includes("<IconeReseauSurDisque fichier={fichier} />") &&
      layout.includes("<IconeReseauSurDisque fichier={ICONES_RESEAUX.instagram} />")
  );
  verif(
    "plus AUCUN second disque écrit à la main",
    !/rounded-full bg-white/.test(contenu) &&
      !/icone-instagram\.png/.test(layout)
  );
  verif(
    "le pied sert le fichier ROGNÉ, comme la fiche",
    /instagram: "\/icone-instagram-rognee\.png"/.test(lire("src/config/tatouage.ts"))
  );
}

/**
 * LA MESURE DU LISERÉ, PARTAGÉE : canevas à la taille naturelle du
 * fichier, bornes de l'encre, liseré côté par côté dans le repère du
 * disque — aucun œil dans la mesure.
 */
const mesureDisques = async (page, portee) =>
  page.evaluate(async (racine) => {
    const resultats = {};
    const zone = document.querySelector(racine);
    if (!zone) return resultats;
    const disques = [...zone.querySelectorAll("span.rounded-full")].filter((s) =>
      s.querySelector('img[src*="rognee"]')
    );
    let rang = 0;
    for (const disque of disques) {
      const img = disque.querySelector("img");
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
      const nom = (img.getAttribute("src") ?? "").includes("tiktok")
        ? "TikTok"
        : "Instagram";
      resultats[`${nom}${rang > 0 ? ` (${rang + 1})` : ""}`] = {
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
      rang += 1;
    }
    return resultats;
  }, portee);

const controleLisere = (nom, m, endroit) => {
  const valeurs = Object.values(m.cotes);
  verif(
    `${endroit} · ${nom} : disque 22, liseré de 0,5 px (écart ≤ 0,25)`,
    m.disque === 22 &&
      valeurs.every((v) => v >= 0.25 && v <= 0.75) &&
      m.ecartMax <= 0.25,
    `disque ${m.disque} — G ${m.cotes.gauche} · D ${m.cotes.droite} · H ${m.cotes.haut} · B ${m.cotes.bas}`
  );
  verif(
    `${endroit} · ${nom} : glyphe centré au pixel (± 0,5)`,
    m.decentrage <= 0.5,
    `décentrage ${m.decentrage} px`
  );
};

/* ==================================================================
 * §1 — LA FICHE, AU LARGE (1440 px)
 * ================================================================== */
titre("§1 — le liseré de 0,5 px sur une fiche (1440 px)");
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
  nonJoue("§1", "la fiche de démonstration n'a pas répondu");
} else {
  const mesures = await mesureDisques(web, "main");
  const noms = Object.keys(mesures);
  if (noms.length === 0) {
    nonJoue("§1", "aucun disque de réseau sur cette fiche");
  } else {
    for (const nom of noms) controleLisere(nom, mesures[nom], "fiche");
  }

  /* ================================================================
   * §2 — LE PIED DE PAGE, sur la même page
   * ================================================================ */
  titre("§2 — le pied de page, même traitement");
  const pied = await mesureDisques(web, "footer");
  const nomsPied = Object.keys(pied);
  if (nomsPied.length === 0) {
    nonJoue("§2", "aucun disque de réseau dans le pied de page");
  } else {
    for (const nom of nomsPied) controleLisere(nom, pied[nom], "pied de page");
  }
}
await contexteWeb.close();

/* ==================================================================
 * §3 — LE RENDU À 390 px : la fiche ET le pied
 * ================================================================== */
titre("§3 — le rendu à 390 px");
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
    await page.waitForTimeout(2500);
    servie = true;
  } catch {
    servie = false;
  }
  if (!servie) {
    nonJoue("§3", "la fiche de démonstration n'a pas répondu");
  } else {
    const surFiche = await mesureDisques(page, "main");
    const auPied = await mesureDisques(page, "footer");
    const tout = { ...surFiche };
    for (const [nom, m] of Object.entries(auPied)) tout[`pied · ${nom}`] = m;
    const noms = Object.keys(tout);
    if (noms.length === 0) {
      nonJoue("§3", "aucun disque mesurable à 390 px");
    } else {
      for (const nom of noms) controleLisere(nom, tout[nom], "390 px");
    }
  }
  await contexte.close();
}

await navigateur.close();
bilan();
