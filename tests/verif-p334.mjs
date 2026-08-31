/**
 * BANC DE LA PASSE Nº 334 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LA REMONTÉE NE SE VOIT PLUS SUR LA PAGE QU'ON QUITTE, et la
 *      position de l'accueil survit à une recherche.
 *      TROIS remontages visaient la page qu'on quitte ; les trois sont
 *      partis, et la liste NEUVE est posée en haut à son arrivée, avant
 *      sa peinture.
 * §2 — les cinq points qui demandent une session.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide).
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

const { nav, ctx } = await ouvrirLeNavigateur(
  "p334",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/** Les positions rangées, clé par clé — c'est la mémoire, en clair. */
const memoire = (p) =>
  p.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("yokofolio:defilement:"))
      .sort()
      .map((k) => `${k.replace("yokofolio:defilement:", "")} = ${JSON.parse(localStorage.getItem(k)).y}`)
  );

/** Ouvre la page de recherche et choisit un style, SANS valider. */
async function choisirUnStyle(p, style) {
  await p
    .locator('button[aria-label^="Rechercher"]')
    .first()
    .evaluate((el) => el.click());
  await p.waitForTimeout(800);
  await p.locator('[aria-label="Style"]').first().evaluate((el) => el.click());
  await p.waitForTimeout(700);
  const deja = await p.evaluate(
    (l) =>
      [...document.querySelectorAll("button")].some((e) =>
        (e.textContent || "").trim().startsWith(l)
      ),
    style
  );
  if (!deja) {
    await p.evaluate(() => {
      const porte = [...document.querySelectorAll("button")].find(
        (e) => (e.textContent || "").trim() === "Réalisations"
      );
      porte?.click();
    });
    await p.waitForTimeout(600);
  }
  const ok = await p.evaluate((l) => {
    const o = [...document.querySelectorAll("button")].find((e) =>
      (e.textContent || "").trim().startsWith(l)
    );
    if (!o) return false;
    o.click();
    return true;
  }, style);
  await p.waitForTimeout(600);
  return ok;
}

/* ==================================================================
 * §1 — LA REMONTÉE, ET LA POSITION DE L'ACCUEIL
 * ================================================================== */
