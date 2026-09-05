//  ██ BANC 858 — UN SEUL VA-ET-VIENT, ET PLUS DE BANDE NOIRE ██
//  ==================================================================
//  Les deux corrections de la passe, au doigt :
//   1. LE VA-ET-VIENT DE L'ACCUEIL SORT DU MÊME COMPOSANT que celui de
//      « Ma sélection » (OngletsLigne) : on le prouve en MESURANT les
//      deux côte à côte — hauteur de piste, hauteur d'onglet, corps,
//      graisse, rembourrage, boîte de la ligne, ligne grise bord à bord,
//      trait rose. Tout, SAUF ce que la mécanique nº 857 fait varier
//      exprès : la largeur des colonnes et le contenu des onglets.
//   2. PLUS DE BANDE NOIRE sous la ligne : le contenu qui défile
//      commence PILE dessous, sur les deux pages — et le squelette
//      promet la même chose.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const TATTOO = "Find your tattoo style…", FLASH = "Find your Flash style…";

/*  ⚠️ LA BOÎTE DE LA LIGNE SE CHERCHE PAR SA FORME, pas par le premier
    `aria-hidden` venu : les icônes de l'accueil en sont aussi (ce sont
    des dessins). C'est le DIV de trois pixels de haut, dernier enfant du
    va-et-vient — celui qui porte la ligne grise et le trait rose. */
const SONDE = `() => {
  const r = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), h: +x.height.toFixed(1), l: Math.round(x.width) }; };
  const st = (n, ...p) => { if (!n) return null; const c = getComputedStyle(n); return Object.fromEntries(p.map((k) => [k, c[k]])); };
  const barre = document.querySelector("[data-barre-fixe]");
  const reserve = document.querySelector("[data-reserve-barre]");
  const groupe = document.querySelector("[data-rangee-moteur] nav, [data-rangee-moteur] [role='radiogroup']");
  const boutons = groupe ? [...groupe.querySelectorAll("a[href], [role='radio']")] : [];
  const boiteLigne = groupe ? [...groupe.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3) : null;
  const grise = boiteLigne?.querySelector("span:first-child");
  const rose = boiteLigne?.querySelector("span:last-child");
  const main = document.querySelector("main");
  const premier = main ? [...main.children].find((n) => n.getBoundingClientRect().height > 0) : null;
  return {
    barre: r(barre), reserve: reserve ? Number(reserve.dataset.reservePosee) : null,
    groupe: r(groupe), boiteLigne: r(boiteLigne), grise: r(grise), rose: r(rose),
    roseStyle: st(rose, "backgroundColor", "borderRadius"),
    onglet: { ...r(boutons[0]), ...st(boutons[0], "fontSize", "fontWeight", "minHeight", "paddingLeft", "paddingRight") },
    boutons: boutons.map((b) => ({ nom: b.getAttribute("aria-label"), actif: (b.getAttribute("aria-checked") === "true" || b.getAttribute("aria-current") === "page"),
      texte: b.textContent.trim(), dessin: Boolean(b.querySelector("svg")), ...r(b) })),
    premier: premier ? r(premier) : null,
    largeurEcran: window.innerWidth,
  };
}`;
const sonder = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE);

