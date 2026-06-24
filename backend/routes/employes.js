const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware, managerMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Obtenir tous les employés
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employes = await prisma.employe.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        departement: true,
        superieurHierarchique: true,
        emailSuperieur: true,
        createdAt: true
      },
      orderBy: { nom: 'asc' }
    });
    res.json(employes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des employés' });
  }
});

// Créer un employé (Admin ou Manager)
router.post('/', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, pin, role, departement, superieurHierarchique, emailSuperieur } = req.body;

    // Seuls les admins peuvent créer d'autres admins
    if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent créer d\'autres administrateurs' });
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
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'employé' });
  }
});

// Changer son propre code PIN (pour l'employé connecté) - DOIT être avant /:id
router.put('/me/change-pin', authMiddleware, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const employeId = req.user.id;
    
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'Le nouveau code PIN doit contenir exactement 4 chiffres' });
    }
    
    // Récupérer l'employé avec son PIN actuel
    const employe = await prisma.employe.findUnique({
      where: { id: employeId }
    });
    
    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    // Vérifier l'ancien PIN
    const pinValid = await bcrypt.compare(oldPin, employe.pin);
    if (!pinValid) {
      return res.status(400).json({ error: 'Ancien code PIN incorrect' });
    }
    
    // Hasher et mettre à jour le nouveau PIN
    const pinHash = await bcrypt.hash(newPin, 10);
    
    await prisma.employe.update({
      where: { id: employeId },
      data: { pin: pinHash }
    });
    
    res.json({ message: 'Code PIN modifié avec succès' });
  } catch (error) {
    console.error('Erreur changement PIN:', error);
    res.status(500).json({ error: 'Erreur lors du changement de PIN' });
  }
});

// Modifier son propre profil (pour l'employé connecté) - DOIT être avant /:id
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { nom, prenom, telephone, departement, superieurHierarchique } = req.body;
    const employeId = req.user.id;
    
    // L'employé peut seulement modifier son nom, prénom, téléphone, département et supérieur hiérarchique
    // Il ne peut PAS modifier son email, rôle ou statut actif
    const employe = await prisma.employe.update({
      where: { id: employeId },
      data: { 
        nom, 
        prenom, 
        telephone: telephone || null,
        departement: departement || null,
        superieurHierarchique: superieurHierarchique || null
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        departement: true,
        superieurHierarchique: true,
        createdAt: true
      }
    });
    
    res.json(employe);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Obtenir un employé par ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const employe = await prisma.employe.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        departement: true,
        superieurHierarchique: true,
        emailSuperieur: true,
        createdAt: true
      }
    });

    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json(employe);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'employé' });
  }
});

// Mettre à jour un employé
// Modifier un employé (Admin ou Manager)
// Modifier un employé (Admin ou Manager)
router.put('/:id', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role, actif, departement, superieurHierarchique, emailSuperieur } = req.body;

    // Seuls les admins peuvent promouvoir quelqu'un au rôle ADMIN
    if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent attribuer le rôle administrateur' });
    }

    // Vérifier si on essaie de modifier un admin (seuls les admins peuvent modifier d'autres admins)
    const employeActuel = await prisma.employe.findUnique({
      where: { id: req.params.id },
      select: { role: true }
    });

    if (employeActuel?.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent modifier d\'autres administrateurs' });
    }

    const employe = await prisma.employe.update({
      where: { id: req.params.id },
      data: { 
        nom, 
        prenom, 
        email: email || null, 
        telephone, 
        role, 
        actif, 
        departement, 
        superieurHierarchique,
        emailSuperieur
      }
    });

    const { pin: _, ...employeSansPin } = employe;
    res.json(employeSansPin);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'employé' });
  }
});

// Désactiver un employé (Admin ou Manager)
router.delete('/:id', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const employeId = req.params.id;
    
    // Vérifier si on essaie de désactiver un admin (seuls les admins peuvent désactiver d'autres admins)
    const employeActuel = await prisma.employe.findUnique({
      where: { id: employeId },
      select: { role: true, prenom: true, nom: true }
    });

    if (employeActuel?.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent désactiver d\'autres administrateurs' });
    }
    
    // Désactiver l'employé au lieu de le supprimer
    const employe = await prisma.employe.update({
      where: { id: employeId },
      data: { actif: false }
    });
    
    // Compter les pointages qui seront masqués
    const pointagesCount = await prisma.pointage.count({
      where: { employeId }
    });
    
    res.json({ 
      message: `Employé ${employe.prenom} ${employe.nom} désactivé avec succès`,
      pointagesMasques: pointagesCount
    });
  } catch (error) {
    console.error('Erreur désactivation employé:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la désactivation de l\'employé' });
  }
});

// Réactiver un employé (Admin ou Manager)
router.put('/:id/activer', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const employe = await prisma.employe.update({
      where: { id: req.params.id },
      data: { actif: true }
    });
    
    res.json({ 
      message: `Employé ${employe.prenom} ${employe.nom} réactivé avec succès`,
      employe
    });
  } catch (error) {
    console.error('Erreur réactivation employé:', error);
    res.status(500).json({ error: 'Erreur lors de la réactivation' });
  }
});

// Réinitialiser le code PIN d'un employé
router.put('/:id/reset-pin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { newPin } = req.body;
    
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'Le code PIN doit contenir exactement 4 chiffres' });
    }
    
    const pinHash = await bcrypt.hash(newPin, 10);
    
    const employe = await prisma.employe.update({
      where: { id: req.params.id },
      data: { pin: pinHash }
    });
    
    res.json({ 
      message: `Code PIN de ${employe.prenom} ${employe.nom} réinitialisé avec succès`
    });
  } catch (error) {
    console.error('Erreur reset PIN:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du PIN' });
  }
});

module.exports = router;
