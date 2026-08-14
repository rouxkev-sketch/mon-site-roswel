"use client";

import { useId, useRef } from "react";
import { BIO_MAXIMUM } from "@/config/tatouage";
import { longueurVisible, tronquerVisible } from "@/lib/emojis";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { SelecteurEmojis } from "@/components/SelecteurEmojis";

/**
 * LE CHAMP BIO — la présentation libre du tatoueur, avec son compteur
 * ===================================================================
 * FACULTATIF : plus aucun minimum — une fiche sans bio est une fiche
 * complète.
 *
 * ⚠️ LE PLAFOND BLOQUE DE NOUVEAU LA SAISIE (passe nº 123). Cette
 * règle a fait l'aller-retour, et voici les deux versions pour que
 * personne ne les inverse par erreur :
 *  · jusqu'à la nº 118 — `maxLength` : le clavier s'arrête net à 150 ;
 *  · nº 119 — dépassement autorisé, compteur rouge, enregistrement
 *    refusé (le clavier qui se fige sans un mot faisait croire à une
 *    panne) ;
 *  · nº 123 — RETOUR AU BLOCAGE, sur décision du propriétaire. Le
 *    compteur reste : c'est lui qui dit où l'on en est, et il arrive
 *    à « 150/150 » au lieu de bloquer en silence.
 *
 * LE COLLAGE EST TRONQUÉ, JAMAIS REFUSÉ. C'est `maxLength` qui s'en
 * charge, et c'est son comportement natif dans tous les navigateurs :
 * coller trois cents caractères en garde cent cinquante, au lieu de
 * ne rien coller du tout. Le garde-fou du sélecteur d'émojis, lui,
 * est écrit à la main (voir `insererEmoji`) : une insertion par
 * programme ne passe pas par `maxLength`.
 *
 * SANS ÉTIQUETTE VISIBLE par défaut : le titre de l'encadré (« Ta
 * bio ») suffit — la zone de texte porte son nom accessible en
 * `aria-label`. La ligne au-dessus du champ ne garde que le sélecteur
 * d'émojis (web).
 *
 * LES ÉMOJIS (web uniquement) : un petit sélecteur discret — il
 * insère l'émoji À LA POSITION DU CURSEUR, dans la limite du plafond.
 * Les téléphones et tablettes gardent leur clavier à émojis : le
 * bouton n'y apparaît pas.
 *
 * Il est PILOTÉ : le formulaire garde la valeur et la passe en
 * `valeur`.
 */
