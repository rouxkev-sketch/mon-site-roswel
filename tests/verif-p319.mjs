/**
 * BANC DE LA PASSE Nº 319 — RÉDUIT À CE QUI SURVIT (voir nº 320-§1)
 * ==================================================================
 * ⚠️⚠️ LA MOITIÉ DE CE BANC A ÉTÉ ANNULÉE PAR LE PROPRIÉTAIRE.
 * La nº 319 avait passé « Qui sommes-nous » et « Contact » à la charte
 * du site : jetons de couleur, titres de section de 13 px, traits de
 * séparation, champs sans contour, focus qui éclaircit le fond. Le
 * propriétaire a vu le résultat et l'a REFUSÉ — la nº 320-§1 a tout
 * remis dans la mise en page d'avant, et a inscrit l'exception en
 * commentaire sur les deux pages. Les huit contrôles qui mesuraient
 * cette charte-là n'ont plus d'objet : ils ne sont pas « ratés », leur
 * SUJET a été retiré. Ils sont donc partis d'ici, et ce qui les
 * remplace vit dans `verif-p320.mjs`, qui mesure la mise en page
 * REVENUE — traits absents, contours présents, focus rose, grandes
 * typographies.
 *
 * CE QUI RESTE ICI, ET QUI EST TOUJOURS VRAI : les DEUX SEULES choses
 * que la nº 320 a gardées de la nº 319 —
 *  · LE TEXTE de « Qui sommes-nous », au mot près, gras compris ;
 *  · LES DEUX LIBELLÉS de Contact, dans leur champ.
 * Ces deux mesures-là sont RENDUES, pas retirées : elles sont refaites
 * ci-dessous sur la page telle qu'elle est aujourd'hui.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire.
 */
import {
  BASE,
  bilan,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const { nav, page } = await ouvrirLeNavigateur("p319", {
  width: 1440,
  height: 823,
});

/* ==================================================================
 * LE TEXTE DE « QUI SOMMES-NOUS » — AU MOT PRÈS
 * ================================================================== */
titre("Qui sommes-nous — le texte du propriétaire, au mot près");
{
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });

  const m = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      //  ⚠️ `main p`, ET NON `main section p` : le chapô d'ouverture
      //  vit HORS section depuis que la mise en page d'avant est
      //  revenue (nº 320) — le viser par les sections en perdait un.
      paragraphes: [...main.querySelectorAll("p")].map((p) =>
        p.textContent.trim()
      ),
      gras: [...main.querySelectorAll("strong")].map((n) =>
        n.textContent.trim()
      ),
    };
  });

  const ATTENDUS = [
    "« Yoko » vient du japonais, signifie « couché, sur le côté ». Regarde le cœur rose du logo, il est incliné. « Folio » vient de portfolio : c'est le cœur du site. YokoFolio, c'est un cœur incliné qui t'emmène vers des portfolios.",
    "Un tatouage commence par un style. YokoFolio classe les tatoueurs par style.",
    "Essaie de chercher « du réalisme autour de Lyon » sur Instagram : aucune case ne pose cette question. Ici, c'est précisément celle qu'on te pose.",
    "Choisis un style, une ville et un rayon : les tatoueurs qui correspondent s'affichent, chacun avec un portfolio consacré à son travail dans le style recherché.",
    "YokoFolio ne remplace pas Instagram — il t'y conduit, avec le bon artiste au bout.",
    "Tatoueur ? Crée ton portfolio : un style montré est un style trouvable.",
    "Curieux ? Cherche, et découvre ton prochain tatouage.",
    "Pas d'avis, pas de notes.",
    "Personne ne commente ni ne juge le travail d'un tatoueur ici. Son portfolio parle pour lui. À toi de te faire ton avis.",
  ];
  //  ⚠️ LES DEUX CARACTÈRES INVISIBLES : l'apostrophe courbe et
  //  l'espace insécable. Les deux côtés passent par ici — sans quoi
  //  deux textes identiques à l'œil se déclarent différents.
  const nu = (t) =>
    t.replace(/[’']/g, "'").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  const ecarts = ATTENDUS.filter(
    (attendu, rang) => nu(m.paragraphes[rang] ?? "") !== nu(attendu)
  );
  verif(
    "LE TEXTE EST CELUI DU PROPRIÉTAIRE, AU MOT PRÈS — neuf paragraphes, " +
      "zéro écart",
    m.paragraphes.length === ATTENDUS.length && ecarts.length === 0,
    ecarts.length
      ? `écart sur : « ${ecarts[0].slice(0, 60)}… »`
      : "9 paragraphes conformes"
  );
  verif(
    "…et ses QUATRE passages en gras sont là, dans l'ordre",
    nu(m.gras.join(" | ")) ===
      nu(
        "il t'y conduit, avec le bon artiste au bout. | Tatoueur ? | Curieux ? | À toi de te faire ton avis."
      ),
    m.gras.join(" | ")
  );
}

/* ==================================================================
 * LES DEUX LIBELLÉS DE CONTACT — DANS LEUR CHAMP
 * ================================================================== */
titre("Contact — les deux libellés vivent dans leur champ");
{
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForSelector("#contact-nom", { timeout: 20000 });
  const c = await page.evaluate(() => ({
    nom: document.querySelector("#contact-nom").getAttribute("placeholder"),
    email: document.querySelector("#contact-email").getAttribute("placeholder"),
  }));
  verif(
    "le champ du nom affiche « Nom », celui du courriel « E-mail »",
    c.nom === "Nom" && c.email === "E-mail",
    `« ${c.nom} » · « ${c.email} »`
  );
}

await nav.close();
process.exit(bilan());
