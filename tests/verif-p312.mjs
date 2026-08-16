/**
 * BANC DE LA PASSE Nº 312 — LIVRAISON RAPIDE
 * ==================================================================
 * TROIS ANNULATIONS ET UNE OUVERTURE.
 *
 * §1 — LA GALERIE NE DÉBORDE PLUS, ET LA BANDE D'EFFACEMENT DISPARAÎT.
 *      Le bord gauche de la galerie et l'alignement des titres doivent
 *      COÏNCIDER, et il ne doit rester AUCUNE transparence progressive :
 *      le banc décode la bande de pixels autour de cette ligne, galerie
 *      décalée, et exige une coupure NETTE — du fond de page d'un côté,
 *      la couleur pleine de l'autre, sans une seule valeur entre les
 *      deux.
 * §2 — « MA SÉLECTION » OUVRE UNE FICHE EN FENÊTRE SUPERPOSÉE (web).
 *      La page exige une session que ce conteneur ne peut pas signer :
 *      le chaînage est donc vérifié à la source, au caractère près — et
 *      surtout, LE BANC PROUVE QUE LA FENÊTRE N'A PAS ÉTÉ TOUCHÉE.
 * §3 — LES LANGUES INDISPONIBLES REDEVIENNENT LISIBLES : décodées au
 *      pixel, contre les deux valeurs précédentes, sur le même fond.
 * §4 — LE TRAIT ROSE DU SÉLECTEUR REVIENT EN BAS.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2 — celle du propriétaire.
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
import { lirePixels } from "./_pixels.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const affiche = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const favoris = sansNotes(lire("src/components/PageFavoris.tsx"));
const portfolio = sansNotes(lire("src/components/BlocPortfolio.tsx"));
const langue = sansNotes(lire("src/components/SelecteurLangue.tsx"));
//  ⚠️ CELUI-CI SE LIT AVEC SES NOTES : c'est justement l'ABSENCE de
//  toute marque de cette passe qu'on y cherche.
const fenetre = lire("src/components/FenetreFiche.tsx");

const FICHE = "/tatoueur/ligne-claire-studio-nantes";
const SERIE = "cyberpunk·color";
/*  ⚠️ AMENDÉ À LA nº 314. Le sélecteur était nu, et il désignait UNE
    galerie tant que le doigt montrait une grille de vignettes. Depuis
    la nº 314-§3, le doigt a lui aussi ses galeries : la même écriture
    en trouve DEUX, et la première (celle du doigt) est masquée en web
    — le banc attendait donc indéfiniment un élément invisible.
    ⚠️ CE QUE MESURE CE BANC N'A PAS CHANGÉ D'UN POUCE : il éprouve LE
    WEB (fenêtre 1440 × 823), et c'est le bloc du web qu'on nomme
    désormais. La mesure est rendue, pas retirée. */
const sel = `[data-galeries="web"] [data-galerie-serie="${SERIE}"]`;
const FOND = [26, 26, 29]; //  #1A1A1D
const ROSE = "rgb(238, 61, 111)";

/* ==================================================================
 * À LA SOURCE
 * ================================================================== */
