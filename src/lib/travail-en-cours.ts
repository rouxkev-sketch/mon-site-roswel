/**
 * « IL Y A DU TRAVAIL NON ENREGISTRÉ » — un seul drapeau, partagé
 * ================================================================
 * Le formulaire de fiche le lève dès qu'on touche à quelque chose, et
 * le baisse en partant ou en enregistrant. Le menu « Mon espace » le
 * LIT avant de quitter le formulaire pour une création : c'est ce qui
 * permet de PRÉVENIR au lieu de perdre la saisie en silence.
 *
 * POURQUOI UN MODULE, ET PAS UN CONTEXTE REACT : le menu vit dans la
 * barre fixe, le formulaire dans la page — deux arbres qui ne se
 * rencontrent jamais. Et la réponse doit être IMMÉDIATE, dans le
 * gestionnaire du clic, avant toute navigation : un état React
 * arriverait un rendu trop tard.
 *
 * Il ne survit pas au rechargement, et c'est voulu : après un
 * rechargement, il n'y a plus rien à perdre.
 */

let enCours = false;

/**
 * ⚠️ LE DRAPEAU S'ANNONCE (passe nº 117, point 12). La garde doit
 * ARMER ses défenses au moment où il se lève — un écouteur
 * `beforeunload` pour le rechargement et la fermeture d'onglet, une
 * sentinelle d'historique pour le bouton « précédent » du navigateur —
 * et les DÉSARMER quand il retombe. Un module ne peut pas être lu par
 * un composant React sans être observable : on publie donc un
 * événement à chaque bascule. `Set` d'abonnés, pas de dépendance.
 */
const abonnes = new Set<(valeur: boolean) => void>();

/** Le formulaire dit ce qu'il en est — à chaque changement, et au
    moment de partir (démontage, enregistrement). */
export function marquerTravailEnCours(valeur: boolean): void {
  if (enCours === valeur) return;
  enCours = valeur;
  for (const abonne of abonnes) abonne(valeur);
}

/** Y a-t-il quelque chose à perdre en quittant maintenant ? */
export function travailEnCours(): boolean {
  return enCours;
}

/** S'ABONNER AUX BASCULES — rend la fonction de désabonnement, comme
    tout écouteur. La valeur courante n'est PAS rejouée à
    l'inscription : l'appelant la lit avec `travailEnCours()`. */
export function surTravailEnCours(
  abonne: (valeur: boolean) => void
): () => void {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}
