//  ██ BANC toast-837 — le toast de confirmation des réactivations ██
//  Doublure sur :3222 (SLUGS_UNIQUES=1), site bâti et servi sur :3000.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, effacer, modifier } from "./banc-socle.mjs";

const U = { id: "00000000-0000-4000-8000-000000000837", email: "toast-837@yokofolio.test" };
const FICHE = "fiche-837";
const VERT = "rgb(52, 211, 153)";
const ROUGE = "rgb(255, 77, 69)";
const dans30j = () => new Date(Date.now() + 30 * 86400e3).toISOString();

async function poserLePortfolio(enSuppression) {
  await effacer("tatoueurs", `user_id=eq.${U.id}`);
  await ranger("tatoueurs", {
    id: FICHE, slug: "atelier-837", nom: "Atelier 837", user_id: U.id, publie: true,
    ville_nom: "Lyon", ville_code_postal: "69001", ville_slug: "lyon", departement: "69",
    region: "Auvergne-Rhône-Alpes", pays: "FR", code_pays: "FR", latitude: 45.76, longitude: 4.83,
    type_fiche: "artiste", etablissement: null, mode_exercice: "studio", rayon_zone_km: null, villes: null,
    photo_profil: null, ancien_slug: null, styles: ["blackwork"], cree_le: "2026-01-01T00:00:00Z",
    maj_le: "2026-01-01T00:00:00Z", score: 10, bio: null, lien_instagram: null, telephone: null, email: null,
    statut: "publiee", brouillon: null, hors_ligne: null,
    supprime_le: enSuppression ? new Date().toISOString() : null,
    purge_le: enSuppression ? dans30j() : null,
  });
}
async function poserLaSuppressionDeCompte() {
  await effacer("suppressions_comptes", `user_id=eq.${U.id}`);
  await ranger("suppressions_comptes", { user_id: U.id, demandee_le: new Date().toISOString(), purge_le: dans30j(), courriel: U.email });
  await modifier("tatoueurs", `user_id=eq.${U.id}`, { supprime_le: new Date().toISOString() });
}

const CAS = {
  portfolio: { chemin: "/become-an-artist/portfolio?reactiver=" + FICHE, texte: "Deletion canceled: your portfolio is back as it was." },
  securite: { chemin: "/become-an-artist/security?reactiver=" + FICHE, texte: "Deletion canceled: your portfolio is back as it was." },
  "compte-avec": { chemin: "/my-favorites?reactiver=compte", texte: "Deletion canceled: your account and your portfolios are back as they were." },
  "compte-deja": { chemin: "/my-favorites?reactiver=compte", texte: "Deletion canceled: your account and your portfolios are back as they were." },
  "compte-sans": { chemin: "/my-favorites?reactiver=compte", texte: "Deletion canceled: your account is back as it was." },
  echec: { chemin: "/become-an-artist/portfolio?reactiver=fiche-inconnue", texte: "This portfolio isn't yours.", ton: "probleme" },
};