titre("§1 · §4 à la source — les annulations");
{
  /*  ⚠️ AMENDÉ À LA nº 314. La question posée était : « la galerie DU
      WEB n'a plus de débord » — et le fichier ne contenait alors qu'une
      seule galerie, celle du web. Depuis la nº 314-§3, le DOIGT a la
      sienne, et elle DOIT avoir un débord : c'est la consigne du
      propriétaire (bord à bord de l'écran, comme « Ma sélection »).
      Lue sur tout le fichier, la mesure d'origine confondait les deux
      et déclarait un défaut là où il n'y en a pas.
      LA MESURE EST RENDUE, PAS RETIRÉE : on la pose sur le bloc du
      web, qui est son sujet depuis le premier jour. */
  const blocWeb = affiche.slice(affiche.indexOf('data-galeries="web"'));
  verif(
    "§1-a — la rangée DU WEB n'a ni débord, ni rembourrage, ni rembourrage " +
      "de défilement",
    !/classeRangee=/.test(blocWeb) &&
      !/scroll-pl/.test(blocWeb) &&
      !/-ml-10/.test(blocWeb)
  );
  verif(
    "§1-b — le masque a disparu, code compris",
    !/maskImage/.test(affiche) &&
      !/WebkitMaskImage/.test(affiche) &&
      !/styleRangee=/.test(affiche)
  );
  verif(
    "§1-c — le rognage de la colonne est revenu à 12 px, symétrique",
    /lg:overflow-y-auto lg:px-3 lg:-mx-3 /.test(fiche) &&
      !/lg:pl-10 lg:-ml-10/.test(fiche)
  );
  verif(
    "…et la largeur d'une case n'a pas changé de règle",
    /basis-\[calc\(\(100%_-_6px\)\/2\.1\)\]/.test(affiche) &&
      /className="grow shrink-0 snap-start/.test(affiche)
  );
  verif(
    "…l'écart de 3 px et le petit chevron restent demandés",
    /ecart="gap-\[3px\]"/.test(affiche) &&
      /chevron=\{CHEVRON_GALERIE_PETIT\}/.test(affiche)
  );
  verif(
    "§4 — le trait rose est revenu en BAS, horizontal",
    /absolute inset-x-0 bottom-0 h-\[2px\] bg-primaire/.test(portfolio) &&
      !/absolute inset-y-0 left-0 w-\[2px\] bg-primaire/.test(portfolio)
  );
  verif(
    "§4 — …et les quatre états de la nº 311 sont conservés",
    /block text-\[14px\] font-semibold text-white/.test(portfolio) &&
      /actif \? "text-white" : "text-sombre-texte-doux"/.test(portfolio)
  );
  verif(
    "§3 — les langues indisponibles remontent au-dessus du /50 de départ",
    /text-sombre-texte-doux\/85 cursor-not-allowed/.test(langue) &&
      !/text-sombre-texte-doux\/20/.test(langue)
  );
  verif(
    "§3-b — le point rond est revenu à /40",
    /langue\.actif \? "bg-white" : "bg-white\/40"/.test(langue)
  );
}

