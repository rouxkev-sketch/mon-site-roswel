"use client";

import { useState } from "react";
import { etatDuLien, type ChampLien } from "@/lib/liens-fiche";
import { IconeCroix } from "@/components/Icones";
import { SANS_REMPLISSAGE_AUTO } from "@/lib/champs-sans-remplissage";
import { texteErreur } from "@/lib/erreurs-formulaire";

/**
 * UN LIEN — TOUT SE LIT DANS LE CHAMP LUI-MÊME (passe nº 103)
 * ============================================================
 * L'ancienne version empilait : un champ, puis une ligne de retour
 * dessous (« @rouxkev » avec sa coche), quatre fois de suite. Huit
 * étages pour quatre adresses. La nouvelle tient TOUT dans le champ :
 *
 *   · L'ICÔNE DU SERVICE, à gauche — c'est elle qui nomme le champ
 *     d'un coup d'œil, avec l'indication ;
 *   · QUAND L'ADRESSE EST RECONNUE et qu'on n'est pas en train
 *     d'écrire, c'est L'IDENTIFIANT qui s'affiche à la place de
 *     l'URL : « @yoko.folio », pas « https://www.instagram.com/… ».
 *     Une coche discrète à droite dit que c'est bon. Au clic, l'URL
 *     brute revient, telle quelle — et la coche cède la place à la
 *     CROIX du formulaire, qui efface le lien pour en saisir un
 *     autre (§4, nº 270) ; refermé sans y toucher, la coche revient ;
 *   · SOUS LE CHAMP, il n'y a plus JAMAIS rien quand tout va bien.
 *     La ligne ne sert qu'à l'erreur — bord rouge, croix, une phrase.
 *
 * ⚠️ RIEN NE CHANGE DANS LA MÉCANIQUE. Même <input>, même valeur, même
 * `surChangement`, même reconnaissance (`etatDuLien`) : l'identifiant
 * est un CALQUE posé par-dessus le texte (rendu transparent), qui
 * laisse passer les clics. La valeur enregistrée reste l'adresse.
 *
 * ⚠️⚠️ CE QUE LA COCHE DIT — ET CE QU'ELLE NE DIT PAS.
 * Elle dit : « cette adresse est bien formée et mène chez Instagram ».
 * Elle NE DIT PAS que le compte existe, qu'il est public, ni qu'il est
 * le vôtre. Rien de tout cela n'est vérifiable sans appeler ces
 * services — ce que le navigateur ne peut pas faire (ils refusent les
 * requêtes croisées) et ce que le serveur ne fait pas. Cette mise en
 * garde reste écrite ICI, à l'attention de qui touchera ce fichier :
 * c'est elle qui empêche qu'un jour on écrive « Instagram connecté »
 * au-dessus d'une simple chaîne bien orthographiée.
 */

/** La coche et la croix — dessinées, jamais en émoji : un émoji
    change de dessin (et de couleur) d'un appareil à l'autre. */
