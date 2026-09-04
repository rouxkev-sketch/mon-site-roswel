//  ██ BANC 849 — LE FOND DES BADGES DE FILTRE, PROUVÉ AU PIXEL ██
//  ==================================================================
//  LE BOGUE DE LA nº 848, TEL QUE LE PROPRIÉTAIRE L'A VU EN LIGNE :
//  « les badges à croix n'ont NI fond NI contour — le texte flotte ».
//  LE BÂTI LIVRÉ, LUI, ÉTAIT JUSTE : la classe était bien produite et le
//  pont bien écrit dans le HTML servi (points 1 et 2 de ce banc). CE QUI
//  MANQUAIT ÉTAIT AILLEURS — une classe NEUVE n'existe que dans une
//  feuille NEUVE. Une page peinte avec une feuille plus ancienne (onglet
//  ouvert avant la mise en ligne, cache d'étape, navigation douce dans un
//  document déjà chargé) ignore la classe du barreau, et un fond
//  qu'aucune règle ne pose ne se peint PAS DU TOUT.
//  CE BANC FAIT TROIS CHOSES :
//   1. il constate sur le BÂTI ce que le propriétaire soupçonnait —
//      classe produite ? pont présent ? (les deux : oui) ;
//   2. il REPRODUIT la panne, en retirant du document ce qu'une feuille
//      ancienne n'aurait pas, et montre qu'un badge qui dépend de la
//      classe devient TRANSPARENT — puis que le badge corrigé, lui, ne
//      bouge pas ;
//   3. il lit le PIXEL RÉELLEMENT PEINT (une capture d'un pixel, décodée
//      en mémoire, jamais écrite ni livrée — règle des livraisons sans
//      captures) et vérifie qu'il vaut #20262D.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { inflateSync } from "node:zlib";
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

/** La couleur attendue, écrite ici en toutes lettres : le banc dit la
    CONSIGNE (« le barreau du milieu, #20262D »), pas ce que le code a
    fait. */
const FOND = { hex: "#20262D", rgb: "rgb(32, 38, 45)", r: 32, v: 38, b: 45 };

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage",
  lieu: "Lyon", zone: "69", lat: "45.76000", lon: "4.83000", niveau: "ville",
  paysCode: "FR", region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

/*  ══ LE DÉCODEUR D'UN PIXEL PEINT ═══════════════════════════════════
    Une capture de UN pixel, décodée ici même. Aucune image n'est écrite
    sur le disque ni livrée : c'est une mesure, au même titre qu'une
    lecture de `getComputedStyle` — à ceci près qu'elle dit ce que
    l'écran MONTRE, et non ce que le style DEMANDE. C'est la différence
    exacte qui a fait le bogue de la nº 848. */
function pixelDuPng(png) {
  let i = 8; // la signature
  let entete = null;
  const morceaux = [];
  while (i < png.length) {
    const taille = png.readUInt32BE(i);
    const type = png.toString("ascii", i + 4, i + 8);
    const corps = png.subarray(i + 8, i + 8 + taille);
    if (type === "IHDR") {
      entete = {
        largeur: corps.readUInt32BE(0),
        profondeur: corps[8],
        couleur: corps[9],
        entrelace: corps[12],
      };
    } else if (type === "IDAT") morceaux.push(corps);
    else if (type === "IEND") break;
    i += 12 + taille;
  }
  if (!entete || entete.profondeur !== 8 || entete.entrelace !== 0) {
    throw new Error(`PNG inattendu : ${JSON.stringify(entete)}`);
  }
  //  2 = RVB, 6 = RVB + opacité ; ce sont les deux que rend le navigateur.
  const octets = entete.couleur === 6 ? 4 : 3;
  const brut = inflateSync(Buffer.concat(morceaux));
  //  LA PREMIÈRE RANGÉE SUFFIT, et son filtre se défait sans voisins :
  //  au-dessus il n'y a rien (zéros), et le premier pixel n'a pas de
  //  gauche. « Sub », « Up », « Average » et « Paeth » rendent donc tous
  //  l'octet tel quel pour ce pixel-là.
  const filtre = brut[0];
  if (filtre > 4) throw new Error(`filtre PNG inconnu : ${filtre}`);
  return { r: brut[1], v: brut[2], b: brut[3], octets, largeur: entete.largeur };
}

