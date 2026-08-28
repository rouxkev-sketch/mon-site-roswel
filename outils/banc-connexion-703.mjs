//  ██ nº 703 · §2 — LE POINT SENSIBLE DE LA GARDE ██
//  La garde du §2 dit : « pas de cookie de session, pas de
//  bibliothèque ». LE RISQUE qu'elle introduit est exactement celui-ci :
//  quelqu'un qui arrive DÉCONNECTÉ (donc sans écoute) se connecte —
//  l'en-tête apprend-il qu'il est connecté ?
//  ON NE LE DÉDUIT PAS, ON SE CONNECTE POUR DE VRAI (la doublure sait
//  ouvrir une session depuis la nº 703-§2).
let chromium;
try {
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "\n\u2716  Ce banc a besoin de \u00ab playwright-core \u00bb.\n" +
    "   npm i --no-save playwright-core\n" +
    "   ou BANC_PLAYWRIGHT=/chemin/vers/playwright-core node outils/banc-connexion-703.mjs\n"
  );
  process.exit(1);
}
const NAVIGATEUR = process.env.BANC_NAVIGATEUR ?? "/opt/pw-browsers/chromium";

const BASE = "http://127.0.0.1:3000";
const nav = await chromium.launch({ executablePath: NAVIGATEUR });

const APPAREILS = [
  { nom: "DOIGT", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "WEB", viewport: { width: 1280, height: 900 } },
];

for (const { nom: appareil, ...options } of APPAREILS) {
  const ctx = await nav.newContext(options);   //  AUCUN cookie : déconnecté
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 160)));

  console.log(`\n══ ${appareil} ══`);
  await page.goto(BASE + "/devenir-tatoueur", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);

  const avant = await page.locator('header button[aria-label^="Mon espace"]')
    .count().catch(() => 0);
  console.log(`  avant : bouton de compte dans l'en-tête = ${avant}`);

  /*  On passe en mode « Me connecter » si l'écran s'ouvre sur
      « Créer un compte » — le libellé du bouton le dit. */
  const bascule = page.locator('button:has-text("Me connecter"), button:has-text("J\'ai déjà un compte")').first();
  if (await bascule.count()) await bascule.click().catch(() => {});
  await page.waitForTimeout(600);

  const courriel = page.locator('input[type="email"]:visible').first();
  const motDePasse = page.locator('input[type="password"]:visible').first();
  if (!(await courriel.count()) || !(await motDePasse.count())) {
    console.log("  ❌ le formulaire de connexion est introuvable — mesure impossible");
    await ctx.close();
    continue;
  }
  await courriel.fill("kevin@yokofolio.test");
  await motDePasse.fill("motdepasse-de-banc");

  const envoyer = page.locator('button[type="submit"]:visible').first();
  const t = Date.now();
  await envoyer.click().catch((e) => console.log("  clic KO", String(e).slice(0, 80)));

  /*  CE QU'ON ATTEND : l'en-tête porte le compte. On laisse au site le
      temps de naviguer ET de rattraper — six secondes, largement
      au-delà d'un aller-retour local. */
  let vu = false, millis = -1;
  try {
    await page.locator('header button[aria-label^="Mon espace"]')
      .first().waitFor({ state: "attached", timeout: 8000 });
    vu = true;
    millis = Date.now() - t;
  } catch { millis = Date.now() - t; }

  const etiquette = vu
    ? await page.locator('header button[aria-label^="Mon espace"]').first()
        .getAttribute("aria-label").catch(() => null)
    : null;

  console.log(`  après : compte affiché ${vu ? "✅" : "❌"} en ${millis} ms` +
    ` · « ${etiquette ?? "—"} »`);
  console.log(`  adresse d'arrivée : ${page.url()}`);
  console.log(`  erreurs page : ${erreurs.length ? erreurs.join(" | ") : "aucune"}`);
  await ctx.close();
}
await nav.close();
