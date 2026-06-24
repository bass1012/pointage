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

### 6. Configuration d'Axios et Envoi de FormData (Fichiers/Images)
- **Problème :** Définir globalement l'en-tête `'Content-Type': 'application/json'` dans la configuration d'une instance Axios (`axios.create`) force l'envoi de toutes les requêtes en JSON. Cela écrase l'analyse automatique des objets `FormData` par le navigateur et empêche le bon envoi d'images ou de fichiers (qui nécessitent `multipart/form-data` avec une clé de séparation *boundary*). Le backend reçoit alors un fichier `undefined`.
- **Solution :** Ne pas spécifier d'en-tête `Content-Type` par défaut dans Axios. Laisser Axios et le navigateur configurer dynamiquement l'en-tête selon le type d'objet envoyé (JSON, FormData, etc.).

### 7. Optimisation des builds en production pour petits VPS
- Lancer le build de production d'un frontend React (`npm run build`) sur un serveur VPS à faibles ressources (ex: 1GB de RAM) peut faire planter la compilation ou saturer complètement le processeur.
- **Bonne pratique :** Compiler le build de production localement sur la machine de développement (Mac), puis synchroniser uniquement le dossier compilé (`build/` ou `dist/`) vers le serveur VPS via `rsync` ou `scp`. Cela économise la RAM et le CPU du VPS de production.

### 8. Simplification de l'interface utilisateur (UI) et gain de performance
- Le fait de retirer une fonctionnalité lourde ou inutilisée (comme la détection de QR Code par flux vidéo temps réel) permet d'alléger considérablement le bundle de production de l'application (le bundle JS a été réduit de près de 50 Ko en supprimant la bibliothèque de décodage `jsQR`).
- Intégrer directement les formulaires et listes déroulantes sur la carte principale plutôt que d'utiliser des fenêtres modales superflues fluidifie considérablement l'expérience utilisateur sur mobile (moins d'étapes de clics).

