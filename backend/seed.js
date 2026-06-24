require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const pinHash = await bcrypt.hash('1234', 10);
    
    const admin = await prisma.employe.create({
      data: {
        nom: 'OUED',
        prenom: 'Bass',
        email: 'supportuser@mct.ci',
        telephone: '0708205263',
        pin: pinHash,
        role: 'ADMIN'
      }
    });

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log('📧 Email: supportuser@mct.ci');
    console.log('🔑 PIN: 1234');
    console.log('');
    console.log('Détails:', admin);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Un admin existe déjà avec cet email');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
