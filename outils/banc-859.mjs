//  ██ BANC 859 — L'AIR QUI DÉFILE, LE MOT COURT, DEUX DÉFILEMENTS ██
//  ==================================================================
//  Les cinq points de la passe :
//   1. L'AIR EST DE RETOUR, ET IL DÉFILE — au repos, quatorze pixels
//      entre la ligne du va-et-vient et le premier contenu ; après un
//      geste, plus rien entre la ligne et ce qui passe dessous. Les deux
//      pages du doigt, et le squelette qui promet le même départ.
//   2. LA POSITION INACTIVE porte son icône ET son mot court.
//   3. LES DEUX DÉFILEMENTS SONT INDÉPENDANTS : chaque nature garde sa
//      place, la bascule ne l'emporte pas.
//   4. LA CARTE DU WEB : la ligne des styles remonte, et le fanion reste
//      intégré sans toucher la photo.
//   5. LE SQUELETTE ne dessine plus de bloc gris à la place du
//      va-et-vient — la place reste réservée, sans dessin.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const AIR_AU_REPOS = 14;
const TATTOO = "Find your tattoo style…", FLASH = "Find your Flash style…";

const SONDE = `() => {
  const r = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), h: +x.height.toFixed(1), l: Math.round(x.width) }; };
  const barre = document.querySelector("[data-barre-fixe]");
  const groupe = document.querySelector("[data-rangee-moteur] [role='radiogroup']");
  const boutons = groupe ? [...groupe.querySelectorAll("[role='radio']")] : [];
  const boite = groupe ? [...groupe.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3) : null;
  const air = document.querySelector("[data-air-sous-barre]");
  const main = document.querySelector("main");
  //  LE PREMIER CONTENU — l'air mis à part : c'est LUI qui doit se
  //  trouver quatorze pixels plus bas que la ligne, au repos.
  const contenu = main ? [...main.children].find((n) =>
    n.getBoundingClientRect().height > 0 && !n.hasAttribute("data-air-sous-barre")) : null;
  return {
    barre: r(barre), ligne: r(boite?.querySelector("span:first-child")),
    air: air ? +air.getBoundingClientRect().height.toFixed(1) : null,
    contenu: r(contenu), y: Math.round(window.scrollY),
    onglets: boutons.map((b) => ({ nom: b.getAttribute("aria-label"),
      actif: b.getAttribute("aria-checked") === "true", texte: b.textContent.trim(),
      dessin: Boolean(b.querySelector("svg")), ...r(b) })),
  };
}`;
const sonder = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE);

