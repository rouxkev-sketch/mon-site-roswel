//  ██ BANC 847 — LES SIX RETOUCHES DES EN-TÊTES DE RECHERCHE ██
//   1. l'ACCUEIL au doigt n'a plus de titre ni de sous-titre (le web les
//      garde), et le champ reprend son invite « Find your tattoo style… » ;
//   2. le COMPTE n'est plus un titre : c'est le PREMIER badge, à la robe
//      du badge du type (contour fin, rien dedans), SANS croix ;
//   3. toute la rangée monte d'un cran : demi-gras, corps et croix
//      mesurés ;
//   4. au doigt, une rangée trop large GLISSE — une seule ligne, aucune
//      barre visible ;
//   5. les badges à croix sont sur un fond PLUS SOMBRE que l'ancien ;
//   6. un peu plus d'air sous la rangée, au doigt.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = `banc847-${Date.now()}`;
const ID = `24000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", {
    ...gabarit, id: ID, slug: T, nom: "Banc 847",
    styles: ["blackwork"], ville_slug: `lyon-${T}`,
    type_fiche: "salon", etablissement: "prive",
  });
  for (let i = 0; i < 3; i += 1) {
    await ranger("photos_tatoueur", [{
      id: `47000000-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`,
      tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage",
      url: "/images-demo/tatouage/blackwork-1.svg",
      miniature: "/images-demo/tatouage/blackwork-1.svg",
      ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
}

const RESULTATS = "/search?style=blackwork&nature=tatouage";
/*  UNE RECHERCHE DONT LA RANGÉE DÉBORDE À COUP SÛR : le compte, le
    style, et une localité VOLONTAIREMENT LONGUE avec son rayon.
    ⚠️ LA RANGÉE NE PEUT PAS PORTER QUATRE BADGES : il n'existe que DEUX
    filtres badgés (le style, la localité) plus le compte. La consigne
    parle de « 4 badges longs » ; on fait ce qui existe — TROIS badges,
    assez longs pour dépasser largement un écran de 390 px, ce que la
    mesure confirme. */
/*  ⚠️ LES COORDONNÉES S'ÉCRIVENT À CINQ DÉCIMALES (corrigé à la
    nº 848) : c'est la forme que le site écrit lui-même
    (`lieuVersParametres`, lib/geocodage). À deux décimales, le serveur
    décode puis RÉÉCRIT à cinq — les deux signatures diffèrent, la page
    se croit en retard sur l'adresse et reste EN CHANTIER : le bloc de
    tête garde ses boîtes (donc ses mesures) mais passe en
    `visibility: hidden`. Le banc mesurait juste, sans rien voir. */
const LONGUE = new URLSearchParams({
  style: "blackwork", nature: "tatouage",
  lieu: "Villeneuve-Saint-Georges-sur-Marne", zone: "NSW",
  lat: "48.73000", lon: "2.44000", niveau: "ville", paysCode: "AU",
  region: "New South Wales", ville: "Villeneuve-Saint-Georges-sur-Marne",
  rayon: "100",
}).toString();

/** LA RANGÉE, TELLE QUE L'ÉCRAN LA REND. */
const RANGEE = `() => {
  const rangee = document.querySelector("[data-filtres-actifs]");
  const compte = document.querySelector("[data-badge-compte]");
  const badges = [...document.querySelectorAll("[data-filtre-actif]")];
  const s = (n) => (n ? getComputedStyle(n) : null);
  const boite = (n) => {
    const r = n.getBoundingClientRect();
    return { h: Math.round(r.height), y: Math.round(r.top), x: Math.round(r.left) };
  };
  const sc = s(compte);
  return {
    titresH1: document.querySelectorAll("h1").length,
    compte: {
      texte: compte.textContent.trim(),
      balise: compte.tagName,
      fond: sc.backgroundColor,
      contour: sc.borderTopWidth + " " + sc.borderTopStyle,
      contourCouleur: sc.borderTopColor,
      corps: sc.fontSize,
      graisse: sc.fontWeight,
      croix: compte.querySelector("button") !== null,
      ...boite(compte),
    },
    badges: badges.map((b) => {
      const sb = s(b);
      const croix = b.querySelector("[data-retrait-filtre]");
      const rc = croix.getBoundingClientRect();
      return {
        cle: b.getAttribute("data-filtre-actif"),
        texte: b.textContent.trim(),
        fond: sb.backgroundColor,
        contour: sb.borderTopWidth,
        contourCouleur: sb.borderTopColor,
        corps: sb.fontSize,
        graisse: sb.fontWeight,
        croixBoite: Math.round(rc.width) + "x" + Math.round(rc.height),
        //  LE DESSIN TEL QU'IL EST RENDU, et non son attribut : depuis
        //  la nº 848 c'est une CLASSE qui le grandit au web (l'attribut
        //  ne connaît pas l'appareil), il vaut donc 16 dans le code et
        //  18 à l'écran.
        croixGlyphe: (() => {
          const g = croix.querySelector("svg");
          return g ? String(Math.round(g.getBoundingClientRect().width)) : null;
        })(),
        ...boite(b),
      };
    }),
    rangee: {
      repli: s(rangee).flexWrap,
      debordement: s(rangee).overflowX,
      largeurVue: Math.round(rangee.clientWidth),
      largeurPiste: Math.round(rangee.scrollWidth),
      defilement: Math.round(rangee.scrollLeft),
      //  LA BARRE NE DOIT PAS SE VOIR : sur un moteur qui la dessine,
      //  la hauteur de la boîte dépasserait celle du contenu.
      barre: Math.round(rangee.offsetHeight - rangee.clientHeight),
    },
    //  L'AIR SOUS LA RANGÉE : c'est le dégagement du bloc de tête, qui
    //  touche la grille (rien entre les deux).
    airSous: getComputedStyle(document.querySelector("[data-titre-mosaique]")).paddingBottom,
    ecart: (() => {
      const bloc = document.querySelector("[data-titre-mosaique]");
      const grille = document.querySelector("[data-grille-tatoueurs]");
      return bloc && grille
        ? Math.round(grille.getBoundingClientRect().top - bloc.getBoundingClientRect().bottom)
        : null;
    })(),
    margeSite: parseFloat(getComputedStyle(document.querySelector("main")).paddingLeft),
    //  nº 848 — LA GARDE : on ne mesure que ce qui se peint (voir la
    //  note de LONGUE, en tête de fichier).
    chantier: document.querySelector("main[aria-busy]") !== null,
    visible: getComputedStyle(document.querySelector("[data-titre-mosaique]")).visibility,
  };
}`;

//  ══ 1 · L'ACCUEIL : RIEN AU DOIGT, TOUT AU WEB ═══════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`847 · ${mode} — l'accueil`);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const vu = await page.evaluate(() => {
      const bloc = document.querySelector("[data-titre-mosaique]");
      const rangee = document.querySelector("[data-rangee-moteur]");
      const pilule = [...(rangee?.querySelectorAll("button") ?? [])]
        .find((b) => b.getBoundingClientRect().height > 0);
      return {
        //  RENDU dans le document (le web et le doigt partagent le HTML),
        //  mais MONTRÉ ou non selon l'appareil — la bascule du site.
        rendu: bloc !== null,
        montre: (bloc?.getBoundingClientRect().height ?? 0) > 0,
        affichage: bloc ? getComputedStyle(bloc).display : null,
        titre: bloc?.querySelector("h1")?.textContent?.trim() ?? null,
        sousTitre: bloc?.querySelector("p")?.textContent?.trim() ?? null,
        pilule: pilule?.textContent?.trim() ?? null,
        //  Les cartes de style commencent-elles tout de suite ?
        premiereCarte: (() => {
          const c = document.querySelector("[data-catalogue-styles]");
          return c ? Math.round(c.getBoundingClientRect().top) : null;
        })(),
      };
    });
    if (mode === "doigt") {
      verif("AUCUN titre ni sous-titre à l'écran : le bloc est retiré de l'affichage",
        vu.montre === false && vu.affichage === "none", `montré ${vu.montre} · ${vu.affichage}`);
      verif("le champ reprend l'invite de l'accueil",
        vu.pilule === "Find your tattoo style…", vu.pilule);
      verif("les cartes commencent sous la barre, sans bloc de tête",
        vu.premiereCarte !== null && vu.premiereCarte < 200, `${vu.premiereCarte} px`);
    } else {
      verif("le web garde son titre ET son sous-titre",
        vu.montre === true && vu.titre === "Find your tattoo style…" &&
        /^\d+ portfolios • \d+ styles?$/.test(vu.sousTitre ?? ""),
        `${vu.titre} / ${vu.sousTitre}`);
    }
  } catch (e) {
    verif(`déroulement du banc 847 (accueil ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2-3-5 · LA RANGÉE : LE COMPTE EN TÊTE, LA TYPOGRAPHIE, LES FONDS ═
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`847 · ${mode} — la rangée des badges`);
    await page.goto(`${BASE}/search?${LONGUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate((R) => new Function("return " + R)()(), RANGEE);

    //  nº 848 — RIEN N'EST MESURÉ SUR UNE PAGE QUI NE SE PEINT PAS.
    verif("la page est bel et bien RENDUE : aucun chantier, rien de masqué",
      m.chantier === false && m.visible === "visible",
      `chantier ${m.chantier} · ${m.visible}`);

    //  §2 — LE COMPTE, PREMIER ET SANS CROIX.
    verif("le compte est un BADGE, premier de la rangée, à gauche des autres",
      /^\d+ portfolios?$/.test(m.compte.texte) && m.compte.x < m.badges[0].x,
      `« ${m.compte.texte} » à ${m.compte.x} px, premier filtre à ${m.badges[0].x}`);
    verif("il n'y a plus de titre de page ailleurs : le badge EST le h1",
      m.titresH1 === 1 && m.compte.balise === "H1",
      `${m.titresH1} h1 · balise ${m.compte.balise}`);
    verif("il n'a PAS de croix — ce n'est pas une action", m.compte.croix === false);
    /*  ⚠️ ON NE FIGE PAS LE JETON (la charte a déjà été retintée, nº 466) :
        ce qui compte est la RÈGLE — la robe du badge du type, c'est-à-dire
        un contour d'un pixel et RIEN dedans. */
    verif("sa robe est celle du badge du type : contour fin, fond transparent",
      m.compte.fond === "rgba(0, 0, 0, 0)" && m.compte.contour === "1px solid",
      `${m.compte.contour} ${m.compte.contourCouleur} · fond ${m.compte.fond}`);

    /*  §3 — LA TYPOGRAPHIE DE TOUTE LA RANGÉE.
        ██ RÉÉCRIT À LA nº 848 — CE QUE LE PROPRIÉTAIRE A CHANGÉ DEPUIS ██
        Ce banc mesurait les valeurs de la nº 847 : corps 15 px partout,
        demi-gras, croix de 26 px, badge de 30 px de haut. Les trois ont
        bougé sur SA demande, et le banc dit désormais la nouvelle règle
        — le détail (l'air égal, la hauteur qui suit) est mesuré par le
        banc 848 ; ici on garde ce que la nº 847 avait posé et qui
        SURVIT : la rangée est homogène, et la croix suit le texte. */
    const tous = [m.compte, ...m.badges];
    /*  nº 851 — LE DOIGT A PRIS L'ÉCRITURE DU BADGE DU TYPE (corps 14,
        demi-gras), sur décision du propriétaire ; le web garde celle de
        la nº 848 (corps 16, graisse moyenne). Ce banc dit donc les deux,
        et le banc 851 vérifie que celle du doigt est bien, au pixel,
        celle du badge du type. */
    /*  §4 (nº 853) — LE WEB REJOINT LE DOIGT : les deux prennent
        l'écriture du badge du TYPE des cartes (corps 14, demi-gras).
        Il n'y a plus qu'une seule valeur à dire. */
    const ECRITURE = { corps: "14px", graisse: "600" };
    verif(`TOUS les badges portent la même écriture : corps ${ECRITURE.corps}, graisse ${ECRITURE.graisse}`,
      tous.every((b) => b.corps === ECRITURE.corps && b.graisse === ECRITURE.graisse),
      tous.map((b) => `${b.corps}/${b.graisse}`).join(" | "));
    verif("la croix suit le texte : elle prend la boîte de la ligne, son dessin monte au web (nº 848)",
      m.badges.every((b) =>
        b.croixGlyphe === (mode === "doigt" ? "16" : "18") &&
        b.croixBoite === (mode === "doigt" ? "22x22" : "24x24")),
      m.badges.map((b) => `${b.croixBoite} glyphe ${b.croixGlyphe}`).join(" | "));
    /*  LA HAUTEUR A CHANGÉ TROIS FOIS : 30 (nº 847), 44/46 (nº 848),
        26/28 depuis que l'air se mesure sur les LETTRES (nº 850). Ce
        banc-ci ne vérifie donc que ce qui ne bouge pas : la rangée est
        HOMOGÈNE. Le nombre, lui, se mesure au banc 850, avec la règle
        qui le décide. */
    verif("et TOUS les badges de la rangée ont la même hauteur",
      tous.every((b) => b.h === tous[0].h), tous.map((b) => b.h).join(" | "));

    /*  §5 — LE FOND DES BADGES À CROIX, MESURÉ PLUS SOMBRE.
        On ne récite pas la valeur : on compare la LUMINOSITÉ des deux
        fonds — celui des badges à croix doit être STRICTEMENT sous
        `bg-sombre-eleve`, le fond qu'ils portaient à la nº 846. */
    const clarte = (rgb) => {
      const [r, v, b] = rgb.match(/\d+/g).map(Number);
      return 0.2126 * r + 0.7152 * v + 0.0722 * b;
    };
    const ELEVE = "rgb(38, 44, 52)";
    verif("les badges à croix sont sur un fond PLUS SOMBRE que l'ancien",
      m.badges.every((b) => clarte(b.fond) < clarte(ELEVE)),
      `${m.badges[0].fond} (${clarte(m.badges[0].fond).toFixed(1)}) contre ${ELEVE} (${clarte(ELEVE).toFixed(1)})`);
    /*  … ET ILS RESTENT PLEINS, LÀ OÙ LE COMPTE EST VIDE : c'est ce qui
        les distingue, et c'est le point de la nº 847.
        ⚠️ LE TRAIT, LUI, N'EST PLUS UN CRITÈRE DEPUIS LA nº 848 : les
        badges pleins portent un contour TRANSPARENT, pour faire
        exactement la hauteur du compte (qui, lui, a un vrai trait). Ce
        qui se voit, c'est donc la COULEUR du trait, pas sa présence. */
    verif("… et ils restent PLEINS, sans trait visible : le trait distingue le compte",
      m.badges.every((b) =>
        b.fond !== "rgba(0, 0, 0, 0)" && b.contourCouleur === "rgba(0, 0, 0, 0)"),
      m.badges.map((b) => `trait ${b.contour} ${b.contourCouleur}`).join(" | "));
  } catch (e) {
    verif(`déroulement du banc 847 (rangée ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4-6 · AU DOIGT : LA RANGÉE GLISSE, ET L'AIR SOUS ELLE ════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("847 · doigt — la rangée glisse, sur une seule ligne");
    await page.goto(`${BASE}/search?${LONGUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate((R) => new Function("return " + R)()(), RANGEE);
    const tous = [m.compte, ...m.badges];
    verif("la rangée DÉBORDE bien (sans quoi ce point ne se mesure pas)",
      m.rangee.largeurPiste > m.rangee.largeurVue,
      `${m.rangee.largeurPiste} px de piste pour ${m.rangee.largeurVue} de vue`);
    verif("elle ne se replie PAS : une seule ligne, tous les badges au même niveau",
      m.rangee.repli === "nowrap" && tous.every((b) => b.y === tous[0].y),
      `${m.rangee.repli} · hauts ${tous.map((b) => b.y).join(",")}`);
    verif("elle DÉFILE à l'horizontale, sans barre visible",
      m.rangee.debordement === "auto" && m.rangee.barre === 0,
      `${m.rangee.debordement} · barre ${m.rangee.barre} px`);
    /*  LE DÉBORD COMPENSÉ : la piste va d'un bord de l'écran à l'autre,
        et le premier badge commence quand même sur la marge du site —
        sans quoi il serait coupé dès le premier glissement. */
    verif("le premier badge commence sur la marge du site",
      m.compte.x === m.margeSite && m.margeSite === 16,
      `${m.compte.x} px pour une marge de ${m.margeSite}`);

    //  ON GLISSE POUR DE BON, et le dernier badge arrive.
    const dernier = m.badges[m.badges.length - 1];
    const apres = await page.evaluate((R) => {
      const rangee = document.querySelector("[data-filtres-actifs]");
      rangee.scrollLeft = rangee.scrollWidth;
      return new Function("return " + R)()();
    }, RANGEE);
    const dernierApres = apres.badges[apres.badges.length - 1];
    verif("un glissement déplace la rangée et amène le dernier badge",
      apres.rangee.defilement > 0 && dernierApres.x < dernier.x,
      `défilement ${apres.rangee.defilement} px · dernier badge ${dernier.x} → ${dernierApres.x}`);
    verif("et rien n'a changé de ligne pendant le glissement",
      [apres.compte, ...apres.badges].every((b) => b.y === apres.compte.y));
    verif("le document, lui, ne défile pas à l'horizontale",
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

    /*  §6 — L'AIR SOUS LA RANGÉE.
        ⚠️ SUR UNE RECHERCHE QUI REND DES CARTES : la recherche longue
        ci-dessus ne trouve rien (une ville inventée), et c'est alors le
        bloc « aucun résultat » qui suit le bloc de tête, pas la grille.
        On mesure donc l'air là où il se voit vraiment. */
    await page.goto(`${BASE}${RESULTATS}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const avecCartes = await page.evaluate((R) => new Function("return " + R)()(), RANGEE);
    verif("l'air sous la rangée vaut 24 px, un cran de plus que les 20 de la nº 846",
      avecCartes.airSous === "24px" && avecCartes.ecart === 0,
      `${avecCartes.airSous} de dégagement, ${avecCartes.ecart} px entre le bloc et la grille`);
  } catch (e) {
    verif("déroulement du banc 847 (glissement)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 7 · LA RANGÉE EXISTE MÊME SANS FILTRE ════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("847 · le compte tient la rangée à lui seul");
    await page.goto(`${BASE}${RESULTATS}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    //  ON RETIRE LE SEUL FILTRE : on repart à l'accueil (nº 846), donc on
    //  vérifie plutôt une recherche SANS style ni lieu — la catégorie
    //  seule, qui n'a pas de badge.
    await page.goto(`${BASE}/search?nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const seul = await page.evaluate(() => {
      const compte = document.querySelector("[data-badge-compte]");
      return {
        compte: compte?.textContent.trim() ?? null,
        balise: compte?.tagName ?? null,
        badges: document.querySelectorAll("[data-filtre-actif]").length,
        h1: document.querySelectorAll("h1").length,
      };
    });
    verif("sans aucun filtre badgé, le compte est là — et il est le titre",
      /^\d+ portfolios?$/.test(seul.compte ?? "") && seul.balise === "H1" &&
      seul.badges === 0 && seul.h1 === 1,
      `« ${seul.compte} » · ${seul.badges} filtre(s) · ${seul.h1} h1`);
  } catch (e) {
    verif("déroulement du banc 847 (compte seul)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
