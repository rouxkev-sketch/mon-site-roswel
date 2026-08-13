/**
 * BANC DE LA PASSE Nº 254
 * ==================================================================
 * §1 le titre et son sous-titre : les valeurs de la page de recherche
 *    VIVANTE, comparées à celles de « Ma sélection » (mêmes classes,
 *    même composant, plus de pt-6 en trop) — identiques valeur par
 *    valeur, aux deux largeurs ;
 * §2 20 px identité → bande sur web (8 au doigt), 48 px entre deux
 *    artistes sur web (34 au doigt) — le second strictement plus
 *    grand ;
 * §3 web : pastille 72, nom 18, information 15 ; doigt : 52 / 15 / 14
 *    inchangés ; l'écart pastille-texte à l'échelle (14 → 20) ; la
 *    pastille immobile quand le texte grandit ;
 * §4 le bouton rond : absent au repos, présent au survol, absent au
 *    doigt ; verre des fenêtres (22 % + flou 40), aucune opacité
 *    partielle, aucune transformation, aucune transition ;
 * §5 les tirets : 16 × 2 px, 4 px d'écart, la page en cours en blanc,
 *    les autres atténuées, aucun rose, absents à une page ;
 * §6 à l'appui mobile : cercle gris ET icône ROSE, la valeur du survol
 *    web, état non persistant.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : le
 * titre y est mesuré PAR INJECTION des classes réelles (le même
 * composant que la recherche), la rangée et le bloc d'identité par
 * injection aussi ; les icônes VIVANTES sur une fiche. Dit NON JOUÉ.
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
const ROSE = "rgb(238, 61, 111)";
const GRIS_CERCLE = "rgb(44, 44, 49)";

/* ==================================================================
 * §1 — LE TITRE, RELEVÉ SUR LA RECHERCHE VIVANTE ET SUR L'INJECTION
 * ================================================================== */
