"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconeApple,
  IconeBouclierTrait,
  IconeEnveloppe,
  IconeFacebook,
  IconeGoogle,
} from "@/components/Icones";
import {
  evaluerMotDePasse,
  LONGUEUR_MINIMALE,
  messageErreurAuth,
} from "@/lib/mot-de-passe";
import { BlocSuppressions } from "@/components/BlocSuppressions";
import { JaugeMotDePasse } from "@/components/JaugeMotDePasse";
import { Patience, SquelettePage } from "@/components/Squelette";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * LA PAGE « SÉCURITÉ » — le compte, pas la fiche
 * ================================================
 * Adresse : /devenir-tatoueur/securite
 * Ouverte depuis le menu « Mon espace », juste sous « Ma fiche ».
 *
 * ELLE S'APPELAIT « CONFIDENTIALITÉ » (jusqu'à la passe nº 129). Le mot
 * était faux : la confidentialité, c'est ce que le site fait de tes
 * données — elle a sa page, publique, à /confidentialite. Ici, on règle
 * ce qui PROTÈGE le compte. D'où le nouveau nom, et le bouclier dans le
 * menu. L'ancienne adresse redirige (voir next.config).
 *
 * QUATRE BLOCS, dans l'ordre où l'on s'en sert :
 *  1. CHANGER D'E-MAIL — le changement est VÉRIFIÉ : un lien part vers
 *     la NOUVELLE adresse, et rien ne bouge tant qu'il n'a pas été
 *     ouvert. C'est ce qui empêche de perdre son compte sur une faute
 *     de frappe.
 *  2. CHANGER DE MOT DE PASSE — l'ANCIEN est exigé (il est vérifié pour
 *     de vrai auprès du serveur avant tout changement), et le nouveau
 *     passe sous la MÊME jauge de force qu'à la création du compte
 *     (`<JaugeMotDePasse>`, règle dans lib/mot-de-passe). Se tromper
 *     d'ancien mot de passe fait apparaître « Mot de passe oublié » :
 *     c'est précisément le moment où l'on en a besoin.
 *  3. MÉTHODE DE CONNEXION — l'e-mail, actif, avec l'adresse en cours ;
 *     Google, Facebook et Apple annoncés « bientôt », grisés, exactement
 *     comme sur l'écran d'inscription.
 *  4. LES SUPPRESSIONS — supprimer UNE fiche, ou LE compte, tout en bas
 *     (voir BlocSuppressions).
 *
 * AUCUN TEXTE D'EXPLICATION SOUS UN TITRE NI SOUS UN CHAMP (charte) :
 * les intitulés vivent DANS les champs. Ce qu'il faut dire se dit au
 * moment où ça compte — dans le message de réussite, ou dans l'erreur.
 *
 * Rien n'est écrit tant qu'un formulaire n'a pas été validé.
 *
 * LA ROBE EST CELLE DU FORMULAIRE DE PORTFOLIO (passe nº 130) : cette
 * page était la dernière du site à porter des contours. Titres AU-
 * DESSUS des encadrés (nº 125/128), carte = un fond un cran plus
 * clair et rien d'autre, champs à bordure transparente dont le focus
 * ÉCLAIRCIT LE FOND (jamais de halo, jamais de rose), messages sur
 * fond élevé — seule l'erreur garde son encadré rouge.
 */

/*  LE CHAMP — copie exacte de celui du formulaire (FormulaireFiche).
    La bordure reste dans la boîte, TRANSPARENTE, pour ne rien décaler
    le jour où une erreur devrait la teindre — et il faut LA DIRE :
    ⚠️ `border` seul laisse la couleur à `currentColor` (le preflight
    de Tailwind v4 ne la pose pas), donc un liseré clair d'un pixel.
    Le formulaire l'écrit aussi, champ par champ (`border-transparent`
    ou `border-erreur`). Le focus n'est qu'un fond plus clair. */
const CHAMP =
  "w-full min-h-[52px] rounded-xl border border-transparent bg-sombre-eleve " +
  "px-4 text-base text-sombre-texte placeholder:text-sombre-texte-doux " +
  "outline-none transition-colors focus:bg-sombre-eleve-clair";

/** LE MESSAGE DE RÉUSSITE — sur fond ÉLEVÉ, pas en rose : la charte
    réserve le rose aux badges sélectionnés, au bouton final et au
    sélecteur. Une confirmation est une information, pas un accent. */
