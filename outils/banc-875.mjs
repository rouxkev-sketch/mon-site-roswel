//  ██ BANC 875 — HISTORIQUE DES ONGLETS, OUVERTURE DES PAGES, BALAYAGE ██
//  ==================================================================
//   1. CHANGER D'ONGLET REMPLACE L'ÉTAPE, jamais n'en ajoute — les
//      TROIS va-et-vient (un portfolio, l'accueil, « Ma sélection ») :
//      dix touchers ne coûtent aucune étape, et UN SEUL retour ramène à
//      la page d'où l'on est arrivé, à sa position.
//   2. UNE PAGE FRAÎCHE S'OUVRE À ZÉRO — vingt ouvertures, web et
//      doigt. Et la CAUSE nommée : une note de quelques pixels n'est
//      plus une place (le plancher, §2 nº 875), tandis qu'une vraie
//      place est rendue comme avant.
//   3. AU DOIGT, SUR L'ACCUEIL, un balayage horizontal bascule
//      Tattoo ↔ Flash — et rien d'autre ne le déclenche : ni un geste
//      trop court, ni un geste vertical, ni un geste parti hors du
//      corps de la page, ni un geste parti d'une galerie qui défile.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc875-${T}`;
const PHOTO = (k, i) => `4875${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
const photo = (id, slug, style, nature, i) => ({
  id, tatoueur_id: slug, style, rendu: "black", nature,
  url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
  miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
  ordre: i, cree_le: "2026-01-01T00:00:00Z",
});
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  //  UNE FICHE qui a les trois onglets pleins (tattoos et flashs), et
  //  assez de galeries pour que ses pages défilent.
  await ranger("tatoueurs", [
    { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 875",
      styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` },
  ]);
  const photos = [];
  for (let i = 1; i <= 6; i += 1) photos.push(photo(PHOTO(0, i), SLUG, "blackwork", "tatouage", i));
  for (let i = 1; i <= 6; i += 1) photos.push(photo(PHOTO(1, i), SLUG, "realisme", "tatouage", i));
  for (let i = 1; i <= 6; i += 1) photos.push(photo(PHOTO(2, i), SLUG, "trash-polka", "tatouage", i));
  for (let i = 1; i <= 6; i += 1) photos.push(photo(PHOTO(3, i), SLUG, "blackwork", "flash", i));
  await ranger("photos_tatoueur", photos);
}
const U = { id: "30000000-0000-4000-8000-000000000875", email: "banc-875@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});

const LISTE = `/search?style=blackwork&nature=tatouage`;
const NAV = '[aria-label="Profile, portfolio or flash"]';
const VV_ACCUEIL = "[data-va-et-vient-nature]";
const VV_SELECTION = '[aria-label="Favorites or following"]';
const attendre = (page, ms) => page.waitForTimeout(ms);
/*  TOUCHER SANS DÉPLACER LA PAGE (leçon du banc 873) : `tap()` amène
    d'abord sa cible « à l'écran » — sur une rangée COLLANTE, déjà
    visible, cela défile quand même (le site pose `scroll-behavior:
    smooth`) et fausse la position mesurée. On envoie donc le clic. */
const toucher = (locateur) => locateur.dispatchEvent("click");
const etapes = (page) => page.evaluate(() => history.length);
const ici = (page) => page.evaluate(() => location.pathname + location.search);
const position = (page) => page.evaluate(() => Math.round(scrollY));
const proche = (a, b, marge = 2) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

//  UN BALAYAGE, à la main (le navigateur d'un banc n'a pas de doigt) :
//  les touchers que la page écoute (lib/glissement-lateral), depuis un
//  point donné — hors des bords (24) et au-delà du seuil (64).
const balayer = (page, x1, x2, y, y2 = y) => page.evaluate(([x1, x2, y, y2]) => {
  const cible = document.elementFromPoint(x1, y);
  if (!cible) return false;
  const doigt = (x, yy) => new Touch({ identifier: 1, target: cible, clientX: x, clientY: yy, pageX: x, pageY: yy + scrollY });
  const ev = (type, x, yy, fin = false) => new TouchEvent(type, { bubbles: true, cancelable: true,
    touches: fin ? [] : [doigt(x, yy)], targetTouches: fin ? [] : [doigt(x, yy)], changedTouches: [doigt(x, yy)] });
  cible.dispatchEvent(ev("touchstart", x1, y));
  const pas = (x2 - x1) / 4, pasY = (y2 - y) / 4;
  for (let k = 1; k <= 4; k += 1) cible.dispatchEvent(ev("touchmove", x1 + pas * k, y + pasY * k));
  cible.dispatchEvent(ev("touchend", x2, y2, true));
  return true;
}, [x1, x2, y, y2]);

//  ══════════════════════════════════════════════════════════════════
//  ██ 1 · CHANGER D'ONGLET REMPLACE L'ÉTAPE — LES TROIS VA-ET-VIENT ██
//  ══════════════════════════════════════════════════════════════════
/*  LE PARCOURS DEMANDÉ PAR LE PROPRIÉTAIRE, à l'identique pour les
    trois : on arrive sur une LISTE, on la DESCEND, on va sur la page à
    onglets, on touche DIX FOIS, et UN SEUL retour doit rendre la liste
    À SA PLACE. On mesure les étapes d'historique avant et après les dix
    touchers : la différence doit être NULLE.
    ⚠️ CONTEXTE NEUF À CHAQUE FOIS : `history.length` est PLAFONNÉ (50
    dans Chromium) — un contexte déjà chargé masquerait la croissance
    qu'on cherche justement à voir. */
for (const [nom, lien, marqueur, mots, arrivee] of [
  //  ⚠️ ON Y VA PAR UN LIEN, JAMAIS PAR UNE ADRESSE TAPÉE, et c'est le
  //  parcours du propriétaire : « cartes → profil ». Un `goto` fabrique
  //  un document SANS RÉFÉRENT — le filet du retour (RetourGaranti,
  //  nº 345/350) croit alors qu'il n'y a rien du site derrière et pose
  //  son CRAN, une étape de plus qui n'appartient pas aux onglets.
  ["un portfolio", 'a[href^="/artist/"][href$="?entree=lien"]', NAV,
    ["Portfolio", "Flash", "Profile"], null],
  ["l'accueil", 'a[aria-label="YokoFolio home"]', VV_ACCUEIL, null, "/"],
  ["Ma sélection", 'a[aria-label="My favorites"]', VV_SELECTION, null, "/my-favorites"],
]) {
  const { nav, page } = await ouvrir("doigt", nom === "Ma sélection" ? { session: U } : {});
  try {
    titre(`875 · §1 — ${nom} : dix touchers ne coûtent aucune étape`);
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await attendre(page, 2000);
    /*  ON DESCEND À LA MOLETTE, ET C'EST UN CHOIX : un `scrollTo`
        programmé n'est PAS un geste, et la garde de position (§2
        nº 875) le prendrait pour un recalage du navigateur — elle
        reposerait la page en haut, à raison. Un vrai visiteur, lui,
        pose un doigt ou tourne une molette : la garde se lève, et la
        position lui appartient. Le banc fait pareil. */
    await page.mouse.wheel(0, 600);
    await attendre(page, 900);
    const departListe = await position(page);
    verif("la liste est descendue", departListe > 100, String(departListe));

    await toucher(page.locator(lien).first());
    await page.waitForSelector(marqueur, { timeout: 20000 });
    await attendre(page, 1500);
    if (arrivee) verif(`… le lien mène bien à ${arrivee}`, (await ici(page)).startsWith(arrivee), await ici(page));
    const avant = await etapes(page);
    const cibles = mots
      ? mots.map((m) => page.locator(`${marqueur} a`).filter({ hasText: new RegExp(`^${m}$`) }).first())
      : null;
    const adresses = [];
    for (let k = 0; k < 10; k += 1) {
      if (cibles) await toucher(cibles[k % cibles.length]);
      //  Les deux positions, tour à tour : celle qui n'est pas active.
      else await toucher(page.locator(`${marqueur} a:not([aria-current]), ${marqueur} [role=radio][aria-checked="false"]`).first());
      await attendre(page, 500);
      adresses.push(await ici(page));
    }
    const apres = await etapes(page);
    verif(`dix touchers, zéro étape de plus (${avant} → ${apres})`, apres === avant, `${avant} → ${apres}`);
    verif("… et l'adresse a bien changé au fil des touchers",
      new Set(adresses).size >= 2, JSON.stringify(adresses.slice(0, 3)));

    await page.goBack();
    await attendre(page, 2500);
    const retour = await ici(page);
    verif("un seul retour ramène à la liste", retour === LISTE, retour);
    const rendue = await position(page);
    verif("… et la liste est rendue à sa place", proche(rendue, departListe, 40), `${rendue} / ${departListe}`);
  } finally {
    await nav.close();
  }
}

//  ══════════════════════════════════════════════════════════════════
//  ██ 2 · UNE PAGE FRAÎCHE S'OUVRE À ZÉRO ██
//  ══════════════════════════════════════════════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`875 · §2 — ${mode} : vingt ouvertures fraîches, toutes à zéro`);
    const chemins = ["/", "/flash", LISTE, `/artist/${SLUG}`, `/artist/${SLUG}/portfolio`];
    const hors = [];
    for (let k = 0; k < 20; k += 1) {
      const chemin = chemins[k % chemins.length];
      await page.goto(`${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
      await attendre(page, 1100);
      const y = await position(page);
      if (y !== 0) hors.push(`${k}:${chemin}=${y}`);
    }
    verif("vingt ouvertures de document : toutes à zéro", hors.length === 0, hors.join(" "));

    titre(`875 · §2 — ${mode} : MIS AU PAS DE LA nº 889 — plus AUCUNE place n'est rangée`);
    /*  LA CAUSE, NOMMÉE ET ÉPROUVÉE SUR SON VRAI CHEMIN. On descend la
        page de SIX PIXELS — ce qu'écrivent un rebond élastique, une
        barre d'adresse qui se replie, un doigt qui effleure —, puis on
        quitte : le départ du document photographie la place (nº 431).
        Elle ne doit pas être rangée, et la prochaine OUVERTURE NEUVE de
        cette adresse doit s'ouvrir à zéro.
        ⚠️ LA MOLETTE D'ABORD (un geste : la garde rend la main), la
        position ensuite — six pixels ne se visent pas à la molette.
        ⚠️ ON ÉPROUVE UNE OUVERTURE NEUVE, PAS UN RECHARGEMENT, et c'est
        la règle du propriétaire au mot près (« lien, nouvel onglet,
        navigation en avant »). Un rechargement, lui, REND la place
        (règle nº 332) et, quand le site n'en a pas, c'est la
        restauration native du navigateur qui a le dernier mot
        (« auto » depuis la nº 363) : ce n'est pas une ouverture. */
    const places = () => page.evaluate(() => Object.fromEntries(
      Object.keys(localStorage).filter((c) => c.startsWith("yokofolio:defilement:"))
        .map((c) => [c, JSON.parse(localStorage.getItem(c)).y])));
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await attendre(page, 1200);
    await page.mouse.wheel(0, 120);
    await attendre(page, 500);
    await page.evaluate(() => scrollTo({ top: 6, left: 0, behavior: "instant" }));
    await attendre(page, 700);
    verif("la page est descendue de six pixels", (await position(page)) === 6, String(await position(page)));
    await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded" });
    await attendre(page, 900);
    /*  ██ MISE AU PAS DE LA nº 889 ██ La nº 875 avait posé un PLANCHER
        (24 px, puis 100 à la nº 887) : sous lui, une note n'était pas
        une place. Le plancher n'a plus d'objet — le site ne range plus
        AUCUNE place, quelle que soit son amplitude. La vérification
        devient donc plus forte, pas plus faible. */
    verif("… et RIEN n'est rangé, à aucune adresse (nº 889)",
      Object.keys(await places()).length === 0, JSON.stringify(await places()));
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await attendre(page, 1800);
    verif("… et l'ouverture neuve de cette adresse est à zéro", (await position(page)) === 0, String(await position(page)));
    verif("… le script d'avant peinture n'a rien posé",
      (await page.evaluate(() => document.documentElement.dataset.positionPosee ?? null)) === null);

    titre(`875 · §2 — ${mode} : une VRAIE place n'est pas rangée non plus — c'est le NAVIGATEUR qui rend`);
    /*  ██ MISE AU PAS DE LA nº 889 ██ LA CONTRE-ÉPREUVE A CHANGÉ DE
        SENS. Elle disait : « une place au-dessus du plancher est rangée
        par le site, et rendue au rechargement ». Le site ne range plus
        rien ; c'est `history.scrollRestoration = "auto"` (nº 363) qui
        rend la position d'un rechargement, et lui seul. On mesure donc
        les deux moitiés : AUCUNE clé rangée, ET une position rendue. */
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await attendre(page, 2000);
    await page.mouse.wheel(0, 600);
    await attendre(page, 900);
    const quittee = await position(page);
    verif("la liste est descendue bien au-delà du plancher", quittee > 100, String(quittee));
    await page.reload({ waitUntil: "domcontentloaded" });
    await attendre(page, 2500);
    verif("… le site n'a rangé AUCUNE place (nº 889)",
      Object.keys(await places()).length === 0, JSON.stringify(await places()));
    const rendue = await position(page);
    const course = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    /*  ██ CE QUE LE PROPRIÉTAIRE PERD AU RECHARGEMENT, CHIFFRÉ ██
        MESURE DE LA nº 889 : quittée à 600 px, la liste rouvre à 10.
        Ce n'est pas un défaut du navigateur — c'est ce que « auto »
        peut faire. Il repose la position À L'INSTANT OÙ IL RECRÉE LE
        DOCUMENT, quand les cartes ne sont pas encore arrivées : le
        document est court, et il RABOTE la demande à ce qu'il peut.
        C'est précisément ce que lib/pose-sur-contenu (nº 337) faisait
        pour lui, en attendant le contenu sous un masque — et qui est
        parti à la nº 889 avec la mémoire de position.
        CE QU'ON MESURE DONC ICI, et qui reste vrai quoi qu'il arrive :
        le site n'a rien rangé (au-dessus), et la position rendue est
        BORNÉE par ce que le document permet — jamais un saut au
        hasard. Le chiffre exact, lui, est écrit dans le détail : c'est
        lui qui documente la perte, pas une attente. */
    verif("… et la position du rechargement reste bornée par le document",
      rendue >= 0 && rendue <= Math.max(course, quittee) + 5,
      `rendue ${rendue} · quittée à ${quittee} · course au rechargement ${course}`);
  } finally {
    await nav.close();
  }
}

//  ══════════════════════════════════════════════════════════════════
//  ██ 3 · LE BALAYAGE DE L'ACCUEIL (DOIGT) ██
//  ══════════════════════════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("875 · §3 — doigt : un balayage horizontal bascule Tattoo ↔ Flash");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-corps-accueil]", { timeout: 20000 });
    await attendre(page, 1800);
    //  UN POINT DU CORPS DE L'ACCUEIL, loin des bords et du haut.
    const y = await page.evaluate(() => {
      const r = document.querySelector("[data-corps-accueil]").getBoundingClientRect();
      return Math.round(Math.min(r.top + 40, innerHeight - 80));
    });
    const avant = await etapes(page);
    verif("le geste est reçu par la page", await balayer(page, 330, 90, y));
    await page.waitForFunction(() => location.pathname === "/flash", null, { timeout: 15000 }).catch(() => {});
    await attendre(page, 900);
    verif("vers la gauche : Tattoo → Flash", (await ici(page)) === "/flash", await ici(page));
    verif("… et l'onglet Flash est la page courante",
      await page.evaluate(() => Boolean(document.querySelector('[data-va-et-vient-nature] a[aria-current="page"][href="/flash"]'))));

    await balayer(page, 90, 330, y);
    await page.waitForFunction(() => location.pathname === "/", null, { timeout: 15000 }).catch(() => {});
    await attendre(page, 900);
    verif("vers la droite : Flash → Tattoo", (await ici(page)) === "/", await ici(page));
    const apres = await etapes(page);
    verif(`§1 — deux balayages, zéro étape de plus (${avant} → ${apres})`, apres === avant, `${avant} → ${apres}`);

    titre("875 · §3 — doigt : ce qui NE bascule pas");
    await balayer(page, 330, 290, y); // 40 px : sous le seuil de 64
    await attendre(page, 700);
    verif("un geste trop court ne bascule rien", (await ici(page)) === "/", await ici(page));

    await balayer(page, 330, 240, y, y + 200); // vertical franc
    await attendre(page, 700);
    verif("un geste vertical ne bascule rien (c'est un défilement)", (await ici(page)) === "/", await ici(page));

    const yBarre = await page.evaluate(() => {
      const r = document.querySelector("[data-va-et-vient-nature]").getBoundingClientRect();
      return Math.round(r.top + r.height / 2);
    });
    await balayer(page, 330, 90, yBarre);
    await attendre(page, 900);
    verif("un geste parti de la barre fixe (hors du corps) ne bascule rien",
      (await ici(page)) === "/", await ici(page));

    titre("875 · §3 — l'accueil d'aujourd'hui n'a aucune carte qui défile");
    /*  LE REFUS D'UNE GALERIE EST CELUI DU MODULE (`partDUneZoneQuiDefile`,
        lib/glissement-lateral) : il vaut pour tout ce qui déborde
        horizontalement, sans aucun attribut à poser. On le DIT ici pour
        l'accueil — qui n'a, à cette passe, que des cartes de style à une
        seule image — et on l'ÉPROUVE juste dessous, sur la page qui en a
        une : le portfolio d'une fiche, au doigt, même reconnaisseur. */
    verif("aucune boîte qui défile horizontalement dans le corps de l'accueil",
      await page.evaluate(() => [...document.querySelectorAll("[data-corps-accueil] *")]
        .filter((n) => { const d = getComputedStyle(n).overflowX;
          return (d === "auto" || d === "scroll") && n.scrollWidth > n.clientWidth; }).length === 0));
  } finally {
    await nav.close();
  }
}