/** Le pixel peint au cœur du fond d'un badge — à gauche du texte, dans
    le rembourrage, là où seul l'aplat se voit. */
async function fondPeint(page, selecteur) {
  const boite = await page.evaluate((sel) => {
    const n = document.querySelector(sel);
    const r = n.getBoundingClientRect();
    const s = getComputedStyle(n);
    //  À MI-HAUTEUR, et à la moitié du rembourrage gauche : dans
    //  l'aplat, jamais sur le texte ni sur le contour.
    return {
      x: r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft) / 2,
      y: r.top + r.height / 2,
    };
  }, selecteur);
  const png = await page.screenshot({
    clip: { x: boite.x, y: boite.y, width: 1, height: 1 },
  });
  return pixelDuPng(png);
}

//  ══ 1 · LE BÂTI LIVRÉ : LA CLASSE ET LE PONT ═════════════════════════
/*  LES DEUX SOUPÇONS DU PROPRIÉTAIRE, VÉRIFIÉS SUR CE QUI EST SERVI —
    « classe non générée ? pont lib/theme absent du bâti ? ». */
{
  titre("849 · le bâti servi : le pont, et la couleur dans le marquage");
  try {
    const html = await (await fetch(URL_RECHERCHE)).text();
    verif("le pont de la charte est bien dans l'en-tête du document servi",
      html.includes(`--rw-sombre-carte-clair: ${FOND.hex}`),
      /--rw-sombre-carte-clair: *[^;]*/.exec(html)?.[0] ?? "(absent)");
    /*  ██ LA CORRECTION DE LA nº 849 ██ : la couleur voyage DANS le
        marquage. Elle ne dépend plus d'une feuille ni d'une variable. */
    const enLigne = html.match(/background-color:\s*#20262D/gi) ?? [];
    verif("et la couleur du badge voyage AVEC le marquage, dans le document lui-même",
      enLigne.length >= 2, `${enLigne.length} badge(s) peints dans le HTML`);
    /*  ⚠️ LE NOM DE LA CLASSE N'EST PAS ÉCRIT EN TOUTES LETTRES (piège
        nº 472) : Tailwind lit les fichiers du dépôt, commentaires
        compris, et un nom écrit ici ferait produire une règle que plus
        personne n'emploie. */
    const CLASSE = ["bg", "sombre", "carte", "clair"].join("-");
    verif("la page servie ne dépend plus d'aucune classe utilitaire pour ce fond",
      !html.includes(CLASSE),
      html.includes(CLASSE) ? "la classe est encore là" : "aucune classe de fond");
  } catch (e) {
    verif("déroulement du banc 849 (le bâti servi)", false, String(e).slice(0, 400));
  }
}

//  ══ 2 · LE PIXEL PEINT, AUX DEUX APPAREILS ═══════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`849 · ${mode} — le pixel réellement peint`);
    /*  ⚠️ ON N'ATTEND PAS LE SILENCE DU RÉSEAU mais LA RANGÉE ELLE-MÊME,
        et VISIBLE : c'est ce qu'on vient mesurer, et une page de
        résultats garde des échanges en fond (images, préparations) qui
        peuvent repousser le silence au-delà de la patience du banc. */
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);
    const badges = await page.evaluate(() =>
      [...document.querySelectorAll("[data-filtre-actif]")].map((n) => ({
        cle: n.getAttribute("data-filtre-actif"),
        fond: getComputedStyle(n).backgroundColor,
      })));
    verif("les deux badges à croix sont là",
      badges.length === 2, badges.map((b) => b.cle).join(" | "));
    verif(`le style calculé donne bien ${FOND.hex}`,
      badges.every((b) => b.fond === FOND.rgb),
      badges.map((b) => b.fond).join(" | "));
    const peint = await fondPeint(page, "[data-filtre-actif]");
    verif(`et le PIXEL PEINT vaut ${FOND.hex} — le fond est à l'écran, pas seulement dans le style`,
      peint.r === FOND.r && peint.v === FOND.v && peint.b === FOND.b,
      `rvb(${peint.r}, ${peint.v}, ${peint.b})`);
  } catch (e) {
    verif(`déroulement du banc 849 (pixel ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LA PANNE REPRODUITE, PUIS TENUE ══════════════════════════════
/*  ON RETIRE DU DOCUMENT CE QU'UNE PAGE PLUS ANCIENNE N'AURAIT PAS :
    d'abord la RÈGLE qui pose ce fond, puis la VARIABLE de la charte que
    cette règle va chercher. Un badge qui dépend de l'une ou de l'autre
    perd tout son fond — c'est très exactement l'écran du propriétaire.
    Celui qui porte sa couleur ne bouge pas d'un pixel.
    ⚠️ Le nom de la classe n'est écrit nulle part ici non plus : piège
    nº 472, Tailwind lit les fichiers du dépôt. */
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("849 · la panne reproduite : la feuille d'hier, le badge d'aujourd'hui");
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);

    const avant = await fondPeint(page, "[data-filtre-actif]");
    const degat = await page.evaluate(() => {
      /*  UN TÉMOIN, PEINT COMME À LA nº 848 : la règle que Tailwind
          produisait alors, mot pour mot — un fond qui va chercher la
          couleur dans une variable de l'en-tête. On la pose nous-mêmes,
          dans une feuille à nous : le banc ne dépend donc pas de ce que
          la feuille du site contient aujourd'hui (elle ne contient plus
          rien de tel, et c'est justement la correction). */
      const feuille848 = document.createElement("style");
      feuille848.id = "feuille-848";
      feuille848.textContent =
        "[data-temoin-848]{background-color:var(--rw-sombre-carte-clair)}";
      document.head.appendChild(feuille848);
      const vrai = document.querySelector("[data-filtre-actif]");
      const temoin = vrai.cloneNode(true);
      temoin.removeAttribute("style");
      temoin.removeAttribute("data-filtre-actif");
      temoin.setAttribute("data-temoin-848", "");
      vrai.parentElement.appendChild(temoin);
      const lire = (sel) => getComputedStyle(document.querySelector(sel)).backgroundColor;
      const temoinAvant = lire("[data-temoin-848]");
      //  ██ LA FEUILLE D'HIER ██ — elle ne connaît pas la règle neuve.
      feuille848.remove();
      const temoinSansFeuille = lire("[data-temoin-848]");
      //  ██ L'EN-TÊTE D'HIER ██ — il ne connaît pas la variable neuve.
      //  (On remet la règle pour isoler cette seconde panne de la
      //  première : ici la règle EST là, c'est la couleur qui manque.)
      document.head.appendChild(feuille848);
      document.documentElement.style.setProperty("--rw-sombre-carte-clair", "initial");
      return {
        temoinAvant,
        temoinSansFeuille,
        temoinSansVariable: lire("[data-temoin-848]"),
        vraiApres: lire("[data-filtre-actif]"),
      };
    });
    verif("le badge à l'ancienne est bien peint tant que la feuille ET l'en-tête sont neufs",
      degat.temoinAvant === FOND.rgb, degat.temoinAvant);
    verif("… il PERD TOUT SON FOND avec la feuille d'hier — la panne que le propriétaire a vue",
      degat.temoinSansFeuille === "rgba(0, 0, 0, 0)", degat.temoinSansFeuille);
    verif("… et il la perd AUSSI avec l'en-tête d'hier : deux chemins, la même page nue",
      degat.temoinSansVariable === "rgba(0, 0, 0, 0)", degat.temoinSansVariable);
    verif("LE BADGE CORRIGÉ, LUI, NE BOUGE PAS : sa couleur est dans le marquage",
      degat.vraiApres === FOND.rgb, degat.vraiApres);

    const apres = await fondPeint(page, "[data-filtre-actif]");
    verif(`et le pixel peint vaut toujours ${FOND.hex}, feuille d'hier ou pas`,
      apres.r === FOND.r && apres.v === FOND.v && apres.b === FOND.b &&
      avant.r === apres.r && avant.v === apres.v && avant.b === apres.b,
      `avant rvb(${avant.r}, ${avant.v}, ${avant.b}) · après rvb(${apres.r}, ${apres.v}, ${apres.b})`);
  } catch (e) {
    verif("déroulement du banc 849 (reproduction)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
