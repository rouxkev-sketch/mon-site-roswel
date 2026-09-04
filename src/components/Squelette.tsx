"use client";

import { useEffect, useRef, useState } from "react";
//  §2 (nº 776) — la géométrie de la fiche est CONSOMMÉE, jamais
//  recopiée : la largeur de la photo de tête et le cadre 4:5 sont les
//  écritures uniques de la vraie page (piège nº 378).
import {
  CADRE_PHOTO_PORTFOLIO,
  LARGEUR_PHOTO_FICHE,
} from "@/config/tatouage";
import { observerLargeurPhotoFiche } from "@/lib/mesure-photo-fiche";

/**
 * LA FIN DE L'ÉCRAN « Un instant… » (passe nº 118)
 * =================================================
 * Un mot seul sur fond noir, c'est une page qui a l'air en panne :
 * chaque chargement commençait par une seconde de vide signée
 * « Un instant… ». Deux idées, COMBINÉES ici :
 *
 *  1. `Patience` — NE RIEN MONTRER pendant les premières centaines de
 *     millisecondes. Un chargement rapide (cache chaud, bonne
 *     connexion) ne montre alors JAMAIS d'écran d'attente : la page
 *     arrive avant l'échéance, et l'œil n'a rien vu passer.
 *  2. Les squelettes — passé ce délai, la SILHOUETTE de la page qui
 *     vient : des blocs aux bons endroits, aux tons de la charte
 *     (le bloc un cran plus clair que la page, la ligne un cran plus
 *     clair que le bloc), qui respirent doucement. On attend devant
 *     une page qui se dessine, pas devant un message.
 *
 * CHARTE : AUCUN contour, rien de criard — les formes reprennent les
 * fonds existants (`sombre-carte`, `sombre-eleve`) et `animate-pulse`
 * fait toute l'animation. Les lecteurs d'écran entendent
 * « Chargement » (`role="status"`), pas une grille de rectangles.
 *
 * ⚠️ LES LIBELLÉS DE BOUTON « Un instant… » NE SONT PAS CONCERNÉS :
 * sur un bouton pressé, c'est un retour d'action — il dit « j'ai bien
 * reçu ton clic » — pas un écran d'attente. Ils restent.
 */

/** NE RIEN MONTRER AVANT L'ÉCHÉANCE : le squelette lui-même serait un
    clignotement sur les chargements rapides. */
export function Patience({
  delaiMs = 300,
  children,
}: {
  delaiMs?: number;
  children: React.ReactNode;
}) {
  const [echu, setEchu] = useState(false);
  useEffect(() => {
    const minuteur = window.setTimeout(() => setEchu(true), delaiMs);
    return () => window.clearTimeout(minuteur);
  }, [delaiMs]);
  if (!echu) return null;
  return <>{children}</>;
}

/** LA SILHOUETTE DU FORMULAIRE — un titre, puis des blocs numérotés
    comme les vrais : carte, ligne de titre, deux champs. */
