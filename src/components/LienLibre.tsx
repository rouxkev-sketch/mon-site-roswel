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
 *   ÉDITION  → deux champs, « URL » et « Titre » (30 caractères au
 *              plus depuis la nº 405, borne dure `maxLength`), chacun
 *              avec SA CROIX D'EFFACEMENT pendant la saisie (§3,
 *              nº 405), un bouton « Ajouter » (capsule naturelle) et
 *              « Annuler » (texte brut) ;
 *   VALIDÉ   → une ligne qui affiche LE TITRE CHOISI — cliquable, elle
 *              ROUVRE L'ÉDITION avec l'URL (§4, nº 405) —, et une
 *              croix pour retirer le lien.
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

/**
 * Le plafond du titre — court, pour tenir sur la ligne de la fiche.
 * ██ nº 405 — DE 16 À 30 CARACTÈRES ██
 * ⚠️ LA BASE LE BORNAIT AUSSI, ET C'EST LE PIÈGE DE LA nº 387 : les
 * contraintes `tatoueurs_titre_site_web_longueur` et
 * `tatoueurs_titre_page_de_liens_longueur` (migration nº 51) exigent
 * `between 1 and 16`. Sans la migration `yokofolio-titre-lien-30.sql`,
 * un titre de 17 caractères est REFUSÉ PAR LA BASE à l'enregistrement.
 * MIGRATION D'ABORD, DÉPLOIEMENT ENSUITE.
 * ⚠️ CE QUE 30 CARACTÈRES DEVIENNENT À L'AFFICHAGE : sur la fiche, le
 * titre vit dans une case bornée (`max-w-full` + `truncate`, nº 391) —
 * trop long, il s'abrège par une ellipse À L'INTÉRIEUR de sa piste, et
 * ne pousse RIEN. Dans le formulaire, la ligne validée est elle aussi
 * en `truncate`. Aucune mise en page ne peut donc casser.
 */
export const TITRE_LIEN_MAXIMUM = 30;

//  Le même habillage que tous les champs du formulaire : fond un cran
//  plus clair, éclairci au focus (nº 116), bordure rouge en faute.
//  ⚠️ nº 405 — `pr-11` REMPLACE LA MOITIÉ DROITE DE `px-4` : c'est la
//  VOIE DE LA CROIX, réservée UNE FOIS POUR TOUTES (44 px, la mesure de
//  `ChampLienVerifie`). Réservée en permanence, et non posée à
//  l'entrée dans le champ : une largeur qui changerait au focus ferait
//  glisser le texte sous le curseur au moment précis où l'on écrit.
//  Le texte tapé ne passe donc JAMAIS sous la croix, et la zone de
//  frappe ne bouge pas d'un pixel entre le repos et la saisie.
const CHAMP = `w-full min-h-[48px] rounded-lg border bg-sombre-eleve-clair pl-4 pr-11
  text-base text-sombre-texte placeholder:text-sombre-texte-doux outline-none
  transition-colors focus:bg-sombre-haut`;

/**
 * ██ §3 (nº 405) — LA CROIX QUI VIDE UN CHAMP ██
 * ==================================================================
 * CE N'EST PAS UN DESSIN NEUF : c'est LA croix de champ du site, celle
 * de `ChampLienVerifie` (§4, nº 270) et de `ChampLocalisation` — même
 * bouton rond de 32 px, même `IconeCroix taille={16}`, mêmes couleurs,
 * même `preventDefault` à l'appui. Elle ne vit que pendant la saisie
 * ET sur un champ qui porte quelque chose : vide, il n'y a rien à
 * effacer ; au repos, la voie reste libre.
 * ⚠️ `preventDefault` À L'APPUI, SOURIS ET DOIGT : le bouton ne vit que
 * tant que le champ a le focus — laisser l'appui le lui voler
 * démonterait la croix SOUS le geste, avant que le clic ne l'atteigne.
 * Le focus reste donc au champ, et on enchaîne la saisie.
 */
