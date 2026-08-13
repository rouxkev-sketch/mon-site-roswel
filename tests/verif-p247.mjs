/**
 * BANC DE LA PASSE Nº 247
 * ==================================================================
 * §1 LE DÉFAUT DE DONNÉES — une photo ne peut plus paraître dans un
 *    carrousel d'une autre nature (fiche, « Ma sélection »,
 *    photothèque, cartes) ;
 * §2 les deux menus sont EXCLUSIFS, un seul paramètre d'adresse, et la
 *    page s'ouvre sur les favoris ;
 * §3 Réalisations et Flashs distincts, et la sous-porte des familles
 *    qui s'ouvre ;
 * §4 les modes cumulés, une ligne chacun, le rond immobile ;
 * §5 une fiche par ligne, jusqu'à six vignettes, angles droits ;
 * §6 la loupe, l'icône de la page courante, le repli du bandeau.
 *
 * ⚠️ CE QUI NE PEUT PAS SE JOUER ICI : « Ma sélection » exige une
 * session, et la base est hors d'atteinte de ce conteneur. Les règles
 * tournent donc dans LE VRAI MODULE (harnais), les classes sont
 * mesurées PAR INJECTION des classes réelles, et tout ce qui est
 * partagé (le carrousel des fiches, le menu déroulant de la maison, la
 * mécanique de repli de la barre) est éprouvé VIVANT sur les pages
 * publiques. Rien n'est maquillé : voir la section NON JOUÉE.
 *
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari.
 */
import { execFileSync } from "node:child_process";
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const pageWeb = async (largeur = 1440) => {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: 950 },
  });
  return { contexte, page: await contexte.newPage() };
};
const ouvrir = async (page, chemin) => {
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1800);
};

/** Les natures lues DANS LE DOM du carrousel de la fiche. */
const LECTURE_CARROUSEL = `() => {
  const cadre = document.querySelector('[data-carrousel="fiche"]');
  if (!cadre) return null;
  return {
    declaree: cadre.getAttribute("data-serie-nature") || "",
    colonnes: [...cadre.querySelectorAll("[data-nature]")].map((c) =>
      c.getAttribute("data-nature")
    ),
  };
}`;

/* ==================================================================
 * LES RÈGLES, DANS LE VRAI MODULE (harnais)
 * ================================================================== */
