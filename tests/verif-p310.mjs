/**
 * BANC DE LA PASSE Nº 310 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — ANNULATION du décalage de la nº 308 : au repos, la première
 *      photo repart de l'alignement des titres.
 * §2 — LE CÔTÉ DROIT TOUCHE LE BORD, ET LA CAUSE EST ENFIN TROUVÉE :
 *      la largeur d'une case est calculée pour qu'il Y AIT une
 *      troisième photo. Une série de DEUX ne remplissait donc pas le
 *      cadre — 21 px de vide mesurés, 202 px à une seule photo, 0 dès
 *      trois. Mes relevés précédents portaient tous sur une série de
 *      cinq : je mesurais le seul cas qui allait bien. Le banc décode
 *      donc la peinture SUR TOUTES LES LONGUEURS de série.
 * §3 — LE TRACÉ du chevron gauche est décodé EN PIXELS, pas sa boîte.
 * §4 — Deux tailles de chevron, UN dessin : « Ma sélection » retrouve
 *      celle de la nº 301, la fiche garde la petite de la nº 308.
 * §5 — Cliquer une photo la pose dans le grand cadre DANS LES DEUX
 *      contextes — la page pleine ET la fenêtre centrée superposée.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2 — celle du propriétaire.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";
import { lirePixels } from "./_pixels.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const galerie = sansNotes(lire("src/components/GalerieQuiDefile.tsx"));
const affiche = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));
const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const fenetre = sansNotes(lire("src/components/FenetreFiche.tsx"));

/** Cinq photos — la plus longue série de la base locale. */
const LONGUE = "/tatoueur/ligne-claire-studio-nantes";
const SERIE = "cyberpunk·color";
/** Des séries de UNE, DEUX et TROIS photos — le cas du §2. */
const COURTES = "/tatoueur/atelier-boreal-montreal";

/* ==================================================================
 * À LA SOURCE
 * ================================================================== */
titre("§1 · §4 à la source — ce qui est revenu, et ce qui est réglable");
{
  verif(
    "§1 — le débord de 40 px est de nouveau porté par la RANGÉE, en rembourrage",
    /classeRangee="-ml-10 pl-10 scroll-pl-10"/.test(affiche) &&
      /classeEnveloppe="mt-2\.5"/.test(affiche) &&
      !/classeEnveloppe="mt-2\.5 -ml-10"/.test(affiche)
  );
  verif(
    "§1 — LA BANDE D'EFFACEMENT DE 40 px EST GARDÉE, en deux lignes littérales",
    /WebkitMaskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
      affiche
    ) &&
      /\bmaskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
        affiche
      )
  );
  verif(
    "§2 — les cases GRANDISSENT quand la série ne remplit pas, sans jamais rétrécir",
    /className="grow shrink-0 snap-start basis-\[calc\(\(100%_-_6px\)\/2\.1\)\]"/.test(
      affiche
    )
  );
  verif(
    "§4 — la taille du chevron est un RÉGLAGE, pas un second dessin",
    /chevron = CHEVRON_GALERIE/.test(galerie) &&
      /\$\{chevron\.zone\}/.test(galerie) &&
      /width=\{chevron\.largeur\}/.test(galerie) &&
      /strokeWidth=\{chevron\.trait\}/.test(galerie)
  );
  verif(
    "§4 — le DÉFAUT du dessin est celui de la nº 301 (zone 40, 20 × 40, trait 3)",
    /zone: "w-10",\s*\n\s*largeur: 20,\s*\n\s*hauteur: 40,\s*\n\s*trait: "3",/.test(
      galerie
    )
  );
  verif(
    "§4 — « Ma sélection » ne passe AUCUN chevron : elle reprend donc la nº 301",
    !/chevron=/.test(suivis) && !/ecart=/.test(suivis)
  );
  verif(
    "§4 — la fiche, elle, demande le petit",
    /chevron=\{CHEVRON_GALERIE_PETIT\}/.test(affiche) &&
      /zone: "w-7",\s*\n\s*largeur: 14,\s*\n\s*hauteur: 28,\s*\n\s*trait: "2\.5",/.test(
        galerie
      )
  );
  verif(
    "§5 — la fenêtre superposée n'écrase plus l'indice à zéro",
    /setIndice\(serie\.indice \?\? 0\);/.test(fenetre) &&
      !/setIndice\(0\);/.test(fenetre)
  );
  verif(
    "l'ombre du chevron n'est PAS réglable — elle est écrite une fois",
    (galerie.match(/drop-shadow\(0_1px_3px_rgba\(0,0,0,0\.65\)\)/g) ?? [])
      .length === 1
  );
  verif(
    "AUCUN POINT de défilement dans le dessin",
    !/PointsDuCarrousel|data-role="pagination"/.test(galerie)
  );
}

