"use client";

import { useCallback, useEffect, useState } from "react";
import { RechercheFicheInscrite } from "@/components/RechercheFicheInscrite";
import { IconeCroix } from "@/components/Icones";
import { ligneCarte } from "@/lib/adresse";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
//  §1 (nº 718) — la variante d'avatar à servir : la règle de
//  nommage et le repli vivent dans lib/avatar-variantes.
import { AVATAR_PETIT, sourceAvatar } from "@/lib/avatar-variantes";

/**
 * BLOC 12 — UNE AUTRE ADRESSE, QUI EST UNE AUTRE FICHE
 * =====================================================
 * CE QU'IL REMPLACE. Le bloc 1 proposait « + Ajouter un autre studio » :
 * on tapait une adresse de plus, et elle n'existait nulle part
 * ailleurs. Ces adresses n'avaient ni nom de page, ni horaires
 * propres visibles, ni équipe, ni portfolio — des demi-fiches
 * invisibles, que personne ne pouvait trouver en cherchant.
 *
 * CE QU'IL FAIT À LA PLACE. On RATTACHE une autre fiche
 * d'établissement, déjà inscrite sur yokofolio. Chacune garde sa page,
 * son adresse, ses horaires, son équipe ; les deux se citent l'une
 * l'autre. Une enseigne à Lyon et à Bordeaux, c'est deux vraies
 * fiches, pas une fiche et un fantôme.
 *
 * QUI Y A DROIT : les SALONS et les STUDIOS PRIVÉS — toute fiche de
 * lieu. Un artiste n'a pas d'établissement à rattacher : il a des
 * modes d'exercice (bloc 1).
 *
 * ⚠️ LE RATTACHEMENT EST IMMÉDIAT, SANS DEMANDE NI ACCORD. Comme
 * partout ailleurs depuis cette passe : plus aucune validation entre
 * fiches. On clique, c'est lié ; on clique sur la croix, ce n'est plus
 * lié. La réversibilité remplace l'autorisation.
 *
 * ⚠️ LA LIAISON SE RANGE DANS `liaisons_artiste_salon`, avec
 * `origine = 'salon'` et le statut « validee ». La table s'appelle
 * « artiste ↔ salon » pour des raisons d'histoire ; elle relie en
 * réalité DEUX FICHES, et rien dans sa forme n'exige que la première
 * soit un artiste (voir la migration nº 39, qui le consigne).
 */

type FicheLiee = {
  liaisonId: string;
  ficheId: string;
  nom: string;
  ville: string | null;
  /** La photo de profil de la fiche liée — repli sur sa première
      photo de portfolio (passe nº 104) : la pastille ronde ne doit
      jamais rester vide quand la fiche a des images. */
  photo: string | null;
};

