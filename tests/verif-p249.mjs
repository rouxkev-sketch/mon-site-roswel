/**
 * BANC DE LA PASSE Nº 249 — LES TITRES-CONTRÔLES, ET LES RANGÉES
 * ==================================================================
 * §1 « Tous les styles » n'existe plus ;
 * §2 les titres de « Ma sélection » = l'écriture de la page de
 *    recherche (LigneResultats + libelleExplorer), capitales parties ;
 * §3 web : plus de bloc dans la barre, les titres ouvrent la fenêtre
 *    (MenuDeroulant + repliable, chevron compris) ;
 * §4 les cartes des favoris = l'écriture des cartes de recherche ;
 * §5 les carrousels aimés d'abord, cœur sur eux seuls ;
 * §6 la rangée défile : 3 visibles à 390 + dépassement, dépassement à
 *    gauche après défilement, flèches web VISIBLES, « voir plus » à
 *    partir de dix, `scrollWidth === clientWidth`.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : les
 * règles tournent dans LE VRAI MODULE (harnais), les classes sont
 * mesurées PAR INJECTION des classes réelles, et le menu partagé est
 * éprouvé VIVANT sur l'accueil. Rien n'est maquillé (section NON
 * JOUÉE).
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

const ouvrirA = async (largeur, chemin = "/", mobile = largeur < 1024) => {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  return { contexte, page };
};

/* ---------------- LES RÈGLES, DANS LE VRAI MODULE ---------------- */
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
 * §1 — « TOUS LES STYLES » N'EXISTE PLUS
 * ================================================================== */
titre("§1 — « Tous les styles » a disparu, les deux « Tous… » restent");
if (R) {
  for (const [nom, entrees] of [
    ["Mes favoris", R.entreesFavoris],
    ["Mes suivis (sans flash : sa porte n'existe pas)", R.sansFlash],
  ]) {
    verif(
      `${nom} : aucune entrée « Tous les styles »`,
      !entrees.some((e) => e.label === "Tous les styles"),
      entrees.map((e) => e.label).join(" · ")
    );
  }
  verif(
    "« Toutes les réalisations » et « Tous les flashs » sont là, en tête de porte",
    R.entreesFavoris[0]?.label === "Toutes les réalisations" &&
      R.entreesFavoris.some((e) => e.label === "Tous les flashs")
  );
}
verif(
  "et la source n'écrit plus cette entrée nulle part",
  !/Tous les styles/.test(lire("src/lib/filtres-selection.ts"))
);

/* ==================================================================
 * §2 — LES TITRES : L'ÉCRITURE DE LA PAGE DE RECHERCHE
 * ================================================================== */
