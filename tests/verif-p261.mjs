/**
 * BANC DE LA PASSE Nº 261
 * ==================================================================
 * §1 la pilule se déplace par une TRANSFORMATION (le compositeur), plus
 *    jamais par sa position : propriété animée relevée, left constant,
 *    aucun filtre d'arrière-plan, nœud réutilisé entre les états ; la
 *    glissade filmée image par image dans les deux sens SOUS UN RENDU
 *    LOURD — l'ancienne écriture (left) rejouée d'abord, pour donner
 *    l'avant et l'après ;
 * §2 la feuille : bande préhensible ≥ 44 px ; liste en haut, un
 *    glissement vers le bas la referme depuis n'importe où ; liste
 *    défilée, le geste ne referme rien ; le gel de la nº 259 intact
 *    (scrollY rendu au pixel).
 *
 * ⚠️ « MA SÉLECTION » N'A PAS SES DONNÉES ICI (Supabase hors de
 * portée) : sa barre n'a pas de rangée. Le rendu LOURD de la bascule
 * est donc REPRODUIT — le badge réel (classes et styles résolus de la
 * source) bascule pendant qu'un DOM massif est reconstruit en tranches
 * synchrones qui occupent le fil principal, comme la page le fait avec
 * ses cartes et ses carrousels. Dit NON JOUÉ pour le montage React.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : le compositeur headless ne se
 * photographie pas, et le GLISSEMENT AU DOIGT est un point où WebKit
 * diffère — ce banc ne dit rien de Safari ni d'iOS.
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
const menus = lire("src/components/MenusSelection.tsx");
const menuDeroulant = lire("src/components/MenuDeroulant.tsx");
const menuNu = sansNotes(menuDeroulant);

/* ==================================================================
 * §1 — À LA SOURCE : LA TRANSFORMATION, ET RIEN D'AUTRE
 * ================================================================== */
