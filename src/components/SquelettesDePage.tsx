"use client";

import { LogoYokofolio } from "@/components/LogoYokofolio";
import { CADRE_PHOTO_PORTFOLIO, LARGEUR_SITE } from "@/config/tatouage";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";

/**
 * ██ §2 (nº 706) — LES SQUELETTES : LA PAGE RÉPOND AU CLIC ██
 * ==================================================================
 * LE DÉFAUT QU'ILS FERMENT (audit nº 705, et les mots du
 * propriétaire) : cliquer vers une page DYNAMIQUE — la recherche,
 * « Ma sélection » — laissait l'ANCIENNE page figée à l'écran le
 * temps que le serveur réponde (~1 s en production), puis la nouvelle
 * arrivait d'un bloc. « On dirait que le clic n'a pas marché. »
 * DÉSORMAIS : chaque page dynamique a un `loading.tsx`, que le
 * routeur peint DÈS LE CLIC — le cadre de la page, ses zones grises —
 * et les données le remplacent en arrivant. C'est CE fichier qui
 * dessine ces cadres, pour que les trois pages ne divergent pas.
 *
 * ⚠️ MÊMES ZONES QUE LA VRAIE PAGE, MÊMES ÉCRITURES PARTAGÉES — pas
 * des copies (piège 378/379) : la largeur du site (`LARGEUR_SITE`),
 * la grille des cartes (`CLASSES_GRILLE_CARTES`) et le cadre 4/5 des
 * photos (`CADRE_PHOTO_PORTFOLIO`) sont IMPORTÉS de leurs écritures
 * uniques. Si la vraie grille change, le squelette suit tout seul.
 * ⚠️ LA FAUSSE BARRE N'EST PAS LA BARRE : la vraie (EnTeteTatouage)
 * vit dans le segment de page et REMONTE à chaque navigation — c'est
 * déjà le cas aujourd'hui, mesuré à la nº 705. Le squelette pose le
 * VRAI logo au même endroit et des blocs gris là où vivent le moteur
 * et les icônes : à l'arrivée, la vraie barre se peint par-dessus au
 * même pixel, et l'œil ne voit qu'une barre qui se remplit.
 * ⚠️ AUCUN ÉTAT, AUCUNE LECTURE, AUCUN EFFET : des `<div>` et des
 * classes, rien d'autre. Un squelette qui travaille serait un
 * comble.
 * ⚠️ ET LA POSITION N'A RIEN À CRAINDRE D'EUX, par construction : une
 * navigation AVANT arrive en haut (position 0, règle nº 446/653) —
 * la hauteur provisoire du squelette n'y change rien ; un RETOUR est
 * servi par la réserve du routeur, qui rend la page COMPLÈTE d'un
 * coup, sans repasser par `loading.tsx` — la hauteur définitive est
 * là dès la première peinture, comme l'exige la nº 191. Les deux cas
 * sont éprouvés au banc de la passe.
 *
 * L'APPARENCE : des blocs `bg-sombre-eleve` — LE jeton des surfaces
 * posées du site, aucune couleur inventée — sous `animate-pulse`
 * (la pulsation de Tailwind), discrète et standard.
 */

/** Le rond d'action de la barre : même gabarit que les icônes (40). */
function RondGris() {
  return (
    <span
      aria-hidden="true"
      className="h-10 w-10 shrink-0 rounded-full bg-sombre-eleve"
    />
  );
}

/**
 * LA BARRE, EN SQUELETTE — le vrai logo (il est statique, il n'attend
 * rien), des blocs gris à la place du moteur et des actions. Mêmes
 * enveloppes que la vraie barre : `sticky`, même largeur, mêmes
 * marges, même fond — au pixel.
 */
function BarreSquelette({ rangeeMobile = true }: { rangeeMobile?: boolean }) {
  return (
    <header className="sticky top-0 z-50 mobile:fixed mobile:inset-x-0 bg-sombre-fond">
      <div
        className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                   flex flex-wrap lg:flex-nowrap items-center gap-x-5 py-3"
      >
        <div className="flex lg:flex-1 items-center min-w-0">
          <LogoYokofolio
            hauteur={48}
            classe="h-9 sm:h-11 lg:h-12 w-auto max-w-full object-contain object-left"
          />
        </div>
        {/*  Le moteur du web : un encadré gris à sa place exacte —
             caché sous 1024 px, comme le vrai (la rangée du doigt
             prend le relais, comme sur la vraie barre). */}
        <div className="hidden lg:flex flex-1 justify-center min-w-0">
          <div className="h-12 w-full max-w-[720px] rounded-full bg-sombre-eleve" />
        </div>
        <div className="flex lg:flex-1 items-center justify-end gap-x-2">
          <RondGris />
          <RondGris />
        </div>
        {/*  La rangée du doigt (la pilule de recherche), sous la
             barre — même repli par largeur que la vraie rangée. */}
        {rangeeMobile && (
          <div className="lg:hidden w-full flex justify-center">
            <div className="w-full max-w-[720px] pt-3">
              <div className="h-12 w-full rounded-full bg-sombre-eleve" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/** Une carte de mosaïque, grise : le cadre 4/5 de la photo, puis la
    ligne d'identité — les deux zones de la vraie carte. */
function CarteGrise() {
  return (
    <li className="min-w-0">
      <div className={`${CADRE_PHOTO_PORTFOLIO} w-full rounded-xl bg-sombre-eleve`} />
      <div className="mt-2 h-4 w-2/3 rounded bg-sombre-eleve" />
    </li>
  );
}

/** Le corps commun : le titre de résultats, puis la grille grise —
    les mêmes rythmes que `LigneResultats` (pt-6/sm:pt-8) et la vraie
    mosaïque. Huit cartes : deux rangées pleines en quatre colonnes,
    quatre en deux colonnes au doigt — l'écran est couvert sans
    fabriquer une page artificiellement longue. */
function MosaiqueGrise() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la page"
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16 animate-pulse`}
    >
      <div className="pt-6 sm:pt-8 pb-5 sm:pb-6 mobile:pt-3">
        <div className="h-6 w-44 rounded bg-sombre-eleve" />
      </div>
      <ul className={CLASSES_GRILLE_CARTES}>
        {Array.from({ length: 8 }, (_, rang) => (
          <CarteGrise key={rang} />
        ))}
      </ul>
    </main>
  );
}

/** LA RECHERCHE (et la page style + ville, même famille) : barre +
    titre + mosaïque grise. */
export function SqueletteRecherche() {
  return (
    <>
      <BarreSquelette />
      <MosaiqueGrise />
    </>
  );
}

/** « MA SÉLECTION » : barre (sans la rangée de recherche — la vraie
    page porte ses DEUX MENUS à la place, nº 245), la rangée des deux
    menus grise, puis la même mosaïque. */
export function SqueletteSelection() {
  return (
    <>
      <BarreSquelette rangeeMobile={false} />
      <div className={`mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 animate-pulse`}>
        <div className="flex justify-center gap-3 pt-3 lg:pt-0">
          <div className="h-12 w-full max-w-[352px] rounded-full bg-sombre-eleve" />
          <div className="h-12 w-full max-w-[352px] rounded-full bg-sombre-eleve" />
        </div>
      </div>
      <MosaiqueGrise />
    </>
  );
}
