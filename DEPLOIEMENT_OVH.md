# 🚀 Guide de Déploiement sur OVH

Guide complet pour déployer l'application de pointage QR Code sur un serveur VPS OVH.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Architecture de déploiement](#architecture-de-déploiement)
3. [Préparation du serveur](#préparation-du-serveur)
4. [Installation des dépendances](#installation-des-dépendances)
5. [Configuration de la base de données](#configuration-de-la-base-de-données)
6. [Déploiement du Backend](#déploiement-du-backend)
7. [Déploiement du Frontend](#déploiement-du-frontend)
8. [Configuration Nginx](#configuration-nginx)
9. [SSL/HTTPS avec Let's Encrypt](#sslhttps-avec-lets-encrypt)
10. [Process Manager avec PM2](#process-manager-avec-pm2)
11. [Sécurité](#sécurité)
12. [Maintenance et monitoring](#maintenance-et-monitoring)
13. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Serveur OVH
- **VPS OVH** (recommandé: VPS SSD 2 ou supérieur)
- **OS**: Ubuntu 22.04 LTS ou Debian 11
- **RAM**: Minimum 2GB (4GB recommandé)
- **Stockage**: Minimum 20GB
- **Accès SSH root** ou utilisateur avec sudo

### Nom de domaine
- Nom de domaine pointant vers votre serveur OVH
- Accès aux DNS pour configuration

### Connaissances requises
- Commandes Linux de base
- SSH
- Gestion de serveur web

---

## 🏗 Architecture de déploiement

```
Internet
    ↓
[Nginx - Port 80/443]
    ↓
    ├─→ Frontend React (Build statique)
    └─→ Backend Node.js (PM2 - Port 5000)
            ↓
        [PostgreSQL - Port 5432]
```

---

## 🖥 Préparation du serveur

### 1. Connexion SSH au serveur

```bash
ssh root@votre-ip-ovh
# ou
ssh votre-utilisateur@votre-ip-ovh
```

### 2. Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Création d'un utilisateur dédié (recommandé)

```bash
# Créer un utilisateur pour l'application
sudo adduser pointage
sudo usermod -aG sudo pointage

# Se connecter avec le nouvel utilisateur
su - pointage
```

### 4. Configuration du pare-feu

```bash
# Installer UFW si non présent
sudo apt install ufw -y

# Autoriser SSH
sudo ufw allow OpenSSH

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable
sudo ufw status
```

---

## 📦 Installation des dépendances

### 1. Installation de Node.js (v18 LTS)

```bash
# Installer Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 2. Installation de PostgreSQL

```bash
# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Démarrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Vérifier le statut
sudo systemctl status postgresql
```

### 3. Installation de Nginx

```bash
# Installer Nginx
sudo apt install nginx -y

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier le statut
sudo systemctl status nginx
```

### 4. Installation de PM2 (Process Manager)

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Vérifier l'installation
pm2 --version
```

### 5. Installation de Git

```bash
sudo apt install git -y
git --version
```

---

## 🗄️ Configuration de la base de données

### 1. Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL, exécuter:
CREATE DATABASE pointage_db;
CREATE USER pointage_user WITH ENCRYPTED PASSWORD 'VotreMotDePasseSecurise123!';
GRANT ALL PRIVILEGES ON DATABASE pointage_db TO pointage_user;
\q
```

### 2. Configuration PostgreSQL pour connexions locales

```bash
# Éditer le fichier de configuration
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ajouter cette ligne (si pas déjà présente):
# local   all             pointage_user                           md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### 3. Test de connexion

```bash
psql -U pointage_user -d pointage_db -h localhost
# Entrer le mot de passe
# Si connexion réussie, taper \q pour quitter
```

---

## 🔧 Déploiement du Backend

### 1. Cloner ou transférer le code

#### Option A: Via Git (recommandé)

```bash
cd /home/pointage
git clone https://votre-repo.git pointage-app
cd pointage-app
```

#### Option B: Via SCP depuis votre machine locale

```bash
# Sur votre machine locale
scp -r /chemin/vers/POINTAGE\ 2 pointage@votre-ip-ovh:/home/pointage/pointage-app
```

### 2. Configuration du Backend

```bash
cd /home/pointage/pointage-app/backend

# Créer le fichier .env
nano .env
```

**Contenu du fichier `.env` :**

```env
# Base de données
DATABASE_URL="postgresql://pointage_user:VotreMotDePasseSecurise123!@localhost:5432/pointage_db"

# JWT
JWT_SECRET="votre_secret_jwt_tres_securise_changez_moi_123456789"

# QR Code
QR_SECRET_KEY="cle_secrete_qr_changez_moi_987654321"

# Serveur
PORT=5000
NODE_ENV=production

# CORS (votre domaine)
FRONTEND_URL="https://votre-domaine.com"
```

### 3. Installation des dépendances

```bash
npm install --production
```

### 4. Configuration de Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Vérifier avec Prisma Studio
# npx prisma studio
```

### 5. Créer le premier utilisateur admin

```bash
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const pinHash = await bcrypt.hash('1234', 10);
    const admin = await prisma.employe.create({
      data: {
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@pointage.com',
        telephone: '0600000000',
        pin: pinHash,
        role: 'ADMIN'
      }
    });
    console.log('✅ Admin créé:', admin);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.\$disconnect();
    process.exit(0);
  }
})();
"
```

### 6. Créer le dossier uploads

```bash
mkdir -p uploads
chmod 755 uploads
```

### 7. Test du backend

```bash
# Test rapide
node server.js

# Si tout fonctionne, arrêter avec Ctrl+C
```

---

## 🎨 Déploiement du Frontend

### 1. Configuration du Frontend

```bash
cd /home/pointage/pointage-app/frontend

# Créer le fichier .env.production
nano .env.production
```

**Contenu du fichier `.env.production` :**

```env
REACT_APP_API_URL=https://votre-domaine.com/api
```

### 2. Installation des dépendances et build

```bash
# Installer les dépendances
npm install

# Créer le build de production
npm run build
```

Le dossier `build` contient maintenant l'application React compilée.

### 3. Déplacer le build vers le répertoire web

```bash
# Créer le répertoire pour le frontend
sudo mkdir -p /var/www/pointage

# Copier le build
sudo cp -r build/* /var/www/pointage/

# Définir les permissions
sudo chown -R www-data:www-data /var/www/pointage
sudo chmod -R 755 /var/www/pointage
```

---

## 🌐 Configuration Nginx

### 1. Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/pointage
```

**Contenu du fichier de configuration :**

```nginx
# Configuration pour l'application de pointage
server {
    listen 80;
    listen [::]:80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/pointage_access.log;
    error_log /var/log/nginx/pointage_error.log;

    # Frontend React
    root /var/www/pointage;
    index index.html;

    # Taille maximale des uploads (pour les images)
    client_max_body_size 10M;

    # API Backend (proxy vers Node.js)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Fichiers uploadés (images des sites)
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend - React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité - Cacher la version Nginx
    server_tokens off;

    # Sécurité - Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 2. Activer la configuration

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/pointage /etc/nginx/sites-enabled/

# Supprimer la config par défaut si présente
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL/HTTPS avec Let's Encrypt

### 1. Installation de Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtenir un certificat SSL

```bash
# Remplacer par votre domaine
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions :
- Entrez votre email
- Acceptez les conditions
- Choisissez de rediriger HTTP vers HTTPS (option 2)

### 3. Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via cron/systemd
sudo systemctl status certbot.timer
```

### 4. Vérifier la configuration HTTPS

Nginx aura automatiquement mis à jour la configuration. Vérifiez :

```bash
sudo nano /etc/nginx/sites-available/pointage
```

Vous devriez voir des sections pour le port 443 avec les certificats SSL.

---

## 🔄 Process Manager avec PM2

### 1. Créer un fichier de configuration PM2

```bash
cd /home/pointage/pointage-app/backend
nano ecosystem.config.js
```

**Contenu du fichier `ecosystem.config.js` :**

```javascript
module.exports = {
  apps: [{
    name: 'pointage-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 2. Créer le dossier logs

```bash
mkdir -p logs
```

### 3. Démarrer l'application avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs pointage-backend

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Exécuter la commande affichée (avec sudo)
```

### 4. Commandes PM2 utiles

```bash
# Redémarrer l'application
pm2 restart pointage-backend

# Arrêter l'application
pm2 stop pointage-backend

# Voir les logs en temps réel
pm2 logs pointage-backend --lines 100

# Monitoring
pm2 monit

# Informations détaillées
pm2 info pointage-backend
```

---

## 🛡️ Sécurité

### 1. Configuration du pare-feu UFW

```bash
# Vérifier les règles actuelles
sudo ufw status verbose

# Bloquer l'accès direct au port 5000 depuis l'extérieur
sudo ufw deny 5000/tcp

# Autoriser uniquement localhost
sudo ufw allow from 127.0.0.1 to any port 5000
```

### 2. Sécuriser PostgreSQL

```bash
# Éditer postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# S'assurer que PostgreSQL écoute uniquement sur localhost
# listen_addresses = 'localhost'

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### 3. Sécuriser SSH

```bash
sudo nano /etc/ssh/sshd_config

# Recommandations:
# PermitRootLogin no
# PasswordAuthentication no (si vous utilisez des clés SSH)
# Port 2222 (changer le port par défaut)

sudo systemctl restart sshd
```

### 4. Installation de Fail2Ban

```bash
# Installer Fail2Ban
sudo apt install fail2ban -y

# Créer une configuration locale
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Activer la protection SSH et Nginx
# [sshd]
# enabled = true
# [nginx-http-auth]
# enabled = true

sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### 5. Mises à jour automatiques de sécurité

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 📊 Maintenance et monitoring

### 1. Sauvegarde de la base de données

Créer un script de sauvegarde :

```bash
sudo nano /home/pointage/backup-db.sh
```

**Contenu du script :**

```bash
#!/bin/bash
BACKUP_DIR="/home/pointage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pointage_db"
DB_USER="pointage_user"

mkdir -p $BACKUP_DIR

# Sauvegarde
PGPASSWORD='VotreMotDePasseSecurise123!' pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compression
gzip $BACKUP_DIR/backup_$DATE.sql

# Garder seulement les 30 dernières sauvegardes
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde terminée: backup_$DATE.sql.gz"
```

Rendre le script exécutable :

```bash
chmod +x /home/pointage/backup-db.sh
```

Ajouter une tâche cron pour sauvegarde quotidienne :

```bash
crontab -e

# Ajouter cette ligne (sauvegarde tous les jours à 2h du matin)
0 2 * * * /home/pointage/backup-db.sh >> /home/pointage/backup.log 2>&1
```

### 2. Monitoring des logs

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/pointage_access.log
sudo tail -f /var/log/nginx/pointage_error.log

# Logs Backend (PM2)
pm2 logs pointage-backend

# Logs système
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### 3. Monitoring des ressources

```bash
# Installer htop
sudo apt install htop -y
htop

# Espace disque
df -h

# Mémoire
free -h

# Processus
pm2 monit
```

### 4. Alertes (optionnel)

Installer un système d'alertes comme Netdata :

```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Accès via : `http://votre-ip:19999`

---

## 🔄 Mise à jour de l'application

### 1. Mise à jour du Backend

```bash
cd /home/pointage/pointage-app/backend

# Sauvegarder la base de données
/home/pointage/backup-db.sh

# Récupérer les dernières modifications (si Git)
git pull origin main

# Installer les nouvelles dépendances
npm install --production

# Exécuter les migrations Prisma
npx prisma migrate deploy
npx prisma generate

# Redémarrer l'application
pm2 restart pointage-backend
```

### 2. Mise à jour du Frontend

```bash
cd /home/pointage/pointage-app/frontend

# Récupérer les modifications
git pull origin main

# Installer les dépendances
npm install

# Rebuild
npm run build

# Copier le nouveau build
sudo rm -rf /var/www/pointage/*
sudo cp -r build/* /var/www/pointage/
sudo chown -R www-data:www-data /var/www/pointage
```

---

## 🐛 Dépannage

### Problème: Backend ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs pointage-backend --lines 50

# Vérifier la connexion à la base de données
cd /home/pointage/pointage-app/backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ DB OK')).catch(e => console.error('❌', e));"

# Vérifier les variables d'environnement
cat .env
```

### Problème: Erreur 502 Bad Gateway

```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier que le port 5000 est écouté
sudo netstat -tlnp | grep 5000

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Problème: Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql

# Tester la connexion
psql -U pointage_user -d pointage_db -h localhost

# Vérifier les logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Problème: Scanner QR ne fonctionne pas

- Vérifier que HTTPS est actif (obligatoire pour accès caméra)
- Vérifier les permissions caméra dans le navigateur
- Tester sur différents navigateurs

### Problème: CORS errors

```bash
# Vérifier la configuration CORS dans backend/server.js
cd /home/pointage/pointage-app/backend
nano server.js

# S'assurer que FRONTEND_URL est correct dans .env
nano .env
```

### Problème: Certificat SSL expiré

```bash
# Renouveler manuellement
sudo certbot renew

# Vérifier la date d'expiration
sudo certbot certificates
```

---

## 📝 Checklist de déploiement

- [ ] Serveur VPS OVH configuré
- [ ] Nom de domaine pointant vers le serveur
- [ ] Node.js installé (v18+)
- [ ] PostgreSQL installé et configuré
- [ ] Nginx installé et configuré
- [ ] Base de données créée et migrée
- [ ] Backend déployé et testé
- [ ] Frontend buildé et déployé
- [ ] SSL/HTTPS configuré avec Let's Encrypt
- [ ] PM2 configuré pour auto-restart
- [ ] Pare-feu UFW configuré
- [ ] Fail2Ban installé
- [ ] Sauvegardes automatiques configurées
- [ ] Premier utilisateur admin créé
- [ ] Tests de l'application en production
- [ ] Documentation des identifiants et secrets

---

## 📞 Support et ressources

### Documentation OVH
- [Guide VPS OVH](https://docs.ovh.com/fr/vps/)
- [Sécuriser un VPS](https://docs.ovh.com/fr/vps/conseils-securisation-vps/)

### Documentation technique
- [Node.js](https://nodejs.org/docs/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Nginx](https://nginx.org/en/docs/)
- [PM2](https://pm2.keymetrics.io/docs/)
- [Prisma](https://www.prisma.io/docs/)

### Outils de test
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **Performance**: https://pagespeed.web.dev/

---

## 🎉 Félicitations !

Votre application de pointage QR Code est maintenant déployée sur OVH !

**URL d'accès**: https://votre-domaine.com

**Identifiants par défaut**:
- Email: admin@pointage.com
- PIN: 1234

⚠️ **Important**: Changez le PIN de l'administrateur dès la première connexion !

---

**Date de création**: Janvier 2026  
**Version**: 1.0.0
