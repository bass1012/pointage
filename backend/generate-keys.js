#!/usr/bin/env node

/**
 * Script de génération de clés secrètes pour le déploiement
 * Usage: node generate-keys.js
 */

const crypto = require('crypto');

console.log('\n🔐 Génération des clés secrètes pour le projet\n');
console.log('='.repeat(60));

// Générer JWT_SECRET (64 caractères hexadécimaux = 256 bits)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (pour les tokens d\'authentification):');
console.log(`JWT_SECRET="${jwtSecret}"`);

// Générer QR_SECRET_KEY (64 caractères hexadécimaux = 256 bits)
const qrSecret = crypto.randomBytes(32).toString('hex');
console.log('\n🔲 QR_SECRET_KEY (pour les QR codes):');
console.log(`QR_SECRET_KEY="${qrSecret}"`);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT:');
console.log('1. Copiez ces clés dans votre fichier .env');
console.log('2. Ne partagez JAMAIS ces clés publiquement');
console.log('3. Utilisez des clés différentes pour dev/staging/prod');
console.log('4. Sauvegardez ces clés de manière sécurisée\n');

// Générer un exemple de fichier .env complet
console.log('📄 Exemple de fichier .env complet:\n');
console.log('DATABASE_URL="postgresql://user:password@localhost:5432/pointage_db"');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log('PORT=5000');
console.log('NODE_ENV=production');
console.log(`QR_SECRET_KEY="${qrSecret}"`);
console.log('');
