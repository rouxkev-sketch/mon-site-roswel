/**
 * BANC DE LA PASSE Nº 335 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LA RÉSERVE DE LA BARRE. Une place, c'est une POSITION **ET** un
 *      ÉTAT DE RANGÉE ; on range les deux, on rend les deux. Quatre
 *      cas mesurés (accueil / page de cartes × rangée dépliée /
 *      repliée), sur les DEUX chemins du retour — celui du client et
 *      celui du document neuf. On vérifie aussi qu'il n'y a plus qu'UNE
 *      écriture des deux hauteurs et de la règle.
 * §2 — LE LIEN DE PARTAGE. C'est le SERVEUR qui décide, d'après
 *      l'adresse : un écran tactile reçoit la fenêtre directement, un
 *      écran de bureau reçoit une redirection. Aucune image de fiche
 *      sans la fenêtre.
 * §3 — LE ROND DE PROFIL. Le relevé complet de ce qui reçoit le
 *      toucher, sur la page partagée. La fenêtre SUPERPOSÉE, elle,
 *      demande des photos de portfolio : voir la section, qui le dit.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide). Une section web, et une seule, pour la
 * redirection du §2 — elle ne se mesure pas autrement.
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

/** L'identité d'un iPhone : c'est elle que le serveur lit au §2. */
const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const { nav, ctx } = await ouvrirLeNavigateur(
  "p335",
  { width: 390, height: 844 },
  {
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    userAgent: UA_IPHONE,
  }
);

/* ==================================================================
 * §1-a — UNE SEULE ÉCRITURE DE LA RÈGLE (lecture des sources)
 * ================================================================== */
titre("§1-a — la règle du cran n'est écrite qu'une fois");

const reserve = lire("src/lib/reserve-barre.ts");
verif(
  "les deux hauteurs sont déclarées dans lib/reserve-barre",
  /export const RESERVE_RANGEE = 122;/.test(reserve) &&
    /export const RESERVE_LOGO = 64;/.test(reserve)
);

//  Plus personne d'autre n'écrit 122 ou 64 à propos de la réserve.
const enTete = sansNotes(lire("src/components/EnTeteTatouage.tsx"));
verif(
  "la barre ne recopie plus les hauteurs (ni en attribut, ni en classe)",
  !/h-\[122px\]/.test(enTete) &&
    !/data-reserve-posee=\{[^}]*122/.test(enTete) &&
    /RESERVE_RANGEE/.test(enTete) &&
    /RESERVE_LOGO/.test(enTete),
  "elles arrivent par import"
);

const session = sansNotes(lire("src/lib/navigation-session.ts"));
verif(
  "la mémoire de position range l'ÉTAT avec la position",
  /rangeeReplieeMaintenant\(\)/.test(session) && /place\.p = repliee/.test(session)
);
verif(
  "elle ne fait plus AUCUNE arithmétique de réserve",
  !/positionRangee|positionAPoser|ecartDeReserveBarre/.test(session),
  "plus d'écart ajouté ni retiré"
);

