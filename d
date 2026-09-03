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

#  L'ÉQUIPE VERCEL. Elle s'appelait « mon-site-roswel », du nom de
#  l'ancien projet ; Kevin l'a renommée « yokofolio-team » (nº 766
#  quater). Ce nom-là est celui de l'ÉQUIPE, pas du projet : les deux
#  se ressemblent, ne les confonds pas.
EQUIPE="yokofolio-team"
PROJET="yokofolio"

#  ██ nº 831 — LA VÉRIFICATION DES VARIABLES, ET POURQUOI ELLE EXISTE ██
#  ------------------------------------------------------------------
#  LE DÉFAUT DU PROPRIÉTAIRE : le site en ligne n'envoyait aucun e-mail.
#  Le diagnostic de la nº 830 a montré que `RESEND_API_KEY` était VIDE
#  au runtime, alors qu'elle est posée chez Vercel depuis des semaines.
#  La production ne tournait donc pas sur les variables du tableau de
#  bord — et rien, nulle part, ne le disait.
#
#  DEUX CHOSES CHANGENT ICI, ET ELLES VONT ENSEMBLE :
#   1. `.vercelignore` (à côté de ce script) empêche désormais les
#      fichiers `.env*` de partir chez Vercel. Ta clé secrète ne voyage
#      plus, et le site ne peut plus tourner sur un fichier de passage :
#      LE TABLEAU DE BORD DEVIENT LA SEULE SOURCE.
#   2. Ce script vérifie donc, AVANT de déployer, que ce tableau de bord
#      porte bien tout ce que le code lit. S'il manque quelque chose, la
#      mise en ligne n'a pas lieu et tu lis le nom qui manque.
#
#  ⚠️ AUCUNE VALEUR N'EST LUE NI AFFICHÉE : `vercel env ls` ne sert qu'à
#  obtenir des NOMS de variables (voir outils/verifier-variables-vercel).
#
#  SI LA VÉRIFICATION EST IMPOSSIBLE (hors ligne, CLI trop ancienne),
#  le script s'arrête aussi — mais il te donne la commande pour passer
#  outre en connaissance de cause :   sh d --sans-verification
VERIFIER="oui"
if [ "$1" = "--sans-verification" ]; then
  VERIFIER="non"
fi

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
#  2. LES VARIABLES DE PRODUCTION, VÉRIFIÉES AVANT (nº 831).
#  --------------------------------------------------------------
#  `--json` fait écrire à la CLI un objet sur la sortie standard ; ses
#  messages, eux, partent ailleurs. On passe cet objet au vérificateur
#  SANS JAMAIS L'AFFICHER : il contient les valeurs des variables non
#  marquées « sensitive », et elles ne doivent apparaître nulle part.
#  Le vérificateur n'en extrait que les noms.
if [ "$VERIFIER" = "oui" ]; then
  echo "→  Vérification des variables de production…"
  REPONSE=$(vercel env ls production --json 2>/dev/null || true)
  RESULTAT=0
  printf '%s' "$REPONSE" | node outils/verifier-variables-vercel.mjs || RESULTAT=$?
  REPONSE=""
  if [ "$RESULTAT" != "0" ]; then
    echo ""
    if [ "$RESULTAT" = "1" ]; then
      echo "✖  Mise en ligne annulée : le site partirait amputé."
      echo ""
      echo "   Ajoute (ou corrige) ces variables dans Vercel :"
      echo "     Settings → Environment Variables, cible « Production »,"
      echo "   puis relance :   sh d"
      echo ""
      echo "   ⚠️ Le NOM va dans « Key », la VALEUR dans « Value » — une"
      echo "      variable dont la valeur est son propre nom ne sert à"
      echo "      rien (c'est le cas de RESEND_EXPEDITEUR aujourd'hui)."
    else
      echo "✖  Mise en ligne annulée : je n'ai pas pu vérifier les"
      echo "   variables (hors ligne, projet non lié, ou CLI ancienne)."
      echo ""
      echo "   Tu peux regarder toi-même :   vercel env ls production"
      echo "   Puis déployer sans cette vérification :"
      echo ""
      echo "       sh d --sans-verification"
    fi
    echo ""
    exit 1
  fi
  echo ""
fi

#  --------------------------------------------------------------
#  3. LE DÉPLOIEMENT.
#  --------------------------------------------------------------
#    --prod             met en PRODUCTION (le vrai site), pas en
#                       préproduction — c'est le raccourci officiel de
#                       `--target=production`
#    --non-interactive  ne pose aucune question, et surtout ne tire
#                       JAMAIS les variables d'environnement (voir le
#                       piège, plus haut)
vercel deploy --prod --non-interactive

#  --------------------------------------------------------------
#  4. LA FIN.
#  --------------------------------------------------------------
#  `set -e` en tête arrête le script à la première erreur : si Vercel
#  échoue, son message reste à l'écran et les deux lignes ci-dessous ne
#  s'affichent pas. La fenêtre ne se ferme pas toute seule — c'est TON
#  terminal, pas une fenêtre ouverte par le script.
echo ""
echo "✓  Mis en ligne. L'adresse de production est celle affichée ci-dessus."
echo ""