export function ChampBio({
  valeur,
  surChangement,
  indication,
  nomAccessible = "Ta bio",
  ancre,
  enFaute = false,
}: {
  valeur: string;
  surChangement: (valeur: string) => void;
  /** L'INDICATION DU CHAMP (passe nº 112) — l'ancien titre d'encadré,
      posé là où l'on écrit : « Ta présentation », « À propos du
      salon », « À propos du studio ». */
  indication?: string;
  /** Le nom lu par les lecteurs d'écran (aucune étiquette visible). */
  nomAccessible?: string;
  /** L'ANCRE DE DÉFILEMENT (passe nº 119) : l'enregistrement refusé
      pour dépassement fait défiler la page jusqu'ici. */
  ancre?: string;
  /** LA FAUTE (passe nº 119) : l'enregistrement a été refusé parce que
      la bio dépasse — le champ s'encadre de rouge, comme tout manque. */
  enFaute?: boolean;
}) {
  const id = useId();
  const zone = useRef<HTMLTextAreaElement>(null);
  /*  §4 (nº 267) — LE COMPTE SE FAIT SUR CE QUE L'ŒIL VOIT. `length`
      comptait des unités techniques : un cœur de couleur en valait
      deux, un drapeau quatre — une bio de dix émojis était refusée
      bien avant les 150 annoncés, sans explication possible. On compte
      des GRAPHÈMES (voir `longueurVisible`). */
  const longueur = longueurVisible(valeur);
  const depasse = longueur > BIO_MAXIMUM;

  /** Insère un émoji là où est le curseur, et rend la main au champ,
      curseur bien placé.
      ⚠️ IL RESPECTE LE PLAFOND LUI AUSSI (passe nº 123). `maxLength`
      ne borne que ce qui vient du CLAVIER ou du PRESSE-PAPIERS : une
      insertion par programme passe à travers. Sans ce contrôle, le
      sélecteur d'émojis serait devenu la seule façon de dépasser 150
      caractères — exactement ce que le blocage vient d'interdire.
      Au plafond, l'insertion ne fait simplement rien. */
  function insererEmoji(emoji: string) {
    const champ = zone.current;
    const debut = champ?.selectionStart ?? valeur.length;
    const fin = champ?.selectionEnd ?? debut;
    const suivante = valeur.slice(0, debut) + emoji + valeur.slice(fin);
    //  §4 (nº 267) — le plafond se lit lui aussi en caractères VISIBLES.
    if (longueurVisible(suivante) > BIO_MAXIMUM) return;
    surChangement(suivante);
    requestAnimationFrame(() => {
      if (!champ) return;
      champ.focus();
      const position = debut + emoji.length;
      champ.setSelectionRange(position, position);
    });
  }

  return (
    <div id={ancre}>
      {/* ⚠️ LA LIGNE AU-DESSUS DU CHAMP A DISPARU (passe nº 107), et
          avec elle une marge que rien ne justifiait plus. Elle portait
          la mention « (facultatif) » — retirée à la passe nº 106 — et
          le sélecteur d'émojis. Restait une bande de 32 px VIDE sous
          le titre du bloc : vide pour de bon au doigt et sur tablette
          (le sélecteur ne s'affiche qu'à partir de 1024 px, les
          claviers mobiles ayant leurs émojis), et occupée par un seul
          petit bouton sur le web. Le titre du bloc « À propos » se
          retrouvait ainsi deux fois plus loin de son champ que
          partout ailleurs.
          LE SÉLECTEUR SE POSE MAINTENANT DANS LE COIN DU CHAMP, en
          superposition : il ne pousse plus rien, et le `pr-12` du
          champ garantit qu'aucun texte ne passe dessous. */}
      <div className="relative">
        <textarea
          id={id}
          {...sansRemplissageAuto(`bio-${id}`)}
          ref={zone}
          value={valeur}
          //  §4 (nº 267) — LA BORNE DURE SE MESURE EN GRAPHÈMES : un
          //  collage trop long est tronqué à 150 CARACTÈRES VISIBLES,
          //  jamais au milieu d'un émoji.
          onChange={(e) =>
            surChangement(tronquerVisible(e.target.value, BIO_MAXIMUM))
          }
          //  LA BORNE DURE (passe nº 123) tient toujours — mais elle
          //  n'est plus posée par `maxLength` : §4 (nº 267), cet
          //  attribut compte en unités UTF-16 et coupait donc les
          //  émojis bien avant 150 signes. C'est `onChange` qui borne,
          //  en caractères visibles.
          rows={5}
          aria-label={nomAccessible}
          aria-invalid={enFaute}
          aria-describedby={`${id}-compteur`}
          placeholder={
            indication ??
            "Ton univers, ta façon de travailler, ce qu'on trouve dans ton studio…"
          }
          //  ⚠️ PLUS DE CONTOUR (passe nº 112) : le fond suffit — et
          //  au focus il s'éclaircit légèrement, sans trait rose
          //  (passe nº 116). Le `pb-8` réserve la ligne du compteur,
          //  qui vit DANS le champ désormais.
          //  `block` (nº 116) : un textarea est un élément en ligne —
          //  sa jambe de ligne ajoutait ~5 px SOUS le champ, et la
          //  bio semblait plus loin d'Instagram que du nom (point 12).
          className={`block w-full rounded-xl border bg-sombre-eleve
                     px-4 py-3 pr-12 pb-8 text-base leading-relaxed text-sombre-texte
                     placeholder:text-sombre-texte-doux outline-none resize-y
                     transition-colors focus:bg-sombre-eleve-clair ${
                       enFaute ? "border-erreur" : "border-transparent"
                     }`}
        />
        {/* LE COMPTEUR — en bas à droite, DANS le champ (passe
            nº 112) : le décompte vers le plafond appartient à la zone
            où l'on tape, pas à la page. */}
        <p
          id={`${id}-compteur`}
          role="status"
          //  LE VRAI NOMBRE, TOUJOURS. Le rouge du dépassement reste
          //  écrit (passe nº 119) : la saisie ne peut plus l'atteindre
          //  depuis la nº 123, mais une valeur relue d'ailleurs le
          //  pourrait — et mieux vaut qu'elle se voie.
          className={`pointer-events-none absolute bottom-2.5 right-3.5
                     text-[12.5px] tabular-nums ${
                       depasse
                         ? "font-semibold text-erreur"
                         : "text-sombre-texte-doux"
                     }`}
        >
          {longueur}/{BIO_MAXIMUM}
        </p>
        <div className="absolute right-2 top-2">
          <SelecteurEmojis surInsertion={insererEmoji} />
        </div>
      </div>
    </div>
  );
}
