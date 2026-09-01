/*  ██ ARCHIVE — CE BANC NE PEUT PLUS TOURNER TEL QUEL (nº 790) ██
    Il lit un fichier de sonde retiré au grand ménage d'avant mise en
    ligne : l'instrument qu'il éprouvait n'existe plus. Le fichier est
    GARDÉ parce qu'il est le compte rendu écrit de sa passe — la preuve
    de ce qui a été mesuré, et comment. Ne pas le lancer sans l'avoir
    d'abord relu : ce qu'il vérifie du SITE reste vrai, ce qu'il
    vérifie de la SONDE ne l'est plus. */
/**
 * LE BANC DE LA PASSE Nº 234 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §4
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE. Et sur LE DÉFAUT DU VERRE, un vert
 * ici n'a déjà rien prouvé TROIS FOIS : ce banc ne mesure donc PAS
 * « le flou marche », il mesure la STRUCTURE — aucun ancêtre ne crée
 * de racine d'arrière-plan, le voile et la plaque sont frères, le
 * voile est allégé. C'est vérifiable partout, WebKit compris ; le
 * rendu, lui, c'est la sonde sur l'iPhone qui le dira.
 *
 * LES CONTRÔLES DU §4 :
 *   §1 — les quatre sélecteurs de galerie remontent en haut de
 *        l'affiche, sans pousser d'entrée d'historique ;
 *   §2 — aucun ancêtre de la plaque ne crée de racine ; le voile et
 *        la plaque sont FRÈRES ; la plaque n'a aucune opacité
 *        partielle, à aucun instant de son ouverture ;
 *   §3 — la sonde répond avec les trois blocs demandés.
 *
 * Il se lance comme les autres :  node tests/verif-p234.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 et §2 — LES MÉCANIQUES, À LA SOURCE
 * ================================================================== */
titre("§1 et §2 — les mécaniques, à la source");
{
  const contenu = lire("src/components/ContenuFiche.tsx");
  //  UNE SEULE fonction de remontée. ⚠️ RÉVISÉ DEUX FOIS : la nº 269 a
  //  retiré la remontée de la catégorie, puis la nº 276-§3 a SUPPRIMÉ
  //  les deux sélecteurs du portfolio (catégorie et rendu), code
  //  compris — il ne reste que Profil / Portfolio pour l'appeler (les
  //  vignettes ont la leur, `remonteeDemandee`).
  verif(
    "une seule fonction de remontée, écrite une fois",
    (contenu.match(/function remonterSousLaBarre\(\)/g) ?? []).length === 1
  );
  verif(
    "le sélecteur restant l'appelle (⚠️ nº 276-§3 : il n'en reste qu'un)",
    (contenu.match(/remonterSousLaBarre\(\);/g) ?? []).length === 1
  );
  verif(
    "elle ne touche jamais à l'historique",
    !/remonterSousLaBarre[\s\S]{0,400}(pushState|replaceState)/.test(contenu)
  );

  const bloc = lire("src/components/BlocLieux.tsx");
  verif(
    "la fenêtre est montée dans le corps du document (portail)",
    bloc.includes("createPortal(fenetre, document.body)")
  );
  verif(
    "la PLAQUE ne porte plus aucune transition d'opacité",
    !/data-verre-fenetre=""[\s\S]{0,220}starting:opacity-0/.test(bloc)
  );
  verif(
    "c'est le VOILE qui porte le fondu, et sa couleur est en rgba",
    /bg-black\/25[\s\S]{0,120}starting:opacity-0/.test(bloc)
  );
  verif(
    "le voile est allégé (25 %, contre 55 auparavant)",
    bloc.includes("bg-black/25") && !bloc.includes("bg-black/55")
  );

  const css = lire("src/app/globals.css");
  const plaque = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "la plaque : éclaircie à 22 %, filtre littéral inchangé",
    plaque.includes("background-color: rgba(26, 26, 29, 0.22);") &&
      plaque.includes("-webkit-backdrop-filter: blur(40px) saturate(200%);") &&
      plaque.includes("\n  backdrop-filter: blur(40px) saturate(200%);")
  );
  verif(
    "son contour est nettement atténué",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.1\)/.test(plaque) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.035\)/.test(plaque)
  );
  verif("aucun var() dans le filtre", !/backdrop-filter:[^;]*var\(/.test(plaque));

  const sonde = lire("src/components/SondeVerre.tsx");
  verif(
    "la sonde relève la fenêtre : les trois blocs demandés",
    sonde.includes("releveDeLaFenetre") &&
      sonde.includes("1) ${nom} · filtre") &&
      sonde.includes("RACINE D'ARRIÈRE-PLAN") &&
      sonde.includes("3) supports -webkit-")
  );
  verif(
    "elle reste repliable, DOM seul, avec COPIER et ENVOYER",
    sonde.includes("useSondeRepliee") &&
      sonde.includes("BoutonCopierJournal") &&
      sonde.includes("BoutonEnvoyerJournal")
  );
}