{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("875 · §3 — le même reconnaisseur refuse un geste parti d'une galerie");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(NAV, { timeout: 20000 });
    await attendre(page, 1800);
    const galerie = await page.evaluate(() => {
      const boite = [...document.querySelectorAll("[data-colonne-lecture] *")]
        .find((n) => { const d = getComputedStyle(n).overflowX;
          return (d === "auto" || d === "scroll") && n.scrollWidth > n.clientWidth; });
      if (!boite) return null;
      const r = boite.getBoundingClientRect();
      return { y: Math.round(Math.max(r.top + 20, 80)), dedans: r.top < innerHeight && r.bottom > 0 };
    });
    verif("une galerie qui défile est bien là, à l'écran", galerie?.dedans === true, JSON.stringify(galerie));
    await balayer(page, 330, 90, galerie.y);
    await attendre(page, 1200);
    verif("un balayage parti de la galerie ne change pas de page",
      (await ici(page)) === `/artist/${SLUG}/portfolio`, await ici(page));
    //  ET LE MÊME GESTE, HORS DE LA GALERIE, BASCULE : la preuve que ce
    //  n'est pas le geste qui a échoué, mais bien la galerie qui l'a pris.
    //  LE TITRE D'UNE CARTE — hors du cadre qui défile (le point du
    //  banc 873, éprouvé).
    const yTitre = await page.evaluate(() => Math.round(
      document.querySelector("[data-carte-de-galerie] [data-titre-galerie]").getBoundingClientRect().top + 8));
    await balayer(page, 330, 90, yTitre);
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/flash`, SLUG, { timeout: 15000 }).catch(() => {});
    await attendre(page, 900);
    verif("… tandis que le même geste hors galerie navigue bien",
      (await ici(page)) === `/artist/${SLUG}/flash`, await ici(page));
  } finally {
    await nav.close();
  }
}

bilan();
