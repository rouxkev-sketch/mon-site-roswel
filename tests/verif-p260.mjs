/**
 * BANC DE LA PASSE Nº 260
 * ==================================================================
 * §1 au doigt, le champ des suivis dit « Style » à l'ouverture (et le
 *    nom du style après un choix) ; sur le web, « Tous les styles » ne
 *    bouge pas ;
 * §2 l'encadré du badge NE S'ÉCLAIRCIT PLUS : même fond au repos, au
 *    survol, au focus et pendant un clic — et la pilule y garde son
 *    cran unique au-dessus. Le champ du moteur, lui, garde son
 *    éclaircissement (mesuré VIVANT, pour prouver qu'on ne l'a retiré
 *    que là) ;
 * §3 dans la feuille : des points de 4 px, tous blancs sauf celui de
 *    la porte de famille (rose) ; le sous-niveau garde la teinte de la
 *    fenêtre (aucun voile) ; après un choix, RIEN ne marque le style
 *    retenu — ni point rose, ni graisse, ni fond.
 *
 * ⚠️ LE BLOC DE « MA SÉLECTION » EXIGE UNE SESSION (la page s'ouvre
 * mais sans ses données : Supabase est hors de portée, sa barre n'a
 * donc pas de rangée). Le §1 est vérifié À LA SOURCE, le §2 par
 * injection des classes réelles contre le champ du moteur VIVANT, le
 * §3 vivant sur la feuille du champ des artisans (le MÊME
 * MenuDeroulant) — la porte de famille, qui n'existe que dans le menu
 * de « Ma sélection », par injection de son écriture réelle.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari.
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

const ouvrirA = async (largeur, chemin = "/", options = {}) => {
  const mobile = options.mobile ?? largeur < 1024;
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

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const menus = lire("src/components/MenusSelection.tsx");
const menusNus = sansNotes(menus);
const encadre = lire("src/components/EncadreBarre.tsx");
const menuDeroulant = lire("src/components/MenuDeroulant.tsx");
const capsule = lire("src/components/SelecteurCapsule.tsx");
const css = lire("src/app/globals.css");

const REPOS = "rgb(65, 65, 73)";
const VIF = "rgb(75, 75, 84)";
const ROSE = "rgb(238, 61, 111)";
const BLANC_POINT = "rgb(201, 204, 212)";

/* ==================================================================
 * §1 — LE LIBELLÉ COURT
 * ================================================================== */
