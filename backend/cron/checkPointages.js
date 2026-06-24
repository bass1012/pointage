const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const moment = require('moment');

const prisma = new PrismaClient();

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.mct.ci',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendAlertEmail = async (managerName, managerEmail, employesManquants) => {
  if (!employesManquants || employesManquants.length === 0) return;

  const dateStr = moment().format('DD/MM/YYYY');
  
  // Construire le corps de l'email
  let htmlContent = `
    <h2>Récapitulatif des pointages manquants - ${dateStr}</h2>
    <p>Bonjour ${managerName || 'Responsable'},</p>
    <p>Voici la liste des employés et journaliers qui n'ont pas complété leurs 4 pointages obligatoires aujourd'hui :</p>
    <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Nom / Prénom</th>
          <th>Rôle</th>
          <th>Pointages enregistrés</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
  `;

  employesManquants.forEach(emp => {
    const typesPresents = emp.pointagesAujourdhui.map(p => p.type).join(', ') || 'Aucun';
    const nb = emp.pointagesAujourdhui.length;
    const statut = nb === 0 ? 'Absent / Aucun pointage' : 'Pointage incomplet';
    
    htmlContent += `
      <tr>
        <td>${emp.prenom} ${emp.nom}</td>
        <td>${emp.role}</td>
        <td>${typesPresents} (${nb}/4)</td>
        <td>${statut}</td>
      </tr>
    `;
  });

  htmlContent += `
      </tbody>
    </table>
    <br>
    <p>Merci de leur rappeler l'importance de pointer à chaque étape de la journée (Arrivée, Pause, Reprise, Départ).</p>
    <p>Cordialement,<br>Le système de pointage MCT</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Système de Pointage" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: managerEmail, // On envoie au mail du manager
      subject: `🚨 Pointages incomplets du ${dateStr}`,
      html: htmlContent,
    });
    console.log(`Email envoyé au manager: ${managerEmail}`);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email à', managerEmail, error);
  }
};

const verifierPointagesEtAlerter = async () => {
  console.log('Démarrage de la vérification des pointages...');
  try {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Récupérer tous les employés actifs
    const employes = await prisma.employe.findMany({
      where: { actif: true },
      include: {
        pointages: {
          where: {
            timestamp: {
              gte: todayStart,
              lte: todayEnd,
            }
          }
        }
      }
    });

    // Grouper les employés par supérieur hiérarchique
    // Note: Actuellement superieurHierarchique est juste un nom, on va simuler l'email du supérieur.
    // Si l'employé n'a pas de supérieur, on l'envoie par défaut à supportuser@mct.ci
    const manquantsParManager = {};

    employes.forEach(emp => {
      // S'ils ont moins de 4 pointages
      if (emp.pointages.length < 4) {
        const managerName = emp.superieurHierarchique || 'Direction';
        const key = managerName;
        
        if (!manquantsParManager[key]) {
          manquantsParManager[key] = {
            managerName: managerName,
            // On envoie tout à supportuser@mct.ci comme demandé ou comme fallback si on n'a pas les emails de chaque manager
            managerEmail: 'supportuser@mct.ci', 
            employes: []
          };
        }

        manquantsParManager[key].employes.push({
          ...emp,
          pointagesAujourdhui: emp.pointages
        });
      }
    });

    // Envoyer un email par manager
    for (const key in manquantsParManager) {
      const data = manquantsParManager[key];
      if (data.employes.length > 0) {
        await sendAlertEmail(data.managerName, data.managerEmail, data.employes);
      }
    }
    
    console.log('Vérification des pointages terminée.');
  } catch (error) {
    console.error('Erreur dans le cron de vérification:', error);
  }
};

// Planifier le job tous les jours à 18h00
const initCronJobs = () => {
  cron.schedule('0 18 * * *', () => {
    verifierPointagesEtAlerter();
  }, {
    scheduled: true,
    timezone: "Africa/Abidjan" // Ajustez la timezone selon votre localisation
  });
  console.log('Tâche cron initialisée : Vérification des pointages à 18h00');
};

module.exports = {
  initCronJobs,
  verifierPointagesEtAlerter
};
