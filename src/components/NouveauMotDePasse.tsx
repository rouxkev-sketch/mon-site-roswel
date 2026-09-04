"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AIR_AVANT_BOUTON,
  bordureChamp,
  BoutonOeil,
  MessageErreur,
  PLACE_DE_L_OEIL,
} from "@/components/erreurs-formulaire";
import { IconeCocheListe } from "@/components/Icones";
import { JaugeMotDePasse } from "@/components/JaugeMotDePasse";
import { LienExpire } from "@/components/LienExpire";
import { PastilleEvenement } from "@/components/PastilleEvenement";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";

/**
 * CHOISIR UN NOUVEAU MOT DE PASSE
 * ================================
 * La page qu'ouvre le lien de l'e-mail « Forgot your password? » (le
 * jeton du lien est vérifié par /auth/callback, qui ouvre la session
 * puis mène ici). Un seul travail : le nouveau mot de passe, saisi
 * deux fois.
 *
 * ██ §1 (nº 828) — CETTE PAGE AVAIT ÉCHAPPÉ AUX CHARTES ██
 * ==================================================================
 * Elle était la dernière à porter la robe d'avant, et l'on y arrive
 * par un e-mail — c'est-à-dire au pire moment pour découvrir un écran
 * qui ne ressemble pas au site. SIX ÉCARTS, tous corrigés ici, tous
 * repris de l'écran de connexion et du standard nº 788 :
 *
 *  1. LE FOCUS. Le champ prenait un contour ROSE et un halo
 *     (`focus:border-primaire focus:ring-primaire/25`). La charte
 *     réserve le rose au sélecteur et à l'action finale : un champ
 *     actif ne fait que S'ÉCLAIRCIR (`focus:bg-sombre-haut`) ;
 *  2. LES TITRES AU-DESSUS DES CHAMPS sont partis. Le libellé vit
 *     DANS le champ, comme partout ailleurs. Il reste porté aux
 *     lecteurs d'écran par `aria-label` — un champ sans nom
 *     accessible serait un recul ;
 *  3. LA JAUGE DE ROBUSTESSE s'affiche sous le premier champ dès la
 *     frappe. C'est le composant de la création de compte, à
 *     l'identique — il ne se montre pas tant que le champ est vide ;
 *  4. L'ŒIL EST SUR LES DEUX CHAMPS. Il n'était que sur le premier :
 *     on pouvait donc relire ce qu'on tapait, mais pas ce qu'on
 *     recopiait — exactement le champ où l'on se trompe. Un seul
 *     état pour les deux, comme à la connexion : ce qu'on relit, on
 *     le relit en entier ;
 *  5. LE BOUTON prend les mesures de « Sign up » / « Log in » :
 *     pleine largeur, 44 px au web et 48 px au doigt, texte 14.
 *     ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (règle nº 389) : `not-mobile:`
 *     et `mobile:` sont l'exacte négation l'une de l'autre, il n'y a
 *     pas de hauteur de base qu'une variante viendrait contredire. Et
 *     l'appareil se lit par ces variantes, jamais par une largeur
 *     d'écran (piège nº 60) ;
 *  6. LES ERREURS suivent le standard nº 788 : contour rouge sur le
 *     champ fautif, message rouge dessous, sans fond ni encadré. Le
 *     pavé rouge à fond plein qui s'affichait en bas est parti —
 *     y compris pour l'erreur générale, qui se met désormais sous le
 *     bouton, dans la même typographie que les autres.
 *
 * ██ §2 (nº 828) — CE QUI SE PASSE APRÈS ██
 * ==================================================================
 * L'écran de confirmation reprend LE PATRON DE LA PAGE CONTACT — la
 * pastille verte à coche, le titre, une phrase, mêmes airs. Rien
 * d'inventé : c'est le même assemblage, avec le texte de cette page.
 * ⚠️ IL NE PART PLUS TOUT SEUL (nº 829). La nº 828 lui laissait 2,6 s
 * avant de rediriger — mieux que les 1,6 s de la nº 827, mais c'était
 * toujours une MINUTERIE : elle décide à la place du lecteur, et elle
 * se trompe forcément pour quelqu'un (celui qu'on appelle, celui qui
 * relit). L'écran RESTE, et le départ est un BOUTON. Le formulaire,
 * lui, est remplacé d'un coup, sans état intermédiaire.
 *
 * ██ §3 (nº 828) — LE LIEN PÉRIMÉ ██
 * ==================================================================
 * Sans session, cette page ne peut rien faire : le lien a expiré, ou
 * il a déjà servi. Elle montre alors l'écran partagé `LienExpire`, le
 * MÊME que la page /link-expired où /auth/callback envoie quand la
 * vérification du jeton échoue — une seule écriture pour les deux
 * chemins (piège nº 378).
 */

const LONGUEUR_MINIMALE = 8;

/*  LE CHAMP — la copie exacte de celui de l'écran de connexion :
    bordure dans la boîte (transparente au repos, rouge en erreur), et
    un focus qui n'est qu'un FOND PLUS CLAIR. */
const CHAMP =
  "w-full min-h-[52px] rounded-lg border bg-sombre-eleve-clair px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:bg-sombre-haut";

