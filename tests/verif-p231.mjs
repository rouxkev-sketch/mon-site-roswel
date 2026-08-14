/**
 * LE BANC DE LA PASSE Nº 231 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §4
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §4 :
 *   §1 — le liseré blanc MESURÉ SUR LES PIXELS RENDUS, sur les quatre
 *        côtés de chaque icône de réseau : 1,5 px, écart maximal
 *        0,5 px entre côtés, glyphe centré ; site.png inchangée ;
 *   §2 — la fenêtre d'adresse ne contient plus que deux capsules de
 *        dimensions identiques — sans croix, sans adresse, sans
 *        badge — et se referme par le voile ;
 *   §3 — le badge « Suivre » : plus bas qu'avant, angles arrondis,
 *        même taille de police que Profil et Portfolio.
 *
 * Il se lance comme les autres :  node tests/verif-p231.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ
 * avant la mesure : le cache Turbopack a déjà servi de vieilles
 * feuilles aux passes 227 et 229).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 — LES FICHIERS ROGNÉS, À LA SOURCE
 * ================================================================== */
titre("§1 — les fichiers d'icônes, rognés et servis");
{
  const config = lire("src/config/tatouage.ts");
  verif(
    "les versions ROGNÉES sont servies (les originaux ne bougent pas)",
    /instagram: "\/icone-instagram-rognee\.png"/.test(config) &&
      /tiktok: "\/icone-tiktok-rognee\.png"/.test(config)
  );
  for (const fichier of ["icone-instagram-rognee.png", "icone-tiktok-rognee.png"]) {
    let present = true;
    try {
      lire(`public/${fichier}`);
    } catch {
      present = false;
    }
    verif(`public/${fichier} existe`, present);
  }
  //  LES ORIGINAUX SONT INTACTS — toujours là, toujours servis par le
  //  pied de page.
  for (const fichier of ["icone-instagram.png", "icone-tiktok.png"]) {
    let present = true;
    try {
      lire(`public/${fichier}`);
    } catch {
      present = false;
    }
    verif(`public/${fichier} (original) est intact`, present);
  }
}

