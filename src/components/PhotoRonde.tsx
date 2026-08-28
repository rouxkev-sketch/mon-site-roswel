"use client";

import { ICONE_ADRESSE, PORTRAIT_ROND } from "@/config/tatouage";

/**
 * ██ §4 (nº 703) — LE ROND, SORTI DU BLOC DES LIEUX ██
 * ==================================================================
 * CE FICHIER NE CONTIENT AUCUNE RÈGLE NOUVELLE : le rond ci-dessous
 * est celui de `BlocLieux`, déménagé mot pour mot, commentaires
 * compris (nº 224/227/233/254/492/494/516). Rien de son apparence ni
 * de son comportement n'a bougé.
 *
 * POURQUOI LE DÉMÉNAGER (le défaut mesuré à la nº 703). `MenuEspace`
 * — donc l'en-tête, donc TOUTES les pages — ne prenait de `BlocLieux`
 * que ce rond. Mais un import va chercher le FICHIER ENTIER, et
 * `BlocLieux` traîne derrière lui la pile de fiches, la fenêtre de
 * fiche, le contenu de fiche, et pour finir LE CLIENT DE LA BASE :
 * 62 Ko compressés sur les mentions légales, pour un rond de 52 px.
 *
 * ⚠️ CE FICHIER DOIT RESTER UNE FEUILLE : deux jetons de configuration
 * et rien d'autre. La seconde où il importera un bloc de fiche, le
 * menu se remettra à tout traîner.
 * ⚠️ L'ÉCRITURE RESTE UNIQUE, et elle est ICI. `BlocLieux` continue de
 * l'exporter — `BlocSuivis` et les autres appelants n'ont pas bougé
 * d'une ligne : ils passent par une simple réexportation.
 */

/**
 * LA PASTILLE D'UN LIEU OU D'UNE PERSONNE — 52 px (nº 227-§1, elle
 * était un peu petite à 44), le gabarit de l'équipe : une adresse et
 * un membre se lisent dans la même colonne. La photo de PROFIL de la
 * fiche, elle, reste à 92 px — elle n'est pas une pastille.
 *
 * ⚠️ ELLE EXISTE TOUJOURS (passe nº 224-§1), même sans photo — c'est
 * elle qui tient la colonne, et une ligne sans elle se décalait ou
 * disparaissait. Deux natures, deux replis :
 *  · UN LIEU sans photo (un salon saisi à la main, qui n'a pas de
 *    fiche sur yokofolio) → un rond gris uni portant le glyphe
 *    `adresse.png`, dans un gris NETTEMENT plus foncé que le rond ;
 *  · UNE PERSONNE sans photo → un rond gris uni, ET RIEN DEDANS : ni
 *    icône, ni lettre, ni texte. Une initiale sur un rond gris se lit
 *    comme un avatar bricolé ; le vide se lit comme une absence, ce
 *    qu'elle est.
 * Aucun contour, aucun halo.
 *
 * ⚠️ `adresse.png` EST UN GLYPHE NOIR sur fond transparent, déposé à
 * la main : on ne le retouche jamais. `invert` l'éclaircit, et
 * l'opacité le ramène au gris voulu — plus foncé que le rond, donc
 * lisible dessus.
 */
