import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Radio, Spin, message, Modal } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { pointageService, authService, siteService } from '../services';

const { Title, Text } = Typography;

const QuickPointage = ({ inLayout = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('ARRIVEE');
  const [siteInfo, setSiteInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [siteData, setSiteData] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testCoords, setTestCoords] = useState({ latitude: '', longitude: '' });
  const isMounted = useRef(true);

  const siteId = searchParams.get('siteId');
  const qrCode = searchParams.get('qrCode');
  const siteNom = searchParams.get('nom');
  const user = authService.getCurrentUser();
  const isInLayout = user !== null;

  useEffect(() => {
    isMounted.current = true;
    
    const loadSiteData = async () => {
      if (siteId) {
        try {
          const site = await siteService.getById(siteId);
          setSiteData(site);
        } catch (error) {
          console.error('Erreur chargement site:', error);
        }
      }
    };
    
    loadSiteData();
    
    if (!user) {
      localStorage.setItem('redirectAfterLogin', window.location.href);
      setCurrentStep('login');
      setLoading(false);
      return;
    }

    if (!siteId || !qrCode) {
      setCurrentStep('select');
      setLoading(false);
      return;
    }

    setSiteInfo({ id: siteId, nom: siteNom || 'Site', qrCode });
    setCurrentStep('select');
    setLoading(false);
    
    return () => {
      isMounted.current = false;
    };
  }, [siteId, qrCode, siteNom, user]);

  const handlePointage = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    setCurrentStep('processing');

    try {
      let location = null;
      
      try {
        if (!navigator.geolocation) {
          throw new Error('NOT_SUPPORTED');
        }
        
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0 
          });
        });
        location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) {
        if (testMode && testCoords.latitude && testCoords.longitude) {
          location = {
            latitude: parseFloat(testCoords.latitude),
            longitude: parseFloat(testCoords.longitude)
          };
        }
      }

      const pointageData = {
        siteId,
        qrCode,
        type,
        ...(location && location)
      };

      const response = await pointageService.create(pointageData);
      
      if (isMounted.current) {
        setSuccessModalData({
          success: true,
          message: response.message || 'Pointage enregistré avec succès',
          site: siteNom,
          type,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        setSuccessModalVisible(true);
        setSubmitting(false);
        setCurrentStep('select');
      }

    } catch (error) {
      console.error('Erreur:', error);
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || errorData?.error || 'Erreur lors du pointage';
      
      if (isMounted.current) {
        setSuccessModalData({
          success: false,
          message: errorMessage,
          site: siteNom,
          type
        });
        setSuccessModalVisible(true);
        setSubmitting(false);
        setCurrentStep('select');
      }
    }
  };

  const goToLogin = () => navigate('/login');
  const goToInscription = () => navigate('/inscription');
  const goToScanner = () => navigate('/scanner');

  const getBackgroundStyle = () => {
    if (isInLayout) return {};
    
    if (siteData?.imageUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const baseUrl = apiUrl.replace('/api', '');
      const imageUrl = `${baseUrl}/uploads/sites/${siteData.imageUrl}`;
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#081BCC'
      };
    }
    
    return {
      backgroundImage: 'url(/images/background-pointage.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#081BCC'
    };
  };

  const getHeaderStyle = () => {
    if (siteData?.imageUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const baseUrl = apiUrl.replace('/api', '');
      const imageUrl = `${baseUrl}/uploads/sites/${siteData.imageUrl}`;
      return {
        ...styles.header,
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return styles.header;
  };

  const styles = {
    container: isInLayout ? {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      minHeight: '60vh',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    } : {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    },
    header: {
      background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
      padding: '24px',
      textAlign: 'center',
      color: 'white'
    },
    body: {
      padding: '24px',
      overflow: 'hidden',
      boxSizing: 'border-box'
    },
    siteIcon: {
      fontSize: '48px',
      marginBottom: '12px'
    },
    button: {
      height: '54px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600'
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>Chargement...</div>
        </div>
      );
    }

    if (currentStep === 'login') {
      return (
        <>
          <div style={getHeaderStyle()}>
            <div style={styles.siteIcon}>🔐</div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>Connexion requise</Title>
          </div>
          <div style={styles.body}>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: '24px', color: '#666' }}>
              Vous devez vous inscrire ou vous connecter pour enregistrer votre pointage sur ce site.
            </Text>
            {siteNom && (
              <div style={{ 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <Text type="secondary">Site</Text>
                <Title level={4} style={{ margin: '4px 0 0' }}>{siteNom}</Title>
              </div>
            )}
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={goToInscription}
              block
              style={{...styles.button, marginBottom: '12px'}}
            >
              S'inscrire
            </Button>
            <Button 
              icon={<LoginOutlined />}
              onClick={goToLogin}
              block
              style={styles.button}
            >
              J'ai déjà un compte
            </Button>
          </div>
        </>
      );
    }

    if (currentStep === 'processing') {
      return (
        <>
          <div style={getHeaderStyle()}>
            <div style={styles.siteIcon}>⏳</div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>Traitement</Title>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>
              Enregistrement du pointage...
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div style={getHeaderStyle()}>
          <div style={styles.siteIcon}>📍</div>
          <Title level={3} style={{ color: 'white', margin: 0, wordBreak: 'break-word', fontSize: '18px' }}>
            {siteInfo?.nom || siteNom || 'Site'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px', display: 'block' }}>
            Bonjour {user?.prenom} !
          </Text>
        </div>
        <div style={{...styles.body, overflow: 'hidden'}}>
          <Text strong style={{ display: 'block', marginBottom: '16px', fontSize: '16px' }}>
            Type de pointage :
          </Text>
          
          <Radio.Group 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', marginBottom: '24px' }}
            size="large"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
              <Radio.Button value="ARRIVEE" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '16px' }}>
                🟢 Arrivée
              </Radio.Button>
              <Radio.Button value="PAUSE" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '16px' }}>
                ☕ Pause
              </Radio.Button>
              <Radio.Button value="REPRISE" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '16px' }}>
                💼 Reprise
              </Radio.Button>
              <Radio.Button value="DEPART" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '16px' }}>
                🟠 Départ
              </Radio.Button>
            </div>
          </Radio.Group>

          <Button 
            type="primary"
            onClick={handlePointage}
            loading={submitting}
            disabled={submitting}
            block
            style={{
              ...styles.button,
              background: type === 'ARRIVEE' 
                ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                : type === 'PAUSE' ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
                : type === 'REPRISE' ? 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)'
                : 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              border: 'none'
            }}
          >
            ✓ Valider le pointage
          </Button>

          {user?.role === 'ADMIN' && (
            <div style={{ marginTop: '24px', borderTop: '1px dashed #d9d9d9', paddingTop: '16px' }}>
              <div 
                onClick={() => setTestMode(!testMode)}
                style={{ 
                  cursor: 'pointer', 
                  color: '#999', 
                  fontSize: '12px',
                  textAlign: 'center',
                  marginBottom: testMode ? '12px' : 0
                }}
              >
                🧪 {testMode ? 'Masquer' : 'Mode test (Admin)'}
              </div>
              
              {testMode && (
                <div style={{ 
                  background: '#fffbe6', 
                  border: '1px solid #ffe58f',
                  borderRadius: '8px',
                  padding: '12px',
                  overflow: 'hidden'
                }}>
                  <Text type="warning" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                    ⚠️ Simuler la position GPS
                  </Text>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', width: '100%' }}>
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={testCoords.latitude}
                      onChange={(e) => setTestCoords(prev => ({ ...prev, latitude: e.target.value }))}
                      style={{ 
                        flex: 1, 
                        padding: '8px', 
                        borderRadius: '6px', 
                        border: '1px solid #d9d9d9',
                        fontSize: '12px',
                        minWidth: 0,
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={testCoords.longitude}
                      onChange={(e) => setTestCoords(prev => ({ ...prev, longitude: e.target.value }))}
                      style={{ 
                        flex: 1, 
                        padding: '8px', 
                        borderRadius: '6px', 
                        border: '1px solid #d9d9d9',
                        fontSize: '12px',
                        minWidth: 0,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{ ...styles.container, ...getBackgroundStyle() }}>
      <Card style={styles.card} bodyStyle={{ padding: 0 }}>
        {renderContent()}
      </Card>

      <Modal
        open={successModalVisible}
        onCancel={() => setSuccessModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            size="large"
            onClick={() => setSuccessModalVisible(false)}
            style={{ height: '48px', borderRadius: '10px', fontSize: '16px' }}
            block
          >
            ✓ OK
          </Button>
        ]}
        centered
        width="90%"
        style={{ maxWidth: '400px' }}
        closable={false}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>
            {successModalData?.success ? '✅' : '❌'}
          </div>
          <Title level={3} style={{ marginBottom: '16px', color: successModalData?.success ? '#52c41a' : '#f5222d' }}>
            {successModalData?.success ? 'Pointage enregistré !' : 'Échec du pointage'}
          </Title>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
            <strong>Site :</strong> {successModalData?.site}
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
            <strong>Type :</strong>{' '}
            <span style={{ 
              color: successModalData?.type === 'ARRIVEE' ? '#52c41a' : successModalData?.type === 'PAUSE' ? '#1890ff' : successModalData?.type === 'REPRISE' ? '#722ed1' : '#fa8c16',
              fontWeight: 'bold'
            }}>
              {successModalData?.type === 'ARRIVEE' ? '🟢 ARRIVÉE' : successModalData?.type === 'PAUSE' ? '☕ PAUSE' : successModalData?.type === 'REPRISE' ? '💼 REPRISE' : '🟠 DÉPART'}
            </span>
          </div>
          {successModalData?.timestamp && (
            <div style={{ fontSize: '14px', color: '#999', marginTop: '12px' }}>
              📅 {successModalData?.timestamp}
            </div>
          )}
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: successModalData?.success ? '#f6ffed' : '#fff2f0',
            borderRadius: '8px',
            border: `1px solid ${successModalData?.success ? '#b7eb8f' : '#ffccc7'}`
          }}>
            <Text style={{ fontSize: '15px', color: successModalData?.success ? '#52c41a' : '#f5222d' }}>
              {successModalData?.message}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuickPointage;
