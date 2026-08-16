/**
 * BANC DE LA PASSE Nº 307 — LIVRAISON RAPIDE
 * ==================================================================
 * DEUX CORRECTIONS, ET UN RELEVÉ QU'ON NE DOIT PAS AVOIR TOUCHÉ.
 *
 * §1 — LE BADGE ET LES POINTS, SUR LA PHOTO D'UNE FICHE (WEB)
 *      Le badge du nombre de photos s'affiche EN BAS À DROITE, DANS la
 *      photo, avec la mécanique des trois secondes ; les points de
 *      défilement du bas disparaissent. C'est LE MÊME ÉLÉMENT que sur
 *      smartphone — le banc le prouve en vérifiant qu'il n'y a QU'UN
 *      SEUL `data-role="compteur"` écrit dans le fichier, et que le
 *      doigt garde le sien en haut à droite.
 *
 * §2 — « AUCUN RÉSULTAT »
 *      Une seule écriture (`AucunResultat`), appelée par LES DEUX
 *      endroits où le message vivait. Le titre seul, pas de phrase,
 *      deux capsules NON ROSES à leur taille naturelle — et aucune
 *      capsule là où elle ne ferait rien.
 *
 * §3 — CONSTAT SEUL : le banc vérifie qu'aucun cadre n'est APPARU
 *      autour de la photo (ni bordure, ni contour, ni ombre, ni
 *      arrondi) dans les deux contextes relevés. C'était un relevé,
 *      pas une correction : ce contrôle est là pour que ça le reste.
 *
 * ⚠️ UNE SEULE FENÊTRE DE MESURE : 1440 × 900. Les deux passages au
 * doigt (390 × 844) ne mesurent RIEN — ils vérifient seulement que le
 * badge n'a pas bougé de son angle et que le message s'affiche aussi
 * là : les deux consignes disent « web ET smartphone », les ignorer
 * ferait un banc qui ne prouve que la moitié de ce qui a été écrit.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const aucun = sansNotes(lire("src/components/AucunResultat.tsx"));
const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));
const styleVille = sansNotes(
  lire("src/app/(tatouage)/tatouage/[style]/[ville]/page.tsx")
);
const config = sansNotes(lire("src/config/tatouage.ts"));

const FICHE = "/tatoueur/studio-cameleon-bordeaux";
/** Une recherche localisée qui ne rend rien — au premier palier. */
const VIDE_AVEC_LIEU =
  "/?lieu=Nulle+part&lat=0.00000&lon=0.00000&niveau=ville&ville=Nulle+part&rayon=10";
/** La même, mais au DERNIER palier : plus rien à élargir. */
const VIDE_RAYON_MAX = VIDE_AVEC_LIEU.replace("rayon=10", "rayon=200");
/** Une recherche vide SANS AUCUN LIEU. */
const VIDE_SANS_LIEU = "/?style=abstrait&nature=flash";
/** La page indexable « style + ville » sans personne. */
const VIDE_INDEXABLE = "/tatouage/abstrait/bordeaux";

const ROSE = "rgb(238, 61, 111)";

/* ==================================================================
 * §1 — À LA SOURCE : un seul badge, écrit une seule fois
 * ================================================================== */
titre("§1 à la source — un seul badge, et les points réservés aux cartes");
{
  const nb = (carrousel.match(/data-role="compteur"/g) ?? []).length;
  verif(
    "un SEUL `data-role=\"compteur\"` dans le carrousel (pas de copie web)",
    nb === 1,
    `${nb} occurrence(s)`
  );
  verif(
    "le badge n'est plus réservé au doigt (`hidden mobile:inline-flex` parti)",
    !/hidden mobile:inline-flex/.test(carrousel)
  );
  verif(
    "le badge est en bas à droite au web, en haut à droite au doigt",
    /right-3\s+bottom-3\s+mobile:bottom-auto\s+mobile:top-3/.test(carrousel)
  );
  verif(
    "la pagination n'est rendue QUE sur une carte de mosaïque",
    /\{surCarte && n > 1 && !sansPoints && paginationWeb\(\)\}/.test(carrousel)
  );
  verif(
    "la mécanique des trois secondes est restée unique (un seul minuteur)",
    (carrousel.match(/setCompteurVisible\(false\), 3000/g) ?? []).length === 1
  );
}

