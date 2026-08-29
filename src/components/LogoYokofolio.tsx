/* eslint-disable @next/next/no-img-element */
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

/**
 * LE LOGO DE YOKOFOLIO
 * ===================
 * DEUX FICHIERS, DÉPOSÉS À LA MAIN par le propriétaire, affichés tels
 * quels : le code ne les fabrique pas, ne les retouche pas, ne les
 * recadre pas — exactement la règle des logos de Roswel (AGENTS.md).
 *  - public/yokofolio-logo.png  : le logo complet (cœur + nom) ;
 *  - public/yokofolio-icone.png : le cœur seul.
 *
 * Composant à part, et non une variante de Logo.tsx : celui-ci sert
 * les autres produits, il ne doit pas changer.
 *
 * `hauteur` est la hauteur d'affichage en pixels ; la largeur suit
 * (`w-auto`). Les attributs width/height réservent la place dès le
 * premier rendu, pour que la barre ne saute pas quand l'image arrive.
 *
 * ██ §4 (nº 507) — CE QUI FAISAIT GLISSER LE BLOC CENTRAL DE LA BARRE
 * AU CLIC SUR LE LOGO ██
 * ==================================================================
 * LA CAUSE, NOMMÉE ET CHIFFRÉE. Ces deux nombres ne DÉCRIVENT pas les
 * fichiers, ils les DÉCLARENT : c'est d'eux que le navigateur tire le
 * rapport d'aspect tant que l'image n'est pas décodée, et donc la
 * place qu'il lui réserve. Ils étaient FAUX : `RATIO_LOGO` valait 4,
 * quand le fichier du propriétaire mesure 1663 × 323 — un rapport de
 * 5,149. À 48 px de haut (`lg:h-12`), la barre réservait donc 192 px
 * au logo, puis lui en donnait 247 dès l'image décodée : 55 px de plus
 * du côté GAUCHE.
 * CE QUE 55 PX DE PLUS À GAUCHE FONT AU MILIEU : le bloc de recherche
 * est centré par DEUX MARGES AUTOMATIQUES (`lg:mx-auto`, EnTeteTatouage)
 * qui se partagent l'espace libre à égalité. Un côté qui grandit de 55
 * mange 27,5 à chaque marge : le bloc part de 27,5 px vers la droite.
 * C'est le glissement que le propriétaire voit.
 * ET POURQUOI AU CLIC SUR LE LOGO, précisément : ce lien est un <a>
 * NATIF, par choix (nº 429/468) — donc une navigation de DOCUMENT. Le
 * document est neuf, l'image est remontée et redécodée : le premier
 * rendu n'a que ces deux nombres à sa disposition. En navigation douce
 * (<Link>), l'image n'est jamais démontée — rien ne bouge, et c'est
 * pourquoi le défaut ne se voit QUE par ce chemin-là.
 * ⚠️ LA RÉSERVE DE LA nº 439 N'EST PAS EN CAUSE, ET N'A PAS ÉTÉ
 * CONTOURNÉE : elle tient le côté DROIT (globe 40 + écart 12 + réserve
 * 40 = le gabarit exact de fanion + « Mon espace »), elle est intacte
 * et elle fait son travail. Le défaut d'aujourd'hui est son symétrique
 * du côté GAUCHE — même famille, autre bord.
 * ⚠️ AUCUNE IMAGE N'EST TOUCHÉE (règle AGENTS.md) : on ne recadre pas,
 * on ne régénère pas, on ne compresse pas. On écrit ce que les
 * fichiers mesurent VRAIMENT, c'est tout.
 * ⚠️ SI LE PROPRIÉTAIRE REMPLACE UN FICHIER, ces deux paires sont LE
 * SEUL endroit à mettre à jour — `sips -g pixelWidth -g pixelHeight`,
 * ou n'importe quel lecteur d'images. Un rapport faux ne se voit pas
 * en régime établi : il ne se paie qu'au chargement, en un glissement.
 *
 * ██ §1 (nº 716) — LE LOGO ALLÉGÉ, PAR DES FICHIERS, PAS PAR UN SERVICE
 * ██ ██
 * ==================================================================
 * CE QUI S'EST PASSÉ À LA nº 715, ET IL FAUT LE DIRE EN PREMIER : le
 * logo était passé par `next/image`, donc par l'optimiseur À LA VOLÉE
 * (`/_next/image?url=…`). Au banc, tout allait — logo net, 139 Ko
 * ramenés à 10. EN LIGNE, il ne s'est pas chargé du tout : carré
 * cassé, sur toutes les pages. Le propriétaire est revenu à la nº 713.
 *
 * CE QUE L'ENQUÊTE DE LA nº 716 A ÉTABLI, ET CE QU'ELLE N'A PAS PU
 * ÉTABLIR — les deux comptent :
 *  · LE BANC NE REPRODUIT PAS LE DÉFAUT. Service worker actif, cinq
 *    chargements, quatre pages : le logo se charge à chaque fois,
 *    aucune réponse en échec. La cause est donc PROPRE À LA
 *    PRODUCTION, hors de portée de l'atelier ;
 *  · UNE FRAGILITÉ EST NOMMÉE, ET ELLE EST RÉELLE : le service worker
 *    reconnaît les logos par leur CHEMIN (`estIcone`, public/sw.js —
 *    « icon | icone | logo »). Or `/_next/image?url=%2Fyokofolio-logo…`
 *    porte le mot « logo » dans sa REQUÊTE, pas dans son chemin : le
 *    logo perdait son traitement « le réseau, toujours » et tombait
 *    dans la branche des fichiers ordinaires — dont le repli, quand le
 *    réseau échoue, est une réponse VIDE (`status: 504`). Une réponse
 *    vide sur une image, c'est exactement le carré cassé décrit.
 *    Que ce soit LA cause ou seulement UNE cause, on ne le saura pas
 *    d'ici : on cesse d'en dépendre.
 *
 * LA SOLUTION, ET SON PRINCIPE : ne dépendre D'AUCUN service. Les
 * variantes sont des FICHIERS, posés à côté de l'original
 * (`yokofolio-logo-256.avif` et ses trois sœurs) — rien à calculer au
 * vol, rien à mettre en cache, rien qui puisse manquer. Leur chemin
 * contient « logo » : le service worker les traite donc comme des
 * logos, ce qui était l'intention depuis toujours.
 *
 * ⚠️ CE QUE LE REPLI COUVRE, ET CE QU'IL NE COUVRE PAS — MESURÉ, et
 * non supposé (c'est la leçon de la nº 715). Le `<img>` du fond porte
 * l'ORIGINAL, et il sert quand le navigateur NE SAIT LIRE NI l'AVIF NI
 * le WebP : `<picture>` choisit sa source sur le FORMAT annoncé.
 * IL NE COUVRE PAS le fichier absent : un navigateur qui sait lire
 * l'AVIF prend la source AVIF et n'en change plus, même si elle
 * échoue — vérifié au banc en coupant les deux variantes (le logo
 * reste alors vide). Ce n'est pas un trou comparable à celui de la
 * nº 715 : ces fichiers-ci sont des fichiers STATIQUES de `public/`,
 * mis en ligne exactement comme `yokofolio-logo.png` lui-même. S'ils
 * manquaient, l'original manquerait aussi. Le risque de la nº 715
 * était d'une autre nature : un SERVICE qui devait répondre au vol.
 *
 * ⚠️ LE FICHIER D'ORIGINE N'EST NI TOUCHÉ, NI REMPLACÉ (règle nº
 * 356/467) : 142 079 octets avant, 142 079 après — vérifié. Les
 * variantes sont des fichiers EN PLUS, fabriqués une fois.
 */
