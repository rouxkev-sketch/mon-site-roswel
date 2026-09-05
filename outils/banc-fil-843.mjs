//  ██ BANC 843 — LE BADGE DU TYPE, ET LES LIGNES QUI NE PASSENT PLUS ██
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest } from "./banc-socle.mjs";

const T = `banc843-${Date.now()}`;
const ID = `20000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
//  UN NOM DE 60 CARACTÈRES ET UNE VILLE DE 50 : la consigne du banc.
const NOM_LONG = "Aurelie-Charlotte Vandenberghe-Rousseau du Bois-Joli!!";
const VILLE_LONGUE = "Villeneuve-Saint-Georges-sur-Marne-la-Coquette-Nord";
const LONG = `banc843long-${Date.now()}`;
const IDLONG = `20000000-0000-4000-8000-${(Date.now() + 1).toString(16).padStart(12, "0")}`;
const U = { id: "30000000-0000-4000-8000-000000000843", email: "banc-843@yokofolio.test" };
const TEINTES = ["blackwork", "old-school", "geometrique"];
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: "Banc 843", styles: ["blackwork"], ville_slug: `lyon-${T}`, type_fiche: "salon", etablissement: "prive" });
  await ranger("tatoueurs", { ...gabarit, id: IDLONG, slug: LONG, nom: `${NOM_LONG}${"x".repeat(Math.max(0, 60 - NOM_LONG.length))}`, styles: ["blackwork"], ville_nom: VILLE_LONGUE, ville_slug: `ville-${LONG}`, type_fiche: "salon", etablissement: "prive" });
  for (const [rang, fiche] of [ID, IDLONG].entries()) {
    await ranger("photos_tatoueur", TEINTES.map((teinte, i) => ({ id: `4300000${rang}-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`, tatoueur_id: fiche, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/${teinte}-1.svg`, miniature: `/images-demo/tatouage/${teinte}-1.svg`, ordre: i + 1, cree_le: "2026-01-01T00:00:00Z" })));
  }
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
}
/*  ██ COMMENT ON COMPTE LES LIGNES, ET COMMENT ON VOIT LA COUPE ██
    LES LIGNES : la hauteur rendue divisée par une hauteur de ligne
    (avec le repli 1,2 × le corps quand la feuille dit « normal »).
    ⚠️ PAS UN `Range` : ses boîtes se scindent aux frontières
    d'éléments et aux ruptures de sens d'écriture — il en compte deux
    là où l'œil en voit une (mesuré).
    LA COUPE : la largeur que le TEXTE occuperait, mesurée hors flux
    dans la police calculée de l'élément, comparée à la largeur utile
    de sa boîte. C'est la seule mesure qui vaille pour les DEUX
    procédés de rognage du site — `truncate` (une ligne, points de
    suspension) et `line-clamp-1` (une boîte webkit) —, dont l'un ne se
    lit pas en `scrollWidth` et l'autre pas en hauteur. */
const REGLE = `(n) => {
  const s = getComputedStyle(n);
  const boite = n.getBoundingClientRect();
  const hauteurLigne = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2;
  const toile = document.createElement("canvas").getContext("2d");
  toile.font = s.fontStyle + " " + s.fontWeight + " " + s.fontSize + " " + s.fontFamily;
  const texte = toile.measureText(n.textContent.trim()).width;
  return {
    lignes: boite.height ? Math.round(boite.height / hauteurLigne) : 0,
    coupe: texte > n.clientWidth + 1,
    montre: boite.height > 0,
  };
}`;

const MOSAIQUE = "/search?style=blackwork&nature=tatouage";
const CARTE = `[data-carte]:has([data-lien-profil-de-fil][href*="${T}"])`;
const CARTELONG = `[data-carte]:has([data-lien-profil-de-fil][href*="${LONG}"])`;

