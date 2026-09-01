"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconeArobase,
  IconeBouclierTrait,
  IconeEnveloppe,
  IconeGoogle,
} from "@/components/Icones";
//  §1/§3 (nº 783) — le flux Google, écrit une seule fois
//  (lib/connexion-google). Ici on LIE et on DÉLIE : ce ne sont pas les
//  appels de la connexion, et la note de ce fichier-là dit pourquoi.
import { delierGoogle, lierGoogle } from "@/lib/connexion-google";
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
 *  3. MÉTHODE DE CONNEXION — ce que CE compte emploie vraiment
 *     (nº 783) : l'e-mail (« actif » seulement s'il a un mot de passe)
 *     et Google, qu'on LIE et qu'on DÉLIE d'ici. Facebook et Apple ont
 *     été retirés, code compris : plus aucun « bientôt » sur ce site.
 *     ⚠️ ON NE PEUT PAS DÉLIER SON DERNIER MOYEN D'ENTRER — ni ici, ni
 *     dans lib/connexion-google, qui refuse aussi. Sans mot de passe,
 *     retirer Google fermerait le compte à clé.
 *     ⚠️ AUCUNE TEINTE D'ÉTAT DANS CE BLOC (nº 784) : les encadrés ont
 *     le fond de tous les autres, actifs ou non, et « actif » comme
 *     « Délier » portent LA MÊME pastille (`PASTILLE_METHODE`).
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
  "w-full min-h-[52px] rounded-lg border border-transparent bg-sombre-eleve-clair " +
  "px-4 text-base text-sombre-texte placeholder:text-sombre-texte-doux " +
  "outline-none transition-colors focus:bg-sombre-haut";

/** LE MESSAGE DE RÉUSSITE — sur fond ÉLEVÉ, pas en rose : la charte
    réserve le rose aux badges sélectionnés, au bouton final et au
    sélecteur. Une confirmation est une information, pas un accent. */
const MESSAGE =
  "rounded-lg bg-sombre-eleve px-4 py-3 text-[13.5px] leading-relaxed text-sombre-texte";

/** L'ERREUR — la seule exception de la charte : l'encadré rouge. */
const ERREUR =
  "rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3 text-[13px] leading-relaxed text-sombre-texte";

/**
 * ██ §1 (nº 784) — LA PASTILLE DES MÉTHODES DE CONNEXION ██
 * ==================================================================
 * « ACTIF » ET « DÉLIER » N'EN FONT PLUS QU'UNE, sur consigne : même
 * forme, même hauteur, même couleur. Ce qui les sépare, c'est ce
 * qu'elles disent — pas leur allure.
 * CE QUI VIVAIT ICI, ET QUI DÉSÉQUILIBRAIT LA LIGNE : « Actif » était
 * une petite pastille ROSE de 11 px, « Délier » un bouton gris de
 * 38 px de haut. Deux objets de tailles et de couleurs différentes
 * pour deux mentions de même rang, sur deux lignes voisines.
 * LA FORME RETENUE EST CELLE D'« ACTIF », LA COULEUR CELLE DE
 * « DÉLIER » (le gris élevé) — plus aucun rose dans ce bloc.
 * ⚠️ UNE SEULE ÉCRITURE POUR LES DEUX (piège nº 378) : c'est la seule
 * façon qu'elles restent identiques. Le bouton y ajoute ce qui
 * appartient à un bouton — le survol et l'état désactivé — et rien
 * d'autre.
 */
