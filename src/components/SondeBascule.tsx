"use client";

import { useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";
import {
  lignesDuJournal,
  noter,
  sauvegarderMaintenant,
  sondeBasculeArmee,
  souscrireAuJournal,
} from "@/lib/journal-bascule";
import { adresseDeRechercheCourante } from "@/lib/adresse-recherche";

/**
 * LA SONDE-JOURNAL DE LA BASCULE — elle enregistre, elle ne corrige
 * rien
 * ==================================================================
 * (passe nº 173)
 *
 * Sur iPhone, au clic sur l'un des deux boutons de bascule, tout le
 * contenu disparaît une fraction de seconde puis revient —
 * systématique sur téléphone, inexistant sur web. Cette sonde donne
 * LES YEUX : un journal horodaté, sur l'appareil du propriétaire, avec
 * un bouton COPIER.
 *
 * CE QU'ELLE ENREGISTRE (les six points demandés) :
 *  1. les clics sur les deux boutons de bascule, avec la valeur qui en
 *     résulte (écrit par MoteurTatouage) ;
 *  2. chaque changement de `innerWidth` / `innerHeight` ;
 *  3. chaque `resize` et `scroll` du `visualViewport`, avec largeur,
 *     hauteur et `offsetTop` — c'est là que la barre d'adresse d'iOS
 *     se voit passer ;
 *  4. la valeur du crochet d'appareil à chaque changement, avec la
 *     largeur du moment (écrit par lib/appareil) ;
 *  5. chaque MONTAGE et chaque DÉMONTAGE de la mosaïque et de son
 *     conteneur de page, avec un COMPTEUR D'INSTANCES (écrit par
 *     GrilleTatoueurs et IndexTatoueurs) ;
 *  6. le nombre de cartes rendues, à chaque rendu de la mosaïque.
 *
 * ⚠️ AUCUN ÉTAT REACT pour le journal : il vit dans un module
 * (lib/journal-bascule) et s'écrit directement dans le nœud de la
 * sonde. Un enregistrement ne provoque aucun rendu — la sonde ne peut
 * donc pas déranger ce qu'elle observe.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier, la ligne
 * `<SondeBascule />` de src/app/(tatouage)/layout.tsx, le module
 * lib/journal-bascule.ts, et les appels à `noter…` qui le nomment.
 */

/** Ce que le viewport dit, en une ligne courte. */
function mesureFenetre(): string {
  const visuel = window.visualViewport;
  return (
    `fenêtre ${window.innerWidth}×${window.innerHeight}` +
    (visuel
      ? ` · visuel ${Math.round(visuel.width)}×${Math.round(visuel.height)} @${Math.round(visuel.offsetTop)}`
      : " · (pas de viewport visuel)")
  );
}

/** LE JOURNAL EN UN SEUL TEXTE — ce que COPIER met dans le
    presse-papiers, et ce qu'ENVOYER poste au serveur : le MÊME. */
function journalEnTexte(): string {
  return lignesDuJournal()
    .map((ligne) => `${ligne.t}\t${ligne.texte}`)
    .join("\n");
}

/* ==================================================================
 * LE RETOUR EN ARRIÈRE (nº 175-§6) — ON OBSERVE, ON NE CORRIGE RIEN
 * ==================================================================
 * LE DÉFAUT À ÉCLAIRER : on défile, on ouvre une fiche, on revient — la
 * place est bien rendue. Mais au bout de sept ou huit allers-retours, on
 * revient EN HAUT. Et en venant d'une recherche, trois ou quatre
 * suffisent pour que tout saute et que la recherche soit effacée.
 *
 * Ces fonctions ne font que LIRE ce que le site a rangé, aux endroits
 * où il le range vraiment (voir lib/navigation-session et
 * lib/mosaique-session). Aucune ne pose, ne corrige ni n'efface quoi
 * que ce soit.
 */

/** Où la position d'une adresse est rangée — lib/navigation-session. */
const PREFIXE_DEFILEMENT = "yokofolio:defilement:";
function adresseCourante(): string {
  return window.location.pathname + window.location.search;
}

/** Le type de navigation dit par le navigateur : navigate, reload,
    back_forward. C'est LUI qui décide si le site restitue ou non. */
function typeDeNavigation(): string {
  try {
    const [nav] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    return nav?.type ?? "(inconnu)";
  } catch {
    return "(illisible)";
  }
}

/** c) L'ÉTAT SAUVEGARDÉ : où il est rangé, et s'il est TROUVÉ ou
    ABSENT — les deux mémoires, nommées par leur clé exacte. */
function etatSauvegarde(): string[] {
  //  ⚠️ LA CLÉ EST L'ADRESSE CANONIQUE DE LA RECHERCHE (nº 184-§2) —
  //  celle sous laquelle le site range vraiment : critères compris,
  //  réglages de sonde exclus.
  const adresse = adresseDeRechercheCourante();
  const dit: string[] = [];

  //  1. LA POSITION DE DÉFILEMENT (localStorage, une clé par recherche).
  const cle = `${PREFIXE_DEFILEMENT}${adresse}`;
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) {
      dit.push(`ÉTAT position · ${cle} · ABSENT`);
    } else {
      const { y, date } = JSON.parse(brut) as { y?: number; date?: number };
      dit.push(
        `ÉTAT position · ${cle} · TROUVÉ y=${y ?? "?"} · ${
          date ? Math.round((Date.now() - date) / 1000) : "?"
        } s`
      );
    }
  } catch {
    dit.push(`ÉTAT position · ${cle} · ILLISIBLE`);
  }

  //  2. LA MOSAÏQUE MISE DE CÔTÉ A ÉTÉ SUPPRIMÉE (refonte nº 191) :
  //     les cartes viennent du serveur, pour l'adresse courante, et de
  //     nulle part ailleurs. Il n'y a plus de mémoire à relever.
  dit.push(
    `ÉTAT mosaïque · plus de mémoire parallèle (nº 191) · cartes rendues ${
      document.querySelectorAll("main a[href^='/tatoueur/']").length
    }`
  );
  return dit;
}

