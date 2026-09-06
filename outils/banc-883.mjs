//  ██ BANC 883 — LA GARDE QUI REND LA MAIN, ET LE TRAIT DE LA CONNEXION ██
//   §1 — CHROME iOS : la garde d'arrivée (nº 882) ne dure plus qu'une
//        SECONDE, n'écoute plus `visualViewport`, et ne pose jamais
//        rien sur un doigt posé. Ce qu'on mesure : pendant la fenêtre,
//        la barre fixe et le va-et-vient RÉPONDENT au toucher ; le
//        recalage sans geste est toujours repris DANS la seconde, et
//        plus jamais APRÈS.
//   §2 — LA PAGE DE CONNEXION : le trait rouge de « Sign up / Log in »
//        fait la MOITIÉ du va-et-vient (trait plein), il glisse, et
//        les autres va-et-vient gardent leur trait au mot.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc883-${T}`;
const PHOTO = (k, i) => `5483${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 883",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  /*  TROIS GALERIES DE TATOUAGES : il faut de la HAUTEUR pour éprouver
      un écart de trois cents pixels sur une page d'arrivée (nº 883). */
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6],
    [2, "realisme", "tatouage", 6], [3, "trash-polka", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature,
      url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}

const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const ONGLETS = '[aria-label="Profile, portfolio or flash"] a, [aria-label="Profile, portfolio or flash"] button';
const attendre = (page, ms) => page.waitForTimeout(ms);
const ou = (page) => page.evaluate(() => Math.round(window.scrollY));
/** UN RECALAGE DE MOTEUR : la page bouge, aucun geste ne l'explique. */
const recaler = (page, y) =>
  page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
/*  L'APPUI FRANC, ENVOYÉ À LA MAIN (motif du banc 882-§3) : `tap()`
    exige une cible « actionnable », ce que la barre collante n'est pas
    toujours au doigt. On envoie la séquence complète — pointeur ET
    toucher —, car c'est le TOUCHER que le témoin du geste écoute. */
const APPUI = `(s, avecToucher) => {
  const c = document.querySelector(s);
  if (!c) return false;
  const r = c.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (avecToucher) {
    const t = new Touch({ identifier: 1, target: c, clientX: x, clientY: y, pageX: x, pageY: y + scrollY });
    c.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
    c.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t] }));
  }
  const doigt = (type) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true,
    pointerId: 1, pointerType: "touch", isPrimary: true, clientX: x, clientY: y }));
  doigt("pointerdown");
  doigt("pointerup");
  if (c.click) c.click();
  return true;
}`;
const appuyer = (page, s, avecToucher = true) =>
  page.evaluate(([A, x, t]) => new Function("return " + A)()(x, t), [APPUI, s, avecToucher]);

//  ══ 1 · LA BARRE RÉPOND PENDANT LA FENÊTRE DE GARDE ════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("883 · §1 — doigt : la loupe répond DANS la seconde qui suit l'arrivée");
    /*  L'ARRIVÉE EST UNE VRAIE NAVIGATION DOUCE depuis une page
        défilée — le cas du propriétaire (accueil → fil, fil → profil).
        La garde est alors armée, et c'est précisément l'instant où
        Chrome iOS ne répondait plus. */
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    await page.mouse.wheel(0, 200);
    await attendre(page, 400);
    await appuyer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    //  ⚠️ 250 ms : EN PLEINE FENÊTRE DE GARDE (une seconde, nº 883).
    await attendre(page, 250);
    verif("l'arrivée est bien à zéro", (await ou(page)) === 0, String(await ou(page)));
    const ouvertAvant = await page.evaluate(() => document.documentElement.dataset.recherche ?? null);
    await appuyer(page, '[aria-label="Search"]');
    await attendre(page, 900);
    verif("un toucher sur la loupe OUVRE la recherche, garde armée",
      (await page.evaluate(() => document.documentElement.dataset.recherche ?? null)) === "ouverte",
      `avant : ${ouvertAvant}`);

    titre("883 · §1 — doigt : le va-et-vient répond lui aussi dans la fenêtre");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    await page.mouse.wheel(0, 200);
    await attendre(page, 400);
    await appuyer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 250);
    await page.evaluate(([s]) => {
      const c = [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === "Portfolio");
      if (c) c.click();
    }, [ONGLETS]);
    await attendre(page, 1200);
    verif("un toucher sur « Portfolio » change bien de page, garde armée",
      (await page.evaluate(() => location.pathname)).endsWith("/portfolio"),
      await page.evaluate(() => location.pathname));
  } catch (e) {
    verif("déroulement du banc 883 (§1 barre)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 1b · LA GARDE DURE UNE SECONDE, ET PAS PLUS ════════════════════
/*  ⚠️ ON ARRIVE PAR UNE NAVIGATION DOUCE, et c'est ce qui rend le
    chrono possible : après un `goto`, l'attente du réseau brouille
    l'instant de l'arrivée — or c'est de LUI que la seconde se compte.
    ⚠️ ET LA DESTINATION EST UNE GALERIE, PAS UNE LISTE DE RECHERCHE :
    une liste NEUVE se pose elle-même en haut à son arrivée
    (`laListeServieEstArrivee`, lib/liste-neuve) et arme, ce faisant,
    une garde ORDINAIRE — sans durée, celle-là, et c'est très bien
    ainsi. Elle masquerait la fin de la garde d'ARRIVÉE, seule mesurée
    ici (relevé de cette passe : à deux secondes, la page revenait à
    zéro sur une liste, et c'était l'autre garde). */
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    const arriver = async () => {
      await page.goto(`${BASE}/artist/${SLUG}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(ONGLETS, { timeout: 20000, state: "attached" });
      await attendre(page, 1500);
      await page.evaluate(([s]) => {
        const c = [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === "Portfolio");
        if (c) c.click();
      }, [ONGLETS]);
      await page.waitForFunction(() => location.pathname.endsWith("/portfolio"), null, { timeout: 20000 });
    };

    titre(`883 · §1 — ${mode} : la garde défend DANS la seconde, et rend la main après`);
    await arriver();
    const hauteur = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    verif("la galerie d'arrivée peut défiler (la mesure a un sens)", hauteur > 40, `${hauteur} px`);
    await recaler(page, 12);
    await attendre(page, 200);
    verif("un recalage de 12 px, juste après l'arrivée, est repris",
      (await ou(page)) === 0, String(await ou(page)));
    //  APRÈS la fenêtre : plus personne ne défend — c'est la règle de
    //  la nº 883, et c'est ce qui débloque Chrome iOS.
    await attendre(page, 1400);
    await recaler(page, 12);
    await attendre(page, 600);
    verif("… et deux secondes après l'arrivée, la garde a rendu la main",
      (await ou(page)) === 12, String(await ou(page)));

    titre(`883 · §1 — ${mode} : aucune pose n'interrompt un toucher`);
    await arriver();
    /*  UN DOIGT POSÉ, IMMOBILE — la règle (b) du propriétaire : le
        visiteur touche la barre, et le site ne doit RIEN reposer sous
        son doigt. On pose le doigt, puis on simule le recalage que
        Chrome iOS produit en repliant sa barre d'adresse. */
    await page.evaluate(() => {
      const t = new Touch({ identifier: 7, target: document.body, clientX: 40, clientY: 40, pageX: 40, pageY: 40 });
      document.body.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
    });
    await recaler(page, 12);
    await attendre(page, 500);
    verif("un doigt posé : les 12 px restent, rien n'est reposé sous lui",
      (await ou(page)) === 12, String(await ou(page)));
  } catch (e) {
    verif(`déroulement du banc 883 (§1 durée ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · LE TRAIT DE LA PAGE DE CONNEXION ═══════════════════════════
const MESURE = `(etiquette) => {
  /*  ⚠️ LA RANGÉE LA PLUS LARGE, ET PAS LA PREMIÈRE : une page peut
      porter deux fois le même va-et-vient — le squelette et le vrai,
      l'un des deux sans largeur tant qu'il n'est pas peint (relevé de
      cette passe : 0 / 0 sur un profil). */
  const rangees = [...document.querySelectorAll('[aria-label="' + etiquette + '"]')];
  const rangee = rangees.sort(
    (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
  )[0];
  if (!rangee) return { absent: true };
  const trait = [...rangee.querySelectorAll("span")].find((s) => (s.getAttribute("style") || "").includes("translateX"));
  if (!trait) return { sansTrait: true };
  //  LE ROSE LUI-MÊME (le trait plein, ou la copie du mot) : c'est LUI
  //  que l'œil voit, pas son enveloppe.
  const rose = trait.firstElementChild ?? trait;
  const r = rose.getBoundingClientRect();
  const s = getComputedStyle(trait);
  return {
    largeurDuRose: +r.width.toFixed(1),
    largeurDeLaRangee: +rangee.getBoundingClientRect().width.toFixed(1),
    transforme: s.transform,
    duree: s.transitionDuration,
  };
}`;
const mesurer = (page, e) => page.evaluate(([M, x]) => new Function("return " + M)()(x), [MESURE, e]);

for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`883 · §2 — ${mode} : le trait de « Sign up / Log in » fait la moitié`);
    await page.goto(`${BASE}/become-an-artist`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Sign up or log in"]', { timeout: 20000 });
    await attendre(page, 1200);
    const repos = await mesurer(page, "Sign up or log in");
    const part = repos.largeurDuRose / repos.largeurDeLaRangee;
    verif("le trait fait la MOITIÉ du va-et-vient",
      Math.abs(part - 0.5) < 0.02,
      `${repos.largeurDuRose} / ${repos.largeurDeLaRangee} = ${part.toFixed(3)}`);
    verif("… et il glisse (transition annoncée sur le trait)",
      repos.duree === "0.3s", String(repos.duree));
    //  À MI-COURSE : on touche l'autre onglet et l'on regarde le trait
    //  EN CHEMIN — ni parti, ni arrivé.
    await page.evaluate(() => {
      const c = [...document.querySelectorAll('[aria-label="Sign up or log in"] button')]
        .find((n) => n.textContent.trim() === "Log in");
      if (c) c.click();
    });
    await attendre(page, 120);
    const miCourse = await mesurer(page, "Sign up or log in");
    const x = (t) => { const m = /matrix\(([^)]+)\)/.exec(t || ""); return m ? Number(m[1].split(",")[4]) : null; };
    const enChemin = x(miCourse.transforme);
    const arrivee = repos.largeurDeLaRangee / 2;
    verif("à mi-course, le trait est ENTRE les deux positions",
      enChemin !== null && enChemin > 2 && enChemin < arrivee - 2,
      `${enChemin} px sur ${arrivee}`);
    await attendre(page, 500);
    const pose = await mesurer(page, "Sign up or log in");
    verif("… et il finit sur le second onglet",
      Math.abs((x(pose.transforme) ?? 0) - arrivee) < 2,
      `${x(pose.transforme)} / ${arrivee}`);
  } catch (e) {
    verif(`déroulement du banc 883 (§2 ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2b · AUCUNE RÉGRESSION SUR LES AUTRES VA-ET-VIENT ══════════════
{
  const U = { id: "31000000-0000-4000-8000-000000000883", email: "banc-883@yokofolio.test" };
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("883 · §2 — le trait des AUTRES va-et-vient ne bouge pas");
    /*  LE PROFIL : trait plein depuis la nº 873 — un tiers de la rangée.
        ⚠️ ON LE MESURE SUR LA GALERIE, et c'est la structure du site :
        au doigt, l'onglet « Profile » cache la colonne des galeries
        (`display: none`, nº 873) — et le va-et-vient vit DANS cette
        colonne. Un nœud non affiché n'a pas de largeur (relevé de cette
        passe : 0 / 0). Sur Portfolio, il est peint, et c'est le même. */
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(ONGLETS, { timeout: 20000, state: "attached" });
    await attendre(page, 1200);
    /*  ⚠️ ON L'AMÈNE À L'ŒIL AVANT DE LE MESURER : au doigt, le
        va-et-vient d'un profil ouvert à son adresse est sous la ligne
        de flottaison, et un nœud qui n'a jamais été peint n'a pas de
        largeur (relevé : 0 / 0). La position de la page n'entre pas
        dans ce §2. */
    await page.evaluate(() => document
      .querySelector('[aria-label="Profile, portfolio or flash"]')
      ?.scrollIntoView({ block: "center", behavior: "instant" }));
    await attendre(page, 400);
    const profil = await mesurer(page, "Profile, portfolio or flash");
    verif("profil : le trait plein fait toujours un tiers (nº 873)",
      Math.abs(profil.largeurDuRose / profil.largeurDeLaRangee - 1 / 3) < 0.02,
      `${profil.largeurDuRose} / ${profil.largeurDeLaRangee}`);
    //  « MA SÉLECTION » : trait AU MOT depuis la nº 871 — bien plus
    //  court que la moitié.
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Favorites or following"]', { timeout: 20000, state: "attached" });
    await attendre(page, 1200);
    const selection = await mesurer(page, "Favorites or following");
    verif("Ma sélection : le trait reste au mot (nº 871), pas la moitié",
      selection.largeurDuRose / selection.largeurDeLaRangee < 0.45,
      `${selection.largeurDuRose} / ${selection.largeurDeLaRangee}`);
  } catch (e) {
    verif("déroulement du banc 883 (§2 autres)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
