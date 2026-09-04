//  ██ BANC 840 (web) — LE CLAVIER, ET LE BORD DROIT AU PIXEL ██
//  Les deux défauts relevés par le propriétaire sur la carte-galerie de
//  la nº 839 : les flèches du clavier ne faisaient rien sur la carte
//  survolée, et une bande de la photo SUIVANTE restait au bord droit.
//  Le banc mesure les deux — le clavier par le compteur et par l'adresse
//  du lien, le bord droit EN LISANT LES PIXELS d'une capture, à quatre
//  largeurs de fenêtre (dont trois qui donnent des cartes de largeur
//  FRACTIONNAIRE, seul cas où le défaut apparaissait), à toutes les
//  positions de la galerie, et après ouverture puis fermeture de la
//  fiche. L'atelier attendu est décrit dans `banc-socle.mjs`.
import zlib from "node:zlib";
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

/*  UNE FICHE AUX PHOTOS DE COULEURS FRANCHEMENT DIFFÉRENTES : les
    images de démonstration sont un aplat par style, on emprunte donc
    l'aplat d'un AUTRE style pour chaque rang. Sans cela, deux photos
    voisines se ressemblent trop pour qu'une bande de l'une se
    distingue de l'autre — et le banc ne prouverait rien. */
const T = `banc840-${Date.now()}`;
const TEINTES = ["blackwork", "old-school", "geometrique", "ornemental", "japonais"];
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: T, slug: T, nom: "Banc 840", styles: ["blackwork"], ville_slug: `lyon-${T}` });
  await ranger("photos_tatoueur", TEINTES.map((teinte, i) => ({
    id: `${T}-p${i + 1}`, tatoueur_id: T, style: "blackwork", rendu: "black", nature: "tatouage",
    url: `/images-demo/tatouage/${teinte}-1.svg`, miniature: `/images-demo/tatouage/${teinte}-1.svg`,
    ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
  })));
}

/*  ⚠️ ON VISE LA CARTE DU BANC, JAMAIS « LA PREMIÈRE » : la mosaïque
    en montre des dizaines, et leur ordre n'est pas à nous. */
const CARTE = `[data-carte]:has([data-lien-carte][href*="${T}"])`;

/*  LIRE UNE CAPTURE SANS BIBLIOTHÈQUE : un PNG est une suite de blocs,
    et ses lignes sont filtrées une à une (les cinq filtres de la
    spécification). Trente lignes de code valent mieux qu'une
    dépendance pour compter des pixels. */
function pixels(tampon) {
  let i = 8, larg, haut, coul, idat = Buffer.alloc(0);
  while (i < tampon.length) {
    const n = tampon.readUInt32BE(i), t = tampon.toString("ascii", i + 4, i + 8);
    if (t === "IHDR") { larg = tampon.readUInt32BE(i + 8); haut = tampon.readUInt32BE(i + 12); coul = tampon[i + 17]; }
    if (t === "IDAT") idat = Buffer.concat([idat, tampon.subarray(i + 8, i + 8 + n)]);
    i += 12 + n;
  }
  const raw = zlib.inflateSync(idat), c = coul === 6 ? 4 : 3, ligne = larg * c;
  const out = Buffer.alloc(haut * ligne); let prev = Buffer.alloc(ligne), pos = 0;
  for (let y = 0; y < haut; y++) {
    const f = raw[pos++]; const cur = Buffer.from(raw.subarray(pos, pos + ligne)); pos += ligne;
    for (let x = 0; x < ligne; x++) {
      const a = x >= c ? cur[x - c] : 0, b = prev[x], d = x >= c ? prev[x - c] : 0;
      if (f === 1) cur[x] = (cur[x] + a) & 255;
      else if (f === 2) cur[x] = (cur[x] + b) & 255;
      else if (f === 3) cur[x] = (cur[x] + ((a + b) >> 1)) & 255;
      else if (f === 4) { const pa = Math.abs(b - d), pb = Math.abs(a - d), pc = Math.abs(a + b - 2 * d); cur[x] = (cur[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : d)) & 255; }
    }
    cur.copy(out, y * ligne); prev = cur;
  }
  return { larg, c, out };
}

/** LE PLUS GRAND ÉCART DE COULEUR entre deux colonnes voisines, dans les
    six dernières colonnes de l'encadré. Une photo est un dégradé : d'une
    colonne à l'autre, elle bouge de deux ou trois. Une BANDE de l'image
    suivante, elle, fait un saut de plusieurs dizaines — c'est cela qu'on
    mesure, et rien d'autre. */
