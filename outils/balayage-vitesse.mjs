//  ██ LE BALAYAGE DE VITESSE DU SITE — outils/balayage-vitesse.mjs ██
//  ==================================================================
//  NÉ À LA PASSE Nº 681, ET FAIT POUR RESSERVIR. Il mesure TOUT le
//  produit YokoFolio — les seize pages et les six surfaces qui
//  s'ouvrent — sur les DEUX appareils, et rend un classement.
//
//  CE QU'IL NE FAIT PAS : poser un chronomètre dans le site. Il LIT ce
//  que le navigateur mesure déjà (la méthode de la sonde nº 679) :
//  `PerformanceNavigationTiming` pour le découpage d'un document,
//  `PerformanceResourceTiming` pour chaque requête. Aucune ligne du
//  site n'est touchée par ce fichier.
//
//  ⚠️ IL NE TOURNE PAS DEPUIS LE DÉPÔT TEL QUEL, et ce n'est pas un
//  oubli : `playwright-core` n'est PAS une dépendance du projet (le
//  site n'en a aucun besoin, et l'y ajouter alourdirait chaque
//  installation pour un outil de mesure). Il faut le lancer depuis le
//  dossier de banc, celui qui porte `playwright-core` et la session
//  forgée `session-forgee.mjs` — la même convention que les bancs des
//  passes nº 673 et 678. Ce fichier est ici pour que LE PARCOURS
//  survive : la liste de ce qui se mesure, et comment on le repère.
//
//  COMMENT ON LE LANCE, ET LES DEUX CRANS SONT OBLIGATOIRES :
//
//      SLUGS_UNIQUES=1 DELAI_BASE=120 npm run banc:doublure
//      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run build
//      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run start
//      node outils/balayage-vitesse.mjs
//
//   · `DELAI_BASE=120` rétablit une latence de base réaliste : sans
//     elle la doublure répond en une milliseconde et TOUT paraît
//     rapide, ce qui ne mesure rien ;
//   · `SLUGS_UNIQUES=1` donne un slug par fiche et par ville. Sans ce
//     cran, `/tatoueur/<slug>` et `/tatouage/<style>/<ville>` rendent
//     404 : les gabarits partagent leurs slugs, et une lecture unique
//     (`maybeSingle`) reçoit quatorze réponses. Les DEUX pages les plus
//     vues du produit étaient donc les seules qu'on ne pouvait pas
//     mesurer.
//
//  LES SEUILS, et ils valent AU BANC, à 120 ms de latence simulée —
//  pas en production, où la latence réelle et la vraie base changent
//  les chiffres sans changer les rangs :
//      VERT   < 500 ms   ·   ORANGE 500 à 1000   ·   ROUGE > 1000
//
//  ⚠️ DEUX PIÈGES DE BANC, PAYÉS À LA nº 681, ÉCRITS ICI POUR QU'ILS NE
//  SE REPAIENT PAS :
//   1) LES DEUX HABILLAGES SONT MONTÉS EN MÊME TEMPS dans le document.
//      Tout sélecteur d'arrivée doit porter `:visible`, sinon
//      `.first()` tombe sur celui qui est caché et le banc conclut
//      « jamais affichée » sur une surface bien présente.
//   2) « MON ESPACE » N'EST UN DIALOGUE QU'AU WEB : sa fenêtre porte
//      `mobile:hidden`, et au doigt c'est une PAGE PLEIN ÉCRAN. Les
//      repères d'arrivée sont donc TEXTUELS (« Déconnexion »), jamais
//      `[role="dialog"]`. Même chose pour les filtres, qui se déplient
//      dans la barre : leur repère est `aria-expanded="true"`.
import { chromium } from "playwright-core";
import { cookieDeSession, UTILISATEUR } from "./session-forgee.mjs";
const BASE = "http://127.0.0.1:3000";
const SILENCE_MS = 500, ATTENTE_MAX_MS = 12000;
function cookieAvec(m) {
  const b = cookieDeSession(BASE);
  const j = JSON.parse(Buffer.from(b.value.slice(7).replace(/-/g,"+").replace(/_/g,"/"),"base64").toString());
  j.user = { ...UTILISATEUR, user_metadata: m };
  return { ...b, name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify(j)).toString("base64").replace(/\+/g,"-").replace(/\//g,"_") };
}
const FICHE = { id: "demo-0-0", nom: "Atelier trash-polka", slug: "demo-trash-polka-0",
  publie: true, statut: "validee", brouillon: null, hors_ligne: false,
  supprime_le: null, purge_le: null, cree_le: "2026-01-01T00:00:00Z", photo_profil: null };
const ARMER = `
  window.__req = []; window.__dernier = 0;
  try {
    const o = new PerformanceObserver((l) => { for (const e of l.getEntries()) {
      window.__req.push({ nom: e.name, debut: e.startTime, duree: e.duration });
      const f = e.startTime + e.duration; if (f > window.__dernier) window.__dernier = f; } });
    o.observe({ type: "resource", buffered: true });
  } catch (e) {}`;
async function silenceApres(page, depuis) {
  const butoir = Date.now() + ATTENTE_MAX_MS;
  for (;;) {
    const [m, d] = await page.evaluate("[performance.now(), window.__dernier||0]").catch(() => [0,0]);
    if (m - Math.max(d, depuis) >= SILENCE_MS || Date.now() > butoir) return Math.max(d, depuis);
    await page.waitForTimeout(100);
  }
}
async function depouiller(page, debut, fin) {
  return page.evaluate(`(() => {
    const debut=${debut}, fin=${fin};
    const dans=(window.__req||[]).filter(r=>r.duree>0&&r.debut>=debut-50&&r.debut<=fin+50);
    const base=dans.filter(r=>r.nom.includes("/rest/v1/"));
    const borne=l=>{if(!l.length)return 0;
      const d=Math.min(...l.map(r=>Math.max(r.debut,debut)));
      const f=Math.max(...l.map(r=>Math.min(r.debut+r.duree,fin)));return Math.max(0,Math.round(f-d));};
    const cumul=Math.round(base.reduce((t,r)=>t+r.duree,0)), etendue=borne(base);
    let verdict=null;
    if(base.length>=2&&etendue>0){const q=cumul/etendue;
      verdict=q>=1.15?"parallèle":q>=0.85?"SÉRIE":"espacées";}
    const lentes=[...dans].sort((a,b)=>b.duree-a.duree).slice(0,3).map(r=>{let n=r.nom;
      try{const u=new URL(r.nom);
        n=u.pathname.includes("/rest/v1/")?"base·"+u.pathname.split("/rest/v1/")[1].slice(0,22)
          :u.pathname.includes("/_next/static/")?"programme"
          :u.pathname.startsWith("/api/")?"api·"+u.pathname.slice(5,30):u.pathname.slice(-26);}catch(e){}
      return n+" "+Math.round(r.duree);});
    return { nombre: base.length, cumul, etendue, verdict, lentes };
  })()`).catch(()=>({nombre:0,cumul:0,etendue:0,verdict:null,lentes:[]}));
}

/** La décomposition du DOCUMENT, telle que le navigateur l'a découpée.
    Elle explique le PREMIER ÉCRAN et s'y additionne exactement — pas le
    total, qui va jusqu'au silence du réseau (leçon de la nº 679). */
async function decoupageDuDocument(page) {
  return page.evaluate(`(() => {
    const [n] = performance.getEntriesByType("navigation");
    if (!n) return null;
    const p = performance.getEntriesByType("paint")
      .find((x) => x.name === "first-contentful-paint");
    const premier = Math.round(p ? p.startTime : n.domContentLoadedEventEnd);
    return {
      premierEcran: premier,
      reseau: Math.round(n.requestStart - n.startTime),
      serveur: Math.round(n.responseStart - n.requestStart),
      rendu: Math.round(premier - n.responseStart),
    };
  })()`).catch(() => null);
}

// ═════════════════ LES SEIZE PAGES DU PARCOURS ══════════════════
//  Le produit ARTISANS et l'AGENCE n'y sont pas : ce sont d'autres
//  produits, et ils ne se touchent jamais.
const PAGES = [
  { nom: "Accueil",                chemin: "/",                                         session: false },
  { nom: "Recherche",              chemin: "/recherche?style=realisme&nature=tatouage", session: false },
  { nom: "Fiche publique",         chemin: "/tatoueur/demo-realisme-0",                 session: false },
  { nom: "Portfolio complet",      chemin: "/tatoueur/demo-realisme-0/complet",         session: false },
  { nom: "Style + ville",          chemin: "/tatouage/realisme/lyon-1-0",                   session: false },
  { nom: "Devenir tatoueur",       chemin: "/devenir-tatoueur",                         session: false },
  { nom: "Contact",                chemin: "/contact",                                  session: false },
  { nom: "Qui sommes-nous",        chemin: "/qui-sommes-nous",                          session: false },
  { nom: "Mentions légales",       chemin: "/mentions-legales",                         session: false },
  { nom: "Nouveau mot de passe",   chemin: "/devenir-tatoueur/nouveau-mot-de-passe",    session: false },
  { nom: "Éditeur de portfolio",   chemin: "/devenir-tatoueur/fiche?fiche=demo-0-0",    session: true },
  { nom: "Éditeur — création",     chemin: "/devenir-tatoueur/fiche?fiche=nouvelle",    session: true },
  { nom: "Sécurité",               chemin: "/devenir-tatoueur/securite",                session: true },
  { nom: "Ma sélection",           chemin: "/mes-favoris",                              session: true },
  { nom: "Après connexion",        chemin: "/apres-connexion",                          session: true },
  { nom: "Administration",         chemin: "/admin",                                    session: true },
];

/*  ⚠️ CE SÉLECTEUR EST ASSEMBLÉ, ET CE N'EST PAS UNE COQUETTERIE.
    Tailwind scanne `outils/` comme le reste du dépôt : écrit d'un seul
    tenant, `[role="dialog"]` suivi de `:visible` ressemble à une classe
    à variante arbitraire, et Tailwind LUI FABRIQUE UNE RÈGLE. Mesuré :
    la feuille du site a grossi de 36 octets à cause d'un sélecteur de
    banc qui n'a rien à y faire. L'assembler en deux morceaux suffit à
    le rendre invisible au scanner. (La feuille en porte déjà trois de
    la même espèce, venus de `src/` — un ménage pour une autre passe.) */
const DIALOGUE_VISIBLE = '[role="dialog"]' + ":visible";

const FENETRES = [
  { nom: "Mon compte", depart: "/contact", session: true,
    ouvrir: 'header button[aria-label^="Mon espace"]:visible',
    pret: 'button:has-text("Déconnexion"):visible' },
  { nom: "Notifications", depart: "/contact", session: true,
    avant: 'header button[aria-label^="Mon espace"]:visible',
    ouvrir: 'button:has-text("Notifications"):visible',
    pret: '[aria-label="Mes notifications"]:visible' },
  { nom: "Langue", depart: "/contact", session: true,
    avant: 'header button[aria-label^="Mon espace"]:visible',
    ouvrir: 'button:has-text("Langue"):visible',
    pret: 'button:has-text("Français"):visible' },
  /*  LE PANNEAU DES FILTRES N'EST PAS UN DIALOGUE : il se déplie dans
      la barre, et le bouton porte `aria-expanded`. C'est LUI le repère
      — chercher un `[role="dialog"]` ne pouvait rien donner. */
  { nom: "Filtres (web)", depart: "/recherche?style=realisme&nature=tatouage", session: false,
    ouvrir: 'button[aria-label="Filtres"]:visible',
    pret: 'button[aria-label="Filtres"][aria-expanded="true"]:visible' },
  { nom: "Recherche (doigt)", depart: "/recherche?style=realisme&nature=tatouage", session: false,
    ouvrir: 'button[aria-label^="Rechercher"]:visible',
    pret: '[aria-label="Rechercher un tatoueur"]:visible' },
  { nom: "Suppression du compte", depart: "/devenir-tatoueur/securite", session: true,
    ouvrir: 'button:has-text("Supprimer"):visible', pret: DIALOGUE_VISIBLE },
];
const APPAREILS = [
  { nom: "DOIGT", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "WEB", viewport: { width: 1280, height: 900 } },
];
const nav = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const releve = [];
for (const { nom: appareil, ...opt } of APPAREILS) {
  // ══ LES PAGES ══
  for (const p of PAGES) {
    const ctx = await nav.newContext(opt);
    if (p.session) {
      await ctx.addCookies([cookieAvec({ nom: "Kevin", nom_affiche: "Kevin" })]);
      //  Le compte possède UNE fiche : sans cela l'éditeur n'a rien à
      //  ouvrir (les gabarits de la doublure n'appartiennent à personne).
      await ctx.route("**/rest/v1/tatoueurs?select=id%2C%20nom*", (r) =>
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([FICHE]) }));
    }
    const page = await ctx.newPage();
    await page.addInitScript(ARMER);
    let statut = 0;
    try {
      const r = await page.goto(BASE + p.chemin, { waitUntil: "domcontentloaded", timeout: 30000 });
      statut = r?.status() ?? 0;
    } catch { statut = -1; }
    if (statut !== 200) {
      releve.push({ genre: "page", appareil, nom: p.nom, injoignable: `HTTP ${statut}` });
      await ctx.close(); continue;
    }
    const silence = await silenceApres(page, 0);
    releve.push({ genre: "page", appareil, nom: p.nom, total: Math.round(silence),
      ...(await decoupageDuDocument(page) ?? {}), ...(await depouiller(page, 0, silence)) });
    await ctx.close();
  }

  // ══ LES SURFACES QUI S'OUVRENT ══
  for (const f of FENETRES) {
    const ctx = await nav.newContext(opt);
    if (f.session) {
      await ctx.addCookies([cookieAvec({ nom: "Kevin", nom_affiche: "Kevin" })]);
      await ctx.route("**/rest/v1/tatoueurs?select=id%2C%20nom*", (r) =>
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([FICHE]) }));
    }
    const page = await ctx.newPage();
    await page.addInitScript(ARMER);
    try { await page.goto(BASE + f.depart, { waitUntil: "domcontentloaded", timeout: 30000 }); }
    catch { releve.push({ genre: "fenêtre", appareil, nom: f.nom, injoignable: "page de départ" }); await ctx.close(); continue; }
    await silenceApres(page, 0);
    if (f.avant) {
      const a = page.locator(f.avant).first();
      if (!(await a.count())) { releve.push({ genre: "fenêtre", appareil, nom: f.nom, injoignable: "déclencheur amont" }); await ctx.close(); continue; }
      await a.click().catch(()=>{}); await page.waitForTimeout(1400);
    }
    const b = page.locator(f.ouvrir).first();
    if (!(await b.count())) { releve.push({ genre: "fenêtre", appareil, nom: f.nom, injoignable: "déclencheur absent" }); await ctx.close(); continue; }
    const t0 = await page.evaluate("performance.now()");
    await b.click({ noWaitAfter: true }).catch(()=>{});
    let affichage = null;
    for (let i = 0; i < 200; i += 1) {
      if (await page.locator(f.pret).first().isVisible().catch(()=>false)) {
        affichage = Math.round((await page.evaluate("performance.now()")) - t0); break; }
      await page.waitForTimeout(15);
    }
    if (affichage === null) { releve.push({ genre: "fenêtre", appareil, nom: f.nom, injoignable: "jamais affichée" }); await ctx.close(); continue; }
    const s = await silenceApres(page, t0);
    releve.push({ genre: "fenêtre", appareil, nom: f.nom, premierEcran: affichage,
      total: Math.round(s - t0), ...(await depouiller(page, t0, s)) });
    await ctx.close();
  }
}
await nav.close();
const COULEUR = (t) => (t < 500 ? "V" : t <= 1000 ? "O" : "R");
for (const genre of ["page", "fenêtre"]) {
  for (const app of ["DOIGT", "WEB"]) {
    console.log(`\n${"=".repeat(100)}\n${genre.toUpperCase()}S — ${app}\n${"=".repeat(100)}`);
    console.log(`  ${"nom".padEnd(26)} ${"total".padStart(6)} ${"1er écr".padStart(8)} ` +
      `${"srv".padStart(5)} ${"base".padStart(5)} ${"verdict".padStart(10)}  la plus lente`);
    const lignes = releve.filter((r) => r.genre === genre && r.appareil === app);
    for (const r of lignes.sort((a, b) => (b.total || 0) - (a.total || 0))) {
      if (r.injoignable) {
        console.log(`  ${r.nom.padEnd(26)} ${"—".padStart(6)}  injoignable : ${r.injoignable}`);
        continue;
      }
      console.log(`${COULEUR(r.total)} ${r.nom.padEnd(26)} ${String(r.total).padStart(6)} ` +
        `${String(r.premierEcran ?? "—").padStart(8)} ${String(r.serveur ?? "—").padStart(5)} ` +
        `${String(r.nombre).padStart(5)} ${String(r.verdict || "—").padStart(10)}  ` +
        `${((r.lentes || [])[0] || "aucune requête").slice(0, 38)}`);
    }
  }
}