titre("§2 à la source — l'ouverture en fenêtre, et la fenêtre INTACTE");
{
  verif(
    "LA FENÊTRE SUPERPOSÉE N'EST PAS TOUCHÉE PAR CETTE PASSE",
    !/nº 312/.test(fenetre) && !/312/.test(fenetre),
    "FenetreFiche.tsx ne porte aucune marque de la nº 312"
  );
  verif(
    "…et elle garde ce que la nº 310 y avait posé",
    /setIndice\(serie\.indice \?\? 0\);/.test(fenetre)
  );
  verif(
    "« Ma sélection » passe la main à SA fenêtre, celle des favoris",
    /<BlocSuivis\s*\n\s*suivis=\{suivisVisibles\}\s*\n\s*surOuverture=\{\(slug, serie, adresse\) =>\s*\n\s*void ouvrirLaFiche\(slug, serie, adresse\)/.test(
      favoris
    )
  );
  verif(
    "…et rien n'est réécrit : c'est `ouvrirLaFiche`, celle des cartes",
    (favoris.match(/const ouvrirLaFiche = useCallback\(/g) ?? []).length === 1 &&
      (favoris.match(/<FenetreFiche/g) ?? []).length === 1
  );
  verif(
    "LES DEUX LIENS DU BLOC L'APPELLENT — la ligne d'identité et chaque vignette",
    (suivis.match(/ouvrirEnFenetre\(/g) ?? []).length === 3,
    `${(suivis.match(/ouvrirEnFenetre\(/g) ?? []).length - 1} appel(s) + sa définition`
  );
  verif(
    "AU DOIGT, RIEN NE CHANGE : le rappel s'arrête sur un vrai téléphone",
    /if \(document\.documentElement\.dataset\.appareil === "mobile"\) return;/.test(
      suivis
    )
  );
  verif(
    "…et un clic modifié laisse le lien faire son travail",
    /evenement\.metaKey \|\|\s*\n\s*evenement\.ctrlKey \|\|\s*\n\s*evenement\.shiftKey \|\|\s*\n\s*evenement\.altKey/.test(
      suivis
    )
  );
  verif(
    "les liens RESTENT de vrais liens (aucun <button> n'a pris leur place)",
    (suivis.match(/<Link/g) ?? []).length === 2
  );
}

/* ==================================================================
 * EN VIVANT — 1440 × 823, densité 2
 * ================================================================== */
const nav = await chromium.launch({
  executablePath: process.env.CHEMIN_CHROMIUM,
  args: ["--no-proxy-server"],
});
const ctx = await nav.newContext({
  viewport: { width: 1440, height: 823 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

titre("§1 en vivant — la galerie tient dans la colonne");
let geo;
{
  await page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await page.locator('button:text-is("Portfolio")').first().click();
  await page.waitForSelector(sel);
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ block: "center" });
  }, sel);
  await page.waitForTimeout(600);

  geo = await page.evaluate((s) => {
    const bloc = document.querySelector(s);
    const ul = bloc.querySelector("[data-galerie-defilante]");
    const t = bloc.querySelector("[data-titre-galerie]");
    const st = getComputedStyle(ul);
    const cs = getComputedStyle(ul.closest("[class*='overflow-y-auto']"));
    const r = ul.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    const cases = [...bloc.querySelectorAll("[data-case-galerie]")];
    const troisieme = cases[2].getBoundingClientRect();
    return {
      rangee: [+r.left.toFixed(2), +r.right.toFixed(2)],
      titre: [+tr.left.toFixed(2), +tr.right.toFixed(2)],
      premiereCase: +cases[0].getBoundingClientRect().left.toFixed(2),
      rembourrage: `${st.paddingLeft} / ${st.paddingRight}`,
      marge: `${st.marginLeft} / ${st.marginRight}`,
      masque: `${st.maskImage} / ${st.webkitMaskImage}`,
      ecart: st.columnGap,
      largeurCase: +cases[0].getBoundingClientRect().width.toFixed(3),
      partVisible3e: +(
        ((r.right - troisieme.left) / troisieme.width) *
        100
      ).toFixed(2),
      colonne: `${cs.paddingLeft}/${cs.paddingRight} · ${cs.marginLeft}/${cs.marginRight}`,
      points: Boolean(bloc.querySelector('[data-role="pagination"]')),
      y: Math.round(r.top + r.height / 2),
    };
  }, sel);

  verif(
    "LE BORD GAUCHE DE LA GALERIE ET L'ALIGNEMENT DES TITRES COÏNCIDENT",
    geo.rangee[0] === geo.titre[0] && geo.premiereCase === geo.titre[0],
    `rangée ${geo.rangee[0]} · première photo ${geo.premiereCase} · titres ${geo.titre[0]}`
  );
  verif(
    "…et le bord droit aussi",
    geo.rangee[1] === geo.titre[1],
    `rangée ${geo.rangee[1]} · titres ${geo.titre[1]}`
  );
  verif(
    "la rangée n'a plus ni marge négative, ni rembourrage",
    geo.rembourrage === "0px / 0px" && geo.marge === "0px / 0px",
    `rembourrage ${geo.rembourrage} · marge ${geo.marge}`
  );
  verif(
    "PLUS AUCUN MASQUE sur la rangée",
    geo.masque === "none / none",
    geo.masque
  );
  verif(
    "le rognage de la colonne est revenu à 12 px, des deux côtés",
    geo.colonne === "12px/12px · -12px/-12px",
    geo.colonne
  );
  verif(
    "l'écart reste 3 px, et la troisième photo se voit sur 10 %",
    geo.ecart === "3px" && Math.abs(geo.partVisible3e - 10) < 0.2,
    `${geo.ecart} · ${geo.partVisible3e} % · case ${geo.largeurCase} px`
  );
  verif("aucun point de défilement", !geo.points);
}

titre("§1 au pixel — la coupure est NETTE, plus aucun dégradé");
{
  //  On repeint les cases d'une couleur franche, et on DÉCALE la
  //  galerie : une photo passe alors sous l'alignement du texte. S'il
  //  restait un effacement, on lirait des valeurs intermédiaires juste
  //  à droite de cette ligne.
  await page.addStyleTag({
    content: `${sel} [data-case-galerie] span { background: #FF00FF !important; }
              ${sel} [data-case-galerie] img { opacity: 0 !important; }`,
  });
  await page.evaluate((s) => {
    const ul = document.querySelector(s + " [data-galerie-defilante]");
    ul.style.scrollSnapType = "none";
    ul.scrollLeft = 60;
  }, sel);
  await page.waitForTimeout(600);

  const scene = await page.evaluate((s) => {
    const ul = document.querySelector(s + " [data-galerie-defilante]");
    const cases = [...ul.querySelectorAll("[data-case-galerie]")];
    const r = ul.getBoundingClientRect();
    return {
      position: ul.scrollLeft,
      //  Une photo couvre-t-elle VRAIMENT le bord gauche et les 40 px
      //  qui suivent ? Sans cela, lire « le fond » ne prouverait rien.
      couvre: cases.some(
        (c) =>
          c.getBoundingClientRect().left <= r.left &&
          c.getBoundingClientRect().right >= r.left + 43
      ),
    };
  }, sel);
  verif(
    "LA SCÈNE EST BIEN CELLE QU'ON CROIT : la galerie a défilé, et une photo couvre la ligne",
    scene.position > 1 && scene.couvre,
    `position ${scene.position}`
  );

  const LARGE = 30;
  const png = await page.screenshot({
    clip: { x: geo.titre[0] - LARGE, y: geo.y - 1, width: LARGE + 40, height: 3 },
  });
  const px = lirePixels(png);
  const magenta = (p) => p[0] > 200 && p[1] < 90 && p[2] > 200;
  const fond = (p) =>
    Math.abs(p[0] - FOND[0]) + Math.abs(p[1] - FOND[1]) + Math.abs(p[2] - FOND[2]) <= 6;
  let intermediaires = 0;
  let premierMagenta = null;
  const echantillon = [];
  for (let x = 0; x < px.largeur; x += 1) {
    const p = px.pixel(x, 3);
    const enX = geo.titre[0] - LARGE + x / 2;
    if (magenta(p) && premierMagenta === null) premierMagenta = enX;
    //  ⚠️ NI FOND NI MAGENTA = un pixel de transition. C'est
    //  exactement ce qu'un dégradé produirait, et il ne doit plus y en
    //  avoir un seul.
    if (!magenta(p) && !fond(p)) {
      intermediaires += 1;
      if (echantillon.length < 4) echantillon.push(`${enX}:${p.join(",")}`);
    }
  }
  verif(
    "la peinture commence EXACTEMENT à l'alignement des titres",
    premierMagenta !== null && Math.abs(premierMagenta - geo.titre[0]) < 1,
    `premier pixel peint ${premierMagenta} · titres ${geo.titre[0]}`
  );
  verif(
    "AUCUNE TRANSPARENCE PROGRESSIVE : pas un seul pixel entre le fond et la photo",
    intermediaires === 0,
    intermediaires === 0
      ? "coupure nette sur toute la bande décodée"
      : `${intermediaires} pixel(s) intermédiaire(s) : ${echantillon.join(" ")}`
  );
}

titre("§3 au pixel — les langues indisponibles, les trois valeurs");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.click('button[aria-label^="Langue"]');
  await page.waitForTimeout(800);

  /** Le pixel le plus clair du texte d'une langue désactivée. */
  async function eteinte() {
    const z = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button[lang]")].filter(
        (n) => n.disabled
      )[0];
      const r = b.getBoundingClientRect();
      return {
        x: Math.round(r.left + 30),
        y: Math.round(r.top + 12),
        width: 120,
        height: 22,
      };
    });
    const px = lirePixels(await page.screenshot({ clip: z }));
    let max = -1,
      best = null;
    for (let x = 0; x < px.largeur; x += 1) {
      for (let y = 0; y < px.hauteur; y += 1) {
        const p = px.pixel(x, y);
        const l = p[0] + p[1] + p[2];
        if (l > max) {
          max = l;
          best = p;
        }
      }
    }
    return best;
  }

  const maintenant = await eteinte();
  //  ⚠️ LES TROIS VALEURS SUR LE MÊME FOND : deux nombres pris sur deux
  //  captures différentes ne se comparent pas. La plaque ne bouge pas.
  await page.addStyleTag({
    content: `button[lang][disabled]{color:rgba(168,168,176,0.5)!important}`,
  });
  await page.waitForTimeout(300);
  const cinquante = await eteinte();
  await page.addStyleTag({
    content: `button[lang][disabled]{color:rgba(168,168,176,0.2)!important}`,
  });
  await page.waitForTimeout(300);
  const vingt = await eteinte();

  verif(
    "elle est PLUS CLAIRE que le /50 de départ, que le propriétaire trouvait déjà illisible",
    maintenant[0] > cinquante[0] + 30,
    `/85 rgb(${maintenant.join(", ")}) · /50 rgb(${cinquante.join(", ")}) · ` +
      `/20 rgb(${vingt.join(", ")})`
  );
  const reste = await page.evaluate(() => {
    const dispo = [...document.querySelectorAll("button[lang]")].find(
      (n) => !n.disabled
    );
    const eteint = [...document.querySelectorAll("button[lang]")].filter(
      (n) => n.disabled
    )[0];
    return {
      disponible: getComputedStyle(dispo).color,
      graisse: getComputedStyle(dispo).fontWeight,
      point: getComputedStyle(eteint.querySelector("span[aria-hidden]"))
        .backgroundColor,
    };
  });
  verif(
    "…tout en restant moins présente qu'une langue disponible, blanche et grasse",
    reste.disponible === "rgb(242, 242, 244)" &&
      Number(reste.graisse) >= 600 &&
      maintenant[0] < 200,
    `disponible ${reste.disponible} (graisse ${reste.graisse}) · éteinte rgb(${maintenant.join(", ")})`
  );
  verif(
    "§3-b — le point rond est revenu à 40 %",
    /0\.4\b|40%/.test(reste.point),
    reste.point
  );
}