titre("§1 — à la source : « Style » au doigt, « Tous les styles » sur le web");
{
  verif(
    "seul l'état d'ouverture se raccourcit, et seulement sur écran étroit",
    /if \(etroit && !choix\.style\) return "Style";/.test(menusNus) &&
      /return libelleStyleChoisi\(choix\.style\);/.test(menusNus) &&
      //  Le mot long reste l'écriture du site (MoteurTatouage).
      /libelleStyleChoisi/.test(menusNus)
  );
  verif(
    "la borne est TOUJOURS celle de la barre — aucun second point de rupture",
    /matchMedia\("\(max-width: 1023\.98px\)"\)/.test(menus) &&
      (menus.match(/matchMedia\(/g) ?? []).length === 1
  );
  verif(
    "le mot long n'est pas réécrit ici : il vit dans `libelleStyleChoisi`",
    /export function libelleStyleChoisi/.test(
      lire("src/components/MoteurTatouage.tsx")
    ) && !/"Tous les styles"/.test(menusNus)
  );
}

/* ==================================================================
 * §2 — L'ENCADRÉ NE S'ÉCLAIRCIT PLUS
 * ================================================================== */
titre("§2 — à la source : le fond fixe, la nº 175 intacte");
{
  verif(
    "l'encadré du badge prend `data-clair-fixe`, jamais `data-clair-barre`",
    /porteBadge \? \{ "data-clair-fixe": "" \} : \{ "data-clair-barre": "" \}/.test(
      encadre
    )
  );
  verif(
    "le fond fixe est LA MÊME variable, prise au repos et jamais quittée",
    /\[data-clair-fixe\] \{\s*background-color: var\(--rw-clair-barre\);\s*\}/.test(
      css
    ) &&
      //  Aucun état sur ce sélecteur-là.
      !/\[data-clair-fixe\]:(hover|active|focus-within)/.test(css)
  );
  verif(
    "la mécanique de la nº 175 n'a pas bougé d'une ligne",
    /\[data-clair-barre\]:hover,\s*\[data-clair-barre\]:active,\s*\[data-clair-barre\]:focus-within,\s*\[data-clair-barre\]\[data-clair-vif\] \{\s*background-color: var\(--rw-clair-barre-vif\);/.test(
      css
    )
  );
  verif(
    "la pilule garde son cran au-dessus, dans les deux fonds",
    /\[data-clair-barre\] \[data-capsule-glissante\],\s*\[data-clair-fixe\] \[data-capsule-glissante\] \{\s*background-color: var\(--rw-clair-barre-vif\);/.test(
      css
    )
  );
}

/* ------------------------------------------------------------------
 * LES CLASSES RÉELLES, lues à la source (branches résolues).
 * ---------------------------------------------------------------- */
const classeEncadre = nettoyer(
  encadre
    .match(/className=\{`(flex items-stretch[^`]*)`\}/)?.[1]
    ?.replace(/\$\{\s*porteBadge \? "([^"]+)" : "[^"]+"\s*\}/, "$1")
);
const classeMoitieBadge = nettoyer(
  encadre.match(/\? "(shrink-0 grow-0 basis-1\/2 box-content[^"]+)"/)?.[1]
);
const classeMoitieChamp = nettoyer(
  encadre.match(/<div className="(flex-1 min-w-0 basis-1\/2)">\{droite\}/)?.[1]
);
const classeTrait = nettoyer(encadre.match(/className="(w-px my-2\.5[^"]*)"/)?.[1]);
const hauteurChamp = menus.match(/hauteur="(min-h-\[\d+px\])"/)?.[1] ?? "";
const hauteurMot = menus.match(/hauteurMot="(min-h-\[\d+px\])"/)?.[1] ?? "";
const classeZone = nettoyer(
  capsule
    .match(/data-selecteur-capsule=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{[^}]*"w-full"[^}]*\}/, "w-full")
);
const classeHote = nettoyer(
  capsule.match(/data-hote-capsule="" className="([^"]+)"/)?.[1]
);
const classePilule = nettoyer(
  capsule
    .match(/data-capsule-glissante=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{robeCapsule\}/, "")
);
const gabaritMot = capsule.match(/className=\{`(relative z-\[1\][^`]+)`\}/)?.[1];
const classeMot = (actif) =>
  nettoyer(
    gabaritMot
      ?.replace(/\$\{hauteurMot\}/, hauteurMot)
      .replace(/\$\{[^}]*"flex-1 basis-1\/2 min-w-0"[^}]*\}/, "flex-1 basis-1/2 min-w-0")
      .replace(
        /\$\{[^}]*actif[^}]*\}/,
        actif ? "text-sombre-texte" : "text-sombre-texte-doux"
      )
  );
