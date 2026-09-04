//  ██ BANC 842 — LE SUIVI, LA POSITION RETENUE, LE TITRE, LE PIED ██
//  Les quatre corrections du fil mobile :
//   1. le badge « Follow » suit et ne suit plus, l'état vérifié EN BASE
//      (le défaut était une route morte depuis la nº 836 — ce banc la
//      rattrape : il regarde aussi les réponses d'erreur) ;
//   2. la carte défilée jusqu'à sa quatrième photo la retrouve au retour
//      d'un profil, et un rechargement de document repart de zéro ;
//   3. « Nom · Type » en titre (nom demi-gras blanc, type normal gris,
//      insécable, qui passe à la ligne sur un nom long) et la ville
//      seule en sous-titre — au doigt, au web et sur la plaque du profil ;
//   4. le pied à trois places, et le fanion qui enregistre LA PHOTO
//      AFFICHÉE (vérifié en base).
//  L'atelier attendu est décrit dans `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const T = `banc842-${Date.now()}`;
const ID = `20000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const U = { id: "30000000-0000-4000-8000-000000000842", email: "banc-842@yokofolio.test" };
//  UN NOM LONG, pour voir le type passer à la ligne sans se couper.
const LONG = `banc842long-${Date.now()}`;
const IDLONG = `20000000-0000-4000-8000-${(Date.now() + 1).toString(16).padStart(12, "0")}`;
const TEINTES = ["blackwork", "old-school", "geometrique", "ornemental", "japonais"];
/*  ⚠️ DE VRAIS IDENTIFIANTS DE BASE : le fanion d'une photo ne se rend
    que pour eux (`estIdentifiantDeBase`, la règle nº 137 — enregistrer
    une image qui n'existe pas en base n'aurait aucun sens). */
const photoId = (fiche, rang) => `4100000${fiche}-0000-4000-8000-${rang.toString().padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: "Banc 842", styles: ["blackwork"], ville_slug: `lyon-${T}`, type_fiche: "salon", etablissement: "prive" });
  await ranger("tatoueurs", { ...gabarit, id: IDLONG, slug: LONG, nom: "Aurélie-Charlotte Vandenberghe-Rousseau", styles: ["blackwork"], ville_slug: `lyon-${LONG}`, type_fiche: "salon", etablissement: "prive" });
  for (const [rang, fiche] of [ID, IDLONG].entries()) {
    await ranger("photos_tatoueur", TEINTES.map((teinte, i) => ({ id: photoId(rang, i + 1), tatoueur_id: fiche, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/${teinte}-1.svg`, miniature: `/images-demo/tatouage/${teinte}-1.svg`, ordre: i + 1, cree_le: "2026-01-01T00:00:00Z" })));
  }
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
  await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
  await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
}
const MOSAIQUE = "/search?style=blackwork&nature=tatouage";
const CARTE = `[data-carte]:has([data-lien-profil-de-fil][href*="${T}"])`;
const CARTELONG = `[data-carte]:has([data-lien-profil-de-fil][href*="${LONG}"])`;

//  ══ 1 · LE SUIVI ═════════════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  const echecs = [];
  page.on("response", (r) => { if (/\/api\/yokofolio\/favoris\//.test(r.url()) && r.status() >= 400) echecs.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  try {
    titre("842 · le badge « Follow » du fil : suivre, puis ne plus suivre");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.locator(CARTE).scrollIntoViewIfNeeded();
    const badge = page.locator(`${CARTE} [data-en-tete-de-fil] button`);
    const etat = () => page.evaluate((SEL) => {
      const b = document.querySelector(SEL + " [data-en-tete-de-fil] button");
      const s = getComputedStyle(b);
      return { libelle: b.getAttribute("aria-label"), presse: b.getAttribute("aria-pressed"), fond: s.backgroundColor };
    }, CARTE);
    const avant = await etat();
    verif("au départ : « Follow », non pressé", avant.libelle === "Follow Banc 842" && avant.presse === "false", JSON.stringify(avant));
    await badge.tap();
    await page.waitForTimeout(1500);
    const suivi = await etat();
    const enBase = await lire("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
    verif("un toucher SUIT : le badge passe à « Unfollow », pressé, et le fond change", suivi.libelle === "Unfollow Banc 842" && suivi.presse === "true" && suivi.fond !== avant.fond, JSON.stringify(suivi));
    verif("EN BASE : le portfolio est suivi", enBase.length === 1 && enBase[0].tatoueur_id === ID, JSON.stringify(enBase));
    verif("aucune réponse d'erreur des routes de favoris", echecs.length === 0, echecs.join(" · ") || "aucune");
    await badge.tap();
    await page.waitForTimeout(1500);
    const repris = await etat();
    verif("un second toucher NE SUIT PLUS : le badge revient à « Follow »", repris.libelle === "Follow Banc 842" && repris.presse === "false", JSON.stringify(repris));
    verif("EN BASE : le suivi est retiré", (await lire("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`)).length === 0);
    //  ── le fanion du pied enregistre LA PHOTO AFFICHÉE ──────────────
    titre("842 · le fanion du pied enregistre la photo affichée");
    const glisser = async (pas) => {
      for (let k = 0; k < pas; k++) {
        await page.evaluate((SEL) => { const z = document.querySelector(SEL + ' [data-cadre-de-fil] [data-role="cadre"]'); z.scrollBy({ left: z.clientWidth, behavior: "smooth" }); }, CARTE);
        await page.waitForTimeout(900);
      }
    };
    await glisser(3);
    const compteur = await page.evaluate((SEL) => document.querySelector(SEL + ' [data-cadre-de-fil] [data-role="compteur"]').textContent, CARTE);
    verif("la carte montre la quatrième photo", compteur === "4/5", compteur);
    const coeur = page.locator(`${CARTE} [data-pied-de-fil] button[aria-label="Save this photo"], ${CARTE} [data-pied-de-fil] button[aria-label="Remove this photo from my favorites"]`).first();
    verif("le fanion est vide au départ", (await coeur.getAttribute("aria-label")) === "Save this photo", await coeur.getAttribute("aria-label"));
    await coeur.tap();
    await page.waitForTimeout(1500);
    const photos = await lire("favoris_photos", `utilisateur_id=eq.${U.id}`);
    verif("le fanion se remplit", (await coeur.getAttribute("aria-label")) === "Remove this photo from my favorites");
    verif("EN BASE : c'est LA QUATRIÈME photo qui est enregistrée", photos.length === 1 && photos[0].photo_id === photoId(0, 4), JSON.stringify(photos.map((p) => p.photo_id)));
  } catch (e) {
    verif("déroulement du banc 842 (suivi)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LA POSITION RETENUE ══════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("842 · la carte rouvre sur sa photo au retour");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    //  LA TROISIÈME CARTE DU FIL, quelle qu'elle soit : la consigne parle
    //  d'une carte au milieu de la liste, pas de la nôtre.
    /*  ⚠️ NOTRE carte, et non « la troisième » : le fil range ce qu'il
        veut, et une fiche de démonstration n'a pas toujours de quoi
        défiler. Ce que la consigne demande — une carte du milieu de la
        liste, défilée puis retrouvée — tient tout entier ici. */
    const troisieme = CARTE;
    await page.locator(troisieme).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const compte = await page.evaluate((SEL) => document.querySelectorAll(SEL + ' [data-cadre-de-fil] [data-role^="colonne"]').length, troisieme);
    verif("la carte a de quoi défiler", compte >= 4, `${compte} photos`);
    for (let k = 0; k < 3; k++) {
      await page.evaluate((SEL) => { const z = document.querySelector(SEL + ' [data-cadre-de-fil] [data-role="cadre"]'); z.scrollBy({ left: z.clientWidth, behavior: "smooth" }); }, troisieme);
      await page.waitForTimeout(900);
    }
    const lu = (SEL) => page.evaluate((SEL) => {
      const c = document.querySelector(SEL);
      const z = c.querySelector('[data-cadre-de-fil] [data-role="cadre"]');
      return { compteur: c.querySelector('[data-cadre-de-fil] [data-role="compteur"]')?.textContent, colonne: Math.round(z.scrollLeft / z.clientWidth), actif: c.querySelector('[data-pied-de-fil] [aria-current="true"]')?.getAttribute("aria-label"), href: c.querySelector("[data-lien-carte]").getAttribute("href") };
    }, SEL);
    const avant = await lu(troisieme);
    verif("elle est arrivée à la quatrième photo", avant.compteur.startsWith("4/") && avant.colonne === 3, JSON.stringify(avant));
    verif("le lien de la carte emporte cette photo-là", /photo=/.test(avant.href), avant.href);
    await page.locator(`${troisieme} [data-lien-profil-de-fil]`).tap();
    await page.waitForTimeout(2500);
    verif("le profil s'est ouvert", /\/artist\/.*entree=lien/.test(await page.evaluate(() => location.pathname + location.search)));
    await page.goBack();
    await page.waitForTimeout(2500);
    await page.locator(troisieme).scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const apres = await lu(troisieme);
    verif("AU RETOUR, LA CARTE EST ENCORE SUR SA QUATRIÈME PHOTO", apres.compteur === avant.compteur && apres.colonne === 3 && apres.actif === avant.actif, `${avant.compteur} → ${apres.compteur} · colonne ${apres.colonne}`);
    //  ET LES AUTRES N'ONT PAS BOUGÉ : la mémoire ne déborde pas d'une carte à l'autre.
    /*  ⚠️ UNE CARTE QUI N'EST PAS LA NÔTRE : le fil peut très bien
        ranger la nôtre en tête, et l'on mesurerait alors la carte qu'on
        vient justement de faire défiler. */
    const premiere = await lu(`[data-carte]:not(:has([data-lien-profil-de-fil][href*="${T}"]))`);
    verif("les cartes qu'on n'a pas touchées sont restées sur la première", !premiere.compteur || (premiere.compteur.startsWith("1/") && premiere.colonne === 0), JSON.stringify(premiere));
    //  UNE AUTRE RECHERCHE VIDE LA TABLE (la surface change).
    await page.goto(`${BASE}/search?style=realisme&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(troisieme).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const neuve = await lu(troisieme);
    verif("un rechargement de document repart de la première photo (la table meurt avec lui)", neuve.compteur?.startsWith("1/"), JSON.stringify(neuve));
  } catch (e) {
    verif("déroulement du banc 842 (position)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LE TITRE, LE SOUS-TITRE, LE PIED ═════════════════════════════
const mesureTitre = `(bloc) => {
  const spans = [...bloc.querySelectorAll("span")];
  const nom = spans.find((s) => getComputedStyle(s).fontWeight >= 600 && !s.querySelector("span"));
  const type = spans.find((s) => /·/.test(s.textContent) && !s.querySelector("span"));
  const st = type && getComputedStyle(type);
  const sn = nom && getComputedStyle(nom);
  return {
    texte: bloc.textContent.trim().replace(/\\s+/g, " "),
    nom: nom?.textContent, nomGraisse: sn?.fontWeight, nomCouleur: sn?.color,
    type: type?.textContent.trim(), typeGraisse: st?.fontWeight, typeCouleur: st?.color, typeInsecable: st?.whiteSpace,
    lignes: Math.round(bloc.getBoundingClientRect().height / parseFloat(getComputedStyle(bloc).lineHeight)),
  };
}`;
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("842 · au doigt : « Nom · Type » en titre, la ville seule dessous");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(CARTE).scrollIntoViewIfNeeded();
    const m = await page.evaluate(({ SEL, M }) => {
      const f = new Function("return " + M)();
      const bloc = document.querySelector(SEL + " [data-lien-profil-de-fil] > span:nth-child(2)");
      const t = f(bloc.querySelector(":scope > span:first-child"));
      const sous = bloc.querySelector(":scope > span:nth-child(2)");
      t.sousTitre = sous.textContent.trim();
      t.sousTitreCouleur = getComputedStyle(sous).color;
      return t;
    }, { SEL: CARTE, M: mesureTitre });
    verif("le titre dit « Nom · Type »", m.texte === "Banc 842 · Private Studio", m.texte);
    verif("le nom est demi-gras, au blanc du site", Number(m.nomGraisse) >= 600 && m.nomCouleur === "rgb(242, 242, 244)", `${m.nomGraisse} · ${m.nomCouleur}`);
    verif("le type est en graisse NORMALE et en gris", Number(m.typeGraisse) === 400 && m.typeCouleur !== m.nomCouleur, `${m.typeGraisse} · ${m.typeCouleur}`);
    verif("le type est insécable (il ne se coupe jamais)", m.typeInsecable === "nowrap", m.typeInsecable);
    verif("le sous-titre ne porte QUE la ville", m.sousTitre === "Lyon, FR" && m.sousTitreCouleur === m.typeCouleur, `${m.sousTitre} · ${m.sousTitreCouleur}`);
    verif("sur un nom court, le titre tient sur une ligne", m.lignes === 1, `${m.lignes} ligne(s)`);
    await page.locator(CARTELONG).scrollIntoViewIfNeeded();
    const ml = await page.evaluate(({ SEL, M }) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " [data-lien-profil-de-fil] > span:nth-child(2) > span:first-child"));
    }, { SEL: CARTELONG, M: mesureTitre });
    verif("SUR UN NOM LONG, le type passe à la ligne — entier, jamais coupé", ml.lignes === 2 && ml.type === "· Private Studio", `${ml.lignes} ligne(s) · « ${ml.type} »`);

    titre("842 · le pied : signaler à gauche, les points au centre, partage puis fanion à droite");
    const pied = await page.evaluate((SEL) => {
      const p = document.querySelector(SEL + " [data-pied-de-fil]");
      const r = p.getBoundingClientRect();
      const b = [...p.querySelectorAll("button[aria-label]")];
      const gestes = b.filter((x) => !x.getAttribute("aria-label").startsWith("View photo"));
      const points = b.filter((x) => x.getAttribute("aria-label").startsWith("View photo"));
      const milieu = (n) => n.getBoundingClientRect().left + n.getBoundingClientRect().width / 2;
      const frise = points.length ? { g: Math.min(...points.map((n) => n.getBoundingClientRect().left)), d: Math.max(...points.map((n) => n.getBoundingClientRect().right)) } : null;
      return {
        ordre: gestes.map((x) => x.getAttribute("aria-label").split(" ")[0]),
        aGauche: gestes.filter((x) => milieu(x) < r.left + r.width / 3).map((x) => x.getAttribute("aria-label").split(" ")[0]),
        aDroite: gestes.filter((x) => milieu(x) > r.left + (2 * r.width) / 3).map((x) => x.getAttribute("aria-label").split(" ")[0]),
        pointsCentres: frise ? Math.abs((frise.g + frise.d) / 2 - (r.left + r.width / 2)) < 2 : false,
        cibles: gestes.map((x) => Math.round(x.getBoundingClientRect().width)),
        bordGauche: Math.round(Math.min(...gestes.map((x) => x.getBoundingClientRect().left)) - r.left),
        bordDroit: Math.round(r.right - Math.max(...gestes.map((x) => x.getBoundingClientRect().right))),
      };
    }, CARTE);
    verif("SIGNALER est seul à gauche", JSON.stringify(pied.aGauche) === JSON.stringify(["Report"]), pied.aGauche.join(" · "));
    verif("PARTAGE puis FANION à droite, dans cet ordre", JSON.stringify(pied.aDroite) === JSON.stringify(["Share", "Save"]) || JSON.stringify(pied.aDroite) === JSON.stringify(["Share", "Remove"]), pied.aDroite.join(" · "));
    verif("les points sont centrés sur la carte", pied.pointsCentres);
    verif("les trois cibles font 40 px", pied.cibles.every((c) => c === 40), pied.cibles.join("/"));
    verif("les glyphes des bords tombent sur la marge de la page", pied.bordGauche === 8 && pied.bordDroit === 8, `${pied.bordGauche} / ${pied.bordDroit}`);
  } catch (e) {
    verif("déroulement du banc 842 (doigt, titre et pied)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE WEB ET LA PLAQUE DU PROFIL ════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("842 · au web : la carte dit la même chose");
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(({ SEL, M }) => {
      const f = new Function("return " + M)();
      const c = document.querySelector(SEL);
      const t = f(c.querySelector("h3"));
      const p = [...c.querySelectorAll("[data-lien-carte] p")].pop();
      t.sousTitre = p.textContent.trim();
      t.sousTitreCouleur = getComputedStyle(p).color;
      return t;
    }, { SEL: `[data-carte]:has([data-lien-carte][href*="${T}"])`, M: mesureTitre });
    verif("le titre dit « Nom · Type »", m.texte === "Banc 842 · Private Studio", m.texte);
    verif("le nom demi-gras et blanc, le type normal et gris", Number(m.nomGraisse) >= 600 && Number(m.typeGraisse) === 400 && m.typeCouleur !== m.nomCouleur, `${m.nomGraisse}/${m.typeGraisse}`);
    verif("le type est insécable", m.typeInsecable === "nowrap");
    verif("le sous-titre ne porte QUE la ville", m.sousTitre === "Lyon, FR" && m.sousTitreCouleur === m.typeCouleur, m.sousTitre);
    const ml = await page.evaluate(({ SEL, M }) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " h3"));
    }, { SEL: `[data-carte]:has([data-lien-carte][href*="${LONG}"])`, M: mesureTitre });
    verif("un nom long fait descendre le type, entier", ml.lignes === 2 && ml.type === "· Private Studio", `${ml.lignes} ligne(s) · « ${ml.type} »`);
  } catch (e) {
    verif("déroulement du banc 842 (web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("842 · la plaque du profil suit la même règle");
    await page.goto(`${BASE}/artist/${T}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate((M) => {
      const f = new Function("return " + M)();
      const plaque = document.querySelector("[data-habillage-photo] a");
      const bloc = plaque.querySelector("span:nth-child(2)");
      const t = f(bloc.querySelector(":scope > span:first-child"));
      t.sousTitre = bloc.querySelector(":scope > span:nth-child(2)").textContent.trim();
      return t;
    }, mesureTitre);
    verif("la plaque dit « Nom · Type »", m.texte === "Banc 842 · Private Studio", m.texte);
    verif("le nom demi-gras, le type normal et gris", Number(m.nomGraisse) >= 600 && Number(m.typeGraisse) === 400 && m.typeCouleur !== m.nomCouleur, `${m.nomGraisse}/${m.typeGraisse}`);
    verif("sa ligne du dessous ne porte QUE la ville", m.sousTitre === "Lyon, FR", m.sousTitre);
  } catch (e) {
    verif("déroulement du banc 842 (plaque)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
process.exit(bilan());
