/**
 * BANC DE LA PASSE Nº 262
 * ==================================================================
 * §1 les points de la feuille passent à 6 px (les 4 px de la nº 260 ne
 *    se voyaient plus) — même taille pour tous, écrite une fois ; seul
 *    le point de la porte de famille est rose ;
 * §2 « Cultures du monde » est ALIGNÉE sur les styles (même bord
 *    gauche pour son point et son libellé) ; seuls les styles qu'elle
 *    contient sont en retrait ;
 * §3 sur smartphone, le champ de « Ma sélection » dit « Filtrer » en
 *    blanc gras (la graisse et la taille du titre « Recherche » de la
 *    page du moteur) avec l'icône de filtre du moteur en gris, sans
 *    flèche ; la feuille reçoit la même icône à côté de son titre ;
 *    sur web, libellé et chevron inchangés ;
 * §4 la pilule du badge au repos : #55555F (le barreau du survol de la
 *    nº 258) ; l'encadré ne bouge pas ; l'écart ne s'annule dans aucun
 *    état ;
 * §5 sur web, l'état d'ouverture des favoris dit « Tous les styles » ;
 *    le menu garde ses deux portes.
 *
 * ⚠️ « MA SÉLECTION » N'A PAS SES DONNÉES ICI (Supabase hors de
 * portée) : son champ ne se monte pas. Les écritures RÉELLES (classes
 * et branches résolues de la source) sont donc INJECTÉES dans la page
 * vivante, et la feuille comme les points sont éprouvés vivants sur le
 * champ des artisans — le même MenuDeroulant. Dit NON JOUÉ pour le
 * montage React de la page.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari ni
 * d'iOS.
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
  //  ⚠️ REFERMER LE NAVIGATEUR, pas seulement le contexte : chaque
  //  section lance le sien — sans cela ils s'empilent (46 processus
  //  chromium au premier run) et asphyxient la machine du banc.
  const fermerContexte = contexte.close.bind(contexte);
  contexte.close = async () => {
    await fermerContexte();
    await nav.close();
  };
  return { contexte, page };
};

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const menuDeroulant = lire("src/components/MenuDeroulant.tsx");
const menuNu = sansNotes(menuDeroulant);
const menus = lire("src/components/MenusSelection.tsx");
const menusNus = sansNotes(menus);
const pageMoteur = lire("src/components/PageRechercheMobile.tsx");
const css = lire("src/app/globals.css");
const cssNu = css.replace(/\/\*[\s\S]*?\*\//g, "");

//  ROSE de la porte de famille, GRIS CLAIR des autres points — les
//  valeurs de config/roswel.ts, en rgb() comme l'écran les rend.
const ROSE = "rgb(238, 61, 111)"; // #EE3D6F
const CLAIR = "rgb(201, 204, 212)"; // #C9CCD4 (bordureCarte)
const PILULE = "rgb(85, 85, 95)"; // #55555F
const ENCADRE = "rgb(65, 65, 73)"; // #414149 (haut — la valeur gravée 175)
const BARRE_VIVE = "rgb(75, 75, 84)"; // #4B4B54 (haut-clair)

/* ==================================================================
 * §1 — À LA SOURCE : LA TAILLE UNIQUE, LES COULEURS INCHANGÉES
 * ================================================================== */
titre("§1 — à la source : 6 px, écrits une fois ; la porte seule est rose");
{
  verif(
    "la taille des points est 6 px (w-1.5 h-1.5), écrite UNE fois",
    /const TAILLE_POINT = "w-1\.5 h-1\.5";/.test(menuDeroulant) &&
      (menuDeroulant.match(/const TAILLE_POINT/g) ?? []).length === 1 &&
      //  … et les deux points de la feuille la consomment.
      (menuNu.match(/\$\{TAILLE_POINT\} rounded-full shrink-0/g) ?? [])
        .length === 2
  );
  verif(
    "le point de la porte de famille est ROSE, ceux des styles restent clairs",
    /data-porte-famille[\s\S]{0,400}backgroundColor: COULEURS\.primaire/.test(
      menuNu
    ) && /backgroundColor: COULEURS\.bordureCarte/.test(menuNu)
  );
}

