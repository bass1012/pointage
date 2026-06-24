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

- [x] **Tests et Déploiement**
  - Configuration de l'accès SSH par clé sans mot de passe vers le VPS `77.42.22.25`.
  - Création d'une sauvegarde de sécurité des fichiers de production sur le serveur.
  - Déploiement de l'application de pointage sur le domaine `pointage.mct.ci`.
  - Exécution des migrations Prisma (`add_pause_reprise` et `update_employe_emails`) sur la base de données PostgreSQL de production.
  - Configuration du gestionnaire de processus PM2 (`pointage-api`) pour relancer et maintenir le service.

- [x] **Ajustements Post-Déploiement**
  - **Nettoyage de la base de données** : Vider la table `Pointage` en production (`TRUNCATE`) pour démarrer à zéro.
  - **Suppression d'employé** : Suppression de l'employé de test Adama Dicko (ID: `48b53157-b927-429b-8424-8fd858c61a21`) via SQL.
  - **Simplification du Scanner** : Retrait de la caméra temps réel et du bouton "Prendre une photo" dans [Scanner.js](file:///Users/bassoued/Documents/pointage_vps/pointage/frontend/src/pages/Scanner.js). Le formulaire de choix de site est désormais affiché directement sur la carte principale.
  - **Correction d'upload d'images** : Résolution du bug d'envoi d'images dans [api.js](file:///Users/bassoued/Documents/pointage_vps/pointage/frontend/src/services/api.js) (Axios forçait `application/json` au lieu de laisser `multipart/form-data` se configurer pour les formulaires).
  - **Affichage des images de site** : Affichage de l'image de fond du site dans le header de la carte de pointage rapide ([QuickPointage.js](file:///Users/bassoued/Documents/pointage_vps/pointage/frontend/src/pages/QuickPointage.js)).
