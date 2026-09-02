"use client";

import { useState } from "react";
import { CONTACT_YOKOFOLIO } from "@/config/tatouage";
import { IconeCocheListe } from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille.
import { PastilleEvenement } from "@/components/PastilleEvenement";
//  §1 (nº 800) — LE champ standard du site, écrit une seule fois.
import { CHAMP } from "@/components/champs-formulaire";
//  §2 (nº 800) — le compteur du portfolio, partagé.
import { CompteurDeCaracteres } from "@/components/CompteurDeCaracteres";

/**
 * LE FORMULAIRE DE CONTACT DE YOKOFOLIO — /contact
 * =================================================
 * Trois champs (nom, e-mail, message), la validation en français,
 * l'envoi vers /api/tatoueur/contact (enregistrement en base +
 * transmission e-mail à l'exploitant via le service existant), puis
 * un écran de confirmation. Charte sombre du site, sobre.
 *
 * ⚠️⚠️ L'EXCEPTION DE LA nº 320 EST LEVÉE POUR CETTE PAGE (nº 800)
 * ==================================================================
 * CE QU'ELLE DISAIT, ET IL FAUT LE SAVOIR POUR LIRE LA SUITE : à la
 * nº 320, le propriétaire avait vu le résultat du passage de /contact
 * et /qui-sommes-nous à la charte du site, ne l'avait pas aimé, et
 * avait écrit ici « AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER ».
 *
 * ⚠️ LE PROPRIÉTAIRE A LEVÉ CETTE CONSIGNE POUR /contact À LA nº 800,
 * nommément et de sa main. LA PAGE REDEVIENT MODIFIABLE. Ce qui reste
 * entier, et qu'aucune passe ne touche de sa propre initiative : SA
 * MISE EN PAGE GÉNÉRALE — les grandes typographies, les libellés
 * au-dessus des champs, les arrondis de 12 px, le rond de
 * confirmation, l'aération. C'est la CHARTE qui ne s'impose plus
 * d'office, pas la page qui devient un terrain vague.
 * ⚠️ ET /qui-sommes-nous RESTE SOUS L'EXCEPTION : le propriétaire n'a
 * levé que celle-ci. Sa note à elle est intacte.
 *
 * CE QUE LA nº 800 A CHANGÉ, sur ses trois demandes, ET RIEN D'AUTRE :
 *  1. LE FOCUS DES CHAMPS. Il devenait ROUGE — un contour `primaire`
 *     et son halo. Le propriétaire n'en veut plus : les champs
 *     adoptent le comportement de TOUS les autres champs du site, un
 *     simple ÉCLAIRCISSEMENT du fond, sans trait coloré. Et ils ne le
 *     recopient pas : ils emploient `CHAMP` (components/
 *     champs-formulaire), la seule écriture d'un champ de ce site.
 *     Le CONTOUR AU REPOS, lui, reste — c'est l'appelant qui le pose
 *     (`border-sombre-bordure`), comme avant.
 *     ⚠️ LE FOND AU REPOS MONTE D'UN CRAN par la même occasion
 *     (`sombre-eleve` → `sombre-eleve-clair`) : c'est la valeur de la
 *     constante partagée, celle de tous les autres champs depuis la
 *     nº 388. Adopter le standard, c'est l'adopter entier.
 *  2. LE COMPTEUR de caractères du message, celui du portfolio, à
 *     l'identique — et pour de bon : les deux champs emploient le
 *     MÊME composant (`CompteurDeCaracteres`).
 *  3. LE BOUTON D'ENVOI : 40 px de haut, 14 px de texte. Compact et
 *     collé à DROITE au web ; pleine largeur au doigt.
 *
 * RESTENT VOULUS ICI, et ne sont PAS des oublis de charte :
 *  · les CONTOURS des champs (`border-sombre-bordure`) ;
 *  · les ARRONDIS DE 12 px (`rounded-xl`) sur des champs ;
 *  · les LIBELLÉS AU-DESSUS des champs ;
 *  · le ROND de l'écran de confirmation.
 * La nº 319 les avait tous retirés : c'est ANNULÉ.
 *
 * ⚠️ SAUF DEUX MOTS, GARDÉS DE LA nº 319 SUR CONSIGNE : le champ du
 * nom affiche « Nom » et celui du courriel « E-mail », DANS le champ —
 * même si cette mise en page pose par ailleurs ses libellés au-dessus.
 * Le libellé du dessus reste, lui, pour le lecteur d'écran et le clic
 * (`<label htmlFor>`) : ce sont deux choses différentes, et le
 * propriétaire n'a demandé que le mot DANS le champ. Le troisième
 * champ (message) n'était pas visé : sa phrase indicative d'avant ne
 * bouge pas.
 */