/* ==================================================================
 * §2 — À LA SOURCE : une seule écriture du message
 * ================================================================== */
titre("§2 à la source — une seule écriture du message du vide");
{
  const ancienne =
    /Aucun tatoueur ne correspond|Personne n&apos;est encore référencé|Aucun tatoueur pour l'instant/;
  verif(
    "l'ancienne phrase de la mosaïque a disparu",
    !ancienne.test(index),
    "src/components/IndexTatoueurs.tsx"
  );
  verif(
    "l'ancienne phrase de la page « style + ville » a disparu",
    !/Personne n&apos;est encore référencé|Voir tous les tatoueurs/.test(
      styleVille
    ),
    "src/app/(tatouage)/tatouage/[style]/[ville]/page.tsx"
  );
  verif(
    "les DEUX endroits appellent la même écriture",
    /from "@\/components\/AucunResultat"/.test(index) &&
      /from "@\/components\/AucunResultat"/.test(styleVille)
  );
  verif(
    "le titre est « Aucun résultat », et il n'y a pas de phrase",
    /Aucun résultat<\/p>/.test(aucun) && !/Élargir le rayon, ou/.test(aucun)
  );
  verif(
    "les capsules ne sont pas roses (aucun `primaire` dans le dessin)",
    !/primaire/.test(aucun)
  );
  verif(
    "« Élargir le rayon » monte d'UN cran (rayonSuivant), jamais au maximum",
    /export function rayonSuivant/.test(config) &&
      /RAYONS_TATOUAGE\.find\(\(palier\) => palier > km\)/.test(config) &&
      /rayonSuivant\(affiches\.rayonKm\)/.test(index)
  );
  verif(
    "« Chercher partout » n'efface QUE le lieu",
    /chercher\(\{ \.\.\.affiches, lieu: null \}\)/.test(index)
  );
}

/* ==================================================================
 * EN VIVANT
 * ================================================================== */
const { nav, page } = await ouvrirLeNavigateur("p307", {
  width: 1440,
  height: 900,
});

/** Ce qui fait « cadre » autour d'une boîte — pour le §3. */
const CADRE = (el) => {
  const s = getComputedStyle(el);
  return {
    bordures: [
      s.borderTopWidth,
      s.borderRightWidth,
      s.borderBottomWidth,
      s.borderLeftWidth,
    ].join(" "),
    contour: `${s.outlineWidth} ${s.outlineStyle}`,
    ombre: s.boxShadow,
    arrondi: [
      s.borderTopLeftRadius,
      s.borderTopRightRadius,
      s.borderBottomRightRadius,
      s.borderBottomLeftRadius,
    ].join(" "),
    fond: s.backgroundColor,
  };
};

