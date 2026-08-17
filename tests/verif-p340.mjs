/**
 * BANC DE LA PASSE Nº 340 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LA POSITION EST POSÉE AVANT LA PEINTURE. La restitution vivait
 *      dans un effet ORDINAIRE, donc après que le navigateur a peint :
 *      la page était affichée en haut, puis remise à sa place. Elle
 *      passe dans un effet de MISE EN PAGE, comme `DefilementEnHaut`
 *      le fait depuis la nº 143-§5.
 * §2 — LES PHOTOS AU RETOUR : les deux vérifications demandées, en
 *      mesurant — l'adresse des photos change-t-elle ? les éléments
 *      survivent-ils au retour ?
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch`, identité d'un iPhone, processeur bridé ×6 au moment du
 * geste (livraison rapide).
 *
 * ⚠️ CE QUE CE BANC NE PROUVE PAS : Chromium tient l'ancienne page
 * jusqu'à ce que la nouvelle soit prête — la fenêtre où la page
 * pouvait être peinte au mauvais endroit n'y existe pas. Le §1 se
 * vérifie donc ICI par la source et par l'instant du commit, et SUR
 * L'iPHONE par la sonde du retour.
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
  "p340",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/* ==================================================================
 * §1-a — LA RESTITUTION EST UN EFFET DE MISE EN PAGE
 * ================================================================== */
titre("§1-a — la position se pose avant la peinture");

const memoire = sansNotes(lire("src/components/MemoireNavigation.tsx"));
verif(
  "la restitution vit dans un effet de MISE EN PAGE",
  /useEffetAvantPeinture\(\(\) => \{[\s\S]{0,4000}rendreLaPlace\(url\)/.test(
    memoire
  ),
  "plus dans un effet ordinaire, qui s'exécute après la peinture"
);
verif(
  "…par le même motif que `DefilementEnHaut`, sans second dispositif",
  /const useEffetAvantPeinture =\s*typeof window !== "undefined" \? useLayoutEffect : useEffect;/.test(
    memoire
  ) &&
    /const useEffetAvantPeinture =/.test(
      sansNotes(lire("src/components/DefilementEnHaut.tsx"))
    )
);
verif(
  "le journal et la mémorisation, eux, restent des effets ordinaires",
  /useEffect\(\(\) => \{[\s\S]{0,3000}scrollRestoration = "manual"/.test(memoire),
  "on ne déplace que la restitution"
);

/* ==================================================================
 * §1-b et §2 — LA MESURE
 * ================================================================== */
titre("§1-b — le commit du DOM porte déjà la bonne position");

const p = await ctx.newPage();
const cdp = await p.context().newCDPSession(p);
await cdp.send("Network.enable");
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1400);
await p.evaluate(() => window.scrollTo({ top: 900, left: 0, behavior: "instant" }));
await p.waitForTimeout(800);

/*  §2 — L'ÉTAT DES PHOTOS AVANT DE PARTIR, et une marque posée sur
    CHAQUE élément : si les éléments survivent au retour, la marque
    survit avec eux. C'est la mesure qui tranche. */
const avant = await p.evaluate(() => {
  const images = [...document.querySelectorAll("main img")];
  images.forEach((i, n) => {
    i.dataset.marqueAvant = String(n);
  });
  return {
    total: images.length,
    chargees: images.filter((i) => i.complete && i.naturalWidth > 0).length,
    differees: images.filter((i) => i.loading === "lazy").length,
    adresses: images.map((i) => i.currentSrc || i.src),
  };
});

const lien = p.locator('main a[href^="/tatoueur/"]').first();
if ((await lien.count()) === 0) {
  nonJoue("§1-b et §2", "aucune carte servie sur l'accueil");
} else {
  await lien.evaluate((el) => el.click());
  await p.waitForTimeout(2200);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  /*  LE COMMIT DU DOM, ATTRAPÉ AVANT LA PEINTURE : un observateur de
      mutations se déclenche à la fin du commit de React, donc avant
      que le navigateur n'ait peint. C'est là qu'on demande « où en est
      le défilement ? ». */
  await p.evaluate(() => {
    window.__g = { geste: performance.now(), commit: null, im: [] };
    const obs = new MutationObserver(() => {
      const n = document.querySelectorAll('main a[href^="/tatoueur/"]').length;
      if (n >= 20 && window.__g.commit === null) {
        window.__g.commit = { t: Math.round(performance.now()), y: Math.round(scrollY) };
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const b = () => {
      window.__g.im.push([
        Math.round(performance.now()),
        Math.round(scrollY),
        document.querySelectorAll('main a[href^="/tatoueur/"]').length,
      ]);
      window.__bb = requestAnimationFrame(b);
    };
    b();
  });
  await p.goBack({ waitUntil: "commit" });
  await p.waitForTimeout(4500);
  const g = await p.evaluate(() => {
    cancelAnimationFrame(window.__bb);
    return window.__g;
  });
  verif(
    "AU COMMIT DU DOM, LA POSITION EST DÉJÀ LA BONNE",
    g.commit !== null && g.commit.y === 900,
    g.commit ? `y=${g.commit.y} au commit` : "commit non observé"
  );
  const fautives = g.im.filter((l) => l[2] >= 20 && l[1] === 0);
  verif(
    "aucune image peinte ne montre la mosaïque en haut",
    fautives.length === 0,
    `${g.im.length} images relevées · ${fautives.length} fautive(s)`
  );

  titre("§2 — ce que deviennent les photos au retour");
  const apres = await p.evaluate(() => {
    const images = [...document.querySelectorAll("main img")];
    return {
      total: images.length,
      marquees: images.filter((i) => i.dataset.marqueAvant !== undefined).length,
      chargees: images.filter((i) => i.complete && i.naturalWidth > 0).length,
      adresses: images.map((i) => i.currentSrc || i.src),
    };
  });
  const identiques = apres.adresses.filter((a) =>
    avant.adresses.includes(a)
  ).length;
  verif(
    "L'ADRESSE DES PHOTOS NE CHANGE PAS D'UN RENDU À L'AUTRE",
    identiques === apres.total && apres.total > 0,
    `${identiques} / ${apres.total} identiques au caractère près — ` +
      "le piège des adresses signées est écarté"
  );
  //  ⚠️ CE CONSTAT EST UNE MESURE, PAS UN SUCCÈS : il dit que React
  //  DÉMONTE la mosaïque au retour, et c'est la cause des photos à
  //  recharger. On l'inscrit pour qu'aucune passe ne le redécouvre.
  verif(
    "CONSTAT — les éléments <img> sont RECRÉÉS au retour (cause mesurée)",
    apres.marquees === 0,
    `${apres.marquees} / ${apres.total} ont survécu · ` +
      `${avant.differees} / ${avant.total} portent loading="lazy" · ` +
      `chargées : ${avant.chargees} avant le départ → ${apres.chargees} après le retour`
  );
  await p.close();
}

await nav.close();
process.exit(bilan());