/**
 * ██ §1 (nº 802) — LES RÈGLES DE VALIDITÉ, ÉCRITES UNE SEULE FOIS ██
 * ==================================================================
 * Elles vivaient DANS `envoyer()`, et nulle part ailleurs. C'est
 * pourquoi la nº 800 a raté la moitié de la règle nº 788 : une erreur
 * ne peut s'effacer À LA CORRECTION que si l'on sait, à chaque frappe,
 * si le champ est redevenu bon — et cette question n'avait pas de
 * réponse hors du moment de l'envoi.
 * Elles sortent donc ici. `envoyer()` les emploie pour décider de
 * partir ; chaque `onChange` les emploie pour décider d'oublier. Deux
 * moments, UNE règle : elles ne peuvent plus se contredire.
 *
 * ⚠️ ET L'ERREUR NE PART PAS À LA PREMIÈRE FRAPPE, elle part quand le
 * champ DEVIENT BON — c'est la demande du propriétaire, au mot près :
 * « le message : l'erreur part au 20ᵉ caractère exactement ». Effacer
 * le reproche dès qu'on touche au champ, alors qu'il reste fautif,
 * serait mentir une seconde fois.
 * ⚠️ LE COMPTE SE FAIT SUR LE TEXTE ÉBARBÉ (`trim`), comme à l'envoi :
 * vingt espaces ne sont pas vingt caractères, et le seuil doit tomber
 * au même endroit des deux côtés.
 */
const FAUTES: Record<string, (valeur: string) => string | null> = {
  nom: (v) =>
    v.trim().length < 2 ? "Ton nom (ou un pseudo) est nécessaire." : null,
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
      ? null
      : "Cette adresse e-mail n'a pas l'air complète.",
  message: (v) =>
    v.trim().length < CONTACT_YOKOFOLIO.messageMin
      ? `Ton message doit faire au moins ${CONTACT_YOKOFOLIO.messageMin} caractères.`
      : null,
};

