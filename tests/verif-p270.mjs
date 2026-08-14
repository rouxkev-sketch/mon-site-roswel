/**
 * BANC DE LA PASSE Nº 270
 * ==================================================================
 * §1 l'ordre des quatre champs de liens du formulaire : Booking ·
 *    Instagram · TikTok · le lien libre — le second « Ajouter un
 *    lien » a disparu, le Booking a pris sa place ;
 * §2 le champ Booking : trois entrées mot pour mot, le champ des mois
 *    (1 à 12) seulement sur « délai d'attente », l'information
 *    OBLIGATOIRE (rouges des nº 266/269), la migration nommée ;
 * §3 la fiche publique : le Booking en PREMIÈRE position des liens,
 *    les trois libellés exacts, UN rond à trois intensités (vert,
 *    gris clair, gris foncé presque éteint — jamais rouge ni
 *    orange), RIEN quand rien n'est déclaré ;
 * §4 la coche verte des liens au repos ; à l'entrée dans le champ,
 *    la CROIX du formulaire la remplace et EFFACE le lien.
 *
 * MÉTHODE : la source ligne à ligne, les règles livrées REJOUÉES
 * (new Function), le VIVANT sur les fiches de démonstration (Camille
 * Fauve porte « délai · 3 mois », Typo Sauvage n'a rien déclaré), et
 * le FORMULAIRE DE CRÉATION joué en vrai par `formulaireNeuf` — le
 * socle a établi (commun-verif) qu'il se rend sans session après
 * l'expiration de l'appel Supabase. S'il ne répond pas : NON JOUÉ,
 * jamais maquillé.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import {
  BASE,
  bilan,
  chromium,
  formulaireNeuf,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const formulaire = lire("src/components/FormulaireFiche.tsx");
const formulaireNu = sansNotes(formulaire);
const champLien = lire("src/components/ChampLienVerifie.tsx");
const champLienNu = sansNotes(champLien);
const champLocalisation = sansNotes(lire("src/components/ChampLocalisation.tsx"));
const contenuNu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const menuNu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const demoNu = sansNotes(lire("src/lib/tatoueurs-demo.ts"));

/* ==================================================================
 * §1 — L'ORDRE DES QUATRE CHAMPS, À LA SOURCE
 * ================================================================== */
titre("§1 — l'ordre des quatre champs : Booking · Instagram · TikTok · lien libre");
{
  const posBooking = formulaireNu.indexOf('id="fiche-booking"');
  const posInstagram = formulaireNu.indexOf('id="fiche-instagram"');
  const posTiktok = formulaireNu.indexOf('id="fiche-tiktok"');
  const posLien = formulaireNu.indexOf('id="fiche-lien-1"');
  verif(
    "les quatre champs existent, dans CET ordre et lui seul",
    posBooking > 0 &&
      posBooking < posInstagram &&
      posInstagram < posTiktok &&
      posTiktok < posLien,
    `positions ${posBooking} < ${posInstagram} < ${posTiktok} < ${posLien}`
  );
  verif(
    "le second « Ajouter un lien » a disparu — état, champ, validation",
    !formulaireNu.includes("fiche-lien-2") &&
      !formulaireNu.includes("liensLibres") &&
      !formulaireNu.includes("trouvees.lien2") &&
      formulaireNu.includes(
        "const [lienLibre, setLienLibre] = useState<LienLibreSaisie>"
      )
  );
  //  L'ENVOI, ISOLÉ : l'objet `ligne` (création — la modification en
  //  copie les champs) et la liste des colonnes tolérées. L'aperçu
  //  « Ma fiche », lui, est un chemin de LECTURE : il continue de
  //  MONTRER la page de liens dormante, comme la fiche publique.
  const debutLigne = formulaireNu.indexOf("const ligne = {");
  const blocLigne = formulaireNu.slice(
    debutLigne,
    formulaireNu.indexOf("};", debutLigne)
  );
  const debutOpt = formulaireNu.indexOf("const optionnelles = [");
  const blocOpt = formulaireNu.slice(
    debutOpt,
    formulaireNu.indexOf("];", debutOpt)
  );
  verif(
    "ses colonnes ne sont PLUS ÉCRITES (garantie lien_youtube) : " +
      "`page_de_liens` absent de l'envoi et des tolérées",
    !blocLigne.includes("page_de_liens") &&
      !blocOpt.includes("page_de_liens") &&
      //  … et plus RELU non plus : le charger dans le champ restant
      //  l'aurait réécrit dans site_web au prochain envoi.
      !formulaireNu.includes("source.page_de_liens") &&
      formulaireNu.includes(
        "setLienLibre(lienDepuisBase(source.site_web, source.titre_site_web))"
      ) &&
      //  l'aperçu, lui, montre TOUJOURS la colonne dormante — et le
      //  Booking déclaré avec elle.
      formulaireNu.includes("(sourceFiche.page_de_liens as string | null)") &&
      formulaireNu.includes("(sourceFiche.booking as Tatoueur[\"booking\"])")
  );
}

