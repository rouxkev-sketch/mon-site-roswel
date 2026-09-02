import { COULEURS_SOMBRE, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";

/**
 * ██ nº 817 — L'HABILLAGE DES COURRIELS DU SITE, ÉCRIT UNE FOIS ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : les cinq courriels que le site envoie
 * (le message de contact reçu par l'administration, le style accepté
 * ou refusé, la convention acceptée ou refusée) partaient en TEXTE NU.
 * Ils prennent la charte du site — le logo, le bouton d'action dans
 * le rouge de la marque, un pied de page sobre — et ils la prennent
 * ICI, tous les cinq : un seul gabarit, cinq contenus.
 *
 * CE QUE C'EST : une fonction qui reçoit un titre, des paragraphes, une
 * action facultative et une note, et rend LES DEUX VERSIONS du
 * courriel — le HTML habillé et le texte nu (les clients qui ne lisent
 * pas le HTML, et le journal de l'envoi simulé). Le texte est celui
 * qui partait avant : rien n'y change.
 *
 * ⚠️ DU HTML D'E-MAIL, PAS DU HTML DE PAGE — et c'est toute la
 * difficulté : Gmail et Outlook ignorent les feuilles de style, une
 * partie des propriétés modernes, et Outlook (moteur Word) ignore
 * `max-width` et les coins arrondis. D'où :
 *  · des TABLES (`role="presentation"`) pour la mise en page, jamais
 *    de flex ni de grid ;
 *  · des STYLES EN LIGNE sur chaque élément, plus les attributs HTML
 *    équivalents là où un client les préfère (`bgcolor`, `width`,
 *    `align`) ;
 *  · le BOUTON « à l'épreuve des balles » : une cellule de table au fond
 *    rouge, et le lien dedans — Outlook peint la cellule même quand il
 *    ne sait rien du lien ;
 *  · la largeur de 560 px tenue par un commentaire conditionnel pour
 *    Outlook (`<!--[if mso]>`) et par `max-width` pour les autres ;
 *  · des polices système (Arial, Helvetica) — aucune police chargée ;
 *  · les couleurs de la charte, en dur dans le HTML (les jetons de
 *    COULEURS_SOMBRE : ce sont les mêmes valeurs, lues ici, jamais
 *    recopiées).
 * LE FOND EST SOMBRE, COMME LE SITE : le logo (`yokofolio-logo.png`)
 * est un mot blanc et un cœur rouge sur fond transparent — sur un
 * courriel blanc il disparaîtrait. `color-scheme: dark` prévient les
 * clients qui inversent les couleurs.
 * ⚠️ LE LOGO EST CHARGÉ DEPUIS LE SITE (adresse absolue) : un courriel
 * n'embarque pas d'image. C'est le fichier officiel de `public/`,
 * jamais une copie.
 *
 * ⚠️ LES TROIS COURRIELS DE SUPABASE (confirmation d'inscription, mot de
 * passe, changement d'adresse) NE PASSENT PAS ICI : Supabase les envoie
 * lui-même, depuis ses gabarits. Ils portent LE MÊME HABILLAGE, écrit
 * pour être collé dans son tableau de bord —
 * docs/GABARITS-SUPABASE-HTML.md. Les deux écritures se ressemblent
 * au caractère près : si l'une change, l'autre doit suivre.
 */

export type ActionCourriel = {
  /** Le mot du bouton. */
  libelle: string;
  /** L'adresse absolue qu'il ouvre. */
  url: string;
};

export type ContenuCourriel = {
  /** Le titre du courriel, en tête de la carte. */
  titre: string;
  /** Les paragraphes, en texte nu : les retours à la ligne sont
      gardés, tout le reste est échappé. */
  paragraphes: string[];
  /** Le bouton rouge, s'il y a un geste à faire. */
  action?: ActionCourriel | null;
  /** La ligne grise sous le bouton (« If you didn't ask for this… »). */
  note?: string | null;
};

export type CourrielHabille = {
  html: string;
  texte: string;
};

/** Les cinq caractères que le HTML ne doit jamais lire tels quels. */
export function echapperHtml(texte: string): string {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Le texte de la charte, blanc ; le texte doux, gris. */
const POLICE = "Arial, Helvetica, sans-serif";
const TEXTE = "#F2F2F4";
const TEXTE_DOUX = "#A8A8B0";

/** Un paragraphe du corps : 15 px, interligne 23. */
function paragraphe(texte: string): string {
  return (
    `<p style="margin:0 0 14px 0;font-family:${POLICE};font-size:15px;line-height:23px;color:${TEXTE};">` +
    echapperHtml(texte).replaceAll("\n", "<br>") +
    "</p>"
  );
}

/**
 * LE COURRIEL HABILLÉ — HTML et texte.
 * `site` : l'adresse absolue du site (le logo, le pied de page). Elle
 * vient de `adresseDuSite()` — la même que celle des liens des
 * courriels — et peut être passée pour un banc.
 */
export function habillerCourriel(
  contenu: ContenuCourriel,
  site: string = adresseDuSite()
): CourrielHabille {
  const domaine = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const fond = COULEURS_SOMBRE.fond;
  const carte = COULEURS_SOMBRE.carte;
  const rouge = COULEURS_SOMBRE.primaire;

  const bouton = contenu.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td bgcolor="${rouge}" style="background-color:${rouge};border-radius:999px;">
                <a href="${echapperHtml(contenu.action.url)}" style="display:inline-block;padding:13px 28px;font-family:${POLICE};font-size:14px;line-height:18px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:999px;">${echapperHtml(contenu.action.libelle)}</a>
              </td>
            </tr>
          </table>`
    : "";
  const note = contenu.note
    ? `<p style="margin:16px 0 0 0;font-family:${POLICE};font-size:13px;line-height:20px;color:${TEXTE_DOUX};">${echapperHtml(contenu.note).replaceAll("\n", "<br>")}</p>`
    : "";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${echapperHtml(contenu.titre)}</title>
</head>
<body style="margin:0;padding:0;background-color:${fond};" bgcolor="${fond}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${fond}" style="background-color:${fond};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="left" style="padding:0 4px 24px 4px;">
              <a href="${echapperHtml(site)}" style="text-decoration:none;">
                <img src="${echapperHtml(site)}${MARQUE_YOKOFOLIO.logo}" width="170" alt="${MARQUE_YOKOFOLIO.nom}" style="display:block;border:0;outline:none;width:170px;height:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${carte}" style="background-color:${carte};border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:${POLICE};font-size:22px;line-height:28px;font-weight:bold;color:${TEXTE};">${echapperHtml(contenu.titre)}</h1>
              ${contenu.paragraphes.map(paragraphe).join("\n              ")}
              ${bouton}
              ${note}
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 4px 0 4px;font-family:${POLICE};font-size:12.5px;line-height:18px;color:${TEXTE_DOUX};">
              ${MARQUE_YOKOFOLIO.nom} &middot; <a href="${echapperHtml(site)}" style="color:${TEXTE_DOUX};text-decoration:none;">${echapperHtml(domaine)}</a>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  const texte = [
    contenu.titre,
    ...contenu.paragraphes,
    contenu.action ? `${contenu.action.libelle}: ${contenu.action.url}` : "",
    contenu.note ?? "",
    `— ${MARQUE_YOKOFOLIO.nom}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, texte };
}
