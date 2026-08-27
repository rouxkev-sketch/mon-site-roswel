"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { IconeCroix, IconeSilhouette } from "@/components/Icones";
import {
  ChampNomIdentite,
  ChampPhotoRonde,
  type PhotoCadree,
} from "@/components/ChampsIdentite";
import {
  CLASSE_ENCADRE_FENETRE,
  LARGEUR_FENETRE_BARRE,
  MenuDeVerre,
} from "@/components/SurfaceDeVerre";
//  §1 (nº 650) — l'alignement des menus ancrés aux boutons ronds de la
//  barre, calculé là où vit la règle de placement.
import { ALIGNEMENT_BOUTON_ROND_BARRE } from "@/components/placement-menu";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
//  §4 (nº 465) — au doigt, l'écran devient une PAGE plein écran.
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
import { useAppareilMobile } from "@/lib/appareil";
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import {
  avatarDuCompte,
  nomDuCompte,
  rangerLIdentiteDuCompte,
} from "@/lib/avatar-du-compte";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { useUtilisateur } from "@/lib/use-utilisateur";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";

/** Le bucket des photos, celui de la migration SQL — le même que le
    formulaire de portfolio emploie, et le même dossier par compte. */
const BUCKET_PHOTOS = "photos-tatoueurs";

/**
 * ██ §1 (nº 657) — « MODIFIER » : LE NOM ET LA PHOTO D'UN PARTICULIER ██
 * ==================================================================
 * CE QU'ELLE REMPLACE : la ligne « Modifier » de la tête de « Mon
 * compte » (nº 649) était un VRAI bouton — focusable, qui s'éclaircit
 * sous le pointeur — mais sans `onClick` : « le jour où la fenêtre
 * existera, elle s'accrochera ici en une ligne », disait sa note. Ce
 * jour est venu, et c'est exactement ce qui a été fait.
 *
 * OÙ ELLE S'OUVRE : à la place des trois autres fenêtres de la barre
 * — « Mon compte » (nº 650), « Langue » et « Notifications » (nº 655).
 * Même mécanisme (`MenuDeVerre` ancré sous l'avatar), même largeur
 * (`LARGEUR_FENETRE_BARRE`), même décalage d'alignement, même barre de
 * titre, même croix. Aucun nombre n'est écrit ici.
 *
 * CE QU'ELLE DEMANDE, ET RIEN DE PLUS : une photo et un nom — les deux
 * morceaux que la création de portfolio demande en tête de son bloc
 * « Profil », et LE MÊME CODE (`ChampPhotoRonde`, `ChampNomIdentite`,
 * components/ChampsIdentite). Pas une imitation : ces deux composants
 * sont sortis de `FormulaireFiche` à cette passe, et les deux écrans
 * les montent.
 *
 * OÙ ÇA SE RANGE, ET POURQUOI LÀ. Le nom et la photo vont dans
 * `user_metadata` — donc dans le COOKIE de session, que le serveur ET
 * le navigateur lisent sans une requête (`lib/use-utilisateur`). C'est
 * la voie B de la nº 644, retenue par le propriétaire à la nº 645 :
 * l'avatar de la barre fixe et la tête de « Mon compte » les affichent
 * DÈS LE PREMIER RENDU, sans clignoter, sans lecture authentifiée de
 * plus. Aucune table n'est touchée ; seule la PHOTO passe par le
 * stockage, dans le dossier du compte (`photos-tatoueurs/<id>/…`) —
 * celui-là même que la politique d'écriture ouvre à tout compte
 * connecté, pas seulement aux tatoueurs (migration
 * `yokofolio-fiches-tatoueurs.sql`, « depot dans son propre dossier »).
 *
 * ⚠️ ELLE NE S'ADRESSE QU'À UN PARTICULIER : la ligne qui l'ouvre
 * n'existe que pour un compte SANS portfolio (la branche « Modifier »
 * de `enTeteDuCompte`, MenuEspace). Un compte avec portfolio garde son
 * nom et sa photo dans SA FICHE, et rien ne change pour lui.
 * ⚠️ ET L'EFFET QUI RECOPIE LA PHOTO DU PORTFOLIO SE TAIT POUR LUI :
 * voir la garde posée chez MenuEspace — sans elle, ouvrir « Mon
 * compte » effacerait la photo que le particulier vient d'enregistrer.
 */
