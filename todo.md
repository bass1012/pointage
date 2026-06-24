# Tâches réalisées (Todo)

- [x] **Environnement et Débogage**
  - Résolution de l'erreur `EADDRINUSE` sur le port 5000 en passant le backend sur le port 5001.
  - Résolution des erreurs CORS entre `http://localhost:3000` et `http://localhost:5001`.
  - Octroi des droits `CREATEDB` / `SUPERUSER` au rôle PostgreSQL `mct_pointage` pour réussir la migration Prisma.

- [x] **Base de données et Backend**
  - Ajout des types `PAUSE` et `REPRISE` à l'énumération `TypePointage` dans `schema.prisma`.
  - Création et exécution de la migration Prisma (`npx prisma migrate dev`).
  - Installation des paquets `nodemailer` et `node-cron`.
  - Configuration du service SMTP dans le fichier `.env` (`mail.mct.ci`).
  - Création du job cron (`cron/checkPointages.js`) qui s'exécute à 18h00 tous les jours pour vérifier les pointages.
  - Initialisation du cron au démarrage du serveur (`server.js`).

- [x] **Frontend (Interface Utilisateur)**
  - Suppression de la logique de calcul de la durée du travail et des heures supplémentaires dans `Pointages.js`.
  - Mise à jour de `Scanner.js` pour inclure 4 boutons : **Arrivée**, **Pause**, **Reprise**, **Départ**.
  - Mise à jour de `QuickPointage.js` pour intégrer ces mêmes 4 boutons avec un code couleur spécifique.
  - Adaptation de l'affichage des badges (couleurs et libellés) dans `Pointages.js`, `Dashboard.js` et `MesPointages.js`.

- [ ] **Tests et Déploiement**
  - Tester en conditions réelles les nouveaux statuts de pointage depuis les appareils mobiles.
  - Vérifier la bonne réception de l'e-mail par `supportuser@mct.ci` à 18h00.
