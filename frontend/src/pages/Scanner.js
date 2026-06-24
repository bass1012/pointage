import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Typography, Radio, Result, Alert, Space, Spin, Select, Modal } from 'antd';
import { QrcodeOutlined, UploadOutlined, CameraOutlined, ReloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';
import { pointageService, authService, siteService } from '../services';

const { Title, Text } = Typography;

const Scanner = () => {
  const [type, setType] = useState('ARRIVEE');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  
  const fileInputRef = useRef(null);

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (error) {
      console.error('Erreur chargement sites:', error);
    }
  };



  const handleScanSuccess = async (decodedText) => {
    try {
      setProcessing(true);

      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        message.error('QR Code invalide');
        setProcessing(false);
        return;
      }

      if (!qrData.siteId || !qrData.qrCode) {
        message.error('QR Code invalide');
        setProcessing(false);
        return;
      }

      const getLocation = () => new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });

      const location = await getLocation();
      
      const pointageData = {
        siteId: qrData.siteId,
        qrCode: qrData.qrCode,
        type,
        ...(location && { latitude: location.latitude, longitude: location.longitude })
      };

      try {
        const response = await pointageService.create(pointageData);
        setResult({
          success: true,
          message: response.message,
          site: qrData.nom,
          type
        });
        setSuccessModalData({
          success: true,
          message: response.message,
          site: qrData.nom,
          type,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        setSuccessModalVisible(true);
      } catch (error) {
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || errorData?.error || 'Erreur lors du pointage';
        setSuccessModalData({
          success: false,
          message: errorMsg,
          site: qrData.nom,
          type
        });
        setSuccessModalVisible(true);
        setResult({
          success: false,
          message: errorMsg,
          site: qrData.nom,
          type
        });
      }
    } catch (error) {
      message.error('Erreur lors du traitement');
    } finally {
      setProcessing(false);
    }
  };



  const tryMultipleScanConfigs = (img) => {
    const configs = [
      { size: img.width, name: 'original' },
      { size: 800, name: '800px' },
      { size: 400, name: '400px' },
    ];
    
    for (const config of configs) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let width = img.width;
      let height = img.height;
      
      if (width > config.size || height > config.size) {
        if (width > height) {
          height = Math.round((height / width) * config.size);
          width = config.size;
        } else {
          width = Math.round((width / height) * config.size);
          height = config.size;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      let imageData = ctx.getImageData(0, 0, width, height);
      let code = jsQR(imageData.data, width, height, { inversionAttempts: "attemptBoth" });
      
      if (code) return code;
      
      // Essayer avec binarisation
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const binary = gray > 128 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = binary;
      }
      
      code = jsQR(imageData.data, width, height, { inversionAttempts: "attemptBoth" });
      if (code) return code;
    }
    
    return null;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setProcessing(true);
    message.loading({ content: 'Analyse...', key: 'scan' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const code = tryMultipleScanConfigs(img);
        message.destroy('scan');
        
        if (code) {
          handleScanSuccess(code.data);
        } else {
          setProcessing(false);
          message.error('QR code non détecté. Essayez la sélection manuelle.');
        }
      };
      img.onerror = () => {
        message.destroy('scan');
        setProcessing(false);
        message.error('Erreur de chargement');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleManualPointage = async () => {
    if (!selectedSiteId) {
      message.warning('Sélectionnez un site');
      return;
    }

    setProcessing(true);
    const site = sites.find(s => s.id === selectedSiteId);

    try {
      const getLocation = () => new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });

      const location = await getLocation();

      const response = await pointageService.create({
        siteId: selectedSiteId,
        qrCode: site.qrCode,
        type,
        ...(location && { latitude: location.latitude, longitude: location.longitude })
      });
      
      setShowManualModal(false);
      setSelectedSiteId(null);
      setResult({
        success: true,
        message: response.message,
        site: site.nom,
        type
      });
      setSuccessModalData({
        success: true,
        message: response.message,
        site: site.nom,
        type,
        timestamp: new Date().toLocaleString('fr-FR')
      });
      setSuccessModalVisible(true);
    } catch (error) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.message || errorData?.error || 'Erreur';
      setSuccessModalData({
        success: false,
        message: errorMsg,
        site: site.nom,
        type
      });
      setSuccessModalVisible(true);
      setShowManualModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    setProcessing(false);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalVisible(false);
    setSuccessModalData(null);
    resetResult();
  };

  // Styles responsives
  const styles = {
    container: {
      padding: window.innerWidth < 768 ? '12px' : '24px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      paddingBottom: 'env(safe-area-inset-bottom, 20px)'
    },
    title: {
      fontSize: window.innerWidth < 768 ? '20px' : '28px',
      marginBottom: '16px',
      textAlign: 'center'
    },
    card: {
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      marginBottom: '16px'
    },
    radioGroup: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    mainButton: {
      height: window.innerWidth < 768 ? '56px' : '64px',
      fontSize: window.innerWidth < 768 ? '16px' : '18px',
      borderRadius: '12px',
      fontWeight: '600'
    },
    secondaryButton: {
      height: '48px',
      borderRadius: '12px',
      fontSize: '15px'
    },

    userCard: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
      color: 'white'
    }
  };

  return (
    <div style={styles.container}>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📱</div>
        <Title level={2} style={styles.title}>Scanner QR Code</Title>
      </div>

      {/* Carte principale */}
      <Card style={styles.card} bodyStyle={{ padding: window.innerWidth < 768 ? '16px' : '24px' }}>
        
        {/* Type de pointage */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '15px', color: '#666' }}>
            Type de pointage
          </Text>
          <Radio.Group 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            size="large"
            style={{ ...styles.radioGroup, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}
            buttonStyle="solid"
          >
            <Radio.Button value="ARRIVEE" style={{ textAlign: 'center', height: '48px', lineHeight: '46px', borderRadius: '10px' }}>
              🟢 Arrivée
            </Radio.Button>
            <Radio.Button value="PAUSE" style={{ textAlign: 'center', height: '48px', lineHeight: '46px', borderRadius: '10px' }}>
              ☕ Pause
            </Radio.Button>
            <Radio.Button value="REPRISE" style={{ textAlign: 'center', height: '48px', lineHeight: '46px', borderRadius: '10px' }}>
              💼 Reprise
            </Radio.Button>
            <Radio.Button value="DEPART" style={{ textAlign: 'center', height: '48px', lineHeight: '46px', borderRadius: '10px' }}>
              🟠 Départ
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Formulaire de Pointage (seulement si pas de résultat) */}
        {!result && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              icon={processing ? <Spin size="small" /> : <CameraOutlined />}
              onClick={() => fileInputRef.current?.click()}
              block
              disabled={processing}
              style={styles.mainButton}
            >
              {processing ? 'Analyse...' : '📷 Prendre une photo'}
            </Button>

            <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
              — ou —
            </div>

            <Button
              icon={<EnvironmentOutlined />}
              onClick={() => setShowManualModal(true)}
              block
              style={styles.secondaryButton}
            >
              📍 Sélectionner le site
            </Button>
          </Space>
        )}

        {/* Résultat */}
        {result && (
          <Result
            status={result.success ? 'success' : 'error'}
            title={
              <span style={{ fontSize: window.innerWidth < 768 ? '18px' : '24px' }}>
                {result.success ? '✅ Pointage enregistré !' : '❌ Échec'}
              </span>
            }
            subTitle={
              <div style={{ fontSize: '14px' }}>
                <p><strong>Site :</strong> {result.site}</p>
                <p><strong>Type :</strong> {result.type === 'ARRIVEE' ? '🟢 Arrivée' : result.type === 'PAUSE' ? '☕ Pause' : result.type === 'REPRISE' ? '💼 Reprise' : '🟠 Départ'}</p>
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="retry"
                icon={<ReloadOutlined />}
                onClick={resetResult}
                style={styles.mainButton}
                block
              >
                Nouveau pointage
              </Button>
            ]}
          />
        )}
      </Card>

      {/* Carte utilisateur */}
      <Card style={styles.userCard} bodyStyle={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Connecté
            </div>
          </div>
        </div>
      </Card>

      {/* Modal sélection manuelle */}
      <Modal
        title={
          <div style={{ fontSize: '18px' }}>
            📍 Sélection du site
          </div>
        }
        open={showManualModal}
        onCancel={() => {
          setShowManualModal(false);
          setSelectedSiteId(null);
        }}
        footer={null}
        centered
        width="90%"
        style={{ maxWidth: '400px' }}
        styles={{ body: { padding: '20px', overflow: 'hidden' } }}
      >
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '10px' }}>
            Type de pointage
          </Text>
          <Radio.Group 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            size="large"
            buttonStyle="solid"
            style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}
          >
            <Radio.Button value="ARRIVEE" style={{ textAlign: 'center', borderRadius: '8px' }}>
              🟢 Arrivée
            </Radio.Button>
            <Radio.Button value="PAUSE" style={{ textAlign: 'center', borderRadius: '8px' }}>
              ☕ Pause
            </Radio.Button>
            <Radio.Button value="REPRISE" style={{ textAlign: 'center', borderRadius: '8px' }}>
              💼 Reprise
            </Radio.Button>
            <Radio.Button value="DEPART" style={{ textAlign: 'center', borderRadius: '8px' }}>
              🟠 Départ
            </Radio.Button>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: '24px', width: '100%', overflow: 'hidden' }}>
          <Text strong style={{ display: 'block', marginBottom: '10px' }}>
            Sélectionnez le site
          </Text>
          <Select
            placeholder="Choisir un site..."
            style={{ width: '100%', maxWidth: '100%' }}
            size="large"
            value={selectedSiteId}
            onChange={setSelectedSiteId}
            popupMatchSelectWidth={true}
            options={sites.map(site => ({
              value: site.id,
              label: site.nom + (site.adresse ? ` - ${site.adresse}` : '')
            }))}
          />
        </div>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            loading={processing}
            onClick={handleManualPointage}
            disabled={!selectedSiteId}
            block
            style={{ height: '50px', borderRadius: '10px' }}
          >
            ✓ Valider le pointage
          </Button>
          <Button
            size="large"
            onClick={() => {
              setShowManualModal(false);
              setSelectedSiteId(null);
            }}
            block
            style={{ borderRadius: '10px' }}
          >
            Annuler
          </Button>
        </Space>
      </Modal>

      {/* Modal de succès */}
      <Modal
        open={successModalVisible}
        onCancel={handleCloseSuccessModal}
        footer={[
          <Button
            key="close"
            type="primary"
            size="large"
            onClick={handleCloseSuccessModal}
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

export default Scanner;