/* ==================================================================
 * EN VIVANT
 * ================================================================== */
const nav = await chromium.launch({
  executablePath: process.env.CHEMIN_CHROMIUM,
  args: ["--no-proxy-server"],
});
const ctx = await nav.newContext({
  viewport: { width: 1440, height: 823 },
  deviceScaleFactor: 2,
});
let page = await ctx.newPage();

/** Ouvre une fiche sur l'onglet Portfolio. */
async function ouvrir(fiche) {
  await page.goto(BASE + fiche, { waitUntil: "networkidle" });
  await page.locator('button:text-is("Portfolio")').first().click();
  await page.waitForSelector("[data-galerie-serie]");
  await page.waitForTimeout(800);
}

/** Le dernier pixel PEINT d'une galerie, en px CSS. Les cases sont
    repeintes d'un magenta franc : on lit ce qui est à l'écran, jamais
    une boîte. */
async function derniersPixels(sel) {
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ block: "center" });
  }, sel);
  await page.waitForTimeout(350);
  await page.addStyleTag({
    content: `${sel} [data-case-galerie] span { background: #FF00FF !important; }
              ${sel} [data-case-galerie] img { opacity: 0 !important; }`,
  });
  await page.waitForTimeout(250);
  const g = await page.evaluate((s) => {
    const bloc = document.querySelector(s);
    const ul = bloc.querySelector("[data-galerie-defilante]");
    const t = bloc.querySelector("[data-titre-galerie]");
    const r = ul.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    return {
      y: Math.round(r.top + r.height / 2),
      titreGauche: +tr.left.toFixed(2),
      titreDroite: +tr.right.toFixed(2),
      n: bloc.querySelectorAll("[data-case-galerie]").length,
    };
  }, sel);
  const png = await page.screenshot({
    clip: { x: 0, y: g.y - 1, width: 1440, height: 3 },
  });
  const px = lirePixels(png);
  let premier = null,
    dernier = null;
  for (let x = 0; x < px.largeur; x += 1) {
    const [r, v, b] = px.pixel(x, 3);
    if (r > 200 && v < 90 && b > 200) {
      if (premier === null) premier = x;
      dernier = x;
    }
  }
  return {
    ...g,
    debut: premier === null ? null : premier / 2,
    fin: dernier === null ? null : (dernier + 1) / 2,
  };
}

