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
        objectFit: "contain",
        objectPosition: "left center",
      }}
    />
  );
}