const gabaritLargeur = capsule.match(/const largeurMot = `([^`]+)`/)?.[1] ?? "";
const gabaritGauche = capsule.match(/left: `([^`]+)`/)?.[1] ?? "";
const largeurCalculee = gabaritLargeur
  .replace("${options.length - 1}", "1")
  .replace("${options.length}", "2");
const place = {
  width: largeurCalculee,
  left: gabaritGauche
    .replace("${rang}", "0")
    .replace("${largeurMot}", largeurCalculee),
};

titre("§2 — les quatre états, mesurés (injection, 1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const depart = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        //  FIXE ET DANS LA FENÊTRE : le survol doit être un VRAI survol.
        hote.style.cssText = "position:fixed;top:200px;left:120px;width:640px;z-index:9999";
        const mot = (actif, texte) =>
          '<button role="radio" aria-checked="' + (actif ? "true" : "false") +
          '" class="' + (actif ? c.motActif : c.motDormant) + '">' + texte + '</button>';
        hote.innerHTML =
          '<div data-encadre-barre data-clair-fixe class="' + c.encadre + '">' +
            '<div class="' + c.moitieBadge + '">' +
              '<div data-hote-capsule class="' + c.hote + '">' +
              '<div data-selecteur-capsule class="' + c.zone + '">' +
              //  ⚠️ L'ATTRIBUT, PAS SEULEMENT LA CLASSE (leçon nº 246) :
              //  la robe de la pilule vit dans une règle d'ATTRIBUT de
              //  globals.css — sans lui, elle reste nue.
              '<span data-pilule data-capsule-glissante class="' + c.pilule + '" style="left:' + c.place.left + ';width:' + c.place.width + '"></span>' +
              mot(true, "Favoris") + mot(false, "Suivis") + '</div></div>' +
            '</div>' +
            '<div aria-hidden="true" class="' + c.trait + '"></div>' +
            '<div class="' + c.moitieChamp + '">' +
              '<button data-champ class="w-full ' + c.hauteur + ' text-base pl-4 pr-10 text-left">Tous les styles</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(hote);
        const cadre = hote.querySelector("[data-encadre-barre]");
        const pilule = hote.querySelector("[data-pilule]");
        window.__p260 = {
          hote,
          lire: () => ({
            fond: getComputedStyle(cadre).backgroundColor,
            pilule: getComputedStyle(pilule).backgroundColor,
          }),
        };
        const boite = cadre.getBoundingClientRect();
        return {
          etat: window.__p260.lire(),
          survol: { x: boite.left + 40, y: boite.top + boite.height / 2 },
        };
      })(${JSON.stringify({
        encadre: classeEncadre,
        moitieBadge: classeMoitieBadge,
        moitieChamp: classeMoitieChamp,
        trait: classeTrait,
        hauteur: hauteurChamp,
        zone: classeZone,
        hote: classeHote,
        pilule: classePilule,
        motActif: classeMot(true),
        motDormant: classeMot(false),
        place,
      })})`
    );
    const etats = { repos: depart.etat };
    await page.mouse.move(depart.survol.x, depart.survol.y);
    await page.waitForTimeout(350);
    etats.survol = await page.evaluate(() => window.__p260.lire());
    await page.mouse.down();
    await page.waitForTimeout(250);
    etats.clic = await page.evaluate(() => window.__p260.lire());
    await page.mouse.up();
    await page.evaluate(() =>
      window.__p260.hote.querySelector("[data-champ]").focus()
    );
    await page.waitForTimeout(350);
    etats.focus = await page.evaluate(() => window.__p260.lire());
    await page.evaluate(() => window.__p260.hote.remove());
    const fonds = Object.values(etats).map((e) => e.fond);
    const pilules = Object.values(etats).map((e) => e.pilule);
    verif(
      "le fond de l'encadré est LE MÊME aux quatre états",
      fonds.every((fond) => fond === REPOS),
      Object.entries(etats)
        .map(([nom, e]) => `${nom} ${e.fond}`)
        .join(" · ")
    );
    verif(
      "et la pilule garde son cran unique au-dessus, aux quatre états",
      pilules.every((robe) => robe === VIF),
      Object.entries(etats)
        .map(([nom, e]) => `${nom} ${e.pilule}`)
        .join(" · ")
    );
  } catch (erreur) {
    nonJoue("§2 · injection", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

titre("§2 — le champ du MOTEUR garde son éclaircissement (VIVANT, 1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const cadre = page.locator("[data-encadre-barre]").first();
    await cadre.waitFor({ state: "visible", timeout: 15000 });
    const repos = await cadre.evaluate((n) => getComputedStyle(n).backgroundColor);
    const boite = await cadre.boundingBox();
    await page.mouse.move(boite.x + 40, boite.y + boite.height / 2);
    await page.waitForTimeout(350);
    const survol = await cadre.evaluate((n) => getComputedStyle(n).backgroundColor);
    verif(
      "le moteur s'éclaircit toujours au survol — on n'a retiré la règle QUE du bloc",
      repos === REPOS && survol === VIF,
      `repos ${repos} → survol ${survol}`
    );
    verif(
      "…et c'est bien `data-clair-barre` qu'il porte, pas le fond fixe",
      await cadre.evaluate(
        (n) => n.hasAttribute("data-clair-barre") && !n.hasAttribute("data-clair-fixe")
      )
    );
  } catch (erreur) {
    nonJoue("§2 · moteur vivant", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — L'INTÉRIEUR DES FEUILLES
 * ================================================================== */
titre("§3 — à la source : 4 px pour tous, le rose à la seule porte");
{
  verif(
    "la taille des points est écrite UNE fois, et vaut 4 px",
    /const TAILLE_POINT = "w-1 h-1";/.test(menuDeroulant) &&
      (sansNotes(menuDeroulant).match(/\$\{TAILLE_POINT\}/g) ?? []).length === 2
  );
  verif(
    "le point d'un style est BLANC quoi qu'il arrive — plus de rose au choix",
    /style=\{\{ backgroundColor: COULEURS\.bordureCarte \}\}/.test(menuDeroulant) &&
      !/backgroundColor: choisi/.test(menuDeroulant)
  );
  verif(
    "la porte de famille reçoit un point, et lui seul est ROSE",
    /avecPoint && \(/.test(sansNotes(menuDeroulant)) &&
      /data-porte-famille=\{avecPoint \? "" : undefined\}/.test(menuDeroulant) &&
      /\{ avecPoint: true, sansVoile: true \}/.test(menuDeroulant)
  );
  verif(
    "le voile du sous-niveau s'en va de la feuille (la nº 241-§5 y est défaite)",
    /option\.sousGroupe \? "pl-8" : "pl-3"/.test(menuDeroulant) &&
      /!sansVoile && sousGroupeDeplie === sousEntete/.test(menuDeroulant) &&
      //  Le panneau du web, lui, garde le sien.
      /option\.sousGroupe \? " bg-white\/\[0\.06\]" : ""/.test(menuDeroulant)
  );
  verif(
    "rien d'autre ne marque le choix : ni graisse, ni fond dans la feuille",
    !/font-semibold|font-bold/.test(
      menuDeroulant.slice(
        menuDeroulant.indexOf("data-point-option"),
        menuDeroulant.indexOf("</button>", menuDeroulant.indexOf("data-point-option"))
      )
    )
  );
}

titre("§3 — VIVANT (390 px) : les points de la feuille, et après un choix");
{
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    await page.locator('button[aria-haspopup="listbox"]:visible').first().click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const feuille = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      const points = [...feuille.querySelectorAll("[data-point-option]")];
      return points.map((point) => {
        const b = point.getBoundingClientRect();
        return {
          l: Math.round(b.width),
          h: Math.round(b.height),
          couleur: getComputedStyle(point).backgroundColor,
        };
      });
    });
    verif(
      "chaque style porte un point de 4 × 4, tous de la même couleur claire",
      vu.length > 3 &&
        vu.every((p) => p.l === 4 && p.h === 4 && p.couleur === BLANC_POINT),
      `${vu.length} points · ${vu[0]?.l}×${vu[0]?.h} · ${vu[0]?.couleur}`
    );
    verif(
      "aucun point rose dans la liste",
      vu.every((p) => p.couleur !== ROSE),
      `roses : ${vu.filter((p) => p.couleur === ROSE).length}`
    );
    //  ON CHOISIT, on rouvre : RIEN ne doit distinguer la ligne retenue.
    const options = page.locator('[role="listbox"]:visible [role="option"]');
    const retenu = nettoyer(await options.nth(2).innerText());
    await options.nth(2).click();
    await page.waitForTimeout(600);
    await page.locator('button[aria-haspopup="listbox"]:visible').first().click();
    await page.waitForTimeout(700);
    const apres = await page.evaluate(() => {
      const feuille = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      return [...feuille.querySelectorAll('[role="option"]')].map((bouton) => {
        const point = bouton.querySelector("[data-point-option]");
        const s = getComputedStyle(bouton);
        return {
          choisi: bouton.getAttribute("aria-selected") === "true",
          point: point ? getComputedStyle(point).backgroundColor : "",
          graisse: s.fontWeight,
          fond: s.backgroundColor,
        };
      });
    });
    const choisie = apres.filter((o) => o.choisi);
    const autres = apres.filter((o) => !o.choisi);
    verif(
      `après un choix (« ${retenu} »), RIEN ne le marque dans la liste`,
      choisie.length === 1 &&
        autres.length > 0 &&
        choisie[0].point === autres[0].point &&
        choisie[0].graisse === autres[0].graisse &&
        choisie[0].fond === autres[0].fond,
      `point ${choisie[0]?.point} · graisse ${choisie[0]?.graisse} · fond ${choisie[0]?.fond}`
    );
  } catch (erreur) {
    nonJoue("§3 · feuille vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

titre("§3 — la porte de famille et le sous-niveau (injection, 390 px)");
{
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    //  L'ÉCRITURE RÉELLE DE LA PORTE ET DE SES ENFANTS, lue à la
    //  source : la porte de famille n'existe que dans le menu de « Ma
    //  sélection », qu'aucune session n'ouvre ici.
    const classePorte = nettoyer(
      menuDeroulant
        .match(/porteSousSection\(\s*sousEntete,\s*`([^`]+)`/)?.[1]
        ?.replace(/\$\{[\s\S]*?\}/, "text-sombre-texte hover:bg-sombre-eleve")
    );
    const gabaritOption = nettoyer(
      menuDeroulant.match(
        /className=\{`(w-full flex items-center gap-3 min-h-\[52px\][^`]+)`\}/
      )?.[1]
    );
    const classeOption = gabaritOption
      ?.replace(/\$\{[^}]*option\.sousGroupe \? "pl-8" : "pl-3"[^}]*\}/, "pl-8")
      .replace(/\$\{[^}]*sombre[\s\S]*?\}/, "text-sombre-texte hover:bg-sombre-eleve");
    const vu = await page.evaluate(
      `((c) => {
        const feuille = [...document.querySelectorAll('[role="listbox"]')].find(
          (n) => n.getBoundingClientRect().height > 0
        ) || document.body;
        const hote = document.createElement("div");
        hote.innerHTML =
          '<button data-porte class="' + c.porte + '">' +
            '<span data-point-porte class="' + c.taille + ' rounded-full shrink-0" style="background-color:' + c.rose + '"></span>' +
            '<span class="flex-1">Cultures du monde</span></button>' +
          '<button data-sous class="' + c.option + '">' +
            '<span data-point-option class="' + c.taille + ' rounded-full shrink-0" style="background-color:' + c.blanc + '"></span>Maori</button>';
        feuille.appendChild(hote);
        const lire = (s) => {
          const n = hote.querySelector(s);
          const b = n.getBoundingClientRect();
          return {
            fond: getComputedStyle(n).backgroundColor,
            point: n.querySelector("span[data-point-porte],span[data-point-option]")
              ? getComputedStyle(
                  n.querySelector("span[data-point-porte],span[data-point-option]")
                ).backgroundColor
              : "",
            l: Math.round(b.height),
          };
        };
        const mesure = {
          porte: lire("[data-porte]"),
          sous: lire("[data-sous]"),
          fenetre: getComputedStyle(feuille).backgroundColor,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        porte: classePorte,
        option: classeOption,
        taille: menuDeroulant.match(/const TAILLE_POINT = "([^"]+)"/)?.[1],
        rose: "#EE3D6F",
        blanc: "#C9CCD4",
      })})`
    );
    verif(
      "la porte de famille porte un point ROSE, le style un point clair",
      vu.porte.point === ROSE && vu.sous.point === BLANC_POINT,
      `porte ${vu.porte.point} · style ${vu.sous.point}`
    );
    verif(
      "le sous-niveau ne peint AUCUN fond : il garde la teinte de la fenêtre",
      vu.sous.fond === "rgba(0, 0, 0, 0)" && vu.porte.fond === "rgba(0, 0, 0, 0)",
      `porte ${vu.porte.fond} · sous-niveau ${vu.sous.fond}`
    );
  } catch (erreur) {
    nonJoue("§3 · porte injectée", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LE DÉBORDEMENT
 * ================================================================== */
titre("§4 — aucun débordement du document, aux deux largeurs");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const deborde = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    verif(`${largeur} px : scrollWidth = clientWidth`, deborde === 0, `écart ${deborde}`);
  } catch (erreur) {
    nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page s'ouvre mais SANS ses données (Supabase hors de portée) : sa " +
    "barre n'a pas de rangée à porter, et son menu — le seul à contenir " +
    "la porte « Cultures du monde » dans une FEUILLE — ne s'ouvre pas " +
    "ici. Le §1 est donc vérifié à la source (le libellé court et sa " +
    "borne), le §2 par injection des classes réelles aux quatre états, " +
    "contre le champ du moteur mesuré VIVANT, et le §3 vivant sur la " +
    "feuille du champ des artisans (le même MenuDeroulant), la porte de " +
    "famille par injection de son écriture réelle"
);

process.exit(bilan());
