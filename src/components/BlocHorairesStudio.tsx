"use client";

import { useState } from "react";
import { IconeCroix } from "@/components/Icones";
import {
  JOURS_STUDIO,
  PLAGES_PAR_JOUR,
  semaineVide,
  type Plage,
  type SemaineStudio,
} from "@/lib/horaires-studio";

/**
 * LES HORAIRES D'OUVERTURE, DANS LE FORMULAIRE DU STUDIO
 * =======================================================
 * RÉSERVÉ AUX STUDIOS. Un artiste n'a pas d'horaires d'ouverture au
 * public : il reçoit sur rendez-vous. Le module n'apparaît donc que
 * sur une fiche de type studio (voir FormulaireFiche).
 *
 * FACULTATIF. Une fiche sans horaires reste valide, et sa page
 * n'affiche simplement pas l'accordéon. On ne bloque personne sur un
 * tableau d'heures.
 *
 * SEPT LIGNES, ET RIEN D'AUTRE
 * -----------------------------
 * Un jour est FERMÉ tant qu'on ne lui a rien donné — c'est l'état par
 * défaut, et il ne demande aucun clic. Un bouton l'ouvre, deux champs
 * d'heure le remplissent, un deuxième créneau couvre la coupure du
 * midi. Deux créneaux maximum : au-delà, on demanderait à un tatoueur
 * de tenir un tableur.
 *
 * ⚠️ « COPIER SUR LES AUTRES JOURS » N'EST PAS UN CONFORT, C'EST LA
 * CONDITION POUR QUE CE MODULE SOIT REMPLI. Sept jours × deux
 * créneaux × deux champs, c'est vingt-huit saisies : personne ne va
 * au bout. Un studio ouvre presque toujours aux mêmes heures du mardi
 * au samedi — on remplit UNE ligne, et on la propage. Le bouton
 * n'apparaît que sur les jours qui ont quelque chose à copier.
 *
 * CHAQUE STUDIO A LES SIENS. Une enseigne à Lyon et à Bordeaux
 * n'ouvre pas aux mêmes heures : ce module est donc posé DANS chaque
 * studio de la liste, pas une fois pour la fiche.
 */

/**
 * LE CHAMP D'HEURE COMPACT (passe nº 106). L'ancien faisait 44 px de
 * haut avec bordure et remplissage : deux créneaux et une croix
 * DÉBORDAIENT à 320 px — les boîtes se chevauchaient. Celui-ci est
 * une pastille à largeur FIXE (72 px) : « 10:00 » y tient toujours,
 * et quatre champs, deux tirets et deux croix tiennent sur la ligne.
 * L'indicateur d'horloge de Chrome est masqué (il rongeait la
 * largeur) — toucher le champ ouvre toujours le sélecteur natif.
 */
/**
 * ⚠️ ET SON TEXTE EST VRAIMENT CENTRÉ (passe nº 107). `text-center` ne
 * suffisait pas : le contenu d'un champ d'heure n'est pas du texte
 * ordinaire, c'est une petite mécanique interne au navigateur
 * (`::-webkit-datetime-edit` et ses champs), qui se pose À GAUCHE et
 * n'occupe que sa propre largeur — l'alignement du champ ne l'atteint
 * jamais. On l'étire donc à toute la largeur ET on centre ses champs :
 * les heures se posent enfin au milieu de leur pastille, sur le web
 * comme au doigt.
 */
const CHAMP_HEURE = `h-[38px] w-[72px] rounded-lg bg-sombre-eleve-clair px-0
  text-center text-[14px] tabular-nums text-sombre-texte outline-none
  transition-colors focus:bg-sombre-haut
  [&::-webkit-calendar-picker-indicator]:hidden
  [&::-webkit-datetime-edit]:w-full
  [&::-webkit-datetime-edit]:p-0
  [&::-webkit-datetime-edit]:text-center
  [&::-webkit-datetime-edit-fields-wrapper]:w-full
  [&::-webkit-datetime-edit-fields-wrapper]:flex
  [&::-webkit-datetime-edit-fields-wrapper]:justify-center
  [&::-webkit-datetime-edit-hour-field]:p-0
  [&::-webkit-datetime-edit-minute-field]:p-0`;