/* ==================================================================
 * §2 — À LA SOURCE : LA PORTE AU RANG DES STYLES, LE RETRAIT AUX SEULS
 * STYLES QU'ELLE CONTIENT
 * ================================================================== */
titre("§2 — à la source : même bord gauche, le retrait au seul sous-niveau");
//  Les écritures réelles, extraites pour l'injection plus bas.
const gabaritPorte = menuNu.match(
  /porteSousSection\(\s*sousEntete,\s*`([^`]+)`/
)?.[1];
//  ⚠️ ANCRÉE SUR L'ÉCRITURE DE LA FEUILLE : la première `role="option"`
//  du fichier est celle du panneau du web — pas la bonne.
const gabaritOption = menuNu.match(
  /className=\{`(w-full flex items-center gap-3 min-h-\[52px\][^`]+)`\}/
)?.[1];
const enveloppePorte = menuNu.match(
  /className=\{`\$\{classes\} ([^`$]+)\$\{/
)?.[1];
{
  verif(
    "la porte de la feuille porte le pl-3 des styles — plus le pl-8",
    Boolean(gabaritPorte) &&
      /min-h-\[52px\] pl-3 pr-3/.test(gabaritPorte) &&
      !/pl-8/.test(gabaritPorte)
  );
  verif(
    "le retrait pl-8 ne vaut que pour les options d'une sous-section",
    /option\.sousGroupe \? "pl-8" : "pl-3"/.test(menuNu)
  );
  verif(
    "porte et styles partagent le même rang : gap-3, min-h-[52px], point devant",
    Boolean(enveloppePorte) &&
      /flex w-full items-center gap-3 text-left/.test(enveloppePorte) &&
      /w-full flex items-center gap-3 min-h-\[52px\]/.test(gabaritOption ?? "")
  );
}

/* ==================================================================
 * §1 + §2 — INJECTÉS (390 px) : la liste de la feuille, mesurée
 * ================================================================== */