/* ---- §1 en vivant, la fiche pleine page (web) -------------------- */
titre("§1 en vivant — la fiche pleine page, 1440 × 900");
{
  await page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-carrousel="fiche"]');

  const releve = await page.evaluate(() => {
    const zone = document.querySelector("[data-photo-fiche]");
    const car = zone?.querySelector('[data-carrousel="fiche"]');
    const badge = car?.querySelector('[data-role="compteur"]');
    if (!car || !badge) return null;
    const p = car.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    const texte = badge.querySelector("span");
    return {
      affiche: getComputedStyle(badge).display !== "none",
      texte: badge.textContent.trim(),
      ecartDroite: p.right - b.right,
      ecartBas: p.bottom - b.bottom,
      dansLaPhoto:
        b.left >= p.left && b.right <= p.right + 0.5 && b.bottom <= p.bottom + 0.5,
      points: Boolean(car.querySelector('[data-role="pagination"]')),
      largeurTexte: texte.getBoundingClientRect().width,
      opaciteTexte: getComputedStyle(texte).opacity,
    };
  });
  if (!releve) {
    nonJoue("§1 fiche pleine page", "le carrousel ou le badge est introuvable");
  } else {
    verif("le badge s'affiche en web", releve.affiche, releve.texte);
    verif("il est DANS la photo", releve.dansLaPhoto);
    verif(
      "collé au bord DROIT (12 px)",
      Math.abs(releve.ecartDroite - 12) < 1,
      `${releve.ecartDroite.toFixed(1)} px`
    );
    verif(
      "collé au bord BAS (12 px)",
      Math.abs(releve.ecartBas - 12) < 1,
      `${releve.ecartBas.toFixed(1)} px`
    );
    verif("les points de défilement ont disparu", !releve.points);
    verif(
      "au départ, le texte « 1/4 » est là",
      releve.largeurTexte > 10 && releve.opaciteTexte === "1",
      `${releve.largeurTexte.toFixed(1)} px, opacité ${releve.opaciteTexte}`
    );
  }

  /*  LA MÉCANIQUE DES TROIS SECONDES, éprouvée telle qu'elle se vit :
      on attend, le texte se replie, la FLÈCHE RESTE. */
  await page.waitForTimeout(4200);
  const apres = await page.evaluate(() => {
    const badge = document.querySelector(
      '[data-photo-fiche] [data-role="compteur"]'
    );
    const texte = badge.querySelector("span");
    const fleche = badge.querySelector("svg");
    return {
      largeurTexte: texte.getBoundingClientRect().width,
      opaciteTexte: getComputedStyle(texte).opacity,
      largeurFleche: fleche.getBoundingClientRect().width,
      largeurBadge: badge.getBoundingClientRect().width,
    };
  });
  verif(
    "après trois secondes, le texte s'est replié",
    apres.largeurTexte < 1 && apres.opaciteTexte === "0",
    `${apres.largeurTexte.toFixed(1)} px, opacité ${apres.opaciteTexte}`
  );
  verif(
    "…et la flèche reste, seule",
    apres.largeurFleche > 5 && apres.largeurBadge < 40,
    `flèche ${apres.largeurFleche.toFixed(1)} px, badge ${apres.largeurBadge.toFixed(1)} px`
  );

  //  UN GESTE LE RAMÈNE : la flèche du web change de photo.
  await page.click('[data-photo-fiche] [data-role="flèche droite"]');
  await page.waitForTimeout(400);
  const revenu = await page.evaluate(() => {
    const badge = document.querySelector(
      '[data-photo-fiche] [data-role="compteur"]'
    );
    return {
      texte: badge.textContent.trim(),
      largeurTexte: badge.querySelector("span").getBoundingClientRect().width,
    };
  });
  verif(
    "un changement de photo ramène le texte, et il compte juste",
    revenu.largeurTexte > 10 && revenu.texte.startsWith("2/"),
    `« ${revenu.texte} »`
  );

  /*  §3 — LE RELEVÉ NE DOIT PAS AVOIR BOUGÉ : aucun cadre n'a été
      ajouté autour de la photo de la fiche. */
  const cadreFiche = await page.evaluate((src) => {
    const CADRE = eval("(" + src + ")");
    const zone = document.querySelector("[data-photo-fiche]");
    return {
      enveloppe: CADRE(zone),
      racine: CADRE(zone.querySelector('[data-carrousel="fiche"]')),
      colonne: CADRE(zone.querySelector('[data-role^="colonne"]')),
    };
  }, CADRE.toString());
  verif(
    "§3 — rien n'a été ajouté autour de la photo (fiche pleine page)",
    Object.values(cadreFiche).every(
      (c) =>
        c.bordures === "0px 0px 0px 0px" &&
        c.contour === "0px none" &&
        c.ombre === "none" &&
        c.arrondi === "0px 0px 0px 0px"
    ),
    JSON.stringify(cadreFiche.racine)
  );
}

