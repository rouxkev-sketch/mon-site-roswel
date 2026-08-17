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
 *  2. ELLE EFFACE LA POSITION MÉMORISÉE DE LA LISTE QUI VA S'AFFICHER.
 *     C'est l'annulation explicite : la place écrite pour cet écran-là
 *     ne décrit plus rien — la liste qu'elle décrivait n'existe plus.
 *     ⚠️ DE LA LISTE QUI ARRIVE, ET SURTOUT PAS DE CELLE QU'ON QUITTE.
 *     C'est le §2 de la nº 332… et le défaut que la nº 330 avait
 *     introduit sans le voir. MESURÉ : sur l'accueil descendu à 900 px,
 *     une recherche validée effaçait `roswel:defilement:/` — l'adresse
 *     courante AU MOMENT DU GESTE est encore celle de l'accueil, pas
 *     celle des résultats. Le retour rendait donc 0 au lieu de 900.
 *     `poserSelection` (un filtre) écrit son adresse AVANT d'appeler :
 *     l'adresse courante y est déjà la bonne, et elle ne passe rien.
 *     `chercher` (une recherche) appelle AVANT de naviguer : elle
 *     PASSE la destination, et l'accueil garde sa place.
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
/**
 * §1 (nº 334) — LA REMONTÉE NE DOIT PAS SE VOIR SUR LA PAGE QU'ON
 * QUITTE.
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE A VU, ET QUI DIT TOUT : « au moment où je
 * valide ma recherche, LA PAGE REMONTE — je vois le haut de l'accueil,
 * PUIS les résultats s'affichent ». La remontée s'appliquait à l'écran
 * qu'on quitte, sous ses yeux.
 *
 * ET CE N'EST PAS QU'UNE QUESTION DE CONFORT — c'est la cause du défaut
 * de position. Faire remonter l'accueil déclenche un événement de
 * défilement ; `MemoireNavigation` l'entend et écrit la position
 * courante — 0 — SOUS L'ADRESSE ENCORE AFFICHÉE, c'est-à-dire celle de
 * l'accueil. Le 900 px qu'on venait d'y quitter était donc écrasé par
 * un zéro, quelques millisecondes avant que le routeur ne change
 * d'adresse. La nº 333 avait empêché l'EFFACEMENT explicite ; elle
 * n'avait pas vu cette écriture-là, qui passe par la porte d'à côté.
 *
 * LA RÈGLE : on ne fait remonter que la page où l'on EST. Si la liste
 * neuve est AILLEURS, la remontée est mise EN ATTENTE et jouée à son
 * arrivée — avant la première peinture de la nouvelle liste, donc sans
 * que personne ne voie ni l'ancienne remonter, ni la nouvelle sauter.
 *
 * ⚠️ ELLE RESTE POSÉE PAR LE GESTE. C'est le clic qui l'arme ; un
 * RETOUR n'arme rien, et ne trouvera donc rien à consommer. La règle
 * que le propriétaire a posée à la nº 330 — « jamais déduite de
 * l'adresse » — tient exactement comme avant.
 */
let remonteeEnAttente = false;

export function ouvrirLaListeEnHaut(
  /** L'adresse de la liste QUI VA S'AFFICHER, quand elle n'est pas
      encore l'adresse courante (une recherche appelle avant de
      naviguer). Omise : l'adresse courante — c'est déjà la bonne pour
      un filtre, qui a écrit la sienne juste avant. */
  adresseDeLaListe?: string
): void {
  if (typeof window === "undefined") return;
  const ici = window.location.pathname + window.location.search;
  const cible = adresseDeLaListe ?? ici;
  oublierRestaurationPosition();
  oublierDefilementDe(cible);
  laPositionDuGelRepartDeZero();
  if (cible === ici) {
    //  LA LISTE NEUVE EST ICI MÊME (un filtre : l'adresse a été écrite
    //  par `replaceState`, la page ne change pas). On remonte tout de
    //  suite — c'est ce que le propriétaire a validé à la nº 330-§1.
    defilerSansGeste({ top: 0, left: 0 });
    return;
  }
  //  LA LISTE NEUVE EST AILLEURS : on n'y touche pas maintenant.
  remonteeEnAttente = true;
}

/**
 * « LA LISTE DEMANDÉE EST ARRIVÉE » — à appeler par la liste elle-même,
 * AVANT LA PEINTURE de son nouveau contenu (un effet de mise en page).
 * Elle consomme la remontée mise en attente, et rien d'autre : sans
 * geste préalable, elle ne fait rien du tout — un retour passe donc au
 * travers sans être déplacé.
 */
export function laListeServieEstArrivee(): void {
  if (typeof window === "undefined") return;
  if (!remonteeEnAttente) return;
  remonteeEnAttente = false;
  defilerSansGeste({ top: 0, left: 0 });
}