/** public/yokofolio-logo.png, mesuré : 1663 × 323. */
const NATIF_LOGO = { largeur: 1663, hauteur: 323 };
/** public/yokofolio-icone.png, mesuré : 297 × 337 — il n'est PAS carré. */
const NATIF_ICONE = { largeur: 297, hauteur: 337 };

/**
 * §1 (nº 716) — LES VARIANTES DU LOGO, ÉCRITES UNE FOIS.
 * Deux largeurs (l'écran ordinaire, puis le double pour les écrans à
 * haute densité), deux formats modernes. Le logo s'affiche entre 185 et
 * 247 px de large : 512 px couvre donc le double partout.
 * ⚠️ SEUL LE LOGO COMPLET EN A. L'icône (11 Ko) n'est pas le sujet de
 * cette passe et garde son chemin d'origine, inchangé.
 */
const VARIANTES_LOGO = [
  { type: "image/avif", suffixe: "avif" },
  { type: "image/webp", suffixe: "webp" },
] as const;

/** `/yokofolio-logo.png` → `/yokofolio-logo-256.avif`, etc. */
function cheminVariante(suffixe: string, largeur: number): string {
  return `${MARQUE_YOKOFOLIO.logo.replace(/\.png$/, "")}-${largeur}.${suffixe}`;
}

