const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Rate limiter strict pour login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion'
});

// Connexion employé avec PIN (email ou téléphone)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, pin } = req.body;

    // Chercher l'employé par email OU par téléphone
    const employe = await prisma.employe.findFirst({
      where: {
        OR: [
          { email: email },
          { telephone: email }
        ]
      }
    });

    if (!employe || !employe.actif) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const pinValide = await bcrypt.compare(pin, employe.pin);

    if (!pinValide) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: employe.id, email: employe.email, role: employe.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email,
        role: employe.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Vérifier le token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const employe = await prisma.employe.findUnique({
      where: { id: decoded.id },
      select: { id: true, nom: true, prenom: true, email: true, role: true }
    });

    res.json({ valid: true, employe });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

// Auto-inscription publique (pour les employés, journaliers et stagiaires)
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, pin, role, departement, superieurHierarchique, emailSuperieur } = req.body;

    // Vérifier que le téléphone est fourni
    if (!telephone) {
      return res.status(400).json({ error: 'Le numéro de téléphone est requis' });
    }

    // Vérifier que le rôle est EMPLOYE, JOURNALIER ou STAGIAIRE uniquement
    if (role && !['EMPLOYE', 'JOURNALIER', 'STAGIAIRE'].includes(role)) {
      return res.status(400).json({ error: 'Rôle non autorisé pour l\'auto-inscription' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const employe = await prisma.employe.create({
      data: {
        nom,
        prenom,
        email: email || null,
        telephone,
        pin: pinHash,
        role: role || 'EMPLOYE',
        departement,
        superieurHierarchique,
        emailSuperieur
      }
    });

    const { pin: _, ...employeSansPin } = employe;
    res.status(201).json(employeSansPin);
  } catch (error) {
    console.error('Erreur inscription:', error);
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return res.status(400).json({ error: 'Cet email ou ce numéro de téléphone existe déjà' });
      }
      return res.status(400).json({ error: 'Ces informations existent déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

module.exports = router;
