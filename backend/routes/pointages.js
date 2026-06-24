const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Fonction pour calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// Créer un pointage (scan QR code)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { siteId, qrCode, type, latitude, longitude } = req.body;
    const employeId = req.user.id;

    // Vérifier que le site existe et que le QR code correspond
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    if (site.qrCode !== qrCode) {
      return res.status(400).json({ error: 'QR code invalide' });
    }

    if (!site.actif) {
      return res.status(400).json({ error: 'Ce site n\'est plus actif' });
    }

    // ======== VÉRIFICATION GÉOLOCALISATION ========
    if (site.geoRequired) {
      // Vérifier que l'employé a envoyé sa position
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Géolocalisation requise',
          code: 'GEO_REQUIRED',
          message: 'Veuillez activer la géolocalisation pour pointer sur ce site'
        });
      }

      // Vérifier que le site a des coordonnées configurées
      if (!site.latitude || !site.longitude) {
        // Si le site n'a pas de coordonnées, on accepte le pointage (à configurer par l'admin)
        console.log(`Site ${site.nom} n'a pas de coordonnées GPS configurées`);
      } else {
        // Calculer la distance entre l'employé et le site
        const distance = calculateDistance(latitude, longitude, site.latitude, site.longitude);
        const distanceArrondie = Math.round(distance);

        console.log(`Distance de ${site.nom}: ${distanceArrondie}m (max: ${site.rayonMetres}m)`);

        if (distance > site.rayonMetres) {
          return res.status(400).json({ 
            error: 'Vous êtes trop loin du site',
            code: 'TOO_FAR',
            distance: distanceArrondie,
            rayonAutorise: site.rayonMetres,
            message: `Vous êtes à ${distanceArrondie}m du site. Distance maximale autorisée: ${site.rayonMetres}m`
          });
        }
      }
    }
    // ======== FIN VÉRIFICATION GÉOLOCALISATION ========

    // ======== VÉRIFICATION ANTI-SPAM (5 minutes minimum entre chaque pointage) ========
    const DELAI_MINIMUM_MINUTES = 5;
    const delaiMinimum = new Date(Date.now() - DELAI_MINIMUM_MINUTES * 60 * 1000);

    const dernierPointage = await prisma.pointage.findFirst({
      where: {
        employeId,
        siteId,
        timestamp: {
          gte: delaiMinimum
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (dernierPointage) {
      const tempsEcoule = Math.round((Date.now() - new Date(dernierPointage.timestamp).getTime()) / 1000);
      const tempsRestant = DELAI_MINIMUM_MINUTES * 60 - tempsEcoule;
      const minutesRestantes = Math.floor(tempsRestant / 60);
      const secondesRestantes = tempsRestant % 60;

      console.log('=== ALREADY_CHECKED ===');
      console.log('tempsEcoule:', tempsEcoule);
      console.log('tempsRestant:', tempsRestant);
      console.log('dernierPointage:', dernierPointage.type, dernierPointage.timestamp);
      
      const responseData = { 
        error: 'Pointage déjà réalisé',
        code: 'ALREADY_CHECKED',
        message: `Vous avez déjà pointé il y a ${Math.floor(tempsEcoule / 60)} min ${tempsEcoule % 60} sec. Prochain pointage possible dans ${minutesRestantes} min ${secondesRestantes} sec.`,
        dernierPointage: {
          type: dernierPointage.type,
          timestamp: dernierPointage.timestamp
        },
        tempsRestantSecondes: tempsRestant
      };
      
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      return res.status(400).json(responseData);
    }
    // ======== FIN VÉRIFICATION ANTI-SPAM ========

    // ======== VÉRIFICATION HORAIRES ET DURÉE ========
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    // Trouver les pointages de la journée pour cet employé
    const pointagesDuJour = await prisma.pointage.findMany({
      where: {
        employeId,
        timestamp: { gte: aujourdhui }
      },
      orderBy: { timestamp: 'asc' }
    });

    // 1. Vérifier que l'employé n'a pas déjà effectué CE type de pointage aujourd'hui
    const aDejaPointeCeType = pointagesDuJour.some(p => p.type === type);
    if (aDejaPointeCeType) {
      let nomPointage = type.toLowerCase();
      if (type === 'ARRIVEE') nomPointage = 'arrivée';
      if (type === 'DEPART') nomPointage = 'départ';
      return res.status(400).json({ error: `Pointage refusé : vous avez déjà enregistré votre ${nomPointage} pour aujourd'hui.` });
    }

    const now = new Date();

    if (type === 'PAUSE') {
      const arrivee = pointagesDuJour.find(p => p.type === 'ARRIVEE');
      if (!arrivee) {
        return res.status(400).json({ error: 'Vous devez d\'abord enregistrer votre Arrivée avant de prendre la pause.' });
      }
      
      const heuresTravaillees = (now.getTime() - new Date(arrivee.timestamp).getTime()) / (1000 * 60 * 60);
      if (heuresTravaillees < 4) {
        const heures = Math.floor(heuresTravaillees);
        const minutes = Math.floor((heuresTravaillees % 1) * 60);
        return res.status(400).json({ error: `Il faut au moins 4 heures de travail avant la pause. Vous n'avez fait que ${heures}h${minutes.toString().padStart(2, '0')} depuis votre arrivée.` });
      }
    }

    if (type === 'DEPART') {
      const reprise = pointagesDuJour.find(p => p.type === 'REPRISE');
      if (!reprise) {
        return res.status(400).json({ error: 'Vous devez d\'abord enregistrer votre Reprise avant de déclarer votre départ.' });
      }
      
      const heuresTravaillees = (now.getTime() - new Date(reprise.timestamp).getTime()) / (1000 * 60 * 60);
      if (heuresTravaillees < 4) {
        const heures = Math.floor(heuresTravaillees);
        const minutes = Math.floor((heuresTravaillees % 1) * 60);
        return res.status(400).json({ error: `Il faut au moins 4 heures de travail avant le départ. Vous n'avez fait que ${heures}h${minutes.toString().padStart(2, '0')} depuis votre reprise.` });
      }
    }
    // ======== FIN VÉRIFICATION HORAIRES ========

    // Créer le pointage
    const pointage = await prisma.pointage.create({
      data: {
        employeId,
        siteId,
        type,
        latitude,
        longitude
      },
      include: {
        site: {
          select: { nom: true, adresse: true }
        },
        employe: {
          select: { nom: true, prenom: true }
        }
      }
    });

    res.status(201).json({
      message: `${type === 'ARRIVEE' ? 'Arrivée' : 'Départ'} enregistré avec succès`,
      pointage
    });
  } catch (error) {
    console.error('Erreur pointage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du pointage' });
  }
});

