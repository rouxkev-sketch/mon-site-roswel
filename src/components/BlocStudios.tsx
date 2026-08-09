"use client";

import { useState } from "react";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { DeuxZonesLieu } from "@/components/DeuxZonesLieu";
import { IconeCroix } from "@/components/Icones";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import type { StudioEnSaisie } from "@/lib/modes-exercice";
import { texteErreur } from "@/lib/erreurs-formulaire";

/**
 * LES STUDIOS D'UNE ENSEIGNE, DANS LE FORMULAIRE DU SALON
 * ========================================================
 * Le pendant exact des modes d'exercice, vu de l'autre côté du
 * comptoir : un salon n'a pas de mode, il a des ADRESSES. Une, ou
 * plusieurs — la même enseigne à Lyon et à Paris, sans limite.
 *
 * LE PREMIER STUDIO EST CELUI DE LA FICHE : c'est lui qui porte le
 * nom, les coordonnées et l'adresse de la page. Il ne se supprime
 * donc pas — une fiche de salon sans adresse n'existe pas. Les
 * suivants s'ajoutent dessous, chacun avec SON nom (« Croix-Rousse »,
 * « Marais ») et SON bouton « Supprimer », libellé comme il se doit.
 *
 * CHAQUE STUDIO EST UN POINT DE PLUS SUR LA CARTE : l'enseigne
 * remonte dans les recherches de Lyon ET de Paris (voir
 * `pointsDeLaFiche`).
 */

