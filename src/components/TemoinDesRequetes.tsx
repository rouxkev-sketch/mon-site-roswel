"use client";

import { useEffect, useRef } from "react";
import { souscrireAdresse } from "@/lib/adresse-courante";
import { noterNavigation } from "@/lib/boite-noire";
import { ADRESSE_RECHERCHE } from "@/lib/chemin-recherche";

/**
 * ██ §1 (nº 670) — LE TÉMOIN DES REQUÊTES DE PAGE ██
 * ==================================================================
 * POURQUOI IL EXISTE, ET IL RÉPOND À UNE SEULE QUESTION. Le défaut des
 * styles a résisté à trois passes (nº 656, nº 665, nº 669) et la nº 669
 * n'a pas réussi à le reprendre au banc — douze rejeux du scénario
 * complet, page juste à chaque fois. Il manque donc UN FAIT au relevé,
 * et un seul : quand la page fausse s'affiche, EST-CE QUE LE SERVEUR A
 * ÉTÉ INTERROGÉ ?
 *  · UNE REQUÊTE EST PARTIE → c'est le SERVEUR qui a rendu la mauvaise
 *    page. La cause est chez nous : critères mal lus, réécriture du
 *    proxy, rendu. Aucune réserve du navigateur n'est en cause ;
 *  · AUCUNE REQUÊTE → une RÉSERVE DU NAVIGATEUR a resservi une copie.
 *    C'est la piste de la nº 669 : la réserve de segments a un plancher
 *    de trente secondes (`Math.max(s, 30)`, segment-cache/cache.js) et
 *    nos réponses n'annoncent aucune durée, ce qui la porte à cinq
 *    minutes.
 * Les deux branches n'ont RIEN à voir l'une avec l'autre. Sans ce fait,
 * toute correction serait un coup de dé.
 *
 * ⚠️ IL REGARDE AVANT L'ARRIVÉE, ET C'EST TOUT LE SOIN DE CE FICHIER.
 * La consigne disait « dans la seconde qui SUIT ». La mesure de la
 * nº 669 dit qu'il faut aussi regarder DEVANT : en observant l'écran
 * toutes les 100 ms pendant un clic, l'adresse et le contenu basculent
 * ENSEMBLE, à 1 300 ms — c'est-à-dire APRÈS que la requête soit partie
 * et revenue. Un témoin qui ne regarderait que l'après compterait
 * ZÉRO à tous les coups, y compris quand tout va bien : il dirait
 * exactement le contraire de la vérité.
 * IL TIENT DONC UN JOURNAL ROULANT des requêtes de page et, à chaque
 * arrivée, compte les DEUX côtés : celles des trois secondes qui
 * précèdent (la navigation elle-même) et celles de la seconde qui suit
 * (une reprise, par exemple le `router.refresh()` de la garde nº 631).
 *
 * CE QU'IL COMPTE, EXACTEMENT : les requêtes de PAGE, celles que le
 * routeur de Next envoie pour aller chercher le contenu d'une adresse.
 * On les reconnaît à leur paramètre `_rsc`, que le routeur ajoute
 * lui-même. Ni les images, ni les feuilles, ni les appels de l'API du
 * compte : leur nombre ne dit rien de la question posée.
 *
 * ⚠️ IL N'OBSERVE QUE « /recherche », et rien d'autre : c'est là qu'est
 * le défaut, et une ligne par navigation du site noierait la trace.
 * ⚠️ IL NE DÉPLACE RIEN, NE DÉCIDE DE RIEN, NE LIT AUCUNE MÉMOIRE.
 * C'est la règle de la nº 654 : observer ne doit jamais changer ce
 * qu'on observe. `PerformanceObserver` est une écoute PASSIVE du
 * navigateur — elle ne provoque aucune requête.
 * ⚠️ IL N'EST PAS UNE SONDE : rien à armer, aucune adresse à taper. Il
 * tourne toujours, comme la boîte noire — un défaut se constate APRÈS
 * coup, et une trace qui attend qu'on l'arme ne sert à rien.
 */

/** Ce qu'on regarde AVANT l'arrivée : la navigation elle-même, requête
    partie puis revenue. Trois secondes couvrent une liaison lente. */
const AVANT_MS = 3000;
/** Ce qu'on regarde APRÈS : une reprise, s'il y en a une. */
const APRES_MS = 1000;
/** Au-delà, on se tait : douze arrivées disent déjà tout, et la boîte
    noire ne garde que deux cents lignes (nº 660). */
const LIGNES_MAX = 12;

/** Une requête de page retenue : quand, et pour quelle adresse. */
type RequeteDePage = { heure: number; adresse: string };