// Obtenir tous les pointages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeId, siteId, dateDebut, dateFin, inclureInactifs } = req.query;

    const where = {};
    
    if (employeId) where.employeId = employeId;
    if (siteId) where.siteId = siteId;
    
    if (dateDebut || dateFin) {
      where.timestamp = {};
      if (dateDebut) where.timestamp.gte = new Date(dateDebut);
      if (dateFin) where.timestamp.lte = new Date(dateFin);
    }

    // Filtrer les pointages des employés inactifs par défaut
    if (inclureInactifs !== 'true') {
      where.employe = {
        actif: true
      };
    }

    const pointages = await prisma.pointage.findMany({
      where,
      include: {
        employe: {
          select: { nom: true, prenom: true, email: true, actif: true }
        },
        site: {
          select: { nom: true, adresse: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(pointages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des pointages' });
  }
});

// Obtenir les pointages d'un employé
router.get('/employe/:employeId', authMiddleware, async (req, res) => {
  try {
    const pointages = await prisma.pointage.findMany({
      where: { employeId: req.params.employeId },
      include: {
        site: {
          select: { nom: true, adresse: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json(pointages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des pointages' });
  }
});

// Obtenir les statistiques des pointages
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const [totalAujourdhui, totalMois, pointagesRecents] = await Promise.all([
      prisma.pointage.count({
        where: {
          timestamp: { gte: aujourdhui }
        }
      }),
      prisma.pointage.count({
        where: {
          timestamp: {
            gte: new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1)
          }
        }
      }),
      prisma.pointage.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          employe: {
            select: { nom: true, prenom: true }
          },
          site: {
            select: { nom: true }
          }
        }
      })
    ]);

    res.json({
      totalAujourdhui,
      totalMois,
      pointagesRecents
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Calculer les heures travaillées pour un employé
router.get('/heures/:employeId', authMiddleware, async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    const employeId = req.params.employeId;

    // Vérifier que l'utilisateur peut accéder à ces données
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.id !== employeId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setHours(0, 0, 0, 0));
    const fin = dateFin ? new Date(dateFin) : new Date();

    const pointages = await prisma.pointage.findMany({
      where: {
        employeId,
        timestamp: {
          gte: debut,
          lte: fin
        }
      },
      include: {
        site: {
          select: { nom: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Grouper par jour et calculer les heures
    const heuresParJour = {};
    const detailsParJour = {};
    
    for (let i = 0; i < pointages.length - 1; i++) {
      const arrivee = pointages[i];
      const depart = pointages[i + 1];
      
      if (arrivee.type === 'ARRIVEE' && depart.type === 'DEPART') {
        const jour = new Date(arrivee.timestamp).toLocaleDateString('fr-FR');
        const heures = (new Date(depart.timestamp) - new Date(arrivee.timestamp)) / (1000 * 60 * 60);
        
        if (!heuresParJour[jour]) {
          heuresParJour[jour] = 0;
          detailsParJour[jour] = [];
        }
        
        heuresParJour[jour] += heures;
        detailsParJour[jour].push({
          arrivee: new Date(arrivee.timestamp).toLocaleTimeString('fr-FR'),
          depart: new Date(depart.timestamp).toLocaleTimeString('fr-FR'),
          site: arrivee.site.nom,
          duree: heures.toFixed(2)
        });
      }
    }

    const totalHeures = Object.values(heuresParJour).reduce((sum, h) => sum + h, 0);
    const joursTravailles = Object.keys(heuresParJour).length;
    const moyenneParJour = joursTravailles > 0 ? totalHeures / joursTravailles : 0;

    // Récupérer les infos de l'employé
    const employe = await prisma.employe.findUnique({
      where: { id: employeId },
      select: { nom: true, prenom: true, email: true }
    });

    res.json({
      employe: {
        id: employeId,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email
      },
      periode: { 
        debut: debut.toLocaleDateString('fr-FR'), 
        fin: fin.toLocaleDateString('fr-FR') 
      },
      statistiques: {
        totalHeures: parseFloat(totalHeures.toFixed(2)),
        joursTravailles,
        moyenneParJour: parseFloat(moyenneParJour.toFixed(2)),
        totalPointages: pointages.length
      },
      heuresParJour: Object.keys(heuresParJour).map(jour => ({
        date: jour,
        heures: parseFloat(heuresParJour[jour].toFixed(2)),
        details: detailsParJour[jour]
      })).sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateB.localeCompare(dateA);
      })
    });
  } catch (error) {
    console.error('Erreur calcul heures:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des heures' });
  }
});

// Calculer les heures pour tous les employés (Admin/Manager uniquement)
router.get('/heures', authMiddleware, async (req, res) => {
  try {
    // Vérifier les permissions
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs et managers' });
    }

    const { dateDebut, dateFin } = req.query;
    const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setHours(0, 0, 0, 0));
    const fin = dateFin ? new Date(dateFin) : new Date();

    const employes = await prisma.employe.findMany({
      where: { actif: true },
      select: { id: true, nom: true, prenom: true, email: true, departement: true }
    });

    const resultats = [];

    for (const employe of employes) {
      const pointages = await prisma.pointage.findMany({
        where: {
          employeId: employe.id,
          timestamp: {
            gte: debut,
            lte: fin
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      let totalHeures = 0;
      let joursTravailles = new Set();

      for (let i = 0; i < pointages.length - 1; i++) {
        const arrivee = pointages[i];
        const depart = pointages[i + 1];
        
        if (arrivee.type === 'ARRIVEE' && depart.type === 'DEPART') {
          const heures = (new Date(depart.timestamp) - new Date(arrivee.timestamp)) / (1000 * 60 * 60);
          totalHeures += heures;
          joursTravailles.add(new Date(arrivee.timestamp).toLocaleDateString('fr-FR'));
        }
      }

      resultats.push({
        employe: {
          id: employe.id,
          nom: employe.nom,
          prenom: employe.prenom,
          email: employe.email,
          departement: employe.departement
        },
        totalHeures: parseFloat(totalHeures.toFixed(2)),
        joursTravailles: joursTravailles.size,
        moyenneParJour: joursTravailles.size > 0 ? parseFloat((totalHeures / joursTravailles.size).toFixed(2)) : 0
      });
    }

    // Trier par heures décroissantes
    resultats.sort((a, b) => b.totalHeures - a.totalHeures);

    res.json({
      periode: { 
        debut: debut.toLocaleDateString('fr-FR'), 
        fin: fin.toLocaleDateString('fr-FR') 
      },
      totalEmployes: resultats.length,
      employes: resultats
    });
  } catch (error) {
    console.error('Erreur calcul heures globales:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des heures' });
  }
});

module.exports = router;
