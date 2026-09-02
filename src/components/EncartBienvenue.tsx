"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { clientSupabaseALaDemande } from "@/lib/supabase/client-a-la-demande";
import { doitMontrerLaBienvenue, marquerLaBienvenueVue } from "@/lib/bienvenue";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * ██ nº 817 — « WELCOME TO YOKOFOLIO », L'ENCART DU PREMIER PASSAGE ██
 * ==================================================================
 * OÙ, ET POURQUOI LÀ. Un compte neuf arrive sur « Ma sélection »
 * (ARRIVEE_SANS_PORTFOLIO — la seule arrivée, nº 313), c'est-à-dire
 * sur ses favoris VIDES : la page ne disait rien. L'encart est posé en
 * tête de cette page, DANS la page — pas une page de plus, pas une
 * fenêtre par-dessus :
 *  · une PAGE DÉDIÉE ajouterait une étape entre la validation et le
 *    site (le « tunnel » que le propriétaire refuse), et un retour
 *    arrière y ramènerait ;
 *  · une FENÊTRE interrompt — il faut la fermer avant de voir la page,
 *    et au doigt elle couvre tout ;
 *  · l'ENCART, lui, remplit l'écran vide avec ce qu'il manquait, se lit
 *    sans geste, et la page reste la page. Il s'ignore d'un
 *    défilement, et il ne revient pas.
 * La forme est celle de l'écran vide de la sélection (la boîte
 * `rounded-2xl bg-sombre-carte`, nº 643) et les deux gestes sont ceux
 * de la page About (nº 798) — le rouge pour « Find your style », le
 * gris pour « Create your portfolio » — aux mêmes mesures (40 px,
 * 14 px). Le mot du second bouton vient de la config
 * (`lienCreerPortfolio`), comme partout.
 *
 * UNE SEULE FOIS : la décision est prise UNE FOIS, dès que la session
 * est connue, d'après le drapeau (lib/bienvenue, qui dit la règle et
 * le cas Google) ; l'encart marque ensuite le compte (« vue ») — la
 * session est réémise, mais l'encart, lui, ne relit pas sa décision :
 * il reste jusqu'au prochain passage, où il ne sera plus là. Un compte
 * d'avant la nº 817 ne le voit jamais.
 *
 * ⚠️ QUAND LA SESSION EST CONNUE, ET C'EST LE POINT. « Ma sélection »
 * est dynamique, mais l'habillage ne lit la session au serveur que si
 * le cookie « déjà connecté » est là (nº 809, layout) — un compte qui
 * vient de confirmer son adresse arrive SANS lui : le HTML servi ne
 * connaît personne, et la session n'est lue qu'au premier rendu du
 * navigateur (lib/use-utilisateur, `pret`). La décision attend donc
 * `pret` : au serveur quand il sait (l'encart est alors dans le HTML,
 * sans clignotement), sinon au premier rendu client — un état ajusté
 * pendant le rendu, le motif React pour suivre une valeur reçue.
 */
export function EncartBienvenue() {
  const { utilisateur, pret } = useUtilisateur();
  const [afficher, setAfficher] = useState<boolean | null>(() =>
    utilisateur ? doitMontrerLaBienvenue(utilisateur) : null
  );
  if (afficher === null && pret) setAfficher(doitMontrerLaBienvenue(utilisateur));

  useEffect(() => {
    if (!afficher) return;
    void clientSupabaseALaDemande().then(marquerLaBienvenueVue);
  }, [afficher]);

  if (!afficher) return null;

  return (
    <section
      aria-label="Welcome"
      data-bienvenue=""
      className="mb-6 rounded-2xl bg-sombre-carte mobile:px-5 not-mobile:px-8 mobile:py-7 not-mobile:py-8"
    >
      <h2 className="text-[clamp(1.35rem,3vw,1.8rem)] font-bold leading-tight text-sombre-texte">
        Welcome to {MARQUE_YOKOFOLIO.nom}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-sombre-texte-doux">
        Here, you find tattoo artists by style — not by feed. Pick a style,
        a city and a distance, and explore portfolios that show exactly
        that work.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-sombre-texte-doux">
        A tattoo artist? Build your own portfolio and get discovered.
      </p>
      {/*  Les deux gestes de la page About, dans le même moule : le
           rouge mène au catalogue de styles (EN AVANT, déclaré), le
           gris au formulaire de création. Empilés au doigt, côte à
           côte au web — deux variantes qui s'excluent (piège nº 389). */}
      <div className="mt-6 flex mobile:flex-col not-mobile:flex-row gap-3">
        <LienAccueil
          className="inline-flex items-center justify-center rounded-full
                     px-7 min-h-[40px] text-[14px] bg-primaire
                     hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          Find your style
        </LienAccueil>
        <Link
          href="/devenir-tatoueur/fiche?fiche=nouvelle"
          className="inline-flex items-center justify-center rounded-full
                     px-7 min-h-[40px] text-[14px] bg-sombre-eleve
                     hover:bg-sombre-haut
                     text-white font-semibold transition-colors
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          {TEXTES_TATOUAGE.lienCreerPortfolio}
        </Link>
      </div>
    </section>
  );
}
