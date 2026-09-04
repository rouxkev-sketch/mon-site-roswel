"use client";

import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";
import { redirectionDeGarde } from "@/lib/journal-de-bord";
import { IconeEnveloppe, IconeGoogle } from "@/components/Icones";
//  §1 (nº 783) — le flux Google, écrit une seule fois pour toutes les
//  surfaces (voir lib/connexion-google).
import { connexionAvecGoogle } from "@/lib/connexion-google";
import { JaugeMotDePasse } from "@/components/JaugeMotDePasse";
//  nº 818 — la pastille de l'écran de confirmation (celle de Contact).
import { PastilleEvenement } from "@/components/PastilleEvenement";
//  §A (nº 788) — le standard des erreurs et l'œil, écrits une seule
//  fois et partagés par les trois pages (voir erreurs-formulaire).
import {
  AIR_AVANT_BOUTON,
  BoutonOeil,
  MessageErreur,
  PLACE_DE_L_OEIL,
  bordureChamp,
} from "@/components/erreurs-formulaire";
import { OngletsLigne } from "@/components/OngletsLigne";
import { lireDejaConnecte, souscrireStockage } from "@/lib/deja-connecte";
//  nº 811/814 — l'adresse des conditions d'utilisation, écrite une fois.
import { CHEMIN_TERMS } from "@/lib/chemins-editoriaux";
//  nº 817 — le drapeau de bienvenue, posé à la naissance du compte.
import { BIENVENUE_A_MONTRER, CLE_BIENVENUE } from "@/lib/bienvenue";
import { ContexteDejaConnecteServeur } from "@/components/FournisseurSession";
import { suiteSure } from "@/lib/favoris-yokofolio";
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
 *  · le bouton Google prend le fond élevé de la page Sécurité, sans
 *    un trait — et depuis la nº 783 il s'éclaircit au survol, comme
 *    tout ce qui se touche ;
 *  · l'action finale reste LA capsule pleine rose pleine largeur.
 * RIEN NE CHANGE DANS CE QUE LES GESTES DÉCLENCHENT.
 *
 * L'ORDRE DES MOYENS : GOOGLE D'ABORD — c'est le premier réflexe
 * aujourd'hui — puis « ou », puis l'e-mail. Le même ordre dans les
 * deux modes.
 *
 * L'E-MAIL SUFFIT À CRÉER LE COMPTE : pas de champ nom ici — le nom
 * viendra avec la fiche. Le mot de passe se saisit DEUX fois, avec
 * une jauge de force (8 caractères au minimum, bloquant) et la liste
 * des exigences cochées en direct.
 *
 * CE QUI FONCTIONNE, ET C'EST TOUT CE QU'IL Y A (nº 783) : l'e-mail
 * + mot de passe, et GOOGLE. Les deux mènent au même endroit et
 * donnent le même compte ; rien n'attend plus, rien n'est promis.
 * FACEBOOK ET APPLE ONT ÉTÉ RETIRÉS — boutons, icônes et code —
 * sur décision du propriétaire : un « bientôt » qui dure n'est pas
 * une annonce, c'est un décor.
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
    return "Incorrect email or password.";
  if (brut.includes("email not confirmed"))
    return "Your email isn't confirmed yet: open the email we sent you.";
  if (brut.includes("already registered"))
    return "An account already exists with this email. Log in.";
  if (brut.includes("password should be"))
    return `Your password must be at least ${LONGUEUR_MINIMALE} characters.`;
  if (brut.includes("rate limit") || brut.includes("too many"))
    return "Too many attempts in a row. Wait a few minutes, then try again.";
  if (brut.includes("fetch") || brut.includes("network"))
    return "Can't reach the server. Check your connection, then try again.";
  return "Something went wrong. Try again.";
}

/*  LE CHAMP — la copie exacte de celui du formulaire et de Sécurité :
    bordure dans la boîte (transparente au repos, rouge en erreur —
    posée champ par champ, jamais laissée à `currentColor`), et un
    focus qui n'est qu'un FOND PLUS CLAIR. Le halo rose de l'ancienne
    robe (`focus:ring-primaire/25`) a disparu : la charte réserve le
    rose au sélecteur et à l'action finale. */
const CHAMP =
  "w-full min-h-[52px] rounded-lg border bg-sombre-eleve-clair px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:bg-sombre-haut";

/**
 * ██ LE MESSAGE DU BLOC « mot de passe oublié » (nº 828, revu nº 829) ██
 * Il vit ICI, hors du composant, parce qu'un banc doit pouvoir le lire
 * au mot près et qu'il ne dépend que de l'adresse.
 * ⚠️ IL N'Y EN A QU'UN, et c'est la décision de la nº 829. La nº 828
 * en avait deux — « en route », puis « déjà envoyé » au second clic.
 * Le propriétaire les ramène à un seul : recliquer ne change rien à ce
 * qu'il y a à savoir, et deux textes pour un même état font croire
 * qu'il s'est passé quelque chose. Le texte dit désormais lui-même que
 * l'e-mail peut tarder — c'est ce que le second disait, et c'est la
 * seule chose qu'il ajoutait.
 */
