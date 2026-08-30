"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChampsPlageDates } from "@/components/CalendrierPlage";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { CHAMP } from "@/components/champs-formulaire";
import {
  IconeCocheListe,
  IconeCroix,
  IconePlus,
} from "@/components/Icones";
import { MenuDeroulant, type OptionMenu } from "@/components/MenuDeroulant";
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
import { TRAIT_SEPARATION_FOND } from "@/config/tatouage";
import { useAppareilMobile } from "@/lib/appareil";
import {
  conventionsDuPays,
  nomDuPays,
  paysDesConventions,
  type ConventionAcceptee,
} from "@/lib/conventions";
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import { paysDuLieu, type LieuTrouve } from "@/lib/geocodage";
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";

/**
 * ██ nº 750 bis — « ADD A CONVENTION » : L'ÉCRAN DES STYLES, REPRIS ██
 * ====================================================================
 * CE QUE LA nº 750 AVAIT FAIT, ET QUE LE PROPRIÉTAIRE NE VEUT PLUS :
 * deux menus déroulants posés à même le formulaire (pays, puis
 * convention), et les dates dessous. Ça marchait ; ça ne ressemblait à
 * rien d'autre dans le site.
 * CE QUE ÇA DEVIENT : le MÊME écran que « Ajouter un style » — une
 * FENÊTRE SUPERPOSÉE au web, une PAGE PLEIN ÉCRAN au doigt, un titre,
 * une liste qui défile, une barre fixe en bas. On y choisit UNE
 * convention et ses dates, et le formulaire reçoit un BADGE À CROIX.
 *
 * ⚠️ LE FOND NE CHANGE PAS D'UNE LIGNE, et c'est la consigne : la
 * base, l'enregistrement (`enregistrer-exercice`), la demande aux
 * administrateurs (`/api/tatoueur/suggestion-convention`) et
 * l'expiration automatique sont ceux de la nº 750. Cette passe est un
 * changement de PRÉSENTATION.
 *
 * ██ L'ÉCRITURE EST CELLE DE BlocPortfolio, RECOPIÉE AU MOTIF PRÈS ██
 * Les deux surfaces sont montées ENSEMBLE et chacune se cache par sa
 * propre écriture (`mobile:hidden` pour la fenêtre, la page ne vivant
 * qu'au doigt) — c'est le motif de la nº 474 : aucune bifurcation
 * d'état, donc aucun éclair du mauvais habillage au montage. Le
 * CONTENU, lui, est fabriqué UNE SEULE FOIS (`lesLignes`, `laBarre`) :
 * deux écritures finiraient par diverger.
 * Les valeurs de plaque, de filet, de barre et de bouton sont celles
 * que les nº 544/559/560/561 ont mesurées pour la fenêtre des styles —
 * rien n'est choisi ici.
 */

/** Ce que la fenêtre rend quand on valide : une convention, et LES
    DATES DE L'ARTISTE (pas celles de la convention). */
export type AjoutConvention = {
  convention: ConventionAcceptee;
  debut_le: string;
  fin_le: string;
};

