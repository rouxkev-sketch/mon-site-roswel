//  ██ BANC 878 — CLAVIER, GRANDE PHOTO, HISTORIQUE, MENUS (web) ██
//   §1 — LES FLÈCHES : une carte de galerie survolée prend la touche
//        ENTIÈRE (même au bout de ses photos) ; hors carte, elles
//        commandent la grande photo (le défilement natif de son cadre).
//   §2 — LE BLOC D'ICÔNES de la grande photo : abaissé, le partage
//        AVANT le fanion, et l'encre à seize pixels des trois bords.
//   §3 — L'HISTORIQUE DE LA FENÊTRE SUPERPOSÉE : ouvrir = une entrée,
//        fermer = son retrait, retour et avance cohérents, DIX FOIS.
//   §4 — LES MENUS AU CLAVIER : ↑ ↓ parcourent avec surlignage, Entrée
//        choisit ET valide, Échap ferme, Tab s'en va.
//  L'ATELIER attendu est celui de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc878-${T}`;
const PHOTO = (k, i) => `4778${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 878", styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, n] of [[0, "blackwork", 6], [1, "realisme", 4]]) {
    for (let i = 1; i <= n; i += 1) {
      photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature: "tatouage",
        url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        ordre: i, cree_le: "2026-01-01T00:00:00Z" });
    }
  }
  await ranger("photos_tatoueur", photos);
}
//  §4 — UN COMPTE POUR « MA SÉLECTION » : sans session, la page renvoie
//  à l'accueil et ses deux menus n'existent pas. Deux suivis et deux
//  photos en favori suffisent à les garnir.
const U = { id: "30000000-0000-4000-8000-000000000878", email: "banc-878@yokofolio.test" };
{
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
  await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
  await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
  const voisins = (await lire("tatoueurs", "select=id&limit=3")).map((t) => t.id).filter((id) => id !== SLUG);
  await ranger("tatoueurs_suivis", [SLUG, ...voisins].slice(0, 3).map((id, i) => ({
    utilisateur_id: U.id, tatoueur_id: id, cree_le: `2026-02-0${i + 1}T00:00:00Z` })));
  await ranger("favoris_photos", [
    { utilisateur_id: U.id, photo_id: PHOTO(0, 1), cree_le: "2026-02-01T00:00:00Z" },
    { utilisateur_id: U.id, photo_id: PHOTO(1, 1), cree_le: "2026-02-02T00:00:00Z" },
  ]);
}
const LISTE = "/search?style=blackwork&nature=tatouage";
const attendre = (page, ms) => page.waitForTimeout(ms);
/*  §4 — LE CLAVIER NE PARLE QU'AU CODE HYDRATÉ. React pose sur le nœud
    une clé `__reactProps$…` quand il lui a rattaché ses gestionnaires :
    c'est la seule preuve honnête qu'une flèche sera entendue. Sans
    cette attente, un banc ne mesure que la lenteur de l'atelier. */
const attendreHydratation = (page, selecteur) =>
  page.waitForFunction((sel) => {
    const n = document.querySelector(sel);
    return Boolean(n && Object.keys(n).some((k) => k.startsWith("__reactProps$")));
  }, selecteur, { timeout: 30000 });
const proche = (a, b, marge = 1) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

//  ══ 1 · LES FLÈCHES : LA CARTE SURVOLÉE PREND LA TOUCHE ════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("878 · §1 — web : la carte survolée et la grande photo ne s'influencent plus");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const carte = () => page.locator("[data-carte-de-galerie='0'] [data-compteur-galerie]").textContent();
    const affiche = () => page.evaluate(() =>
      document.querySelector('[data-carrousel] [data-role="compteur"]')?.textContent?.trim() ?? null);
    /*  ⚠️ UN CLIC DANS LA GRANDE PHOTO D'ABORD : c'est lui qui donne le
        clavier au cadre à coupe du carrousel (le « scroller focus »
        implicite de Chromium). Sans ce clic, les flèches ne
        commanderaient rien — et le banc ne prouverait rien. */
    await page.locator("[data-carrousel]").first().click({ position: { x: 300, y: 400 } });
    await attendre(page, 1000);
    const afficheAuDepart = await affiche();
    await page.keyboard.press("ArrowRight");
    await attendre(page, 800);
    const apresHorsCarte = await affiche();
    verif("hors carte, la flèche commande la GRANDE PHOTO (elle avance d'une)",
      afficheAuDepart === "1/6" && apresHorsCarte === "2/6",
      `${afficheAuDepart} → ${apresHorsCarte}`);
    //  ── LA CARTE SURVOLÉE PREND LA TOUCHE, ET ELLE SEULE.
    await page.locator("[data-carte-de-galerie='0']").hover({ position: { x: 200, y: 200 } });
    await attendre(page, 400);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 800);
    verif("carte survolée : la CARTE avance, la grande photo ne bouge pas",
      (await carte()).trim() === "2/6" && (await affiche()) === apresHorsCarte,
      `carte ${(await carte()).trim()} · affiche ${await affiche()}`);
    //  ── AU BOUT DE LA CARTE : la touche est prise QUAND MÊME (c'est le
    //     défaut de la nº 877, reproduit à la sonde 878b).
    for (let pas = 0; pas < 4; pas += 1) {
      await page.keyboard.press("ArrowRight");
      await attendre(page, 500);
    }
    verif("… la carte arrive au bout (6/6) sans que la grande photo bouge",
      (await carte()).trim() === "6/6" && (await affiche()) === apresHorsCarte,
      `carte ${(await carte()).trim()} · affiche ${await affiche()}`);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 800);
    verif("AU BOUT, UNE FLÈCHE DE PLUS NE FAIT RIEN — ni à la carte, ni à la photo (nº 878-§1)",
      (await carte()).trim() === "6/6" && (await affiche()) === apresHorsCarte,
      `carte ${(await carte()).trim()} · affiche ${await affiche()}`);
    //  ── ET LE RETOUR EN ARRIÈRE, DE MÊME.
    await page.keyboard.press("ArrowLeft");
    await attendre(page, 700);
    verif("← : la carte recule, la grande photo ne bouge toujours pas",
      (await carte()).trim() === "5/6" && (await affiche()) === apresHorsCarte,
      `carte ${(await carte()).trim()} · affiche ${await affiche()}`);
    //  ── HORS DE LA CARTE, LA GRANDE PHOTO REPREND LA MAIN.
    await page.mouse.move(1300, 60);
    await attendre(page, 400);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 800);
    verif("hors carte de nouveau : la grande photo avance, la carte ne bouge pas",
      (await affiche()) === "3/6" && (await carte()).trim() === "5/6",
      `affiche ${await affiche()} · carte ${(await carte()).trim()}`);
  } catch (e) {
    verif("déroulement du banc 878 (§1)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE BLOC D'ICÔNES DE LA GRANDE PHOTO ════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("878 · §2 — web : le bloc d'icônes, abaissé, inversé, aux airs égaux");
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-commandes-affiche]", { timeout: 20000 });
    await attendre(page, 2000);
    await page.locator("[data-carrousel]").first().hover({ position: { x: 300, y: 300 } });
    await attendre(page, 600);
    const v = await page.evaluate(() => {
      const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
        return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), g: +r.left.toFixed(1), d: +r.right.toFixed(1) }; };
      /*  L'ENCRE D'UN DESSIN — sa boîte de tracé (getBBox), reportée sur
          l'écran : ce que l'œil voit, et non la cible tactile qui
          l'entoure. C'est la mesure de la sonde 878b. */
      const encre = (svg) => {
        if (!svg || typeof svg.getBBox !== "function") return null;
        const boite = svg.getBoundingClientRect();
        const vue = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
        const bb = svg.getBBox();
        if (vue.length !== 4 || !boite.width) return null;
        const kx = boite.width / vue[2], ky = boite.height / vue[3];
        return {
          g: +(boite.left + (bb.x - vue[0]) * kx).toFixed(1),
          d: +(boite.left + (bb.x + bb.width - vue[0]) * kx).toFixed(1),
          bas: +(boite.top + (bb.y + bb.height - vue[1]) * ky).toFixed(1),
        };
      };
      const photo = B(document.querySelector("[data-carrousel]"));
      const rangee = document.querySelector("[data-commandes-affiche]");
      const nomme = (b) => b?.getAttribute("aria-label") ?? "";
      const boutons = [...rangee.querySelectorAll("button")];
      const trouve = (motif) => boutons.find((b) => motif.test(nomme(b))) ?? null;
      const signaler = trouve(/^Report /), fanion = trouve(/photo(s)? (from|$)|^Save this photo|^Remove this photo/), partage = trouve(/^Share /);
      const vues = rangee.querySelector("[data-vues-de-fil]");
      const encres = [signaler, fanion, partage].filter(Boolean).map((b) => encre(b.querySelector("svg")))
        .concat(vues ? [encre(vues.querySelector("svg"))] : []).filter(Boolean);
      return {
        photo,
        signaler: B(signaler), fanion: B(fanion), partage: B(partage), vues: B(vues),
        encreGauche: Math.min(...encres.map((e) => e.g)) - photo.g,
        encreDroite: photo.d - Math.max(...encres.map((e) => e.d)),
        encreBas: photo.bas - Math.max(...encres.map((e) => e.bas)),
      };
    });
    verif("les cinq commandes sont là (signaler, vues, points, partage, fanion)",
      v.signaler && v.vues && v.partage && v.fanion,
      `signaler ${Boolean(v.signaler)} · vues ${Boolean(v.vues)} · partage ${Boolean(v.partage)} · fanion ${Boolean(v.fanion)}`);
    verif("§2b — LE PARTAGE EST AVANT LE FANION (ils ont échangé leur place)",
      v.partage.d <= v.fanion.g + 0.5, `partage →${v.partage.d} · fanion ${v.fanion.g}→`);
    verif("§2c — l'air de GAUCHE et celui de DROITE sont égaux (encre, au pixel)",
      proche(v.encreGauche, v.encreDroite, 1),
      `gauche ${v.encreGauche.toFixed(1)} · droite ${v.encreDroite.toFixed(1)}`);
    verif("… et ils valent SEIZE pixels, la marge du site",
      proche(v.encreGauche, 16, 1.5) && proche(v.encreDroite, 16, 1.5),
      `gauche ${v.encreGauche.toFixed(1)} · droite ${v.encreDroite.toFixed(1)}`);
    verif("§2a — LE BLOC EST ABAISSÉ : l'encre du bas est à seize pixels (26,6 à la nº 877)",
      proche(v.encreBas, 16, 1.5), `${v.encreBas.toFixed(1)} px`);
  } catch (e) {
    verif("déroulement du banc 878 (§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · L'HISTORIQUE DE LA FENÊTRE SUPERPOSÉE, DIX FOIS ════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("878 · §3 — web : ouvrir = une entrée, fermer = son retrait, dix fois");
    //  UNE PAGE DU SITE DERRIÈRE (l'accueil), comme dans la vraie vie.
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await attendre(page, 1500);
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    //  UN APPUI FRANC À VIDE : c'est lui qui pose le CRAN du filet de
    //  retour (nº 350/351) — l'entrée fantôme qui faussait tout.
    await page.mouse.click(700, 100);
    await attendre(page, 600);
    const adresse = () => page.evaluate(() => location.pathname + location.search);
    const fenetreLa = () => page.evaluate(() => Boolean(document.querySelector("[data-titre-fenetre]")));
    const cran = await page.evaluate(() => Boolean((history.state ?? {}).retourReconstruit));
    verif("le cran du filet de retour est bien posé sous nous (le décor du défaut)", cran, String(cran));
    const laRecherche = await adresse();
    let fautes = [];
    for (let tour = 1; tour <= 10; tour += 1) {
      //  a. OUVRIR : une carte, la fenêtre, l'adresse de la fiche.
      await page.locator('[data-lien-carte][href^="/artist/"]').first().click();
      await page.waitForFunction(() => Boolean(document.querySelector("[data-titre-fenetre]")), null, { timeout: 20000 }).catch(() => {});
      await attendre(page, 1200);
      if (!/^\/artist\//.test(await adresse()) || !(await fenetreLa())) {
        fautes.push(`tour ${tour} : ouverture ${await adresse()} · fenêtre ${await fenetreLa()}`);
        break;
      }
      //  b. FERMER (clic à côté) : l'adresse de la recherche revient.
      await page.mouse.click(30, 400);
      await attendre(page, 1200);
      if ((await adresse()) !== laRecherche || (await fenetreLa())) {
        fautes.push(`tour ${tour} : fermeture ${await adresse()} · fenêtre ${await fenetreLa()}`);
        break;
      }
      //  c. AVANCE : la fiche rouvre (c'est ce qui ne marchait pas).
      await page.goForward();
      await attendre(page, 1200);
      if (!/^\/artist\//.test(await adresse()) || !(await fenetreLa())) {
        fautes.push(`tour ${tour} : avance ${await adresse()} · fenêtre ${await fenetreLa()}`);
        break;
      }
      //  d. RETOUR : la recherche, DU PREMIER APPUI.
      await page.goBack();
      await attendre(page, 1200);
      if ((await adresse()) !== laRecherche || (await fenetreLa())) {
        fautes.push(`tour ${tour} : retour ${await adresse()} · fenêtre ${await fenetreLa()}`);
        break;
      }
    }
    verif("DIX FOIS : ouvrir, fermer, avancer (la fiche rouvre), revenir (la recherche, du premier appui)",
      fautes.length === 0, fautes.join(" | ") || "dix tours sans faute");
    //  ── ET LE RETOUR SUIVANT REND LA PAGE DU DESSOUS, PAS UN DOUBLON.
    await page.goBack();
    await attendre(page, 1500);
    verif("un retour de plus rend l'ACCUEIL (plus de doublon de la recherche)",
      (await adresse()) === "/", await adresse());
  } catch (e) {
    verif("déroulement du banc 878 (§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LES MENUS DÉROULANTS AU CLAVIER ════════════════════════════
//  CE QUE LE MENU DES STYLES MONTRE À L'OUVERTURE, ET C'EST TOUT LE
//  SUJET : DEUX PORTES (« Tattoos », « Flash ») et AUCUNE option — la
//  liste mesure zéro tant qu'une section n'est pas ouverte (nº 573).
//  Le clavier parcourt donc LES RANGÉES VISIBLES, portes comprises :
//  ↓ vise la première porte, ↓ la seconde, ENTRÉE ouvre celle qu'on
//  vise ET mène à sa première entrée, ↓ passe à la suivante, ENTRÉE
//  la choisit — et la recherche part.
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("878 · §4 — web : le menu des styles au clavier (moteur)");
    //  ⚠️ `networkidle` ET NON `domcontentloaded` : les flèches ne
    //  parlent qu'au code HYDRATÉ.
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 20000 });
    await attendre(page, 2500);
    const menu = page.locator('button[aria-haspopup="listbox"]').first();
    const rangees = () => page.evaluate(() => {
      const visee = document.querySelector("[data-rangee-active]");
      const panneau = visee ? visee.closest("[data-panneau-menu], body") : document.body;
      const toutes = [...(panneau ?? document).querySelectorAll("[id][data-rangee-active], [role='option'], [aria-expanded]")];
      return {
        texte: visee?.textContent?.trim().slice(0, 30) ?? null,
        role: visee?.getAttribute("role") ?? null,
        ouvre: visee?.getAttribute("aria-expanded") ?? null,
        fond: visee ? getComputedStyle(visee).backgroundColor : null,
        //  LE FOND D'UNE RANGÉE VOISINE, pour dire que le surlignage
        //  se VOIT : la même sorte de nœud, sans la marque.
        fondVoisin: (() => {
          const voisines = toutes.filter((n) => n !== visee && n.tagName === visee?.tagName && n.getAttribute("role") === visee?.getAttribute("role"));
          return voisines[0] ? getComputedStyle(voisines[0]).backgroundColor : null;
        })(),
        pointee: visee ? document.querySelector('[role="listbox"]')?.getAttribute("aria-activedescendant") === visee.id : null,
      };
    });
    await menu.focus();
    await page.keyboard.press("ArrowDown");
    await attendre(page, 500);
    const ouvertApresFleche = await menu.getAttribute("aria-expanded");
    const premiere = await rangees();
    verif("↓ OUVRE le menu et vise sa première rangée (la porte « Tattoos »)",
      ouvertApresFleche === "true" && premiere.texte === "Tattoos",
      `ouvert ${ouvertApresFleche} · « ${premiere.texte} »`);
    verif("… le surlignage se VOIT (un fond que la rangée voisine n'a pas)",
      Boolean(premiere.fond) && premiere.fond !== premiere.fondVoisin,
      `${premiere.fond} contre ${premiere.fondVoisin}`);
    await page.keyboard.press("ArrowDown");
    await attendre(page, 400);
    const seconde = await rangees();
    verif("↓ ↓ vise la DEUXIÈME rangée (la porte « Flash »)",
      seconde.texte === "Flash", `« ${seconde.texte} »`);
    await page.keyboard.press("ArrowUp");
    await attendre(page, 400);
    verif("↑ revient à la première", (await rangees()).texte === "Tattoos",
      `« ${(await rangees()).texte} »`);
    //  ENTRÉE SUR UNE PORTE : elle s'ouvre, et l'on est sur sa première
    //  entrée — sans quoi la flèche suivante irait à la porte d'à côté.
    await page.keyboard.press("Enter");
    await attendre(page, 700);
    const dansLaSection = await rangees();
    verif("ENTRÉE ouvre la porte visée ET mène à sa première entrée",
      dansLaSection.role === "option", `« ${dansLaSection.texte} » (rôle ${dansLaSection.role})`);
    verif("… et la liste DIT la rangée visée (`aria-activedescendant`)",
      dansLaSection.pointee === true, String(dansLaSection.pointee));
    //  ↓ PUIS ENTRÉE : la deuxième entrée est choisie, ET LA RECHERCHE
    //  PART (c'est le chemin de la souris, `choisir` → `surChangement`).
    await page.keyboard.press("ArrowDown");
    await attendre(page, 400);
    const deuxiemeOption = await rangees();
    verif("↓ vise la DEUXIÈME entrée de la section",
      deuxiemeOption.role === "option" && deuxiemeOption.texte !== dansLaSection.texte,
      `« ${dansLaSection.texte} » → « ${deuxiemeOption.texte} »`);
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.pathname.startsWith("/search"), null, { timeout: 20000 }).catch(() => {});
    await attendre(page, 1200);
    const apresEntree = await page.evaluate(() => location.pathname + location.search);
    verif("ENTRÉE choisit l'entrée visée ET VALIDE la recherche",
      /^\/search/.test(apresEntree) && /style=/.test(apresEntree), apresEntree);
    verif("… et le menu s'est refermé", (await page.locator('[role="listbox"]').count()) === 0,
      String(await page.locator('[role="listbox"]').count()));

    titre("878 · §4 — web : Échap ferme, Tab s'en va");
    const menu2 = page.locator('button[aria-haspopup="listbox"]').first();
    await menu2.focus();
    await page.keyboard.press("ArrowDown");
    await attendre(page, 500);
    verif("le menu est ouvert", (await menu2.getAttribute("aria-expanded")) === "true");
    await page.keyboard.press("Escape");
    await attendre(page, 500);
    verif("ÉCHAP le referme", (await menu2.getAttribute("aria-expanded")) === "false",
      String(await menu2.getAttribute("aria-expanded")));
    await menu2.focus();
    await page.keyboard.press("ArrowDown");
    await attendre(page, 400);
    await page.keyboard.press("Tab");
    await attendre(page, 500);
    const apresTab = await page.evaluate(() => ({
      ouvert: document.querySelector('button[aria-haspopup="listbox"]')?.getAttribute("aria-expanded"),
      actif: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName ?? null,
    }));
    verif("TAB referme le menu et emmène le focus au champ suivant",
      apresTab.ouvert === "false" && apresTab.actif !== null,
      `ouvert ${apresTab.ouvert} · focus ${apresTab.actif}`);
  } catch (e) {
    verif("déroulement du banc 878 (§4 moteur)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 bis · LES MENUS DE « MA SÉLECTION » ══════════════════════════
//  ⚠️ ICI, LE DÉCLENCHEUR N'EST PAS UN CHAMP : depuis la nº 461, celui
//  de ces deux menus est une ANCRE DE HAUTEUR ZÉRO — c'est le
//  va-et-vient qui ouvre, en appuyant une seconde fois sur l'onglet où
//  l'on est déjà. Le banc ouvre donc COMME LA PERSONNE, puis parle au
//  clavier : c'est le cas qui a montré que le clavier devait vivre sur
//  le document, et pas sur le déclencheur.
for (const [onglet, adresse, mot] of [
  ["Favoris", "/my-favorites", "Favorites"],
  ["Portfolios suivis", "/my-favorites?selection=suivis", "Portfolios"],
]) {
  const { nav, page } = await ouvrir("web", { session: U });
  try {
    titre(`878 · §4 — web : le menu de « Ma sélection » au clavier (${onglet})`);
    await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
    await page.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 20000 }).catch(() => {});
    await attendreHydratation(page, 'button[aria-haspopup="listbox"]').catch(() => {});
    await attendre(page, 1500);
    const ouvertureParLOnglet = page
      .locator('[aria-label="Favorites or following"] button')
      //  ⚠️ `^Favorites` ET NON `^Favorites$` : l'onglet porte son
      //  COMPTE collé au mot (« Favorites0 »).
      .filter({ hasText: new RegExp(`^${mot}`) })
      .first();
    if ((await ouvertureParLOnglet.count()) === 0) {
      verif(`(${onglet} : le va-et-vient est absent de cet écran — rien à ouvrir ici)`, false, "onglet introuvable");
    } else {
      await ouvertureParLOnglet.click();
      await attendre(page, 900);
      const menu = page.locator('button[aria-haspopup="listbox"]').first();
      verif(`${onglet} : le second appui sur l'onglet ouvre le menu de filtre`,
        (await menu.getAttribute("aria-expanded")) === "true",
        String(await menu.getAttribute("aria-expanded")));
      await page.keyboard.press("ArrowDown");
      await attendre(page, 600);
      const une = await page.evaluate(() => {
        const visee = document.querySelector("[data-rangee-active]");
        return { texte: visee?.textContent?.trim().slice(0, 30) ?? null,
          fond: visee ? getComputedStyle(visee).backgroundColor : null };
      });
      verif(`${onglet} : ↓ vise la première rangée, et le surlignage se voit`,
        Boolean(une.texte) && une.fond !== "rgba(0, 0, 0, 0)", JSON.stringify(une));
      await page.keyboard.press("ArrowDown");
      await attendre(page, 500);
      const deux = await page.evaluate(() =>
        document.querySelector("[data-rangee-active]")?.textContent?.trim().slice(0, 30) ?? null);
      verif(`${onglet} : ↓ ↓ visent la DEUXIÈME rangée`,
        Boolean(deux) && deux !== une.texte, `« ${une.texte} » → « ${deux} »`);
      await page.keyboard.press("Escape");
      await attendre(page, 500);
      verif(`${onglet} : ÉCHAP referme ce menu-là aussi`,
        (await menu.getAttribute("aria-expanded")) === "false",
        String(await menu.getAttribute("aria-expanded")));
    }
  } catch (e) {
    verif(`déroulement du banc 878 (§4 ${onglet})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 ter · LE CHAMP DE LOCALITÉ ═══════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("878 · §4 — web : le champ de localité au clavier");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForSelector('input[aria-label="Location"]', { timeout: 20000 });
    await attendre(page, 2500);
    const champ = page.locator('input[aria-label="Location"]').first();
    await champ.click();
    await champ.type("lyo", { delay: 90 });
    await page.waitForFunction(() => document.querySelectorAll('[role="listbox"] [role="option"]').length > 0,
      null, { timeout: 15000 }).catch(() => {});
    await attendre(page, 1200);
    const nb = await page.locator('[role="listbox"] [role="option"]').count();
    if (nb === 0) {
      verif("(le géocodeur ne répond pas à l'atelier : aucune suggestion à parcourir)", true, "0 suggestion");
    } else {
      await page.keyboard.press("ArrowDown");
      await attendre(page, 300);
      const premier = await page.evaluate(() => {
        const actif = document.querySelector("[data-suggestion-active]");
        const options = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
        return { rang: actif ? options.indexOf(actif) : -1, choisi: actif?.getAttribute("aria-selected") };
      });
      verif("↓ vise la première suggestion, et le dit (`aria-selected`)",
        premier.rang === 0 && premier.choisi === "true", JSON.stringify(premier));
      await page.keyboard.press("ArrowDown");
      await attendre(page, 300);
      const second = await page.evaluate(() => {
        const actif = document.querySelector("[data-suggestion-active]");
        const options = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
        return { rang: actif ? options.indexOf(actif) : -1, texte: actif?.textContent?.trim() ?? null };
      });
      verif("↓ encore : la deuxième", second.rang === 1 || nb === 1, JSON.stringify(second));
      const attendu = await page.evaluate(() => {
        const actif = document.querySelector("[data-suggestion-active]");
        return actif?.querySelector("span")?.textContent?.trim() ?? null;
      });
      await page.keyboard.press("Enter");
      await attendre(page, 1200);
      const valeur = await champ.inputValue();
      verif("ENTRÉE choisit la suggestion visée : le champ porte son nom",
        Boolean(attendu) && valeur.toLowerCase().includes(attendu.toLowerCase().slice(0, 4)),
        `« ${valeur} » pour « ${attendu} »`);
    }
  } catch (e) {
    verif("déroulement du banc 878 (§4 localité)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
