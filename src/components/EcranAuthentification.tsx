"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARRIVEE_APRES_CONNEXION, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import {
  IconeApple,
  IconeFacebook,
  IconeGoogle,
} from "@/components/Icones";
import { JaugeMotDePasse } from "@/components/JaugeMotDePasse";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  lireDejaConnecte,
  lireDejaConnecteServeur,
  souscrireStockage,
} from "@/lib/deja-connecte";
import { LONGUEUR_MINIMALE, evaluerMotDePasse } from "@/lib/mot-de-passe";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * CRÉER MON COMPTE / ME CONNECTER — l'écran d'authentification
 * =============================================================
 * Deux modes, une bascule visible en tête, aucun doute possible sur
 * celui où l'on se trouve.
 *
 * LA ROBE EST CELLE DU FORMULAIRE ET DE LA PAGE SÉCURITÉ (passe
 * nº 134) — c'était le dernier écran à porter l'ancienne : onglets en
 * pilule rose, halo rose au focus, capsules à liseré. Désormais :
 *  · la bascule est LE SÉLECTEUR DU FORMULAIRE (`OngletsLigne`) —
 *    les deux mots côte à côte sans piste ni fond, la ligne fine
 *    grise continue dessous, le segment actif épaissi et rose ;
 *  · les champs portent l'intitulé EN EUX (placeholder, label pour
 *    les lecteurs d'écran) et leur focus ÉCLAIRCIT LE FOND — jamais
 *    de halo, jamais de rose ;
 *  · les fournisseurs prennent la robe grisée de la page Sécurité
 *    (fond élevé, pastille « bientôt » élevée-claire, zéro trait) ;
 *  · l'action finale reste LA capsule pleine rose pleine largeur.
 * RIEN NE CHANGE DANS CE QUE LES GESTES DÉCLENCHENT.
 *
 * L'ORDRE DES MOYENS : les fournisseurs (Google, Facebook, Apple)
 * D'ABORD — c'est le premier réflexe aujourd'hui — puis « ou », puis
 * l'e-mail. Le même ordre dans les deux modes.
 *
 * L'E-MAIL SUFFIT À CRÉER LE COMPTE : pas de champ nom ici — le nom
 * viendra avec la fiche. Le mot de passe se saisit DEUX fois, avec
 * une jauge de force (8 caractères au minimum, bloquant) et la liste
 * des exigences cochées en direct.
 *
 * CE QUI FONCTIONNE : l'e-mail + mot de passe, par Supabase Auth.
 * CE QUI ATTEND : les trois fournisseurs — chacun exige des clés
 * créées chez lui puis déclarées dans Supabase ; boutons présents,
 * désactivés, annoncés « bientôt ». Le jour venu : activer le
 * fournisseur dans Supabase (Authentication → Providers) puis
 * remplacer `disabled` par
 * `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`
 * — la route /auth/callback attend déjà ce retour.
 */

type Mode = "creer" | "connexion";

/*  LA RÈGLE DU MOT DE PASSE ET SA JAUGE VIVENT AILLEURS (passe nº 129).
    Elles étaient recopiées ici, à l'identique de `lib/mot-de-passe` —
    deux copies d'une même règle finissent toujours par diverger, et
    c'était déjà fait côté dessin. La règle vient de `lib/mot-de-passe`,
    le dessin de `<JaugeMotDePasse>` : la page « Sécurité » affiche
    EXACTEMENT la même chose que cet écran, sans qu'on ait à y penser. */

