import { NextResponse } from "next/server";
import { catalogueDesStyles } from "@/lib/catalogue-styles";

/**
 * ██ ⚠️ TEMPORAIRE (passe nº 620) — LE RELEVÉ DU CATALOGUE DE STYLES ██
 * ==================================================================
 * POURQUOI ELLE EXISTE, ET POURQUOI ELLE NE DEVRAIT PAS VIVRE :
 * la nº 620 devait MONTRER au propriétaire ce que `catalogueDesStyles`
 * produit sur son vrai catalogue, pour qu'il juge l'ordre et les photos
 * AVANT qu'on affiche quoi que ce soit (nº 621). Or la base n'est pas
 * joignable depuis l'atelier où le code s'écrit — le relevé ne pouvait
 * pas y être pris. Cette route le lui donne SUR SON PROPRE
 * DÉPLOIEMENT : il ouvre l'adresse, il lit, il copie.
 *
 * ⚠️ ELLE NE FAIT QUE LIRE, et rien qu'à travers `catalogueDesStyles` :
 * aucune règle n'est réécrite ici, aucune donnée n'est modifiée. Ce
 * qu'elle montre est EXACTEMENT ce que la nº 621 affichera.
 *
 * ⚠️ DU TEXTE, PAS DU JSON : le propriétaire n'est pas développeur.
 * Un tableau aligné se lit d'un coup d'œil et se copie tel quel.
 *
 * ⚠️ AUCUNE DONNÉE PRIVÉE : les noms de style, les comptes d'artistes
 * et les comptes de cœurs viennent tous de ce que le site affiche déjà
 * (le menu « Explorer », la vue publique `coeurs_par_photo`, qui ne
 * nomme personne). Rien ici n'est plus visible qu'une page du site.
 *
 * ⚠️ À RETIRER À LA PASSE nº 622, avec le reste du ménage : supprimer
 * ce dossier, et rien d'autre — `lib/catalogue-styles` reste, c'est lui
 * qui nourrit l'accueil.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const styles = await catalogueDesStyles();
  const lignes: string[] = [];
  lignes.push(`RELEVÉ DU CATALOGUE DE STYLES (passe nº 620)`);
  lignes.push(`${styles.length} styles sortent de la lecture.`);
  lignes.push("");
  lignes.push(
    "rang  style                    artistes  galeries   cœurs  photo · artiste"
  );
  lignes.push("".padEnd(78, "-"));
  styles.forEach((style, rang) => {
    lignes.push(
      `${String(rang + 1).padStart(4)}  ${style.label.padEnd(24)}` +
        String(style.artistes).padStart(9) +
        String(style.galeries).padStart(10) +
        String(style.photo?.coeurs ?? 0).padStart(8) +
        `  ${(style.photo?.id ?? "").slice(0, 8)}… · ${style.photo?.tatoueur ?? "?"}`
    );
  });
  lignes.push("");
  lignes.push(
    `styles sans aucun cœur sur la photo retenue : ${
      styles.filter((style) => (style.photo?.coeurs ?? 0) === 0).length
    }`
  );
  lignes.push(
    `styles à zéro artiste : ${styles.filter((style) => style.artistes === 0).length}` +
      "  (un style sans galerie ne sort pas de la lecture : ce nombre" +
      " devrait être zéro)"
  );
  return new NextResponse(lignes.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      //  Une page de relevé n'a rien à faire dans un moteur de
      //  recherche, et rien à faire dans un cache.
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