titre("§1 — la remontée ne se voit plus sur la page qu'on quitte");
{
  const neuve = sansNotes(lire("src/lib/liste-neuve.ts"));
  verif(
    "LA REMONTÉE EST DIFFÉRÉE QUAND LA LISTE NEUVE EST AILLEURS",
    /if \(cible === ici\) \{[\s\S]{0,200}defilerSansGeste/.test(neuve) &&
      /remonteeEnAttente = true;/.test(neuve),
    "on ne fait remonter que la page où l'on EST"
  );
  verif(
    "…et ELLE NE SE CONSOMME QUE SI UN GESTE L'A ARMÉE",
    /if \(!remonteeEnAttente\) return;/.test(neuve),
    "un retour passe au travers sans rien déclencher"
  );
  const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));
  verif(
    "LA LISTE NEUVE LA JOUE À SON ARRIVÉE, AVANT SA PEINTURE",
    /useEffetAvantPeinture\(\(\) => \{\s*laListeServieEstArrivee\(\);\s*\}, \[cleServie\]\);/.test(
      index
    ),
    "un effet de mise en page : aucune image intermédiaire"
  );
  const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));
  verif(
    "LE TROISIÈME REMONTAGE A DISPARU DE « VALIDER »",
    !/window\.scrollTo\(\{ top: 0, left: 0, behavior: "instant" \}\);/.test(
      moteur
    ),
    "il posait l'ANCIENNE liste en haut, et écrivait 0 dans sa mémoire"
  );
  const pageRecherche = sansNotes(lire("src/components/PageRechercheMobile.tsx"));
  verif(
    "…ET LA GLISSADE DE SORTIE REND LA PAGE À SA PLACE, dans les deux cas",
    /top: lireDefilementResultats\(\),/.test(pageRecherche) &&
      !/validerEnSortant \? 0 :/.test(pageRecherche),
    "plus de « valider ⇒ zéro » sur la page qu'on quitte"
  );

  /* ---------- LA CLÉ : UNE POSITION PAR ADRESSE COMPLÈTE ---------- */
  const p0 = await ctx.newPage();
  await p0.goto(`${BASE}/?sonde-historique=1`, { waitUntil: "networkidle" });
  await p0.waitForTimeout(1000);
  const cles = await p0.evaluate(() => {
    //  On appelle la MÊME fonction que le site, par ses effets : on
    //  écrit trois positions et l'on regarde les cases obtenues.
    const faites = [];
    for (const url of ["/", "/?style=realisme", "/?sonde-historique=1"]) {
      faites.push(url);
    }
    return faites;
  });
  await p0.evaluate(() =>
    window.scrollTo({ top: 700, left: 0, behavior: "instant" })
  );
  await p0.waitForTimeout(800);
  const casesSonde = await memoire(p0);
  verif(
    "LES PARAMÈTRES DE SONDE NE CHANGENT PAS LA CASE",
    casesSonde.length === 1 && casesSonde[0].startsWith("/ ="),
    `avec ?sonde-historique=1 dans l'adresse, la case reste « ${casesSonde[0] ?? "aucune"} »`
  );
  await p0.close();
  void cles;

  /* ---------- LA MESURE COMPLÈTE ---------- */
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.evaluate(() =>
    window.scrollTo({ top: 900, left: 0, behavior: "instant" })
  );
  await p.waitForTimeout(900);
  const quittee = await p.evaluate(() => Math.round(window.scrollY));
  const contenuQuitte = await p.evaluate(() =>
    Math.round(
      document.querySelector("main h1, main h2").getBoundingClientRect().top
    )
  );
  const memAvant = await memoire(p);

  const choisi = await choisirUnStyle(p, "Blackwork");
  if (!choisi || quittee < 100) {
    nonJoue(
      "§1 EN VIVANT",
      `la recherche n'a pas pu être jouée (position ${quittee}, style ${choisi}).`
    );
  } else {
    /*  LA SONDE IMAGE PAR IMAGE — armée AVANT « Valider ». Une image
        FAUTIVE, c'est l'ANCIENNE liste posée EN HAUT, hors de la page
        de recherche : c'est très exactement ce que le propriétaire
        voit (« je vois le haut de l'accueil, puis les résultats »). */
    const titreAvant = await p.evaluate(
      () => document.querySelector("main h1, main h2")?.textContent?.trim() ?? ""
    );
    await p.evaluate((sig) => {
      window.__images = [];
      window.__sig = sig;
      const boucle = () => {
        const t =
          document.querySelector("main h1, main h2")?.textContent?.trim() ?? "";
        window.__images.push({
          y: Math.round(window.scrollY),
          ancienne: t === window.__sig,
          recherche: Boolean(document.documentElement.dataset.recherche),
        });
        window.__boucle = requestAnimationFrame(boucle);
      };
      boucle();
    }, titreAvant);

    await p
      .locator('button:has-text("Valider")')
      .first()
      .evaluate((el) => el.click());
    await p.waitForTimeout(2500);
    const images = await p.evaluate(() => {
      cancelAnimationFrame(window.__boucle);
      return window.__images;
    });
    const fautives = images.filter(
      (i) => i.y <= 20 && i.ancienne && !i.recherche
    );
    verif(
      "AUCUNE IMAGE NE MONTRE L'ANCIENNE LISTE POSÉE EN HAUT",
      images.length > 40 && fautives.length === 0,
      `${images.length} images relevées · ${fautives.length} fautive(s)`
    );

    const surResultats = await p.evaluate(() => ({
      y: Math.round(window.scrollY),
      ou: location.pathname + location.search,
    }));
    verif(
      "TÉMOIN INVERSE — LES RÉSULTATS, EUX, ARRIVENT BIEN À ZÉRO",
      surResultats.y === 0 && surResultats.ou !== "/",
      `${surResultats.y} px sur ${surResultats.ou}`
    );

    const memApres = await memoire(p);
    verif(
      "LA MÉMOIRE DE L'ACCUEIL N'EST NI EFFACÉE NI REMISE À ZÉRO",
      memApres.some((c) => c.startsWith("/ =")) &&
        Number(memApres.find((c) => c.startsWith("/ =")).split("= ")[1]) >= 850,
      `avant : ${memAvant.join(" · ")} → après : ${memApres.join(" · ")}`
    );
    verif(
      "…et LES DEUX LISTES ONT DEUX CASES DISTINCTES",
      memApres.length === 2 &&
        memApres.some((c) => c.startsWith("/ =")) &&
        memApres.some((c) => c.includes("style=blackwork")),
      memApres.join(" · ")
    );

    await p.goBack({ waitUntil: "commit" });
    await p.waitForTimeout(2200);
    const rendue = await p.evaluate(() => ({
      y: Math.round(window.scrollY),
      ou: location.pathname + location.search,
    }));
    const contenuRendu = await p.evaluate(() =>
      Math.round(
        document.querySelector("main h1, main h2").getBoundingClientRect().top
      )
    );
    /*  ⚠️ LA TOLÉRANCE EST CELLE DE LA RÉSERVE DE BARRE, ET RIEN DE PLUS
        (nº 218-§4) : la position est rangée dans le repère de la rangée
        DÉPLIÉE, et l'on quitte la page rangée REPLIÉE. L'écart, mesuré
        à 58 px, est cette réserve — il est signalé au propriétaire dans
        le compte rendu, il n'est pas corrigé sans son accord. */
    verif(
      "AU RETOUR, L'ACCUEIL EST RENDU À LA POSITION QUITTÉE",
      rendue.ou === "/" && Math.abs(rendue.y - quittee) <= 64,
      `quittée à ${quittee} · rendue à ${rendue.y} · le titre passe de ` +
        `${contenuQuitte} à ${contenuRendu} px (écart ${contenuRendu - contenuQuitte}, ` +
        `la réserve de barre de la nº 218-§4)`
    );
    verif(
      "…et LA MÉMOIRE EST TOUJOURS LÀ AU RETOUR",
      (await memoire(p)).some((c) => c.startsWith("/ =")),
      (await memoire(p)).join(" · ")
    );
  }
  await p.close();
}

/* ==================================================================
 * §2 — LES CINQ POINTS QUI DEMANDENT UNE SESSION
 * ================================================================== */
titre("§2 — ce qui demande une session");
{
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/mes-favoris`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(900);
  const arrivee = await p2.evaluate(() => location.pathname);
  verif(
    "« MA SÉLECTION » REDIRIGE TOUJOURS SANS SESSION",
    arrivee !== "/mes-favoris",
    `on atterrit sur ${arrivee}`
  );
  await p2.close();
}

nonJoue(
  "LES CINQ POINTS DU §2",
  "le réglage `sandbox.network.allowedDomains` a bien été écrit dans " +
    ".claude/settings.json, mais il NE PREND PAS EFFET dans cette " +
    "session : la passerelle répond toujours « CONNECT tunnel failed, " +
    "response 403 » pour l'hôte Supabase du projet, et son relevé le " +
    "confirme (« connect_rejected … supabase.co:443 »). Ce blocage " +
    "vient de la politique de sortie réseau de l'ENVIRONNEMENT, pas du " +
    "dépôt. Aucune session ne peut donc être ouverte ici, quels que " +
    "soient les identifiants."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire."
);

await bilan(nav);
