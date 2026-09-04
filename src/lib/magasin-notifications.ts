"use client";

import { useSyncExternalStore } from "react";
//  ⚠️ LE TYPE SEUL, JAMAIS LE MODULE. `lib/notifications` importe le
//  client d'ADMINISTRATION de Supabase : sa clé de service n'a rien à
//  faire dans le programme du navigateur. Un `import type` s'efface à
//  la compilation ; un import de valeur ferait entrer la clé dans le
//  paquet servi (la faute évitée de justesse à la nº 663).
import type { Notification } from "@/lib/notifications";
//  §1 (nº 693) — le délai de garde des lectures du navigateur,
//  écrit une seule fois (voir lib/lecture-navigateur).
import { lireDuServeur } from "@/lib/lecture-navigateur";

/**
 * ██ §1 (nº 672) — LES NOUVELLES VIVENT DANS UN MAGASIN, PLUS DANS UN
 * ██ COMPOSANT ██
 * ==================================================================
 * LE DÉFAUT QU'IL FERME, ET IL A RÉSISTÉ À DEUX PASSES (nº 664, nº 668).
 * Le propriétaire le décrit ainsi : « naviguer dans la recherche fait
 * disparaître le point rose de l'avatar ». La cause, lue dans l'arbre
 * du site et non supposée :
 *  · LA BARRE FIXE EST RENDUE PAR CHAQUE PAGE, jamais par la mise en
 *    page. `EnTeteTatouage` est monté dans `IndexTatoueurs`, dans les
 *    dix pages de `app/(tatouage)/…` et dans `BarreSelection` — la
 *    mise en page du groupe, elle, n'en monte aucune ;
 *  · UNE NAVIGATION DOUCE VERS UNE AUTRE ROUTE DÉMONTE DONC LA BARRE.
 *    L'accueil (« / ») et la recherche (« /search ») sont deux
 *    segments de page distincts depuis la nº 652 : React démonte le
 *    premier arbre et en monte un second. `MenuEspace` est neuf, son
 *    état `notifications` repart vide, `nonLues` retombe à zéro ;
 *  · ET LA MARQUE « DÉJÀ SEMÉ », ELLE, SURVIVAIT. La nº 668 l'avait
 *    mise dans un ENSEMBLE DE MODULE en écrivant qu'il « naît et meurt
 *    avec le document, comme l'état qu'il protège ». La première moitié
 *    est vraie, la seconde est fausse : l'état de React meurt À CHAQUE
 *    CHANGEMENT DE ROUTE, bien avant le document. La garde disait donc
 *    « déjà lu » à un composant qui n'avait plus rien — aucune
 *    relecture, aucun compteur, plus de point.
 * LA nº 668 AVAIT POURTANT ÉNONCÉ LA BONNE RÈGLE — « une garde ne doit
 * pas survivre à ce qu'elle garde » — et l'a appliquée à la mauvaise
 * durée de vie. Ce fichier la tient pour de bon : LA GARDE N'EST PLUS
 * UNE VARIABLE À CÔTÉ DE L'ÉTAT, ELLE EST L'ÉTAT. « Ai-je déjà lu ? »
 * se répond en regardant POUR QUI la liste a été chargée (`compteLu`) —
 * les deux ne peuvent plus diverger, il n'y a plus deux choses.
 *
 * ⚠️ CE N'EST PAS UN SECOND MÉCANISME : c'est EXACTEMENT l'écriture de
 * `lib/use-utilisateur` (nº 632) — un magasin de module, un ensemble
 * d'abonnés, `useSyncExternalStore`, et un instantané stable. La
 * session du site vit ainsi depuis quarante passes et traverse les
 * navigations sans un clignotement ; les nouvelles prennent le même
 * chemin, pas un autre.
 *
 * ⚠️ IL NE LIT PAS AU MONTAGE DE N'IMPORTE QUOI : c'est toujours la
 * barre qui demande le semis (`semerLesNouvelles`), une seule fois par
 * compte et par document. Vingt navigations douces ne font toujours
 * qu'une requête — l'acquis de la nº 664 est tenu, et il l'est mieux :
 * il l'est même quand la barre est démontée puis remontée.
 *
 * ⚠️ ET IL NE TOUCHE PAS AUX FICHES. La garde de la nº 142 — ne jamais
 * lire le COMPTE au montage, parce que le client Supabase du navigateur
 * y rejoue la session hors de tout geste et fait perdre les favoris —
 * reste entière : ce magasin ne connaît qu'un `fetch` vers notre propre
 * route, où le cookie part avec la requête et où le SERVEUR l'ouvre.
 * Aucun client Supabase n'est créé ici.
 */

/** L'adresse de la route qui rend les nouvelles du compte connecté. */
const ROUTE = "/api/tatoueur/notifications";

/**
 * L'INSTANTANÉ VIDE, ÉCRIT UNE FOIS. `useSyncExternalStore` exige que
 * deux lectures sans changement rendent LE MÊME objet : un `[]` neuf à
 * chaque appel ferait une boucle de rendu infinie. C'est la même
 * précaution que l'objet `SERVEUR_MUET` de `lib/use-utilisateur`.
 */
const VIDE: Notification[] = [];

let liste: Notification[] = VIDE;
/** nº 813 — le total des non lues compté EN BASE (la route), `null`
    tant qu'aucune lecture n'a répondu : la liste seule fait alors foi. */
let nonLuesEnBase: number | null = null;
/** POUR QUI cette liste a été chargée — et c'est la garde elle-même.
    `null` : rien n'a jamais été lu dans ce document. */
let compteLu: string | null = null;
/** Une lecture est-elle en vol, et pour qui ? Deux montages rapprochés
    de la barre ne doivent pas partir deux fois. */