const MESSAGE =
  "rounded-xl bg-sombre-eleve px-4 py-3 text-[13.5px] leading-relaxed text-sombre-texte";

/** L'ERREUR — la seule exception de la charte : l'encadré rouge. */
const ERREUR =
  "rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-[13px] leading-relaxed text-sombre-texte";

/** Un bloc de la page — la grammaire de `Section` du formulaire
    (nº 125 web, nº 128 partout) : le TITRE VIT AU-DESSUS de
    l'encadré, sa marge gauche alignée sur le TEXTE de la carte
    (px-4 ↔ px-4, sm:px-7 ↔ sm:px-7), et la carte n'est qu'un fond un
    cran plus clair — angles 16 px pour 16 px de retrait sur
    téléphone, 24 pour 28 sur le web. `mt-3` (12 px) attache le titre
    à sa carte, plus près d'elle que du bloc précédent. */
function Bloc({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="px-4 sm:px-7">
        <h2 className="text-[18px] font-semibold tracking-tight text-sombre-texte">
          {titre}
        </h2>
      </div>
      {/* GAP-4 (nº 134) : 16 px entre les enfants de la carte — le
          MÊME écart que celui des champs du bloc de mot de passe.
          Une seule respiration sur toute la page. */}
      <div className="mt-3 flex flex-col gap-4 bg-sombre-carte rounded-2xl px-4 py-6 sm:rounded-3xl sm:px-7 sm:py-7">
        {children}
      </div>
    </section>
  );
}