function Coche({ taille = 15 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Croix({ taille = 15 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

//  ⚠️ PLUS DE CONTOUR (passe nº 112) : le fond un cran plus clair dit
//  le champ ; au focus il s'éclaircit légèrement (nº 116 — plus de
//  trait rose), l'erreur allume un bord rouge.
const CHAMP = `w-full min-h-[48px] rounded-lg border bg-sombre-eleve-clair pl-12 pr-11
  text-base text-sombre-texte placeholder:text-sombre-texte-doux outline-none
  transition-colors focus:bg-sombre-haut`;

export function ChampLienVerifie({
  id,
  champ,
  /** Le nom du service — dans le champ (indication) et pour les
      lecteurs d'écran (`aria-label`). Il n'y a pas d'étiquette. */
  indication,
  /** L'icône du service, posée DANS le champ, à gauche. Toujours un
      glyphe DESSINÉ (Icones.tsx), jamais un fichier du propriétaire :
      les icônes déposées à la main ne sont pas toujours présentes
      dans un clone, et un champ de saisie ne peut pas dépendre d'un
      fichier qui manque. */
  icone,
  valeur,
  surChangement,
  /** L'erreur de la VALIDATION — `MANQUE` (muette) ou une forme
      refusée. Elle prime sur l'état lu à la frappe. */
  erreur,
  /** Le MOTIF coché par la relecture (un humain a écrit pourquoi) —
      lui seul garde une ligne SOUS le champ : c'est un texte qui
      apprend quelque chose, pas un constat de forme. */
  motif,
}: {
  id: string;
  champ: ChampLien;
  indication: string;
  icone: React.ReactNode;
  valeur: string;
  surChangement: (valeur: string) => void;
  erreur?: string | null;
  motif?: string | null;
}) {
  /** VRAI pendant la frappe (champ focalisé) : l'URL brute reprend
      l'écran, le calque d'identifiant s'efface. État purement
      VISUEL — la valeur, elle, ne bouge jamais. */
  const [enEdition, setEnEdition] = useState(false);

  const etat = etatDuLien(valeur, champ);
  const reconnu = etat.genre === "bon" && !erreur && !motif;
  const enFaute = Boolean(erreur) || Boolean(motif) || etat.genre === "faux";
  //  ⚠️ LA FAUTE ET SON TEXTE SONT DEUX CHOSES (passe nº 111), et le
  //  texte a changé de forme à la nº 112 : plus de phrase sous le
  //  champ (« Ce lien Instagram n'a pas la bonne forme (ex. …) ») —
  //  une MENTION COURTE, DANS le champ, à droite : « Instagram non
  //  valide ». Elle se montre pour une forme refusée (validation ou
  //  frappe), jamais pour un simple manque (`MANQUE` reste muet :
  //  vide n'est pas invalide).
  const formeRefusee = Boolean(texteErreur(erreur)) || etat.genre === "faux";
  //  « Linktree / Beacons non valide » serait un mot-valise : la
  //  mention garde le premier nom, celui que tout le monde emploie.
  const mentionCourte = `${indication.split(" /")[0]} non valide`;
  const identifiantAffiche = reconnu && !enEdition;
  /**
   * §4 (nº 270) — LA COCHE CÈDE LA PLACE À UNE CROIX QUAND ON ENTRE
   * DANS LE CHAMP. Au repos, la coche verte demeure — c'est elle qui
   * dit « rempli et valide ». Au clic dans le champ (pour remplacer
   * le lien), une CROIX la remplace : un BOUTON, qui EFFACE le lien
   * pour en saisir un autre. Et c'est la croix DES AUTRES CHAMPS du
   * formulaire (IconeCroix dans son bouton rond, l'écriture de
   * ChampLocalisation et du nom de lieu) — pas un second dessin.
   * Elle vit tant que le champ est focalisé ET porte quelque chose :
   * vide, il n'y a rien à effacer ; refermé, la coche revient.
   */
  const croixEffacer = enEdition && valeur.trim() !== "";
  const cocheVisible = reconnu && !enEdition;
  //  La croix ROUGE d'état (forme refusée) garde sa place au repos ;
  //  pendant la frappe, c'est le bouton d'effacement qui occupe la
  //  droite du champ — deux croix superposées ne se liraient pas.
  const croixEtat = enFaute && !croixEffacer;

  return (
    <div>
      <div className="relative">
        {/* L'ICÔNE DU SERVICE — gris doux, rose quand le champ est en
            faute ? Non : elle reste neutre, c'est le BORD qui parle. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2
                     text-sombre-texte-doux"
        >
          {icone}
        </span>

        <input
          id={id}
          type="url"
          {...SANS_REMPLISSAGE_AUTO}
          value={valeur}
          onChange={(e) => surChangement(e.target.value)}
          onFocus={() => setEnEdition(true)}
          onBlur={() => setEnEdition(false)}
          //  ⚠️ PLUS DE « (facultatif) » (passe nº 106) : le nom du
          //  service seul. C'est la validation qui dit ce qui manque.
          placeholder={indication}
          aria-label={indication}
          aria-invalid={enFaute}
          aria-describedby={`${id}-etat`}
          className={`${CHAMP} ${
            //  LE TEXTE S'EFFACE sous le calque d'identifiant — il est
            //  toujours LÀ (c'est lui la valeur), on ne le voit plus.
            identifiantAffiche ? "text-transparent" : ""
          } ${enFaute ? "border-erreur" : "border-transparent"} ${
            //  LA MENTION OCCUPE LA DROITE DU CHAMP : le texte tapé
            //  s'arrête avant elle plutôt que de passer dessous.
            formeRefusee && !enEdition ? "pr-44" : ""
          }`}
        />

        {/* L'IDENTIFIANT, PAR-DESSUS L'URL — la moitié utile, seule.
            `pointer-events-none` : cliquer dessus, c'est cliquer dans
            le champ. `aria-hidden` : le lecteur d'écran l'apprend par
            la ligne d'état, pas deux fois. */}
        {identifiantAffiche && (
          <span
            id={`${id}-identite`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-12 right-11
                       flex items-center truncate text-base text-sombre-texte"
          >
            {etat.identite}
          </span>
        )}

        {/* LA COCHE OU LA CROIX D'ÉTAT, dans le champ, à droite —
            l'état d'un coup d'œil. §4 (nº 270) : la coche N'EXISTE
            QU'AU REPOS — champ focalisé, c'est le bouton d'effacement
            qui prend sa place (plus bas). */}
        {(cocheVisible || croixEtat) && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
              cocheVisible ? "text-[#34D399]" : "text-erreur"
            }`}
          >
            {cocheVisible ? <Coche /> : <Croix />}
          </span>
        )}

        {/* §4 (nº 270) — LA CROIX QUI EFFACE, à l'entrée dans le
            champ : le bouton rond des autres champs du formulaire
            (ChampLocalisation, nom de lieu), pas un second dessin.
            ⚠️ `preventDefault` À L'APPUI, souris ET doigt : le bouton
            ne vit que tant que le champ a le focus — laisser l'appui
            le lui voler démonterait la croix SOUS le geste, avant que
            le clic ne l'atteigne. Le focus reste donc au champ, et on
            enchaîne la saisie du lien suivant sans re-cliquer. */}
        {croixEffacer && (
          <button
            type="button"
            aria-label={`Effacer le lien ${indication}`}
            title="Effacer"
            onPointerDown={(evenement) => evenement.preventDefault()}
            onClick={() => surChangement("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8
                       items-center justify-center rounded-full
                       text-sombre-texte-doux transition-colors
                       hover:bg-sombre-haut hover:text-sombre-texte
                       active:bg-sombre-haut"
          >
            <IconeCroix taille={16} />
          </button>
        )}

        {/* LA MENTION COURTE — « Instagram non valide », DANS le
            champ, contre la croix (passe nº 112). Elle s'efface
            pendant la frappe : on corrige, on ne relit pas le
            reproche. */}
        {formeRefusee && !enEdition && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2
                       max-w-[45%] truncate text-[12.5px] font-semibold text-erreur"
          >
            {mentionCourte}
          </span>
        )}
      </div>

      {/* LA LIGNE SOUS LE CHAMP — réservée au MOTIF de la relecture
          (un humain a écrit pourquoi ; ce texte-là apprend quelque
          chose). Les constats de forme vivent DANS le champ depuis la
          passe nº 112. La ligne reste dans le flux pour les lecteurs
          d'écran : `aria-live` annonce l'état sans l'afficher. */}
      <p
        id={`${id}-etat`}
        aria-live="polite"
        className={
          motif
            ? "mt-1.5 flex items-center gap-1.5 text-[13px] leading-tight text-erreur"
            : "sr-only"
        }
      >
        {motif ? (
          <>
            <Croix />
            {motif}
          </>
        ) : formeRefusee ? (
          mentionCourte
        ) : etat.genre === "bon" ? (
          etat.identite
        ) : null}
      </p>
    </div>
  );
}
