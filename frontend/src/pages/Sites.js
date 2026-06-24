import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Image, Tabs, Typography, Alert, InputNumber, Switch, Row, Col, Divider, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, CameraOutlined, MobileOutlined, PrinterOutlined, CopyOutlined, AimOutlined, EnvironmentOutlined, UploadOutlined } from '@ant-design/icons';
import { siteService } from '../services';

const { Text, Paragraph } = Typography;

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [qrData, setQrData] = useState({ standard: null, url: null });
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (error) {
      message.error('Erreur lors du chargement des sites');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir la position GPS actuelle
  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      message.error('La géolocalisation n\'est pas supportée par votre navigateur');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        message.success('Position GPS obtenue !');
        setGettingLocation(false);
      },
      (error) => {
        message.error('Erreur lors de l\'obtention de la position: ' + error.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreate = () => {
    form.resetFields();
    setImageFile(null);
    setImagePreview(null);
    // Valeurs par défaut pour un nouveau site
    form.setFieldsValue({
      geoRequired: true,
      rayonMetres: 100
    });
    setEditingSite(null);
    setModalVisible(true);
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    form.setFieldsValue(site);
    setImageFile(null);
    // Obtenir l'URL de base sans /api pour les uploads
    if (site.imageUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const baseUrl = apiUrl.replace('/api', '');
      setImagePreview(`${baseUrl}/uploads/sites/${site.imageUrl}`);
    } else {
      setImagePreview(null);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await siteService.delete(id);
      message.success('Site supprimé');
      loadSites();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la suppression';
      message.error(errorMsg, 5); // Afficher pendant 5 secondes
      console.error('Erreur suppression:', error.response?.data);
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log('📤 Envoi du formulaire');
      console.log('📋 Values:', values);
      console.log('📷 imageFile:', imageFile);
      
      const formData = new FormData();
      
      // Ajouter tous les champs du formulaire SAUF 'image' (qui contient les métadonnées Ant Design)
      Object.keys(values).forEach(key => {
        if (key !== 'image' && values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      
      // Ajouter le fichier image réel si il existe
      if (imageFile) {
        console.log('✅ Ajout du fichier image au FormData');
        formData.append('image', imageFile);
      } else {
        console.log('⚠️ Aucun fichier image à envoyer');
      }
      
      if (editingSite) {
        await siteService.update(editingSite.id, formData);
        message.success('Site mis à jour');
      } else {
        await siteService.create(formData);
        message.success('Site créé');
      }
      setModalVisible(false);
      setImageFile(null);
      setImagePreview(null);
      loadSites();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  const showQRCode = async (site) => {
    setSelectedSite(site);
    setQrLoading(true);
    setQrModalVisible(true);
    
    try {
      // Charger les deux types de QR codes en parallèle
      const [standardData, urlData] = await Promise.all([
        siteService.getQRCode(site.id),
        siteService.getQRCodeUrl(site.id)
      ]);
      
      setQrData({
        standard: standardData,
        url: urlData
      });
    } catch (error) {
      message.error('Erreur lors de la génération des QR codes');
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQRCode = (type) => {
    const data = type === 'url' ? qrData.url : qrData.standard;
    if (!data) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${type === 'url' ? 'camera' : 'app'}-${selectedSite.nom}.png`;
    link.href = data.qrCode;
    link.click();
    message.success('QR Code téléchargé');
  };

  const copyUrl = () => {
    if (qrData.url?.url) {
      navigator.clipboard.writeText(qrData.url.url);
      message.success('URL copiée dans le presse-papiers');
    }
  };

  const printQRCode = (type) => {
    const data = type === 'url' ? qrData.url : qrData.standard;
    if (!data) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${selectedSite.nom}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            h1 {
              font-size: 32px;
              margin-bottom: 20px;
            }
            img {
              width: 300px;
              height: 300px;
            }
            .instructions {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
              max-width: 300px;
            }
            .type-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .type-camera {
              background: #e6f7ff;
              color: #1890ff;
            }
            .type-app {
              background: #f6ffed;
              color: #52c41a;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="type-badge ${type === 'url' ? 'type-camera' : 'type-app'}">
              ${type === 'url' ? '📷 Scan Appareil Photo' : '📱 Scan Application'}
            </div>
            <h1>📍 ${selectedSite.nom}</h1>
            <img src="${data.qrCode}" alt="QR Code" />
            <div class="instructions">
              ${type === 'url' 
                ? 'Scannez ce QR code avec l\'appareil photo de votre téléphone pour enregistrer votre pointage.'
                : 'Scannez ce QR code depuis l\'application de pointage.'}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
      sorter: (a, b) => a.nom.localeCompare(b.nom)
    },
    {
      title: 'Adresse',
      dataIndex: 'adresse',
      key: 'adresse'
    },
    {
      title: 'Ville',
      dataIndex: 'ville',
      key: 'ville'
    },
    {
      title: 'Code Postal',
      dataIndex: 'codePostal',
      key: 'codePostal'
    },
    {
      title: 'Status',
      dataIndex: 'actif',
      key: 'actif',
      render: (actif) => (
        <Tag color={actif ? 'success' : 'default'}>
          {actif ? 'Actif' : 'Inactif'}
        </Tag>
      )
    },
    {
      title: 'Géoloc',
      key: 'geo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.geoRequired ? (
            <Tag color="blue" icon={<EnvironmentOutlined />}>
              Obligatoire
            </Tag>
          ) : (
            <Tag color="default">Désactivée</Tag>
          )}
          {record.latitude && record.longitude ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.rayonMetres}m
            </Text>
          ) : record.geoRequired ? (
            <Text type="danger" style={{ fontSize: 11 }}>
              ⚠️ Non configuré
            </Text>
          ) : null}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<QrcodeOutlined />} 
            onClick={() => showQRCode(record)}
            size="small"
            type="primary"
          >
            QR Codes
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Supprimer ce site ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const qrTabItems = [
    {
      key: 'camera',
      label: (
        <span>
          <CameraOutlined /> Appareil Photo
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Alert
            message="📷 QR Code pour Appareil Photo Natif"
            description="Ce QR code peut être scanné directement avec l'appareil photo du téléphone. Il redirigera automatiquement vers la page de pointage."
            type="info"
            showIcon
            style={{ marginBottom: 20, textAlign: 'left' }}
          />
          
          {qrData.url && (
            <>
              <Image 
                src={qrData.url.qrCode} 
                alt="QR Code URL" 
                width={280}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
              />
              
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>URL du pointage :</Text>
                <Paragraph 
                  copyable={{ text: qrData.url.url }}
                  style={{ 
                    fontSize: 11, 
                    background: '#f5f5f5', 
                    padding: '8px 12px', 
                    borderRadius: 8,
                    marginTop: 4,
                    wordBreak: 'break-all'
                  }}
                >
                  {qrData.url.url}
                </Paragraph>
              </div>

              <Space style={{ marginTop: 16 }}>
                <Button 
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={() => printQRCode('url')}
                >
                  Imprimer
                </Button>
                <Button 
                  icon={<CopyOutlined />}
                  onClick={() => downloadQRCode('url')}
                >
                  Télécharger
                </Button>
              </Space>
            </>
          )}
        </div>
      )
    },
    {
      key: 'app',
      label: (
        <span>
          <MobileOutlined /> Application
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Alert
            message="📱 QR Code pour l'Application"
            description="Ce QR code doit être scanné depuis l'application de pointage (Scanner intégré). Il contient les données du site en format JSON."
            type="success"
            showIcon
            style={{ marginBottom: 20, textAlign: 'left' }}
          />
          
          {qrData.standard && (
            <>
              <Image 
                src={qrData.standard.qrCode} 
                alt="QR Code App" 
                width={280}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
              />
              
              <Space style={{ marginTop: 24 }}>
                <Button 
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={() => printQRCode('standard')}
                >
                  Imprimer
                </Button>
                <Button 
                  icon={<CopyOutlined />}
                  onClick={() => downloadQRCode('standard')}
                >
                  Télécharger
                </Button>
              </Space>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="📍 Gestion des Sites"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Nouveau site
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={sites}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal création/édition */}
      <Modal
        title={editingSite ? 'Modifier le site' : 'Nouveau site'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        style={{ maxWidth: '95vw' }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="nom"
            label="Nom du site"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="adresse"
            label="Adresse"
            rules={[{ required: true, message: 'Adresse requise' }]}
          >
            <Input placeholder="Ex: 123 Rue de la Paix" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="ville" label="Ville">
                <Input placeholder="Ex: Paris" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="codePostal" label="Code Postal">
                <Input placeholder="Ex: 75001" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <CameraOutlined /> Image de fond
          </Divider>

          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              Image de pointage
              <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                Image qui sera affichée lors du pointage sur ce site
              </span>
            </div>
            <Upload
              beforeUpload={(file) => {
                console.log('📷 Fichier sélectionné:', file);
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('Vous ne pouvez uploader que des images !');
                  return false;
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error('L\'image doit faire moins de 5MB !');
                  return false;
                }
                
                setImageFile(file);
                console.log('✅ Fichier stocké dans imageFile');
                
                // Créer un aperçu
                const reader = new FileReader();
                reader.onload = (e) => setImagePreview(e.target.result);
                reader.readAsDataURL(file);
                
                return false; // Empêcher l'upload automatique
              }}
              onRemove={() => {
                console.log('🗑️ Fichier supprimé');
                setImageFile(null);
                setImagePreview(null);
              }}
              maxCount={1}
              listType="picture-card"
              showUploadList={false}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Choisir une image</div>
                </div>
              )}
            </Upload>
            {imagePreview && (
              <Button 
                danger 
                size="small" 
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                style={{ marginTop: 8 }}
              >
                Supprimer l'image
              </Button>
            )}
          </div>

          <Divider orientation="left">
            <EnvironmentOutlined /> Sécurité Géolocalisation
          </Divider>

          <Form.Item 
            name="geoRequired" 
            label="Géolocalisation obligatoire"
            valuePropName="checked"
            tooltip="Si activé, l'employé doit être physiquement présent sur le site pour pointer"
          >
            <Switch 
              checkedChildren="Oui" 
              unCheckedChildren="Non"
            />
          </Form.Item>

          <Alert
            message="Configuration GPS du site"
            description="Entrez les coordonnées GPS du site ou cliquez sur le bouton pour utiliser votre position actuelle (si vous êtes sur le site)."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[8, 0]} align="bottom">
            <Col xs={24} sm={9}>
              <Form.Item 
                name="latitude" 
                label="Latitude"
                tooltip="Coordonnée GPS Nord/Sud"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  step={0.000001}
                  precision={6}
                  placeholder="Ex: 48.856614"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={9}>
              <Form.Item 
                name="longitude" 
                label="Longitude"
                tooltip="Coordonnée GPS Est/Ouest"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  step={0.000001}
                  precision={6}
                  placeholder="Ex: 2.352222"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label=" " style={{ marginBottom: 24 }}>
                <Button 
                  icon={<AimOutlined />} 
                  onClick={getCurrentLocation}
                  loading={gettingLocation}
                  title="Obtenir ma position actuelle"
                  block
                >
                  📍 GPS
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="rayonMetres" 
            label="Rayon de tolérance (mètres)"
            tooltip="Distance maximale autorisée entre l'employé et le site pour pouvoir pointer"
          >
            <InputNumber 
              min={10} 
              max={1000} 
              style={{ width: '100%' }}
              addonAfter="mètres"
              placeholder="100"
            />
          </Form.Item>

          <Alert
            message={`Un rayon de 100m convient pour la plupart des sites. Augmentez si le bâtiment est grand ou si le GPS est imprécis.`}
            type="warning"
            style={{ marginBottom: 16 }}
          />

          {editingSite && (
            <Form.Item name="actif" label="Status">
              <Select>
                <Select.Option value={true}>Actif</Select.Option>
                <Select.Option value={false}>Inactif</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSite ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal QR Codes */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrcodeOutlined />
            <span>QR Codes - {selectedSite?.nom}</span>
          </div>
        }
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false);
          setQrData({ standard: null, url: null });
        }}
        footer={null}
        width={500}
      >
        {qrLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="ant-spin ant-spin-lg ant-spin-spinning">
              <span className="ant-spin-dot ant-spin-dot-spin">
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
              </span>
            </div>
            <div style={{ marginTop: 16, color: '#666' }}>Génération des QR codes...</div>
          </div>
        ) : (
          <Tabs 
            items={qrTabItems} 
            defaultActiveKey="camera"
            centered
          />
        )}
      </Modal>
    </div>
  );
};

export default Sites;
