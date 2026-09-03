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
 * LE FOND EST SOMBRE, COMME LE SITE — mais il ne peut PAS le rester
 * chez tout le monde : voir les §1 de la nº 823 et de la nº 824 plus
 * bas, qui disent ce qu'est devenue la tête du courriel pour survivre
 * à l'inversion de Gmail (le logotype officiel sur une PLAQUE qui est
 * elle-même une image).
 * ⚠️ LES IMAGES SONT CHARGÉES DEPUIS LE SITE (adresses absolues) : un
 * courriel n'embarque pas d'image. Le logotype est le fichier officiel
 * de `public/`, jamais une copie.
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

/**
 * ██ §1 (nº 823) — ON NE COMBAT PLUS L'INVERSION, ON Y SURVIT ██
 * ==================================================================
 * CE QUE LA nº 822 A ESSAYÉ, ET POURQUOI ÇA NE SUFFIT PAS. Elle
 * verrouillait les couleurs (les quatre couches décrites plus bas).
 * LE PROPRIÉTAIRE A VÉRIFIÉ DANS GMAIL : son inversion NE PEUT PAS
 * être désactivée — Gmail ignore `color-scheme` et les requêtes de
 * média. Le courriel arrivait donc clair, et le logo devenait
 * invisible.
 *
 * LA CAUSE, RELEVÉE DANS LES PIXELS DES DEUX FICHIERS OFFICIELS (une
 * lecture, aucune écriture) :
 *  · `yokofolio-icone.png` — 99 % de ses pixels visibles portent le
 *    rouge de la marque. Une seule couleur, et une couleur MOYENNE :
 *    4,8:1 sur du blanc, 4,0:1 sur le bleu nuit. Ce cœur se lit sur
 *    les deux fonds, sans rien lui faire ;
 *  · `yokofolio-logo.png` — le même cœur (43 %) PLUS le mot, qui est
 *    du BLANC PUR (22 % des pixels visibles) sur du transparent. Sur
 *    un fond redevenu clair, le mot n'a plus aucun contraste : c'est
 *    LUI qui disparaissait, pas le cœur.
 *
 * LA RÈGLE : le courriel doit rester lisible AVEC OU SANS inversion.
 * Ce qui la traverse sans dommage, ce sont deux choses :
 *  · LES IMAGES — aucun client ne les inverse, ni celles d'une balise
 *    `img` ni celles d'un FOND DE CELLULE (`background-image`) ; une
 *    image est une trame de pixels, pas une couleur à recalculer ;
 *  · LE TEXTE — il s'inverse AVEC son fond, donc leur contraste est
 *    conservé quoi qu'il arrive.
 *
 * ██ §1 (nº 824) — LE LOGOTYPE COMPLET, SUR UNE PLAQUE D'IMAGE ██
 * ==================================================================
 * CE QUE LA nº 823 AVAIT FAIT, ET POURQUOI ON VA PLUS LOIN : elle
 * avait remplacé le logotype par le CŒUR (image) plus le nom ÉCRIT EN
 * TEXTE. Ça survivait, mais le propriétaire perdait SA typographie.
 *
 * CE QUI NE MARCHE PAS, ET IL FAUT LE SAVOIR AVANT DE LIRE LA SUITE :
 *  · CHOISIR L'IMAGE SELON LE FOND (une version blanche, une noire,
 *    et `prefers-color-scheme` ou `picture` pour trancher) — il
 *    faudrait que le client DISE dans quel mode il est. Gmail ne le
 *    dit pas : c'est exactement ce que le propriétaire a constaté ;
 *  · UNE PLAQUE POSÉE EN COULEUR DE FOND (`bgcolor`) — une couleur,
 *    l'inversion la retourne. Une plaque sombre devient claire et le
 *    mot blanc disparaît de nouveau : la plaque ne protège rien.
 *
 * CE QUI MARCHE : QUE LA PLAQUE SOIT ELLE-MÊME UNE IMAGE. La cellule
 * de la tête porte `plaque-courriel.png` en FOND — un carré de 16 px
 * d'une seule couleur, le bleu nuit du site, qui se répète. Étant une
 * image, elle ne s'inverse jamais ; le logotype officiel est posé
 * DESSUS, tel quel. Les deux couches sont donc invariantes, et la
 * tête a exactement le même aspect dans les deux modes.
 * ⚠️ `plaque-courriel.png` N'EST PAS UNE IMAGE DE MARQUE et n'est la
 * variante de RIEN : c'est un rectangle d'une seule couleur. La règle
 * nº 356 n'est pas en jeu — aucun pixel du logo n'a été touché,
 * recadré ni recoloré ; l'image officielle est posée par-dessus.
 * ⚠️ SI LES IMAGES SONT BLOQUÉES (Gmail le fait pour un expéditeur
 * inconnu), ni la plaque ni le logotype ne s'affichent : il reste le
 * `alt` du logotype, du TEXTE, qui s'inverse avec son fond et reste
 * donc lisible. La dégradation est sûre.
 *
 * CE QUE LE BANC MESURE (contrastes WCAG lus dans les pixels de la
 * capture ; la transformation est faite au canevas en épargnant les
 * rectangles d'image — LA PLAQUE COMPRISE, puisqu'elle en est une —
 * et l'on en essaie DEUX, les clients n'employant pas tous la même) :
 *
 *                        mot   coeur  titre  texte  bouton
 *   tel quel             18,9   4,0   14,8   14,8    6,6
 *   inversion franche    18,9   4,0   14,8   14,8   14,6
 *   bascule de clarte    18,9   4,0   14,5   14,5    5,8
 *
 * LE MOT ET LE CŒUR NE BOUGENT PAS D'UN DIXIÈME entre les trois : ce
 * n'est pas une coïncidence, c'est la démonstration. Deux couches
 * d'image l'une sur l'autre, rien à recalculer. Le banc le vérifie
 * aussi directement : la plaque doit rendre la MÊME couleur dans les
 * trois sens (11,15,20 partout).
 *
 * ██ §2 (nº 824) — LE BOUTON : UN TEXTE CLAIR NE PEUT PAS LE RESTER ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : dans Gmail sombre, le libellé BLANC du
 * bouton devient NOIR sur le rouge — laid.
 * LA CAUSE, ET C'EST UNE IMPOSSIBILITÉ, PAS UN RÉGLAGE : ces moteurs
 * retournent la CLARTÉ (L devient 1 − L). La transformation est
 * monotone — tout ce qui est clair devient sombre. AUCUNE couleur de
 * texte claire ne peut rester claire après elle. (Les seules couleurs
 * invariantes ont une clarté TSL de 0,5 : ni blanches, ni noires.)
 * Un libellé qui reste blanc à coup sûr devrait être une IMAGE — et
 * un bouton d'action qui disparaît quand les images sont bloquées est
 * un défaut plus grave que celui qu'on corrige.
 *
 * LES DEUX PARADES POSÉES, l'une pour chaque famille de moteurs :
 *  1. LE LIBELLÉ N'EST PLUS `#FFFFFF` MAIS `#FEFEFE`. Les moteurs qui
 *     n'inversent que le blanc PUR et le noir PUR (l'inversion dite
 *     partielle, celle d'Outlook.com notamment) laissent passer un
 *     blanc cassé : le libellé reste blanc. C'est la technique que le
 *     propriétaire a proposée ; elle ne coûte rien et elle sert.
 *     ⚠️ ELLE N'EST PAS MESURABLE ICI : elle dépend du moteur du
 *     client, pas du rendu. D'où la seconde parade.
 *  2. LE ROUGE DU BOUTON QUITTE LE MILIEU DE L'ÉCHELLE. C'est là toute
 *     l'affaire : `#E11144` a une clarté TSL de 0,47 — la bascule le
 *     laisse presque sur place, et le libellé devenu noir se retrouve
 *     sur un rouge resté VIF. D'où le « moche ». Le bouton prend donc
 *     `#B80E38` (`primaireFonce`, déjà à la charte), clarté 0,39 : la
 *     bascule l'envoie à 0,61, un corail CLAIR sur lequel un libellé
 *     devenu sombre se lit comme un bouton de thème clair — voulu, et
 *     non plus subi. Et si le moteur laisse passer le blanc cassé, le
 *     libellé reste blanc sur un rouge plus profond : les deux issues
 *     sont bonnes.
 *
 * ██ §1 (nº 822) — LES COULEURS NE DÉPENDENT PLUS DU LECTEUR ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : le courriel s'INVERSE selon le thème du
 * client mail — Gmail en sombre rendait l'e-mail CLAIR (et le logo,
 * blanc sur transparent, devenait invisible), et l'inverse ailleurs.
 * LA CAUSE : un client en mode sombre RECALCULE les couleurs d'un
 * message qu'il croit clair (ou clair-compatible). Le message ne disait
 * pas assez fort qu'il a UN SEUL habillage.
 * CE QU'ON DIT DÉSORMAIS, ET DANS LES QUATRE LANGUES QUE LES CLIENTS
 * PARLENT :
 *  1. `color-scheme: only dark` (méta ET feuille) — « ce courriel n'a
 *     qu'un habillage, ne le recalcule pas ». Apple Mail, iOS et
 *     Outlook récent le respectent ;
 *  2. les couleurs en INLINE avec `!important` — un style en ligne
 *     prioritaire résiste aux réécritures de Gmail ;
 *  3. une feuille dans l'en-tête qui REDIT les mêmes couleurs sous
 *     `@media (prefers-color-scheme: dark)` — Gmail (web et
 *     application) lit cette feuille ;
 *  4. les sélecteurs `[data-ogsc]` / `[data-ogsb]` — les marques
 *     qu'Outlook.com pose sur ce qu'il a retouché : on repasse derrière.
 * Les classes `yf-*` n'existent que pour 3 et 4 : elles ne portent
 * aucune couleur par elles-mêmes, elles servent de prise.
 * ⚠️ CES QUATRE COUCHES RESTENT — elles servent chez ceux qui les
 * lisent (Apple Mail, iOS, Outlook récent), et elles ne coûtent rien.
 * Elles ne sont simplement plus la seule défense : GMAIL LES IGNORE
 * (relevé du propriétaire, nº 823), et c'est le §1 ci-dessus qui tient
 * quand elles ne tiennent pas.
 *
 * Le texte de la charte, blanc ; le texte doux, gris.
 */
