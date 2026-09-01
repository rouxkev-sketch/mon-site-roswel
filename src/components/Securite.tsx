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
//  §1 (nº 785) — les deux pastilles de bout de ligne, écrites une
//  seule fois et partagées avec le bloc des suppressions.
import { EtatActif, PastilleAction } from "@/components/Pastille";
import { JaugeMotDePasse } from "@/components/JaugeMotDePasse";
//  §A (nº 788) — le standard des erreurs et l'œil, partagés avec les
//  écrans de connexion et de création (voir erreurs-formulaire).
import {
  AIR_AVANT_BOUTON,
  BoutonOeil,
  MessageErreur,
  PLACE_DE_L_OEIL,
  bordureChamp,
} from "@/components/erreurs-formulaire";
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
 *     le fond de tous les autres, actifs ou non.
 *     ⚠️ « ACTIF » N'EST PLUS UN OBJET DU TOUT (nº 786) : un point vert
 *     et un mot, sans fond ni encadré. Il avait la forme d'un bouton
 *     (nº 785), on pouvait le croire cliquable ; un état ne se touche
 *     pas. Lui et « Délier » vivent dans `components/Pastille`.
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
    ou `border-erreur`). Le focus n'est qu'un fond plus clair.

    ⚠️ §A1 (nº 788) — `border-transparent` A QUITTÉ CETTE CONSTANTE, et
    c'est le piège nº 389 pris sur le fait. Il y vivait comme classe de
    BASE ; en lui ajoutant `border-erreur` derrière, on obtenait deux
    classes de même propriété et de même poids — c'est alors l'ordre
    dans la FEUILLE qui tranche, pas celui qu'on écrit dans l'attribut.
    Le banc l'a montré net : le message d'erreur paraissait, le contour
    restait transparent.
    LA COULEUR SE POSE DONC CHAMP PAR CHAMP, par `bordureChamp(…)` —
    exactement ce que la note ci-dessus annonçait, et ce que fait
    l'écran de connexion depuis toujours. ⚠️ TOUT CHAMP QUI EMPLOIE
    CETTE CONSTANTE DOIT L'APPELER : `border` seul laisserait la couleur
    à `currentColor`, donc un liseré clair bien visible. */
const CHAMP =
  "w-full min-h-[52px] rounded-lg border bg-sombre-eleve-clair " +
  "px-4 text-base text-sombre-texte placeholder:text-sombre-texte-doux " +
  "outline-none transition-colors focus:bg-sombre-haut";

/** LE MESSAGE DE RÉUSSITE — sur fond ÉLEVÉ, pas en rose : la charte
    réserve le rose aux badges sélectionnés, au bouton final et au
    sélecteur. Une confirmation est une information, pas un accent. */
const MESSAGE =
  "rounded-lg bg-sombre-eleve px-4 py-3 text-[13.5px] leading-relaxed text-sombre-texte";

/*  §A3 (nº 788) — LE PAVÉ ROUGE A DISPARU DE CETTE PAGE. Une constante
    `ERREUR` vivait ici — un encadré à fond plein, posé au bas de chaque
    bloc. Le standard est désormais celui du formulaire de portfolio :
    contour rouge sur le champ, message rouge dessous (voir
    erreurs-formulaire). La constante est partie avec son emploi. */

