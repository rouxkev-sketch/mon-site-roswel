"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { souscrireAdresse } from "@/lib/adresse-courante";
import { estCourrielAdmin } from "@/lib/courriel-admin";
import {
  armerLeDiagnostic,
  auJournalDiagnostic,
  diagnosticArme,
  lignesDuDiagnostic,
  nommerLeNoeud,
  noterDiag,
} from "@/lib/journal-diagnostic";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * ██ LE BANDEAU DE DIAGNOSTIC — CHROME iOS, LE TOUCHER QUI N'ARRIVE PAS ██
 * ==================================================================
 * (passe nº 884, demandé par le propriétaire)
 *
 * CE QU'IL SERT À TRANCHER. Sur Chrome iOS — et là seulement —, une
 * page ouverte depuis une page légèrement défilée paraît défilée de
 * quelques pixels, et la barre fixe (logo, loupe, globe/fanion,
 * avatar) comme le va-et-vient restent INTOUCHABLES jusqu'au premier
 * défilement. Trois passes (881, 882, 883) ont corrigé Safari sans
 * fermer ce cas-là, et l'atelier ne peut pas le reproduire : Chromium
 * de bureau ne replie aucune barre d'adresse, et WebKit n'est pas
 * installé ici. LA MESURE DOIT DONC ÊTRE FAITE PAR LE PROPRIÉTAIRE,
 * sur son téléphone. Ce bandeau est l'instrument.
 *
 * LA QUESTION EXACTE, ET C'EST LUI QUI Y RÉPOND : au centre de la
 * loupe, QUEL ÉLÉMENT reçoit le toucher ? La loupe elle-même (alors
 * le toucher arrive et c'est ailleurs qu'il se perd), un VOILE, une
 * couche d'attente — ou rien, parce que la barre est peinte à un
 * endroit et touchée à un autre (le viewport VISUEL décalé du
 * viewport de mise en page, la signature d'une barre d'adresse
 * repliée héritée de la page d'origine) ?
 * ⚠️ C'EST POURQUOI L'ÉLÉMENT EST DEMANDÉ DEUX FOIS : au centre peint
 * de la loupe, et au même point REMONTÉ de `visualViewport.offsetTop`.
 * Si les deux réponses diffèrent, le décalage est nommé, mesuré, et la
 * cause est trouvée.
 *
 * QUI LE VOIT : l'administration SEULEMENT (l'adresse du compte
 * connecté, `estCourrielAdmin`), ET seulement si l'adresse porte
 * `?diag=1`. Sans les deux, ce composant ne rend rien, n'écoute rien,
 * n'arme rien — le journal reste un test de booléen (voir sa note).
 *
 * ⚠️ IL N'AGIT SUR RIEN : il ne défile pas, ne pose aucune entrée
 * d'historique, ne gèle rien, ne touche pas au corps. Il LIT, et il
 * affiche. Le bouton « Copier » met tout dans le presse-papiers, pour
 * que le relevé arrive ici entier.
 * ⚠️ IL SE POSE EN BAS : la barre fixe et le va-et-vient sont EN HAUT
 * — il ne doit jamais recouvrir ce qu'on mesure.
 */

/** Le rythme des relevés : dix par seconde, assez pour voir un repli
    de barre d'adresse, assez lent pour ne rien coûter. */
const RYTHME_MS = 100;

/**
 * ██ L'ARMEMENT VIT AVEC L'ONGLET, PAS AVEC L'ADRESSE ██
 * ------------------------------------------------------------------
 * MESURÉ À CETTE PASSE, ET C'EST LA LEÇON DE LA nº 343 : `?diag=1`
 * disparaît à la première navigation — or le défaut du propriétaire se
 * produit précisément À L'ARRIVÉE d'une page. Un armement qui meurt en
 * chemin ne pourrait jamais le montrer. Le paramètre ARME donc l'onglet
 * (`?diag=1`), et `?diag=0` le désarme ; entre les deux, le bandeau
 * suit le visiteur de page en page.
 * ⚠️ MÉMOIRE D'ONGLET, ET PAS DAVANTAGE : fermer l'onglet suffit à tout
 * effacer ; rien ne survit à la visite.
 */
