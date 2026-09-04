//  ██ BANC 746 (web) — L'OUVERTURE EN PRÉPARATION (PileFiches) ██
//  Un lien INTERNE d'une fiche (artiste → salon) sur base lente : le clic
//  montre TOUT DE SUITE une fenêtre d'attente, sans entrée d'historique
//  À ELLE ; re-cliquer ne fait rien ; l'arrivée pousse UNE adresse et
//  remplace l'attente ; une préparation refermée (Échap) ou remplacée
//  (autre lien) se tait à l'arrivée.
//  ⚠️ Le filet RetourGaranti (nº 332) empile UNE étape SANS ADRESSE sur
//  un onglet qui n'a rien derrière lui : on ne compte que les entrées
//  qui portent une adresse — celles de la pile.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const ARTISTE = `artiste-746-${T}`, SALON_A = `salon-a-746-${T}`, SALON_B = `salon-b-746-${T}`, SALON_C = `salon-c-746-${T}`, SALON_D = `salon-d-746-${T}`;
//  QUATRE SALONS, UN PAR SCÉNARIO : une fiche déjà venue est en cache (lib/fiche-complete),
//  et sa fenêtre s'ouvre alors sans attente — chaque scénario ouvre donc une fiche neuve.
const LENTEUR = 1800;
const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
await ranger("tatoueurs", [
  { ...gabarit, id: SALON_A, slug: SALON_A, nom: "Salon A 746", type_fiche: "salon", etablissement: "Salon A 746", mode_exercice: "salon", ville_slug: `lyon-${SALON_A}` },
  { ...gabarit, id: SALON_B, slug: SALON_B, nom: "Salon B 746", type_fiche: "salon", etablissement: "Salon B 746", mode_exercice: "salon", ville_slug: `lyon-${SALON_B}` },
  { ...gabarit, id: SALON_C, slug: SALON_C, nom: "Salon C 746", type_fiche: "salon", etablissement: "Salon C 746", mode_exercice: "salon", ville_slug: `lyon-${SALON_C}` },
  { ...gabarit, id: SALON_D, slug: SALON_D, nom: "Salon D 746", type_fiche: "salon", etablissement: "Salon D 746", mode_exercice: "salon", ville_slug: `lyon-${SALON_D}` },
  { ...gabarit, id: ARTISTE, slug: ARTISTE, nom: "Artiste 746", type_fiche: "artiste", mode_exercice: "salon", ville_slug: `lyon-${ARTISTE}` },
]);
await ranger("photos_tatoueur", [0, 1, 2].flatMap((n) => [SALON_A, SALON_B, SALON_C, SALON_D, ARTISTE].map((t) => ({ id: `${t}-p${n}`, tatoueur_id: t, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${n + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${n + 1}.svg`, ordre: n, cree_le: "2026-01-01T00:00:00Z" }))));
const mode = (id, salon, nom) => ({ id, tatoueur_id: ARTISTE, genre: "salon", role: null, nature_lieu: "salon", salon_id: salon, nom_lieu: nom, intitule: nom, adresse: "12 Rue de la République", code_postal: "69002", ville: "Lyon", region: "Auvergne-Rhône-Alpes", pays: "France", code_pays: "FR", latitude: 45.7625, longitude: 4.8352, lieu_id: null, debut_le: null, fin_le: null, statut: null, convention_id: null, rayon_km: null });
await ranger("modes_exercice", [mode(`mode-a-${T}`, SALON_A, "Salon A 746"), mode(`mode-b-${T}`, SALON_B, "Salon B 746"), mode(`mode-c-${T}`, SALON_C, "Salon C 746"), mode(`mode-d-${T}`, SALON_D, "Salon D 746")]);

const { nav, page } = await ouvrir("web");
await page.addInitScript(() => {
  window.__pousses = []; window.__retours = 0;
  const orig = history.pushState.bind(history);
  history.pushState = (etat, t, url) => { if (url) window.__pousses.push(String(url)); return orig(etat, t, url); };
  window.addEventListener("popstate", () => { window.__retours += 1; });
});
await page.route("**/api/tatoueur/*", async (route) => {
  if (route.request().method() !== "GET") return route.continue();
  await new Promise((r) => setTimeout(r, LENTEUR));
  await route.continue();
});
const etat = () => page.evaluate(() => ({
  url: location.pathname, dialogs: document.querySelectorAll("[role=dialog]").length, attente: document.querySelectorAll("[data-attente-fiche]").length,
  titres: document.querySelectorAll("[data-titre-fenetre]").length, drapeau: document.documentElement.getAttribute("data-fenetre-fiche"),
  pousses: window.__pousses.slice(), retours: window.__retours,
}));
const lienA = () => page.locator(`a[href*="${SALON_A}"]`).first();
const lienB = () => page.locator(`a[href*="${SALON_B}"]`).first();
const lienC = () => page.locator(`a[href*="${SALON_C}"]`).first();
const lienD = () => page.locator(`a[href*="${SALON_D}"]`).first();
try {
  await page.goto(`${BASE}/artist/${ARTISTE}`, { waitUntil: "networkidle" });
  verif("la fiche de l'artiste porte ses quatre liens internes (salons)", (await lienA().count()) === 1 && (await lienB().count()) === 1 && (await lienC().count()) === 1 && (await lienD().count()) === 1);

  titre("746 · le clic ouvre l'attente tout de suite, sans adresse poussée");
  await lienA().click();
  await page.waitForTimeout(120);
  const t1 = await etat();
  verif("fenêtre d'attente dans les 120 ms (une fenêtre, l'habillage neutre, pas de titre)", t1.dialogs === 1 && t1.attente === 1 && t1.titres === 0, JSON.stringify({ dialogs: t1.dialogs, attente: t1.attente, titres: t1.titres }));
  verif("aucune adresse poussée, l'adresse est encore celle de l'artiste", t1.pousses.length === 0 && t1.url === `/artist/${ARTISTE}`, `${t1.url} · poussées ${JSON.stringify(t1.pousses)}`);

  titre("746 · re-cliquer le même lien ne fait rien");
  await lienA().click({ force: true }).catch(() => {});
  await page.waitForTimeout(100);
  await lienA().click({ force: true }).catch(() => {});
  await page.waitForTimeout(100);
  const t2 = await etat();
  verif("toujours une seule fenêtre d'attente, toujours rien de poussé", t2.dialogs === 1 && t2.attente === 1 && t2.pousses.length === 0, JSON.stringify({ dialogs: t2.dialogs, attente: t2.attente, pousses: t2.pousses }));

  titre("746 · à l'arrivée : UNE adresse poussée, la fenêtre réelle remplace l'attente");
  await page.waitForFunction(() => document.querySelector("[data-titre-fenetre]") && !document.querySelector("[data-attente-fiche]"), null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const t3 = await etat();
  verif("une seule fenêtre, réelle, l'attente est partie", t3.dialogs === 1 && t3.titres === 1 && t3.attente === 0);
  verif("exactement UNE adresse poussée : celle du salon", t3.pousses.length === 1 && t3.pousses[0].startsWith(`/artist/${SALON_A}`) && t3.url === `/artist/${SALON_A}` && t3.drapeau === "1", `${JSON.stringify(t3.pousses)} · ${t3.url}`);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  const t4 = await etat();
  verif("Échap referme la fenêtre réelle par un retour (popstate), l'artiste revient", t4.dialogs === 0 && t4.url === `/artist/${ARTISTE}` && t4.retours >= 1 && t4.drapeau === null, `${t4.url} · retours ${t4.retours}`);

  titre("746 · une préparation refermée d'un Échap se tait à l'arrivée");
  const avant5 = await etat();
  await lienB().click();
  await page.waitForTimeout(120);
  const t5 = await etat();
  verif("attente montrée, rien de poussé", t5.attente === 1 && t5.pousses.length === avant5.pousses.length);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const t6 = await etat();
  verif("Échap referme l'attente SANS retour d'historique (rien n'avait été poussé)", t6.dialogs === 0 && t6.attente === 0 && t6.retours === avant5.retours && t6.url === `/artist/${ARTISTE}`, `retours ${avant5.retours} → ${t6.retours}`);
  await page.waitForTimeout(LENTEUR + 700);
  const t7 = await etat();
  verif("la réponse tardive n'ouvre rien : ni fenêtre, ni adresse poussée, ni drapeau", t7.dialogs === 0 && t7.pousses.length === avant5.pousses.length && t7.url === `/artist/${ARTISTE}` && t7.drapeau === null, JSON.stringify({ dialogs: t7.dialogs, pousses: t7.pousses.length }));

  titre("746 · un autre lien remplace la préparation ; la première réponse se tait");
  const avant8 = await etat();
  await lienC().click();
  await page.waitForTimeout(250);
  //  LE SECOND LIEN EST SOUS LA FENÊTRE D'ATTENTE : une souris ne l'atteint
  //  pas (le voile la reçoit). C'est la LOGIQUE de la pile qu'on éprouve —
  //  une préparation remplacée par une autre, et la première réponse qui
  //  se tait — donc le clic part de la page elle-même, sur le lien.
  await page.evaluate((s) => document.querySelector(`a[href*="${s}"]`).click(), SALON_D);
  await page.waitForTimeout(120);
  const t8 = await etat();
  verif("une seule fenêtre d'attente, rien de poussé", t8.dialogs === 1 && t8.attente === 1 && t8.pousses.length === avant8.pousses.length);
  await page.waitForFunction(() => document.querySelector("[data-titre-fenetre]") && !document.querySelector("[data-attente-fiche]"), null, { timeout: 15000 });
  await page.waitForTimeout(LENTEUR);
  const t9 = await etat();
  const nouvelles = t9.pousses.slice(avant8.pousses.length);
  verif("seul le SECOND salon (D) s'est ouvert, avec UNE adresse poussée — la réponse de C s'est tue", t9.dialogs === 1 && t9.url === `/artist/${SALON_D}` && nouvelles.length === 1 && nouvelles[0].startsWith(`/artist/${SALON_D}`), `${t9.url} · ${JSON.stringify(nouvelles)}`);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"), null, { timeout: 15000 });
} catch (e) {
  verif("déroulement du banc 746", false, String(e).slice(0, 300));
} finally {
  await nav.close();
}
process.exit(bilan());