let lectureEnCours: string | null = null;
const abonnes = new Set<() => void>();

function prevenir() {
  abonnes.forEach((rappel) => rappel());
}

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

function instantane(): Notification[] {
  return liste;
}

/**
 * LIRE LES NOUVELLES DU COMPTE, ET RANGER CE QU'ON A LU.
 * ⚠️ ELLE REND SA RÉUSSITE : le semis en a besoin pour ne pas garder la
 * marque « déjà lu » après un réseau coupé. Sans cela, une coupure à la
 * seconde du montage éteindrait le point pour tout le reste du
 * document.
 * ⚠️ ET ELLE NE VIDE RIEN QUAND ELLE ÉCHOUE : on garde ce qu'on
 * montrait, comme la liste des fiches depuis la nº 142.
 */
export async function lireLesNouvelles(idUtilisateur: string): Promise<boolean> {
  if (!idUtilisateur) return false;
  try {
    const reponse = await lireDuServeur(ROUTE);
    if (!reponse.ok) return false;
    const donnees = (await reponse.json().catch(() => null)) as {
      notifications?: Notification[];
      nonLues?: number;
    } | null;
    liste = donnees?.notifications ?? VIDE;
    //  nº 813 — le TOTAL des non lues, compté en base par la route ;
    //  la liste n'en est qu'une fenêtre de cinquante.
    nonLuesEnBase =
      typeof donnees?.nonLues === "number" ? donnees.nonLues : null;
    compteLu = idUtilisateur;
    prevenir();
    return true;
  } catch {
    // Pas de nouvelles : la barre vit très bien sans.
    return false;
  }
}

/**
 * SEMER LES NOUVELLES — une fois par compte et par document.
 * C'est le geste que la barre fait en arrivant : la route pose la
 * bienvenue si elle manque (nº 663), donc l'appeler ici suffit à rendre
 * le compteur juste dès l'affichage, sans attendre qu'on ouvre quoi que
 * ce soit (la demande de la nº 664).
 * ⚠️ LA GARDE EST `compteLu`, ET C'EST TOUT LE FICHIER : elle ne dit pas
 * « on a déjà demandé », elle dit « la liste qu'on a EST celle de ce
 * compte ». Une liste perdue ne peut donc plus passer pour une liste
 * lue — et c'est précisément ce qui arrivait à chaque changement de
 * route (voir le § d'ouverture).
 * ⚠️ DEUX COMPTES DANS LE MÊME ONGLET : le second ne trouve pas son
 * identifiant dans `compteLu`, il sème le sien. Rien à effacer à la
 * déconnexion.
 */
export function semerLesNouvelles(idUtilisateur: string): void {
  if (!idUtilisateur) return;
  if (compteLu === idUtilisateur || lectureEnCours === idUtilisateur) return;
  lectureEnCours = idUtilisateur;
  void lireLesNouvelles(idUtilisateur).finally(() => {
    if (lectureEnCours === idUtilisateur) lectureEnCours = null;
  });
}

/**
 * MARQUER UNE NOUVELLE COMME LUE — à l'écran, sur-le-champ.
 * L'envoi au serveur reste chez la fenêtre qui l'affiche : ce magasin
 * ne dit que ce qui EST à l'écran. Sans réseau, la nouvelle repassera
 * non lue au prochain tour, comme avant.
 */
export function marquerLue(id: string): void {
  const suivante = liste.map((nouvelle) =>
    nouvelle.id === id && !nouvelle.lue_le
      ? { ...nouvelle, lue_le: new Date().toISOString() }
      : nouvelle
  );
  //  Rien n'a changé (elle était déjà lue) : on ne réveille personne.
  if (suivante.every((nouvelle, rang) => nouvelle === liste[rang])) return;
  liste = suivante;
  //  nº 813 — une de moins au total, sans repasser par le serveur.
  if (nonLuesEnBase !== null) nonLuesEnBase = Math.max(0, nonLuesEnBase - 1);
  prevenir();
}

/** TOUT MARQUER — le geste de la double coche. */
export function marquerToutLu(): void {
  if (liste.every((nouvelle) => nouvelle.lue_le)) return;
  const maintenant = new Date().toISOString();
  liste = liste.map((nouvelle) =>
    nouvelle.lue_le ? nouvelle : { ...nouvelle, lue_le: maintenant }
  );
  //  nº 813 — tout lu : plus rien à compter en base non plus.
  nonLuesEnBase = 0;
  prevenir();
}

/**
 * CE QUE LES ÉCRANS LISENT. Le troisième argument sert au rendu du
 * SERVEUR : il ne connaît aucune nouvelle, et la barre qu'il envoie ne
 * porte donc pas de point — l'hydratation le pose dès que la lecture
 * revient. C'est le seul cas où l'écran change après coup, et il est
 * inévitable : les nouvelles ne vivent pas dans le cookie.
 */
export function useNotifications(): Notification[] {
  return useSyncExternalStore(sAbonner, instantane, () => VIDE);
}

/**
 * nº 813 — LE NOMBRE DE NON LUES, celui que la cloche affiche : le
 * total compté en base par la route quand on l'a, sinon les non lues
 * de la fenêtre (la seule chose qu'on sache avant la première réponse).
 * Zéro au serveur, comme la liste vide au-dessus. Ce nombre suit les
 * gestes de lecture (`marquerLue`, `marquerToutLu`) sans attendre le
 * réseau — le point s'éteint sous le doigt, comme avant.
 */
function nonLuesInstantane(): number {
  return nonLuesEnBase ?? liste.filter((nouvelle) => !nouvelle.lue_le).length;
}
export function useNonLues(): number {
  return useSyncExternalStore(sAbonner, nonLuesInstantane, () => 0);
}
