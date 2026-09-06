//  ██ BANC 882 — LE VA-ET-VIENT ET LE FILET DE RETOUR (AU DOIGT) ██
//   Cinq onglets touchés POUR DE VRAI (`pointerdown`/`pointerup`, ce
//   que le filet de retour écoute et que le banc 875 ne produit
//   jamais) : ZÉRO étape de plus (nº 875 §1), et UN SEUL retour ramène
//   au fil des cartes. Le filet, lui, garde son rôle : un appui franc
//   AILLEURS pose bien le cran, une fois.
//
//  ██ CE QUE LA nº 889 A RETIRÉ DE CE BANC ██
//   §1 — LE MÉCANISME DE LA GARDE DE POSITION (« un recalage sans geste
//        est repris, un grand écart est laissé, le premier geste rend la
//        main »). La garde est partie avec toute la mécanique de
//        défilement — il n'y a plus de mécanisme à éprouver.
//   §2 — LES TRENTE-TROIS ARRIVÉES À ZÉRO. Elles n'ont pas disparu :
//        elles sont mesurées par le BANC 889 §1, dans la même forme et
//        avec une amplitude de plus (39 px, le cas du relevé). Deux
//        bancs pour une règle finiraient par diverger (piège nº 378).
//   Voir docs/DEFILEMENT-889-INVENTAIRE.md.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc882-${T}`;
const PHOTO = (k, i) => `5282${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 882",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  /*  TROIS GALERIES DE TATOUAGES : il faut de la HAUTEUR pour éprouver
      un écart de trois cents pixels sur une page d'arrivée (nº 883). */
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6],
    [2, "realisme", "tatouage", 6], [3, "trash-polka", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) {
      photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature,
        url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        ordre: i, cree_le: "2026-01-01T00:00:00Z" });
    }
  }
  await ranger("photos_tatoueur", photos);
}

const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const ONGLETS = '[aria-label="Profile, portfolio or flash"] a, [aria-label="Profile, portfolio or flash"] button';
const attendre = (page, ms) => page.waitForTimeout(ms);
const ou = (page) => page.evaluate(() => Math.round(window.scrollY));
/** UN RECALAGE DE MOTEUR : la page bouge, AUCUN geste ne l'explique. */
const recaler = (page, y) =>
  page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
/** LE VISITEUR DÉFILE : la molette D'ABORD (c'est elle, le geste — la
    garde rend la main), la position exacte ensuite. Le motif du banc
    875, et pour la même raison : quelques pixels ne se visent pas à la
    molette. */
async function defilerCommeUnVisiteur(page, y) {
  await page.mouse.wheel(0, Math.max(60, y));
  await attendre(page, 350);
  await recaler(page, y);
  await attendre(page, 350);
  return ou(page);
}
/** CLIQUER SANS DÉPLACER LA PAGE : Playwright amène l'élément à l'écran
    avant de cliquer (`locator.click`), ce qui DÉFERAIT le défilement de
    l'origine — tout le sujet du banc. Le clic est donc envoyé depuis la
    page elle-même, où rien ne défile. */
const CLIQUER = `(selecteur, texte) => {
  const tous = [...document.querySelectorAll(selecteur)];
  const cible = texte ? tous.find((n) => n.textContent.trim() === texte) : tous[0];
  if (!cible) return false;
  cible.click();
  return true;
}`;
const cliquer = (page, selecteur, texte = null) =>
  page.evaluate(([C, s, t]) => new Function("return " + C)()(s, t), [CLIQUER, selecteur, texte]);

//  ══ 3 · LE VA-ET-VIENT ET LE CRAN DU FILET DE RETOUR ═══════════════
/*  CE QUE CE §3 MESURE, ET POURQUOI LE BANC 875 NE LE VOYAIT PAS. La
    régression du propriétaire (retour qui repasse par chaque onglet)
    ne vient pas du `replace` des onglets — le banc 875 le mesure
    encore vert. Elle vient du CRAN du filet de retour, posé sur
    l'APPUI FRANC que le toucher d'un onglet constitue, et remplacé
    dans la foulée par la navigation : une étape de plus par onglet.
    ⚠️ LE BANC 875 TOUCHE LES ONGLETS PAR `dispatchEvent("click")` — un
    clic nu, sans `pointerdown` ni `pointerup` : le chemin du cran n'y
    est JAMAIS emprunté. Ici, on touche POUR DE VRAI
    (`touchscreen.tap`), et c'est toute la différence. */
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("882 · §3 — doigt : toucher un onglet ne pose aucune étape");
    /*  LA CONDITION DU DÉFAUT, CELLE QUE SAFARI CRÉE TOUT SEUL : une
        arrivée de DOCUMENT relève le plancher de la pile à la hauteur
        du moment (nº 349), et « rien du site derrière moi » redevient
        vrai — c'est là que le cran se pose. On ouvre donc le profil à
        son adresse, sans référent. */
    await page.goto(`${BASE}/artist/${SLUG}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(ONGLETS, { timeout: 20000, state: "attached" });
    await attendre(page, 1500);
    const etapes = () => page.evaluate(() => history.length);
    const chemin = () => page.evaluate(() => location.pathname);
    /*  TOUCHER POUR DE VRAI — `tap()` du locateur : il amène sa cible à
        l'écran s'il le faut (le va-et-vient d'un profil ouvert à son
        adresse est sous la ligne de flottaison au doigt), puis pose et
        relâche un doigt. C'est CE relâchement que le filet de retour
        écoute, et que le banc 875 ne produisait jamais. La position de
        la page n'entre pas dans ce §3 : on n'y mesure que des étapes
        d'historique. */
    /*  L'APPUI FRANC, ENVOYÉ À LA MAIN — et il faut le faire à la main.
        `tap()` de Playwright exige une cible « actionnable » : le
        va-et-vient d'un profil ouvert à son adresse ne l'est pas au
        doigt (rangée collante, sous la ligne de flottaison), et le
        toucher aux coordonnées rate sa cible dès qu'elle recolle. On
        envoie donc la séquence que le filet écoute — `pointerdown`
        puis `pointerup` sur l'élément lui-même, à son centre — puis le
        clic. C'est l'ordre exact d'un vrai doigt, et c'est CE
        relâchement que le banc 875 ne produisait jamais
        (`dispatchEvent("click")` n'a pas de pointeur). */
    const APPUI = `(s, t) => {
      const c = t
        ? [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === t)
        : document.querySelector(s);
      if (!c) return false;
      const r = c.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const doigt = (type) => c.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true,
        pointerId: 1, pointerType: "touch", isPrimary: true, clientX: x, clientY: y }));
      doigt("pointerdown");
      doigt("pointerup");
      if (c.click) c.click();
      return true;
    }`;
    const appuyer = (selecteur, texte = null) =>
      page.evaluate(([A, s, t]) => new Function("return " + A)()(s, t), [APPUI, selecteur, texte]);
    const toucherLOnglet = async (mot) => {
      const fait = await appuyer(ONGLETS, mot);
      await attendre(page, 1200);
      return fait;
    };
    const avant = await etapes();
    const chemins = [];
    for (const mot of ["Portfolio", "Flash", "Profile", "Portfolio", "Flash"]) {
      if (!(await toucherLOnglet(mot))) { verif(`onglet ${mot} touchable`, false); continue; }
      chemins.push((await chemin()).replace(`/artist/${SLUG}`, "") || "/profil");
    }
    const apres = await etapes();
    verif("cinq onglets touchés, zéro étape de plus", apres === avant, `${avant} → ${apres}`);
    verif("… et l'adresse a bien suivi les touchers", chemins.join(" ") === "/portfolio /flash /profil /portfolio /flash",
      chemins.join(" "));

    titre("882 · §3 — doigt : le filet garde son rôle (un appui ailleurs pose le cran)");
    const avantAilleurs = await etapes();
    //  UN APPUI FRANC SUR LE CORPS DE LA PAGE — rien qui navigue, rien
    //  qui remplace : le cran doit se poser, comme depuis la nº 350.
    await appuyer("main, body");
    await attendre(page, 800);
    const apresUn = await etapes();
    verif("un appui franc hors du va-et-vient pose le cran", apresUn === avantAilleurs + 1,
      `${avantAilleurs} → ${apresUn}`);
    for (let i = 0; i < 3; i += 1) { await appuyer("main, body"); await attendre(page, 500); }
    verif("… et un seul, quoi qu'il arrive ensuite", (await etapes()) === apresUn,
      `${apresUn} → ${await etapes()}`);
  } catch (e) {
    verif("déroulement du banc 882 (§3 cran)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("882 · §3 — doigt : UN SEUL retour ramène au fil des cartes");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    await page.mouse.wheel(0, 600);
    await attendre(page, 900);
    const place = await ou(page);
    await cliquer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 1500);
    const avant = await page.evaluate(() => history.length);
    /*  ██ nº 889 — ET CHAQUE ONGLET ROUVRE EN HAUT ██ La nº 873 §1-§2
        rendait à chaque onglet SA position ; le propriétaire l'a retiré
        à la nº 889. On le mesure ICI, avec de vrais touchers, plutôt
        que dans un second banc (piège nº 378). */
    const pasEnHaut = [];
    for (const mot of ["Portfolio", "Flash", "Profile", "Portfolio", "Flash"]) {
      const boite = await page.locator(ONGLETS).filter({ hasText: new RegExp(`^${mot}$`) }).first().boundingBox();
      if (!boite) continue;
      await defilerCommeUnVisiteur(page, 180);
      await page.touchscreen.tap(boite.x + boite.width / 2, boite.y + boite.height / 2);
      await attendre(page, 1300);
      const ici = await ou(page);
      if (ici !== 0) pasEnHaut.push(`${mot}=${ici}`);
    }
    verif("les cinq onglets touchés rouvrent EN HAUT (nº 889)",
      pasEnHaut.length === 0, pasEnHaut.join(" ") || "les cinq à zéro");
    const apres = await page.evaluate(() => history.length);
    verif("cinq onglets touchés depuis le fil : zéro étape de plus", apres === avant, `${avant} → ${apres}`);
    await page.goBack();
    await attendre(page, 1800);
    verif("un seul retour ramène au fil des cartes",
      (await page.evaluate(() => location.pathname)) === "/search",
      await page.evaluate(() => location.pathname + location.search));
    /*  ██ MISE AU PAS DE LA nº 889 ██ La place était rendue AU PIXEL
        par la mémoire du site, qui attendait que le contenu soit
        arrivé (lib/pose-sur-contenu). Les deux sont parties : c'est le
        NAVIGATEUR qui repose, « auto » (nº 363), et il ne sait pas
        attendre les cartes. On mesure donc ce qui compte — il REND une
        place, il ne remet pas à zéro. */
    verif("… et le navigateur rend la place de la liste (nº 889)",
      (await ou(page)) > 100, `${await ou(page)} / ${place}`);
  } catch (e) {
    verif("déroulement du banc 882 (§3 retour)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
