/**
 * LE BANC DE LA PASSE Nº 245 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * ⚠️ « MA SÉLECTION » EXIGE UNE SESSION (la base est hors de portée
 * d'ici : la page répond 307 vers la connexion). Ce qui s'y voit est
 * donc DIT NON JOUÉ — et prouvé autrement, pour de vrai :
 *  · les RÈGLES tournent dans le vrai module, par le harnais
 *    `regles-p245.harnais.mjs` (aucune réécriture) ;
 *  · les CLASSES sont lues à la source et injectées dans une page
 *    vivante, avec la feuille du site ;
 *  · l'ÉCRITURE PARTAGÉE (encadré, centrage, repli) est mesurée là où
 *    elle est ouvrable : sur l'accueil, chez le moteur.
 *
 * Il se lance comme les autres :  node tests/verif-p245.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";
import { execFileSync } from "node:child_process";

const navigateur = await chromium.launch();
const pageWeb = async (largeur) => {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: 900 },
  });
  return { contexte, page: await contexte.newPage() };
};
const pageMobile = async () => {
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return { contexte, page: await contexte.newPage() };
};
const ouvrir = async (page, chemin = "/") => {
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);
};

/* ==================================================================
 * §1 — UNE SEULE ÉCRITURE : L'ENCADRÉ, LE CENTRAGE, LE REPLI
 * ================================================================== */
