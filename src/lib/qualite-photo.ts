/**
 * ██ LA QUALITÉ JPEG DES PHOTOS RÉDUITES PAR LE SITE ██
 * ==================================================================
 * (§1 nº 723 — le grain que le propriétaire a vu sur l'avatar.)
 *
 * LE DÉFAUT, ET IL EST MESURÉ, PAS SUPPOSÉ. La réduction du site
 * (`compresserPhoto`) encodait à 0,85. Sur un avatar de 320 px — le
 * rond de la barre fixe sur grand écran — cela donne un écart au pixel
 * de 42,0 dB, avec des pointes à 32 sur 255. Ce sont les DÉGRADÉS DOUX
 * (une joue, un fond flou) qui trahissent : le JPEG y pose des marches
 * là où l'œil attend un passage continu, et c'est exactement ce qui se
 * lit comme du grain.
 *
 * LA MESURE, AU VRAI ENCODEUR (banc de la passe, dans un navigateur —
 * `canvas.toBlob` est celui de Chromium, pas une bibliothèque
 * d'atelier), sur une image d'épreuve à dégradés doux et contours
 * francs :
 *
 *     320 px   q=0,85   6 594 o   42,0 dB   pire écart 32/255
 *     320 px   q=0,94  10 979 o   44,6 dB   pire écart 23/255
 *     160 px   q=0,85   3 209 o   39,7 dB   pire écart 32/255
 *     160 px   q=0,94   4 810 o   42,3 dB   pire écart 28/255
 *
 * 0,94 est le palier retenu : au-delà, le fichier grossit vite pour un
 * gain que l'œil ne recueille plus (0,96 coûte 27 % de plus pour 0,4 dB).
 *
 * ⚠️ CE QUI N'EST **PAS** LA CAUSE, ET QUE LA MESURE A INNOCENTÉ. Un
 * avatar subit DEUX compressions successives : le recadreur produit un
 * JPEG 800 × 800 (`RecadreurPhoto`, qualité 0,88), que cette réduction
 * réencode ensuite. On pouvait croire les pertes cumulées ; elles ne le
 * sont presque pas — 42,2 dB pour une réduction directe contre 42,0 dB
 * par la chaîne réelle, soit deux dixièmes. Et monter AUSSI le
 * recadreur ne rapporte rien (44,7 dB contre 44,6). C'est pourquoi
 * cette passe ne touche qu'ICI : `RecadreurPhoto` garde ses 0,88 et
 * 0,72, qui règlent les photos de PORTFOLIO — un autre sujet, une
 * autre taille, une autre mesure à faire le jour venu.
 *
 * ⚠️ UNE SEULE ÉCRITURE, ET C'EST TOUT LE POINT (piège nº 378). Cette
 * valeur vivait à DEUX endroits — le défaut de `compresserPhoto` et le
 * `85` en dur de `outils/reprendre-avatars.mjs` (nº 719). Elles étaient
 * alignées par surveillance, pas par construction : la première passe
 * qui aurait bougé l'une aurait laissé l'autre derrière, et les avatars
 * repris n'auraient plus ressemblé aux avatars déposés. Le script de
 * reprise LIT désormais cette constante-ci, comme il lit déjà les
 * tailles dans `avatar-variantes`.
 */

/**
 * De 0 à 1 — la forme qu'attend `canvas.toBlob`. Le script de reprise,
 * lui, travaille en pourcentage (0 à 100) et multiplie par cent : c'est
 * la même valeur, dans l'unité de son outil.
 */
export const QUALITE_PHOTO = 0.94;