titre("§1 en vivant — au repos, la première photo repart des titres");
{
  await ouvrir(LONGUE);
  const p = await derniersPixels(`[data-galerie-serie="${SERIE}"]`);
  verif(
    "la PEINTURE commence à l'alignement gauche des titres",
    p.debut !== null && Math.abs(p.debut - p.titreGauche) < 1,
    `peinture ${p.debut} · titres ${p.titreGauche}`
  );
  const boites = await page.evaluate((s) => {
    const bloc = document.querySelector(s);
    const c = bloc.querySelector("[data-case-galerie]");
    const t = bloc.querySelector("[data-titre-galerie]");
    const ul = bloc.querySelector("[data-galerie-defilante]");
    const st = getComputedStyle(ul);
    const troisieme = bloc.querySelectorAll("[data-case-galerie]")[2];
    const droite =
      ul.getBoundingClientRect().right - parseFloat(st.paddingRight);
    return {
      premiereGauche: +c.getBoundingClientRect().left.toFixed(2),
      titreGauche: +t.getBoundingClientRect().left.toFixed(2),
      rangeeGauche: +ul.getBoundingClientRect().left.toFixed(2),
      rembourrage: `${st.paddingLeft} / ${st.paddingRight}`,
      ecart: st.columnGap,
      largeurCase: +c.getBoundingClientRect().width.toFixed(3),
      partVisible3e: +(
        ((droite - troisieme.getBoundingClientRect().left) /
          troisieme.getBoundingClientRect().width) *
        100
      ).toFixed(2),
    };
  }, `[data-galerie-serie="${SERIE}"]`);
  verif(
    "la première case commence EXACTEMENT à l'alignement des titres",
    Math.abs(boites.premiereGauche - boites.titreGauche) < 0.001,
    `case ${boites.premiereGauche} · titres ${boites.titreGauche}`
  );
  verif(
    "…et la rangée déborde bien de 40 px à sa gauche (la bande d'effacement)",
    Math.abs(boites.titreGauche - boites.rangeeGauche - 40) < 0.5 &&
      boites.rembourrage === "40px / 0px",
    `rangée ${boites.rangeeGauche} · rembourrage ${boites.rembourrage}`
  );
  verif(
    "l'écart entre photos est resté à 3 px sur la fiche",
    boites.ecart === "3px",
    boites.ecart
  );
  verif(
    "DEUX PHOTOS PLEINES ET 10 % DE LA TROISIÈME — la règle est intacte",
    Math.abs(boites.partVisible3e - 10) < 0.2,
    `${boites.partVisible3e} % · case ${boites.largeurCase} px`
  );
}

titre("§2 au pixel — le bord droit, SUR TOUTES LES LONGUEURS DE SÉRIE");
{
  await ouvrir(COURTES);
  const series = await page.evaluate(() =>
    [...document.querySelectorAll("[data-galerie-serie]")].map((g) => ({
      serie: g.getAttribute("data-galerie-serie"),
      n: g.querySelectorAll("[data-case-galerie]").length,
    }))
  );
  //  On veut au moins une série d'UNE photo et une de DEUX : ce sont
  //  elles qui montraient le vide.
  const longueurs = new Set(series.map((s) => s.n));
  verif(
    "la fiche d'épreuve porte bien des séries COURTES (1 et 2 photos)",
    longueurs.has(1) && longueurs.has(2),
    `longueurs présentes : ${[...longueurs].sort().join(", ")}`
  );
  let toutes = true;
  const detail = [];
  for (const { serie, n } of series) {
    const p = await derniersPixels(`[data-galerie-serie="${serie}"]`);
    const ecart = p.fin === null ? null : +(p.titreDroite - p.fin).toFixed(2);
    detail.push(`${n}→${ecart}`);
    if (ecart === null || Math.abs(ecart) >= 1) toutes = false;
  }
  verif(
    "la peinture atteint l'alignement DROIT des titres, quelle que soit la série",
    toutes,
    `${series.length} série(s) · écarts (photos→px) : ${detail.join(" ")}`
  );

  //  ET SUR LA SÉRIE LONGUE AUSSI, au repos et en fin de course.
  await ouvrir(LONGUE);
  const sel = `[data-galerie-serie="${SERIE}"]`;
  const repos = await derniersPixels(sel);
  verif(
    "série de 5 · AU REPOS : la peinture atteint l'alignement des titres",
    repos.fin !== null && Math.abs(repos.titreDroite - repos.fin) < 1,
    `écart ${(repos.titreDroite - repos.fin).toFixed(2)} px`
  );
  await page.evaluate((s) => {
    const ul = document.querySelector(s + " [data-galerie-defilante]");
    ul.scrollTo({ left: ul.scrollWidth, behavior: "instant" });
  }, sel);
  await page.waitForTimeout(800);
  const fin = await derniersPixels(sel);
  verif(
    "série de 5 · EN FIN DE COURSE : elle l'atteint encore",
    fin.fin !== null && Math.abs(fin.titreDroite - fin.fin) < 1,
    `écart ${(fin.titreDroite - fin.fin).toFixed(2)} px`
  );
}

