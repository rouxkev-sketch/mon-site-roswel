//  ██ BANC 841 — LE FIL DES RÉSULTATS AU DOIGT, ET LE POINT MÉDIAN AU WEB ██
//  Au doigt : la structure du fil mesurée (une carte par rangée, en-tête
//  avatar · titre · sous-titre · Follow, image pleine largeur à glissement
//  natif avec accrochage et pastille, pied avec points, fanion et
//  partage) ; les photos (la première seule au loin, la suivante à moins
//  d'un écran, jamais tout) ; le glissement, la pastille et les points
//  d'accord ; un toucher sur l'image ne fait rien, l'avatar et le titre
//  mènent au profil ; l'ancienne vue photo redirige vers le profil sans
//  entrée d'historique. Au web : le point médian sur chaque carte, la
//  grille de la 839/840 intacte, la structure du fil masquée et muette.
//  L'atelier attendu est décrit dans `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

/*  UNE FICHE À IDENTIFIANT DE BASE (uuid) : le badge « Follow » ne se rend
    que pour elles (`estIdentifiantDeBase`) — et cinq photos de couleurs
    franchement différentes (l'aplat d'un autre style à chaque rang),
    pour que la pastille, les points et la photo montrée se vérifient
    l'un l'autre. */
const T = `banc841-${Date.now()}`;
//  ⚠️ UN IDENTIFIANT PAR PASSAGE : la doublure garde ce qu'on y range, et
//  deux fiches de même identifiant mettraient leurs photos en commun.
const ID = `10000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const TEINTES = ["blackwork", "old-school", "geometrique", "ornemental", "japonais"];
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: "Banc 841", styles: ["blackwork"], ville_slug: `lyon-${T}`, type_fiche: "artiste" });
  /*  ⚠️ DE VRAIS IDENTIFIANTS DE BASE (nº 842) : le fanion du pied ne se
      rend que pour eux (`estIdentifiantDeBase`, règle nº 137). */
  await ranger("photos_tatoueur", TEINTES.map((teinte, i) => ({ id: `41000009-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`, tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/${teinte}-1.svg`, miniature: `/images-demo/tatouage/${teinte}-1.svg`, ordre: i + 1, cree_le: "2026-01-01T00:00:00Z" })));
}
const MOSAIQUE = "/search?style=blackwork&nature=tatouage";
const CARTE = `[data-carte]:has([data-lien-profil-de-fil][href*="${T}"])`;
const vis = `(n) => { if (!n) return "absent"; const s = getComputedStyle(n); return s.display !== "none" && s.visibility !== "hidden" ? "visible" : "masqué"; }`;

