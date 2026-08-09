"use client";

import { useState } from "react";
import { IconeCroix, IconeLien, IconePlus } from "@/components/Icones";
import { MANQUE } from "@/lib/erreurs-formulaire";
import { normaliserUrlLibre } from "@/lib/liens-fiche";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";

/**
 * UN LIEN LIBRE — « AJOUTER UN LIEN », URL + TITRE (passe nº 116)
 * ================================================================
 * ⚠️ IL REMPLACE LES CHAMPS « Site web » ET « Linktree » du bloc
 * PROFIL. Le formulaire offre DEUX EMPLACEMENTS identiques ; chacun
 * vit en trois temps :
 *
 *   VIDE     → une ligne « + Ajouter un lien », rien d'autre ;
 *   ÉDITION  → deux champs, « URL » et « Titre » (16 caractères au
 *              plus, borne dure `maxLength`), un bouton « Ajouter »
 *              (capsule naturelle) et « Annuler » (texte brut) ;
 *   VALIDÉ   → une ligne qui affiche LE TITRE CHOISI, avec une croix
 *              pour retirer le lien.
 *
 * ⚠️ RIEN N'EST DEVINÉ. L'ancien champ reconnaissait Linktree et
 * Beacons et refusait un site rangé dans la mauvaise case ; ici,
 * l'utilisateur nomme son lien lui-même et AUCUN service n'est
 * détecté — c'est la consigne. Seule la FORME de l'URL est vérifiée
 * (un domaine et son extension, le protocole s'ajoute seul).
 *
 * LES MANQUES suivent la charte : à la validation (celle du bouton
 * « Ajouter » comme celle de l'envoi du formulaire), le champ vide
 * s'encadre de ROUGE — sans un mot ; une URL mal formée porte la
 * mention courte « Lien non valide », DANS le champ (règle nº 112).
 *
 * CÔTÉ BASE, RIEN NE CASSE : les deux emplacements s'enregistrent
 * dans les colonnes historiques `site_web` et `page_de_liens`,
 * complétées par leurs titres (`titre_site_web`,
 * `titre_page_de_liens` — migration nº 51).
 */

/** Un emplacement de lien, tel que le formulaire le tient. */
export type LienLibreSaisie = {
  url: string;
  titre: string;
  etat: "vide" | "edition" | "valide";
};

export const LIEN_LIBRE_VIDE: LienLibreSaisie = {
  url: "",
  titre: "",
  etat: "vide",
};

/** Le plafond du titre — court, pour tenir sur la ligne de la fiche. */
export const TITRE_LIEN_MAXIMUM = 16;

//  Le même habillage que tous les champs du formulaire : fond un cran
//  plus clair, éclairci au focus (nº 116), bordure rouge en faute.
const CHAMP = `w-full min-h-[48px] rounded-xl border bg-sombre-eleve px-4
  text-base text-sombre-texte placeholder:text-sombre-texte-doux outline-none
  transition-colors focus:bg-sombre-eleve-clair`;