titre("§3 au pixel — le TRACÉ du chevron gauche, pas sa boîte");
{
  await ouvrir(LONGUE);
  const sel = `[data-galerie-serie="${SERIE}"]`;
  await page.evaluate((s) => {
    const ul = document.querySelector(s + " [data-galerie-defilante]");
    ul.style.scrollSnapType = "none";
    ul.scrollLeft = 120;
  }, sel);
  await page.waitForTimeout(500);
  await page.hover(sel);
  await page.waitForTimeout(400);
  const fl = await page.evaluate((s) => {
    const bloc = document.querySelector(s);
    const b = bloc.querySelector('[data-bandeau-defilement="gauche"]');
    if (!b) return null;
    const svg = b.querySelector("svg");
    const sb = svg.getBoundingClientRect();
    //  ⚠️ ON PEINT LE TRACÉ EN VERT FRANC : c'est LUI qu'on décode,
    //  pas la boîte du bouton. Un chevron blanc sur une photo claire
    //  serait indécodable.
    svg.style.color = "#00FF00";
    return {
      boite: [
        +sb.left.toFixed(2),
        +sb.right.toFixed(2),
        +sb.top.toFixed(2),
        +sb.bottom.toFixed(2),
      ],
      photoDroite: +document
        .querySelector("[data-photo-fiche]")
        .getBoundingClientRect()
        .right.toFixed(2),
      couperet: +bloc
        .closest("[class*='overflow-y-auto']")
        .getBoundingClientRect()
        .left.toFixed(2),
    };
  }, sel);
  if (!fl) {
    nonJoue("§3 le chevron gauche", "le bandeau n'existe pas à cette position");
  } else {
    await page.waitForTimeout(200);
    const x0 = Math.floor(fl.boite[0]) - 30;
    const png = await page.screenshot({
      clip: {
        x: x0,
        y: Math.floor(fl.boite[2]),
        width: 80,
        height: Math.ceil(fl.boite[3] - fl.boite[2]),
      },
    });
    const px = lirePixels(png);
    let gmin = null,
      gmax = null;
    for (let x = 0; x < px.largeur; x += 1) {
      for (let y = 0; y < px.hauteur; y += 1) {
        const [r, v, b] = px.pixel(x, y);
        if (v > 170 && r < 120 && b < 120) {
          if (gmin === null || x < gmin) gmin = x;
          if (gmax === null || x > gmax) gmax = x;
        }
      }
    }
    const enCSS = (x) => x0 + x / 2;
    const trace = gmin === null ? null : [enCSS(gmin), enCSS(gmax + 1)];
    verif(
      "le tracé du chevron est PEINT (on décode bien quelque chose)",
      trace !== null,
      trace ? `${trace[0]} → ${trace[1]} px` : "aucun vert"
    );
    verif(
      "LE TRACÉ EST ENTIER : sa largeur peinte est celle du dessin",
      trace !== null && trace[1] - trace[0] >= 9,
      trace ? `${(trace[1] - trace[0]).toFixed(2)} px peints` : "—"
    );
    verif(
      "IL N'EMPIÈTE PAS SUR LA GRANDE PHOTO",
      trace !== null && trace[0] > fl.photoDroite,
      `tracé à ${trace?.[0]} · photo finit à ${fl.photoDroite}`
    );
    verif(
      "…et il est loin du couperet de la colonne",
      trace !== null && trace[0] - fl.couperet >= 20,
      `${trace === null ? "?" : (trace[0] - fl.couperet).toFixed(2)} px du couperet`
    );
  }
}

