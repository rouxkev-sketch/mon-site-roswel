"use client";

import Link from "next/link";

/**
 * « AUCUN RÉSULTAT » — L'ÉCRITURE UNIQUE (nº 307-§2)
 * ==================================================================
 * POURQUOI CE FICHIER EXISTE. Le message du vide était écrit DEUX
 * FOIS, dans deux formulations différentes, et une correction posée
 * dans l'une ne se voyait pas dans l'autre :
 *  · `IndexTatoueurs` — « Aucun tatoueur ne correspond à cette
 *    recherche. Élargir le rayon, ou effacer le lieu pour chercher
 *    partout. » (c'est celle que le propriétaire lit) ;
 *  · `/tatouage/<style>/<ville>` — « Personne n'est encore référencé
 *    en … à … Voir tous les tatoueurs ».
 * Il n'y en a plus qu'une, ici, et les deux pages l'appellent.
 *
 * CE QU'ELLE DIT, ET RIEN DE PLUS :
 *  · le titre « Aucun résultat », en blanc, centré ;
 *  · AUCUNE phrase d'explication — la page vide se comprend seule, et
 *    une phrase de plus ne rend pas un tatoueur ;
 *  · les issues, en capsules à LEUR TAILLE NATURELLE, côte à côte.
 *
 * ⚠️ LES CAPSULES NE SONT PAS ROSES, et c'est une règle de charte :
 * le rose plein (`primaire`) est réservé à L'ACTION FINALE D'UNE PAGE.
 * Ici, ce sont des échappatoires équivalentes — aucune n'est « le »
 * geste attendu. Elles prennent donc le gris élevé, comme toutes les
 * actions secondaires du site.
 *
 * ⚠️ §2 (nº 509) — CE FICHIER NE DÉCIDE TOUJOURS DE RIEN, ET C'EST
 * VOULU : il DESSINE des issues, il n'en choisit aucune. Les trois
 * paliers du moteur — élargir le rayon, chercher dans le pays,
 * chercher dans le monde — se décident chez l'appelant
 * (`issuesDuVide`, IndexTatoueurs), qui seul connaît le lieu servi.
 * Le dessin, lui, n'a pas bougé d'un pixel à cette passe.
 *
 * ⚠️ AUCUNE CAPSULE QUI NE FERAIT RIEN : l'appelant ne passe que les
 * issues qui ont un sens là où il est. Sans lieu renseigné, il n'en
 * passe aucune — il ne reste que le titre.
 */

/** Une issue proposée : soit une adresse, soit un geste. Jamais les
    deux — une page serveur ne sait passer qu'une adresse. */
export type IssueAucunResultat = {
  libelle: string;
  /** Pour une page rendue par le serveur (`/tatouage/…`). */
  href?: string;
  /** Pour la mosaïque, qui relance la recherche sans changer de page. */
  surClic?: () => void;
};

/*  LA CAPSULE — le gris élevé des actions secondaires du site
    (voir AdminYokofolio, BlocHorairesStudio…), `w-fit` par nature
    puisqu'elle est en ligne : elle prend la largeur de son texte, et
    pas un pixel de plus. */
const CAPSULE =
  "inline-flex items-center rounded-full bg-sombre-eleve " +
  "hover:bg-sombre-eleve-clair px-4 min-h-[38px] text-[14px] " +
  "font-semibold text-sombre-texte transition-colors";

export function AucunResultat({
  issues = [],
}: {
  issues?: IssueAucunResultat[];
}) {
  return (
    <div className="py-14 flex flex-col items-center gap-5 text-center">
      <p className="text-[19px] font-semibold text-white">Aucun résultat</p>
      {issues.length > 0 && (
        //  CÔTE À CÔTE, centrées. `flex-wrap` : sur un écran très
        //  étroit, la seconde passe dessous plutôt que de déborder.
        <div className="flex flex-wrap items-center justify-center gap-3">
          {issues.map((issue) =>
            issue.href ? (
              <Link key={issue.libelle} href={issue.href} className={CAPSULE}>
                {issue.libelle}
              </Link>
            ) : (
              <button
                key={issue.libelle}
                type="button"
                onClick={issue.surClic}
                className={CAPSULE}
              >
                {issue.libelle}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
