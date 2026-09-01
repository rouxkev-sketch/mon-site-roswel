/* eslint-disable @next/next/no-img-element */
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

/**
 * LE LOGO DE YOKOFOLIO
 * ===================
 * DEUX FICHIERS, DÉPOSÉS À LA MAIN par le propriétaire, affichés tels
 * quels : le code ne les fabrique pas, ne les retouche pas, ne les
 * recadre pas. C'est LA règle des images du propriétaire (AGENTS.md),
 * et elle vaut pour toutes.
 *  - public/yokofolio-logo.png  : le logo complet (cœur + nom) ;
 *  - public/yokofolio-icone.png : le cœur seul.
 *
 * (Il fut un composant à part pour ne pas toucher à `Logo.tsx`, qui
 * servait les autres produits ; celui-là est parti à la nº 760. Ce
 * fichier-ci est désormais le seul logo du site.)
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
 * quand le fichier du propriétaire mesurait alors 1663 × 323 — un
 * rapport de 5,149. À 48 px de haut (`lg:h-12`), la barre réservait
 * donc 192 px au logo, puis lui en donnait 247 dès l'image décodée :
 * 55 px de plus du côté GAUCHE.
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
 *  · UNE FRAGILITÉ AVAIT ÉTÉ NOMMÉE, et elle tenait au service worker :
 *    il reconnaissait les logos par leur CHEMIN, or
 *    `/_next/image?url=%2Fyokofolio-logo…` porte le mot « logo » dans
 *    sa REQUÊTE, pas dans son chemin. Le logo tombait donc dans la
 *    branche des fichiers ordinaires, dont le repli, réseau en échec,
 *    était une réponse VIDE — exactement le carré cassé décrit.
 *    ⚠️ CETTE FRAGILITÉ-LÀ N'EXISTE PLUS : le service worker est retiré
 *    à la nº 791. La solution ci-dessous, elle, RESTE — elle valait par
 *    elle-même (ne dépendre d'aucun service), et c'est pour cela
 *    qu'elle survit à la disparition de la cause soupçonnée.
 *
 * LA SOLUTION, ET SON PRINCIPE : ne dépendre D'AUCUN service. Les
 * variantes sont des FICHIERS, posés à côté de l'original
 * (`yokofolio-logo-256.webp` et sa sœur en 512 — la nº 723 a retiré
 * les deux AVIF, voir plus bas) — rien à calculer au vol, rien à
 * mettre en cache, rien qui puisse manquer.
 *
 * ⚠️ CE QUE LE REPLI COUVRE, ET CE QU'IL NE COUVRE PAS — MESURÉ, et
 * non supposé (c'est la leçon de la nº 715). Le `<img>` du fond porte
 * l'ORIGINAL, et il sert quand le navigateur NE SAIT PAS LIRE le
 * WebP : `<picture>` choisit sa source sur le FORMAT annoncé.
 * IL NE COUVRE PAS le fichier absent : un navigateur qui sait lire le
 * WebP prend cette source et n'en change plus, même si elle échoue —
 * vérifié au banc de la nº 716 en coupant les variantes (le logo reste
 * alors vide). Ce n'est pas un trou comparable à celui de la nº 715 :
 * ces fichiers-ci sont des fichiers STATIQUES de `public/`, mis en
 * ligne exactement comme `yokofolio-logo.png` lui-même. S'ils
 * manquaient, l'original manquerait aussi. Le risque de la nº 715
 * était d'une autre nature : un SERVICE qui devait répondre au vol.
 *
 * ⚠️ LA FABRICATION DES VARIANTES NE TOUCHE PAS L'ORIGINAL (règle
 * nº 356/467) : elles sont des fichiers EN PLUS, dérivés de lui.
 * ⚠️ ET ELLES SE REFONT QUAND IL CHANGE — c'est le piège de la nº 763 :
 * le propriétaire a fourni un logo neuf (rouge), les deux WebP ont été
 * refabriqués DEPUIS LUI et vérifiés sans perte (écart 0/255 avec
 * l'original réduit d'autant). Des variantes oubliées auraient montré
 * l'ancien logo dès que `<picture>` prend le WebP — c'est-à-dire
 * presque toujours.
 */
