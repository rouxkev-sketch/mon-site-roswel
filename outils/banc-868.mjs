//  ██ BANC 868 — LE RETOUR APRÈS FOLLOW, LES DEUX FEUILLES, LES BADGES,
//  L'ORDRE DU PROFIL ██
//  ==================================================================
//   1. FOLLOW ET UNFOLLOW NE TOUCHENT PLUS À L'HISTORIQUE : depuis trois
//      pages d'origine, en navigation douce ET en navigation de
//      document, l'appui ne pose aucun cran et le retour rend LA PAGE
//      D'ORIGINE (jamais l'accueil).
//   2. LES DEUX FEUILLES DE « MA SÉLECTION » ont le même air en haut et
//      en bas — celle à deux titres comme celle sans titres.
//   3. LES BADGES D'UN PROFIL s'écrivent en GRIS (le gris des
//      sous-titres du site), web et doigt.
//   4. « MA SÉLECTION » > Portfolios : la ligne des villes tient sur UNE
//      ligne au doigt, deux au web.
//   5. L'ORDRE DU PROFIL : liens, site, bio, styles, techniques,
//      adresse — et les horaires dans la section du bas.
//   6. LES DEUX DESSINS : la goutte ouvre les styles, l'étoile les
//      techniques.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const U = { id: "30000000-0000-4000-8000-000000000868", email: "banc-868@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
const GABARIT = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
const GRIS = "rgb(168, 168, 176)";

//  LA FICHE DU PARCOURS (§1) — un portfolio ordinaire, avec des photos
//  pour qu'il paraisse dans les résultats.
const ID = `27000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const SLUG = `banc868-${Date.now()}`;
await ranger("tatoueurs", { ...GABARIT, id: ID, slug: SLUG, nom: "Banc 868", styles: ["blackwork"], ville_slug: `lyon-${SLUG}` });
await ranger("photos_tatoueur", [1, 2].map((i) => ({ id: `86800${i}00-0000-4000-8000-${String(i).padStart(12, "0")}`,
  tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${i}.svg`,
  miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));

const etat = (page) => page.evaluate(() => ({
  url: location.pathname + location.search,
  len: history.length,
  cran: Boolean((history.state ?? {}).retourReconstruit),
}));

