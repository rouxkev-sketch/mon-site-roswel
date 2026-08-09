/**
 * TEST PERMANENT — CARTE ARTISAN (refonte 2026)
 * ---------------------------------------------
 * Aux largeurs 320 / 390 / 430 / 768 / 1024 / 1366 / 1440 px
 * (page /apercu-artisans/apercu-cartes), on garantit la carte conforme à la
 * refonte 2026 :
 *
 *  1. HAUT : grande PHOTO RONDE à gauche (~28 % de la largeur, carrée
 *     donc ronde), jamais de photo rectangulaire de couverture.
 *  2. Bloc texte à droite : nom en gros, puis « Métier · Ville » compact
 *     (SANS préfixe « Métier : » / « Intervient sur », sans icône), puis
 *     la ligne de joignabilité (puce ronde + texte coloré) SOUS le nom.
 *  3. Ligne des 3 chiffres (Google · ancienneté · Instagram) SANS icône.
 *  4. Boutons « Appeler » (rose plein) et « Whatsapp » (contour) +
 *     cœur : MÊME hauteur, coins arrondis ~12 px (jamais capsule).
 *  5. BANDEAU DE PIED à l'INTÉRIEUR de la carte, séparé par un trait
 *     fin : icône ronde + « Très recommandé » / « Recommandé » à gauche,
 *     « Score de confiance X/100 » à droite. UNIQUEMENT si l'artisan a
 *     un badge de niveau ; sinon aucun bandeau. Plus AUCUN badge éjecté
 *     sous la carte.
 *  6. AUCUN prix ; contour gris 1 px ; aucun débordement horizontal.
 *
 * Lancement (site en dev sur http://localhost:3000) :
 *   node tests/cartes-artisan.mjs
 */
const { chromium } = await import("playwright").catch(
  () => import("/opt/node22/lib/node_modules/playwright/index.mjs")
);

const navigateur = await chromium.launch(
  process.env.CHEMIN_CHROMIUM ? { executablePath: process.env.CHEMIN_CHROMIUM } : {}
);
const BASE = "http://localhost:3000";
let erreurs = 0;
const nb = (ok, msg) => { console.log(`${ok ? "  OK " : "ÉCHEC"} ${msg}`); if (!ok) erreurs++; };

