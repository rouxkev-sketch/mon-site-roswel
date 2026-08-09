#!/bin/bash
# =====================================================================
#  REJOUER LES 55 MIGRATIONS SUR UNE VRAIE BASE POSTGRESQL
#  ---------------------------------------------------------------------
#  Une base JETABLE, repartie de zéro, l'amorce Supabase, puis les
#  fichiers de `supabase/` DANS L'ORDRE du LISEZ-MOI. On s'arrête à la
#  PREMIÈRE erreur, et on la montre.
# =====================================================================
set -u
PORT=5433
SOCK=/tmp/pgtest
BASE=${1:-yoko}
DEPOT=/home/user/mon-site-roswel
ICI=/tmp/pgtest

#  ⚠️ --single-transaction : L'ÉDITEUR SQL DE SUPABASE joue TOUT le
#  fichier dans UNE SEULE transaction. Sans cela, un
#  `create temporary table … on commit drop` disparaît à la ligne
#  suivante (piège rencontré sur la nº 30). Le banc doit imiter
#  l'outil réel, sinon il éprouve autre chose que ce qui se passe.
pq() { psql -h "$SOCK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 --single-transaction "$@"; }

echo "── base neuve « $BASE » ────────────────────────────────"
psql -h "$SOCK" -p "$PORT" -U postgres -d postgres -c "drop database if exists $BASE" >/dev/null 2>&1
psql -h "$SOCK" -p "$PORT" -U postgres -d postgres -c "create database $BASE" >/dev/null 2>&1

echo "── l'amorce Supabase ───────────────────────────────────"
SORTIE=$(pq -d "$BASE" -q -f "$ICI/amorce-supabase.sql" 2>&1)
if [ $? -ne 0 ]; then
  echo "ÉCHEC de l'amorce :"
  echo "$SORTIE" | grep -E "ERROR|DETAIL" | head -5 | sed 's/^/    /'
  exit 1
fi
echo "  ✓ amorce posée"

mapfile -t LIGNES < <(grep -oE '^\| [0-9]+ \| `[a-z0-9.-]+\.sql`' \
  "$DEPOT/supabase/LISEZ-MOI-ordre-des-migrations.md" \
  | sed 's/^| //; s/ | `/ /; s/`$//')

echo "── les migrations, dans l'ordre ────────────────────────"
ECHECS=0
for LIGNE in "${LIGNES[@]}"; do
  NUM=${LIGNE%% *}
  FICHIER=${LIGNE#* }
  [ -z "$FICHIER" ] && continue
  SORTIE=$(pq -d "$BASE" -q -f "$DEPOT/supabase/$FICHIER" 2>&1)
  if [ $? -ne 0 ]; then
    printf '  ✗ nº %-3s %s\n' "$NUM" "$FICHIER"
    echo "$SORTIE" | grep -E "ERROR|DETAIL|CONTEXT" | head -6 | sed 's/^/       /'
    ECHECS=1
    break
  fi
  printf '  ✓ nº %-3s %s\n' "$NUM" "$FICHIER"
done

if [ "$ECHECS" -eq 0 ]; then
  echo "── LES 55 MIGRATIONS SONT PASSÉES ──────────────────────"
fi
exit $ECHECS
