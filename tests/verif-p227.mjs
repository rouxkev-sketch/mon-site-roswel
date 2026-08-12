/**
 * LE BANC DE LA PASSE Nº 227 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu en écran étroit demandé (390 px)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §7 :
 *   §1 — pastilles à 52 px, photo de profil toujours à 92 ;
 *   §2 — texte centré sur sa pastille, 20 px entre les lignes et de
 *        part et d'autre, 14 px entre pastille et texte ;
 *   §3 — disque blanc plein sous Instagram et TikTok, les trois
 *        icônes dans la colonne de 18 px, site.png sans disque ;
 *   §4 — les deux lignes de liens dans le bon ordre, et l'exception
 *        sans TikTok (Instagram remonte) ;
 *   §5 — aucun rose au survol : couleur du texte inchangée, fond
 *        éclairci d'un cran, fin soulignement décalé ;
 *   §6 — la fenêtre de verre : les deux lignes de filtre littérales
 *        (blur 30, saturate 180), le liseré plus lumineux en haut,
 *        et l'unique capsule rose TRANSLUCIDE.
 *
 * Il se lance comme les autres :  node tests/verif-p227.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §6 — LE VERRE, LU À LA SOURCE
 * ================================================================== */
titre("§6 — les règles de verre, littérales");
{
  const css = lire("src/app/globals.css");
  for (const nom of ["data-verre-fenetre", "data-verre-capsule", "data-verre-action"]) {
    const bloc = css.match(new RegExp(`\\[${nom}\\]\\s*\\{[^}]+\\}`))?.[0] ?? "";
    verif(`la règle [${nom}] existe`, bloc !== "");
    verif(
      `[${nom}] : la ligne PRÉFIXÉE d'abord, littérale`,
      bloc.includes("-webkit-backdrop-filter: blur(30px) saturate(180%);")
    );
    verif(
      `[${nom}] : la ligne non préfixée après elle`,
      bloc.includes("\n  backdrop-filter: blur(30px) saturate(180%);") &&
        bloc.indexOf("-webkit-backdrop-filter") <
          bloc.lastIndexOf("  backdrop-filter:")
    );
    verif(`[${nom}] : aucun var() dans le filtre`, !/backdrop-filter:[^;]*var\(/.test(bloc));
    //  Le piège du @supports : la règle ne doit pas vivre dedans.
    const avant = css.slice(0, css.indexOf(`[${nom}]`));
    const ouvertures = (avant.match(/@supports[^{]*\{/g) ?? []).length;
    verif(
      `[${nom}] : hors de tout @supports`,
      ouvertures === 0 || (avant.match(/\}/g) ?? []).length >= ouvertures * 2
    );
  }
  const plaque = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    //  ⚠️ 40 % depuis la nº 229-§5 (60 % à la nº 227).
    "la plaque : anthracite à 40 %",
    plaque.includes("background-color: rgba(26, 26, 29, 0.4);")
  );
  verif(
    "le liseré : plus lumineux en haut qu'ailleurs (deux ombres internes)",
    //  ⚠️ ATTÉNUÉ à la nº 229-§5 : 0,16 / 0,06 (0,32 / 0,12 à la 227).
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.16\)/.test(plaque) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.06\)/.test(plaque)
  );
  const action = css.match(/\[data-verre-action\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "l'action finale : rose TRANSLUCIDE, jamais un aplat",
    /background-color: rgba\(238, 61, 111, 0\.\d+\);/.test(action)
  );
}