/*  ██ nº 763 — LES DEUX FICHIERS ONT CHANGÉ, CES NOMBRES AUSSI ██
    Le propriétaire a fourni un logo et une icône refaits en rouge. Ces
    constantes ne DÉCRIVENT pas les fichiers, elles les DÉCLARENT (voir
    §4 nº 507 en tête) : les laisser sur les anciennes mesures aurait
    déformé le logo au premier rendu, avant décodage. Elles sont
    RELEVÉES sur les nouveaux fichiers, jamais recopiées d'un ancien.
      logo   1663 × 323 → 1663 × 324   (1 px de plus en hauteur)
      icône   297 × 337 →  285 × 324   (12 px plus étroite, 13 plus basse) */
/** public/yokofolio-logo.png, mesuré : 1663 × 324. */
const NATIF_LOGO = { largeur: 1663, hauteur: 324 };
/** public/yokofolio-icone.png, mesuré : 285 × 324 — il n'est PAS carré. */
const NATIF_ICONE = { largeur: 285, hauteur: 324 };

/**
 * §1 (nº 716, REFAIT nº 723) — LES VARIANTES DU LOGO, ÉCRITES UNE FOIS.
 * Deux largeurs (l'écran ordinaire, puis le double pour les écrans à
 * haute densité). Le logo s'affiche entre 185 et 247 px de large :
 * 512 px couvre donc le double partout.
 * ⚠️ SEUL LE LOGO COMPLET EN A. L'icône (4,6 Ko depuis la nº 763)
 * n'est pas le sujet et garde son chemin d'origine, inchangé.
 *
 * ██ §1 (nº 723) — UN SEUL FORMAT, ET SANS PERTE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : « le grain se voit en ouvrant le fichier
 * directement ». C'était vrai, et c'est MESURÉ (banc de la passe : on
 * rend chaque variante à sa taille et on la compare à l'original réduit
 * d'autant, sur les seuls pixels VISIBLES — le grain du fond
 * transparent ne se voit pas, celui du glyphe si) :
 *
 *     ancien 256.webp  6 470 o   37,6 dB   pire écart 25/255
 *     ancien 512.webp 14 690 o   39,2 dB   pire écart 46/255
 *
 * Un logo n'est pas une photo : c'est un APLAT à contours nets, le cas
 * où la compression avec perte se voit le plus — chaque contour porte
 * son halo.
 *
 * CE QUE LE BALAYAGE A MONTRÉ, ET IL RENVERSE LE CHOIX DE LA nº 716 :
 * le WebP SANS PERTE est à la fois PLUS PROPRE ET PLUS PETIT que le
 * WebP de qualité 95 — 7 156 o contre 8 222 o à 256 px, et un écart de
 * ZÉRO au lieu de 24/255. Sur un aplat, la compression sans perte n'a
 * presque rien à coder ; avec perte, elle invente du bruit là où il n'y
 * a que deux teintes.
 *
 * ⚠️ ET L'AVIF EST RETIRÉ, C'EST LE POINT QUI COMPTE. `<picture>` sert
 * la PREMIÈRE source que le navigateur sait lire : l'AVIF passait donc
 * AVANT le WebP sur Chrome et Safari récents — garder un AVIF avec
 * perte, c'eût été ne rien corriger pour la plupart des visiteurs. Or
 * l'AVIF ne peut pas gagner ici : sans perte il pèse 23 056 o (256) et
 * 53 224 o (512), soit trois fois le WebP sans perte ; avec perte il
 * garde du grain. Un format qui n'est ni plus propre ni plus léger n'a
 * pas de raison d'être servi en premier.
 * ⚠️ AUCUNE COUVERTURE PERDUE : tout navigateur qui lit l'AVIF lit le
 * WebP, plus ancien et plus répandu (Safari 14+, Chrome 32+,
 * Firefox 65+). Et le `<img>` du fond porte toujours l'ORIGINAL en
 * dernier recours, comme depuis la nº 716.
 */
const VARIANTES_LOGO = [{ type: "image/webp", suffixe: "webp" }] as const;

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
  //  alors qu'elle ne l'est pas (285 × 324 depuis la nº 763) : ses deux
  //  appelants la bornent par des classes carrées, `object-contain` la
  //  range dedans et rien ne saute — mais le nombre était faux, et il
  //  n'y a aucune raison de garder un piège chargé pour le prochain
  //  appelant.
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
            d'origine (1663 × 324) vaut 5,133. La largeur suivant la
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