titre("§1 — à la source : transform anime, left et width ne bougent plus");
{
  verif(
    "en pleine largeur : left à 0 pour toujours, la largeur constante, transform seul",
    /left: 0,\s*width: largeurMot,\s*transform: `translateX\(calc\(\$\{rang\} \* \(100% \+ var\(--rw-ecart-mots\)\)\)\)`/.test(
      capsuleNue
    )
  );
  verif(
    "la transition ne porte QUE transform en pleine largeur (durée et courbe intactes)",
    /pleineLargeur \? "transition-transform" : "transition-\[left,width\]"/.test(
      capsuleNue
    ) && /duration-300 ease-out/.test(capsule)
  );
  verif(
    "le 100 % du translateX se lit sur la pilule — une largeur de mot exactement",
    /width: largeurMot/.test(capsuleNue) &&
      /translateX\(calc\(\$\{rang\} \* \(100% \+/.test(capsuleNue)
  );
  verif(
    "aucune clé sur la pilule, aucun filtre d'arrière-plan dans son écriture",
    !/data-capsule-glissante=""\s*key=/.test(capsule) &&
      !/backdrop/.test(
        capsule.slice(
          capsule.indexOf("data-capsule-glissante"),
          capsule.indexOf("/>", capsule.indexOf("data-capsule-glissante"))
        )
      )
  );
  verif(
    "la fiche garde ses transitions de position (ses mots sont inégaux)",
    /transition-\[left,width\]/.test(capsuleNue) &&
      /setCapsule\(\{ left: actif\.offsetLeft, width: actif\.offsetWidth \}\)/.test(
        capsuleNue
      )
  );
}

/* ------------------------------------------------------------------
 * LES CLASSES ET LE CALCUL RÉELS, lus à la source.
 * ---------------------------------------------------------------- */
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
    .replace(
      /\$\{\s*pleineLargeur \? "([^"]+)" : "[^"]+"\s*\}/,
      "$1"
    )
);
const gabaritLargeur = capsule.match(/const largeurMot = `([^`]+)`/)?.[1] ?? "";
const gabaritTransform =
  capsule.match(/transform: `([^`]+)`/)?.[1] ?? "";
const largeurDeux = gabaritLargeur
  .replace("${options.length - 1}", "1")
  .replace("${options.length}", "2");
const transformDuRang = (rang) =>
  gabaritTransform.replace("${rang}", String(rang));

/* ==================================================================
 * §1 — LE FILM SOUS RENDU LOURD, DANS LES DEUX SENS (avant / après)
 * ==================================================================
 * Le harnais reproduit ce que « Ma sélection » fait à la bascule : le
 * badge change d'état PENDANT qu'un DOM massif est reconstruit en
 * tranches synchrones (~50 ms chacune) qui occupent le fil principal.
 * L'AVANT rejoue l'ancienne écriture (left animé) ; l'APRÈS joue celle
 * du fichier livré (transform). On compte les PALIERS (deux images
 * consécutives immobiles en plein mouvement) et les SAUTS (le plus
 * grand bond entre deux images).
 */
titre("§1 — filmée sous rendu lourd (390 px) : l'avant (left) et l'après (transform)");
let bilanFilm = null;
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    bilanFilm = await page.evaluate(
      `(async (c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:80px;left:16px;width:358px;z-index:9999";
        const lourd = document.createElement("div");
        lourd.style.cssText = "position:fixed;top:220px;left:16px;width:358px;height:400px;overflow:hidden;z-index:9998";
        document.body.appendChild(hote);
        document.body.appendChild(lourd);
        const mot = (actif, texte) =>
          '<button role="radio" aria-checked="' + (actif ? "true" : "false") +
          '" class="' + (actif ? c.motActif : c.motDormant) + '">' + texte + '</button>';
        //  LE TRAVAIL LOURD : trois tranches synchrones de ~50 ms,
        //  espacées d'un tour de boucle — le profil d'un rendu React
        //  qui monte des rangées de carrousels.
        const occuperLeFil = () => {
          let restantes = 3;
          const tranche = () => {
            const debut = performance.now();
            lourd.innerHTML = Array.from({ length: 400 })
              .map((_, i) => '<div style="padding:2px;border-radius:8px">' +
                '<span style="display:inline-block;width:60px;height:40px;background:#2C2C31;border-radius:6px"></span>' +
                '<span>carte ' + i + '</span></div>')
              .join("");
            void lourd.offsetHeight;
            while (performance.now() - debut < 50) { /* le fil est pris */ }
            restantes -= 1;
            if (restantes > 0) setTimeout(tranche, 0);
          };
          setTimeout(tranche, 30);
        };
        const filmer = (pilule, versLeRang) =>
          new Promise((fin) => {
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
          });
        const paliers = (images) => {
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
        const saut = (images) => {
          let plusGrand = 0;
          for (let rang = 1; rang < images.length; rang += 1) {
            plusGrand = Math.max(plusGrand, Math.abs(images[rang] - images[rang - 1]));
          }
          return Math.round(plusGrand * 10) / 10;
        };
        const jouer = async (mode) => {
          hote.innerHTML =
            '<div data-zone class="' + c.zone + '">' +
            '<span data-pilule class="' + c.pilule + '"></span>' +
            mot(true, "Favoris") + mot(false, "Suivis") + '</div>';
          const pilule = hote.querySelector("[data-pilule]");
          if (mode === "left") {
            //  L'ANCIENNE ÉCRITURE (nº 259) : la position animée.
            pilule.style.cssText = "left:" + c.gaucheDe0 + ";width:" + c.largeur +
              ";transition:left .3s cubic-bezier(0,0,0.2,1),width .3s cubic-bezier(0,0,0.2,1)";
          } else {
            //  L'ÉCRITURE LIVRÉE : left figé, transform seul.
            pilule.style.cssText = "left:0;width:" + c.largeur +
              ";transform:" + c.transform0;
          }
          void pilule.offsetWidth;
          const resultats = {};
          for (const [sens, rang] of [["aller", 1], ["retour", 0]]) {
            occuperLeFil();
            if (mode === "left") {
              pilule.style.left = rang === 0 ? c.gaucheDe0 : c.gaucheDe1;
            } else {
              pilule.style.transform = rang === 0 ? c.transform0 : c.transform1;
            }
            const images = await filmer(pilule, rang);
            resultats[sens] = {
              images: images.length,
              paliers: paliers(images),
              saut: saut(images),
              debut: images[0],
              fin: images[images.length - 1],
            };
          }
          return resultats;
        };
        const avant = await jouer("left");
        const apres = await jouer("transform");
        hote.remove();
        lourd.remove();
        return { avant, apres };
      })(${JSON.stringify({
        zone: classeZone,
        pilule: classePilule,
        motActif: classeMot(true),
        motDormant: classeMot(false),
        largeur: largeurDeux,
        gaucheDe0: "0px",
        gaucheDe1: `calc(${largeurDeux} + 0.25rem)`,
        transform0: transformDuRang(0),
        transform1: transformDuRang(1),
      })})`
    );
    const { avant, apres } = bilanFilm;
    verif(
      "APRÈS (transform) : zéro palier dans les deux sens, sous le même rendu lourd",
      apres.aller.paliers === 0 &&
        apres.retour.paliers === 0 &&
        apres.aller.fin !== apres.aller.debut,
      `aller ${apres.aller.debut} → ${apres.aller.fin} (${apres.aller.paliers} palier) · retour ${apres.retour.debut} → ${apres.retour.fin} (${apres.retour.paliers} palier)`
    );
    verif(
      "le rendu lourd a bien pesé sur les deux films (des images ont été perdues)",
      avant.aller.images < 40 && apres.aller.images < 40,
      `avant ${avant.aller.images} images · après ${apres.aller.images} images (700 ms ≈ 42 pleines)`
    );
    //  LE CONSTAT AVANT/APRÈS — les chiffres demandés, et une LIMITE
    //  dite en face : le rAF n'échantillonne que quand le fil est
    //  libre. Pendant le blocage, l'ANCIENNE écriture (left) gèle
    //  l'écran — c'est le « s'arrête, repart » du relevé — mais la
    //  pendule des DEUX timelines file pareil : au réveil, les deux
    //  films montrent le même bond. La différence est VISUELLE (le
    //  compositeur continue de peindre le transform pendant que le fil
    //  est pris), et le headless ne la photographie pas. Ce qui se
    //  mesure : les deux films ont perdu les mêmes images (le fil était
    //  bien bloqué), et l'après anime une propriété que ce blocage ne
    //  peut plus arrêter — c'est l'assertion de propriété ci-dessous.
    verif(
      "l'avant et l'après ont subi LE MÊME fil bloqué (mêmes images perdues, même bond)",
      Math.abs(avant.aller.images - apres.aller.images) <= 3 &&
        avant.aller.saut > 20 &&
        apres.aller.saut > 20,
      `avant ${avant.aller.paliers} palier / saut ${avant.aller.saut} px · après ${apres.aller.paliers} palier / saut ${apres.aller.saut} px (le bond rAF, pas l'écran)`
    );
  } catch (erreur) {
    nonJoue("§1 · film", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — LA PROPRIÉTÉ ANIMÉE ET LE NŒUD, VIVANTS (la fiche, 1440 px)
 * ================================================================== */
titre("§1 — le nœud réutilisé et la propriété animée (injection, 1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:120px;left:16px;width:720px;z-index:9999";
        hote.innerHTML =
          '<div data-zone class="' + c.zone + '">' +
          '<span data-pilule class="' + c.pilule + '" style="left:0;width:' + c.largeur + ';transform:' + c.transform0 + '"></span>' +
          '<button role="radio" aria-checked="true" class="' + c.motActif + '">Favoris</button>' +
          '<button role="radio" aria-checked="false" class="' + c.motDormant + '">Suivis</button></div>';
        document.body.appendChild(hote);
        const pilule = hote.querySelector("[data-pilule]");
        //  LE MARQUEUR D'IDENTITÉ : si la bascule remontait le nœud,
        //  la propriété disparaîtrait avec lui.
        pilule.__temoin = "p261";
        const s = getComputedStyle(pilule);
        const avant = {
          transition: s.transitionProperty,
          filtre: s.backdropFilter || "none",
          left: s.left,
        };
        //  LA BASCULE (l'écriture livrée : seul transform change).
        pilule.style.transform = c.transform1;
        const apresBascule = getComputedStyle(pilule);
        const mesure = {
          avant,
          apres: { left: apresBascule.left },
          memeNoeud: hote.querySelector("[data-pilule]").__temoin === "p261",
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        zone: classeZone,
        pilule: classePilule,
        motActif: classeMot(true),
        motDormant: classeMot(false),
        largeur: largeurDeux,
        transform0: transformDuRang(0),
        transform1: transformDuRang(1),
      })})`
    );
    verif(
      //  (Tailwind v4 : `transition-transform` couvre transform,
      //  translate, scale, rotate — aucune POSITION dans la liste.)
      "la propriété en transition est la TRANSFORMATION — ni left, ni width",
      /transform/.test(vu.avant.transition) &&
        !/left|width/.test(vu.avant.transition),
      `transition-property : ${vu.avant.transition}`
    );
    verif(
      "aucun filtre d'arrière-plan sur la pilule (le piège de la nº 234)",
      vu.avant.filtre === "none",
      `backdrop-filter : ${vu.avant.filtre}`
    );
    verif(
      "left ne bouge pas d'un pixel à la bascule, et le nœud est LE MÊME",
      vu.avant.left === "0px" && vu.apres.left === "0px" && vu.memeNoeud,
      `left ${vu.avant.left} → ${vu.apres.left} · même nœud ${vu.memeNoeud}`
    );
  } catch (erreur) {
    nonJoue("§1 · propriété", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA FEUILLE PRÉHENSIBLE
 * ================================================================== */
titre("§2 — à la source : la bande, la feuille qui écoute, la liste qui arbitre");
{
  verif(
    "la bande haute (barre + titre) est UN SEUL bloc préhensible",
    /data-bande-feuille=""/.test(menuDeroulant) &&
      /className="cursor-grab touch-none"/.test(menuDeroulant) &&
      /glissementDebut\(e, true\)/.test(menuNu)
  );
  verif(
    "la feuille entière écoute, et la liste n'arme le geste QUE si elle est en haut",
    //  L'armement re-vérifie « en haut » pour un geste parti de la
    //  LISTE seulement : parti de la bande, il s'arme toujours (le
    //  premier banc l'exigeait pour TOUT geste — la bande ne refermait
    //  plus dès que la liste avait défilé, le vivant l'a montré).
    /onPointerDown=\{\(e\) => glissementDebut\(e, false\)\}/.test(menuNu) &&
      /if \(!bande && !listeEnHaut\(\)\) return;/.test(menuNu) &&
      /departSurLaBande\.current = bande;/.test(menuNu) &&
      /if \(delta < 6\) return;/.test(menuNu) &&
      /if \(!departSurLaBande\.current && !listeEnHaut\(\)\) \{/.test(menuNu)
  );
  verif(
    "le seuil de fermeture et le gel de la nº 259 ne bougent pas",
    /if \(dragY > 70\) fermer\(\);/.test(menuNu) &&
      /return gelerLeCorps\(\);/.test(menuNu) &&
      /overscroll-contain/.test(menuDeroulant)
  );
  verif(
    "la capture n'est prise qu'à l'ARMEMENT — un tap reste un tap",
    /setEnGlissement\(true\);\s*try \{\s*e\.currentTarget\.setPointerCapture/.test(
      menuNu
    ) &&
      !/function glissementDebut[\s\S]{0,300}setPointerCapture/.test(menuNu)
  );
}

titre("§2 — VIVANTE (390 px) : la bande, la fermeture au glissement, la position");
{
  //  ⚠️ LES GESTES SONT DE VRAIS TOUCHERS (CDP Input.dispatchTouchEvent) :
  //  à la souris, les options du menu choisissent AU POINTERDOWN (leur
  //  écriture) — un drag souris testerait le choix, pas le glissement.
  const { contexte, page } = await ouvrirA(390, "/artisans");
  const cdp = await contexte.newCDPSession(page);
  const glisserAuDoigt = async (x, y, distance, pas = 8) => {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let rang = 1; rang <= pas; rang += 1) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + (distance * rang) / pas }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  try {
    await page.evaluate(() => window.scrollTo(0, 260));
    await page.waitForTimeout(400);
    const avantOuverture = await page.evaluate(() => Math.round(window.scrollY));
    const ouvrirFeuille = async () => {
      await page.locator('button[aria-haspopup="listbox"]:visible').first().click();
      await page.waitForTimeout(650);
    };
    const allongerEtDefiler = (enHaut) =>
      page.evaluate((haut) => {
        const feuilleOuverte = [...document.querySelectorAll('[role="listbox"]')].find(
          (n) => n.getBoundingClientRect().height > 0
        );
        const liste = feuilleOuverte.querySelector("ul");
        const modele = liste.querySelector("li");
        for (let rang = 0; rang < 30; rang += 1) {
          liste.appendChild(modele.cloneNode(true));
        }
        liste.scrollTop = haut ? 0 : 180;
      }, enHaut);
    await ouvrirFeuille();
    const bande = await page.evaluate(() => {
      const zone = document.querySelector("[data-bande-feuille]");
      return zone ? Math.round(zone.getBoundingClientRect().height) : 0;
    });
    verif("la bande préhensible mesure au moins 44 px", bande >= 44, `${bande} px`);
    /*  ⚠️ LE GLISSEMENT DEPUIS LA LISTE EST NON JOUÉ, ET VOICI LA
        SONDE QUI L'A TRANCHÉ : pendant un pan tactile synthétique sur
        la liste, les gestionnaires reçoivent UN SEUL pointermove puis
        un POINTERCANCEL immédiat — le pilote confisque le geste au
        profit du défilement natif (séquence relevée : pointerdown,
        pointermove, pointercancel, puis plus que des touchmove). La
        séquence étant tronquée par le pilote, le verdict revient à
        l'appareil réel. */
    nonJoue(
      "liste en haut : le glissement au MILIEU referme",
      "le pilote headless annule le pan (pointercancel après le premier " +
        "pointermove) et confisque le geste — séquence tronquée, à " +
        "vérifier sur l'appareil"
    );
    //  2. LISTE DÉFILÉE : le même geste ne referme RIEN — jouable, le
    //  cancel n'arme rien et la feuille doit rester en place.
    await allongerEtDefiler(false);
    const boite2 = await page
      .locator('[role="listbox"]:visible')
      .first()
      .boundingBox();
    await glisserAuDoigt(boite2.x + boite2.width / 2, boite2.y + boite2.height / 2, 130);
    await page.waitForTimeout(500);
    const apresGeste = await page.evaluate(() => {
      const feuilleOuverte = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      return {
        ouverte: Boolean(feuilleOuverte),
        transform: feuilleOuverte
          ? getComputedStyle(feuilleOuverte).transform
          : "(absente)",
      };
    });
    verif(
      "liste DÉFILÉE : le glissement ne referme rien — la feuille reste en place",
      apresGeste.ouverte &&
        (apresGeste.transform === "none" ||
          /matrix\(1, 0, 0, 1, 0, 0\)/.test(apresGeste.transform)),
      `ouverte ${apresGeste.ouverte} · transform ${apresGeste.transform}`
    );
    //  3. LA BANDE ferme toujours — elle est `touch-none` : le
    //  navigateur n'a rien à y défiler, le geste nous revient entier.
    const bandeBoite = await page
      .locator("[data-bande-feuille]")
      .first()
      .boundingBox();
    await glisserAuDoigt(bandeBoite.x + bandeBoite.width / 2, bandeBoite.y + 20, 130);
    await page.waitForTimeout(600);
    const fermeeParLaBande =
      (await page.locator('[role="listbox"]:visible').count()) === 0;
    verif(
      "la bande haute referme — même liste défilée",
      fermeeParLaBande,
      fermeeParLaBande ? "refermée" : "toujours ouverte"
    );
    //  4. ET LA POSITION EST RENDUE au pixel après CETTE fermeture-là.
    const apresFermeture = await page.evaluate(() => Math.round(window.scrollY));
    verif(
      "la page retrouve EXACTEMENT sa position",
      apresFermeture === avantOuverture,
      `${avantOuverture} → ${apresFermeture} px`
    );
  } catch (erreur) {
    nonJoue("§2 · feuille vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * LE DÉBORDEMENT, AUX DEUX LARGEURS
 * ================================================================== */
titre("§3 — aucun débordement du document");
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
    nonJoue(`§3 (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page s'ouvre mais SANS ses données (Supabase hors de portée) : sa " +
    "barre n'a pas de rangée. Le rendu LOURD de sa bascule est REPRODUIT " +
    "dans le harnais du §1 (tranches synchrones de 50 ms qui occupent le " +
    "fil principal pendant la glissade) sur le badge réel — classes, " +
    "calcul et transitions du fichier livré — et la feuille est éprouvée " +
    "vivante sur le champ des artisans (le même MenuDeroulant). Seul le " +
    "montage React de la page n'est pas éprouvé. ⚠️ En headless, le gel " +
    "VISUEL du compositeur ne se photographie pas : la preuve mesurable " +
    "est la propriété animée (transform) et le contraste avant/après du " +
    "harnais — le lisse final se vérifie sur l'appareil"
);

process.exit(bilan());