const restitution = sansNotes(lire("src/lib/restitution-position.ts"));
verif(
  "le retour passe par une seule porte : rendreLaPlace",
  /export function rendreLaPlace/.test(restitution) &&
    /rendreLEtatDeRangee\(place\.p\)/.test(restitution)
);
const appelants = [
  "src/components/MemoireNavigation.tsx",
  "src/components/DefilementEnHaut.tsx",
];
verif(
  "et ses deux appelants sont les deux seuls",
  appelants.every((f) => /rendreLaPlace\(url\)/.test(sansNotes(lire(f)))) &&
    appelants.every((f) => !/poserLaPosition\(lireDefilement/.test(sansNotes(lire(f))))
);

const script = sansNotes(lire("src/lib/script-avant-peinture.ts"));
verif(
  "le script d'avant peinture pose la marque de rangée",
  /if\(note\.p\)/.test(script) && /MARQUE_RANGEE/.test(script)
);
verif(
  "et il pose le défilement SANS glisser (behavior instant)",
  /behavior:"instant"/.test(script) && !/scrollTo\(0,note\.y\)/.test(script),
  "la réserve de hauteur est posée juste avant"
);
verif(
  "la règle de la clé n'a toujours qu'une écriture",
  /conditionDeReglagePourLeScript/.test(script) &&
    /export function conditionDeReglagePourLeScript/.test(
      sansNotes(lire("src/lib/adresse-recherche.ts"))
    )
);

/* ==================================================================
 * §1-b — LA MESURE : quittée à 900, rendue à 900
 * ================================================================== */
titre("§1-b — la place rendue est celle qu'on a quittée, au pixel");

const releve = () => {
  const r = document.querySelector("[data-reserve-barre]");
  const m = document.querySelector("main");
  return {
    y: Math.round(scrollY),
    reserve: r ? Math.round(r.getBoundingClientRect().height) : null,
    //  LE HAUT DU CONTENU À L'ÉCRAN : c'est cela que l'œil voit, et
    //  cela seul. Il ne dépend ni des images ni de la mosaïque.
    contenu: m ? Math.round(m.getBoundingClientRect().top) : null,
  };
};

/**
 * UN ALLER-RETOUR COMPLET.
 *  · `deplier` : on remonte de quelques pixels avant de partir, pour
 *    quitter la page RANGÉE DÉPLIÉE (sinon elle est repliée) ;
 *  · `documentNeuf` : on revient par un chargement complet (le chemin
 *    du script d'avant peinture) au lieu d'un retour de client.
 */
async function allerRetour(adresse, deplier, documentNeuf) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  await p.mouse.move(195, 500);
  for (let i = 0; i < 12; i += 1) {
    await p.mouse.wheel(0, 120);
    await p.waitForTimeout(40);
  }
  await p.evaluate(() => window.scrollTo({ top: 900, left: 0, behavior: "instant" }));
  await p.waitForTimeout(600);
  if (deplier) {
    await p.mouse.wheel(0, -40);
    await p.waitForTimeout(450);
    await p.evaluate(() => window.scrollTo({ top: 900, left: 0, behavior: "instant" }));
    await p.waitForTimeout(450);
  }
  const avant = await p.evaluate(releve);
  const lien = p.locator('main a[href^="/tatoueur/"]').first();
  if ((await lien.count()) === 0) {
    await p.close();
    return null;
  }
  await lien.evaluate((el) => el.click());
  await p.waitForTimeout(1500);
  if (documentNeuf) await p.goto(`${BASE}${adresse}`, { waitUntil: "commit" });
  else await p.goBack({ waitUntil: "commit" });
  //  LE RELEVÉ IMAGE PAR IMAGE, dès la première.
  await p.evaluate(() => {
    window.__im = [];
    const b = () => {
      const r = document.querySelector("[data-reserve-barre]");
      const m = document.querySelector("main");
      window.__im.push([
        Math.round(scrollY),
        r ? Math.round(r.getBoundingClientRect().height) : -1,
        m ? Math.round(m.getBoundingClientRect().top) : null,
      ]);
      window.__bb = requestAnimationFrame(b);
    };
    b();
  });
  await p.waitForTimeout(2400);
  const images = await p.evaluate(() => {
    cancelAnimationFrame(window.__bb);
    return window.__im;
  });
  const apres = await p.evaluate(releve);
  await p.close();
  //  Les images où le contenu EXISTE : sa place à l'écran ne doit plus
  //  bouger d'un pixel, de la première à la dernière.
  const peintes = images.filter((l) => l[2] !== null).map((l) => l[2]);
  return {
    avant,
    apres,
    images: peintes.length,
    bouge: new Set(peintes).size > 1,
    vues: [...new Set(peintes)].slice(0, 5),
  };
}

const cas = [
  ["accueil · rangée repliée · retour de client", "/", false, false],
  ["accueil · rangée dépliée · retour de client", "/", true, false],
  ["accueil · rangée repliée · document neuf", "/", false, true],
  ["accueil · rangée dépliée · document neuf", "/", true, true],
  ["cartes filtrées · rangée repliée · retour de client", "/?style=realisme", false, false],
  ["cartes filtrées · rangée dépliée · document neuf", "/?style=realisme", true, true],
];

