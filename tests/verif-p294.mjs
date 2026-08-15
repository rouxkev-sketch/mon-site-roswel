/**
 * BANC DE LA PASSE Nº 294 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 rien n'est peint derrière la photo, et la photo couvre sa
 *    colonne QUELLES QUE SOIENT LES FRACTIONS — pleine page ET
 *    fenêtre centrée superposée ;
 * §2 la nº 293-§3 est annulée : un groupe vide reste vide, et la
 *    fiche ouverte depuis un lien interne n'impose plus de photo ;
 * §3 le voile recouvre TOUT, barre comprise, en épargnant le BLOC
 *    ENTIER qui porte l'élément ouvert.
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2 — celle du relevé.
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

const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const fenetre = sansNotes(lire("src/components/FenetreFiche.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const voile = sansNotes(lire("src/components/VoileDeLaPage.tsx"));
const sonde = sansNotes(lire("src/components/SondePhoto.tsx"));

const FICHE = "atelier-corvus-lyon-1er";

titre("§1 — à la source : plus rien de peint derrière la photo");
{
  verif(
    "LA RACINE DU CARROUSEL NE PEINT PLUS RIEN — c'était elle, le " +
      "liseré : `bg-sombre-carte` occupait toute sa boîte, un cran plus " +
      "clair que la page",
    /className="relative select-none"/.test(carrousel) &&
      !/relative bg-sombre-carte select-none/.test(carrousel)
  );
  //  ⚠️ LES DEUX SUIVANTES AMENDÉES À LA nº 295, SUR CONSIGNE. Le fond
  //  descendu sur la colonne était encore une couleur à découvrir : il
  //  part (règle b). Et le débordement d'un pixel FABRIQUAIT le second
  //  défaut — la dernière colonne de pixels de la photo précédente au
  //  bord gauche de celle qu'on regarde : il est annulé (règle a, la
  //  colonne rogne, et c'est désormais prouvé AU PIXEL).
  verif(
    "LA COLONNE ROGNE, ET PLUS RIEN N'Y EST PEINT (nº 295) — la " +
      "réservation de la nº 280 vient du format 4/5, pas d'une couleur",
    /snap-always min-h-0 overflow-hidden \$\{CADRE_PHOTO_PORTFOLIO\}/.test(
      carrousel
    ) && !/overflow-hidden bg-sombre-carte/.test(carrousel)
  );
  verif(
    "LA PHOTO ÉPOUSE EXACTEMENT SA COLONNE (nº 295) : le débordement " +
      "d'un pixel de la nº 294 est annulé",
    (carrousel.match(/absolute inset-0 h-full w-full object-cover/g) ?? [])
      .length === 2
  );
  verif(
    "LA FENÊTRE SUPERPOSÉE N'A PLUS SA PLAQUE NOIRE derrière la photo " +
      "— c'est la moitié « fenêtre » du même défaut",
    !/aspect-\[4\/5\] min-w-0 shrink-0 lg:shrink bg-black/.test(fenetre) &&
      /aspect-\[4\/5\] min-w-0 shrink-0 lg:shrink select-none/.test(fenetre)
  );
  verif(
    "CE QUI A ÉTÉ PAYÉ CHER TIENT ENCORE : le format 4/5 et `min-h-0` " +
      "de la nº 292, l'arrondi de la nº 280, le défilement natif avec " +
      "accrochage, le calage de la nº 282, la restauration de position",
    /n > 0 \? CADRE_PHOTO_PORTFOLIO : ""/.test(carrousel) &&
      /min-h-0/.test(carrousel) &&
      /w-\[round\(down,100%,1px\)\]/.test(carrousel) &&
      /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel) &&
      /left: colonne\.offsetLeft/.test(carrousel)
  );
  verif(
    "AUCUN APERÇU N'EST REVENU : ni `srcset`, ni `sizes`, ni fondu",
    !/srcset|sizes=|transition-opacity/.test(
      sansNotes(lire("src/components/PhotoProgressive.tsx"))
    )
  );
  verif(
    //  ⚠️ AMENDÉE À LA nº 295 : la ligne s'appelle désormais « PEINT
    //  DANS LA CHAÎNE » et couvre AUSSI la colonne et la photo.
    "LA SONDE RELÈVE AUSSI DANS LA FENÊTRE SUPERPOSÉE, elle dit " +
      "laquelle, et elle annonce CE QUI EST PEINT dans la chaîne",
    /data-carrousel="fiche"/.test(sonde) &&
      /FENÊTRE CENTRÉE SUPERPOSÉE/.test(sonde) &&
      /PEINT DANS LA CHAÎNE/.test(sonde) &&
      /CHAQUE COLONNE ROGNE/.test(sonde)
  );
}

titre("§2 — la nº 293-§3 est annulée");
{
  verif(
    "LE CHOIX DU GROUPE REDEVIENT CELUI D'AVANT — le style demandé, " +
      "sinon le premier, garni ou non : sur la PAGE comme dans la FENÊTRE",
    [fiche, fenetre].every(
      (texte) =>
        /groupes\.find\(\(groupe\) => groupe\.slug === styleAffiche\) \?\? groupes\[0\];/.test(
          texte.replace(/\s+/g, " ")
        ) && !/groupesGarnis/.test(texte)
    )
  );
  verif(
    "ET CE QUI RESTE DE LA nº 293 EST GARDÉ : un carrousel sans photo " +
      "ne réserve aucune place — pas de grand rectangle noir",
    /n > 0 \? CADRE_PHOTO_PORTFOLIO : ""/.test(carrousel)
  );
}

titre("§3 — le voile recouvre tout, le bloc entier reste clair");
{
  verif(
    "IL COUVRE TOUT L'ÉCRAN : plus de mesure du bas de la barre, plus " +
      "de `top` calculé — un pan plein écran quand rien n'est épargné",
    /pan\("plein", \{ inset: 0 \}\)/.test(voile) &&
      !/hautDeLaBarre/.test(voile)
  );
  verif(
    "IL PASSE AU-DESSUS DE LA BARRE (50) et sous les plaques des " +
      "menus (80) : l'empilement demandé, page < barre < voile < panneau",
    /const ETAGE = 60;/.test(voile)
  );
  verif(
    "L'ASSOMBRISSEMENT EST DE 28 % — il monte depuis les 18 % de la " +
      "nº 293 parce qu'il n'est plus cumulé au flou de la plaque",
    /rgba\(0, 0, 0, 0\.28\)/.test(voile)
  );
  verif(
    "LE BLOC RESTE CLAIR PAR UN TROU, jamais par un `z-index` : la " +
      "barre est un contexte d'empilement, un enfant n'en sort pas",
    /pan\("haut"/.test(voile) &&
      /pan\("bas"/.test(voile) &&
      /pan\("gauche"/.test(voile) &&
      /pan\("droite"/.test(voile)
  );
  verif(
    "ET C'EST LE BLOC ENTIER : on remonte du segment à l'ENCADRÉ qui " +
      "le contient (`data-encadre-barre`), jamais une moitié",
    /closest<HTMLElement>\("\[data-encadre-barre\]"\)/.test(voile)
  );
  verif(
    "AUCUN FONDU, AUCUNE TRANSFORMATION, ET UN PORTAIL AU CORPS DU " +
      "DOCUMENT (défaut nº 234)",
    /transition: "none"/.test(voile) &&
      !/transform/.test(voile) &&
      /createPortal\(<>\{pans\}<\/>, document\.body\)/.test(voile)
  );
  verif(
    "AUCUN SECOND MÉCANISME DE FERMETURE : les pans n'écoutent rien",
    !/onClick|onPointerDown|stopPropagation/.test(voile)
  );
  verif(
    "LES CINQ SURFACES DONNENT LEUR BLOC — compte, filtres, menu du " +
      "moteur (web + doigt), Ma sélection, localité du moteur",
    /useVoileDeLaPage\(ouvert, zone\)/.test(
      sansNotes(lire("src/components/MenuEspace.tsx"))
    ) &&
      /useVoileDeLaPage\(filtresOuverts, zoneFiltres\)/.test(
        sansNotes(lire("src/components/MoteurTatouage.tsx"))
      ) &&
      /useVoileDeLaPage\(avecVoile && listeVisible, conteneur\)/.test(
        sansNotes(lire("src/components/MenuDeroulant.tsx"))
      ) &&
      /useVoileDeLaPage\(pourLeMoteur && listeOuverte, racine\)/.test(
        sansNotes(lire("src/components/ChampLocalisation.tsx"))
      ) &&
      /avecVoile/.test(sansNotes(lire("src/components/MenusSelection.tsx")))
  );
  verif(
    "WEB UNIQUEMENT, et le gel du corps n'est pas touché",
    /dataset\.appareil === "mobile"\) return;/.test(voile) &&
      !/gelerLeCorps/.test(voile)
  );
}

titre("vivant — 1440 × 823, densité 2");
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

    /* ---------- §1 — PLEINE PAGE ---------------------------------- */
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);
    const lirePhoto = (racine) =>
      page.evaluate((sel) => {
        const hote = document.querySelector(sel);
        const col = hote.querySelector('[data-role="colonne 0"]');
        const img = col.querySelector("img");
        const k = col.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        const nu = (element) => {
          const s = getComputedStyle(element);
          return {
            fond: s.backgroundColor,
            bordure: parseFloat(s.borderTopWidth),
            contour: s.outlineStyle === "none" ? 0 : parseFloat(s.outlineWidth),
            ombre: s.boxShadow,
            arrondi: parseFloat(s.borderTopLeftRadius),
          };
        };
        return {
          ecarts: {
            haut: i.top - k.top,
            bas: k.bottom - i.bottom,
            gauche: i.left - k.left,
            droite: k.right - i.right,
          },
          enveloppe: nu(hote),
          racine: nu(hote.querySelector("[data-carrousel]") ?? hote),
          cadre: nu(hote.querySelector('[data-role="cadre"]')),
          colonne: nu(col),
        };
      }, racine);
    const page1 = await lirePhoto("[data-photo-fiche]");
    //  ⚠️ AMENDÉE À LA nº 295 : la photo ÉPOUSE sa colonne (écarts à
    //  zéro). Ce qui la protège d'un demi-pixel manquant n'est plus un
    //  débordement — c'est qu'il n'y a plus rien à découvrir derrière.
    verif(
      "PLEINE PAGE — LA PHOTO ÉPOUSE SA COLONNE sur ses QUATRE côtés",
      Object.values(page1.ecarts).every((e) => Math.abs(e) < 0.001),
      `haut ${page1.ecarts.haut} · bas ${page1.ecarts.bas} · ` +
        `gauche ${page1.ecarts.gauche} · droite ${page1.ecarts.droite}`
    );
    const rienPeint = (boite) =>
      /rgba\(0, 0, 0, 0\)|transparent/.test(boite.fond) &&
      boite.bordure === 0 &&
      boite.contour === 0 &&
      boite.ombre === "none" &&
      boite.arrondi === 0;
    verif(
      "PLEINE PAGE — RIEN N'EST PEINT autour de la photo : ni fond, ni " +
        "bordure, ni contour, ni ombre, ni arrondi, sur l'enveloppe, la " +
        "racine ni le cadre",
      rienPeint(page1.enveloppe) &&
        rienPeint(page1.racine) &&
        rienPeint(page1.cadre),
      `enveloppe ${page1.enveloppe.fond} · racine ${page1.racine.fond} · cadre ${page1.cadre.fond}`
    );
    //  ⚠️ AMENDÉE À LA nº 295, SUR CONSIGNE : la colonne non plus ne
    //  peint plus rien. La chaîne entière est transparente.
    verif(
      "…et LA COLONNE NON PLUS ne peint rien (nº 295) : la chaîne " +
        "entière est transparente",
      rienPeint(page1.colonne),
      page1.colonne.fond
    );

    /* ---------- §1 — FENÊTRE CENTRÉE SUPERPOSÉE -------------------- */
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/tatoueur/"]')].find(
        (n) => n.getAttribute("href") !== location.pathname
      );
      a?.click();
    });
    await page.waitForTimeout(3000);
    const ouverte = await page.evaluate(
      () => document.documentElement.getAttribute("data-fenetre-fiche") === "1"
    );
    if (ouverte) {
      const fen1 = await page.evaluate(() => {
        const cars = [...document.querySelectorAll('[data-carrousel="fiche"]')];
        const dernier = cars[cars.length - 1];
        const col = dernier.querySelector('[data-role="colonne 0"]');
        const img = col.querySelector("img");
        const k = col.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        const fond = (e) => getComputedStyle(e).backgroundColor;
        return {
          ecarts: {
            haut: i.top - k.top,
            bas: k.bottom - i.bottom,
            gauche: i.left - k.left,
            droite: k.right - i.right,
          },
          boite: fond(dernier.parentElement),
          racine: fond(dernier),
          colonne: fond(col),
        };
      });
      verif(
        "FENÊTRE SUPERPOSÉE — LES MÊMES QUATRE ÉCARTS : c'est le même " +
          "composant, c'est le même résultat (zéro depuis la nº 295)",
        Object.values(fen1.ecarts).every((e) => Math.abs(e) < 0.001),
        `haut ${fen1.ecarts.haut} · bas ${fen1.ecarts.bas} · ` +
          `gauche ${fen1.ecarts.gauche} · droite ${fen1.ecarts.droite}`
      );
      verif(
        "FENÊTRE SUPERPOSÉE — la plaque noire a disparu, et depuis la " +
          "nº 295 la colonne non plus ne peint rien",
        /rgba\(0, 0, 0, 0\)/.test(fen1.boite) &&
          /rgba\(0, 0, 0, 0\)/.test(fen1.racine) &&
          /rgba\(0, 0, 0, 0\)/.test(fen1.colonne),
        `boîte ${fen1.boite} · racine ${fen1.racine} · colonne ${fen1.colonne}`
      );
    } else {
      nonJoue(
        "§1 dans la fenêtre superposée, en vivant",
        "aucun lien interne n'a ouvert de fenêtre sur cette fiche de " +
          "démonstration ; le fait est vérifié à la source"
      );
    }

    /* ---------- §3 — le voile ------------------------------------- */
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    const lireVoile = () =>
      page.evaluate(() => {
        const pans = [...document.querySelectorAll("[data-voile-page]")];
        if (!pans.length) return null;
        const style = getComputedStyle(pans[0]);
        const encadre = document.querySelector("[data-encadre-barre]");
        const bloc = encadre?.getBoundingClientRect() ?? null;
        //  LE BLOC EST-IL RECOUVERT ? On teste ses QUATRE COINS et son
        //  centre contre chaque pan : aucun ne doit tomber dedans.
        const points = bloc
          ? [
              [bloc.left + 1, bloc.top + 1],
              [bloc.right - 1, bloc.top + 1],
              [bloc.left + 1, bloc.bottom - 1],
              [bloc.right - 1, bloc.bottom - 1],
              [bloc.left + bloc.width / 2, bloc.top + bloc.height / 2],
            ]
          : [];
        const couvert = points.some(([x, y]) =>
          pans.some((p) => {
            const b = p.getBoundingClientRect();
            return x > b.left && x < b.right && y > b.top && y < b.bottom;
          })
        );
        return {
          pans: pans.map((p) => p.getAttribute("data-voile-page")),
          fond: style.backgroundColor,
          z: Number(style.zIndex),
          transition: style.transitionProperty,
          parent: pans[0].parentElement.tagName,
          barreZ: Number(getComputedStyle(document.querySelector("header")).zIndex),
          hautDuPremierPan: Math.min(...pans.map((p) => p.getBoundingClientRect().top)),
          blocCouvert: couvert,
          blocLargeur: bloc?.width ?? null,
        };
      });
    verif("AU REPOS, LE VOILE N'EXISTE PAS", (await lireVoile()) === null);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(900);
    const v = await lireVoile();
    verif(
      "MENU OUVERT : quatre pans, 28 %, AU-DESSUS DE LA BARRE, et ils " +
        "partent du HAUT DE L'ÉCRAN — une seule couleur, aucun raccord",
      v !== null &&
        v.pans.length === 4 &&
        v.fond === "rgba(0, 0, 0, 0.28)" &&
        v.z > v.barreZ &&
        v.hautDuPremierPan === 0,
      v ? `z${v.z} > barre z${v.barreZ} · haut ${v.hautDuPremierPan} · ${v.fond}` : "absent"
    );
    verif(
      "LE BLOC ENTIER RESTE CLAIR : ses quatre coins ET son centre sont " +
        "hors de tout pan — c'est l'ENCADRÉ complet, pas un segment",
      v !== null && v.blocCouvert === false && v.blocLargeur > 200,
      v ? `bloc de ${v.blocLargeur?.toFixed(0)} px, couvert : ${v.blocCouvert}` : "absent"
    );
    verif(
      "AUCUNE TRANSITION, et un portail au corps du document",
      v !== null && v.transition === "none" && v.parent === "BODY"
    );
    await page.mouse.click(200, 760);
    await page.waitForTimeout(800);
    verif(
      "UN CLIC SUR LE VOILE REFERME — le mécanisme de clic extérieur " +
        "qui existait déjà, aucun second n'a été écrit",
      (await lireVoile()) === null
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
  "§1 dans Safari",
  "pas de WebKit ici. Mais cette passe ne joue plus sur des fractions : " +
    "elle RETIRE ce qui était peint derrière la photo et fait déborder " +
    "la photo d'un pixel — aucun de ces deux gestes ne dépend du moteur " +
    "de rendu. La sonde dit désormais ce qui est peint, et elle relève " +
    "aussi dans la fenêtre superposée"
);
nonJoue(
  "§3 sur les deux menus de « Ma sélection » en vivant",
  "ils demandent des favoris enregistrés, donc une session. Le bloc " +
    "épargné y est le MÊME composant que celui mesuré ci-dessus " +
    "(`EncadreDeuxChamps`, marqué `data-encadre-barre`), et c'est ce " +
    "marqueur que le voile remonte"
);

process.exit(bilan());
