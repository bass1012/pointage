require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEmploye() {
  try {
    const pinHash = await bcrypt.hash('1210', 10);
    
    const employe = await prisma.employe.create({
      data: {
        nom: 'OUED',
        prenom: 'Bass',
        email: 'supportuser@mct.ci',
        telephone: '0708205263',
        pin: pinHash,
        role: 'ADMIN'
      }
    });

    console.log('✅ Employé de test créé avec succès !');
    console.log('📧 Email: supportuser@mct.ci');
    console.log('🔑 PIN: 1210');
    console.log('👤 Rôle: ADMIN');
    console.log('');
    console.log('Détails:', employe);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Un employé existe déjà avec cet email');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createEmploye();