for (const [nom, adresse, deplier, neuf] of cas) {
  const r = await allerRetour(adresse, deplier, neuf);
  if (!r) {
    nonJoue(nom, "aucune carte servie sur cette adresse");
    continue;
  }
  verif(
    `${nom} — la position rendue est celle qu'on a quittée`,
    r.apres.y === r.avant.y,
    `quittée ${r.avant.y} → rendue ${r.apres.y}`
  );
  verif(
    `${nom} — la rangée renaît dans l'état où on l'a laissée`,
    r.apres.reserve === r.avant.reserve,
    `réserve ${r.avant.reserve} → ${r.apres.reserve}`
  );
  verif(
    `${nom} — le contenu est au même endroit à l'écran`,
    r.apres.contenu === r.avant.contenu,
    `${r.avant.contenu} → ${r.apres.contenu}`
  );
  verif(
    `${nom} — aucune image ne montre le contenu bouger`,
    !r.bouge,
    `${r.images} images relevées : ${JSON.stringify(r.vues)}`
  );
}

/* ==================================================================
 * §2 — LE LIEN DE PARTAGE : c'est le serveur qui décide
 * ================================================================== */
titre("§2 — le lien de partage sert directement la fenêtre");

const page = await ctx.newPage();
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const hrefFiche = await page.evaluate(
  () => document.querySelector('main a[href^="/tatoueur/"]')?.getAttribute("href") ?? ""
);
const slug = hrefFiche.split("/")[2]?.split("?")[0] ?? "";
const tags = hrefFiche.includes("?") ? hrefFiche.split("?")[1] : "";
const adressePartagee = `/tatoueur/${slug}/carrousel?${tags}&photo=1`;

if (!slug) {
  nonJoue("§2", "aucune fiche servie par ce conteneur");
} else {
  const servis = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "document") {
      servis.push(`${r.status()} ${new URL(r.url()).pathname}`);
    }
  });
  await page.goto(`${BASE}${adressePartagee}`, { waitUntil: "commit" });
  await page.evaluate(() => {
    window.__vues = [];
    const b = () => {
      window.__vues.push([
        location.pathname,
        document.querySelector("[data-fenetre-carrousel]") ? "fenêtre" : "—",
      ]);
      window.__bb = requestAnimationFrame(b);
    };
    b();
  });
  await page.waitForTimeout(2500);
  const vues = await page.evaluate(() => {
    cancelAnimationFrame(window.__bb);
    return window.__vues;
  });
  verif(
    "un seul document est servi, et c'est le carrousel",
    servis.length === 1 && servis[0].startsWith("200") && servis[0].includes("/carrousel"),
    JSON.stringify(servis)
  );
  verif(
    "aucune image ne montre la fiche : l'adresse ne change jamais",
    vues.every(([chemin]) => chemin.endsWith("/carrousel")),
    `${vues.length} images relevées`
  );
  verif(
    "la fenêtre est là dès qu'il y a quelque chose à voir",
    vues.some(([, f]) => f === "fenêtre") &&
      vues.filter(([, f]) => f === "—").length <= 3,
    `${vues.filter(([, f]) => f === "fenêtre").length} images avec la fenêtre`
  );

  const source = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
  verif(
    "la bascule vers la fiche a quitté le navigateur",
    !/location\.replace\(adresseFiche\)/.test(source)
  );
  verif(
    "et c'est la page serveur qui décide",
    /ecranTactileServeur/.test(
      sansNotes(lire("src/app/(tatouage)/tatoueur/[slug]/carrousel/page.tsx"))
    )
  );
}

/* ==================================================================
 * §2-bis — L'ÉCRAN DE BUREAU : une redirection, rien de peint
 * ================================================================== */
titre("§2-bis — sur un écran de bureau, la redirection est servie");

