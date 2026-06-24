# 🏢 Système de Pointage par QR Code

Application complète de gestion des pointages d'employés via QR Code avec interface Ant Design.

## 📋 Fonctionnalités

- ✅ Authentification sécurisée avec JWT
- 📱 Scanner QR Code via caméra mobile
- 👥 Gestion des employés
- 📍 Gestion des sites avec génération automatique de QR codes
- 🕐 Historique des pointages avec filtres
- 📊 Dashboard avec statistiques
- 🌍 Géolocalisation des pointages
- 🔒 Rôles utilisateurs (Admin, Manager, Employé)

## 🛠 Technologies

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT pour l'authentification
- QRCode pour la génération des codes

### Frontend
- React 18
- Ant Design
- React Router
- Axios
- React QR Reader

## 📦 Installation

### Prérequis
- Node.js (v16+)
- PostgreSQL (v12+)
- npm ou yarn

### 1. Backend

```bash
cd backend
npm install

# Configurer la base de données
cp .env.example .env
# Modifier les variables dans .env

# Initialiser Prisma
npx prisma generate
npx prisma migrate dev --name init

# Démarrer le serveur
npm run dev
```

Le serveur backend démarre sur `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install

# Démarrer l'application
npm start
```

L'application démarre sur `http://localhost:3000`

## ⚙️ Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pointage_db"
JWT_SECRET="votre_secret_jwt_tres_securise_ici"
PORT=5000
NODE_ENV=development
QR_SECRET_KEY="cle_secrete_pour_qr_codes"
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🗄️ Base de données

### Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE pointage_db;

# Quitter
\q
```

## 🚀 Démarrage rapide

### Créer un premier utilisateur admin

Depuis le répertoire backend :

```bash
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
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
  console.log('Admin créé:', admin);
  process.exit(0);
})();
"
```

**Identifiants de connexion :**
- Email : `admin@pointage.com`
- PIN : `1234`

## 📱 Utilisation

### 1. Connexion
- Accédez à l'application
- Connectez-vous avec vos identifiants

### 2. Créer des sites
- Allez dans "Sites"
- Créez un nouveau site
- Générez et imprimez le QR code

### 3. Pointer
- Allez dans "Scanner"
- Sélectionnez "Arrivée" ou "Départ"
- Scannez le QR code du site
- Le pointage est enregistré automatiquement

### 4. Consulter les pointages
- Allez dans "Pointages"
- Filtrez par date, employé, site
- Exportez les données

## 📂 Structure du projet

```
POINTAGE 2/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employes.js
│   │   ├── sites.js
│   │   └── pointages.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Dashboard.js
    │   │   ├── Scanner.js
    │   │   ├── Employes.js
    │   │   ├── Sites.js
    │   │   └── Pointages.js
    │   ├── services/
    │   │   ├── api.js
    │   │   └── index.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🔐 Sécurité

- Authentification JWT avec expiration
- Mots de passe hashés avec bcrypt
- Validation des données
- Protection CORS
- QR codes avec clés secrètes

## 🐛 Dépannage

### Erreur de connexion à la base
- Vérifiez que PostgreSQL est démarré
- Vérifiez DATABASE_URL dans .env
- Vérifiez que la base existe

### Scanner QR ne fonctionne pas
- Autorisez l'accès à la caméra dans le navigateur
- Utilisez HTTPS en production
- Vérifiez la compatibilité du navigateur

### Erreur CORS
- Vérifiez que le backend et frontend utilisent les bons ports
- Vérifiez la configuration CORS dans server.js

## 📄 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérifier token

### Employés
- `GET /api/employes` - Liste des employés
- `POST /api/employes` - Créer un employé
- `GET /api/employes/:id` - Détails d'un employé
- `PUT /api/employes/:id` - Modifier un employé
- `DELETE /api/employes/:id` - Supprimer un employé

### Sites
- `GET /api/sites` - Liste des sites
- `POST /api/sites` - Créer un site
- `GET /api/sites/:id` - Détails d'un site
- `GET /api/sites/:id/qrcode` - QR code du site
- `PUT /api/sites/:id` - Modifier un site
- `DELETE /api/sites/:id` - Supprimer un site

### Pointages
- `GET /api/pointages` - Liste des pointages
- `POST /api/pointages` - Créer un pointage
- `GET /api/pointages/employe/:id` - Pointages d'un employé
- `GET /api/pointages/stats` - Statistiques

## 📈 Améliorations futures

- [ ] Export Excel/PDF des pointages
- [ ] Notifications push
- [ ] Rapports automatisés
- [ ] Mode hors-ligne
- [ ] Application mobile native
- [ ] Reconnaissance faciale
- [ ] Intégration avec paie

## 👨‍💻 Développement

```bash
# Backend avec auto-reload
cd backend
npm run dev

# Frontend avec hot-reload
cd frontend
npm start

# Prisma Studio (GUI base de données)
cd backend
npx prisma studio
```

## 📝 Licence

MIT

## 🤝 Support

Pour toute question ou problème, contactez l'équipe de développement.