export function TemoinDesRequetes() {
  /** Le minuteur qui referme la fenêtre d'après. */
  const finFenetre = useRef(0);

  useEffect(() => {
    /*  LE JOURNAL ROULANT. Il faut qu'il existe AVANT la navigation :
        c'est tout le point du fichier. On ne garde que ce qui peut
        encore servir — quelques secondes. */
    const journal: RequeteDePage[] = [];
    let lignes = 0;
    let observateur: PerformanceObserver | null = null;

    const retenir = (entrees: PerformanceEntryList) => {
      for (const entree of entrees) {
        if (!entree.name.startsWith(window.location.origin)) continue;
        let adresse: URL;
        try {
          adresse = new URL(entree.name);
        } catch {
          continue;
        }
        //  LA MARQUE D'UNE REQUÊTE DE PAGE : `_rsc`, que le routeur de
        //  Next ajoute lui-même. C'est le seul filtre qui distingue une
        //  demande de CONTENU d'une image ou d'un appel d'API.
        if (!adresse.searchParams.has("_rsc")) continue;
        adresse.searchParams.delete("_rsc");
        journal.push({
          heure: entree.startTime,
          adresse: adresse.pathname + adresse.search,
        });
      }
      //  On oublie ce qui est trop vieux pour être encore lu.
      const limite = performance.now() - (AVANT_MS + APRES_MS + 2000);
      while (journal.length > 0 && journal[0].heure < limite) journal.shift();
    };

    try {
      observateur = new PerformanceObserver((liste) => retenir(liste.getEntries()));
      //  `buffered` rejoue ce que le navigateur avait déjà en réserve :
      //  la toute première arrivée n'est donc pas aveugle.
      observateur.observe({ type: "resource", buffered: true });
    } catch {
      //  Navigateur sans `PerformanceObserver` : le témoin se tait
      //  plutôt que de mentir. Rien d'autre ne change.
    }

    /*  ⚠️ ON NE COMPTE PAS TOUT, ET C'EST LA LEÇON DU PREMIER ESSAI.
        Compté large, le témoin annonçait « 19 avant, 13 après » — les
        préparations à l'avance des fiches et de « Rejoindre » qui
        entraient à l'écran. Vrai, et parfaitement inutile : la question
        est « le serveur a-t-il été interrogé POUR CETTE PAGE ? ». On
        sépare donc les requêtes du MÊME CHEMIN de toutes les autres, et
        seules les premières font le verdict. Les autres ne sont qu'un
        nombre, pour qu'on sache que le témoin n'était pas endormi. */
    const mienne = (r: RequeteDePage, chemin: string) =>
      r.adresse.split("?")[0] === chemin;

    /** Les critères demandés, listés — au plus trois, la trace doit
        rester lisible. C'est ce qui dit si le serveur a été interrogé
        pour les BONS critères ou pour d'autres. */
    const criteres = (liste: RequeteDePage[]) =>
      liste.length === 0
        ? ""
        : ` [${liste.slice(0, 3).map((r) => r.adresse.split("?")[1] ?? "(sans critère)").join(" | ")}${
            liste.length > 3 ? " | …" : ""
          }]`;

    const auChangement = () => {
      const chemin = window.location.pathname;
      const adresse = chemin + window.location.search;
      if (!adresse.startsWith(ADRESSE_RECHERCHE)) return;
      if (lignes >= LIGNES_MAX) return;
      const arrivee = performance.now();
      window.clearTimeout(finFenetre.current);
      finFenetre.current = window.setTimeout(() => {
        /*  ⚠️ TOUT SE LIT ICI, UNE SECONDE PLUS TARD, ET LE PREMIER
            ESSAI DISAIT POURQUOI. Je lisais le journal AU MOMENT de
            l'arrivée : au web, la ligne annonçait « AUCUNE REQUÊTE »
            alors que trente et une autres étaient parties — un faux
            négatif, c'est-à-dire le pire défaut possible pour un
            témoin. LA CAUSE : `PerformanceObserver` livre ses entrées
            PAR LOTS, dans une tâche à lui. Une requête revenue à
            l'instant même de l'arrivée n'était pas encore inscrite au
            journal quand je le lisais. En lisant après la fenêtre, le
            navigateur a eu tout le temps de livrer. */
        const fenetreAvant = journal.filter(
          (r) => r.heure >= arrivee - AVANT_MS && r.heure <= arrivee
        );
        const fenetreApres = journal.filter((r) => r.heure > arrivee);
        const avant = fenetreAvant.filter((r) => mienne(r, chemin));
        const apres = fenetreApres.filter((r) => mienne(r, chemin));
        const autres =
          fenetreAvant.length + fenetreApres.length - avant.length - apres.length;
        lignes += 1;
        noterNavigation(
          `REQUÊTE DE PAGE · arrivée sur ${adresse} · ` +
            (avant.length + apres.length === 0
              ? "AUCUNE REQUÊTE POUR CETTE PAGE — elle vient d'une réserve du navigateur"
              : `POUR CETTE PAGE : ${avant.length} avant l'arrivée${
                  apres.length > 0 ? `, ${apres.length} après` : ""
                }${criteres(avant)}${apres.length > 0 ? ` puis${criteres(apres)}` : ""}`) +
            ` · ${autres} autre${autres > 1 ? "s" : ""} requête${autres > 1 ? "s" : ""}` +
            (lignes === LIGNES_MAX ? " · (dernière ligne)" : "")
        );
      }, APRES_MS);
    };

    /*  L'ARRIVÉE PAR DOCUMENT NEUF ne se compte pas de la même façon :
        la page EST la réponse du serveur, il n'y a aucune requête `_rsc`
        à trouver. On l'écrit tel quel plutôt que de laisser croire à une
        copie. */
    const auMontage = () => {
      const adresse = window.location.pathname + window.location.search;
      if (!adresse.startsWith(ADRESSE_RECHERCHE)) return;
      lignes += 1;
      noterNavigation(
        `REQUÊTE DE PAGE · arrivée sur ${adresse} · document neuf — ` +
          "servi par le serveur, aucune réserve ne peut être en cause"
      );
    };

    auMontage();
    const desabonner = souscrireAdresse(auChangement);
    const finF = finFenetre;
    return () => {
      desabonner();
      observateur?.disconnect();
      window.clearTimeout(finF.current);
    };
  }, []);

  return null;
}
