import Link from "next/link";
import { GEO } from "@/config/roswel";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { LogoComplet } from "@/components/Logo";
import { IconeCoeur, IconeUtilisateur } from "@/components/Icones";

/**
 * LE MENU DU SITE (présent sur toutes les pages)
 * ----------------------------------------------
 * Reste visible au défilement (collé en haut) :
 *  - le bandeau de zone de lancement (retirable en passant
 *    GEO.afficherBandeauZone à false dans src/config/roswel.ts) ;
 *  - la barre blanche : logo à gauche (taille fixe), et à droite
 *    les icônes Favoris / Compte — même taille, même trait, même
 *    axe, espacées symétriquement. Connecté : l'icône de compte
 *    passe au rose de la marque (couleur du réglage central).
 */
export async function EnTete() {
  // Le visiteur est-il connecté ? (l'icône de compte devient rose)
  let connecte = false;
  try {
    const supabase = await creerClientSupabaseServeur();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    connecte = Boolean(user);
  } catch {
    // hors ligne : icône couleur habituelle
  }

  // Les deux icônes grandissent DANS LA MÊME PROPORTION que le logo
  // (23 → 28 px, soit ×1,22 comme 32 → 39) : les deux extrémités de la
  // barre restent visuellement équilibrées. Leur zone tactile de 44 px,
  // leur écartement et leur alignement ne changent pas, et sur téléphone
  // elles gardent leurs 23 px.
  const CLASSE_TAILLE_ICONE = "w-[23px] h-[23px] min-[768px]:w-7 min-[768px]:h-7";

  // Les deux icônes : MÊME boîte, même épaisseur de trait
  // (1.8), même zone tactile de 44 px — symétrie garantie
  const classeIcone =
    "w-11 h-11 flex items-center justify-center rounded-full hover:bg-fond-doux transition-colors";

  return (
    <div className="sticky top-0 z-50">
      {/* Bandeau de zone (un simple réglage pour le retirer) */}
      {GEO.afficherBandeauZone && (
        <p className="bg-primaire-clair text-primaire-fonce text-[13px] font-semibold text-center px-4 py-2">
          {GEO.bandeauZoneLancement}
        </p>
      )}

      {/* Barre de menu (blanche) : le bandeau s'étend sur toute la
          largeur, mais logo et icônes suivent le CONTENU — centrés
          avec l'interface en pleine page, alignés sur les bords des
          colonnes en écran partagé (règle .interieur-entete dans
          globals.css) */}
      <header className="bg-fond border-b border-bordure">
        <div className="interieur-entete mx-auto flex items-center justify-between pl-4 pr-1.5 h-14">
          <Link
            href="/"
            aria-label="Accueil Roswel"
            className="shrink-0 cursor-pointer"
          >
            {/* WEB (≥ 768 px) : le logo passe de 32 à 39 px de haut —
                il paraissait flotter dans une barre de 56 px. La barre,
                ses marges et le centrage vertical ne bougent pas ; seule
                la taille du logo change, dans ses proportions d'origine
                (la largeur suit le rapport du fichier). Sur téléphone,
                rien ne change : 32 px, comme avant. */}
            <LogoComplet
              tailleIcone={32}
              classe="h-8 w-auto min-[768px]:h-[39px]"
            />
          </Link>

          <nav aria-label="Mon espace" className="flex items-center text-encre">
            <Link href="/favoris" aria-label="Mes favoris" className={classeIcone}>
              <IconeCoeur taille={23} classe={CLASSE_TAILLE_ICONE} />
            </Link>
            <Link
              href="/compte"
              aria-label="Mon compte"
              className={`${classeIcone} ${connecte ? "text-primaire" : ""}`}
            >
              <IconeUtilisateur taille={23} classe={CLASSE_TAILLE_ICONE} />
            </Link>
          </nav>
        </div>
      </header>
    </div>
  );
}