export function FenetreIdentite({
  ancre,
  surFermeture,
}: {
  /** §1 (nº 655) — le bloc sous lequel le menu du WEB se pose : la
      zone du compte, celle que les trois autres fenêtres reçoivent. */
  ancre?: RefObject<HTMLElement | null>;
  surFermeture: () => void;
}) {
  const { utilisateur } = useUtilisateur();
  /** La page du doigt — le piège de focus s'y accroche là-bas. */
  const plaque = useRef<HTMLDivElement>(null);
  /** Le panneau du web — le test « dedans » du clic à côté (le menu
      vit dans le corps du document, nº 238-§4). */
  const panneauWeb = useRef<HTMLDivElement>(null);

  /*  LA SAISIE PART DE CE QUE LA SESSION PORTE DÉJÀ — et une seule
      fois : les valeurs initiales d'un `useState` ne sont lues qu'au
      montage. C'est ce qu'il faut ici, sans quoi l'écriture de la
      session (qui fait émettre `USER_UPDATED`) reviendrait écraser la
      saisie en cours. */
  const [nom, setNom] = useState(() => nomDuCompte(utilisateur) ?? "");
  const [apercu, setApercu] = useState(() => avatarDuCompte(utilisateur) ?? "");
  /** Le fichier cadré, à envoyer. `null` : la photo n'a pas changé. */
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  /** §1 (nº 657) — LE RECADREUR EST-IL OUVERT ? Il couvre l'écran
      par-dessus cette fenêtre : Échap lui appartient alors, et cette
      fenêtre-ci doit se taire (la garde de la nº 465, transposée). */
  const [recadrageOuvert, setRecadrageOuvert] = useState(false);

  const auDoigt = useAppareilMobile();
  useEtapeQuiSeReferme(auDoigt, surFermeture);

  /*  §1 (nº 655) — L'ASSOMBRISSEMENT DE LA PAGE, le mécanisme des
      autres fenêtres de la barre : il épargne le bloc d'où la surface
      est partie, et sort de lui-même au doigt. */
  useVoileDeLaPage(Boolean(ancre), ancre);

  /*  LA PAGE NE DÉFILE PLUS DERRIÈRE — le VERROU COMPTÉ (nº 469) :
      cette fenêtre s'EMPILE sur « Mon compte » au doigt, comme
      « Langue » et « Notifications ».
      ⚠️ IL VIT DANS SON PROPRE EFFET, SANS AUCUNE DÉPENDANCE, et c'est
      voulu : posé une fois au montage, retiré une fois au démontage.
      Le partager avec l'écoute d'Échap ci-dessous l'aurait fait
      retirer puis reposer à chaque changement de la garde — le compte
      retomberait à zéro l'espace d'une image, et la page reprendrait
      son défilement sous les doigts. */
  useEffect(() => {
    poserLeVerrouDeDefilement();
    return () => retirerLeVerrouDeDefilement();
  }, []);

  //  Échap ferme.
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      //  Le recadreur a le sien : sans cette garde, une seule touche
      //  fermerait les deux et le cadrage en cours serait perdu.
      if (recadrageOuvert) return;
      if (evenement.key === "Escape") surFermeture();
    }
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [recadrageOuvert, surFermeture]);

  /*  §1 (nº 655) — LE CLIC À CÔTÉ REFERME, AU WEB : l'écriture des
      trois autres fenêtres de la barre, au caractère.
      ⚠️ LE TEST PORTE SUR LE PANNEAU, pas sur l'ancre : la plaque est
      dans le corps du document, donc « hors de l'ancre » pour
      n'importe quel test naïf.
      ⚠️ AU DOIGT, JAMAIS : la page couvre tout l'écran, et un appui sur
      son titre passerait pour un clic « à côté ».
      ⚠️ ET JAMAIS PENDANT UN ENREGISTREMENT : fermer sous une requête
      en vol laisserait la personne sans savoir si son nom est parti. */
  useEffect(() => {
    if (auDoigt || !ancre || enCours) return;
    function auPointeur(evenement: MouseEvent) {
      if (panneauWeb.current?.contains(evenement.target as Node)) return;
      surFermeture();
    }
    document.addEventListener("mousedown", auPointeur);
    return () => document.removeEventListener("mousedown", auPointeur);
  }, [auDoigt, ancre, enCours, surFermeture]);

  /** La photo cadrée remplace l'aperçu — et libère le précédent s'il
      était local (une adresse `blob:` retient l'image en mémoire). */
  function photoCadree(photo: PhotoCadree) {
    setErreur(null);
    setFichier(photo.fichier);
    setApercu((courant) => {
      if (courant.startsWith("blob:")) URL.revokeObjectURL(courant);
      return photo.apercu;
    });
  }

  /**
   * ENREGISTRER — au plus deux requêtes, et la seconde seule est
   * obligatoire : le stockage si la photo a changé, puis la session.
   * ⚠️ L'ORDRE COMPTE : la photo part d'abord, et son adresse entre
   * dans la session avec le nom. Écrire la session avant l'envoi
   * laisserait une adresse qui ne pointe sur rien.
   */
  async function enregistrer() {
    if (enCours || !utilisateur) return;
    setEnCours(true);
    setErreur(null);
    try {
      const supabase = creerClientSupabaseNavigateur();
      let adresse = apercu.startsWith("blob:") ? "" : apercu;
      if (fichier) {
        const chemin = `${utilisateur.id}/profil-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET_PHOTOS)
          .upload(chemin, fichier, { upsert: true });
        if (error) {
          throw new Error(
            `Ta photo n'a pas pu être envoyée (${error.message}).`
          );
        }
        adresse = supabase.storage.from(BUCKET_PHOTOS).getPublicUrl(chemin).data
          .publicUrl;
      }
      await rangerLIdentiteDuCompte(supabase, {
        nom,
        photo: adresse || null,
      });
      surFermeture();
    } catch (souci) {
      setErreur(
        souci instanceof Error
          ? souci.message
          : "L'enregistrement n'a pas abouti. Réessaie dans un instant."
      );
      setEnCours(false);
    }
  }

  /*  LE CONTENU, ÉCRIT UNE FOIS pour les deux habillages : un encadré
      (celui de « Mon compte », partagé) qui tient la photo et le nom,
      le reproche s'il y en a un, puis le bouton d'enregistrement.
      ⚠️ LE ROSE PLEIN EST POUR L'ACTION FINALE D'UNE SURFACE (charte
      nº 217-§7) : c'est bien le cas ici — ce bouton conclut la
      fenêtre. Son écriture est celle du bouton d'envoi du formulaire
      de portfolio, reprise au caractère. */
  const contenu = (surface: "web" | "doigt") => (
    <>
      <div className={`flex flex-col gap-4 p-4 ${CLASSE_ENCADRE_FENETRE}`}>
        <ChampPhotoRonde
          apercu={apercu}
          surPhoto={photoCadree}
          surErreur={setErreur}
          surRecadrage={setRecadrageOuvert}
        />
        <ChampNomIdentite
          id={`identite-nom-${surface}`}
          valeur={nom}
          surChangement={setNom}
          indication="Ton nom"
        />
      </div>
      {erreur && (
        <p role="alert" className="text-[13px] text-erreur">
          {erreur}
        </p>
      )}
      <button
        type="button"
        onClick={enregistrer}
        disabled={enCours}
        className="inline-flex items-center justify-center rounded-full
                   min-h-[54px] bg-primaire hover:bg-primaire-fonce
                   text-white font-semibold text-[15.5px] transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </>
  );

  return (
    <>
      {/*  LE WEB — le menu ancré sous l'avatar, aux réglages des trois
           autres fenêtres de la barre (nº 650, nº 655). */}
      {ancre && (
        <MenuDeVerre
          ouvert
          ancre={ancre}
          refPanneau={panneauWeb}
          largeur={LARGEUR_FENETRE_BARRE}
          decalageHaut={ALIGNEMENT_BOUTON_ROND_BARRE}
          opaque
          alignement="droite"
          role="dialog"
          aria-label="Modifier mon compte"
          data-source-composant="FenetreIdentite · fenêtre web"
          className="mobile:hidden"
        >
          {/*  LA BARRE DU TITRE — celle de « Langue » et de
               « Notifications », au caractère : 20 px sur les côtés, le
               titre à 17 px gras, le trait d'un bord à l'autre, et la
               croix compensée de −9 px — (36 − 18) / 2, l'écart entre
               sa cible et son dessin (règle nº 483). */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-sombre-bordure/60">
            <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
              Modifier
            </h2>
            <button
              type="button"
              onClick={surFermeture}
              aria-label="Fermer"
              className="-mr-[9px] w-9 h-9 shrink-0 flex items-center justify-center
                         rounded-full text-sombre-texte-doux
                         hover:text-sombre-texte hover:bg-sombre-eleve
                         transition-colors"
            >
              <IconeCroix taille={18} />
            </button>
          </div>
          <div className="flex flex-col gap-3 p-5">{contenu("web")}</div>
        </MenuDeVerre>
      )}

      {/*  LE DOIGT — la page plein écran (§4, nº 465), avec les airs de
           « Mon compte » sur cet appareil : `px-4` sur les côtés,
           `pt-5` en haut, `gap-3` entre les boîtes, et sa réserve basse
           de 72 px (la barre translucide de Safari, nº 533-§6 — cette
           page finit elle aussi sur du gris). */}
      <PagePleinEcranMobile
        titre="Modifier"
        icone={<IconeSilhouette taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Modifier mon compte"
        surFermer={surFermeture}
        classeCadre="z-[85]"
      >
        <div
          ref={plaque}
          className="grow flex flex-col gap-3 px-4 pt-5
                     pb-[max(4.5rem,env(safe-area-inset-bottom))]"
        >
          {contenu("doigt")}
        </div>
      </PagePleinEcranMobile>
    </>
  );
}
