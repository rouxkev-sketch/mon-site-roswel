import { libelleTypeFiche } from "@/config/tatouage";

/**
 * ██ LE TITRE D'UNE CARTE : « Mara Voss · Private Studio » — nº 842 ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE (passe nº 842) : le TYPE de portfolio quitte
 * le sous-titre pour rejoindre le NOM, sur la ligne du titre ; le
 * sous-titre ne garde que la ville. Le sous-titre de la nº 841
 * (« Artist · Lyon, FR ») était trop long — il tenait deux
 * informations là où le titre n'en portait qu'une.
 *
 * CE QUI SE LIT, ET COMMENT :
 *  · LE NOM — demi-gras, au blanc du site (le porteur le donne) ;
 *  · LE TYPE — même corps, GRAISSE NORMALE et gris des textes
 *    secondaires : il accompagne le nom, il ne le concurrence pas ;
 *  · entre les deux, le POINT MÉDIAN de la nº 841.
 *
 * ⚠️ LE TYPE NE SE COUPE JAMAIS, ET C'EST LA CONSIGNE : il vit dans un
 * bloc insécable (`whitespace-nowrap`) — un nom trop long le fait
 * PASSER À LA LIGNE en entier, jamais tronquer en « Private Stu… ».
 * L'occasion de retour à la ligne est l'espace laissé ENTRE les deux
 * blocs ; c'est pour cela qu'il est écrit à part, et non collé au
 * point médian.
 * ⚠️ LE PORTEUR DOIT DONC AUTORISER DEUX LIGNES (`line-clamp-2` ou
 * l'équivalent) : un rognage à une seule ligne rendrait le retour à la
 * ligne invisible, et le type disparaîtrait au lieu de descendre.
 * ⚠️ UNE SEULE ÉCRITURE POUR LES TROIS PORTEURS (piège nº 378) : la
 * carte du web (sous sa photo), l'en-tête de la carte du fil au doigt
 * et la plaque du profil d'une fiche. Le porteur ne donne que la
 * TAILLE et la hauteur de ligne — jamais une couleur, jamais une
 * graisse : celles-ci sont la règle, et elles vivent ici.
 */
export const SEPARATEUR_NOM_TYPE = "·";

export function TitreDeCarte({
  tatoueur,
}: {
  tatoueur: {
    nom: string;
    type_fiche?: string | null;
    etablissement?: string | null;
  };
}) {
  const type = libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement);
  return (
    <>
      <span className="font-semibold">{tatoueur.nom}</span>
      {type ? (
        <>
          {" "}
          <span className="font-normal text-sombre-texte-doux whitespace-nowrap">
            {SEPARATEUR_NOM_TYPE} {type}
          </span>
        </>
      ) : null}
    </>
  );
}