/* ==================================================================
 * §1 et §3 — LA FICHE, AU LARGE (1440 px)
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
  nonJoue("§1 et §3 (1440 px)", "la fiche de démonstration n'a pas répondu");
} else {
  titre("§1 — le liseré, mesuré sur les pixels rendus");
  {
    const mesures = await web.evaluate(async () => {
      const resultats = {};
      for (const nom of ["Instagram", "TikTok"]) {
        const lien = [...document.querySelectorAll('main a[target="_blank"]')].find(
          (a) => a.textContent.trim() === nom
        );
        const disque = lien?.querySelector("span span.rounded-full");
        const img = disque?.querySelector("img");
        if (!disque || !img) {
          resultats[nom] = null;
          continue;
        }
        //  On attend que l'image soit vraiment décodée.
        if (!img.complete) await img.decode().catch(() => {});
        //  LES BORNES DE L'ENCRE, dans le repère du fichier : le
        //  canevas dessine l'image à sa taille naturelle et on lit
        //  les pixels — aucun œil dans la mesure.
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
        //  L'échelle fichier → pixels rendus.
        const ex = bi.width / c.width;
        const ey = bi.height / c.height;
        //  LE LISERÉ, côté par côté : du bord du disque au premier
        //  pixel d'encre.
        const cotes = {
          gauche: bi.left + x0 * ex - bd.left,
          droite: bd.right - (bi.left + (x1 + 1) * ex),
          haut: bi.top + y0 * ey - bd.top,
          bas: bd.bottom - (bi.top + (y1 + 1) * ey),
        };
        const valeurs = Object.values(cotes);
        resultats[nom] = {
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
        //  ⚠️ 1 px depuis la nº 233-§1 (1,5 à la 231) : disque de 22,
        //  glyphe de 20 — le contrôle suit la dernière demande.
        `${nom} : un liseré d'1 px sur les QUATRE côtés (écart ≤ 0,5)`,
        valeurs.every((v) => v >= 0.75 && v <= 1.5) && m.ecartMax <= 0.5,
        `G ${m.cotes.gauche} · D ${m.cotes.droite} · H ${m.cotes.haut} · B ${m.cotes.bas} — écart ${m.ecartMax}`
      );
      verif(
        `${nom} : le glyphe est centré au pixel (± 0,5)`,
        m.decentrage <= 0.5,
        `décentrage ${m.decentrage} px`
      );
    }

    //  site.png — comme en 229 : 16 px, object-contain, sans disque.
    const site = await web.evaluate(() => {
      const lien = [...document.querySelectorAll('main a[target="_blank"]')].find(
        (a) => !["Instagram", "TikTok"].includes(a.textContent.trim())
      );
      const img = lien?.querySelector("img");
      if (!img) return null;
      return {
        largeur: Math.round(img.getBoundingClientRect().width),
        ajustement: getComputedStyle(img).objectFit,
        disque: Boolean(
          [...(lien?.querySelectorAll("span") ?? [])].find(
            (s) => getComputedStyle(s).backgroundColor === "rgb(255, 255, 255)"
          )
        ),
      };
    });
    if (!site) {
      nonJoue("§1 · site.png", "aucun lien de site sur cette fiche");
    } else {
      verif(
        //  ⚠️ 20 px depuis la nº 233-§1 (16 à la 229).
        "site.png : 20 px, object-contain, sans disque",
        site.largeur === 20 && site.ajustement === "contain" && !site.disque,
        `${site.largeur} px · ${site.ajustement}`
      );
    }
  }

  titre("§3 — le badge « Suivre », au poids des mots");
  {
    const badge = await web.evaluate(() => {
      const suivre = [...document.querySelectorAll("main button")].find((b) =>
        /^(Suivre|Suivi)/.test(b.textContent.trim())
      );
      const profil = [...document.querySelectorAll("main button")].find(
        (b) => b.textContent.trim() === "Profil"
      );
      if (!suivre || !profil) return null;
      const ss = getComputedStyle(suivre);
      const sp = getComputedStyle(profil);
      const bs = suivre.getBoundingClientRect();
      const bp = profil.getBoundingClientRect();
      return {
        hauteur: Math.round(bs.height),
        hauteurMots: Math.round(bp.height),
        rayon: parseFloat(ss.borderRadius),
        police: ss.fontSize,
        policeMots: sp.fontSize,
        graisse: ss.fontWeight,
        graisseMots: sp.fontWeight,
        retraitLateral: parseFloat(ss.paddingLeft),
        centres: Math.abs(
          (bs.top + bs.bottom) / 2 - (bp.top + bp.bottom) / 2
        ),
        rose: ss.backgroundColor,
      };
    });
    if (!badge) {
      //  ⚠️ UNE FICHE DE DÉMONSTRATION NE PEUT PAS ÊTRE SUIVIE (son
      //  identifiant « demo-… » n'existe pas en base) : le bouton ne
      //  s'y rend pas, et la mesure vivante est déclarée NON JOUÉE —
      //  jamais maquillée. La MÉCANIQUE, elle, se lit à la source.
      nonJoue(
        "§3 · mesure vivante",
        "le badge « Suivre » ne se rend pas sur une fiche de démonstration"
      );
      const source = lire("src/components/BoutonSuivre.tsx");
      verif(
        //  ⚠️ nº 233-§3 : 30 px (36 à la 231) et les extrémités
        //  redeviennent RONDES (rounded-full).
        "à la source : 30 px de haut, extrémités rondes, retrait réduit",
        source.includes("min-h-[30px]") &&
          source.includes("rounded-full") &&
          source.includes("px-3.5")
      );
      //  ⚠️ RÉVISÉ nº 255-§1 puis nº 276-§3 : les mots du sélecteur
      //  Profil / Portfolio vivent dans SelecteurCapsule (extraction
      //  255), et PortfolioDeLAffiche n'a plus aucun sélecteur à lui
      //  (la 276 a supprimé les deux va-et-vient). La typographie de
      //  référence se lit donc chez SelecteurCapsule.
      const selecteur = lire("src/components/SelecteurCapsule.tsx");
      verif(
        "à la source : la même typographie que les mots du sélecteur",
        source.includes("text-[14px] font-semibold") &&
          selecteur.includes("text-[14px]")
      );
    } else {
      verif(
        "il est PLUS BAS qu'avant (36 px, contre 44)",
        badge.hauteur === 36,
        `${badge.hauteur} px (les mots : ${badge.hauteurMots})`
      );
      verif(
        "des ANGLES ARRONDIS, pas une capsule (rayon très sous la mi-hauteur)",
        badge.rayon > 0 && badge.rayon < badge.hauteur / 2 - 4,
        `rayon ${badge.rayon} px`
      );
      verif(
        "la MÊME typographie que Profil et Portfolio",
        badge.police === badge.policeMots && badge.graisse === badge.graisseMots,
        `${badge.police}/${badge.graisse} contre ${badge.policeMots}/${badge.graisseMots}`
      );
      verif(
        "le rembourrage latéral est réduit (14 px, contre 24)",
        badge.retraitLateral === 14,
        `${badge.retraitLateral} px`
      );
      verif(
        "son centre optique est aligné sur les mots (± 1 px)",
        badge.centres <= 1,
        `écart ${badge.centres.toFixed(1)} px`
      );
      verif("il garde son rose", badge.rose.includes("238, 61, 111"), badge.rose);
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §2 — LA FENÊTRE D'ADRESSE DÉPOUILLÉE (390 px)
 * ================================================================== */
