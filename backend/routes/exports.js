const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, managerMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Export Excel des pointages
router.get('/pointages/excel', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const { dateDebut, dateFin, employeId, siteId } = req.query;
    
    logger.info('Export Excel demandé', { 
      user: req.user.email, 
      filters: { dateDebut, dateFin, employeId, siteId } 
    });

    const where = {};
    
    if (employeId) where.employeId = employeId;
    if (siteId) where.siteId = siteId;
    
    if (dateDebut || dateFin) {
      where.timestamp = {};
      if (dateDebut) where.timestamp.gte = new Date(dateDebut);
      if (dateFin) where.timestamp.lte = new Date(dateFin);
    }

    const pointages = await prisma.pointage.findMany({
      where,
      include: {
        employe: { 
          select: { 
            nom: true, 
            prenom: true, 
            email: true, 
            departement: true 
          } 
        },
        site: { 
          select: { 
            nom: true, 
            adresse: true, 
            ville: true 
          } 
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Système de Pointage';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Pointages', {
      properties: { tabColor: { argb: '1890FF' } }
    });

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Heure', key: 'heure', width: 12 },
      { header: 'Employé', key: 'employe', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Département', key: 'departement', width: 20 },
      { header: 'Site', key: 'site', width: 30 },
      { header: 'Adresse', key: 'adresse', width: 40 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Latitude', key: 'latitude', width: 15 },
      { header: 'Longitude', key: 'longitude', width: 15 }
    ];

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1890FF' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Ajouter les données
    pointages.forEach(p => {
      const date = new Date(p.timestamp);
      const row = worksheet.addRow({
        date: date.toLocaleDateString('fr-FR'),
        heure: date.toLocaleTimeString('fr-FR'),
        employe: `${p.employe.prenom} ${p.employe.nom}`,
        email: p.employe.email,
        departement: p.employe.departement || 'N/A',
        site: p.site.nom,
        adresse: `${p.site.adresse}${p.site.ville ? ', ' + p.site.ville : ''}`,
        type: p.type === 'ARRIVEE' ? 'Arrivée' : 'Départ',
        latitude: p.latitude ? p.latitude.toFixed(6) : 'N/A',
        longitude: p.longitude ? p.longitude.toFixed(6) : 'N/A'
      });

      // Colorer selon le type
      if (p.type === 'ARRIVEE') {
        row.getCell('type').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E6F7E6' }
        };
      } else {
        row.getCell('type').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6' }
        };
      }
    });

    // Ajouter des bordures
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Ajouter une ligne de résumé
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      'TOTAL',
      '',
      `${pointages.length} pointages`,
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F0F0F0' }
    };

    // Définir les headers HTTP
    const filename = `pointages_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Écrire le fichier
    await workbook.xlsx.write(res);
    
    logger.info('Export Excel réussi', { 
      user: req.user.email, 
      count: pointages.length,
      filename 
    });
    
    res.end();
  } catch (error) {
    logger.error('Erreur export Excel', { 
      error: error.message, 
      user: req.user.email 
    });
    res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
  }
});

module.exports = router;
