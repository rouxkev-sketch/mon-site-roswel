# Éprouver les migrations sur une VRAIE base

Ce dossier sert à répondre à une seule question, avant chaque livraison
qui touche à `supabase/` :

> **est-ce que ce fichier SQL passe, pour de vrai ?**

Il ne remplace rien : les migrations continuent d'être exécutées **à la
main par le propriétaire**, dans l'éditeur SQL de Supabase. Ce banc joue
sur une base **jetable**, montée puis jetée sur la machine de travail.
Il ne touche jamais la vraie base, et n'en connaît même pas l'adresse.

## Pourquoi il existe

La migration nº 55 a été livrée deux fois sans passer : elle écrivait
`rendu` à NULL, alors que la colonne est `not null` depuis la nº 48. Le
défaut n'était visible qu'à l'exécution — aucune relecture ne l'aurait
attrapé. Un aller-retour sur une base réelle l'aurait montré en dix
secondes.

## Comment s'en servir

```bash
# 1. une base jetable (une fois par session de travail)
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgtest/data -U postgres --auth=trust"
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgtest/data \
  -o '-p 5433 -k /tmp/pgtest' -l /tmp/pgtest/log start"

# 2. les 55 migrations, dans l'ordre du LISEZ-MOI
cp tests/migrations/*.sql tests/migrations/*.sh /tmp/pgtest/
su postgres -c "cd /tmp/pgtest && bash rejouer-migrations.sh yoko"
```

Le banc s'arrête à la **première** erreur et l'affiche, numéro de
migration compris. Tout vert = les 55 fichiers passent d'affilée sur une
base neuve.

## Les deux pièges, déjà payés

1. **`--single-transaction`.** L'éditeur SQL de Supabase joue TOUT un
   fichier dans UNE transaction. Sans cela, un
   `create temporary table … on commit drop` (migration nº 30) disparaît
   à la ligne suivante et la migration échoue — alors qu'elle passe très
   bien chez le propriétaire. Le banc doit imiter l'outil réel.
2. **L'amorce.** Nos fichiers tiennent pour acquis ce que Supabase
   fournit d'office : le schéma `auth` (avec `auth.users` et
   `auth.uid()`), le schéma `storage`, les rôles `anon` /
   `authenticated` / `service_role`, et la table `favoris` héritée du
   produit « artisans ». C'est tout le contenu de
   `amorce-supabase.sql` — et rien de plus : si une migration a besoin
   d'autre chose, c'est qu'elle a une dépendance cachée, et il vaut
   mieux le savoir ici qu'en production.