/* ---- §1 en vivant, la fenêtre centrée superposée ----------------- */
titre("§1 en vivant — la fiche en fenêtre centrée superposée");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.locator('a[href^="/tatoueur/"]').first().click();
  await page.waitForSelector('[role="dialog"] [data-carrousel], [aria-modal="true"] [data-carrousel]');
  await page.waitForTimeout(500);

  const releve = await page.evaluate((src) => {
    const CADRE = eval("(" + src + ")");
    const dlg =
      document.querySelector('[role="dialog"], [aria-modal="true"]') ??
      document.body;
    const car = dlg.querySelector("[data-carrousel]");
    const badge = car?.querySelector('[data-role="compteur"]');
    const p = car.getBoundingClientRect();
    return {
      badge: badge
        ? {
            affiche: getComputedStyle(badge).display !== "none",
            ecartDroite: p.right - badge.getBoundingClientRect().right,
            ecartBas: p.bottom - badge.getBoundingClientRect().bottom,
          }
        : null,
      points: Boolean(car.querySelector('[data-role="pagination"]')),
      cadre: CADRE(car),
    };
  }, CADRE.toString());

  if (!releve.badge) {
    nonJoue(
      "§1 fenêtre superposée",
      "la fiche ouverte n'a qu'une photo : le badge n'existe pas (n > 1)"
    );
  } else {
    verif(
      "le badge s'affiche aussi dans la fenêtre, en bas à droite",
      releve.badge.affiche &&
        Math.abs(releve.badge.ecartDroite - 12) < 1 &&
        Math.abs(releve.badge.ecartBas - 12) < 1,
      `${releve.badge.ecartDroite.toFixed(1)} / ${releve.badge.ecartBas.toFixed(1)} px`
    );
  }
  verif("les points ont disparu de la fenêtre aussi", !releve.points);
  verif(
    "§3 — rien n'a été ajouté autour de la photo (fenêtre superposée)",
    releve.cadre.bordures === "0px 0px 0px 0px" &&
      releve.cadre.contour === "0px none" &&
      releve.cadre.ombre === "none" &&
      releve.cadre.arrondi === "0px 0px 0px 0px",
    JSON.stringify(releve.cadre)
  );
}

/* ---- §2 en vivant, le web ---------------------------------------- */
/** Le relevé du bloc « Aucun résultat » d'une page ouverte. */
const releverLeVide = (page) =>
  page.evaluate((rose) => {
    const titres = [...document.querySelectorAll("p")].filter(
      (p) => p.textContent.trim() === "Aucun résultat"
    );
    if (titres.length !== 1) return { titres: titres.length };
    const titre = titres[0];
    const bloc = titre.parentElement;
    const actions = [...bloc.querySelectorAll("button, a")];
    const s = getComputedStyle(titre);
    return {
      titres: 1,
      couleurTitre: s.color,
      aligne: s.textAlign,
      //  AUCUNE PHRASE : le bloc ne contient que le titre et les
      //  capsules — pas un mot de plus.
      texteDuBloc: bloc.textContent.trim(),
      libelles: actions.map((a) => a.textContent.trim()),
      roses: actions.filter((a) => getComputedStyle(a).backgroundColor === rose)
        .length,
      largeurs: actions.map((a) => a.getBoundingClientRect().width),
      largeurBloc: bloc.getBoundingClientRect().width,
      //  CÔTE À CÔTE : même hauteur d'assise.
      cotesACote:
        actions.length < 2 ||
        Math.abs(
          actions[0].getBoundingClientRect().top -
            actions[1].getBoundingClientRect().top
        ) < 1,
    };
  }, ROSE);