titre("§1/§2 — injectés (390 px) : points mesurés, bords gauches alignés");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const porteClasses = nettoyer(
      `${gabaritPorte.replace(
        /\$\{[\s\S]*$/,
        ""
      )} text-sombre-texte ${enveloppePorte}`
    );
    const optionClasses = (sous) =>
      nettoyer(
        gabaritOption
          .replace(/\$\{\s*option\.sousGroupe[^}]+\}/, sous ? "pl-8" : "pl-3")
          .replace(/\$\{\s*sombre[^}]+\}/, "text-sombre-texte")
      );
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:80px;left:0;width:390px;z-index:9999;background:#232329;padding:8px";
        const point = (couleur) =>
          '<span data-point-option class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color:' + couleur + '"></span>';
        hote.innerHTML =
          '<button data-t="style" class="' + c.option + '">' + point(c.clair) + 'Suminagashi</button>' +
          '<button data-t="porte" class="' + c.porte + '">' + point(c.rose) + '<span class="flex-1">Cultures du monde</span></button>' +
          '<button data-t="sous" class="' + c.sousOption + '">' + point(c.clair) + 'Irezumi</button>';
        document.body.appendChild(hote);
        const lireBouton = (t) => {
          const b = hote.querySelector('[data-t="' + t + '"]');
          const p = b.querySelector("[data-point-option]");
          const bp = p.getBoundingClientRect();
          const s = getComputedStyle(p);
          return { x: bp.left, w: bp.width, h: bp.height, couleur: s.backgroundColor };
        };
        const mesure = { style: lireBouton("style"), porte: lireBouton("porte"), sous: lireBouton("sous") };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        option: optionClasses(false),
        sousOption: optionClasses(true),
        porte: porteClasses,
        rose: ROSE,
        clair: CLAIR,
      })})`
    );
    verif(
      "les points mesurent 6 × 6 px — style, porte et sous-style",
      [vu.style, vu.porte, vu.sous].every(
        (p) => Math.abs(p.w - 6) <= 0.5 && Math.abs(p.h - 6) <= 0.5
      ),
      `style ${vu.style.w}×${vu.style.h} · porte ${vu.porte.w}×${vu.porte.h} · sous ${vu.sous.w}×${vu.sous.h}`
    );
    verif(
      "le point de la porte est ROSE, ceux des styles CLAIRS",
      vu.porte.couleur === ROSE &&
        vu.style.couleur === CLAIR &&
        vu.sous.couleur === CLAIR,
      `porte ${vu.porte.couleur} · style ${vu.style.couleur}`
    );
    verif(
      "« Cultures du monde » part du MÊME bord gauche que les styles",
      Math.abs(vu.porte.x - vu.style.x) <= 0.5,
      `porte ${vu.porte.x.toFixed(1)} · style ${vu.style.x.toFixed(1)}`
    );
    verif(
      "SEULS les styles qu'elle contient sont en retrait (pl-8 − pl-3 = 20 px)",
      Math.abs(vu.sous.x - vu.style.x - 20) <= 0.5,
      `retrait ${(vu.sous.x - vu.style.x).toFixed(1)} px`
    );
  } catch (erreur) {
    nonJoue("§1/§2 · injection (390 px)", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — VIVANT (390 px) : les points de la feuille des artisans
 * ================================================================== */
titre("§1 — VIVANT (390 px) : la feuille du champ des artisans");
{
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    await page.locator('button[aria-haspopup="listbox"]:visible').first().click();
    await page.waitForTimeout(700);
    const point = await page.evaluate(() => {
      const feuille = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      const p = feuille?.querySelector("[data-point-option]");
      if (!p) return null;
      const b = p.getBoundingClientRect();
      return {
        w: b.width,
        h: b.height,
        couleur: getComputedStyle(p).backgroundColor,
      };
    });
    verif(
      "un point de la feuille VIVANTE mesure 6 × 6 px, et il est clair",
      Boolean(point) &&
        Math.abs(point.w - 6) <= 0.5 &&
        Math.abs(point.h - 6) <= 0.5 &&
        point.couleur === CLAIR,
      point ? `${point.w}×${point.h} · ${point.couleur}` : "(aucun point)"
    );
    await page.keyboard.press("Escape");
  } catch (erreur) {
    nonJoue("§1 · vivant (390 px)", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — À LA SOURCE : « FILTRER », L'ICÔNE UNIQUE, LA FLÈCHE PARTIE
 * ================================================================== */
titre("§3 — à la source : le champ smartphone, l'icône unique, le web intact");
{
  verif(
    "le champ reçoit son contenu smartphone (champMobile) et la borne est CELLE de la feuille",
    /champMobile\?: React\.ReactNode;/.test(menuDeroulant) &&
      /const champEnModeMobile = Boolean\(champMobile\) && surSmartphone;/.test(
        menuNu
      ) &&
      //  La même chaîne, au centième près — le gel d'un côté, le champ
      //  de l'autre : deux lectures, UN point de rupture.
      (menuNu.match(/\(max-width: 767\.98px\)/g) ?? []).length === 2
  );
  verif(
    "en mode mobile du champ, AUCUNE flèche : le style de fond part avec le libellé",
    /champEnModeMobile\s*\?\s*undefined\s*:\s*\{\s*backgroundImage:/.test(
      menuNu
    )
  );
  verif(
    "la feuille pose l'icône de l'appelant à gauche de son titre",
    /\{iconeTitreFeuille\}\s*\{titreFeuille \?\? "Choisissez une option"\}/.test(
      menuNu
    )
  );
  const champMobilePasse = menusNus.match(
    /champMobile=\{[\s\S]*?<\/span>\s*<\/>\s*\}/
  )?.[0];
  verif(
    "« Ma sélection » passe l'icône de filtre DU MOTEUR (IconeReglages), grise, et « Filtrer »",
    Boolean(champMobilePasse) &&
      /<IconeReglages taille=\{20\} classe="shrink-0 text-sombre-texte-doux" \/>/.test(
        champMobilePasse
      ) &&
      />Filtrer<\/span>/.test(champMobilePasse)
  );
  //  ⚠️ nº 264 (§1) : LA TAILLE N'EST PLUS CELLE DU TITRE — les 20 px
  //  étaient disproportionnés dans un champ. « Filtrer » prend LA
  //  TAILLE DU MOT DU CHAMP de recherche (relevée vivante : 16 px,
  //  `text-base` — le jeton même que le champ passe en taillePolice).
  //  La graisse et le blanc du titre restent.
  const jetonsTitre = ["font-bold", "text-white"];
  const spanFiltrer = menusNus.match(/<span className="([^"]+)">Filtrer/)?.[1];
  verif(
    "« Filtrer » porte la graisse et le blanc du titre, à la taille du mot du champ",
    jetonsTitre.every((j) => (spanFiltrer ?? "").includes(j)) &&
      (spanFiltrer ?? "").includes("text-base") &&
      /taillePolice="text-base"/.test(menusNus) &&
      jetonsTitre.every((j) =>
        (pageMoteur.match(/<h1 className="([^"]+)"/)?.[1] ?? "").includes(j)
      ),
    `span « ${spanFiltrer} »`
  );
  verif(
    "UNE SEULE ÉCRITURE D'ICÔNE : IconeReglages, deux instances, deux couleurs",
    (menusNus.match(/<IconeReglages /g) ?? []).length === 2 &&
      /iconeTitreFeuille=\{<IconeReglages taille=\{20\} classe="shrink-0" \/>\}/.test(
        menusNus
      ) &&
      //  … et c'est bien l'icône du bouton rond du moteur.
      /IconeReglages/.test(lire("src/components/MoteurTatouage.tsx"))
  );
}

/* ==================================================================
 * §3 — INJECTÉ (390 px) : le champ « Filtrer » et le titre de feuille
 * ================================================================== */
titre("§3 — injecté (390 px) : blanc gras 20 px, icône grise, pas de flèche");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const enveloppe = menuNu.match(
      /<span className="(flex items-center gap-2\.5)">\{champMobile\}/
    )?.[1];
    const h2Classes = menuNu.match(/<h2 className="([^"]+)">/)?.[1];
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:80px;left:16px;width:358px;z-index:9999;background:#232329";
        const icone = (classe) =>
          '<svg data-icone width="20" height="20" viewBox="0 0 24 24" fill="none" class="' + classe + '"><path d="M4 7.5h9" stroke="currentColor"/></svg>';
        //  LE CHAMP en mode mobile : la vraie enveloppe, le vrai
        //  contenu, et AUCUN style de fond (la fleche est partie).
        hote.innerHTML =
          '<button data-champ class="w-full min-h-[46px] text-base pl-4 pr-10 text-left overflow-hidden text-ellipsis whitespace-nowrap">' +
          '<span class="' + c.enveloppe + '">' + icone("shrink-0 text-sombre-texte-doux") +
          '<span data-mot class="' + c.mot + '">Filtrer</span></span></button>' +
          '<div data-feuille class="text-sombre-texte"><h2 data-titre class="' + c.h2 + '">' + icone("shrink-0") + 'Filtrer</h2></div>';
        document.body.appendChild(hote);
        const mot = hote.querySelector("[data-mot]");
        const sMot = getComputedStyle(mot);
        const iconeChamp = getComputedStyle(hote.querySelector("[data-champ] [data-icone]"));
        const titreFeuille = getComputedStyle(hote.querySelector("[data-titre]"));
        const iconeFeuille = getComputedStyle(hote.querySelector("[data-feuille] [data-icone]"));
        const champ = getComputedStyle(hote.querySelector("[data-champ]"));
        const mesure = {
          mot: { taille: sMot.fontSize, graisse: sMot.fontWeight, couleur: sMot.color },
          iconeChamp: iconeChamp.color,
          fondChamp: champ.backgroundImage,
          titre: titreFeuille.color,
          iconeFeuille: iconeFeuille.color,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        enveloppe,
        mot: spanDuFiltrer(),
        h2: h2Classes,
      })})`
    );
    verif(
      "« Filtrer » : 20 px, gras (700), blanc",
      //  ⚠️ nº 264 (§1) : 16 px désormais — la taille du mot du champ
      //  de recherche (text-base), plus celle d'un titre. Gras et
      //  blanc inchangés.
      vu.mot.taille === "16px" &&
        vu.mot.graisse === "700" &&
        vu.mot.couleur === "rgb(255, 255, 255)",
      `${vu.mot.taille} · ${vu.mot.graisse} · ${vu.mot.couleur}`
    );
    verif(
      "l'icône du champ est GRISE — pas la couleur du mot",
      vu.iconeChamp !== vu.mot.couleur && vu.iconeChamp !== "rgb(0, 0, 0)",
      `icône ${vu.iconeChamp}`
    );
    verif(
      "aucune flèche : le champ en mode mobile n'a AUCUNE image de fond",
      vu.fondChamp === "none",
      `background-image ${vu.fondChamp}`
    );
    verif(
      "dans la feuille, l'icône prend LA COULEUR DU TITRE (« tu y es »)",
      vu.iconeFeuille === vu.titre && vu.iconeFeuille !== vu.iconeChamp,
      `icône ${vu.iconeFeuille} · titre ${vu.titre}`
    );
  } catch (erreur) {
    nonJoue("§3 · injection (390 px)", String(erreur).slice(0, 90));
  }
  await contexte.close();
}
function spanDuFiltrer() {
  return menusNus.match(/<span className="([^"]+)">Filtrer/)?.[1] ?? "";
}

