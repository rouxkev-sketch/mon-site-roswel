//  ██ BANC 882 — TOUTE ARRIVÉE COMMENCE EN HAUT, ET Y RESTE ██
//   §1 — LE MÉCANISME : un recalage qu'aucun geste n'explique est repris,
//        autant de fois qu'il en faut et aussi tard qu'il arrive ; un
//        GRAND écart est laissé (il est voulu) ; et le PREMIER GESTE du
//        visiteur rend la main pour de bon.
//   §2 — LES PAGES : cinq à six arrivées d'affilée (profil, portfolio,
//        flash, accueil, Ma sélection, accueil) depuis une origine
//        défilée, pour trois amplitudes, aux deux appareils.
//   §3 — LE VA-ET-VIENT NE POSE PLUS LE CRAN DU FILET DE RETOUR : cinq
//        onglets touchés AU DOIGT, ZÉRO étape de plus, et UN SEUL
//        retour ramène au fil des cartes. Le filet, lui, garde son
//        rôle : un appui franc ailleurs pose bien le cran, une fois.
//
//  ⚠️ CE QUE CE BANC NE PEUT PAS FAIRE, ET IL FAUT LE DIRE : le défaut du
//  propriétaire est WEBKIT (Safari et Chrome sur iPhone sont le même
//  moteur), et cet atelier n'a que Chromium (le socle sait ouvrir WebKit
//  — `moteur: "webkit"` — mais son binaire n'est pas installé ici). Ce
//  qui est éprouvé ci-dessous est donc LE MÉCANISME, moteur par moteur
//  identique : « un déplacement que personne n'a demandé est repris ».
//  Les trois RÉVEILS propres à WebKit (`load`, `fonts.ready`,
//  `visualViewport`) sont câblés et lisibles dans lib/arrivee-en-haut ;
//  seul l'iPhone peut dire qu'ils tombent au bon moment.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc882-${T}`;
const U = { id: `c882${String(T).slice(-8)}-0000-4000-8000-000000000882`, email: `banc882-${T}@exemple.test` };
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

//  ══ 1 · LE MÉCANISME ═══════════════════════════════════════════════
/*  ██ MISE AU PAS DE LA nº 883 ██
    CE QUI A CHANGÉ SOUS CE §1 : la garde d'arrivée ne tient plus
    « jusqu'au premier geste » (nº 882) mais UNE SECONDE. La nº 882
    l'avait faite sans fin ; sur Chrome iOS, où le repli de la barre
    d'adresse fait pleuvoir les événements de viewport, elle tournait en
    boucle et AVALAIT LES TOUCHERS — barre fixe et va-et-vient bloqués.
    Les mesures se font donc DANS cette seconde, et la fin de la garde
    est mesurée par le banc 883.
    ⚠️ ON PART D'UNE NAVIGATION DOUCE, et c'est ce qui rend le chrono
    possible : après un `goto`, l'attente du réseau brouille l'instant
    de l'arrivée.
    ⚠️ ET LA DESTINATION EST UNE GALERIE, PAS UNE LISTE DE RECHERCHE :
    une liste NEUVE se pose elle-même en haut à son arrivée
    (`laListeServieEstArrivee`, lib/liste-neuve) et arme une garde
    ORDINAIRE — sans plafond, celle-là : elle défendrait AUSSI l'écart
    de 300 px, et la mesure ne parlerait plus de la garde d'arrivée
    (relevé de cette passe). Trois galeries donnent la hauteur qu'il
    faut. */
const rafale = (page, combien, pas) =>
  page.evaluate(async ([n, ms]) => {
    for (let i = 0; i < n; i += 1) {
      window.scrollTo({ top: 6 + (i % 7), left: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, ms));
    }
  }, [combien, pas]);

