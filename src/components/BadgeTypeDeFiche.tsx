import Link from "next/link";
import { BOITE_BADGE, COULEURS_SOMBRE, libelleTypeFiche } from "@/config/tatouage";
import { adresseDeLienInterne } from "@/lib/lien-interne";

/**
 * ██ LE BADGE DU TYPE — « Private Studio » — nº 843 ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE (passe nº 843) : dans le fil du doigt, le
 * badge « Follow » quitte l'en-tête des cartes (il reste sur le
 * profil, où l'on décide de suivre quelqu'un qu'on est venu voir) et
 * cède sa place, face à l'avatar, à un badge qui DIT CE QU'EST le
 * portfolio : artiste, studio privé ou salon.
 *
 * SA ROBE, ET POURQUOI ELLE N'EST PAS CELLE DE « FOLLOW » : UN CONTOUR
 * FIN, ET RIEN DEDANS — le patron des plaques de profil
 * (`ENCADRE_PLAQUE_INFO`, components/plaque, dont il reprend le
 * contour au jeton près). « Follow » est PLEIN, et c'est ce qui le
 * désigne comme le geste de la rangée ; ce badge-ci ne demande rien,
 * il renseigne. Sa BOÎTE, elle, est celle d'un badge du site : trente
 * pixels de haut, le rayon de la charte (nº 449), la même typographie
 * — la rangée garde son rythme, seul le remplissage change.
 *
 * ██ §3 (nº 844) — LE FOND S'EN VA : LE BADGE EST TRANSPARENT ██
 * ------------------------------------------------------------------
 * DÉCISION DU PROPRIÉTAIRE : la nº 843 lui avait donné le cran de
 * l'interface (`bg-sombre-eleve`), qui le détachait de la carte comme
 * une pastille. Il prend désormais LA COULEUR DE LA CARTE, c'est-à-dire
 * AUCUNE — `bg-transparent`, le fond de la carte transparaît — et il ne
 * reste que son contour d'un pixel. C'est la lecture littérale du
 * patron des plaques : « contour fin seul ».
 * ⚠️ LE SURVOL ET L'APPUI GARDENT UN FOND, et ce n'est pas une entorse :
 * c'est un LIEN, il doit répondre au doigt comme à la souris. Le cran
 * qui remplissait le badge au repos devient donc celui qui l'éclaire
 * quand on le touche (`bg-sombre-eleve`) — un seul jeton de moins dans
 * la feuille, et la même écriture qu'avant pour l'état actif.
 * ⚠️ UNE SEULE CLASSE DE FOND AU REPOS (piège nº 389) : `bg-transparent`
 * et rien d'autre ; les deux autres sont des variantes, donc des règles
 * séparées.
 *
 * ⚠️ C'EST UN LIEN, PAS UN ORNEMENT : il ouvre le profil, comme
 * l'avatar et le titre à sa gauche. Il est donc écrit ici, avec sa
 * destination, plutôt que laissé à chaque porteur.
 * ⚠️ ET IL EST HORS DU LIEN DE L'EN-TÊTE, jamais dedans : un lien dans
 * un lien est du contenu imbriqué, que le langage interdit (la leçon
 * de la nº 517). Deux liens voisins vers la même destination, en
 * revanche, sont légitimes — ce sont deux cibles tactiles distinctes,
 * et celle-ci porte son propre nom accessible.
 * ⚠️ IL NE RÉTRÉCIT JAMAIS ET NE SE COUPE JAMAIS (`shrink-0`,
 * `whitespace-nowrap`) : c'est le nom et la ville qui cèdent la place,
 * par leurs points de suspension (nº 843-§2).
 */
export function BadgeTypeDeFiche({
  tatoueur,
}: {
  tatoueur: {
    slug: string;
    type_fiche?: string | null;
    etablissement?: string | null;
  };
}) {
  const type = libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement);
  if (!type) return null;
  return (
    <Link
      href={adresseDeLienInterne(tatoueur.slug)}
      data-badge-type=""
      /*  ██ §6 (nº 852) — IL PREND LA ROBE DE « SUIVRE » ██
          ----------------------------------------------------------
          DÉCISION DU PROPRIÉTAIRE : sur les cartes du fil, ce badge
          prend la robe du badge « Suivre » — un APLAT PLEIN de la
          couleur d'action, SANS CONTOUR — « c'est un lien ».
          CE QUE CELA ANNULE, ET IL FAUT LE DIRE : la nº 844-§3 l'avait
          VIDÉ (fond transparent, contour seul) au motif que « le
          contour renseigne, le plein agit ». Le propriétaire retourne
          l'argument : ce badge n'est pas une étiquette, il OUVRE le
          profil — il agit, donc il se remplit. La règle de la nº 844
          reste vraie pour ce qui ne mène nulle part ; ce badge, lui,
          change de camp.
          LES DEUX JETONS SONT CEUX DE « SUIVRE », lus chez lui
          (BoutonSuivre) et non réinventés : `bg-sombre-texte` (le blanc
          de la charte) avec le texte au fond de page, et la même
          descente d'un dixième au survol et à l'appui.
          ⚠️ SA BOÎTE NE BOUGE PAS D'UN PIXEL : `BOITE_BADGE` est
          l'écriture partagée (config/tatouage), et la hauteur, l'air et
          la typographie restent ceux que la nº 851 a fait copier aux
          badges de la rangée de recherche — le banc 851 les compare
          encore, mesure contre mesure.
          ⚠️ ET IL N'A PLUS DE CONTOUR DU TOUT : c'est écrit dans la
          consigne. Sa hauteur ne bouge pas pour autant — la hauteur
          minimale se compte sur la boîte entière, contour compris. */
      /*  ██ §3 (nº 853) — LE CONTRASTE S'INVERSE ██
          LE PROPRIÉTAIRE : le badge blanc à texte noir de la nº 852 est
          trop fort ; il prend LE FOND DES BADGES DE RECHERCHE À CROIX
          (#20262D, le barreau `carteClair` de la nº 848) et
          L'ÉCRITURE DE « FOLLOWING » — le texte clair de la charte.
          Ce qui reste de la nº 852-§6 : c'est un APLAT, sans contour,
          parce que c'est un lien.
          ⚠️ LE FOND VOYAGE DANS LE MARQUAGE, comme celui des badges de
          la rangée depuis la nº 849 : une classe neuve n'existe que
          dans une feuille neuve, et un fond que la feuille ignore ne se
          peint pas du tout. La valeur reste celle de la charte, lue au
          même endroit — c'est le CHEMIN qui change, pas la source.
          ⚠️ D'OÙ LE SURVOL EN OPACITÉ, et non en couleur : un style en
          ligne l'emporte sur toute classe, une variante `hover:bg-…`
          serait donc muette. L'opacité est l'autre écriture du site
          pour ce cas (elle sert déjà dans l'administration). */
      style={{ backgroundColor: COULEURS_SOMBRE.carteClair }}
      className={`${BOITE_BADGE} min-h-[30px] px-3.5 text-[14px] font-semibold
                 text-sombre-texte transition-opacity
                 hover:opacity-90 active:opacity-90
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-primaire`}
    >
      {type}
    </Link>
  );
}
