/**
 * BANC DE LA PASSE Nº 273
 * ==================================================================
 * §1 les trois ronds du booking (vert / gris clair / gris foncé) ont
 *    DISPARU — à leur place, UNE icône de calendrier : la même pour
 *    les trois états, sans variante, en `currentColor` (l'écriture
 *    des icônes de la nº 240), à la couleur du libellé d'à côté et à
 *    la taille des autres icônes de la liste. Les libellés ne
 *    changent pas ; le silence non plus ;
 * §2 les soulignements s'en vont, SAUF pour ce qui sort du site — et
 *    il n'y a qu'un cas : l'adresse (Google Maps / fenêtre de verre).
 *    Équipe, profil d'artiste, liens sous la photo : encadré ou fond
 *    de survol, AUCUN trait. L'écriture unique garde les valeurs de
 *    la 271, et n'a plus qu'UN lecteur.
 *
 * MÉTHODE : les trois états du calendrier se prouvent PAR LA SOURCE
 * (l'icône est écrite HORS de tout ternaire d'état — aucune variante
 * n'est seulement possible) et l'état vivant de la démonstration
 * (Camille Fauve, « délai · 3 mois ») se MESURE. Le survol est mesuré
 * au pointeur souris aux DEUX largeurs (un contexte tactile n'a pas
 * de survol — c'est la feuille de style qui est jugée).
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import {
  BASE,
  RACINE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const iconesReseau = sansNotes(lire("src/components/IconeReseau.tsx"));
const contenuNu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const blocNu = sansNotes(lire("src/components/BlocLieux.tsx"));

/* ==================================================================
 * §1 — LE CALENDRIER, À LA SOURCE
 * ================================================================== */