const RUPTURE = 12;
async function bordDroit(page) {
  const g = await page.evaluate((SEL) => {
    const piste = document.querySelector(SEL + " [data-piste-de-carte]");
    const c = piste.parentElement.getBoundingClientRect();
    /*  LE DÉCALAGE DE LA PHOTO MONTRÉE, EN REMONTANT JUSQU'À L'ENCADRÉ.
        ⚠️ ON NE REGARDE PAS QUE LA CASE : à la nº 839 la transformation
        vivait sur la PISTE, au-dessus d'elle — une case sans
        transformation propre était quand même déplacée, et
        rééchantillonnée avec sa piste. On additionne donc ce que
        portent la case ET tous ses parents jusqu'au cadre. */
    const montree = [...piste.children].find((n) => {
      const r = n.getBoundingClientRect();
      return Math.abs(r.left - c.left) < 0.51;
    });
    const portees = [];
    for (let n = montree; n && n !== piste.parentElement; n = n.parentElement) {
      const t = getComputedStyle(n).transform;
      if (t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)") portees.push(t);
    }
    return { x: c.left, y: c.top, w: c.width, h: c.height, decalage: montree ? (portees.join(" + ") || "aucune") : "aucune case" };
  }, CARTE);
  //  ⚠️ LE LISERÉ COURT SUR TOUTE LA HAUTEUR : on lit trois lignes — un
  //  quart, la moitié, trois quarts — et on garde la pire. Une seule
  //  ligne laisserait passer un défaut que l'œil, lui, verrait.
  const hauteur = Math.floor(g.h);
  const tampon = await page.screenshot({ clip: { x: Math.floor(g.x), y: Math.floor(g.y), width: Math.floor(g.x + g.w) - Math.floor(g.x), height: hauteur } });
  const { larg, c, out } = pixels(tampon);
  let saut = 0, pire = "";
  for (const y of [Math.floor(hauteur / 4), Math.floor(hauteur / 2), Math.floor((hauteur * 3) / 4)]) {
    const lues = [];
    for (let x = Math.max(0, larg - 6); x < larg; x++) { const o = (y * larg + x) * c; lues.push([out[o], out[o + 1], out[o + 2]]); }
    for (let k = 1; k < lues.length; k++) {
      const d = Math.max(...[0, 1, 2].map((v) => Math.abs(lues[k][v] - lues[k - 1][v])));
      if (d > saut) { saut = d; pire = `ligne ${y} : ${lues.map((q) => q.join(",")).join(" | ")}`; }
    }
    if (!pire) pire = `ligne ${y} : ${lues.map((q) => q.join(",")).join(" | ")}`;
  }
  return { saut, colonnes: pire, cadre: g.w, decalage: g.decalage };
}

const { nav, page } = await ouvrir("web");
try {
  //  ── 1. LE CLAVIER ──────────────────────────────────────────────────
  titre("840 · les flèches du clavier font défiler la carte survolée");
  await page.setViewportSize({ width: 1442, height: 950 });
  await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const compteur = () => page.locator(`${CARTE} [data-compteur-de-carte]`).first().textContent();
  const rangDeLAdresse = async () => new URL(await page.locator(`${CARTE} [data-lien-carte]`).first().getAttribute("href"), BASE).searchParams.get("photo");
  await page.locator(CARTE).first().scrollIntoViewIfNeeded();
  await page.locator(CARTE).first().hover();
  await page.waitForTimeout(400);
  const depart = await compteur(), photoDepart = await rangDeLAdresse();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  const apresDroite = await compteur(), photoDroite = await rangDeLAdresse();
  verif("→ fait avancer d'une photo", apresDroite === depart.replace(/^1/, "2"), `${depart} → ${apresDroite}`);
  verif("la photo regardée suit (le lien change de cible)", photoDroite !== photoDepart, `${photoDepart} → ${photoDroite}`);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  const troisieme = await compteur();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(700);
  verif("← fait reculer d'une photo", (await compteur()) === troisieme.replace(/^3/, "2"), `${troisieme} → ${await compteur()}`);
  //  LES GARDES : la souris ailleurs, plus rien ne répond.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);
  const avantHorsSurvol = await compteur();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  verif("hors de toute carte, les flèches ne touchent à rien", (await compteur()) === avantHorsSurvol, avantHorsSurvol);
  await page.locator(CARTE).first().hover();
  await page.waitForTimeout(300);
  const avantModif = await compteur();
  await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(400);
  verif("une touche accompagnée reste au navigateur", (await compteur()) === avantModif, avantModif);
  //  AU BOUT, LE CLAVIER S'ARRÊTE COMME LE CHEVRON.
  for (let k = 0; k < 8; k++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(320); }
  const fin = await compteur();
  verif("au bout de la galerie, la course s'arrête (elle ne boucle pas)", fin === `${TEINTES.length}/${TEINTES.length}`, fin);

  //  ── 2. LE BORD DROIT, À TOUTES LES POSITIONS ───────────────────────
  for (const L of [1440, 1442, 1443, 1450]) {
    titre(`840 · le bord droit au pixel — fenêtre de ${L} px`);
    await page.setViewportSize({ width: L, height: 950 });
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    await page.locator(CARTE).first().hover();
    await page.waitForTimeout(400);
    for (let rang = 0; rang < TEINTES.length; rang++) {
      if (rang > 0) {
        await page.locator(`${CARTE} [data-fleche-de-carte="droite"]`).first().click();
        await page.waitForTimeout(700);
      }
      const m = await bordDroit(page);
      verif(`rang ${rang + 1}/${TEINTES.length} : la dernière colonne appartient à la photo montrée`, m.saut <= RUPTURE, `cadre ${m.cadre.toFixed(2)} px · saut max ${m.saut} · ${m.colonnes}`);
      verif(`rang ${rang + 1}/${TEINTES.length} : la photo montrée n'est pas transformée (rien à rééchantillonner)`, m.decalage === "aucune", m.decalage);
    }
    //  ── 3. APRÈS OUVERTURE PUIS FERMETURE DE LA FICHE ────────────────
    const cadre = await page.evaluate((SEL) => {
      const r = document.querySelector(SEL + " [data-piste-de-carte]").parentElement.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, CARTE);
    await page.mouse.click(cadre.x, cadre.y);
    await page.waitForSelector("[role=dialog]", { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("[role=dialog]"), null, { timeout: 15000 });
    await page.waitForTimeout(900);
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    await page.locator(CARTE).first().hover();
    await page.waitForTimeout(400);
    const apresFiche = await bordDroit(page);
    verif(`après ouverture puis fermeture de la fiche, le bord reste net (${L} px)`, apresFiche.saut <= RUPTURE && apresFiche.decalage === "aucune", `saut max ${apresFiche.saut} · décalage ${apresFiche.decalage} · ${apresFiche.colonnes}`);
  }
} catch (e) {
  verif("déroulement du banc 840", false, String(e).slice(0, 400));
} finally {
  await nav.close();
}
process.exit(bilan());
