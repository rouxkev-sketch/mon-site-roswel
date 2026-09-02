import {
  couleurStyle,
  libelleStyle,
  STYLES_TATOUAGE,
  styleDuCatalogue,
} from "@/config/tatouage";

/**
 * LES IMAGES DE DÉMONSTRATION — de simples rectangles de couleur
 * ==============================================================
 * ⚠️ AUCUNE VRAIE PHOTO DE TATOUAGE. Le travail d'un tatoueur lui
 * appartient : le publier sans son accord serait une contrefaçon.
 * Tant qu'aucun tatoueur n'a déposé ses images, la démonstration
 * affiche donc un aplat de couleur portant le nom du style.
 *
 * Dessiné à la volée en SVG plutôt que stocké en fichiers : rien à
 * ranger, rien à livrer dans le zip, et la couleur suit celle du
 * style dans src/config/tatouage.ts.
 *
 * Adresse : /images-demo/tatouage/realisme-1.svg
 *           (le numéro ne sert qu'à varier légèrement le rendu)
 */

export const dynamic = "force-static";

/** Une variation discrète d'une couleur, pour distinguer deux images. */
function eclaircir(couleur: string, degre: number): string {
  const n = parseInt(couleur.slice(1), 16);
  const composante = (decalage: number) =>
    Math.min(255, Math.max(0, ((n >> decalage) & 255) + degre))
      .toString(16)
      .padStart(2, "0");
  return `#${composante(16)}${composante(8)}${composante(0)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fichier: string }> }
) {
  const { fichier } = await params;
  const nom = fichier.replace(/\.svg$/i, "");
  const separateur = nom.lastIndexOf("-");
  const slug = separateur > 0 ? nom.slice(0, separateur) : nom;
  const numero = Number(nom.slice(separateur + 1)) || 1;

  // Un style inconnu ne doit pas produire d'image cassée : on retombe
  // sur le premier de la liste.
  const connu = styleDuCatalogue(slug) ? slug : STYLES_TATOUAGE[0].slug;

  const base = couleurStyle(connu);
  const haut = eclaircir(base, 18 + numero * 6);
  const bas = eclaircir(base, -10);
  const libelle = libelleStyle(connu);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="Demo image — ${libelle} style">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${haut}"/>
      <stop offset="1" stop-color="${bas}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#f)"/>
  <text x="400" y="500" text-anchor="middle" fill="#F2F2F4" fill-opacity="0.92"
        font-family="system-ui, sans-serif" font-size="54" font-weight="600"
        letter-spacing="1">${libelle}</text>
  <text x="400" y="552" text-anchor="middle" fill="#F2F2F4" fill-opacity="0.55"
        font-family="system-ui, sans-serif" font-size="24" letter-spacing="3">DEMO</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
