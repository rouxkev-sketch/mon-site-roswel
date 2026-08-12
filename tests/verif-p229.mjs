/**
 * LE BANC DE LA PASSE Nº 229 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §6
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §6 :
 *   §1 — un texte de quatre lignes à côté d'une pastille ne dépasse
 *        pas d'un pixel au-dessus d'elle ; la pastille est IDENTIQUE
 *        au pixel avant et après avoir déplié le volet des horaires ;
 *   §2 — 32 px entre deux lignes à pastille ;
 *   §3 — 16 px entre les deux lignes de liens ;
 *   §4 — le liseré blanc des icônes de réseaux ne dépasse pas 1,5 px,
 *        site.png n'est pas rognée (`object-contain`) ;
 *   §5 — la fenêtre d'adresse : la croix en haut à droite, deux
 *        badges de dimensions identiques, un fond à 40 %, un liseré
 *        atténué.
 *
 * Il se lance comme les autres :  node tests/verif-p229.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * LES MÉCANIQUES, LUES À LA SOURCE
 * ================================================================== */
titre("§1 et §5 — les mécaniques, à la source");
{
  const bloc = lire("src/components/BlocLieux.tsx");
  verif(
    "plus AUCUN items-center sur une ligne à pastille",
    !/flex items-center gap-3\.5/.test(bloc)
  );
  verif(
    "la colonne de texte porte la bascule de la nº 225 (min-h + centrage)",
    (bloc.match(/min-h-13 min-w-0 flex-1 flex-col justify-center/g) ?? [])
      .length >= 3
  );
  const css = lire("src/app/globals.css");
  const plaque = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "la plaque : anthracite à 40 %, filtre littéral inchangé",
    plaque.includes("background-color: rgba(26, 26, 29, 0.4);") &&
      plaque.includes("-webkit-backdrop-filter: blur(30px) saturate(180%);")
  );
  const action = css.match(/\[data-verre-action\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "l'action finale : rose à 45 %, en verre",
    action.includes("background-color: rgba(238, 61, 111, 0.45);") &&
      action.includes("backdrop-filter: blur(30px) saturate(180%);")
  );
  verif(
    "le liseré atténué garde sa nuance haut/bas",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.16\)/.test(plaque) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.06\)/.test(plaque)
  );
}

