/**
 * BANC DE LA PASSE Nº 259
 * ==================================================================
 * §1 la pilule glisse d'un trait, dans les deux sens : sa position ne
 *    se mesure plus, elle se CALCULE (une seule source, connue avant
 *    la peinture) — plus d'effet de disposition, plus d'observateur de
 *    taille, plus de second rendu ; la durée et la courbe de la nº 255
 *    ne bougent pas ;
 * §2 la barre rétractée de « Ma sélection » est celle du moteur, au
 *    pixel : la rangée LIBRE se replie par LA MÊME enveloppe (les 12 px
 *    de son air ne restaient que parce qu'elle ne se repliait pas) ;
 * §3 la feuille gèle le corps — l'écriture UNIQUE du site (celle de la
 *    fenêtre de fiche, nº 226-§5, extraite) : la page ne bouge pas, la
 *    liste défile, rien ne se propage, la position revient ;
 * §4 aucun débordement du document.
 *
 * ⚠️ LE BLOC DE « MA SÉLECTION » EXIGE UNE SESSION (base hors de
 * portée : la page s'ouvre mais SANS ses données, donc sans sa rangée).
 * Le §1 est éprouvé VIVANT sur le sélecteur d'une fiche (la même
 * écriture) et par la géométrie calculée, injectée ; le §2 par
 * injection des deux enveloppes réelles ; le §3 VIVANT sur la feuille
 * du champ des artisans — le MÊME MenuDeroulant, le même gel.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT, et le GEL DU DÉFILEMENT est
 * précisément un point où WebKit diffère : ce banc ne dit rien de
 * Safari ni d'iOS.
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

const capsule = lire("src/components/SelecteurCapsule.tsx");
const capsuleNue = sansNotes(capsule);
const barre = lire("src/components/EnTeteTatouage.tsx");
const menus = lire("src/components/MenusSelection.tsx");
const menuDeroulant = lire("src/components/MenuDeroulant.tsx");
const gel = lire("src/lib/gel-du-corps.ts");

/* ==================================================================
 * §1 — À LA SOURCE : PLUS AUCUNE MESURE EN PLEINE LARGEUR
 * ================================================================== */