export function FormulaireContactYokofolio({
  children,
}: {
  /*  §2 (nº 802) — LE TITRE DE LA PAGE PASSE PAR ICI. Il vit toujours
      dans `/contact/page.tsx`, qui est un composant SERVEUR : le texte
      part donc dans le HTML de la première réponse, comme avant, et
      les moteurs de recherche le lisent. Mais c'est CE composant qui
      décide de le montrer — parce que lui seul sait si le message est
      parti. Le titre « Écris-nous » au-dessus d'une confirmation
      d'envoi n'avait plus de sens. */
  children?: React.ReactNode;
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  /**
   * ██ §1 (nº 802) — OUBLIER LE REPROCHE QUAND IL N'EST PLUS MÉRITÉ ██
   * C'est la moitié de la règle nº 788 que la nº 800 n'a pas apportée
   * ici : « une erreur qui survit à sa réparation apprend à ne plus
   * lire les erreurs ». On répare le champ, le contour rouge et la
   * phrase tenaient bon jusqu'au prochain envoi.
   * ⚠️ ON N'EFFACE QUE SI LE CHAMP EST REDEVENU BON — la règle est
   * celle de `FAUTES`, la même qu'à l'envoi. Rien n'est réévalué pour
   * les autres champs : corriger le nom ne fait pas taire le reproche
   * fait au message.
   * ⚠️ ET L'ERREUR GÉNÉRALE PART AVEC (comme à la nº 788) : « l'envoi
   * n'a pas abouti » ne veut plus rien dire dès qu'on retouche quelque
   * chose. On la garde tant que rien n'a bougé, on la retire dès qu'on
   * agit.
   */
  function oublierSiCorrige(champ: string, valeur: string) {
    setErreurs((avant) => {
      if (!avant[champ] && !avant.general) return avant;
      const apres = { ...avant };
      if (avant[champ] && !FAUTES[champ](valeur)) delete apres[champ];
      delete apres.general;
      return apres;
    });
  }

  /**
   * §3 (nº 802) — REPARTIR D'UNE PAGE BLANCHE. Le bouton « Envoyer un
   * autre message » ne recharge pas la page : il remet simplement le
   * formulaire dans l'état où on l'a trouvé. Tout est remis, y compris
   * les erreurs — sans quoi un reproche d'avant l'envoi ressusciterait
   * sur un formulaire vide.
   */
  function recommencer() {
    setNom("");
    setEmail("");
    setMessage("");
    setErreurs({});
    setEnvoye(false);
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const trouvees: Record<string, string> = {};
    for (const [champ, valeur] of Object.entries({ nom, email, message })) {
      const faute = FAUTES[champ](valeur);
      if (faute) trouvees[champ] = faute;
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    setEnCours(true);
    try {
      const reponse = await fetch("/api/tatoueur/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "L'envoi n'a pas abouti.");
      }
      setEnvoye(true);
    } catch (erreur) {
      setErreurs({
        general:
          erreur instanceof Error
            ? erreur.message
            : "L'envoi n'a pas abouti. Réessaie dans un instant.",
      });
    } finally {
      setEnCours(false);
    }
  }

  /* ---------- LA CONFIRMATION ---------- */
  /*  §2 (nº 802) — L'ÉCRAN DE SUCCÈS EST SEUL. Le titre de la page
      (« Écris-nous — Une question, une idée… ») restait au-dessus de
      la confirmation : on venait d'écrire, et l'écran continuait de
      nous inviter à écrire. Il arrive maintenant par `children`, et
      cette porte-ci le laisse dehors. */
  if (envoye) {
    return (
      <div className="mt-10 text-center">
        {/*  ██ §3 (nº 664) — CE CERCLE N'ÉTAIT PAS UNE ICÔNE ██
             C'était le CARACTÈRE « ✓ » posé dans un rond, en `text-3xl`.
             Il ne suivait donc aucune décision de la famille — ni son
             trait, ni sa taille, ni ses tons — et il changeait de dessin
             avec la police de l'appareil. Le propriétaire demande la
             vraie coche.
             DEUX AUTRES CHOSES RENTRENT DANS LE RANG : le cercle faisait
             64 px, la plus grande taille du site et la seule fois où
             elle servait ; et le ton passe du rose au vert — le message
             est PARTI, il n'attend aucune décision. */}
        <PastilleEvenement
          ton="valide"
          symbole={IconeCocheListe}
          classe="mx-auto"
        />
        <h2 className="mt-5 text-[clamp(1.3rem,3vw,1.6rem)] font-bold text-sombre-texte">
          Message envoyé !
        </h2>
        <p className="mt-3 text-sombre-texte-doux leading-relaxed">
          Merci de nous avoir écrit — on te répond à{" "}
          <strong className="text-sombre-texte">{email.trim()}</strong>, en
          général sous 48 heures.
        </p>
        {/*  §3 (nº 802) — REPARTIR SANS RECHARGER LA PAGE. Sans ce
             bouton, écrire un second message demandait de recharger
             /contact — un geste que rien n'annonçait.
             ⚠️ IL EST DE SECOND RANG, et c'est voulu : le rose est
             réservé à l'action finale (la charte), et ici l'action
             finale est FAITE. Fond `sombre-eleve`, comme le second
             bouton de « Qui sommes-nous ».
             ⚠️ AUX MESURES DE LA nº 788 : 40 px de haut, 14 px de
             texte, comme le bouton d'envoi depuis la nº 800. */}
        <button
          type="button"
          onClick={recommencer}
          className="mt-7 inline-flex items-center justify-center rounded-full
                     px-5 min-h-[40px] text-[14px] bg-sombre-eleve
                     hover:bg-sombre-haut text-white font-semibold
                     transition-colors"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <>
      {children}
      <form onSubmit={envoyer} noValidate className="mt-8 flex flex-col gap-4">
        <div>
          <label
            htmlFor="contact-nom"
            className="block text-sm font-medium text-sombre-texte mb-1.5"
          >
            Ton nom
          </label>
          <input
            id="contact-nom"
            type="text"
            autoComplete="name"
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              oublierSiCorrige("nom", e.target.value);
            }}
            //  §1 (nº 320) — GARDÉ DE LA nº 319 : « Nom », dans le champ.
            placeholder="Nom"
            aria-invalid={Boolean(erreurs.nom)}
            className={`${CHAMP} ${erreurs.nom ? "border-erreur" : "border-sombre-bordure"}`}
          />
          {erreurs.nom && (
            <p className="mt-1.5 text-[13px] text-erreur">{erreurs.nom}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-sombre-texte mb-1.5"
          >
            Ton adresse e-mail
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              oublierSiCorrige("email", e.target.value);
            }}
            //  §1 (nº 320) — GARDÉ DE LA nº 319 : « E-mail », dans le champ.
            placeholder="E-mail"
            aria-invalid={Boolean(erreurs.email)}
            className={`${CHAMP} ${erreurs.email ? "border-erreur" : "border-sombre-bordure"}`}
          />
          {erreurs.email && (
            <p className="mt-1.5 text-[13px] text-erreur">{erreurs.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-sombre-texte mb-1.5"
          >
            Ton message
          </label>
          {/*  §2 (nº 800) — LE COMPTEUR VIT DANS LE CHAMP, comme celui
               de la bio : il faut donc un parent positionné, et le
               `pb-8` qui lui réserve sa ligne — sans quoi la dernière
               ligne tapée passerait dessous. */}
          <div className="relative">
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                oublierSiCorrige("message", e.target.value);
              }}
              rows={6}
              maxLength={CONTACT_YOKOFOLIO.messageMax}
              aria-describedby="contact-message-compteur"
              placeholder="Une question, une idée, un problème — on lit tout."
              aria-invalid={Boolean(erreurs.message)}
              //  §1 (nº 800) — LE MÊME CHAMP QUE PARTOUT, plus ce qu'une
              //  zone de texte demande en propre : ses marges hautes et
              //  basses, son interligne, sa poignée de redimensionnement
              //  et la place du compteur. Aucune de ces classes n'entre
              //  en conflit avec celles de `CHAMP` (piège nº 389) : elle
              //  n'y touche à aucune des propriétés déjà posées.
              className={`${CHAMP} block py-3 pb-8 leading-relaxed resize-y ${
                erreurs.message ? "border-erreur" : "border-sombre-bordure"
              }`}
            />
            <CompteurDeCaracteres
              id="contact-message-compteur"
              valeur={message}
              maximum={CONTACT_YOKOFOLIO.messageMax}
            />
          </div>
          {erreurs.message && (
            <p className="mt-1.5 text-[13px] text-erreur">{erreurs.message}</p>
          )}
        </div>

        {erreurs.general && (
          <p
            role="alert"
            className="rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-sm text-sombre-texte"
          >
            {erreurs.general}
          </p>
        )}

        {/*  ██ §3 (nº 800) — LE BOUTON D'ENVOI ██
             Il faisait 52 px de haut, ne déclarait aucune taille de
             texte (donc 16 px), et s'étirait sur TOUTE la largeur des
             deux côtés — un enfant d'une colonne `flex` s'étire par
             défaut. Le propriétaire veut :
               · au WEB   — compact, 40/14, collé à DROITE ;
               · au DOIGT — pleine largeur, 40/14 lui aussi.

             COMMENT C'EST ÉCRIT, ET POURQUOI AINSI :
              · `self-end` retire l'étirement et colle le bouton à
                droite. Au web, il ne fait donc que la largeur de son
                texte plus `px-5` — la mesure des capsules de la nº 788 ;
              · `mobile:w-full` lui rend toute la largeur au doigt. Le
                `self-end` ne le gêne pas : un élément déjà large comme
                son parent n'a plus où s'aligner.
             ⚠️ DEUX CLASSES, DEUX PROPRIÉTÉS DIFFÉRENTES, AUCUN CONFLIT
             (piège nº 389) : `self-end` parle d'alignement, `w-full`
             parle de largeur. On aurait pu écrire `w-auto` en base et
             `mobile:w-full` par-dessus — deux fois la même propriété,
             départagées par l'ordre de la feuille et non par ce qu'on
             écrit ici. On ne parie pas là-dessus.
             ⚠️ ET L'APPAREIL SE LIT PAR `mobile:`, jamais par une
             largeur d'écran (piège nº 60) : la variante est adossée à
             `data-appareil`, posé avant la première peinture. */}
        <button
          type="submit"
          disabled={enCours}
          className="mt-1 inline-flex items-center justify-center self-end
                     mobile:w-full rounded-full px-5 min-h-[40px] text-[14px]
                     bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enCours ? "Envoi en cours…" : "Envoyer le message"}
          </button>
      </form>
    </>
  );
}