export function NouveauMotDePasse() {
  const router = useRouter();
  const { utilisateur, pret } = useUtilisateur();

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [fait, setFait] = useState(false);

  /*  §1-6 (nº 788) — L'ERREUR S'EFFACE À LA CORRECTION. Une erreur qui
      survit à sa réparation apprend à ne plus lire les erreurs. */
  const oublier = (champ: string) =>
    setErreurs((precedentes) => {
      if (!precedentes[champ] && !precedentes.general) return precedentes;
      const suite = { ...precedentes };
      delete suite[champ];
      delete suite.general;
      return suite;
    });

  async function enregistrer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const trouvees: Record<string, string> = {};
    if (motDePasse.length < LONGUEUR_MINIMALE) {
      trouvees.motDePasse = `At least ${LONGUEUR_MINIMALE} characters.`;
    } else if (confirmation !== motDePasse) {
      trouvees.confirmation = "The two passwords don't match.";
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    setEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.auth.updateUser({
        password: motDePasse,
      });
      if (error) throw error;
      setFait(true);
    } catch (erreur) {
      const brut =
        erreur instanceof Error ? erreur.message.toLowerCase() : "";
      setErreurs({
        general: brut.includes("should be different")
          ? "This password is the same as the old one — choose a new one."
          : brut.includes("password should be")
            ? `Your password must be at least ${LONGUEUR_MINIMALE} characters.`
            : "Saving failed. Try again.",
      });
    } finally {
      setEnCours(false);
    }
  }

  /* Le temps que la session du lien s'installe. */
  if (!pret) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  /* ---------- §3 — LIEN PÉRIMÉ (pas de session) ---------- */
  if (!utilisateur) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pb-24">
        <LienExpire />
      </main>
    );
  }

  /* ---------- §2 — C'EST FAIT ---------- */
  if (fait) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pb-24">
        <div className="mt-10 text-center">
          <PastilleEvenement
            ton="valide"
            symbole={IconeCocheListe}
            classe="mx-auto"
          />
          <h1 className="mt-5 text-[clamp(1.3rem,3vw,1.6rem)] font-bold text-sombre-texte">
            Password updated
          </h1>
          <p className="mt-3 text-sombre-texte-doux leading-relaxed">
            You&apos;re signed in with your new password.
          </p>
          {/*  §2 (nº 829) — LE GESTE EST AU LECTEUR. Voir la note de
               tête : plus de minuterie, un bouton. Il porte les
               mesures du bouton de second rang du site (40 px, texte
               14, fond `sombre-eleve`) — le rose reste à l'action
               finale, et ici l'action finale est FAITE. */}
          <button
            type="button"
            onClick={() => router.push(ARRIVEE_APRES_CONNEXION)}
            className="mt-7 inline-flex items-center justify-center rounded-full
                       px-5 min-h-[40px] text-[14px] bg-sombre-eleve
                       hover:bg-sombre-haut text-white font-semibold
                       transition-colors"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  /* ---------- LE NOUVEAU MOT DE PASSE ---------- */
  return (
    <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-12 sm:pt-16 pb-24">
      <h1 className="text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte text-center">
        Choose your new password
      </h1>
      <p className="mt-2 text-center text-[15px] text-sombre-texte-doux">
        At least {LONGUEUR_MINIMALE} characters — and this time, one
        you&apos;ll remember.
      </p>

      <form onSubmit={enregistrer} noValidate className="mt-8 flex flex-col gap-4">
        <div>
          <div className="relative">
            <input
              id="nouveau-mdp"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => {
                setMotDePasse(e.target.value);
                oublier("motDePasse");
              }}
              aria-invalid={Boolean(erreurs.motDePasse)}
              aria-label="New password"
              placeholder="New password"
              style={{ paddingRight: PLACE_DE_L_OEIL }}
              className={`${CHAMP} ${bordureChamp(Boolean(erreurs.motDePasse))}`}
            />
            <BoutonOeil
              visible={motDePasseVisible}
              surBascule={() => setMotDePasseVisible((v) => !v)}
            />
          </div>
          {erreurs.motDePasse && (
            <MessageErreur>{erreurs.motDePasse}</MessageErreur>
          )}
          {/*  §1-3 — LA JAUGE, dès la frappe. Le composant ne rend rien
               tant que le champ est vide : il n'y a rien à mesurer, et
               une jauge à zéro ressemblerait à un reproche. */}
          <JaugeMotDePasse motDePasse={motDePasse} />
        </div>

        <div>
          <div className="relative">
            <input
              id="nouveau-mdp-confirmation"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
                oublier("confirmation");
              }}
              aria-invalid={Boolean(erreurs.confirmation)}
              aria-label="Retype your new password"
              placeholder="Retype your new password"
              style={{ paddingRight: PLACE_DE_L_OEIL }}
              className={`${CHAMP} ${bordureChamp(Boolean(erreurs.confirmation))}`}
            />
            <BoutonOeil
              visible={motDePasseVisible}
              surBascule={() => setMotDePasseVisible((v) => !v)}
            />
          </div>
          {erreurs.confirmation && (
            <MessageErreur>{erreurs.confirmation}</MessageErreur>
          )}
        </div>

        <button
          type="submit"
          disabled={enCours}
          className={`${AIR_AVANT_BOUTON} inline-flex w-full items-center justify-center
                     rounded-full px-5 not-mobile:min-h-[44px] mobile:min-h-[48px]
                     text-[14px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {enCours ? "One moment…" : "Save password"}
        </button>

        {/*  §1-6 — L'ERREUR GÉNÉRALE dans la même typographie que les
             autres, sous le geste qui l'a produite. Plus d'encadré à
             fond plein : le standard nº 788 vaut aussi pour elle. */}
        {erreurs.general && <MessageErreur>{erreurs.general}</MessageErreur>}
      </form>
    </main>
  );
}