titre("§2 en vivant — « Aucun résultat », 1440 × 900");
{
  await page.goto(BASE + VIDE_AVEC_LIEU, { waitUntil: "networkidle" });
  const r = await releverLeVide(page);
  verif("un seul titre « Aucun résultat »", r.titres === 1);
  verif("il est blanc", r.couleurTitre === "rgb(255, 255, 255)", r.couleurTitre);
  verif("il est centré", r.aligne === "center", r.aligne);
  verif(
    "les deux capsules, dans l'ordre demandé",
    JSON.stringify(r.libelles) ===
      JSON.stringify(["Élargir le rayon", "Chercher partout"]),
    r.libelles.join(" | ")
  );
  verif("aucune capsule rose", r.roses === 0);
  verif("côte à côte", r.cotesACote);
  verif(
    "à leur taille naturelle (ni étirées, ni pleine largeur)",
    r.largeurs.every((l) => l > 60 && l < 220 && l < r.largeurBloc / 2),
    r.largeurs.map((l) => l.toFixed(0)).join(" / ") + ` px sur ${r.largeurBloc.toFixed(0)}`
  );
  verif(
    "aucune phrase d'explication",
    r.texteDuBloc === "Aucun résultatÉlargir le rayonChercher partout",
    `« ${r.texteDuBloc} »`
  );

  //  LE GESTE : « Élargir le rayon » monte d'un cran, et d'un seul.
  await page.click('button:text-is("Élargir le rayon")');
  await page.waitForTimeout(900);
  verif(
    "« Élargir le rayon » passe de 10 à 25 km, un cran",
    new URL(page.url()).searchParams.get("rayon") === "25",
    page.url().split("?")[1] ?? ""
  );

  //  ET « Chercher partout » efface le lieu, rien d'autre.
  await page.goto(BASE + VIDE_AVEC_LIEU + "&style=realisme", {
    waitUntil: "networkidle",
  });
  await page.click('button:text-is("Chercher partout")');
  await page.waitForTimeout(900);
  const apres = new URL(page.url()).searchParams;
  verif(
    "« Chercher partout » efface le lieu et garde le style",
    !apres.get("lieu") && !apres.get("lat") && apres.get("style") === "realisme",
    page.url().split("?")[1] ?? "(aucun paramètre)"
  );
}

titre("§2 en vivant — les cas où une capsule ne ferait rien");
{
  await page.goto(BASE + VIDE_RAYON_MAX, { waitUntil: "networkidle" });
  const max = await releverLeVide(page);
  verif(
    "au dernier palier, « Élargir le rayon » n'est plus proposée",
    JSON.stringify(max.libelles) === JSON.stringify(["Chercher partout"]),
    max.libelles.join(" | ") || "(aucune)"
  );

  await page.goto(BASE + VIDE_SANS_LIEU, { waitUntil: "networkidle" });
  const sans = await releverLeVide(page);
  verif(
    "sans lieu renseigné : le titre seul, aucun bouton",
    sans.titres === 1 &&
      sans.libelles.length === 0 &&
      sans.texteDuBloc === "Aucun résultat",
    `« ${sans.texteDuBloc} »`
  );
}

titre("§2 en vivant — la page indexable « style + ville »");
{
  await page.goto(BASE + VIDE_INDEXABLE, { waitUntil: "networkidle" });
  const r = await releverLeVide(page);
  verif(
    "le MÊME message, avec les mêmes deux capsules",
    r.titres === 1 &&
      JSON.stringify(r.libelles) ===
        JSON.stringify(["Élargir le rayon", "Chercher partout"]),
    r.libelles.join(" | ")
  );
  verif("aucune capsule rose ici non plus", r.roses === 0);
  verif(
    "aucune phrase d'explication",
    r.texteDuBloc === "Aucun résultatÉlargir le rayonChercher partout",
    `« ${r.texteDuBloc} »`
  );
  /*  LES DEUX ISSUES SONT DE VRAIS LIENS, et elles mènent quelque part.
      ⚠️ `waitForLoadState` NE SUFFIT PAS : la navigation est celle du
      routeur (aucun chargement de document), elle rend donc la main
      tout de suite et `page.url()` renvoie encore l'ANCIENNE adresse —
      c'est ce qui a fait échouer ce contrôle au premier jeu. On attend
      l'adresse elle-même. */
  await page.click('a:text-is("Élargir le rayon")');
  await page.waitForURL(/[?&]rayon=10/, { timeout: 15000 });
  const params = new URL(page.url()).searchParams;
  verif(
    "« Élargir le rayon » ouvre le moteur sur la même ville, au premier palier",
    params.get("rayon") === "10" && params.get("ville") === "Bordeaux",
    page.url().split("?")[1] ?? ""
  );
}