const CLE_ARMEMENT = "yokofolio:diagnostic";

/** Un rectangle, en une ligne. */
function rect(cible: Element | null): string {
  if (!cible) return "(absent)";
  const r = cible.getBoundingClientRect();
  const a = (n: number) => Math.round(n);
  return `haut ${a(r.top)} · gauche ${a(r.left)} · l ${a(r.width)} · h ${a(r.height)}`;
}

type Releve = { titre: string; valeur: string }[];

function relever(): Releve {
  const vv = window.visualViewport;
  const barre = document.querySelector("[data-barre-fixe]");
  const loupe = document.querySelector('[aria-label="Search"]');
  const html = document.documentElement;
  const lignes: Releve = [
    {
      titre: "défilement",
      valeur:
        `scrollY ${Math.round(window.scrollY)} · scrollingElement ` +
        `${Math.round(document.scrollingElement?.scrollTop ?? -1)}`,
    },
    {
      titre: "viewport visuel",
      valeur: vv
        ? `offsetTop ${Math.round(vv.offsetTop)} · pageTop ${Math.round(vv.pageTop)} · ` +
          `hauteur ${Math.round(vv.height)} · échelle ${vv.scale.toFixed(2)}`
        : "(pas de visualViewport)",
    },
    { titre: "fenêtre", valeur: `innerHeight ${window.innerHeight}` },
    { titre: "barre fixe", valeur: rect(barre) },
    { titre: "loupe", valeur: rect(loupe) },
  ];

  /*  ██ LA QUESTION DU PROPRIÉTAIRE ██
      Au centre PEINT de la loupe : qui reçoit le toucher ? Puis au
      même point remonté du décalage du viewport visuel — si les deux
      diffèrent, la barre est peinte ici et touchée là. */
  const boite = loupe?.getBoundingClientRect();
  if (loupe && boite && boite.width > 0 && boite.height > 0) {
    /*  TROIS RÉPONSES, ET PAS DEUX : la loupe elle-même (ou un de ses
        dessins) reçoit le toucher ; un ANCÊTRE le reçoit — alors le
        toucher passe À CÔTÉ d'elle, c'est un défaut ; ou un tiers le
        reçoit — un voile, une couche d'attente, qu'on nomme. */
    const juger = (noeud: Element | null): string => {
      if (!noeud) return "RIEN NE REÇOIT";
      if (noeud === loupe || loupe.contains(noeud)) return "C'EST LA LOUPE";
      if (noeud.contains(loupe)) return "UN ANCÊTRE (le toucher passe à côté)";
      return "CE N'EST PAS LA LOUPE";
    };
    const cx = Math.round(boite.left + boite.width / 2);
    const cy = Math.round(boite.top + boite.height / 2);
    const dessus = document.elementFromPoint(cx, cy);
    lignes.push({
      titre: `qui reçoit en ${cx},${cy}`,
      valeur: `${nommerLeNoeud(dessus)}  →  ${juger(dessus)}`,
    });
    /*  ⚠️ LE MÊME POINT, REMONTÉ DU DÉCALAGE DU VIEWPORT VISUEL : si la
        réponse change, la barre est PEINTE ici et TOUCHÉE là — c'est la
        signature d'une barre d'adresse repliée héritée de la page
        d'origine, l'hypothèse du propriétaire. */
    const decalage = Math.round(vv?.offsetTop ?? 0);
    if (decalage !== 0) {
      const autre = document.elementFromPoint(cx, cy - decalage);
      lignes.push({
        titre: `… remonté de ${decalage}`,
        valeur: `${nommerLeNoeud(autre)}  →  ${juger(autre)}`,
      });
    }
    lignes.push({
      titre: "loupe : gestes",
      valeur: `pointer-events ${getComputedStyle(loupe).pointerEvents} · ` +
        `touch-action ${getComputedStyle(loupe).touchAction}`,
    });
  } else {
    //  La loupe n'existe qu'au doigt (au web, c'est un champ) : on le
    //  dit, plutôt que de mesurer un rectangle vide.
    lignes.push({ titre: "qui reçoit en (loupe)", valeur: "(loupe non peinte sur cet écran)" });
  }

  /*  ██ LE VA-ET-VIENT, LUI AUSSI ██
      Le propriétaire le nomme à côté de la barre fixe : « la barre ET
      le va-et-vient sont intouchables ». On pose donc sur lui la même
      question qu'à la loupe, quel que soit celui que la page porte. */
  const vaEtVient = document.querySelector(
    '[data-va-et-vient-nature], [aria-label="Profile, portfolio or flash"], ' +
      '[aria-label="Favorites or following"], [aria-label="Sign up or log in"]'
  );
  const boiteVaEtVient = vaEtVient?.getBoundingClientRect();
  if (vaEtVient && boiteVaEtVient && boiteVaEtVient.width > 0 && boiteVaEtVient.height > 0) {
    const cx = Math.round(boiteVaEtVient.left + boiteVaEtVient.width / 4);
    const cy = Math.round(boiteVaEtVient.top + boiteVaEtVient.height / 2);
    const dessus = document.elementFromPoint(cx, cy);
    lignes.push({ titre: "va-et-vient", valeur: rect(vaEtVient) });
    lignes.push({
      titre: `qui reçoit en ${cx},${cy}`,
      valeur: `${nommerLeNoeud(dessus)}  →  ${
        dessus && (dessus === vaEtVient || vaEtVient.contains(dessus))
          ? "C'EST LE VA-ET-VIENT"
          : "CE N'EST PAS LE VA-ET-VIENT"
      }`,
    });
  }

  const drapeaux = ["appareil", "defilementProgramme", "recherche", "fenetreFiche", "zoom", "positionPosee"]
    .map((cle) => (html.dataset[cle] ? `${cle}=${html.dataset[cle]}` : null))
    .filter(Boolean)
    .join(" · ");
  lignes.push({ titre: "html", valeur: drapeaux || "(aucun drapeau)" });
  lignes.push({
    titre: "page",
    valeur: `${window.location.pathname}${window.location.search} · étapes ${window.history.length}`,
  });
  return lignes;
}

