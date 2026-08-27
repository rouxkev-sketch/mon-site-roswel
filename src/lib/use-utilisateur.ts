"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
//  §1 (nº 645) — la photo du portfolio actif, rangée dans les mêmes
//  métadonnées que le nom : une seule lecture, écrite là-bas.
import { avatarDuCompte } from "@/lib/avatar-du-compte";
import { noterAuJournal } from "@/lib/journal-de-bord";
import { utilisateurDepuisCookies } from "@/lib/session-cookie";

/**
 * QUI EST CONNECTÉ ? — sans jamais montrer l'état déconnecté d'abord
 * ===================================================================
 * L'ANCIENNE VERSION relisait la session dans un effet, APRÈS le
 * premier rendu : chaque navigation affichait donc une fraction de
 * seconde l'état déconnecté (« Montrer mon travail », icône grise)
 * avant de basculer. C'est le clignotement corrigé ici, aux DEUX
 * moments où il pouvait naître :
 *
 * 1. EN NAVIGUANT DANS LE SITE — un MAGASIN DE MODULE, partagé par
 *    toute la page. La session Supabase vit dans un cookie LISIBLE par
 *    le navigateur (c'est ainsi que @supabase/ssr la range) : on la lit
 *    de façon SYNCHRONE au premier rendu — aucun réseau, aucune
 *    attente. Le magasin survit aux navigations, et
 *    `onAuthStateChange` le tient à jour (connexion, déconnexion,
 *    expiration).
 *
 * 2. AU CHARGEMENT D'UNE PAGE (arrivée, F5) — le SERVEUR lit LE MÊME
 *    cookie (src/lib/session-cookie.ts, partagé) dans la mise en page
 *    du groupe tatouage, et passe l'utilisateur par le contexte
 *    ci-dessous : le HTML envoyé porte DÉJÀ l'état connecté. Rien à
 *    corriger à l'hydratation, donc rien qui clignote.
 */

type EtatSession = { utilisateur: User | null; pret: boolean };

let etat: EtatSession = { utilisateur: null, pret: false };
let cookieLu = false;
let ecouteLancee = false;
const abonnes = new Set<() => void>();

/**
 * CE QUE LE SERVEUR SAVAIT en rendant la page. Fourni par
 * FournisseurSession (mise en page tatouage). La valeur par défaut —
 * « on ne sait rien » — ne sert qu'aux pages rendues HORS du groupe
 * tatouage, qui n'affichent pas ce compte.
 */
const SERVEUR_MUET: EtatSession = { utilisateur: null, pret: false };
export const ContexteSessionServeur = createContext<EtatSession>(SERVEUR_MUET);

/**
 * CE QU'UN ÉCRAN PEUT LIRE d'un utilisateur, réduit à une chaîne.
 * Deux sessions qui ont la même signature n'ont RIEN de neuf à
 * raconter — même personne, même adresse, mêmes métadonnées.
 */
function signature(utilisateur: User | null): string {
  if (!utilisateur) return "";
  return JSON.stringify([
    utilisateur.id,
    utilisateur.email ?? "",
    utilisateur.user_metadata ?? null,
  ]);
}

/**
 * ⚠️ RIEN N'A CHANGÉ ? ON NE RÉVEILLE PERSONNE (passe nº 111).
 * Supabase RÉÉMET la session sans arrêt : quand il renouvelle le jeton
 * tout seul (`TOKEN_REFRESHED`), et à chaque retour sur l'onglet
 * (`SIGNED_IN`). Chaque émission apportait un OBJET NEUF — même
 * personne, mêmes données, mais une identité JavaScript différente.
 * Tout ce qui dépendait de `utilisateur` repartait donc de zéro… dont
 * la relecture de la fiche dans le formulaire, qui ÉCRASAIT le travail
 * en cours : les photos déposées disparaissaient toutes seules.
 * On compare désormais le CONTENU. Identique : on garde l'objet
 * précédent et on ne prévient personne. Différent (connexion,
 * déconnexion, changement de compte, nom modifié) : on prévient, comme
 * avant.
 */
