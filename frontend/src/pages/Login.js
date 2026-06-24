import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.email, values.pin);
      message.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      message.error('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: isMobile ? '20px' : '0',
      background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)'
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 400, 
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          borderRadius: '16px',
          border: 'none'
        }}
        bodyStyle={{ padding: isMobile ? '24px' : '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
          <Title level={2} style={{ marginBottom: '8px', fontSize: isMobile ? '24px' : '28px' }}>
            Pointage
          </Title>
          <Text type="secondary">Connectez-vous à votre compte</Text>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Veuillez entrer votre email ou téléphone' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="Email ou Téléphone" 
              style={{ 
                height: '50px', 
                borderRadius: '10px',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="pin"
            rules={[{ required: true, message: 'Veuillez entrer votre PIN' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="Code PIN" 
              maxLength={6}
              style={{ 
                height: '50px', 
                borderRadius: '10px',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ 
                height: '54px', 
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
                border: 'none'
              }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
