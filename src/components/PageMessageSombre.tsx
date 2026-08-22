import { COULEURS_SOMBRE } from "@/config/tatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * UNE PAGE QUI NE DIT QU'UNE CHOSE — à la charte (passe nº 176)
 * =============================================================
 * Deux pages s'en servent, et elles se ressemblent exprès :
 *  · la page INTROUVABLE (src/app/not-found.tsx) — l'adresse n'existe
 *    pas. Elle remplace la page brute de Next.js, qui s'affichait en
 *    anglais, sur fond blanc, hors de toute charte ;
 *  · la fiche PAS ENCORE EN LIGNE — elle existe, mais elle n'est pas
 *    publiée. Ce n'est pas une erreur d'adresse, et ça ne doit donc
 *    pas être un 404.
 *
 * LA CHARTE, ET RIEN D'AUTRE : fond anthracite d'un bord à l'autre,
 * AUCUN contour, AUCUNE carte, aucune illustration — et une seule
 * phrase. Sous elle, le retour à l'accueil en CAPSULE ROSE PLEINE
 * LARGEUR : c'est le seul geste possible, il occupe donc toute la
 * place, comme le bouton final d'un formulaire.
 *
 * ⚠️ AUCUNE PHRASE EXPLICATIVE SUPERFLUE. Un titre, un bouton. Ce
 * n'est pas une page où l'on reste.
 *
 * ⚠️ POURQUOI LE FOND EST ÉCRIT EN STYLE EN LIGNE : la page
 * introuvable est rendue par la mise en page RACINE, qui n'habille
 * rien (chaque produit pose son fond dans le layout de son groupe).
 * Une classe utilitaire suffirait à l'écran, mais le fond du document
 * lui-même resterait clair derrière — d'où la couleur posée aussi sur
 * l'enveloppe, en dur, depuis le fichier de réglages.
 */
export function PageMessageSombre({
  titre,
  libelleRetour = "Retour à l'accueil",
  pleinEcran = true,
}: {
  titre: string;
  libelleRetour?: string;
  /** FAUX quand la page vit DANS la mise en page de yokofolio (barre et
      pied de page autour) : elle prend alors la place qui reste, sans
      pousser le pied de page hors de l'écran. */
  pleinEcran?: boolean;
}) {
  return (
    <main
      style={{ backgroundColor: COULEURS_SOMBRE.fond }}
      className={`flex flex-1 flex-col justify-center
                 px-6 py-16 text-sombre-texte ${
                   pleinEcran ? "min-h-screen" : "min-h-[60vh]"
                 }`}
    >
      <div className="mx-auto w-full max-w-[420px]">
        <h1 className="text-[22px] font-semibold leading-snug text-center">
          {titre}
        </h1>
        {/* LE SEUL GESTE : pleine largeur, capsule rose, 52 px de haut
            — la hauteur des boutons de validation du site. */}
        {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE : ce
             bouton finit un parcours, il va EN AVANT — sans
             déclaration, la chaîne de restitution pouvait y rendre la
             place mémorisée de l'accueil (le bas). `LienAccueil` pose
             les deux déclarations existantes (nº 429 et nº 446) ; cette
             page reste un composant serveur, c'est le lien qui est
             client. */}
        <LienAccueil
          className="mt-8 flex w-full items-center justify-center
                     rounded-full bg-primaire px-6 min-h-[52px]
                     text-[15px] font-semibold text-white
                     transition-opacity active:opacity-80 hover:opacity-90"
        >
          {libelleRetour}
        </LienAccueil>
      </div>
    </main>
  );
}