const PASTILLE_METHODE =
  "shrink-0 rounded-full bg-sombre-eleve-clair px-2.5 py-0.5 " +
  "text-[11px] font-semibold uppercase tracking-wide text-sombre-texte";

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
        {/*  §4 (nº 662) — LE TITRE D'ENCADRÉ, UN CRAN PLUS PETIT AU
             DOIGT. Le propriétaire le trouve « un peu trop grand » sur
             le téléphone, où la fenêtre est étroite et où les titres se
             suivent de près. 18 → 16 px : le rang du NOM de la tête de
             « Mon compte » au web (nº 640), déjà employé — aucune
             taille nouvelle.
             ⚠️ DEUX VARIANTES QUI S'EXCLUENT, AUCUNE CLASSE DE BASE
             (règle nº 389), et l'appareil se lit sur `data-appareil`,
             jamais sur une largeur de fenêtre (règle nº 60).
             ⚠️ LE WEB NE BOUGE PAS D'UN PIXEL : ses 18 px sont ceux
             d'avant, écrits par la seconde variante. */}
        <h2
          className="mobile:text-[16px] not-mobile:text-[18px]
                     font-semibold tracking-tight text-sombre-texte"
        >
          {titre}
        </h2>
      </div>
      {/* GAP-4 (nº 134) : 16 px entre les enfants de la carte — le
          MÊME écart que celui des champs du bloc de mot de passe.
          Une seule respiration sur toute la page. */}
      <div className="mt-3 flex flex-col gap-4 bg-sombre-carte rounded-xl px-4 py-6 sm:px-7 sm:py-7">
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
  /** §1/§3 (nº 783) — le départ vers Google, le retrait, et ce que
      l'un ou l'autre aurait à dire. Deux attentes séparées : les deux
      boutons ne sont jamais montrés ensemble, mais mélanger leurs
      états ferait écrire « Un instant… » au mauvais endroit le jour où
      ils le seraient. */
  const [googleEnCours, setGoogleEnCours] = useState(false);
  const [delierEnCours, setDelierEnCours] = useState(false);
  const [erreurGoogle, setErreurGoogle] = useState<string | null>(null);
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [mdpEnCours, setMdpEnCours] = useState(false);
  /** « MOT DE PASSE OUBLIÉ » — proposé APRÈS s'être trompé d'ancien mot
      de passe, jamais avant. Tant qu'on n'a pas buté, c'est du bruit ;
      une fois qu'on a buté, c'est la seule porte qui reste. */
  const [lienOubli, setLienOubli] = useState(false);

  const force = evaluerMotDePasse(nouveauMdp);

  /**
   * ██ §2 (nº 783) — CE QUE CE COMPTE EMPLOIE POUR SE CONNECTER ██
   * ------------------------------------------------------------------
   * Supabase inscrit dans le compte la liste de ses moyens d'entrée
   * (`app_metadata.providers`) : `email` quand il y a un mot de passe,
   * `google` quand Google est lié — et les deux quand les deux le sont.
   * ⚠️ POURQUOI ON LA LIT PLUTÔT QUE DE LA DEVINER : un compte créé par
   * Google N'A PAS DE MOT DE PASSE. Lui demander « ton mot de passe
   * actuel » pour en changer, c'est lui demander l'impossible — le bloc
   * du dessus s'adapte donc, et propose d'en AJOUTER un (ce qui lui
   * ouvre la connexion par e-mail, sans rien lui retirer).
   */
  const fournisseurs = ((
    utilisateur?.app_metadata as { providers?: unknown } | undefined
  )?.providers ?? []) as string[];
  const googleDejaLie = fournisseurs.includes("google");
  const aUnMotDePasse = fournisseurs.includes("email");

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
    //  §2 (nº 783) — L'ANCIEN N'EST EXIGÉ QUE S'IL EXISTE. Un compte
    //  entré par Google n'en a pas : le lui demander serait lui barrer
    //  la route pour de bon.
    if (aUnMotDePasse && ancienMdp.length === 0) {
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
      //  §2 (nº 783) — SAUF QUAND IL N'Y EN A PAS : on ne peut pas
      //  vérifier ce qui n'existe pas. La session ouverte fait alors
      //  foi, comme pour tout premier mot de passe — c'est ce que fait
      //  aussi le parcours « mot de passe oublié ».
      const { error: verification } = aUnMotDePasse
        ? await supabase.auth.signInWithPassword({
            email: utilisateur?.email ?? "",
            password: ancienMdp,
          })
        : { error: null };
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
      setMessageMdp(
        aUnMotDePasse
          ? "C'est fait : ton mot de passe a été changé."
          : "C'est fait : tu peux désormais te connecter avec ton e-mail et ce mot de passe, ou avec Google."
      );
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
          taille={24}
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
          <div className="flex items-center gap-3 rounded-lg bg-sombre-eleve px-4 py-3">
            <IconeEnveloppe taille={20} classe="shrink-0 text-sombre-texte-doux" />
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

        {/* ---------- 2 · LE MOT DE PASSE ----------
             §2 (nº 783) — LE TITRE DIT CE QU'ON PEUT FAIRE : un compte
             venu de Google n'a pas de mot de passe ; on ne lui propose
             donc pas d'en « changer », mais d'en AJOUTER un. */}
        <Bloc titre={aUnMotDePasse ? "Changer de mot de passe" : "Ajouter un mot de passe"}>
          <form
            onSubmit={changerMotDePasse}
            noValidate
            className="flex flex-col gap-4"
          >
            {/*  §2 (nº 783) — PAS DE MOT DE PASSE ACTUEL À DEMANDER
                 quand le compte n'en a jamais eu (entré par Google) :
                 le champ n'est pas grisé, il n'existe pas. */}
            <div className={aUnMotDePasse ? "" : "hidden"}>
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
            {/* ██ §3 (nº 783) — L'E-MAIL DIT LA VÉRITÉ, LUI AUSSI ██
                CE QUI ÉTAIT FAUX, ET LE BANC L'A MONTRÉ : cette ligne
                était écrite « actif » EN DUR. Un compte entré par
                Google — qui n'a pas de mot de passe — lisait donc
                « E-mail et mot de passe · actif » et pouvait croire
                qu'il lui suffisait de retenir son adresse pour rentrer.
                Elle se règle désormais sur `aUnMotDePasse`, comme le
                bloc du dessus. */}
            {/* ██ §1 (nº 784) — L'ENCADRÉ NE SE TEINT PLUS ██
                CE QUI VIVAIT ICI : un fond rose dilué (`bg-primaire/10`)
                quand la méthode était active. Le rose du site désigne
                un CHOIX (badge sélectionné, bouton final, sélecteur) —
                pas un état de fait. Ces lignes prennent le fond des
                autres encadrés de la page, actives ou non ; ce qui
                change d'une ligne à l'autre se lit dans son texte et
                dans sa pastille. */}
            <li className="flex items-center gap-3 rounded-lg bg-sombre-eleve px-4 min-h-[54px]">
              {/* §1 (nº 784) — le @ remplace le bouclier : cette ligne
                  parle d'une ADRESSE, pas de la page qui la contient. */}
              <IconeArobase taille={20} classe="shrink-0 text-sombre-texte-doux" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-sombre-texte">
                  E-mail et mot de passe
                </span>
                <span className="block truncate text-[12.5px] text-sombre-texte-doux">
                  {aUnMotDePasse
                    ? utilisateur?.email ?? "—"
                    : "Pas encore de mot de passe"}
                </span>
              </span>
              {aUnMotDePasse && <span className={PASTILLE_METHODE}>actif</span>}
            </li>

            {/* ██ §3 (nº 783) — GOOGLE : LIER, DÉLIER ██
                CE QUI VIVAIT ICI : trois fournisseurs grisés, annoncés
                « bientôt ». Facebook et Apple sont retirés (décision de
                Kevin) et Google fonctionne — cette liste ne dit donc
                plus une intention, elle dit L'ÉTAT DU COMPTE, et elle
                le CHANGE.
                · Google LIÉ      → ligne active, plus « Délier » ;
                · Google PAS LIÉ  → un bouton qui le lie.
                ⚠️ « DÉLIER » NE S'AFFICHE PAS S'IL EST LE SEUL MOYEN
                D'ENTRER : sans mot de passe, s'en séparer, c'est perdre
                le compte. On dit alors quoi faire d'abord, au lieu de
                montrer un bouton qui refuserait.
                ⚠️ LE BOUTON DE LIAISON N'APPELLE PAS LA CONNEXION — il
                appelle `lierGoogle` (voir la note de ce fichier-là) :
                se connecter et lier ne sont pas le même geste, et les
                confondre ferait changer de compte. */}
            {googleDejaLie ? (
              <li
                className="flex flex-wrap items-center gap-x-3 gap-y-2
                           rounded-lg bg-sombre-eleve px-4 py-2.5 min-h-[54px]"
              >
                <span className="shrink-0">
                  <IconeGoogle taille={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-sombre-texte">
                    Google
                  </span>
                  <span className="block truncate text-[12.5px] text-sombre-texte-doux">
                    {aUnMotDePasse
                      ? utilisateur?.email ?? "—"
                      : "Ton seul moyen de te connecter"}
                  </span>
                </span>
                {aUnMotDePasse ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setErreurGoogle(null);
                      setDelierEnCours(true);
                      const souci = await delierGoogle();
                      setDelierEnCours(false);
                      if (souci) setErreurGoogle(souci);
                    }}
                    disabled={delierEnCours}
                    className={`${PASTILLE_METHODE} transition-colors hover:text-primaire disabled:opacity-50`}
                  >
                    {delierEnCours ? "Un instant…" : "Délier"}
                  </button>
                ) : (
                  <span className={PASTILLE_METHODE}>actif</span>
                )}
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  onClick={async () => {
                    setErreurGoogle(null);
                    setGoogleEnCours(true);
                    const souci = await lierGoogle();
                    if (souci) {
                      setGoogleEnCours(false);
                      setErreurGoogle(souci);
                    }
                  }}
                  disabled={googleEnCours}
                  className="flex w-full items-center gap-3 rounded-lg
                             bg-sombre-eleve px-4 min-h-[54px] text-left
                             text-[14.5px] text-sombre-texte transition-colors
                             hover:bg-sombre-eleve-clair
                             disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  <span className="shrink-0">
                    <IconeGoogle taille={20} />
                  </span>
                  {googleEnCours ? "Un instant…" : "Lier mon compte Google"}
                </button>
              </li>
            )}
            {erreurGoogle && (
              <li>
                <p className={ERREUR}>{erreurGoogle}</p>
              </li>
            )}
          </ul>
        </Bloc>

        {/* 4. LES SUPPRESSIONS — en dernier. */}
        <BlocSuppressions />
      </div>
    </main>
  );
}
