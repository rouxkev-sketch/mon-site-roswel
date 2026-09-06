//  ██ BANC 873 — PROFILE · PORTFOLIO · FLASH : TROIS PAGES ██
//  ==================================================================
//  Les cinq points de la passe, web et doigt :
//   1. TROIS ADRESSES — /artist/<nom>, /artist/<nom>/portfolio,
//      /artist/<nom>/flash — répondent, avec trois titres et trois
//      canoniques distincts ; les anciennes adresses (?onglet=portfolio,
//      ?entree=portfolio…) redirigent en 301 ; le va-et-vient est une
//      navigation douce (le document n'est pas rechargé) ; chaque page
//      garde sa position (Portfolio à 600 → Flash → retour → 600, par
//      l'onglet et par le retour du navigateur ; au web, la colonne).
//   2. LE VA-ET-VIENT à trois onglets, chacun un tiers, le mot centré,
//      le trait rouge sur TOUTE la largeur de l'onglet ; Flash toujours
//      présent, même sans flash.
//   3. AU DOIGT, les pages Portfolio et Flash sont le fil de galeries :
//      une carte par galerie de la catégorie, sans avatar, la pastille
//      et les points sur une galerie à plusieurs photos, ni l'une ni les
//      autres sur une galerie d'une photo, le pied gardé ; un toucher
//      sur une photo ne fait rien ; plus de bandes par style. AU WEB,
//      les galeries par style, filtrées par la catégorie.
//   4. PAGES VIDES : « No flash yet. » / « No tattoos yet. », web et doigt.
//   5. Le glissement latéral navigue entre voisins (doigt).
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
//  TROIS FICHES : la complète (tattoos ET flashs — six galeries de
//  tattoos, assez pour que la colonne du web défile de 600, dont une
//  d'UNE photo ; une galerie de flashs), une SANS FLASH, une SANS TATTOO.
const SLUG = `banc873-${T}`, SANS_FLASH = `banc873n-${T}`, SANS_TATTOO = `banc873f-${T}`;
const PHOTO = (k, i) => `4873${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
const photo = (id, slug, style, nature, i, rendu = "black") => ({
  id, tatoueur_id: slug, style, rendu, nature,
  url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
  ordre: i, cree_le: "2026-01-01T00:00:00Z",
});
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [
    { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 873", styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` },
    { ...gabarit, id: SANS_FLASH, slug: SANS_FLASH, nom: "Banc 873 sans flash", styles: ["blackwork"], ville_slug: `lyon-${SANS_FLASH}` },
    { ...gabarit, id: SANS_TATTOO, slug: SANS_TATTOO, nom: "Banc 873 sans tattoo", styles: ["blackwork"], ville_slug: `lyon-${SANS_TATTOO}` },
  ]);
  const photos = [];
  for (let i = 1; i <= 5; i += 1) photos.push(photo(PHOTO(0, i), SLUG, "blackwork", "tatouage", i));
  photos.push(photo(PHOTO(1, 1), SLUG, "realisme", "tatouage", 1));
  //  Quatre galeries de plus (couleur, trash polka) : la colonne du web
  //  dépasse sa hauteur, la page du doigt aussi.
  for (let i = 1; i <= 3; i += 1) photos.push(photo(PHOTO(5, i), SLUG, "blackwork", "tatouage", i, "color"));
  for (let i = 1; i <= 2; i += 1) photos.push(photo(PHOTO(6, i), SLUG, "realisme", "tatouage", i, "color"));
  for (let i = 1; i <= 2; i += 1) photos.push(photo(PHOTO(7, i), SLUG, "trash-polka", "tatouage", i));
  for (let i = 1; i <= 2; i += 1) photos.push(photo(PHOTO(8, i), SLUG, "trash-polka", "tatouage", i, "color"));
  for (let i = 1; i <= 3; i += 1) photos.push(photo(PHOTO(2, i), SLUG, "blackwork", "flash", i));
  for (let i = 1; i <= 2; i += 1) photos.push(photo(PHOTO(3, i), SANS_FLASH, "blackwork", "tatouage", i));
  for (let i = 1; i <= 2; i += 1) photos.push(photo(PHOTO(4, i), SANS_TATTOO, "blackwork", "flash", i));
  await ranger("photos_tatoueur", photos);
}

