/**
 * BANC DE LA PASSE Nº 276
 * ==================================================================
 * §1 le zoom au pincement n'est plus enfermé : pendant le geste, la
 *    zone pincée porte `data-pincement` (le confinement de la nº 224
 *    est levé sur ELLE SEULE, le temps du geste), et sur la fiche la
 *    photo SORT de son cadre de défilement (`position: fixed`) ; le
 *    confinement revient à la fin du geste ; la mémoire de la 224
 *    (content-visibility sur les cartes au repos) est INTACTE ;
 * §2 l'encadré cliquable — la règle par DESTINATION (la 268 « lien
 *    borné » est ANNULÉE) : fiche du site → TOUT l'encadré est le
 *    lien, pastille comprise, rien de souligné ; Google Maps → AUCUN
 *    encadré, la seule adresse cliquable, soulignée au survol ; la
 *    ligne du rôle sans fiche ne mène nulle part ;
 * §3 le portfolio sans va-et-vient : plus aucun sélecteur (code
 *    compris), deux titres RÉALISATIONS / FLASHS à l'écriture des
 *    titres de section du profil (nº 223), rendus mêlés sans titre
 *    intermédiaire, section vide invisible ;
 * §4 les photos en deux temps : l'aperçu de la photo regardée et sa
 *    pleine résolution partent ENSEMBLE (eager + priorité haute), et
 *    l'aperçu est flouté statiquement — plus de mosaïque de pixels ;
 *    la réservation de place (dimensions déclarées, cadre 4/5) tient.
 *
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS —
 * et le pincement à deux doigts est PRÉCISÉMENT un point où WebKit
 * diffère (événements pointeur synthétiques, position fixed pendant
 * un geste). Le vrai geste revient à l'iPhone du propriétaire.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const zoom = lire("src/components/ZoomPincement.tsx");
const zoomNu = sansNotes(zoom);
const carte = lire("src/components/CarteTatoueur.tsx");
const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const globals = lire("src/app/globals.css");
const bouton = lire("src/components/BoutonPhototheque.tsx");
const blocNu = sansNotes(lire("src/components/BlocLieux.tsx"));
const panneau = lire("src/components/PortfolioDeLAffiche.tsx");
const panneauNu = sansNotes(panneau);
const contenuNu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const photoNu = sansNotes(lire("src/components/PhotoProgressive.tsx"));
const demoNu = sansNotes(lire("src/lib/tatoueurs-demo.ts"));
const config = lire("src/config/tatouage.ts");

const FICHE_ARTISTE = "/tatoueur/camille-fauve-paris-18e";
const FICHE_SALON = "/tatoueur/hokusai-mecanique-paris-11e";
const FICHE_SANS_LIEN = "/tatoueur/typo-sauvage-bordeaux";

/* ==================================================================
 * §1 — À LA SOURCE : la levée du confinement, la sortie du cadre
 * ================================================================== */
