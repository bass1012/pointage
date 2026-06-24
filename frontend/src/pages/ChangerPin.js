import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Steps } from 'antd';
import { LockOutlined, CheckCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { employeService, authService } from '../services';

const { Title, Text } = Typography;

const ChangerPin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await employeService.changeMyPin(values.oldPin, values.newPin);
      setSuccess(true);
      message.success('Code PIN modifié avec succès !');
      form.resetFields();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du changement de PIN';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
        <Card style={{ borderRadius: '16px', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }} />
          <Title level={3}>Code PIN modifié !</Title>
          <Text type="secondary">
            Votre nouveau code PIN est maintenant actif.
          </Text>
          <div style={{ marginTop: '24px' }}>
            <Button type="primary" onClick={() => setSuccess(false)}>
              Modifier à nouveau
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <Card 
        style={{ borderRadius: '16px' }}
        title={
          <span>
            <KeyOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
            Changer mon code PIN
          </span>
        }
      >
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          background: '#f0f5ff', 
          borderRadius: '8px',
          border: '1px solid #adc6ff'
        }}>
          <Text>
            👤 Connecté en tant que : <strong>{currentUser?.prenom} {currentUser?.nom}</strong>
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="oldPin"
            label="Code PIN actuel"
            rules={[
              { required: true, message: 'Entrez votre code PIN actuel' },
              { len: 4, message: 'Le PIN doit contenir 4 chiffres' },
              { pattern: /^\d{4}$/, message: 'Le PIN doit contenir uniquement des chiffres' }
            ]}
          >
            <Input.Password 
              placeholder="••••"
              maxLength={4}
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              style={{ 
                textAlign: 'center', 
                fontSize: '20px', 
                letterSpacing: '8px' 
              }}
            />
          </Form.Item>

          <div style={{ 
            borderTop: '1px solid #f0f0f0', 
            margin: '24px 0', 
            paddingTop: '24px' 
          }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Nouveau code PIN
            </Text>
          </div>

          <Form.Item
            name="newPin"
            label="Nouveau code PIN"
            rules={[
              { required: true, message: 'Entrez votre nouveau code PIN' },
              { len: 4, message: 'Le PIN doit contenir exactement 4 chiffres' },
              { pattern: /^\d{4}$/, message: 'Le PIN doit contenir uniquement des chiffres' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('oldPin') !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Le nouveau PIN doit être différent de l\'ancien'));
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="••••"
              maxLength={4}
              prefix={<KeyOutlined style={{ color: '#fa8c16' }} />}
              style={{ 
                textAlign: 'center', 
                fontSize: '20px', 
                letterSpacing: '8px' 
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPin"
            label="Confirmer le nouveau code PIN"
            dependencies={['newPin']}
            rules={[
              { required: true, message: 'Confirmez votre nouveau code PIN' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPin') === value) {
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
              prefix={<KeyOutlined style={{ color: '#fa8c16' }} />}
              style={{ 
                textAlign: 'center', 
                fontSize: '20px', 
                letterSpacing: '8px' 
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
              style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
            >
              Changer mon code PIN
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#fff7e6', 
          borderRadius: '8px',
          border: '1px solid #ffd591'
        }}>
          <Text style={{ fontSize: '12px', color: '#d46b08' }}>
            🔒 Conseils de sécurité :
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
              <li>Ne partagez jamais votre code PIN</li>
              <li>Évitez les codes évidents (1234, 0000)</li>
              <li>Changez régulièrement votre PIN</li>
            </ul>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ChangerPin;