export function BandeauDiagnostic() {
  const { utilisateur } = useUtilisateur();
  const [demande, setDemande] = useState(false);
  const [releve, setReleve] = useState<Releve>([]);
  const [journal, setJournal] = useState<string[]>([]);
  const [replie, setReplie] = useState(false);
  const [copie, setCopie] = useState("");
  const zoneDeCopie = useRef<HTMLTextAreaElement>(null);

  //  ── L'ONGLET EST-IL ARMÉ ? `?diag=1` arme, `?diag=0` désarme, et
  //     l'armement survit aux navigations (voir CLE_ARMEMENT).
  useEffect(() => {
    const lire = () => {
      const demandeDeLAdresse = new URLSearchParams(window.location.search).get("diag");
      try {
        if (demandeDeLAdresse === "1") sessionStorage.setItem(CLE_ARMEMENT, "1");
        if (demandeDeLAdresse === "0") sessionStorage.removeItem(CLE_ARMEMENT);
        setDemande(sessionStorage.getItem(CLE_ARMEMENT) === "1");
      } catch {
        //  Mémoire d'onglet refusée (navigation privée stricte) : le
        //  paramètre décide seul, page par page.
        setDemande(demandeDeLAdresse === "1");
      }
    };
    lire();
    return souscrireAdresse(lire);
  }, []);

  const admin = estCourrielAdmin(utilisateur?.email);
  const actif = demande && admin;

  //  ── ARMER, PUIS RELEVER — et rien de tout cela sans les deux clés.
  useEffect(() => {
    if (!actif) return;
    if (!diagnosticArme()) {
      armerLeDiagnostic();
      noterDiag(`DIAGNOSTIC ARMÉ · ${window.location.pathname}`);
    }
    const rafraichir = () => {
      setReleve(relever());
      setJournal(lignesDuDiagnostic());
    };
    rafraichir();
    const minuteur = window.setInterval(rafraichir, RYTHME_MS);
    const quitterLeJournal = auJournalDiagnostic(rafraichir);
    const vv = window.visualViewport;
    window.addEventListener("scroll", rafraichir, { passive: true });
    window.addEventListener("resize", rafraichir);
    vv?.addEventListener("resize", rafraichir);
    vv?.addEventListener("scroll", rafraichir);
    return () => {
      window.clearInterval(minuteur);
      quitterLeJournal();
      window.removeEventListener("scroll", rafraichir);
      window.removeEventListener("resize", rafraichir);
      vv?.removeEventListener("resize", rafraichir);
      vv?.removeEventListener("scroll", rafraichir);
    };
  }, [actif]);

  /** TOUT LE RELEVÉ, EN TEXTE — c'est ce que le bouton copie. */
  const texte = useCallback(
    () =>
      [
        `DIAGNOSTIC nº 884 — ${new Date().toISOString()}`,
        `${navigator.userAgent}`,
        "",
        ...releve.map((l) => `${l.titre.padEnd(20)} ${l.valeur}`),
        "",
        "JOURNAL (20 dernières lignes) :",
        ...journal,
      ].join("\n"),
    [releve, journal]
  );

  const copier = useCallback(async () => {
    const contenu = texte();
    try {
      await navigator.clipboard.writeText(contenu);
      setCopie("copié");
    } catch {
      /*  LE REPLI DES NAVIGATEURS QUI REFUSENT LE PRESSE-PAPIERS :
          on sélectionne le texte dans la zone ci-dessous, il n'y a
          plus qu'à toucher « copier » du menu du téléphone. */
      const zone = zoneDeCopie.current;
      if (zone) {
        zone.value = contenu;
        zone.style.display = "block";
        zone.focus();
        zone.setSelectionRange(0, contenu.length);
        setCopie("sélectionné — copie avec le menu");
      } else {
        setCopie("échec");
      }
    }
    window.setTimeout(() => setCopie(""), 4000);
  }, [texte]);

  if (!actif) return null;

  const cadre: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483000,
    background: "rgba(6,10,14,0.94)",
    color: "#e8eef4",
    font: "11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
    borderTop: "2px solid #e11d48",
    maxHeight: replie ? "auto" : "52vh",
    overflowY: "auto",
    padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
    WebkitOverflowScrolling: "touch",
  };

  return (
    <div style={cadre} data-diagnostic="">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <strong style={{ color: "#f43f5e" }}>DIAG 884</strong>
        <button
          type="button"
          onClick={copier}
          style={{
            border: "1px solid #64748b",
            borderRadius: 6,
            padding: "4px 10px",
            background: "#111827",
            color: "#e8eef4",
            font: "inherit",
          }}
        >
          Copier
        </button>
        <button
          type="button"
          onClick={() => setReplie((v) => !v)}
          style={{
            border: "1px solid #64748b",
            borderRadius: 6,
            padding: "4px 10px",
            background: "#111827",
            color: "#e8eef4",
            font: "inherit",
          }}
        >
          {replie ? "Déplier" : "Replier"}
        </button>
        {copie ? <span style={{ color: "#4ade80" }}>{copie}</span> : null}
      </div>
      {replie ? null : (
        <>
          {releve.map((ligne) => (
            <div key={ligne.titre} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <span style={{ color: "#94a3b8" }}>{ligne.titre}</span> {ligne.valeur}
            </div>
          ))}
          <div style={{ color: "#94a3b8", margin: "6px 0 2px" }}>
            journal ({journal.length}/20)
          </div>
          {journal.map((ligne, rang) => (
            <div key={`${rang}-${ligne}`} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {ligne}
            </div>
          ))}
        </>
      )}
      {/*  LA ZONE DE REPLI : cachée tant que le presse-papiers répond. */}
      <textarea
        ref={zoneDeCopie}
        readOnly
        aria-hidden="true"
        style={{
          display: "none",
          width: "100%",
          height: 120,
          marginTop: 6,
          background: "#0b0f14",
          color: "#e8eef4",
          font: "inherit",
        }}
      />
    </div>
  );
}
