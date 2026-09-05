//  ██ BANC 853 — LA TRADUCTION INTERDITE, LA BARRE PROMISE, LES VUES ██
//  ==================================================================
//  Trois points de la passe, et rien d'autre — les trois qui demandent
//  une MESURE (l'apparence des badges et des cartes se juge à l'œil, sur
//  capture) :
//   1. §1 — la page interdit la traduction automatique, et rien ne
//      l'efface au rendu client ;
//   2. §2 — au doigt, DÉCONNECTÉ, le squelette de la barre promet la
//      vraie zone d'actions : même largeur (le logo ne bouge pas), et
//      les trois centres tombent sur ceux des icônes ;
//   3. §6 — une vue est comptée à l'ouverture d'un profil, UNE SEULE
//      par session et par heure, et le nombre arrive au pied des cartes
//      du fil.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, modifier } from "./banc-socle.mjs";

const RESULTATS = `${BASE}/search?style=blackwork&nature=tatouage`;

//  ══ 1 · LA TRADUCTION AUTOMATIQUE EST INTERDITE ══════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("853 · la page interdit la traduction automatique");
    await page.goto(RESULTATS, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    const lu = () => page.evaluate(() => ({
      classe: document.documentElement.classList.contains("notranslate"),
      balise: document.querySelector('meta[name="google"]')?.getAttribute("content") ?? null,
      langue: document.documentElement.lang,
    }));
    const avant = await lu();
    verif("la racine porte `notranslate` et la balise l'écrit en toutes lettres",
      avant.classe === true && avant.balise === "notranslate",
      `classe ${avant.classe} · balise ${avant.balise}`);
    verif("… et la langue reste déclarée (nº 852)", avant.langue === "en", avant.langue);
    /*  ⚠️ ET RIEN NE L'EFFACE APRÈS COUP : c'est la question posée par
        le propriétaire. On navigue DOUCEMENT — un lien de carte, donc
        le routeur et non un rechargement, le parcours même qui rouvrait
        le bandeau — et l'on relit la racine sur la page d'arrivée. Le
        document ne change pas, seulement son contenu : si quelque chose
        devait effacer la classe ou la balise, c'est là que ça se
        verrait. */
    await page.locator("[data-carte] [data-lien-profil-de-fil]").first().click();
    //  ⚠️ ON ATTEND LE VA-ET-VIENT DU PROFIL, pas un badge : deux badges
    //  de type vivent dans le document depuis la nº 852, et l'un des
    //  deux est toujours retiré de l'affichage.
    await page.waitForSelector("[role='radiogroup']", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(1000);
    const apres = await lu();
    verif("après une navigation douce, les deux tiennent",
      apres.classe === true && apres.balise === "notranslate" && apres.langue === "en",
      `classe ${apres.classe} · balise ${apres.balise} · langue ${apres.langue}`);
  } catch (e) {
    verif("déroulement du banc 853 (traduction)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LA BARRE : LE SQUELETTE PROMET LA VRAIE ══════════════════════
/*  DÉCONNECTÉ, AU DOIGT — les deux défauts dits par le propriétaire :
    les ronds comprimaient le logo, et ils ne tombaient pas là où les
    icônes tombent. On mesure les DEUX zones et on les compare. */
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("853 · doigt, déconnecté — le squelette de la barre contre la vraie");
    const LIRE = `() => {
      const entete = document.querySelector("header");
      const b = (n) => { const r = n.getBoundingClientRect(); return { l: Math.round(r.width), cx: +((r.left + r.right) / 2).toFixed(1) }; };
      //  LE LOGO LUI-MÊME (l'image), et non son lien : le squelette
      //  ne pose pas de lien, il pose le même dessin.
      const logo = entete.querySelector("img, svg");
      const zone = entete.querySelector("[data-squelette-deconnecte]") ?? entete.querySelector("nav");
      const ronds = zone
        ? [...zone.children].filter((n) => n.getBoundingClientRect().height > 20).map(b)
        : [];
      return { logo: logo ? b(logo).l : null, centres: ronds.map((r) => r.cx) };
    }`;
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
      await page.goto(RESULTATS, { waitUntil: "commit" });
      for (let i = 0; i < 400 && !gris; i += 1) {
        gris = await page.evaluate((L) => {
          if (!document.querySelector('[aria-busy="true"]')) return null;
          const r = new Function("return " + L)()();
          return r.centres.length === 3 ? r : null;
        }, LIRE).catch(() => null);
        if (!gris) await page.waitForTimeout(5);
      }
    }
    verif("le squelette de la barre est là, avec ses trois ronds",
      gris !== null, gris ? gris.centres.join(" · ") : "jamais vu");
    await page.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const vrai = await page.evaluate((L) => new Function("return " + L)()(), LIRE);
    verif("LE LOGO NE BOUGE PAS : même largeur au squelette et à l'arrivée",
      gris.logo === vrai.logo, `${gris.logo} px promis, ${vrai.logo} px rendus`);
    verif("LES TROIS CENTRES TOMBENT SUR CEUX DES ICÔNES",
      gris.centres.length === vrai.centres.length &&
      gris.centres.every((c, i) => Math.abs(c - vrai.centres[i]) <= 0.5),
      `${gris.centres.join(" · ")} contre ${vrai.centres.join(" · ")}`);
  } catch (e) {
    verif("déroulement du banc 853 (barre)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LE COMPTEUR DE VUES ══════════════════════════════════════════
{
  const T = `banc853-${Date.now()}`;
  const ID = `53000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: "Banc 853", styles: ["blackwork"], vues: 0 });
  const compte = async () =>
    ((await lire("tatoueurs", `slug=eq.${T}`))[0] ?? {}).vues;
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("853 · le compteur de vues");
    verif("la fiche part de zéro", (await compte()) === 0, String(await compte()));
    await page.goto(`${BASE}/artist/${T}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const apresUne = await compte();
    verif("ouvrir le profil compte UNE vue", apresUne === 1, String(apresUne));
    /*  ⚠️ LE GARDE-FOU : une par portfolio et par session/heure. On
        quitte la fiche, on y revient DANS LA MÊME SESSION — le compteur
        ne doit pas bouger. */
    await page.goto(RESULTATS, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/artist/${T}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const apresDeux = await compte();
    verif("y revenir dans l'heure n'en compte pas une seconde",
      apresDeux === 1, `${apresUne} puis ${apresDeux}`);
  } catch (e) {
    verif("déroulement du banc 853 (comptage)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }

  //  ET LE NOMBRE ARRIVE AU PIED DE LA CARTE.
  const { nav: n2, page: p2 } = await ouvrir("doigt");
  try {
    titre("853 · le nombre au pied de la carte du fil");
    await p2.goto(`${RESULTATS}&t=${Date.now()}`, { waitUntil: "domcontentloaded" });
    await p2.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    await p2.waitForTimeout(1200);
    const premier = await p2.evaluate(() =>
      document.querySelector("[data-carte] [data-lien-profil-de-fil]")
        ?.getAttribute("href")?.split("/artist/")[1]?.split("?")[0] ?? null);
    //  On donne un nombre à la carte qu'on voit : le chemin mesuré est
    //  celui de la BASE À L'ÉCRAN, pas celui du comptage (déjà mesuré).
    await modifier("tatoueurs", `slug=eq.${premier}`, { vues: 28 });
    await p2.goto(`${RESULTATS}&t=${Date.now()}`, { waitUntil: "domcontentloaded" });
    await p2.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    await p2.waitForTimeout(1200);
    const vu = await p2.evaluate(() => {
      const bloc = document.querySelector("[data-vues-de-fil]");
      const pied = document.querySelector("[data-pied-de-fil]");
      if (!bloc || !pied) return null;
      const r = (n) => n.getBoundingClientRect();
      const signaler = pied.querySelector('[aria-label^="Report"]');
      return {
        texte: bloc.textContent.trim(),
        dessin: Math.round(r(bloc.querySelector("svg")).width),
        aDroiteDeSignaler: signaler ? r(bloc).left >= r(signaler).right - 1 : false,
      };
    });
    /*  ██ nº 855 — LA MOITIÉ DE CETTE MESURE A ÉTÉ RETOURNÉE ██
        Ce banc lisait « le NOMBRE puis l'icône statistiques, à GAUCHE
        du signalement, sur la marge de la page ». Le propriétaire a
        tout retourné à la nº 855 : le bloc passe à DROITE du
        signalement, le DESSIN ouvre et le nombre suit, et c'est un ŒIL
        en blanc. Ce qui reste vrai ici, et qui appartient encore à la
        nº 853, c'est que LE NOMBRE ARRIVE : « 28 », avec un dessin de
        vingt pixels. La place, l'ordre, le dessin et la couleur se
        mesurent au banc 855 — deux bancs ne diront pas deux vérités
        sur le même sujet. */
    //  nº 867-§7 — le dessin fait 24 px depuis cette passe.
    verif("le pied montre le nombre, avec son dessin de 24 px",
      vu && vu.texte === "28" && vu.dessin === 24,
      vu ? `« ${vu.texte} » · dessin ${vu.dessin} px` : "bloc absent");
    verif("… et il est du côté du signalement (nº 855 : à sa droite)",
      vu && vu.aDroiteDeSignaler, vu ? `à droite ${vu.aDroiteDeSignaler}` : "bloc absent");
  } catch (e) {
    verif("déroulement du banc 853 (le nombre à l'écran)", false, String(e).slice(0, 400));
  } finally { await n2.close(); }
}

process.exit(bilan());
