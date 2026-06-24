# 🔑 Guide de génération des clés secrètes

Ce guide explique comment générer des clés sécurisées pour votre application de pointage.

## 📋 Table des matières

1. [Pourquoi des clés secrètes ?](#pourquoi)
2. [Méthodes de génération](#méthodes)
3. [Utilisation](#utilisation)
4. [Bonnes pratiques](#bonnes-pratiques)

---

## 🎯 Pourquoi des clés secrètes ? {#pourquoi}

Votre application utilise deux clés secrètes critiques :

### **JWT_SECRET**
- **Usage :** Signature et vérification des tokens d'authentification
- **Sécurité :** Si compromise, un attaquant peut créer des tokens valides et usurper l'identité de n'importe quel utilisateur
- **Longueur recommandée :** 256 bits (64 caractères hexadécimaux)

### **QR_SECRET_KEY**
- **Usage :** Génération et validation des QR codes des sites
- **Sécurité :** Si compromise, un attaquant peut créer de faux QR codes
- **Longueur recommandée :** 256 bits (64 caractères hexadécimaux)

---

## 🛠️ Méthodes de génération {#méthodes}

### **Méthode 1 : Script Node.js (Recommandé)**

Utilisez le script fourni dans le projet :

```bash
cd backend
node generate-keys.js
```

**Sortie :**
```
🔐 Génération des clés secrètes pour le projet

JWT_SECRET="ecf96fd029ed98591fc9bed1be19933fda8cc196d99e46a2580d785ef5593a38"
QR_SECRET_KEY="ff61ed7a0d95f007318535bc5d6e2b75983f6da63c487f5799ea7f0b69ccc488"
```

### **Méthode 2 : OpenSSL (Linux/Mac)**

```bash
# Générer JWT_SECRET
openssl rand -hex 32

# Générer QR_SECRET_KEY
openssl rand -hex 32
```

### **Méthode 3 : PowerShell (Windows)**

```powershell
# Générer JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Générer QR_SECRET_KEY
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### **Méthode 4 : En ligne (Déconseillé pour la production)**

⚠️ **Attention :** N'utilisez jamais de générateurs en ligne pour la production !

Pour le développement uniquement :
- https://randomkeygen.com/
- https://www.uuidgenerator.net/

---

## 📝 Utilisation {#utilisation}

### **1. Créer le fichier .env**

Copiez `.env.example` vers `.env` :

```bash
cd backend
cp .env.example .env
```

### **2. Remplacer les clés**

Éditez le fichier `.env` et remplacez les valeurs par défaut :

**Avant :**
```env
JWT_SECRET="votre_secret_jwt_tres_securise_ici"
QR_SECRET_KEY="cle_secrete_pour_qr_codes"
```

**Après :**
```env
JWT_SECRET="ecf96fd029ed98591fc9bed1be19933fda8cc196d99e46a2580d785ef5593a38"
QR_SECRET_KEY="ff61ed7a0d95f007318535bc5d6e2b75983f6da63c487f5799ea7f0b69ccc488"
```

### **3. Vérifier la configuration**

```bash
# Afficher les variables d'environnement (sans les valeurs sensibles)
cat .env | grep -E "JWT_SECRET|QR_SECRET_KEY" | sed 's/=.*/=***HIDDEN***/'
```

---

## 🔒 Bonnes pratiques {#bonnes-pratiques}

### ✅ À FAIRE

1. **Générer des clés différentes pour chaque environnement**
   ```
   Développement : clés_dev
   Staging       : clés_staging
   Production    : clés_production
   ```

2. **Utiliser des clés longues et aléatoires**
   - Minimum 32 caractères
   - Recommandé : 64 caractères (256 bits)

3. **Sauvegarder les clés de manière sécurisée**
   - Gestionnaire de mots de passe (1Password, Bitwarden)
   - Coffre-fort d'équipe
   - Variables d'environnement du serveur

4. **Restreindre l'accès au fichier .env**
   ```bash
   chmod 600 .env
   ```

5. **Ajouter .env au .gitignore**
   ```gitignore
   # Fichiers de configuration sensibles
   .env
   .env.local
   .env.production
   ```

### ❌ À NE PAS FAIRE

1. ❌ **Ne JAMAIS commiter les clés dans Git**
2. ❌ **Ne JAMAIS partager les clés par email/chat**
3. ❌ **Ne JAMAIS utiliser les mêmes clés en dev et prod**
4. ❌ **Ne JAMAIS utiliser des clés simples** (`secret123`, `password`, etc.)
5. ❌ **Ne JAMAIS exposer les clés dans les logs**

---

## 🚀 Déploiement

### **OVH VPS / Serveur dédié**

1. Connectez-vous au serveur :
   ```bash
   ssh user@votre-serveur.com
   ```

2. Créez le fichier .env :
   ```bash
   cd /var/www/pointage/backend
   nano .env
   ```

3. Collez les clés générées et sauvegardez (Ctrl+X, Y, Enter)

4. Sécurisez le fichier :
   ```bash
   chmod 600 .env
   chown www-data:www-data .env
   ```

### **cPanel**

1. Accédez au gestionnaire de fichiers
2. Naviguez vers le dossier `backend/`
3. Créez un nouveau fichier `.env`
4. Collez les clés générées
5. Définissez les permissions à `600`

### **Variables d'environnement (Recommandé)**

Au lieu d'utiliser un fichier `.env`, définissez les variables directement :

```bash
# Ajouter au fichier ~/.bashrc ou ~/.profile
export JWT_SECRET="votre_cle_jwt"
export QR_SECRET_KEY="votre_cle_qr"
export DATABASE_URL="postgresql://..."
```

Ou avec PM2 :
```bash
pm2 start server.js --name pointage-api --env production
```

Fichier `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [{
    name: 'pointage-api',
    script: './server.js',
    env_production: {
      NODE_ENV: 'production',
      JWT_SECRET: 'votre_cle_jwt',
      QR_SECRET_KEY: 'votre_cle_qr',
      DATABASE_URL: 'postgresql://...'
    }
  }]
};
```

---

## 🔄 Rotation des clés

Il est recommandé de changer les clés périodiquement (tous les 6-12 mois) :

1. Générer de nouvelles clés
2. Mettre à jour le fichier .env
3. Redémarrer l'application
4. ⚠️ **Attention :** Tous les tokens JWT existants seront invalidés

---

## 📞 Support

En cas de problème :
1. Vérifiez que le fichier `.env` existe
2. Vérifiez les permissions du fichier
3. Vérifiez que les clés sont bien chargées : `console.log(process.env.JWT_SECRET ? 'OK' : 'MISSING')`
4. Redémarrez l'application après modification

---

**Date de création :** 30 janvier 2026  
**Dernière mise à jour :** 30 janvier 2026