titre("§4 en vivant — la taille des chevrons sur la fiche");
{
  const sel = `[data-galerie-serie="${SERIE}"]`;
  await page.hover(sel);
  await page.waitForTimeout(300);
  const t = await page.evaluate((s) => {
    const bloc = document.querySelector(s);
    const lire = (cote) => {
      const b = bloc.querySelector(`[data-bandeau-defilement="${cote}"]`);
      if (!b) return null;
      const svg = b.querySelector("svg");
      const sb = svg.getBoundingClientRect();
      const bb = b.getBoundingClientRect();
      return {
        zone: +bb.width.toFixed(2),
        dessin: [+sb.width.toFixed(2), +sb.height.toFixed(2)],
        trait: svg.querySelector("path").getAttribute("stroke-width"),
        marge:
          cote === "droite"
            ? +(
                bloc
                  .querySelector("[data-galerie-defilante]")
                  .getBoundingClientRect().right - sb.right
              ).toFixed(2)
            : +(
                sb.left -
                bloc.querySelector("[data-titre-galerie]").getBoundingClientRect()
                  .left
              ).toFixed(2),
      };
    };
    return { gauche: lire("gauche"), droite: lire("droite") };
  }, sel);
  verif(
    "SUR LA FICHE : zone 28, dessin 14 × 28, trait 2,5",
    t.gauche &&
      t.gauche.zone === 28 &&
      t.gauche.dessin[0] === 14 &&
      t.gauche.dessin[1] === 28 &&
      t.gauche.trait === "2.5",
    t.gauche
      ? `${t.gauche.zone} · ${t.gauche.dessin.join(" × ")} · trait ${t.gauche.trait}`
      : "absent"
  );
  verif(
    "les deux chevrons restent posés pareil, chacun à 7 px de son bord",
    t.gauche &&
      t.droite &&
      Math.abs(t.gauche.marge - 7) < 0.5 &&
      Math.abs(t.droite.marge - 7) < 0.5,
    `gauche ${t.gauche?.marge} px · droite ${t.droite?.marge} px`
  );
}

titre("§5 en vivant — cliquer la 4ᵉ photo, DANS LES DEUX CONTEXTES");
{
  /** Clique la case `rang` et lit ce que le grand cadre affiche. */
  async function cliquer() {
    const attendu = await page.evaluate((s) => {
      const g = document.querySelector(`[data-galerie-serie="${s}"]`);
      const cases = g.querySelectorAll("[data-case-galerie]");
      const src = cases[3].querySelector("img").src.split("/").pop().split("?")[0];
      cases[3].querySelector("button").click();
      return src;
    }, SERIE);
    await page.waitForTimeout(1800);
    const vu = await page.evaluate(() => {
      const zone =
        document.querySelector('[role="dialog"], [aria-modal="true"]') ??
        document;
      const car = zone.querySelector('[data-carrousel="fiche"]');
      if (!car) return null;
      const cadre = car.querySelector('[data-role="cadre"]');
      const cols = [...car.querySelectorAll("[data-role^='colonne']")];
      const cr = cadre.getBoundingClientRect();
      const rang = cols.findIndex((c) => {
        const b = c.getBoundingClientRect();
        return b.left >= cr.left - 3 && b.left <= cr.left + 3;
      });
      return {
        rang,
        compteur: car.querySelector('[data-role="compteur"]')?.textContent.trim(),
        image: cols[rang < 0 ? 0 : rang]
          ?.querySelector("img")
          ?.src.split("/")
          .pop()
          .split("?")[0],
      };
    });
    return { attendu, vu };
  }

  //  A — LA FICHE PLEINE PAGE.
  await ouvrir(LONGUE);
  const a = await cliquer();
  verif(
    "FICHE PLEINE PAGE : la 4ᵉ photo cliquée est celle qui s'affiche",
    a.vu && a.vu.rang === 3 && a.vu.image === a.attendu,
    `attendu ${a.attendu} · vu ${a.vu?.image} · compteur ${a.vu?.compteur}`
  );

  //  B — LA FENÊTRE CENTRÉE SUPERPOSÉE, ouverte depuis la mosaïque.
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.locator(`a[href^="${LONGUE}"]`).first().click();
  await page.waitForSelector('[role="dialog"], [aria-modal="true"]', {
    timeout: 30000,
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"], [aria-modal="true"]');
    const b = [...dlg.querySelectorAll("button")].find((n) =>
      /^Portfolio$/i.test((n.textContent || "").trim())
    );
    b?.click();
  });
  await page.waitForSelector("[data-galerie-serie]", { timeout: 30000 });
  await page.waitForTimeout(900);
  const b = await cliquer();
  verif(
    "FENÊTRE SUPERPOSÉE : la 4ᵉ photo cliquée est celle qui s'affiche",
    b.vu && b.vu.rang === 3 && b.vu.image === b.attendu,
    `attendu ${b.attendu} · vu ${b.vu?.image} · compteur ${b.vu?.compteur}`
  );
}