const U = { id: "30000000-0000-4000-8000-000000000859", email: "banc-859@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
{
  const photos = (await lire("photos_tatoueur", "select=id,nature")).filter((p) => p.nature === "tatouage").slice(0, 30);
  await ranger("favoris_photos", photos.map((p, i) => ({
    utilisateur_id: U.id, photo_id: p.id, cree_le: `2026-01-01T00:00:${String(59 - i).padStart(2, "0")}Z`,
  })));
}

//  ══ 1 · L'AIR AU REPOS, RIEN AU DÉFILEMENT (LES DEUX PAGES) ══════════
for (const [nom, url, session] of [
  ["l'accueil", `${BASE}/`, null],
  ["« Ma sélection »", `${BASE}/my-favorites`, U],
]) {
  const { nav, page } = await ouvrir("doigt", session ? { session } : {});
  try {
    titre(`859 · §1 — ${nom} : l'air au repos, rien au défilement`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const v = await sonder(page);
    verif("AU REPOS, quatorze pixels entre la ligne et le premier contenu",
      v.ligne && v.contenu && Math.round(v.contenu.y - v.ligne.bas) === AIR_AU_REPOS,
      v.ligne ? `ligne à ${v.ligne.bas} · contenu à ${v.contenu?.y} → ${Math.round((v.contenu?.y ?? 0) - v.ligne.bas)} px` : "ligne absente");
    /*  ET CET AIR EST DU CONTENU, PAS DE LA BARRE : c'est toute la
        correction de la nº 859. On le prouve en le faisant DÉFILER. */
    verif("… et cet air est bien un bloc du contenu (il a la hauteur voulue)",
      v.air === AIR_AU_REPOS, `${v.air} px`);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);
    const d = await sonder(page);
    verif("APRÈS UN GESTE, la page a bougé et la barre s'arrête PILE sur sa ligne",
      d.y > 0 && d.barre?.bas === d.ligne?.bas,
      `page à ${d.y} · barre ${d.barre?.bas} · ligne ${d.ligne?.bas}`);
    verif("… l'air a défilé avec le contenu : il est passé sous la ligne",
      d.contenu !== null && d.contenu.y < v.contenu.y - 100,
      `contenu ${v.contenu?.y} → ${d.contenu?.y}`);
  } catch (e) {
    verif(`déroulement du banc 859 (§1, ${nom})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 ET 3 · LE MOT COURT, ET DEUX DÉFILEMENTS ══════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("859 · §2 — la position inactive porte son mot court");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const v = await sonder(page);
    const [tattoo, flash] = v.onglets;
    verif("l'ACTIVE garde son icône et sa phrase entière",
      tattoo?.actif && tattoo.dessin && tattoo.texte === TATTOO,
      `« ${tattoo?.texte} » · dessin ${tattoo?.dessin} · ${tattoo?.l} px`);
    verif("l'INACTIVE porte son icône ET son mot court — plus l'icône seule",
      flash && !flash.actif && flash.dessin && flash.texte === "Flash" && flash.nom === FLASH,
      `« ${flash?.texte} » (nom « ${flash?.nom} ») · dessin ${flash?.dessin} · ${flash?.l} px`);
    verif("les colonnes sont remesurées : 88 px pour le mot court, le reste à la phrase",
      flash?.l === 88 && tattoo?.l === 270, `inactive ${flash?.l} · active ${tattoo?.l}`);
    verif("… et la phrase n'est pas coupée (elle demande 210 px)",
      tattoo && tattoo.l >= 210, `${tattoo?.l} px`);

    titre("859 · §3 — les défilements Tattoo et Flash sont indépendants");
    /*  ⚠️ LA CIBLE EST BORNÉE PAR LA PAGE : le propriétaire dit 800 px,
        et c'est la bonne demande sur son téléphone ; l'atelier n'a que
        quelques styles, sa page est plus courte. On défile donc AUSSI
        LOIN QUE LA PAGE LE PERMET, et l'on vérifie que CE nombre-là
        revient — la règle est l'indépendance, pas un chiffre. */
    const bas = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const cible = Math.min(800, bas);
    await page.evaluate((c) => window.scrollTo(0, c), cible);
    await page.waitForTimeout(600);
    const surTattoo = await page.evaluate(() => Math.round(window.scrollY));
    verif("on descend dans Tattoo", surTattoo > 100, `${surTattoo} px (page défilable sur ${bas})`);
    const basculer = async (rang) => {
      await page.locator("[data-va-et-vient-nature] [role='radio']").nth(rang).tap();
      await page.waitForTimeout(900);
      return page.evaluate(() => Math.round(window.scrollY));
    };
    const arriveeFlash = await basculer(1);
    verif("basculer vers Flash N'EMPORTE PAS la position de Tattoo : on arrive en haut",
      arriveeFlash === 0, `${arriveeFlash} px`);
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);
    const retourTattoo = await basculer(0);
    verif("revenir à Tattoo rend SA position, pas celle de Flash",
      retourTattoo === surTattoo, `${retourTattoo} px (laissé à ${surTattoo})`);
    const retourFlash = await basculer(1);
    verif("et revenir à Flash rend la sienne",
      retourFlash === 300, `${retourFlash} px (laissé à 300)`);
  } catch (e) {
    verif("déroulement du banc 859 (§2-§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LA CARTE DU WEB ══════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("859 · §4 — la ligne des styles remonte, le fanion reste intégré");
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const v = await page.evaluate(() => {
      const c = document.querySelector("[data-carte]");
      const b = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
        return { y: Math.round(x.top), bas: Math.round(x.bottom), h: Math.round(x.height), droite: Math.round(x.right) }; };
      const photo = c.querySelector("img")?.closest("div");
      const styles = c.querySelector("p");
      const coeur = [...c.querySelectorAll("button")].find((n) =>
        (n.getAttribute("aria-label") ?? "").toLowerCase().includes("photo")
        && n.getBoundingClientRect().height === 40);
      return { photo: b(photo), styles: b(styles), coeur: b(coeur), carte: b(c), texte: styles?.textContent.trim() };
    });
    verif("le fanion EST là, sur la ligne des styles (nº 856, enfin mesurable)",
      v.coeur !== null && v.coeur.h === 40, v.coeur ? `${v.coeur.h} px` : "absent");
    /*  LE PLANCHER EST GÉOMÉTRIQUE : le fanion fait quarante, le texte
        est centré dedans — le texte ne peut pas remonter plus haut que
        onze pixels sous la photo. On en garde quinze : quatre d'écart
        entre la photo et le fanion. */
    verif("l'air AU-DESSUS de la ligne est de quinze pixels (dix-neuf à la nº 856)",
      v.styles.y - v.photo.bas === 15, `${v.styles.y - v.photo.bas} px`);
    verif("le fanion NE TOUCHE PAS la photo : quatre pixels l'en séparent",
      v.coeur && v.coeur.y - v.photo.bas === 4, v.coeur ? `${v.coeur.y - v.photo.bas} px` : "absent");
    verif("… et il est centré sur la ligne des styles",
      v.coeur && Math.abs((v.coeur.y + v.coeur.bas) / 2 - (v.styles.y + v.styles.bas) / 2) <= 1,
      v.coeur ? `fanion ${(v.coeur.y + v.coeur.bas) / 2} · texte ${(v.styles.y + v.styles.bas) / 2}` : "absent");
    verif("le texte ne passe pas sous le fanion",
      v.styles.droite <= v.coeur.y ? true : v.styles.droite <= v.carte.droite,
      `texte jusqu'à ${v.styles.droite} · carte ${v.carte.droite}`);
  } catch (e) {
    verif("déroulement du banc 859 (§4)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · LE SQUELETTE NE DESSINE PLUS RIEN À CETTE PLACE ══════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("859 · §5 — le squelette ne peint plus le va-et-vient");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    let gris = null;
    await page.locator('a[href*="my-favorites"]').first().click({ force: true });
    for (let i = 0; i < 600 && !gris; i += 1) {
      gris = await page.evaluate(() => {
        if (document.documentElement.dataset.appareil !== "mobile") return null;
        if (!document.querySelector('[aria-busy="true"]')) return null;
        if (document.querySelector("[data-carte]")) return null;
        const reserve = document.querySelector("[data-reserve-squelette]");
        if (!reserve) return null;
        //  LE CENTRE DE LA BARRE GRISE : la boîte de 46 px qui remplace
        //  le va-et-vient. On lit SA PLACE et SON FOND.
        const centre = [...document.querySelectorAll("header div")]
          .find((n) => Math.round(n.getBoundingClientRect().height) === 46
            && Math.round(n.getBoundingClientRect().width) > 300);
        return {
          reserve: Number(reserve.dataset.reservePosee),
          centre: centre ? { h: Math.round(centre.getBoundingClientRect().height),
            fond: getComputedStyle(centre).backgroundColor } : null,
        };
      }).catch(() => null);
      if (!gris) await page.waitForTimeout(3);
    }
    verif("le squelette a bien été attrapé", gris !== null, gris ? JSON.stringify(gris) : "jamais vu");
    verif("LA PLACE EST RÉSERVÉE : la boîte du va-et-vient fait toujours 46 px",
      gris?.centre?.h === 46, `${gris?.centre?.h}`);
    verif("… mais RIEN N'Y EST DESSINÉ : aucun fond",
      gris?.centre?.fond === "rgba(0, 0, 0, 0)", `${gris?.centre?.fond}`);
    verif("et la réserve promet toujours la hauteur de la barre (116)",
      gris?.reserve === 116, `${gris?.reserve}`);
  } catch (e) {
    verif("déroulement du banc 859 (§5)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