/* ==================================================================
 * §2 — LE CHAMP BOOKING, À LA SOURCE
 * ================================================================== */
titre("§2 — les trois entrées, mot pour mot, et les mois 1 à 12");
{
  const debutOptions = formulaireNu.indexOf("const OPTIONS_BOOKING:");
  const blocOptions = formulaireNu.slice(debutOptions, debutOptions + 400);
  verif(
    "« Booking ouvert » / « Booking délai d'attente » / « Booking fermé »",
    /value: "ouvert", label: "Booking ouvert"/.test(blocOptions) &&
      /value: "delai", label: "Booking délai d'attente"/.test(blocOptions) &&
      /value: "ferme", label: "Booking fermé"/.test(blocOptions)
  );
  //  LES MOIS — l'expression LIVRÉE est rejouée, pas recopiée.
  const exprMois = formulaire.match(
    /const OPTIONS_BOOKING_MOIS: OptionMenu\[\] = (Array\.from\([\s\S]*?\)\n\));/
  )?.[1];
  const mois = exprMois ? new Function(`return ${exprMois};`)() : [];
  verif(
    "le champ des mois propose 1 à 12, rien d'autre (expression rejouée)",
    mois.length === 12 &&
      mois[0]?.value === "1" &&
      mois[0]?.label === "1 mois" &&
      mois[11]?.value === "12" &&
      mois[11]?.label === "12 mois" &&
      mois.every((option, rang) => option.value === String(rang + 1)),
    `${mois.length} entrées`
  );
  verif(
    "le second encadré n'existe QUE sur « délai d'attente » (à sa droite)",
    /\{booking === "delai" && \(\s*<div id="fiche-booking-mois"/.test(
      formulaireNu
    )
  );
}

titre("§2 — l'information obligatoire : la règle REJOUÉE");
{
  const debutRegle = formulaireNu.indexOf("if (!booking) {");
  const finRegle = formulaireNu.indexOf("const lienInstagram = normaliserLien", debutRegle);
  const regle = formulaireNu.slice(debutRegle, finRegle);
  let rejouee = null;
  try {
    const rejouer = new Function(
      "booking",
      "bookingMois",
      "MANQUE",
      `const trouvees = {}; ${regle}; return trouvees;`
    );
    rejouee = {
      rien: rejouer("", "", "!"),
      ouvert: rejouer("ouvert", "", "!"),
      delaiSansMois: rejouer("delai", "", "!"),
      delaiComplet: rejouer("delai", "3", "!"),
      ferme: rejouer("ferme", "", "!"),
    };
  } catch {
    rejouee = null;
  }
  verif(
    "rien déclaré → le Booking manque ; « délai » sans mois → les MOIS manquent ; " +
      "les trois états complets ne manquent de rien",
    Boolean(rejouee) &&
      rejouee.rien.booking === "!" &&
      rejouee.rien.bookingMois === undefined &&
      Object.keys(rejouee.ouvert).length === 0 &&
      rejouee.delaiSansMois.bookingMois === "!" &&
      rejouee.delaiSansMois.booking === undefined &&
      Object.keys(rejouee.delaiComplet).length === 0 &&
      Object.keys(rejouee.ferme).length === 0
  );
  verif(
    "le rouge suit les règles 266/269 : remontée par ORDRE_ERREURS " +
      "(booking puis mois, AVANT Instagram), bord par `enErreur`, " +
      "relecture branchée sur booking/bookingMois",
    /\["booking", "fiche-booking"\],\s*\["bookingMois", "fiche-booking-mois"\],\s*\["instagram", "fiche-instagram"\]/.test(
      formulaireNu
    ) &&
      formulaireNu.includes("enErreur={Boolean(erreurs.booking)}") &&
      formulaireNu.includes("enErreur={Boolean(erreurs.bookingMois)}") &&
      /filtresCoches,\s*instagram,\s*tiktok,\s*booking,\s*bookingMois,\s*lienLibre,\s*\]\);/.test(
        formulaireNu
      )
  );
  verif(
    "le menu maison sait être en faute — bord posé SEULEMENT si la prop " +
      "est fournie (les autres menus gardent leur boîte au pixel)",
    /enErreur === undefined\s*\?\s*""\s*:\s*enErreur\s*\?\s*" border border-erreur"\s*:\s*" border border-transparent"/.test(
      menuNu
    )
  );
}