const NAV = 'nav[aria-label="Profile, portfolio or flash"]';
//  Les galeries de tattoos de la fiche complète, dans l'ordre du profil
//  (styles A → Z, puis les rendus dans l'ordre du site).
const TATTOOS = ["tatouage·blackwork·black", "tatouage·blackwork·color", "tatouage·realisme·black", "tatouage·realisme·color", "tatouage·trash-polka·black", "tatouage·trash-polka·color"];
//  LE VA-ET-VIENT : ses trois liens, le segment qui glisse et le trait.
const SONDE_VV = `() => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { x: +x.left.toFixed(1), d: +x.right.toFixed(1), y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), w: +x.width.toFixed(1), h: +x.height.toFixed(1) }; };
  const nav = document.querySelector('${NAV}');
  if (!nav) return { absent: true, title: document.title };
  const liens = [...nav.querySelectorAll("a")].map((a) => {
    const r = document.createRange(); r.selectNodeContents(a); const t = r.getBoundingClientRect();
    return { mot: a.textContent.trim(), href: a.getAttribute("href"), courant: a.getAttribute("aria-current"), ...B(a),
      centreMot: +((t.left + t.right) / 2).toFixed(1), centre: +((B(a).x + B(a).d) / 2).toFixed(1) }; });
  const boite = [...nav.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3);
  const segment = boite?.lastElementChild; const trait = segment?.firstElementChild;
  return { nav: B(nav), liens, segment: B(segment), trait: trait ? { ...B(trait), fond: getComputedStyle(trait).backgroundColor, enfants: trait.children.length } : null,
    radios: nav.querySelectorAll("[role=radio]").length, title: document.title,
    canonique: document.querySelector("link[rel=canonical]")?.getAttribute("href") ?? null,
    url: location.pathname + location.search };
}`;
const sonderVV = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE_VV);
//  LES PAGES DE GALERIES : le fil (doigt), le panneau (web), la page vide.
const SONDE_PAGE = `() => {
  const visible = (n) => Boolean(n) && n.getClientRects().length > 0;
  const fil = document.querySelector("[data-fil-de-galerie]");
  const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")].map((li) => {
    const cadre = li.querySelector("[data-cadre-de-galerie]");
    const pastille = [...(cadre?.querySelectorAll("*") ?? [])].map((e) => e.textContent.trim()).find((t) => /^\\d+\\/\\d+$/.test(t)) ?? null;
    const pied = li.querySelector("[data-pied-de-fil]");
    //  nº 874-§4 — plus de surtitre : l'en-tête est la boîte du titre, et
    //  le compteur s'assoit sur sa ligne.
    const titre = li.querySelector("[data-titre-galerie]");
    const compteur = li.querySelector("[data-compteur-galerie]");
    //  L'EN-TÊTE de la carte : la boîte qui porte les marges du fil,
    //  c'est-à-dire le premier enfant de la carte — jamais la rangée du
    //  titre, qui vit dedans.
    const entete = li.firstElementChild;
    return { serie: li.dataset.galerieSerie, surtitre: li.querySelector("[data-surtitre-galerie]")?.textContent.trim(), titre: titre?.textContent.trim(),
      pastille, compteur: compteur?.textContent.trim() ?? null,
      points: pied ? pied.querySelectorAll("button[aria-label^='View photo']").length : 0, pied: Boolean(pied),
      avatar: entete ? entete.querySelectorAll("img, svg").length : null, enTeteX: entete ? Math.round(entete.getBoundingClientRect().left) : null,
      titreX: titre ? Math.round(titre.getBoundingClientRect().left) : null, liens: cadre ? cadre.querySelectorAll("a").length : null,
      cadreG: cadre ? Math.round(cadre.getBoundingClientRect().left) : null, cadreD: cadre ? Math.round(cadre.getBoundingClientRect().right) : null };
  });
  //  Les bandes par style : parties au doigt (nº 873) puis au web
  //  (nº 876) — la sonde garde le compte, qui doit rester à zéro.
  const bandes = [...document.querySelectorAll('[data-galeries] [data-galerie-serie]')];
  const vide = document.querySelector("[data-page-vide]");
  const nav = document.querySelector('${NAV}');
  return { filVisible: visible(fil), cartes, bandesVisibles: bandes.filter(visible).length, bandes: bandes.length,
    vide: vide ? { texte: vide.querySelector("p")?.textContent.trim(), bouton: vide.querySelector("a")?.textContent.trim(), href: vide.querySelector("a")?.getAttribute("href") } : null,
    filY: fil && visible(fil) ? Math.round(fil.getBoundingClientRect().top) : null, navBas: nav ? Math.round(nav.parentElement.getBoundingClientRect().bottom) : null,
    vuePhoto: Boolean(document.querySelector("[data-vue-photo]")), lecture: getComputedStyle(document.querySelector("[data-colonne-lecture]") ?? document.body).display,
    y: Math.round(scrollY), url: location.pathname + location.search };
}`;
const sonderPage = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE_PAGE);
const onglet = (page, mot) => page.locator(`${NAV} a`).filter({ hasText: new RegExp(`^${mot}$`) }).first();
/*  ██ TOUCHER UN ONGLET SANS DÉPLACER LA PAGE ██
    `tap()` et `click()` amènent d'abord leur cible « à l'écran »
    (`scrollIntoViewIfNeeded`) : sur une rangée COLLANTE — déjà visible,
    par construction —, le navigateur défile quand même, en douceur (la
    feuille du site pose `scroll-behavior: smooth`). Mesuré : la page
    passait de 600 à 451 AVANT le clic, et le site mémorisait 451 — ce
    qui est juste, mais ce n'est pas ce que le banc voulait éprouver.
    On envoie donc l'événement de clic directement : c'est le même clic
    pour le lien (le routeur et `surClic` s'en saisissent), sans le
    défilement d'approche. Un vrai doigt, lui, ne déplace pas la page. */
