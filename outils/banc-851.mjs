//  ██ BANC 851 — LES BADGES DE LA RANGÉE PRENNENT, AU DOIGT, LES
//  MESURES DU BADGE DU TYPE ██
//  ==================================================================
//  DÉCISION DU PROPRIÉTAIRE : sur smartphone, les badges de la rangée de
//  recherche (le compte, le style, la localité) prennent EXACTEMENT les
//  mesures du badge TYPE qui est à droite de l'avatar sur les cartes du
//  fil — même hauteur, même air intérieur, même typographie, même corps.
//  UNE SEULE VÉRIFICATION, sur consigne : les deux badges ont les mêmes
//  mesures. On ne les récite pas — on LIT celles du badge du type et on
//  demande aux autres d'être identiques. Le jour où le badge du type
//  changera, ce banc suivra tout seul, ou dira qu'ils ont divergé.
//  ⚠️ NI LES COULEURS NI LES CONTOURS NE SONT COMPARÉS : ils n'entrent
//  pas dans la consigne, et ils diffèrent par construction (le badge du
//  compte est vide, les filtres sont pleins — nº 847/848).
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

/*  UNE RECHERCHE QUI REND LES DEUX À L'ÉCRAN EN MÊME TEMPS : la rangée
    de badges en tête, et les cartes du fil dessous — chacune avec son
    badge de type (nº 843). */
const RECHERCHE = `${BASE}/search?style=blackwork&nature=tatouage`;

/** Les mesures qui font la consigne — hauteur, air, typographie, corps. */
const MESURES = `(n) => {
  const s = getComputedStyle(n);
  return {
    hauteur: Math.round(n.getBoundingClientRect().height * 100) / 100,
    hauteurMin: s.minHeight,
    air: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(" "),
    corps: s.fontSize,
    graisse: s.fontWeight,
    interligne: s.lineHeight,
    fonte: s.fontFamily,
  };
}`;

{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("851 · doigt — la rangée et la carte, mesure contre mesure");
    await page.goto(RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-badge-type]", { state: "visible", timeout: 20000 });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);
    const vu = await page.evaluate((M) => {
      const f = new Function("return " + M)();
      const rangee = [...document.querySelectorAll("[data-badge-compte],[data-filtre-actif]")];
      return {
        //  §8-§9 (nº 852) — DEUX BADGES DE TYPE VIVENT DÉSORMAIS DANS
        //  LE MÊME DOCUMENT (la carte du fil et celle du web), et
        //  l'appareil n'en montre qu'un : on prend CELUI QU'ON VOIT,
        //  jamais le premier venu, dont la boîte vaut zéro.
        type: f([...document.querySelectorAll("[data-badge-type]")]
          .find((n) => n.getBoundingClientRect().height > 0)),
        rangee: rangee.map((n) => ({ texte: n.textContent.trim(), ...f(n) })),
      };
    }, MESURES);

    verif("les deux objets sont bien à l'écran : le badge du type, et les badges de la rangée",
      vu.rangee.length >= 2, `${vu.rangee.length} badge(s) de rangée`);

    const memes = (cle) => vu.rangee.every((b) => b[cle] === vu.type[cle]);
    const dit = (cle) => `type ${vu.type[cle]} · rangée ${vu.rangee.map((b) => b[cle]).join(" | ")}`;

    verif("MÊME HAUTEUR", memes("hauteur") && memes("hauteurMin"),
      `${dit("hauteur")} (minimum ${dit("hauteurMin")})`);
    verif("MÊME AIR INTÉRIEUR", memes("air"), dit("air"));
    verif("MÊME CORPS", memes("corps"), dit("corps"));
    verif("MÊME TYPOGRAPHIE — graisse, interligne et fonte",
      memes("graisse") && memes("interligne") && memes("fonte"),
      `graisse ${dit("graisse")} · interligne ${dit("interligne")}`);
  } catch (e) {
    verif("déroulement du banc 851", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
