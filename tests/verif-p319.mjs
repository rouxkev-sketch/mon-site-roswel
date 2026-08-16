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
 * CE QUI RESTE ICI : UNE SEULE MESURE, depuis la nº 321.
 * La nº 320 en avait gardé deux — le TEXTE de « Qui sommes-nous », au
 * mot près, et les DEUX LIBELLÉS de Contact. Le texte a été retouché
 * par le propriétaire à la nº 321-§4, et sa mesure a suivi la
 * retouche : elle vit désormais dans `verif-p321.mjs` §4, plus fine
 * qu'ici (voir le bloc explicatif plus bas, là où elle se trouvait).
 * NE RESTENT donc ici que LES DEUX LIBELLÉS DE CONTACT — RENDUS, pas
 * retirés : refaits ci-dessous sur la page telle qu'elle est
 * aujourd'hui.
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
 * LE TEXTE DE « QUI SOMMES-NOUS » — RENDU À LA nº 321
 * ==================================================================
 * ⚠️ CE BLOC MESURAIT LE TEXTE AU MOT PRÈS. IL A CHANGÉ DE MAIN.
 * La nº 321-§4 a apporté TROIS retouches demandées par le
 * propriétaire — un « il » ajouté au premier paragraphe, la consigne
 * « Choisis un style, une ville et un rayon : » passée en gras et en
 * blanc, et la phrase sur Instagram réécrite ET remise en style
 * normal. Les neuf paragraphes recopiés ici étaient donc périmés : pas
 * faux au moment où ils ont été écrits, mais dépassés par une décision.
 *
 * LA MESURE EST RENDUE, PAS RETIRÉE, et elle est même plus fine
 * qu'ici : `verif-p321.mjs` §4 contrôle les neuf paragraphes au mot
 * près, NOMME les trois retouches une à une (le mot ajouté, la graisse
 * et la couleur du gras, le retour au style normal) et déclare
 * séparément que les six autres paragraphes n'ont pas bougé d'un
 * caractère. ELLE VIT LÀ, ET LÀ SEULEMENT : recopier le même texte
 * dans trois bancs, ce sont trois endroits à corriger à la retouche
 * suivante — et deux oubliés.
 *
 * `verif-p320.mjs` garde, lui, le seul contrôle qui soit VRAIMENT le
 * sien : que la page porte toujours neuf paragraphes et quatre gras,
 * c'est-à-dire que la mise en page revenue n'a perdu aucun bloc.
 * ================================================================== */

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