const POLICE = "Arial, Helvetica, sans-serif";
const TEXTE = "#F2F2F4";
const TEXTE_DOUX = "#A8A8B0";
/**
 * LA PLAQUE DE LA TÊTE (voir le §1 de la nº 824) : un carré de 16 px
 * du bleu nuit du site, qui se répète derrière le logotype. Étant une
 * IMAGE, elle ne s'inverse jamais — c'est tout son intérêt.
 * ⚠️ Ce n'est PAS une image de marque et ce n'est la variante de rien.
 */
const PLAQUE = "/plaque-courriel.png";
/**
 * LE BLANC DU LIBELLÉ DU BOUTON — cassé exprès (voir le §2 de la
 * nº 824) : les moteurs qui n'inversent que le blanc PUR le laissent
 * passer. Ne pas le « corriger » en `#FFFFFF`.
 */
const BLANC_CASSE = "#FEFEFE";

/** Un paragraphe du corps : 15 px, interligne 23. */
function paragraphe(texte: string): string {
  return (
    `<p class="yf-texte" style="margin:0 0 14px 0;font-family:${POLICE};font-size:15px;line-height:23px;color:${TEXTE} !important;">` +
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
  //  LE ROUGE DU BOUTON : `primaireFonce`, pas `primaire` — c'est le
  //  point 2 de la nº 824. Sa clarté TSL (0,39) est assez basse pour
  //  que la bascule des moteurs sombres l'envoie sur un corail CLAIR,
  //  au lieu de le laisser sur place et d'y coller un libellé noirci.
  const rouge = COULEURS_SOMBRE.primaireFonce;

  const bouton = contenu.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td class="yf-bouton" bgcolor="${rouge}" style="background-color:${rouge} !important;border-radius:999px;">
                <a href="${echapperHtml(contenu.action.url)}" style="display:inline-block;padding:13px 28px;font-family:${POLICE};font-size:14px;line-height:18px;font-weight:bold;color:${BLANC_CASSE} !important;text-decoration:none;border-radius:999px;">${echapperHtml(contenu.action.libelle)}</a>
              </td>
            </tr>
          </table>`
    : "";
  const note = contenu.note
    ? `<p class="yf-doux" style="margin:16px 0 0 0;font-family:${POLICE};font-size:13px;line-height:20px;color:${TEXTE_DOUX} !important;">${echapperHtml(contenu.note).replaceAll("\n", "<br>")}</p>`
    : "";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>${echapperHtml(contenu.titre)}</title>
  <style type="text/css">
    /*  nº 822 — LE THÈME DU LECTEUR NE DÉCIDE PLUS DES COULEURS :
        « only dark » dit aux clients qui savent lire (Apple Mail, iOS,
        Outlook récent) que ce courriel a UN SEUL habillage et qu'il ne
        faut rien recalculer. */
    :root { color-scheme: only dark; supported-color-schemes: only dark; }
    /*  Le mode sombre du client ne doit rien changer : on redit les
        mêmes couleurs, en priorité. */
    @media (prefers-color-scheme: dark) {
      .yf-fond { background-color: ${fond} !important; }
      .yf-carte { background-color: ${carte} !important; }
      .yf-texte, .yf-titre { color: ${TEXTE} !important; }
      .yf-doux, .yf-doux a { color: ${TEXTE_DOUX} !important; }
      .yf-bouton { background-color: ${rouge} !important; }
      .yf-bouton a { color: ${BLANC_CASSE} !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: ${fond} !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: ${carte} !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: ${TEXTE} !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: ${TEXTE_DOUX} !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: ${rouge} !important; }
    [data-ogsc] .yf-bouton a { color: ${BLANC_CASSE} !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:${fond} !important;" bgcolor="${fond}">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${fond}" style="background-color:${fond} !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="${fond}" style="background-color:${fond} !important;padding:0 0 24px 0;">
              <a href="${echapperHtml(site)}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="${echapperHtml(site)}${PLAQUE}" bgcolor="${fond}" style="background-color:${fond};background-image:url('${echapperHtml(site)}${PLAQUE}');background-repeat:repeat;border-radius:12px;padding:10px 14px;line-height:0;">
                    <img src="${echapperHtml(site)}${MARQUE_YOKOFOLIO.logo}" width="170" height="33" alt="${MARQUE_YOKOFOLIO.nom}" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
                </tr></table>
              </a>
            </td>
          </tr>
          <tr>
            <td class="yf-carte" bgcolor="${carte}" style="background-color:${carte} !important;border-radius:16px;padding:32px 28px;">
              <h1 class="yf-titre" style="margin:0 0 18px 0;font-family:${POLICE};font-size:22px;line-height:28px;font-weight:bold;color:${TEXTE} !important;">${echapperHtml(contenu.titre)}</h1>
              ${contenu.paragraphes.map(paragraphe).join("\n              ")}
              ${bouton}
              ${note}
            </td>
          </tr>
          <tr>
            <td class="yf-doux yf-fond" align="left" bgcolor="${fond}" style="background-color:${fond} !important;padding:20px 4px 0 4px;font-family:${POLICE};font-size:12.5px;line-height:18px;color:${TEXTE_DOUX} !important;">
              ${MARQUE_YOKOFOLIO.nom} &middot; <a href="${echapperHtml(site)}" style="color:${TEXTE_DOUX} !important;text-decoration:none;">${echapperHtml(domaine)}</a>
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
