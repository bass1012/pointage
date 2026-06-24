import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Statistic, Row, Col, List, Typography } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { pointageService, authService } from '../services';
import moment from 'moment';

const { Title, Text } = Typography;

const MesPointages = () => {
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ aujourd: 0, semaine: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadPointages();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPointages = async () => {
    setLoading(true);
    try {
      const data = await pointageService.getByEmploye(user.id);
      setPointages(data);
      
      const aujourd = new Date();
      aujourd.setHours(0, 0, 0, 0);
      
      const debutSemaine = new Date();
      debutSemaine.setDate(aujourd.getDate() - aujourd.getDay() + 1);
      debutSemaine.setHours(0, 0, 0, 0);
      
      const pointagesAujourd = data.filter(p => 
        new Date(p.timestamp) >= aujourd
      ).length;
      
      const pointagesSemaine = data.filter(p => 
        new Date(p.timestamp) >= debutSemaine
      ).length;
      
      setStats({ aujourd: pointagesAujourd, semaine: pointagesSemaine });
    } catch (error) {
      console.error('Erreur lors du chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date/Heure',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {moment(timestamp).format('DD/MM/YYYY')}
          </div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            {moment(timestamp).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Site',
      dataIndex: ['site', 'nom'],
      key: 'site',
      sorter: (a, b) => {
        const nameA = a.site?.nom || '';
        const nameB = b.site?.nom || '';
        return nameA.localeCompare(nameB);
      },
      render: (nom, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{nom}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            {record.site?.adresse}
          </div>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'default';
        let text = type;
        if (type === 'ARRIVEE') { color = 'green'; text = '🟢 Arrivée'; }
        else if (type === 'PAUSE') { color = 'blue'; text = '☕ Pause'; }
        else if (type === 'REPRISE') { color = 'purple'; text = '💼 Reprise'; }
        else if (type === 'DEPART') { color = 'orange'; text = '🟠 Départ'; }
        return (
          <Tag color={color} style={{ fontSize: '14px', padding: '4px 12px' }}>
            {text}
          </Tag>
        );
      }
    }
  ];

  // Styles
  const styles = {
    container: {
      padding: isMobile ? '12px' : '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    title: {
      fontSize: isMobile ? '20px' : '24px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    statsCard: {
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    listItem: {
      padding: '16px',
      background: '#fff',
      borderRadius: '12px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }
  };

  // Rendu mobile avec liste
  const renderMobileList = () => (
    <List
      loading={loading}
      dataSource={pointages}
      renderItem={(item) => (
        <div style={styles.listItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <Text strong style={{ fontSize: '15px' }}>
                {item.site?.nom}
              </Text>
              <div style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <EnvironmentOutlined /> {item.site?.adresse || item.site?.ville || '-'}
              </div>
            </div>
            <Tag 
              color={item.type === 'ARRIVEE' ? 'green' : item.type === 'PAUSE' ? 'blue' : item.type === 'REPRISE' ? 'purple' : 'orange'}
              style={{ margin: 0 }}
            >
              {item.type === 'ARRIVEE' ? '🟢 Arrivée' : item.type === 'PAUSE' ? '☕ Pause' : item.type === 'REPRISE' ? '💼 Reprise' : '🟠 Départ'}
            </Tag>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#666',
            fontSize: '13px',
            paddingTop: '8px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <CalendarOutlined />
            <span>{moment(item.timestamp).format('DD/MM/YYYY')}</span>
            <span>•</span>
            <ClockCircleOutlined />
            <span>{moment(item.timestamp).format('HH:mm')}</span>
          </div>
        </div>
      )}
      locale={{ emptyText: 'Aucun pointage' }}
    />
  );

  return (
    <div style={styles.container}>
      <Title level={2} style={styles.title}>
        <span>📋</span>
        <span>Mes Pointages</span>
      </Title>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12} md={6}>
          <Card style={styles.statsCard} bodyStyle={{ padding: isMobile ? '16px' : '24px' }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Aujourd'hui</span>}
              value={stats.aujourd}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? '24px' : '28px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={styles.statsCard} bodyStyle={{ padding: isMobile ? '16px' : '24px' }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Cette semaine</span>}
              value={stats.semaine}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: isMobile ? '24px' : '28px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Liste/Table */}
      {isMobile ? (
        renderMobileList()
      ) : (
        <Card style={{ borderRadius: '12px' }}>
          <Table
            columns={columns}
            dataSource={pointages}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </Card>
      )}
    </div>
  );
};

export default MesPointages;