//  ══ 1. LE DOIGT ══════════════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  const images = [];
  page.on("request", (r) => { if (r.resourceType() === "image") images.push(r.url()); });
  try {
    titre("841 · le fil : la structure, mesurée");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const structure = await page.evaluate(({ SEL, VIS }) => {
      const vis = new Function("return " + VIS)();
      const grille = document.querySelector("[data-grille-tatoueurs]");
      const cartes = [...document.querySelectorAll("[data-carte]")];
      const c = document.querySelector(SEL);
      const enTete = c.querySelector("[data-en-tete-de-fil]"), cadre = c.querySelector("[data-cadre-de-fil]"), pied = c.querySelector("[data-pied-de-fil]");
      const y = (n) => Math.round(n.getBoundingClientRect().top);
      const avatar = enTete.querySelector("[data-lien-profil-de-fil] > span:first-child");
      const suivre = enTete.querySelector("[data-badge-type]");
      return {
        appareil: document.documentElement.dataset.appareil,
        colonnes: getComputedStyle(grille).gridTemplateColumns.split(" ").length,
        toutesEnFil: cartes.every((k) => k.querySelector("[data-en-tete-de-fil]") && k.querySelector("[data-cadre-de-fil]") && k.querySelector("[data-pied-de-fil]")),
        lienWeb: vis(c.querySelector("[data-lien-carte]")),
        enTete: vis(enTete), cadre: vis(cadre), pied: vis(pied),
        ordre: y(enTete) < y(cadre) && y(cadre) < y(pied),
        largeurs: { ecran: innerWidth, carte: Math.round(c.getBoundingClientRect().width), cadre: Math.round(cadre.getBoundingClientRect().width) },
        avatarAGauche: Math.round(avatar.getBoundingClientRect().left), avatarTaille: Math.round(avatar.getBoundingClientRect().width),
        //  §3 (nº 842) — le TYPE a rejoint le nom sur la ligne du titre,
        //  et le sous-titre ne garde que la ville. La graisse se lit
        //  donc sur le NOM lui-même, pas sur la ligne entière.
        titre: c.querySelector("[data-lien-profil-de-fil] > span:nth-child(2) > span:first-child")?.textContent.trim(),
        sousTitre: c.querySelector("[data-lien-profil-de-fil] > span:nth-child(2) > span:nth-child(2)")?.textContent,
        titreGras: getComputedStyle(c.querySelector("[data-lien-profil-de-fil] > span:nth-child(2) > span:first-child")).fontWeight,
        //  §1 (nº 843) — le badge du TYPE a pris la place de « Follow »,
        //  qui est resté sur le profil. C'est lui qu'on mesure ici.
        suivre: suivre?.textContent.trim(), suivreADroite: suivre ? Math.round(innerWidth - suivre.getBoundingClientRect().right) : null,
        suivreFace: suivre ? Math.abs((suivre.getBoundingClientRect().top + suivre.getBoundingClientRect().height / 2) - (avatar.getBoundingClientRect().top + avatar.getBoundingClientRect().height / 2)) < 2 : false,
        compteur: cadre.querySelector('[data-role="compteur"]')?.textContent, compteurVisible: vis(cadre.querySelector('[data-role="compteur"]')),
        compteurEnHautADroite: (() => { const p = cadre.querySelector('[data-role="compteur"]'); if (!p) return false; const r = p.getBoundingClientRect(), k = cadre.getBoundingClientRect(); return r.top - k.top < 20 && k.right - r.right < 20; })(),
        accrochage: getComputedStyle(cadre.querySelector('[data-role="cadre"]')).scrollSnapType,
        points: pied.querySelectorAll("[aria-label^='View photo']").length,
        icones: [...pied.querySelectorAll("button[aria-label]")].filter((b) => !b.getAttribute("aria-label").startsWith("View photo")).map((b) => b.getAttribute("aria-label")),
        iconesADroite: (() => { const b = [...pied.querySelectorAll("button[aria-label]")].filter((b) => !b.getAttribute("aria-label").startsWith("View photo")); return b.every((x) => x.getBoundingClientRect().left > innerWidth / 2); })(),
        imagesParCarte: cartes.map((k) => ({ y: Math.round(k.getBoundingClientRect().top), n: k.querySelectorAll("[data-cadre-de-fil] img").length })),
      };
    }, { SEL: CARTE, VIS: vis });
    verif("l'appareil est le doigt", structure.appareil === "mobile", structure.appareil);
    verif("UNE carte par rangée (la grille n'a qu'une colonne)", structure.colonnes === 1, `${structure.colonnes} colonne(s)`);
    verif("chaque carte des résultats porte l'en-tête, le cadre et le pied du fil", structure.toutesEnFil);
    verif("la carte du web est masquée, le fil est visible", structure.lienWeb === "masqué" && structure.enTete === "visible" && structure.cadre === "visible" && structure.pied === "visible");
    verif("de haut en bas : en-tête, image, pied", structure.ordre);
    verif("l'image est pleine largeur (carte et cadre = écran)", structure.largeurs.carte === structure.largeurs.ecran && structure.largeurs.cadre === structure.largeurs.ecran, JSON.stringify(structure.largeurs));
    verif("l'avatar à gauche (40 px, sur la marge de 16)", structure.avatarAGauche === 16 && structure.avatarTaille === 40, `x ${structure.avatarAGauche}, ${structure.avatarTaille} px`);
    //  §1 (nº 843) — le TYPE est parti dans le badge : le titre redevient
    //  le nom seul, et la ville reste seule dessous.
    verif("le titre est le NOM SEUL (demi-gras), puis la ville seule", structure.titre === "Banc 841" && structure.sousTitre === "Lyon, FR" && Number(structure.titreGras) >= 600, `${structure.titre} / ${structure.sousTitre} / ${structure.titreGras}`);
    verif("LE BADGE DU TYPE à droite, face à l'avatar (nº 843)", structure.suivre === "Artist" && structure.suivreADroite === 16 && structure.suivreFace, `${structure.suivre} · ${structure.suivreADroite} px du bord`);
    verif("la pastille « 1/5 » en haut à droite de l'image", structure.compteur === "1/5" && structure.compteurVisible === "visible" && structure.compteurEnHautADroite);
    verif("le glissement est natif, avec accrochage par photo", structure.accrochage === "x mandatory", structure.accrochage);
    //  §4 (nº 842) — le pied s'écarte en trois places : signaler à
    //  gauche, les points au centre, partage puis fanion à droite. Le
    //  détail (les bords, les cibles) est mesuré par le banc 842 ; ici
    //  on vérifie seulement qu'ils sont tous là et dans cet ordre.
    verif("le pied : signaler, cinq points, partage et fanion", structure.points === 5 && structure.icones.length === 3 && structure.icones[0].startsWith("Report") && structure.icones[1].startsWith("Share") && /photo/.test(structure.icones[2]), structure.icones.join(" · "));

    titre("841 · les photos : la première seule au loin, la suivante à l'approche, jamais tout");
    const ecran = await page.evaluate(() => innerHeight);
    const proches = structure.imagesParCarte.filter((k) => k.y < ecran * 2), lointaines = structure.imagesParCarte.filter((k) => k.y >= ecran * 2);
    verif("une carte à plus d'un écran n'a que sa première photo", lointaines.length > 0 && lointaines.every((k) => k.n === 1), `${lointaines.length} carte(s) lointaine(s) : [${lointaines.map((k) => k.n).join(",")}]`);
    verif("une carte à l'écran a sa première ET sa suivante, pas davantage", proches.every((k) => k.n <= 2) && proches.some((k) => k.n === 2), `[${proches.map((k) => k.n).join(",")}]`);
    const cartes = structure.imagesParCarte.length;
    verif("le réseau n'a jamais demandé un portfolio entier", images.length <= cartes * 2, `${images.length} image(s) pour ${cartes} cartes`);

    titre("841 · le glissement, la pastille et les points");
    await page.locator(CARTE).scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    const etat = () => page.evaluate((SEL) => {
      const c = document.querySelector(SEL), z = c.querySelector('[data-cadre-de-fil] [data-role="cadre"]');
      return { compteur: c.querySelector('[data-cadre-de-fil] [data-role="compteur"]')?.textContent, scroll: Math.round(z.scrollLeft), largeur: Math.round(z.clientWidth), actif: c.querySelector('[data-pied-de-fil] [aria-current="true"]')?.getAttribute("aria-label"), images: c.querySelectorAll("[data-cadre-de-fil] img").length, url: location.pathname + location.search };
    }, CARTE);
    const depart = await etat();
    //  Le doigt glisse : le cadre défile d'une largeur, doucement, et l'accrochage le pose.
    await page.evaluate((SEL) => { const z = document.querySelector(SEL + ' [data-cadre-de-fil] [data-role="cadre"]'); z.scrollBy({ left: z.clientWidth, behavior: "smooth" }); }, CARTE);
    await page.waitForTimeout(1200);
    const apres = await etat();
    verif("le cadre s'est posé EXACTEMENT sur la deuxième photo (accrochage)", apres.scroll === apres.largeur, `${apres.scroll} px pour ${apres.largeur} px`);
    verif("la pastille suit", depart.compteur === "1/5" && apres.compteur === "2/5", `${depart.compteur} → ${apres.compteur}`);
    verif("les points suivent", depart.actif === "View photo 1 of 5" && apres.actif === "View photo 2 of 5", `${depart.actif} → ${apres.actif}`);
    verif("la photo d'après est montée à son tour, et elle seule", apres.images === 3, `${apres.images} images`);
    await page.locator(`${CARTE} [data-pied-de-fil] [aria-label="View photo 4 of 5"]`).tap(); await page.waitForTimeout(1200);
    const rond = await etat();
    verif("un rond touché mène à sa photo (4/5), pastille et cadre d'accord", rond.compteur === "4/5" && rond.scroll === 3 * rond.largeur && rond.actif === "View photo 4 of 5", `${rond.compteur} · ${rond.scroll} px`);

    titre("841 · les touchers : l'image ne fait rien, l'avatar et le titre mènent au profil");
    const cadre = await page.locator(`${CARTE} [data-cadre-de-fil]`).boundingBox();
    await page.touchscreen.tap(cadre.x + cadre.width / 2, cadre.y + cadre.height / 2); await page.waitForTimeout(900);
    const apresImage = await etat();
    verif("un toucher sur l'image NE FAIT RIEN (même adresse, même photo)", apresImage.url === depart.url && apresImage.compteur === rond.compteur, apresImage.url);
    const longueurAvant = await page.evaluate(() => history.length);
    await page.locator(`${CARTE} [data-lien-profil-de-fil] > span:first-child`).tap(); await page.waitForTimeout(2500);
    const profil = await page.evaluate(() => ({ url: location.pathname + location.search, vuePhoto: document.querySelector("[data-vue-photo]") !== null, colonne: getComputedStyle(document.querySelector("[data-colonne-lecture]")).display, photo: (() => { const n = document.querySelector("[data-photo-de-tete]"); return n ? getComputedStyle(n).display : "absente"; })(), longueur: history.length }));
    verif("l'avatar mène AU PROFIL directement (entree=lien, colonne de lecture visible, photo absente)", profil.url === `/artist/${T}?entree=lien` && !profil.vuePhoto && profil.colonne !== "none" && profil.photo === "none", profil.url);
    verif("une seule entrée d'historique", profil.longueur === longueurAvant + 1, `${longueurAvant} → ${profil.longueur}`);
    await page.goBack(); await page.waitForTimeout(1500);
    verif("le retour rend les résultats", (await page.evaluate(() => location.pathname + location.search)) === MOSAIQUE);
    await page.locator(CARTE).scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await page.locator(`${CARTE} [data-lien-profil-de-fil] > span:nth-child(2) > span:first-child`).tap(); await page.waitForTimeout(2500);
    verif("le titre aussi mène au profil", (await page.evaluate(() => location.pathname + location.search)) === `/artist/${T}?entree=lien`);

    /*  ██ CE BLOC A CHANGÉ DE SUJET À LA nº 844 ██
        CE QU'IL MESURAIT : la redirection de la nº 841 — au doigt,
        TOUTE adresse de fiche sans `entree=lien` était réécrite vers le
        profil. LE PROPRIÉTAIRE L'A RETIRÉE (nº 844-§4) : la vue photo
        du doigt est nécessaire pour un lien partagé et pour une vignette
        du Portfolio. L'adresse n'est donc plus touchée, et c'est bien la
        VUE PHOTO qui s'affiche.
        CE QUI NE CHANGE PAS, ET QUE CE BLOC CONTINUE DE TENIR : les
        cartes du fil, elles, mènent au PROFIL — c'est leur lien qui le
        dit (`entree=lien`), mesuré juste au-dessus. */
    titre("841 · l'ancienne route rend la VUE PHOTO depuis la nº 844 (la redirection est retirée)");
    await page.goto(`${BASE}/artist/${T}?style=blackwork&photo=${T}-p2`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
    const direct = await page.evaluate(() => ({ url: location.pathname + location.search, vuePhoto: document.querySelector("[data-vue-photo]") !== null, colonne: getComputedStyle(document.querySelector("[data-colonne-lecture]")).display, photo: (() => { const n = document.querySelector("[data-photo-de-tete]"); return n ? getComputedStyle(n).display : "absente"; })(), garde: document.documentElement.dataset.entreeLien ?? null, plaque: (document.querySelector("[data-habillage-photo]")?.getBoundingClientRect().height ?? 0) > 0 }));
    verif("l'adresse n'est PLUS réécrite : elle reste celle du lien partagé", direct.url === `/artist/${T}?style=blackwork&photo=${T}-p2`, direct.url);
    verif("c'est la vue photo qui s'affiche : photo montrée, colonne de lecture retirée", direct.vuePhoto && direct.photo !== "none" && direct.colonne === "none", `vue-photo ${direct.vuePhoto} · photo ${direct.photo} · colonne ${direct.colonne}`);
    //  §1 (nº 845) — LA CROIX DE LA nº 844 EST RETIRÉE : c'est la PLAQUE
    //  du profil, rétablie, qui donne le chemin depuis la vue photo.
    verif("la garde d'avant peinture est levée, et la plaque du profil est là", direct.garde === null && direct.plaque, `garde ${direct.garde} · plaque ${direct.plaque}`);
  } catch (e) {
    verif("déroulement du banc 841 (doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2. LE WEB : LE POINT MÉDIAN, ET RIEN D'AUTRE NE BOUGE ═══════════
{
  const { nav, page } = await ouvrir("web");
  const images = [];
  page.on("request", (r) => { if (r.resourceType() === "image") images.push(r.url()); });
  try {
    titre("841 · le web : « · » partout, la grille de la 839/840 intacte");
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    const web = await page.evaluate((VIS) => {
      const vis = new Function("return " + VIS)();
      const cartes = [...document.querySelectorAll("[data-carte]")];
      //  §3 (nº 842) — le point médian a quitté le sous-titre pour la
      //  ligne du TITRE (« Nom · Type ») ; le sous-titre, lui, ne porte
      //  plus que la ville, et donc plus aucun signe.
      //  §1 (nº 843) — le point médian est redescendu du titre au
      //  sous-titre, devant la ville : c'est là qu'on le lit.
      const sousTitres = cartes.map((c) => ([...c.querySelectorAll("[data-lien-carte] p")].pop()?.textContent ?? "").trim());
      return {
        colonnes: getComputedStyle(document.querySelector("[data-grille-tatoueurs]")).gridTemplateColumns.split(" ").length,
        sousTitres,
        filMasque: cartes.every((c) => vis(c.querySelector("[data-en-tete-de-fil]")) === "masqué" && vis(c.querySelector("[data-cadre-de-fil]")) === "masqué" && vis(c.querySelector("[data-pied-de-fil]")) === "masqué"),
        lienWeb: cartes.every((c) => vis(c.querySelector("[data-lien-carte]")) === "visible"),
        piste: cartes.every((c) => c.querySelectorAll("[data-piste-de-carte] img").length === 1),
        /*  §1 (nº 844) — LA PASTILLE NE SE MASQUE PLUS, ELLE S'ÉTEINT :
            au repos elle est TRANSPARENTE (opacité 0) et ne prend aucun
            pointeur — c'est le fondu de la règle unique. « Aucune
            pastille au repos » se lit donc là, et non plus dans
            `display` / `visibility`. */
        pastilles: cartes.every((c) => {
          const p = c.querySelector("[data-compteur-de-carte]");
          if (!p) return false;
          const s = getComputedStyle(p);
          return Number(s.opacity) === 0 && s.pointerEvents === "none";
        }),
        n: cartes.length,
      };
    }, vis);
    verif("quatre colonnes, comme avant", web.colonnes === 4, `${web.colonnes}`);
    verif("LE POINT MÉDIAN sur chaque sous-titre, et plus un seul deux-points", web.sousTitres.every((t) => t.includes(" · ") && !t.includes(": ")), web.sousTitres.slice(0, 3).join(" | "));
    verif("l'en-tête, le cadre et le pied du fil sont masqués sur le web", web.filMasque);
    verif("le lien de la carte du web est là, sa piste n'a qu'une image, aucune pastille au repos", web.lienWeb && web.piste && web.pastilles);
    verif("le réseau : au plus une image par carte (la structure masquée n'en demande aucune de plus)", images.length <= web.n, `${images.length} image(s) pour ${web.n} cartes`);
  } catch (e) {
    verif("déroulement du banc 841 (web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
process.exit(bilan());
