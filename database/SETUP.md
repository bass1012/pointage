# Configuration PostgreSQL pour Pointage

## Installation PostgreSQL sur macOS

```bash
# Via Homebrew
brew install postgresql@15

# Démarrer PostgreSQL
brew services start postgresql@15

# Se connecter
psql postgres
```

## Créer la base de données

```sql
-- Créer l'utilisateur
CREATE USER pointage_user WITH PASSWORD 'pointage_password';

-- Créer la base de données
CREATE DATABASE pointage_db;

-- Donner les privilèges
GRANT ALL PRIVILEGES ON DATABASE pointage_db TO pointage_user;

-- Se connecter à la base
\c pointage_db

-- Quitter
\q
```

## String de connexion pour .env

```
DATABASE_URL="postgresql://pointage_user:pointage_password@localhost:5432/pointage_db"
```

## Commandes utiles

```bash
# Voir les bases de données
psql -l

# Se connecter à une base
psql -d pointage_db

# Voir les tables
\dt

# Voir le contenu d'une table
SELECT * FROM "Employe";
SELECT * FROM "Site";
SELECT * FROM "Pointage";

# Supprimer toutes les données (ATTENTION!)
TRUNCATE "Pointage", "Employe", "Site" CASCADE;
```