titre("§1 — une seule écriture, consommée par les deux endroits");
{
  const encadre = lire("src/components/EncadreBarre.tsx");
  const moteur = lire("src/components/MoteurTatouage.tsx");
  const menus = lire("src/components/MenusSelection.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const barreSelection = lire("src/components/BarreSelection.tsx");

  verif(
    "l'encadré est écrit UNE fois (EncadreDeuxChamps), et consommé deux fois",
    /export function EncadreDeuxChamps/.test(encadre) &&
      /<EncadreDeuxChamps/.test(moteur) &&
      /<EncadreDeuxChamps/.test(menus) &&
      //  Le dessin (fond + trait de séparation) ne vit QUE là.
      (moteur.match(/w-px my-2\.5 bg-sombre-bordure/g) ?? []).length === 0 &&
      (menus.match(/w-px my-2\.5 bg-sombre-bordure/g) ?? []).length === 0
  );
  verif(
    "le CENTRAGE de la rangée n'est écrit qu'une fois (EnTeteTatouage)",
    (barre.match(/lg:basis-\[680px\]/g) ?? []).length === 1 &&
      !/lg:basis-\[680px\]/.test(menus) &&
      !/lg:basis-\[680px\]/.test(barreSelection)
  );
  verif(
    "le REPLI non plus : une seule mécanique, celle des deux hauteurs",
    (barre.match(/max-lg:grid-rows-\[0fr\]/g) ?? []).length === 1 &&
      //  (mis à jour à la nº 246-§2 : les enveloppes pliées de
      //  MenusSelection portent désormais les MÊMES jetons
      //  `grid-rows`, mais l'ÉTAT vient toujours de la barre — la
      //  mécanique interdite chez le jumeau, c'est le CALCUL : ni
      //  scrollY, ni écouteur de défilement.)
      !/scrollY|addEventListener\("scroll"/.test(menus) &&
      !/addEventListener\("scroll"/.test(barreSelection)
  );
  verif(
    "et ses réglages n'ont pas bougé (24 px / 12 px / 64 px, 128 et 64)",
    /cumul > 24/.test(barre) &&
      /cumul < -12/.test(barre) &&
      /y < 64/.test(barre) &&
      /rangeePresente && !moteurReplie \? 128/.test(barre) &&
      /data-reserve-depliee=\{rangeePresente \? 128 : 64\}/.test(barre)
  );
  verif(
    "« Ma sélection » passe SON contenu à la rangée (elle n'en refait pas une)",
    /<EnTeteTatouage\s+rangee=\{/.test(barreSelection) &&
      /rangee\?: \(etat: \{/.test(barre)
  );
}

/* ==================================================================
 * §1 et §2 — CE QUI A DISPARU
 * ================================================================== */
titre("§1/§2 — le bloc de recherche et le va-et-vient");
{
  const page = lire("src/components/PageFavoris.tsx");
  const pageServeur = lire("src/app/(tatouage)/mes-favoris/page.tsx");
  verif(
    "« Ma sélection » ne monte plus le moteur : sa barre porte les deux menus",
    /<BarreSelection/.test(pageServeur) &&
      !/<EnTeteTatouage/.test(pageServeur) &&
      //  BarreSelection ne PASSE PAS `surRecherche` : aucun moteur
      //  n'est monté (on cherche l'attribut, pas le mot du commentaire
      //  qui explique justement pourquoi il n'y est pas).
      !/surRecherche=/.test(lire("src/components/BarreSelection.tsx"))
  );
  verif(
    "le va-et-vient Photos · Tatoueurs n'existe plus (ni onglet, ni ?onglet=)",
    !/OngletsLigne/.test(page) &&
      !/ONGLET_/.test(page) &&
      !/\?onglet=/.test(page) &&
      !/onglet\?: string/.test(pageServeur)
  );
  verif(
    "ses sous-menus non plus : plus de menu de style local, plus de Réalisations / Flashs",
    !/role="listbox"/.test(page) && !/libelleNature/.test(page)
  );
  //  Le moteur, lui, reste INTACT ailleurs (il vit sur l'accueil).
  const accueil = lire("src/components/IndexTatoueurs.tsx");
  verif(
    "le moteur reste intact partout ailleurs (l'accueil le pilote toujours)",
    /surRecherche/.test(accueil)
  );
}

/* ==================================================================
 * §3 — LES RÈGLES, DANS LE VRAI MODULE
 * ================================================================== */
titre("§3 — le contenu des deux menus (harnais : le vrai module)");
{
  const brut = execFileSync(
    "node",
    ["--experimental-strip-types", "tests/regles-p245.harnais.mjs"],
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  );
  const r = JSON.parse(brut.slice(brut.indexOf("{")));

  verif(
    "« Mes j'aime » : les styles aimés, et RIEN d'autre (réalisme + aquarelle)",
    r.entreesJaime.map((e) => e.value).join(",") === "tous,aquarelle,realisme",
    r.entreesJaime.map((e) => e.label).join(" · ")
  );
  verif(
    "« Tous les styles » ouvre la liste, et remet tout",
    r.entreesJaime[0].value === "tous" && r.entreesSuivis[0].value === "tous"
  );
  verif(
    "un artiste à huit styles apporte ses huit styles",
    r.entreesSuivis.filter((e) => e.value !== "tous").length === 8,
    `${r.entreesSuivis.length - 1} entrées`
  );
  //  L'ORDRE : celui du menu du moteur, familles comprises.
  const ordreRendu = r.entreesSuivis.filter((e) => e.value !== "tous").map((e) => e.value);
  const attendu = r.ordreDuMoteur.filter((slug) => ordreRendu.includes(slug));
  verif(
    "l'ordre est EXACTEMENT celui du menu du moteur, familles comprises",
    ordreRendu.join(",") === attendu.join(","),
    ordreRendu.join(" · ")
  );
  verif(
    "un style de famille garde sa famille en sous-groupe",
    r.entreesSuivis.some(
      (e) => e.value === "maori" && e.sousGroupe === "Cultures du monde"
    )
  );
  verif(
    "un style absent des données n'apparaît pas",
    !r.entreesSuivis.some((e) => e.value === "suminagashi") &&
      !r.entreesJaime.some((e) => e.value === "maori")
  );
  verif(
    "aucune entrée → aucune liste (le menu ne s'affiche pas)",
    Array.isArray(r.vide) && r.vide.length === 0
  );
  verif(
    "le filtre choisit bien les artistes qui portent le style",
    r.filtres.tous.length === 2 &&
      r.filtres.maori.join(",") === "huit,deux" &&
      r.filtres.lettering.join(",") === "huit" &&
      r.filtres.absent.length === 0,
    JSON.stringify(r.filtres)
  );
}

titre("§3 — le choix vit dans l'adresse, lu par les deux côtés");
{
  const filtres = lire("src/lib/filtres-selection.ts");
  const menus = lire("src/components/MenusSelection.tsx");
  const page = lire("src/components/PageFavoris.tsx");
  verif(
    "l'adresse porte les deux paramètres, et personne ne garde d'état local",
    /PARAM_JAIME = "jaime"/.test(filtres) &&
      /PARAM_SUIVIS = "suivis"/.test(filtres) &&
      /history\.replaceState/.test(filtres) &&
      !/useState\(/.test(menus)
  );
  verif(
    "la barre ET la page lisent le MÊME magasin d'adresse",
    /souscrireAdresse/.test(menus) && /souscrireAdresse/.test(page)
  );
  verif(
    "les deux menus sont des MenuDeroulant (le menu de la maison, en verre)",
    (menus.match(/<MenuDeroulant/g) ?? []).length === 2 &&
      /data-verre-menu/.test(lire("src/components/MenuDeroulant.tsx"))
  );
}

/* ==================================================================
 * §4 — LA BARRE STATIQUE : la mécanique existante, vivante
 * ================================================================== */
titre("§4 — le repli de la barre, mesuré là où il est ouvrable (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    //  ⚠️ SUR L'ACCUEIL : c'est LA MÊME mécanique, celle qu'on partage.
    //  Si elle marche là, elle marche pour « Ma sélection » — c'est
    //  précisément l'intérêt de n'en avoir qu'une.
    await ouvrir(page);
    const hautDeploye = await page.evaluate(() =>
      Number(document.querySelector("[data-reserve-barre]")?.getAttribute("data-reserve-posee"))
    );
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);
    const apresDescente = await page.evaluate(() =>
      Number(document.querySelector("[data-reserve-barre]")?.getAttribute("data-reserve-posee"))
    );
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(600);
    const apresRemontee = await page.evaluate(() =>
      Number(document.querySelector("[data-reserve-barre]")?.getAttribute("data-reserve-posee"))
    );
    verif(
      "elle se replie en descendant, et se redéploie en remontant",
      hautDeploye === 128 && apresDescente === 64 && apresRemontee === 128,
      `${hautDeploye} → ${apresDescente} → ${apresRemontee}`
    );
  } catch (erreur) {
    nonJoue("§4 · repli", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§4 — la ligne étroite, et la loupe qui ne bouge pas");
{
  const menus = lire("src/components/MenusSelection.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  verif(
    "repliée, la rangée garde une ligne « Recherche » avec sa loupe",
    /data-ligne-repliee/.test(menus) &&
      /IconeLoupe/.test(menus) &&
      /Recherche/.test(menus)
  );
  verif(
    "un appui dessus redéploie (et la remontée aussi, par la mécanique partagée)",
    /surDeploiement/.test(menus) &&
      /deplier: \(\) => setMoteurReplie\(false\)/.test(barre)
  );
  verif(
    "la loupe de la barre reste où elle est (elle ne dépend que du moteur)",
    /const loupeVisible = !surAccueil \|\| moteurReplie;/.test(barre)
  );
  verif(
    "et la réserve annonce la troisième hauteur (104 px : la ligne étroite)",
    /rangeeLibre \? 104 : 64/.test(barre) && /h-\[104px\]/.test(barre)
  );
}

/* ==================================================================
 * §5 — DEUX COLONNES, SANS DÉBORDEMENT
 * ================================================================== */
titre("§5 — deux colonnes en pleine largeur (injection des classes réelles)");
const sourceBloc = lire("src/components/BlocSuivis.tsx");
const classeListe =
  sourceBloc.match(/<ul\s+className="([^"]+)"\s*>\s*\n\s*\{groupe\.suivis/)?.[1] ??
  null;
for (const [nomLargeur, faire, colonnesAttendues] of [
  ["390 px", pageMobile, 1],
  ["1440 px", () => pageWeb(1440), 2],
]) {
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    const vu = await page.evaluate((classes) => {
      const hote = document.createElement("div");
      hote.style.cssText = "width:100%;";
      hote.innerHTML = `<ul id="e-liste" class="${classes}">
        <li><div style="height:80px">Un artiste au nom très long qui ne doit jamais élargir la page</div></li>
        <li><div style="height:80px">Un deuxième</div></li>
        <li><div style="height:80px">Un troisième</div></li>
      </ul>`;
      document.body.appendChild(hote);
      const liste = document.getElementById("e-liste");
      const colonnes = getComputedStyle(liste).gridTemplateColumns.split(" ").length;
      const mesure = {
        colonnes,
        gouttiere: parseFloat(getComputedStyle(liste).columnGap),
        entreBlocs: parseFloat(getComputedStyle(liste).rowGap),
        debordement:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
      hote.remove();
      return mesure;
    }, classeListe);
    verif(
      `${nomLargeur} : ${colonnesAttendues} colonne(s), et 34 px entre blocs`,
      vu.colonnes === colonnesAttendues && vu.entreBlocs === 34,
      `${vu.colonnes} colonne(s) · gouttière ${vu.gouttiere} · ${vu.entreBlocs} px`
    );
    verif(
      `${nomLargeur} : aucune colonne ne fait déborder la page (le piège de la nº 228)`,
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );
  } catch (erreur) {
    nonJoue(`§5 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * CE QUI NE PEUT PAS S'OUVRIR D'ICI
 * ================================================================== */
titre("La page vivante");
{
  const { contexte, page } = await pageWeb(1440);
  const reponse = await page.goto(`${BASE}/mes-favoris`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  verif(
    "« Ma sélection » exige bien une session (elle mène à la connexion)",
    page.url().includes("/devenir-tatoueur"),
    `${reponse.status()} → ${page.url().replace(BASE, "")}`
  );
  await contexte.close();
}
nonJoue(
  "§1 à §5 · la page vivante",
  "« Ma sélection » exige une session (base hors de portée) : les règles tournent dans le vrai module (harnais), les classes sont mesurées par injection, et la mécanique partagée est éprouvée sur l'accueil"
);

await navigateur.close();
bilan();