titre("§2 — la fenêtre d'adresse, deux capsules et rien d'autre (390 px)");
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
    nonJoue("§2", "la fiche de démonstration n'a pas répondu");
  } else {
    const lien = page.locator('a[href*="google.com/maps"]').first();
    await lien.scrollIntoViewIfNeeded();
    await lien.click();
    const fenetre = page.locator("[data-verre-fenetre]");
    await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
    if ((await fenetre.count()) !== 1) {
      nonJoue("§2", "la fenêtre d'adresse ne s'est pas ouverte");
    } else {
      const mesure = await page.evaluate(() => {
        const plaque = document.querySelector("[data-verre-fenetre]");
        const enfants = [...plaque.children];
        const copier = [...plaque.querySelectorAll("button")].find((b) =>
          /^(Copier l'adresse|Adresse copiée)$/.test(b.textContent.trim())
        );
        const maps = plaque.querySelector("[data-verre-action]");
        const bc = copier?.getBoundingClientRect();
        const bm = maps?.getBoundingClientRect();
        const s = getComputedStyle(plaque);
        return {
          nEnfants: enfants.length,
          quoi: enfants.map((n) => n.tagName).join(","),
          sansCroix: !plaque.querySelector('button[aria-label="Fermer"]'),
          sansAdresse: !plaque.querySelector("p"),
          sansBadge: !plaque.querySelector("ul, li"),
          copierAuDessus: bc && bm ? bc.bottom <= bm.top : false,
          jumeaux:
            bc && bm
              ? Math.abs(bc.width - bm.width) <= 1 &&
                Math.abs(bc.height - bm.height) <= 1 &&
                getComputedStyle(copier).borderRadius ===
                  getComputedStyle(maps).borderRadius
              : false,
          margesGenereuses: parseFloat(s.paddingTop) >= 20,
          fond: s.backgroundColor,
          filtre: s.backdropFilter,
          centreX: Math.round(
            plaque.getBoundingClientRect().left +
              plaque.getBoundingClientRect().width / 2
          ),
          milieuEcran: Math.round(window.innerWidth / 2),
        };
      });
      verif(
        "DEUX capsules, et rien d'autre",
        mesure.nEnfants === 2 &&
          mesure.sansCroix &&
          mesure.sansAdresse &&
          mesure.sansBadge,
        `${mesure.nEnfants} enfant(s) : ${mesure.quoi}`
      );
      verif(
        "empilées, de dimensions identiques — Copier au-dessus",
        mesure.copierAuDessus && mesure.jumeaux
      );
      verif(
        "centrée, marges intérieures généreuses",
        Math.abs(mesure.centreX - mesure.milieuEcran) <= 2 &&
          mesure.margesGenereuses
      );
      verif(
        //  ⚠️ nº 234-§2 : 22 % (30 à la 233) — la plaque est
        //  éclaircie APRÈS la correction de structure. Flou et
        //  saturation inchangés.
        "le verre porte les valeurs de la 234",
        mesure.fond === "rgba(26, 26, 29, 0.22)" &&
          mesure.filtre.includes("blur(40px)") &&
          mesure.filtre.includes("saturate(2)"),
        `${mesure.fond} · ${mesure.filtre}`
      );

      //  LE VOILE REFERME — l'appui à côté de la plaque.
      await page
        .locator('button[aria-label="Fermer"]')
        .first()
        .click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
      verif(
        "un appui à côté referme",
        (await page.locator("[data-verre-fenetre]").count()) === 0
      );
    }
  }
  await contexte.close();
}

await navigateur.close();
bilan();
