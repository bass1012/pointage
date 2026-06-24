const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware, managerMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/sites');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'site-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG, GIF) sont autorisées'));
    }
  }
});

// Obtenir tous les sites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { nom: 'asc' }
    });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sites' });
  }
});

// Créer un site avec QR code et image optionnelle
router.post('/', authMiddleware, managerMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Création de site - Body:', req.body);
    console.log('📷 Fichier reçu:', req.file);
    
    const { nom, adresse, ville, codePostal, latitude, longitude, rayonMetres, geoRequired } = req.body;

    // Générer un identifiant unique et une clé secrète pour le QR code
    const qrCode = crypto.randomBytes(16).toString('hex');
    const qrSecret = crypto.randomBytes(32).toString('hex');

    // Convertir les valeurs en types appropriés
    const siteData = {
      nom,
      adresse,
      ville,
      codePostal,
      qrCode,
      qrSecret,
      imageUrl: req.file ? req.file.filename : null
    };

    // Ajouter latitude/longitude seulement si elles sont fournies
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      siteData.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      siteData.longitude = parseFloat(longitude);
    }

    // Ajouter rayonMetres si fourni
    if (rayonMetres !== undefined && rayonMetres !== null && rayonMetres !== '') {
      siteData.rayonMetres = parseInt(rayonMetres);
    }

    // Ajouter geoRequired si fourni
    if (geoRequired !== undefined && geoRequired !== null) {
      siteData.geoRequired = geoRequired === 'true' || geoRequired === true;
    }

    const site = await prisma.site.create({
      data: siteData
    });

    console.log('✅ Site créé avec succès:', site.id, '- Image:', site.imageUrl);
    res.status(201).json(site);
  } catch (error) {
    console.error('Erreur création site:', error);
    res.status(500).json({ error: 'Erreur lors de la création du site', details: error.message });
  }
});

// Générer l'image QR code pour un site (format JSON pour scan in-app)
router.get('/:id/qrcode', authMiddleware, async (req, res) => {
  try {
    const site = await prisma.site.findUnique({
      where: { id: req.params.id }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // Créer la donnée à encoder dans le QR code (format JSON)
    const qrData = JSON.stringify({
      siteId: site.id,
      qrCode: site.qrCode,
      nom: site.nom
    });

    // Générer le QR code en image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ 
      qrCode: qrCodeImage,
      siteNom: site.nom 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du QR code' });
  }
});

// Générer l'image QR code avec URL pour scan natif (appareil photo)
router.get('/:id/qrcode-url', authMiddleware, async (req, res) => {
  try {
    const site = await prisma.site.findUnique({
      where: { id: req.params.id }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // URL de base de l'application (à configurer selon l'environnement)
    const baseUrl = process.env.FRONTEND_URL || 'http://192.168.1.139:3000';
    
    // Créer l'URL avec les paramètres
    const pointageUrl = `${baseUrl}/pointage?siteId=${site.id}&qrCode=${site.qrCode}&nom=${encodeURIComponent(site.nom)}`;

    // Générer le QR code en image
    const qrCodeImage = await QRCode.toDataURL(pointageUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ 
      qrCode: qrCodeImage,
      siteNom: site.nom,
      url: pointageUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du QR code URL' });
  }
});

// Obtenir un site par ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const site = await prisma.site.findUnique({
      where: { id: req.params.id }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du site' });
  }
});

// Mettre à jour un site avec possibilité de changer l'image
router.put('/:id', authMiddleware, managerMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('🔄 Mise à jour du site:', req.params.id);
    console.log('📦 Body:', req.body);
    console.log('📷 Nouveau fichier:', req.file);
    
    const { nom, adresse, ville, codePostal, latitude, longitude, actif, rayonMetres, geoRequired } = req.body;

    // Récupérer l'ancien site pour supprimer l'ancienne image si nécessaire
    const oldSite = await prisma.site.findUnique({
      where: { id: req.params.id }
    });

    const updateData = { nom, adresse, ville, codePostal };

    // Convertir et ajouter les champs optionnels
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      updateData.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      updateData.longitude = parseFloat(longitude);
    }
    if (rayonMetres !== undefined && rayonMetres !== null && rayonMetres !== '') {
      updateData.rayonMetres = parseInt(rayonMetres);
    }
    if (geoRequired !== undefined && geoRequired !== null) {
      updateData.geoRequired = geoRequired === 'true' || geoRequired === true;
    }
    if (actif !== undefined && actif !== null) {
      updateData.actif = actif === 'true' || actif === true;
    }

    // Si une nouvelle image est uploadée
    if (req.file) {
      updateData.imageUrl = req.file.filename;
      
      // Supprimer l'ancienne image si elle existe
      if (oldSite?.imageUrl) {
        const oldImagePath = path.join(__dirname, '../uploads/sites', oldSite.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const site = await prisma.site.update({
      where: { id: req.params.id },
      data: updateData
    });

    console.log('✅ Site mis à jour avec succès:', site.id, '- Image:', site.imageUrl);
    res.json(site);
  } catch (error) {
    console.error('❌ Erreur mise à jour site:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du site', details: error.message });
  }
});

// Supprimer un site
router.delete('/:id', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    console.log('🗑️ Suppression du site:', req.params.id);
    
    // Récupérer le site pour supprimer l'image associée
    const site = await prisma.site.findUnique({
      where: { id: req.params.id }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // Vérifier s'il y a des pointages associés
    const pointageCount = await prisma.pointage.count({
      where: { siteId: req.params.id }
    });

    if (pointageCount > 0) {
      console.log('⚠️ Le site a', pointageCount, 'pointages associés');
      return res.status(400).json({ 
        error: `Impossible de supprimer ce site car il a ${pointageCount} pointage(s) enregistré(s). Désactivez-le plutôt.`,
        pointageCount 
      });
    }

    // Supprimer l'image du disque si elle existe
    if (site.imageUrl) {
      const imagePath = path.join(__dirname, '../uploads/sites', site.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🖼️ Image supprimée:', site.imageUrl);
      }
    }

    // Supprimer le site de la base de données
    await prisma.site.delete({
      where: { id: req.params.id }
    });
    
    console.log('✅ Site supprimé avec succès');
    res.json({ message: 'Site supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression site:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du site', details: error.message });
  }
});

module.exports = router;
