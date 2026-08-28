import Image from "next/image";
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
 * ██ §1 (nº 715) — LE LOGO PASSE PAR L'OPTIMISEUR, LE FICHIER NE BOUGE
 * ██ PAS D'UN OCTET ██
 * ==================================================================
 * CE QUE L'AUDIT nº 714 A TROUVÉ, ET C'ÉTAIT SON LEVIER Nº 1 :
 * `yokofolio-logo.png` pèse 142 079 octets et partait TEL QUEL sur le
 * réseau, AVANT la première peinture, SUR CHAQUE PAGE — pour être
 * affiché entre 36 et 48 px de haut. Une balise `<img>` nue ne demande
 * rien à personne : le navigateur téléchargeait les 1663 × 323 pixels
 * d'origine pour en peindre 247 × 48.
 *
 * CE QUI CHANGE, ET RIEN D'AUTRE : c'est `next/image` qui sert l'image.
 * L'optimiseur fabrique À LA VOLÉE la variante de la taille demandée,
 * en AVIF (puis WebP en repli, puis l'original) — les formats sont
 * déjà déclarés dans `next.config.ts` depuis la nº 366, pour les
 * photos des cartes ; le logo emprunte le même chemin, il n'y a aucun
 * réglage neuf.
 *
 * ⚠️ LE FICHIER D'ORIGINE N'EST NI TOUCHÉ, NI RECADRÉ, NI RECOMPRESSÉ,
 * NI REMPLACÉ (règle du propriétaire, nº 356/467) : il reste dans
 * `public/`, octet pour octet, et c'est LUI la source. L'optimiseur
 * n'en tire que des copies temporaires, en cache. Retirer ces lignes
 * rendrait exactement l'ancien comportement.
 *
 * ⚠️ LA NETTETÉ EST GARANTIE AUX DEUX DENSITÉS, et c'est la raison des
 * deux nombres `width`/`height` : à largeur FIXE (le cas ici — la
 * hauteur commande, la largeur suit), `next/image` fabrique un jeu
 * 1× / 2× à partir de `width`. À 48 px de haut, la largeur déclarée
 * vaut 247 : le navigateur reçoit donc 256 px sur un écran ordinaire
 * et 512 px sur un écran à haute densité (les deux paliers existent
 * déjà dans `imageSizes`). Un iPhone reçoit 512 px de large pour en
 * peindre 185 — plus du double, donc net, sans payer les 1663 px de
 * l'original.
 *
 * ⚠️ `loading="eager"` ET PAS `priority`, ET C'EST DÉLIBÉRÉ. Une
 * `<img>` nue charge sans attendre : `eager` garde EXACTEMENT ce
 * moment-là, pour que rien ne paraisse plus tard qu'avant. `priority`,
 * lui, aurait ajouté une demande de préchargement en tête du chemin
 * critique — l'inverse de ce que la nº 715 cherche.
 */
/** public/yokofolio-logo.png, mesuré : 1663 × 323. */
const NATIF_LOGO = { largeur: 1663, hauteur: 323 };
/** public/yokofolio-icone.png, mesuré : 297 × 337 — il n'est PAS carré. */
const NATIF_ICONE = { largeur: 297, hauteur: 337 };

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

  return (
    <Image
      src={icone ? MARQUE_YOKOFOLIO.icone : MARQUE_YOKOFOLIO.logo}
      alt={MARQUE_YOKOFOLIO.nom}
      width={largeur}
      height={hauteur}
      //  §1 (nº 715) — le moment de chargement d'une `<img>` nue, gardé
      //  tel quel : voir la note de l'en-tête (surtout pas `priority`).
      loading="eager"
      // Non déplaçable : une image qui se laisse « traîner » avale les
      // clics légèrement glissés quand elle sert de lien (le logo).
      draggable={false}
      className={classe ?? "w-auto"}
      style={{
        height: classe ? undefined : hauteur,
        /*  ██ §2 (nº 715) — LE RAPPORT D'ASPECT EST DÉCLARÉ, PLUS DÉDUIT
            DE L'IMAGE REÇUE ██
            LE DÉFAUT, MESURÉ À LA PASSE MÊME QUI L'A CRÉÉ : la largeur
            suit la hauteur (`w-auto`), et le navigateur la calcule sur
            le rapport de l'image QU'IL A REÇUE. Or l'optimiseur rend
            des tailles ENTIÈRES : la variante de 256 px fait 256 × 50,
            soit un rapport de 5,120 — quand le fichier d'origine
            (1663 × 323) vaut 5,149. À 36 px de haut, cela fait 1,1 px
            de largeur en moins ; le bloc central de la barre, centré
            par deux marges automatiques, glissait donc d'un demi-pixel
            (relevé : 331 → 330). C'est le mécanisme de la nº 507, en
            beaucoup plus petit — et il n'y a aucune raison de le
            laisser vivre.
            LE REMÈDE : on DÉCLARE le rapport du fichier, celui des deux
            constantes du haut. La largeur ne dépend plus de la variante
            servie, quelle qu'elle soit — et si le propriétaire remplace
            un jour le fichier, ce sont toujours ces deux mêmes nombres
            qui commandent, à un seul endroit.
            ⚠️ SANS EFFET QUAND L'APPELANT FIXE LES DEUX CÔTÉS (l'icône
            dans un carré, par exemple) : `aspect-ratio` ne parle que
            si une dimension vaut `auto`. Rien ne change pour eux. */
        aspectRatio: `${natif.largeur} / ${natif.hauteur}`,
        objectFit: "contain",
        objectPosition: "left center",
      }}
    />
  );
}
