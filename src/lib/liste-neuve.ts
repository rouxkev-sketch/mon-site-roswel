"use client";

import { defilerSansGeste } from "@/lib/defilement-programme";
import { laPositionDuGelRepartDeZero } from "@/lib/gel-du-corps";
import {
  oublierDefilementDe,
  oublierRestaurationPosition,
} from "@/lib/navigation-session";

/**
 * UNE LISTE NEUVE COMMENCE EN HAUT — L'ÉCRITURE UNIQUE
 * ==================================================================
 * (passe nº 330, §1 et §2)
 *
 * C'est le POINT 3 de la règle de navigation (lib/navigation-session) :
 * un écran NEUF s'ouvre en haut. Une liste qu'on vient de filtrer ou de
 * rechercher est un écran neuf — on ne l'a jamais parcourue, il n'y a
 * donc aucune place à y retrouver.
 *
 * ⚠️ POURQUOI UNE ÉCRITURE ET PAS DEUX. La nº 329-§5 avait posé un
 * simple `defilerSansGeste` dans `poserSelection`. Il suffisait au
 * menu du web ; il ne suffisait PAS au panneau du bas du smartphone,
 * ni au moteur de recherche. Trois surfaces, trois façons d'échouer —
 * et un correctif par surface aurait fini par diverger. Tout ce qui
 * ouvre une liste neuve appelle DONC cette fonction, et rien d'autre.
 *
 * ELLE FAIT QUATRE GESTES, ET C'EST L'ENSEMBLE QUI TIENT :
 *
 *  1. ELLE OUBLIE LA DEMANDE DE RESTITUTION. Une demande nommée
 *     (`demanderRestaurationPosition`) posée juste avant survivrait à
 *     la remontée et reposerait l'ancienne place au rendu suivant.
 *  2. ELLE EFFACE LA POSITION MÉMORISÉE DE CETTE ADRESSE. C'est
 *     l'annulation explicite : la place écrite pour cette page ne
 *     décrit plus rien — la liste qu'elle décrivait n'existe plus.
 *  3. ELLE DIT AU GEL DE REPARTIR DE ZÉRO. Sans cela, le panneau du
 *     bas qui se referme repose l'ancienne position par-dessus tout le
 *     reste — c'est le défaut relevé par le propriétaire à la nº 330.
 *  4. ELLE FAIT DÉFILER, sans geste. Utile hors gel (le menu du web,
 *     le moteur) ; sans effet sous le gel, où le corps est figé — et
 *     c'est le point 3 qui prend alors le relais.
 *
 * ⚠️ `defilerSansGeste`, ET JAMAIS `window.scrollTo` : la barre du site
 * surveille le défilement pour replier sa rangée de recherche, et elle
 * lirait un mouvement non annoncé comme un GESTE de l'utilisateur (la
 * leçon de la nº 154-§6A).
 *
 * ⚠️ ELLE EST APPELÉE PAR LE GESTE, JAMAIS DÉDUITE DE L'ADRESSE. C'est
 * une exigence du propriétaire, et elle protège la nº 329-§2 : un
 * RETOUR arrive lui aussi avec une requête dans l'adresse, et lui doit
 * garder sa position. Rendre `DefilementEnHaut` sensible à la requête
 * casserait le retour ; poser la remontée sur le clic, non.
 */
export function ouvrirLaListeEnHaut(): void {
  if (typeof window === "undefined") return;
  oublierRestaurationPosition();
  oublierDefilementDe(window.location.pathname + window.location.search);
  laPositionDuGelRepartDeZero();
  defilerSansGeste({ top: 0, left: 0 });
}