export function SqueletteFormulaire() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="h-7 w-2/3 rounded-full bg-sombre-carte" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-sombre-carte" />
      <div className="mt-8 flex flex-col gap-5">
        {[0, 1, 2].map((rang) => (
          <div key={rang} className="rounded-2xl bg-sombre-carte p-5 sm:p-7">
            <div className="h-5 w-1/3 rounded-full bg-sombre-eleve" />
            <div className="mt-5 h-[52px] rounded-xl bg-sombre-eleve" />
            <div className="mt-3 h-[52px] w-4/5 rounded-xl bg-sombre-eleve" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LA SILHOUETTE D'UNE FICHE (nº 772, GÉOMÉTRIE REFAITE nº 776) — la
 * photo de tête et sa colonne de lecture, aux dimensions de la vraie
 * page.
 * POURQUOI ELLE EXISTE : « Mon portfolio » (le compte) mène à la page
 * du formulaire avec `?vue=apercu` — la MÊME page que « Modification »,
 * seule la vue diffère. Pendant le chargement, l'écran montrait donc
 * LA SILHOUETTE DU FORMULAIRE, étroite, avec ses faux champs — puis
 * une fiche pleine largeur la remplaçait : on annonçait une page qui
 * n'était pas celle qui venait. La silhouette doit dessiner ce qui va
 * apparaître (la règle de SquelettePage, juste en dessous).
 *
 * ██ §2 (nº 776) — ELLE PREND LES DIMENSIONS DE LA VRAIE PAGE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : la version nº 772 posait
 * DEUX MOITIÉS DE PAGE (`lg:w-1/2`) — sur un écran large, une photo de
 * ~850 px là où la vraie en fait ~620 : « beaucoup trop large », et
 * tout sautait à l'arrivée du contenu. La vraie page ne partage pas la
 * largeur : elle borne la photo par la HAUTEUR de l'écran et fixe la
 * colonne de lecture à 340 px, le tout centré.
 * DÉSORMAIS LA SILHOUETTE CONSOMME LES ÉCRITURES DE LA VRAIE PAGE,
 * jamais des copies :
 *  · LA GRILLE — `lg:grid-cols-[auto_340px] lg:justify-center`,
 *    `gap-8 lg:gap-10` : les classes de la rangée de FicheTatoueur,
 *    340 étant LA largeur de colonne choisie par le propriétaire
 *    (nº 300) ;
 *  · LE CADRE — `LARGEUR_PHOTO_FICHE` (config/tattoo, l'écriture
 *    unique posée à cette passe) + `CADRE_PHOTO_PORTFOLIO`, et LA
 *    MESURE DE LA VRAIE PAGE (`observerLargeurPhotoFiche`,
 *    lib/mesure-photo-fiche — extraite à cette passe) : la silhouette
 *    pose la même `--photo-largeur` que la page qui vient, donc la
 *    même largeur même quand la barre passe en deux rangées (fenêtre
 *    étroite : 25 px d'écart au banc avec le seul repli CSS) ou qu'un
 *    bandeau vit au-dessus.
 * LA RANGÉE DU PROFIL (rond + deux lignes) NE VIT PLUS QU'AU DOIGT :
 * la vraie page web n'a RIEN au-dessus de la grille — ce bloc y était
 * un fantôme (la règle nº 707 : rien qui ne soit dans la page qui
 * vient). Au doigt, rien ne change : mêmes blocs, même ordre, mêmes
 * espacements qu'à la nº 772.
 */
export function SqueletteFiche() {
  const cadre = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zone = cadre.current;
    if (!zone) return;
    return observerLargeurPhotoFiche(zone);
  }, []);
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="hidden mobile:flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-sombre-carte" />
        <div className="flex-1">
          <div className="h-5 w-1/4 rounded-full bg-sombre-carte" />
          <div className="mt-2.5 h-4 w-1/6 rounded-full bg-sombre-carte" />
        </div>
      </div>
      {/*  La rangée de la vraie page : piste photo à sa largeur réelle,
           colonne de lecture de 340 px, l'ensemble centré. La marge du
           haut n'existe qu'au doigt, sous la rangée du profil — au web
           la vraie grille est le premier bloc de la page. */}
      <div className="mobile:mt-6 grid gap-8 lg:gap-10 lg:grid-cols-[auto_340px] lg:justify-center">
        {/*  Le cadre de la photo — la géométrie de la vraie : bornée
             par la hauteur visible au web (largeur = hauteur × 0,8, le
             4:5), pleine largeur au doigt. */}
        <div className="flex flex-col min-w-0">
          <div
            ref={cadre}
            className={`${LARGEUR_PHOTO_FICHE} ${CADRE_PHOTO_PORTFOLIO} rounded-2xl bg-sombre-carte`}
          />
        </div>
        {/*  La colonne de lecture : la ligne du titre, puis des
             lignes de texte qui s'amenuisent. */}
        <div className="w-full min-w-0">
          <div className="h-6 w-1/2 rounded-full bg-sombre-carte" />
          <div className="mt-6 flex flex-col gap-3">
            <div className="h-4 w-full rounded-full bg-sombre-carte" />
            <div className="h-4 w-5/6 rounded-full bg-sombre-carte" />
            <div className="h-4 w-2/3 rounded-full bg-sombre-carte" />
          </div>
          <div className="mt-8 h-[60px] rounded-2xl bg-sombre-carte" />
          <div className="mt-3 h-[60px] rounded-2xl bg-sombre-carte" />
        </div>
      </div>
    </div>
  );
}

/** LA SILHOUETTE D'UNE PAGE DE RÉGLAGES (Sécurité) — le titre, puis
    des blocs à la grammaire du formulaire (nº 130) : le titre de bloc
    AU-DESSUS de sa carte, aligné sur le texte, et la carte en dessous.
    La silhouette doit dessiner ce qui va apparaître, sinon la page
    « saute » à l'arrivée. */
export function SquelettePage() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="h-7 w-1/2 rounded-full bg-sombre-carte" />
      <div className="mt-10 sm:mt-8 flex flex-col gap-8 sm:gap-6">
        {[0, 1, 2].map((rang) => (
          <div key={rang}>
            <div className="mx-4 sm:mx-7 h-4 w-1/3 rounded-full bg-sombre-carte" />
            <div className="mt-3 rounded-2xl bg-sombre-carte px-4 py-6 sm:rounded-3xl sm:px-7 sm:py-7">
              <div className="h-[48px] rounded-xl bg-sombre-eleve" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** DES LIGNES EN ATTENTE, pour les listes qui se chargent DANS une
    page déjà là (fiches à valider, signalements, portfolios à
    supprimer). `ton` suit la règle des fonds : `carte` sur la page,
    `eleve` à l'intérieur d'une carte. */
export function SqueletteLignes({
  nombre = 3,
  ton = "carte",
}: {
  nombre?: number;
  ton?: "carte" | "eleve";
}) {
  const fond = ton === "carte" ? "bg-sombre-carte" : "bg-sombre-eleve";
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col gap-2.5 animate-pulse"
    >
      {Array.from({ length: nombre }, (_, rang) => (
        <div key={rang} className={`h-[60px] rounded-2xl ${fond}`} />
      ))}
    </div>
  );
}