export function BlocStudios({
  studios,
  etablissement,
  surChangement,
  surMobile,
  enErreur,
}: {
  /** Le premier est toujours le studio principal (celui de la fiche). */
  studios: StudioEnSaisie[];
  /** « prive » = studio privé : la VILLE SEULE suffit, et l'indication
      du champ le dit (voir `adresseSuffisante`). */
  etablissement?: string | null;
  surChangement: (studios: StudioEnSaisie[]) => void;
  surMobile: boolean;
  enErreur?: string | null;
}) {
  /** Le studio dont la croix a été cliquée — son contenu laisse alors
      place à la ligne de confirmation. */
  const [aSupprimer, setAsupprimer] = useState<string | null>(null);

  /** SUPPRIMER, CONFIRMÉ. La page raccourcit : si l'on était en bas,
      la fenêtre se retrouverait au-delà du contenu. On la ramène en
      douceur à la position la plus basse encore valable. */
  function supprimerLeStudio(cle: string) {
    setAsupprimer(null);
    surChangement(studios.filter((s) => s.cle !== cle));
    window.requestAnimationFrame(() => {
      const basMaximal = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      if (window.scrollY > basMaximal) {
        window.scrollTo({ top: basMaximal, behavior: "smooth" });
      }
    });
  }

  function modifier(cle: string, morceau: Partial<StudioEnSaisie>) {
    surChangement(
      studios.map((studio) =>
        studio.cle === cle ? { ...studio, ...morceau } : studio
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {studios.map((studio, rang) => {
          const principal = rang === 0;
          return (
            //  ⚠️ PLUS DE CARTE PAR STUDIO (passe nº 103) : le bloc 1
            //  est déjà un encadré, un filet entre deux adresses
            //  sépare aussi bien qu'une boîte grise dans la boîte.
            //  ⚠️ LE FILET COURT DE BORD À BORD (passe nº 105) — même
            //  règle que les modes d'un artiste : les marges négatives
            //  annulent le remplissage de l'encadré (px-4, sm:px-7) et
            //  le remplissage propre du li le rétablit pour le contenu.
            <li
              key={studio.cle}
              //  ⚠️ LE MÊME AIR DES DEUX CÔTÉS DU FILET (passe nº 116,
              //  point 1) — la règle des modes d'un artiste vaut pour
              //  les studios d'une enseigne : 24 px au-dessus (gap-3 +
              //  mt-3) comme en dessous (pt-6), 28/28 dès `sm`.
              //  ⚠️ ALIGNÉ SUR LE TEXTE SOUS 640 px (passe nº 120) —
              //  la règle des filets des modes vaut ici mot pour mot.
              className="relative mt-3 border-t border-sombre-bordure pt-6
                         first:mt-0 first:border-t-0 first:pt-0 sm:-mx-7 sm:mt-4
                         sm:px-7 sm:pt-7
                         opacity-100 transition-opacity duration-200 starting:opacity-0"
            >
              {/* LA CONFIRMATION REMPLACE LE CONTENU — une ligne, dans
                  le bloc lui-même. Pas de fenêtre modale pour retirer
                  une adresse d'un formulaire. */}
              {aSupprimer === studio.cle ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[14.5px] font-semibold text-sombre-texte">
                    Supprimer ce studio&nbsp;?
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAsupprimer(null)}
                      //  ⚠️ RÈGLE DES BOUTONS (passe nº 104) : annuler
                      //  est une action de retrait — TEXTE BRUT,
                      //  jamais de capsule.
                      className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                 text-sombre-texte-doux transition-colors
                                 hover:text-sombre-texte"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimerLeStudio(studio.cle)}
                      //  Supprimer : négative elle aussi — texte nu,
                      //  le rouge porte seul la gravité du geste.
                      className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                 text-erreur transition-colors hover:opacity-75"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
              <>
              {/* LE TITRE SEUL. Le sous-titre (« L'adresse portée par
                  ta fiche. ») disait ce que le titre dit déjà.
                  LA CROIX remplace le bouton « Supprimer » : discrète,
                  en haut à droite, à 40 % — et ABSENTE sur le studio
                  principal, qui ne se supprime pas. Absente plutôt
                  qu'inerte : une croix qui ne fait rien se clique
                  quand même. */}
              {!principal && (
                <button
                  type="button"
                  onClick={() => setAsupprimer(studio.cle)}
                  aria-label={`Supprimer le studio ${rang + 1}`}
                  className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center
                             justify-center rounded-full text-sombre-texte-doux
                             opacity-40 transition-opacity hover:opacity-100
                             focus-visible:opacity-100"
                >
                  <IconeCroix taille={16} />
                </button>
              )}
              {/* ⚠️ PLUS DE PARAGRAPHE VIDE SUR LE STUDIO PRINCIPAL
                  (passe nº 107). Il ne portait AUCUN texte — le studio
                  de la fiche n'a pas de numéro — mais gardait sa
                  hauteur de ligne (22 px), à quoi s'ajoutait le `mt-4`
                  du contenu : quarante pixels de vide entre la
                  glissière et le titre du champ, sans rien pour les
                  justifier. Le titre suit maintenant directement. */}
              {!principal && (
                <p className="pr-10 text-[15px] font-semibold text-sombre-texte">
                  {`Studio ${rang + 1}`}
                </p>
              )}

              <div
                className={`flex flex-col gap-3.5 ${principal ? "" : "mt-4"}`}
              >
                {/* LE NOM DU STUDIO — facultatif pour le principal (il
                    reprend celui de l'enseigne), utile pour les
                    autres : c'est ce nom qui s'affiche dans la liste
                    des adresses de la fiche. */}
                {!principal && (
                  <div>
                    <label
                      htmlFor={`studio-nom-${studio.cle}`}
                      className="mb-1.5 block text-sm font-medium text-sombre-texte"
                    >
                      Le nom de ce studio
                    </label>
                    <input
                      id={`studio-nom-${studio.cle}`}
                      type="text"
                      // ⚠️ LE CHAMP DE LA CAPTURE : c'est celui-ci que
                      // Chrome prenait pour un nom de contact — il y
                      // posait sa silhouette et proposait le carnet
                      // d'adresses du téléphone par-dessus la page.
                      {...sansRemplissageAuto(`studio-nom-${studio.cle}`)}
                      value={studio.nom}
                      placeholder="Croix-Rousse, Marais…"
                      onChange={(evenement) =>
                        modifier(studio.cle, { nom: evenement.target.value })
                      }
                      className="w-full min-h-[48px] rounded-xl border border-transparent
                                 bg-sombre-eleve px-4 text-base text-sombre-texte
                                 placeholder:text-sombre-texte-doux outline-none
                                 transition-colors focus:bg-sombre-eleve-clair"
                    />
                  </div>
                )}

                {/* ---------- LA LOCALISATION D'UN AUTRE STUDIO ----
                    DEUX ZONES, L'UNE SOUS L'AUTRE, ouvertes en même
                    temps — la même mécanique que pour les modes d'un
                    artiste (voir DeuxZonesLieu). On ne demande plus
                    « ce studio est-il déjà sur yokofolio ? » avec deux
                    boutons radio : on ouvre les deux chemins, et le
                    tatoueur remplit celui qui le concerne.
                    ⚠️ LA ZONE B ACCEPTE DÉSORMAIS UNE VRAIE ADRESSE.
                    Elle affichait auparavant un paragraphe qui
                    renvoyait à plus tard (« crée d'abord sa fiche,
                    puis reviens ») : une impasse pour une enseigne qui
                    veut simplement déclarer ses trois adresses. */}
                {!principal && (
                  <DeuxZonesLieu
                    prefixe={`studio-${studio.cle}`}
                    titreInscrit="Ce studio est sur le site"
                    titreManuel="Ce studio n'est pas sur le site"
                    ficheChoisie={studio.fiche ?? null}
                    surFiche={(fiche) =>
                      modifier(studio.cle, {
                        fiche,
                        // Le lieu du studio EST celui de la fiche
                        // trouvée : c'est lui qui le place sur la carte.
                        lieu:
                          fiche && fiche.latitude != null && fiche.longitude != null
                            ? {
                                identifiant: fiche.lieu_id ?? `fiche:${fiche.id}`,
                                intitule: fiche.adresse ?? fiche.nom,
                                contexte: fiche.ville_nom ?? "",
                                adresse: fiche.adresse ?? null,
                                ville: fiche.ville_nom ?? null,
                                code_postal: fiche.code_postal ?? null,
                                region: fiche.region ?? null,
                                pays: fiche.pays ?? null,
                                code_pays: fiche.code_pays ?? null,
                                latitude: fiche.latitude,
                                longitude: fiche.longitude,
                                precision: fiche.adresse ? "adresse" : "ville",
                              }
                            : studio.lieu,
                        nom: fiche ? fiche.nom : studio.nom,
                      })
                    }
                    lieu={studio.fiche ? null : studio.lieu}
                    surLieu={(lieu) =>
                      //  ⚠️ POSER UNE ADRESSE LÂCHE LA FICHE dans la
                      //  MÊME écriture (passe nº 105) : deux écritures
                      //  séparées se perdaient — React groupe les
                      //  états, la seconde écrasait la première et la
                      //  fiche restait en mémoire sous l'adresse.
                      //  C'est aussi par ici que DeuxZonesLieu restitue
                      //  l'adresse mise de côté quand la croix retire
                      //  la fiche.
                      modifier(studio.cle, { lieu, fiche: null })
                    }
                    surMobile={surMobile}
                  />
                )}

                {principal && (
                //  ⚠️ L'ANCRE DU DÉFILEMENT VERS L'ERREUR (passe
                //  nº 111). `ORDRE_ERREURS` visait « fiche-lieu »
                //  depuis toujours — un identifiant qui n'existait
                //  NULLE PART : le champ d'adresse porte une clé par
                //  studio (`studio-lieu-<clé>`), forcément différente à
                //  chaque montage. `getElementById` rendait donc null,
                //  et la page ne remontait jamais vers l'adresse. On la
                //  pose ici, sur l'adresse PRINCIPALE — la seule que la
                //  validation réclame.
                <div id="fiche-lieu">
                  {/* ⚠️ UN SEUL TITRE POUR LES DEUX (passe nº 107) :
                      « Où es-tu ? ». « Localité » / « Adresse »
                      (passe nº 106) NOMMAIENT LA DONNÉE ; celui-ci
                      POSE LA QUESTION — c'est la voix du reste du
                      formulaire (« Qui es-tu ? », « Ton salon est-il
                      sur YokoFolio ? »), et il vaut aussi bien pour le
                      studio, à qui la ville suffit, que pour le salon,
                      qui doit sa rue. La consigne précise, elle, reste
                      dans le fantôme du champ. */}
                  <p className="mb-2 text-[13.5px] font-semibold text-sombre-texte">
                    Où es-tu&nbsp;?
                  </p>
                  <ChampLocalisation
                    // ⚠️ LA CLÉ PORTE LA NATURE DE L'ÉTABLISSEMENT, ET
                    // C'EST LA SECONDE MOITIÉ DE LA CORRECTION DU BOGUE
                    // DE L'ADRESSE QUI SURVIVAIT. Basculer Salon ↔
                    // Studio privé vide bien les studios côté état
                    // (voir FormulaireFiche), mais cela ne suffisait
                    // pas : ChampLocalisation lit `lieuInitial` UNE
                    // FOIS, au montage, puis gère son texte lui-même.
                    // Sans changement de clé, React réutilise le même
                    // composant et son texte reste à l'écran alors que
                    // la donnée est partie. La clé change avec la
                    // nature : le champ est reconstruit, donc vide.
                    key={`studio-lieu-${studio.cle}-${etablissement ?? "salon"}`}
                    id={`studio-lieu-${studio.cle}`}
                    etiquette={null}
                    // AUCUNE ÉPINGLE DANS LE FANTÔME : un émoji posé
                    // dans un `placeholder` se lit comme une icône du
                    // champ — celle-ci passait pour un bouton, et
                    // faisait double emploi avec la loupe des autres
                    // champs. Le texte seul dit ce qu'il faut faire.
                    texteIndicatif={
                    etablissement === "prive"
                      ? "Ville ou adresse complète"
                      : "Adresse complète"
                  }
                    lieuInitial={studio.lieu}
                    surChoix={(lieu) => modifier(studio.cle, { lieu })}
                    panneauDansLeFlux={surMobile}
                    remonterAuToucher={surMobile}
                    croixEffacement
                    enErreur={principal && Boolean(enErreur) && !studio.lieu}
                  />
                </div>
                )}

              </div>
              </>
              )}
            </li>
          );
        })}
      </ul>


      {/* ⚠️ UN MANQUE NE S'ÉCRIT PLUS (passe nº 111) : le champ rougit,
          et cela suffit. Les phrases qui APPRENNENT quelque chose
          passent encore ici (voir lib/erreurs-formulaire). */}
      {texteErreur(enErreur) && (
        <p className="text-[13px] text-erreur">{texteErreur(enErreur)}</p>
      )}
    </div>
  );
}