//  ══ 1 · LE FIL : LE BADGE DU TYPE ════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("843 · le badge du type remplace « Follow » dans le fil");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(CARTE).scrollIntoViewIfNeeded();
    const m = await page.evaluate((SEL) => {
      const c = document.querySelector(SEL);
      const t = c.querySelector("[data-en-tete-de-fil]");
      const badge = [...t.querySelectorAll("[data-badge-type]")]
        .find((n) => n.getBoundingClientRect().height > 0);
      const s = badge && getComputedStyle(badge);
      const avatar = t.querySelector("[data-lien-profil-de-fil] > span:first-child");
      const r = badge?.getBoundingClientRect();
      const ra = avatar.getBoundingClientRect();
      const suivre = [...t.querySelectorAll("button")].filter((b) => /follow/i.test(b.getAttribute("aria-label") ?? ""));
      return {
        texte: badge?.textContent.trim(),
        href: badge?.getAttribute("href"),
        balise: badge?.tagName,
        contour: s && `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
        contourCouleur: s?.borderTopColor,
        fond: s?.backgroundColor,
        hauteur: r && Math.round(r.height),
        insecable: s?.whiteSpace,
        aDroite: r ? Math.round(innerWidth - r.right) : null,
        faceALAvatar: r ? Math.abs((r.top + r.height / 2) - (ra.top + ra.height / 2)) < 2 : false,
        suivreDansLeFil: suivre.length,
        titre: t.querySelector("[data-lien-profil-de-fil] > span:nth-child(2) > span:first-child")?.textContent.trim(),
        sousTitre: t.querySelector("[data-lien-profil-de-fil] > span:nth-child(2) > span:nth-child(2)")?.textContent.trim(),
      };
    }, CARTE);
    verif("le badge dit le type", m.texte === "Private Studio", m.texte);
    verif("c'est un LIEN vers le profil", m.balise === "A" && m.href === `/artist/${T}?entree=lien`, `${m.balise} ${m.href}`);
    /*  ██ LA ROBE A CHANGÉ DEUX FOIS, ET C'EST LA CONSIGNE QUI COMPTE ██
        nº 843 : contour fin, fond de l'interface. nº 844-§3 : fond
        transparent, contour seul. nº 852-§6 : LA ROBE DE « SUIVRE » —
        un aplat PLEIN de la couleur d'action, SANS CONTOUR, « parce
        que c'est un lien ». C'est cette dernière que le banc mesure.
        ⚠️ ON NE FIGE TOUJOURS PAS LE JETON (la charte a déjà été
        retintée, nº 466) : ce qui compte est la RÈGLE — un fond PLEIN,
        aucun trait, et le texte dans la couleur du fond de page (le
        contraste inversé d'un bouton d'action). */
    verif("la robe de « Suivre » : un aplat plein, sans contour (nº 852-§6)",
      m.fond !== "rgba(0, 0, 0, 0)" && parseFloat(m.contour) === 0,
      `${m.contour} · fond ${m.fond}`);
    /*  §1 (nº 856) — TRENTE, DE NOUVEAU. La nº 855 l'avait porté à
        quarante ; le propriétaire le dit agrandi par erreur et le remet
        à l'état du bâti nº 854. Source : `AIR_BADGE`, config/tatouage. */
    verif("hauteur d'un badge (30 px), texte insécable", m.hauteur === 30 && m.insecable === "nowrap", `${m.hauteur} px · ${m.insecable}`);
    verif("il est à droite, face à l'avatar", m.aDroite === 16 && m.faceALAvatar, `${m.aDroite} px du bord`);
    verif("PLUS AUCUN « Follow » dans le fil", m.suivreDansLeFil === 0, `${m.suivreDansLeFil} trouvé(s)`);
    verif("le titre est le NOM SEUL, la ville seule dessous", m.titre === "Banc 843" && m.sousTitre === "Lyon, FR", `${m.titre} / ${m.sousTitre}`);
    //  LE CLIC MÈNE AU PROFIL.
    //  nº 852 — LE BADGE QU'ON VOIT : la carte du web en porte un
    //  second depuis le §8, retiré de l'affichage au doigt.
    await page.locator(`${CARTE} [data-badge-type]:visible`).tap();
    await page.waitForTimeout(2500);
    verif("un toucher sur le badge ouvre le profil", (await page.evaluate(() => location.pathname + location.search)) === `/artist/${T}?entree=lien`);
    //  ET « FOLLOW » EST TOUJOURS LÀ, SUR LE PROFIL.
    const surLeProfil = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /follow/i.test(x.getAttribute("aria-label") ?? ""));
      return b ? { libelle: b.getAttribute("aria-label"), visible: getComputedStyle(b).display !== "none" } : null;
    });
    verif("« Follow » est resté sur le profil", surLeProfil?.libelle === "Follow Banc 843" && surLeProfil.visible, JSON.stringify(surLeProfil));

    titre("843 · un nom de 60 et une ville de 50 : une ligne chacun, coupés");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(CARTELONG).scrollIntoViewIfNeeded();
    const l = await page.evaluate(({ SEL, R }) => {
      const c = document.querySelector(SEL);
      const t = c.querySelector("[data-en-tete-de-fil]");
      const bloc = t.querySelector("[data-lien-profil-de-fil] > span:nth-child(2)");
      const nom = bloc.querySelector(":scope > span:first-child");
      const ville = bloc.querySelector(":scope > span:nth-child(2)");
      const badge = [...t.querySelectorAll("[data-badge-type]")]
        .find((n) => n.getBoundingClientRect().height > 0);
      const regle = new Function("return " + R)();
      return {
        nomLongueur: nom.textContent.trim().length, villeLongueur: ville.textContent.trim().length,
        nomLignes: regle(nom).lignes, villeLignes: regle(ville).lignes,
        nomCoupe: regle(nom).coupe && getComputedStyle(nom).textOverflow === "ellipsis",
        villeCoupee: regle(ville).coupe && getComputedStyle(ville).textOverflow === "ellipsis",
        badgeTexte: badge?.textContent.trim(), badgeLargeur: badge && Math.round(badge.getBoundingClientRect().width),
        badgeCoupe: badge ? badge.scrollWidth > badge.clientWidth + 1 : null,
        badgeADroite: badge ? Math.round(innerWidth - badge.getBoundingClientRect().right) : null,
        enTeteDeborde: t.scrollWidth > t.clientWidth + 1,
        pageDeborde: document.documentElement.scrollWidth > innerWidth + 1,
      };
    }, { SEL: CARTELONG, R: REGLE });
    verif("le nom fait bien 60 caractères et la ville 50", l.nomLongueur === 60 && l.villeLongueur >= 50, `${l.nomLongueur} / ${l.villeLongueur}`);
    verif("le NOM tient sur UNE ligne et se coupe par des points de suspension", l.nomLignes === 1 && l.nomCoupe, `${l.nomLignes} ligne(s), coupé : ${l.nomCoupe}`);
    verif("la VILLE tient sur UNE ligne et se coupe de même", l.villeLignes === 1 && l.villeCoupee, `${l.villeLignes} ligne(s), coupée : ${l.villeCoupee}`);
    verif("LE BADGE RESTE ENTIER, à sa place, à droite", l.badgeTexte === "Private Studio" && l.badgeCoupe === false && l.badgeADroite === 16, `« ${l.badgeTexte} » · ${l.badgeLargeur} px · ${l.badgeADroite} px du bord`);
    verif("ni l'en-tête ni la page ne débordent", !l.enTeteDeborde && !l.pageDeborde);
  } catch (e) {
    verif("déroulement du banc 843 (fil)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE WEB ET LA PLAQUE : NOM SEUL, TYPE DEVANT LA VILLE ═════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("843 · la carte du web : le nom seul, le type devant la ville");
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(({ SEL, R }) => {
      const regle = new Function("return " + R)();
      const c = document.querySelector(SEL);
      const h = c.querySelector("h3");
      const p = [...c.querySelectorAll("[data-lien-carte] p")].pop();
      /*  ⚠️ LE BADGE DU FIL EST DANS LE DOCUMENT SUR LE WEB — masqué
          par la feuille de style, comme toute la structure du doigt
          (nº 841). La question n'est donc pas « existe-t-il ? » mais
          « SE VOIT-IL ? ». */
      const badge = [...c.querySelectorAll("[data-badge-type]")]
        .find((n) => n.getBoundingClientRect().height > 0);
      return {
        titre: h.textContent.trim(), ...regle(h), titreGras: getComputedStyle(h).fontWeight,
        sousTitre: [...p.children].length
          ? [...p.children].find((n) => n.getBoundingClientRect().height > 0)?.textContent.trim()
          : p.textContent.trim(),
        sousTitreLignes: regle(p).lignes,
        badgeVisible: badge ? badge.getBoundingClientRect().width > 0 : false,
        badgeTexte: badge?.textContent.trim() ?? null,
      };
    }, { SEL: `[data-carte]:has([data-lien-carte][href*="${T}"])`, R: REGLE });
    verif("le titre est le NOM SEUL, demi-gras, sur une ligne", m.titre === "Banc 843" && m.lignes === 1 && Number(m.titreGras) >= 600, `${m.titre} · ${m.lignes} ligne(s) · ${m.titreGras}`);
    /*  ██ LA CARTE DU WEB A CHANGÉ À LA nº 852 (§8/§9) ██
        Le TYPE y est devenu un BADGE face à l'avatar, comme sur le fil,
        et le sous-titre n'est plus que LA LOCALITÉ. Ce banc mesurait
        l'inverse — « Type · Ville » dans le sous-titre, aucun badge —
        et disait vrai jusqu'à cette passe.
        ⚠️ LE SOUS-TITRE SE LIT SUR CE QUI SE VOIT : les deux écritures
        (celle du doigt, celle du web) vivent dans le même paragraphe,
        et l'appareil en montre une — `textContent` les recopierait
        toutes les deux. */
    verif("le sous-titre du web ne porte que la LOCALITÉ, sur une ligne (nº 852-§8)",
      m.sousTitre === "Lyon, FR" && m.sousTitreLignes === 1,
      `${m.sousTitre} · ${m.sousTitreLignes} ligne(s)`);
    verif("et le TYPE y est un badge, visible face à l'avatar (nº 852-§8)",
      m.badgeVisible === true && m.badgeTexte === "Private Studio",
      `${m.badgeVisible} · « ${m.badgeTexte} »`);
    const l = await page.evaluate(({ SEL, R }) => {
      const regle = new Function("return " + R)();
      const c = document.querySelector(SEL);
      const t = regle(c.querySelector("h3"));
      const s = regle([...c.querySelectorAll("[data-lien-carte] p")].pop());
      return { titreLignes: t.lignes, titreCoupe: t.coupe, sousLignes: s.lignes, sousCoupe: s.coupe, deborde: document.documentElement.scrollWidth > innerWidth + 1 };
    }, { SEL: `[data-carte]:has([data-lien-carte][href*="${LONG}"])`, R: REGLE });
    verif("un nom de 60 : une ligne, coupé ; le sous-titre aussi", l.titreLignes === 1 && l.titreCoupe && l.sousLignes === 1 && l.sousCoupe && !l.deborde, JSON.stringify(l));
  } catch (e) {
    verif("déroulement du banc 843 (web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
{
  const { nav, page } = await ouvrir("doigt");
  try {
    /*  ██ LE CONSTAT DE LA nº 843, ET SA FIN (nº 844 puis nº 845) ██
        CE BANC DISAIT, EN MESURANT : « la plaque ne s'affiche nulle
        part depuis la nº 841 — la rendre au parcours, ou la retirer,
        est une décision du propriétaire ». Elle a été RETIRÉE à la
        nº 844, puis RENDUE AU PARCOURS à la nº 845 : la vue photo du
        doigt existe de nouveau (lien partagé, vignette du Portfolio) et
        la plaque y vit. Le constat est donc clos, et ce bloc mesure
        désormais l'état d'arrivée : la plaque À L'ÉCRAN, avec son
        écriture de la nº 843. */
    titre("843 · la plaque du profil : son écriture, et sa place retrouvée (nº 845)");
    await page.goto(`${BASE}/artist/${T}?style=blackwork&rendu=black&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const plaque = document.querySelector("[data-habillage-photo]");
      const bloc = plaque?.querySelector("a > span:nth-child(2)");
      return {
        nom: bloc?.querySelector(":scope > span:first-child")?.textContent.trim(),
        sous: bloc?.querySelector(":scope > span:nth-child(2)")?.textContent.trim(),
        badge: plaque?.querySelector("[data-badge-type]") !== null,
        montree: (plaque?.getBoundingClientRect().height ?? 0) > 0,
        chevron: plaque?.querySelector("a > span:last-child svg") !== null,
      };
    });
    verif("son écriture dit le NOM SEUL, puis « Type · Ville »", m.nom === "Banc 843" && m.sous === "Private Studio · Lyon, FR", `${m.nom} / ${m.sous}`);
    verif("elle ne porte pas de badge (elle est déjà un lien, et porte son chevron)", m.badge === false && m.chevron === true);
    verif("FIN DU CONSTAT nº 843 : elle est de nouveau montrée (nº 845)", m.montree === true);
  } catch (e) {
    verif("déroulement du banc 843 (plaque)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
process.exit(bilan());
