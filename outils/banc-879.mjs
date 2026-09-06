//  ██ BANC 879 — LE CLAVIER RÉSIDUEL ET L'AIR DU FIL ██
//   §1 — LES FLÈCHES, AUX DEUX ENDROITS OÙ LE FIL VIT : la page de
//        profil ET la fenêtre superposée (celle-ci monte DEUX
//        `ClavierCartes` et son propre écouteur — c'est là que la
//        touche passait encore). Carte survolée : elle seule bouge, et
//        d'UN pas. Hors carte : la grande photo, et d'un pas aussi.
//   §2/§3 — L'AIR AU-DESSUS DE LA PREMIÈRE CARTE vaut celui qui sépare
//        deux cartes, aux deux appareils, et il ne saute pas.
//  L'ATELIER attendu est celui de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc879-${T}`;
const PHOTO = (k, i) => `4c79${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 879",
    styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, n] of [[0, "blackwork", 6], [1, "realisme", 4]]) {
    for (let i = 1; i <= n; i += 1) {
      photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature: "tatouage",
        url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        ordre: i, cree_le: "2026-01-01T00:00:00Z" });
    }
  }
  await ranger("photos_tatoueur", photos);
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const proche = (a, b, marge = 0.5) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

/*  ⚠️ L'AFFICHE N'EST PAS LE PREMIER `[data-carrousel]` DE LA PAGE :
    dans la fenêtre superposée, les carrousels des CARTES le précèdent
    dans le document (ils portent `data-carrousel="carte"`). Les sondes
    879b et 879c ont lu le mauvais nœud avant qu'on s'en aperçoive — le
    banc, lui, nomme l'affiche sans ambiguïté. */
const AFFICHE = '[data-carrousel]:not([data-carrousel="carte"])';
const ETAT = `() => {
  const affiche = document.querySelector('[data-carrousel]:not([data-carrousel="carte"])');
  const cadre = affiche ? affiche.querySelector('[data-role="cadre"]') : null;
  return {
    cartes: [...document.querySelectorAll("[data-carte-de-galerie] [data-compteur-galerie]")].map((n) => n.textContent.trim()),
    compteur: affiche ? (affiche.querySelector('[data-role="compteur"]')?.textContent?.trim() ?? null) : null,
    defil: Math.round(cadre ? cadre.scrollLeft : -1),
  };
}`;
const etat = (page) => page.evaluate((E) => new Function("return " + E)()(), ETAT);

//  ══ 1 · LES FLÈCHES, SUR LA PAGE ET DANS LA FENÊTRE ════════════════
for (const lieu of ["page", "fenêtre"]) {
  const { nav, page } = await ouvrir("web");
  try {
    titre(`879 · §1 — web (${lieu}) : la carte survolée prend la touche, et rien d'autre ne bouge`);
    if (lieu === "page") {
      await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    } else {
      await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-carte]", { timeout: 20000 });
      await attendre(page, 1000);
      await page.locator(`[data-lien-carte][href^="/artist/${SLUG}"]`).first().click();
      await page.waitForFunction(() => Boolean(document.querySelector("[data-titre-fenetre]")), null, { timeout: 20000 }).catch(() => {});
      await attendre(page, 1200);
      //  DANS LA FENÊTRE, LES ONGLETS SONT DES BOUTONS (elle n'a pas
      //  d'adresse à elle — SelecteurOngletAffiche).
      await page.locator('[aria-label="Profile, portfolio or flash"] button')
        .filter({ hasText: /^Portfolio$/ }).first().click();
    }
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 1500);
    /*  LE CLIC DANS LA GRANDE PHOTO D'ABORD : c'est lui qui donne le
        clavier au cadre à coupe (le « scroller focus » implicite de
        Chromium). Sans lui, la moitié du défaut ne pourrait pas se
        produire — et le banc ne prouverait rien. */
    await page.locator(AFFICHE).first().click({ position: { x: 200, y: 300 } });
    await attendre(page, 900);
    const depart = await etat(page);
    verif(`${lieu} : au départ, deux cartes au rang 1 et l'affiche au sien`,
      depart.cartes.length === 2 && depart.cartes[0] === "1/6" && depart.cartes[1] === "1/4",
      `${JSON.stringify(depart.cartes)} · affiche ${depart.compteur}`);

    //  ── HORS CARTE : LA GRANDE PHOTO, ET D'UN SEUL PAS.
    await page.mouse.move(1380, 60);
    await attendre(page, 300);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 700);
    const horsCarte = await etat(page);
    verif(`${lieu} : hors carte, la GRANDE PHOTO avance — d'UN pas, pas de deux`,
      horsCarte.compteur === "2/6" && JSON.stringify(horsCarte.cartes) === JSON.stringify(depart.cartes),
      `affiche ${depart.compteur} → ${horsCarte.compteur} · cartes ${JSON.stringify(horsCarte.cartes)}`);

    //  ── CARTE SURVOLÉE : ELLE SEULE, ET D'UN PAS PAR APPUI.
    for (const [rang, total] of [[0, 6], [1, 4]]) {
      await page.locator(`[data-carte-de-galerie='${rang}']`).hover({ position: { x: 200, y: 200 } });
      await attendre(page, 400);
      const avant = await etat(page);
      for (let i = 0; i < 5; i += 1) { await page.keyboard.press("ArrowRight"); await attendre(page, 350); }
      const apres = await etat(page);
      const attendu = `${Math.min(1 + 5, total)}/${total}`;
      const autre = rang === 0 ? 1 : 0;
      verif(`${lieu} · carte ${rang} : → ×5 → elle avance de cinq (${attendu})`,
        apres.cartes[rang] === attendu, `${avant.cartes[rang]} → ${apres.cartes[rang]}`);
      verif(`${lieu} · carte ${rang} : LA GRANDE PHOTO N'A PAS BOUGÉ (compteur ET défilement)`,
        apres.compteur === avant.compteur && apres.defil === avant.defil,
        `compteur ${avant.compteur} → ${apres.compteur} · défilement ${avant.defil} → ${apres.defil}`);
      verif(`${lieu} · carte ${rang} : l'AUTRE carte n'a pas bougé non plus`,
        apres.cartes[autre] === avant.cartes[autre], `${avant.cartes[autre]} → ${apres.cartes[autre]}`);
      //  ── AU BOUT DE COURSE : un appui de plus ne fait rien, nulle part.
      const auBout = await etat(page);
      await page.keyboard.press("ArrowRight");
      await attendre(page, 600);
      const apresLeBout = await etat(page);
      verif(`${lieu} · carte ${rang} : AU BOUT, une flèche de plus ne bouge rien`,
        apresLeBout.cartes[rang] === auBout.cartes[rang] &&
        apresLeBout.compteur === auBout.compteur && apresLeBout.defil === auBout.defil,
        `carte ${apresLeBout.cartes[rang]} · affiche ${apresLeBout.compteur} · défilement ${apresLeBout.defil}`);
    }
    //  ── ET LE SENS INVERSE RESTE JUSTE : hors carte, la photo répond.
    await page.mouse.move(1380, 60);
    await attendre(page, 400);
    const avantRetour = await etat(page);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 700);
    const apresRetour = await etat(page);
    verif(`${lieu} : hors carte de nouveau, la grande photo avance encore d'un pas`,
      apresRetour.compteur === "3/6" && JSON.stringify(apresRetour.cartes) === JSON.stringify(avantRetour.cartes),
      `affiche ${avantRetour.compteur} → ${apresRetour.compteur}`);
  } catch (e) {
    verif(`déroulement du banc 879 (§1 ${lieu})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 et 3 · LES DEUX AIRS DU FIL, AUX DEUX APPAREILS ══════════════
/*  LA BANDE DU VA-ET-VIENT, ET NON LE `nav` : le trait qui la ferme est
    porté par la bande (un `border-b` d'un pixel), et c'est ce trait que
    l'œil prend pour la fin du va-et-vient. */
const AIRS = `() => {
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1) }; };
  const onglets = document.querySelector('[aria-label="Profile, portfolio or flash"]');
  const bande = onglets ? onglets.parentElement : null;
  const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")];
  const titres = cartes.map((c) => c.querySelector("[data-titre-galerie], h2, h3"));
  return {
    bande: B(bande), cartes: cartes.map(B), titres: titres.map(B),
    gouttiere: getComputedStyle(document.querySelector("[data-fil-de-galerie] ul")).rowGap,
    margeDuFil: getComputedStyle(document.querySelector("[data-fil-de-galerie]")).marginTop,
    //  RIEN NE DOIT SE GLISSER ENTRE LA BANDE ET LE FIL (un squelette
    //  d'attente, par exemple) : on compte ce qui les sépare.
    entreDeux: (() => {
      const fil = document.querySelector("[data-fil-de-galerie]");
      let n = fil, avant = 0;
      while (n && n.previousElementSibling === null) n = n.parentElement;
      let v = n ? n.previousElementSibling : null;
      while (v && v !== bande) { avant += 1; v = v.previousElementSibling; }
      return avant;
    })(),
  };
}`;
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`879 · §${mode === "web" ? "2" : "3"} — ${mode} : l'air au-dessus de la 1re carte vaut celui qui sépare deux cartes`);
    //  ── LE PREMIER RELEVÉ EST PRIS TÔT (au premier rendu), le second
    //     une fois tout arrivé : deux valeurs égales = aucun saut.
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    const tot = await page.evaluate((A) => new Function("return " + A)()(), AIRS);
    await page.waitForLoadState("networkidle").catch(() => {});
    await attendre(page, 1800);
    const v = await page.evaluate((A) => new Function("return " + A)()(), AIRS);
    const air1 = v.titres[0] ? +(v.titres[0].y - v.bande.bas).toFixed(1) : null;
    const air2 = v.titres[1] ? +(v.titres[1].y - v.cartes[0].bas).toFixed(1) : null;
    verif(`${mode} : les deux airs sont ÉGAUX (va-et-vient → 1er titre, et bas de carte → titre suivant)`,
      proche(air1, air2, 0.5), `air 1 ${air1} · air 2 ${air2}`);
    verif(`${mode} : et ils valent la gouttière de la liste (${v.gouttiere})`,
      proche(air1, parseFloat(v.gouttiere), 0.5) && v.margeDuFil === v.gouttiere,
      `air 1 ${air1} · gouttière ${v.gouttiere} · marge du fil ${v.margeDuFil}`);
    const air1Tot = tot.titres[0] ? +(tot.titres[0].y - tot.bande.bas).toFixed(1) : null;
    verif(`${mode} : AUCUN SAUT — l'air est le même au premier rendu et une fois tout arrivé`,
      proche(air1Tot, air1, 0.5), `tôt ${air1Tot} · tard ${air1}`);
    verif(`${mode} : rien ne se glisse entre le va-et-vient et le fil (aucun squelette résiduel)`,
      v.entreDeux === 0, `${v.entreDeux} nœud(s) entre les deux`);
  } catch (e) {
    verif(`déroulement du banc 879 (§2/§3 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