/** d) L'HISTORIQUE, et les critères de recherche — encore là, ou
    perdus ? Les critères vivent dans l'adresse : c'est elle qui les
    porte d'une page à l'autre. */
function historiqueEtCriteres(): string {
  const params = new URLSearchParams(window.location.search);
  //  Les paramètres de sonde ne sont pas des critères de recherche.
  for (const nom of [...params.keys()]) {
    if (nom.startsWith("sonde") || nom === "clair" || nom === "verre" || nom === "flou") {
      params.delete(nom);
    }
  }
  const critères = params.toString();
  return (
    `HISTORIQUE ${history.length} entrées · critères ${
      critères ? `PRÉSENTS (${critères})` : "PERDUS (aucun dans l'adresse)"
    }`
  );
}

/* ==================================================================
 * ██ TEMPORAIRE (nº 615) — MESURE DE L'APERÇU DU GLISSEMENT ██
 * ==================================================================
 * CE QU'ON CHERCHE. Au doigt : carte → fiche en vue photo → on défile
 * jusqu'à une photo → on touche la rangée du profil → on revient d'un
 * GLISSEMENT (bon) → on glisse UNE SECONDE FOIS vers la mosaïque et
 * L'APERÇU DU GESTE MONTRE ENCORE LA FICHE, sur la photo où l'on
 * s'était arrêté. La destination, elle, est juste.
 *
 * CE QUE LA LECTURE A DÉJÀ TRANCHÉ, ET QUI EXPLIQUE LA FORME DE CETTE
 * MESURE :
 *  · PENDANT le geste, AUCUN code du site ne tourne — le `popstate`
 *    n'arrive qu'à la validation, et le glissement maison refuse
 *    justement la bande de 24 px du bord (lib/glissement-lateral, §3).
 *    L'image montrée pendant le geste est donc une RÉSERVE DU
 *    NAVIGATEUR, constituée AVANT lui ;
 *  · au second glissement, la fiche n'est PAS remontée et la mémoire de
 *    la nº 604 n'est PAS relue : `lireRequeteDeLaPage` gèle la requête
 *    dès que l'adresse n'est plus `/tatoueur/<slug>`
 *    (lib/adresse-courante l.109-118), donc la clé ne bouge pas.
 *
 * RESTE LA SEULE QUESTION QU'AUCUNE LECTURE NE PEUT FERMER : À QUEL
 * INSTANT LE NAVIGATEUR PREND L'IMAGE QU'IL GARDE POUR UNE ENTRÉE
 * D'HISTORIQUE. Aucune API ne l'expose (c'est déjà écrit dans
 * SondeRetour, §1 nº 362). ON MESURE DONC CE QUI LA DÉTERMINE : ce qui
 * est PEINT à l'instant où l'adresse change, et à l'image d'après.
 * Si la ligne « avant » d'un `pushState` qui QUITTE la mosaïque dit
 * déjà « carrousel de fiche PRÉSENT », l'image rangée pour la mosaïque
 * ne peut pas être la mosaïque, et la cause est nommée.
 *
 * ⚠️ ELLE NE FAIT QUE LIRE ET RELAYER. L'enveloppe appelle TOUJOURS
 * l'implémentation d'origine (celle de Next, ou celle de
 * lib/adresse-courante si elle est déjà en place) et rend sa valeur :
 * rien n'est empêché, rien n'est remplacé. Elle n'est posée QUE si la
 * sonde est armée, et elle ne se retire pas — c'est une sonde
 * temporaire, elle part avec le fichier.
 */