titre("§2 — la persistance : l'écriture, la tolérance, la migration NOMMÉE");
{
  verif(
    "l'envoi écrit `booking` et `booking_mois` — le mois avec « délai » seul",
    formulaireNu.includes("booking: booking || null,") &&
      /booking_mois:\s*booking === "delai" && bookingMois \? Number\(bookingMois\) : null,/.test(
        formulaireNu
      )
  );
  const debutTolerees = formulaireNu.indexOf("const optionnelles = [");
  const blocTolerees = formulaireNu.slice(debutTolerees, debutTolerees + 700);
  verif(
    "colonnes tolérées absentes tant que la migration n'est pas passée — " +
      "`booking_mois` AVANT `booking` (recherche par inclusion)",
    blocTolerees.indexOf('"booking_mois"') > 0 &&
      blocTolerees.indexOf('"booking_mois"') < blocTolerees.indexOf('"booking"')
  );
  let migration = "";
  try {
    migration = lire("supabase/yokofolio-booking.sql");
  } catch {
    migration = "";
  }
  verif(
    "supabase/yokofolio-booking.sql : les deux colonnes, les trois valeurs " +
      "gardées, les mois bornés 1-12, réexécutable",
    /add column if not exists booking text/.test(migration) &&
      /add column if not exists booking_mois integer/.test(migration) &&
      /booking in \('ouvert', 'delai', 'ferme'\)/.test(migration) &&
      /booking_mois between 1 and 12/.test(migration) &&
      /drop constraint if exists/.test(migration)
  );
  verif(
    "la lecture des fiches connaît les deux colonnes, et les rend NULL " +
      "par défaut (normaliser)",
    /user_id, booking, booking_mois/.test(tatoueursNu) &&
      /booking: ligne\.booking \?\? null,\s*booking_mois: ligne\.booking_mois \?\? null,/.test(
        tatoueursNu
      ) &&
      /booking\?: "ouvert" \| "delai" \| "ferme" \| null;/.test(tatoueursNu)
  );
}

/* ==================================================================
 * §3 — LA FICHE PUBLIQUE, À LA SOURCE
 * ================================================================== */