export function BlocHorairesStudio({
  horaires,
  surChangement,
  /** Un identifiant unique par studio : deux modules sur la même page
      ne doivent pas partager les identifiants de leurs champs. */
  prefixe,
}: {
  horaires: SemaineStudio | undefined;
  surChangement: (horaires: SemaineStudio) => void;
  prefixe: string;
}) {
  const semaine = horaires ?? semaineVide();
  /** Le jour dont on vient de propager les horaires — une confirmation
      d'une seconde, pour qu'un clic sans effet visible ne laisse pas
      croire qu'il ne s'est rien passé. */
  const [copieFaite, setCopieFaite] = useState<number | null>(null);

  function ecrire(jour: number, plages: Plage[]) {
    const suivante = semaine.map((liste, index) =>
      index === jour ? plages : liste
    );
    surChangement(suivante);
  }

  /** OUVRIR UN JOUR — avec des heures plausibles, pas des champs
      vides. « 10h – 19h » est l'ouverture la plus répandue ; on part
      de là, et l'on corrige. Un champ vide demande deux saisies de
      plus à chaque jour. */
  function ouvrirLeJour(jour: number) {
    ecrire(jour, [{ debut: "10:00", fin: "19:00" }]);
  }

  function ajouterUneCoupure(jour: number) {
    const plages = semaine[jour];
    if (plages.length >= PLAGES_PAR_JOUR) return;
    ecrire(jour, [...plages, { debut: "14:00", fin: "19:00" }]);
  }

  function modifierPlage(jour: number, rang: number, morceau: Partial<Plage>) {
    ecrire(
      jour,
      semaine[jour].map((plage, index) =>
        index === rang ? { ...plage, ...morceau } : plage
      )
    );
  }

  function retirerPlage(jour: number, rang: number) {
    ecrire(
      jour,
      semaine[jour].filter((_, index) => index !== rang)
    );
  }

  /** LA LIGNE D'UN JOUR RECOPIÉE SUR LES SIX AUTRES. On copie une
      VALEUR, pas une référence : sans le `map`, modifier mardi
      modifierait aussi mercredi — le genre de bug qu'on ne voit qu'en
      relisant sa fiche publique. */
  function copierSurLesAutres(jour: number) {
    const modele = semaine[jour].map((plage) => ({ ...plage }));
    surChangement(
      semaine.map((liste, index) =>
        index === jour ? liste : modele.map((plage) => ({ ...plage }))
      )
    );
    setCopieFaite(jour);
    window.setTimeout(() => setCopieFaite(null), 1600);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ⚠️ PLUS D'EN-TÊTE INTERNE (passe nº 104) : le bloc a retrouvé
          son vrai titre — « Horaires d'ouverture » — porté par la
          Section du formulaire. (La mention « (facultatif) » a disparu
          avec toutes les autres à la passe nº 106 : rester vide est
          permis, et la validation n'exige rien ici.) */}

      {/* ⚠️ DEUX COLONNES, PUIS DEUX ÉTAGES (passe nº 108). La passe
          nº 107 avait mal lu la demande : elle posait les actions sur
          la ligne du jour et repoussait les horaires en dessous —
          l'inverse de ce qu'il fallait. La lecture est maintenant
          celle-ci, et c'est la même au doigt et sur le web :

            Lundi   [10:00] – [19:00]                        ×
                    [+ Coupure du midi] [Dupliquer les horaires]

          À GAUCHE, une colonne étroite pour le JOUR (abrégé au doigt,
          entier dès `sm`). À DROITE, tout le reste, dans SA colonne :
          une ligne par créneau — ouverture, fermeture, et la CROIX
          poussée au bord droit de l'encadré (`ml-auto`) —, puis les
          DEUX BADGES juste dessous, ALIGNÉS SUR LES CHAMPS parce
          qu'ils vivent dans la même colonne. Ils n'ont plus à être
          « poussés » où que ce soit : leur place vient de la
          structure.
          (Les filets gardent le `py-4` aéré de la passe nº 106.) */}
      <ul className="flex flex-col divide-y divide-sombre-bordure/60">
        {JOURS_STUDIO.map((jour) => {
          const plages = semaine[jour.index] ?? [];
          const ferme = plages.length === 0;
          return (
            <li
              key={jour.index}
              className="flex items-start gap-2.5 py-4 first:pt-0 last:pb-0 sm:gap-3"
            >
              {/* ---------- LA COLONNE DU JOUR ----------
                  `pt` la pose à hauteur du texte des pastilles, pas de
                  leur bord haut : les deux se lisent sur la même
                  ligne d'écriture.
                  ⚠️ 32 px AU DOIGT (passe nº 108) : « Lun », le plus
                  large des sept abrégés, en occupe 27 — les huit
                  pixels rendus à la colonne de droite sont ceux qui
                  permettent aux deux badges d'y tenir côte à côte sur
                  un téléphone courant. */}
              <span
                className="w-[32px] shrink-0 pt-[9px] text-[14px] font-semibold
                           text-sombre-texte sm:w-[86px] sm:text-[14.5px]"
              >
                <span className="sm:hidden">{jour.court}</span>
                <span className="hidden sm:inline">{jour.label}</span>
              </span>

              {/* ---------- LA COLONNE DES HORAIRES ---------- */}
              <div className="min-w-0 flex-1">
                {ferme ? (
                  <div className="flex min-h-[38px] flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-[14px] text-sombre-texte-doux">
                      Fermé
                    </span>
                    <button
                      type="button"
                      onClick={() => ouvrirLeJour(jour.index)}
                      //  §2 (nº 419) — la paire du FORMULAIRE, comme
                      //  « + Ajouter un studio » : ce bouton en est le
                      //  jumeau, il ne peut pas rester d'un autre gris.
                      className="ml-auto rounded-full bg-sombre-eleve-clair px-3.5 min-h-[34px]
                                 text-[13px] font-semibold text-sombre-texte
                                 transition-colors hover:bg-sombre-haut
                                 hover:text-primaire"
                    >
                      + Ajouter des horaires
                    </button>
                  </div>
                ) : (
                  <>
                    {/* UNE LIGNE PAR CRÉNEAU — sur la ligne du jour
                        pour le premier, dessous pour la coupure. */}
                    {plages.map((plage, rang) => (
                      <div
                        key={rang}
                        className="flex items-center gap-1.5 mt-2 first:mt-0"
                      >
                        <input
                          type="time"
                          aria-label={`${jour.label} — ouverture ${rang + 1}`}
                          id={`${prefixe}-${jour.index}-${rang}-debut`}
                          value={plage.debut}
                          onChange={(evenement) =>
                            modifierPlage(jour.index, rang, {
                              debut: evenement.target.value,
                            })
                          }
                          className={CHAMP_HEURE}
                        />
                        <span aria-hidden="true" className="text-sombre-texte-doux">
                          –
                        </span>
                        <input
                          type="time"
                          aria-label={`${jour.label} — fermeture ${rang + 1}`}
                          id={`${prefixe}-${jour.index}-${rang}-fin`}
                          value={plage.fin}
                          min={plage.debut || undefined}
                          onChange={(evenement) =>
                            modifierPlage(jour.index, rang, {
                              fin: evenement.target.value,
                            })
                          }
                          className={CHAMP_HEURE}
                        />
                        <button
                          type="button"
                          onClick={() => retirerPlage(jour.index, rang)}
                          aria-label={`Retirer ce créneau du ${jour.label.toLowerCase()}`}
                          className="ml-auto flex h-9 w-9 shrink-0 items-center
                                     justify-center rounded-full text-sombre-texte-doux
                                     transition-colors hover:text-erreur"
                        >
                          <IconeCroix taille={16} />
                        </button>
                      </div>
                    ))}

                    {/* LES DEUX BADGES, SOUS LES CHAMPS ET DANS LEUR
                        COLONNE — côte à côte, la coupure d'abord.
                        ⚠️ LEURS GOUTTIÈRES SE RESSERRENT AU DOIGT
                        (px-2, gap-1, texte 12 px) : à 390 px la
                        colonne ne fait que 290 px, et selon la police
                        réellement chargée les deux badges frôlaient —
                        ou dépassaient — cette largeur (constat de la
                        passe nº 116 : ils se repliaient déjà l'un sous
                        l'autre sur le banc). Ces trois crans-là leur
                        rendent une marge d'une dizaine de pixels,
                        quelle que soit la fonte. Dès `sm`, tout
                        reprend ses aises (px-3, gap-2, 12.5 px).
                        Sous 380 px, ils se replient l'un sous l'autre :
                        c'est la seule largeur où rien ne peut les
                        faire tenir sans rogner la lisibilité.
                        L'ordre, lui, ne change jamais. */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                      {plages.length < PLAGES_PAR_JOUR && (
                        <button
                          type="button"
                          onClick={() => ajouterUneCoupure(jour.index)}
                          //  §2 (nº 419) — même paire que ses voisins.
                          className="rounded-full bg-sombre-eleve-clair px-2 min-h-[32px]
                                     text-[12px] font-semibold text-sombre-texte-doux
                                     transition-colors hover:bg-sombre-haut
                                     hover:text-primaire sm:px-3 sm:text-[12.5px]"
                        >
                          + Coupure du midi
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copierSurLesAutres(jour.index)}
                        className={`rounded-full px-2 min-h-[32px] text-[12px]
                                   font-semibold transition-colors sm:px-3 sm:text-[12.5px] ${
                                     copieFaite === jour.index
                                       ? "bg-sombre-haut text-primaire"
                                       : "bg-sombre-eleve-clair text-sombre-texte-doux hover:bg-sombre-haut hover:text-primaire"
                                   }`}
                      >
                        {/* « DUPLIQUER LES HORAIRES » (passe nº 107) —
                            « Copier sur les autres jours » disait la
                            mécanique ; celui-ci dit le geste. */}
                        {copieFaite === jour.index
                          ? "✓ Horaires dupliqués"
                          : "Dupliquer les horaires"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