if (!slug) {
  nonJoue("§2-bis", "aucune fiche servie par ce conteneur");
} else {
  const { nav: navWeb, ctx: ctxWeb } = await ouvrirLeNavigateur("p335-web", {
    width: 1440,
    height: 900,
  });
  const pw = await ctxWeb.newPage();
  const servisWeb = [];
  pw.on("response", (r) => {
    if (r.request().resourceType() === "document") {
      servisWeb.push(`${r.status()} ${new URL(r.url()).pathname}`);
    }
  });
  await pw.goto(`${BASE}${adressePartagee}`, { waitUntil: "networkidle" });
  verif(
    "le serveur redirige avant tout affichage (307)",
    servisWeb.some((l) => l.startsWith("307") && l.includes("/carrousel")),
    JSON.stringify(servisWeb)
  );
  verif(
    "et l'on arrive sur la fiche, comme avant la nº 335",
    new URL(pw.url()).pathname === `/tatoueur/${slug}`,
    new URL(pw.url()).pathname
  );
  await navWeb.close();
}

/* ==================================================================
 * §3 — LE ROND DE PROFIL : qui reçoit le toucher
 * ================================================================== */
titre("§3 — le rond de profil de la fenêtre partagée");

if (!slug) {
  nonJoue("§3", "aucune fiche servie par ce conteneur");
} else {
  const pr = await ctx.newPage();
  await pr.goto(`${BASE}${adressePartagee}&sonde-clic=1`, {
    waitUntil: "networkidle",
  });
  await pr.waitForTimeout(1200);
  const point = await pr.evaluate(() => {
    const a = document.querySelector('[data-fenetre-carrousel] a[href*="#profil"]');
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + r.height / 2);
    const pile = document.elementsFromPoint(x, y);
    const decrire = (e) =>
      e.tagName.toLowerCase() +
      [...e.attributes]
        .filter((m) => m.name.startsWith("data-"))
        .map((m) => `[${m.name}]`)
        .join("");
    return {
      x,
      y,
      href: a.getAttribute("href"),
      pile: pile.slice(0, 6).map(decrire).join(" › "),
      lien:
        pile.find((e) => e.closest("a[href]"))?.closest("a[href]")?.getAttribute("href") ??
        "AUCUN",
    };
  });
  if (!point) {
    nonJoue("§3", "la fenêtre n'a pas de rond de profil sur cette fiche");
  } else {
    verif(
      "rien n'est posé par-dessus le rond",
      point.lien === point.href,
      `sous le doigt : ${point.lien} · pile : ${point.pile}`
    );
    const avant = new URL(pr.url()).pathname;
    await pr.touchscreen.tap(point.x, point.y);
    await pr.waitForTimeout(1800);
    const apres = new URL(pr.url()).pathname;
    verif(
      "un vrai toucher au centre du rond emmène bien sur la fiche",
      apres === `/tatoueur/${slug}` && apres !== avant,
      `${avant} → ${apres}`
    );
  }
  await pr.close();

  //  LA FENÊTRE SUPERPOSÉE — l'autre cas, celui du propriétaire.
  const pf = await ctx.newPage();
  await pf.goto(`${BASE}/tatoueur/${slug}`, { waitUntil: "networkidle" });
  await pf.waitForTimeout(1400);
  const photos = await pf.evaluate(
    () =>
      document.querySelectorAll("[data-photo-serie], [data-galerie] img, main figure img")
        .length
  );
  await pf.close();
  if (!photos) {
    nonJoue(
      "§3 · fenêtre SUPERPOSÉE",
      "la fiche servie ici n'a aucune photo de portfolio (elles viennent " +
        "de Supabase, injoignable depuis ce conteneur : « Host not in " +
        "allowlist ») — la fenêtre ne peut pas être ouverte par-dessus"
    );
  }
}

/* ================================================================== */
titre("§3-bis — la sonde du clic est en place et dit tout");
const sonde = lire("src/components/SondeClic.tsx");
verif("elle s'arme sur ?sonde-clic=1", /has\("sonde-clic"\)/.test(sonde));
verif(
  "elle relève la pile au point touché",
  /elementsFromPoint/.test(sonde) && /capture: true/.test(sonde)
);
verif(
  "elle dit si l'événement a été arrêté en route",
  /ARRÊTÉ EN ROUTE/.test(sonde)
);
verif(
  "et elle dit si rien n'a bougé après le toucher",
  /RIEN N'A BOUGÉ/.test(sonde)
);
verif(
  "elle est inscrite au bandeau des chantiers ouverts",
  /sonde-clic=1/.test(lire("src/lib/navigation-session.ts"))
);

await nav.close();
process.exit(bilan());