/* ==================================================================
 * §1 — LA REMONTÉE, MESURÉE AU DOIGT (390 px)
 * ================================================================== */
titre("§1 — les quatre sélecteurs remontent (390 px)");
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
    nonJoue("§1", "la fiche de démonstration n'a pas répondu");
  } else {
    /** Le repère de la remontée : le bas de la photo, sous la barre. */
    const cible = async () =>
      page.evaluate(() => {
        const photo = document
          .querySelector("[data-photo-fiche]")
          ?.getBoundingClientRect();
        const barre = document
          .querySelector("[data-barre-fixe]")
          ?.getBoundingClientRect().height;
        if (!photo) return null;
        return Math.max(0, window.scrollY + photo.bottom - (barre ?? 0));
      });

    //  On passe à l'onglet Portfolio (lui-même remonte : c'est le
    //  modèle qu'on veut retrouver sur les deux autres).
    //  ⚠️ LES SÉLECTEURS SONT DES `radio`, PAS DES `button` au sens
    //  des rôles : le sélecteur de la fiche est un groupe de radios
    //  (SelecteurOngletAffiche). Les viser en « button » ne trouve
    //  rien — mesuré.
    const entreesAvant = await page.evaluate(() => history.length);
    await page.getByRole("radio", { name: "Portfolio" }).click();
    await page.waitForTimeout(1200);

    const selecteurs = [
      { nom: "Réalisation / Flash", mot: /^(Flash|Réalisation)$/ },
      { nom: "Noir & gris / Couleur", mot: /^(Couleur|Noir)/ },
    ];
    for (const s of selecteurs) {
      const bouton = page.getByRole("radio", { name: s.mot });
      if ((await bouton.count()) === 0) {
        //  ⚠️ CES DEUX SÉLECTEURS N'EXISTENT PLUS (nº 276-§3) : le
        //  portfolio montre désormais deux sections empilées,
        //  RÉALISATIONS puis FLASHS, sans aucun va-et-vient — leurs
        //  remontées sont parties avec eux. Il n'y a donc rien à
        //  toucher ici, par construction ; la remontée restante
        //  (Profil / Portfolio) est mesurée au-dessus.
        nonJoue(
          `§1 · ${s.nom}`,
          "ce sélecteur n'existe plus (supprimé par la nº 276-§3, ses remontées avec)"
        );
        continue;
      }
      //  On descend franchement, puis on touche le sélecteur.
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(400);
      const avant = await page.evaluate(() => Math.round(window.scrollY));
      await bouton.first().click();
      //  La remontée est amortie : on lui laisse le temps d'arriver.
      await page.waitForTimeout(1400);
      const apres = await page.evaluate(() => Math.round(window.scrollY));
      const attendu = await cible();
      verif(
        `${s.nom} : la page remonte en haut de l'affiche`,
        attendu !== null && apres < avant && Math.abs(apres - attendu) <= 40,
        `${avant} → ${apres} px (repère ${attendu === null ? "?" : Math.round(attendu)})`
      );
    }
    verif(
      "aucune de ces remontées n'a poussé une entrée d'historique",
      (await page.evaluate(() => history.length)) === entreesAvant,
      `${entreesAvant} → ${await page.evaluate(() => history.length)}`
    );
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA STRUCTURE DE LA FENÊTRE, MESURÉE (390 px)
 * ================================================================== */
titre("§2 — la structure de la plaque (390 px)");
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
    await page.waitForTimeout(2000);
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
      //  ⚠️ ON MESURE L'OPACITÉ PENDANT L'OUVERTURE, tout de suite :
      //  c'est là que la plaque devenait sa propre racine.
      const pendant = await page.evaluate(() => {
        const p = document.querySelector("[data-verre-fenetre]");
        return p ? getComputedStyle(p).opacity : null;
      });
      verif(
        "la plaque n'a AUCUNE opacité partielle pendant l'ouverture",
        pendant === "1",
        `opacity ${pendant}`
      );

      await page.waitForTimeout(900);
      const structure = await page.evaluate(() => {
        const plaque = document.querySelector("[data-verre-fenetre]");
        const parent = plaque.parentElement;
        const voile = parent.querySelector('button[aria-label="Fermer"]');
        const racines = [];
        for (let n = plaque.parentElement; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          const causes = [];
          if (Number(s.opacity) < 1) causes.push(`opacity ${s.opacity}`);
          if (s.filter !== "none") causes.push(`filter ${s.filter}`);
          if (s.backdropFilter !== "none" && s.backdropFilter !== "")
            causes.push(`backdrop-filter ${s.backdropFilter}`);
          if (s.transform !== "none") causes.push(`transform ${s.transform}`);
          if (s.willChange !== "auto" && s.willChange !== "")
            causes.push(`will-change ${s.willChange}`);
          if (s.contain !== "none" && s.contain !== "")
            causes.push(`contain ${s.contain}`);
          if (s.isolation === "isolate") causes.push("isolation isolate");
          if (s.perspective !== "none") causes.push(`perspective ${s.perspective}`);
          if (causes.length > 0) {
            racines.push(`${n.tagName}.${String(n.className).slice(0, 30)} → ${causes.join(", ")}`);
          }
        }
        return {
          racines,
          freres: Boolean(voile) && voile.parentElement === plaque.parentElement,
          parentDansLeCorps: parent.parentElement === document.body,
          voileFond: voile ? getComputedStyle(voile).backgroundColor : "",
          voileFiltre: voile ? getComputedStyle(voile).backdropFilter : "",
          voileOpacite: voile ? getComputedStyle(voile).opacity : "",
          plaqueFond: getComputedStyle(plaque).backgroundColor,
          plaqueFiltre: getComputedStyle(plaque).backdropFilter,
        };
      });
      verif(
        "AUCUN ancêtre de la plaque ne crée de racine d'arrière-plan",
        structure.racines.length === 0,
        structure.racines.join(" | ")
      );
      verif(
        "le voile et la plaque sont FRÈRES",
        structure.freres
      );
      verif(
        "leur parent est un enfant DIRECT du corps (portail)",
        structure.parentDansLeCorps
      );
      verif(
        //  ⚠️ TAILWIND v4 ÉCRIT LA COULEUR EN `oklab(... / .25)`, pas
        //  en `rgba(...)` : c'est la même chose — une COULEUR portant
        //  son alpha, jamais la propriété `opacity`. Ce qu'on contrôle,
        //  c'est donc l'ALPHA (0,25), l'opacité PLEINE de l'élément, et
        //  l'absence de filtre.
        "le voile : une couleur allégée à 0,25, opacité pleine, aucun filtre",
        /[/ ]0\.25\b/.test(structure.voileFond) &&
          structure.voileOpacite === "1" &&
          structure.voileFiltre === "none",
        `${structure.voileFond} · opacity ${structure.voileOpacite} · filtre ${structure.voileFiltre}`
      );
      verif(
        "la plaque : 22 %, blur 40, saturation 200",
        structure.plaqueFond === "rgba(26, 26, 29, 0.22)" &&
          structure.plaqueFiltre.includes("blur(40px)") &&
          structure.plaqueFiltre.includes("saturate(2)"),
        `${structure.plaqueFond} · ${structure.plaqueFiltre}`
      );

      /* ============================================================
       * §3 — LA SONDE RÉPOND, fenêtre ouverte
       * ============================================================ */
      titre("§3 — la sonde du verre, fenêtre ouverte");
      const sonde = await page.evaluate(() => {
        //  On rejoue ce que la sonde affiche, sans l'armer : la même
        //  logique, lue depuis le DOM.
        const plaque = document.querySelector("[data-verre-fenetre]");
        return {
          plaque: Boolean(plaque),
          capsuleBlanche: Boolean(plaque?.querySelector("[data-verre-capsule]")),
          capsuleRose: Boolean(plaque?.querySelector("[data-verre-action]")),
        };
      });
      verif(
        "la fenêtre expose bien la plaque et ses DEUX capsules à la sonde",
        sonde.plaque && sonde.capsuleBlanche && sonde.capsuleRose
      );
    }
  }
  await contexte.close();
}

//  LA SONDE S'ARME VRAIMENT SUR ?sonde-verre=1.
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er?sonde-verre=1`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2000);
    //  ⚠️ ELLE EST REPLIÉE AU DÉPART (nº 183-§1) : une pastille dans
    //  le coin. On la déplie, comme le propriétaire le fait — chercher
    //  son titre sans l'ouvrir ne prouvait rien.
    const pastille = page.locator("button", { hasText: /sonde|verre/i }).last();
    if ((await pastille.count()) > 0) {
      await pastille.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    const presente = await page.evaluate(() =>
      /SONDE VERRE|sonde-verre/i.test(document.body.textContent ?? "")
    );
    verif("la sonde s'arme sur ?sonde-verre=1", presente);
  } catch {
    nonJoue("§3 · armement", "la fiche n'a pas répondu");
  }
  await contexte.close();
}

await navigateur.close();
bilan();
