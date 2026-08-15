/** Décodeur PNG minimal (8 bits, RVBA, non entrelacé) — assez pour lire
    les pixels d'une capture Playwright. */
import { inflateSync } from "node:zlib";
export function lirePixels(png) {
  let i = 8, largeur = 0, hauteur = 0, canaux = 4, morceaux = [];
  while (i < png.length) {
    const taille = png.readUInt32BE(i);
    const type = png.toString("ascii", i + 4, i + 8);
    const corps = png.subarray(i + 8, i + 8 + taille);
    if (type === "IHDR") {
      largeur = corps.readUInt32BE(0);
      hauteur = corps.readUInt32BE(4);
      const couleur = corps[9];
      canaux = couleur === 6 ? 4 : couleur === 2 ? 3 : 1;
    } else if (type === "IDAT") morceaux.push(corps);
    else if (type === "IEND") break;
    i += 12 + taille;
  }
  const brut = inflateSync(Buffer.concat(morceaux));
  const pas = largeur * canaux;
  const sortie = Buffer.alloc(hauteur * pas);
  let precedente = Buffer.alloc(pas);
  for (let y = 0; y < hauteur; y += 1) {
    const filtre = brut[y * (pas + 1)];
    const ligne = brut.subarray(y * (pas + 1) + 1, y * (pas + 1) + 1 + pas);
    const nette = Buffer.alloc(pas);
    for (let x = 0; x < pas; x += 1) {
      const a = x >= canaux ? nette[x - canaux] : 0;
      const b = precedente[x];
      const c = x >= canaux ? precedente[x - canaux] : 0;
      let v = ligne[x];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      nette[x] = v & 255;
    }
    nette.copy(sortie, y * pas);
    precedente = nette;
  }
  return {
    largeur, hauteur, canaux,
    pixel(x, y) {
      const o = y * pas + x * canaux;
      return [sortie[o], sortie[o + 1], sortie[o + 2]];
    },
  };
}
