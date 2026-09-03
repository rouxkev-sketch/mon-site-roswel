import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";

/**
 * ██ nº 817 — L'HABILLAGE DES COURRIELS DU SITE, ÉCRIT UNE FOIS ██
 * ==================================================================
 * LE DÉFAUT D'ORIGINE : les courriels que le site envoie partaient en
 * TEXTE NU. Ils prennent la charte — le logotype, un lien d'action, un
 * pied de page sobre — et ils la prennent ICI, tous : un seul gabarit,
 * plusieurs contenus.
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
 *    aussi, mais tout le reste du courriel restait sombre, donc
 *    inversé.
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
 * ██ §1 (nº 826) — LA TÊTE, LA CARTE ET L'ACTION ██
 * ==================================================================
 * Trois retouches du propriétaire sur le courriel clair :
 *
 * 1. LA CARTE N'A PLUS DE CONTOUR. Le cheveu gris de la nº 825 est
 *    retiré : le blanc franc suffit à la détacher du blanc cassé.
 *
 * 2. LE LOGOTYPE OFFICIEL EST REVENU, SUR SA PLAQUE (le montage de la
 *    nº 824, reposé sur un courriel clair). Le mot du logotype est
 *    BLANC : il lui faut un fond sombre, et ce fond ne peut pas être
 *    une COULEUR — une couleur, l'inversion la retourne. C'est donc
 *    une IMAGE (`plaque-courriel.png`), et une image ne s'inverse chez
 *    personne : la plaque reste sombre dans tous les modes, le
 *    logotype lisible dessus, le courriel clair tout autour.
 *    ⚠️ C'est ce qui rend inutile un logotype à mot noir : la nº 825
 *    en attendait un, la nº 826 n'en a plus besoin. `logoNoir` a
 *    disparu de la marque avec cette passe.
 *    ⚠️ SI LES IMAGES SONT BLOQUÉES, ni la plaque ni le logotype ne
 *    s'affichent. La cellule porte donc un repli complet : sa couleur
 *    de fond est celle de la plaque, et son texte est blanc et gras —
 *    le `alt` (« YokoFolio ») se lit alors sur le sombre.
 *
 * 3. L'ACTION EST UN LIEN TEXTE, plus un badge rouge. Même libellé,
 *    sans soulignement, dans le bleu des liens d'action — mais dans sa
 *    version pour FOND CLAIR (voir `LIEN_ACTION` plus bas : le bleu du
 *    site est fait pour du sombre et ne vaudrait que 2,4:1 ici).
 *
 * CE QUE LE BANC MESURE, SUR LES DIX (contrastes WCAG lus dans les
 * pixels d'une capture ; la transformation est faite au canevas en
 * epargnant les rectangles d'image — LA PLAQUE COMPRISE, puisqu'elle
 * en est une — et l'on en essaie DEUX, les clients n'employant pas
 * tous la meme) :
 *
 *                        mot   coeur  titre  texte  lien   pied
 *   clair               18,9    4,0    19,2   19,2   5,6    5,4
 *   inversion franche   18,9    4,0    18,5   18,5   9,1    7,1
 *   bascule de clarte   18,9    4,0    18,2   18,2   4,8    6,7
 *
 * Seuils AA : 4,5 pour du texte courant, 3 pour du grand texte gras.
 * Tout passe DANS LES TROIS SENS. LE MOT ET LE CŒUR DU LOGOTYPE NE
 * BOUGENT PAS D'UN DIXIÈME entre les trois : ce n'est pas une
 * coïncidence, c'est la démonstration — deux couches d'image l'une sur
 * l'autre, rien à recalculer. Le lien, lui, s'inverse avec sa carte et
 * garde son contraste (4,8 au pire).
 *
 * LE POIDS : le propriétaire voyait Gmail COUPER ses courriels (les
 * trois points, vers 102 Ko). Mesuré, chacun des dix pèse moins de
 * 4 Ko — VINGT-CINQ FOIS sous le seuil. Le gabarit n'y est pour rien ;
 * si la coupure revient, la chercher AILLEURS que dans ce fichier.
 */
