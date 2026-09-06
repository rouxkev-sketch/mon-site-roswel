/**
 * ██ LA CARTE SOUS LE CURSEUR — UNE SEULE ÉCRITURE, DEUX LECTEURS ██
 * ==================================================================
 * (passe nº 879, §1 — la règle posée à la nº 878 sort du composant)
 *
 * LA RÈGLE, EN UNE PHRASE : quand une carte est sous le curseur, LES
 * FLÈCHES SONT À ELLE — elle avance si elle le peut, elle ne fait rien
 * si elle est au bout, et rien d'autre sur l'écran ne bouge.
 *
 * POURQUOI ELLE VIT ICI PLUTÔT QUE DANS `ClavierCartes` : parce qu'un
 * SECOND lecteur en a besoin. La fenêtre de fiche superposée
 * (`FenetreFiche`) a son propre écouteur de clavier, posé sur la
 * fenêtre : il fait défiler LA GRANDE PHOTO. Tant qu'il ignorait cette
 * règle, un seul appui bougeait deux choses — la carte survolée ET la
 * grande photo (relevé du propriétaire à la nº 879, reproduit à la
 * sonde 879d : la carte passait de 1/6 à 3/6 pendant que l'affiche
 * passait de 3/6 à 4/6). Deux fichiers, une seule chaîne de sélecteurs.
 *
 * ⚠️ ON DEMANDE AU NAVIGATEUR, on ne tient pas de registre : `:hover`
 * est déjà tenu par lui, à jour au pixel, et `querySelector` rend le
 * nœud le plus profond survolé. Redoubler cela dans un état React
 * coûterait un rendu par passage de souris, pour une réponse moins
 * fidèle.
 * ⚠️ LES DEUX NOMS DE CARTE : `data-carte` (la mosaïque du moteur et
 * « Ma sélection ») et `data-carte-de-galerie` (le fil des pages
 * Portfolio et Flash). Ils ne se croisent jamais sur une même surface ;
 * la fenêtre superposée, elle, peut porter les deux — la mosaïque
 * derrière elle et son propre fil —, et c'est justement le cas qui
 * demande cette écriture partagée.
 */
export function carteSousLeCurseur(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(
    "[data-carte]:hover, [data-carte-de-galerie]:hover"
  );
}