/**
 * ██ §1 (nº 786) — LES DEUX LIGNES DE MÉTHODE, ET LEUR AIR ██
 * ==================================================================
 * `px-4` DES DEUX CÔTÉS — 16 px, l'AIR DE RÉFÉRENCE de la nº 786 (voir
 * la note de `Pastille`, où les trois nombres vivent). Celui qu'on lit
 * à gauche entre le bord et l'icône se retrouve à droite du bout de
 * ligne ; et comme la ligne fait 54 px et la pastille 22, il se
 * retrouve aussi au-dessus et en dessous. Un seul nombre, quatre côtés.
 * ⚠️ CE `px-4` VAUT MIEUX QUE LE `pl-4 pr-2` DE LA nº 785 : ce dernier
 * suivait une pastille de 38 px, qui imposait 8 px de reste. La
 * pastille ayant rapetissé, c'est le retrait qui grandit — les deux se
 * répondent, et l'accord ne tient que si l'on change les deux ensemble.
 * ⚠️ AUCUN RETRAIT VERTICAL, ET C'EST CE QUE LE BANC DE LA nº 785 A
 * CORRIGÉ : la ligne Google en portait un (`py-2`). Son texte à deux
 * étages fait 40,5 px, plus haut que la pastille : les 8 px s'ajoutaient
 * à cette hauteur-là au lieu de disparaître sous le `min-h`, la ligne
 * montait à 56,5 px, et l'air du haut ne valait plus celui de droite.
 * ⚠️ ET PAS DE `flex-wrap` NON PLUS : une pastille qui passe à la ligne
 * n'a plus d'air du tout en bas. Le texte se comprime (`min-w-0
 * flex-1`, `truncate`), ce qui est le bon arbitrage — un nom coupé se
 * relit ailleurs, un alignement cassé se voit tout de suite.
 * ⚠️ LES DEUX LIGNES LA PARTAGENT (piège nº 378) : e-mail et Google
 * doivent rester au pixel l'une de l'autre.
 */
const LIGNE_METHODE =
  "flex items-center gap-3 rounded-lg bg-sombre-eleve px-4 min-h-[54px]";

/**
 * ██ §1 (nº 785) — LA TAILLE DES ICÔNES DE MÉTHODE ██
 * ------------------------------------------------------------------
 * CELLES DE LA FENÊTRE « MON COMPTE », sur consigne : 26 px au doigt,
 * 22 px au web (`REGLAGES_DOIGT` / `REGLAGES_WEB`, MenuEspace). Elles
 * n'en faisaient que 20, les mêmes des deux côtés.
 * ⚠️ L'APPAREIL SE LIT SUR `data-appareil`, JAMAIS SUR UNE LARGEUR
 * (règle nº 60) : d'où les deux variantes `mobile:` / `not-mobile:`,
 * qui s'excluent et n'ont pas de classe de base (règle nº 389).
 * ⚠️ POURQUOI EN CSS ET PAS PAR L'ATTRIBUT `taille` : un attribut ne
 * connaît pas l'appareil. Les `width`/`height` d'un SVG sont des
 * attributs de présentation — la moindre règle CSS les remplace, et
 * c'est ce qu'on fait ici.
 */
const ICONE_METHODE =
  "shrink-0 mobile:w-[26px] mobile:h-[26px] not-mobile:w-[22px] not-mobile:h-[22px]";

/**
 * ██ §5 (nº 786) — LE BOUTON QUI VALIDE UN BLOC ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE A DEMANDÉ : plus compact, et À DROITE.
 *  · `self-end` — il était à gauche (`self-start`). Un bouton qui
 *    conclut un formulaire se met du côté où le regard finit sa
 *    ligne ; à gauche, il avait l'air d'ouvrir quelque chose ;
 *  · 40 px de haut au lieu de 48, 20 px de retrait au lieu de 28,
 *    14 px de texte au lieu de 15. Il occupait la largeur d'un champ
 *    pour dire un seul mot.
 * ⚠️ CE QUI NE BOUGE PAS, ET C'EST LA CONSIGNE : la règle de couleur.
 * Gris tant qu'il n'y a rien à envoyer, ROUGE dès que la saisie
 * commence — voir les deux appels, qui n'ont pas la même condition.
 * ⚠️ UNE SEULE ÉCRITURE POUR LES DEUX (piège nº 378) : e-mail et mot
 * de passe portaient la même chaîne, recopiée. Deux copies, ce sont
 * deux boutons qui finissent par ne plus se ressembler.
 */