for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    /** ARRIVER SUR UNE LISTE LONGUE, EN DOUCEUR — et rendre la main à
        l'instant précis où la garde vient d'être armée. */
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

    titre(`882 · §1 — ${mode} : un recalage sans geste est REPRIS, dans la seconde`);
    await arriver();
    /*  TREIZE RECALAGES D'AFFILÉE, ET EN PREMIER — au-delà des douze
        annulations après lesquelles une garde ORDINAIRE cède
        (RECALAGES_ANNULES_MAX) : une garde d'arrivée ne les compte pas,
        elle est bornée par le temps (nº 883). Envoyés en UN aller-retour
        et serrés, pour tenir dans la seconde. */
    await rafale(page, 13, 15);
    verif("treize recalages d'affilée : toujours zéro", (await ou(page)) === 0,
      String(await ou(page)));
    await recaler(page, 12);
    await attendre(page, 150);
    verif("… un recalage de 12 px de plus est repris", (await ou(page)) === 0,
      String(await ou(page)));
    const hauteur = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    verif("la galerie d'arrivée peut défiler bien au-delà du plafond",
      hauteur > 60, `${hauteur} px`);

    titre(`882 · §1 — ${mode} : un GRAND écart est voulu — on ne le combat pas`);
    await arriver();
    /*  ⚠️ L'ÉCART ÉPROUVÉ EST LE PLUS GRAND QUE LA PAGE PERMETTE, borné
        à trois cents : la même galerie mesure 1286 px au doigt et 110 au
        web (les cartes s'y étalent). LA RÈGLE EST LE PLAFOND DE QUARANTE,
        pas un chiffre — au-delà, le mouvement est voulu, et rien ne doit
        le combattre. */
    const grand = Math.min(300, Math.max(0, hauteur - 10));
    verif("l'écart éprouvé dépasse largement le plafond", grand > 60, `${grand} px`);
    await recaler(page, grand);
    await attendre(page, 500);
    verif("un grand défilement tient (le plafond des 40 px)",
      (await ou(page)) === grand, `${await ou(page)} / ${grand}`);

    titre(`882 · §1 — ${mode} : le PREMIER GESTE rend la main, définitivement`);
    await arriver();
    await page.mouse.wheel(0, 120);
    await attendre(page, 300);
    await recaler(page, 12);
    await attendre(page, 500);
    verif("après un geste, douze pixels TIENNENT (le visiteur a le dernier mot)",
      (await ou(page)) === 12, String(await ou(page)));
  } catch (e) {
    verif(`déroulement du banc 882 (§1 ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · CINQ ARRIVÉES D'AFFILÉE, TROIS AMPLITUDES ═════════════════
/*  ⚠️ DEUX PRÉCAUTIONS, ET ELLES DISENT CE QUE LA RÈGLE VEUT DIRE.
    1. LA MÉMOIRE EST VIDÉE ENTRE DEUX TOURNÉES. La règle du
       propriétaire porte sur les arrivées SANS POSITION MÉMORISÉE ;
       revenir sur une adresse qu'on a quittée défilée doit, elle,
       rendre la place (nº 328-§3). Sans ce vidage, la deuxième tournée
       éprouverait la règle inverse — et la troisième la contredirait
       (relevé : la galerie Portfolio revenait à 40, sa place de la
       tournée précédente : c'est le site qui a RAISON).
    2. LE WEB N'OUVRE PAS LES FICHES EN PAGE. Un clic sur une carte de
       la mosaïque y ouvre la FENÊTRE SUPERPOSÉE (nº 506) : le corps
       est gelé derrière un voile, la grille doit rester exactement où
       elle est, et `DefilementEnHaut` s'efface (`data-fenetre-fiche`).
       Ce n'est donc pas une arrivée de page — mesuré à cette passe :
       le logo de l'en-tête est alors COUVERT par le voile
       (`elementFromPoint` rend le voile, jamais le lien), aucun
       visiteur ne peut naviguer de là. Le web part donc du profil
       lui-même, ouvert à son adresse. */
const DEPARTS = [6, 40, 700];
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    titre(`882 · §2 — ${mode} : toutes les sortes de pages arrivent à zéro`);
    const fautes = [];
    let arrivees = 0;
    for (const depart of DEPARTS) {
      if (mode === "doigt") {
        await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "networkidle" });
        await page.waitForSelector("[data-carte]", { timeout: 20000 });
      } else {
        /*  ⚠️ `domcontentloaded`, PAS `networkidle` : la page de profil du
            web garde une connexion ouverte, et l'attente du silence
            réseau expire (mesuré à cette passe). On attend ce qui compte
            — le va-et-vient, qui porte les liens du saut suivant. */
        await page.goto(`${BASE}/artist/${SLUG}`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(ONGLETS, { timeout: 20000 });
      }
      await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
      await attendre(page, 900);
      /*  LES SAUTS : chacun part d'une page DÉFILÉE et doit arriver en
          haut. Au doigt, un toucher sur la photo ne fait rien (nº 873)
          — c'est l'en-tête de la carte qui mène au profil. */
      const sauts = [
        ...(mode === "doigt"
          ? [["profil", `[data-lien-profil-de-fil][href*="${SLUG}"]`, null, `/artist/${SLUG}`]]
          : []),
        ["portfolio", ONGLETS, "Portfolio", `/artist/${SLUG}/portfolio`],
        ["flash", ONGLETS, "Flash", `/artist/${SLUG}/flash`],
        ["accueil", '[aria-label$="home"]', null, "/"],
        ["Ma sélection", '[aria-label="My favorites"]', null, "/my-favorites"],
        ["accueil (depuis Ma sélection)", '[aria-label$="home"]', null, "/"],
      ];
      for (const [nom, selecteur, texte, adresse] of sauts) {
        const partiDe = await defilerCommeUnVisiteur(page, depart);
        if (!(await cliquer(page, selecteur, texte))) { fautes.push(`${nom} : lien introuvable`); continue; }
        await page.waitForFunction((a) => location.pathname === a, adresse, { timeout: 20000 }).catch(() => {});
        await attendre(page, 1600);
        arrivees += 1;
        const ici = await ou(page);
        if (ici !== 0) fautes.push(`${nom} (départ ${depart}, parti de ${partiDe}) → ${ici}`);
      }
    }
    verif(`${mode} : les ${arrivees} arrivées sont à zéro, au pixel`,
      fautes.length === 0 && arrivees === DEPARTS.length * (mode === "doigt" ? 6 : 5),
      fautes.slice(0, 8).join(" | ") || `${arrivees} arrivées à zéro`);
  } catch (e) {
    verif(`déroulement du banc 882 (§2 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

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
    for (const mot of ["Portfolio", "Flash", "Profile", "Portfolio", "Flash"]) {
      const boite = await page.locator(ONGLETS).filter({ hasText: new RegExp(`^${mot}$`) }).first().boundingBox();
      if (!boite) continue;
      await page.touchscreen.tap(boite.x + boite.width / 2, boite.y + boite.height / 2);
      await attendre(page, 1200);
    }
    const apres = await page.evaluate(() => history.length);
    verif("cinq onglets touchés depuis le fil : zéro étape de plus", apres === avant, `${avant} → ${apres}`);
    await page.goBack();
    await attendre(page, 1800);
    verif("un seul retour ramène au fil des cartes",
      (await page.evaluate(() => location.pathname)) === "/search",
      await page.evaluate(() => location.pathname + location.search));
    verif("… et la liste est rendue à sa place", Math.abs((await ou(page)) - place) <= 2,
      `${await ou(page)} / ${place}`);
  } catch (e) {
    verif("déroulement du banc 882 (§3 retour)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
