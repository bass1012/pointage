# 🚀 Guide de Déploiement sur cPanel

Guide complet pour déployer l'application de pointage QR Code sur un hébergement cPanel.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Limitations cPanel](#limitations-cpanel)
3. [Architecture de déploiement](#architecture-de-déploiement)
4. [Préparation de l'hébergement](#préparation-de-lhébergement)
5. [Configuration de la base de données](#configuration-de-la-base-de-données)
6. [Déploiement du Backend](#déploiement-du-backend)
7. [Déploiement du Frontend](#déploiement-du-frontend)
8. [Configuration Node.js dans cPanel](#configuration-nodejs-dans-cpanel)
9. [SSL/HTTPS](#sslhttps)
10. [Configuration des domaines](#configuration-des-domaines)
11. [Maintenance](#maintenance)
12. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Hébergement cPanel
- **Hébergement mutualisé** avec accès cPanel
- **Node.js support** (vérifier avec l'hébergeur)
- **PostgreSQL** ou **MySQL** (adapter selon disponibilité)
- **SSH access** (recommandé mais pas obligatoire)
- **Espace disque**: Minimum 2GB
- **RAM**: Minimum 512MB (1GB recommandé)

### Versions requises
- **Node.js**: v14+ (vérifier la version disponible dans cPanel)
- **PostgreSQL**: v12+ ou **MySQL**: v5.7+
- **PHP**: v7.4+ (pour phpMyAdmin/phpPgAdmin)

### Accès nécessaires
- Accès cPanel
- Accès FTP ou File Manager
- Accès SSH (optionnel mais recommandé)

---

## ⚠️ Limitations cPanel

### Différences avec VPS

cPanel est un hébergement mutualisé avec certaines limitations :

- ❌ **Pas d'accès root** - Impossible d'installer des packages système
- ❌ **Ressources limitées** - RAM et CPU partagés
- ❌ **Pas de PM2** - Utilisation du gestionnaire Node.js de cPanel
- ❌ **Ports limités** - Pas d'accès direct aux ports personnalisés
- ✅ **Interface graphique** - Configuration simplifiée via cPanel
- ✅ **SSL gratuit** - Let's Encrypt intégré
- ✅ **Sauvegardes automatiques** - Selon l'hébergeur

### Recommandations

Pour une application Node.js complexe, un **VPS est recommandé**. Cependant, cPanel peut fonctionner pour :
- Petites équipes (< 50 employés)
- Trafic modéré
- Budget limité

---

## 🏗 Architecture de déploiement

```
Internet
    ↓
[cPanel Apache/LiteSpeed]
    ↓
    ├─→ Frontend React (public_html/app)
    └─→ Backend Node.js (nodejs app via cPanel)
            ↓
        [PostgreSQL/MySQL via cPanel]
```

---

## 🖥 Préparation de l'hébergement

### 1. Connexion à cPanel

Accédez à votre cPanel :
```
https://votre-domaine.com:2083
ou
https://votre-domaine.com/cpanel
```

### 2. Vérifier Node.js

Dans cPanel, cherchez :
- **"Setup Node.js App"** ou
- **"Application Manager"** ou
- **"Node.js Selector"**

Si absent, contactez votre hébergeur pour activer Node.js.

### 3. Accès SSH (recommandé)

#### Activer SSH dans cPanel

1. Allez dans **"SSH Access"**
2. Cliquez sur **"Manage SSH Keys"**
3. Générez ou importez une clé SSH
4. Autorisez la clé

#### Connexion SSH

```bash
ssh votre-utilisateur@votre-domaine.com -p 2222
# ou le port SSH fourni par votre hébergeur
```

### 4. Accès FTP (alternative)

Si pas de SSH, utilisez FTP :
- **Host**: ftp.votre-domaine.com
- **Username**: votre-utilisateur-cpanel
- **Password**: votre-mot-de-passe
- **Port**: 21 (FTP) ou 22 (SFTP)

Clients FTP recommandés :
- FileZilla
- Cyberduck
- WinSCP (Windows)

---

## 🗄️ Configuration de la base de données

### Option 1: PostgreSQL (si disponible)

#### 1. Créer la base de données

Dans cPanel :
1. Allez dans **"PostgreSQL Databases"**
2. Créez une nouvelle base de données : `pointage_db`
3. Créez un utilisateur : `pointage_user`
4. Définissez un mot de passe fort
5. Ajoutez l'utilisateur à la base avec tous les privilèges

#### 2. Noter les informations

```
Host: localhost
Database: votre-cpanel-user_pointage_db
Username: votre-cpanel-user_pointage_user
Password: votre-mot-de-passe
Port: 5432
```

⚠️ **Note**: cPanel préfixe automatiquement les noms avec votre nom d'utilisateur.

### Option 2: MySQL (alternative)

Si PostgreSQL n'est pas disponible, utilisez MySQL :

#### 1. Créer la base MySQL

Dans cPanel :
1. Allez dans **"MySQL Databases"**
2. Créez une base : `pointage_db`
3. Créez un utilisateur : `pointage_user`
4. Définissez un mot de passe
5. Ajoutez l'utilisateur à la base (ALL PRIVILEGES)

#### 2. Adapter Prisma pour MySQL

Modifiez `backend/prisma/schema.prisma` :

```prisma
datasource db {
  provider = "mysql"  // Changé de "postgresql" à "mysql"
  url      = env("DATABASE_URL")
}
```

#### 3. Adapter DATABASE_URL

```env
DATABASE_URL="mysql://votre-cpanel-user_pointage_user:password@localhost:3306/votre-cpanel-user_pointage_db"
```

---

## 🔧 Déploiement du Backend

### 1. Préparer les fichiers localement

Sur votre machine locale :

```bash
cd /chemin/vers/POINTAGE\ 2/backend

# Créer une archive sans node_modules
tar -czf backend.tar.gz \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='.env' \
  .
```

### 2. Uploader via cPanel

#### Option A: File Manager (interface graphique)

1. Dans cPanel, ouvrez **"File Manager"**
2. Naviguez vers le répertoire home (`/home/votre-user/`)
3. Créez un dossier `nodejs-apps`
4. Créez un sous-dossier `pointage-backend`
5. Uploadez `backend.tar.gz`
6. Clic droit → **Extract**

#### Option B: Via SSH

```bash
# Se connecter en SSH
ssh votre-user@votre-domaine.com -p 2222

# Créer les répertoires
mkdir -p ~/nodejs-apps/pointage-backend
cd ~/nodejs-apps/pointage-backend

# Uploader depuis votre machine locale (dans un autre terminal)
scp -P 2222 backend.tar.gz votre-user@votre-domaine.com:~/nodejs-apps/pointage-backend/

# Retour en SSH, extraire
tar -xzf backend.tar.gz
rm backend.tar.gz
```

#### Option C: Via FTP

1. Connectez-vous avec FileZilla
2. Naviguez vers `/home/votre-user/`
3. Créez `nodejs-apps/pointage-backend`
4. Uploadez tous les fichiers du backend (sauf node_modules)

### 3. Configuration du Backend

#### Créer le fichier .env

Via SSH :
```bash
cd ~/nodejs-apps/pointage-backend
nano .env
```

Via File Manager :
1. Naviguez vers `nodejs-apps/pointage-backend`
2. Cliquez sur **"+ File"**
3. Nommez-le `.env`
4. Cliquez sur **"Edit"**

**Contenu du fichier `.env` :**

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://votre-cpanel-user_pointage_user:VotreMotDePasse@localhost:5432/votre-cpanel-user_pointage_db"

# OU pour MySQL
# DATABASE_URL="mysql://votre-cpanel-user_pointage_user:VotreMotDePasse@localhost:3306/votre-cpanel-user_pointage_db"

# JWT
JWT_SECRET="votre_secret_jwt_tres_securise_changez_moi_123456789"

# QR Code
QR_SECRET_KEY="cle_secrete_qr_changez_moi_987654321"

# Serveur
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL="https://votre-domaine.com"
```

⚠️ **Important**: Remplacez `votre-cpanel-user` par votre nom d'utilisateur cPanel réel.

### 4. Créer le dossier uploads

```bash
mkdir -p uploads
chmod 755 uploads
```

Ou via File Manager : créez le dossier `uploads` dans `pointage-backend`.

---

## 🎨 Déploiement du Frontend

### 1. Build local du Frontend

Sur votre machine locale :

```bash
cd /chemin/vers/POINTAGE\ 2/frontend

# Créer .env.production
echo "REACT_APP_API_URL=https://votre-domaine.com/api" > .env.production

# Installer et builder
npm install
npm run build

# Créer une archive
cd build
tar -czf frontend-build.tar.gz *
```

### 2. Uploader vers cPanel

#### Via File Manager

1. Dans cPanel, ouvrez **"File Manager"**
2. Naviguez vers `public_html`
3. Créez un dossier `app` (ou utilisez directement `public_html` pour le domaine principal)
4. Uploadez `frontend-build.tar.gz`
5. Extrayez l'archive
6. Supprimez l'archive

#### Via SSH

```bash
# Upload depuis votre machine
scp -P 2222 frontend-build.tar.gz votre-user@votre-domaine.com:~/public_html/

# En SSH sur le serveur
cd ~/public_html
mkdir -p app
cd app
tar -xzf ../frontend-build.tar.gz
rm ../frontend-build.tar.gz
```

### 3. Configuration .htaccess pour React Router

Créez un fichier `.htaccess` dans le dossier du frontend :

```bash
cd ~/public_html/app
nano .htaccess
```

**Contenu du fichier `.htaccess` :**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /app/
  
  # Rediriger HTTP vers HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # React Router - SPA
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /app/index.html [L]
</IfModule>

# Cache pour les assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Sécurité
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

Si le frontend est à la racine (`public_html`), changez `RewriteBase /app/` en `RewriteBase /`.

---

## ⚙️ Configuration Node.js dans cPanel

### 1. Créer l'application Node.js

Dans cPanel :

1. Allez dans **"Setup Node.js App"**
2. Cliquez sur **"Create Application"**
3. Configurez :
   - **Node.js version**: Choisir la plus récente (v14+)
   - **Application mode**: Production
   - **Application root**: `nodejs-apps/pointage-backend`
   - **Application URL**: `api` (créera votre-domaine.com/api)
   - **Application startup file**: `server.js`
   - **Environment variables**: Cliquez sur "Add Variable" pour chaque variable du .env

4. Cliquez sur **"Create"**

### 2. Installer les dépendances

Dans la page de l'application Node.js :

1. Copiez la commande pour entrer dans l'environnement virtuel
2. Connectez-vous en SSH
3. Exécutez la commande copiée (ressemble à) :

```bash
source /home/votre-user/nodevenv/nodejs-apps/pointage-backend/14/bin/activate
```

4. Installez les dépendances :

```bash
cd ~/nodejs-apps/pointage-backend
npm install --production
```

### 3. Configuration Prisma

```bash
# Toujours dans l'environnement virtuel Node.js
npx prisma generate
npx prisma migrate deploy
```

Si erreur avec Prisma (problème de binaires), utilisez :

```bash
# Forcer la génération du client pour la plateforme Linux
npx prisma generate --generator client
```

### 4. Créer l'utilisateur admin

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

### 5. Démarrer l'application

Retournez dans cPanel → **"Setup Node.js App"** :
1. Trouvez votre application
2. Cliquez sur **"Start"** ou **"Restart"**
3. Vérifiez le statut (doit être "Running")

### 6. Configuration du proxy Apache

Créez ou modifiez `.htaccess` dans `public_html` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Proxy pour l'API Node.js
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]
  
  # Proxy pour les uploads
  RewriteCond %{REQUEST_URI} ^/uploads
  RewriteRule ^uploads/(.*)$ http://127.0.0.1:3000/uploads/$1 [P,L]
</IfModule>

# Activer le proxy
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:3000/api
  ProxyPassReverse /api http://127.0.0.1:3000/api
  ProxyPass /uploads http://127.0.0.1:3000/uploads
  ProxyPassReverse /uploads http://127.0.0.1:3000/uploads
</IfModule>
```

⚠️ **Note**: Le port 3000 doit correspondre au PORT dans votre .env.

---

## 🔒 SSL/HTTPS

### 1. Activer SSL gratuit (Let's Encrypt)

Dans cPanel :

1. Allez dans **"SSL/TLS Status"**
2. Sélectionnez votre domaine
3. Cliquez sur **"Run AutoSSL"**
4. Attendez la validation (quelques minutes)

### 2. Forcer HTTPS

Ajoutez dans `.htaccess` à la racine de `public_html` :

```apache
# Forcer HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 3. Vérifier le certificat

Visitez : `https://votre-domaine.com`

Le cadenas doit apparaître dans la barre d'adresse.

---

## 🌐 Configuration des domaines

### Option 1: Application sur sous-domaine

Créer un sous-domaine pour l'application :

1. Dans cPanel → **"Subdomains"**
2. Créez : `app.votre-domaine.com`
3. Document Root : `/home/votre-user/public_html/app`
4. Créez le sous-domaine

Modifiez `.htaccess` dans `/public_html/app/` :

```apache
RewriteBase /
```

### Option 2: Application sur domaine principal

Si l'application est à la racine :

1. Placez les fichiers du build directement dans `public_html`
2. Modifiez `.htaccess` avec `RewriteBase /`

### Option 3: Application dans un sous-répertoire

Pour `votre-domaine.com/app` :

1. Fichiers dans `public_html/app`
2. `.htaccess` avec `RewriteBase /app/`
3. Mettez à jour `REACT_APP_API_URL` si nécessaire

---

## 🔄 Maintenance

### 1. Redémarrer l'application Node.js

Via cPanel :
1. **"Setup Node.js App"**
2. Cliquez sur **"Restart"** pour votre application

Via SSH :
```bash
# Arrêter
pkill -f "node.*server.js"

# Redémarrer via cPanel ou
cd ~/nodejs-apps/pointage-backend
source /home/votre-user/nodevenv/nodejs-apps/pointage-backend/14/bin/activate
node server.js &
```

### 2. Voir les logs

Via cPanel :
1. **"Setup Node.js App"**
2. Cliquez sur votre application
3. Consultez les logs en bas de page

Via SSH :
```bash
# Logs de l'application
tail -f ~/nodejs-apps/pointage-backend/logs/*.log

# Logs Apache
tail -f ~/logs/error_log
tail -f ~/logs/access_log
```

### 3. Sauvegarde de la base de données

#### PostgreSQL

Via cPanel :
1. **"phpPgAdmin"**
2. Sélectionnez la base
3. **"Export"**
4. Téléchargez le fichier SQL

Via SSH :
```bash
pg_dump -U votre-cpanel-user_pointage_user -h localhost votre-cpanel-user_pointage_db > backup_$(date +%Y%m%d).sql
```

#### MySQL

Via cPanel :
1. **"phpMyAdmin"**
2. Sélectionnez la base
3. **"Export"** → **"Quick"** → **"Go"**

Via SSH :
```bash
mysqldump -u votre-cpanel-user_pointage_user -p votre-cpanel-user_pointage_db > backup_$(date +%Y%m%d).sql
```

### 4. Mise à jour de l'application

#### Backend

```bash
# Via SSH
cd ~/nodejs-apps/pointage-backend

# Sauvegarder
cp -r . ../pointage-backend-backup-$(date +%Y%m%d)

# Uploader les nouveaux fichiers (via FTP/SSH)
# Puis :
source /home/votre-user/nodevenv/nodejs-apps/pointage-backend/14/bin/activate
npm install --production
npx prisma migrate deploy
npx prisma generate

# Redémarrer via cPanel
```

#### Frontend

```bash
# Sur votre machine locale
npm run build

# Uploader le nouveau build
# Via FTP ou SSH, remplacer les fichiers dans public_html/app
```

### 5. Monitoring

#### Vérifier l'état de l'application

```bash
# Via SSH
ps aux | grep node
curl http://localhost:3000/api/health
```

#### Ressources utilisées

Dans cPanel :
1. **"CPU and Concurrent Connection Usage"**
2. Vérifiez l'utilisation CPU/RAM/Entrées-Sorties

---

## 🐛 Dépannage

### Problème: Application Node.js ne démarre pas

**Solutions:**

1. Vérifier les logs dans cPanel → "Setup Node.js App"
2. Vérifier le fichier `.env` (syntaxe, valeurs)
3. Vérifier les permissions :
```bash
chmod 755 ~/nodejs-apps/pointage-backend
chmod 644 ~/nodejs-apps/pointage-backend/.env
```
4. Réinstaller les dépendances :
```bash
cd ~/nodejs-apps/pointage-backend
source /home/votre-user/nodevenv/nodejs-apps/pointage-backend/14/bin/activate
rm -rf node_modules package-lock.json
npm install --production
```

### Problème: Erreur 500 Internal Server Error

**Solutions:**

1. Vérifier `.htaccess` (syntaxe correcte)
2. Vérifier les logs Apache :
```bash
tail -50 ~/logs/error_log
```
3. Désactiver temporairement `.htaccess` pour tester
4. Vérifier que mod_rewrite est activé (contacter l'hébergeur)

### Problème: API non accessible (404 sur /api)

**Solutions:**

1. Vérifier que l'application Node.js est démarrée (cPanel)
2. Vérifier le proxy dans `.htaccess`
3. Vérifier le port dans `.env` (doit correspondre)
4. Tester directement :
```bash
curl http://localhost:3000/api/health
```
5. Vérifier les règles de réécriture :
```apache
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]
```

### Problème: Erreur de connexion base de données

**Solutions:**

1. Vérifier DATABASE_URL dans `.env`
2. Vérifier le préfixe cPanel (votre-user_)
3. Tester la connexion :
```bash
# PostgreSQL
psql -U votre-cpanel-user_pointage_user -h localhost -d votre-cpanel-user_pointage_db

# MySQL
mysql -u votre-cpanel-user_pointage_user -p -h localhost votre-cpanel-user_pointage_db
```
4. Vérifier les privilèges de l'utilisateur dans cPanel

### Problème: Prisma ne fonctionne pas

**Solutions:**

1. Régénérer le client Prisma :
```bash
cd ~/nodejs-apps/pointage-backend
source /home/votre-user/nodevenv/nodejs-apps/pointage-backend/14/bin/activate
npx prisma generate
```

2. Si erreur de binaire, forcer la plateforme :
```bash
export PRISMA_CLI_BINARY_TARGETS=linux-musl
npx prisma generate
```

3. Vérifier que le schéma correspond à la base (PostgreSQL vs MySQL)

### Problème: Scanner QR ne fonctionne pas

**Solutions:**

1. Vérifier que HTTPS est actif (obligatoire pour caméra)
2. Tester sur différents navigateurs
3. Vérifier les permissions caméra
4. Vérifier la console JavaScript (F12)

### Problème: CORS errors

**Solutions:**

1. Vérifier FRONTEND_URL dans `.env` backend
2. Ajouter la configuration CORS dans `server.js` :
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://votre-domaine.com',
  credentials: true
}));
```

### Problème: Application lente ou timeout

**Solutions:**

1. Vérifier les ressources dans cPanel (CPU/RAM)
2. Optimiser les requêtes base de données
3. Ajouter des index Prisma
4. Considérer un upgrade de plan d'hébergement
5. Migrer vers un VPS si nécessaire

### Problème: Fichiers uploadés non accessibles

**Solutions:**

1. Vérifier les permissions du dossier uploads :
```bash
chmod 755 ~/nodejs-apps/pointage-backend/uploads
chmod 644 ~/nodejs-apps/pointage-backend/uploads/*
```

2. Vérifier le proxy dans `.htaccess` :
```apache
RewriteRule ^uploads/(.*)$ http://127.0.0.1:3000/uploads/$1 [P,L]
```

3. Vérifier la configuration dans `server.js` :
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

## 📊 Optimisations cPanel

### 1. Cache

Ajouter dans `.htaccess` :

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
</IfModule>
```

### 2. Compression

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>
```

### 3. Limite de mémoire Node.js

Dans cPanel → "Setup Node.js App" → Variables d'environnement :

```
NODE_OPTIONS=--max-old-space-size=512
```

### 4. Cron pour redémarrage automatique

Dans cPanel → "Cron Jobs" :

```bash
# Redémarrer l'app tous les jours à 4h du matin
0 4 * * * /usr/bin/pkill -f "node.*server.js" && sleep 5 && cd ~/nodejs-apps/pointage-backend && source ~/nodevenv/nodejs-apps/pointage-backend/14/bin/activate && node server.js > /dev/null 2>&1 &
```

---

## 📝 Checklist de déploiement

- [ ] Hébergement cPanel avec Node.js activé
- [ ] Accès SSH configuré (recommandé)
- [ ] Base de données créée (PostgreSQL ou MySQL)
- [ ] Utilisateur base de données créé avec privilèges
- [ ] Backend uploadé dans `~/nodejs-apps/pointage-backend`
- [ ] Fichier `.env` configuré avec bonnes valeurs
- [ ] Dépendances Node.js installées
- [ ] Prisma généré et migrations exécutées
- [ ] Application Node.js créée dans cPanel
- [ ] Application Node.js démarrée (statut "Running")
- [ ] Frontend buildé et uploadé dans `public_html/app`
- [ ] Fichier `.htaccess` configuré (React Router + Proxy API)
- [ ] SSL/HTTPS activé avec Let's Encrypt
- [ ] Domaine/sous-domaine configuré
- [ ] Premier utilisateur admin créé
- [ ] Test de l'application en production
- [ ] Sauvegarde de la base de données configurée
- [ ] Documentation des identifiants

---

## 🆚 cPanel vs VPS - Comparaison

| Critère | cPanel | VPS |
|---------|--------|-----|
| **Prix** | 💰 Économique (5-20€/mois) | 💰💰 Plus cher (10-50€/mois) |
| **Configuration** | ✅ Simple (interface graphique) | ⚠️ Complexe (ligne de commande) |
| **Performance** | ⚠️ Limitée (ressources partagées) | ✅ Excellente (ressources dédiées) |
| **Scalabilité** | ❌ Limitée | ✅ Flexible |
| **Contrôle** | ⚠️ Limité | ✅ Total (accès root) |
| **Maintenance** | ✅ Gérée par l'hébergeur | ⚠️ À votre charge |
| **Sauvegardes** | ✅ Souvent incluses | ⚠️ À configurer |
| **Support** | ✅ Support hébergeur | ⚠️ Autonomie requise |

**Recommandation** :
- **cPanel** : Petites équipes, budget limité, peu de trafic
- **VPS** : Équipes moyennes/grandes, trafic important, besoin de performance

---

## 📞 Support

### Documentation cPanel
- [cPanel Documentation](https://docs.cpanel.net/)
- [Node.js dans cPanel](https://docs.cpanel.net/cpanel/software/application-manager/)

### Ressources
- Contactez votre hébergeur pour support technique cPanel
- Vérifiez les limites de votre plan d'hébergement
- Consultez les logs pour diagnostiquer les problèmes

---

## 🎉 Félicitations !

Votre application de pointage QR Code est maintenant déployée sur cPanel !

**URL d'accès**: https://votre-domaine.com/app (ou selon votre configuration)

**Identifiants par défaut**:
- Email: admin@pointage.com
- PIN: 1234

⚠️ **Important**: 
- Changez le PIN de l'administrateur dès la première connexion
- Sauvegardez régulièrement votre base de données
- Surveillez l'utilisation des ressources dans cPanel

---

**Date de création**: Janvier 2026  
**Version**: 1.0.0