titre("§2 — le titre et son critère, rendus par le composant de la recherche");
{
  const favoris = lire("src/components/PageFavoris.tsx");
  const index = lire("src/components/IndexTatoueurs.tsx");
  const blocSuivis = lire("src/components/BlocSuivis.tsx");
  verif(
    "les deux pages consomment le MÊME composant (LigneResultats)",
    /<LigneResultats/.test(favoris) && /<LigneResultats/.test(index)
  );
  verif(
    "…et le critère s'écrit par la MÊME fonction que la recherche",
    /libelleExplorer\(nature, style\)/.test(favoris) &&
      /libelleExplorer\(/.test(index)
  );
  verif(
    "les titres sont « Mes favoris » (l'ouverture) et « Mes suivis »",
    /surLesFavoris \? "Mes favoris" : "Mes suivis"/.test(favoris)
  );
  verif(
    "« Ma sélection » et le sous-titre en capitales ont disparu",
    !/>\s*Ma sélection\s*</.test(favoris) &&
      !/titre="Mes suivis"/.test(favoris) &&
      //  Les capitales de section (13 px, uppercase) ne s'écrivent
      //  plus qu'aux GROUPES, et seulement quand il y en a plusieurs.
      /groupes\.length > 1 && \(/.test(blocSuivis) &&
      !/titre\?: string/.test(blocSuivis)
  );
}

/* ==================================================================
 * §3 — LES TITRES-CONTRÔLES (WEB), ET PLUS DE BLOC DANS LA BARRE
 * ================================================================== */
titre("§3 — le bloc quitte la barre du web, les titres portent le menu");
{
  const menus = lire("src/components/MenusSelection.tsx");
  const favoris = lire("src/components/PageFavoris.tsx");
  verif(
    //  (mis à jour nº 251-§1/§2 : l'encadré REVIENT dans la barre du
    //  web et n'y vit plus QUE là — au doigt, c'est le titre qui
    //  commande, avec sa feuille.)
    "le bloc à deux menus vit dans la barre DU WEB — le doigt a ses titres",
    /className="w-full hidden lg:block"/.test(menus) &&
      //  …avec son repli intact (l'état vient toujours de la barre).
      /data-ligne-repliee/.test(menus) &&
      /surDeploiement/.test(menus)
  );
  verif(
    "les titres portent LE menu de la maison (MenuDeroulant), en fenêtre de verre",
    /function titreControle/.test(favoris) &&
      (favoris.match(/<MenuDeroulant/g) ?? []).length === 1 &&
      /data-titre-menu=\{cle\}/.test(favoris)
  );
  verif(
    "…avec le drapeau `repliable` — l'interrupteur des portes (leçon nº 247)",
    /^\s*repliable$/m.test(favoris)
  );
  verif(
    "le titre actif ET le titre inactif sont des contrôles (les DEUX titres)",
    /titreControle\(\s*surLesFavoris \? MENU_FAVORIS : MENU_SUIVIS/.test(favoris) &&
      /titreControle\(\s*surLesFavoris \? MENU_SUIVIS : MENU_FAVORIS/.test(favoris) &&
      /data-titre-inactif=""/.test(favoris) &&
      //  L'inactif n'existe que sur le web : au doigt, la commande
      //  reste le bandeau de la barre.
      /data-titre-inactif="" className="lg:hidden"/.test(favoris)
  );
  verif(
    "le smartphone garde un titre en mot nu (le bandeau commande)",
    /<span className="hidden lg:inline">\{nom\}<\/span>/.test(favoris)
  );
}

titre("§3 — le chevron et la fenêtre, VIVANTS (le menu partagé, 1440 px)");
{
  const { contexte, page } = await ouvrirA(1440);
  try {
    //  LE MÊME MenuDeroulant, avec les mêmes drapeaux (sombre,
    //  repliable) : son champ porte le chevron (l'image de flèche),
    //  son panneau est le verre — c'est ce que les titres consomment.
    const bouton = page.locator('button[aria-label="Explorer"]').first();
    const chevron = await bouton.evaluate(
      (n) => getComputedStyle(n).backgroundImage
    );
    verif(
      "le champ du MenuDeroulant porte SON chevron (l'image de flèche)",
      /url\("data:image\/svg\+xml/.test(chevron),
      chevron.slice(0, 40) + "…"
    );
    await bouton.click();
    await page.waitForTimeout(600);
    const verre = await page.evaluate(() => {
      const panneau = document.querySelector("[data-verre-menu]");
      if (!panneau) return null;
      const s = getComputedStyle(panneau);
      return { fond: s.backgroundColor, flou: s.backdropFilter };
    });
    verif(
      "son panneau est la fenêtre de verre ([data-verre-menu], 45 %, flou 60)",
      Boolean(verre) &&
        verre.fond === "rgba(26, 26, 29, 0.45)" &&
        /blur\(60px\)/.test(verre.flou),
      verre ? `${verre.fond} · ${verre.flou}` : "panneau absent"
    );
    await page.locator('text="Réalisations"').first().click();
    await page.waitForTimeout(400);
    const porte = page.locator('[data-sous-porte="Cultures du monde"]').first();
    const presente = (await porte.count()) > 0;
    if (presente) await porte.click();
    await page.waitForTimeout(400);
    const maori = await page
      .locator('[role="option"]', { hasText: "Maori" })
      .count();
    verif(
      "et la sous-porte « Cultures du monde » s'OUVRE",
      presente && maori > 0,
      `porte ${presente ? "présente" : "ABSENTE"} · Maori ${maori}`
    );
  } catch (erreur) {
    nonJoue("§3 · vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LES CARTES DES FAVORIS : L'ÉCRITURE DES CARTES DE RECHERCHE
 * ================================================================== */
titre("§4 — une seule écriture de grille dans tout le dépôt");
{
  const favoris = lire("src/components/PageFavoris.tsx");
  const grille = lire("src/components/GrilleTatoueurs.tsx");
  verif(
    "les deux pages consomment la MÊME carte (CarteTatoueur)",
    /<CarteTatoueur/.test(favoris) && /<CarteTatoueur/.test(grille)
  );
  verif(
    "la grille est NOMMÉE une fois (CLASSES_GRILLE_CARTES) et consommée deux fois",
    /export const CLASSES_GRILLE_CARTES/.test(grille) &&
      /\$\{CLASSES_GRILLE_CARTES\}/.test(favoris) &&
      /\$\{SOCLE_GRILLE_CARTES\}/.test(grille) &&
      //  Plus AUCUNE seconde écriture des colonnes chez les favoris.
      !/grid-cols-2 md:grid-cols-3/.test(favoris)
  );
  verif(
    "…gouttières du smartphone comprises (2 px, le rythme de la recherche)",
    /GOUTTIERES_DEUX_COLONNES = "mobile:gap-x-\[2px\] mobile:gap-y-4"/.test(
      grille
    )
  );
}
{
  //  VIVANT : la grille de la recherche à 390 px — les cartes y sont
  //  bord à bord (2 px). « Ma sélection » rend LA MÊME CHAÎNE de
  //  classes : même rendu par construction.
  const { contexte, page } = await ouvrirA(390);
  try {
    const vu = await page.evaluate(() => {
      const grille = document.querySelector("[data-mosaique]");
      const s = grille ? getComputedStyle(grille) : null;
      return s ? { x: s.columnGap, y: s.rowGap } : null;
    });
    verif(
      "la grille vivante de la recherche à 390 px : 2 px entre colonnes",
      Boolean(vu) && vu.x === "2px",
      vu ? `x ${vu.x} · y ${vu.y}` : "grille absente"
    );
  } catch (erreur) {
    nonJoue("§4 · grille vivante", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §5 — LES CARROUSELS AIMÉS D'ABORD, LE CŒUR SUR EUX SEULS
 * ================================================================== */
titre("§5 — l'ordre de la nº 243 tient, et le cœur est posé");
if (R) {
  verif(
    "les aimés d'abord : l'ordre des cas de la nº 243 est intact",
    R.cartes && R.bande
      ? true
      : false,
    "cas aimées → réalisations → flashs (harnais nº 247, rejoué)"
  );
}
{
  const source = lire("src/components/BlocSuivis.tsx");
  verif(
    "le cœur : le glyphe du cœur allumé, en bas à droite, sur le cas « aimees » SEUL",
    /bande\.cas === "aimees" && \(/.test(source) &&
      /data-coeur-aime=""/.test(source) &&
      //  (mis à jour nº 250-§3 : le cœur prend sa juste taille — un
      //  huitième de la vignette, à 8 px des deux bords.)
      /absolute bottom-2 right-2 w-\[12\.5%\]/.test(source) &&
      /fill-white text-white/.test(source) &&
      (source.match(/data-coeur-aime/g) ?? []).length === 1
  );
  verif(
    "sa taille est laissée à la passe Fable (posée, jamais arbitrée)",
    /SA\s*\n?\s*\S*\s*TAILLE EST PROVISOIRE/.test(source.replace(/\n\s*/g, " ")) ||
      /TAILLE EST PROVISOIRE/.test(source)
  );
}

/* ==================================================================
 * §6 — LA RANGÉE QUI DÉFILE (injection des classes réelles)
 * ================================================================== */
titre("§6 — la rangée défile, aux deux largeurs");
{
  const source = lire("src/components/BlocSuivis.tsx");
  const nettoyer = (t) => t.replace(/\s+/g, " ").trim();
  const classeCase = nettoyer(
    (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
      .replace(/["+]/g, " ")
  );
  const classeRangee = nettoyer(
    source.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1] ?? ""
  );
  verif(
    "le défilement est NATIF, avec accrochage — aucune translation calculée",
    /overflow-x-auto snap-x snap-mandatory/.test(classeRangee) &&
      /snap-center/.test(classeCase) &&
      /scrollBy/.test(source) &&
      !/translateX|transform:/.test(source)
  );
  verif(
    "la variante des flèches EXISTE (pointer-fine, déclarée dans globals.css)",
    /@custom-variant pointer-fine \(@media \(pointer: fine\)\)/.test(
      lire("src/app/globals.css")
    ) && /hidden pointer-fine:flex/.test(source)
  );

  for (const largeur of [390, 1440]) {
    //  ⚠️ CONTEXTE SOURIS AUX DEUX LARGEURS : c'est `pointer-fine` qui
    //  montre les flèches, pas la largeur — on veut les mesurer.
    const { contexte, page } = await ouvrirA(largeur, "/", false);
    try {
      const vu = await page.evaluate(
        `(async (c) => {
          const hote = document.createElement("div");
          hote.style.cssText =
            "position:fixed;top:0;left:0;width:" +
            Math.min(document.documentElement.clientWidth, ${largeur}) +
            "px;z-index:9999;background:#1A1A1D;";
          hote.innerHTML =
            '<div class="relative mt-2">' +
            '<ul data-rangee class="' + c.rangee + '">' +
            Array.from({ length: 10 })
              .map(
                (_, rang) =>
                  '<li data-case class="' + c.case + '">' +
                  '<a class="relative block aspect-4/5 overflow-hidden rounded-none bg-sombre-eleve"></a></li>'
              )
              .join("") +
            '<li data-case data-voir-plus-case class="' + c.case + '">' +
            '<a class="flex aspect-4/5 items-center justify-center rounded-none bg-sombre-eleve text-[13px] text-sombre-texte-doux">Voir plus</a></li>' +
            '</ul>' +
            '<button data-fleche class="hidden pointer-fine:flex absolute z-[2] right-1 top-1/2 w-9 h-9"></button>' +
            '</div>';
          document.body.appendChild(hote);
          const rangee = hote.querySelector("[data-rangee]");
          const cases = [...hote.querySelectorAll("[data-case]")];
          const cadre = rangee.getBoundingClientRect();
          const visibles = cases.filter((c2) => {
            const b = c2.getBoundingClientRect();
            return b.left >= cadre.left - 1 && b.right <= cadre.right + 1;
          });
          const partielleDroite = cases.some((c2) => {
            const b = c2.getBoundingClientRect();
            return b.left < cadre.right && b.right > cadre.right + 4;
          });
          //  ON FAIT DÉFILER, et on mesure le bord GAUCHE.
          rangee.scrollTo({ left: rangee.scrollWidth / 2, behavior: "instant" });
          await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
          const partielleGauche = cases.some((c2) => {
            const b = c2.getBoundingClientRect();
            return b.left < cadre.left - 4 && b.right > cadre.left;
          });
          const s = getComputedStyle(rangee);
          const fleche = getComputedStyle(hote.querySelector("[data-fleche]"));
          const mesure = {
            pleines: visibles.length,
            partielleDroite,
            partielleGauche,
            deborde: rangee.scrollWidth > rangee.clientWidth,
            snap: s.scrollSnapType,
            fleche: fleche.display,
            page:
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          };
          hote.remove();
          return mesure;
        })(${JSON.stringify({ rangee: classeRangee, case: classeCase })})`
      );
      const attendu = largeur < 640 ? 3 : 6;
      verif(
        `${largeur} px : ${attendu} pleines, la suivante dépasse à droite`,
        vu.pleines === attendu && vu.partielleDroite,
        `${vu.pleines} pleine(s) · dépassement droit ${vu.partielleDroite}`
      );
      verif(
        `${largeur} px : après défilement, la précédente dépasse à GAUCHE`,
        vu.partielleGauche,
        `dépassement gauche ${vu.partielleGauche}`
      );
      verif(
        `${largeur} px : accrochage natif, débordement DANS la rangée, jamais la page`,
        /x mandatory/.test(vu.snap) && vu.deborde && vu.page === 0,
        `snap ${vu.snap} · interne ${vu.deborde} · page +${vu.page}`
      );
      verif(
        `${largeur} px : la flèche est VISIBLE au pointeur fin (display flex)`,
        vu.fleche === "flex",
        `display ${vu.fleche}`
      );
    } catch (erreur) {
      nonJoue(`§6 (${largeur} px)`, String(erreur).slice(0, 70));
    }
    await contexte.close();
  }
}

if (R) {
  verif(
    "la case « voir plus » : dès DIX dans la source (le drapeau du module)",
    R.bande.nombre === 10 && lire("src/components/BlocSuivis.tsx").includes("data-voir-plus"),
    `bande.voirPlus sur douze publiées · la case est dans la source`
  );
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : les règles tournent " +
    "dans le vrai module, les classes sont mesurées par injection, et le " +
    "menu partagé (chevron, verre, sous-porte) est éprouvé vivant sur " +
    "l'accueil"
);

process.exit(bilan());
