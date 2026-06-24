require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createTestSite() {
  try {
    // Générer un identifiant unique et une clé secrète pour le QR code
    const qrCode = crypto.randomBytes(16).toString('hex');
    const qrSecret = crypto.randomBytes(32).toString('hex');

    const site = await prisma.site.create({
      data: {
        nom: 'Bureau Principal',
        adresse: '123 Rue de Test',
        ville: 'Abidjan',
        codePostal: '00225',
        qrCode,
        qrSecret,
        latitude: 5.3599517,
        longitude: -4.0082563
      }
    });

    console.log('✅ Site de test créé avec succès !');
    console.log('📍 Site:', site.nom);
    console.log('🔑 ID:', site.id);
    console.log('');
    console.log('📱 Prochaines étapes:');
    console.log('1. Connectez-vous en tant qu\'admin');
    console.log('2. Allez dans "Sites"');
    console.log('3. Cliquez sur l\'icône QR Code du site "' + site.nom + '"');
    console.log('4. Téléchargez l\'image du QR code');
    console.log('5. Essayez de scanner cette image depuis votre mobile');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Un site avec ces informations existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestSite();