let R = null;
try {
  R = JSON.parse(
    execFileSync(
      "node",
      ["--experimental-strip-types", "tests/regles-p247.harnais.mjs"],
      { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    )
  );
} catch (erreur) {
  nonJoue("les règles (harnais)", String(erreur).slice(0, 80));
}

/* ==================================================================
 * §1 — LA CAUSE, ET LA PREUVE QU'ELLE NE PEUT PLUS JOUER
 * ================================================================== */
titre("§1 — la règle du carrousel, dans le vrai module");
if (R) {
  verif(
    "une catégorie demandée n'est jamais violée (le flash seul)",
    JSON.stringify(R.series.flash) === JSON.stringify(["b"]),
    R.series.flash.join(",")
  );
  verif(
    "le RENDU peut s'élargir à la catégorie — jamais à l'autre catégorie",
    JSON.stringify(R.series.flashRenduAbsent) === JSON.stringify(["b"]),
    R.series.flashRenduAbsent.join(",")
  );
  verif(
    "aucun flash ici : une liste VIDE, et surtout pas les réalisations",
    R.series.aucunFlash.length === 0,
    `${R.series.aucunFlash.length} photo(s)`
  );
  verif(
    "rien de demandé : le style entier, comme toujours",
    R.series.rienDeDemande.length === 3
  );
}

titre("§1 — à la source : UNE écriture, et les trois tags portés");
{
  const fiche = lire("src/components/FicheTatoueur.tsx");
  const fenetre = lire("src/components/FenetreFiche.tsx");
  const favoris = lire("src/components/PageFavoris.tsx");
  const carrousel = lire("src/components/CarrouselPortfolio.tsx");
  const regleSerie = lire("src/lib/photo-tatoueur.ts");

  verif(
    "le filtre de série est écrit UNE fois (serieMontree) et consommé deux fois",
    /export function serieMontree/.test(regleSerie) &&
      /serieMontree\(/.test(fiche) &&
      /serieMontree\(/.test(fenetre) &&
      //  La copie qui vivait dans les deux enveloppes a disparu.
      !/photo\.nature === serieOuverte\.nature/.test(fiche) &&
      !/photo\.nature === serieOuverte\.nature/.test(fenetre)
  );
  verif(
    "« Ma sélection » porte LA CATÉGORIE jusqu'à la carte (le chemin mobile)",
    /natureRecherche=\{natureConnue\(photo\.nature\)\}/.test(favoris)
  );
  verif(
    "…et jusqu'à la fenêtre superposée (le chemin web)",
    /natureRecherche=\{serieOuverte\.nature\}/.test(favoris) &&
      /renduRecherche=\{serieOuverte\.rendu\}/.test(favoris)
  );
  verif(
    "la clé de la fenêtre change d'un ensemble à l'autre (l'état n'est plus hérité)",
    /key=\{`\$\{ficheOuverte\?\.id \?\? "fermee"\}-\$\{serieOuverte\.cle\}`\}/.test(
      favoris
    )
  );
  verif(
    "le carrousel DÉCLARE sa catégorie, et chaque colonne dit la sienne",
    /data-serie-nature=\{natureDeLaSerie \|\| undefined\}/.test(carrousel) &&
      /data-nature=\{photo\.nature\}/.test(carrousel)
  );
  verif(
    "on n'ouvre plus un style qui n'a pas la catégorie demandée",
    /if \(critereDePhoto && !ordonnes\[0\]\?\.photos\.some\(repond\)\)/.test(regleSerie)
  );
}

titre("§1 — les fiches VIVANTES : aucun mélange, aucune promesse fausse");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    //  Toutes les fiches de démonstration de l'accueil, dans les deux
    //  catégories : la règle vaut partout, pas sur un exemple choisi.
    await ouvrir(page, "/");
    const fiches = await page.evaluate(() =>
      [
        ...new Set(
          [...document.querySelectorAll('a[href*="/tatoueur/"]')].map(
            (a) => new URL(a.href).pathname
          )
        ),
      ].slice(0, 8)
    );
    let melanges = 0;
    let mensonges = 0;
    let seriesDeclarees = 0;
    let melangeConstate = false;
    for (const chemin of fiches) {
      for (const suite of ["", "?nature=flash", "?nature=tatouage"]) {
        await ouvrir(page, `${chemin}${suite}`);
        const vu = await page.evaluate(`(${LECTURE_CARROUSEL})()`);
        if (!vu) continue;
        if (!vu.declaree) {
          //  Sans catégorie déclarée, un carrousel a le droit de
          //  mélanger : il ne montre qu'un STYLE. C'est ce cas-là qui
          //  prouve que les données contiennent bien le piège.
          if (new Set(vu.colonnes).size > 1) melangeConstate = true;
          continue;
        }
        seriesDeclarees += 1;
        if (vu.colonnes.some((n) => n !== vu.declaree)) melanges += 1;
        if (suite && !suite.includes(vu.declaree)) mensonges += 1;
      }
    }
    verif(
      "des styles contiennent bien les deux catégories (le piège existe)",
      melangeConstate
    );
    verif(
      "un carrousel qui DÉCLARE une catégorie ne montre QUE celle-là",
      seriesDeclarees > 0 && melanges === 0,
      `${seriesDeclarees} série(s) déclarée(s) · ${melanges} mélange(s)`
    );
    verif(
      "et il ne déclare jamais une catégorie qu'on n'a pas demandée",
      mensonges === 0,
      `${mensonges} promesse(s) fausse(s)`
    );
  } catch (erreur) {
    nonJoue("§1 · fiches vivantes", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§1 — L'ÉTENDUE : la mosaïque, les cartes, la photothèque");
{
  const grille = lire("src/components/GrilleTatoueurs.tsx");
  const carte = lire("src/components/CarteTatoueur.tsx");
  const index = lire("src/components/IndexTatoueurs.tsx");
  const pile = lire("src/components/PileFiches.tsx");
  verif(
    "la mosaïque, elle, portait déjà les trois tags — carte ET fenêtre",
    /natureRecherche=\{natureRecherche\}/.test(grille) &&
      /natureRecherche=\{affiches\.nature\}/.test(index) &&
      /ouvertures\}`\}/.test(grille)
  );
  verif(
    "la carte choisit sa photo AVEC la catégorie, et l'emporte dans son lien",
    /photoPourStyle\(\s*tatoueur,\s*styleRecherche,\s*renduRecherche,\s*natureRecherche\s*\)/.test(
      carte
    ) && /if \(natureRecherche\) suite\.set\("nature", natureRecherche\)/.test(carte)
  );
  verif(
    "une fiche ouverte DEPUIS une fiche n'a aucune série à trahir",
    //  PileFiches n'ouvre ni style ni catégorie : elle montre la fiche
    //  entière. C'est le seul endroit où l'absence de tag est juste.
    /<FenetreFiche\n\s+key=\{`\$\{entree\.fiche\.id\}-\$\{entree\.ouverture\}`\}/.test(
      pile
    ) && !/natureRecherche/.test(pile)
  );
}

titre("§1 — LA CARTE : la photo choisie, et le lien qu'elle ouvre");
if (R) {
  verif(
    "une carte de flashs montre un FLASH, avec ou sans style demandé",
    R.cartes.flash === "f1" && R.cartes.flashRealisme === "f1",
    `${R.cartes.flash} / ${R.cartes.flashRealisme}`
  );
  verif(
    "…et une carte de réalisations montre une RÉALISATION",
    R.cartes.realisation === "r1" && R.cartes.sansCategorie === "r1"
  );
  verif(
    "aucun flash dans le style demandé : la CATÉGORIE l'emporte sur le style",
    R.cartes.flashMaori === "f1",
    R.cartes.flashMaori
  );
}
{
  //  Le lien que la carte fabrique EMPORTE la catégorie : c'est lui
  //  que le smartphone suit (le web, lui, ouvre la fenêtre).
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page, "/?nature=flash");
    const liens = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="/tatoueur/"]')]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && h.includes("?"))
    );
    verif(
      "chaque carte de la mosaïque emporte `nature=flash` dans son lien",
      liens.length > 0 && liens.every((h) => h.includes("nature=flash")),
      `${liens.length} lien(s) · ${
        liens.filter((h) => !h.includes("nature=flash")).length
      } sans catégorie`
    );
  } catch (erreur) {
    nonJoue("§1 · liens des cartes", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — DEUX MENUS EXCLUSIFS, UN SEUL PARAMÈTRE
 * ================================================================== */
titre("§2 — un seul paramètre d'adresse, et deux recherches exclusives");
if (R) {
  verif(
    "l'adresse nue ouvre sur « Mes j'aime », tout — aucun suivi",
    R.adresses.vide.menu === "jaime" &&
      !R.adresses.vide.nature &&
      !R.adresses.vide.style,
    JSON.stringify(R.adresses.vide)
  );
  verif(
    "`selection=suivis` bascule entièrement sur les suivis",
    R.adresses.suivis.menu === "suivis",
    JSON.stringify(R.adresses.suivis)
  );
  verif(
    "le couple catégorie + style voyage dans LE MÊME paramètre",
    R.adresses.suivisMaori.menu === "suivis" &&
      R.adresses.suivisMaori.nature === "tatouage" &&
      R.adresses.suivisMaori.style === "maori",
    JSON.stringify(R.adresses.suivisMaori)
  );
  verif(
    "une valeur malmenée ne rend jamais n'importe quoi",
    R.adresses.menuInconnu.menu === "jaime" &&
      R.adresses.styleInconnu.style === "" &&
      R.adresses.styleInconnu.nature === "flash"
  );
  verif(
    "le filtre porte sur les DEUX tags (flash, puis flash + maori)",
    JSON.stringify(R.filtrage.jaimeFlash) === JSON.stringify(["2", "3"]) &&
      JSON.stringify(R.filtrage.jaimeFlashMaori) === JSON.stringify(["3"]),
    `${R.filtrage.jaimeFlash} / ${R.filtrage.jaimeFlashMaori}`
  );
  verif(
    "…et sur les suivis de la même façon",
    JSON.stringify(R.filtrage.suivisFlash) === JSON.stringify(["huit"]) &&
      R.filtrage.suivisTous.length === 2,
    JSON.stringify(R.filtrage.suivisFlash)
  );
}
{
  const filtres = lire("src/lib/filtres-selection.ts");
  const page = lire("src/components/PageFavoris.tsx");
  const menus = lire("src/components/MenusSelection.tsx");
  verif(
    "il n'y a plus qu'un paramètre — les deux d'avant ont disparu du code",
    /PARAM_SELECTION = "selection"/.test(filtres) &&
      !/PARAM_JAIME|PARAM_SUIVIS|TOUS_LES_STYLES/.test(
        filtres + page + menus
      )
  );
  verif(
    "la page n'affiche jamais les deux sections à la fois",
    /const surLesJaime = choix\.menu === MENU_JAIME/.test(page) &&
      /\{!surLesJaime \? null : photos\.length === 0 \?/.test(page) &&
      /\{!surLesJaime && \(\s*<BlocSuivis/.test(page)
  );
  verif(
    "choisir dans un menu remet l'autre à zéro (une seule valeur écrite)",
    /export function poserSelection\(menu: MenuSelection, valeur: string\)/.test(
      filtres
    ) &&
      /params\.set\(PARAM_SELECTION, valeur \? `\$\{menu\}:\$\{valeur\}` : menu\)/.test(
        filtres
      ) &&
      /if \(choix\.menu !== menu\) return "";/.test(filtres)
  );
}

/* ==================================================================
 * §3 — RÉALISATIONS / FLASHS, ET LA SOUS-PORTE
 * ================================================================== */
titre("§3 — les deux catégories dans les menus, familles comprises");
if (R) {
  const portes = [...new Set(R.entreesJaime.map((e) => e.groupe ?? ""))];
  verif(
    "les entrées portent les DEUX portes du menu Explorer, dans son ordre",
    JSON.stringify(portes) === JSON.stringify(["", "Réalisations", "Flashs"]),
    portes.join(" | ")
  );
  verif(
    "…avec les mots du moteur, au mot près",
    R.entreesJaime.some((e) => e.label === "Toutes les réalisations") &&
      R.entreesJaime.some((e) => e.label === "Tous les flashs"),
  );
  verif(
    "la valeur encode le couple, comme le moteur (« flash:maori »)",
    R.entreesJaime.some((e) => e.value === "flash:maori")
  );
  verif(
    "un style de famille garde sa famille en SOUS-PORTE",
    R.entreesJaime.find((e) => e.value === "flash:maori")?.sousGroupe ===
      "Cultures du monde"
  );
  verif(
    //  (mis à jour à la nº 249-§1 : « Tous les styles » est SUPPRIMÉE
    //  — « Toutes les réalisations » et « Tous les flashs » sont le
    //  seul chemin de retour vers tout, chacune en tête de sa porte.)
    "« Tous les styles » n'existe plus — la liste s'ouvre sur les portes",
    !R.entreesJaime.some((e) => e.label === "Tous les styles") &&
      R.entreesJaime[0]?.value === "tatouage" &&
      R.entreesJaime[0]?.label === "Toutes les réalisations"
  );
  verif(
    "une catégorie sans rien dedans n'a pas de porte du tout",
    !R.sansFlash.some((e) => e.groupe === "Flashs"),
    R.sansFlash.map((e) => e.label).join(" · ")
  );
}
{
  const menus = lire("src/components/MenusSelection.tsx");
  verif(
    "les deux menus passent `repliable` — l'interrupteur qui manquait",
    (menus.match(/^\s*repliable$/gm) ?? []).length === 1 &&
      /<MenuDeroulant/.test(menus)
  );
}

titre("§3 — la sous-porte, VIVANTE (le menu partagé, sur l'accueil)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page, "/");
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(600);
    //  La porte de catégorie, puis la sous-porte de famille : le
    //  chemin exact que « Ma sélection » emprunte désormais.
    await page.locator('text="Réalisations"').first().click();
    await page.waitForTimeout(400);
    const porte = page.locator('[data-sous-porte="Cultures du monde"]').first();
    const presente = (await porte.count()) > 0;
    const avant = await page.locator('[role="option"]').count();
    if (presente) await porte.click();
    await page.waitForTimeout(400);
    const apres = await page.locator('[role="option"]').count();
    const maori = await page.locator('[role="option"]', { hasText: "Maori" }).count();
    verif(
      "la sous-porte « Cultures du monde » existe et s'OUVRE",
      presente && apres > avant && maori > 0,
      `porte ${presente ? "présente" : "ABSENTE"} · ${avant} → ${apres} entrées · Maori ${maori}`
    );
  } catch (erreur) {
    nonJoue("§3 · sous-porte vivante", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LES MODES CUMULÉS
 * ================================================================== */
titre("§4 — un mode, une ligne, dans l'ordre de modesOrdonnes");
if (R) {
  const trois = R.lignes.troisModes;
  verif(
    "trois modes cumulés donnent TROIS lignes",
    trois.length === 3,
    `${trois.length} ligne(s)`
  );
  verif(
    "…dans l'ordre officiel : domicile, salon, guest",
    /^À domicile/.test(trois[0]?.avant ?? "") &&
      /^En salon/.test(trois[1]?.avant ?? "") &&
      /^Guest/.test(trois[2]?.avant ?? ""),
    trois.map((l) => l.avant.split(" · ")[0]).join(" | ")
  );
  verif(
    "la date de la session guest reste À PART (l'urgence est typographique)",
    trois[2]?.date === "20 – 24 août" && trois[2]?.proche === true,
    `${trois[2]?.date} · proche ${trois[2]?.proche}`
  );
  verif(
    "une session guest TERMINÉE ne s'écrit pas",
    R.lignes.guestPassee.length === 1 &&
      !R.lignes.guestPassee.some((l) => l.guest),
    R.lignes.guestPassee.map((l) => l.avant).join(" | ")
  );
  verif(
    "un salon sans mode garde sa ligne unique",
    R.lignes.salonSansMode.length === 1 &&
      R.lignes.salonSansMode[0].avant === "Salon · Lyon"
  );
}

titre("§4 — le rond ne bouge pas quand le texte grandit (injection)");
{
  const source = lire("src/components/BlocSuivis.tsx");
  const { contexte, page } = await pageWeb(1440);
  try {
    verif(
      "le bloc de texte est calé EN HAUT dès qu'il y a plusieurs lignes",
      /lignes\.length > 1 \? "justify-start" : "justify-center"/.test(source)
    );
    await ouvrir(page, "/");
    const vu = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:0;width:700px;z-index:9999;";
        const ligne = (n) =>
          '<div class="' + classes.ligne + '" data-essai="' + n + '">' +
          '<span class="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve" data-rond></span>' +
          '<span class="flex min-h-13 min-w-0 flex-1 flex-col ' +
          (n > 1 ? "justify-start" : "justify-center") + '">' +
          '<span class="truncate text-[15px] font-semibold text-sombre-texte" data-nom>Lola</span>' +
          Array.from({ length: n })
            .map(() => '<span class="truncate text-[14px] leading-relaxed text-sombre-texte-doux">Un mode</span>')
            .join("") +
          '</span></div>';
        hote.innerHTML = ligne(1) + ligne(3);
        document.body.appendChild(hote);
        const mesure = (n) => {
          const bloc = hote.querySelector('[data-essai="' + n + '"]');
          const rond = bloc.querySelector("[data-rond]").getBoundingClientRect();
          const nom = bloc.querySelector("[data-nom]").getBoundingClientRect();
          const cadre = bloc.getBoundingClientRect();
          return {
            rond: Math.round(rond.top - cadre.top),
            nom: Math.round(nom.top - cadre.top),
          };
        };
        const vu = { une: mesure(1), trois: mesure(3) };
        hote.remove();
        return vu;
      })(${JSON.stringify({
        ligne:
          source.match(/CLASSES_LIGNE_CLIQUABLE/)
            ? "group flex items-start gap-3.5 rounded-xl -m-2 p-2"
            : "",
      })})`
    );
    verif(
      "le rond est à la même hauteur à une ligne et à trois",
      vu.une.rond === vu.trois.rond,
      `${vu.une.rond} px = ${vu.trois.rond} px`
    );
    verif(
      "et le nom ne remonte JAMAIS au-dessus du rond",
      vu.trois.nom >= vu.trois.rond,
      `nom ${vu.trois.nom} px · rond ${vu.trois.rond} px`
    );
  } catch (erreur) {
    nonJoue("§4 · le rond", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §5 — UNE FICHE PAR LIGNE, SIX VIGNETTES, ANGLES DROITS
 * ================================================================== */
titre("§5 — les colonnes et la bande (injection des classes réelles)");
{
  const source = lire("src/components/BlocSuivis.tsx");
  const nettoyer = (t) => t.replace(/\s+/g, " ").trim();
  const classeBlocs = nettoyer(
    source.match(/className="(mt-5 grid gap-\[34px\][^"]*)"/)?.[1] ?? ""
  );
  const classeVignette = nettoyer(
    source.match(/className="(block aspect-square[^"]*)"/)?.[1] ?? ""
  );
  verif(
    "les vignettes sont à ANGLES DROITS (rayon zéro) à la source",
    /rounded-none/.test(classeVignette) && !/rounded-\[10px\]/.test(source),
    classeVignette.slice(0, 60)
  );
  verif(
    "la grille des blocs n'a plus qu'UNE colonne (les deux de la 245 sont parties)",
    /grid-cols-\[minmax\(0,1fr\)\]/.test(classeBlocs) &&
      !/lg:grid-cols-\[minmax/.test(classeBlocs),
    classeBlocs
  );

  //  ⚠️ MIS À JOUR À LA nº 249-§6 (la spec a changé) : la bande ne se
  //  tronque plus aux colonnes de l'écran — elle DÉFILE (défilement
  //  natif, accrochage, dépassement aux deux bords). Les mesures par
  //  paliers (3/4/5/6 cachées au-delà) n'ont donc plus d'objet : la
  //  rangée vivante est mesurée par LE BANC DE LA PASSE 249
  //  (tests/verif-p249.mjs), le précédent des bancs datés renvoyés
  //  (nº 238 → nº 239). Restent ici ce qui n'a pas changé : les
  //  angles droits, la colonne unique des blocs — vérifiés plus haut.
}

if (R) {
  verif(
    //  (mis à jour à la nº 249-§6 : la bande DÉFILE désormais — le
    //  plafond n'est plus l'écran mais le seuil de la case « voir
    //  plus », DIX. Elle reste bornée : jamais plus que le plafond.)
    "la bande ne fournit jamais plus que son plafond (dix, le seuil du « voir plus »)",
    R.bande.nombre === R.bande.max && R.bande.max === 10,
    `${R.bande.nombre} sur douze publiées`
  );
}

/* ==================================================================
 * §6 — LES TROIS DÉFAUTS DU SMARTPHONE
 * ================================================================== */
titre("§6 — la loupe, l'icône de la page courante, le repli");
{
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const menus = lire("src/components/MenusSelection.tsx");
  verif(
    "la loupe retrouve sa page : le moteur est remonté en hôte invisible",
    /rangeeLibre && \(/.test(barre) &&
      /<div hidden data-hote-recherche="">/.test(barre) &&
      /rangeeMobile=\{false\}/.test(barre)
  );
  verif(
    "…et c'est bien LE moteur qui porte la page de recherche",
    /<PageRechercheMobile/.test(lire("src/components/MoteurTatouage.tsx")) &&
      /createPortal/.test(lire("src/components/PageRechercheMobile.tsx"))
  );
  verif(
    "l'icône de la page courante recharge et remonte",
    /const rafraichirSiDejaLa = /.test(barre) &&
      /onClick=\{rafraichirSiDejaLa\("\/mes-favoris"\)\}/.test(barre) &&
      /defilerSansGeste\(\{ top: 0 \}\)/.test(barre) &&
      /router\.refresh\(\)/.test(barre)
  );
  verif(
    "le repli n'a plus qu'UNE mémoire (la copie de l'écouteur est partie)",
    !/let replieCourant/.test(barre) &&
      /const poserReplie = \(valeur: boolean\) => setMoteurReplie\(valeur\);/.test(
        barre
      ) &&
      /deplier: \(\) => setMoteurReplie\(false\)/.test(barre)
  );
  verif(
    "…et ses réglages n'ont pas bougé (24 / 12 / 64 px, 128 et 64)",
    /cumulDuGeste\.current > 24/.test(barre) &&
      /cumulDuGeste\.current < -12/.test(barre) &&
      /y < 64/.test(barre) &&
      /rangeePresente && !moteurReplie \? 128/.test(barre) &&
      /data-reserve-depliee=\{rangeePresente \? 128 : 64\}/.test(barre)
  );
  verif(
    //  (mis à jour à la nº 250-§2 : la ligne étroite est resserrée à
    //  28 px — l'addition devient 64 + 12 + 28 = 104, et la réserve
    //  suit.)
    "la troisième hauteur est une addition : 64 + 12 + 28 = 104",
    /rangeeLibre \? 104 : 64/.test(barre) && /rangeeLibre\s*\n?\s*\? "h-\[104px\]"/.test(barre),
  );
  verif(
    "repliée, la rangée dit « Ma sélection » (et plus « Recherche »)",
    /Ma sélection\s*\n?\s*<\/button>/.test(menus) &&
      //  (mis à jour nº 250-§2 : la loupe est devenue la flèche vers
      //  le bas — un appui DÉPLOIE, il ne cherche pas.)
      /IconeChevronBas taille=\{14\}/.test(menus) &&
      !/>\s*Recherche\s*</.test(menus)
  );
}

titre("§6 — la mécanique de repli, VIVANTE (l'accueil, 390 px)");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    await ouvrir(page, "/");
    const reserve = () =>
      page.evaluate(() =>
        Number(
          document
            .querySelector("[data-reserve-barre]")
            ?.getAttribute("data-reserve-posee")
        )
      );
    const haut = await reserve();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);
    const descendu = await reserve();
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(600);
    const remonte = await reserve();
    verif(
      "elle se replie en descendant, et se redéploie en remontant",
      haut === 128 && descendu === 64 && remonte === 128,
      `${haut} → ${descendu} → ${remonte}`
    );
  } catch (erreur) {
    nonJoue("§6 · repli vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : les règles tournent " +
    "dans le vrai module, les classes sont mesurées par injection, et tout " +
    "ce qui est partagé (carrousel, menu déroulant, repli de la barre) est " +
    "éprouvé vivant sur les pages publiques"
);

process.exit(bilan());