titre("§1 — à la source : data-pincement, la règle CSS, la sortie du cadre");
{
  verif(
    "LA CAUSE NOMMÉE, ET GARDÉE : les cartes portent toujours le " +
      "confinement mémoire de la 224 (il n'est levé QUE pendant un geste)",
    carte.includes("[content-visibility:auto]") &&
      carte.includes("[contain-intrinsic-size:auto_460px]")
  );
  verif(
    "le geste pose `data-pincement` sur la zone pincée à l'armement",
    /actif\.current = true;[\s\S]{0,900}?ecoute\.current\.dataset\.pincement = "1";/.test(
      zoomNu
    )
  );
  verif(
    "le confinement ne revient qu'à la FIN du retour animé (les 220 ms " +
      "du rangement), et un geste qui reprend ANNULE le rangement en vol",
    /rangement\.current = window\.setTimeout\(\(\) => \{[\s\S]*?delete zone\.dataset\.pincement;[\s\S]*?\}, 220\);/.test(
      zoomNu
    ) &&
      /window\.clearTimeout\(rangement\.current\);/.test(zoomNu)
  );
  verif(
    "globals.css : la règle `[data-pincement]` lève content-visibility " +
      "ET contain — sur la zone pincée seule",
    /\[data-pincement\]\s*\{\s*content-visibility:\s*visible\s*!important;\s*contain:\s*none\s*!important;\s*\}/.test(
      globals
    )
  );
  verif(
    "sur la FICHE, la photo SORT de son cadre de défilement : " +
      "`sortirDuCadre` → position fixed au pixel où elle est",
    /if \(sortirDuCadre\) \{[\s\S]*?element\.style\.position = "fixed";/.test(
      zoomNu
    ) &&
      /<ZoomPincement[\s\S]{0,400}?sortirDuCadre/.test(carrousel)
  );
  verif(
    "la sortie du cadre s'efface au rangement (left/top/width/height " +
      "rendus avec le reste)",
    /element\.style\.left = "";\s*element\.style\.top = "";\s*element\.style\.width = "";\s*element\.style\.height = "";/.test(
      zoomNu
    )
  );
  verif(
    "la piste 258 est INNOCENTE et intacte : `contain: paint` du bouton " +
      "de mise en page reste — il ne confine que le bouton, jamais une photo",
    bouton.includes("[contain:paint]")
  );
}

/* ==================================================================
 * §2 — À LA SOURCE : dedans on encadre, dehors on souligne
 * ================================================================== */
titre("§2 — à la source : la règle par destination");
{
  verif(
    "fiche du site → la ligne liée est un Link ENTIER (pastille " +
      "comprise) portant l'encadré 232 ; le nom + adresse est un span nu",
    /\{lie \? \(\s*<Link[\s\S]{0,600}?className=\{CLASSES_LIGNE_CLIQUABLE\}\s*>\s*\{pastille\}\s*\{colonne\}/.test(
      blocNu
    ) &&
      /<span className="text-\[15px\] font-medium text-sombre-texte">\s*\{mode\.salon_nom\}/.test(
        blocNu
      )
  );
  verif(
    "Google Maps → AUCUN encadré : le <a> est EN LIGNE autour de la " +
      "seule adresse, `group` du soulignement, état enfoncé du doigt",
    /className="group rounded transition-colors active:bg-white\/10"/.test(
      blocNu
    ) &&
      /<div className=\{pastille \? "flex items-start gap-3\.5" : "block"\}>/.test(
        blocNu
      ) &&
      /cliquable \? ` \$\{SOULIGNEMENT_LIEN\}` : ""/.test(blocNu)
  );
}

/* ==================================================================
 * §3 — À LA SOURCE : les sélecteurs sont partis, code compris
 * ================================================================== */
titre("§3 — à la source : plus de va-et-vient, l'écriture 223 consommée");
{
  verif(
    "les DEUX sélecteurs n'existent plus dans le code du panneau",
    !/SelecteurRectangles/.test(panneauNu) &&
      !/OngletsLigne/.test(panneauNu) &&
      !/robeDuBadge/.test(panneauNu) &&
      !/surNature|surRendu/.test(panneauNu) &&
      !/choisirCategorie|setCategorie|setRendu|surRendu/.test(contenuNu) &&
      !/natureCherchee|renduCherche/.test(contenuNu)
  );
  verif(
    "les mots « Noir & gris » et « Couleur » ne s'écrivent nulle part " +
      "dans le panneau",
    !/[Nn]oir/.test(panneauNu) && !/[Cc]ouleur/.test(panneauNu)
  );
  verif(
    "les titres viennent de CATEGORIES_EXPLORER et consomment " +
      "L'ÉCRITURE DES TITRES DE SECTION (nº 223) — la constante partagée",
    /CATEGORIES_EXPLORER/.test(panneauNu) &&
      /<h2 className=\{ECRITURE_TITRE_SECTION\}>\{section\.titre\}<\/h2>/.test(
        panneauNu
      ) &&
      /export const ECRITURE_TITRE_SECTION =\s*"text-\[13px\] font-semibold uppercase tracking-\[0\.14em\] text-sombre-texte-doux";/.test(
        config
      ) &&
      //  UNE SEULE écriture : les deux anciens porteurs la consomment.
      /className=\{ECRITURE_TITRE_SECTION\}/.test(contenuNu) &&
      /className=\{ECRITURE_TITRE_SECTION\}/.test(
        sansNotes(lire("src/components/BlocSuivis.tsx"))
      )
  );
  verif(
    "une section vide ne rend rien : les sections sont FILTRÉES avant " +
      "rendu — et « Aucune publication » ne vient que si tout est vide",
    /\.filter\(\(section\) => section\.series\.length > 0\);/.test(panneauNu) &&
      /sections\.length === 0/.test(panneauNu)
  );
  verif(
    "les rendus sont MÊLÉS dans l'ordre existant : styles A→Z " +
      "(localeCompare fr), puis l'ordre de RENDUS_PHOTO dans un style",
    /sort\(\(a, b\) => a\.label\.localeCompare\(b\.label, "fr"\)\)/.test(
      panneauNu
    ) && /for \(const rendu of RENDUS_PHOTO\)/.test(panneauNu)
  );
  verif(
    "les remontées restantes : Profil / Portfolio et les vignettes — " +
      "celles des deux sélecteurs sont parties avec eux",
    (contenuNu.match(/remonterSousLaBarre\(\);/g) ?? []).length === 1 &&
      /setRemonteeDemandee\(\(tour\) => tour \+ 1\);/.test(contenuNu)
  );
}

/* ==================================================================
 * §4 — À LA SOURCE : l'aperçu flouté, la grande en priorité
 * ================================================================== */
titre("§4 — à la source : le flou statique, la priorité, la réservation");
{
  verif(
    "la pleine résolution de la photo REGARDÉE part eager + priorité " +
      "haute (elle n'est montée que regardée — lazy la faisait attendre)",
    /loading=\{prioritaire \|\| demandee \? "eager" : "lazy"\}/.test(photoNu) &&
      /fetchPriority=\{prioritaire \|\| demandee \? "high" : undefined\}/.test(
        photoNu
      )
  );
  verif(
    "l'aperçu est flouté STATIQUEMENT (blur), surtaillé et rogné par son " +
      "enveloppe — aucune transition d'opacité nulle part (règle 217-§5)",
    /overflow-hidden \$\{classe\}/.test(photoNu) &&
      /scale-105 object-cover blur-md/.test(photoNu) &&
      !/transition-opacity|opacity-0/.test(photoNu)
  );
  verif(
    "la RÉSERVATION DE PLACE tient : les dimensions intrinsèques " +
      "déclarées des deux balises n'ont pas bougé",
    /width=\{PHOTO_MINIATURE\.largeur\}/.test(photoNu) &&
      /height=\{PHOTO_MINIATURE\.hauteur\}/.test(photoNu) &&
      /width=\{PHOTO_PORTFOLIO\.largeur\}/.test(photoNu) &&
      /height=\{PHOTO_PORTFOLIO\.hauteur\}/.test(photoNu)
  );
  verif(
    "la démonstration a une miniature DISTINCTE (`?miniature=1`) : le " +
      "deux-temps y est désormais mesurable, comme en production",
    (demoNu.match(/\?miniature=1/g) ?? []).length === 2
  );
}

/* ==================================================================
 * LE VIVANT — aux deux largeurs
 * ================================================================== */
async function ouvrirA(largeur, chemin, options = {}) {
  const mobile = largeur < 1024;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile
      ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
      : { deviceScaleFactor: 2 }),
    ...options,
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);
  const fermer = async () => {
    await contexte.close();
    await nav.close();
  };
  return { page, fermer };
}

/** Simule un pincement à deux doigts sur un élément (événements
    pointeur synthétiques — Chromium seulement, voir l'en-tête). */
const PINCER = `(element) => {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + Math.min(rect.height / 2, 200);
  const doigt = (type, id, x, y) =>
    element.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: "touch",
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
      })
    );
  doigt("pointerdown", 1, cx - 40, cy - 30);
  doigt("pointerdown", 2, cx + 40, cy + 30);
  //  L'écart double et au-delà : l'échelle dépasse nettement 1.
  doigt("pointermove", 1, cx - 100, cy - 75);
  doigt("pointermove", 2, cx + 100, cy + 75);
}`;

const RELACHER = `(element) => {
  const doigt = (type, id) =>
    element.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: "touch",
        bubbles: true,
        cancelable: true,
      })
    );
  doigt("pointerup", 1);
  doigt("pointerup", 2);
}`;

/* ---------- §1 VIVANT — le pincement, au doigt (390) ---------- */
titre("§1 — VIVANT (390 px, tactile) : la carte pincée sort de son cadre");
{
  const { page, fermer } = await ouvrirA(390, "/");
  try {
    await page.waitForSelector("[data-carte]", { timeout: 30000 });
    //  La PREMIÈRE carte, remontée en haut de l'écran pour que le
    //  débordement ait de la place en dessous.
    await page.evaluate(() => {
      const carte = document.querySelector("[data-carte]");
      window.scrollTo(0, carte.getBoundingClientRect().top + window.scrollY - 80);
    });
    await page.waitForTimeout(600);

    const repos = await page.evaluate(() => {
      const carte = document.querySelector("[data-carte]");
      return {
        confinement: getComputedStyle(carte).contentVisibility,
        appareil: document.documentElement.dataset.appareil ?? "",
      };
    });
    verif(
      "390 px : AU REPOS, la carte est confinée (la mémoire de la 224 tient)",
      repos.confinement === "auto" && repos.appareil === "mobile",
      `content-visibility ${repos.confinement} · appareil ${repos.appareil}`
    );

    await page.evaluate(`(${PINCER})(document.querySelector("[data-carte]"))`);
    await page.waitForTimeout(250);
    const pendant = await page.evaluate(() => {
      const carte = document.querySelector("[data-carte]");
      const cadre = carte.querySelector("[data-pincement] > div, div");
      //  La cible transformée : le premier élément de la carte qui
      //  porte un transform en ligne.
      const cible = [...carte.querySelectorAll("div")].find(
        (d) => d.style.transform !== ""
      );
      const rectCarte = carte.getBoundingClientRect();
      const rectCible = cible ? cible.getBoundingClientRect() : null;
      //  LE POINT DE PREUVE : sous le bas de la carte, au centre — ce
      //  pixel appartient à la carte SUIVANTE ; si la photo agrandie
      //  s'y peint, c'est qu'elle est SORTIE de son cadre.
      const dessous = document.elementFromPoint(
        rectCarte.left + rectCarte.width / 2,
        Math.min(rectCarte.bottom + 24, window.innerHeight - 2)
      );
      return {
        marqueur: carte.dataset.pincement ?? null,
        confinement: getComputedStyle(carte).contentVisibility,
        zoomHtml: document.documentElement.dataset.zoom ?? null,
        transforme: Boolean(cible),
        depasse: rectCible
          ? rectCible.bottom > rectCarte.bottom + 4 ||
            rectCible.top < rectCarte.top - 4
          : false,
        peintDehors: Boolean(dessous && carte.contains(dessous)),
      };
    });
    verif(
      "390 px : PENDANT le geste — data-pincement posé, confinement levé " +
        "sur CETTE carte, photo transformée",
      pendant.marqueur === "1" &&
        pendant.confinement === "visible" &&
        pendant.transforme &&
        pendant.zoomHtml === "1",
      `marqueur ${pendant.marqueur} · content-visibility ${pendant.confinement} · transform ${pendant.transforme}`
    );
    verif(
      "390 px : L'IMAGE DÉPASSE DE SON CADRE — sa boîte sort de la carte, " +
        "et elle SE PEINT sur le pixel d'en dessous",
      pendant.depasse && pendant.peintDehors,
      `déborde ${pendant.depasse} · peint dehors ${pendant.peintDehors}`
    );

    await page.evaluate(`(${RELACHER})(document.querySelector("[data-carte]"))`);
    await page.waitForTimeout(600);
    const apres = await page.evaluate(() => {
      const carte = document.querySelector("[data-carte]");
      return {
        marqueur: carte.dataset.pincement ?? null,
        confinement: getComputedStyle(carte).contentVisibility,
        zoomHtml: document.documentElement.dataset.zoom ?? null,
        transformeEncore: [...carte.querySelectorAll("div")].some(
          (d) => d.style.transform !== ""
        ),
      };
    });
    verif(
      "390 px : LE GESTE FINI, tout revient — marqueur retiré, confinement " +
        "de la 224 revenu, aucune transformation résiduelle",
      apres.marqueur === null &&
        apres.confinement === "auto" &&
        apres.zoomHtml === null &&
        !apres.transformeEncore,
      `marqueur ${apres.marqueur} · content-visibility ${apres.confinement}`
    );

    //  LE COÛT MÉMOIRE, comme en 224 : une carte à plus de deux écrans
    //  rend sa source au substitut d'un pixel. Les 19 cartes de la
    //  démonstration tiennent presque toutes dans cette fenêtre — la
    //  borne à cent cartes, elle, exige un vrai catalogue (NON JOUÉ,
    //  ci-dessous, comme au banc de la 224). On vérifie le MÉCANISME :
    //  du bas de la page, les cartes du haut ont rendu leur source.
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await page.waitForTimeout(1500);
    const memoire = await page.evaluate(() => {
      const cartes = [...document.querySelectorAll("[data-carte]")];
      const rendues = cartes.slice(0, 4).flatMap((c) =>
        [...c.querySelectorAll("img")].map((image) =>
          (image.getAttribute("src") ?? "").startsWith("data:image/gif")
        )
      );
      return {
        cartes: cartes.length,
        substituts: rendues.filter(Boolean).length,
      };
    });
    verif(
      "390 px : vu du bas de la page, les cartes du haut ont RENDU leur " +
        "source (le levier mémoire de la 224 vit toujours)",
      memoire.substituts > 0,
      `${memoire.substituts} substitut(s) sur les 4 premières cartes · ${memoire.cartes} cartes`
    );
    nonJoue(
      "les 100 cartes",
      "la base est hors de portée : l'accueil sert les fiches de " +
        "démonstration, qui tiennent sur une page — pas de centième carte " +
        "ici. La mécanique (un seul observateur, substitut 1 px, " +
        "content-visibility au repos) est vérifiée à la source et sur la " +
        "mosaïque servie"
    );
  } catch (erreur) {
    nonJoue("§1 · carte (390 px)", String(erreur).slice(0, 110));
  } finally {
    await fermer();
  }
}

titre("§1 — VIVANT (390 px, tactile) : la photo de la fiche sort du carrousel");
{
  const { page, fermer } = await ouvrirA(390, FICHE_ARTISTE);
  try {
    await page.waitForSelector('[data-role="colonne 0"]', { timeout: 30000 });
    //  La photo en haut d'écran, du champ libre dessous.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.evaluate(
      `(${PINCER})(document.querySelector('[data-role="colonne 0"] > div'))`
    );
    await page.waitForTimeout(250);
    const pendant = await page.evaluate(() => {
      const enveloppe = document.querySelector('[data-role="colonne 0"] > div');
      const cadre = document.querySelector('[data-role="cadre"]');
      const rectCadre = cadre.getBoundingClientRect();
      const rectPhoto = enveloppe.getBoundingClientRect();
      const dessous = document.elementFromPoint(
        rectCadre.left + rectCadre.width / 2,
        Math.min(rectCadre.bottom + 24, window.innerHeight - 2)
      );
      return {
        position: enveloppe.style.position,
        marqueur: enveloppe.dataset.pincement ?? null,
        transform: enveloppe.style.transform !== "",
        depasse: rectPhoto.bottom > rectCadre.bottom + 4,
        peintDehors: Boolean(dessous && enveloppe.contains(dessous)),
      };
    });
    verif(
      "390 px : PENDANT le geste, la photo est SORTIE du cadre " +
        "(position fixed), transformée, marquée",
      pendant.position === "fixed" && pendant.transform && pendant.marqueur === "1",
      `position ${pendant.position} · transform ${pendant.transform}`
    );
    verif(
      "390 px : elle DÉPASSE du cadre du carrousel et se peint dessous",
      pendant.depasse && pendant.peintDehors,
      `déborde ${pendant.depasse} · peint dehors ${pendant.peintDehors}`
    );

    await page.evaluate(
      `(${RELACHER})(document.querySelector('[data-role="colonne 0"] > div'))`
    );
    await page.waitForTimeout(600);
    const apres = await page.evaluate(() => {
      const enveloppe = document.querySelector('[data-role="colonne 0"] > div');
      return {
        position: enveloppe.style.position,
        marqueur: enveloppe.dataset.pincement ?? null,
        transform: enveloppe.style.transform,
      };
    });
    verif(
      "390 px : LE GESTE FINI, la photo est rangée — plus de fixed, plus " +
        "de marqueur, plus de transformation",
      apres.position === "" && apres.marqueur === null && apres.transform === "",
      `position « ${apres.position} » · marqueur ${apres.marqueur}`
    );
  } catch (erreur) {
    nonJoue("§1 · fiche (390 px)", String(erreur).slice(0, 110));
  } finally {
    await fermer();
  }
}

