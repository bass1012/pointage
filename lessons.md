# Leçons Apprises (Lessons Learned)

### 1. Problèmes de ports sous macOS (EADDRINUSE : 5000)
- Sous macOS Monterey et supérieur, le port 5000 est souvent réservé par le service système "AirPlay Receiver" ou "Control Center". Si le backend Express échoue avec `EADDRINUSE`, il est préférable de changer le port (ex: 5001) dans le `.env` et d'adapter le proxy côté Frontend.

### 2. Droits PostgreSQL pour Prisma Migrate
- La commande `npx prisma migrate dev` crée une "shadow database" pour vérifier les schémas avant de les appliquer. L'utilisateur PostgreSQL (`mct_pointage`) doit avoir les droits de création de base de données.
- **Solution :** Exécuter `ALTER ROLE mct_pointage CREATEDB;` (ou `SUPERUSER`) depuis un compte administrateur Postgres.

### 3. Tâches Planifiées (Cron Jobs) dans Node.js
- Le paquet `node-cron` est idéal pour exécuter du code à une heure précise.
- La syntaxe `0 18 * * *` correspond à "18h00 tous les jours".
- Il est crucial d'encapsuler la logique cron dans une fonction séparée (ex: `initCronJobs`) et de ne l'appeler qu'une seule fois dans le cycle de vie du serveur (`server.js`).

### 4. Configuration Nodemailer (SMTP)
- Lors d'une connexion à un serveur de messagerie privé (`mail.mct.ci`), il se peut que le certificat SSL ne soit pas reconnu. L'ajout de l'option `tls: { rejectUnauthorized: false }` permet de forcer la connexion malgré tout (utile pour des environnements internes ou des certificats auto-signés).
- **Toujours intercepter les erreurs d'envoi** avec un bloc `try-catch` pour ne pas faire planter l'application entière en cas de problème de réseau ou d'identification SMTP.

### 5. Modification des Enumérations Prisma (Enum)
- Lorsqu'on modifie un type d'énumération (ajout de `PAUSE` et `REPRISE`), toute la chaîne Full-Stack est impactée.
- Il ne faut pas seulement appliquer la migration en base de données, mais il faut aussi auditer et mettre à jour tous les points du frontend (formulaires, rendus de listes, badges, boutons) qui étaient limités aux anciennes valeurs (`ARRIVEE` / `DEPART`).
