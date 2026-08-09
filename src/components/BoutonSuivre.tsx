"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  amorcer,
  definir,
  ecrireFavori,
  estIdentifiantDeBase,
  reprendreLeGeste,
  retenirLeGeste,
  useEtatFavori,
  versLaConnexion,
} from "@/lib/favoris-yokofolio";

/**
 * « SUIVRE » / « SUIVI » — le bouton de la fiche
 * ===============================================
 * UN SEUL BOUTON, DEUX ÉTATS, et le libellé dit lequel : « Suivre »
 * tant qu'on ne suit pas, « Suivi » une fois que c'est fait.
 *
 * SON HABILLAGE SUIT LA CHARTE DES BOUTONS INTERMÉDIAIRES : capsule
 * naturelle, fond qui s'éclaircit au survol, aucun contour. Il ne
 * prend PAS le rose plein — ce n'est pas l'action finale de la fiche,
 * et le rose y est déjà pris par les deux badges de réseaux. Suivi, il
 * s'éclaircit d'un cran et son texte passe au rose : l'état d'un
 * objet, l'un des emplois réservés de la couleur.
 *
 * ⚠️ SA PLACE EST LIBRE (la fiche sera refaite) : il se pose là où le
 * parent le met. Il ne suppose donc aucune largeur, et sait vivre en
 * pleine largeur comme dans une rangée.
 *
 * PAS CONNECTÉ ? Même règle que le cœur : on mène à la connexion en
 * gardant la page (`?suite=`) ET le geste, rejoué au retour.
 */
export function BoutonSuivre({
  tatoueurId,
  nomTatoueur,
  suiviAuDepart = false,
  pleineLargeur = false,
}: {
  tatoueurId: string;
  nomTatoueur: string;
  suiviAuDepart?: boolean;
  pleineLargeur?: boolean;
}) {
  const router = useRouter();
  const { utilisateur, pret } = useUtilisateur();
  amorcer("tatoueur", tatoueurId, suiviAuDepart);
  const suivi = useEtatFavori("tatoueur", tatoueurId, suiviAuDepart);
  const dejaRejoue = useRef(false);

  /** Le geste repris après la connexion — une seule fois. */
  useEffect(() => {
    if (!pret || !utilisateur || dejaRejoue.current) return;
    if (!reprendreLeGeste("tatoueur", tatoueurId)) return;
    dejaRejoue.current = true;
    definir("tatoueur", tatoueurId, true);
    void ecrireFavori("tatoueur", tatoueurId, true);
  }, [pret, utilisateur, tatoueurId]);

  function basculer() {
    if (!utilisateur) {
      retenirLeGeste({ genre: "tatoueur", id: tatoueurId });
      router.push(versLaConnexion());
      return;
    }
    const suivant = !suivi;
    definir("tatoueur", tatoueurId, suivant);
    void ecrireFavori("tatoueur", tatoueurId, suivant).then((ok) => {
      if (!ok) definir("tatoueur", tatoueurId, !suivant);
    });
  }

  //  ⚠️ APRÈS LES HOOKS. Une fiche de DÉMONSTRATION n'existe pas en
  //  base (son identifiant est « demo-01 ») : on ne peut pas la
  //  suivre, le bouton ne s'affiche donc pas plutôt que d'échouer
  //  sous le doigt.
  if (!estIdentifiantDeBase(tatoueurId)) return null;

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={suivi}
      aria-label={
        suivi ? `Ne plus suivre ${nomTatoueur}` : `Suivre ${nomTatoueur}`
      }
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full
                  px-6 text-[14.5px] font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${
                    pleineLargeur ? "w-full" : ""
                  } ${
                    suivi
                      ? "bg-sombre-eleve-clair text-primaire hover:bg-sombre-bordure"
                      : "bg-sombre-eleve text-sombre-texte hover:bg-sombre-eleve-clair"
                  }`}
    >
      {suivi ? "Suivi" : "Suivre"}
    </button>
  );
}
