//  ██ BANC 884 — LE BANDEAU DE DIAGNOSTIC ██
//   1. INERTE POUR TOUT LE MONDE : rien sans `?diag=1`, rien sans
//      l'administration — aux deux appareils.
//   2. COMPLET QUAND IL EST ARMÉ : les mesures demandées par le
//      propriétaire, la réponse à sa question (qui reçoit le toucher
//      au centre de la loupe), le journal qui se remplit, le bouton
//      « Copier » qui copie vraiment.
//   3. IL N'AGIT SUR RIEN : armé, une arrivée reste à zéro, et le
//      bandeau ne couvre jamais la barre fixe.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc884-${T}`;
const ADMIN = { id: "32000000-0000-4000-8000-000000000884", email: "rouxkev@gmail.com" };
const QUIDAM = { id: "32000000-0000-4000-8000-000000000885", email: `banc884-${T}@exemple.test` };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 884",
    styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (let i = 1; i <= 8; i += 1) {
    photos.push({ id: `5684000${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: SLUG, style: "blackwork", rendu: "black", nature: "tatouage",
      url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}
const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const attendre = (page, ms) => page.waitForTimeout(ms);
const bandeau = (page) => page.evaluate(() => {
  const b = document.querySelector("[data-diagnostic]");
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { texte: b.textContent ?? "", haut: Math.round(r.top), bas: Math.round(r.bottom),
    hauteurVue: window.innerHeight };
});

//  ══ 1 · INERTE SANS LES DEUX CLÉS ══════════════════════════════════
for (const [nom, session, adresse] of [
  ["sans rien", null, RECHERCHE],
  ["avec ?diag=1 mais sans compte", null, `${RECHERCHE}&diag=1`],
  ["avec ?diag=1 et un compte ordinaire", QUIDAM, `${RECHERCHE}&diag=1`],
  ["administration mais sans ?diag=1", ADMIN, RECHERCHE],
]) {
  const { nav, page } = await ouvrir("doigt", session ? { session } : {});
  try {
    titre(`884 · 1 — le bandeau ne paraît pas : ${nom}`);
    await page.goto(`${BASE}${adresse}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    verif(`${nom} : aucun bandeau`, (await bandeau(page)) === null,
      JSON.stringify(await bandeau(page))?.slice(0, 120));
  } catch (e) {
    verif(`déroulement du banc 884 (1 · ${nom})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · ARMÉ : LES MESURES, LA QUESTION, LE JOURNAL, LA COPIE ══════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode, { session: ADMIN });
  try {
    titre(`884 · 2 — ${mode} : le bandeau relève tout ce qui est demandé`);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE })
      .catch(() => {});
    await page.goto(`${BASE}${RECHERCHE}&diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await attendre(page, 1200);
    const vu = await bandeau(page);
    verif("le bandeau est là", vu !== null);
    for (const attendu of [
      "défilement", "scrollY", "scrollingElement",
      "viewport visuel", "offsetTop", "pageTop",
      "fenêtre", "innerHeight",
      "barre fixe", "loupe", "qui reçoit en", "html", "page", "journal",
    ]) {
      verif(`… il porte « ${attendu} »`, (vu?.texte ?? "").includes(attendu));
    }
    if (mode === "doigt") {
      verif("… et il répond à LA question (l'élément touché est nommé)",
        /qui reçoit en \d+,\d+/.test(vu?.texte ?? "") &&
        /(C'EST LA LOUPE|UN ANCÊTRE|CE N'EST PAS LA LOUPE|RIEN NE REÇOIT)/.test(vu?.texte ?? ""),
        (vu?.texte ?? "").slice((vu?.texte ?? "").indexOf("qui reçoit"), (vu?.texte ?? "").indexOf("qui reçoit") + 110));
      /*  ⚠️ EN CHROMIUM, LA RÉPONSE SAINE EST « C'EST LA LOUPE » : c'est
          l'étalon auquel le propriétaire comparera son relevé d'iPhone. */
      verif("… et ici, en Chromium, c'est bien la loupe qui reçoit",
        (vu?.texte ?? "").includes("C'EST LA LOUPE"));
    } else {
      //  AU WEB, LA LOUPE N'EXISTE PAS (c'est un champ) : le bandeau le
      //  DIT, au lieu de mesurer un rectangle vide.
      verif("… au web, il dit que la loupe n'est pas peinte",
        (vu?.texte ?? "").includes("loupe non peinte"),
        (vu?.texte ?? "").slice((vu?.texte ?? "").indexOf("qui reçoit"), (vu?.texte ?? "").indexOf("qui reçoit") + 80));
    }

    titre(`884 · 2 — ${mode} : le bandeau est EN BAS et ne couvre pas la barre`);
    const places = await page.evaluate(() => {
      const b = document.querySelector("[data-diagnostic]").getBoundingClientRect();
      const barre = document.querySelector("[data-barre-fixe]")?.getBoundingClientRect();
      return { hautDuBandeau: Math.round(b.top), basDeLaBarre: Math.round(barre?.bottom ?? 0),
        basDuBandeau: Math.round(b.bottom), vue: window.innerHeight };
    });
    verif("le bandeau commence sous la barre fixe",
      places.hautDuBandeau > places.basDeLaBarre,
      `bandeau à ${places.hautDuBandeau}, barre finit à ${places.basDeLaBarre}`);
    verif("… et il colle au bas de l'écran",
      Math.abs(places.basDuBandeau - places.vue) <= 2,
      `${places.basDuBandeau} / ${places.vue}`);

    titre(`884 · 2 — ${mode} : le journal se remplit, et le bandeau n'agit sur rien`);
    /*  UNE NAVIGATION DOUCE VERS UNE VRAIE PAGE : elle doit s'écrire, et
        arriver à zéro.
        ⚠️ AU WEB, ON PASSE PAR LE LOGO : un clic sur une carte y ouvre
        la FENÊTRE SUPERPOSÉE (nº 506), où `DefilementEnHaut` s'efface
        volontairement (la grille doit rester où elle est) — il n'y a
        donc ni arrivée, ni pose, ni garde à écrire, et c'est juste. */
    const versUnePage = mode === "doigt"
      ? `[data-lien-profil-de-fil][href*="${SLUG}"]`
      : '[aria-label$="home"]';
    const attendue = mode === "doigt" ? "/artist/" : "/";
    await page.evaluate((s) => {
      const lien = document.querySelector(s);
      if (lien) lien.click();
    }, versUnePage);
    await page.waitForFunction(
      (a) => (a === "/" ? location.pathname === "/" : location.pathname.startsWith(a)),
      attendue, { timeout: 20000 }
    );
    await attendre(page, 1500);
    const apres = await bandeau(page);
    verif("le bandeau SURVIT à la navigation (l'armement vit avec l'onglet)",
      apres !== null);
    verif("l'arrivée s'écrit au journal", (apres?.texte ?? "").includes("ARRIVÉE"),
      (apres?.texte ?? "").slice(-160));
    verif("… la pose de zéro aussi", (apres?.texte ?? "").includes("POSE ZÉRO"));
    verif("… et la garde armée", (apres?.texte ?? "").includes("GARDE ARMÉE"));
    verif("… l'arrivée est bien à zéro, bandeau ou pas",
      (await page.evaluate(() => Math.round(window.scrollY))) === 0);

    //  UN TOUCHER : il doit s'écrire, avec sa cible.
    await page.evaluate(() => {
      const cible = document.querySelector('[aria-label="Search"]') ?? document.body;
      const r = cible.getBoundingClientRect();
      const t = new Touch({ identifier: 3, target: cible, clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2, pageX: r.left, pageY: r.top });
      cible.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true,
        touches: [t], targetTouches: [t], changedTouches: [t] }));
    });
    await attendre(page, 400);
    verif("un toucher reçu s'écrit, avec sa cible",
      ((await bandeau(page))?.texte ?? "").includes("TOUCHER REÇU"),
      ((await bandeau(page))?.texte ?? "").slice(-140));

    titre(`884 · 2 — ${mode} : le bouton « Copier » copie vraiment`);
    await page.evaluate(() => {
      const bouton = [...document.querySelectorAll("[data-diagnostic] button")]
        .find((b) => b.textContent.trim() === "Copier");
      if (bouton) bouton.click();
    });
    await attendre(page, 600);
    const temoin = (await bandeau(page))?.texte ?? "";
    verif("le bandeau annonce la copie", /copié|sélectionné/.test(temoin),
      temoin.slice(0, 60));
    /*  ET LE CONTENU, QUAND LE NAVIGATEUR DU BANC LAISSE LIRE LE
        PRESSE-PAPIERS (il le refuse parfois sans écran) : c'est un
        renfort, pas la mesure — le témoin ci-dessus fait foi. */
    const presse = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    if (presse) {
      verif("… et le presse-papiers porte le relevé entier",
        presse.includes("DIAGNOSTIC nº 884") && presse.includes("qui reçoit") &&
        presse.includes("JOURNAL"),
        presse.slice(0, 90).replace(/\n/g, " | "));
    }
  } catch (e) {
    verif(`déroulement du banc 884 (2 · ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
