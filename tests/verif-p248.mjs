/**
 * BANC DE LA PASSE Nº 248 — LA PAGE NE DÉBORDE PLUS EN LARGEUR
 * ==================================================================
 * UNE SEULE CHOSE À MESURER, partout : `scrollWidth` doit valoir
 * `clientWidth`. Un écart, c'est une page qui se laisse glisser vers
 * la droite — et quelque chose de la barre qui sort de l'écran.
 *
 * ⚠️ ON NE MESURE PAS QUE LE SYMPTÔME : le banc relève aussi la
 * géométrie de la barre (les trois blocs de sa rangée) pour prouver
 * que c'est bien LE BLOC CENTRAL qui cède, et lui seul — le logo et le
 * côté « Langue et compte » gardent leur largeur au pixel.
 *
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

const LARGEURS = [390, 768, 1024, 1100, 1200, 1440];

/** La géométrie de la rangée de la barre, et le débordement du document. */
const RELEVE = `() => {
  const rangee = document.querySelector("[data-barre-fixe] > div");
  const bloc = document.querySelector("[data-rangee-moteur]");
  const nav = document.querySelector('[aria-label="Langue et compte"]');
  const logo = rangee ? rangee.firstElementChild : null;
  const boite = (n) => {
    if (!n) return null;
    const b = n.getBoundingClientRect();
    return {
      l: Math.round(b.width),
      g: Math.round(b.left),
      d: Math.round(b.right),
    };
  };
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    logo: boite(logo),
    bloc: boite(bloc),
    nav: boite(nav),
  };
}`;

async function ouvrirA(largeur, chemin, mobile = false) {
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
  await page.waitForTimeout(2200);
  return { contexte, page };
}

/* ==================================================================
 * §1 et §4 — L'ACCUEIL, AUX SIX LARGEURS
 * ================================================================== */