export function LienLibre({
  id,
  valeur,
  surChangement,
  erreur,
}: {
  /** L'ancre du défilement automatique vers l'erreur. */
  id: string;
  valeur: LienLibreSaisie;
  surChangement: (valeur: LienLibreSaisie) => void;
  /** L'erreur posée par la validation du FORMULAIRE — `MANQUE`
      (muette : un des deux champs est vide) ou « Lien non valide ». */
  erreur?: string | null;
}) {
  /** VRAI après un « Ajouter » refusé : les marques locales
      s'allument sans attendre l'envoi du formulaire. */
  const [tente, setTente] = useState(false);

  const urlVide = !valeur.url.trim();
  const titreVide = !valeur.titre.trim();
  const urlRefusee = !urlVide && normaliserUrlLibre(valeur.url) === null;

  /** Les marques s'allument après une tentative (locale ou envoi). */
  const accuse = tente || Boolean(erreur);
  const fauteUrl = accuse && (urlVide || urlRefusee);
  const fauteTitre = accuse && titreVide;

  function poserChamp(morceau: Partial<LienLibreSaisie>) {
    surChangement({ ...valeur, ...morceau, etat: "edition" });
  }

  /** LE BOUTON « AJOUTER » : les deux champs présents et l'URL bien
      formée → la ligne se replie sur son titre. Sinon, les marques
      rouges s'allument — sans un mot, sauf la mention de forme. */
  function validerLeLien() {
    if (urlVide || titreVide || urlRefusee) {
      setTente(true);
      return;
    }
    setTente(false);
    surChangement({
      url: valeur.url.trim(),
      titre: valeur.titre.trim(),
      etat: "valide",
    });
  }

  function retirerLeLien() {
    setTente(false);
    surChangement({ ...LIEN_LIBRE_VIDE });
  }

  /* ---------- VIDE — l'emplacement « Ajouter un lien ». ---------- */
  if (valeur.etat === "vide") {
    return (
      <button
        id={id}
        type="button"
        onClick={() => surChangement({ ...valeur, etat: "edition" })}
        className="flex w-full min-h-[52px] items-center gap-3 rounded-xl
                   bg-sombre-eleve px-4 text-left text-base
                   text-sombre-texte-doux transition-colors
                   hover:bg-primaire/10 hover:text-primaire"
      >
        <span aria-hidden="true" className="shrink-0">
          <IconePlus taille={16} />
        </span>
        Ajouter un lien
      </button>
    );
  }

  /* ---------- VALIDÉ — le titre choisi, et sa croix. ---------- */
  if (valeur.etat === "valide") {
    return (
      <div
        id={id}
        className="flex min-h-[52px] items-center gap-3 rounded-xl
                   bg-sombre-eleve px-4"
      >
        <span aria-hidden="true" className="shrink-0 text-sombre-texte-doux">
          <IconeLien taille={19} />
        </span>
        <span
          className="min-w-0 flex-1 truncate text-base font-semibold
                     text-sombre-texte"
          title={valeur.url}
        >
          {valeur.titre}
        </span>
        <button
          type="button"
          onClick={retirerLeLien}
          aria-label={`Retirer le lien ${valeur.titre}`}
          title="Retirer ce lien"
          className="flex h-9 w-9 shrink-0 items-center justify-center
                     rounded-full text-sombre-texte-doux transition-colors
                     hover:bg-sombre-eleve-clair hover:text-sombre-texte"
        >
          <IconeCroix taille={15} />
        </button>
      </div>
    );
  }

  /* ---------- ÉDITION — URL, Titre, Ajouter / Annuler. ---------- */
  return (
    <div id={id} className="flex flex-col gap-2.5">
      <div className="relative">
        <input
          type="url"
          {...sansRemplissageAuto(`${id}-url`)}
          value={valeur.url}
          onChange={(evenement) => poserChamp({ url: evenement.target.value })}
          placeholder="URL"
          aria-label="L'adresse du lien"
          aria-invalid={fauteUrl}
          className={`${CHAMP} ${
            fauteUrl ? "border-erreur" : "border-transparent"
          } ${accuse && urlRefusee ? "pr-32" : ""}`}
        />
        {/* LA MENTION COURTE, dans le champ (règle nº 112) : une URL
            qu'on ne sait pas lire, le rouge seul laisserait buter. */}
        {accuse && urlRefusee && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2
                       -translate-y-1/2 text-[12.5px] font-semibold text-erreur"
          >
            Lien non valide
          </span>
        )}
      </div>
      {/* LE TITRE, ET SON DÉCOMPTE (passe nº 117, point 5). Le plafond
          de seize caractères était une borne MUETTE : on tapait, et à
          un moment la frappe ne rentrait plus, sans qu'on sache
          pourquoi. Le décompte le dit à l'avance — MÊME FORME que
          celui de « Ta présentation » : « 0/16 », dans le champ, à
          droite, en chiffres tabulaires et gris doux. */}
      <div className="relative">
        <input
          type="text"
          {...sansRemplissageAuto(`${id}-titre`)}
          value={valeur.titre}
          onChange={(evenement) =>
            poserChamp({
              titre: evenement.target.value.slice(0, TITRE_LIEN_MAXIMUM),
            })
          }
          maxLength={TITRE_LIEN_MAXIMUM}
          placeholder="Titre"
          aria-label={`Le titre du lien (${TITRE_LIEN_MAXIMUM} caractères au plus)`}
          aria-describedby={`${id}-compteur`}
          aria-invalid={fauteTitre}
          className={`${CHAMP} pr-16 ${
            fauteTitre ? "border-erreur" : "border-transparent"
          }`}
        />
        <p
          id={`${id}-compteur`}
          role="status"
          className="pointer-events-none absolute right-3.5 top-1/2
                     -translate-y-1/2 text-[12.5px] tabular-nums
                     text-sombre-texte-doux"
        >
          {valeur.titre.length}/{TITRE_LIEN_MAXIMUM}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* RÈGLE DES BOUTONS : l'action intermédiaire porte une
            capsule à sa mesure ; annuler est un texte brut. */}
        <button
          type="button"
          onClick={validerLeLien}
          className="inline-flex items-center rounded-full bg-sombre-eleve
                     px-5 min-h-[42px] text-[14px] font-semibold
                     text-sombre-texte transition-colors
                     hover:bg-primaire/15 hover:text-primaire"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={retirerLeLien}
          className="px-1 min-h-[42px] text-[13.5px] font-semibold
                     text-sombre-texte-doux transition-colors
                     hover:text-sombre-texte"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/** L'ERREUR DE VALIDATION D'UN EMPLACEMENT, pour l'envoi du
    formulaire — écrite ICI, à côté de la mécanique qu'elle juge :
    · vide, ou ouvert mais vierge → rien (les liens sont libres) ;
    · un des deux champs manque   → `MANQUE` (le champ rougit) ;
    · l'URL est mal formée        → « Lien non valide ». */
export function erreurDuLienLibre(lien: LienLibreSaisie): string | null {
  if (lien.etat === "vide") return null;
  const urlVide = !lien.url.trim();
  const titreVide = !lien.titre.trim();
  if (urlVide && titreVide) return null;
  if (urlVide || titreVide) return MANQUE;
  if (normaliserUrlLibre(lien.url) === null) return "Lien non valide";
  return null;
}
