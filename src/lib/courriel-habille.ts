import { COULEURS_SOMBRE, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";

/**
 * ██ nº 817 — L'HABILLAGE DES COURRIELS DU SITE, ÉCRIT UNE FOIS ██
 * ==================================================================
 * LE DÉFAUT D'ORIGINE : les courriels que le site envoie partaient en
 * TEXTE NU. Ils prennent la charte — le logotype, le bouton d'action
 * dans le rouge de la marque, un pied de page sobre — et ils la
 * prennent ICI, tous : un seul gabarit, plusieurs contenus.
 *
 * CE QUE C'EST : une fonction qui reçoit un titre, des paragraphes, une
 * action facultative et une note, et rend LES DEUX VERSIONS du
 * courriel — le HTML habillé et le texte nu (les clients qui ne lisent
 * pas le HTML, et le journal de l'envoi simulé).
 *
 * LES SEPT COURRIELS QUI PASSENT ICI : le message de contact reçu par
 * l'administration, le style accepté, le style refusé, la convention
 * acceptée, la convention refusée, le compte en cours de suppression,
 * le portfolio en cours de suppression.
 * ⚠️ LES TROIS COURRIELS DE SUPABASE (confirmation d'inscription, mot de
 * passe, changement d'adresse) NE PASSENT PAS ICI : Supabase les envoie
 * lui-même, depuis ses gabarits. Ils portent LE MÊME HABILLAGE, écrit
 * pour être collé dans son tableau de bord —
 * docs/GABARITS-SUPABASE-HTML.md, qui est FABRIQUÉ à partir d'ici : les
 * deux ne peuvent pas diverger. Sept plus trois : les dix courriels.
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
 *  · des polices système (Arial, Helvetica) — aucune police chargée.
 *
 * ██ §1 (nº 825) — LE COURRIEL EST CLAIR, ET C'EST LA VRAIE RÉPONSE ██
 * ==================================================================
 * TROIS PASSES ONT ESSAYÉ DE GARDER UN COURRIEL SOMBRE, et il faut
 * savoir pourquoi elles ont échoué, sinon quelqu'un recommencera :
 *  · nº 822 — VERROUILLER LES COULEURS (`color-scheme: only dark`, des
 *    `!important` partout, une feuille sous `prefers-color-scheme`, les
 *    sélecteurs d'Outlook.com). Le propriétaire a vérifié : GMAIL
 *    IGNORE TOUT ÇA. Son inversion ne se désactive pas ;
 *  · nº 823 — SURVIVRE À L'INVERSION en n'employant que ce qu'elle ne
 *    touche pas : le cœur (une image) et le nom ÉCRIT EN TEXTE. Ça
 *    tenait, mais le propriétaire perdait SA typographie ;
 *  · nº 824 — LE LOGOTYPE SUR UNE PLAQUE QUI EST UNE IMAGE. Ça tenait
 *    aussi, mais au prix d'une image de service et d'un bouton dont le
 *    rouge avait dû quitter le milieu de l'échelle.
 *
 * LA DÉCISION DU PROPRIÉTAIRE (nº 825) : ARRÊTER DE LUTTER. C'est le
 * FOND SOMBRE qui causait tout — un client qui l'inverse produit un
 * clair sale, et chaque parade coûtait quelque chose. Le courriel passe
 * donc en CLAIR, comme le font Instagram ou Stripe : un client en mode
 * sombre en tire alors un SOMBRE PROPRE, ce qui est le sens naturel de
 * sa transformation. Le site, lui, ne change pas : il reste sombre.
 * C'est le courriel qui a sa palette, et elle est définie plus bas.
 *
 * CE QUE ÇA PERMET DE RETIRER, et c'est le point 4 de la passe : les
 * quatre couches anti-inversion n'ont plus d'objet. Sont partis les
 * deux `meta` `color-scheme`, la feuille de style de l'en-tête (avec
 * ses règles `prefers-color-scheme` et `[data-ogsc]`), les classes
 * `yf-*` qui ne servaient que de prise pour elles, et TOUS les
 * `!important` qui n'existaient que pour résister à Gmail. Le HTML
 * est d'autant plus léger.
 *
 * CE QUE LE BANC MESURE, SUR LES DIX (contrastes WCAG lus dans les
 * pixels d'une capture ; la transformation est faite au canevas en
 * epargnant les rectangles d'image, et l'on en essaie DEUX, les
 * clients n'employant pas tous la meme) :
 *
 *                        titre  texte  bouton  pied
 *   clair                 19,2   19,2    4,8    5,4
 *   inversion franche     18,5   18,5   13,9    7,1
 *   bascule de clarte     18,2   18,2    4,9    6,7
 *
 * Seuils AA : 4,5 pour du texte courant, 3 pour du grand texte gras.
 * Tout passe DANS LES TROIS SENS — et c'est la difference avec les
 * trois passes precedentes : ce n'est plus une parade qui tient, c'est
 * le sens naturel de la transformation.
 *
 * LE POIDS, l'autre raison de la passe : le propriétaire voyait Gmail
 * COUPER ses courriels (les trois points, vers 102 Ko). Mesuré, chacun
 * des dix pèse entre 2,4 et 3,4 Ko — TRENTE FOIS sous le seuil. Le
 * gabarit n'y était donc pour rien ; il a quand même maigri (les
 * gabarits Supabase passent de 5 450 à 3 017 octets, −45 %) parce que
 * les couches anti-inversion n'avaient plus d'objet. Si la coupure
 * revient, la chercher AILLEURS que dans ce fichier.
 *
 * ⚠️ CE QUE LE CLAIR NE RÈGLE PAS, ET IL FAUT LE SAVOIR : une IMAGE ne
 * s'inverse chez personne. Le logotype à mot NOIR est parfait sur le
 * courriel clair ; si un client retourne le courriel en sombre, le mot
 * reste noir sur un fond devenu sombre — seul le cœur, rouge et de
 * clarté moyenne, se lit encore. Le remède, si le propriétaire le veut
 * un jour, est celui des marques qui envoient clair : un logotype dont
 * le MOT est d'une couleur MOYENNE (le rouge de la marque, par
 * exemple), qui se lit sur les deux fonds. C'est une image à FOURNIR —
 * le dépôt interdit d'en fabriquer une (règle nº 356).
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

const POLICE = "Arial, Helvetica, sans-serif";

/**
 * ██ LA PALETTE DU COURRIEL — CLAIRE, ET À ELLE ██
 * Le site est sombre ; le courriel ne l'est plus (voir le §1 de la
 * nº 825). Ces valeurs ne sont donc PAS celles de `COULEURS_SOMBRE`,
 * et ce n'est pas un oubli : un courriel clair est ce qu'un client en
 * mode sombre sait retourner proprement.
 * Seul le ROUGE est commun aux deux — c'est la marque.
 */
/** Le fond de la page : un blanc cassé, très légèrement bleuté. */
const FOND = "#F5F6F8";
/** La carte : blanc franc, posée sur le fond cassé. */
const CARTE = "#FFFFFF";
/** Le trait qui détache la carte du fond — un cheveu, pas un cadre. */
const TRAIT = "#E6E8EC";
/** Le texte courant et les titres : le bleu nuit du site, qui se lit
    ici comme un noir (19,2:1 sur la carte). */
const TEXTE = "#0B0F14";
/** Le texte discret : le pied de page et la note sous le bouton
    (5,8:1 sur la carte — au-dessus du seuil pour du petit texte). */
const TEXTE_DOUX = "#5F6670";
/**
 * LE BLANC DU LIBELLÉ DU BOUTON — cassé exprès (nº 824, gardé) : les
 * moteurs qui n'inversent que le blanc PUR le laissent passer. Ne pas
 * le « corriger » en `#FFFFFF`.
 */
const BLANC_CASSE = "#FEFEFE";

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
 * `site` : l'adresse absolue du site (le logotype, le pied de page).
 * Elle vient de `adresseDuSite()` — la même que celle des liens des
 * courriels — et peut être passée pour un banc.
 */
export function habillerCourriel(
  contenu: ContenuCourriel,
  site: string = adresseDuSite()
): CourrielHabille {
  const domaine = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  //  LE ROUGE DU BOUTON : la primaire, pleine (`#E11144`). La nº 824
  //  l'avait assombrie pour survivre à l'inversion d'un courriel
  //  sombre ; le courriel est clair, la raison a disparu.
  const rouge = COULEURS_SOMBRE.primaire;

  const bouton = contenu.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td bgcolor="${rouge}" style="background-color:${rouge};border-radius:999px;">
                <a href="${echapperHtml(contenu.action.url)}" style="display:inline-block;padding:13px 28px;font-family:${POLICE};font-size:14px;line-height:18px;font-weight:bold;color:${BLANC_CASSE};text-decoration:none;border-radius:999px;">${echapperHtml(contenu.action.libelle)}</a>
              </td>
            </tr>
          </table>`
    : "";
  const note = contenu.note
    ? `<p style="margin:16px 0 0 0;font-family:${POLICE};font-size:13px;line-height:20px;color:${TEXTE_DOUX};">${echapperHtml(contenu.note).replaceAll("\n", "<br>")}</p>`
    : "";

  //  ⚠️ LE LOGOTYPE N'A PAS DE HAUTEUR IMPOSÉE, et c'est voulu : le
  //  fichier à mot noir est fourni par le propriétaire, et on ne
  //  connaît pas ses proportions exactes. Une largeur et `height:auto`
  //  ne déforment rien, quel que soit son export.
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${echapperHtml(contenu.titre)}</title>
</head>
<body style="margin:0;padding:0;background-color:${FOND};" bgcolor="${FOND}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FOND}" style="background-color:${FOND};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="left" style="padding:0 0 20px 0;line-height:0;">
              <a href="${echapperHtml(site)}" style="text-decoration:none;"><img src="${echapperHtml(site)}${MARQUE_YOKOFOLIO.logoNoir}" width="170" alt="${MARQUE_YOKOFOLIO.nom}" style="display:block;border:0;outline:none;width:170px;height:auto;"></a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${CARTE}" style="background-color:${CARTE};border:1px solid ${TRAIT};border-radius:16px;padding:32px 28px;">
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