/** Un compte avec trente favoris — de quoi faire défiler « Ma sélection ». */
const U = { id: "30000000-0000-4000-8000-000000000858", email: "banc-858@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
{
  const photos = (await lire("photos_tatoueur", "select=id,nature")).filter((p) => p.nature === "tatouage").slice(0, 30);
  await ranger("favoris_photos", photos.map((p, i) => ({
    utilisateur_id: U.id, photo_id: p.id, cree_le: `2026-01-01T00:00:${String(59 - i).padStart(2, "0")}Z`,
  })));
}

//  ══ LE RELEVÉ DES DEUX PAGES ═════════════════════════════════════════
const releves = {};
for (const [nom, url] of [["accueil", `${BASE}/`], ["selection", `${BASE}/my-favorites`]]) {
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    releves[nom] = await sonder(page);
    //  ET LA BANDE NE NAÎT PAS AU DÉFILEMENT : la barre est fixe, le
    //  contenu passe dessous — on vérifie qu'il n'y a pas de blanc.
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(700);
    releves[`${nom}Defile`] = await sonder(page);
  } catch (e) {
    verif(`déroulement du banc 858 (relevé ${nom})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
const A = releves.accueil, S = releves.selection;

//  ══ 1 · LE MÊME COMPOSANT ════════════════════════════════════════════
{
  titre("858 · §1 — le va-et-vient de l'accueil est celui de « Ma sélection »");
  verif("les deux pages portent bien un va-et-vient",
    Boolean(A?.groupe && S?.groupe), `accueil ${Boolean(A?.groupe)} · sélection ${Boolean(S?.groupe)}`);
  verif("MÊME HAUTEUR de piste (43) et de va-et-vient (46 : la piste et sa ligne)",
    A?.groupe?.h === S?.groupe?.h && A?.groupe?.h === 46 && A?.onglet?.h === S?.onglet?.h && A?.onglet?.h === 43,
    `groupe ${A?.groupe?.h} / ${S?.groupe?.h} · onglet ${A?.onglet?.h} / ${S?.onglet?.h}`);
  verif("MÊME ÉCRITURE — corps, graisse, hauteur minimale, rembourrage",
    A?.onglet?.fontSize === S?.onglet?.fontSize && A?.onglet?.fontWeight === S?.onglet?.fontWeight
      && A?.onglet?.minHeight === S?.onglet?.minHeight && A?.onglet?.paddingLeft === S?.onglet?.paddingLeft
      && A?.onglet?.paddingRight === S?.onglet?.paddingRight,
    `${A?.onglet?.fontSize}/${A?.onglet?.fontWeight}/${A?.onglet?.minHeight}/${A?.onglet?.paddingLeft} contre ${S?.onglet?.fontSize}/${S?.onglet?.fontWeight}/${S?.onglet?.minHeight}/${S?.onglet?.paddingLeft}`);
  verif("MÊME BOÎTE DE LIGNE (3 px) et même ligne grise (1 px), BORD À BORD sur les deux",
    A?.boiteLigne?.h === 3 && S?.boiteLigne?.h === 3
      && A?.grise?.h === 1 && S?.grise?.h === 1
      && A?.grise?.l === A?.largeurEcran && S?.grise?.l === S?.largeurEcran,
    `boîtes ${A?.boiteLigne?.h}/${S?.boiteLigne?.h} · grises ${A?.grise?.l}/${S?.grise?.l} sur ${A?.largeurEcran}`);
  verif("MÊME TRAIT ROSE sous l'onglet actif — même épaisseur, même couleur, même arrondi",
    A?.rose?.h === 3 && S?.rose?.h === 3
      && A?.roseStyle?.backgroundColor === S?.roseStyle?.backgroundColor
      && A?.roseStyle?.borderRadius === S?.roseStyle?.borderRadius,
    `${A?.rose?.h} px ${A?.roseStyle?.backgroundColor} contre ${S?.rose?.h} px ${S?.roseStyle?.backgroundColor}`);
  /*  ET LA MÉCANIQUE nº 857 EST LA SEULE CHOSE QUI DIFFÈRE : les
      colonnes de l'accueil sont inégales (icône seule / icône + phrase),
      celles de « Ma sélection » égales. C'est voulu, et c'est dit. */
  const [actif, inactif] = A?.boutons ?? [];
  /*  ██ nº 859-§2 — L'INACTIVE NE SE RÉDUIT PLUS À SON ICÔNE ██
      Elle porte désormais son icône ET son mot court (« Tattoo » /
      « Flash »), et les colonnes ont été remesurées : 88 px pour elle,
      le reste à la phrase. Ce qui reste vrai ICI, et qui appartient
      encore à la nº 858, c'est que les COLONNES SONT INÉGALES — la
      mécanique que le composant partagé sait rendre. Le détail des
      mots et des largeurs se mesure au banc 859. */
  verif("… et les colonnes restent INÉGALES : l'active plus large que l'inactive",
    inactif && actif?.actif && actif.l > inactif.l && inactif.nom === FLASH && actif.texte === TATTOO,
    `inactive ${inactif?.l} px « ${inactif?.texte} » · active ${actif?.l} px « ${actif?.texte} »`);
  verif("… la phrase n'est PAS coupée : sa colonne est plus large que son contenu",
    actif && actif.l >= 210, `${actif?.l} px pour 210 nécessaires`);
  verif("les deux onglets de « Ma sélection » gardent leurs colonnes ÉGALES",
    S?.boutons?.length === 2 && S.boutons[0].l === S.boutons[1].l,
    `${S?.boutons?.map((b) => b.l).join(" | ")}`);
}

//  ══ 2 · PLUS DE BANDE NOIRE ══════════════════════════════════════════
{
  titre("858 · §2 — plus de bande noire sous la ligne");
  for (const [nom, v] of [["l'accueil", A], ["« Ma sélection »", S]]) {
    verif(`${nom} : le contenu commence PILE sous la ligne (0 px de bande)`,
      v?.grise && v?.premier && v.premier.y === v.grise.bas,
      v ? `ligne à ${v?.grise?.bas} · contenu à ${v?.premier?.y}` : "relevé absent");
    verif(`${nom} : la barre ne peint plus rien sous la ligne, et la réserve dit sa vraie hauteur`,
      v?.barre?.bas === v?.grise?.bas && v?.reserve === v?.barre?.bas,
      v ? `barre ${v?.barre?.bas} · ligne ${v?.grise?.bas} · réserve ${v?.reserve}` : "relevé absent");
  }
  verif("APRÈS DÉFILEMENT, la barre et sa ligne n'ont pas bougé — aucune bande ne naît",
    releves.accueilDefile?.grise?.bas === A?.grise?.bas && releves.selectionDefile?.grise?.bas === S?.grise?.bas
      && releves.accueilDefile?.barre?.bas === A?.barre?.bas,
    `accueil ${A?.grise?.bas} → ${releves.accueilDefile?.grise?.bas} · sélection ${S?.grise?.bas} → ${releves.selectionDefile?.grise?.bas}`);
}

//  ══ LE SQUELETTE DE « MA SÉLECTION » PROMET LA MÊME CHOSE ════════════
/*  L'ACCUEIL N'EN A PAS : il est prérendu, sans `loading.tsx` (la note
    de SquelettesDePage le dit). « Ma sélection », si. */
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("858 · le squelette de « Ma sélection » ne saute pas");
    /*  ⚠️ EN NAVIGATION DOUCE, ET IL LE FAUT. Sur un chargement complet
        la doublure répond plus vite que le squelette ne s'affiche : on
        ne le voit jamais (le banc nº 857 croyait le mesurer — il lisait
        la page arrivée). Depuis l'accueil, le lien de la barre mène à
        « Ma sélection » sans recharger : le squelette y vit le temps que
        les favoris arrivent.
        ⚠️ ET C'EST SA RÉSERVE QU'ON MESURE, pas ses cartes : pour un
        compte dont la mémoire de session ne dit encore rien, la garde de
        la nº 819 ne peint AUCUNE carte grise. La réserve, elle, est
        toujours là — et c'est elle qui décide où le contenu commence. */
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    let gris = null;
    await page.locator('a[href*="my-favorites"]').first().click({ force: true });
    for (let i = 0; i < 600 && !gris; i += 1) {
      gris = await page.evaluate(() => {
        if (document.documentElement.dataset.appareil !== "mobile") return null;
        if (!document.querySelector('[aria-busy="true"]')) return null;
        if (document.querySelector("[data-carte]")) return null;
        const r = document.querySelector("[data-reserve-squelette]");
        return r ? { posee: Number(r.dataset.reservePosee), h: Math.round(r.getBoundingClientRect().height) } : null;
      }).catch(() => null);
      if (!gris) await page.waitForTimeout(3);
    }
    await page.waitForSelector("[data-carte]", { timeout: 30000 });
    await page.waitForTimeout(1200);
    const vrai = await sonder(page);
    verif("le squelette a bien été attrapé, page occupée et sans une seule vraie carte",
      gris !== null, gris ? `réserve ${gris.h} px` : "jamais vu");
    verif("sa réserve promet EXACTEMENT la hauteur de la barre qui vient — AUCUN SAUT",
      gris && gris.h === vrai?.barre?.bas && gris.posee === vrai?.reserve,
      `squelette ${gris?.h} (posée ${gris?.posee}) · barre ${vrai?.barre?.bas} · réserve ${vrai?.reserve}`);
  } catch (e) {
    verif("déroulement du banc 858 (squelette)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