/* ==================================================================
 * §1 à §5 — LA FICHE DE DÉMONSTRATION, AU LARGE (1440 px)
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
  nonJoue("§1 à §5 (1440 px)", "la fiche de démonstration n'a pas répondu");
} else {
  titre("§1 et §2 — pastilles et respiration (1440 px)");
  {
    const mesures = await web.evaluate(() => {
      const photoProfil = document.querySelector('main span[class*="h-[92px]"]');
      const equipe = [...document.querySelectorAll("main ul")].find((ul) =>
        /Fondateur|Résident|Guest/.test(ul.textContent)
      );
      if (!equipe) return null;
      const lignes = [...equipe.querySelectorAll(":scope > li")];
      const premiere = lignes[0]?.querySelector("a, div");
      const pastille = premiere?.querySelector("span.rounded-full");
      const texte = pastille?.nextElementSibling;
      if (!pastille || !texte) return null;
      const bp = pastille.getBoundingClientRect();
      const bt = texte.getBoundingClientRect();
      const rects = lignes.map((li) => li.getBoundingClientRect());
      const precedent = equipe.previousElementSibling?.getBoundingClientRect();
      return {
        photoProfil: photoProfil
          ? Math.round(photoProfil.getBoundingClientRect().height)
          : 0,
        pastille: Math.round(bp.height),
        pastilleLargeur: Math.round(bp.width),
        ecartPastilleTexte: Math.round(bt.left - bp.right),
        centres: Math.abs((bp.top + bp.bottom) / 2 - (bt.top + bt.bottom) / 2),
        entreLignes:
          rects.length > 1 ? Math.round(rects[1].top - rects[0].bottom) : null,
        auDessus: precedent ? Math.round(rects[0].top - precedent.bottom) : null,
      };
    });
    verif("la fiche expose une équipe mesurable", mesures !== null);
    if (mesures) {
      verif(
        "la pastille fait 52 × 52 px",
        mesures.pastille === 52 && mesures.pastilleLargeur === 52,
        `${mesures.pastilleLargeur}×${mesures.pastille}`
      );
      verif(
        "la photo de profil reste à 92 px",
        mesures.photoProfil === 92,
        `${mesures.photoProfil} px`
      );
      verif(
        "le texte est CENTRÉ sur sa pastille (± 2 px)",
        mesures.centres <= 2,
        `écart des centres ${mesures.centres.toFixed(1)} px`
      );
      verif(
        "14 px entre la pastille et son texte",
        mesures.ecartPastilleTexte === 14,
        `${mesures.ecartPastilleTexte} px`
      );
      if (mesures.entreLignes === null) {
        nonJoue("§2 · 32 px entre deux lignes", "une seule ligne d'équipe ici");
      } else {
        verif(
          //  ⚠️ 32 px depuis la nº 229-§2 (20 à la nº 227).
          "32 px entre deux lignes à pastille",
          mesures.entreLignes === 32,
          `${mesures.entreLignes} px`
        );
      }
      verif(
        "32 px au-dessus de la première ligne (nº 229-§2)",
        mesures.auDessus === 32,
        `${mesures.auDessus} px`
      );
    }
  }

  titre("§3 — les icônes des réseaux sur leur disque blanc");
  {
    const icones = await web.evaluate(() => {
      const liens = [...document.querySelectorAll('main a[target="_blank"]')];
      const de = (mot) => liens.find((a) => a.textContent.trim() === mot);
      const mesure = (a) => {
        if (!a) return null;
        const colonne = a.querySelector("span");
        const disque = a.querySelector("span span.rounded-full, span.rounded-full");
        const img = a.querySelector("img");
        const style = disque ? getComputedStyle(disque) : null;
        return {
          colonne: Math.round(colonne.getBoundingClientRect().width),
          disque: Boolean(disque),
          fondDisque: style?.backgroundColor ?? "",
          rond: style ? style.borderRadius !== "0px" : false,
          image: img ? Math.round(img.getBoundingClientRect().width) : 0,
        };
      };
      const site = liens.find(
        (a) => !["Instagram", "TikTok"].includes(a.textContent.trim())
      );
      return {
        instagram: mesure(de("Instagram")),
        tiktok: mesure(de("TikTok")),
        siteBrut: site
          ? {
              colonne: Math.round(
                site.querySelector("span").getBoundingClientRect().width
              ),
              disqueBlanc: Boolean(
                [...site.querySelectorAll("span")].find(
                  (s) => getComputedStyle(s).backgroundColor === "rgb(255, 255, 255)"
                )
              ),
              image: Math.round(
                site.querySelector("img").getBoundingClientRect().width
              ),
            }
          : null,
      };
    }).catch(() => null);
    if (!icones || !icones.instagram || !icones.tiktok) {
      nonJoue("§3", "les liens de réseaux ne sont pas sur cette fiche");
    } else {
      for (const [nom, mesure] of [
        ["Instagram", icones.instagram],
        ["TikTok", icones.tiktok],
      ]) {
        verif(
          //  ⚠️ 15 px depuis la nº 229-§4 : un liseré de 1,5 px, pas plus.
          `${nom} : un DISQUE BLANC PLEIN de 18 px, l'icône à 15 dedans`,
          mesure.disque &&
            mesure.rond &&
            mesure.fondDisque === "rgb(255, 255, 255)" &&
            mesure.colonne === 18 &&
            mesure.image === 15,
          `colonne ${mesure.colonne} · image ${mesure.image} · fond ${mesure.fondDisque}`
        );
      }
      if (icones.siteBrut) {
        verif(
          //  ⚠️ 16 px depuis la nº 229-§4 (un cran plus petite).
          "site.png : la même colonne de 18 px, SANS disque",
          icones.siteBrut.colonne === 18 &&
            !icones.siteBrut.disqueBlanc &&
            icones.siteBrut.image === 16,
          `colonne ${icones.siteBrut.colonne} · image ${icones.siteBrut.image}`
        );
      }
    }
  }

  titre("§4 — les deux lignes de liens");
  {
    const lignes = await web.evaluate(() => {
      const instagram = [...document.querySelectorAll("main a")].find(
        (a) => a.textContent.trim() === "Instagram"
      );
      const bloc = instagram?.closest('div[class*="flex-col"]');
      if (!bloc) return null;
      return [...bloc.children].map((rangee) =>
        [...rangee.querySelectorAll("a")].map((a) => a.textContent.trim())
      );
    });
    if (!lignes) {
      nonJoue("§4", "le bloc des liens est introuvable sur cette fiche");
    } else {
      verif(
        "deux lignes : les sites, puis Instagram et TikTok ensemble",
        lignes.length === 2 &&
          lignes[0].length === 2 &&
          lignes[0].every((t) => !["Instagram", "TikTok"].includes(t)) &&
          JSON.stringify(lignes[1]) === JSON.stringify(["Instagram", "TikTok"]),
        JSON.stringify(lignes)
      );
    }
  }

  titre("§5 — le survol, sans rose");
  {
    //  L'ADRESSE — la couleur ne change pas, le fond s'éclaircit, le
    //  soulignement apparaît.
    const adresse = web.locator('main a[href*="google.com/maps"]').first();
    if ((await adresse.count()) === 0) {
      nonJoue("§5 · adresse", "aucune adresse cliquable");
    } else {
      const repos = await adresse.evaluate((n) => {
        const s = getComputedStyle(n);
        return { couleur: s.color, fond: s.backgroundColor, soulignement: s.textDecorationLine };
      });
      await adresse.hover();
      await web.waitForTimeout(250);
      const survol = await adresse.evaluate((n) => {
        const s = getComputedStyle(n);
        return { couleur: s.color, fond: s.backgroundColor, soulignement: s.textDecorationLine };
      });
      verif(
        "adresse : la couleur du texte ne change JAMAIS",
        repos.couleur === survol.couleur,
        `${repos.couleur} → ${survol.couleur}`
      );
      verif(
        "adresse : aucun rose, ni au repos ni au survol",
        !repos.couleur.includes("238, 61") && !survol.couleur.includes("238, 61") &&
          !survol.fond.includes("238, 61")
      );
      verif(
        "adresse : le fond s'éclaircit au survol",
        repos.fond !== survol.fond,
        `${repos.fond} → ${survol.fond}`
      );
      verif(
        "adresse : le fin soulignement décalé apparaît",
        !repos.soulignement.includes("underline") &&
          survol.soulignement.includes("underline")
      );
    }

    //  LA LIGNE D'ÉQUIPE — le même geste.
    const membre = web
      .locator('main a[href="/tatoueur/nadege-roux-villeurbanne"]')
      .first();
    if ((await membre.count()) === 0) {
      nonJoue("§5 · équipe", "aucun membre d'équipe avec fiche");
    } else {
      await membre.scrollIntoViewIfNeeded();
      const repos = await membre.evaluate((n) => {
        const nom = n.querySelector("p span");
        return {
          fond: getComputedStyle(n).backgroundColor,
          couleurNom: getComputedStyle(nom).color,
          soulignement: getComputedStyle(n.querySelector("p")).textDecorationLine,
        };
      });
      await membre.hover();
      await web.waitForTimeout(250);
      const survol = await membre.evaluate((n) => {
        const nom = n.querySelector("p span");
        return {
          fond: getComputedStyle(n).backgroundColor,
          couleurNom: getComputedStyle(nom).color,
          soulignement: getComputedStyle(n.querySelector("p")).textDecorationLine,
        };
      });
      verif(
        "équipe : le fond de la LIGNE s'éclaircit",
        repos.fond !== survol.fond,
        `${repos.fond} → ${survol.fond}`
      );
      verif(
        "équipe : la couleur du nom ne change pas, jamais de rose",
        repos.couleurNom === survol.couleurNom &&
          !survol.couleurNom.includes("238, 61")
      );
      verif(
        "équipe : le soulignement décalé apparaît",
        survol.soulignement.includes("underline")
      );
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §1/§4/§6 — LE RENDU EN ÉCRAN ÉTROIT (390 px)
 * ================================================================== */