titre("ce qui ne devait pas bouger");
{
  /*  ⚠️ UN ONGLET NEUF, ET C'EST NÉCESSAIRE : le §5 vient d'ouvrir la
      FENÊTRE SUPERPOSÉE, dont la note de retour survit au rechargement
      (RetourFenetreFiche). Recharger la fiche ici la rouvrirait par
      -dessus, et « le premier bouton Portfolio » serait celui de la page
      du dessous, inerte — le relevé porterait alors sur une galerie qui
      n'existe pas. Une page neuve n'a pas cette note. */
  await page.close();
  page = await ctx.newPage();
  await ouvrir(LONGUE);
  //  ⚠️ LA PREMIÈRE GALERIE VENUE, et pas une série nommée : le clic du
  //  §5 vient de changer la série affichée en haut, donc l'ordre des
  //  blocs. Ce qu'on contrôle ici ne dépend d'aucune série en
  //  particulier.
  const garde = await page.evaluate(() => {
    const bloc = document.querySelector("[data-galerie-serie]");
    const ul = bloc.querySelector("[data-galerie-defilante]");
    const zone = document.querySelector("[data-photo-fiche]");
    const cadre = zone
      .querySelector('[data-carrousel="fiche"]')
      .querySelector('[data-role="cadre"]');
    const cb = cadre.getBoundingClientRect();
    const cs = getComputedStyle(ul.closest("[class*='overflow-y-auto']"));
    return {
      masque: getComputedStyle(ul).maskImage,
      points: Boolean(bloc.querySelector('[data-role="pagination"]')),
      rapport: +(cb.width / cb.height).toFixed(4),
      largeur: +cb.width.toFixed(2),
      colonne: `${cs.paddingLeft}/${cs.paddingRight} · ${cs.marginLeft}/${cs.marginRight}`,
    };
  });
  verif(
    "la bande d'effacement de 40 px est intacte",
    /0px/.test(garde.masque) && /40px/.test(garde.masque),
    garde.masque.slice(0, 74)
  );
  verif("aucun point de défilement", !garde.points);
  verif(
    "le cadre photo de la fiche garde son format 4/5",
    Math.abs(garde.rapport - 0.8) < 0.002,
    `${garde.largeur} px · rapport ${garde.rapport}`
  );
  verif(
    "le rognage asymétrique de la colonne (nº 306) n'a pas bougé",
    garde.colonne === "40px/12px · -40px/-12px",
    garde.colonne
  );
}

nonJoue(
  "« MA SÉLECTION » EN VIVANT",
  "la page /mes-favoris exige une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer. Ce qu'elle consomme " +
    "est vérifié à la source, au caractère près : elle ne passe NI " +
    "`chevron` NI `ecart`, elle reprend donc les valeurs par défaut du " +
    "dessin — celles de la nº 301 (zone 40, dessin 20 × 40, trait 3) et " +
    "l'écart de 6 px de la nº 244"
);

await ctx.close();
await nav.close();
process.exit(bilan());