const MESSAGE_EN_ROUTE = (adresse: string) =>
  `An email is on its way to ${adresse}. Open it and follow the link — it can take a few minutes. Check your spam folder too.`;

/**
 * EST-CE LA LIMITE ANTI-ABUS ? Supabase la dit de plusieurs façons
 * selon la version (« rate limit », « too many requests », le code
 * `over_email_send_rate_limit`, ou un 429). On les reconnaît toutes :
 * ce n'est pas une faute de l'utilisateur, et ça ne doit jamais
 * s'afficher comme telle — le bloc reste tel quel.
 */
function estUneLimite(erreur: unknown): boolean {
  const brut = erreur instanceof Error ? erreur.message.toLowerCase() : "";
  const statut =
    typeof erreur === "object" && erreur !== null && "status" in erreur
      ? (erreur as { status?: number }).status
      : undefined;
  return (
    statut === 429 ||
    brut.includes("rate limit") ||
    brut.includes("too many requests") ||
    brut.includes("for security purposes") ||
    brut.includes("only request this after")
  );
}

/** LE MESSAGE (réussite / information) — fond élevé, comme Sécurité. */
const MESSAGE =
  "rounded-lg bg-sombre-eleve px-4 py-3 text-[13.5px] leading-relaxed text-sombre-texte";

/*  §A3 (nº 788) — LE PAVÉ ROUGE A DISPARU DE CET ÉCRAN. Une constante
    `ERREUR` vivait ici : `border-erreur/50 bg-erreur/10`, un encadré à
    fond plein posé EN BAS du formulaire. Il disait « 8 caractères
    minimum » avec l'objet le plus voyant de la page, et loin du champ
    qu'il accusait. Le standard est désormais celui du formulaire de
    portfolio : contour rouge sur le champ, message rouge dessous
    (voir erreurs-formulaire). La constante est partie avec son emploi. */