function CroixDeChamp({
  quoi,
  surEffacement,
}: {
  /** Ce qu'on efface, pour le lecteur d'écran : « l'adresse », « le titre ». */
  quoi: string;
  surEffacement: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Effacer ${quoi}`}
      title="Effacer"
      onPointerDown={(evenement) => evenement.preventDefault()}
      onClick={surEffacement}
      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8
                 items-center justify-center rounded-full
                 text-sombre-texte-doux transition-colors
                 hover:bg-sombre-eleve hover:text-sombre-texte
                 active:bg-sombre-eleve"
    >
      <IconeCroix taille={16} />
    </button>
  );
}

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
  /** §3 (nº 405) — QUEL CHAMP EST EN SAISIE — c'est lui, et lui seul,
      qui porte sa croix (voir `CroixDeChamp`). */
  const [champEnSaisie, setChampEnSaisie] = useState<"url" | "titre" | null>(
    null
  );
  /**
   * §4 (nº 405) — LE LIEN TEL QU'IL ÉTAIT AVANT QU'ON LE ROUVRE.
   * ------------------------------------------------------------------
   * ⚠️ C'EST CE QUI EMPÊCHE « ANNULER » DE DÉTRUIRE UN LIEN VALIDÉ, et
   * c'était le défaut que le point 4 allait introduire : « Annuler »
   * appelle `retirerLeLien`, qui VIDE l'emplacement. Tant que l'édition
   * ne servait qu'à CRÉER un lien, vider était exactement le bon geste
   * — il n'y avait rien avant. Maintenant qu'on peut rouvrir un lien
   * ENREGISTRÉ pour corriger son URL, annuler doit REMETTRE CE QU'IL Y
   * AVAIT, pas l'effacer.
   * La photographie est prise au moment de rouvrir, et rendue telle
   * quelle : les retouches faites entre-temps sont abandonnées, ce qui
   * est le sens du mot « Annuler ». Elle s'efface dès que le lien est
   * revalidé ou réellement retiré — un emplacement neuf n'en a jamais.
   */
  const [avantEdition, setAvantEdition] = useState<LienLibreSaisie | null>(
    null
  );

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
    setAvantEdition(null);
    surChangement({
      url: valeur.url.trim(),
      titre: valeur.titre.trim(),
      etat: "valide",
    });
  }

  function retirerLeLien() {
    setTente(false);
    setAvantEdition(null);
    surChangement({ ...LIEN_LIBRE_VIDE });
  }

  /** §4 (nº 405) — « ANNULER » : on REPOSE le lien d'avant s'il y en
      avait un (on rouvrait un lien enregistré), on vide sinon (on
      était en train d'en créer un). Voir `avantEdition`. */
  function annuler() {
    setTente(false);
    setChampEnSaisie(null);
    if (avantEdition) {
      const repose = avantEdition;
      setAvantEdition(null);
      surChangement(repose);
      return;
    }
    retirerLeLien();
  }

  /* ---------- VIDE — l'emplacement « Ajouter un lien ». ---------- */
  if (valeur.etat === "vide") {
    return (
      <button
        id={id}
        type="button"
        onClick={() => surChangement({ ...valeur, etat: "edition" })}
        /*  §1 (nº 388) — MÊME FOND QUE LES AUTRES CHAMPS : il était
             sur `bg-sombre-eleve`, un cran plus sombre que le champ
             de saisie qu'il ouvre (voir `CHAMP`, juste au-dessus, sur
             `bg-sombre-eleve-clair`). Le bouton et le champ qu'il
             remplace se ressemblent enfin. Le survol rose ne bouge
             pas. */
        className="flex w-full min-h-[52px] items-center gap-3 rounded-lg
                   bg-sombre-eleve-clair px-4 text-left text-base
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
        className="flex min-h-[52px] items-center gap-3 rounded-lg
                   bg-sombre-eleve px-4"
      >
        <span aria-hidden="true" className="shrink-0 text-sombre-texte-doux">
          <IconeLien taille={20} />
        </span>
        {/*  ██ §4 (nº 405) — LE TITRE REDEVIENT UNE PORTE ██
             CE QU'IL Y AVAIT : une fois le lien validé, seul le titre
             s'affichait, dans un `<span>` INERTE. L'URL n'était plus
             lisible qu'en survolant le texte à la souris (l'infobulle
             `title`) — au doigt, elle n'était plus atteignable DU
             TOUT, et la seule façon de la corriger était de supprimer
             le lien par la croix et de tout retaper.
             CE QUI CHANGE : ce `<span>` devient un `<button>` qui
             REPOSE L'ÉTAT SUR « edition ». L'URL et le titre
             réapparaissent dans leurs deux champs, remplis de ce qui
             était enregistré — on corrige, on revalide par
             « Ajouter ». Rien n'est effacé au passage.
             ⚠️ LA LIGNE NE CHANGE PAS D'ALLURE : mêmes classes de
             texte, `text-left` et `w-full` rendent au bouton la
             géométrie exacte du `<span>` qu'il remplace (un bouton est
             `inline-block` et centré par défaut). Le curseur main
             arrive de la règle de la nº 398, qui vise les boutons.
             ⚠️ L'INFOBULLE RESTE : elle dit l'URL au survol, ce qui ne
             coûte rien à qui a une souris. */}
        <button
          type="button"
          onClick={() => {
            //  §4 (nº 405) — ON PHOTOGRAPHIE AVANT D'OUVRIR : c'est ce
            //  que « Annuler » remettra (voir `avantEdition`).
            setAvantEdition({ ...valeur });
            surChangement({ ...valeur, etat: "edition" });
          }}
          title={valeur.url}
          aria-label={`Modifier le lien ${valeur.titre} — ${valeur.url}`}
          className="min-w-0 flex-1 truncate rounded text-left text-base
                     font-semibold text-sombre-texte transition-colors
                     hover:text-primaire"
        >
          {valeur.titre}
        </button>
        <button
          type="button"
          onClick={retirerLeLien}
          aria-label={`Retirer le lien ${valeur.titre}`}
          title="Retirer ce lien"
          className="flex h-9 w-9 shrink-0 items-center justify-center
                     rounded-full text-sombre-texte-doux transition-colors
                     hover:bg-sombre-eleve-clair hover:text-sombre-texte"
        >
          <IconeCroix taille={16} />
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
          onFocus={() => setChampEnSaisie("url")}
          onBlur={() => setChampEnSaisie(null)}
          placeholder="URL"
          aria-label="L'adresse du lien"
          aria-invalid={fauteUrl}
          className={`${CHAMP} ${
            fauteUrl ? "border-erreur" : "border-transparent"
          } ${accuse && urlRefusee ? "pr-36" : ""}`}
        />
        {/* LA MENTION COURTE, dans le champ (règle nº 112) : une URL
            qu'on ne sait pas lire, le rouge seul laisserait buter.
            §3 (nº 405) — ELLE RECULE À `right-11` : la voie de droite
            appartient désormais à la croix, et deux marques
            superposées ne se liraient pas. Elle y reste MÊME SANS
            croix (au repos), plutôt que de sauter de 28 px chaque
            fois qu'on entre dans le champ pour se corriger. */}
        {accuse && urlRefusee && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-11 top-1/2
                       -translate-y-1/2 text-[12.5px] font-semibold text-erreur"
          >
            Lien non valide
          </span>
        )}
        {champEnSaisie === "url" && valeur.url !== "" && (
          <CroixDeChamp
            quoi="l'adresse du lien"
            surEffacement={() => poserChamp({ url: "" })}
          />
        )}
      </div>
      {/* LE TITRE, ET SON DÉCOMPTE (passe nº 117, point 5). Le plafond
          était une borne MUETTE : on tapait, et à un moment la frappe
          ne rentrait plus, sans qu'on sache pourquoi. Le décompte le
          dit à l'avance — MÊME FORME que celui de « Ta présentation » :
          « 0/30 », dans le champ, à droite, en chiffres tabulaires et
          gris doux.
          §3 (nº 405) — LE DÉCOMPTE ET LA CROIX COHABITENT, chacun sa
          voie : la croix garde la sienne (44 px, `pr-11` du CHAMP), le
          décompte recule juste devant elle (`right-11`). Le
          rembourrage total passe donc de 64 à 80 px (`pr-20`), réservé
          EN PERMANENCE — le décompte ne disparaît pas pendant la
          frappe, qui est justement le moment où il sert.
          ⚠️ LE DÉCOMPTE NE S'ÉLARGIT PAS EN PASSANT À 30 : « 30/30 » et
          « 16/16 » font tous deux 28,5 px (mesuré sur le woff2 Geist
          servi par le site) — les chiffres sont tabulaires. */}
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
          onFocus={() => setChampEnSaisie("titre")}
          onBlur={() => setChampEnSaisie(null)}
          maxLength={TITRE_LIEN_MAXIMUM}
          placeholder="Titre"
          aria-label={`Le titre du lien (${TITRE_LIEN_MAXIMUM} caractères au plus)`}
          aria-describedby={`${id}-compteur`}
          aria-invalid={fauteTitre}
          className={`${CHAMP} pr-20 ${
            fauteTitre ? "border-erreur" : "border-transparent"
          }`}
        />
        <p
          id={`${id}-compteur`}
          role="status"
          className="pointer-events-none absolute right-11 top-1/2
                     -translate-y-1/2 text-[12.5px] tabular-nums
                     text-sombre-texte-doux"
        >
          {valeur.titre.length}/{TITRE_LIEN_MAXIMUM}
        </p>
        {champEnSaisie === "titre" && valeur.titre !== "" && (
          <CroixDeChamp
            quoi="le titre du lien"
            surEffacement={() => poserChamp({ titre: "" })}
          />
        )}
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
                     hover:bg-sombre-eleve-clair hover:text-primaire"
        >
          Ajouter
        </button>
        {/*  §4 (nº 405) — `annuler`, ET PLUS `retirerLeLien` : rouvrir
             un lien enregistré puis annuler REMET ce lien, au lieu de
             le supprimer. Sur un emplacement neuf, le geste est
             identique à celui d'avant — il n'y a rien à remettre. */}
        <button
          type="button"
          onClick={annuler}
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