const toucherLOnglet = (page, mot) => onglet(page, mot).dispatchEvent("click");
const proche = (a, b, marge = 1.5) => a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;
//  UN BALAYAGE, à la main (le navigateur d'un banc n'a pas de doigt) : les
//  touchers que la page écoute (lib/glissement-lateral), d'un point de la
//  colonne de lecture — hors des bords (24) et loin au-delà du seuil (64).
const balayer = (page, x1, x2, y) => page.evaluate(([x1, x2, y]) => {
  const cible = document.elementFromPoint(x1, y);
  if (!cible) return false;
  const doigt = (x) => new Touch({ identifier: 1, target: cible, clientX: x, clientY: y, pageX: x, pageY: y + scrollY });
  const ev = (type, x, fin = false) => new TouchEvent(type, { bubbles: true, cancelable: true,
    touches: fin ? [] : [doigt(x)], targetTouches: fin ? [] : [doigt(x)], changedTouches: [doigt(x)] });
  cible.dispatchEvent(ev("touchstart", x1));
  const pas = (x2 - x1) / 4;
  for (let k = 1; k <= 4; k += 1) cible.dispatchEvent(ev("touchmove", x1 + pas * k));
  cible.dispatchEvent(ev("touchend", x2, true));
  return true;
}, [x1, x2, y]);