titre("§1, §4 et §6 — l'écran étroit (390 px)");
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
    nonJoue("écran étroit", "la fiche de démonstration n'a pas répondu");
  } else {
    const etroit = await page.evaluate(() => {
      const pastille = [...document.querySelectorAll("main span.rounded-full")].find(
        (s) => Math.round(s.getBoundingClientRect().height) === 52
      );
      const photo = document.querySelector('main span[class*="h-[92px]"]');
      return {
        pastille52: Boolean(pastille),
        photo92: photo
          ? Math.round(photo.getBoundingClientRect().height) === 92
          : false,
      };
    });
    verif("les pastilles font 52 px au doigt aussi", etroit.pastille52);
    verif("la photo de profil reste à 92 px", etroit.photo92);

    //  §6 — LA FENÊTRE DE VERRE, OUVERTE POUR DE VRAI.
    const lien = page.locator('a[href*="google.com/maps"]').first();
    if ((await lien.count()) === 0) {
      nonJoue("§6", "aucune adresse cliquable sur cette fiche");
    } else {
      await lien.scrollIntoViewIfNeeded();
      await lien.click();
      const fenetre = page.locator("[data-verre-fenetre]");
      await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
      if ((await fenetre.count()) !== 1) {
        nonJoue("§6", "la fenêtre d'adresse ne s'est pas ouverte");
      } else {
        const verre = await page.evaluate(() => {
          const plaque = document.querySelector("[data-verre-fenetre]");
          const s = getComputedStyle(plaque);
          const action = document.querySelectorAll("[data-verre-action]");
          const sAction =
            action.length === 1 ? getComputedStyle(action[0]) : null;
          const capsules = [...document.querySelectorAll("[data-verre-capsule]")];
          const roses = [...plaque.querySelectorAll("a, button")].filter((n) =>
            getComputedStyle(n).backgroundColor.startsWith("rgba(238, 61, 111")
          );
          return {
            filtre: s.backdropFilter || s.webkitBackdropFilter || "",
            fond: s.backgroundColor,
            liseré: s.boxShadow.includes("inset"),
            actions: action.length,
            filtreAction: sAction
              ? sAction.backdropFilter || sAction.webkitBackdropFilter || ""
              : "",
            fondAction: sAction?.backgroundColor ?? "",
            capsules: capsules.length,
            filtreCapsule: capsules[0]
              ? getComputedStyle(capsules[0]).backdropFilter
              : "",
            roses: roses.length,
            copier: Boolean(
              [...plaque.querySelectorAll("button")].find((b) =>
                /^Copi/.test(b.textContent.trim())
              )
            ),
            //  ⚠️ LA CROIX (nº 229-§5) a remplacé le mot nu du bas.
            croix: (() => {
              const bouton = plaque.querySelector('button[aria-label="Fermer"]');
              if (!bouton || !bouton.querySelector("svg")) return false;
              const boite = bouton.getBoundingClientRect();
              const cadre = plaque.getBoundingClientRect();
              return (
                boite.top - cadre.top < 60 && cadre.right - boite.right < 60
              );
            })(),
          };
        });
        verif(
          "la plaque : blur(30px) et saturate(1.8) appliqués",
          verre.filtre.includes("blur(30px)") && verre.filtre.includes("saturate(1.8)"),
          verre.filtre
        );
        verif(
          "la plaque : anthracite à 60 %",
          verre.fond === "rgba(26, 26, 29, 0.4)",
          verre.fond
        );
        verif("le liseré interne est là", verre.liseré);
        verif(
          "les badges et « Copier » sont des capsules de verre",
          verre.capsules >= 2 &&
            verre.filtreCapsule.includes("saturate(1.8)"),
          `${verre.capsules} capsule(s)`
        );
        verif(
          "UNE seule capsule rose — et elle est TRANSLUCIDE",
          verre.actions === 1 && verre.roses === 1 &&
            verre.fondAction.startsWith("rgba(238, 61, 111"),
          verre.fondAction
        );
        verif(
          "et c'est du verre teinté (mêmes flou et saturation)",
          verre.filtreAction.includes("blur(30px)") &&
            verre.filtreAction.includes("saturate(1.8)"),
          verre.filtreAction
        );
        verif("« Copier » est là", verre.copier);
        verif("la croix de fermeture, en haut à droite (nº 229-§5)", verre.croix);
      }
    }
  }

  //  §4 — L'EXCEPTION : sans TikTok, Instagram remonte en ligne 1.
  try {
    await page.goto(`${BASE}/tatoueur/nadege-roux-villeurbanne`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    const exception = await page.evaluate(() => {
      const instagram = [...document.querySelectorAll("main a")].find(
        (a) => a.textContent.trim() === "Instagram"
      );
      const bloc = instagram?.closest('div[class*="flex-col"]');
      if (!bloc) return null;
      const rangees = [...bloc.children].map((r) =>
        [...r.querySelectorAll("a")].map((a) => a.textContent.trim())
      );
      return { rangees, tiktok: rangees.flat().includes("TikTok") };
    });
    if (!exception) {
      nonJoue("§4 · exception", "le bloc des liens est introuvable chez Nadège");
    } else {
      verif(
        "sans TikTok, Instagram est sur la PREMIÈRE ligne",
        !exception.tiktok &&
          exception.rangees.length === 1 &&
          exception.rangees[0].includes("Instagram"),
        JSON.stringify(exception.rangees)
      );
    }
  } catch {
    nonJoue("§4 · exception", "la fiche de Nadège n'a pas répondu");
  }
  await contexte.close();
}

await navigateur.close();
bilan();
