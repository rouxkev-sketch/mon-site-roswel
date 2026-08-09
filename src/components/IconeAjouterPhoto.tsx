/**
 * L'ICÔNE « AJOUTER UNE PHOTO » — le fichier du propriétaire
 * ==========================================================
 * Un appareil photo au trait fin, marqué d'un plus. Elle remplace deux
 * mots posés là faute de mieux (passe nº 111) : « ronde » dans le
 * cercle du profil, « + Ajouter » dans une case vide de galerie. Un
 * emplacement de photo se reconnaît à un appareil photo — pas à une
 * étiquette qui décrit sa forme.
 *
 * ⚠️ LE FICHIER APPARTIENT AU PROPRIÉTAIRE, comme les logos : il le
 * recopie à la main dans `public/ajouter-une-photo.png` et il n'entre
 * JAMAIS dans un zip de livraison. On ne le modifie pas, on ne le
 * recrée pas, on n'en fabrique pas de variante — on le RÉFÉRENCE, et
 * c'est tout.
 *
 * ⚠️ POURQUOI `invert` ET PAS UNE COULEUR. C'est la convention déjà
 * en place pour les icônes du propriétaire (voir `iconeInfo` dans
 * FicheTatoueur) : ce sont des GLYPHES NOIRS sur fond transparent, donc
 * invisibles sur l'anthracite. `invert` les passe en clair sans
 * toucher au fichier, et l'opacité les cale sur le gris doux du texte
 * qu'elles remplacent. Au survol, l'opacité monte — l'icône suit la
 * case qui s'allume.
 */
export function IconeAjouterPhoto({
  taille,
  className = "",
}: {
  /** Le côté du carré, en pixels. Plus petit dans le cercle du profil,
      plus grand dans une tuile de galerie. */
  taille: number;
  className?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône déposée à la main par le propriétaire, affichée telle
       quelle : le filtre CSS n'altère pas le fichier. */
    <img
      src="/ajouter-une-photo.png"
      alt=""
      aria-hidden="true"
      width={taille}
      height={taille}
      style={{ width: taille, height: taille }}
      className={`shrink-0 invert opacity-55 transition-opacity ${className}`}
    />
  );
}
