"use client";

import { useEffect } from "react";

/**
 * ██ §1 (nº 739) — LA GARDE DES AVATARS : JAMAIS UNE MOITIÉ DE PHOTO ██
 * ====================================================================
 * LE DÉFAUT, DIT PAR LE PROPRIÉTAIRE : des avatars coupés en deux —
 * le haut affiché, le bas absent — environ trois fois sur quatre,
 * durablement (un rechargement ne répare pas), sur mobile ET sur
 * ordinateur mais pas en même temps. Le relevé de la nº 494 décrivait
 * déjà la même chose sur les ronds : « un transfert qui s'arrête en
 * route » — le symptôme précède donc les variantes de la nº 718.
 *
 * CE QUE LA LECTURE ÉTABLIT. Un avatar est un `<img>` DIRECT vers le
 * stockage (huit points de rendu, tous par `sourceAvatar`) : ni
 * l'optimiseur d'images, ni le service worker (autre domaine, jamais
 * intercepté) ne s'interposent. Quand le téléchargement s'interrompt
 * en route, le navigateur PEINT LES LIGNES REÇUES — une moitié — et
 * aucun des huit points n'avait le moindre recours. Et depuis la
 * nº 721, ces fichiers voyagent avec une permission de cache d'UN AN
 * (leur nom porte l'instant du dépôt, le contenu est immuable) : une
 * réponse amputée mémorisée quelque part — cache disque du navigateur
 * ou relais du stockage — est donc resservie AMPUTÉE à chaque visite,
 * sans jamais être redemandée. C'est ce qui rend le rechargement
 * impuissant, et c'est pourquoi mobile et ordinateur ne se trompent
 * pas ensemble : chacun a son propre cache, et chacun sert une
 * VARIANTE différente (160 sur les ronds, 320 sur la fiche) — deux
 * fichiers, deux histoires.
 * ⚠️ CE QUE LA LECTURE NE TRANCHE PAS (l'atelier n'atteint pas la
 * production) : si, pour un avatar donné, l'amputée vit dans un cache
 * ou dans le FICHIER même du stockage (téléversement interrompu). La
 * garde ci-dessous couvre LES DEUX branches ; le rapport de la passe
 * donne au propriétaire la mesure qui les distingue.
 *
 * LA RÈGLE, CELLE DE LA CONSIGNE : une image incomplète ne doit JAMAIS
 * rester affichée — on réessaie une fois, sinon on montre le repli.
 *  · DÉTECTER, ET `decode()` NE SUFFIT PAS — c'est MESURÉ au banc de
 *    cette passe : sur un JPEG amputé de sa moitié, Chromium PEINT le
 *    haut, annonce les dimensions de l'en-tête et RÉSOUT `decode()`
 *    comme si tout allait bien. La preuve d'intégrité est dans les
 *    OCTETS : tout JPEG entier se termine par sa marque de fin
 *    (FF D9) ; un transfert coupé en route ne l'a jamais. On relit
 *    donc le fichier par `fetch` — SANS réseau quand un cache le
 *    tient : c'est précisément la copie du cache, celle qui est
 *    peinte, qu'on veut juger — et l'on cherche la marque dans les
 *    derniers octets (une fenêtre de 256, pour tolérer un éventuel
 *    bourrage d'appareil après la marque). Seuls les fichiers `.jpg`
 *    sont jugés ainsi — et nos avatars le sont tous, les deux
 *    générations sortent du même encodeur (`compresserPhoto`).
 *    `decode()` reste écouté en appoint (un navigateur qui rejette dit
 *    vrai), et les échecs francs — aucun octet — passent par
 *    l'événement `error`. Un fichier ILLISIBLE PAR CE JUGE (relecture
 *    impossible, autre format) n'est PAS touché : dans le doute, le
 *    comportement d'hier.
 *  · REPRENDRE UNE FOIS : la même adresse, avec `?reprise=1`. Une
 *    adresse différente est une entrée de cache différente — PARTOUT :
 *    le disque du navigateur comme le relais du stockage. Si le
 *    fichier d'origine est sain, cette reprise l'affiche entier, et
 *    c'est elle que le cache retient désormais ; les montages suivants
 *    rejouent la bascule sans réseau (l'amputée et la saine sont
 *    toutes deux en cache local).
 *  · SINON, LE REPLI : la reprise arrive FRAÎCHE du stockage — si la
 *    marque de fin manque encore, c'est l'état RÉEL du fichier, pas un
 *    accident de transport. Le `src` est retiré — l'image ne montre
 *    plus rien, et le conteneur reprend la main (le rond gris de
 *    PhotoRonde, le fond des cartes) : l'état « sans photo », déjà
 *    dessiné partout. Une moitié de visage n'est plus jamais un état
 *    stable.
 *
 * POURQUOI UNE GARDE DE DOCUMENT, ET PAS HUIT RETOUCHES : les huit
 * `<img>` d'avatar vivent dans huit fichiers ; recopier la détection
 * huit fois, c'est huit copies qui divergent (piège nº 378). Les
 * événements `error` et `load` des ressources NE BULLENT PAS mais SE
 * CAPTURENT sur le document — le motif du filet de réparation nº 546.
 * Une seule écriture, tous les avatars couverts, y compris ceux des
 * portails et ceux qu'un écran futur ajoutera.
 * ⚠️ ELLE NE REGARDE QUE LES AVATARS : les fichiers dont le nom
 * commence par « avatar- » (variantes nº 718 comprises) ou « profil- »
 * (les dépôts d'avant). Les photos de portfolio, les glyphes de
 * `public/` et les images de démonstration ne portent pas ces noms —
 * la garde ne les touche pas.
 * ⚠️ LES IMAGES DÉJÀ CHARGÉES AVANT L'HYDRATATION : leur `load` est
 * passé avant que la garde n'écoute — le premier écran en est plein.
 * Au montage, on balaie donc une fois les `<img>` complètes présentes
 * et on leur applique la même vérification.
 * ⚠️ JAMAIS DE BOUCLE : une seule reprise par élément, marquée sur
 * l'élément lui-même (un attribut de données que React ne gère pas :
 * il survit aux re-rendus, et un REMONTAGE — donc une page neuve —
 * redonne droit à une reprise). Après elle, le repli, point.
 */

