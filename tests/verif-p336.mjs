/**
 * BANC DE LA PASSE Nº 336 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE ROND DE PROFIL. Après le toucher : plus AUCUNE fenêtre de
 *      carrousel dans la page, et l'adresse porte ENCORE `#profil`.
 *      Deux défauts, deux corrections, mesurés sur la vraie page
 *      partagée — c'est le cas exact du relevé du propriétaire.
 * §2 — L'ÉCRAN VIDE AU RETOUR. Le relevé image par image du retour, et
 *      l'état de ce qui empêchait le navigateur de réutiliser sa propre
 *      image de la page.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch`, avec l'identité d'un iPhone (livraison rapide).
 *
 * ⚠️ AUCUN IDENTIFIANT N'EST ÉCRIT ICI, ni ailleurs.
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

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const { nav, ctx } = await ouvrirLeNavigateur(
  "p336",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/* ==================================================================
 * §1-a — LES DEUX CORRECTIONS, DANS LES SOURCES
 * ================================================================== */
titre("§1-a — la fenêtre ne se rouvre plus, l'ancre ne s'efface plus");

const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
/*  §2 (nº 337) — CETTE ASSERTION A ÉTÉ MISE À JOUR, ET C'EST DIT.
    La règle n'a pas changé — le routeur à la naissance, le navigateur
    ensuite — mais sa SECONDE moitié est passée par l'écriture commune
    des changements d'adresse (`souscrireAdresse`), sans quoi le
    composant n'était jamais réveillé et la règle ne s'appliquait
    qu'une fois. On vérifie donc les deux moitiés. */