const BOUTON_DE_BLOC =
  //  §B10 (nº 788) — L'AIR AU-DESSUS. Le propriétaire a trouvé le
  //  bouton « Changer mon adresse » collé à son champ : le `gap-4` du
  //  formulaire (16 px) ne suffisait pas à le détacher de la pile.
  //  `AIR_AVANT_BOUTON` porte l'écart à 28 px — la même mesure que les
  //  boutons de connexion et de création (§B8), écrite une seule fois.
  `${AIR_AVANT_BOUTON} self-end inline-flex items-center justify-center rounded-full ` +
  "px-5 min-h-[40px] text-[14px] font-semibold transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/** Les deux robes du bouton ci-dessus — allumée, éteinte. */
const BOUTON_ALLUME =
  "bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white";
const BOUTON_ETEINT = "bg-sombre-eleve text-sombre-texte-doux";

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
  /**
   * ██ §A (nº 788) — CHAQUE REPROCHE SOUS SON CHAMP ██
   * ------------------------------------------------------------------
   * Une seule chaîne suffisait tant que l'erreur s'affichait dans un
   * pavé au bas du bloc : peu importait à QUI elle s'adressait. Le
   * standard demandé la met sous le champ fautif — il faut donc savoir
   * lequel. D'où ce carnet, dont les clés sont les champs :
   * `ancien`, `nouveau`, `confirmation`.
   */
  const [erreursMdp, setErreursMdp] = useState<Record<string, string>>({});
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

  /**
   * §A4 (nº 788) — CORRIGER, C'EST EFFACER LE REPROCHE. Le contour
   * rouge et son message tenaient jusqu'au prochain envoi : on réparait
   * le champ sous un reproche qui ne valait plus. Voir la note jumelle
   * de `EcranAuthentification`.
   */
  function oublierMdp(champ: string) {
    setErreursMdp((avant) => {
      if (!avant[champ]) return avant;
      const apres = { ...avant };
      delete apres[champ];
      return apres;
    });
  }

  async function changerMotDePasse(evenement: React.FormEvent) {
    evenement.preventDefault();
    setMessageMdp(null);
    setErreursMdp({});
    setLienOubli(false);
    //  §2 (nº 783) — L'ANCIEN N'EST EXIGÉ QUE S'IL EXISTE. Un compte
    //  entré par Google n'en a pas : le lui demander serait lui barrer
    //  la route pour de bon.
    if (aUnMotDePasse && ancienMdp.length === 0) {
      setErreursMdp({ ancien: "Ton mot de passe actuel est nécessaire." });
      return;
    }
    if (force.niveau === 0) {
      setErreursMdp({ nouveau: `${LONGUEUR_MINIMALE} caractères au minimum.` });
      return;
    }
    if (nouveauMdp !== confirmationMdp) {
      setErreursMdp({ confirmation: "Les deux nouveaux mots de passe ne correspondent pas." });
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
        setErreursMdp({ ancien: "Ton mot de passe actuel n'est pas le bon." });
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
      setErreursMdp({ confirmation: messageErreurAuth(erreur) });
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
    setErreursMdp({});
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
      setErreursMdp({ confirmation: messageErreurAuth(erreur) });
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
          ouverte. Même gris à 80 % que les icônes du menu.

          ██ §4 (nº 786, CORRIGÉ nº 787) — IL FAIT LA HAUTEUR DE LA
          MAJUSCULE ██
          LE DÉFAUT DE DÉPART : 24 px en dur sous un titre qui, lui,
          respire (`clamp`, de 24 à 30 px selon la fenêtre). L'icône
          était donc juste sur un seul écran et trop petite partout
          ailleurs.
          COMMENT ON LA CALE SANS DEVINER :
           · `1cap` est la HAUTEUR DE MAJUSCULE de la police en cours —
             pas une approximation, la vraie mesure lue dans la fonte ;
           · `items-baseline` pose le BAS DE LA BOÎTE sur la ligne de
             base du texte, c'est-à-dire sur le pied du « S ».

          ⚠️ ET POURQUOI ELLE RESTAIT TROP PETITE MALGRÉ ÇA (nº 787) —
          C'EST LA VRAIE CAUSE, ET ELLE VAUT D'ÊTRE DITE : la nº 786
          mesurait LA BOÎTE du dessin, pas LE DESSIN. Or le bouclier ne
          remplit pas son cadre : dans un `viewBox` de 24, son tracé va
          de 1,6 à 23,3 (trait compris) et laisse du vide en haut et en
          bas. MESURÉ AU BANC : il n'occupe que 83 % de sa boîte — une
          boîte de 21,6 px ne donnait qu'un bouclier de 17,9 px là où la
          majuscule en fait 23. Il manquait 5,1 px, soit un cinquième.
          Ma mesure était juste et portait sur la mauvaise chose.
          LES DEUX NOMBRES CI-DESSOUS SORTENT DE CETTE MESURE, pas d'un
          réglage à l'œil, et ils valent pour les deux appareils :
           · 1,205 cap de boîte — c'est 1 / 0,83, ce qu'il faut pour que
             le DESSIN, lui, fasse une majuscule ;
           · 0,084 cap de descente — le vide sous le tracé (7 % de la
             boîte) que `items-baseline` laisserait autrement entre le
             pied du bouclier et la ligne de base. `translate` ne
             déplace que le rendu : rien ne bouge dans la mise en page.
          ⚠️ ON NE RETOUCHE PAS L'ICÔNE ELLE-MÊME : elle est partagée
          avec le menu « Mon espace », où ce cadrage convient.
          ⚠️ ON NE PASSE PLUS PAR `taille` : cet attribut ne connaît ni
          la police ni sa taille du moment. Les `width`/`height` d'un
          SVG cèdent devant une règle CSS — c'est ce qui rend la chose
          possible. */}
      <h1 className="flex items-baseline gap-2.5 text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte">
        <IconeBouclierTrait
          taille={24}
          classe="shrink-0 h-[1.205cap] w-[1.205cap] translate-y-[0.084cap] text-sombre-texte/80"
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
                onChange={(e) => {
                  setNouvelEmail(e.target.value);
                  //  §A4 (nº 788) — corriger, c'est effacer le reproche.
                  if (erreurEmail) setErreurEmail(null);
                }}
                aria-invalid={Boolean(erreurEmail)}
                placeholder="Nouvelle adresse"
                className={`${CHAMP} ${bordureChamp(Boolean(erreurEmail))}`}
              />
              {/*  §A1-A2 (nº 788) — le contour rouge sur le champ, le
                   message dessous. Il s'affichait dans un pavé à fond
                   rouge, sous le champ mais détaché de lui. */}
              {erreurEmail && <MessageErreur>{erreurEmail}</MessageErreur>}
            </div>
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
              className={`${BOUTON_DE_BLOC} ${
                nouvelEmail.trim().length > 0 ? BOUTON_ALLUME : BOUTON_ETEINT
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
              {/*  `relative` : il tient l'œil, posé contre le bord droit. */}
              <div className="relative">
                <input
                  id="securite-ancien"
                  type={mdpVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={ancienMdp}
                  onChange={(e) => { setAncienMdp(e.target.value); oublierMdp("ancien"); }}
                  aria-invalid={Boolean(erreursMdp.ancien)}
                  placeholder="Mot de passe actuel"
                  style={{ paddingRight: PLACE_DE_L_OEIL }}
                  className={`${CHAMP} ${bordureChamp(Boolean(erreursMdp.ancien))}`}
                />
                <BoutonOeil visible={mdpVisible} surBascule={() => setMdpVisible((v) => !v)} />
              </div>
              {erreursMdp.ancien && <MessageErreur>{erreursMdp.ancien}</MessageErreur>}
            </div>

            <div>
              <label htmlFor="securite-nouveau" className="sr-only">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="securite-nouveau"
                  type={mdpVisible ? "text" : "password"}
                  autoComplete="new-password"
                  value={nouveauMdp}
                  onChange={(e) => { setNouveauMdp(e.target.value); oublierMdp("nouveau"); }}
                  aria-invalid={Boolean(erreursMdp.nouveau)}
                  placeholder="Nouveau mot de passe"
                  style={{ paddingRight: PLACE_DE_L_OEIL }}
                  className={`${CHAMP} ${bordureChamp(Boolean(erreursMdp.nouveau))}`}
                />
                <BoutonOeil visible={mdpVisible} surBascule={() => setMdpVisible((v) => !v)} />
              </div>
              {erreursMdp.nouveau && <MessageErreur>{erreursMdp.nouveau}</MessageErreur>}
              {/* LA JAUGE — le composant de la création de compte, tel
                  quel : critères cochés en direct (nº 129). */}
              <JaugeMotDePasse motDePasse={nouveauMdp} />
            </div>

            <div>
              <label htmlFor="securite-confirmation" className="sr-only">
                Retaper le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="securite-confirmation"
                  type={mdpVisible ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmationMdp}
                  onChange={(e) => { setConfirmationMdp(e.target.value); oublierMdp("confirmation"); }}
                  aria-invalid={Boolean(erreursMdp.confirmation)}
                  placeholder="Retaper le nouveau mot de passe"
                  style={{ paddingRight: PLACE_DE_L_OEIL }}
                  className={`${CHAMP} ${bordureChamp(Boolean(erreursMdp.confirmation))}`}
                />
                <BoutonOeil visible={mdpVisible} surBascule={() => setMdpVisible((v) => !v)} />
              </div>
              {/*  §A5 (nº 788) — les échecs du serveur, qui ne visent
                   aucun champ en particulier, se posent ici : sous le
                   DERNIER champ du formulaire. */}
              {erreursMdp.confirmation && <MessageErreur>{erreursMdp.confirmation}</MessageErreur>}
            </div>

            {/*  §B9 (nº 788) — LA CASE À COCHER A DISPARU. « Afficher
                 les mots de passe » vivait ici, sous les trois champs :
                 une ligne de plus dans le formulaire pour un réglage
                 qui appartient aux champs eux-mêmes. Chacun porte
                 désormais son œil, et tous trois basculent ensemble —
                 c'est exactement ce que faisait la case. */}
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
              className={`${BOUTON_DE_BLOC} ${
                ancienMdp.length > 0 &&
                nouveauMdp.length > 0 &&
                confirmationMdp.length > 0
                  ? BOUTON_ALLUME
                  : BOUTON_ETEINT
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
            <li className={LIGNE_METHODE}>
              {/* §1 (nº 784) — le @ remplace le bouclier : cette ligne
                  parle d'une ADRESSE, pas de la page qui la contient.
                  §1 (nº 785) — et il porte le BLANC CASSÉ des icônes de
                  « Mon compte » (`text-sombre-texte/80`), plus le gris
                  doux qui le faisait passer pour éteint. */}
              <IconeArobase taille={22} classe={`${ICONE_METHODE} text-sombre-texte/80`} />
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
              {aUnMotDePasse && <EtatActif />}
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
              <li className={LIGNE_METHODE}>
                <IconeGoogle taille={22} classe={ICONE_METHODE} />
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
                  <PastilleAction
                    onClick={async () => {
                      setErreurGoogle(null);
                      setDelierEnCours(true);
                      const souci = await delierGoogle();
                      setDelierEnCours(false);
                      if (souci) setErreurGoogle(souci);
                    }}
                    disabled={delierEnCours}
                  >
                    {delierEnCours ? "Un instant…" : "Délier"}
                  </PastilleAction>
                ) : (
                  <EtatActif />
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
                  <IconeGoogle taille={22} classe={ICONE_METHODE} />
                  {googleEnCours ? "Un instant…" : "Lier mon compte Google"}
                </button>
              </li>
            )}
            {erreurGoogle && (
              <li>
                <MessageErreur>{erreurGoogle}</MessageErreur>
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