export type ActionCourriel = {
  /** Le mot du lien. */
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
  /** Le lien d'action, s'il y a un geste à faire. */
  action?: ActionCourriel | null;
  /** La ligne grise sous le lien (« If you didn't ask for this… »). */
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
 * mode sombre sait retourner proprement. La seule couleur du site qui
 * reste employée telle quelle est celle de la PLAQUE, et pour cause :
 * c'est le fond sur lequel le logotype officiel est dessiné.
 */
/** Le fond de la page : un blanc cassé, très légèrement bleuté. */
const FOND = "#F5F6F8";
/** La carte : blanc franc, posée sur le fond cassé. */
const CARTE = "#FFFFFF";
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
/**
 * LA PLAQUE DE LA TÊTE (revenue de la nº 824 à la nº 826) : un carré de
 * 16 px du bleu nuit du site, qui se répète derrière le logotype.
 * Étant une IMAGE, elle ne s'inverse chez personne — c'est tout son
 * intérêt : le logotype officiel, dont le mot est BLANC, garde un fond
 * sombre quel que soit le mode du lecteur, alors même que le courriel
 * autour est clair.
 * ⚠️ Ce n'est PAS une image de marque et ce n'est la variante de rien :
 * un rectangle d'une seule couleur. La règle nº 356 n'est pas en jeu —
 * aucun pixel du logotype n'est touché, il est posé PAR-DESSUS.
 */
const PLAQUE = "/plaque-courriel.png";
/** Le fond de la plaque, et le repli si l'image ne se charge pas. */
const PLAQUE_FOND = "#0B0F14";
/**
 * ██ LE BLEU DU LIEN D'ACTION — CELUI D'UN FOND CLAIR ██
 * Le site emploie `#7FA9EE` pour ses liens d'action. Ce bleu est fait
 * pour LE FOND SOMBRE du site, où il vaut 8,1:1 ; SUR LA CARTE BLANCHE
 * DU COURRIEL IL NE VAUT QUE 2,4:1 — et 2,0:1 une fois le courriel
 * inversé. Il y serait illisible.
 * Celui-ci est son homologue pour fond clair : MÊME TEINTE (217°) et
 * MÊME SATURATION (0,77), seule la clarté descend (0,72 → 0,47). Il
 * vaut 5,6:1 sur la carte, 4,6:1 sous une bascule de clarté et 9,1:1
 * sous une inversion franche — au-dessus du seuil AA dans les trois
 * sens, ce qu'aucun bleu plus clair ne fait.
 */
const LIEN_ACTION = "#1C62D4";

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
  //  L'ACTION EST UN LIEN TEXTE (nº 826), plus un badge : le bouton
  //  rouge a disparu, le libellé ne change pas, et il n'est pas
  //  souligné — c'est sa couleur qui le désigne.
  const bouton = contenu.action
    ? `<p style="margin:24px 0 0 0;font-family:${POLICE};font-size:15px;line-height:23px;"><a href="${echapperHtml(contenu.action.url)}" style="color:${LIEN_ACTION};text-decoration:none;font-weight:bold;">${echapperHtml(contenu.action.libelle)}</a></p>`
    : "";
  const note = contenu.note
    ? `<p style="margin:16px 0 0 0;font-family:${POLICE};font-size:13px;line-height:20px;color:${TEXTE_DOUX};">${echapperHtml(contenu.note).replaceAll("\n", "<br>")}</p>`
    : "";

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
              <a href="${echapperHtml(site)}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="${echapperHtml(site)}${PLAQUE}" bgcolor="${PLAQUE_FOND}" style="background-color:${PLAQUE_FOND};background-image:url('${echapperHtml(site)}${PLAQUE}');background-repeat:repeat;border-radius:12px;padding:10px 14px;font-family:${POLICE};font-size:20px;line-height:33px;font-weight:bold;color:${BLANC_CASSE};">
                    <img src="${echapperHtml(site)}${MARQUE_YOKOFOLIO.logo}" width="170" height="33" alt="${MARQUE_YOKOFOLIO.nom}" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
                </tr></table>
              </a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${CARTE}" style="background-color:${CARTE};border-radius:16px;padding:32px 28px;">
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