export function Securite() {
  const { utilisateur, pret } = useUtilisateur();
  const router = useRouter();

  /* ---- 1. L'adresse e-mail ---- */
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [messageEmail, setMessageEmail] = useState<string | null>(null);
  const [erreurEmail, setErreurEmail] = useState<string | null>(null);
  const [emailEnCours, setEmailEnCours] = useState(false);

  /* ---- 2. Le mot de passe ---- */
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmationMdp, setConfirmationMdp] = useState("");
  const [mdpVisible, setMdpVisible] = useState(false);
  const [messageMdp, setMessageMdp] = useState<string | null>(null);
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [mdpEnCours, setMdpEnCours] = useState(false);
  /** « MOT DE PASSE OUBLIÉ » — proposé APRÈS s'être trompé d'ancien mot
      de passe, jamais avant. Tant qu'on n'a pas buté, c'est du bruit ;
      une fois qu'on a buté, c'est la seule porte qui reste. */
  const [lienOubli, setLienOubli] = useState(false);

  const force = evaluerMotDePasse(nouveauMdp);

  async function changerEmail(evenement: React.FormEvent) {
    evenement.preventDefault();
    setMessageEmail(null);
    setErreurEmail(null);
    const propre = nouvelEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(propre)) {
      setErreurEmail("Cette adresse e-mail n'a pas l'air complète.");
      return;
    }
    if (propre.toLowerCase() === (utilisateur?.email ?? "").toLowerCase()) {
      setErreurEmail("C'est déjà ton adresse actuelle.");
      return;
    }
    setEmailEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      // LE CHANGEMENT EST VÉRIFIÉ : Supabase envoie un lien à la
      // NOUVELLE adresse ; l'ancienne reste valable tant qu'il n'a
      // pas été ouvert.
      const { error } = await supabase.auth.updateUser(
        { email: propre },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/devenir-tatoueur/securite`,
        }
      );
      if (error) throw error;
      setMessageEmail(
        `Un e-mail de confirmation vient de partir vers ${propre} : ouvre-le pour valider le changement. Ton adresse actuelle reste valable jusque-là.`
      );
      setNouvelEmail("");
    } catch (erreur) {
      setErreurEmail(messageErreurAuth(erreur));
    } finally {
      setEmailEnCours(false);
    }
  }

  async function changerMotDePasse(evenement: React.FormEvent) {
    evenement.preventDefault();
    setMessageMdp(null);
    setErreurMdp(null);
    setLienOubli(false);
    if (ancienMdp.length === 0) {
      setErreurMdp("Ton mot de passe actuel est nécessaire.");
      return;
    }
    if (force.niveau === 0) {
      setErreurMdp(`${LONGUEUR_MINIMALE} caractères au minimum.`);
      return;
    }
    if (nouveauMdp !== confirmationMdp) {
      setErreurMdp("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setMdpEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      // L'ANCIEN MOT DE PASSE EST VRAIMENT VÉRIFIÉ : on le présente
      // au serveur avant d'écrire quoi que ce soit. Sans cela,
      // n'importe qui trouvant une session ouverte pourrait changer
      // le mot de passe et prendre le compte.
      const { error: verification } = await supabase.auth.signInWithPassword({
        email: utilisateur?.email ?? "",
        password: ancienMdp,
      });
      if (verification) {
        setErreurMdp("Ton mot de passe actuel n'est pas le bon.");
        // C'EST ICI QUE LA PORTE DE SECOURS S'OUVRE (nº 129) : on ne
        // se souvient plus de son mot de passe, on ne peut donc pas en
        // choisir un nouveau. Le lien mène au parcours déjà en place —
        // un e-mail, puis /devenir-tatoueur/nouveau-mot-de-passe.
        setLienOubli(true);
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: nouveauMdp,
      });
      if (error) throw error;
      setMessageMdp("C'est fait : ton mot de passe a été changé.");
      setAncienMdp("");
      setNouveauMdp("");
      setConfirmationMdp("");
    } catch (erreur) {
      setErreurMdp(messageErreurAuth(erreur));
    } finally {
      setMdpEnCours(false);
    }
  }

  /** LE PARCOURS DE RÉINITIALISATION, celui qui existe déjà : Supabase
      envoie un e-mail dont le lien ouvre
      /devenir-tatoueur/nouveau-mot-de-passe. Ici on connaît déjà
      l'adresse du compte — rien à ressaisir. */
  async function envoyerLienDeSecours() {
    const adresse = utilisateur?.email ?? "";
    if (!adresse) return;
    setMdpEnCours(true);
    setErreurMdp(null);
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.auth.resetPasswordForEmail(adresse, {
        redirectTo: `${window.location.origin}/auth/callback?next=/devenir-tatoueur/nouveau-mot-de-passe`,
      });
      if (error) throw error;
      setLienOubli(false);
      setMessageMdp(
        `Un e-mail vient de partir vers ${adresse} : ouvre-le et suis le lien pour choisir un nouveau mot de passe. Pense au dossier indésirable.`
      );
    } catch (erreur) {
      setErreurMdp(messageErreurAuth(erreur));
    } finally {
      setMdpEnCours(false);
    }
  }

  /* ---------- PAS CONNECTÉ : DROIT À LA PAGE DE CONNEXION ----------
     ⚠️ L'ÉCRAN « CONNECTE-TOI D'ABORD » A DISPARU (passe nº 133) —
     ici comme sur le formulaire de portfolio. Se déconnecter depuis
     cette page y menait tout droit : une page entière pour annoncer
     qu'il fallait un compte, et un bouton qui n'allait qu'à un seul
     endroit. On y va directement. */
  useEffect(() => {
    if (pret && !utilisateur) router.replace("/devenir-tatoueur");
  }, [pret, utilisateur, router]);

  if (pret && !utilisateur) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  if (!pret) {
    //  PLUS D'« Un instant… » (passe nº 118) : rien pendant 300 ms,
    //  puis la silhouette de la page — titre et cartes de réglages.
    return (
      <main className="flex-1 mx-auto w-full max-w-[640px] px-4 sm:px-6 pt-10 pb-24">
        <Patience>
          <SquelettePage />
        </Patience>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-[640px] px-4 sm:px-6 pt-8 sm:pt-10 pb-24">
      {/* LE TITRE, SEUL : le sous-titre qui l'accompagnait redisait le
          contenu des blocs, qu'on voit juste en dessous (nº 129).
          LE BOUCLIER À SA GAUCHE (nº 134) : la même icône que dans le
          menu « Mon espace » — la page se reconnaît d'où on l'a
          ouverte. Même gris à 80 % que les icônes du menu. */}
      <h1 className="flex items-center gap-2.5 text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte">
        <IconeBouclierTrait
          taille={26}
          classe="shrink-0 text-sombre-texte/80"
        />
        Sécurité
      </h1>

      {/* LE MÊME RYTHME QUE LE FORMULAIRE (nº 130) : 32 px entre les
          blocs sur téléphone, 24 sur le web. */}
      <div className="mt-10 sm:mt-8 flex flex-col gap-8 sm:gap-6">
        {/* ---------- 1 · CHANGER D'E-MAIL ---------- */}
        <Bloc titre="Changer d'e-mail">
          {/* L'ADRESSE EN COURS — un fond élevé, sans contour : c'est
              un badge d'information, le niveau au-dessus de la carte. */}
          <div className="flex items-center gap-3 rounded-xl bg-sombre-eleve px-4 py-3">
            <IconeEnveloppe taille={19} classe="shrink-0 text-sombre-texte-doux" />
            <span className="min-w-0 flex-1 truncate text-[15px] text-sombre-texte">
              {utilisateur?.email ?? "—"}
            </span>
            <span className="shrink-0 text-[12px] uppercase tracking-wide text-sombre-texte-doux">
              actuelle
            </span>
          </div>

          {/* GAP-4 (nº 134) : l'écart entre « Nouvelle adresse » et le
              bouton vaut EXACTEMENT celui entre l'adresse actuelle et
              le champ (le gap-4 de la carte) — plus deux rythmes. */}
          <form onSubmit={changerEmail} noValidate className="flex flex-col gap-4">
            {/* L'INTITULÉ EST DANS LE CHAMP (charte) — le titre qui le
                surmontait a disparu. Il reste pour les lecteurs
                d'écran, qui n'entendent pas un texte d'indication. */}
            <div>
              <label htmlFor="securite-email" className="sr-only">
                Nouvelle adresse
              </label>
              <input
                id="securite-email"
                type="email"
                autoComplete="email"
                value={nouvelEmail}
                onChange={(e) => setNouvelEmail(e.target.value)}
                placeholder="Nouvelle adresse"
                className={CHAMP}
              />
            </div>
            {erreurEmail && (
              <p role="alert" className={ERREUR}>
                {erreurEmail}
              </p>
            )}
            {messageEmail && <p className={MESSAGE}>{messageEmail}</p>}
            {/* LA CAPSULE DU FORMULAIRE (nº 116) : naturelle tant que
                le champ est vide, ROSE dès qu'il y a quelque chose à
                envoyer — la page n'a pas UNE action finale, chaque
                bloc a la sienne, et c'est la saisie qui l'allume.
                Elle reste cliquable dans les deux cas : rien ne
                change dans ce qu'un clic déclenche. */}
            <button
              type="submit"
              disabled={emailEnCours}
              className={`self-start inline-flex items-center justify-center rounded-full
                         px-7 min-h-[48px] text-[15px] font-semibold transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed ${
                           nouvelEmail.trim().length > 0
                             ? "bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white"
                             : "bg-sombre-eleve text-sombre-texte-doux"
                         }`}
            >
              {emailEnCours ? "Envoi…" : "Changer mon adresse"}
            </button>
          </form>
        </Bloc>

        {/* ---------- 2 · CHANGER DE MOT DE PASSE ---------- */}
        <Bloc titre="Changer de mot de passe">
          <form
            onSubmit={changerMotDePasse}
            noValidate
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="securite-ancien" className="sr-only">
                Mot de passe actuel
              </label>
              <input
                id="securite-ancien"
                type={mdpVisible ? "text" : "password"}
                autoComplete="current-password"
                value={ancienMdp}
                onChange={(e) => setAncienMdp(e.target.value)}
                placeholder="Mot de passe actuel"
                className={CHAMP}
              />
            </div>

            <div>
              <label htmlFor="securite-nouveau" className="sr-only">
                Nouveau mot de passe
              </label>
              <input
                id="securite-nouveau"
                type={mdpVisible ? "text" : "password"}
                autoComplete="new-password"
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
                placeholder="Nouveau mot de passe"
                className={CHAMP}
              />
              {/* LA JAUGE — le composant de la création de compte, tel
                  quel : critères cochés en direct (nº 129). */}
              <JaugeMotDePasse motDePasse={nouveauMdp} />
            </div>

            <div>
              <label htmlFor="securite-confirmation" className="sr-only">
                Retaper le nouveau mot de passe
              </label>
              <input
                id="securite-confirmation"
                type={mdpVisible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmationMdp}
                onChange={(e) => setConfirmationMdp(e.target.value)}
                placeholder="Retaper le nouveau mot de passe"
                className={CHAMP}
              />
            </div>

            <label className="flex items-center gap-2 text-[13.5px] text-sombre-texte-doux">
              <input
                type="checkbox"
                checked={mdpVisible}
                onChange={(e) => setMdpVisible(e.target.checked)}
                className="accent-primaire"
              />
              Afficher les mots de passe
            </label>

            {erreurMdp && (
              <p role="alert" className={ERREUR}>
                {erreurMdp}
              </p>
            )}
            {/* LA PORTE DE SECOURS — visible seulement après s'être
                trompé d'ancien mot de passe. Bouton en TEXTE BRUT :
                c'est une issue, pas l'action de ce bloc. */}
            {lienOubli && (
              <p className="text-[13px] text-sombre-texte-doux">
                <button
                  type="button"
                  onClick={envoyerLienDeSecours}
                  disabled={mdpEnCours}
                  className="text-[13px] text-sombre-texte-doux underline
                             underline-offset-4 hover:text-primaire
                             transition-colors disabled:opacity-60"
                >
                  Mot de passe oublié ?
                </button>
              </p>
            )}
            {messageMdp && <p className={MESSAGE}>{messageMdp}</p>}

            {/* Même règle que l'e-mail : la capsule s'allume quand les
                trois champs portent quelque chose. */}
            <button
              type="submit"
              disabled={mdpEnCours}
              className={`self-start inline-flex items-center justify-center rounded-full
                         px-7 min-h-[48px] text-[15px] font-semibold transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed ${
                           ancienMdp.length > 0 &&
                           nouveauMdp.length > 0 &&
                           confirmationMdp.length > 0
                             ? "bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white"
                             : "bg-sombre-eleve text-sombre-texte-doux"
                         }`}
            >
              {mdpEnCours ? "Un instant…" : "Changer mon mot de passe"}
            </button>
          </form>
        </Bloc>

        {/* ---------- 3 · MÉTHODE DE CONNEXION ---------- */}
        <Bloc titre="Méthode de connexion">
          {/* GAP-4 (nº 134) : les lignes respirent du même écart que
              tout le reste de la page — et que les lignes du bloc
              « Supprimer », qui ont exactement leur hauteur. */}
          <ul className="flex flex-col gap-4">
            {/* L'E-MAIL — le seul actif : un BADGE SÉLECTIONNÉ, donc
                le rose dilué — sans contour, le fond suffit. */}
            <li
              className="flex items-center gap-3 rounded-xl
                         bg-primaire/10 px-4 min-h-[54px]"
            >
              <IconeBouclierTrait taille={20} classe="shrink-0 text-primaire" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-sombre-texte">
                  E-mail et mot de passe
                </span>
                <span className="block truncate text-[12.5px] text-sombre-texte-doux">
                  {utilisateur?.email ?? "—"}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-primaire px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                actif
              </span>
            </li>

            {/* LES TROIS FOURNISSEURS — annoncés, pas promis : la même
                robe grisée et la même mention « bientôt » que sur
                l'écran d'inscription. */}
            {(
              [
                ["Google", <IconeGoogle key="g" taille={20} />],
                ["Facebook", <IconeFacebook key="f" taille={20} />],
                ["Apple", <IconeApple key="a" taille={20} />],
              ] as const
            ).map(([fournisseur, icone]) => (
              <li key={fournisseur}>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={`La connexion ${fournisseur} arrive bientôt`}
                  className="flex w-full items-center gap-3 rounded-xl
                             bg-sombre-eleve px-4 min-h-[54px] text-left
                             text-[14.5px] text-sombre-texte opacity-55
                             cursor-not-allowed"
                >
                  <span className="shrink-0">{icone}</span>
                  Continuer avec {fournisseur}
                  {/* La pastille : le niveau AU-DESSUS de sa ligne —
                      fond élevé-clair, aucun trait. */}
                  <span
                    className="ml-auto rounded-full bg-sombre-eleve-clair px-2.5 py-0.5
                               text-[11px] uppercase tracking-wide text-sombre-texte-doux"
                  >
                    bientôt
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>

        {/* 4. LES SUPPRESSIONS — en dernier. */}
        <BlocSuppressions />
      </div>
    </main>
  );
}
