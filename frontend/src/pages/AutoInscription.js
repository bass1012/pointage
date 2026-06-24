import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Result, Typography, Row, Col, Steps, Select, Radio } from 'antd';
import { UserAddOutlined, CheckCircleOutlined, IdcardOutlined, LockOutlined, SmileOutlined, TeamOutlined, MailOutlined } from '@ant-design/icons';
import { authService } from '../services';

const { Title, Text, Paragraph } = Typography;

const AutoInscription = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdEmploye, setCreatedEmploye] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Créer l'employé avec le rôle choisi via la route publique
      const { confirmPin, ...submitData } = values;
      const response = await authService.register(submitData);
      
      setCreatedEmploye(response);
      setSuccess(true);
      message.success('Inscription réussie !');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['nom', 'prenom', 'role']);
      } else if (currentStep === 1) {
        await form.validateFields(['telephone']);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Validation failed
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Card 
          style={{ 
            maxWidth: 500, 
            width: '100%',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Inscription réussie !"
            subTitle={
              <div>
                <Paragraph>
                  Bienvenue <strong>{createdEmploye?.prenom} {createdEmploye?.nom}</strong> !
                </Paragraph>
                <Paragraph>
                  Votre compte a été créé avec succès.
                </Paragraph>
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <Text strong>📧 Email : </Text>
                  <Text>{createdEmploye?.email}</Text>
                  <br /><br />
                  <Text strong>🔑 Votre code PIN : </Text>
                  <Text code style={{ fontSize: '18px' }}>{form.getFieldValue('pin')}</Text>
                  <br /><br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ⚠️ Mémorisez votre code PIN, il sera nécessaire pour pointer.
                  </Text>
                </div>
              </div>
            }
            extra={[
              <Button 
                type="primary" 
                key="login" 
                size="large"
                onClick={() => window.location.href = '/login'}
              >
                Se connecter
              </Button>,
              <Button 
                key="new" 
                size="large"
                onClick={() => {
                  setSuccess(false);
                  setCreatedEmploye(null);
                  setCurrentStep(0);
                  form.resetFields();
                }}
              >
                Nouvelle inscription
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: 500, 
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '8px'
          }}>
            🏢
          </div>
          <Title level={3} style={{ margin: 0 }}>
            Auto-Inscription
          </Title>
          <Text type="secondary">
            Créez votre compte pour pointer
          </Text>
        </div>

        <Steps 
          current={currentStep} 
          size="small"
          style={{ marginBottom: '24px' }}
          items={[
            { title: 'Identité', icon: <IdcardOutlined /> },
            { title: 'Contact', icon: <UserAddOutlined /> },
            { title: 'Sécurité', icon: <LockOutlined /> }
          ]}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* Étape 1 : Identité */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item
              name="role"
              label="Type de contrat"
              rules={[{ required: true, message: 'Choisissez votre type de contrat' }]}
              initialValue="EMPLOYE"
            >
              <Radio.Group 
                buttonStyle="solid" 
                style={{ 
                  width: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <Radio.Button 
                  value="EMPLOYE" 
                  style={{ 
                    textAlign: 'center', 
                    height: '50px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  <span>👤 Employé</span>
                </Radio.Button>
                <Radio.Button 
                  value="JOURNALIER" 
                  style={{ 
                    textAlign: 'center', 
                    height: '50px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  <span>📅 Journalier</span>
                </Radio.Button>
                <Radio.Button 
                  value="STAGIAIRE" 
                  style={{ 
                    textAlign: 'center', 
                    height: '50px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  <span>🎓 Stagiaire</span>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: 'Votre nom est requis' }]}
            >
              <Input 
                placeholder="Entrez votre nom" 
                prefix={<UserAddOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>

            <Form.Item
              name="prenom"
              label="Prénom"
              rules={[{ required: true, message: 'Votre prénom est requis' }]}
            >
              <Input 
                placeholder="Entrez votre prénom"
                prefix={<SmileOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>

            <Form.Item
              name="departement"
              label="Département (optionnel)"
            >
              <Input 
                placeholder="Ex: Travaux neufs, Electricité 1..."
                prefix={<TeamOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>

            <Form.Item
              name="superieurHierarchique"
              label="Supérieur hiérarchique (optionnel)"
            >
              <Input 
                placeholder="Nom de votre manager"
                prefix={<UserAddOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>

            <Form.Item
              name="emailSuperieur"
              label="Email du Supérieur (optionnel)"
              rules={[
                { type: 'email', message: 'Email invalide' }
              ]}
            >
              <Input 
                placeholder="email.manager@exemple.com"
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>

            <Button 
              type="primary" 
              block 
              onClick={validateStep}
            >
              Continuer →
            </Button>
          </div>

          {/* Étape 2 : Contact */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Form.Item
              name="telephone"
              label="Téléphone"
              rules={[
                { required: true, message: 'Votre numéro de téléphone est requis' },
                { pattern: /^[0-9\s+\-()]+$/, message: 'Numéro de téléphone invalide' }
              ]}
            >
              <Input 
                placeholder="06 12 34 56 78"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email (optionnel)"
              rules={[
                { type: 'email', message: 'Email invalide' }
              ]}
            >
              <Input 
                placeholder="votre.email@exemple.com"
                type="email"
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Button block onClick={() => setCurrentStep(0)}>
                  ← Retour
                </Button>
              </Col>
              <Col span={12}>
                <Button type="primary" block onClick={validateStep}>
                  Continuer →
                </Button>
              </Col>
            </Row>
          </div>

          {/* Étape 3 : Sécurité */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Form.Item
              name="pin"
              label="Code PIN (4 chiffres)"
              rules={[
                { required: true, message: 'Le code PIN est requis' },
                { len: 4, message: 'Le PIN doit contenir exactement 4 chiffres' },
                { pattern: /^\d{4}$/, message: 'Le PIN doit contenir uniquement des chiffres' }
              ]}
              extra="Ce code vous permettra de pointer et de vous connecter"
            >
              <Input.Password 
                placeholder="••••"
                maxLength={4}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '24px', 
                  letterSpacing: '8px' 
                }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPin"
              label="Confirmer le code PIN"
              dependencies={['pin']}
              rules={[
                { required: true, message: 'Confirmez votre code PIN' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('pin') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Les codes PIN ne correspondent pas'));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder="••••"
                maxLength={4}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '24px', 
                  letterSpacing: '8px' 
                }}
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Button block onClick={() => setCurrentStep(1)}>
                  ← Retour
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  S'inscrire
                </Button>
              </Col>
            </Row>
          </div>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Text type="secondary">
            Déjà inscrit ? {' '}
            <a href="/login">Se connecter</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default AutoInscription;