titre("§1 — à la source : une icône, trois états, aucun rond");
{
  const debutIcone = iconesReseau.indexOf("export function IconeCalendrier");
  const blocIcone = iconesReseau.slice(
    debutIcone,
    iconesReseau.indexOf("\n}", debutIcone)
  );
  verif(
    "le calendrier vit dans l'écriture des icônes de la 240 " +
      "(IconeReseau) : `currentColor` partout, trait 1,8, aucune " +
      "couleur écrite dans le tracé",
    debutIcone > 0 &&
      (blocIcone.match(/stroke="currentColor"/g) ?? []).length === 3 &&
      (blocIcone.match(/strokeWidth="1\.8"/g) ?? []).length === 3 &&
      !/#[0-9a-fA-F]{3,6}/.test(blocIcone)
  );
  verif(
    "les trois ronds ont DISPARU — RONDS_BOOKING n'existe plus, le vert " +
      "#34D399 non plus, et plus aucun `rounded-full` dans l'entrée booking",
    !contenuNu.includes("RONDS_BOOKING") &&
      !contenuNu.includes("#34D399") &&
      !contenuNu.includes("data-rond-booking")
  );
  //  UNE SEULE ÉCRITURE D'ICÔNE, HORS DE TOUT TERNAIRE D'ÉTAT : le
  //  seul aiguillage par état est celui des LIBELLÉS — l'icône est
  //  posée après lui, une fois, pour les trois états. C'est la preuve
  //  ligne à ligne qu'« ouvert » et « fermé » (absents de la
  //  démonstration) portent LE MÊME calendrier que « délai ».
  const debutEntree = contenuNu.indexOf("const entreeBooking");
  const blocEntree = contenuNu.slice(debutEntree, debutEntree + 700);
  verif(
    "l'icône est UNIQUE et hors ternaire : une seule occurrence " +
      "d'IconeCalendrier, dans l'entrée, après l'aiguillage des libellés",
    (contenuNu.match(/<IconeCalendrier /g) ?? []).length === 1 &&
      blocEntree.includes("<IconeCalendrier taille={20} />") &&
      !/booking === [\s\S]{0,120}IconeCalendrier/.test(blocEntree)
  );
  verif(
    "à la taille des autres icônes de la liste (20, colonne de 22 px), " +
      "et les trois libellés n'ont pas bougé",
    contenuNu.includes("<IconeDuLien reseau={reseau} taille={20} />") &&
      /h-\[22px\] w-\[22px\][^>]*>\s*<IconeCalendrier taille=\{20\} \/>/.test(
        blocEntree
      ) &&
      contenuNu.includes('? "Booking ouvert"') &&
      contenuNu.includes('? "Booking fermé"') &&
      contenuNu.includes("`Booking · ${tatoueur.booking_mois} mois`") &&
      //  la règle du silence tient : booking ET libellé exigés.
      /const entreeBooking = tatoueur\.booking && libelleBooking && \(/.test(
        contenuNu
      )
  );
}

/* ==================================================================
 * §2 — LES SOULIGNEMENTS, À LA SOURCE
 * ================================================================== */
titre("§2 — à la source : un seul soulignement, un seul lecteur");
{
  const adresseSlice = blocNu.slice(
    blocNu.indexOf("function AdresseCliquable"),
    blocNu.indexOf("function BlocAdressesFiche")
  );
  const equipeSlice = blocNu.slice(
    blocNu.indexOf("function EquipeDuLieu"),
    blocNu.indexOf("function LigneEtiquetee")
  );
  verif(
    "UN SEUL lecteur : l'adresse (ce qui SORT du site) — l'équipe, le " +
      "lien d'artiste et les liens sous la photo n'ont plus un seul jeton",
    (blocNu.match(/\$\{SOULIGNEMENT_LIEN\}/g) ?? []).length === 1 &&
      adresseSlice.includes("${SOULIGNEMENT_LIEN}") &&
      !equipeSlice.includes("SOULIGNEMENT_LIEN") &&
      !equipeSlice.includes("underline") &&
      !contenuNu.includes("SOULIGNEMENT_LIEN") &&
      /className="text-\[15px\] font-medium text-sombre-texte"\s*>\s*\{mode\.salon_nom\}/.test(
        blocNu
      )
  );
  verif(
    "l'écriture garde les VALEURS de la 271 : fin, décalé, gris doux, " +
      "au survol seul — intacte au jeton près",
    /export const SOULIGNEMENT_LIEN =\s*"underline-offset-4 decoration-1 decoration-sombre-texte-doux " \+\s*"group-hover:underline";/.test(
      blocNu
    )
  );
  //  LE DÉPÔT ENTIER : les jetons du trait ne vivent qu'une fois.
  const fichiers = [];
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = `${dossier}/${nom}`;
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|css)$/.test(nom)) fichiers.push(chemin);
    }
  };
  parcourir(`${RACINE}/src`);
  const compter = (jeton) =>
    fichiers.reduce(
      (total, chemin) =>
        total +
        (sansNotes(readFileSync(chemin, "utf8")).split(jeton).length - 1),
      0
    );
  verif(
    "une seule écriture dans tout src/ : `decoration-1` ×1, " +
      "`group-hover:underline` ×1 (la constante, et rien d'autre)",
    compter("decoration-1") === 1 && compter("group-hover:underline") === 1
  );
}

/* ==================================================================
 * LE VIVANT — aux deux largeurs
 * ================================================================== */
const GRIS_DOUX = "rgb(168, 168, 176)"; // #A8A8B0, sombre-texte-doux
const VERT_PARTI = "rgb(52, 211, 153)"; // #34D399 — plus jamais ici

/** Un blanc à 5 % — rgba, ou l'oklab de Chromium. */
const blancCinq = (fond) =>
  fond === "rgba(255, 255, 255, 0.05)" ||
  (fond.startsWith("oklab(0.99") && fond.includes("/ 0.05"));

async function ouvrirA(largeur, chemin) {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  //  Pointeur SOURIS aux deux largeurs : le survol est l'objet même
  //  de la passe — à 390 px on juge la feuille de style mobile.
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: largeur < 768 ? 844 : 950 },
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const fermer = async () => {
    await contexte.close();
    await nav.close();
  };
  return { page, fermer };
}

