import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { FormulaireContactYokofolio } from "@/components/FormulaireContactYokofolio";

/**
 * CONTACT — /contact
 * ===================
 * La page de contact de yokofolio : un formulaire sobre (nom, e-mail,
 * message), l'enregistrement en base + la transmission e-mail à
 * l'exploitant, et un écran de confirmation. Le lien vit dans le pied
 * de page (src/app/(tatouage)/layout.tsx).
 *
 * ⚠️⚠️ EXCEPTION DE MISE EN PAGE — LA RÈGLE, ET ELLE FAIT AUTORITÉ ICI
 * ==================================================================
 * CES DEUX PAGES ONT LEUR PROPRE MISE EN PAGE, PLUS LIBRE QUE LA
 * CHARTE DU RESTE DU SITE. C'EST UNE EXCEPTION ASSUMÉE, DÉCIDÉE PAR LE
 * PROPRIÉTAIRE À LA PASSE Nº 320 APRÈS AVOIR VU LE RÉSULTAT DE LEUR
 * PASSAGE À LA CHARTE. AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER.
 *
 * (« ces deux pages » : celle-ci et /about — « /qui-sommes-nous »
 * jusqu'à la nº 811.)
 *
 * CE QUE CELA COUVRE ICI, NOMMÉMENT — pour qu'aucune relecture de
 * charte ne les prenne pour des oublis : le grand titre en
 * `clamp(1.6rem…2.1rem)`, les marges propres à la page, et — dans le
 * formulaire (FormulaireContactYokofolio) — les CONTOURS des champs,
 * le FOCUS ROSE et son halo, les ARRONDIS DE 12 px, les LIBELLÉS
 * AU-DESSUS des champs et le ROND ROSE de confirmation. La nº 319
 * avait tout ramené aux jetons du site : c'est ANNULÉ.
 *
 * CE QUI EST GARDÉ DE LA nº 319, ET SEULEMENT CELA : les deux libellés
 * « Nom » et « E-mail », qui restent DANS leur champ — voir
 * FormulaireContactYokofolio. (Côté /about : son texte.)
 *
 * ⚠️ nº 811 — LE RIDEAU DE CHARGEMENT : `loading.tsx` à côté de ce
 * fichier (RideauDePageTexte), comme les pages de mosaïque depuis la
 * nº 706 — sans squelette, c'est une page de texte.
 */

export const metadata: Metadata = {
  title: "Contact",
  description: `A question, an idea, a problem? Write to the ${MARQUE_YOKOFOLIO.nom} team.`,
  alternates: { canonical: `${adresseDuSite()}/contact` },
};

export default function PageContactTatouage() {
  return (
    <>
      <EnTeteTatouage />
      <main className="flex-1 mx-auto w-full max-w-[560px] px-5 sm:px-6 pt-10 sm:pt-14 pb-24">
        {/*  ██ §2 (nº 802) — LE TITRE PASSE DANS LE FORMULAIRE ██
             Il restait affiché AU-DESSUS de la confirmation d'envoi :
             on venait d'écrire, et l'écran continuait de nous inviter
             à écrire. Il est maintenant remis au formulaire, qui le
             montre tant que le message n'est pas parti et le laisse
             dehors ensuite — lui seul sait où l'on en est.
             ⚠️ LE TEXTE N'A PAS BOUGÉ D'UNE VIRGULE, ni ses classes :
             il est simplement passé en `children`. Et il reste écrit
             ICI, dans un composant SERVEUR — il part donc toujours
             dans le HTML de la première réponse, pour les moteurs de
             recherche comme pour le premier regard. */}
        <FormulaireContactYokofolio>
          <h1 className="text-[clamp(1.6rem,4.5vw,2.1rem)] font-bold leading-tight text-sombre-texte">
            Get in touch
          </h1>
          <p className="mt-2 text-[15px] text-sombre-texte-doux leading-relaxed">
            A question, an idea, a problem? We read everything, and we
            answer fast.
          </p>
        </FormulaireContactYokofolio>
      </main>
    </>
  );
}
