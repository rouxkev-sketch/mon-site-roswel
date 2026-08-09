import Link from "next/link";
import { MARQUE } from "@/config/roswel";

/**
 * PIED DE PAGE (toutes les pages)
 * -------------------------------
 * Posé une seule fois dans le layout : liens légaux + signature.
 * Le `mt-auto` le colle en bas quand la page est plus courte que
 * l'écran (le body est en flex colonne pleine hauteur).
 */
export function PiedDePage({ classe = "" }: { classe?: string }) {
  return (
    <footer
      className={`mt-auto px-5 pb-8 pt-6 text-center text-xs text-encre-douce ${classe}`}
    >
      <p className="mb-2">
        <Link href="/cgu" className="underline underline-offset-2">
          CGU
        </Link>
        {" · "}
        <Link href="/confidentialite" className="underline underline-offset-2">
          Confidentialité
        </Link>
        {" · "}
        {/* Les mentions légales du produit artisans ont déménagé sous
            « /artisans/… » : l'adresse « /mentions-legales » appartient
            désormais à yokofolio, qui occupe la racine du site. */}
        <Link href="/artisans/mentions-legales" className="underline underline-offset-2">
          Mentions légales
        </Link>
        {" · "}
        <Link href="/artisans/contact" className="underline underline-offset-2">
          Contact
        </Link>
      </p>
      {MARQUE.nom} — {MARQUE.slogan.toLowerCase()}
    </footer>
  );
}
