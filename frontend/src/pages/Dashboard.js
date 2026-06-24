import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { pointageService } from '../services';
import moment from 'moment';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAujourdhui: 0,
    totalMois: 0,
    pointagesRecents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await pointageService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Employé',
      dataIndex: ['employe'],
      key: 'employe',
      render: (employe) => `${employe.prenom} ${employe.nom}`
    },
    {
      title: 'Site',
      dataIndex: ['site', 'nom'],
      key: 'site'
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
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Heure',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('DD/MM/YYYY HH:mm')
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📊 Tableau de bord</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pointages aujourd'hui"
              value={stats.totalAujourdhui}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pointages ce mois"
              value={stats.totalMois}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Employés actifs"
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="📋 Pointages récents">
        <Table
          columns={columns}
          dataSource={stats.pointagesRecents}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
