"use client";

import Link from "next/link";
import { useState } from "react";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

/**
 * LE PIED DE COMPTE — la gestion du compte, discrète
 * ===================================================
 * La page « Tu es connecté » n'existe plus : le compte se gère là où
 * l'on travaille, en bas du formulaire de fiche et de l'écran d'état.
 * Deux petits liens sobres :
 *  - « Me déconnecter » — la session s'efface, et la page du compte
 *    mène alors à l'écran de connexion (nº 133). Quand l'espace tatoueur
 *    porte déjà la déconnexion dans SON menu (`sansDeconnexion`), ce
 *    lien s'efface d'ici — une seule sortie à la fois ;
 *  - « Supprimer » — un LIEN vers la page Sécurité, et non
 *    plus une fenêtre de confirmation d'ici.
 *
 * POURQUOI CE RENVOI : un compte gère désormais PLUSIEURS FICHES, et
 * l'on peut vouloir n'en supprimer qu'une. Les deux gestes — une
 * fiche, ou le compte entier — vivent donc au même endroit, côte à
 * côte, dans Sécurité (voir BlocSuppressions). Deux fenêtres
 * de suppression dans deux écrans différents, c'était la meilleure
 * façon d'en voir une se démoder sans que personne ne s'en aperçoive.
 */
export function PiedDeCompte({
  sansDeconnexion = false,
}: {
  /** Vrai quand le menu de l'espace porte déjà la déconnexion. */
  sansDeconnexion?: boolean;
} = {}) {
  const [enCours, setEnCours] = useState(false);

  async function deconnecter() {
    setEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      await supabase.auth.signOut();
    } catch {
      // Serveur injoignable : l'état local est déjà le bon juge.
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div
      className="mt-12 pt-5 border-t border-sombre-bordure
                 flex items-center justify-center gap-6"
    >
      {!sansDeconnexion && (
        <button
          type="button"
          onClick={deconnecter}
          disabled={enCours}
          className="text-[13px] text-sombre-texte-doux underline
                     underline-offset-4 hover:text-primaire
                     transition-colors disabled:opacity-60"
        >
          {enCours ? "Un instant…" : "Me déconnecter"}
        </button>
      )}
      <Link
        href="/devenir-tatoueur/securite"
        className="text-[13px] text-sombre-texte-doux underline
                   underline-offset-4 hover:text-erreur transition-colors"
      >
        Supprimer un portfolio ou mon compte
      </Link>
    </div>
  );
}