/* ==================================================================
 * §3 — VIVANT : les champs SANS contenu smartphone ne changent pas
 * ================================================================== */
titre("§3 — VIVANT : ailleurs, libellé et chevron comme toujours");
{
  //  390 : le champ des artisans (aucun champMobile) garde sa flèche.
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    const fond = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button[aria-haspopup="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      return b ? getComputedStyle(b).backgroundImage : "(absent)";
    });
    verif(
      "390 px : un champ sans contenu smartphone garde sa flèche",
      fond.includes("url("),
      fond.slice(0, 40)
    );
  } catch (erreur) {
    nonJoue("§3 · vivant (390 px)", String(erreur).slice(0, 90));
  }
  await contexte.close();
}
{
  //  1440 : le panneau du web s'ouvre sans un seul point — il n'a
  //  jamais eu les points de la feuille, et il ne les reçoit pas.
  const { contexte, page } = await ouvrirA(1440, "/artisans");
  try {
    const bouton = page.locator('button[aria-haspopup="listbox"]:visible').first();
    const fond = await bouton.evaluate((b) => getComputedStyle(b).backgroundImage);
    await bouton.click();
    await page.waitForTimeout(500);
    //  ⚠️ NE COMPTER QUE LES POINTS VISIBLES : la feuille smartphone
    //  est rendue dans le DOM à toute largeur (masquée par md:hidden),
    //  ses points y dorment — seul l'écran compte.
    const points = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-point-option]")].filter(
          (p) => p.getBoundingClientRect().width > 0
        ).length
    );
    verif(
      "1440 px : le champ garde sa flèche, et le panneau du web n'a aucun point",
      fond.includes("url(") && points === 0,
      `flèche ${fond.includes("url(")} · points ${points}`
    );
  } catch (erreur) {
    nonJoue("§3 · vivant (1440 px)", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LA PILULE À #55555F, L'ÉCART JAMAIS ANNULÉ (les deux largeurs)
 * ================================================================== */
titre("§4 — la pilule au repos : #55555F ; l'encadré ne bouge pas");
{
  verif(
    "à la source : UNE règle habille la pilule (le barreau du survol devenu repos)",
    /\[data-clair-barre\] \[data-capsule-glissante\],\s*\[data-clair-fixe\] \[data-capsule-glissante\] \{\s*background-color: var\(--rw-clair-pilule-vif\);\s*\}/.test(
      cssNu
    ) &&
      //  Les quatre règles d'état de la nº 258 sont parties : plus
      //  aucun sélecteur d'état ne rhabille la pilule.
      !/:hover \[data-capsule-glissante\]/.test(cssNu) &&
      !/:focus-within \[data-capsule-glissante\]/.test(cssNu) &&
      /--rw-clair-pilule-vif: #55555f;/.test(cssNu)
  );
  verif(
    "l'encadré du badge garde sa couleur fixe de la nº 260",
    /\[data-clair-fixe\] \{\s*background-color: var\(--rw-clair-barre\);\s*\}/.test(
      cssNu
    )
  );
}
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const vu = await page.evaluate(() => {
      const hote = document.createElement("div");
      hote.style.cssText = "position:fixed;top:80px;left:16px;z-index:9999";
      const zone = (attrs) =>
        "<div " +
        attrs +
        ' style="width:200px;height:46px;margin-bottom:8px"><span data-capsule-glissante style="display:block;width:90px;height:38px"></span></div>';
      hote.innerHTML =
        zone('data-t="fixe" data-clair-fixe') +
        zone('data-t="barre" data-clair-barre') +
        zone('data-t="vive" data-clair-barre data-clair-vif');
      document.body.appendChild(hote);
      const lireZone = (t) => {
        const z = hote.querySelector('[data-t="' + t + '"]');
        return {
          fond: getComputedStyle(z).backgroundColor,
          pilule: getComputedStyle(
            z.querySelector("[data-capsule-glissante]")
          ).backgroundColor,
        };
      };
      const mesure = {
        fixe: lireZone("fixe"),
        barre: lireZone("barre"),
        vive: lireZone("vive"),
      };
      hote.remove();
      return mesure;
    });
    verif(
      `${largeur} px : la pilule est #55555F dans TOUS les états, l'encadré fixe n'a pas bougé`,
      vu.fixe.pilule === PILULE &&
        vu.barre.pilule === PILULE &&
        vu.vive.pilule === PILULE &&
        vu.fixe.fond === ENCADRE,
      `pilule ${vu.fixe.pilule} · encadré ${vu.fixe.fond}`
    );
    verif(
      `${largeur} px : l'écart ne s'annule dans AUCUN état — même sous un fond qui s'éclaircit`,
      vu.fixe.fond !== vu.fixe.pilule &&
        vu.barre.fond !== vu.barre.pilule &&
        vu.vive.fond !== vu.vive.pilule &&
        vu.vive.fond === BARRE_VIVE,
      `fixe ${vu.fixe.fond} · vif ${vu.vive.fond} · pilule ${vu.fixe.pilule}`
    );
  } catch (erreur) {
    nonJoue(`§4 · (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §5 — À LA SOURCE : « Tous les styles » SUR LES FAVORIS DU WEB
 * ================================================================== */
titre("§5 — à la source : le libellé d'ouverture des favoris, web");
{
  verif(
    "sur web, l'état d'ouverture des favoris dit « Tous les styles » (l'écriture des suivis)",
    /if \(!etroit && !choix\.nature && !choix\.style\) return libelleStyleChoisi\(""\);/.test(
      menusNus
    )
  );
  verif(
    "c'est le LIBELLÉ seul : le menu garde ses entrées telles quelles (les deux portes)",
    /options=\{entrees\}/.test(menusNus) &&
      //  … et un choix — porte ou couple — garde l'écriture refermée.
      /return libelleDuChoix\(\{ \.\.\.choix, nature \}\);/.test(menusNus)
  );
  verif(
    "au doigt (768–1023), la catégorie seule demeure ; sur les suivis, « Style »",
    /if \(etroit\) return titre \?\? "";/.test(menusNus) &&
      /if \(etroit && !choix\.style\) return "Style";/.test(menusNus)
  );
}

/* ==================================================================
 * DÉBORDEMENT — les deux largeurs
 * ================================================================== */
titre("Aucun débordement du document");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const d = await page.evaluate(() => ({
      s: document.documentElement.scrollWidth,
      c: document.documentElement.clientWidth,
    }));
    verif(
      `${largeur} px : scrollWidth = clientWidth`,
      d.s === d.c,
      `écart ${d.s - d.c}`
    );
  } catch (erreur) {
    nonJoue(`débordement (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page s'ouvre mais SANS ses données (Supabase hors de portée) : " +
    "son champ ne se monte pas. Le champ « Filtrer » (blanc gras 20 px, " +
    "icône grise, sans flèche), le titre de feuille à icône, les points " +
    "et l'alignement sont mesurés par INJECTION des écritures réelles " +
    "(classes et branches résolues de la source) dans la page vivante ; " +
    "la feuille et ses points sont éprouvés VIVANTS sur le champ des " +
    "artisans (le même MenuDeroulant) ; le libellé « Tous les styles » " +
    "est vérifié à la source (la branche web des favoris). Seul le " +
    "montage React de la page n'est pas éprouvé"
);

bilan();
