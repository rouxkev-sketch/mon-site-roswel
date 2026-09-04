import Link from "next/link";
import { libelleTypeFiche, ROBE_BADGE_CONTOUR } from "@/config/tatouage";
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
      /*  §2 (nº 847) — SA BOÎTE ET SON CONTOUR SONT L'ÉCRITURE PARTAGÉE
          (`ROBE_BADGE_CONTOUR`, config/tatouage) : le badge du COMPTE des
          résultats en veut exactement la même. Rien n'a changé d'un
          pixel — les mêmes classes, lues ailleurs. Ce qui reste ici est
          ce qui n'appartient qu'à CE badge : sa typographie, son air
          latéral, et ses états de LIEN. */
      className={`${ROBE_BADGE_CONTOUR} px-3.5 text-[14px] font-semibold
                 text-sombre-texte transition-colors
                 hover:bg-sombre-eleve active:bg-sombre-eleve
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-primaire`}
    >
      {type}
    </Link>
  );
}