export function PhotoRonde({
  source,
  nature,
  classeTaille = "h-13 w-13",
  classeGlyphe = "h-7 w-7",
  classeFond = "bg-sombre-eleve",
}: {
  source: string | null | undefined;
  /** « lieu » porte le glyphe d'adresse à défaut de photo ;
      « personne » ne porte rien. */
  nature: "lieu" | "personne";
  /**
   * ██ §2 (nº 492) — LE FOND DU ROND EST DEVENU UN PARAMÈTRE ██
   * ------------------------------------------------------------------
   * POURQUOI : le rond de repli valait `bg-sombre-eleve` en dur, et
   * l'encadré permanent des membres d'équipe prend EXACTEMENT ce
   * jeton-là. Un membre sans photo aurait donc eu un rond de la
   * couleur de sa plaque — invisible, c'est-à-dire un texte décalé de
   * 66 px sans rien pour tenir la colonne. C'est le même piège que le
   * compteur de capsules au web (nº 491-§1) : un fond ne se voit que
   * s'il diffère de son support.
   * LA RÈGLE : le porteur dit sur quoi il pose le rond ; l'écriture du
   * rond, elle, reste UNIQUE — comme pour sa taille (nº 254-§3).
   * ⚠️ UN SEUL JETON DE COULEUR À LA FOIS : la valeur REMPLACE le
   * défaut, elle ne s'y ajoute pas (piège nº 389).
   */
  classeFond?: string;
  /** §3 (nº 254) — LA TAILLE EN PARAMÈTRE, l'écriture reste UNIQUE :
      « Ma sélection » agrandit sa pastille sur le web (72 px) sans
      recopier le rond — une seconde écriture divergerait à la passe
      suivante. Défaut : le rond de 52 de toujours. */
  classeTaille?: string;
  /** Le glyphe du repli « lieu » suit la même échelle (28 → 40). */
  classeGlyphe?: string;
}) {
  /**
   * ██ nº 494 — `decoding="async"`, LE MODÈLE DES CARROUSELS ██
   * ------------------------------------------------------------------
   * L'EXAMEN DE CETTE PASSE a relevé que les familles d'images du site
   * ne sont pas protégées de la même façon : `PhotoProgressive` (les
   * carrousels) déclare `loading`, `fetchPriority`, `decoding="async"`
   * ET ses dimensions intrinsèques ; ce rond-ci ne déclarait que ses
   * dimensions. Le relevé de sonde du propriétaire dit la même chose —
   * « les ronds sont en `decoding=auto` alors que les carrousels sont
   * en `decoding=async` », et ce sont les ronds qui montrent le défaut.
   * ⚠️ CE N'EST PAS UNE CORRECTION DU DÉFAUT, et il ne faut pas le lire
   * comme telle : `decoding` dit QUAND une image décodée est présentée,
   * il ne répare pas un transfert qui s'arrête en route. C'est
   * l'alignement sur la famille la mieux tenue, pas un remède nommé.
   * ⚠️ AUCUN PIXEL NE BOUGE : `decoding` ne touche pas la mise en page.
   */
  return (
    <span
      className={`flex ${classeTaille} shrink-0 items-center justify-center overflow-hidden rounded-full ${classeFond}`}
    >
      {source ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={source}
          alt=""
          decoding="async"
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          //  §1 (nº 516) — LE ROND NE SE LAISSE PAS TRAÎNER, et c'est
          //  ce qui rend le NOM sélectionnable à côté de lui : ce rond
          //  vit DANS un lien (la ligne d'identité d'un portfolio
          //  suivi, les plaques d'équipe), et l'attribut posé sur le
          //  lien ne descend pas jusqu'ici — l'image restait donc une
          //  poignée de glissement à elle seule. Le même geste que le
          //  logo et que les tuiles de galerie, pour la même raison.
          //  ⚠️ SANS EFFET AILLEURS : on ne traîne jamais un avatar
          //  dans ce site, et cet attribut ne touche ni le clic, ni le
          //  survol, ni le doigt. Écriture unique : tous les ronds du
          //  site en héritent d'un coup.
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : nature === "lieu" ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           icône déposée par le propriétaire, affichée telle quelle (le
           filtre CSS ne modifie pas le fichier). */
        <img
          src={ICONE_ADRESSE}
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          //  §1 (nº 516) — le glyphe de repli ne se traîne pas non
          //  plus : même raison que la photo ci-dessus, un rond sans
          //  photo est le même rond.
          draggable={false}
          //  §2 (nº 233) — 28 px : un peu plus de la moitié du rond de
          //  52, le glyphe ne se perd plus au milieu. PhotoRonde est
          //  l'unique écriture : TOUS les ronds concernés suivent —
          //  et sa taille suit celle du rond (nº 254-§3).
          className={`${classeGlyphe} invert opacity-40`}
        />
      ) : null}
    </span>
  );
}