for (const largeur of [390, 1440]) {
  titre(`§1 — VIVANT (${largeur} px) : le calendrier, mesuré sur la démonstration`);
  const artiste = await ouvrirA(largeur, "/tatoueur/camille-fauve-paris-18e");
  try {
    await artiste.page.waitForSelector("[data-booking-fiche]", {
      timeout: 20000,
    });
    const booking = await artiste.page.evaluate(() => {
      const entree = document.querySelector("[data-booking-fiche]");
      const icone = entree.querySelector("svg");
      const libelle = entree.querySelector("span.min-w-0");
      const tous = [entree, ...entree.querySelectorAll("*")];
      return {
        texte: entree.textContent.trim(),
        iconePresente: icone !== null,
        boiteIcone: icone ? icone.getBoundingClientRect().width : 0,
        couleurIcone: icone ? getComputedStyle(icone).color : null,
        couleurLibelle: libelle ? getComputedStyle(libelle).color : null,
        ronds: tous.filter((n) => {
          const s = getComputedStyle(n);
          const boite = n.getBoundingClientRect();
          return (
            boite.width > 0 &&
            parseFloat(s.borderRadius) * 2 >= boite.width - 1 &&
            s.backgroundColor !== "rgba(0, 0, 0, 0)"
          );
        }).length,
        verts: tous.filter((n) => {
          const s = getComputedStyle(n);
          return (
            s.color === "rgb(52, 211, 153)" ||
            s.backgroundColor === "rgb(52, 211, 153)" ||
            s.fill === "rgb(52, 211, 153)"
          );
        }).length,
      };
    });
    verif(
      `${largeur} px : AUCUN rond dans l'entrée booking, le calendrier présent, le libellé intact`,
      booking.ronds === 0 &&
        booking.iconePresente &&
        booking.texte === "Booking · 3 mois",
      `ronds ${booking.ronds} · « ${booking.texte} »`
    );
    verif(
      `${largeur} px : l'icône à la COULEUR DU TITRE d'à côté, mesurée (gris doux), à la taille des icônes de la liste`,
      booking.couleurIcone === booking.couleurLibelle &&
        booking.couleurIcone === GRIS_DOUX &&
        Math.abs(booking.boiteIcone - 20) <= 1,
      `icône ${booking.couleurIcone} · libellé ${booking.couleurLibelle} · ${booking.boiteIcone}px`
    );
    verif(
      `${largeur} px : plus AUCUN vert dans le bloc du booking`,
      booking.verts === 0,
      `${booking.verts} élément(s) verts — le vert ${VERT_PARTI} est parti avec son rond`
    );

    //  §2 — LE PROFIL D'ARTISTE (salon lié) : encadré, aucun trait.
    const ligne = artiste.page
      .locator('li:has(a[href^="/tatoueur/"])')
      .filter({ hasText: "En salon" })
      .first();
    await ligne.hover();
    await artiste.page.waitForTimeout(250);
    const profil = await ligne.evaluate((li) => ({
      fond: getComputedStyle(li.firstElementChild).backgroundColor,
      lien: getComputedStyle(li.querySelector('a[href^="/tatoueur/"]'))
        .textDecorationLine,
    }));
    verif(
      `${largeur} px : profil d'artiste au survol — l'encadré s'allume, AUCUN soulignement`,
      blancCinq(profil.fond) && profil.lien === "none",
      `fond ${profil.fond} · trait ${profil.lien}`
    );
    //  §2 — LES LIENS SOUS LA PHOTO : fond de survol, aucun trait.
    const instagram = artiste.page
      .locator('a[href*="instagram.com"]')
      .filter({ hasText: "Instagram" })
      .first();
    await instagram.hover();
    await artiste.page.waitForTimeout(200);
    const lienPhoto = await instagram.evaluate((a) => ({
      trait: getComputedStyle(a.querySelector("span.min-w-0"))
        .textDecorationLine,
    }));
    verif(
      `${largeur} px : lien sous la photo au survol — aucun soulignement`,
      lienPhoto.trait === "none",
      lienPhoto.trait
    );
  } catch (erreur) {
    nonJoue(
      `fiche d'artiste (${largeur} px)`,
      `la démonstration n'a pas répondu — ${String(erreur).slice(0, 110)}`
    );
  } finally {
    await artiste.fermer();
  }

  titre(`§2 — VIVANT (${largeur} px) : l'équipe sans trait, l'adresse le garde`);
  const salon = await ouvrirA(largeur, "/tatoueur/hokusai-mecanique-paris-11e");
  try {
    await salon.page.waitForSelector('a[href*="google.com/maps"]', {
      timeout: 20000,
    });
    //  L'ÉQUIPE : repos ET survol, plus aucun trait — l'encadré seul.
    const ligneEquipe = salon.page
      .locator('li:has(a[href^="/tatoueur/"] p)')
      .first();
    const equipeRepos = await ligneEquipe.evaluate(
      (li) => getComputedStyle(li.querySelector("p")).textDecorationLine
    );
    await ligneEquipe.locator("a").first().hover();
    await salon.page.waitForTimeout(250);
    const equipeSurvol = await ligneEquipe.evaluate((li) => ({
      trait: getComputedStyle(li.querySelector("p")).textDecorationLine,
      fond: getComputedStyle(li.firstElementChild).backgroundColor,
    }));
    verif(
      `${largeur} px : ligne d'équipe — aucun soulignement, ni au repos ni au survol ; l'encadré s'allume seul`,
      equipeRepos === "none" &&
        equipeSurvol.trait === "none" &&
        blancCinq(equipeSurvol.fond),
      `repos ${equipeRepos} · survol ${equipeSurvol.trait} · fond ${equipeSurvol.fond}`
    );

    //  L'ADRESSE (elle SORT du site) : repos nu, trait au survol aux
    //  valeurs de la 271 — et aucun encadré sur la fiche du lieu.
    const adresse = salon.page.locator('a[href*="google.com/maps"]').first();
    const adresseRepos = await adresse.evaluate((a) => {
      const span = a.querySelector('[class*="underline"]');
      return getComputedStyle(span).textDecorationLine;
    });
    await adresse.hover();
    await salon.page.waitForTimeout(250);
    const adresseSurvol = await adresse.evaluate((a) => {
      const span = a.querySelector('[class*="underline"]');
      const s = getComputedStyle(span);
      return {
        trait: s.textDecorationLine,
        epaisseur: s.textDecorationThickness,
        decalage: s.textUnderlineOffset,
        couleur: s.textDecorationColor,
        fond: getComputedStyle(a).backgroundColor,
      };
    });
    verif(
      `${largeur} px : l'adresse — rien au repos, le trait de la 271 au survol (1px · 4px · gris doux), aucun encadré`,
      adresseRepos === "none" &&
        adresseSurvol.trait === "underline" &&
        adresseSurvol.epaisseur === "1px" &&
        adresseSurvol.decalage === "4px" &&
        adresseSurvol.couleur === GRIS_DOUX &&
        (adresseSurvol.fond === "rgba(0, 0, 0, 0)" ||
          adresseSurvol.fond === "transparent"),
      `${adresseRepos} → ${adresseSurvol.trait} · ${adresseSurvol.epaisseur} · ${adresseSurvol.decalage} · ${adresseSurvol.couleur} · fond ${adresseSurvol.fond}`
    );
  } catch (erreur) {
    nonJoue(
      `fiche du salon (${largeur} px)`,
      `la démonstration n'a pas répondu — ${String(erreur).slice(0, 110)}`
    );
  } finally {
    await salon.fermer();
  }
}

nonJoue(
  "les états « ouvert » et « fermé » à l'écran",
  "la démonstration ne porte qu'un booking (Camille Fauve, « délai · " +
    "3 mois ») : les deux autres états sont prouvés PAR LA SOURCE — " +
    "l'icône est écrite UNE fois, hors de tout ternaire d'état, aucune " +
    "variante n'est possible ; le vivant des trois états revient à une " +
    "fiche réelle qui les déclarera"
);

process.exit(bilan());
