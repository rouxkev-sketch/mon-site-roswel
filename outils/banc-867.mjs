//  ██ BANC 867 — HUIT RETOUCHES (moteur, fil de galeries, menus, profils,
//  pied, vues) ██
//  ==================================================================
//   1. LE VA-ET-VIENT DE LA PAGE DE RECHERCHE (doigt) : la goutte et
//      l'éclair devant les deux mots ; un BALAYAGE horizontal bascule
//      Tattoo ↔ Flash, et le même geste SUR le curseur de distance ne
//      bascule rien.
//   2. LA FLÈCHE du champ des styles reste GRISE à l'ouverture.
//   3. LE FIL DE GALERIES : l'avatar de quarante à gauche du titre.
//   4. LA FEUILLE DE « MA SÉLECTION » : moins d'air sous le dernier
//      titre (28 au lieu de 32) et au-dessus du deuxième (8 au lieu de
//      12) ; sans titres, la réserve de la plaque descend de 16 à 12.
//   5. LE RETOUR APRÈS UN DÉSABONNEMENT rend « Ma sélection », jamais
//      l'accueil — y compris quand le profil s'est ouvert en DOCUMENT
//      (le cas que Safari fabrique, et que ce banc reproduit).
//   6. LES BADGES D'UN PROFIL : fond du site, contour fin ; le « +N »
//      n'est plus un badge.
//   7. LE PIED DES CARTES : les quatre dessins à 24, les quatre cibles
//      à 40, seize d'air de chaque côté.
//   8. LES VUES S'ÉCRIVENT COURT : 999, 1K, 12.3K, 1M.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const SLUG = `banc867-${Date.now()}`;
const STYLES = ["blackwork", "realisme", "trash-polka", "neo-japonais", "old-school", "graphique", "dotwork", "lettrage", "geometrique", "ornemental"];
const PHOTO = (i) => `48670${i.toString(16).padStart(3, "0")}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 867", styles: STYLES, ville_slug: `lyon-${SLUG}`, vues: 12300 });
  await ranger("photos_tatoueur", [1, 2, 3, 4, 5, 6].map((i) => ({
    id: PHOTO(i), tatoueur_id: SLUG, style: i > 3 ? "realisme" : "blackwork", rendu: "black", nature: "tatouage",
    url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
    ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
}
const B = `(n) => { if (!n) return null; const r = n.getBoundingClientRect();
  return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), g: +r.left.toFixed(1), d: +r.right.toFixed(1), h: +r.height.toFixed(1), l: +r.width.toFixed(1) }; }`;
//  UN BALAYAGE, à la main : le navigateur d'un banc n'a pas de doigt.
const balayer = (page, x1, x2, y) => page.evaluate(([x1, x2, y]) => {
  const cible = document.elementFromPoint(x1, y);
  if (!cible) return false;
  const opts = (x) => ({ pointerId: 1, isPrimary: true, clientX: x, clientY: y, bubbles: true, pointerType: "touch" });
  cible.dispatchEvent(new PointerEvent("pointerdown", opts(x1)));
  cible.dispatchEvent(new PointerEvent("pointermove", opts(x2)));
  cible.dispatchEvent(new PointerEvent("pointerup", opts(x2)));
  return true;
}, [x1, x2, y]);
const onglets = (page) => page.evaluate(() =>
  [...document.querySelectorAll("[data-page-recherche] [role=radio]")].map((b) => ({ texte: b.textContent.trim(), actif: b.getAttribute("aria-checked") === "true", icone: Boolean(b.querySelector("svg")) })));

//  ══ 1 ET 2 · LE VA-ET-VIENT DU MOTEUR, ET LA FLÈCHE ═════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("867 · §1-a — la page de recherche : la goutte et l'éclair devant les deux mots");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.locator('[aria-label*="Search" i]').first().tap();
    await page.waitForSelector("[data-page-recherche]", { timeout: 15000 });
    await page.waitForTimeout(900);
    const deux = await onglets(page);
    verif("les deux positions disent « Tattoo » et « Flash », chacune avec son icône",
      deux.length === 2 && deux[0].texte === "Tattoo" && deux[1].texte === "Flash" && deux.every((o) => o.icone),
      JSON.stringify(deux));
    verif("… l'icône est un dessin de 20 px, devant le mot (l'écriture de l'accueil)",
      await page.evaluate(() => {
        const svg = document.querySelector("[data-page-recherche] [role=radio] svg");
        const mot = svg?.parentElement?.querySelector("span");
        if (!svg || !mot) return false;
        const a = svg.getBoundingClientRect(), b = mot.getBoundingClientRect();
        return Math.round(a.width) === 20 && Math.round(a.height) === 20 && a.right <= b.left;
      }));

    titre("867 · §1-b — un balayage horizontal bascule Tattoo ↔ Flash");
    verif("le geste est reçu par la page", await balayer(page, 320, 60, 420));
    await page.waitForTimeout(600);
    const versFlash = await onglets(page);
    verif("balayage vers la gauche : Flash s'allume", versFlash[1]?.actif === true && versFlash[0]?.actif === false, JSON.stringify(versFlash.map((o) => `${o.texte}:${o.actif}`)));
    await balayer(page, 60, 320, 420);
    await page.waitForTimeout(600);
    const versTattoo = await onglets(page);
    verif("balayage vers la droite : Tattoo revient", versTattoo[0]?.actif === true, JSON.stringify(versTattoo.map((o) => `${o.texte}:${o.actif}`)));

    titre("867 · §1-b — et le même geste SUR le curseur de distance ne bascule rien");
    const curseur = await page.evaluate(() => {
      const c = document.querySelector("[data-page-recherche] [data-sans-balayage]");
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), curseur: Boolean(c.querySelector('input[type="range"]')) };
    });
    verif("le curseur de distance se nomme (le marqueur du balayage)", curseur?.curseur === true, JSON.stringify(curseur));
    await balayer(page, curseur.x + 110, curseur.x - 110, curseur.y);
    await page.waitForTimeout(600);
    const apresCurseur = await onglets(page);
    verif("l'onglet n'a pas bougé : le geste appartient au curseur", apresCurseur[0]?.actif === true, JSON.stringify(apresCurseur.map((o) => `${o.texte}:${o.actif}`)));

    titre("867 · §2 — la flèche du champ des styles reste grise à l'ouverture");
    await page.locator("[data-page-recherche] [aria-label=Style]").first().tap();
    await page.waitForTimeout(900);
    const fleche = await page.evaluate(() => {
      const champ = document.querySelector("[data-page-recherche] [aria-label=Style]");
      return { ouvert: champ.getAttribute("aria-expanded"), image: decodeURIComponent(getComputedStyle(champ).backgroundImage) };
    });
    verif("le menu est bien ouvert", fleche.ouvert === "true", String(fleche.ouvert));
    verif("… et la flèche garde le gris des menus (plus de rouge)",
      /stroke='#9AA1AC'/.test(fleche.image) && !/#E11144/i.test(fleche.image), fleche.image.slice(0, 140));
  } catch (e) {
    verif("déroulement du banc 867 (§1/§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3, 7 ET 8 · LE FIL DE GALERIES, LE PIED, LES VUES ═══════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    /*  ⛔ nº 873-§3 — L'AVATAR DE LA nº 867-§3 EST PARTI : la page
        Portfolio du doigt EST le fil de galeries, et chaque carte n'a en
        tête que le titre et le sous-titre de sa galerie, à seize du
        bord. Le banc mesure désormais ce que la nº 873 demande. */
    titre("867 · §3 (annulé par la nº 873) — le fil de galeries : plus d'avatar, le titre à seize du bord");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const cartes = await page.evaluate((S) => { const B = new Function("return " + S)();
      return [...document.querySelectorAll("[data-carte-de-galerie]")].map((li) => {
        //  nº 874-§4 — plus de surtitre : l'en-tête d'une carte est son
        //  premier enfant (la boîte des marges du fil), et la rangée du
        //  titre vit dedans.
        const entete = li.firstElementChild;
        return { rond: entete ? entete.querySelectorAll("img, svg, [class*='rounded-full']").length : null,
          surtitre: B(li.querySelector("[data-surtitre-galerie]")),
          titre: B(li.querySelector("[data-titre-galerie]")), entete: B(entete), cadre: B(li.querySelector("[data-cadre-de-galerie]")) };
      }); }, B);
    verif("aucune carte ne porte de rond : l'avatar de la nº 867-§3 est parti (nº 873-§3)",
      cartes.length > 0 && cartes.every((c) => c.rond === 0), JSON.stringify(cartes.map((c) => c.rond)));
    verif("… le titre commence à seize du bord (plus de 16 + 40 + 12), et il n'y a plus de surtitre (nº 874-§4)",
      cartes.every((c) => c.titre.g === 16 && c.surtitre === null), JSON.stringify(cartes.map((c) => [c.surtitre, c.titre.g])));
    verif("… l'en-tête garde ses douze pixels au-dessus de l'image",
      cartes.every((c) => Math.round(c.cadre.y - c.entete.bas) === 0 && Math.round(c.cadre.y - c.titre.bas) === 12),
      JSON.stringify(cartes.map((c) => Math.round(c.cadre.y - c.titre.bas))));

    titre("867 · §7 — le pied : quatre dessins de 24, quatre cibles de 40, seize d'air");
    const pied = await page.evaluate((S) => { const B = new Function("return " + S)();
      const rangee = document.querySelector("[data-carte-de-galerie] [data-pied-de-fil]");
      const svgs = [...rangee.querySelectorAll("svg")].filter((s) => !s.closest("button[aria-label^='View photo']")).map((s) => {
        const label = s.closest("[aria-label]")?.getAttribute("aria-label") ?? "";
        const role = /Report/.test(label) ? "signaler" : /Save|Remove/.test(label) ? "fanion" : /Share/.test(label) ? "partage" : "vues";
        return { role, ...B(s), cible: B(s.closest("button") ?? s.closest("[data-vues-de-fil]")) };
      });
      const par = Object.fromEntries(svgs.map((s) => [s.role, s]));
      return { svgs, par, nombre: rangee.querySelector("[data-vues-de-fil]")?.textContent.trim() ?? null,
        gauche: par.signaler && par.vues ? +(par.vues.g - par.signaler.d).toFixed(1) : null,
        droite: par.fanion && par.partage ? +(par.partage.g - par.fanion.d).toFixed(1) : null }; }, B);
    verif("les quatre dessins font 24 × 24", pied.svgs.length === 4 && pied.svgs.every((s) => s.h === 24 && s.l === 24),
      JSON.stringify(pied.svgs.map((s) => `${s.role} ${s.l}×${s.h}`)));
    verif("… leurs quatre cibles font 40 de haut", pied.svgs.every((s) => s.cible && s.cible.h === 40),
      JSON.stringify(pied.svgs.map((s) => `${s.role} ${s.cible?.h}`)));
    verif("… et les deux airs valent seize", pied.gauche === 16 && pied.droite === 16, `${pied.gauche} · ${pied.droite}`);

    titre("867 · §8 — les vues s'écrivent court : 999, 1K, 12.3K, 1M");
    //  L'ÉCRITURE ELLE-MÊME, éprouvée sur la source livrée : on lit
    //  `src/lib/format-vues.ts`, on lui retire ses types (le banc parle
    //  JavaScript) et on l'appelle. Aucune copie de la règle ici — c'est
    //  le fichier du site qui répond.
    const source = (await import("node:fs")).readFileSync("src/lib/format-vues.ts", "utf8");
    const { vuesAffichees } = await import(
      "data:text/javascript;base64," +
        Buffer.from(
          source
            .replace(/: number \| null \| undefined/g, "")
            .replace(/\): string \{/g, ") {")
            .replace(/ as const;/g, ";")
        ).toString("base64")
    );
    for (const [valeur, attendu] of [[999, "999"], [1000, "1K"], [12300, "12.3K"], [1000000, "1M"]]) {
      verif(`${valeur} s'écrit « ${attendu} »`, vuesAffichees(valeur) === attendu, `« ${vuesAffichees(valeur)} »`);
    }
    verif("… et les voisins tiennent : 12399 tronque à 12.3K, 1500 fait 1.5K, rien du tout fait 0",
      vuesAffichees(12399) === "12.3K" && vuesAffichees(1500) === "1.5K" && vuesAffichees(null) === "0" && vuesAffichees(0) === "0",
      `${vuesAffichees(12399)} · ${vuesAffichees(1500)} · ${vuesAffichees(null)}`);
    //  ET LE PIED LA LIT : la carte d'un résultat, dont les vues valent
    //  12 300 en base.
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage&t=${Date.now()}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte] [data-vues-de-fil]", { timeout: 20000 });
    await page.waitForTimeout(600);
    const surLaCarte = await page.evaluate((slug) => {
      const lien = [...document.querySelectorAll("[data-carte] [data-lien-profil-de-fil]")].find((a) => (a.getAttribute("href") ?? "").includes(`/artist/${slug}`));
      return lien?.closest("[data-carte]")?.querySelector("[data-vues-de-fil]")?.textContent.trim() ?? null;
    }, SLUG);
    verif("le pied d'une carte écrit « 12.3K » pour 12 300 vues", surLaCarte === "12.3K", `« ${surLaCarte} »`);
  } catch (e) {
    verif("déroulement du banc 867 (§3/§7/§8)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · LES BADGES D'UN PROFIL, AUX DEUX APPAREILS ══════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`867 · §6 — ${mode} : fond du site, contour fin, et le « +N » en texte nu`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-styles-fiche]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const v = await page.evaluate((S) => { const B = new Function("return " + S)();
      const ligne = document.querySelector("[data-styles-fiche]");
      const zone = ligne.lastElementChild;
      const capsules = [...zone.children].filter((n) => n.tagName === "SPAN");
      const compteur = zone.querySelector("button");
      const st = (n) => { if (!n) return null; const s = getComputedStyle(n);
        return { texte: n.textContent.trim(), fond: s.backgroundColor, largeurTrait: s.borderTopWidth, couleurTrait: s.borderTopColor,
          rayon: s.borderTopLeftRadius, couleur: s.color, corps: s.fontSize, ...B(n) }; };
      //  Le fond de la page, pour dire « c'est le fond du site ».
      const fondDuSite = getComputedStyle(document.body).backgroundColor;
      return { n: capsules.length, capsule: st(capsules[0]), compteur: st(compteur), fondDuSite,
        chevron: Boolean(compteur?.querySelector("svg")) }; }, B);
    verif("les capsules n'ont plus de fond d'action : le fond du site se voit à travers",
      v.capsule?.fond === "rgba(0, 0, 0, 0)", JSON.stringify(v.capsule && { fond: v.capsule.fond, texte: v.capsule.texte }));
    verif("… et un contour fin d'un pixel (la robe du badge du compte)",
      v.capsule?.largeurTrait === "1px" && v.capsule?.couleurTrait === "rgb(62, 70, 80)" && v.capsule?.rayon === "8px",
      `${v.capsule?.largeurTrait} ${v.capsule?.couleurTrait} · rayon ${v.capsule?.rayon}`);
    verif("le compteur de débordement existe (dix styles ne tiennent pas en deux lignes)",
      Boolean(v.compteur) && /^\+\d+$/.test(v.compteur.texte), JSON.stringify(v.compteur?.texte));
    verif("… ce n'est PLUS un badge : aucun fond, aucun contour",
      v.compteur?.fond === "rgba(0, 0, 0, 0)" && v.compteur?.largeurTrait === "0px",
      `fond ${v.compteur?.fond} · trait ${v.compteur?.largeurTrait}`);
    verif("… il garde sa flèche et la hauteur d'une capsule",
      v.chevron === true && Math.abs(v.compteur.h - v.capsule.h) <= 1, `flèche ${v.chevron} · ${v.compteur?.h} contre ${v.capsule?.h}`);
  } catch (e) {
    verif(`déroulement du banc 867 (§6 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LA FEUILLE DE « MA SÉLECTION » ══════════════════════════════
//  AVEC des titres : des suivis de styles ET de types différents (sans
//  quoi le groupe « Profil » disparaît, nº 865). SANS titres : des
//  styles différents mais un seul type — un seul groupe, plus de bloc.
{
  const U = { id: "30000000-0000-4000-8000-000000000867", email: "banc-867@yokofolio.test" };
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  const forger = async (nom, style, type) => {
    const ID = `22000000-0000-4000-8000-${(Date.now() + nom.length).toString(16).padStart(12, "0")}`;
    const T = `banc867-${nom}-${Date.now()}`;
    await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: `Banc 867 ${nom}`, styles: [style], ville_slug: `lyon-${T}`,
      type_fiche: type, etablissement: type === "artiste" ? null : `Lieu ${nom}` });
    await ranger("photos_tatoueur", [1, 2].map((i) => ({ id: `${ID.slice(0, 8)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: ID, style, rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${i}.svg`,
      miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
    return ID;
  };
  const mesurer = (page) => page.evaluate((S) => { const B = new Function("return " + S)();
    const racine = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).position === "fixed" && /z-\[70\]/.test(d.className));
    if (!racine) return { absente: true };
    const bande = racine.querySelector("[data-bande-feuille]");
    const plaque = bande.parentElement;
    const bloc = [...racine.querySelectorAll("div")].find((d) => /border-t/.test(d.className) && /safe-area/.test(d.className));
    const encre = (el) => { const r = document.createRange(); r.selectNodeContents(el); const rs = [...r.getClientRects()];
      return rs.length ? { y: +Math.min(...rs.map((k) => k.top)).toFixed(1), bas: +Math.max(...rs.map((k) => k.bottom)).toFixed(1) } : null; };
    const titres = bloc ? [...bloc.querySelectorAll("button")].map((b) => ({ texte: b.textContent.trim(),
      pad: getComputedStyle(b).paddingTop + "/" + getComputedStyle(b).paddingBottom, encre: encre(b.querySelector("span") ?? b), ...B(b) })) : [];
    return { ecran: innerHeight, plaque: { ...B(plaque), padBas: getComputedStyle(plaque).paddingBottom },
      bloc: bloc ? { ...B(bloc), padBas: getComputedStyle(bloc).paddingBottom } : null, titres,
      sousLeDernier: bloc && titres.length ? +(B(plaque).bas - titres[titres.length - 1].bas).toFixed(1) : null,
      sousLEncre: bloc && titres.length ? +(B(plaque).bas - titres[titres.length - 1].encre.bas).toFixed(1) : null,
      entreLesTitres: titres.length > 1 ? +(titres[1].y - titres[0].bas).toFixed(1) : null,
      entreLesEncres: titres.length > 1 ? +(titres[1].encre.y - titres[0].encre.bas).toFixed(1) : null }; }, B);
  const ouvrirLaFeuille = async (page) => {
    await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-suivi]", { timeout: 20000 });
    await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
    await page.waitForTimeout(1200);
  };

  for (const [cas, fiches] of [
    ["avec ses deux titres", [["a", "blackwork", "artiste"], ["b", "realisme", "salon"]]],
    ["sans titres (un seul groupe)", [["c", "blackwork", "artiste"], ["d", "realisme", "artiste"]]],
  ]) {
    await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
    const ids = [];
    for (const [nom, style, type] of fiches) ids.push(await forger(nom, style, type));
    await ranger("tatoueurs_suivis", ids.map((id) => ({ utilisateur_id: U.id, tatoueur_id: id, cree_le: "2026-01-01T00:00:00Z" })));
    const { nav, page } = await ouvrir("doigt", { session: U });
    try {
      titre(`867 · §4 — la feuille ${cas}`);
      await ouvrirLaFeuille(page);
      const v = await mesurer(page);
      if (cas.startsWith("avec")) {
        verif("le bloc des deux titres est là", !v.absente && v.titres.length === 2, JSON.stringify(v.titres?.map((t) => t.texte)));
        //  nº 868-§2 — le bloc prend l'air de la feuille SANS titres :
        //  huit pixels de liste plus la réserve de la plaque, soit vingt
        //  sur un écran sans barre d'accueil.
        verif("son rembourrage bas vaut VINGT depuis la nº 868 (l'air de la feuille sans titres)", v.bloc?.padBas === "20px", v.bloc?.padBas);
        //  SOUS LE DERNIER TITRE : 28 px de sa boîte au bord de la
        //  feuille (32 avant la nº 867), soit 39,7 px depuis l'encre de
        //  ses capitales (43,7 avant) — la réserve du téléphone
        //  l'emporte toujours quand elle est plus grande.
        verif("vingt pixels sous la BOÎTE du dernier titre (vingt-huit à la nº 867, trente-deux avant)",
          v.sousLeDernier === 20 && Math.abs(v.sousLEncre - 31.7) <= 1, `boîte ${v.sousLeDernier} · encre ${v.sousLEncre}`);
        //  ENTRE LES DEUX TITRES : leurs boîtes se touchent, l'air vit
        //  dans les rembourrages — 4 sous le premier, 8 sur le second
        //  (12 avant), soit DOUZE au lieu de seize ; 25 px d'encre à
        //  encre, contre 29.
        verif("l'air entre les deux titres tombe à DOUZE (seize avant la nº 867)",
          v.titres[0]?.pad === "12px/4px" && v.titres[1]?.pad === "8px/4px"
            && Math.abs(v.entreLesEncres - 25) <= 1, `rembourrages ${v.titres[0]?.pad} + ${v.titres[1]?.pad} · encre ${v.entreLesEncres}`);
      } else {
        verif("la feuille n'a pas de bloc de titres", !v.absente && v.bloc === null && v.titres.length === 0, JSON.stringify({ bloc: Boolean(v.bloc), titres: v.titres.length }));
        verif("la réserve de la plaque tombe à DOUZE (seize avant la nº 867)", v.plaque?.padBas === "12px", v.plaque?.padBas);
      }
      verif("la feuille touche toujours le bas de l'écran", v.plaque?.bas === v.ecran, `${v.plaque?.bas} / ${v.ecran}`);
    } catch (e) {
      verif(`déroulement du banc 867 (§4 ${cas})`, false, String(e).slice(0, 400));
    } finally { await nav.close(); }
  }
}

//  ══ 5 · LE RETOUR APRÈS UN DÉSABONNEMENT ════════════════════════════
//  DEUX FOIS LE MÊME PARCOURS : le profil ouvert par la navigation douce
//  du routeur (ce que fait Chromium), puis par une NAVIGATION DE
//  DOCUMENT — le cas que Safari fabrique tout seul, et le seul où le
//  défaut se voyait. Le WebKit de Playwright n'est pas installable dans
//  cet atelier (le téléchargement est bloqué) : c'est donc la CAUSE
//  qu'on reproduit, pas le moteur.
{
  const U = { id: "30000000-0000-4000-8000-000000000877", email: "banc-867-retour@yokofolio.test" };
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  const ids = [];
  for (const [k, style] of ["blackwork", "realisme"].entries()) {
    const ID = `23000000-0000-4000-8000-${(Date.now() + k).toString(16).padStart(12, "0")}`;
    const T = `banc867-retour-${k}-${Date.now()}`;
    await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: `Banc 867 retour ${k}`, styles: [style], ville_slug: `lyon-${T}` });
    await ranger("photos_tatoueur", [1, 2].map((i) => ({ id: `2300000${k}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: ID, style, rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${i}.svg`,
      miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
    ids.push({ id: ID, slug: T });
  }
  for (const enDocument of [false, true]) {
    await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
    await ranger("tatoueurs_suivis", ids.map((f) => ({ utilisateur_id: U.id, tatoueur_id: f.id, cree_le: "2026-01-01T00:00:00Z" })));
    const { nav, page } = await ouvrir("doigt", { session: U });
    try {
      titre(`867 · §5 — désabonnement puis retour, le profil ouvert ${enDocument ? "EN DOCUMENT (le cas de Safari)" : "par le routeur"}`);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.locator('a[href*="my-favorites"]').first().tap();
      await page.waitForFunction(() => /my-favorites/.test(location.pathname), null, { timeout: 15000 });
      await page.waitForTimeout(1200);
      await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
      await page.waitForTimeout(1000);
      const depart = await page.evaluate(() => ({ url: location.pathname + location.search, plancher: JSON.parse(sessionStorage.getItem("yokofolio:bas-de-la-pile") ?? "null")?.profondeur ?? null, len: history.length }));
      verif("on part bien de « Ma sélection » > Portfolios", depart.url === "/my-favorites?selection=suivis", depart.url);
      if (enDocument) await page.goto(`${BASE}/artist/${ids[0].slug}?entree=lien`, { waitUntil: "networkidle" });
      else await page.locator("[data-ligne-suivi]").first().tap();
      await page.waitForFunction(() => /\/artist\//.test(location.pathname), null, { timeout: 15000 });
      await page.waitForTimeout(1800);
      const surLeProfil = await page.evaluate(() => ({ url: location.pathname + location.search, len: history.length,
        plancher: JSON.parse(sessionStorage.getItem("yokofolio:bas-de-la-pile") ?? "null")?.profondeur ?? null }));
      /*  ⛔ nº 868 — LA RÈGLE DE LA nº 867 §5 EST ANNULÉE (elle a coûté
          une régression sur l'iPhone du propriétaire) : le plancher se
          reprend de nouveau à chaque document, et ce n'est plus ce qui
          protège le retour. CE QUI LE PROTÈGE MAINTENANT : le bouton
          « Follow » ne pose plus le cran du filet (nº 868-§1, banc 868).
          On relève donc l'état sans en faire une promesse. */
      verif("l'état de la pile est relevé (le plancher n'est plus ce qui décide, nº 868)",
        surLeProfil.plancher !== null,
        `plancher ${surLeProfil.plancher} · pile ${surLeProfil.len} (au départ ${depart.plancher}/${depart.len})`);
      await page.locator('[aria-label^="Unfollow"]').first().tap();
      await page.waitForTimeout(2000);
      verif("le bouton dit maintenant « Follow »", await page.locator('[aria-label^="Follow"]').first().isVisible().catch(() => false));
      await page.goBack();
      await page.waitForTimeout(2500);
      const retour = await page.evaluate(() => ({ url: location.pathname + location.search, lignes: document.querySelectorAll("[data-ligne-suivi]").length }));
      verif("LE RETOUR REND « Ma sélection », jamais l'accueil",
        retour.url === "/my-favorites?selection=suivis", retour.url);
      /*  LA LISTE EST RENDUE, et on n'en demande pas plus : après un
          retour du navigateur, le routeur peut rendre la page telle
          qu'il l'avait en cache (deux lignes) et ne la rafraîchir qu'au
          chargement suivant. C'est un comportement d'avant cette passe,
          hors de sa consigne — le sujet ici est L'ADRESSE. */
      verif("… et la page rend bien sa liste de portfolios suivis", retour.lignes >= 1, `${retour.lignes} ligne(s)`);
    } catch (e) {
      verif(`déroulement du banc 867 (§5 ${enDocument ? "document" : "routeur"})`, false, String(e).slice(0, 400));
    } finally { await nav.close(); }
  }
}

process.exit(bilan());