/* ==================================================================
 * §1 à §4 — LA FICHE DE DÉMONSTRATION (1440 px)
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
  nonJoue("§1 à §4 (1440 px)", "la fiche de démonstration n'a pas répondu");
} else {
  titre("§1 — la pastille ancrée, le texte jamais au-dessus");
  {
    //  UN TEXTE DE QUATRE LIGNES, injecté dans une ligne d'équipe : le
    //  DOM réel, la mécanique CSS réelle.
    const mesure = await web.evaluate(() => {
      const equipe = [...document.querySelectorAll("main ul")].find((ul) =>
        /Fondateur|Résident|Guest/.test(ul.textContent)
      );
      const ligne = equipe?.querySelector(":scope > li a, :scope > li div");
      const pastille = ligne?.querySelector("span.rounded-full");
      const texte = pastille?.nextElementSibling?.querySelector("p");
      if (!ligne || !pastille || !texte) return null;
      const avant = pastille.getBoundingClientRect();
      texte.textContent =
        "Un rôle démesurément long qui occupe quatre pleines lignes de texte " +
        "pour éprouver la bascule de centrage : la pastille ne doit pas bouger " +
        "d'un pixel et pas un mot ne doit s'écrire au-dessus de son bord haut, " +
        "à aucune largeur de fenêtre.";
      const apres = pastille.getBoundingClientRect();
      const bloc = pastille.nextElementSibling.getBoundingClientRect();
      const lignesDeTexte = Math.round(
        texte.getBoundingClientRect().height /
          parseFloat(getComputedStyle(texte).lineHeight)
      );
      return {
        pastilleABouge: Math.abs(apres.top - avant.top),
        depassementHaut: avant.top - bloc.top,
        blocPlusHaut: bloc.height > apres.height,
        lignesDeTexte,
      };
    });
    if (!mesure) {
      nonJoue("§1 · texte long", "aucune ligne d'équipe mesurable");
    } else {
      verif(
        `le texte (${mesure.lignesDeTexte} lignes) ne dépasse PAS au-dessus de la pastille`,
        mesure.depassementHaut <= 0.5 && mesure.blocPlusHaut,
        `sommet du bloc à ${mesure.depassementHaut.toFixed(1)} px du haut de la pastille`
      );
      verif(
        "la pastille n'a pas bougé d'un pixel quand le texte a grandi",
        mesure.pastilleABouge <= 0.5,
        `${mesure.pastilleABouge.toFixed(1)} px`
      );
    }

    //  LE VOLET DES HORAIRES : la pastille de l'adresse, au pixel.
    await web.reload({ waitUntil: "domcontentloaded" });
    await web.waitForSelector("main h1", { timeout: 30000 });
    await web.waitForTimeout(2000);
    const chevron = web.locator("main button[aria-expanded]").first();
    if ((await chevron.count()) === 0) {
      nonJoue("§1 · volet des horaires", "aucun volet d'horaires sur cette fiche");
    } else {
      const pastilleAdresse = () =>
        web.evaluate(() => {
          //  ⚠️ nº 232-§1 : la pastille vit DANS le lien d'adresse
          //  (l'encadré l'enveloppe), le chevron vit APRÈS lui.
          const lien = document.querySelector('main a[href*="google.com/maps"]');
          const pastille = lien?.querySelector("span.rounded-full");
          return pastille
            ? Math.round(pastille.getBoundingClientRect().top * 10) / 10
            : null;
        });
      const avant = await pastilleAdresse();
      await chevron.click();
      await web.waitForTimeout(400);
      const apres = await pastilleAdresse();
      verif(
        "déplier les horaires laisse la pastille AU PIXEL EXACT",
        avant !== null && apres !== null && avant === apres,
        `${avant} → ${apres}`
      );
      //  On referme : la suite du banc mesure la fiche au repos.
      await chevron.click();
      await web.waitForTimeout(300);
    }
  }

  titre("§2 et §3 — les respirations");
  {
    const espaces = await web.evaluate(() => {
      const equipe = [...document.querySelectorAll("main ul")].find((ul) =>
        /Fondateur|Résident|Guest/.test(ul.textContent)
      );
      const lignes = equipe ? [...equipe.querySelectorAll(":scope > li")] : [];
      const rects = lignes.map((li) => li.getBoundingClientRect());
      const precedent = equipe?.previousElementSibling?.getBoundingClientRect();
      const instagram = [...document.querySelectorAll("main a")].find(
        (a) => a.textContent.trim() === "Instagram"
      );
      const blocLiens = instagram?.closest('div[class*="flex-col"]');
      const rangees = blocLiens ? [...blocLiens.children] : [];
      return {
        entreLignes:
          rects.length > 1 ? Math.round(rects[1].top - rects[0].bottom) : null,
        auDessus: precedent
          ? Math.round(rects[0].top - precedent.bottom)
          : null,
        entreLiens:
          rangees.length === 2
            ? Math.round(
                rangees[1].getBoundingClientRect().top -
                  rangees[0].getBoundingClientRect().bottom
              )
            : null,
      };
    });
    verif(
      "32 px entre deux lignes à pastille",
      espaces.entreLignes === 32,
      `${espaces.entreLignes} px`
    );
    verif(
      "32 px au-dessus de la première ligne d'équipe",
      espaces.auDessus === 32,
      `${espaces.auDessus} px`
    );
    verif(
      "16 px entre les deux lignes de liens",
      espaces.entreLiens === 16,
      `${espaces.entreLiens} px`
    );
  }

  titre("§4 — les icônes, au poids près");
  {
    const icones = await web.evaluate(() => {
      const liens = [...document.querySelectorAll('main a[target="_blank"]')];
      const de = (mot) => liens.find((a) => a.textContent.trim() === mot);
      const reseau = (a) => {
        if (!a) return null;
        const disque = a.querySelector("span span.rounded-full");
        const img = disque?.querySelector("img");
        if (!disque || !img) return null;
        const bd = disque.getBoundingClientRect();
        const bi = img.getBoundingClientRect();
        return {
          disque: Math.round(bd.width),
          icone: Math.round(bi.width * 10) / 10,
          couronne: Math.round(((bd.width - bi.width) / 2) * 100) / 100,
        };
      };
      const site = liens.find(
        (a) => !["Instagram", "TikTok"].includes(a.textContent.trim())
      );
      const imgSite = site?.querySelector("img");
      return {
        instagram: reseau(de("Instagram")),
        tiktok: reseau(de("TikTok")),
        site: imgSite
          ? {
              largeur: Math.round(imgSite.getBoundingClientRect().width),
              ajustement: getComputedStyle(imgSite).objectFit,
              colonne: Math.round(
                site.querySelector("span").getBoundingClientRect().width
              ),
            }
          : null,
      };
    });
    for (const [nom, m] of [
      ["Instagram", icones.instagram],
      ["TikTok", icones.tiktok],
    ]) {
      if (!m) {
        nonJoue(`§4 · ${nom}`, "le lien n'est pas sur cette fiche");
        continue;
      }
      verif(
        `${nom} : un liseré de blanc d'1,5 px, pas davantage`,
        m.disque === 18 && m.couronne <= 1.5,
        `disque ${m.disque} · icône ${m.icone} · couronne ${m.couronne} px`
      );
    }
    if (!icones.site) {
      nonJoue("§4 · site.png", "aucun lien de site sur cette fiche");
    } else {
      verif(
        "site.png : un cran plus petite (16 px), JAMAIS coupée",
        icones.site.largeur === 16 &&
          icones.site.ajustement === "contain" &&
          icones.site.colonne === 18,
        `${icones.site.largeur} px · object-fit ${icones.site.ajustement}`
      );
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §5 — LA FENÊTRE D'ADRESSE, AU DOIGT (390 px)
 * ================================================================== */