//  ══ 1 · TROIS ADRESSES, TROIS TITRES, TROIS CANONIQUES, LES 301 ═════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`873 · §1 — ${mode} : trois adresses, trois titres, trois canoniques`);
    const pages = {};
    for (const [vue, chemin] of [["profil", `/artist/${SLUG}?entree=lien`], ["portfolio", `/artist/${SLUG}/portfolio`], ["flash", `/artist/${SLUG}/flash`]]) {
      const reponse = await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
      await page.waitForSelector(NAV, { timeout: 20000 });
      await page.waitForTimeout(800);
      pages[vue] = { statut: reponse?.status(), ...(await sonderVV(page)) };
    }
    verif("les trois adresses répondent 200", Object.values(pages).every((p) => p.statut === 200), JSON.stringify(Object.values(pages).map((p) => p.statut)));
    verif("le profil garde son titre « Banc 873 — tattoo artist in … »", /^Banc 873 — tattoo artist in .+/.test(pages.profil.title), pages.profil.title);
    verif("le portfolio titre « Banc 873 — tattoo portfolio in … »", /^Banc 873 — tattoo portfolio in .+/.test(pages.portfolio.title), pages.portfolio.title);
    verif("les flashs titrent « Banc 873 — flash tattoos in … »", /^Banc 873 — flash tattoos in .+/.test(pages.flash.title), pages.flash.title);
    verif("trois titres distincts", new Set(Object.values(pages).map((p) => p.title)).size === 3);
    verif("chaque page a SA canonique", pages.profil.canonique?.endsWith(`/artist/${SLUG}`) && pages.portfolio.canonique?.endsWith(`/artist/${SLUG}/portfolio`) && pages.flash.canonique?.endsWith(`/artist/${SLUG}/flash`),
      JSON.stringify(Object.values(pages).map((p) => p.canonique)));
    verif("l'onglet actif est la page (aria-current), et il change avec elle",
      pages.profil.liens[0]?.courant === "page" && pages.portfolio.liens[1]?.courant === "page" && pages.flash.liens[2]?.courant === "page" &&
      Object.values(pages).every((p) => p.liens.filter((l) => l.courant === "page").length === 1),
      JSON.stringify(Object.values(pages).map((p) => p.liens.map((l) => l.courant))));

    titre(`873 · §1 — ${mode} : les anciennes adresses redirigent en 301`);
    for (const [ancienne, nouvelle] of [
      [`/artist/${SLUG}?onglet=portfolio`, `/artist/${SLUG}/portfolio`],
      [`/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO(0, 2)}&entree=portfolio`, `/artist/${SLUG}/portfolio`],
      [`/artist/${SLUG}?style=blackwork&rendu=black&nature=flash&photo=${PHOTO(2, 1)}&entree=portfolio`, `/artist/${SLUG}/flash`],
    ]) {
      const r = await page.request.get(`${BASE}${ancienne}`, { maxRedirects: 0 });
      const ou = r.headers()["location"] ?? "";
      verif(`${ancienne.replace(SLUG, "<nom>").slice(0, 70)} → 301 vers ${nouvelle.replace(SLUG, "<nom>")}`,
        r.status() === 301 && new URL(ou, BASE).pathname === nouvelle && new URL(ou, BASE).search === "", `${r.status()} · ${ou}`);
    }
    //  Un lien partagé (les tags SANS consigne) n'est pas concerné : la vue
    //  photo de la nº 862 reste sa destination.
    const partage = await page.request.get(`${BASE}/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO(0, 2)}`, { maxRedirects: 0 });
    verif("un lien partagé (tags sans consigne) répond 200, sans redirection", partage.status() === 200, String(partage.status()));

    titre(`873 · §1/§2 — ${mode} : le va-et-vient, trois liens, chacun un tiers, le trait sur toute la largeur`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector(NAV, { timeout: 20000 });
    await page.waitForTimeout(800);
    const v = await sonderVV(page);
    verif("trois LIENS — Profile · Portfolio · Flash —, aucun bouton radio",
      v.liens?.map((l) => l.mot).join(" · ") === "Profile · Portfolio · Flash" && v.radios === 0, `${v.liens?.map((l) => l.mot).join(" · ")} · ${v.radios} radio(s)`);
    verif("… vers les trois adresses (le profil par le lien interne du site)",
      v.liens?.[0]?.href === `/artist/${SLUG}?entree=lien` && v.liens?.[1]?.href === `/artist/${SLUG}/portfolio` && v.liens?.[2]?.href === `/artist/${SLUG}/flash`,
      JSON.stringify(v.liens?.map((l) => l.href)));
    verif("chaque onglet fait un tiers de la rangée, le mot centré dans le sien",
      v.liens?.every((l) => proche(l.w, v.nav.w / 3) && proche(l.centreMot, l.centre, 2)), JSON.stringify(v.liens?.map((l) => [l.w, l.centreMot, l.centre])));
    verif("§2 — LE TRAIT PREND TOUTE LA LARGEUR DE L'ONGLET (plus de trait court)",
      v.trait && v.segment && proche(v.trait.w, v.segment.w, 0.6) && proche(v.trait.w, v.nav.w / 3) && v.trait.enfants === 0 && v.trait.h === 3 && v.trait.fond !== "rgba(0, 0, 0, 0)",
      `trait ${v.trait?.w} · segment ${v.segment?.w} · tiers ${(v.nav?.w / 3).toFixed(1)} · enfants ${v.trait?.enfants}`);
    verif("… sous l'onglet actif (Profile), d'un bord à l'autre de l'onglet",
      v.trait && v.liens?.[0] && proche(v.trait.x, v.liens[0].x, 0.6) && proche(v.trait.d, v.liens[0].d, 0.6), `${v.trait?.x}→${v.trait?.d} contre ${v.liens?.[0]?.x}→${v.liens?.[0]?.d}`);

    titre(`873 · §1 — ${mode} : la navigation douce, et chaque page garde sa position`);
    await page.evaluate(() => { window.__banc873 = "vivant"; });
    await toucherLOnglet(page, "Portfolio");
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/portfolio` && document.querySelector('nav[aria-label="Profile, portfolio or flash"] a[aria-current="page"]')?.textContent.trim() === "Portfolio", SLUG, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const doux = await page.evaluate(() => ({ vivant: window.__banc873 === "vivant", y: Math.round(scrollY), titre: document.title }));
    verif("l'onglet Portfolio NAVIGUE en douceur (le document n'est pas rechargé) et le titre est celui de la page",
      doux.vivant && /tattoo portfolio in/.test(doux.titre), `document vivant ${doux.vivant} · ${doux.titre}`);
    verif("… et une première visite arrive en haut", doux.y === 0, `${doux.y}`);
    //  LA SURFACE QUI DÉFILE : la page au doigt, la colonne de lecture au
    //  web (la page n'y bouge pas).
    const defiler = (y) => page.evaluate((y) => {
      if (document.documentElement.dataset.appareil === "mobile") { window.scrollTo({ top: y, behavior: "instant" }); return { max: document.documentElement.scrollHeight - innerHeight }; }
      const c = document.querySelector("[data-colonne-lecture]"); c.scrollTop = y; return { max: c.scrollHeight - c.clientHeight };
    }, y);
    const position = () => page.evaluate(() => document.documentElement.dataset.appareil === "mobile" ? Math.round(scrollY) : Math.round(document.querySelector("[data-colonne-lecture]").scrollTop));
    const { max } = await defiler(600);
    const CIBLE = Math.min(600, max);
    await page.waitForTimeout(700);
    verif(`la page Portfolio se défile à ${CIBLE} (course ${max})`, CIBLE >= 100 && (await position()) === CIBLE, `${await position()} / ${CIBLE}`);
    await toucherLOnglet(page, "Flash");
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/flash`, SLUG, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const surFlash = await position();
    verif("Flash s'ouvre en haut (sa position à elle : jamais visitée)", surFlash === 0, `${surFlash}`);
    await toucherLOnglet(page, "Portfolio");
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/portfolio`, SLUG, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const retourOnglet = await position();
    verif(`RETOUR PAR L'ONGLET : Portfolio retrouve ${CIBLE}`, retourOnglet === CIBLE, `${retourOnglet} / ${CIBLE}`);
    /*  ██ §1 (nº 875) — LE RETOUR NE PROMÈNE PLUS DANS LES ONGLETS ██
        CE QUE CE BANC ÉPROUVAIT ICI, ET QUI N'A PLUS COURS : « chaque
        onglet suivi a posé une entrée — quatre retours rendent le
        profil ». Le propriétaire a RENVERSÉ la règle à la nº 875 :
        changer d'onglet REMPLACE l'étape courante, il n'en ajoute
        jamais, et un seul retour rend la page d'où l'on est arrivé.
        LE PARCOURS ENTIER EST ÉPROUVÉ AU BANC 875 (les trois
        va-et-vient, dix touchers, un retour, positions comprises) — on
        n'en garde ici que ce qui appartient à CE banc : les touchers
        n'ajoutent aucune étape. Les positions par page, elles, ne
        changent pas d'un pixel : c'est ce que les deux vérifications
        ci-dessus viennent de mesurer. */
    const avantOnglets = await page.evaluate(() => history.length);
    await toucherLOnglet(page, "Flash");
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/flash`, SLUG, { timeout: 15000 });
    await page.waitForTimeout(1000);
    await toucherLOnglet(page, "Profile");
    await page.waitForTimeout(1000);
    const apresOnglets = await page.evaluate(() => history.length);
    verif("§1 (nº 875) — changer d'onglet n'ajoute aucune étape d'historique",
      apresOnglets === avantOnglets, `${avantOnglets} → ${apresOnglets}`);
  } catch (e) {
    verif(`déroulement du banc 873 (§1/§2 ${mode})`, false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

//  ══ 1 · LE PLAN DU SITE ANNONCE LES TROIS PAGES ════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("873 · §1 — le plan du site : trois adresses par portfolio");
    const plan = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
    const compte = (chemin) => (plan.match(new RegExp(`/artist/demo-blackwork-12${chemin}</loc>`, "g")) ?? []).length;
    verif("une fiche de démonstration y a son profil, son portfolio et ses flashs",
      compte("") === 1 && compte("/portfolio") === 1 && compte("/flash") === 1, `${compte("")} · ${compte("/portfolio")} · ${compte("/flash")}`);
  } catch (e) {
    verif("déroulement du banc 873 (plan du site)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · AU DOIGT, LE FIL DE GALERIES ; AU WEB, LES GALERIES PAR STYLE ══
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`873 · §3 — ${mode} : la page Portfolio`);
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForSelector(NAV, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const p = await sonderPage(page);
    verif("la colonne de lecture est affichée, ce n'est pas une vue photo", !p.vuePhoto && p.lecture !== "none", `vue photo ${p.vuePhoto} · lecture ${p.lecture}`);
    if (mode === "doigt") {
      verif("LE FIL DE GALERIES est la page : six cartes, les six galeries de TATTOOS, dans l'ordre du profil",
        p.filVisible && p.cartes.map((c) => c.serie).join(" ") === TATTOOS.join(" "), `${p.filVisible} · ${p.cartes.map((c) => c.serie).join(" ")}`);
      verif("… coiffées de leur SEUL titre (« Blackwork • Black »), sans avatar ni surtitre (nº 874-§4)",
        p.cartes.every((c) => c.surtitre === undefined && c.avatar === 0) && p.cartes[0]?.titre === "Blackwork • Black" && p.cartes[2]?.titre === "Realism • Black",
        JSON.stringify(p.cartes.map((c) => [c.surtitre, c.titre, c.avatar])));
      verif("… le titre à seize du bord, dans la boîte de l'en-tête du fil (plus de rond)", p.cartes.every((c) => c.titreX === 16 && c.enTeteX === 0), JSON.stringify(p.cartes.map((c) => [c.enTeteX, c.titreX])));
      verif("la galerie de cinq : le compteur « 1/5 » sur la ligne du titre, rien dans la photo, les points, le pied",
        p.cartes[0]?.compteur === "1/5" && p.cartes[0].pastille === null && p.cartes[0].points === 5 && p.cartes[0].pied, JSON.stringify(p.cartes[0]));
      verif("LA GALERIE D'UNE PHOTO : même carte, aucun compteur, pas de points, le pied gardé",
        p.cartes[2] && p.cartes[2].compteur === null && p.cartes[2].pastille === null && p.cartes[2].points === 0 && p.cartes[2].pied && p.cartes[2].cadreG === 0 && p.cartes[2].cadreD === 390, JSON.stringify(p.cartes[2]));
      verif("plus de bandes par style au doigt", p.bandesVisibles === 0, `${p.bandesVisibles} visible(s) sur ${p.bandes}`);
      /*  ⚠️ nº 879-§3 — VINGT-QUATRE, ET PLUS QUARANTE : le propriétaire
          veut que l'air au-dessus de la première carte vaille CELUI QUI
          SÉPARE DEUX CARTES — la gouttière de la liste (`gap-y-6`),
          mesurée aux deux appareils. C'est le seul nombre qui change
          ici ; le banc 879 compare les deux airs l'un à l'autre. */
      /*  ⚠️ nº 880-§1 — VINGT-HUIT AU DOIGT : le propriétaire a trouvé
          les vingt-quatre de la nº 879 trop petits sur son téléphone, et
          l'air y monte d'un cran de l'échelle. LE WEB GARDE SES
          VINGT-QUATRE (le banc 880 tient les deux valeurs). */
      verif("vingt-huit pixels d'air entre la rangée du va-et-vient (son trait) et le fil (nº 880-§1)", p.filY !== null && p.navBas !== null && p.filY - p.navBas === 28, `${p.filY} − ${p.navBas}`);
      verif("aucune photo n'est un lien", p.cartes.every((c) => c.liens === 0), JSON.stringify(p.cartes.map((c) => c.liens)));
      titre("873 · §3 — doigt : toucher une photo ne fait rien");
      const avant = await page.evaluate(() => location.pathname + location.search + " " + Math.round(scrollY));
      await page.locator("[data-carte-de-galerie]").first().locator("[data-cadre-de-galerie]").tap();
      await page.waitForTimeout(1200);
      const apres = await page.evaluate(() => location.pathname + location.search + " " + Math.round(scrollY));
      verif("ni navigation, ni mouvement", avant === apres && apres.startsWith(`/artist/${SLUG}/portfolio`), `${avant} → ${apres}`);

      titre("873 · §5 — doigt : le glissement latéral navigue entre voisins");
      const yTitre = await page.evaluate(() => Math.round(document.querySelector("[data-carte-de-galerie] [data-titre-galerie]").getBoundingClientRect().top + 8));
      verif("le balayage est reçu par la page", await balayer(page, 330, 90, yTitre));
      await page.waitForFunction((s) => location.pathname === `/artist/${s}/flash`, SLUG, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      verif("vers la gauche : Portfolio → Flash", await page.evaluate(() => location.pathname) === `/artist/${SLUG}/flash`, await page.evaluate(() => location.pathname));
      const yFlash = await page.evaluate(() => Math.round(document.querySelector("[data-carte-de-galerie] [data-titre-galerie]").getBoundingClientRect().top + 8));
      await balayer(page, 330, 90, yFlash);
      await page.waitForTimeout(1000);
      verif("au bout de la rangée, rien : Flash n'a pas de voisin à gauche", await page.evaluate(() => location.pathname) === `/artist/${SLUG}/flash`);
      await balayer(page, 90, 330, yFlash);
      await page.waitForFunction((s) => location.pathname === `/artist/${s}/portfolio`, SLUG, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      verif("vers la droite : Flash → Portfolio", await page.evaluate(() => location.pathname) === `/artist/${SLUG}/portfolio`, await page.evaluate(() => location.pathname));
    } else {
      //  nº 876 — LE WEB MONTRE LE MÊME FIL QUE LE DOIGT : les six
      //  galeries de tattoos, une carte chacune, dans le même ordre.
      verif("LE WEB montre le fil de galeries — les six de tattoos, une carte chacune (nº 876)",
        p.filVisible && p.cartes.map((c) => c.serie).join(" ") === TATTOOS.join(" "), `${p.cartes.map((c) => c.serie).join(" ")} · fil ${p.filVisible}`);
    }

    titre(`873 · §3 — ${mode} : la page Flash`);
    await page.goto(`${BASE}/artist/${SLUG}/flash`, { waitUntil: "networkidle" });
    await page.waitForSelector(NAV, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const f = await sonderPage(page);
    if (mode === "doigt") {
      verif("une carte : la galerie de FLASHS, « Blackwork • Black », compteur « 1/3 » sur la ligne du titre",
        f.filVisible && f.cartes.length === 1 && f.cartes[0].serie === "flash·blackwork·black" && f.cartes[0].surtitre === undefined && f.cartes[0].compteur === "1/3" && f.cartes[0].avatar === 0,
        JSON.stringify(f.cartes));
    } else {
      verif("la galerie de flashs seule, en carte de fil (nº 876)", f.filVisible && f.cartes.length === 1 && f.cartes[0].serie === "flash·blackwork·black" && f.cartes[0].compteur === "1/3",
        JSON.stringify(f.cartes.map((c) => [c.serie, c.compteur])));
    }
    verif("aucune page vide ici", f.vide === null);
  } catch (e) {
    verif(`déroulement du banc 873 (§3 ${mode})`, false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

//  ══ 4 · LES PAGES VIDES ══════════════════════════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    for (const [nom, slug, chemin, phrase] of [
      ["sans flash → « No flash yet. »", SANS_FLASH, "flash", "No flash yet."],
      ["sans tattoo → « No tattoos yet. »", SANS_TATTOO, "portfolio", "No tattoos yet."],
    ]) {
      titre(`873 · §4 — ${mode} : ${nom}`);
      await page.goto(`${BASE}/artist/${slug}/${chemin}`, { waitUntil: "networkidle" });
      await page.waitForSelector(NAV, { timeout: 20000 });
      await page.waitForTimeout(1000);
      const v = await sonderPage(page);
      const vv = await sonderVV(page);
      verif(`la page dit « ${phrase} », avec la capsule « Explore styles » de l'écran vide du site`,
        v.vide?.texte === phrase && v.vide.bouton === "Explore styles" && v.vide.href === "/", JSON.stringify(v.vide));
      verif("ni fil, ni galerie, ni bande", !v.filVisible && v.cartes.length === 0 && v.bandesVisibles === 0);
      verif("le va-et-vient a toujours ses trois onglets, l'actif étant la page",
        vv.liens?.map((l) => l.mot).join(" · ") === "Profile · Portfolio · Flash" && vv.liens.find((l) => l.courant === "page")?.mot === (chemin === "flash" ? "Flash" : "Portfolio"),
        JSON.stringify(vv.liens?.map((l) => [l.mot, l.courant])));
    }
  } catch (e) {
    verif(`déroulement du banc 873 (§4 ${mode})`, false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

//  ══ LA VUE PHOTO N'A PAS BOUGÉ (doigt) ═══════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("873 · la vue photo d'un lien partagé, au doigt, est celle de la nº 862 — inchangée");
    await page.goto(`${BASE}/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO(0, 3)}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => ({
      vuePhoto: Boolean(document.querySelector("[data-vue-photo]")), lecture: getComputedStyle(document.querySelector("[data-colonne-lecture]")).display,
      enTete: Boolean(document.querySelector("[data-habillage-photo] [data-en-tete-de-fil]")), pieds: document.querySelectorAll("[data-pied-de-fil]").length,
      fil: document.querySelector("[data-fil-de-galerie]")?.getClientRects().length ?? 0,
      compteur: document.querySelector("[data-photo-fiche] [data-role='compteur']")?.textContent ?? null }));
    verif("vue photo, colonne retirée, en-tête et pied du fil, aucun fil de galeries, ouverte sur la photo (3/5)",
      v.vuePhoto && v.lecture === "none" && v.enTete && v.pieds === 1 && v.fil === 0 && v.compteur === "3/5", JSON.stringify(v));
  } catch (e) {
    verif("déroulement du banc 873 (vue photo)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