titre("§1 — à la source : la position se calcule, elle ne se mesure plus");
{
  verif(
    "en pleine largeur, l'effet de disposition et l'observateur sont ÉCARTÉS",
    /useLayoutEffect\(\(\) => \{\s*if \(pleineLargeur\) return;/.test(capsuleNue) &&
      //  L'observateur ne vit plus que dans la branche mesurée.
      (capsuleNue.match(/new ResizeObserver/g) ?? []).length === 1
  );
  verif(
    "la position est une fonction PURE du rang, en calc() — une seule source",
    /const rang = Math\.max\(\s*0,\s*options\.findIndex\(\(option\) => option\.cle === valeur\)\s*\)/.test(
      capsuleNue
    ) &&
      /const largeurMot = `calc\(\(100% - \$\{options\.length - 1\} \* var\(--rw-ecart-mots\)\) \/ \$\{options\.length\}\)`/.test(
        capsuleNue
      ) &&
      /left: `calc\(\$\{rang\} \* \(\$\{largeurMot\} \+ var\(--rw-ecart-mots\)\)\)`/.test(
        capsuleNue
      )
  );
  verif(
    "l'écart des mots est écrit UNE fois : la classe le pose, le calcul le relit",
    //  ⚠️ DANS LA CLASSE : la variable voyage avec la chaîne, elle ne
    //  se perd pas quand on rejoue ces classes seules.
    /\[--rw-ecart-mots:0\.25rem\]/.test(capsuleNue) &&
      /gap-\[var\(--rw-ecart-mots\)\]/.test(capsuleNue) &&
      !/gap-1\b/.test(capsuleNue)
  );
  verif(
    "la glissade de la nº 255 ne change ni de durée ni de courbe",
    /transition-\[left,width\] duration-300 ease-out/.test(capsule)
  );
  verif(
    "la fiche, elle, garde SA mesure (ses deux mots n'ont pas la même largeur)",
    /setCapsule\(\{ left: actif\.offsetLeft, width: actif\.offsetWidth \}\)/.test(
      capsuleNue
    ) && !/pleineLargeur/.test(lire("src/components/PortfolioDeLAffiche.tsx"))
  );
}

/* ==================================================================
 * §1 — LA GÉOMÉTRIE CALCULÉE, MESURÉE (injection, deux largeurs)
 * ================================================================== */
const gabaritMot = capsule.match(/className=\{`(relative z-\[1\][^`]+)`\}/)?.[1];
const hauteurMot = menus.match(/hauteurMot="(min-h-\[\d+px\])"/)?.[1] ?? "";
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
const classeZone = nettoyer(
  capsule
    .match(/data-selecteur-capsule=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{[^}]*"w-full"[^}]*\}/, "w-full")
);
const classePilule = nettoyer(
  capsule
    .match(/data-capsule-glissante=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{robeCapsule\}/, "bg-sombre-haut")
);
/** LE CALCUL LIVRÉ, extrait du fichier : le banc rejoue CETTE
    expression-là, jamais une réécriture. */
const gabaritLargeur = capsule.match(/const largeurMot = `([^`]+)`/)?.[1] ?? "";
const gabaritGauche = capsule.match(/left: `([^`]+)`/)?.[1] ?? "";
const place = (rang, nombre) => ({
  width: gabaritLargeur
    .replace("${options.length - 1}", String(nombre - 1))
    .replace("${options.length}", String(nombre)),
  left: gabaritGauche
    .replace("${rang}", String(rang))
    .replace(
      "${largeurMot}",
      gabaritLargeur
        .replace("${options.length - 1}", String(nombre - 1))
        .replace("${options.length}", String(nombre))
    ),
});

for (const largeur of [390, 1440]) {
  titre(`§1 — la pilule calculée, mesurée (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:120px;left:16px;width:" + c.largeur + "px;z-index:9999";
        const mot = (actif, texte) =>
          '<button role="radio" aria-checked="' + (actif ? "true" : "false") +
          '" class="' + (actif ? c.motActif : c.motDormant) + '">' + texte + '</button>';
        //  LES DEUX ÉTATS, montés côte à côte : la pilule y est posée
        //  par le CALCUL LIVRÉ, sans une seule mesure.
        const zone = (rang, place) =>
          '<div data-zone="' + rang + '" class="' + c.zone + '">' +
          '<span data-pilule class="' + c.pilule + '" style="left:' + place.left + ';width:' + place.width + '"></span>' +
          mot(rang === 0, "Favoris") + mot(rang === 1, "Suivis") + '</div>';
        hote.innerHTML = zone(0, c.place0) + zone(1, c.place1);
        document.body.appendChild(hote);
        const lire = (rang) => {
          const z = hote.querySelector('[data-zone="' + rang + '"]');
          const p = z.querySelector("[data-pilule]");
          const actif = z.querySelector("button[aria-checked='true']");
          const bz = z.getBoundingClientRect();
          const bp = p.getBoundingClientRect();
          const ba = actif.getBoundingClientRect();
          return {
            zone: bz.width,
            pilule: { x: bp.left - bz.left, w: bp.width },
            //  LA VÉRITÉ : la boîte du mot actif, telle que la
            //  disposition la pose.
            mot: { x: ba.left - bz.left, w: ba.width },
          };
        };
        const mesure = { premier: lire(0), second: lire(1) };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        largeur: Math.min(largeur - 32, 720),
        zone: classeZone,
        pilule: classePilule,
        motActif: classeMot(true),
        motDormant: classeMot(false),
        place0: place(0, 2),
        place1: place(1, 2),
      })})`
    );
    for (const [nom, etat] of [
      ["Favoris", vu.premier],
      ["Suivis", vu.second],
    ]) {
      verif(
        `${largeur} px : sur « ${nom} », la pilule calculée tombe SUR le mot, au pixel`,
        Math.abs(etat.pilule.x - etat.mot.x) <= 0.5 &&
          Math.abs(etat.pilule.w - etat.mot.w) <= 0.5,
        `pilule ${etat.pilule.x.toFixed(1)} / ${etat.pilule.w.toFixed(
          1
        )} · mot ${etat.mot.x.toFixed(1)} / ${etat.mot.w.toFixed(1)}`
      );
    }
    verif(
      `${largeur} px : la glissade vaut une demi-largeur (le mot + l'écart)`,
      Math.abs(
        vu.second.pilule.x - vu.premier.pilule.x - (vu.premier.mot.w + 4)
      ) <= 0.5,
      `${(vu.second.pilule.x - vu.premier.pilule.x).toFixed(1)} px`
    );
  } catch (erreur) {
    nonJoue(`§1 · injection (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — LA GLISSADE VIVANTE, IMAGE PAR IMAGE (le sélecteur d'une fiche)
 * ================================================================== */
titre("§1 — VIVANT (1440 px) : la pilule filmée dans les deux sens");
{
  const { contexte, page } = await ouvrirA(
    1440,
    "/tatoueur/atelier-corvus-lyon-1er",
    { mobile: false }
  );
  try {
    const filmer = async (mot) => {
      const film = page.evaluate(
        () =>
          new Promise((fin) => {
            const zone = document.querySelector("[data-selecteur-capsule]");
            const pilule = zone.querySelector("[data-capsule-glissante]");
            const images = [];
            const debut = performance.now();
            const pas = () => {
              images.push(
                Math.round(pilule.getBoundingClientRect().left * 10) / 10
              );
              if (performance.now() - debut < 700) requestAnimationFrame(pas);
              else fin(images);
            };
            requestAnimationFrame(pas);
          })
      );
      await page
        .locator("[data-selecteur-capsule] button", { hasText: mot })
        .first()
        .click();
      return film;
    };
    const paliers = (images) => {
      //  UN PALIER : deux images consécutives à la même position, alors
      //  que le mouvement est commencé et pas terminé. C'est le
      //  « elle part, s'arrête, repart » du relevé.
      const arrivee = images[images.length - 1];
      let compte = 0;
      for (let rang = 1; rang < images.length; rang += 1) {
        const bouge = images[rang] !== images[rang - 1];
        const commence = images[rang] !== images[0];
        const fini = images[rang] === arrivee;
        if (!bouge && commence && !fini) compte += 1;
      }
      return compte;
    };
    const aller = await filmer("Portfolio");
    const retour = await filmer("Profil");
    verif(
      "aller : la pilule glisse d'un trait, sans arrêt intermédiaire",
      aller.length > 20 && paliers(aller) === 0 && aller[0] !== aller.at(-1),
      `${aller[0]} → ${aller.at(-1)} px · ${paliers(aller)} palier(s)`
    );
    verif(
      "retour : idem, dans l'autre sens",
      retour.length > 20 && paliers(retour) === 0 && retour[0] !== retour.at(-1),
      `${retour[0]} → ${retour.at(-1)} px · ${paliers(retour)} palier(s)`
    );
  } catch (erreur) {
    nonJoue("§1 · film", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LES DEUX BARRES RÉTRACTÉES
 * ================================================================== */
titre("§2 — à la source : une seule écriture du repli, pour les deux rangées");
{
  verif(
    "l'enveloppe se replie pour LES DEUX rangées (la condition de la réserve)",
    /\$\{\s*rangeePresente\s*\?\s*`max-lg:grid max-lg:grid-cols-\[minmax\(0,1fr\)\]/.test(
      barre
    ) && !/rangeeLibre\s*\n?\s*\? "flex"/.test(barre)
  );
  verif(
    "le bloc de « Ma sélection » n'écrit plus AUCUN repli",
    //  ⚠️ SUR LE SOURCE SANS SES NOTES : le commentaire de la nº 259
    //  RACONTE le pliage qu'il vient de retirer.
    !/grid-rows-\[0fr\]|pliage/.test(sansNotes(menus)) &&
      !/replie/.test(sansNotes(menus)) &&
      !/replie/.test(sansNotes(lire("src/components/BarreSelection.tsx")))
  );
  verif(
    "l'inertie suit la même condition que le repli",
    /const rangeeEscamotee = rangeePresente && moteurReplie && etroit;/.test(
      barre
    )
  );
}