titre("§5 — la fenêtre d'adresse (390 px)");
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
    nonJoue("§5", "la fiche de démonstration n'a pas répondu");
  } else {
    const lien = page.locator('a[href*="google.com/maps"]').first();
    await lien.scrollIntoViewIfNeeded();
    await lien.click();
    const fenetre = page.locator("[data-verre-fenetre]");
    await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
    if ((await fenetre.count()) !== 1) {
      nonJoue("§5", "la fenêtre d'adresse ne s'est pas ouverte");
    } else {
      const mesure = await page.evaluate(() => {
        const plaque = document.querySelector("[data-verre-fenetre]");
        const style = getComputedStyle(plaque);
        const cadre = plaque.getBoundingClientRect();
        //  ⚠️ nº 231-§2 : PLUS AUCUNE croix — la fenêtre est
        //  dépouillée, seul le voile referme.
        const croix = plaque.querySelector('button[aria-label="Fermer"]');
        const copier = [...plaque.querySelectorAll("button")].find((b) =>
          /^(Copier l'adresse|Adresse copiée)$/.test(b.textContent.trim())
        );
        const maps = plaque.querySelector("[data-verre-action]");
        const bc = copier?.getBoundingClientRect();
        const bm = maps?.getBoundingClientRect();
        const motNu = [...plaque.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === "Fermer"
        );
        return {
          fond: style.backgroundColor,
          liseré: style.boxShadow,
          sansCroix: !croix,
          motNu,
          copierAuDessus: bc && bm ? bc.bottom <= bm.top : false,
          memesDimensions:
            bc && bm
              ? Math.abs(bc.width - bm.width) <= 1 &&
                Math.abs(bc.height - bm.height) <= 1 &&
                getComputedStyle(copier).borderRadius ===
                  getComputedStyle(maps).borderRadius
              : false,
          libelle: copier?.textContent.trim() ?? "(absent)",
          fondMaps: maps ? getComputedStyle(maps).backgroundColor : "",
          filtreMaps: maps ? getComputedStyle(maps).backdropFilter : "",
        };
      });
      verif(
        "le fond est à 40 % — on devine la page derrière",
        mesure.fond === "rgba(26, 26, 29, 0.4)",
        mesure.fond
      );
      verif(
        "le liseré est ATTÉNUÉ (0,16 en haut), nuance gardée",
        mesure.liseré.includes("0.16") && mesure.liseré.includes("0.06"),
        mesure.liseré.slice(0, 80)
      );
      verif(
        //  ⚠️ Dépouillée à la nº 231-§2 : ni croix, ni mot — le voile
        //  seul referme (vérifié plus bas).
        "ni croix ni mot « Fermer » dans la fenêtre (nº 231-§2)",
        mesure.sansCroix && !mesure.motNu
      );
      verif(
        "« Copier l'adresse » et « Ouvrir dans Google Maps » : jumeaux, empilés",
        mesure.copierAuDessus && mesure.memesDimensions,
        `« ${mesure.libelle} »`
      );
      verif(
        "l'ouverture est du verre teinté rose à 45 %",
        mesure.fondMaps === "rgba(238, 61, 111, 0.45)" &&
          mesure.filtreMaps.includes("saturate(1.8)"),
        `${mesure.fondMaps} · ${mesure.filtreMaps}`
      );

      //  LE MOT CHANGE APRÈS L'APPUI — puis la fenêtre se referme
      //  SEULE (nº 232-§2, 600 ms de lecture).
      const copier = fenetre.getByRole("button", { name: "Copier l'adresse" });
      if ((await copier.count()) === 1) {
        await copier.click();
        await page.waitForTimeout(300);
        verif(
          "après l'appui, le mot devient « Adresse copiée »",
          (await fenetre
            .getByRole("button", { name: "Adresse copiée" })
            .count()) === 1
        );
        await page.waitForTimeout(900);
        verif(
          "et la fenêtre se referme seule (nº 232-§2)",
          (await page.locator("[data-verre-fenetre]").count()) === 0
        );
      }

      //  LE VOILE REFERME AUSSI — on rouvre pour l'éprouver.
      await lien.scrollIntoViewIfNeeded();
      await lien.click();
      await page.locator("[data-verre-fenetre]").waitFor({ timeout: 5000 }).catch(() => {});
      await page
        .locator('button[aria-label="Fermer"]')
        .first()
        .click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
      verif(
        "un appui à côté referme la fenêtre",
        (await page.locator("[data-verre-fenetre]").count()) === 0
      );
    }
  }
  await contexte.close();
}

await navigateur.close();
bilan();