function ceQuiEstPeint(): string {
  const cartes = document.querySelectorAll("[data-carte]").length;
  const affiche = document.querySelector('[data-carrousel="fiche"]');
  const cadre = affiche?.querySelector('[data-role="cadre"]') ?? null;
  const rang =
    cadre instanceof HTMLElement && cadre.clientWidth > 0
      ? Math.round(cadre.scrollLeft / cadre.clientWidth)
      : null;
  return (
    `À L'ÉCRAN cartes ${cartes} · carrousel de fiche ${
      affiche
        ? `PRÉSENT rang ${rang ?? "?"} (défilement ${
            cadre instanceof HTMLElement ? Math.round(cadre.scrollLeft) : "?"
          })`
        : "absent"
    } · masque ${
      getComputedStyle(document.documentElement).visibility === "hidden"
        ? "OUI"
        : "non"
    } · page à ${Math.round(window.scrollY)}`
  );
}

/** Les deux images qui suivent un changement d'adresse : c'est là que
    le navigateur a le temps de photographier. */
function auxImagesSuivantes(quoi: string): void {
  requestAnimationFrame(() => {
    noter(`${quoi} +1 image · ${ceQuiEstPeint()}`);
    requestAnimationFrame(() => {
      noter(`${quoi} +2 images · ${ceQuiEstPeint()}`);
    });
  });
}

let surveillanceApercuPosee = false;
function surveillerLesEcrituresDAdresse(): void {
  if (surveillanceApercuPosee || typeof window === "undefined") return;
  surveillanceApercuPosee = true;
  for (const nom of ["pushState", "replaceState"] as const) {
    const original = window.history[nom];
    if (typeof original !== "function") continue;
    window.history[nom] = function (
      this: History,
      ...arguments_: Parameters<History["pushState"]>
    ) {
      const avant = adresseCourante();
      const entrees = history.length;
      //  AVANT L'APPEL : l'entrée qu'on s'apprête à quitter est encore
      //  la courante, et l'écran est celui que le navigateur peut
      //  ranger sous elle.
      noter(`ADRESSE ${nom} · quitte ${avant} · ${ceQuiEstPeint()}`);
      const retour = original.apply(this, arguments_);
      noter(
        `ADRESSE ${nom} · va vers ${adresseCourante()} · entrées ${entrees} → ${history.length}`
      );
      auxImagesSuivantes(`ADRESSE ${nom}`);
      return retour;
    };
  }
}

