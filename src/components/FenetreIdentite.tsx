"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { IconeCroix, IconeSilhouette } from "@/components/Icones";
import {
  ChampNomIdentite,
  ChampPhotoRonde,
  type PhotoCadree,
} from "@/components/ChampsIdentite";
//  §6 (nº 662) — `CLASSE_ENCADRE_FENETRE` n'est plus importé : l'encadré
//  qui entourait la photo et le nom a disparu des DEUX surfaces.
import {
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
//  §1 (nº 721) — la durée de validité des photos déposées (écriture
//  unique : lib/cache-photos).
import { ENVOI_PHOTO } from "@/lib/cache-photos";
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
 * CE QU'ELLE REMPLACE : la ligne « Éditer » de la tête de « Mon
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
 * n'existe que pour un compte SANS portfolio (la branche « Éditer »
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
  /*  §2 (nº 674) — PLUS D'ÉPARGNE AUTOUR DE LA ZONE DU COMPTE : le trou
      du voile est un RECTANGLE aux dimensions du bloc, et il produisait
      le « carré plus clair » que le propriétaire relève au clic sur
      l'avatar. Cette surface-ci part de la MÊME zone que « Mon compte »
      (`ancre`), donc du même trou. La raison d'épargner ne vaut que
      pour ce qu'on lit ou écrit pendant qu'une surface est ouverte ; ce
      n'est pas le cas ici. Le raisonnement complet est chez MenuEspace.
      ⚠️ `ancre` RESTE PASSÉE AILLEURS : c'est elle qui place le menu
      sous le bouton. Seul le voile cesse de la lire. */
  useVoileDeLaPage(Boolean(ancre));

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
      en vol laisserait la personne sans savoir si son nom est parti.

      ██ §1 (nº 666) — NI PENDANT UN RECADRAGE, ET C'ÉTAIT LE DÉFAUT ██
      ------------------------------------------------------------------
      LE SYMPTÔME DU PROPRIÉTAIRE : au web, la photo s'affichait bien
      dans le recadreur, et AU PREMIER CLIC pour la redimensionner tout
      disparaissait.
      LA CAUSE, ET ELLE TIENT EN UNE LIGNE : depuis la nº 658, le
      recadreur est monté PAR PORTAIL dans le corps du document — c'est
      ce qui l'a réparé au doigt, où un `fixed` enfermé dans une page
      recalée se posait n'importe où. Mais un portail déplace le nœud
      DU DOM tout en gardant sa place dans l'arbre REACT : ce test-ci
      n'écoute pas React, il écoute le `mousedown` du DOCUMENT et
      demande au panneau s'il CONTIENT la cible. Le recadreur n'est pas
      dedans — il est frère du panneau, dans `document.body`. Chaque
      clic sur le zoom, chaque prise pour recentrer, était donc lu comme
      un clic « à côté » : cette fenêtre se fermait, emportant
      `ChampPhotoRonde`, le portail et le recadrage en cours.
      LE REMÈDE EST CELUI QUI EXISTE DÉJÀ À DEUX LIGNES D'ICI : la garde
      `recadrageOuvert` que l'écoute d'Échap porte depuis la nº 657, et
      pour exactement la même raison — quand le recadreur est là, il
      possède l'écran, et cette fenêtre-ci se tait. Pas un second
      mécanisme : le même, sur les deux écoutes.
      ⚠️ ON NE PERD AUCUN GESTE : le recadreur est `fixed inset-0`, il
      couvre tout. Tant qu'il est ouvert, il n'existe pas de « à côté »
      où cliquer — le seul clic possible est sur lui.
      ⚠️ ET LE COMPORTEMENT DE LA nº 662 EST INTACT : « Annuler » passe
      toujours par `annulerLeRecadrage`, qui efface l'original. Rien de
      cette passe ne touche à la fermeture du recadreur. */
  useEffect(() => {
    if (auDoigt || !ancre || enCours || recadrageOuvert) return;
    function auPointeur(evenement: MouseEvent) {
      if (panneauWeb.current?.contains(evenement.target as Node)) return;
      surFermeture();
    }
    document.addEventListener("mousedown", auPointeur);
    return () => document.removeEventListener("mousedown", auPointeur);
  }, [auDoigt, ancre, enCours, recadrageOuvert, surFermeture]);

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
          .upload(chemin, fichier, ENVOI_PHOTO);
        if (error) {
          throw new Error(
            `Your photo couldn't be uploaded (${error.message}).`
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
          : "Saving failed. Try again in a moment."
      );
      setEnCours(false);
    }
  }

  /*  ██ §6 (nº 662) — L'ENCADRÉ TOMBE DES DEUX CÔTÉS ██
      ==================================================================
      LA nº 658 L'AVAIT RETIRÉ AU WEB SEULEMENT, et j'avais expliqué
      pourquoi le doigt gardait le sien : « ce qui reste propre à chaque
      plan, ce sont les boîtes ». Le propriétaire tranche autrement —
      « au mobile : même apparence qu'au web » — et c'est plus simple :
      un seul dessin pour les deux surfaces, plus de branche du tout.
      CE QUE ÇA DONNE, ET C'EST ARITHMÉTIQUE. La boîte posait
      `p-4` — SEIZE pixels — À L'INTÉRIEUR de la colonne : le champ
      commençait donc à 36 px du bord au web (20 + 16) et à 32 au doigt
      (16 + 16), et le disque de la photo aussi. Sans elle, les deux
      repartent de la marge de la colonne — vingt au web, seize au
      doigt —, comme le titre et le bouton. Le champ gagne 32 px de
      largeur de chaque côté.
      ⚠️ L'ÉCART ENTRE LA PHOTO ET LE CHAMP NE CHANGE PAS (`gap-4`,
      16 px) : seule la boîte autour s'en va.
      ⚠️ ET `surface` NE SERT PLUS QU'À L'IDENTIFIANT DU CHAMP : les
      deux habillages sont rendus ensemble (l'un caché), et deux
      `id` identiques dans un même document seraient une faute.

      ██ §4 (nº 658) — « ENREGISTRER » N'EST PLUS ROSE, NI TOUT ROND ██
      ------------------------------------------------------------------
      LE ROSE PLEIN EST L'ACTION FINALE D'UNE PAGE (charte nº 217-§7),
      et la nº 657 l'avait pris pour cette raison. Le propriétaire le
      veut NEUTRE : le bouton prend l'écriture des plaques cliquables
      du site (nº 502) — `eleve` au repos, `eleve-clair` au survol ET
      à l'appui, le texte en blanc de charte. C'est exactement ce que
      portent les tuiles de « Mon compte ».
      ET LES CÔTÉS RONDS DEVIENNENT DES ANGLES : `rounded-full` →
      `rounded-xl`, le rayon des encadrés et des lignes de ces
      fenêtres. Aucun rayon nouveau.
      ⚠️ LA HAUTEUR NE BOUGE PAS (54 px), ni la graisse, ni le corps de
      15,5 px : la consigne ne vise que la forme et la couleur. */
  const contenu = (surface: "web" | "doigt") => (
    <>
      <div className="flex flex-col gap-4">
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
          indication="Your name"
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
        className="inline-flex items-center justify-center rounded-xl
                   min-h-[54px] bg-sombre-eleve
                   hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair
                   text-sombre-texte font-semibold text-[15.5px] transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {enCours ? "Saving…" : "Save"}
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
          aria-label="Edit my account"
          data-source-composant="FenetreIdentite · web window"
          className="mobile:hidden"
        >
          {/*  ██ §6 (nº 662) — LE TRAIT S'EN VA, LE TITRE DESCEND DANS
               LA COLONNE ██
               ==========================================================
               EXACTEMENT CE QUE « LANGUE » A REÇU À LA nº 658, et pour
               la même raison : le propriétaire ne veut pas de ce trait,
               et veut le contenu plus haut. Le titre entre DANS la
               colonne, comme la tête de « Mon compte », et c'est le
               `gap-3` de la colonne qui l'en sépare.
               L'AIR RÉCUPÉRÉ SE CHIFFRE : entre le mot et la photo il y
               avait 16 px (le bas de la barre) plus 20 px (le haut de
               la colonne) = TRENTE-SIX. Il y en a désormais 8 (`mb-2`)
               plus 12 (`gap-3`) = VINGT — la règle de la tête de « Mon
               compte » (nº 641-§2), qui veut l'air sous le titre égal à
               l'air au-dessus. Le contenu remonte donc de SEIZE pixels.
               ██ §3 (nº 662) — « ÉDITER », ET SON ICÔNE AU WEB ██
               Le mot change (« Modifier » jusqu'ici) et la silhouette
               vient se poser devant lui, « comme au mobile » : c'est
               l'écriture des titres de ces fenêtres — rang 20, blanc à
               80 %, 10 px d'écart au mot —, la même que la cloche de
               « Notifications » et le globe de « Langue ».
               ⚠️ LA CROIX NE BOUGE NI DE RANG NI DE PLACE : compensée
               de −9 px, soit (36 − 18) / 2, l'écart entre sa cible et
               son dessin (règle nº 483). Son glyphe reste à 20 px du
               bord droit, et le titre à 20 px du gauche : les deux
               vivent maintenant dans le `p-5` de la colonne au lieu du
               `px-5` de la barre — le même nombre. */}
          <div className="flex flex-col gap-3 p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <IconeSilhouette
                taille={20}
                classe="shrink-0 text-sombre-texte/80"
              />
              <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
                Edit
              </h2>
              <button
                type="button"
                onClick={surFermeture}
                aria-label="Close"
                className="-mr-[9px] w-9 h-9 shrink-0 flex items-center justify-center
                           rounded-full text-sombre-texte-doux
                           hover:text-sombre-texte hover:bg-sombre-eleve
                           transition-colors"
              >
                <IconeCroix taille={18} />
              </button>
            </div>
            {contenu("web")}
          </div>
        </MenuDeVerre>
      )}

      {/*  LE DOIGT — la page plein écran (§4, nº 465), avec les airs de
           « Mon compte » sur cet appareil : `px-4` sur les côtés,
           `pt-5` en haut, `gap-3` entre les boîtes, et sa réserve basse
           de 72 px (la barre translucide de Safari, nº 533-§6 — cette
           page finit elle aussi sur du gris). */}
      <PagePleinEcranMobile
        titre="Edit"
        icone={<IconeSilhouette taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Edit my account"
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
