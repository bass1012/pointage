import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Tag, Button, Space, Row, Col, Statistic, Typography, Progress, Divider, message, Collapse } from 'antd';
import { FilterOutlined, DownloadOutlined, ClockCircleOutlined, CalendarOutlined, FieldTimeOutlined, RiseOutlined, FileExcelOutlined } from '@ant-design/icons';
import { pointageService, employeService, siteService } from '../services';
import moment from 'moment';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// Constantes
const getTypeDisplay = (type) => {
  switch (type) {
    case 'ARRIVEE': return { text: '🟢 Arrivée', color: 'green' };
    case 'PAUSE': return { text: '☕ Pause', color: 'blue' };
    case 'REPRISE': return { text: '💼 Reprise', color: 'purple' };
    case 'DEPART': return { text: '🟠 Départ', color: 'orange' };
    default: return { text: type, color: 'default' };
  }
};

const Pointages = () => {
  const [pointages, setPointages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pointagesData, employesData, sitesData] = await Promise.all([
        pointageService.getAll(filters),
        employeService.getAll(),
        siteService.getAll()
      ]);
      setPointages(pointagesData);
      setEmployes(employesData);
      setSites(sitesData);
    } catch (error) {
      console.error('Erreur lors du chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (newFilters) => {
    setFilters(newFilters);
    setLoading(true);
    try {
      const data = await pointageService.getAll(newFilters);
      setPointages(data);
    } catch (error) {
      console.error('Erreur lors du filtrage', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'export Excel XLSX
  const handleExport = () => {
    if (pointages.length === 0) {
      message.warning('Aucun pointage à exporter');
      return;
    }

    // Créer les données pour Excel
    const excelData = pointages.map(p => ({
      'Date': moment(p.timestamp).format('DD/MM/YYYY'),
      'Heure': moment(p.timestamp).format('HH:mm:ss'),
      'Employé': `${p.employe.prenom} ${p.employe.nom}`,
      'Site': p.site.nom,
      'Type': getTypeDisplay(p.type).text.replace(/^[🟢☕💼🟠] /, ''),
      'Latitude': p.latitude || '',
      'Longitude': p.longitude || ''
    }));

    // Créer le workbook et la feuille
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Définir la largeur des colonnes
    worksheet['!cols'] = [
      { wch: 12 },  // Date
      { wch: 10 },  // Heure
      { wch: 25 },  // Employé
      { wch: 20 },  // Site
      { wch: 10 },  // Type
      { wch: 12 },  // Latitude
      { wch: 12 }   // Longitude
    ];

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pointages');

    // Générer et télécharger le fichier
    XLSX.writeFile(workbook, `pointages_${moment().format('YYYY-MM-DD')}.xlsx`);
    
    message.success(`${pointages.length} pointages exportés en Excel`);
  };

  // Filtrer seulement les employés actifs pour le select
  const employesActifs = employes.filter(e => e.actif);

  const columns = [
    {
      title: 'Date/Heure',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Employé',
      dataIndex: ['employe'],
      key: 'employe',
      render: (employe) => `${employe.prenom} ${employe.nom}`,
      filters: employes.map(e => ({ text: `${e.prenom} ${e.nom}`, value: e.id }))
    },
    {
      title: 'Site',
      dataIndex: ['site', 'nom'],
      key: 'site',
      filters: sites.map(s => ({ text: s.nom, value: s.id })),
      sorter: (a, b) => {
        const nameA = a.site?.nom || '';
        const nameB = b.site?.nom || '';
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const info = getTypeDisplay(type);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
      filters: [
        { text: 'Arrivée', value: 'ARRIVEE' },
        { text: 'Pause', value: 'PAUSE' },
        { text: 'Reprise', value: 'REPRISE' },
        { text: 'Départ', value: 'DEPART' }
      ]
    },
    {
      title: 'Position',
      key: 'position',
      render: (_, record) => (
        record.latitude && record.longitude 
          ? `${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}`
          : '-'
      )
    }
  ];

  // Calculer les statistiques de temps de travail pour aujourd'hui
  const calculerStatistiquesJour = () => {
    const aujourdhui = moment().format('YYYY-MM-DD');
    const pointagesAujourdhui = pointages.filter(p => 
      moment(p.timestamp).format('YYYY-MM-DD') === aujourdhui
    );

    // Compter les employés uniques présents
    const employesPresents = new Set(pointagesAujourdhui.map(p => p.employe.id)).size;

    return {
      employesPresents,
      pointagesJour: pointagesAujourdhui.length
    };
  };

  const stats = calculerStatistiquesJour();

  return (
    <div style={{ padding: '24px' }}>
      {/* Carte Horaires de Service */}
      <Card 
        style={{ marginBottom: '24px', borderRadius: '12px' }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ 
              background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
              borderRadius: '12px',
              padding: '16px',
              color: 'white',
              textAlign: 'center'
            }}>
              <ClockCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Horaires de Service</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                08:00 - 17:30
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                Pause déjeuner: 90 min
              </div>
            </div>
          </Col>
          <Col xs={24} sm={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12}>
                <Statistic 
                  title={<Text type="secondary" style={{ fontSize: '12px' }}>Présents aujourd'hui</Text>}
                  value={stats.employesPresents}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Col>
              <Col xs={12} sm={12}>
                <Statistic 
                  title={<Text type="secondary" style={{ fontSize: '12px' }}>Pointages du jour</Text>}
                  value={stats.pointagesJour}
                  valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        title="🕐 Historique des Pointages"
        extra={
          <Space>
            <RangePicker 
              onChange={(dates) => {
                if (dates) {
                  handleFilter({
                    ...filters,
                    dateDebut: dates[0].toISOString(),
                    dateFin: dates[1].toISOString()
                  });
                } else {
                  const { dateDebut, dateFin, ...rest } = filters;
                  handleFilter(rest);
                }
              }}
            />
            <Select
              placeholder="Filtrer par employé"
              style={{ width: 200 }}
              allowClear
              value={filters.employeId || undefined}
              onChange={(value) => handleFilter({ ...filters, employeId: value })}
            >
              {employesActifs.map(e => (
                <Select.Option key={e.id} value={e.id}>
                  {e.prenom} {e.nom}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Filtrer par site"
              style={{ width: 200 }}
              allowClear
              value={filters.siteId || undefined}
              onChange={(value) => handleFilter({ ...filters, siteId: value })}
            >
              {sites.map(s => (
                <Select.Option key={s.id} value={s.id}>
                  {s.nom}
                </Select.Option>
              ))}
            </Select>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={handleExport}
              style={{ background: '#217346', borderColor: '#217346', color: 'white' }}
            >
              Exporter Excel
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={pointages}
          loading={loading}
          rowKey="id"
          pagination={{ 
            pageSize: 20,
            showTotal: (total) => `Total : ${total} pointages`
          }}
        />
      </Card>
    </div>
  );
};

export default Pointages;
