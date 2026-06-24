import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Avatar, Row, Col, Tag, Divider, Statistic } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authService, employeService, pointageService } from '../services';
import moment from 'moment';

const { Title, Text } = Typography;

const Profil = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ totalPointages: 0, joursPresence: 0 });
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        nom: currentUser.nom,
        prenom: currentUser.prenom,
        email: currentUser.email,
        telephone: currentUser.telephone || '',
        departement: currentUser.departement || '',
        superieurHierarchique: currentUser.superieurHierarchique || ''
      });
      loadStats();
    }
  }, [currentUser, form]);

  const loadStats = async () => {
    try {
      // Charger les pointages de l'utilisateur pour les stats
      const pointages = await pointageService.getAll({ employeId: currentUser.id });
      
      // Calculer les jours de présence uniques
      const joursUniques = new Set(
        pointages.map(p => moment(p.timestamp).format('YYYY-MM-DD'))
      );
      
      setStats({
        totalPointages: pointages.length,
        joursPresence: joursUniques.size
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await employeService.update(currentUser.id, {
        nom: values.nom,
        prenom: values.prenom,
        telephone: values.telephone,
        departement: values.departement,
        superieurHierarchique: values.superieurHierarchique
      });
      
      // Mettre à jour le localStorage
      const updatedUser = { 
        ...currentUser, 
        nom: values.nom,
        prenom: values.prenom,
        telephone: values.telephone,
        departement: values.departement,
        superieurHierarchique: values.superieurHierarchique
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      message.success('Profil mis à jour !');
      setEditing(false);
      
      // Recharger la page pour mettre à jour l'affichage
      window.location.reload();
    } catch (error) {
      message.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getRoleConfig = (role) => {
    const config = {
      ADMIN: { color: 'red', label: 'Administrateur', icon: '👑' },
      MANAGER: { color: 'blue', label: 'Manager', icon: '📊' },
      EMPLOYE: { color: 'green', label: 'Employé', icon: '👤' },
      JOURNALIER: { color: 'orange', label: 'Journalier', icon: '📅' }
    };
    return config[role] || { color: 'default', label: role, icon: '👤' };
  };

  const roleConfig = getRoleConfig(currentUser?.role);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* En-tête du profil */}
      <Card style={{ borderRadius: '16px', marginBottom: '24px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              style={{ 
                background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
                fontSize: '48px'
              }}
            >
              {currentUser?.prenom?.charAt(0)}{currentUser?.nom?.charAt(0)}
            </Avatar>
            <div style={{ marginTop: '16px' }}>
              <Tag color={roleConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {roleConfig.icon} {roleConfig.label}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={16}>
            <Title level={2} style={{ margin: 0 }}>
              {currentUser?.prenom} {currentUser?.nom}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              <MailOutlined style={{ marginRight: '8px' }} />
              {currentUser?.email}
            </Text>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Pointages totaux"
                  value={stats.totalPointages}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Jours de présence"
                  value={stats.joursPresence}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Informations détaillées */}
      <Card 
        title={<span><IdcardOutlined style={{ marginRight: '8px' }} />Informations personnelles</span>}
        style={{ borderRadius: '16px' }}
        extra={
          !editing ? (
            <Button type="primary" ghost onClick={() => setEditing(true)}>
              Modifier
            </Button>
          ) : null
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={editing ? [{ required: true, message: 'Le nom est requis' }] : []}
              >
                <Input 
                  prefix={<UserOutlined />}
                  disabled={!editing}
                  style={{ background: editing ? 'white' : '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="prenom"
                label="Prénom"
                rules={editing ? [{ required: true, message: 'Le prénom est requis' }] : []}
              >
                <Input 
                  prefix={<UserOutlined />}
                  disabled={!editing}
                  style={{ background: editing ? 'white' : '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input 
              prefix={<MailOutlined />}
              disabled
              style={{ background: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="telephone"
            label="Téléphone"
          >
            <Input 
              prefix={<PhoneOutlined />}
              placeholder="Votre numéro de téléphone"
              disabled={!editing}
              style={{ background: editing ? 'white' : '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="departement"
            label="Département"
          >
            <Input 
              prefix={<IdcardOutlined />}
              placeholder="Votre département"
              disabled={!editing}
              style={{ background: editing ? 'white' : '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="superieurHierarchique"
            label="Supérieur hiérarchique"
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="Nom de votre manager"
              disabled={!editing}
              style={{ background: editing ? 'white' : '#f5f5f5' }}
            />
          </Form.Item>

          {editing && (
            <Form.Item>
              <Row gutter={12}>
                <Col>
                  <Button onClick={() => {
                    setEditing(false);
                    form.setFieldsValue({ 
                      nom: currentUser?.nom || '',
                      prenom: currentUser?.prenom || '',
                      telephone: currentUser?.telephone || '',
                      departement: currentUser?.departement || '',
                      superieurHierarchique: currentUser?.superieurHierarchique || ''
                    });
                  }}>
                    Annuler
                  </Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Enregistrer
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          )}
        </Form>

        <Divider />

        <div style={{ 
          padding: '16px', 
          background: '#f6f6f6', 
          borderRadius: '8px' 
        }}>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Text type="secondary">
                <IdcardOutlined style={{ marginRight: '8px' }} />
                ID : <Text code>{currentUser?.id}</Text>
              </Text>
            </Col>
            <Col span={24}>
              <Text type="secondary">
                <CalendarOutlined style={{ marginRight: '8px' }} />
                Membre depuis : <Text strong>{moment(currentUser?.createdAt).format('DD MMMM YYYY')}</Text>
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Actions rapides */}
      <Card 
        title="Actions rapides"
        style={{ borderRadius: '16px', marginTop: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button 
              block 
              size="large"
              onClick={() => window.location.href = '/changer-pin'}
              style={{ height: '60px' }}
            >
              🔑 Changer mon code PIN
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button 
              block 
              size="large"
              onClick={() => window.location.href = '/mes-pointages'}
              style={{ height: '60px' }}
            >
              📊 Voir mes pointages
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Profil;
