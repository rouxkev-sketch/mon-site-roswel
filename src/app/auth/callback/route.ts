import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";

/**
 * RETOUR DE CONNEXION (Google, et les liens d'e-mail)
 * ----------------------------------------------------
 * Quand quelqu'un se connecte via un fournisseur externe,
 * celui-ci le renvoie ici avec un code temporaire. On échange
 * ce code contre une vraie session, puis on redirige vers la
 * page d'origine.
 *
 * ⚠️ CETTE LIGNE DISAIT « Google, Facebook, Apple… » (corrigé nº 783) :
 * les deux derniers n'ont jamais rien renvoyé ici — ils n'étaient que
 * des boutons annoncés — et ils sont retirés. Le seul fournisseur
 * externe du site est Google.
 * ⚠️ CE CHEMIN SERT AUSSI AUX LIENS D'E-MAIL (confirmation d'adresse,
 * mot de passe oublié, changement d'adresse), MAIS PLUS AVEC LE MÊME
 * JETON depuis la nº 827 : Google apporte un `code` à échanger, les
 * courriels un `token_hash` à vérifier. Voir le §2 plus bas — c'est
 * lui qui a corrigé le lien de réinitialisation.
 *
 * Cette adresse (/auth/callback) est à déclarer dans Supabase :
 * voir docs/CONFIGURATION-SUPABASE.md.
 */
/**
 * ██ §1 (nº 783) — L'ORIGINE OÙ L'ON RENVOIE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT, MESURÉ AU BANC : `new URL(request.url).origin` ne rend pas
 * l'adresse par laquelle le visiteur est arrivé — il rend celle que le
 * serveur croit avoir. Une demande faite sur `127.0.0.1:3000` en
 * ressort en `localhost:3000` ; en ligne, une demande faite sur
 * `yokofolio.com` peut en ressortir avec l'adresse interne du
 * déploiement.
 * CE QUE ÇA COÛTERAIT, ET CE N'EST PAS UN DÉTAIL : le cookie de session
 * vient d'être posé sur le domaine d'ARRIVÉE. Renvoyer vers un autre
 * domaine, c'est le laisser derrière — le visiteur reviendrait sur un
 * site qui ne le connaît pas, sa connexion pourtant réussie. C'est très
 * exactement le genre de panne que la nº 775 a coûté.
 * LA RÈGLE : on lit l'hôte que le proxy annonce (`x-forwarded-host`,
 * posé par Vercel), sinon celui de la demande (`host`), et l'on ne
 * retombe sur l'URL qu'en dernier recours.
 * ⚠️ AUCUNE PORTE OUVERTE : on ne compose jamais qu'un CHEMIN INTERNE
 * derrière cette origine (voir `suite`, filtrée à l'entrée du site) —
 * jamais une adresse reçue telle quelle.
 */
function origineReelle(request: Request): string {
  const entetes = request.headers;
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  if (!hote) return new URL(request.url).origin;
  const protocole =
    entetes.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") || hote.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${protocole}://${hote}`;
}

/**
 * ██ §2 (nº 827) — LES LIENS D'E-MAIL N'EMPRUNTENT PLUS SUPABASE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : « Choose a new password », cliqué sur un
 * courriel neuf, menait À L'ACCUEIL au lieu de l'écran de nouveau mot
 * de passe.
 *
 * LA CAUSE, ET ELLE EST DANS LA FORME DU LIEN. Les gabarits portaient
 * `{{ .ConfirmationURL }}`, que Supabase compose ainsi :
 *
 *     <projet>.supabase.co/auth/v1/verify
 *        ?token=…&type=recovery&redirect_to=<ce qu'on a demandé>
 *
 * Le clic part donc CHEZ SUPABASE, qui vérifie le jeton puis renvoie
 * vers `redirect_to` — MAIS SEULEMENT SI CETTE ADRESSE FIGURE DANS SA
 * LISTE BLANCHE (Authentication → URL Configuration → Redirect URLs).
 * Or le site demande `…/auth/callback?next=/become-an-artist/nouveau-
 * mot-de-passe`, AVEC UN PARAMÈTRE, et la liste ne contient que
 * `…/auth/callback`, sans. Une entrée sans joker ne couvre pas une
 * adresse à paramètres : Supabase écarte la demande EN SILENCE et
 * retombe sur la Site URL — L'ACCUEIL. Rien n'expire, rien n'échoue :
 * on est simplement renvoyé ailleurs.
 *
 * LA CORRECTION, ET POURQUOI ELLE NE DÉPEND PLUS DE PERSONNE : les
 * gabarits n'emploient plus `{{ .ConfirmationURL }}` mais
 * `{{ .TokenHash }}`, posé sur NOTRE PROPRE adresse :
 *
 *     {{ .SiteURL }}/auth/callback
 *        ?token_hash={{ .TokenHash }}&type=recovery&next=<chez nous>
 *
 * Le clic arrive donc ICI directement. On vérifie le jeton nous-mêmes
 * (`verifyOtp`), et l'on redirige vers `next`, qui est à nous. Plus de
 * détour, PLUS DE LISTE BLANCHE À TENIR À JOUR pour les courriels, et
 * plus de repli muet sur l'accueil.
 * ⚠️ UN SECOND DÉFAUT DISPARAÎT AVEC : `exchangeCodeForSession` est un
 * échange PKCE — il exige le vérificateur déposé dans le navigateur QUI
 * A FAIT LA DEMANDE. Un lien ouvert sur un autre appareil (demande au
 * bureau, clic dans l'application Gmail du téléphone) échouait donc,
 * et retombait lui aussi sur l'accueil. `verifyOtp` ne demande rien de
 * tel : le lien marche depuis n'importe où.
 * ⚠️ LE CHEMIN `code` RESTE, INTACT : c'est celui de Google, qui passe
 * bien par un échange PKCE. Les deux cohabitent.
 */