/* ---- au doigt : les deux consignes disent « web ET smartphone » --- */
await page.context().close();
await nav.close();

titre("au doigt (390 × 844) — le badge n'a pas bougé, le message est là");
{
  const { nav: nav2, page: p2 } = await ouvrirLeNavigateur(
    "p307m",
    { width: 390, height: 844 },
    { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
  );
  await p2.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await p2.waitForSelector('[data-carrousel="fiche"]');
  const badge = await p2.evaluate(() => {
    const zone = document.querySelector("[data-photo-fiche]");
    const car = zone.querySelector('[data-carrousel="fiche"]');
    const b = car.querySelector('[data-role="compteur"]');
    const p = car.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    return {
      affiche: getComputedStyle(b).display !== "none",
      ecartHaut: r.top - p.top,
      ecartDroite: p.right - r.right,
      points: Boolean(car.querySelector('[data-role="pagination"]')),
    };
  });
  verif(
    "au doigt, le badge est resté en HAUT à droite",
    badge.affiche &&
      Math.abs(badge.ecartHaut - 12) < 1 &&
      Math.abs(badge.ecartDroite - 12) < 1,
    `haut ${badge.ecartHaut.toFixed(1)} / droite ${badge.ecartDroite.toFixed(1)} px`
  );
  verif("au doigt non plus, aucun point sur la photo", !badge.points);

  await p2.goto(BASE + VIDE_AVEC_LIEU, { waitUntil: "networkidle" });
  const r = await releverLeVide(p2);
  verif(
    "au doigt, le même message et les deux mêmes capsules",
    r.titres === 1 &&
      JSON.stringify(r.libelles) ===
        JSON.stringify(["Élargir le rayon", "Chercher partout"]),
    r.libelles.join(" | ")
  );
  verif("au doigt, côte à côte et non roses", r.cotesACote && r.roses === 0);

  /*  LA MOSAÏQUE GARDE SES POINTS : une carte n'est pas une fiche.
      ⚠️ OÙ CHERCHER UNE CARTE À CARROUSEL. Il n'en existe QUE dans la
      disposition à UNE COLONNE du smartphone
      (`carrouselDansLaCarte = uneColonne && photos > 1`, voir
      CarteTatoueur) — en deux colonnes et sur le web, la carte porte
      une image simple, sans carrousel. D'où `?disposition=une` : le
      choix vit dans l'adresse depuis la nº 203-§1b. */
  await p2.goto(BASE + "/?disposition=une", { waitUntil: "networkidle" });
  const carte = await p2
    .waitForSelector('[data-carrousel="carte"]', { timeout: 15000 })
    .then(() =>
      p2.evaluate(() => {
        const c = document.querySelector('[data-carrousel="carte"]');
        return {
          points: Boolean(c.querySelector('[data-role="pagination"]')),
          badge: Boolean(c.querySelector('[data-role="compteur"]')),
        };
      })
    )
    .catch(() => null);
  if (!carte) {
    nonJoue(
      "les points d'une carte de mosaïque",
      "aucune carte à carrousel dans la base locale " +
        "(il en faut une à plus d'une photo, en disposition une colonne)"
    );
  } else {
    verif("une CARTE de mosaïque garde ses points", carte.points);
    verif("…et n'a toujours pas de badge", !carte.badge);
  }

  await p2.context().close();
  await nav2.close();
}

process.exit(bilan());