export function EcranAuthentification({
  rattachement,
  suite,
  modeDemande,
}: {
  /**
   * ██ §5 (nº 397) — L'ONGLET DEMANDÉ PAR CELUI QUI ENVOIE ICI ██
   * ------------------------------------------------------------------
   * « creer » ou « connexion ». Décodé par le SERVEUR depuis `?mode=`
   * (voir devenir-tatoueur/page.tsx) et passé ici : le bon onglet est
   * donc dans le HTML dès la première image.
   * ⚠️ IL L'EMPORTE SUR TOUT LE RESTE — voir la dérivation du mode plus
   * bas. Absent : rien ne change, l'écran retrouve son comportement
   * d'avant cette passe.
   */
  modeDemande?: Mode;
  /** LE CHEMIN DU RETOUR (passe nº 137) — d'où l'on vient quand un
      cœur ou un « Suivre » a mené ici sans compte. Une fois connecté,
      on y retourne : la page qu'on regardait n'est pas perdue.
      Il est PASSÉ AU CRIBLE (`suiteSure`) : seul un chemin interne est
      accepté — un lien fabriqué ne peut pas expédier quelqu'un hors du
      site après sa connexion. */
  suite?: string;
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
    ? `/join/${rattachement.jeton}`
    : (suiteSure(suite) ?? ARRIVEE_APRES_CONNEXION);
  const { utilisateur, pret } = useUtilisateur();

  /** LE MODE PAR DÉFAUT SUIT LE VISITEUR : un navigateur qui a déjà
      connu un compte (drapeau local, le même que le bouton « Se
      connecter » de la barre) s'ouvre sur « Me connecter » — on ne
      propose pas de créer un compte à qui en a déjà un. Le mode ne
      devient un ÉTAT que lorsqu'on clique un onglet : avant ça, il
      DÉRIVE du drapeau (aucun écart entre serveur et navigateur). */
  //  ⚠️ LE DRAPEAU EST UN COOKIE DEPUIS LA Nº 203-§1a : le serveur le
  //  lit et le passe par contexte — l'onglet par défaut est le bon dès
  //  le HTML, sans bascule visible après l'hydratation.
  const dejaConnecteServi = useContext(ContexteDejaConnecteServeur);
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    () => dejaConnecteServi
  );
  const [modeChoisi, setModeChoisi] = useState<Mode | null>(null);
  //  ⚠️ EN RATTACHEMENT, LE DÉFAUT EST TOUJOURS « CRÉER » — même pour
  //  un navigateur qui a déjà connu un compte. Le drapeau « déjà
  //  connecté » sert à deviner ce que veut un visiteur ordinaire ; ici
  //  on le sait, il vient de cliquer sur un lien qui le lui propose.
  /**
   * ██ §5 (nº 397) — L'ORDRE DE PRIORITÉ, ET IL EST EXPLICITE ██
   * ------------------------------------------------------------------
   *  1. `modeChoisi` — L'ONGLET QU'ON VIENT DE TOUCHER ICI. Il gagne
   *     toujours : une fois sur la page, on change d'avis librement.
   *  2. `modeDemande` — L'ONGLET DEMANDÉ PAR L'ADRESSE (`?mode=`). Le
   *     bouton cliqué dans la fenêtre d'invitation le dit, et RIEN ne
   *     peut le contredire : ni une session existante, ni un compte
   *     déjà créé sur cet appareil, ni le drapeau `dejaConnecte`, ni le
   *     rattachement. Sur un ordinateur PARTAGÉ, présumer qui est
   *     devant l'écran est une faute — c'est la règle posée par le
   *     propriétaire à la nº 397.
   *  3. LE DÉFAUT D'AVANT, inchangé pour qui arrive sans rien demander :
   *     « créer » en rattachement, sinon le drapeau du navigateur.
   * ⚠️ LE DRAPEAU N'EST PAS SUPPRIMÉ : il reste ce qu'il était pour
   * quelqu'un qui vient directement sur la page de compte, par le menu
   * ou par un lien nu. Il n'est plus qu'écarté quand un bouton a dit
   * explicitement où il voulait aller.
   */
  const mode: Mode =
    modeChoisi ??
    modeDemande ??
    (enRattachement ? "creer" : dejaConnecte ? "connexion" : "creer");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  /** Erreurs par champ (validation) + erreur générale (serveur). */
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);
  /** nº 818 — L'ADRESSE INSCRITE, quand le compte vient d'être créé et
      attend sa confirmation : l'écran de confirmation remplace alors
      le formulaire entier (voir plus bas). `null` tant qu'on n'y est
      pas. */
  const [inscrit, setInscrit] = useState<string | null>(null);
  /** « Mot de passe oublié ? » — proposé APRÈS un échec de connexion,
      pas avant : tant qu'on n'a pas buté, le lien n'est que du bruit. */
  const [lienMotDePasseOublie, setLienMotDePasseOublie] = useState(false);
  /*  §1 (nº 828) — L'ADRESSE À QUI L'E-MAIL EST DÉJÀ PARTI. C'est ce
      qui distingue le premier clic du second, et c'est tout ce qu'il
      faut retenir : le bloc porte l'un ou l'autre texte selon elle. */
  const [adresseDejaServie, setAdresseDejaServie] = useState<string | null>(null);
  /** §1 (nº 783) — le temps que le navigateur parte chez Google. */
  const [googleEnCours, setGoogleEnCours] = useState(false);

  const creer = mode === "creer";
  const force = evaluerMotDePasse(motDePasse);

  function basculer(suivant: Mode) {
    setModeChoisi(suivant);
    //  ⚠️ LES DEUX FORMULAIRES SONT ÉTANCHES (nº 203-§4) : basculer de
    //  « Me connecter » à « Créer mon compte » — ou l'inverse — ne
    //  transporte AUCUNE saisie. Un mot de passe tapé pour se
    //  connecter n'a rien à faire prérempli dans une création de
    //  compte : chaque bascule repart de champs vides.
    setEmail("");
    setMotDePasse("");
    setConfirmation("");
    setMotDePasseVisible(false);
    setErreurs({});
    setInfo(null);
    setLienMotDePasseOublie(false);
  }

  /**
   * ██ §A4 (nº 788) — CORRIGER, C'EST EFFACER LE REPROCHE ██
   * ------------------------------------------------------------------
   * L'erreur restait affichée tant qu'on n'avait pas renvoyé le
   * formulaire : on réparait le champ, le contour rouge et le message
   * tenaient bon. Une erreur qui survit à sa réparation apprend à ne
   * plus lire les erreurs.
   * ⚠️ ELLE EMPORTE AUSSI L'ERREUR GÉNÉRALE (`general`) : « identifiants
   * incorrects » ne veut plus rien dire dès qu'on retouche l'un des
   * deux. Et le lien « Mot de passe oublié ? » reste, lui — il est
   * visible depuis la nº 788-§B7, il n'a plus rien à voir avec l'échec.
   */
  function oublier(champ: string) {
    setErreurs((avant) => {
      if (!avant[champ] && !avant.general) return avant;
      const apres = { ...avant };
      delete apres[champ];
      delete apres.general;
      return apres;
    });
  }

  /** La validation AVANT l'envoi : chaque reproche sous son champ. */
  function valider(): boolean {
    const trouvees: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      trouvees.email = "This email address doesn't look complete.";
    }
    if (creer) {
      if (motDePasse.length < LONGUEUR_MINIMALE) {
        trouvees.motDePasse = `At least ${LONGUEUR_MINIMALE} characters.`;
      }
      if (!trouvees.motDePasse && confirmation !== motDePasse) {
        trouvees.confirmation = "The two passwords don't match.";
      }
    } else if (motDePasse.length === 0) {
      trouvees.motDePasse = "Your password is required.";
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
            /*  nº 817 — LE COMPTE NAÎT AVEC SON DRAPEAU DE BIENVENUE :
                l'encart « Welcome » de « Ma sélection » se montrera à
                son premier passage, une fois — qu'il confirme son
                adresse tout de suite ou un mois plus tard (voir
                lib/bienvenue). Un compte d'avant cette passe n'a pas
                le drapeau : il ne le verra jamais. */
            data: { [CLE_BIENVENUE]: BIENVENUE_A_MONTRER },
          },
        });
        if (error) throw error;
        // Adresse déjà prise : Supabase répond « utilisateur créé »
        // sans identité, pour ne pas révéler qui est inscrit. On le
        // dit quand même à la personne — c'est SON adresse.
        if (data.user && (data.user.identities?.length ?? 1) === 0) {
          setErreurs({
            general: "An account already exists with this email. Log in.",
          });
          return;
        }
        if (!data.session) {
          /*  nº 818 — PLUS UN ENCADRÉ SOUS LE FORMULAIRE : l'adresse
              inscrite fait basculer tout l'écran sur la confirmation
              (« Check your inbox »), comme le succès de Contact. */
          setInscrit(email.trim());
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
        /*  UNE SUPPRESSION EN COURS ? La reconnexion l'ANNULE, tout de
            suite et sans rien demander — c'est la promesse faite au
            moment de la demande.
            §4 (nº 314) — ET ON N'EN DIT PLUS RIEN : le message
            d'accueil qui suivait (`?bienvenue=1`) est supprimé, code
            compris, sur consigne. La réponse de la route n'a donc plus
            de lecteur, et l'appel garde son seul rôle utile : réactiver.
            ⚠️ CE QU'ON NE TOUCHE PAS : la réactivation elle-même, ni
            son caractère automatique. */
        try {
          await fetch("/api/tatoueur/reactiver", { method: "POST" });
        } catch {
          // Route injoignable : la connexion, elle, a réussi — on
          // n'en fait pas un échec.
        }
        //  Connecté → l'arrivée : « Ma sélection » pour tout le monde
        //  (nº 313-§2), ou le chemin d'un retour d'action quand il y en
        //  a un. EN RATTACHEMENT, on retourne au jeton : la page du
        //  jeton a son propre accueil, et c'est elle qui rattache.
        router.push(arrivee);
      }
    } catch (erreur) {
      setErreurs({ general: messageErreur(erreur) });
      // Un échec de CONNEXION fait apparaître la porte de secours.
      if (!creer) setLienMotDePasseOublie(true);
    } finally {
      setEnCours(false);
    }
  }

  /**
   * ██ §1 (nº 828) — « Forgot your password? » : UN SEUL BLOC ██
   * ------------------------------------------------------------------
   * LE DÉFAUT DU PROPRIÉTAIRE : au deuxième clic, l'écran répondait par
   * un MESSAGE D'ERREUR SOUS LE CHAMP — Supabase refuse un second envoi
   * trop rapproché (sa limite anti-abus), et ce refus remontait tel
   * quel. Deux blocs se disputaient donc la même place : la
   * confirmation au-dessus, l'erreur en dessous, pour un geste que
   * l'utilisateur venait de faire exprès.
   *
   * LA RÈGLE, RESSERRÉE À LA nº 829 : IL N'Y A QU'UN BLOC, ET QU'UN
   * TEXTE. Le premier clic envoie l'e-mail ; les suivants n'envoient
   * RIEN et laissent le bloc tel quel. Recliquer n'est pas une erreur,
   * c'est de l'impatience — et l'impatience se répond une fois, pas
   * deux : un second texte ferait croire qu'il s'est passé quelque
   * chose de nouveau, alors que non.
   * ⚠️ LE MESSAGE PARAÎT AVANT MÊME L'ENVOI, et c'est voulu : le
   * réseau peut prendre une seconde, et un bouton qui ne répond pas
   * se reclique. Si l'envoi échoue vraiment (pas la limite), le bloc
   * s'efface et l'erreur prend sa place.
   *
   * L'adresse dans le champ reste exigée avant tout : sans elle il n'y
   * a personne à qui écrire, et ÇA, c'est bien une erreur de saisie.
   */
  async function demanderReinitialisation() {
    const adresse = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresse)) {
      setErreurs({ email: "Enter your email address above first." });
      return;
    }
    setErreurs({});
    setLienMotDePasseOublie(false);
    setInfo(MESSAGE_EN_ROUTE(adresse));
    //  ⚠️ LES CLICS SUIVANTS N'ENVOIENT RIEN (nº 829). L'e-mail est
    //  déjà parti à cette adresse : un second envoi serait refusé par
    //  la limite anti-abus de Supabase, et surtout il n'apporterait
    //  rien. Le bloc, lui, reste tel quel — c'est déjà le bon texte.
    //  Changer d'adresse redemande, évidemment.
    if (adresseDejaServie === adresse) return;
    setEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.auth.resetPasswordForEmail(adresse, {
        redirectTo: `${window.location.origin}/auth/callback?next=/become-an-artist/new-password`,
      });
      if (error) throw error;
      setAdresseDejaServie(adresse);
    } catch (erreur) {
      //  Une limite n'est pas une faute de l'utilisateur : le bloc
      //  garde son texte, et l'adresse est notée comme servie — un
      //  e-mail est bien parti, d'ici ou d'un autre onglet.
      if (estUneLimite(erreur)) {
        setAdresseDejaServie(adresse);
      } else {
        setInfo(null);
        setErreurs({ general: messageErreur(erreur) });
      }
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
  /*  §2 (nº 272) — LA GARDE PASSE PAR LE COUPE-CIRCUIT DU JOURNAL.
      C'est l'AUTRE MOITIÉ du miroir de FormulaireFiche : lui renvoie
      « pas de session » ici, cette page renvoie « session présente »
      là-bas. Une session à moitié morte fait alterner les deux
      verdicts (cookie contre onAuthStateChange — voir
      journal-de-bord) : sans coupe-circuit, le ping-pong clignotait
      jusqu'à l'écran noir, et chaque tour martyrisait le jeton de
      rafraîchissement jusqu'à la déconnexion définitive.
      COUPÉE, la garde S'ARRÊTE ICI : l'écran de connexion s'affiche —
      exactement l'endroit où reprendre pied quand la session est
      morte — au lieu du <main> vide qui attendait une redirection
      devenue interdite. */
  const [gardeCoupee, setGardeCoupee] = useState(false);
  useEffect(() => {
    if (!enRattachement && pret && utilisateur) {
      //  DÉJÀ CONNECTÉ, avec un chemin de retour : on y va. C'est le
      //  cas de qui revient sur cette page par le bouton « précédent »
      //  après s'être connecté ailleurs.
      if (redirectionDeGarde("connexion", arrivee)) {
        router.replace(arrivee);
        return;
      }
      //  COUPÉE : l'écran de connexion se montre AU TOUR SUIVANT,
      //  jamais dans le rendu en cours — pas de cascade de rendus.
      const arret = window.setTimeout(() => setGardeCoupee(true), 0);
      return () => window.clearTimeout(arret);
    }
  }, [enRattachement, pret, utilisateur, router, arrivee]);

  if (!enRattachement && pret && utilisateur && !gardeCoupee) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  /* ---------- DÉCONNECTÉ : les deux modes ---------- */
  /*  ██ nº 818 — LE COMPTE CRÉÉ, L'ÉCRAN DE CONFIRMATION REMPLACE LE
      FORMULAIRE ENTIER ██
      LE DÉFAUT DU PROPRIÉTAIRE : « Your account is created… »
      s'affichait dans un encadré SOUS le formulaire, champs et boutons
      toujours là — comme si rien ne s'était passé. Le standard, et
      celui de l'écran de succès de Contact (FormulaireContactYokofolio,
      nº 664/802) : la pastille, un titre, l'adresse en gras, un texte
      court — et plus rien d'autre : ni titre de page, ni onglets, ni
      Google, ni conditions. Même cadre (`max-w-[440px]`), même pastille
      (`PastilleEvenement`, ton « info » : c'est une information, pas un
      accent — la règle de la nº 134), l'enveloppe de la famille
      d'icônes. Le titre est le `h1` de l'écran, puisqu'il le remplace.
      ⚠️ LE MESSAGE DU MOT DE PASSE OUBLIÉ (« An email is on its way… »)
      N'EST PAS TOUCHÉ : il s'adresse à un compte qui existe, sous le
      formulaire de connexion — ce n'est pas ce sujet. */
  if (inscrit) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-10 sm:pt-14 pb-24">
        <div data-inscrit="" className="mt-10 text-center">
          <PastilleEvenement
            ton="info"
            symbole={IconeEnveloppe}
            classe="mx-auto"
          />
          <h1 className="mt-5 text-[clamp(1.3rem,3vw,1.6rem)] font-bold text-sombre-texte">
            Check your inbox
          </h1>
          <p role="status" className="mt-3 text-sombre-texte-doux leading-relaxed">
            We sent a confirmation link to{" "}
            <strong className="text-sombre-texte">{inscrit}</strong>. Open it
            to activate your account.
          </p>
          <p className="mt-3 text-[13px] text-sombre-texte-doux">
            Nothing there? Check your spam folder.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-10 sm:pt-14 pb-24">
      <h1 className="text-[clamp(1.6rem,4.5vw,2.1rem)] font-bold leading-tight text-sombre-texte text-center">
        {enRattachement
          ? creer
            ? "Create your account"
            : "Connecte-toi"
          : creer
            ? "Create your account"
            : "Welcome back"}
      </h1>
      {/* LE SOUS-TITRE — UN SEUL ÉLÉMENT POUR LES TROIS CAS
          (passe nº 179-§2)
          ----------------------------------------------------------
          La création de compte n'en avait plus depuis la nº 137. Elle
          en reprend un : « Commence ton expérience YokoFolio. »
          ⚠️ IL EST PLACÉ EXACTEMENT COMME CELUI DE LA CONNEXION, et
          c'est garanti par construction : il n'y a plus qu'UN SEUL
          `<p>`, avec la MÊME classe pour tout le monde — même marge
          au-dessus (`mt-2`), même taille (15 px), même couleur (le
          gris doux). L'espace EN DESSOUS ne lui appartient pas : il
          vient du bloc suivant (`mt-7`), qui ne change pas non plus.
          Seul le texte diffère selon le cas. */}
      <p className="mt-2 text-center text-[15px] text-sombre-texte-doux">
        {enRattachement
          ? "Your portfolios will be linked to you right away."
          : creer
            ? "Get started on YokoFolio."
            : "Log in to get back to your account."}
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
            ariaLabel="Sign up or log in"
            options={[
              { cle: "creer", label: "Sign up" },
              { cle: "connexion", label: "Log in" },
            ]}
            cleActive={mode}
            surChoix={(cle) => basculer(cle as Mode)}
          />
        </div>
      )}

      {/* ---------- GOOGLE, D'ABORD — ET IL FAIT, IL N'ANNONCE PLUS.
          ██ §1 (nº 783) — LE BOUTON EST BRANCHÉ ██
          Il portait la robe grisée et la pastille « bientôt » depuis
          la nº 134 ; l'app Google existe désormais, le fournisseur est
          activé dans le projet, et l'adresse de retour est déclarée
          des deux côtés. Le bouton prend donc la robe des vrais
          boutons du site — pleine opacité, pointeur, appuyable.
          ⚠️ FACEBOOK ET APPLE SONT PARTIS, code et icônes compris
          (décision de Kevin, nº 783) : plus aucun « bientôt » ne reste
          sur ce site. Le jour où l'un d'eux reviendrait, ce serait une
          décision neuve, pas une promesse à honorer.
          ⚠️ L'ARRIVÉE EST LA MÊME QUE POUR L'E-MAIL : `arrivee`, plus
          haut — le chemin passé au crible, ou l'aiguillage commun. Un
          compte Google ne suit aucun parcours particulier. ---------- */}
      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={async () => {
            setErreurs({});
            setGoogleEnCours(true);
            const souci = await connexionAvecGoogle(arrivee);
            //  Sans erreur, le navigateur PART : on laisse le bouton
            //  en attente, il disparaîtra avec la page. Avec erreur, on
            //  le rend et l'on dit pourquoi.
            if (souci) {
              setGoogleEnCours(false);
              setErreurs({ google: souci });
            }
          }}
          disabled={googleEnCours || enCours}
          className="flex items-center gap-3 rounded-lg bg-sombre-eleve
                     min-h-[54px] px-4 text-left text-[14.5px] text-sombre-texte
                     transition-colors hover:bg-sombre-eleve-clair
                     disabled:opacity-55 disabled:cursor-not-allowed"
        >
          <span className="shrink-0">
            <IconeGoogle taille={20} />
          </span>
          {googleEnCours ? "One moment…" : "Continue with Google"}
        </button>
        {/*  §A2 (nº 788) — SOUS SON BOUTON, PAS AILLEURS. Cette erreur
             partageait la clé `general` avec celles du formulaire ;
             depuis que `general` se pose sous le dernier champ saisi,
             elle serait apparue à l'autre bout de l'écran, sous des
             champs qu'elle ne concerne pas. */}
        {erreurs.google && <MessageErreur>{erreurs.google}</MessageErreur>}
      </div>

      {/* « ou » — LE MOT ENTRE DEUX FILETS (passe nº 142). Ils avaient
          été retirés au nom du « plus aucun contour » ; mais un
          contour ENTOURE un objet, alors qu'une ligne de division
          SÉPARE deux blocs — c'est le rôle que le mot « ou » tient
          déjà, et les filets ne font que le rendre visible. Le trait
          est celui des séparations du site (`sombre-bordure`), d'un
          seul pixel, et il ne touche jamais le mot : `gap-3` de part
          et d'autre.
          `aria-hidden` : « ou » n'apporte rien à un lecteur d'écran,
          qui annonce déjà les deux groupes l'un après l'autre. */}
      <div
        className="mt-6 flex items-center gap-3 text-[13px] text-sombre-texte-doux"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-sombre-bordure" />
        or
        <span className="h-px flex-1 bg-sombre-bordure" />
      </div>

      {/* ---------- …puis l'e-mail ----------
          LES INTITULÉS SONT DANS LES CHAMPS (charte, nº 134) : les
          étiquettes qui les surmontaient ont disparu de l'écran — le
          placeholder les porte, et le label reste pour les lecteurs
          d'écran, exactement comme sur la page Sécurité. */}
      <form onSubmit={soumettre} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="auth-email" className="sr-only">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); oublier("email"); }}
            aria-invalid={Boolean(erreurs.email)}
            placeholder="Email address"
            className={`${CHAMP} ${bordureChamp(Boolean(erreurs.email))}`}
          />
          {erreurs.email && (
            <MessageErreur>{erreurs.email}</MessageErreur>
          )}
        </div>

        <div>
          <label htmlFor="auth-mdp" className="sr-only">
            Password
          </label>
          <div className="relative">
            <input
              id="auth-mdp"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete={creer ? "new-password" : "current-password"}
              value={motDePasse}
              onChange={(e) => { setMotDePasse(e.target.value); oublier("motDePasse"); }}
              aria-invalid={Boolean(erreurs.motDePasse)}
              placeholder="Password"
              style={{ paddingRight: PLACE_DE_L_OEIL }}
              className={`${CHAMP} ${bordureChamp(Boolean(erreurs.motDePasse))}`}
            />
            {/*  §B9 (nº 788) — L'ŒIL À LA PLACE DU MOT. « Afficher »
                 puis « Masquer » vivaient là, dans le champ : deux mots
                 de longueurs différentes, qu'on pouvait lire comme une
                 partie de la saisie, et qui obligeaient à réserver
                 88 px à droite. L'icône en demande 48. */}
            <BoutonOeil
              visible={motDePasseVisible}
              surBascule={() => setMotDePasseVisible((v) => !v)}
            />
          </div>
          {erreurs.motDePasse && (
            <MessageErreur>{erreurs.motDePasse}</MessageErreur>
          )}

          {/* ██ §A5 (nº 788) — L'ERREUR GÉNÉRALE SOUS LE DERNIER CHAMP
              QU'ELLE CONCERNE ██
              « Identifiants incorrects » ne vise pas un champ mais LA
              PAIRE : elle se pose donc sous le second, celui qu'on
              vient de quitter. Elle s'affichait auparavant tout en bas
              du formulaire, dans un pavé à fond rouge — loin de ce
              qu'elle accusait, et plus voyante que le bouton d'envoi.
              ⚠️ À LA CONNEXION SEULEMENT : à la création, le dernier
              champ est la confirmation, et le message la suit
              là-bas. */}
          {!creer && erreurs.general && (
            <MessageErreur>{erreurs.general}</MessageErreur>
          )}

          {/* ██ §B7 (nº 788) — « MOT DE PASSE OUBLIÉ ? », TOUJOURS LÀ ██
              CE QUI VIVAIT ICI : il n'apparaissait qu'APRÈS un échec —
              « tant qu'on n'a pas buté, le lien n'est que du bruit ».
              Le propriétaire a tranché l'inverse, et il a raison : on
              sait qu'on a oublié son mot de passe AVANT de le taper
              faux, pas après. Le faire surgir à l'échec, c'est le
              cacher précisément à qui le cherchait.
              Connexion uniquement — on n'oublie pas un mot de passe
              qu'on est en train de choisir.
              ██ nº 816 — SA ROBE, DÉCISION DU PROPRIÉTAIRE : gris doux
              par défaut (inchangé), LE BLEU DES LIENS D'ACTION au survol
              (`sombre-lien`, celui de « Unlink » / « Link ») à la place
              du rouge, et JAMAIS souligné — ni par défaut ni au survol
              (le `underline underline-offset-4` d'avant est parti). Plus
              aucun lien rouge ni souligné sur les deux formulaires. */}
          {!creer && (
            <p className="mt-2 text-right">
              <button
                type="button"
                onClick={demanderReinitialisation}
                disabled={enCours}
                className="text-[13px] text-sombre-texte-doux hover:text-sombre-lien
                           transition-colors disabled:opacity-60"
              >
                Forgot your password?
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
              Retype your password
            </label>
            {/*  `relative` : c'est lui qui tient l'œil, posé en absolu
                 contre le bord droit du champ. */}
            <div className="relative">
            <input
              id="auth-mdp-confirmation"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => { setConfirmation(e.target.value); oublier("confirmation"); }}
              aria-invalid={Boolean(erreurs.confirmation)}
              placeholder="Retype your password"
              style={{ paddingRight: PLACE_DE_L_OEIL }}
              className={`${CHAMP} ${bordureChamp(Boolean(erreurs.confirmation))}`}
            />
            {/*  §B9 (nº 788) — le même œil que le champ du dessus, sur
                 le même état : les deux se dévoilent ensemble, comme
                 avant. */}
            <BoutonOeil
              visible={motDePasseVisible}
              surBascule={() => setMotDePasseVisible((v) => !v)}
            />
            </div>
            {erreurs.confirmation && (
              <MessageErreur>{erreurs.confirmation}</MessageErreur>
            )}
            {/*  §A5 (nº 788) — à la création, c'est ICI que le dernier
                 champ finit : l'erreur générale s'y pose. */}
            {erreurs.general && <MessageErreur>{erreurs.general}</MessageErreur>}
          </div>
        )}
        {/* L'INFORMATION SUR FOND ÉLEVÉ (nº 134) — plus d'encadré
            rose : une confirmation est une information, pas un accent
            (la règle de la page Sécurité, mot pour mot). */}
        {info && (
          <p role="status" className={MESSAGE}>
            {info}
          </p>
        )}

        {/*  §B8 (nº 788) — L'AIR AU-DESSUS DU BOUTON. Il portait `mt-1`
             (4 px) qui, ajouté au `gap-4` du formulaire, ne faisait que
             20 px : le bouton semblait faire partie de la pile de
             champs. `AIR_AVANT_BOUTON` porte le total à 28 px, soit les
             1,75 fois demandées — la mesure vit dans
             erreurs-formulaire, avec les autres. */}
        {/*  ██ nº 812 — PLEINE LARGEUR, ET UNE HAUTEUR CHARNUE ██
             La nº 811 l'avait fait compact et collé à droite (40 px,
             la mesure de « Send message ») : le propriétaire le
             reprend — « à droite » ne convient pas à un formulaire
             centré et étroit, et pleine largeur avec 40 px de haut
             faisait un bouton « anorexique » au doigt. Désormais :
             LA LARGEUR DU FORMULAIRE, comme le bouton Google au-dessus
             (`w-full`, aux deux appareils — `self-end` est parti), et
             LA HAUTEUR DES FORMULAIRES D'AUTHENTIFICATION DE 2026 :
             44 px au web, 48 px au doigt. Texte 14 px inchangé.
             ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (piège nº 389) : la
             hauteur minimale est écrite UNE fois par appareil,
             `not-mobile:` et `mobile:` étant l'exacte négation l'un
             de l'autre — aucun réglage de base qu'une variante
             viendrait contredire. Et l'appareil se lit par ces
             variantes, jamais par une largeur d'écran (piège nº 60).
             `AIR_AVANT_BOUTON` (§B8) reste : l'air au-dessus ne
             change pas. */}
        <button
          type="submit"
          disabled={enCours || (creer && force.niveau === 0 && motDePasse.length > 0)}
          className={`${AIR_AVANT_BOUTON} inline-flex w-full items-center justify-center
                     rounded-full px-5 not-mobile:min-h-[44px] mobile:min-h-[48px]
                     text-[14px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {enCours
            ? "One moment…"
            : creer
              ? "Sign up"
              : "Log in"}
        </button>
      </form>

      {/*  ██ §B6 (nº 788) — ELLE NE PARLE QU'À QUI CRÉE UN COMPTE ██
           Elle s'affichait AUSSI sous « Me connecter », où elle
           annonçait à quelqu'un qui a déjà un compte les conditions
           d'une création qu'il ne fait pas. Le propriétaire l'a vue ;
           elle reste à la création, mot pour mot.
           ██ nº 814 — LE LIEN MÈNE AUX TERMS OF USE (/terms), et les
           nomme : « site rules » menait à la page légale, qui n'était
           pas un contrat. Un compte se crée en acceptant un document
           qui a un nom — c'est ce que l'usage américain attend.
           ██ nº 816 — SA ROBE, DÉCISION DU PROPRIÉTAIRE : LE BLEU DES
           LIENS D'ACTION d'office (`sombre-lien`, #7FA9EE, celui de
           « Unlink » / « Link » et des pages légales depuis la nº 815),
           éclairci au survol (`sombre-lien-clair`), et JAMAIS souligné
           — ni par défaut ni au survol. Plus de rouge. */}
      {creer && (
      <p className="mt-8 text-center text-[13px] leading-relaxed text-sombre-texte-doux">
        By creating an account, you accept the{" "}
        <Link
          href={CHEMIN_TERMS}
          className="text-sombre-lien hover:text-sombre-lien-clair transition-colors"
        >
          Terms of Use
        </Link>
        . Your email is only used for your account — never for ads.
      </p>
      )}
    </main>
  );
}