export function LogoYokofolio({
  hauteur = 32,
  classe,
  variante = "complet",
}: {
  hauteur?: number;
  classe?: string;
  /** « icone » = le cœur seul, pour les petits écrans. */
  variante?: "complet" | "icone";
}) {
  const icone = variante === "icone";
  const natif = icone ? NATIF_ICONE : NATIF_LOGO;
  //  §4 (nº 507) — LA LARGEUR DÉCLARÉE SUIT LE FICHIER, PAS UNE
  //  APPROXIMATION. L'icône était déclarée CARRÉE (`largeur = hauteur`)
  //  alors qu'elle mesure 297 × 337 : ses deux appelants la bornent par
  //  des classes carrées, `object-contain` la range dedans et rien ne
  //  saute — mais le nombre était faux, et il n'y a aucune raison de
  //  garder un piège chargé pour le prochain appelant.
  const largeur = Math.round((hauteur * natif.largeur) / natif.hauteur);

  const image = (
    <img
      src={icone ? MARQUE_YOKOFOLIO.icone : MARQUE_YOKOFOLIO.logo}
      alt={MARQUE_YOKOFOLIO.nom}
      width={largeur}
      height={hauteur}
      // Non déplaçable : une image qui se laisse « traîner » avale les
      // clics légèrement glissés quand elle sert de lien (le logo).
      draggable={false}
      className={classe ?? "w-auto"}
      style={{
        height: classe ? undefined : hauteur,
        /*  §2 (nº 716) — LE RAPPORT D'ASPECT EST DÉCLARÉ, PLUS DÉDUIT DE
            L'IMAGE REÇUE. Les variantes ont des tailles ENTIÈRES : la
            256 fait 256 × 50, soit un rapport de 5,120 quand le fichier
            d'origine (1663 × 323) vaut 5,149. La largeur suivant la
            hauteur (`w-auto`), le logo perdait 1,1 px — et le bloc
            central de la barre, centré par deux marges automatiques,
            glissait d'un demi-pixel. C'est le mécanisme de la nº 507 en
            miniature ; on le referme en déclarant le rapport DU FICHIER,
            à partir des deux constantes ci-dessus.
            ⚠️ SANS EFFET QUAND L'APPELANT FIXE LES DEUX CÔTÉS (l'icône
            dans un carré) : `aspect-ratio` ne parle que si une dimension
            vaut `auto`. */
        aspectRatio: `${natif.largeur} / ${natif.hauteur}`,
        objectFit: "contain",
        objectPosition: "left center",
      }}
    />
  );

  //  L'ICÔNE N'A PAS DE VARIANTE (voir VARIANTES_LOGO) : elle sort telle
  //  quelle, exactement comme avant cette passe.
  if (icone) return image;

  /*  §1 (nº 716) — LE LOGO COMPLET : les formats modernes d'abord,
      L'ORIGINAL EN DERNIER RECOURS. Le navigateur prend la première
      source qu'il sait lire ; s'il n'en sait lire aucune — ou si les
      fichiers manquent — c'est le `<img>` ci-dessus qui parle, avec le
      fichier du propriétaire. Aucun scénario ne laisse le logo absent.
      ⚠️ `display: contents` : l'enveloppe ne doit RIEN peser dans la
      mise en page. Sans elle, `<picture>` s'intercalerait entre le lien
      et l'image, et la barre — dont le centrage se joue au pixel
      (nº 507) — n'a pas à connaître ce détail. La sélection de source,
      elle, est faite par l'analyseur du document : le style n'y change
      rien. */
  return (
    <picture style={{ display: "contents" }}>
      {VARIANTES_LOGO.map(({ type, suffixe }) => (
        <source
          key={suffixe}
          type={type}
          srcSet={`${cheminVariante(suffixe, 256)} 1x, ${cheminVariante(suffixe, 512)} 2x`}
        />
      ))}
      {image}
    </picture>
  );
}