export function FenetreConventions({
  catalogue,
  dejaChoisies,
  surAjout,
  surFermer,
  //  LA DEMANDE — le mécanisme de la nº 750, déménagé ici sans une
  //  ligne de changement (voir `laBarre`).
  ficheId,
}: {
  /** `null` = le catalogue n'est pas encore lu ; `[]` = lu et vide. */
  catalogue: ConventionAcceptee[] | null;
  /** Les identifiants déjà posés en badge : la liste les COCHE, sans
      les interdire — la conception nº 748-B1 autorise deux lignes sur
      la même convention (des jours disjoints). */
  dejaChoisies: string[];
  surAjout: (ajout: AjoutConvention) => void;
  surFermer: () => void;
  ficheId?: string | null;
}) {
  const auDoigt = useAppareilMobile();

  /* ---------------- LE CHOIX EN COURS ---------------- */
  const [paysChoisi, setPaysChoisi] = useState("");
  const [retenue, setRetenue] = useState<ConventionAcceptee | null>(null);
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  /** Après une tentative d'ajout incomplète : les champs manquants
      s'encadrent de rouge — la règle nº 111, sans un mot. */
  const [ajoutTente, setAjoutTente] = useState(false);

  /* ---------------- LA DEMANDE (nº 750, déménagée) ---------------- */
  const [demandeOuverte, setDemandeOuverte] = useState(false);
  const [paysDemande, setPaysDemande] = useState<LieuTrouve | null>(null);
  const [nomDemande, setNomDemande] = useState("");
  const [messageDemande, setMessageDemande] = useState("");
  const [envoiDemande, setEnvoiDemande] = useState(false);
  const [refusDemande, setRefusDemande] = useState<string | null>(null);
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false);

  const liste = catalogue ?? [];
  const optionsPays: OptionMenu[] = paysDesConventions(liste).map((code) => ({
    value: code,
    label: nomDuPays(code),
  }));
  const duPays = paysChoisi ? conventionsDuPays(liste, paysChoisi) : [];
  const catalogueVide = catalogue !== null && liste.length === 0;
  //  LE PAYS DE LA DEMANDE : celui du menu (« pré-rempli », conception
  //  nº 748-E), remplacé par celui que la personne choisit dans le
  //  champ de localité si elle en choisit un.
  const paysDeLaDemande = (
    paysDemande?.code_pays ??
    paysChoisi ??
    ""
  ).toUpperCase();

  /* ---------------- LES SERVITUDES D'UNE SURFACE QUI COUVRE --------
     Les quatre crochets de « Ajouter un style » (BlocPortfolio), au
     motif près — voir les notes des nº 474, 469, 330 et 735/736.
     ---------------------------------------------------------------- */

  //  Échap referme, comme toutes les fenêtres du site.
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") surFermer();
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [surFermer]);

  //  LE VERROU DE DÉFILEMENT COMPTÉ (nº 469) : la page ne défile plus
  //  derrière. Aux DEUX largeurs — une fenêtre centrée à voile
  //  verrouille, c'est la règle de sa famille (nº 560-§5).
  useEffect(() => {
    poserLeVerrouDeDefilement();
    return retirerLeVerrouDeDefilement;
  }, []);

  //  L'ÉTAPE D'HISTORIQUE, au doigt seulement (C-4, nº 330) : le
  //  RETOUR du téléphone referme la page et rend le formulaire, saisie
  //  intacte. Le web ne pose rien.
  useEtapeQuiSeReferme(auDoigt, surFermer);

  /*  ██ LE TROU DU CLAVIER (acquis nº 735 puis nº 736) ██
      Au doigt, quand le clavier s'ouvre, Safari iOS FAIT GLISSER le
      viewport de mise en page vers le haut : tout ce qui est `fixed`
      glisse avec lui et découvre ce qu'il y a derrière — ici, le
      formulaire. Le remède mesuré sur le vrai iPhone ne suit aucune
      géométrie : tant que la page d'ajout est ouverte, l'enveloppe du
      site est invisible et le canevas prend LA COULEUR DE LA BARRE.
      ⚠️ C'EST LE MARQUEUR EXISTANT, ET IL EST RÉEMPLOYÉ TEL QUEL :
      `data-ajout-style`, dont les deux règles vivent dans globals.css
      (nº 735 et nº 736). Son NOM garde la trace de sa naissance — la
      page « Ajouter un style » —, mais ce qu'il décrit est GÉNÉRIQUE :
      « une page d'ajout plein écran est ouverte au doigt ». Le
      renommer voudrait dire toucher globals.css pour zéro changement
      de comportement (règle nº 172 : on n'y touche pas). Deux pages
      d'ajout le posent désormais ; elles ne peuvent pas être ouvertes
      en même temps (l'une vit dans le bloc des lieux, l'autre dans
      celui du portfolio, et chacune couvre l'écran).
      ⚠️ AU DOIGT SEULEMENT (`auDoigt`, donc `data-appareil` — règle
      nº 60, jamais une largeur) : au web, la même ouverture pose une
      FENÊTRE par-dessus la page — cacher l'enveloppe éteindrait
      l'écran sous elle. */
  useEffect(() => {
    if (!auDoigt) return;
    document.documentElement.setAttribute("data-ajout-style", "ouvert");
    return () => {
      document.documentElement.removeAttribute("data-ajout-style");
    };
  }, [auDoigt]);

  /* ---------------- CE QU'ON AJOUTE ---------------- */
  function ajouter() {
    setAjoutTente(true);
    if (!retenue || !debut || !fin || fin < debut) return;
    surAjout({ convention: retenue, debut_le: debut, fin_le: fin });
  }

  async function envoyerLaDemande() {
    const propose = nomDemande.trim();
    if (propose.length < 2 || !paysDeLaDemande || envoiDemande) return;
    setEnvoiDemande(true);
    setRefusDemande(null);
    try {
      const reponse = await fetch("/api/tatoueur/suggestion-convention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propose,
          codePays: paysDeLaDemande,
          message: messageDemande.trim() || null,
          ficheId,
        }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!donnees.ok) {
        setRefusDemande(donnees.message ?? "L'envoi n'a pas abouti.");
        return;
      }
      setNomDemande("");
      setMessageDemande("");
      setDemandeOuverte(false);
      setDemandeEnvoyee(true);
    } catch {
      setRefusDemande("L'envoi n'a pas abouti. Réessaie.");
    } finally {
      setEnvoiDemande(false);
    }
  }

  /* ================================================================
     LE CONTENU, FABRIQUÉ UNE SEULE FOIS (le motif nº 474)
     ================================================================ */

  /** LE HAUT DU CORPS : le menu des pays, puis — une fois une
      convention retenue — ses dates et le bouton qui valide. */
  const enTeteDuCorps = (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-2">
      <MenuDeroulant
        valeur={paysChoisi}
        surChangement={(code) => {
          setPaysChoisi(code);
          //  CHANGER DE PAYS LÂCHE LA CONVENTION RETENUE : elle n'est
          //  pas dans la nouvelle liste. Les dates restent — ce sont
          //  celles de l'artiste, elles ne dépendent d'aucun pays.
          setRetenue(null);
        }}
        options={optionsPays}
        ariaLabel="Country"
        placeholder="Country"
        sombre
        opaque
        //  La robe des champs du formulaire (`CHAMP`), comme à la
        //  nº 750 : ce menu vit au milieu d'eux.
        fondRepos="bg-sombre-eleve-clair"
        fondActif="bg-sombre-haut"
        arrondi="rounded-xl"
        hauteur="min-h-[52px]"
      />

      {catalogueVide && (
        <p className="text-[13px] leading-relaxed text-sombre-texte-doux">
          No convention has been added to the catalogue yet.
        </p>
      )}

      {retenue && (
        <div className="rounded-xl bg-sombre-eleve-clair p-4">
          <p className="text-[13.5px] font-semibold text-sombre-texte">
            {retenue.nom}
          </p>
          <p className="mt-1 text-[13px] text-sombre-texte-doux">
            Your dates there
          </p>
          <div className="mt-3">
            <ChampsPlageDates
              prefixe="convention-fenetre"
              debut={debut}
              fin={fin}
              surChangement={(d, f) => {
                setDebut(d);
                setFin(f);
              }}
              enFauteDebut={ajoutTente && (!debut || (Boolean(fin) && fin < debut))}
              enFauteFin={ajoutTente && (!fin || (Boolean(debut) && fin < debut))}
            />
          </div>
          <button
            type="button"
            onClick={ajouter}
            disabled={!debut || !fin || fin < debut}
            //  L'ACTIVATION SE VOIT (règle nº 124) : tant que les deux
            //  dates manquent, la capsule reste grise et éteinte.
            className="mt-4 h-11 w-full rounded-lg bg-primaire text-[14px]
                       font-semibold text-white transition-colors
                       hover:opacity-90 active:opacity-90
                       disabled:bg-sombre-haut-clair
                       disabled:text-sombre-texte-doux disabled:opacity-100
                       disabled:hover:opacity-100"
          >
            Add this convention
          </button>
        </div>
      )}
    </div>
  );

  /** LES LIGNES DE LA LISTE — le motif de `ligneDeStyle`
      (BlocPortfolio) : une rangée de 52 px, le libellé à gauche, une
      coche rose à droite quand elle est déjà posée en badge.
      ⚠️ COCHÉE MAIS CLIQUABLE, et c'est la différence avec les styles :
      la conception nº 748-B1 autorise DEUX lignes sur la même
      convention (« pour des jours disjoints, il ajoute une seconde
      ligne »). La coche informe, elle n'interdit pas. */
  const lesLignes = (survol = "hover:bg-sombre-eleve") =>
    duPays.map((convention) => {
      const deja = dejaChoisies.includes(convention.id);
      const active = retenue?.id === convention.id;
      return (
        <li key={convention.id}>
          <button
            type="button"
            onClick={() => {
              setRetenue(convention);
              setAjoutTente(false);
            }}
            aria-pressed={active}
            className={`flex w-full items-center justify-between gap-3
                       px-5 min-h-[52px] text-left text-[15px]
                       text-sombre-texte transition-colors ${
                         active ? "bg-sombre-eleve-clair" : survol
                       }`}
          >
            <span className="min-w-0">
              <span className="block truncate">{convention.nom}</span>
              {convention.ville && (
                <span className="block truncate text-[13px] text-sombre-texte-doux">
                  {convention.ville}
                </span>
              )}
            </span>
            {deja && (
              <span aria-hidden="true" className="shrink-0 text-primaire">
                <IconeCocheListe taille={16} />
              </span>
            )}
          </button>
        </li>
      );
    });

  /** LA BARRE FIXE DU BAS — « Convention missing? Let us know », le
      motif de `bandeauStyleManquant` (BlocPortfolio) : sa BOÎTE change
      d'habits selon la surface (pied de plaque au web, bord bas de
      l'écran au doigt), son dedans est écrit une seule fois.
      Le PANNEAU de demande (nom, pays, message) est celui de la
      nº 750, conservé tel quel. */
  const laBarre = (classeBoite: string, classeChamp = "bg-sombre-eleve-clair") => (
    <div className={classeBoite}>
      {demandeEnvoyee && !demandeOuverte ? (
        <p className="text-[13px] leading-relaxed text-sombre-texte">
          We&apos;ll review it shortly — you can save your portfolio and come
          back.
        </p>
      ) : demandeOuverte ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={nomDemande}
            maxLength={80}
            onChange={(evenement) => {
              setNomDemande(evenement.target.value);
              setRefusDemande(null);
            }}
            onKeyDown={(evenement) => {
              //  Entrée envoie — et `prevent`, parce que ce champ vit
              //  DANS le formulaire de la fiche (la leçon nº 122).
              if (evenement.key !== "Enter") return;
              evenement.preventDefault();
              void envoyerLaDemande();
            }}
            placeholder="Convention name"
            aria-label="Convention name"
            aria-invalid={refusDemande ? true : undefined}
            className={`${CHAMP} border-transparent ${classeChamp}`}
          />
          <div>
            <ChampLocalisation
              id="convention-demande-pays"
              etiquette={null}
              texteIndicatif="Country (or a city in it)"
              lieuInitial={paysDemande}
              surChoix={(lieu) => {
                //  ON REMONTE AU PAYS : la personne peut taper une
                //  ville, c'est le pays qu'on retient — et c'est lui
                //  que le champ affiche ensuite. (`paysDuLieu` rend
                //  null quand le lieu EST déjà un pays : on le garde
                //  alors tel quel.)
                setPaysDemande(
                  !lieu
                    ? null
                    : lieu.precision === "pays"
                      ? lieu
                      : (paysDuLieu(lieu) ?? lieu)
                );
                setRefusDemande(null);
              }}
              panneauDansLeFlux={auDoigt}
              opaque
              remonterAuToucher={auDoigt}
              croixEffacement
            />
            {paysDeLaDemande && (
              <p className="mt-2 text-[13px] text-sombre-texte-doux">
                Country: {nomDuPays(paysDeLaDemande)}
              </p>
            )}
          </div>
          <input
            type="text"
            value={messageDemande}
            maxLength={300}
            onChange={(evenement) => setMessageDemande(evenement.target.value)}
            onKeyDown={(evenement) => {
              if (evenement.key !== "Enter") return;
              evenement.preventDefault();
              void envoyerLaDemande();
            }}
            placeholder="Anything to add? (optional)"
            aria-label="Message (optional)"
            className={`${CHAMP} border-transparent ${classeChamp}`}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void envoyerLaDemande()}
              disabled={
                nomDemande.trim().length < 2 ||
                !paysDeLaDemande ||
                envoiDemande
              }
              className="h-11 rounded-lg bg-primaire px-5 text-[14px] font-semibold
                         text-white transition-colors hover:opacity-90
                         active:opacity-90 disabled:bg-sombre-haut-clair
                         disabled:text-sombre-texte-doux disabled:opacity-100
                         disabled:hover:opacity-100"
            >
              {envoiDemande ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDemandeOuverte(false);
                setRefusDemande(null);
              }}
              //  Annuler est une action de retrait : texte brut, jamais
              //  de capsule (règle nº 104).
              className="px-2 min-h-[38px] text-[13.5px] font-semibold
                         text-sombre-texte-doux transition-colors
                         hover:text-sombre-texte"
            >
              Cancel
            </button>
          </div>
          {refusDemande && (
            <p role="alert" className="text-[13px] text-erreur">
              {refusDemande}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRefusDemande(null);
            setDemandeEnvoyee(false);
            setDemandeOuverte(true);
          }}
          className="text-[13px] font-semibold text-sombre-texte-doux
                     underline underline-offset-2 transition-colors
                     hover:text-sombre-texte"
        >
          Convention missing? Let us know
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ---------- LA FENÊTRE DU WEB ----------
          Le gabarit de « Ajouter un style » : voile noir à 25 %, plaque
          `eleve` centrée, filet `haut` sous le titre, liste défilante,
          barre au pied. `mobile:hidden` — au doigt, la page ci-dessous
          prend le relais. */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add a convention"
            className="mobile:hidden fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={surFermer}
              className="absolute inset-0 bg-black/25 cursor-default
                         opacity-100 transition-opacity duration-200 starting:opacity-0"
            />
            <div
              className="relative flex w-full max-w-[420px]
                         max-h-[min(80dvh,640px)] flex-col overflow-hidden
                         rounded-xl bg-sombre-eleve
                         shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between border-b border-sombre-haut pl-5 pr-3 pt-3 pb-3">
                <h2 className="text-[16px] font-bold text-sombre-texte">
                  Add a convention
                </h2>
                <button
                  type="button"
                  onClick={surFermer}
                  aria-label="Fermer"
                  className="flex h-9 w-9 items-center justify-center rounded-full
                             text-sombre-texte-doux transition-colors
                             hover:bg-sombre-eleve-clair hover:text-sombre-texte"
                >
                  <IconeCroix taille={16} />
                </button>
              </div>
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain
                           defilement-visible pb-2"
              >
                {enTeteDuCorps}
                <ul aria-label="Les conventions du pays">
                  {/*  Le survol du cran au-dessus : la plaque est à
                       `eleve`, où l'ancien survol ne se verrait plus
                       (la mesure de la nº 559). */}
                  {lesLignes("hover:bg-sombre-eleve-clair")}
                </ul>
              </div>
              {laBarre(
                "relative z-10 shrink-0 bg-sombre-eleve-clair px-4 py-3",
                "bg-sombre-haut-clair"
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ---------- LA MÊME LISTE, EN PAGE PLEIN ÉCRAN (doigt) ----------
          Le gabarit partagé de la nº 465 (`PagePleinEcranMobile`), celui
          d'« Ajouter un style » : le rond « + » donne son icône au
          titre, la croix et le retour du téléphone rendent le
          formulaire, et la barre du bas se colle à l'écran pendant tout
          le défilement. */}
      <PagePleinEcranMobile
        titre="Add a convention"
        icone={<IconePlus taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Add a convention"
        surFermer={surFermer}
        classeCadre="z-[80]"
        sousLeTitre={
          <div aria-hidden="true" className={`mt-3 h-px ${TRAIT_SEPARATION_FOND}`} />
        }
      >
        <div className="grow">
          {enTeteDuCorps}
          <ul aria-label="Les conventions du pays" className="pb-2">
            {/*  La page du doigt garde le survol par défaut : son fond
                 est celui de la page, rien ne s'y confond. */}
            {lesLignes()}
          </ul>
        </div>
        {laBarre(
          "sticky bottom-0 z-10 shrink-0 bg-sombre-eleve px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        )}
      </PagePleinEcranMobile>
    </>
  );
}