verif(
  "au premier rendu, c'est le ROUTEUR qui dit où l'on va",
  /!ficheDejaPosee[^?]*\?\s*pathname/.test(fiche) &&
    /useSyncExternalStore\(\s*souscrireAdresse/.test(fiche),
  "ensuite le navigateur, et tout changement d'adresse réveille la fiche"
);
verif(
  "l'ouverture au doigt n'est pas touchée : elle pose l'état elle-même",
  /setFenetreCarrousel\(\{ style: styleVoulu, serie, photo, position \}\)/.test(
    fiche
  )
);
verif(
  "la fermeture d'un seul appui n'est pas touchée (nº 330)",
  /surFermeture=\{\(\) => window\.history\.back\(\)\}/.test(fiche)
);

const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
verif(
  "l'ancre `#profil` n'est plus retirée de l'adresse",
  !/replace\(\/#profil\$\/, ""\)/.test(contenu),
  "elle décrit l'écran : elle reste"
);
verif(
  "le « une seule fois » vit désormais dans l'étape d'historique",
  /etape\.profilJoue/.test(contenu) &&
    /replaceState\(\{ \.\.\.etape, profilJoue: true \}, ""\)/.test(contenu),
  "deux arguments : l'adresse, ancre comprise, est gardée"
);

/* ==================================================================
 * §1-b — LA MESURE : le relevé du propriétaire, rejoué
 * ================================================================== */
titre("§1-b — je touche le rond : la fenêtre part, l'ancre reste");

const page = await ctx.newPage();
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const hrefFiche = await page.evaluate(
  () =>
    document.querySelector('main a[href^="/tatoueur/"]')?.getAttribute("href") ??
    ""
);
const slug = hrefFiche.split("/")[2]?.split("?")[0] ?? "";
const tags = hrefFiche.includes("?") ? hrefFiche.split("?")[1] : "";

if (!slug) {
  nonJoue("§1-b", "aucune fiche servie par ce conteneur");
} else {
  await page.goto(`${BASE}/tatoueur/${slug}/carrousel?${tags}&photo=1`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1200);
  const rond = await page.evaluate(() => {
    const a = document.querySelector(
      '[data-fenetre-carrousel] a[href*="#profil"]'
    );
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return {
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      href: a.getAttribute("href"),
    };
  });
  if (!rond) {
    nonJoue("§1-b", "la fenêtre partagée n'a pas de rond de profil ici");
  } else {
    verif(
      "le lien du rond porte bien l'ancre",
      rond.href.endsWith("#profil"),
      rond.href
    );
    //  LE RELEVÉ IMAGE PAR IMAGE, comme la sonde du propriétaire.
    await page.evaluate(() => {
      window.__im = [];
      const b = () => {
        window.__im.push([
          location.pathname + location.search + location.hash,
          document.querySelectorAll("[data-fenetre-carrousel]").length,
        ]);
        window.__bb = requestAnimationFrame(b);
      };
      b();
    });
    await page.touchscreen.tap(rond.x, rond.y);
    await page.waitForTimeout(3500);
    const images = await page.evaluate(() => {
      cancelAnimationFrame(window.__bb);
      return window.__im;
    });
    const fin = await page.evaluate(() => ({
      adresse: location.pathname + location.search + location.hash,
      fenetres: document.querySelectorAll("[data-fenetre-carrousel]").length,
      barre: Boolean(document.querySelector("[data-barre-fixe]")),
      marque: JSON.stringify(window.history.state ?? {}).includes("profilJoue"),
    }));
    verif(
      "PLUS AUCUNE FENÊTRE DE CARROUSEL DANS LA PAGE",
      fin.fenetres === 0,
      `${fin.fenetres} fenêtre(s) · la fiche est bien là : barre ${fin.barre}`
    );
    verif(
      "ET L'ADRESSE PORTE ENCORE `#profil`",
      fin.adresse.endsWith("#profil"),
      fin.adresse
    );
    verif(
      "la remontée vers le profil a été jouée, et une seule fois",
      fin.marque,
      "la marque vit dans l'étape d'historique, plus dans l'adresse"
    );
    //  Aucune image ne doit montrer la fiche AVEC la fenêtre par-dessus.
    const fautives = images.filter(
      ([adresse, fenetres]) => !adresse.includes("/carrousel") && fenetres > 0
    );
    verif(
      "aucune image ne montre la fiche avec la fenêtre par-dessus",
      fautives.length === 0,
      `${images.length} images relevées · ${fautives.length} fautive(s)`
    );
  }
  await page.close();
}

/* ==================================================================
 * §2 — L'ÉCRAN VIDE AU RETOUR
 * ================================================================== */
titre("§2 — le retour ne passe plus par le fond nu");

const sw = lire("public/sw.js");
verif(
  "le service worker ne se mêle plus des retours et des avances",
  /requete\.cache === "force-cache"/.test(sw) &&
    /only-if-cached/.test(sw),
  "une navigation d'historique demande sa page en « force-cache »"
);
verif(
  "…et il ne range TOUJOURS aucune page dans son cache",
  !/cache\.put\([^)]*navigate/.test(sw) && /PAGE_HORS_LIGNE/.test(sw),
  "la raison de la règle d'origine est intacte"
);

//  CE QUI EMPÊCHERAIT LE NAVIGATEUR DE GARDER SA PROPRE IMAGE.
const reponse = await ctx.request.get(`${BASE}/`);
const controle = reponse.headers()["cache-control"] ?? "";
verif(
  "aucun `no-store` dans l'en-tête : la page reste gardable",
  !/no-store/.test(controle),
  `Cache-Control: ${controle}`
);
const sources = [
  "src/components/GardeSaisie.tsx",
  "src/app/(tatouage)/layout.tsx",
  "src/components/MemoireNavigation.tsx",
];
verif(
  "aucun écouteur `unload` nulle part (il interdirait la copie)",
  sources.every((f) => !/addEventListener\("unload"/.test(lire(f)))
);
verif(
  "le seul `beforeunload` du site ne s'arme QUE pendant une saisie",
  /if \(!saisieEnCours\) return;[\s\S]{0,600}addEventListener\("beforeunload"/.test(
    sansNotes(lire("src/components/GardeSaisie.tsx"))
  ),
  "une liste n'en pose jamais"
);

/* ---------- LE RELEVÉ IMAGE PAR IMAGE ---------- */
const p2 = await ctx.newPage();
const requetes = [];
p2.on("request", (r) => {
  const u = new URL(r.url());
  if (u.searchParams.has("_rsc") || r.resourceType() === "document") {
    requetes.push(`${u.pathname}${u.searchParams.has("_rsc") ? " [RSC]" : ""}`);
  }
});
await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
await p2.waitForTimeout(900);
await p2.evaluate(() => window.scrollTo({ top: 900, left: 0, behavior: "instant" }));
await p2.waitForTimeout(500);
const lien = p2.locator('main a[href^="/tatoueur/"]').first();
if ((await lien.count()) === 0) {
  nonJoue("§2 EN VIVANT", "aucune carte servie sur l'accueil");
} else {
  await lien.evaluate((el) => el.click());
  await p2.waitForTimeout(1600);
  requetes.length = 0;
  await p2.goBack({ waitUntil: "commit" });
  await p2.evaluate(() => {
    window.__im = [];
    const b = () => {
      window.__im.push(
        document.querySelectorAll('main a[href^="/tatoueur/"]').length
      );
      window.__bb = requestAnimationFrame(b);
    };
    b();
  });
  await p2.waitForTimeout(2600);
  const cartes = await p2.evaluate(() => {
    cancelAnimationFrame(window.__bb);
    return window.__im;
  });
  const vides = cartes.filter((n) => n === 0).length;
  verif(
    "AUCUNE IMAGE DU RETOUR NE MONTRE UN ÉCRAN VIDE",
    vides === 0 && cartes.length > 40,
    `${cartes.length} images relevées · ${vides} sans aucune carte`
  );
  verif(
    "LA LISTE N'EST PAS RECONSTRUITE : aucune requête au retour",
    requetes.length === 0,
    `requêtes : ${JSON.stringify(requetes)}`
  );
  verif(
    "…et l'on garde EXACTEMENT UNE liste : celle que React n'a pas démontée",
    !/cacheDeListe|listesGardees|memoireDeListe/.test(
      lire("src/components/IndexTatoueurs.tsx")
    ),
    "aucun second dispositif de conservation n'a été ajouté"
  );
}
await p2.close();

await nav.close();
process.exit(bilan());