/** Les erreurs Supabase, traduites en français — jamais d'anglais brut. */
function messageErreur(erreur: unknown): string {
  const brut =
    erreur instanceof Error ? erreur.message.toLowerCase() : String(erreur);
  if (brut.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (brut.includes("email not confirmed"))
    return "Ton adresse n'est pas encore confirmée : ouvre l'e-mail qui t'a été envoyé.";
  if (brut.includes("already registered"))
    return "Un compte existe déjà avec cette adresse. Connecte-toi.";
  if (brut.includes("password should be"))
    return `Le mot de passe doit faire au moins ${LONGUEUR_MINIMALE} caractères.`;
  if (brut.includes("rate limit") || brut.includes("too many"))
    return "Trop d'essais d'affilée. Attends quelques minutes, puis réessaie.";
  if (brut.includes("fetch") || brut.includes("network"))
    return "Impossible de joindre le serveur. Vérifie ta connexion, puis réessaie.";
  return "Quelque chose n'a pas marché. Réessaie.";
}

/*  LE CHAMP — la copie exacte de celui du formulaire et de Sécurité :
    bordure dans la boîte (transparente au repos, rouge en erreur —
    posée champ par champ, jamais laissée à `currentColor`), et un
    focus qui n'est qu'un FOND PLUS CLAIR. Le halo rose de l'ancienne
    robe (`focus:ring-primaire/25`) a disparu : la charte réserve le
    rose au sélecteur et à l'action finale. */
const CHAMP =
  "w-full min-h-[52px] rounded-xl border bg-sombre-eleve px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:bg-sombre-eleve-clair";

/** LE MESSAGE (réussite / information) — fond élevé, comme Sécurité. */
const MESSAGE =
  "rounded-xl bg-sombre-eleve px-4 py-3 text-[13.5px] leading-relaxed text-sombre-texte";

/** L'ERREUR — la seule exception de la charte : l'encadré rouge. */
const ERREUR =
  "rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-[13px] leading-relaxed text-sombre-texte";

export function EcranAuthentification({
  rattachement,
}: {
  /** LA PAGE DE RATTACHEMENT (passe nº 135) réutilise CET écran, tel
      quel, à une différence près : le sélecteur disparaît. On ne
      demande pas à quelqu'un qui vient récupérer son portfolio s'il
      veut « créer un compte ou se connecter » — il vient créer son
      compte, et l'écran le sait. Le jeton voyage jusqu'au bout : il
      décide de l'adresse de retour, e-mail de confirmation compris. */
  rattachement?: { jeton: string };
} = {}) {
  const router = useRouter();
  const enRattachement = Boolean(rattachement);
  /** Où l'on retombe une fois le compte créé (ou la session ouverte).
      En rattachement, c'est LA PAGE DU JETON : elle a la session, elle
      rattache, elle le dit. Ailleurs, « Ma fiche », comme depuis la
      passe nº 131. */
  const arrivee = rattachement
    ? `/rejoindre/${rattachement.jeton}`
    : ARRIVEE_APRES_CONNEXION;
  const { utilisateur, pret } = useUtilisateur();

  /** LE MODE PAR DÉFAUT SUIT LE VISITEUR : un navigateur qui a déjà
      connu un compte (drapeau local, le même que le bouton « Se
      connecter » de la barre) s'ouvre sur « Me connecter » — on ne
      propose pas de créer un compte à qui en a déjà un. Le mode ne
      devient un ÉTAT que lorsqu'on clique un onglet : avant ça, il
      DÉRIVE du drapeau (aucun écart entre serveur et navigateur). */
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    lireDejaConnecteServeur
  );
  const [modeChoisi, setModeChoisi] = useState<Mode | null>(null);
  //  ⚠️ EN RATTACHEMENT, LE DÉFAUT EST TOUJOURS « CRÉER » — même pour
  //  un navigateur qui a déjà connu un compte. Le drapeau « déjà
  //  connecté » sert à deviner ce que veut un visiteur ordinaire ; ici
  //  on le sait, il vient de cliquer sur un lien qui le lui propose.
  const mode: Mode = enRattachement
    ? (modeChoisi ?? "creer")
    : (modeChoisi ?? (dejaConnecte ? "connexion" : "creer"));
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  /** Erreurs par champ (validation) + erreur générale (serveur). */
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);
  /** « Mot de passe oublié ? » — proposé APRÈS un échec de connexion,
      pas avant : tant qu'on n'a pas buté, le lien n'est que du bruit. */
  const [lienMotDePasseOublie, setLienMotDePasseOublie] = useState(false);

  const creer = mode === "creer";
  const force = evaluerMotDePasse(motDePasse);

  function basculer(suivant: Mode) {
    setModeChoisi(suivant);
    setErreurs({});
    setInfo(null);
    setLienMotDePasseOublie(false);
  }

  /** La validation AVANT l'envoi : chaque reproche sous son champ. */
  function valider(): boolean {
    const trouvees: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      trouvees.email = "Cette adresse e-mail n'a pas l'air complète.";
    }
    if (creer) {
      if (motDePasse.length < LONGUEUR_MINIMALE) {
        trouvees.motDePasse = `${LONGUEUR_MINIMALE} caractères au minimum.`;
      }
      if (!trouvees.motDePasse && confirmation !== motDePasse) {
        trouvees.confirmation = "Les deux mots de passe ne correspondent pas.";
      }
    } else if (motDePasse.length === 0) {
      trouvees.motDePasse = "Ton mot de passe est nécessaire.";
    }
    setErreurs(trouvees);
    return Object.keys(trouvees).length === 0;
  }

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    setInfo(null);
    if (!valider()) return;
    setEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      if (creer) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: motDePasse,
          options: {
            // Le lien de l'e-mail de confirmation mène à la MÊME
            // adresse d'arrivée que toute connexion (nº 131). Un
            // compte neuf n'a pas de fiche : la page y répond seule
            // en montrant le formulaire de création.
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              arrivee
            )}`,
          },
        });
        if (error) throw error;
        // Adresse déjà prise : Supabase répond « utilisateur créé »
        // sans identité, pour ne pas révéler qui est inscrit. On le
        // dit quand même à la personne — c'est SON adresse.
        if (data.user && (data.user.identities?.length ?? 1) === 0) {
          setErreurs({
            general: "Un compte existe déjà avec cette adresse. Connecte-toi.",
          });
          return;
        }
        if (!data.session) {
          setInfo(
            `Ton compte est créé. Un e-mail de confirmation vient de partir vers ${email.trim()} — ouvre-le pour activer le compte.`
          );
        } else {
          // Session immédiate (confirmation désactivée) : la MÊME
          // adresse d'arrivée que partout ailleurs. Un compte neuf
          // n'a pas de fiche, la page tombe donc d'elle-même sur le
          // formulaire de création — inutile de le décider ici.
          router.push(arrivee);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: motDePasse,
        });
        if (error) throw error;
        // UNE SUPPRESSION EN COURS ? La reconnexion l'ANNULE, tout de
        // suite et sans rien demander — c'est la promesse faite au
        // moment de la demande. Si quelque chose est rétabli, la page
        // d'arrivée accueille la personne (voir ?bienvenue=1).
        let rétabli = false;
        try {
          const reponse = await fetch("/api/tatoueur/reactiver", {
            method: "POST",
          });
          const donnees = (await reponse.json().catch(() => null)) as
            | { reactive?: boolean }
            | null;
          rétabli = Boolean(donnees?.reactive);
        } catch {
          // Route injoignable : la connexion, elle, a réussi — on
          // n'en fait pas un échec.
        }
        // Connecté → « MA FICHE », l'aperçu public de son portfolio
        // (passe nº 131). Celui du sélecteur s'il en a plusieurs, le
        // formulaire de création s'il n'en a aucun : la page
        // /devenir-tatoueur/fiche tranche elle-même.
        //  EN RATTACHEMENT, ON RETOURNE AU JETON, sans « bienvenue » :
        //  la page du jeton a son propre accueil, et c'est elle qui
        //  rattache les fiches.
        router.push(
          enRattachement
            ? arrivee
            : rétabli
              ? `${ARRIVEE_APRES_CONNEXION}&bienvenue=1`
              : ARRIVEE_APRES_CONNEXION
        );
      }
    } catch (erreur) {
      setErreurs({ general: messageErreur(erreur) });
      // Un échec de CONNEXION fait apparaître la porte de secours.
      if (!creer) setLienMotDePasseOublie(true);
    } finally {
      setEnCours(false);
    }
  }

  /** L'E-MAIL DE RÉINITIALISATION (Supabase) : le lien qu'il contient
      ouvre /devenir-tatoueur/nouveau-mot-de-passe, où l'on choisit le
      nouveau mot de passe. Il faut d'abord une adresse dans le champ. */
  async function demanderReinitialisation() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErreurs({ email: "Écris d'abord ton adresse e-mail ci-dessus." });
      return;
    }
    setEnCours(true);
    setErreurs({});
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/devenir-tatoueur/nouveau-mot-de-passe`,
        }
      );
      if (error) throw error;
      setLienMotDePasseOublie(false);
      setInfo(
        `Un e-mail vient de partir vers ${email.trim()} : ouvre-le et suis le lien pour choisir un nouveau mot de passe. Pense au dossier indésirable.`
      );
    } catch (erreur) {
      setErreurs({ general: messageErreur(erreur) });
    } finally {
      setEnCours(false);
    }
  }

  /* ---------- CONNECTÉ : cette page n'existe plus ----------
     La règle, sans exception : un connecté va à SA FICHE (le
     formulaire s'il n'en a pas, l'écran d'état sinon). La page
     « Tu es connecté » est supprimée ; déconnexion et suppression
     de compte vivent en bas de la fiche. */
  //  ⚠️ SAUF EN RATTACHEMENT : là, un connecté a tout à faire sur la
  //  page du jeton (elle lui donne ses fiches). C'est ELLE qui décide
  //  quoi montrer — cet écran n'est qu'un de ses morceaux.
  useEffect(() => {
    if (!enRattachement && pret && utilisateur) {
      router.replace(ARRIVEE_APRES_CONNEXION);
    }
  }, [enRattachement, pret, utilisateur, router]);

  if (!enRattachement && pret && utilisateur) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  /* ---------- DÉCONNECTÉ : les deux modes ---------- */
  return (
    <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-10 sm:pt-14 pb-24">
      <h1 className="text-[clamp(1.6rem,4.5vw,2.1rem)] font-bold leading-tight text-sombre-texte text-center">
        {enRattachement
          ? creer
            ? "Crée ton compte"
            : "Connecte-toi"
          : creer
            ? "Crée ton compte"
            : "Content de te revoir"}
      </h1>
      <p className="mt-2 text-center text-[15px] text-sombre-texte-doux">
        {enRattachement
          ? "Tes fiches te seront rattachées aussitôt."
          : creer
            ? `Ton travail a sa place sur ${MARQUE_YOKOFOLIO.nom}.`
            : "Connecte-toi pour retrouver ton compte."}
      </p>

      {/* ⚠️ LE SÉLECTEUR DISPARAÎT EN RATTACHEMENT (passe nº 135) —
          c'est LA différence avec la page de connexion ordinaire. On
          ne demande pas « créer un compte ou se connecter ? » à
          quelqu'un qui vient de cliquer sur un lien qui lui propose de
          récupérer son portfolio : il vient créer son compte. */}
      {/* LA BASCULE — LE SÉLECTEUR DU FORMULAIRE (passe nº 134) : les
          deux mots côte à côte, sans piste ni fond, l'actif en blanc ;
          dessous la ligne fine grise continue, épaissie et rose sous
          le mot choisi — elle glisse au changement. La pilule rose qui
          vivait ici était le dernier sélecteur du site à ne pas parler
          cette langue. Un mode est TOUJOURS actif (le drapeau « déjà
          connecté » choisit le premier), donc le segment rose est
          toujours posé — c'est l'écran, pas le bloc 1 du formulaire,
          où rien n'est choisi tant qu'on n'a pas choisi. */}
      {!enRattachement && (
        <div className="mt-7">
          <OngletsLigne
            ariaLabel="Créer mon compte ou me connecter"
            options={[
              { cle: "creer", label: "Créer mon compte" },
              { cle: "connexion", label: "Me connecter" },
            ]}
            cleActive={mode}
            surChoix={(cle) => basculer(cle as Mode)}
          />
        </div>
      )}

      {/* ---------- LES FOURNISSEURS D'ABORD — annoncés, pas promis.
          LA ROBE DE LA PAGE SÉCURITÉ (nº 134) : fond élevé sans un
          trait, pastille « bientôt » un cran plus claire — les deux
          écrans disent la même chose avec les mêmes mots. ---------- */}
      <div className="mt-7 flex flex-col gap-3">
        {(
          [
            ["Google", <IconeGoogle key="g" taille={20} />],
            ["Facebook", <IconeFacebook key="f" taille={20} />],
            ["Apple", <IconeApple key="a" taille={20} />],
          ] as const
        ).map(([fournisseur, icone]) => (
          <button
            key={fournisseur}
            type="button"
            disabled
            aria-disabled="true"
            title={`La connexion ${fournisseur} arrive bientôt`}
            className="flex items-center gap-3 rounded-xl bg-sombre-eleve
                       min-h-[54px] px-4 text-left text-[14.5px] text-sombre-texte
                       opacity-55 cursor-not-allowed"
          >
            <span className="shrink-0">{icone}</span>
            Continuer avec {fournisseur}
            <span
              className="ml-auto rounded-full bg-sombre-eleve-clair px-2.5 py-0.5
                         text-[11px] uppercase tracking-wide text-sombre-texte-doux"
            >
              bientôt
            </span>
          </button>
        ))}
      </div>

      {/* « ou » — le mot seul, sans filets : plus aucun trait décoratif
          sur cet écran (charte). L'espace et le mot suffisent. */}
      <p className="mt-6 text-center text-[13px] text-sombre-texte-doux" aria-hidden="true">
        ou
      </p>

      {/* ---------- …puis l'e-mail ----------
          LES INTITULÉS SONT DANS LES CHAMPS (charte, nº 134) : les
          étiquettes qui les surmontaient ont disparu de l'écran — le
          placeholder les porte, et le label reste pour les lecteurs
          d'écran, exactement comme sur la page Sécurité. */}
      <form onSubmit={soumettre} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="auth-email" className="sr-only">
            Adresse e-mail
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(erreurs.email)}
            placeholder="Adresse e-mail"
            className={`${CHAMP} ${
              erreurs.email ? "border-erreur" : "border-transparent"
            }`}
          />
          {erreurs.email && (
            <p className="mt-1.5 text-[13px] text-erreur">{erreurs.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="auth-mdp" className="sr-only">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="auth-mdp"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete={creer ? "new-password" : "current-password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              aria-invalid={Boolean(erreurs.motDePasse)}
              placeholder="Mot de passe"
              style={{ paddingRight: 88 }}
              className={`${CHAMP} ${
                erreurs.motDePasse ? "border-erreur" : "border-transparent"
              }`}
            />
            <button
              type="button"
              onClick={() => setMotDePasseVisible((v) => !v)}
              aria-pressed={motDePasseVisible}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5
                         text-[13px] font-medium text-sombre-texte-doux
                         hover:text-sombre-texte transition-colors"
            >
              {motDePasseVisible ? "Masquer" : "Afficher"}
            </button>
          </div>
          {erreurs.motDePasse && (
            <p className="mt-1.5 text-[13px] text-erreur">{erreurs.motDePasse}</p>
          )}

          {/* « MOT DE PASSE OUBLIÉ ? » — connexion uniquement, et
              seulement APRÈS un échec : discret, aligné à droite sous
              le champ, il envoie l'e-mail de réinitialisation. */}
          {!creer && lienMotDePasseOublie && (
            <p className="mt-2 text-right">
              <button
                type="button"
                onClick={demanderReinitialisation}
                disabled={enCours}
                className="text-[13px] text-sombre-texte-doux underline
                           underline-offset-4 hover:text-primaire
                           transition-colors disabled:opacity-60"
              >
                Mot de passe oublié ?
              </button>
            </p>
          )}

          {/* LA JAUGE DE FORCE — création uniquement, dès qu'on tape.
              Le dessin vit dans `<JaugeMotDePasse>` (nº 129) : la page
              « Sécurité » montre le même, au pixel près. */}
          {creer && <JaugeMotDePasse motDePasse={motDePasse} />}
        </div>

        {/* LA CONFIRMATION — création uniquement. */}
        {creer && (
          <div>
            <label htmlFor="auth-mdp-confirmation" className="sr-only">
              Retaper le mot de passe
            </label>
            <input
              id="auth-mdp-confirmation"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              aria-invalid={Boolean(erreurs.confirmation)}
              placeholder="Retaper le mot de passe"
              className={`${CHAMP} ${
                erreurs.confirmation ? "border-erreur" : "border-transparent"
              }`}
            />
            {erreurs.confirmation && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {erreurs.confirmation}
              </p>
            )}
          </div>
        )}

        {erreurs.general && (
          <p role="alert" className={ERREUR}>
            {erreurs.general}
          </p>
        )}
        {/* L'INFORMATION SUR FOND ÉLEVÉ (nº 134) — plus d'encadré
            rose : une confirmation est une information, pas un accent
            (la règle de la page Sécurité, mot pour mot). */}
        {info && (
          <p role="status" className={MESSAGE}>
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={enCours || (creer && force.niveau === 0 && motDePasse.length > 0)}
          className="mt-1 inline-flex items-center justify-center rounded-full
                     min-h-[52px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enCours
            ? "Un instant…"
            : creer
              ? "Créer mon compte"
              : "Me connecter"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] leading-relaxed text-sombre-texte-doux">
        En créant un compte, tu acceptes les{" "}
        <Link href="/mentions-legales" className="text-primaire hover:underline">
          règles du site
        </Link>
        . Ton adresse ne sert qu&apos;à ton compte — jamais à de la publicité.
      </p>
    </main>
  );
}
