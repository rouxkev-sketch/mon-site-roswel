import { EnTeteTatouage } from "@/components/EnTeteTatouage";

/**
 * ██ nº 811 — LE RIDEAU DES PAGES DE TEXTE (About, Legal, Contact) ██
 * ==================================================================
 * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : ces trois pages, héritées
 * de la nº 320, n'avaient pas de `loading.tsx` — la page restait FIGÉE
 * au clic tant que la suivante n'était pas arrivée, alors que tout le
 * reste du site répond au clic depuis la nº 706 (les squelettes des
 * `loading.tsx`).
 *
 * CE QUE C'EST : le rideau que chaque `loading.tsx` de ces pages rend
 * — la barre du site, réelle (elle n'attend rien, et elle est celle
 * que la page va rendre à son tour), puis un corps VIDE qui occupe la
 * place. PAS DE SQUELETTE, sur consigne : ce sont des pages de texte,
 * il n'y a pas de silhouette à annoncer ; l'ancien contenu s'efface,
 * le nouveau arrive.
 * ⚠️ `aria-busy` et son libellé : un lecteur d'écran sait que la page
 * se charge, comme sur les squelettes (SquelettesDePage).
 * ⚠️ POURQUOI LA BARRE EST DANS LE RIDEAU : dans ce groupe, la barre
 * est posée par CHAQUE PAGE, pas par l'habillage (voir la note de
 * layout.tsx). Un rideau sans barre ferait disparaître la barre le
 * temps du chargement — c'est ce que les squelettes de mosaïque
 * évitent avec leur `BarreSquelette`.
 * ⚠️ IL EST AUSSI TIRÉ AU CLIC, PAR-DESSUS LA PAGE : sans page en
 * réserve (les liens du pied de page ne préchargent pas à la vue,
 * nº 793), le `loading.tsx` ne se peint jamais — le routeur attend
 * tout le flux. `LienAuGeste` (nº 811) peint donc ce même rideau dès
 * que la navigation attend, jusqu'à l'arrivée : un seul dessin pour
 * les deux moments, la page ne peut pas changer d'allure entre eux.
 */
export function RideauDePageTexte() {
  return (
    <>
      <EnTeteTatouage />
      <main aria-busy="true" aria-label="Loading page" className="flex-1" />
    </>
  );
}
