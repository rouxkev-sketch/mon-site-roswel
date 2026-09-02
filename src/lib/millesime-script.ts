/**
 * ██ LE MILLÉSIME DU SCRIPT D'AVANT PEINTURE ██
 * ==================================================================
 * (§B nº 347 pour le millésime lui-même ; §1 nº 495 pour ce fichier ;
 *  §6 nº 791 pour ce qu'il fait, et ne fait pas, aujourd'hui.)
 *
 * À QUOI IL SERT, EN UNE PHRASE : dire QUELLE VERSION du script
 * d'avant peinture a réellement peint la page qu'on a sous les yeux.
 * Le script l'écrit sur `<html>` (`data-version-script`) avant la
 * première image. On lit ce numéro dans l'inspecteur du navigateur :
 * s'il est ABSENT, ou plus VIEUX que la mise en ligne, alors la page
 * servie est PÉRIMÉE — un cache la retient — et aucun des blocs
 * récents du script n'y a jamais tourné.
 *
 * POURQUOI IL EXISTE : deux passes de suite, des blocs du script ont
 * semblé ne jamais s'exécuter sur le téléphone du propriétaire alors
 * qu'ils s'exécutent à l'atelier. Ce numéro tranche la question sans
 * discussion, au lieu de la laisser ouverte une passe de plus.
 *
 * ██ §6 (nº 791) — CE QU'IL EST, ET CE QU'IL N'EST PAS ██
 * ------------------------------------------------------------------
 * IL FAUT LE DIRE NET, parce que la confusion a coûté cher : le
 * millésime est un TÉMOIN, pas un mécanisme. Il ne renouvelle rien, il
 * ne purge rien, il ne répare rien. Il constate.
 *
 * CE QUI RENOUVELLE VRAIMENT LES FICHIERS À CHAQUE MISE EN LIGNE, et
 * cela n'a jamais dépendu ni du millésime ni du service worker : Next
 * met une empreinte du CONTENU dans le nom de chacun de ses fichiers
 * (`/_next/static/chunks/…`). Une mise en ligne change les contenus,
 * donc les noms, donc les adresses — et une adresse neuve n'a rien à
 * resservir de vieux. C'est vrai avec ou sans programme d'arrière-plan.
 *
 * CE QUI PROTÈGE LE VISITEUR quand sa page, elle, est restée vieille :
 * le FILET DE RÉPARATION (`components/FiletDeReparation`, nº 546). Un
 * document ancien réclame un morceau qui n'existe plus sous ce nom ; le
 * filet l'entend, vide ce qu'il peut et recharge UNE fois. Lui non plus
 * n'a jamais dépendu du service worker.
 *
 * ⚠️ CE QUI A CHANGÉ POUR LUI À LA nº 791, et rien d'autre : le
 * millésime avait un SECOND lecteur, l'enregistrement du service
 * worker, qui le mettait dans le nom du cache (`yokofolio-<empreinte>-
 * <millésime>`) pour qu'on lise d'un coup d'œil la version servie. Ce
 * lecteur est parti avec le service worker (enquête nº 738). Le
 * millésime garde son premier rôle, entier : la marque sur `<html>`.
 * L'ancien piège qui justifiait ce fichier — la lecture de `<html>`
 * depuis un effet React, qui rendait `undefined` sur une page streamée
 * et relançait le service worker en boucle — n'a plus d'objet : il n'y
 * a plus de service worker à relancer. La règle qui en est née, elle,
 * reste bonne et vaut pour tout : une CONSTANTE DE COMPILATION ne peut
 * pas manquer, là où une lecture du DOM dépend de l'ordre d'arrivée
 * des morceaux du document.
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, et c'est délibéré : il est lu par du
 * code serveur (le script) comme il pourrait l'être par du code client.
 * Une seule constante, aucun import — la leçon de `lignes-profil.ts`.
 *
 * ⚠️ À INCRÉMENTER À CHAQUE PASSE QUI MODIFIE LE TEXTE DU SCRIPT
 * D'AVANT PEINTURE — le texte, pas le fichier : un commentaire de
 * TypeScript hors du gabarit ne change pas un octet de ce qui est
 * servi, et faire bouger le numéro pour rien ferait mentir le témoin.
 * C'est ici, et nulle part ailleurs, que le numéro s'écrit.
 */
export const MILLESIME_SCRIPT = "819";