/** Une adresse d'avatar — les deux préfixes du projet, rien d'autre. */
function estUnAvatar(adresse: string): boolean {
  try {
    const chemin = new URL(adresse, window.location.href).pathname;
    const nom = chemin.slice(chemin.lastIndexOf("/") + 1);
    return nom.startsWith("avatar-") || nom.startsWith("profil-");
  } catch {
    return false;
  }
}

export function GardeAvatars() {
  useEffect(() => {
    const reprendre = (image: HTMLImageElement) => {
      const adresse = image.currentSrc || image.src;
      if (!adresse || !estUnAvatar(adresse)) return;
      //  L'attribut retient L'ADRESSE condamnée : le même chargement a
      //  DEUX juges (le décodeur, la marque de fin), et la seconde
      //  condamnation de la même adresse ne doit pas compter comme un
      //  second échec — sans quoi le repli tomberait avant que la
      //  reprise ait eu sa chance.
      if (image.dataset.repriseAvatar === adresse) return;
      if (image.dataset.repriseAvatar) {
        //  La reprise elle-même est condamnée — et elle est arrivée
        //  fraîche du stockage : le fichier est amputé pour de bon.
        //  Le repli : plus de source, le conteneur montre l'état
        //  « sans photo ».
        image.removeAttribute("src");
        return;
      }
      image.dataset.repriseAvatar = adresse;
      image.src =
        adresse + (adresse.includes("?") ? "&" : "?") + "reprise=1";
    };

    /**
     * Le fichier derrière l'image est-il ENTIER ? Rendu :
     *  · `false` — la marque de fin JPEG manque : fichier amputé ;
     *  · `true` — la marque est là, ou le fichier n'est pas jugeable
     *    (relecture impossible, autre format) : on ne touche à rien.
     * La relecture passe par le cache ordinaire (`fetch` sans option) :
     * c'est la copie que le navigateur a peinte qui est jugée, sans
     * aller-retour réseau quand elle est en cache.
     */
    const fichierEntier = async (adresse: string): Promise<boolean> => {
      try {
        const chemin = new URL(adresse, window.location.href).pathname;
        if (!/\.jpe?g$/i.test(chemin)) return true;
        const reponse = await fetch(adresse);
        if (!reponse.ok) return true;
        const octets = new Uint8Array(await reponse.arrayBuffer());
        if (octets.length < 4) return false;
        //  La marque de fin (FF D9), cherchée dans les 256 derniers
        //  octets — jamais présente dans un transfert coupé en route.
        const depart = Math.max(0, octets.length - 256);
        for (let i = octets.length - 2; i >= depart; i--) {
          if (octets[i] === 0xff && octets[i + 1] === 0xd9) return true;
        }
        return false;
      } catch {
        return true;
      }
    };

    const verifier = (image: HTMLImageElement) => {
      const adresse = image.currentSrc || image.src;
      if (!adresse || !estUnAvatar(adresse)) return;
      //  Deux juges : le décodeur quand il sait dire non, et la marque
      //  de fin du fichier — le seul signal fiable partout (mesuré).
      image.decode().catch(() => reprendre(image));
      void fichierEntier(adresse).then((entier) => {
        if (!entier) reprendre(image);
      });
    };

    const surErreur = (evenement: Event) => {
      const cible = evenement.target;
      if (cible instanceof HTMLImageElement) reprendre(cible);
    };
    const surChargement = (evenement: Event) => {
      const cible = evenement.target;
      if (cible instanceof HTMLImageElement) verifier(cible);
    };

    document.addEventListener("error", surErreur, true);
    document.addEventListener("load", surChargement, true);
    //  Le premier écran : les avatars dont le chargement s'est joué
    //  avant l'écoute.
    document.querySelectorAll("img").forEach((image) => {
      if (image.complete) verifier(image);
    });
    return () => {
      document.removeEventListener("error", surErreur, true);
      document.removeEventListener("load", surChargement, true);
    };
  }, []);

  return null;
}