for (const largeur of [320, 390, 430, 768, 1024, 1366, 1440]) {
  console.log(`\n=== ${largeur}px ===`);
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: 900 } });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("roswel:cookies-info-vue", "oui"); } catch {}
  });
  const page = await ctx.newPage();
  await page.route("**/rest/v1/**", (r) => r.fulfill({ json: [] }));
  await page.goto(`${BASE}/apercu-artisans/apercu-cartes`, { waitUntil: "networkidle" });
  await page.waitForSelector("article");

  const g = await page.evaluate(() => {
    const articles = [...document.querySelectorAll("article")];
    const cartes = articles.map((a) => {
      const cs = getComputedStyle(a);
      const ar = a.getBoundingClientRect();
      const txt = a.innerText;
      // La photo : 1er enfant du 1er lien (cercle OU carré arrondi)
      const lien = a.querySelector('a[href^="/artisan/"]');
      const photo = lien ? lien.firstElementChild : null;
      const pr = photo ? photo.getBoundingClientRect() : null;
      const cr = photo ? getComputedStyle(photo).borderRadius : "0px";
      // #4 : les 3 éléments d'action (Appeler, Whatsapp, Partager) — la
      // rangée est le DIV qui contient les liens tel:/WhatsApp (le cœur
      // en angle est un DIV absolu séparé, désormais).
      const lienContact = a.querySelector(
        'a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp"], a[href*="api.whatsapp"]'
      );
      const actionRow = lienContact ? lienContact.parentElement : null;
      const actionH = actionRow
        ? [...actionRow.children].map((el) => Math.round(el.getBoundingClientRect().height))
        : [];
      // Coins des BOUTONS (les <a> de la rangée) : ~12 px, jamais capsule
      const boutonsRadius = actionRow
        ? [...actionRow.children]
            .filter((el) => el.tagName === "A")
            .map((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))
        : [];
      // Bouton PARTAGER dans la rangée d'action (à la place de l'ancien cœur)
      const partage = actionRow
        ? [...actionRow.querySelectorAll("button")].find((b) =>
            /partager/i.test(b.getAttribute("aria-label") || "")
          )
        : null;
      // CŒUR favori désormais en ANGLE HAUT DROIT, SEUL (sans encadré)
      const coeur = [...a.querySelectorAll("button")].find((b) =>
        /favoris/i.test(b.getAttribute("aria-label") || "")
      );
      let coeurAngleNu = false;
      if (coeur) {
        const br = coeur.getBoundingClientRect();
        const sc = getComputedStyle(coeur);
        const enHautDroite = br.top - ar.top < 60 && ar.right - br.right < 60;
        const sansEncadre =
          (sc.backgroundColor === "rgba(0, 0, 0, 0)" || sc.backgroundColor === "transparent") &&
          parseFloat(sc.borderTopWidth) === 0;
        coeurAngleNu = enHautDroite && sansEncadre;
      }
      // Nom limité à DEUX lignes maximum (troncature « … ») : le span
      // du nom porte -webkit-line-clamp: 2.
      const nomClamp2 = [...a.querySelectorAll("span")].some(
        (s) => getComputedStyle(s).webkitLineClamp === "2"
      );
      // #2 : la ligne de joignabilité — puce ronde de ~6 px, colorée,
      // DANS la carte (sous le nom)
      const puce = [...a.querySelectorAll("span")].some((s) => {
        const r = s.getBoundingClientRect();
        const st = getComputedStyle(s);
        return (
          Math.abs(r.width - 6) <= 2 &&
          Math.abs(r.height - 6) <= 2 &&
          parseFloat(st.borderRadius) >= 3 &&
          st.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          st.backgroundColor !== "transparent"
        );
      });
      // #5 : le BANDEAU DE PIED — div DANS l'article contenant
      // « Score de confiance X/100 », séparé par un trait haut
      const bandeau = [...a.querySelectorAll("div")].find((d) =>
        /Score de confiance/.test(d.innerText || "")
      );
      const bandeauOk = bandeau
        ? /recommand/i.test(bandeau.innerText) &&
          /Score de confiance\s*\d+\/100/.test(bandeau.innerText) &&
          parseFloat(getComputedStyle(bandeau).borderTopWidth) >= 1
        : true; // pas de bandeau (artisan sans badge) : rien à vérifier
      return {
        bords: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
        actionsEgales:
          actionH.length >= 2
            ? Math.max(...actionH) - Math.min(...actionH) <= 1 &&
              actionH.every((h) => h >= 44 && h <= 50)
            : true,
        // ~12 px : au moins 8, jamais ≥ 20 (ce qui serait une capsule)
        boutonsCoins:
          boutonsRadius.length > 0
            ? boutonsRadius.every((r) => r >= 8 && r < 20)
            : true,
        photoCarree: pr ? Math.abs(pr.width - pr.height) <= 2 : false,
        // Cercle (indépendant) OU carré aux angles arrondis (société)
        photoArrondie: parseFloat(cr) >= 8,
        photoPart: pr ? pr.width / ar.width : 0,
        // « Métier · Ville » : présence du séparateur « · »
        aMetierVille: /·/.test(txt),
        aGrille: !!a.querySelector('div[class*="grid-cols-3"]'),
        // Joignabilité DANS la carte (plus de badge sous la carte)
        aStatutLigne: /Disponible|Indisponible/.test(txt),
        aPuce: puce,
        aPartage: !!partage,
        coeurAngleNu,
        aBandeau: !!bandeau,
        bandeauOk,
        nomClamp2,
      };
    });
    const body = document.body.innerText;
    // Plus AUCUN badge « Recommandé » éjecté SOUS la carte : le niveau
    // ne vit que dans le bandeau interne (donc jamais dans un div frère
    // de l'article).
    const badgeExterieur = articles.some((a) => {
      const suivant = a.nextElementSibling;
      return suivant && /recommand/i.test(suivant.textContent || "");
    });
    return {
      nbCartes: cartes.length,
      bordurePartout: cartes.every((c) => c.bords.every((b) => b === "1px")),
      photoCarreeArrondie: cartes.every((c) => c.photoCarree && c.photoArrondie),
      photoTaille: cartes.every((c) => c.photoPart > 0.2 && c.photoPart < 0.45),
      metierVillePartout: cartes.every((c) => c.aMetierVille),
      // Les anciens préfixes ont disparu (format compact « Métier · Ville »)
      sansPrefixes: !/Métier\s*:|Intervient sur/.test(body),
      grillePartout: cartes.every((c) => c.aGrille),
      boutonAppeler: /Appeler/.test(body),
      boutonWhatsapp: /Whatsapp/i.test(body),
      auMoinsUnStatut: cartes.some((c) => c.aStatutLigne),
      auMoinsUnePuce: cartes.some((c) => c.aPuce),
      nomClamp2Partout: cartes.every((c) => c.nomClamp2),
      // Le statut vert dit désormais « Joignable » — plus jamais
      // « Disponible » (majuscule) nulle part sur la carte.
      sansDisponible: !/Disponible/.test(body),
      actionsEgalesPartout: cartes.every((c) => c.actionsEgales),
      boutonsCoinsPartout: cartes.every((c) => c.boutonsCoins),
      partagePartout: cartes.every((c) => c.aPartage),
      coeurAnglePartout: cartes.every((c) => c.coeurAngleNu),
      auMoinsUnBandeau: cartes.some((c) => c.aBandeau),
      bandeauxComplets: cartes.every((c) => c.bandeauOk),
      auMoinsUneSansBandeau: cartes.some((c) => !c.aBandeau),
      sansBadgeExterieur: !badgeExterieur,
      sansPrix: !/€\s*\/\s*personne|À partir de\s*\d+\s*€/.test(body),
      debordement:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  nb(g.nbCartes >= 5, `${largeur} : cartes présentes (${g.nbCartes})`);
  nb(g.bordurePartout, `${largeur} : contour gris (1 px) sur chaque carte`);
  nb(g.photoCarreeArrondie, `${largeur} : photo carrée + arrondie (cercle indép. / carré arrondi société)`);
  nb(g.photoTaille, `${largeur} : photo ~28 % de la largeur de la carte`);
  nb(g.metierVillePartout, `${largeur} : ligne « Métier · Ville » (séparateur ·) dans chaque carte`);
  nb(g.sansPrefixes, `${largeur} : plus de préfixe « Métier : » ni « Intervient sur »`);
  nb(g.grillePartout, `${largeur} : ligne des 3 chiffres présente`);
  nb(g.boutonAppeler && g.boutonWhatsapp, `${largeur} : boutons « Appeler » et « Whatsapp » présents`);
  nb(g.auMoinsUnStatut, `${largeur} : joignabilité en ligne colorée DANS la carte`);
  nb(g.auMoinsUnePuce, `${largeur} : puce ronde de ~6 px devant la joignabilité`);
  nb(g.nomClamp2Partout, `${largeur} : nom limité à 2 lignes max (line-clamp-2)`);
  nb(g.sansDisponible, `${largeur} : statut « Joignable » (plus aucun « Disponible »)`);
  nb(g.actionsEgalesPartout, `${largeur} : Appeler / Whatsapp / Partager = même hauteur (≈48 px)`);
  nb(g.boutonsCoinsPartout, `${largeur} : boutons à coins ~12 px (jamais capsule)`);
  nb(g.partagePartout, `${largeur} : bouton « Partager » dans la rangée d'action (à la place du cœur)`);
  nb(g.coeurAnglePartout, `${largeur} : cœur favori SEUL (sans encadré) en HAUT À DROITE de la carte`);
  nb(g.auMoinsUnBandeau && g.bandeauxComplets, `${largeur} : bandeau niveau + « Score de confiance X/100 » DANS la carte`);
  nb(g.auMoinsUneSansBandeau, `${largeur} : carte sans badge = sans bandeau (conditionnel)`);
  nb(g.sansBadgeExterieur, `${largeur} : plus aucun badge de niveau éjecté sous la carte`);
  nb(g.sansPrix, `${largeur} : aucun prix`);
  nb(g.debordement <= 0, `${largeur} : aucun débordement horizontal (${g.debordement}px)`);

  await ctx.close();
}

await navigateur.close();
console.log(erreurs === 0 ? "\nTOUT EST BON" : `\n${erreurs} PROBLÈME(S)`);
process.exit(erreurs === 0 ? 0 : 1);