export function SondeBascule() {
  const [armee, setArmee] = useState(false);
  //  ⚠️ REPLIÉE AU DÉPART (nº 183-§1) : une pastille, rien de plus. Le
  //  journal, lui, continue d'enregistrer — voir les effets ci-dessous,
  //  qui ne dépendent pas de cet état.
  const { repliee, basculer } = useSondeRepliee();
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sondeBasculeArmee()) return;
    //  ⚠️ TEMPORAIRE (nº 615) — POSÉE AU PLUS TÔT, dans cet effet-ci et
    //  non dans celui d'en dessous : `armee` n'est vrai qu'une image
    //  plus tard, et le premier changement d'adresse peut suivre de
    //  près. Le journal, lui, enregistre dès maintenant.
    surveillerLesEcrituresDAdresse();
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  /* ---- LE RETOUR EN ARRIÈRE (nº 175-§6) : ON OBSERVE ---- */
  useEffect(() => {
    if (!armee) return;
    const racine = document.documentElement;
    const nav = typeDeNavigation();

    //  LA PAGE OÙ L'ON ARRIVE — la ligne qui sépare deux documents dans
    //  le journal (le chronomètre, lui, repart de zéro à chaque page).
    noter(
      `═══ PAGE ${adresseCourante()} · navigation ${nav} · ${historiqueEtCriteres()}`
    );
    for (const ligne of etatSauvegarde()) noter(ligne);

    /* b) LE RETOUR : la position DEMANDÉE, puis celle RÉELLEMENT
       atteinte, et l'écart. La demandée est celle que le script d'avant
       peinture a posée (`data-positionPosee`) ; à défaut, celle qui est
       rangée pour cette adresse. On mesure ensuite plusieurs fois : la
       page s'allonge en cours de route, et c'est justement là que le
       défaut se joue. */
    const posee = racine.dataset.positionPosee;
    let demandee = posee ? Number(posee) || 0 : 0;
    if (!posee) {
      try {
        const brut = localStorage.getItem(
          `${PREFIXE_DEFILEMENT}${adresseDeRechercheCourante()}`
        );
        demandee = brut ? Number((JSON.parse(brut) as { y?: number }).y) || 0 : 0;
      } catch {
        demandee = 0;
      }
    }
    noter(
      `RETOUR demandée ${demandee} · posée par le script avant peinture : ${
        posee ? "OUI" : "non"
      } · défilement à l'arrivée ${Math.round(window.scrollY)}`
    );

    const minuteurs: number[] = [];
    const mesurer = (quand: string) => {
      const atteinte = Math.round(window.scrollY);
      noter(
        `RETOUR ${quand} · atteinte ${atteinte} · demandée ${demandee} · ` +
          `écart ${atteinte - demandee} · document ${Math.round(
            document.body.getBoundingClientRect().height
          )}`
      );
    };
    const image = requestAnimationFrame(() => mesurer("1re image"));
    for (const delai of [300, 1200, 2500]) {
      minuteurs.push(window.setTimeout(() => mesurer(`+${delai} ms`), delai));
    }

    //  LE GESTE LUI-MÊME, quand il ne crée pas de document (le routeur
    //  rend la page cible sur place) : `popstate` est le seul témoin.
    const auPopstate = () => {
      noter(
        `POPSTATE · ${adresseCourante()} · défilement ${Math.round(
          window.scrollY
        )} · ${historiqueEtCriteres()}`
      );
      //  ⚠️ TEMPORAIRE (nº 615) — CE QUI EST ENCORE PEINT À LA FIN DU
      //  GESTE, puis aux deux images suivantes : c'est l'écart entre
      //  ces trois lignes qui dit combien de temps la page quittée
      //  reste à l'écran après le glissement.
      noter(`POPSTATE · ${ceQuiEstPeint()}`);
      auxImagesSuivantes("POPSTATE");
      window.setTimeout(
        () =>
          noter(
            `POPSTATE +600 ms · défilement ${Math.round(window.scrollY)} · ${ceQuiEstPeint()}`
          ),
        600
      );
    };
    //  ET LE DÉPART DE LA PAGE : le journal doit partir avec nous.
    const auDepart = () => {
      noter(
        `DÉPART de ${adresseCourante()} · défilement ${Math.round(
          window.scrollY
        )}`
      );
      sauvegarderMaintenant();
    };
    window.addEventListener("popstate", auPopstate);
    window.addEventListener("pagehide", auDepart);
    return () => {
      cancelAnimationFrame(image);
      for (const m of minuteurs) window.clearTimeout(m);
      window.removeEventListener("popstate", auPopstate);
      window.removeEventListener("pagehide", auDepart);
    };
  }, [armee]);

  /* ---- LES ÉCOUTEURS : fenêtre et viewport visuel ---- */
  useEffect(() => {
    if (!armee) return;
    noter(`— sonde armée · ${mesureFenetre()} · ${navigator.userAgent}`);
    //  LA DÉTECTION MOBILE DE LA MOSAÏQUE (point 4). Sur l'index, elle
    //  ne passe PAS par le crochet `useAppareilMobile` mais par
    //  `data-appareil` sur <html>, posé avant la peinture d'après
    //  `matchMedia("(pointer: coarse)")` — la variante CSS `mobile:` s'y
    //  accroche. AUCUN SEUIL DE LARGEUR n'est en jeu. On note sa valeur
    //  de départ, puis CHAQUE changement, avec la largeur du moment.
    const racine = document.documentElement;
    noter(
      `APPAREIL (départ) data-appareil="${racine.dataset.appareil ?? "(absent)"}" · ` +
        `largeur ${window.innerWidth} · pointer:coarse = ${
          window.matchMedia?.("(pointer: coarse)").matches
        } — aucun seuil de largeur`
    );
    let appareilConnu = racine.dataset.appareil ?? "(absent)";
    const oeil = new MutationObserver(() => {
      const valeur = racine.dataset.appareil ?? "(absent)";
      if (valeur === appareilConnu) return;
      noter(
        `APPAREIL "${appareilConnu}" → "${valeur}" · largeur ${window.innerWidth}`
      );
      appareilConnu = valeur;
    });
    oeil.observe(racine, {
      attributes: true,
      attributeFilter: ["data-appareil"],
    });

    let largeur = window.innerWidth;
    let hauteur = window.innerHeight;
    const auRedimensionnement = () => {
      if (window.innerWidth === largeur && window.innerHeight === hauteur) {
        return;
      }
      noter(
        `FENÊTRE ${largeur}×${hauteur} → ${window.innerWidth}×${window.innerHeight}`
      );
      largeur = window.innerWidth;
      hauteur = window.innerHeight;
    };

    const visuel = window.visualViewport;
    const auVisuel = (evenement: Event) => {
      if (!visuel) return;
      noter(
        `VISUEL ${evenement.type} · ${Math.round(visuel.width)}×${Math.round(
          visuel.height
        )} · offsetTop ${Math.round(visuel.offsetTop)}`
      );
    };

    window.addEventListener("resize", auRedimensionnement, { passive: true });
    visuel?.addEventListener("resize", auVisuel, { passive: true });
    visuel?.addEventListener("scroll", auVisuel, { passive: true });
    return () => {
      oeil.disconnect();
      window.removeEventListener("resize", auRedimensionnement);
      visuel?.removeEventListener("resize", auVisuel);
      visuel?.removeEventListener("scroll", auVisuel);
    };
  }, [armee]);

  /* ---- L'AFFICHAGE : écrit à la main, jamais par un rendu ----
     ⚠️ IL DÉPEND AUSSI DU REPLI (nº 183-§1) : le nœud n'existe pas
     quand la sonde est repliée ; au dépliage, cet effet se rejoue et
     réécrit TOUT le journal, y compris ce qui s'est enregistré
     pendant. */
  useEffect(() => {
    if (!armee || repliee) return;
    const ecrire = () => {
      const noeud = zone.current;
      if (!noeud) return;
      const lignes = lignesDuJournal();
      noeud.textContent = "";
      for (const ligne of lignes) {
        const div = document.createElement("div");
        div.style.cssText =
          "display:flex;gap:6px;align-items:baseline;padding:1px 0";
        const t = document.createElement("span");
        t.style.cssText = "color:#9AA0A6;min-width:52px;flex-shrink:0";
        t.textContent = `${ligne.t}`;
        const texte = document.createElement("span");
        texte.style.cssText = /DÉMONTAGE|MONTAGE/.test(ligne.texte)
          ? "color:#EE3D6F;font-weight:700;word-break:break-word"
          : "color:#FFF;word-break:break-word";
        texte.textContent = ligne.texte;
        div.append(t, texte);
        noeud.append(div);
      }
      //  Le dernier événement reste sous les yeux.
      noeud.scrollTop = noeud.scrollHeight;
    };
    ecrire();
    return souscrireAuJournal(ecrire);
  }, [armee, repliee]);

  if (!armee) return null;
  if (repliee) {
    return <PastilleSonde lettre="B" titre="Journal bascule" surToucher={basculer} />;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        //  ⚠️ AU-DESSUS DE LA BARRE DU NAVIGATEUR (nº 174-§3B) : sur
        //  iPhone, `bottom: 6` glisse sous la barre d'outils de Safari
        //  — les deux boutons deviennent inatteignables. La marge de
        //  sécurité du bas les en dégage.
        bottom: "max(6px, env(safe-area-inset-bottom))",
        //  Le plus haut plan possible : rien ne passe devant, ni la
        //  barre fixe (z-50) ni un panneau (z-80).
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #EE3D6F",
        borderRadius: 12,
        padding: "8px 10px 10px",
        font: "12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "50vh",
      }}
    >
      {/*  ⚠️ LE TITRE SUR SA LIGNE, LES BOUTONS SUR LA LEUR
           (nº 174-§3B) : à 390 px, un titre et deux boutons sur une
           seule ligne se marchent dessus. Empilés, chaque bouton garde
           toute sa largeur et ses 44 px de haut — le pouce ne peut pas
           les manquer. */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#EE3D6F", fontWeight: 700, flex: 1 }}>
          JOURNAL BASCULE
        </span>
        <BoutonReplier surToucher={basculer} />
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <BoutonCopierJournal texte={journalEnTexte} pleineLargeur />
        {/*  ⚠️ LE CHEMIN QUI NE DÉPEND PAS DU PRESSE-PAPIERS
             (nº 174-§3A) : il poste le journal au serveur, qui l'écrit
             dans un fichier. COPIER reste là pour les autres
             appareils. */}
        <BoutonEnvoyerJournal sonde="bascule" texte={journalEnTexte} pleineLargeur />
      </div>
      <div ref={zone} style={{ overflow: "auto", flex: 1 }} />
    </div>
  );
}