titre("§1 — l'accueil ne déborde plus, aux six largeurs");
const releves = new Map();
for (const largeur of LARGEURS) {
  const { contexte, page } = await ouvrirA(largeur, "/", largeur < 1024);
  try {
    const vu = await page.evaluate(`(${RELEVE})()`);
    releves.set(largeur, vu);
    verif(
      `${largeur} px : scrollWidth === clientWidth`,
      vu.scrollWidth === vu.clientWidth,
      `${vu.scrollWidth} / ${vu.clientWidth}` +
        (vu.scrollWidth === vu.clientWidth
          ? ""
          : ` — ${vu.scrollWidth - vu.clientWidth} px de trop`)
    );
  } catch (erreur) {
    nonJoue(`§1 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 et §3 — C'EST LE BLOC CENTRAL QUI CÈDE, ET LUI SEUL
 * ================================================================== */
titre("§2/§3 — le bloc central cède, le logo et le compte ne bougent pas");
{
  const a = (largeur) => releves.get(largeur);
  verif(
    "sous 1196 px, le bloc central se réduit (il ne poussait plus rien dehors)",
    a(1024)?.bloc.l < 680 && a(1100)?.bloc.l < 680,
    `1024 → ${a(1024)?.bloc.l} px · 1100 → ${a(1100)?.bloc.l} px`
  );
  verif(
    "à 1200 px et au-delà, il retrouve ses 680 px EXACTS",
    a(1200)?.bloc.l === 680 && a(1440)?.bloc.l === 680,
    `1200 → ${a(1200)?.bloc.l} px · 1440 → ${a(1440)?.bloc.l} px`
  );
  verif(
    "le LOGO garde sa largeur et sa place à toutes les largeurs web",
    [1024, 1100, 1200, 1440].every(
      (largeur) =>
        a(largeur)?.logo.l === a(1440)?.logo.l && a(largeur)?.logo.g === 24
    ),
    `${a(1440)?.logo.l} px, bord gauche 24`
  );
  verif(
    "le côté « Langue et compte » (fanion, compte) garde SA largeur",
    [1024, 1100, 1200, 1440].every(
      (largeur) => a(largeur)?.nav.l === a(1440)?.nav.l
    ),
    `${a(1440)?.nav.l} px partout`
  );
  verif(
    "…et il ne sort plus de l'écran (son bord droit tient dans la page)",
    [1024, 1100, 1200, 1440].every(
      (largeur) => a(largeur)?.nav.d <= a(largeur)?.clientWidth
    ),
    `1024 : bord droit ${a(1024)?.nav.d} pour ${a(1024)?.clientWidth} px`
  );
  //  §4 — les espaces de part et d'autre du bloc central, à 1440.
  const large = a(1440);
  const gauche = large ? large.bloc.g - large.logo.d : 0;
  const droite = large ? large.nav.g - large.bloc.d : 0;
  verif(
    "à 1440 px, les espaces de part et d'autre du bloc restent ÉGAUX",
    gauche === droite && gauche > 0,
    `${gauche} px à gauche · ${droite} px à droite`
  );
}

titre("§3 — aucun masque : le débordement est retiré, pas caché");
{
  /*  ⚠️ ON LIT LE CODE, PAS LES COMMENTAIRES (le faux positif payé à
      la nº 245) : cette passe-ci PARLE de `lg:shrink-0` et de
      `overflow-x: hidden` dans ses notes, précisément pour dire
      qu'ils sont partis. Une recherche naïve les retrouverait. */
  const sansNotes = (source) =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  const barre = sansNotes(lire("src/components/EnTeteTatouage.tsx"));
  const feuille = sansNotes(lire("src/app/globals.css"));
  verif(
    "le bloc central peut se réduire (`lg:shrink`), sans jamais grandir",
    /lg:basis-\[680px\] lg:shrink lg:grow-0/.test(barre) &&
      !/lg:shrink-0/.test(barre)
  );
  verif(
    "aucun `overflow-x: hidden` posé sur la page, le corps ou la barre",
    !/overflow-x:\s*hidden/i.test(feuille) &&
      !/overflow-x-hidden/.test(barre) &&
      !/overflow-hidden/.test(
        //  (la rangée mobile garde son `max-lg:overflow-hidden`, qui
        //  est le rognage VERTICAL du repli — on ne regarde donc que
        //  la déclaration de la barre elle-même.)
        barre.slice(barre.indexOf("<header"), barre.indexOf("<div"))
      )
  );
  verif(
    "le logo et le côté du compte restent incompressibles",
    /lg:flex-none lg:basis-auto/.test(barre) &&
      /lg:flex-none shrink-0 flex items-center justify-end/.test(barre)
  );
}

/* ==================================================================
 * §4 — LES AUTRES PAGES, AUX MÊMES SIX LARGEURS
 * ================================================================== */
titre("§4 — les autres pages : le masque de la nº 228 n'en cachait pas d'autres");
{
  const pages = [
    ["une fiche", "/tatoueur/atelier-corvus-lyon-1er"],
    ["la photothèque", "/?texte=sans"],
    ["style + ville", "/tatouage/blackwork/lyon-1er"],
    //  « Ma sélection » exige une session : l'adresse mène à la
    //  connexion, et c'est CETTE page-là qu'on mesure. Dit, pas
    //  maquillé (voir la section NON JOUÉE).
    ["la connexion (redirection de Ma sélection)", "/mes-favoris"],
  ];
  for (const [nom, chemin] of pages) {
    const debordements = [];
    for (const largeur of LARGEURS) {
      const { contexte, page } = await ouvrirA(largeur, chemin, largeur < 1024);
      try {
        const vu = await page.evaluate(`(${RELEVE})()`);
        if (vu.scrollWidth !== vu.clientWidth) {
          debordements.push(`${largeur}px:+${vu.scrollWidth - vu.clientWidth}`);
        }
      } catch {
        debordements.push(`${largeur}px:erreur`);
      }
      await contexte.close();
    }
    verif(
      `${nom} : aucune largeur ne déborde`,
      debordements.length === 0,
      debordements.length === 0 ? "six largeurs mesurées" : debordements.join(" · ")
    );
  }
}

/* ==================================================================
 * LE SMARTPHONE N'A PAS BOUGÉ
 * ================================================================== */
titre("La version smartphone : ses deux hauteurs, et ses réglages de juillet");
{
  const { contexte, page } = await ouvrirA(390, "/", true);
  try {
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
      "la rangée se replie et se redéploie, aux mêmes deux hauteurs",
      haut === 128 && descendu === 64 && remonte === 128,
      `${haut} → ${descendu} → ${remonte}`
    );
  } catch (erreur) {
    nonJoue("le repli mobile", String(erreur).slice(0, 70));
  }
  await contexte.close();
}
{
  const barre = lire("src/components/EnTeteTatouage.tsx");
  verif(
    "et ses réglages n'ont pas bougé d'un chiffre (24 / 12 / 64, 128 et 64)",
    /cumulDuGeste\.current > 24/.test(barre) &&
      /cumulDuGeste\.current < -12/.test(barre) &&
      /y < 64/.test(barre) &&
      /rangeePresente && !moteurReplie \? 128/.test(barre) &&
      /data-reserve-depliee=\{rangeePresente \? 128 : 64\}/.test(barre) &&
      //  Sous `lg`, le bloc reste pleine largeur : la correction ne
      //  touche QUE la variante `lg:`.
      /basis-full lg:basis-\[680px\]/.test(barre)
  );
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : c'est la page de " +
    "connexion vers laquelle elle redirige qui a été mesurée"
);

process.exit(bilan());