function poser(utilisateur: User | null) {
  if (etat.pret && signature(utilisateur) === signature(etat.utilisateur)) return;
  //  §2 (nº 272) — CHAQUE BASCULE DE SESSION EST CONSIGNÉE au journal
  //  de bord : c'est l'alternance connecté / déconnecté (le cookie
  //  contre onAuthStateChange) qui nourrissait la boucle du relevé —
  //  elle doit se LIRE dans le fichier, avec ses heures.
  noterAuJournal("session", { connecte: Boolean(utilisateur) });
  etat = { utilisateur, pret: true };
  abonnes.forEach((prevenir) => prevenir());
}

/** La session, lue DANS LE COOKIE du navigateur, sans réseau. */
function lireSessionDuCookie(): User | null {
  try {
    return utilisateurDepuisCookies(
      document.cookie.split("; ").map((cookie) => {
        const separation = cookie.indexOf("=");
        return {
          name: cookie.slice(0, separation),
          value: cookie.slice(separation + 1),
        };
      })
    );
  } catch {
    return null;
  }
}

/**
 * ██ §1 (nº 674) — L'IDENTITÉ SE RELIT UNE FOIS PAR DOCUMENT ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « changer sa photo au mobile la met à
 * jour dans la barre et la fenêtre mobiles, mais PAS au web (et
 * réciproquement) ».
 * LA CAUSE, ET ELLE EST DANS LE CHEMIN QUE PREND LA PHOTO. L'avatar et
 * le nom vivent dans `user_metadata`, donc DANS LE COOKIE DE SESSION
 * (voie B, nº 644/645) — c'est ce qui les rend connus dès le premier
 * rendu, serveur compris, sans une seule requête. Or `updateUser` écrit
 * en base ET rafraîchit la session DE L'APPAREIL QUI ÉCRIT ; l'autre
 * appareil, lui, garde son cookie tel quel. Son cookie porte donc
 * l'ANCIENNE copie jusqu'au renouvellement de son jeton — une heure
 * par défaut. Les deux surfaces ne lisaient pas deux sources
 * différentes : elles lisaient LA MÊME, à deux âges différents.
 * (Je l'avais signalé en livrant la nº 672, sans le corriger. C'est
 * l'objet de ce §.)
 *
 * LE REMÈDE : UNE RELECTURE, UNE SEULE, PAR DOCUMENT. `getUser()`
 * interroge l'API d'authentification et rend l'utilisateur À JOUR — on
 * pose ce qu'elle rend dans le magasin, et toutes les surfaces suivent
 * du même coup, sur les deux appareils.
 *
 * ⚠️ POURQUOI `getUser()` ET PAS `refreshSession()` : le second fait
 * TOURNER le jeton de rafraîchissement. Deux onglets ouverts, ou une
 * application relancée, se le disputeraient — c'est la façon la plus
 * sûre de déconnecter quelqu'un sans raison. `getUser()` ne fait que
 * LIRE : vérifié dans le moteur (@supabase/auth-js), il n'écrit pas le
 * stockage et ne notifie AUCUN abonné. Aucun effet de bord.
 * ⚠️ CE QUI EN DÉCOULE, ET JE LE DIS PLUTÔT QUE DE LE TAIRE : le cookie
 * n'est pas réécrit. Au chargement SUIVANT, le HTML servi porte donc
 * encore l'ancienne photo, et celle-ci se corrige dès que cette lecture
 * revient (une fraction de seconde). C'est exactement ce que le
 * propriétaire demande — « au moins au prochain chargement de page » —
 * et le seul moyen de faire mieux serait que le SERVEUR interroge
 * l'API à chaque page : c'est un rendu dynamique pour tout le groupe,
 * ce que la nº 356 a corrigé au prix de trois jours d'épreuves. On n'y
 * touche pas.
 * ⚠️ LA GARDE DE LA nº 142 N'EST PAS ENTAMÉE : elle interdit une
 * lecture de la BASE (PostgREST) à chaque page, parce qu'elle faisait
 * rejouer la session et perdre les favoris. Celle-ci ne parle qu'à
 * l'API d'authentification, ne crée aucun client de base, et n'émet
 * rien.
 * ⚠️ ET RIEN NE BOUGE QUAND RIEN N'A CHANGÉ : `poser` compare les
 * signatures (la garde nº 111). Une identité inchangée ne réveille
 * personne — pas un rendu de plus.
 */
