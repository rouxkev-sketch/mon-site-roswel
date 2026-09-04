import Link from "next/link";
import { libelleTypeFiche } from "@/config/tatouage";
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
 * SA ROBE, ET POURQUOI ELLE N'EST PAS CELLE DE « FOLLOW » : le fond de
 * l'interface et UN CONTOUR FIN — le patron des plaques de profil
 * (`ENCADRE_PLAQUE_INFO`, components/plaque, dont il reprend le
 * contour au jeton près). « Follow » est PLEIN, et c'est ce qui le
 * désigne comme le geste de la rangée ; ce badge-ci ne demande rien,
 * il renseigne. Sa BOÎTE, elle, est celle d'un badge du site : trente
 * pixels de haut, le rayon de la charte (nº 449), la même typographie
 * — la rangée garde son rythme, seul le remplissage change.
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
      className="inline-flex shrink-0 min-h-[30px] items-center justify-center
                 whitespace-nowrap rounded-lg border border-sombre-haut
                 bg-sombre-eleve px-3.5 text-[14px] font-semibold
                 text-sombre-texte transition-colors
                 hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-primaire"
    >
      {type}
    </Link>
  );
}
