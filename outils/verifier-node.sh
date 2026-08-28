#  ██ NODE EST-IL LÀ, ET ASSEZ RÉCENT ? (passe nº 690) ██
#  ==================================================================
#  Ce fichier ne se lance pas : il se LIT, depuis les deux outils du
#  propriétaire (`sauvegarde`, `restaurer-comptes`) —
#
#        . "$(dirname "$0")/verifier-node.sh"
#
#  ⚠️ POURQUOI IL EXISTE. La nº 689 avait écrit cette vérification dans
#  `sauvegarde` ; la nº 690 en ajoute un second outil, et deux copies
#  d'un même contrôle finissent toujours par diverger — l'une sait dire
#  la bonne commande d'installation, l'autre pas. Une seule écriture,
#  et les deux outils disent exactement la même chose.
#
#  Les scripts se servent de `fetch`, qui existe dans Node depuis la
#  version 18. Plutôt que de deviner, on vérifie, et on dit LA commande
#  à taper.

if ! command -v node > /dev/null 2>&1; then
  echo ""
  echo "  ✖  Node n'est pas installé sur cette machine."
  echo ""
  echo "     La commande à taper (une seule fois) :"
  echo ""
  echo "         brew install node"
  echo ""
  echo "     Si « brew » est inconnu lui aussi, installe d'abord Homebrew :"
  echo "         /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  echo ""
  exit 1
fi

VERSION_NODE=$(node -p "process.versions.node.split('.')[0]")
if [ "$VERSION_NODE" -lt 18 ]; then
  echo ""
  echo "  ✖  Node $VERSION_NODE est trop ancien (il en faut au moins 18)."
  echo ""
  echo "     La commande à taper :"
  echo ""
  echo "         brew upgrade node"
  echo ""
  exit 1
fi