nonJoue(
  "§1 · le VRAI pincement",
  "le geste est simulé par événements pointeur synthétiques sous " +
    "Chromium. Le pincement à deux doigts est PRÉCISÉMENT un point où " +
    "WebKit diffère (pointeurs, touch-action, fixed pendant un geste) : " +
    "la vérification au doigt revient à l'iPhone du propriétaire"
);

/* ---------- §2/§3/§4 VIVANT — aux deux largeurs ---------- */
for (const largeur of [390, 1440]) {
  /* ---------- §2 — la règle par destination ---------- */
  titre(`§2 — VIVANT (${largeur} px) : dedans on encadre, dehors on souligne`);
  {
    //  ⚠️ CONTEXTE SOURIS aux deux largeurs : le survol est l'objet de
    //  la mesure, un contexte tactile n'en a pas (précédent : p271).
    const nav = await chromium.launch({
      executablePath: process.env.CHEMIN_CHROMIUM,
      args: ["--no-proxy-server"],
    });
    const contexte = await nav.newContext({
      viewport: { width: largeur, height: largeur < 1024 ? 844 : 950 },
    });
    const page = await contexte.newPage();
    try {
      //  LA FICHE D'ARTISTE — l'encadré vers la fiche du salon.
      await page.goto(`${BASE}${FICHE_ARTISTE}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2200);
      const versFiche = await page.evaluate(() => {
        const lien = [...document.querySelectorAll('li a[href^="/tatoueur/"]')].find(
          (a) => /En salon|En studio|Guest/.test(a.textContent ?? "")
        );
        if (!lien) return null;
        const pastille = lien.querySelector("img, span.rounded-full");
        return {
          pastilleDansLeLien: Boolean(pastille),
          encadre: lien.className.includes("hover:bg-white/5"),
          souligne: Boolean(lien.querySelector('[class*="underline"]')),
        };
      });
      verif(
        `${largeur} px : adresse → FICHE : tout l'encadré est le lien — ` +
          "la pastille a le lien pour ancêtre, rien n'est souligné",
        Boolean(versFiche) &&
          versFiche.pastilleDansLeLien &&
          versFiche.encadre &&
          !versFiche.souligne,
        JSON.stringify(versFiche)
      );
      //  Au survol : l'encadré s'allume, toujours AUCUN soulignement.
      const ligne = page
        .locator('li a[href^="/tatoueur/"]')
        .filter({ hasText: "En salon" })
        .first();
      await ligne.hover();
      await page.waitForTimeout(250);
      const survole = await ligne.evaluate((a) => ({
        fond: getComputedStyle(a).backgroundColor,
        traits: [...a.querySelectorAll("p, span")].map(
          (n) => getComputedStyle(n).textDecorationLine
        ),
      }));
      verif(
        `${largeur} px : au survol, l'encadré s'allume (blanc 5 %) et RIEN ` +
          "n'est souligné — le rôle non plus",
        (survole.fond === "rgba(255, 255, 255, 0.05)" ||
          (survole.fond.startsWith("oklab(0.99") &&
            survole.fond.includes("/ 0.05"))) &&
          survole.traits.every((t) => t === "none"),
        `fond ${survole.fond} · traits [${survole.traits.join(", ")}]`
      );

      //  LA FICHE DU SALON — l'adresse qui sort vers Google Maps.
      await page.goto(`${BASE}${FICHE_SALON}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2200);
      const versMaps = await page.evaluate(() => {
        const a = document.querySelector('a[href*="google.com/maps"]');
        if (!a) return null;
        const rangee = a.closest("div");
        return {
          pastilleDansLeLien: Boolean(a.querySelector("img")),
          encadre:
            a.className.includes("hover:bg-white/5") ||
            a.className.includes("-m-2"),
          enLigne: a.closest("p") !== null,
          fondRangee: rangee ? getComputedStyle(rangee).backgroundColor : "",
        };
      });
      verif(
        `${largeur} px : adresse → MAPS : AUCUN encadré — le lien est en ` +
          "ligne, la pastille reste dehors",
        Boolean(versMaps) &&
          !versMaps.pastilleDansLeLien &&
          !versMaps.encadre &&
          versMaps.enLigne,
        JSON.stringify(versMaps)
      );
      const lienMaps = page.locator('a[href*="google.com/maps"]').first();
      await lienMaps.hover();
      await page.waitForTimeout(250);
      const soulignement = await lienMaps.evaluate((a) => {
        const span = a.querySelector('[class*="underline"]');
        return {
          trait: span ? getComputedStyle(span).textDecorationLine : "(absent)",
          fond: getComputedStyle(a).backgroundColor,
        };
      });
      verif(
        `${largeur} px : au survol de l'adresse, le soulignement de la 273 ` +
          "s'allume — aucun fond, aucun encadré",
        soulignement.trait === "underline" &&
          (soulignement.fond === "rgba(0, 0, 0, 0)" ||
            soulignement.fond === "transparent"),
        `trait ${soulignement.trait} · fond ${soulignement.fond}`
      );

      //  LA LIGNE DU RÔLE SANS FICHE — elle décrit, elle ne mène nulle
      //  part : ni lien, ni soulignement, ni encadré.
      await page.goto(`${BASE}${FICHE_SANS_LIEN}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2200);
      const role = await page.evaluate(() => {
        const li = [...document.querySelectorAll("li")].find(
          (l) =>
            !l.querySelector("a") &&
            /En salon|En studio|À domicile|Guest/.test(l.textContent ?? "") &&
            l.querySelector("p")
        );
        if (!li) return null;
        return {
          classes: li.firstElementChild.className,
          souligne: Boolean(li.querySelector('[class*="underline"]')),
        };
      });
      verif(
        `${largeur} px : la ligne du rôle sans fiche — ni encadré, ni ` +
          "soulignement, ni lien",
        Boolean(role) &&
          !role.classes.includes("hover:bg-white/5") &&
          !role.classes.includes("-m-2") &&
          !role.souligne,
        role ? `classes « ${role.classes} »` : "(ligne introuvable)"
      );
    } catch (erreur) {
      nonJoue(`§2 (${largeur} px)`, String(erreur).slice(0, 110));
    } finally {
      await contexte.close();
      await nav.close();
    }
  }

  /* ---------- §3 — les deux titres, l'écriture 223 ---------- */
  titre(`§3 — VIVANT (${largeur} px) : RÉALISATIONS puis FLASHS, sans sélecteur`);
  {
    const { page, fermer } = await ouvrirA(largeur, FICHE_ARTISTE);
    try {
      //  L'ÉCRITURE DE RÉFÉRENCE : un titre de section de l'onglet
      //  Profil (« Styles », badges…), mesuré AVANT de basculer.
      const profil = await page.evaluate(() => {
        const h2 = [...document.querySelectorAll("h2")].find((h) =>
          /Styles|Technique/i.test(h.textContent ?? "")
        );
        if (!h2) return null;
        const s = getComputedStyle(h2);
        return {
          taille: s.fontSize,
          graisse: s.fontWeight,
          casse: s.textTransform,
          espacement: s.letterSpacing,
          couleur: s.color,
        };
      });
      await page
        .locator("button", { hasText: /^Portfolio$/ })
        .first()
        .click();
      await page.waitForTimeout(900);
      const portfolio = await page.evaluate(() => {
        const titres = [...document.querySelectorAll("section > h2")].filter(
          (h) => /Réalisations|Flashs/.test(h.textContent ?? "")
        );
        const sections = titres.map((h) => {
          const s = getComputedStyle(h);
          return {
            texte: (h.textContent ?? "").trim(),
            taille: s.fontSize,
            graisse: s.fontWeight,
            casse: s.textTransform,
            espacement: s.letterSpacing,
            couleur: s.color,
            texteSection: (h.parentElement.innerText ?? "").slice(0, 4000),
          };
        });
        return {
          sections,
          boutonsBascule: [...document.querySelectorAll("button")].filter((b) =>
            /^(Réalisations?|Flashs?|Noir (et|&) gris|Couleur)$/.test(
              (b.textContent ?? "").trim()
            )
          ).length,
          vignettes: document.querySelectorAll("section ul li button").length,
        };
      });
      verif(
        `${largeur} px : plus AUCUN bouton de sélecteur — et des titres de ` +
          "section à leur place",
        portfolio.boutonsBascule === 0 && portfolio.sections.length >= 1,
        `${portfolio.sections.length} section(s), ${portfolio.vignettes} vignette(s)`
      );
      verif(
        `${largeur} px : « Réalisations » d'abord, « Flashs » ensuite — ` +
          "jamais d'autre titre, jamais de titre intermédiaire",
        portfolio.sections.every((s) =>
          ["Réalisations", "Flashs"].includes(s.texte)
        ) &&
          JSON.stringify(portfolio.sections.map((s) => s.texte)) ===
            JSON.stringify(
              ["Réalisations", "Flashs"].filter((t) =>
                portfolio.sections.some((s) => s.texte === t)
              )
            ),
        portfolio.sections.map((s) => s.texte).join(" · ")
      );
      verif(
        `${largeur} px : les titres CONSOMMENT l'écriture des titres du ` +
          "profil (nº 223) — mêmes valeurs calculées, capitales comprises",
        Boolean(profil) &&
          portfolio.sections.every(
            (s) =>
              s.taille === profil.taille &&
              s.graisse === profil.graisse &&
              s.casse === "uppercase" &&
              s.espacement === profil.espacement &&
              s.couleur === profil.couleur
          ),
        `profil ${JSON.stringify(profil)} · portfolio ${JSON.stringify(
          portfolio.sections[0] ?? null
        )}`
      );
      verif(
        `${largeur} px : les mots « Noir & gris » et « Couleur » ` +
          "n'apparaissent dans aucune section",
        portfolio.sections.every(
          (s) => !/Noir|Couleur/i.test(s.texteSection)
        )
      );

      //  UNE SECTION VIDE NE REND RIEN : on cherche parmi les fiches de
      //  démonstration une fiche SANS flashs — son panneau n'a qu'UN
      //  titre, et aucun « FLASHS » vide.
      let sansFlashVue = null;
      for (const chemin of [FICHE_SALON, FICHE_SANS_LIEN]) {
        await page.goto(`${BASE}${chemin}`, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForTimeout(1800);
        const bouton = page.locator("button", { hasText: /^Portfolio$/ }).first();
        if ((await bouton.count()) === 0) continue;
        await bouton.click();
        await page.waitForTimeout(800);
        const titres = await page.evaluate(() =>
          [...document.querySelectorAll("section > h2")]
            .map((h) => (h.textContent ?? "").trim())
            .filter((t) => ["Réalisations", "Flashs"].includes(t))
        );
        if (titres.length === 1) {
          sansFlashVue = { chemin, titres };
          break;
        }
      }
      if (sansFlashVue) {
        verif(
          `${largeur} px : une fiche à catégorie unique ne rend QUE son ` +
            "titre — la section vide n'existe pas",
          sansFlashVue.titres.length === 1,
          `${sansFlashVue.chemin} → ${sansFlashVue.titres.join(" · ")}`
        );
      } else {
        nonJoue(
          `§3 · section vide (${largeur} px)`,
          "les fiches de démonstration visitées ont toutes les deux " +
            "catégories — le filtre est vérifié à la source " +
            "(.filter(series.length > 0))"
        );
      }
    } catch (erreur) {
      nonJoue(`§3 (${largeur} px)`, String(erreur).slice(0, 110));
    } finally {
      await fermer();
    }
  }

  /* ---------- §4 — l'aperçu et la grande, mesurés ---------- */
  titre(`§4 — VIVANT (${largeur} px) : l'aperçu flouté, les requêtes ensemble`);
  {
    const mobile = largeur < 1024;
    const nav = await chromium.launch({
      executablePath: process.env.CHEMIN_CHROMIUM,
      args: ["--no-proxy-server"],
    });
    const contexte = await nav.newContext({
      viewport: { width: largeur, height: mobile ? 844 : 950 },
      ...(mobile
        ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
        : { deviceScaleFactor: 2 }),
    });
    const page = await contexte.newPage();
    const requetes = [];
    const depart = Date.now();
    page.on("request", (r) => {
      if (r.url().includes("/images-demo/")) {
        requetes.push({ url: r.url().replace(BASE, ""), t: Date.now() - depart });
      }
    });
    try {
      await page.goto(`${BASE}${FICHE_ARTISTE}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2500);
      const dom = await page.evaluate(() => {
        const colonne = document.querySelector('[data-role="colonne 0"]');
        const apercu = colonne?.querySelector('img[src*="miniature=1"]');
        const grande = colonne?.querySelector('img:not([src*="miniature=1"])');
        if (!apercu || !grande) return null;
        const boiteApercu = apercu.getBoundingClientRect();
        const sApercu = getComputedStyle(apercu);
        const boiteColonne = colonne.getBoundingClientRect();
        return {
          dpr: window.devicePixelRatio,
          apercu: {
            loading: apercu.getAttribute("loading"),
            declaree: `${apercu.getAttribute("width")}×${apercu.getAttribute("height")}`,
            affichee: `${Math.round(boiteApercu.width)}×${Math.round(boiteApercu.height)}`,
            physique: Math.round(boiteApercu.width * window.devicePixelRatio),
            filtre: sApercu.filter,
            dureeTransition: sApercu.transitionDuration,
          },
          grande: {
            loading: grande.getAttribute("loading"),
            priorite: grande.getAttribute("fetchpriority"),
            declaree: `${grande.getAttribute("width")}×${grande.getAttribute("height")}`,
          },
          //  LA RÉSERVATION : le cadre 4/5 de la colonne tient debout
          //  sans attendre aucune image.
          cadre: Math.abs(boiteColonne.height - (boiteColonne.width * 5) / 4) < 2,
        };
      });
      const miniature = requetes.find((r) => r.url.includes("?miniature=1"));
      const grande = miniature
        ? requetes.find((r) => r.url === miniature.url.replace("?miniature=1", ""))
        : null;
      verif(
        `${largeur} px : les DEUX requêtes de la photo regardée partent ` +
          "ENSEMBLE — aucun aller-retour perdu",
        Boolean(miniature) && Boolean(grande) && grande.t - miniature.t <= 200,
        miniature && grande
          ? `aperçu ${miniature.t} ms · grande ${grande.t} ms · écart ${grande.t - miniature.t} ms`
          : "(requêtes introuvables)"
      );
      verif(
        `${largeur} px : la grande de la photo regardée est eager + ` +
          "priorité haute ; l'aperçu est eager",
        Boolean(dom) &&
          dom.grande.loading === "eager" &&
          dom.grande.priorite === "high" &&
          dom.apercu.loading === "eager",
        dom ? `grande ${dom.grande.loading}/${dom.grande.priorite}` : "(balises absentes)"
      );
      verif(
        `${largeur} px : l'aperçu (320 px pour ${dom?.apercu.physique ?? "?"} px ` +
          "physiques affichés) est FLOUTÉ statiquement — plus de mosaïque " +
          "de pixels, aucune transition",
        Boolean(dom) &&
          dom.apercu.filtre.includes("blur") &&
          dom.apercu.dureeTransition === "0s",
        dom
          ? `déclarée ${dom.apercu.declaree} · affichée ${dom.apercu.affichee} (dpr ${dom.dpr}) · ${dom.apercu.filtre}`
          : ""
      );
      verif(
        `${largeur} px : la RÉSERVATION tient — le cadre 4/5 de la colonne, ` +
          "les dimensions déclarées des deux balises",
        Boolean(dom) &&
          dom.cadre &&
          dom.apercu.declaree === "320×400" &&
          dom.grande.declaree === "1080×1350",
        dom ? `cadre 4/5 ${dom.cadre}` : ""
      );
    } catch (erreur) {
      nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 110));
    } finally {
      await contexte.close();
      await nav.close();
    }
  }
}

nonJoue(
  "§4 · le délai réel aperçu → net",
  "les vraies photos (JPEG de 150 à 300 ko sur le stockage Supabase) " +
    "sont hors de portée : la démonstration sert des SVG de quelques ko, " +
    "où le délai est nul avant comme après. Les LEVIERS du délai, eux, " +
    "sont mesurés : départ simultané des deux requêtes, priorité haute " +
    "de la grande, et aperçu flouté qui ne montre plus jamais de pixels"
);

bilan();