const RELEVE_TITRE = `(bloc) => {
  if (!bloc) return null;
  const s = getComputedStyle(bloc);
  const h1 = bloc.querySelector("h1, h2");
  const sh = getComputedStyle(h1);
  const p = bloc.querySelector("p");
  const sp = p ? getComputedStyle(p) : null;
  return {
    dessus: s.paddingTop,
    dessous: s.paddingBottom,
    titreTaille: sh.fontSize,
    titreGraisse: sh.fontWeight,
    ecartLignes: sp ? sp.marginTop : "",
    sousTaille: sp ? sp.fontSize : "",
  };
}`;
titre("§1 — titre et sous-titre : recherche vivante contre « Ma sélection »");
{
  const favoris = lire("src/components/PageFavoris.tsx");
  verif(
    "le pt-6 en trop du <main> de « Ma sélection » est parti (la cause)",
    /px-4 sm:px-6 pb-16`\}/.test(favoris) && !/pt-6 pb-16/.test(favoris)
  );
  verif(
    "…et les deux pages consomment LE MÊME composant (LigneResultats)",
    /<LigneResultats/.test(favoris) &&
      /<LigneResultats/.test(lire("src/components/IndexTatoueurs.tsx"))
  );
}
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/?nature=flash");
  try {
    const recherche = await page.evaluate(
      `((lire) => lire(document.querySelector("[data-titre-mosaique]")))(${RELEVE_TITRE})`
    );
    //  « MA SÉLECTION », PAR INJECTION : le <main> réel (sans pt-6) et
    //  le composant réel — les classes lues à la source.
    const ligne = lire("src/components/LigneResultats.tsx");
    const classes = {
      bloc: nettoyer(ligne.match(/data-titre-mosaique="" className="([^"]+)"/)?.[1]),
      //  ⚠️ LE TITRE EST UNE BALISE DYNAMIQUE : `const Titre = balise`
      //  puis `<Titre …>` (la prop `balise` de la nº 249) — ancrer sur
      //  `<h1` ou sur le nom de la prop ne capture RIEN, c'est le nom
      //  de la VARIABLE qui balise.
      h1: nettoyer(ligne.match(/<Titre className="([^"]+)"/)?.[1]),
      p: nettoyer(ligne.match(/<p className="([^"]+)"/)?.[1]),
      main: nettoyer(
        lire("src/components/PageFavoris.tsx").match(
          /className=\{`flex-1 mx-auto w-full \$\{LARGEUR_SITE\} ([^`]+)`\}/
        )?.[1]
      ),
    };
    const selection = await page.evaluate(
      `((c, lire) => {
        const hote = document.createElement("main");
        hote.className = "flex-1 mx-auto w-full max-w-[1760px] " + c.main;
        hote.innerHTML = '<div data-t class="' + c.bloc + '">' +
          '<h1 class="' + c.h1 + '">Mes suivis</h1>' +
          '<p class="' + c.p + '">Toutes les réalisations</p></div>';
        document.body.appendChild(hote);
        const vu = lire(hote.querySelector("[data-t]"));
        hote.remove();
        return vu;
      })(${JSON.stringify(classes)}, ${RELEVE_TITRE})`
    );
    verif(
      `${largeur} px : les six valeurs identiques, valeur par valeur`,
      Boolean(recherche) &&
        JSON.stringify(recherche) === JSON.stringify(selection),
      `recherche ${JSON.stringify(recherche)} · sélection ${JSON.stringify(selection)}`
    );
  } catch (erreur) {
    nonJoue(`§1 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 + §3 — LE BLOC D'IDENTITÉ, MESURÉ PAR INJECTION
 * ================================================================== */
const sourceBloc = lire("src/components/BlocSuivis.tsx");
const classeCase = nettoyer(
  (sourceBloc.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
    .replace(/["+]/g, " ")
);
const classeRangee = nettoyer(
  sourceBloc.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1]
);
const classeLigne = nettoyer(
  lire("src/components/BlocLieux.tsx").match(
    /export const CLASSES_LIGNE_CLIQUABLE =\s*((?:"[^"]*"\s*\+?\s*)+);/
  )?.[1].replace(/["+]/g, " ")
);
titre("§2/§3 — les écarts et les tailles, aux deux largeurs");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: false });
  try {
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        const l = Math.min(document.documentElement.clientWidth, ${largeur}) - 32;
        hote.style.cssText = "position:fixed;top:0;left:0;width:" + l + "px;z-index:9999;";
        const bloc = (lignes) =>
          '<li><div class="flex flex-col">' +
          '<a class="' + c.ligne + ' lg:gap-5" data-identite>' +
          '<span data-rond class="flex h-13 w-13 lg:h-18 lg:w-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve"></span>' +
          '<span class="flex min-h-13 lg:min-h-18 min-w-0 flex-1 flex-col ' + (lignes > 1 ? "justify-start" : "justify-center") + '">' +
          '<span data-nom class="truncate text-[15px] lg:text-[18px] font-semibold text-sombre-texte">Lola</span>' +
          Array.from({ length: lignes })
            .map(() => '<span data-info class="truncate text-[14px] lg:text-[15px] leading-relaxed text-sombre-texte-doux">En salon · Lyon</span>')
            .join("") +
          '</span></a>' +
          '<div class="group relative mt-2 lg:mt-5" data-enveloppe>' +
          '<ul data-rangee class="' + c.rangee + '">' +
          Array.from({ length: 6 })
            .map(() => '<li class="' + c.case + '"><a class="block aspect-4/5 rounded-none bg-sombre-eleve"></a></li>')
            .join("") +
          '</ul></div></div></li>';
        hote.innerHTML = '<ul class="mt-5 grid gap-[34px] lg:gap-12 grid-cols-[minmax(0,1fr)]" data-grille>' +
          bloc(1) + bloc(3) + '</ul>';
        document.body.appendChild(hote);
        const identites = [...hote.querySelectorAll("[data-identite]")];
        const rangees = [...hote.querySelectorAll("[data-rangee]")];
        const ronds = [...hote.querySelectorAll("[data-rond]")];
        const nom = hote.querySelector("[data-nom]");
        const info = hote.querySelector("[data-info]");
        //  Les écarts VISUELS (le -m-2/p-2 de la ligne s'annule : ±8).
        const identiteVersBande =
          rangees[0].getBoundingClientRect().top -
          (identites[0].getBoundingClientRect().bottom - 8);
        const entreBlocs =
          identites[1].getBoundingClientRect().top + 8 -
          rangees[0].getBoundingClientRect().bottom;
        const b0 = ronds[0].getBoundingClientRect();
        const b1 = ronds[1].getBoundingClientRect();
        const cadre0 = identites[0].getBoundingClientRect();
        const cadre1 = identites[1].getBoundingClientRect();
        const ecartPastilleTexte =
          nom.getBoundingClientRect().left - b0.right;
        const mesure = {
          identiteVersBande: Math.round(identiteVersBande),
          entreBlocs: Math.round(entreBlocs),
          rond: Math.round(b0.width),
          nomTaille: getComputedStyle(nom).fontSize,
          nomGraisse: getComputedStyle(nom).fontWeight,
          infoTaille: getComputedStyle(info).fontSize,
          infoCouleur: getComputedStyle(info).color,
          ecartPastilleTexte: Math.round(ecartPastilleTexte),
          //  La pastille immobile : même distance au haut du bloc, à
          //  une ligne comme à trois.
          rondImmobile:
            Math.round(b0.top - cadre0.top) === Math.round(b1.top - cadre1.top),
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ ligne: classeLigne, rangee: classeRangee, case: classeCase })})`
    );
    if (largeur === 1440) {
      verif(
        "1440 px : 20 px identité → bande, 48 px entre deux artistes (20 < 48)",
        vu.identiteVersBande === 20 && vu.entreBlocs === 48,
        `${vu.identiteVersBande} px · ${vu.entreBlocs} px`
      );
      verif(
        "1440 px : pastille 72, nom 18 semi-gras, information 15 grise",
        vu.rond === 72 &&
          vu.nomTaille === "18px" &&
          vu.nomGraisse === "600" &&
          vu.infoTaille === "15px" &&
          vu.infoCouleur === "rgb(168, 168, 176)",
        `${vu.rond} px · nom ${vu.nomTaille}/${vu.nomGraisse} · info ${vu.infoTaille} ${vu.infoCouleur}`
      );
      verif(
        "1440 px : l'écart pastille-texte à l'échelle (20 px pour 72)",
        vu.ecartPastilleTexte === 20,
        `${vu.ecartPastilleTexte} px`
      );
    } else {
      verif(
        "390 px : 8 px identité → bande, 34 px entre blocs — inchangés",
        vu.identiteVersBande === 8 && vu.entreBlocs === 34,
        `${vu.identiteVersBande} px · ${vu.entreBlocs} px`
      );
      verif(
        "390 px : 52 / 15 / 14 et l'écart de 14 — le doigt ne change pas",
        vu.rond === 52 &&
          vu.nomTaille === "15px" &&
          vu.infoTaille === "14px" &&
          vu.ecartPastilleTexte === 14,
        `${vu.rond} px · ${vu.nomTaille} · ${vu.infoTaille} · écart ${vu.ecartPastilleTexte}`
      );
    }
    verif(
      `${largeur} px : la pastille est immobile quand le texte grandit (règle nº 241)`,
      vu.rondImmobile
    );
  } catch (erreur) {
    nonJoue(`§2/§3 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LE BOUTON ROND DE DÉFILEMENT
 * ================================================================== */
titre("§4 — à la source : le rond, le verre, aucune animation");
const classeBouton = nettoyer(
  sourceBloc.match(/className=\{`(hidden pointer-fine:flex[^`]*)`\}/)?.[1] ?? ""
).replace(/\$\{\s*sens === 1[^}]*\}/, "");
{
  verif(
    "un rond de 40 (h-10 w-10 rounded-full), monté/démonté sans transition",
    /h-10 w-10 rounded-full/.test(classeBouton) &&
      !/transition|duration|opacity-|translate|will-change/.test(classeBouton) &&
      /\{etat\.gauche && bandeau\(-1\)\}/.test(sourceBloc) &&
      /\{etat\.droite && bandeau\(1\)\}/.test(sourceBloc)
  );
  verif(
    "le verre des fenêtres (l'écriture existante), centré SANS transformation",
    /data-verre-fenetre=""/.test(sourceBloc) &&
      /inset-y-0 my-auto/.test(classeBouton) &&
      !/top-1\/2|-translate-y/.test(sourceBloc)
  );
  verif(
    "au survol de la rangée seulement, à cheval sur son bord, rien au doigt",
    /invisible group-hover:visible/.test(classeBouton) &&
      /-mr-5/.test(sourceBloc) &&
      /-ml-5/.test(sourceBloc) &&
      classeBouton.startsWith("hidden pointer-fine:flex")
  );
}
titre("§4 — le bouton, mesuré (1440 px) ; le doigt (390 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(
      `(async (classes) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:120px;left:120px;width:800px;z-index:9999";
        hote.innerHTML = '<div class="group relative" data-enveloppe style="height:160px">' +
          '<button data-b data-verre-fenetre="" class="' + classes + ' right-0 -mr-5"></button></div>';
        document.body.appendChild(hote);
        const bouton = hote.querySelector("[data-b]");
        const s = getComputedStyle(bouton);
        const enveloppe = hote.querySelector("[data-enveloppe]").getBoundingClientRect();
        const mesure = {
          auRepos: s.visibility,
          taille: Math.round(bouton.getBoundingClientRect().width),
          rayon: s.borderRadius,
          fond: s.backgroundColor,
          flou: s.backdropFilter || "",
          opacite: s.opacity,
          transformation: s.transform,
          transition: s.transitionDuration,
          volonte: s.willChange,
          centre: Math.abs(
            (bouton.getBoundingClientRect().top + bouton.getBoundingClientRect().bottom) / 2 -
            (enveloppe.top + enveloppe.bottom) / 2
          ),
          aCheval: Math.round(bouton.getBoundingClientRect().right - enveloppe.right),
          survol: { x: enveloppe.left + 60, y: enveloppe.top + 60 },
        };
        window.__b = { bouton, hote };
        return mesure;
      })(${JSON.stringify(classeBouton)})`
    );
    verif(
      "absent au repos ; 40 px, rond, centré en hauteur, à cheval sur le bord",
      vu.auRepos === "hidden" &&
        vu.taille === 40 &&
        parseFloat(vu.rayon) >= 20 &&
        vu.centre <= 1 &&
        vu.aCheval === 20,
      `visibility ${vu.auRepos} · ${vu.taille} px · centre ±${vu.centre.toFixed(1)} · dépasse ${vu.aCheval} px`
    );
    verif(
      "le verre des fenêtres, sans opacité partielle ni transformation ni transition",
      vu.fond === "rgba(26, 26, 29, 0.22)" &&
        /blur\(40px\)/.test(vu.flou) &&
        vu.opacite === "1" &&
        vu.transformation === "none" &&
        vu.transition === "0s" &&
        (vu.volonte === "auto" || vu.volonte === ""),
      `${vu.fond} · ${vu.flou} · opacité ${vu.opacite} · transform ${vu.transformation} · transition ${vu.transition}`
    );
    await page.mouse.move(vu.survol.x, vu.survol.y);
    await page.waitForTimeout(250);
    const auSurvol = await page.evaluate(
      () => getComputedStyle(window.__b.bouton).visibility
    );
    await page.evaluate(() => window.__b.hote.remove());
    verif(
      "présent au survol de la rangée (par la visibilité)",
      auSurvol === "visible",
      `visibility ${auSurvol}`
    );
  } catch (erreur) {
    nonJoue("§4 (1440)", String(erreur).slice(0, 70));
  }
  await contexte.close();
}
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const affichage = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.innerHTML = '<div class="group relative"><button data-b class="' + classes + ' right-0"></button></div>';
        document.body.appendChild(hote);
        const vu = getComputedStyle(hote.querySelector("[data-b]")).display;
        hote.remove();
        return vu;
      })(${JSON.stringify(classeBouton)})`
    );
    verif(
      "au doigt, il n'existe pas (display none)",
      affichage === "none",
      `display ${affichage}`
    );
  } catch (erreur) {
    nonJoue("§4 (390)", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §5 — LES TIRETS DE L'INDICATEUR
 * ================================================================== */
titre("§5 — les tirets, mesurés (injection des classes réelles)");
{
  verif(
    "à la source : dès deux pages seulement, aucun rose",
    /etat\.pages > 1 && \(/.test(sourceBloc) &&
      !/primaire/.test(
        sourceBloc.slice(
          sourceBloc.indexOf("data-indicateur-pages"),
          sourceBloc.indexOf("</div>", sourceBloc.indexOf("data-indicateur-pages"))
        )
      )
  );
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const classeTiret = nettoyer(
      sourceBloc.match(/className=\{`(h-0\.5 w-4 rounded-full[^`]*)`/)?.[1] ?? ""
    ).replace(/\$\{[^}]*\}/, "");
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:100px;left:100px;z-index:9999";
        hote.innerHTML = '<div class="pointer-events-none absolute top-3 right-3 z-[3] flex items-center gap-1" style="position:static">' +
          '<span data-t class="' + c + ' bg-white"></span>' +
          '<span data-t class="' + c + ' bg-white/30"></span></div>';
        document.body.appendChild(hote);
        const [actif, autre] = [...hote.querySelectorAll("[data-t]")];
        const ba = actif.getBoundingClientRect();
        const bb = autre.getBoundingClientRect();
        const mesure = {
          longueur: Math.round(ba.width),
          hauteur: Math.round(ba.height),
          ecart: Math.round(bb.left - ba.right),
          actif: getComputedStyle(actif).backgroundColor,
          autre: getComputedStyle(autre).backgroundColor,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify(classeTiret)})`
    );
    verif(
      "16 × 2 px, 4 px d'écart ; l'actif blanc plein, l'autre très atténué",
      vu.longueur === 16 &&
        vu.hauteur === 2 &&
        vu.ecart === 4 &&
        vu.actif === "rgb(255, 255, 255)" &&
        //  ⚠️ Tailwind v4 rend `bg-white/30` en oklab : on lit l'ALPHA,
        //  pas la forme (le piège oklab déjà payé).
        / 0\.3\)$/.test(vu.autre),
      `${vu.longueur}×${vu.hauteur} · écart ${vu.ecart} · ${vu.actif} / ${vu.autre}`
    );
  } catch (erreur) {
    nonJoue("§5", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §6 — L'ICÔNE ROSE À L'APPUI
 * ================================================================== */
titre("§6 — à la source : l'écriture unique porte les quatre états");
{
  const icones = lire("src/components/Icones.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  verif(
    "ETATS_ROND_BARRE : cercle ET rose, au survol comme à l'appui",
    /hover:bg-sombre-eleve active:bg-sombre-eleve/.test(icones) &&
      /hover:text-primaire active:text-primaire/.test(icones)
  );
  verif(
    "…consommé par les trois icônes, sans plus aucun doublon local",
    (barre.match(/\$\{ETATS_ROND_BARRE\}/g) ?? []).length === 3 &&
      !/hover:text-primaire/.test(barre.replace(/ETATS_ROND_BARRE/g, "")) &&
      (lire("src/components/MenuEspace.tsx").match(/\$\{ETATS_ROND_BARRE\}/g) ?? [])
        .length === 2
  );
}
titre("§6 — l'appui, VIVANT (390 px) : le cercle ET le rose, ensemble");
{
  const { contexte, page } = await ouvrirA(
    390,
    "/tatoueur/atelier-corvus-lyon-1er"
  );
  try {
    for (const [nom, selecteur] of [
      ["la loupe", 'button[aria-label="Rechercher"]'],
      ["l'icône du compte", 'a[href="/devenir-tatoueur"]:visible'],
    ]) {
      await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const cible = page.locator(selecteur).first();
      const boite = await cible.boundingBox();
      if (!boite) {
        nonJoue(`§6 · ${nom}`, "introuvable à 390 px");
        continue;
      }
      const lireEtat = () =>
        cible.evaluate((n) => {
          const s = getComputedStyle(n);
          return { fond: s.backgroundColor, couleur: s.color };
        });
      const repos = await lireEtat();
      await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(350);
      const enfonce = await lireEtat();
      await page.mouse.up();
      await page.mouse.move(5, 400);
      await page.waitForTimeout(350);
      const relache = await lireEtat();
      verif(
        `${nom} : cercle gris ET icône rose à l'appui, tout repart au relâchement`,
        enfonce.fond === GRIS_CERCLE &&
          enfonce.couleur === ROSE &&
          relache.fond !== GRIS_CERCLE &&
          relache.couleur === repos.couleur &&
          repos.couleur !== ROSE,
        `appui ${enfonce.fond} + ${enfonce.couleur} → relâché ${relache.couleur}`
      );
    }
  } catch (erreur) {
    nonJoue("§6 · vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante (et le fanion connecté)",
  "la page et le fanion exigent une session (base hors de portée) : le " +
    "titre, les écarts, le bloc d'identité, le bouton et les tirets sont " +
    "mesurés par injection des classes réelles contre la recherche " +
    "VIVANTE ; la loupe et le compte, vivants sur une fiche ; le fanion " +
    "porte la même écriture (ETATS_ROND_BARRE, vérifiée à la source)"
);

process.exit(bilan());