titre("§2 — les deux barres rétractées, mesurées côte à côte (390 px)");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    //  LA BARRE DU MOTEUR, VIVANTE : on la replie par un vrai geste.
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);
    const moteur = await page.evaluate(() => {
      const cale = document.querySelector("[data-reserve-barre]");
      return {
        barre: Math.round(
          document.querySelector("[data-barre-fixe]").getBoundingClientRect()
            .height
        ),
        reserve: Number(cale.getAttribute("data-reserve-posee")),
        cale: Math.round(cale.getBoundingClientRect().height),
        premier: Math.round(
          document.querySelector("main")?.getBoundingClientRect().top ?? -1
        ),
      };
    });
    //  ET LA RANGÉE LIBRE, PAR INJECTION DE SES CLASSES RÉELLES : la
    //  même enveloppe, le même contenu replié — c'est le §2.
    const enveloppe = nettoyer(
      barre
        .match(/className=\{`(order-3 lg:order-2 basis-full[\s\S]*?)`\}/)?.[1]
        ?.replace(/\$\{\s*rangeePresente\s*\?\s*`([\s\S]*?)`\s*:\s*"[^"]*"\s*\}/, "$1")
        .replace(
          /\$\{\s*moteurReplie\s*\?\s*"([^"]*)"\s*:\s*"[^"]*"\s*\}/,
          "$1"
        )
    );
    const interieur = nettoyer(
      barre.match(/className="(max-lg:min-h-0 max-lg:overflow-hidden[^"]*)"/)?.[1]
    );
    const air = nettoyer(
      barre.match(/className=\{`(w-full max-w-\[720px\][^`]*)`\}/)?.[1]
        ?.replace(/\$\{\s*rangeePresente \? "([^"]*)" : ""\s*\}/, "$1")
    );
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:0;width:390px;z-index:9999";
        hote.innerHTML =
          '<div data-rangee class="' + c.enveloppe + '">' +
            '<div class="' + c.interieur + '">' +
              '<div class="' + c.air + '"><div style="height:46px"></div></div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(hote);
        const vu = Math.round(
          hote.querySelector("[data-rangee]").getBoundingClientRect().height * 10
        ) / 10;
        hote.remove();
        return vu;
      })(${JSON.stringify({ enveloppe, interieur, air })})`
    );
    verif(
      "la rangée LIBRE repliée ne mesure plus rien (0 px, comme celle du moteur)",
      vu === 0,
      `${vu} px (12 avant la nº 259 : l'air qui ne se repliait pas)`
    );
    verif(
      "les trois valeurs de la barre rétractée : 64 / 64 / 64",
      moteur.barre === 64 && moteur.reserve === 64 && moteur.cale === 64,
      `barre ${moteur.barre} · réserve ${moteur.reserve} · cale ${moteur.cale}`
    );
    verif(
      "« Ma sélection » retombe sur LA MÊME barre : 64 + 0 = 64",
      64 + vu === moteur.barre,
      `${64 + vu} px contre ${moteur.barre} px`
    );
  } catch (erreur) {
    nonJoue("§2 · barres", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LE GEL DU CORPS
 * ================================================================== */
titre("§3 — à la source : UNE seule écriture du gel dans tout le dépôt");
{
  verif(
    "le gel est extrait, compté, et rend la position retenue",
    /export function gelerLeCorps/.test(gel) &&
      /surfacesQuiGelent \+= 1;/.test(gel) &&
      /if \(surfacesQuiGelent > 0\) return;/.test(gel) &&
      /window\.scrollTo\(\{ top: positionRetenue, left: 0, behavior: "instant" \}\)/.test(
        gel
      )
  );
  verif(
    "la fenêtre de fiche et la feuille le CONSOMMENT, aucune n'en écrit un second",
    /gelerLeCorps\(positionGrille\)/.test(lire("src/components/FenetreFiche.tsx")) &&
      /return gelerLeCorps\(\);/.test(sansNotes(menuDeroulant)) &&
      //  Plus personne ne fige le corps à la main.
      !/position = "fixed"/.test(sansNotes(lire("src/components/FenetreFiche.tsx"))) &&
      !/position = "fixed"/.test(sansNotes(menuDeroulant))
  );
  verif(
    "la liste de la feuille confine son défilement (rien ne se propage)",
    /overflow-y-auto overscroll-contain px-2 pb-2/.test(menuDeroulant)
  );
  //  ⚠️ LE COMPTE EST LE MÊME POUR TOUT LE MONDE : un seul module le
  //  tient, et personne d'autre ne touche `document.body.style.position`.
  const ailleurs = [
    "src/components/PileFiches.tsx",
    "src/components/FenetreModale.tsx",
  ].filter((f) => /body\.style\.position/.test(lire(f)));
  verif(
    "aucun autre composant ne fige le corps par lui-même",
    ailleurs.length === 0,
    ailleurs.join(" · ") || "aucun"
  );
}

titre("§3 — VIVANT (390 px) : la feuille ouverte, la page immobile");
{
  //  Le champ « Métier » des artisans : LE MÊME MenuDeroulant, la même
  //  feuille, le même gel — la seule surface de ce genre ouvrable sans
  //  session.
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(400);
    const avant = await page.evaluate(() => Math.round(window.scrollY));
    await page.locator('button[aria-haspopup="listbox"]:visible').first().click();
    await page.waitForTimeout(700);
    const pendant = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      corps: getComputedStyle(document.body).position,
      haut: document.body.style.top,
    }));
    //  ON FAIT DÉFILER LA LISTE — et la page ne doit pas suivre.
    const liste = page.locator('[role="listbox"]:visible ul').first();
    const cadre = (await liste.count())
      ? liste
      : page.locator('[role="listbox"]:visible').first();
    //  ⚠️ LA LISTE DOIT DÉBORDER POUR DÉFILER : ce champ-ci n'a que
    //  neuf entrées (mesuré : scrollHeight = clientHeight). On l'allonge
    //  avec SES PROPRES lignes — même élément, mêmes styles, plus de
    //  contenu —, puis on la fait défiler.
    const defilement = await cadre.evaluate((n) => {
      const modele = n.querySelector("li");
      for (let rang = 0; rang < 30; rang += 1) {
        n.appendChild(modele.cloneNode(true));
      }
      n.scrollTop = 300;
      return {
        deborde: n.scrollHeight > n.clientHeight,
        defile: n.scrollTop > 0,
        confine: getComputedStyle(n).overscrollBehaviorY,
      };
    });
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    const apresGeste = await page.evaluate(() => Math.round(window.scrollY));
    verif(
      "feuille ouverte : le corps est figé, la page ne bouge pas d'un pixel",
      pendant.corps === "fixed" &&
        pendant.haut === "-300px" &&
        apresGeste === pendant.y,
      `corps ${pendant.corps} (top ${pendant.haut}) · scrollY ${pendant.y} → ${apresGeste}`
    );
    verif(
      "la liste, elle, défile — et son défilement ne se propage pas",
      defilement.deborde &&
        defilement.defile &&
        defilement.confine === "contain",
      `déborde ${defilement.deborde} · défile ${defilement.defile} · overscroll ${defilement.confine}`
    );
    //  FERMETURE par le voile, et la position revient.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const apres = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      corps: getComputedStyle(document.body).position,
    }));
    verif(
      "à la fermeture, la page retrouve EXACTEMENT sa position",
      apres.y === avant && apres.corps !== "fixed",
      `${avant} → ${apres.y} px · corps ${apres.corps}`
    );
  } catch (erreur) {
    nonJoue("§3 · feuille vivante", String(erreur).slice(0, 90));
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
    verif(
      `${largeur} px : scrollWidth = clientWidth`,
      deborde === 0,
      `écart ${deborde}`
    );
  } catch (erreur) {
    nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page s'ouvre mais SANS ses données (Supabase hors de portée) : sa " +
    "barre n'a donc pas de rangée à porter. Le §1 est mesuré par la " +
    "géométrie calculée injectée et filmé vivant sur le sélecteur d'une " +
    "fiche (la même écriture), le §2 par injection des deux enveloppes " +
    "réelles contre la barre du moteur VIVANTE, le §3 vivant sur la " +
    "feuille du champ des artisans (le même MenuDeroulant, le même gel) " +
    "— seul le montage React de la page n'est pas éprouvé"
);

process.exit(bilan());