/** La page qui dit qu'un lien d'e-mail a fait son temps (nº 828). */
const PAGE_LIEN_EXPIRE = "/link-expired";

/** Les types de lien qu'un courriel de Supabase peut porter. */
const TYPES_DE_LIEN = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;
type TypeDeLien = (typeof TYPES_DE_LIEN)[number];

/**
 * LA DESTINATION, FILTRÉE. `next` arrive d'un courriel : on n'accepte
 * qu'un CHEMIN INTERNE, jamais une adresse. Même règle que `suiteSure`
 * (lib/favoris-yokofolio), réécrite ici parce que ce fichier tourne sur
 * le serveur et que l'autre est un module de navigateur.
 */
function destinationSure(brut: string | null): string {
  if (!brut || !brut.startsWith("/") || brut.startsWith("//")) {
    //  LE DÉFAUT EST L'AIGUILLAGE (passe nº 137, il remplace la règle
    //  de la nº 131) : la page /after-login demande à la base si ce
    //  compte a un portfolio, puis mène à sa fiche ou à ses favoris.
    //  L'accueil était un défaut hérité, jamais choisi.
    return ARRIVEE_APRES_CONNEXION;
  }
  return brut;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = origineReelle(request);
  const code = searchParams.get("code");
  const jeton = searchParams.get("token_hash");
  const typeBrut = searchParams.get("type");
  const type = TYPES_DE_LIEN.includes(typeBrut as TypeDeLien)
    ? (typeBrut as TypeDeLien)
    : null;
  const suite = destinationSure(searchParams.get("next"));

  /*  UNE SUPPRESSION DE COMPTE EN COURS ? Revenir, c'est l'annuler —
      quel que soit le chemin de retour (mot de passe, lien d'e-mail,
      fournisseur externe).
      §4 (nº 314) — ET PLUS AUCUN `?bienvenue=1` : le message d'accueil
      qu'il portait est supprimé, sur consigne. LA RÉACTIVATION, ELLE,
      RESTE — c'est la promesse faite au moment de la demande de
      suppression, et elle n'a jamais eu besoin d'un message. */
  async function ouvrirEtRepartir(
    supabase: Awaited<ReturnType<typeof creerClientSupabaseServeur>>
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { reactiverCompte } = await import("@/lib/suppression-compte");
      await reactiverCompte(user.id);
    }
    return NextResponse.redirect(`${origin}${suite}`);
  }

  //  1. LE LIEN D'UN COURRIEL (nº 827) : un jeton à vérifier ici même.
  if (jeton && type) {
    const supabase = await creerClientSupabaseServeur();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: jeton,
    });
    if (!error) return ouvrirEtRepartir(supabase);
    /*  ██ §3 (nº 828) — UN LIEN MORT SE DIT, IL NE SE TAIT PAS ██
        LE DÉFAUT DU PROPRIÉTAIRE : un lien expiré ou déjà cliqué
        renvoyait à l'accueil avec `?erreur=connexion` — un paramètre
        que personne ne lit, sur une page qui ne parle de rien. On
        arrivait chez soi sans savoir pourquoi, et sans rien à faire.
        Un jeton d'e-mail refusé n'a QU'UNE cause pour celui qui
        clique : le lien a fait son temps, ou il a déjà servi. On le
        dit donc, sur une page qui le dit — et qui donne le geste
        suivant (redemander un lien). */
    return NextResponse.redirect(`${origin}${PAGE_LIEN_EXPIRE}`);
  }

  //  2. LE RETOUR D'UN FOURNISSEUR EXTERNE : un code à échanger (PKCE).
  if (code) {
    const supabase = await creerClientSupabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return ouvrirEtRepartir(supabase);
  }

  /*  Rien d'exploitable. Ce repli ne sert plus qu'au chemin de
      Google (un `code` refusé) et aux adresses tapées à la main : un
      jeton d'e-mail refusé, lui, est reparti plus haut vers la page
      qui l'explique. */
  return NextResponse.redirect(`${origin}/?erreur=connexion`);
}