titre("§3 — à la source : première position, libellés exacts, un rond");
const rondsDebut = contenuNu.indexOf("const RONDS_BOOKING");
const rondsBloc = contenuNu.slice(rondsDebut, contenuNu.indexOf("};", rondsDebut));
const classeRond = (cle) =>
  rondsBloc.match(new RegExp(`${cle}: "([^"]+)"`))?.[1] ?? "";
{
  verif(
    "les trois libellés, et pas d'autres : « Booking ouvert » / " +
      "« Booking · N mois » / « Booking fermé »",
    contenuNu.includes('? "Booking ouvert"') &&
      contenuNu.includes('? "Booking fermé"') &&
      contenuNu.includes("`Booking · ${tatoueur.booking_mois} mois`") &&
      //  un « délai » sans mois se TAIT — on n'écrit pas « ? mois ».
      /tatoueur\.booking === "delai" && tatoueur\.booking_mois\s*\?/.test(
        contenuNu
      )
  );
  verif(
    "UN rond, LE MÊME, à trois intensités : vert #34D399, gris clair " +
      "(sombre-texte-doux), gris foncé presque éteint (sombre-haut-clair)",
    classeRond("ouvert") === "bg-[#34D399]" &&
      classeRond("delai") === "bg-sombre-texte-doux" &&
      classeRond("ferme") === "bg-sombre-haut-clair" &&
      //  une seule écriture de rond, la classe seule change.
      /h-2\.5 w-2\.5 rounded-full \$\{RONDS_BOOKING\[tatoueur\.booking\]\}/.test(
        contenuNu
      )
  );
  verif(
    "le Booking OUVRE la liste des liens (première position), et ce " +
      "n'est PAS un lien — une étiquette, sans href ni soulignement",
    /const premiereLigne = \[\s*entreeBooking,/.test(contenuNu) &&
      /const entreeBooking = tatoueur\.booking && libelleBooking && \(\s*<span/.test(
        contenuNu
      )
  );
  verif(
    "rien déclaré → rien affiché (booking ET libellé exigés) ; la démo " +
      "Camille Fauve porte « délai · 3 mois », les autres rien",
    /booking: "delai",\s*booking_mois: 3,/.test(demoNu) &&
      (demoNu.match(/booking:/g) ?? []).length === 1
  );
}

/* ==================================================================
 * §4 — LA COCHE ET LA CROIX, À LA SOURCE
 * ================================================================== */
titre("§4 — à la source : la coche au repos, la croix du formulaire à l'entrée");
{
  verif(
    "la coche verte n'existe QU'AU REPOS ; à l'entrée dans le champ, " +
      "le bouton croix la remplace ; la croix rouge d'état s'efface devant lui",
    champLienNu.includes(
      'const croixEffacer = enEdition && valeur.trim() !== "";'
    ) &&
      champLienNu.includes("const cocheVisible = reconnu && !enEdition;") &&
      champLienNu.includes("const croixEtat = enFaute && !croixEffacer;") &&
      /\{cocheVisible \? <Coche \/> : <Croix \/>\}/.test(champLienNu)
  );
  const debutBouton = champLienNu.indexOf("{croixEffacer && (");
  const blocBouton = champLienNu.slice(debutBouton, debutBouton + 900);
  verif(
    "la croix EFFACE le lien — surChangement(\"\") — et garde le focus " +
      "au champ (preventDefault à l'appui)",
    /onClick=\{\(\) => surChangement\(""\)\}/.test(blocBouton) &&
      /onPointerDown=\{\(evenement\) => evenement\.preventDefault\(\)\}/.test(
        blocBouton
      )
  );
  //  « LA CROIX DES AUTRES CHAMPS, PAS UN SECOND DESSIN » : le même
  //  IconeCroix taille 16, dans le même bouton rond que le champ de
  //  localisation — mêmes classes de boîte, de forme et de survol.
  const boutonLocalisation = champLocalisation.slice(
    champLocalisation.indexOf('aria-label="Effacer le lieu'),
    champLocalisation.indexOf("</button>", champLocalisation.indexOf('aria-label="Effacer le lieu'))
  );
  const partagees = [
    "right-2",
    "h-8 w-8",
    "rounded-full",
    "text-sombre-texte-doux",
    "hover:bg-sombre-eleve",
    "active:bg-sombre-eleve",
  ];
  verif(
    "c'est la croix des autres champs : IconeCroix taille 16, bouton rond " +
      "aux classes du champ de localisation",
    blocBouton.includes("<IconeCroix taille={16} />") &&
      boutonLocalisation.includes("<IconeCroix taille={16} />") &&
      partagees.every(
        (classe) =>
          blocBouton.includes(classe) && boutonLocalisation.includes(classe)
      )
  );
}

/* ==================================================================
 * LE VIVANT — la fiche publique, aux deux largeurs
 * ================================================================== */

/** Résout une couleur CSS en [r, g, b] par un canvas d'un pixel. */
async function enRgb(page, couleur) {
  return page.evaluate((valeur) => {
    const toile = document.createElement("canvas");
    toile.width = 1;
    toile.height = 1;
    const contexte = toile.getContext("2d", { willReadFrequently: true });
    contexte.fillStyle = "#000";
    contexte.fillStyle = valeur;
    contexte.fillRect(0, 0, 1, 1);
    const point = contexte.getImageData(0, 0, 1, 1).data;
    return [point[0], point[1], point[2]];
  }, couleur);
}

const memes = (a, b) => a.every((canal, rang) => Math.abs(canal - b[rang]) <= 2);
/** Un rond n'est JAMAIS rouge ni orange : le canal rouge ne domine pas. */
const sansAlarme = ([r, g, b]) => !(r > g + 20 && r > b + 20);

async function ouvrirFiche(largeur, chemin) {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const mobile = largeur < 768;
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1200);
  const fermer = async () => {
    await contexte.close();
    await nav.close();
  };
  return { page, fermer };
}

for (const largeur of [390, 1440]) {
  titre(`§3 — VIVANT (${largeur} px) : Camille Fauve dit « Booking · 3 mois »`);
  const { page, fermer } = await ouvrirFiche(
    largeur,
    "/tatoueur/camille-fauve-paris-18e"
  );
  try {
    await page.waitForSelector("[data-booking-fiche]", { timeout: 20000 });
    const releve = await page.evaluate(() => {
      const entree = document.querySelector("[data-booking-fiche]");
      const rond = entree.querySelector("[data-rond-booking]");
      const instagram = [...document.querySelectorAll("a")].find(
        (a) => a.textContent.trim() === "Instagram"
      );
      const boiteEntree = entree.getBoundingClientRect();
      const boiteRond = rond.getBoundingClientRect();
      const styleRond = getComputedStyle(rond);
      return {
        etat: entree.getAttribute("data-booking-fiche"),
        texte: entree.textContent.trim(),
        estUnLien: entree.closest("a") !== null,
        avantInstagram: instagram
          ? Boolean(
              entree.compareDocumentPosition(instagram) &
                Node.DOCUMENT_POSITION_FOLLOWING
            ) && boiteEntree.top < instagram.getBoundingClientRect().top
          : null,
        rondLargeur: boiteRond.width,
        rondHauteur: boiteRond.height,
        rondRayon: styleRond.borderRadius,
        rondFond: styleRond.backgroundColor,
      };
    });
    verif(
      "le libellé exact : « Booking · 3 mois » (le chiffre = le mois déclaré)",
      releve.etat === "delai" && releve.texte === "Booking · 3 mois",
      JSON.stringify(releve.texte)
    );
    verif(
      "PREMIÈRE position des liens : devant Instagram, et ce n'est pas un lien",
      releve.avantInstagram === true && releve.estUnLien === false
    );
    const gris = await enRgb(page, releve.rondFond);
    verif(
      "le rond du délai : GRIS CLAIR mesuré (#A8A8B0), 10 px, rond",
      memes(gris, [168, 168, 176]) &&
        sansAlarme(gris) &&
        Math.abs(releve.rondLargeur - 10) <= 1 &&
        Math.abs(releve.rondHauteur - 10) <= 1 &&
        parseFloat(releve.rondRayon) * 2 >= releve.rondLargeur - 1,
      `rgb(${gris.join(", ")}) · ${releve.rondLargeur}×${releve.rondHauteur}`
    );

    //  LES TROIS INTENSITÉS, mesurées d'un coup : les classes RÉELLES
    //  du produit (lues dans la source), posées sur la page vivante.
    const classes = {
      ouvert: classeRond("ouvert"),
      delai: classeRond("delai"),
      ferme: classeRond("ferme"),
    };
    const fonds = await page.evaluate((troisClasses) => {
      const releves = {};
      for (const [cle, classe] of Object.entries(troisClasses)) {
        const rond = document.createElement("span");
        rond.className = "h-2.5 w-2.5 rounded-full " + classe;
        document.body.appendChild(rond);
        releves[cle] = getComputedStyle(rond).backgroundColor;
      }
      return releves;
    }, classes);
    const ouvert = await enRgb(page, fonds.ouvert);
    const delai = await enRgb(page, fonds.delai);
    const ferme = await enRgb(page, fonds.ferme);
    verif(
      "les trois intensités mesurées : vert #34D399, gris clair #A8A8B0, " +
        "gris foncé #4B4B54 — jamais de rouge ni d'orange",
      memes(ouvert, [52, 211, 153]) &&
        memes(delai, [168, 168, 176]) &&
        memes(ferme, [75, 75, 84]) &&
        [ouvert, delai, ferme].every(sansAlarme),
      `ouvert rgb(${ouvert.join(",")}) · délai rgb(${delai.join(",")}) · fermé rgb(${ferme.join(",")})`
    );
  } catch (erreur) {
    nonJoue(
      `§3 vivant à ${largeur} px`,
      `la fiche de démonstration n'a pas répondu — ${String(erreur).slice(0, 120)}`
    );
  } finally {
    await fermer();
  }

  //  UNE FICHE SANS DÉCLARATION N'AFFICHE RIEN À CETTE PLACE.
  const muette = await ouvrirFiche(largeur, "/tatoueur/typo-sauvage-bordeaux");
  try {
    await muette.page.waitForSelector("h1", { timeout: 20000 });
    const silence = await muette.page.evaluate(() => ({
      entrees: document.querySelectorAll("[data-booking-fiche]").length,
      motBooking: document.body.innerText.includes("Booking"),
    }));
    verif(
      `Typo Sauvage (rien déclaré) n'affiche RIEN à ${largeur} px`,
      silence.entrees === 0 && silence.motBooking === false
    );
  } catch (erreur) {
    nonJoue(
      `§3 silence à ${largeur} px`,
      `la fiche de démonstration n'a pas répondu — ${String(erreur).slice(0, 120)}`
    );
  } finally {
    await muette.fermer();
  }
}

/* ==================================================================
 * LE VIVANT — le formulaire de création, aux deux largeurs
 * ================================================================== */
const ERREUR_RGB = [211, 46, 40]; // COULEURS.erreur, #D32E28

for (const largeur of [390, 1440]) {
  titre(`§1/§2/§4 — VIVANT (${largeur} px) : le formulaire de création`);
  const mobile = largeur < 768;
  const { nav, ctx, page } = await ouvrirLeNavigateur(
    "p270",
    { width: largeur, height: mobile ? 844 : 950 },
    mobile ? { isMobile: true, hasTouch: true } : {}
  );
  try {
    const pret = await formulaireNeuf(page, "artiste");
    if (!pret) {
      nonJoue(
        `formulaire vivant à ${largeur} px`,
        "le formulaire de création n'a pas atteint les blocs 2+ (session/parcours indisponible ici)"
      );
    } else {
      //  §1 — L'ORDRE À L'ÉCRAN : les quatre champs, de haut en bas.
      const ordre = await page.evaluate(() => {
        const y = (id) =>
          document.getElementById(id)?.getBoundingClientRect().top ?? null;
        const base = window.scrollY;
        return {
          booking: y("fiche-booking") === null ? null : y("fiche-booking") + base,
          instagram:
            y("fiche-instagram") === null ? null : y("fiche-instagram") + base,
          tiktok: y("fiche-tiktok") === null ? null : y("fiche-tiktok") + base,
          lien: y("fiche-lien-1") === null ? null : y("fiche-lien-1") + base,
          lien2: document.getElementById("fiche-lien-2") !== null,
        };
      });
      verif(
        "l'ordre à l'écran : Booking, puis Instagram, puis TikTok, puis le lien libre — et plus de second emplacement",
        ordre.booking !== null &&
          ordre.booking < ordre.instagram &&
          ordre.instagram < ordre.tiktok &&
          ordre.tiktok < ordre.lien &&
          ordre.lien2 === false
      );

      //  §2 — RIEN DÉCLARÉ → ROUGE AU CLIC DE VALIDATION.
      const boutonBooking = page.locator(
        'button[aria-label="L\'état de ton booking"]'
      );
      const bordBooking = async () =>
        enRgb(
          page,
          await boutonBooking.evaluate(
            (bouton) => getComputedStyle(bouton).borderTopColor
          )
        );
      const alphaBordBooking = async () =>
        boutonBooking.evaluate((bouton) => {
          const brut = getComputedStyle(bouton).borderTopColor;
          const canaux = brut.match(/[\d.]+/g) ?? [];
          return canaux.length === 4 ? Number(canaux[3]) : 1;
        });
      await page
        .locator('button:has-text("Envoyer mon portfolio pour vérification")')
        .click();
      await page.waitForTimeout(900);
      const rougeSansRien = await bordBooking();
      verif(
        "rien de déclaré → l'encadré du Booking rougit (bord mesuré)",
        memes(rougeSansRien, ERREUR_RGB),
        `rgb(${rougeSansRien.join(", ")})`
      );
      verif(
        "et le champ des mois n'existe pas encore (rien à montrer)",
        (await page.locator("#fiche-booking-mois").count()) === 0
      );

      //  LES TROIS ENTRÉES, MOT POUR MOT, dans le menu ouvert.
      await boutonBooking.click();
      await page.waitForTimeout(500);
      const listeBooking = page.locator(
        'ul[role="listbox"][aria-label="L\'état de ton booking"] [role="option"]'
      );
      const entrees = (await listeBooking.allInnerTexts()).map((texte) =>
        texte.trim()
      );
      verif(
        "les trois entrées du menu, mot pour mot",
        entrees.length === 3 &&
          entrees[0] === "Booking ouvert" &&
          entrees[1] === "Booking délai d'attente" &&
          entrees[2] === "Booking fermé",
        JSON.stringify(entrees)
      );

      //  « DÉLAI D'ATTENTE » : le champ SE DIVISE, le second encadré
      //  apparaît À SA DROITE — et le rouge du Booking s'est éteint
      //  (la relecture n'enlève que, nº 266/269).
      await listeBooking.nth(1).click();
      await page.waitForTimeout(700);
      const division = await page.evaluate(() => {
        const bouton = document.querySelector(
          'button[aria-label="L\'état de ton booking"]'
        );
        const moisChamp = document.getElementById("fiche-booking-mois");
        if (!bouton || !moisChamp) return null;
        const a = bouton.getBoundingClientRect();
        const b = moisChamp.getBoundingClientRect();
        return {
          aDroite: b.left >= a.right,
          memeRangee: b.top < a.bottom && b.bottom > a.top,
        };
      });
      verif(
        "sur « délai d'attente », le champ se divise : l'encadré des mois à sa DROITE, sur la même rangée",
        division !== null && division.aDroite && division.memeRangee
      );
      verif(
        "le rouge du Booking s'est éteint tout seul (l'encadré est choisi)",
        (await alphaBordBooking()) === 0
      );

      //  LE MENU DES MOIS : 1 à 12, rien d'autre.
      const boutonMois = page.locator(
        'button[aria-label="Le délai d\'attente, en mois"]'
      );
      await boutonMois.click();
      await page.waitForTimeout(500);
      const listeMois = page.locator(
        'ul[role="listbox"][aria-label="Le délai d\'attente, en mois"] [role="option"]'
      );
      const moisAffiches = (await listeMois.allInnerTexts()).map((texte) =>
        texte.trim()
      );
      verif(
        "le menu des mois propose « 1 mois » à « 12 mois », douze entrées",
        moisAffiches.length === 12 &&
          moisAffiches[0] === "1 mois" &&
          moisAffiches[11] === "12 mois",
        `${moisAffiches.length} entrées`
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);

      //  « DÉLAI » SANS MOIS → l'encadré des MOIS rougit au clic.
      await page
        .locator('button:has-text("Envoyer mon portfolio pour vérification")')
        .click();
      await page.waitForTimeout(900);
      const bordMois = await enRgb(
        page,
        await boutonMois.evaluate(
          (bouton) => getComputedStyle(bouton).borderTopColor
        )
      );
      verif(
        "« délai d'attente » sans le mois → l'encadré des mois est rouge lui aussi",
        memes(bordMois, ERREUR_RGB),
        `rgb(${bordMois.join(", ")})`
      );
      //  CHOISIR « 3 mois » éteint ce rouge-là — et le champ le dit.
      await boutonMois.click();
      await page.waitForTimeout(500);
      await listeMois.nth(2).click();
      await page.waitForTimeout(700);
      const apresChoix = await boutonMois.evaluate((bouton) => ({
        texte: bouton.textContent.trim(),
        alpha: (() => {
          const canaux =
            getComputedStyle(bouton).borderTopColor.match(/[\d.]+/g) ?? [];
          return canaux.length === 4 ? Number(canaux[3]) : 1;
        })(),
      }));
      verif(
        "« 3 mois » choisi : le rouge des mois s'éteint, le champ l'affiche",
        apresChoix.texte === "3 mois" && apresChoix.alpha === 0,
        JSON.stringify(apresChoix.texte)
      );

      //  §4 — LA COCHE AU REPOS, LA CROIX À L'ENTRÉE, ET ELLE EFFACE.
      const champInstagram = page.locator("#fiche-instagram");
      await champInstagram.click();
      await champInstagram.fill("https://www.instagram.com/yoko.folio/");
      //  ON REFERME LE CHAMP (le nom prend le focus) : au repos, la
      //  coche verte demeure — et aucun bouton d'effacement.
      await page.locator("#fiche-nom").click();
      await page.waitForTimeout(500);
      const auRepos = await page.evaluate(() => {
        const enveloppe = document.getElementById("fiche-instagram").closest("div");
        const coche = [...enveloppe.querySelectorAll("svg path")].some((trace) =>
          trace.getAttribute("d").startsWith("M20 6")
        );
        return {
          coche,
          bouton: enveloppe.querySelector('button[aria-label="Effacer le lien Instagram"]') !== null,
        };
      });
      verif(
        "au repos : la coche verte demeure, aucune croix",
        auRepos.coche === true && auRepos.bouton === false
      );
      //  ON ENTRE DANS LE CHAMP : la croix remplace la coche.
      await champInstagram.click();
      await page.waitForTimeout(400);
      const enEdition = await page.evaluate(() => {
        const enveloppe = document.getElementById("fiche-instagram").closest("div");
        const coche = [...enveloppe.querySelectorAll("svg path")].some((trace) =>
          trace.getAttribute("d").startsWith("M20 6")
        );
        return {
          coche,
          bouton: enveloppe.querySelector('button[aria-label="Effacer le lien Instagram"]') !== null,
        };
      });
      verif(
        "à l'entrée dans le champ : la croix remplace la coche",
        enEdition.coche === false && enEdition.bouton === true
      );
      await page
        .locator('button[aria-label="Effacer le lien Instagram"]')
        .click();
      await page.waitForTimeout(400);
      const apresCroix = await page.evaluate(() => ({
        valeur: document.getElementById("fiche-instagram").value,
        focusAuChamp: document.activeElement?.id === "fiche-instagram",
      }));
      verif(
        "la croix EFFACE le lien — et le champ garde le focus pour ressaisir",
        apresCroix.valeur === "" && apresCroix.focusAuChamp === true
      );
    }
  } catch (erreur) {
    nonJoue(
      `formulaire vivant à ${largeur} px`,
      `le parcours s'est interrompu — ${String(erreur).slice(0, 140)}`
    );
  } finally {
    await ctx.close();
    await nav.close();
  }
}

process.exit(bilan());