export function BlocAutreAdresse({
  ficheId,
  surEnAttente,
}: {
  ficheId: string | null;
  /** LES CHOIX D'AVANT L'ENREGISTREMENT — voir BlocEquipeSalon. */
  surEnAttente?: (fichesIds: string[]) => void;
}) {
  const [liees, setLiees] = useState<FicheLiee[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  //  CE QUI EST CHOISI AVANT QUE LA FICHE EXISTE : gardé ici, affiché
  //  comme le reste, créé en base au premier enregistrement.
  const [enAttente, setEnAttente] = useState<FicheLiee[]>([]);

  const charger = useCallback(async (): Promise<FicheLiee[]> => {
    if (!ficheId) return [];
    const supabase = creerClientSupabaseNavigateur();
    try {
      //  LES DEUX SENS À LA FOIS : cette fiche peut être celle qui a
      //  rattaché, ou celle qu'on a rattachée. Le lien n'a pas de
      //  propriétaire — il se lit des deux côtés.
      const { data } = await supabase
        .from("liaisons_artiste_salon")
        .select("id, artiste_id, salon_id")
        .or(`artiste_id.eq.${ficheId},salon_id.eq.${ficheId}`)
        .eq("origine", "adresse");
      const lignes = (data ?? []) as Array<{
        id: string;
        artiste_id: string;
        salon_id: string;
      }>;
      if (lignes.length === 0) return [];
      const autres = lignes.map((l) =>
        l.artiste_id === ficheId ? l.salon_id : l.artiste_id
      );
      const { data: fiches } = await supabase
        .from("tatoueurs")
        //  ⚠️ RÉGION ET PAYS EN PLUS (passe nº 115) : « Lyon, France »,
        //  pas « Lyon ».
        .select(
          "id, nom, ville_nom, photo_profil, photo_principale, " +
            "region, pays, code_pays"
        )
        .in("id", autres);
      const parId = new Map(
        //  ⚠️ `as unknown as` : la sélection est composée en deux
        //  morceaux, et le typage de Supabase ne sait plus la relire —
        //  même conversion que dans BlocEquipeSalon.
        ((fiches ?? []) as unknown as Array<{
          id: string;
          nom: string;
          ville_nom: string | null;
          photo_profil: string | null;
          photo_principale: string | null;
          region: string | null;
          pays: string | null;
          code_pays: string | null;
        }>).map((f) => [f.id, f])
      );
      return (
        lignes
          .map((ligne) => {
            const autre = ligne.artiste_id === ficheId ? ligne.salon_id : ligne.artiste_id;
            const fiche = parId.get(autre);
            return fiche
              ? {
                  liaisonId: ligne.id,
                  ficheId: autre,
                  nom: fiche.nom,
                  ville: ligneCarte({
                    ville: fiche.ville_nom,
                    region: fiche.region,
                    pays: fiche.pays,
                    code_pays: fiche.code_pays,
                  }),
                  photo: fiche.photo_profil ?? fiche.photo_principale ?? null,
                }
              : null;
          })
          .filter(Boolean) as FicheLiee[]
      );
    } catch {
      //  Une lecture qui échoue laisse la liste vide : le champ de
      //  recherche, lui, reste utilisable.
    }
    return [];
  }, [ficheId]);

  //  LE CHARGEMENT PART D'UN MINUTEUR À ZÉRO, comme dans le bloc
  //  Équipe : poser un état directement depuis un effet est refusé
  //  (react-hooks/set-state-in-effect), et pour une bonne raison — le
  //  rendu ne doit pas dépendre de ce que l'effet vient d'écrire.
  useEffect(() => {
    let abandonne = false;
    const minuteur = setTimeout(async () => {
      const liste = await charger();
      if (abandonne) return;
      setLiees(liste);
      setChargement(false);
    }, 0);
    return () => {
      abandonne = true;
      clearTimeout(minuteur);
    };
  }, [charger, tour]);

  const relire = useCallback(() => setTour((rang) => rang + 1), []);

  useEffect(() => {
    surEnAttente?.(enAttente.map((fiche) => fiche.ficheId));
  }, [enAttente, surEnAttente]);

  async function rattacher(
    autreId: string,
    nom: string,
    ville: string | null,
    photo: string | null
  ) {
    setMessage(null);
    //  PAS ENCORE DE FICHE : on retient, on affiche, on créera après.
    if (!ficheId) {
      setEnAttente((liste) =>
        liste.some((f) => f.ficheId === autreId)
          ? liste
          : [
              ...liste,
              {
                liaisonId: `attente:${autreId}`,
                ficheId: autreId,
                nom,
                ville,
                photo,
              },
            ]
      );
      return;
    }
    const reponse = await fetch("/api/tatoueur/liaison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artisteId: ficheId,
        salonId: autreId,
        origine: "adresse",
      }),
    });
    //  ⚠️ ON REDIT CE QUE LA ROUTE A RÉPONDU, pas une phrase à nous.
    //  Ce bloc affichait « Réessaie » quoi qu'il arrive : pendant la
    //  panne de la passe nº 102, réessayer ne pouvait RIEN changer —
    //  c'est la base qui refusait. Le message de la route distingue
    //  maintenant le refus de propriété de la panne technique ; le
    //  recopier ici, c'est dire la même chose dans les deux blocs.
    const donnees = (await reponse.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
    } | null;
    if (!donnees?.ok) {
      setMessage(
        donnees?.message ??
          "The link couldn't be saved. Try again."
      );
      return;
    }
    //  ⚠️ AUCUN MESSAGE QUAND ÇA MARCHE (passe nº 103) : la fiche
    //  rattachée apparaît dans la liste, c'est LA confirmation.
    relire();
  }

  async function detacher(liaisonId: string) {
    setMessage(null);
    if (liaisonId.startsWith("attente:")) {
      setEnAttente((liste) => liste.filter((f) => f.liaisonId !== liaisonId));
      return;
    }
    await fetch(`/api/tatoueur/liaison?id=${encodeURIComponent(liaisonId)}`, {
      method: "DELETE",
    });
    relire();
  }



  //  CE QUI EST EN BASE, OU CE QUI ATTEND — même affichage.
  const toutes = ficheId ? liees : enAttente;

  return (
    <div className="flex flex-col gap-4">
      <RechercheFicheInscrite
        id="autre-adresse-recherche"
        type="salon"
        //  ⚠️ LES DEUX TEXTES ONT ÉTÉ REFORMULÉS (passe nº 107) :
        //  « studio » AVANT « salon » (l'ordre du sélecteur du bloc 1),
        //  « privé » retiré (le mode s'appelle « En studio » depuis la
        //  passe nº 105), et une VRAIE question — « est-il sur… » —
        //  comme partout ailleurs dans le formulaire.
        etiquette="Is your studio / shop on YokoFolio?"
        //  ⚠️ « Recherche un nom » (passe nº 108) : le titre juste
        //  au-dessus dit DÉJÀ ce qu'on cherche — un studio, un salon.
        //  Le fantôme du champ n'a plus qu'à dire COMMENT le chercher,
        //  et le redire deux fois à deux centimètres d'écart était du
        //  bruit.
        texteIndicatif="Search a name"
        choisie={null}
        surChoix={(fiche) => {
          if (fiche)
            void rattacher(
              fiche.id,
              fiche.nom,
              fiche.ville_nom ?? null,
              fiche.photo_profil ?? null
            );
        }}
        //  NI SOI-MÊME, NI CE QUI EST DÉJÀ RATTACHÉ.
        exclure={[ficheId ?? "", ...toutes.map((l) => l.ficheId)].filter(Boolean)}
        libelleExclu="Already linked"
        //  LES DEUX NATURES DE LIEU sont acceptées ici — on rattache
        //  une autre adresse, salon ou studio (passe nº 121).
        messageVide="No studio / shop found"
      />

      {/* LE MESSAGE NE PORTE PLUS QUE DES ERREURS (passe nº 103). */}
      {message && (
        <p role="status" className="text-[13px] leading-relaxed text-erreur">
          {message}
        </p>
      )}

      {chargement && ficheId ? (
        <p className="text-[13px] text-sombre-texte-doux">Loading…</p>
      ) : toutes.length === 0 ? (
        /* ⚠️ PLUS DE PAVÉ « Aucune autre adresse pour l'instant… »
           (passe nº 101). Trois lignes en pointillés pour dire qu'il
           n'y a rien : le champ de recherche juste au-dessus pose déjà
           la question, et sa réponse est facultative. */
        null
      ) : (
        /* DES LIGNES, PLUS DES CARTES (passe nº 103) : un filet entre
           deux suffit dans un bloc déjà encadré. */
        <ul className="flex flex-col divide-y divide-sombre-bordure/60">
          {toutes.map((fiche) => (
            <li
              key={fiche.liaisonId}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              {/* LA PHOTO RONDE — rétablie à la passe nº 104 : la
                  liste avait perdu son emplacement, et le nom se
                  tassait sur une ligne avec la localité. Même rangée
                  que l'équipe : portrait, nom, localité dessous. */}
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center
                           overflow-hidden rounded-full bg-sombre-eleve"
              >
                {fiche.photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element --
                     photo déposée par la fiche, servie telle quelle. */
                  <img
                    //  §1 (nº 718) — la petite variante (rond de 40).
                    src={sourceAvatar(fiche.photo, AVATAR_PETIT)}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-[14px] font-bold text-sombre-texte-doux"
                  >
                    {fiche.nom.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              {/* ⚠️ LE NOM SEUL, CENTRÉ (passe nº 121) : la localité
                  s'affichait dessous — elle a servi À CHOISIR la
                  fiche, dans la liste de résultats, et n'apprend plus
                  rien une fois le rattachement fait. */}
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-sombre-texte">
                {fiche.nom}
              </span>
              <button
                type="button"
                onClick={() => void detacher(fiche.liaisonId)}
                aria-label={`Unlink ${fiche.nom}`}
                className="grid h-11 w-11 place-items-center rounded-full
                           text-sombre-texte-doux transition-colors
                           hover:text-sombre-texte"
              >
                <IconeCroix classe="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