titre("§4 en vivant — le trait, tel que le navigateur le résout");
{
  /*  ⚠️ LE FORMULAIRE DE PORTFOLIO EXIGE UNE SESSION QUE CE CONTENEUR
      NE PEUT PAS SIGNER (voir la section non jouée). Ce qu'on prouve
      ici : la CLASSE que la source assigne au trait, résolue par le
      navigateur du site — position, dimensions et couleur. */
  const t = await page.evaluate(() => {
    const boite = document.createElement("div");
    boite.style.cssText = "position:relative;width:160px;height:60px";
    boite.innerHTML =
      '<span data-t class="absolute inset-x-0 bottom-0 h-[2px] bg-primaire"></span>';
    document.body.appendChild(boite);
    const n = boite.querySelector("[data-t]");
    const s = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    const rb = boite.getBoundingClientRect();
    const lu = {
      fond: s.backgroundColor,
      largeur: +r.width.toFixed(2),
      hauteur: +r.height.toFixed(2),
      largeurBoite: +rb.width.toFixed(2),
      auBas: +(rb.bottom - r.bottom).toFixed(2),
      cotes: `${s.left} / ${s.right} / ${s.top} / ${s.bottom}`,
    };
    boite.remove();
    return lu;
  });
  verif(
    "LE TRAIT EST EN BAS, HORIZONTAL, d'un bord à l'autre",
    t.auBas === 0 && t.largeur === t.largeurBoite && t.hauteur === 2,
    `${t.largeur} × ${t.hauteur} · collé au bas (${t.auBas} px) · ${t.cotes}`
  );
  verif("…et il est rose #EE3D6F", t.fond === ROSE, t.fond);
}

nonJoue(
  "§2 ET §4 EN VIVANT, SUR LEURS PAGES",
  "« Ma sélection » (/mes-favoris) et le formulaire de portfolio exigent " +
    "une session Supabase validée par le serveur : ce conteneur ne peut " +
    "pas la signer, et /mes-favoris répond 307. Le §2 est donc vérifié à " +
    "la source, chaînon par chaînon — et surtout, le banc PROUVE que la " +
    "fenêtre superposée n'a pas été touchée. Le §4 est prouvé en deux " +
    "temps : la source dit quelle classe porte le trait, le navigateur du " +
    "site dit ce qu'elle vaut. Je n'ai vu peints ni l'un ni l'autre"
);

await ctx.close();
await nav.close();
process.exit(bilan());