async function relireLIdentite(supabase: ReturnType<typeof creerClientSupabaseNavigateur>) {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return;
    poser(data.user);
  } catch {
    //  Réseau muet : on garde ce que le cookie disait. L'identité n'est
    //  pas un geste — elle ne réclame rien à personne.
  }
}

/** L'écoute Supabase — démarrée UNE fois, au premier abonnement. */
function demarrerEcoute() {
  if (ecouteLancee || typeof window === "undefined") return;
  ecouteLancee = true;
  try {
    const supabase = creerClientSupabaseNavigateur();
    supabase.auth.onAuthStateChange((_evenement, session) => {
      poser(session?.user ?? null);
    });
    //  §1 (nº 674) — la relecture, ici et nulle part ailleurs : ce
    //  bloc ne tourne QU'UNE FOIS par document (`ecouteLancee`), et
    //  seulement si quelqu'un lit la session. Une page que personne ne
    //  regarde connecté n'envoie rien.
    if (lireSessionDuCookie()) void relireLIdentite(supabase);
  } catch {
    // Réglages Supabase absents : le site fonctionne sans compte.
    poser(null);
  }
}

function sAbonner(prevenir: () => void) {
  abonnes.add(prevenir);
  demarrerEcoute();
  return () => {
    abonnes.delete(prevenir);
  };
}

function instantane(): EtatSession {
  // Première lecture côté navigateur : le cookie, tout de suite.
  // (Calcul mémorisé — les lectures suivantes rendent le même objet,
  // c'est ce que useSyncExternalStore attend d'un instantané.)
  if (!cookieLu && typeof document !== "undefined") {
    cookieLu = true;
    etat = { utilisateur: lireSessionDuCookie(), pret: true };
  }
  return etat;
}

export function useUtilisateur() {
  // Pendant le rendu SERVEUR et l'hydratation : la valeur que le
  // serveur a lue dans le cookie de la requête. Ensuite : le magasin.
  // Les deux lisent le même cookie, l'écran ne change donc pas.
  const depuisServeur = useContext(ContexteSessionServeur);
  const { utilisateur, pret } = useSyncExternalStore(
    sAbonner,
    instantane,
    () => depuisServeur
  );

  /** Le nom à afficher : celui donné à l'inscription, sinon le début
      de l'adresse e-mail — jamais une chaîne vide pour un connecté. */
  const nom =
    (utilisateur?.user_metadata?.nom as string | undefined)?.trim() ||
    utilisateur?.email?.split("@")[0] ||
    "";

  /**
   * §1 (nº 645) — LA PHOTO DU PORTFOLIO ACTIF, LUE COMME LE NOM.
   * Elle vit dans les MÊMES métadonnées, donc dans le même cookie :
   * elle arrive avec le premier rendu, serveur compris, et ne coûte
   * aucune requête. La règle qui la range est chez `avatar-du-compte`.
   * ⚠️ ELLE ENTRE DANS LA SIGNATURE, et c'est ce qu'on veut : la
   * signature (plus haut) compare `user_metadata` en entier — changer
   * de portfolio prévient donc les abonnés, exactement comme un
   * changement de nom.
   */
  const photo = avatarDuCompte(utilisateur);

  return { utilisateur, nom, photo, pret };
}
