/**
 * BANC DE LA PASSE Nº 293 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 tous les bords sur des pixels entiers — l'enveloppe, le cadre,
 *    les colonnes, ensemble — et la photo qui remplit sa colonne sur
 *    ses quatre côtés ; la sonde relève désormais ces nombres ;
 * §2 le voile de la page (web), frère des plaques dans le corps du
 *    document, sous la barre, qui referme au clic sans qu'un second
 *    mécanisme ait été écrit ;
 * §3 un carrousel n'est jamais vide, quel que soit le chemin ;
 * §4 le sous-titre du nom, 12 → 14 px aux deux largeurs.
 * ⚠️ UNE SEULE FENÊTRE, ET C'EST LA SIENNE : 1440 × 823, densité 2.
 * Aucun banc de régression rejoué ici : consigne de livraison rapide.
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

const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetre = sansNotes(lire("src/components/FenetreFiche.tsx"));
const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const sonde = sansNotes(lire("src/components/SondePhoto.tsx"));
const voile = sansNotes(lire("src/components/VoileDeLaPage.tsx"));
const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));

const FICHE = "atelier-corvus-lyon-1er";

titre("§1 — à la source : plus un seul bord fractionnaire");
{
  verif(
    "LA LARGEUR EST UN MULTIPLE DE 4, et le nombre est DÉDUIT : le " +
      "format 4/5 veut × 1,25, donc seule une largeur multiple de 4 " +
      "rend une hauteur entière (4k × 1,25 = 5k)",
    /Math\.floor\(\(libre \* 0\.8\) \/ 4\) \* 4/.test(fiche) &&
      /--photo-largeur/.test(fiche)
  );
  verif(
    "L'ENVELOPPE CONSOMME CE NOMBRE — elle ne recalcule plus rien, " +
      "c'est elle qui échappait à l'arrondi de la nº 280",
    /lg:w-\[var\(--photo-largeur,calc\(\(100vh_-_119px\)\*0\.8\)\)\]/.test(fiche)
  );
  verif(
    "CE QUI A ÉTÉ PAYÉ CHER TIENT ENCORE : l'arrondi de la nº 280, le " +
      "format 4/5 et le `min-h-0` de la nº 292, le défilement natif " +
      "avec accrochage, le calage au pixel de la nº 282",
    /w-\[round\(down,100%,1px\)\]/.test(carrousel) &&
      /CADRE_PHOTO_PORTFOLIO : ""/.test(carrousel) &&
      /min-h-0/.test(carrousel) &&
      /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel)
  );
  verif(
    "AUCUN APERÇU N'EST REVENU : ni `srcset`, ni `sizes`, ni fondu",
    !/srcset|sizes=|transition-opacity/.test(
      sansNotes(lire("src/components/PhotoProgressive.tsx"))
    )
  );
  verif(
    "§1-e — LA SONDE RELÈVE LES SIX NOMBRES DEMANDÉS, verts à zéro : " +
      "les deux fractions de bord du cadre, la largeur d'une colonne " +
      "et sa fraction, et les quatre écarts photo/colonne",
    [
      "fraction du bord GAUCHE",
      "fraction du bord HAUT",
      "colonne · fraction de la LARGEUR",
      "photo/colonne · écart HAUT",
      "photo/colonne · écart BAS",
      "photo/colonne · écart GAUCHE",
      "photo/colonne · écart DROITE",
    ].every((ligne) => sonde.includes(ligne)) &&
      /Math\.abs\(valeur\) < 0\.001 \? "bon" : "mauvais"/.test(sonde)
  );
  verif(
    "…et elle NOMME ENFIN LES TROIS BOÎTES : l'enveloppe, le cadre, la " +
      "colonne. Les confondre est ce qui a fait conclure faux",
    /enveloppe · largeur/.test(sonde) &&
      /cadre · largeur/.test(sonde) &&
      /colonne · largeur/.test(sonde) &&
      !/cle: "cadre · haut"/.test(sonde)
  );
}

titre("§2 — le voile : comment on garantit que la plaque floute LA PAGE");
{
  verif(
    "IL VIT DANS UN PORTAIL AU CORPS DU DOCUMENT — donc FRÈRE des " +
      "plaques, jamais leur ancêtre : il ne peut pas leur fabriquer " +
      "une racine d'arrière-plan",
    /createPortal\(/.test(voile) && /document\.body\s*\);/.test(voile)
  );
  verif(
    "AUCUN FONDU, AUCUNE TRANSFORMATION : `transition: none` écrit, " +
      "et pas la moindre opacité partielle ni `transform` (nº 234)",
    /transition: "none"/.test(voile) &&
      !/opacity/.test(voile) &&
      !/transform/.test(voile) &&
      !/will-change|isolation|filter:/.test(voile)
  );
  verif(
    "IL EST LÉGER (18 %) — le remède exact de la nº 234, qui avait " +
      "ramené un voile de 55 % à 25 % : la plaque lit la page à travers",
    /rgba\(0, 0, 0, 0\.18\)/.test(voile)
  );
  verif(
    "IL COMMENCE AU BAS DE LA BARRE, mesuré — jamais une hauteur " +
      "recopiée, et jamais un `z-index` sous la barre (elle est " +
      "elle-même une plaque : elle flouterait le voile et s'assombrirait)",
    /getBoundingClientRect\(\)\.bottom/.test(voile) &&
      /top: hautDeLaBarre/.test(voile)
  );
  verif(
    "AUCUN SECOND MÉCANISME DE FERMETURE : le voile n'écoute rien, " +
      "n'arrête rien — il est simplement « à l'extérieur » de chaque " +
      "conteneur, et les fermetures au clic extérieur font le reste",
    !/onClick|onPointerDown|stopPropagation|addEventListener\("click/.test(
      voile.slice(voile.indexOf("return createPortal("))
    )
  );
  verif(
    "WEB UNIQUEMENT, décidé au moment de l'ouverture (le serveur ne " +
      "connaît pas l'appareil)",
    /dataset\.appareil === "mobile"\) return;/.test(voile)
  );
  verif(
    "UN COMPTE PARTAGÉ, comme le gel du corps : la première surface " +
      "pose, la dernière retire — et LE GEL N'EST PAS TOUCHÉ",
    /compte = Math\.max\(0, compte - 1\)/.test(
      sansNotes(lire("src/lib/voile-de-la-page.ts"))
    ) && !/gelerLeCorps/.test(voile)
  );
  verif(
    "LES CINQ SURFACES, ET PAS UNE DE PLUS : compte, filtres, menu du " +
      "moteur (web + doigt), menus de Ma sélection, localité du moteur",
    /useVoileDeLaPage\(ouvert\)/.test(sansNotes(lire("src/components/MenuEspace.tsx"))) &&
      /useVoileDeLaPage\(filtresOuverts\)/.test(
        sansNotes(lire("src/components/MoteurTatouage.tsx"))
      ) &&
      (sansNotes(lire("src/components/MoteurTatouage.tsx")).match(/avecVoile/g) ?? [])
        .length === 2 &&
      /avecVoile/.test(sansNotes(lire("src/components/MenusSelection.tsx"))) &&
      /useVoileDeLaPage\(pourLeMoteur && listeOuverte\)/.test(
        sansNotes(lire("src/components/ChampLocalisation.tsx"))
      ) &&
      ["src/components/FormulaireFiche.tsx", "src/components/FormulaireContact.tsx"].every(
        (chemin) => !/avecVoile/.test(lire(chemin))
      )
  );
}

titre("§3 et §4 — à la source");
{
  verif(
    "§3 — ON NE SE POSE JAMAIS SUR UN GROUPE VIDE : à défaut, le " +
      "premier qui a des photos — sur la PAGE comme dans la FENÊTRE",
    [fiche, fenetre].every((texte) =>
      /groupe\.slug === styleAffiche && groupe\.photos\.length > 0\s*\)\s*\?\?\s*groupesGarnis\[0\]/.test(
        texte.replace(/\s+/g, " ").replace(/\) \?\?/g, ") ??")
      )
    )
  );
  verif(
    "§3 — ET UN CARROUSEL VIDE NE RÉSERVE PLUS DE PLACE : le format " +
      "4/5 de la nº 292 aurait fait un grand rectangle noir",
    /n > 0 \? CADRE_PHOTO_PORTFOLIO : ""/.test(carrousel)
  );
  verif(
    "§4 — LE SOUS-TITRE PASSE À 14 px, aux deux largeurs (aucun " +
      "palier : c'est la même valeur au doigt et au web)",
    /text-\[14px\] font-semibold uppercase tracking-\[0\.12em\]/.test(contenu) &&
      !/text-\[12px\] font-semibold uppercase/.test(contenu)
  );
}

titre("vivant — 1440 × 823, densité 2 : LA FENÊTRE DU PROPRIÉTAIRE");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 823 },
      deviceScaleFactor: 2,
    });
    const page = await contexte.newPage();
    const plaintes = [];
    page.on("console", (m) => {
      if (m.type() === "error") plaintes.push(m.text());
    });

    /* ---------- §1 — tous les bords, au millième ------------------- */
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);
    const g = await page.evaluate(() => {
      const env = document.querySelector("[data-photo-fiche]");
      const cadre = env.querySelector('[data-role="cadre"]');
      const col = env.querySelector('[data-role="colonne 0"]');
      const img = col.querySelector("img");
      const fr = (v) => v - Math.round(v);
      const e = env.getBoundingClientRect();
      const c = cadre.getBoundingClientRect();
      const k = col.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const barre = document.querySelector("header").getBoundingClientRect();
      return {
        ecran: window.innerHeight,
        env: { w: e.width, h: e.height, right: e.right, bottom: e.bottom },
        cadre: {
          w: c.width, h: c.height,
          fracG: fr(c.left), fracH: fr(c.top),
          fracW: fr(c.width), fracHt: fr(c.height),
        },
        colonne: { w: k.width, fracW: fr(k.width) },
        ecarts: {
          haut: i.top - k.top, bas: k.bottom - i.bottom,
          gauche: i.left - k.left, droite: k.right - i.right,
        },
        bandeDroite: e.right - c.right,
        dessus: e.top - barre.bottom,
        dessous: window.innerHeight - e.bottom,
      };
    });
    verif(
      "LES QUATRE FRACTIONS DU CADRE VALENT ZÉRO — bord gauche, bord " +
        "haut, largeur, hauteur",
      [g.cadre.fracG, g.cadre.fracH, g.cadre.fracW, g.cadre.fracHt].every(
        (f) => Math.abs(f) < 0.001
      ),
      `G ${g.cadre.fracG} · H ${g.cadre.fracH} · L ${g.cadre.fracW} · Ht ${g.cadre.fracHt}`
    );
    verif(
      "LA COLONNE TOMBE JUSTE ELLE AUSSI, et elle vaut le cadre : les " +
        "positions d'arrêt du défilement sont donc entières",
      Math.abs(g.colonne.fracW) < 0.001 &&
        Math.abs(g.colonne.w - g.cadre.w) < 0.001,
      `colonne ${g.colonne.w} · cadre ${g.cadre.w}`
    );
    verif(
      "LA BANDE D'ENVELOPPE À DROITE DU CADRE A DISPARU — c'était elle, " +
        "les 0,594 px du relevé : une lame de fond de carte sur toute " +
        "la hauteur, à droite de la photo",
      Math.abs(g.bandeDroite) < 0.001,
      `${g.bandeDroite}`
    );
    verif(
      "LA PHOTO REMPLIT SA COLONNE SUR SES QUATRE CÔTÉS : aucun " +
        "interstice, donc aucun morceau de la voisine",
      Object.values(g.ecarts).every((e) => Math.abs(e) < 0.001),
      `haut ${g.ecarts.haut} · bas ${g.ecarts.bas} · gauche ${g.ecarts.gauche} · droite ${g.ecarts.droite}`
    );
    verif(
      "LE FORMAT 4/5 EST INTACT et rien ne déborde sous l'écran",
      Math.abs(g.cadre.h - g.cadre.w * 1.25) < 0.001 &&
        g.env.bottom <= g.ecran,
      `${g.cadre.w} × 1,25 = ${g.cadre.w * 1.25} · mesuré ${g.cadre.h}`
    );
    verif(
      "les deux marges restent jumelles — l'écart est le reste du " +
        "calage sur 4 px, et il va toujours EN BAS (jamais un débordement)",
      g.dessous >= g.dessus && g.dessous - g.dessus <= 5,
      `dessus ${g.dessus} · dessous ${g.dessous}`
    );

    /* ---------- §2 — le voile -------------------------------------- */
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    const lireVoile = () =>
      page.evaluate(() => {
        const v = document.querySelector("[data-voile-page]");
        if (!v) return null;
        const style = getComputedStyle(v);
        const barre = document.querySelector("header").getBoundingClientRect();
        return {
          top: v.getBoundingClientRect().top,
          basBarre: barre.bottom,
          fond: style.backgroundColor,
          z: Number(style.zIndex),
          transition: style.transitionProperty,
          transform: style.transform,
          parent: v.parentElement.tagName,
        };
      });
    verif(
      "AU REPOS, LE VOILE N'EXISTE PAS",
      (await lireVoile()) === null
    );
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(800);
    const v = await lireVoile();
    const plaque = await page.evaluate(() => {
      const p = document.querySelector("[data-verre-menu]");
      if (!p) return null;
      const style = getComputedStyle(p);
      return {
        z: Number(style.zIndex),
        filtre: style.backdropFilter || style.webkitBackdropFilter,
        parent: p.parentElement.tagName,
      };
    });
    verif(
      "MENU DU MOTEUR OUVERT : le voile est là, il COMMENCE AU BAS DE " +
        "LA BARRE (qui reste donc claire), et il est léger",
      v !== null &&
        Math.abs(v.top - v.basBarre) < 0.5 &&
        v.fond === "rgba(0, 0, 0, 0.18)",
      v ? `haut ${v.top} · bas de barre ${v.basBarre} · ${v.fond}` : "absent"
    );
    verif(
      "LA PLAQUE FLOUTE LA PAGE, PAS LE VOILE — et voici les trois " +
        "nombres qui le garantissent : voile et plaque sont FRÈRES " +
        "dans le corps du document, la plaque est AU-DESSUS, et son " +
        "filtre est intact",
      v !== null &&
        plaque !== null &&
        v.parent === "BODY" &&
        plaque.parent === "BODY" &&
        plaque.z > v.z &&
        /blur/.test(plaque.filtre),
      plaque
        ? `voile z${v.z} (${v.parent}) · plaque z${plaque.z} (${plaque.parent}) · ${plaque.filtre}`
        : "aucune plaque"
    );
    verif(
      "AUCUNE TRANSITION, AUCUNE TRANSFORMATION sur le voile",
      v !== null && v.transition === "none" && v.transform === "none",
      v ? `${v.transition} · ${v.transform}` : "absent"
    );
    await page.mouse.click(200, 700);
    await page.waitForTimeout(800);
    verif(
      "UN CLIC SUR LE VOILE REFERME — par le mécanisme de clic " +
        "extérieur qui existait déjà, aucun second n'a été écrit",
      (await lireVoile()) === null
    );
    await page.locator('button[aria-label="Filtres"]').first().click();
    await page.waitForTimeout(800);
    verif(
      "LA FENÊTRE DES FILTRES le pose elle aussi",
      (await lireVoile()) !== null
    );

    /* ---------- §4 — le sous-titre, mesuré ------------------------- */
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    const titres = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return {
        nom: getComputedStyle(h1).fontSize,
        sousTitre: getComputedStyle(h1.nextElementSibling).fontSize,
      };
    });
    verif(
      "§4 — LE SOUS-TITRE FAIT 14 px, et il reste sous le nom (19 px " +
        "au web) : la hiérarchie tient",
      titres.sousTitre === "14px" &&
        parseFloat(titres.sousTitre) < parseFloat(titres.nom),
      `nom ${titres.nom} · sous-titre ${titres.sousTitre}`
    );
    verif(
      "et le navigateur ne se plaint de rien",
      plaintes.length === 0,
      plaintes.slice(0, 2).join(" | ") || "aucune plainte"
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§1 dans Safari, et sur « Mon portfolio »",
  "ni WebKit ni session ici — c'est pour cela que la sonde relève " +
    "désormais les six nombres demandés. Ce qui est prouvé ici : plus " +
    "aucun bord fractionnaire, et la photo qui remplit sa colonne sur " +
    "ses quatre côtés"
);
nonJoue(
  "§3 tel que relevé (une fiche ouverte depuis une autre, au doigt)",
  "il ne se reproduit pas sur les fiches de démonstration : mesuré au " +
    "doigt, le lien interne mène bien à une fiche AVEC sa photo (trois " +
    "colonnes). Le repli sans paramètres n'était donc pas la cause — " +
    "ce qui est fermé ici, c'est le seul chemin qui donne ce " +
    "symptôme-là : un groupe sans photo"
);
nonJoue(
  "§2 sur les deux menus de « Ma sélection » en vivant",
  "ils ne s'affichent qu'avec des favoris ou des suivis enregistrés, " +
    "donc une session : le drapeau est vérifié à la source, et le " +
    "composant qui le consomme est celui mesuré ci-dessus"
);

process.exit(bilan());
