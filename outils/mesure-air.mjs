//  ██ LA MESURE DE L'AIR VISUEL — L'ENCRE, PAS LES BOÎTES ██
//  ==================================================================
//  POURQUOI CET OUTIL EXISTE (leçon de la nº 850) : une mesure de
//  boîtes peut être JUSTE et l'écran FAUX. La nº 848 avait posé « dix
//  pixels d'air sur les quatre côtés » et les avait vérifiés — sur le
//  rembourrage, jusqu'à la BOÎTE DE LIGNE. Or cette boîte contient
//  déjà six pixels de vide au-dessus et au-dessous des lettres : l'œil
//  voyait dix-sept pixels en haut pour douze à gauche, et le
//  propriétaire l'a vu tout de suite.
//  CE QUE FAIT CET OUTIL : il capture le badge, décode l'image EN
//  MÉMOIRE et cherche la première ENCRE de chaque côté. Aucune image
//  n'est écrite ni livrée — c'est une mesure, comme une lecture de
//  style, mais elle dit ce que l'écran MONTRE.
import { inflateSync } from "node:zlib";

export function imageDuPng(png) {
  let i = 8, e = null; const morceaux = [];
  while (i < png.length) {
    const t = png.readUInt32BE(i), type = png.toString("ascii", i + 4, i + 8);
    const corps = png.subarray(i + 8, i + 8 + t);
    if (type === "IHDR") e = { l: corps.readUInt32BE(0), h: corps.readUInt32BE(4), p: corps[8], c: corps[9], entrelace: corps[12] };
    else if (type === "IDAT") morceaux.push(corps);
    else if (type === "IEND") break;
    i += 12 + t;
  }
  if (!e || e.p !== 8 || e.entrelace !== 0) throw new Error("PNG inattendu " + JSON.stringify(e));
  const oct = e.c === 6 ? 4 : 3;
  const brut = inflateSync(Buffer.concat(morceaux));
  const pas = e.l * oct;
  const pix = Buffer.alloc(e.h * pas);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < e.h; y += 1) {
    const f = brut[y * (pas + 1)];
    const src = brut.subarray(y * (pas + 1) + 1, y * (pas + 1) + 1 + pas);
    for (let x = 0; x < pas; x += 1) {
      const a = x >= oct ? pix[y * pas + x - oct] : 0;
      const b = y > 0 ? pix[(y - 1) * pas + x] : 0;
      const c = x >= oct && y > 0 ? pix[(y - 1) * pas + x - oct] : 0;
      const v = src[x];
      pix[y * pas + x] =
        f === 0 ? v : f === 1 ? v + a : f === 2 ? v + b : f === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c);
    }
  }
  return { l: e.l, h: e.h, oct, pix, at(x, y) { const o = y * pas + x * oct; return [this.pix[o], this.pix[o + 1], this.pix[o + 2]]; } };
}

/** Les quatre airs VISUELS, en pixels CSS, mesurés sur l'encre. */
export function airsVisuels(img, { bord, xTexteFin, rayon = 8, seuil = 60 }) {
  //  LE FOND DE RÉFÉRENCE : au cœur du badge, jamais dans un coin.
  const fond = img.at(bord + 3, Math.round(img.h / 2));
  const encre = (x, y) => {
    const [r, v, b] = img.at(x, y);
    return Math.abs(r - fond[0]) + Math.abs(v - fond[1]) + Math.abs(b - fond[2]) > seuil;
  };
  //  ⚠️ ON ÉVITE LES COINS ARRONDIS : ils ne sont ni fond ni encre, et
  //  leur dégradé passerait pour une lettre. La bande centrale suffit —
  //  aucun glyphe ne vit dans un coin d'un badge d'une seule ligne.
  //  ⚠️ ON SAUTE LE TRAIT ET SON LISSAGE : le badge du compte porte un
  //  contour d'un pixel, et comme sa boîte tombe sur un demi-pixel, ce
  //  trait s'étale sur deux rangées. On commence donc la lecture deux
  //  pixels plus loin — les lettres, elles, sont à huit.
  const marge = bord + 2;
  const x0 = marge, x1 = img.l - marge, y0 = marge, y1 = img.h - marge;
  const bx0 = x0 + rayon, bx1 = Math.min(x1, xTexteFin);
  let haut = null, bas = null, gauche = null, droite = null;
  //  1 · LE HAUT ET LE BAS DE L'ENCRE, sur la seule zone du TEXTE (la
  //  croix, plus haute, fausserait la lecture des glyphes).
  for (let y = y0; y < y1 && haut === null; y += 1)
    for (let x = bx0; x < bx1; x += 1) if (encre(x, y)) { haut = y; break; }
  for (let y = y1 - 1; y >= y0 && bas === null; y -= 1)
    for (let x = bx0; x < bx1; x += 1) if (encre(x, y)) { bas = y; break; }
  /*  2 · LA GAUCHE ET LA DROITE, dans LA BANDE DE L'ENCRE qu'on vient de
      trouver — et c'est nécessaire : une bande prise au milieu du badge
      tomberait dans le creux d'un « 3 » ou d'un « e » et rendrait un
      chiffre de plus ; une bande prise sur toute la hauteur toucherait
      les coins arrondis, qui ne sont ni fond ni encre. */
  for (let x = x0; x < bx1 && gauche === null; x += 1)
    for (let y = haut; y <= bas; y += 1) if (encre(x, y)) { gauche = x; break; }
  for (let x = x1 - 1; x >= x0 && droite === null; x -= 1)
    for (let y = haut; y <= bas; y += 1) if (encre(x, y)) { droite = x; break; }
  return {
    haut, bas: img.h - 1 - bas, gauche, droite: img.l - 1 - droite,
    hauteur: img.h, largeur: img.l,
  };
}
