#!/bin/sh
#
#  ██ DÉPLOYER EN PRODUCTION, SANS UNE SEULE QUESTION (passe nº 503) ██
#  ==================================================================
#  CE QUE TU TAPES, DANS LE DOSSIER DÉZIPPÉ :
#
#        sh d
#
#  Et rien d'autre. (`./d` marche aussi si le droit d'exécution a
#  survécu au dézippage — voir « LE DROIT D'EXÉCUTION » plus bas.)
#
#  CE QUE CE SCRIPT REMPLACE : trois questions qui revenaient à chaque
#  dossier neuf, et dont les réponses ne changeaient jamais —
#   1. « Which project? » → Search all projects
#   2. « Which project? » → yokofolio
#   3. « Pull development environment variables into .env.local? » → n
#
#  ==================================================================
#  ⚠️⚠️ LE PIÈGE QUE CE SCRIPT ÉVITE, ET IL FAUT LE SAVOIR
#  ------------------------------------------------------------------
#  L'option qui vient à l'esprit pour « ne plus rien demander », c'est
#  `--yes`. ELLE EST DANGEREUSE ICI. Le code de la CLI (version 59) dit
#  exactement ceci :
#
#      const pullEnvConfirmed = autoConfirm || await confirm(
#        "Pull development environment variables into .env.local?", true);
#
#  Autrement dit `--yes` répond OUI à la troisième question — il TIRE
#  les variables de Vercel et ÉCRASE `.env.local`. C'est précisément ce
#  que tu refuses en tapant « n » à la main.
#
#  L'OPTION JUSTE EST `--non-interactive`. Le même code sort AVANT la
#  question :
#
#      if (!pullEnv || !client.stdin.isTTY || client.nonInteractive) return;
#
#  Rien n'est demandé, et surtout rien n'est tiré : `.env.local` n'est
#  pas touché. C'est la seule option qui donne le comportement voulu.
#
#  ==================================================================
#  LE DROIT D'EXÉCUTION
#  ------------------------------------------------------------------
#  Le fichier est marqué exécutable dans le zip, mais tous les
#  décompresseurs ne conservent pas cette marque (celui de Windows la
#  perd toujours, celui de macOS la garde en général). PLUTÔT QUE DE
#  PARIER, on lance par `sh d` : ça marche dans les deux cas, sans
#  aucune manipulation. Si tu préfères `./d`, une seule commande, une
#  seule fois par dossier :  chmod +x d
#
set -e

EQUIPE="mon-site-roswel"
PROJET="yokofolio"

echo ""
echo "▲  Déploiement de $PROJET en PRODUCTION"
echo ""

#  --------------------------------------------------------------
#  1. LA LIAISON DU DOSSIER AU PROJET — les deux premières questions.
#  --------------------------------------------------------------
#  Elles se posaient parce que le dossier ne savait pas à quel projet
#  Vercel il appartient. Ce lien vit dans `.vercel/project.json`, écrit
#  une fois puis relu à chaque déploiement suivant.
#
#  Les deux options viennent de la documentation de la CLI elle-même :
#    --project  « required for non-interactive existing-project links »
#    --team     « use with --project for non-interactive links »
#
#  On ne le refait que si le fichier manque : dans un dossier déjà lié,
#  cette étape est sautée et rien ne s'affiche.
if [ ! -f .vercel/project.json ]; then
  echo "→  Première fois dans ce dossier : liaison au projet…"
  vercel link --non-interactive --team "$EQUIPE" --project "$PROJET"
  echo ""
fi

#  --------------------------------------------------------------
#  2. LE DÉPLOIEMENT.
#  --------------------------------------------------------------
#    --prod             met en PRODUCTION (le vrai site), pas en
#                       préproduction — c'est le raccourci officiel de
#                       `--target=production`
#    --non-interactive  ne pose aucune question, et surtout ne tire
#                       JAMAIS les variables d'environnement (voir le
#                       piège, plus haut)
vercel deploy --prod --non-interactive

#  --------------------------------------------------------------
#  3. LA FIN.
#  --------------------------------------------------------------
#  `set -e` en tête arrête le script à la première erreur : si Vercel
#  échoue, son message reste à l'écran et les deux lignes ci-dessous ne
#  s'affichent pas. La fenêtre ne se ferme pas toute seule — c'est TON
#  terminal, pas une fenêtre ouverte par le script.
echo ""
echo "✓  Mis en ligne. L'adresse de production est celle affichée ci-dessus."
echo ""