async function jouer(mode, cas) {
  titre(`${cas} · ${mode}`);
  if (cas === "portfolio" || cas === "securite") await poserLePortfolio(true);
  if (cas === "compte-avec" || cas === "compte-deja") { await poserLePortfolio(false); await poserLaSuppressionDeCompte(); }
  if (cas === "compte-sans") { await effacer("tatoueurs", `user_id=eq.${U.id}`); await poserLaSuppressionDeCompte(); }
  if (cas === "echec") await poserLePortfolio(false);

  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    if (cas === "compte-deja") {
      //  LE CAS NORMAL : la connexion a déjà appelé la route (EcranAuthentification),
      //  on arrive ensuite avec le paramètre. La phrase doit rester « Deletion canceled ».
      const r = await page.request.post(`${BASE}/api/tatoueur/reactiver`);
      const j = await r.json();
      verif("la connexion a consommé la réactivation (reactive: true, portfolios: 1)", j.ok === true && j.reactive === true && j.portfolios === 1, JSON.stringify(j));
    }
    await page.goto(`${BASE}${CAS[cas].chemin}`, { waitUntil: "domcontentloaded" });
    const t0 = Date.now();
    await page.waitForSelector("[data-toast]", { state: "attached", timeout: 30000 });
    const premier = await page.evaluate(() => { const t = document.querySelector("[data-toast]"); const cs = getComputedStyle(t); return { opacity: Number(cs.opacity), translate: cs.translate }; });
    const tApparu = Date.now() - t0;
    await page.waitForTimeout(450);
    const etat = await page.evaluate(() => {
      const t = document.querySelector("[data-toast]"); const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
      const trait = t.querySelector("svg path"); const pastille = t.querySelector("span");
      return {
        ton: t.getAttribute("data-toast"), role: t.getAttribute("role"), texte: t.querySelector("p")?.textContent,
        position: cs.position, parentBody: t.parentElement === document.body, z: cs.zIndex, opacity: Number(cs.opacity), translate: cs.translate,
        left: r.left, right: r.right, bottom: r.bottom, width: r.width, innerW: innerWidth, innerH: innerHeight,
        fond: cs.backgroundColor, radius: cs.borderRadius, taille: cs.fontSize,
        trait: trait ? getComputedStyle(trait).stroke : null, pastilleTaille: pastille ? pastille.getBoundingClientRect().width : null, pastilleCouleur: pastille ? getComputedStyle(pastille).color : null,
        ligneNue: [...document.querySelectorAll("main p, main div")].some((e) => e.children.length === 0 && /Deletion canceled|is back as/.test(e.textContent)),
        toasts: document.querySelectorAll("[data-toast]").length,
        url: location.pathname + location.search,
      };
    });
    const attendu = CAS[cas];
    verif("le toast paraît", etat.toasts === 1, `${tApparu} ms après l'arrivée`);
    verif("le texte attendu", etat.texte === attendu.texte, JSON.stringify(etat.texte));
    verif("le ton", etat.ton === (attendu.ton ?? "valide") && etat.role === (attendu.ton === "probleme" ? "alert" : "status"), `${etat.ton} · ${etat.role}`);
    verif(attendu.ton === "probleme" ? "la croix rouge" : "la coche verte", etat.trait === (attendu.ton === "probleme" ? ROUGE : VERT), `${etat.trait}, pastille ${etat.pastilleTaille} px`);
    verif("pastille de la famille, taille « liste » (36 px)", etat.pastilleTaille === 36, String(etat.pastilleTaille));
    verif("bloc sombre de la charte, coins arrondis", etat.fond === "rgb(38, 44, 52)" && etat.radius === "16px", `${etat.fond} · ${etat.radius}`);
    verif("fixé à la racine du document, au-dessus du contenu", etat.position === "fixed" && etat.parentBody && Number(etat.z) === 90, `${etat.position} · body:${etat.parentBody} · z ${etat.z}`);
    if (mode === "web") verif("WEB : en bas à gauche (16 px du bord gauche, 16 px du bas)", Math.abs(etat.left - 16) <= 1 && Math.abs(etat.innerH - etat.bottom - 16) <= 1, `left ${etat.left.toFixed(1)} · bas ${(etat.innerH - etat.bottom).toFixed(1)} · largeur ${etat.width.toFixed(0)}`);
    else verif("DOIGT : en bas au centre (16 px du bas)", Math.abs((etat.left + etat.width / 2) - etat.innerW / 2) <= 1 && Math.abs(etat.innerH - etat.bottom - 16) <= 1 && etat.width <= etat.innerW - 32, `centre ${(etat.left + etat.width / 2).toFixed(1)} / ${etat.innerW / 2} · bas ${(etat.innerH - etat.bottom).toFixed(1)} · largeur ${etat.width.toFixed(0)}`);
    verif("il glisse à l'entrée (transparent au premier rendu, plein ensuite)", premier.opacity < 1 && etat.opacity === 1 && (etat.translate === "none" || /^0px( 0px)?$/.test(etat.translate)), `opacité ${premier.opacity} → ${etat.opacity} · translate ${premier.translate} → ${etat.translate}`);
    verif("la ligne nue a disparu du flux de la page", etat.ligneNue === false);
    verif("l'adresse est nettoyée", !/reactiver=/.test(etat.url), etat.url);
    if (cas === "portfolio" || cas === "securite") {
      const [ligne] = await lire("tatoueurs", `id=eq.${FICHE}`);
      verif("en base : le portfolio est revenu (purge_le et supprime_le vides)", ligne && ligne.purge_le === null && ligne.supprime_le === null, JSON.stringify({ purge_le: ligne?.purge_le, supprime_le: ligne?.supprime_le }));
    }
    if (cas.startsWith("compte")) {
      const restes = await lire("suppressions_comptes", `user_id=eq.${U.id}`);
      const fiches = await lire("tatoueurs", `user_id=eq.${U.id}`);
      verif("en base : la suppression de compte est annulée", Array.isArray(restes) && restes.length === 0, `${restes.length} ligne(s) restante(s)`);
      verif("en base : les portfolios du compte sont revenus", fiches.every((f) => f.supprime_le === null), `${fiches.length} fiche(s)`);
    }
    //  IL RESTE ~5 s, PUIS S'EFFACE SEUL.
    await page.waitForTimeout(4000 - (Date.now() - t0 - tApparu) > 0 ? 4000 - (Date.now() - t0 - tApparu) : 0);
    const encore = await page.evaluate(() => document.querySelectorAll("[data-toast]").length);
    verif("encore là à 4 s", encore === 1);
    await page.waitForTimeout(2200);
    const parti = await page.evaluate(() => document.querySelectorAll("[data-toast]").length);
    verif("parti de lui-même avant 6,2 s (retiré du document)", parti === 0);
    if (cas === "portfolio" && mode === "web") {
      const rechargement = await page.evaluate(() => location.pathname + location.search);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
      const rejoue = await page.evaluate(() => document.querySelectorAll("[data-toast]").length);
      verif("un rechargement ne rejoue rien (adresse propre)", rejoue === 0, rechargement);
    }
  } catch (e) {
    verif(`déroulement ${cas} · ${mode}`, false, String(e).slice(0, 200));
  } finally {
    await nav.close();
  }
}

for (const cas of ["portfolio", "compte-avec", "compte-sans"]) { await jouer("web", cas); await jouer("doigt", cas); }
await jouer("web", "compte-deja");
await jouer("web", "securite");
await jouer("doigt", "echec");
process.exit(bilan());