//  ══ 1 · FOLLOW / UNFOLLOW, PUIS RETOUR ══════════════════════════════
/*  LE DÉFAUT DE LA nº 868, MESURÉ AVANT CORRECTION : l'appui sur le
    bouton était, le plus souvent, LE PREMIER APPUI FRANC de la page ;
    il posait donc le cran du filet (RetourGaranti) — la pile passait de
    3 à 4 entrées —, et le retour suivant était rattrapé vers « / ».
    RELEVÉ SUR CE BANC, TROIS ORIGINES SUR TROIS. Ce qui suit vérifie les
    deux moitiés : aucune entrée posée par l'appui, et le retour qui rend
    la page d'origine.
    ⚠️ LA NAVIGATION DE DOCUMENT EST LE CAS DE SAFARI : le WebKit de
    Playwright n'est pas installable dans cet atelier (téléchargement
    bloqué), on reproduit donc la CAUSE — une page du site ouverte en
    document, où le plancher de la pile se relève à la hauteur du moment
    et fait répondre « rien derrière moi » à tort. */
{
  /*  LE LIEN DE LA NAVIGATION DOUCE VISE NOTRE FICHE, jamais la
      première venue : les fiches de DÉMONSTRATION n'ont pas
      d'identifiant de base, donc pas de bouton « Follow » (la garde de
      BoutonSuivre) — on tomberait sur un profil sans le geste à
      mesurer. */
  const PARCOURS = [
    { origine: "/", lien: null },
    { origine: "/search?style=blackwork&nature=tatouage", lien: `[data-carte] [data-lien-profil-de-fil][href*="${SLUG}"]` },
    { origine: "/my-favorites?selection=suivis", lien: "[data-ligne-suivi]" },
  ];
  for (const { origine, lien } of PARCOURS) {
    for (const enDocument of [true, false]) {
      //  Sans lien vers un profil sur la page d'origine, la navigation
      //  douce n'existe pas : on ne joue que le document.
      if (!enDocument && !lien) continue;
      for (const suiviAuDepart of [false, true]) {
        //  « Ma sélection » n'a de ligne à toucher que si l'on suit déjà.
        if (!enDocument && origine.startsWith("/my-favorites") && !suiviAuDepart) continue;
        await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
        if (suiviAuDepart) await ranger("tatoueurs_suivis", [{ utilisateur_id: U.id, tatoueur_id: ID, cree_le: "2026-01-01T00:00:00Z" }]);
        const { nav, page } = await ouvrir("doigt", { session: U });
        try {
          const geste = suiviAuDepart ? "Unfollow" : "Follow";
          titre(`868 · §1 — ${geste} depuis « ${origine} », arrivée ${enDocument ? "EN DOCUMENT" : "en navigation douce"}`);
          await page.goto(`${BASE}${origine}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(1500);
          const depart = await etat(page);
          verif("on part de la page d'origine", depart.url === origine, depart.url);
          if (enDocument) await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
          else {
            //  La carte peut être loin dans la liste : on l'amène sous
            //  l'œil avant de la toucher.
            await page.locator(lien).first().scrollIntoViewIfNeeded({ timeout: 20000 });
            await page.waitForTimeout(400);
            await page.locator(lien).first().tap();
          }
          await page.waitForFunction(() => /\/artist\//.test(location.pathname), null, { timeout: 15000 });
          await page.waitForTimeout(1800);
          const surLeProfil = await etat(page);
          await page.locator(`[aria-label^="${geste}"]`).first().tap();
          await page.waitForTimeout(1800);
          const apres = await etat(page);
          verif(`l'appui sur « ${geste} » N'AJOUTE AUCUNE ENTRÉE et ne pose aucun cran`,
            apres.len === surLeProfil.len && apres.cran === false && apres.url === surLeProfil.url,
            `pile ${surLeProfil.len} → ${apres.len} · cran ${apres.cran}`);
          verif("… et il a bien basculé l'état", await page.locator(`[aria-label^="${suiviAuDepart ? "Follow" : "Unfollow"}"]`).first().isVisible().catch(() => false));
          await page.goBack();
          await page.waitForTimeout(2500);
          const retour = await etat(page);
          verif("LE RETOUR REND LA PAGE D'ORIGINE (jamais l'accueil)", retour.url === origine, `${retour.url} (attendu ${origine})`);
        } catch (e) {
          verif(`déroulement du banc 868 (§1 ${origine} ${enDocument ? "document" : "douce"})`, false, String(e).slice(0, 300));
        } finally { await nav.close(); }
      }
    }
  }
}

//  ══ 2 ET 4 · LES DEUX FEUILLES, ET LA LIGNE DES VILLES ══════════════
{
  const B = `(n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), h: +r.height.toFixed(1) }; }`;
  const MESURE = `(S) => { const B = new Function("return " + S)();
    const racine = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).position === "fixed" && /z-\\[70\\]/.test(d.className));
    if (!racine) return { absente: true };
    const bande = racine.querySelector("[data-bande-feuille]");
    const plaque = bande.parentElement;
    const trait = bande.querySelector("span");
    const bloc = [...racine.querySelectorAll("div")].find((d) => /border-t/.test(d.className) && /safe-area/.test(d.className));
    const liste = racine.querySelector(".overflow-y-auto");
    const enfants = liste ? [...liste.children] : [];
    const titres = bloc ? [...bloc.querySelectorAll("button")].map((b) => b.textContent.trim()) : [];
    const dernier = bloc ? [...bloc.querySelectorAll("button")].pop() : enfants[enfants.length - 1];
    const premier = enfants[0];
    return { ecran: innerHeight, plaque: { ...B(plaque), padBas: getComputedStyle(plaque).paddingBottom },
      bloc: bloc ? { ...B(bloc), padBas: getComputedStyle(bloc).paddingBottom } : null, titres,
      airHaut: premier && trait ? +(B(premier).y - B(trait).bas).toFixed(1) : null,
      airBas: dernier ? +(B(plaque).bas - B(dernier).bas).toFixed(1) : null }; }`;
  const forger = async (nom, style, type, ville) => {
    const id = `28000000-0000-4000-8000-${(Date.now() + nom.charCodeAt(0)).toString(16).padStart(12, "0")}`;
    const slug = `banc868-${nom}-${Date.now()}`;
    await ranger("tatoueurs", { ...GABARIT, id, slug, nom: `Banc 868 ${nom}`, styles: [style], ville_slug: `lyon-${slug}`,
      ville_nom: ville ?? GABARIT.ville_nom, type_fiche: type, etablissement: type === "artiste" ? null : `Lieu ${nom}` });
    await ranger("photos_tatoueur", [1, 2].map((i) => ({ id: `${id.slice(0, 8)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: id, style, rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${i}.svg`,
      miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
    return id;
  };
  const mesures = {};
  for (const [cas, fiches] of [
    //  DEUX TITRES : il faut des styles ET des types différents, sans
    //  quoi le groupe « Profil » disparaît (nº 865).
    ["deux", [["a", "blackwork", "artiste", null], ["b", "realisme", "salon", null]]],
    //  SANS TITRES : des styles différents, un seul type — un seul
    //  groupe, donc pas de bloc de titres.
    ["un", [["c", "blackwork", "artiste", "Saint-Étienne-de-Saint-Geoirs"], ["d", "realisme", "artiste", null]]],
  ]) {
    await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
    const ids = [];
    for (const [nom, style, type, ville] of fiches) ids.push(await forger(nom, style, type, ville));
    await ranger("tatoueurs_suivis", ids.map((id) => ({ utilisateur_id: U.id, tatoueur_id: id, cree_le: "2026-01-01T00:00:00Z" })));
    const { nav, page } = await ouvrir("doigt", { session: U });
    try {
      titre(`868 · §2 — la feuille à ${cas === "deux" ? "DEUX menus" : "UN SEUL menu"}`);
      await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await page.waitForSelector("[data-suivi]", { timeout: 20000 });
      if (cas === "un") {
        //  §4 — la ligne des villes, au doigt : UNE ligne, coupée.
        const info = await page.evaluate(() => {
          const n = document.querySelector("[data-info-suivi]");
          if (!n) return null;
          const s = getComputedStyle(n);
          return { texte: n.textContent.trim(), lignes: Math.round(n.getBoundingClientRect().height / parseFloat(s.lineHeight)),
            clamp: s.webkitLineClamp, coupe: n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1 };
        });
        verif("§4 — au doigt, la ligne des villes tient sur UNE seule ligne, coupée par « … »",
          info?.clamp === "1" && info.lignes === 1, JSON.stringify(info));
      }
      await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
      await page.waitForTimeout(1200);
      mesures[cas] = await page.evaluate(new Function("return " + MESURE)(), B);
      const v = mesures[cas];
      if (cas === "deux") verif("la feuille a bien ses deux titres", !v.absente && v.titres.length === 2, JSON.stringify(v.titres));
      else verif("la feuille n'a pas de bloc de titres", !v.absente && v.bloc === null, JSON.stringify({ bloc: Boolean(v.bloc) }));
      verif("la feuille touche le bas de l'écran", v.plaque?.bas === v.ecran, `${v.plaque?.bas} / ${v.ecran}`);
    } catch (e) {
      verif(`déroulement du banc 868 (§2 ${cas})`, false, String(e).slice(0, 300));
    } finally { await nav.close(); }
  }
  titre("868 · §2 — les deux feuilles, comparées");
  verif("L'AIR EN HAUT est le même dans les deux feuilles",
    mesures.deux?.airHaut === mesures.un?.airHaut, `deux menus ${mesures.deux?.airHaut} · un menu ${mesures.un?.airHaut}`);
  verif("L'AIR EN BAS est le même dans les deux feuilles (vingt pixels)",
    mesures.deux?.airBas === mesures.un?.airBas && mesures.un?.airBas === 20,
    `deux menus ${mesures.deux?.airBas} · un menu ${mesures.un?.airBas}`);
  verif("… et le bloc des titres le tient par la MÊME composition (huit de liste plus la réserve de la plaque)",
    mesures.deux?.bloc?.padBas === "20px" && mesures.un?.plaque?.padBas === "12px",
    `bloc ${mesures.deux?.bloc?.padBas} · plaque ${mesures.un?.plaque?.padBas}`);
}

//  ══ 3, 5 ET 6 · LE PROFIL : GRIS, ORDRE, DESSINS ════════════════════
{
  const IDP = `29000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
  const SLUGP = `banc868-profil-${Date.now()}`;
  await ranger("tatoueurs", { ...GABARIT, id: IDP, slug: SLUGP, nom: "Banc 868 profil", type_fiche: "salon", etablissement: "Salon 868",
    styles: ["blackwork", "realisme", "trash-polka", "neo-japonais", "old-school"], ville_slug: `lyon-${SLUGP}`,
    bio: "6 artistes, 6 univers — la fiche du banc 868.", site_web: "https://exemple.test",
    lien_instagram: "https://instagram.com/exemple", filtres_technique: ["machine"], filtres_composition: ["small"], filtres_besoins: ["couvrir"] });
  await ranger("photos_tatoueur", [1, 2, 3].map((i) => ({ id: `86830${i}00-0000-4000-8000-${String(i).padStart(12, "0")}`,
    tatoueur_id: IDP, style: "blackwork", rendu: ["black", "black_and_grey", "color"][i - 1], nature: "tatouage",
    url: `/images-demo/tatouage/blackwork-${i}.svg`, miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
  const LIRE = `() => {
    const haut = (n) => (n ? Math.round(n.getBoundingClientRect().top) : null);
    const ligne = (m) => { const n = document.querySelector("[" + m + "]"); if (!n) return null;
      const svg = n.querySelector("svg");
      const capsule = [...n.querySelectorAll("span")].find((e) => e.className.includes("px-2.5"));
      return { y: haut(n), chemin: svg?.querySelector("path")?.getAttribute("d") ?? null,
        taille: svg ? Math.round(svg.getBoundingClientRect().width) : null,
        trait: svg?.querySelector("path")?.getAttribute("stroke-width") ?? null,
        couleur: capsule ? getComputedStyle(capsule).color : null,
        fond: capsule ? getComputedStyle(capsule).backgroundColor : null }; };
    const bio = [...document.querySelectorAll("p")].find((p) => /6 artistes/.test(p.textContent));
    //  nº 869 — Instagram vit dans la rangée d'actions : c'est le haut de
    //  la RANGÉE qu'on relève pour lui. nº 870 — LE SITE, lui, a retrouvé
    //  sa ligne, sous la bio : on relève la ligne elle-même.
    const rangee = document.querySelector("[data-rangee-actions]");
    const instagram = rangee && [...rangee.querySelectorAll("a")].find((a) => /instagram\\.com/.test(a.href)) ? rangee : null;
    const site = [...document.querySelectorAll("a")].find((a) => /exemple\\.test/.test(a.href));
    const adresse = [...document.querySelectorAll("a, p, span")].reverse().find((n) => /Lyon/.test(n.textContent) && n.children.length === 0);
    return { instagram: haut(instagram), site: haut(site), bio: haut(bio),
      styles: ligne("data-styles-fiche"), pratiques: ligne("data-pratique-fiche"), adresse: haut(adresse) }; }`;
  //  ⛔ nº 869-§1 — les deux dessins (goutte, étoile) ne sont plus en
  //  tête des lignes : on vérifie leur ABSENCE.
  for (const mode of ["doigt", "web"]) {
    const { nav, page } = await ouvrir(mode);
    try {
      titre(`868 · §3/§5/§6 — le profil au ${mode}`);
      await page.goto(`${BASE}/artist/${SLUGP}?entree=lien`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-styles-fiche]", { timeout: 20000 });
      await page.waitForTimeout(1500);
      const v = await page.evaluate(new Function("return " + LIRE)());
      /*  ⛔ REPRIS PAR LA nº 869 : les liens (Instagram, le site) sont
          devenus la RANGÉE D'ACTIONS sous le bloc du nom, et les lignes
          de badges n'ont plus d'icône (§1). L'ordre se lit donc à
          partir de la rangée, et les deux dessins ne sont plus là — le
          banc 869 mesure le nouvel en-tête ; celui-ci garde le gris. */
      /*  §2 (nº 874) — LE SITE EST PASSÉ SOUS LA BIO : l'ordre du
          propriétaire est désormais rangée → bio → site → styles →
          techniques → adresse. */
      verif("§5 — l'ordre (nº 871, revu nº 874-§2) : la rangée (Instagram), LA BIO, LE SITE, les styles, les techniques, l'adresse",
        v.instagram !== null && v.site !== null && v.bio !== null && v.adresse !== null &&
        v.instagram < v.bio && v.bio < v.site && v.site < v.styles.y && v.styles.y < v.pratiques.y && v.pratiques.y < v.adresse,
        JSON.stringify({ instagram: v.instagram, bio: v.bio, site: v.site, styles: v.styles.y, techniques: v.pratiques.y, adresse: v.adresse }));
      verif("§6 (repris nº 869-§1) — plus aucun dessin en tête des deux lignes",
        v.styles.chemin === null && v.pratiques.chemin === null && v.styles.taille === null && v.pratiques.taille === null,
        `${String(v.styles.chemin).slice(0, 40)} · ${String(v.pratiques.chemin).slice(0, 40)}`);
      verif("§3 — les badges s'écrivent dans le GRIS des sous-titres, sur les deux lignes",
        v.styles.couleur === GRIS && v.pratiques.couleur === GRIS, `${v.styles.couleur} · ${v.pratiques.couleur}`);
      verif("… et le contour de la nº 867 ne bouge pas (aucun fond)",
        v.styles.fond === "rgba(0, 0, 0, 0)" && v.pratiques.fond === "rgba(0, 0, 0, 0)", `${v.styles.fond} · ${v.pratiques.fond}`);
    } catch (e) {
      verif(`déroulement du banc 868 (§3/§5/§6 ${mode})`, false, String(e).slice(0, 300));
    } finally { await nav.close(); }
  }
}

process.exit(bilan());
