import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Tooltip, Row, Col, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined, QrcodeOutlined, DownloadOutlined, PrinterOutlined, UserAddOutlined, KeyOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { employeService } from '../services';

const { Text, Title } = Typography;

const Employes = () => {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrInscriptionModalVisible, setQrInscriptionModalVisible] = useState(false);
  const [resetPinModalVisible, setResetPinModalVisible] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [form] = Form.useForm();
  const [pinForm] = Form.useForm();
  const qrRef = useRef(null);
  const qrInscriptionRef = useRef(null);
  
  // URL pour le QR code - utiliser l'IP réseau au lieu de localhost
  const getInscriptionUrl = () => {
    const hostname = window.location.hostname;
    // Si on est sur localhost, utiliser l'IP réseau locale
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://77.42.22.25/inscription`;
    }
    return `${window.location.origin}/inscription`;
  };

  useEffect(() => {
    loadEmployes();
  }, []);

  const loadEmployes = async () => {
    setLoading(true);
    try {
      const data = await employeService.getAll();
      setEmployes(data);
    } catch (error) {
      message.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingEmploye(null);
    setModalVisible(true);
  };

  const handleEdit = (employe) => {
    setEditingEmploye(employe);
    form.setFieldsValue(employe);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await employeService.delete(id);
      message.success(result.message || 'Employé désactivé');
      loadEmployes();
    } catch (error) {
      message.error('Erreur lors de la désactivation');
    }
  };

  const handleActiver = async (id) => {
    try {
      const result = await employeService.activer(id);
      message.success(result.message || 'Employé réactivé');
      loadEmployes();
    } catch (error) {
      message.error('Erreur lors de la réactivation');
    }
  };

  // Afficher le QR code d'un employé
  const handleShowQR = (employe) => {
    setSelectedEmploye(employe);
    setQrModalVisible(true);
  };

  // Générer les données du QR code
  const generateQRData = (employe) => {
    return JSON.stringify({
      id: employe.id,
      email: employe.email,
      nom: employe.nom,
      prenom: employe.prenom
    });
  };

  // Télécharger le QR code en PNG
  const downloadQR = () => {
    if (!qrRef.current || !selectedEmploye) return;
    
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 350;
      
      // Fond blanc
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner le QR code
      ctx.drawImage(img, 50, 20, 200, 200);
      
      // Ajouter le nom
      ctx.fillStyle = 'black';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${selectedEmploye.prenom} ${selectedEmploye.nom}`, 150, 250);
      ctx.font = '12px Arial';
      ctx.fillText(selectedEmploye.email, 150, 275);
      ctx.fillText(`ID: ${selectedEmploye.id}`, 150, 295);
      
      // Télécharger
      const link = document.createElement('a');
      link.download = `qr_${selectedEmploye.nom}_${selectedEmploye.prenom}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      message.success('QR Code téléchargé');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Imprimer le QR code
  const printQR = () => {
    if (!selectedEmploye) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${selectedEmploye.prenom} ${selectedEmploye.nom}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
            }
            .qr-container {
              border: 2px solid #333;
              border-radius: 12px;
              padding: 30px;
              display: inline-block;
              margin: 20px;
            }
            h2 { margin-bottom: 5px; }
            p { color: #666; margin: 5px 0; }
            .id { font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrRef.current.innerHTML}
            <h2>${selectedEmploye.prenom} ${selectedEmploye.nom}</h2>
            <p>${selectedEmploye.email}</p>
            <p class="id">ID: ${selectedEmploye.id}</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingEmploye) {
        await employeService.update(editingEmploye.id, values);
        message.success('Employé mis à jour');
      } else {
        await employeService.create(values);
        message.success('Employé créé');
      }
      setModalVisible(false);
      loadEmployes();
    } catch (error) {
      message.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
      sorter: (a, b) => a.nom.localeCompare(b.nom)
    },
    {
      title: 'Prénom',
      dataIndex: 'prenom',
      key: 'prenom'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone'
    },
    {
      title: 'Département',
      dataIndex: 'departement',
      key: 'departement',
      render: (dept) => dept || <Text type="secondary">-</Text>
    },
    {
      title: 'Supérieur',
      dataIndex: 'superieurHierarchique',
      key: 'superieurHierarchique',
      render: (sup) => sup || <Text type="secondary">-</Text>
    },
    {
      title: 'Email Supérieur',
      dataIndex: 'emailSuperieur',
      key: 'emailSuperieur',
      render: (email) => email ? <a href={`mailto:${email}`}>{email}</a> : <Text type="secondary">-</Text>
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const config = { 
          ADMIN: { color: 'red', label: 'Admin' }, 
          MANAGER: { color: 'blue', label: 'Manager' }, 
          EMPLOYE: { color: 'green', label: 'Employé' },
          JOURNALIER: { color: 'orange', label: 'Journalier' }
        };
        const { color, label } = config[role] || { color: 'default', label: role };
        return <Tag color={color}>{label}</Tag>;
      },
      filters: [
        { text: 'Employé', value: 'EMPLOYE' },
        { text: 'Journalier', value: 'JOURNALIER' },
        { text: 'Manager', value: 'MANAGER' },
        { text: 'Admin', value: 'ADMIN' }
      ],
      onFilter: (value, record) => record.role === value
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="QR Code">
            <Button 
              icon={<QrcodeOutlined />} 
              onClick={() => handleShowQR(record)}
              size="small"
              type="primary"
              ghost
            />
          </Tooltip>
          <Tooltip title="Réinitialiser PIN">
            <Button 
              icon={<KeyOutlined />} 
              onClick={() => {
                setSelectedEmploye(record);
                pinForm.resetFields();
                setResetPinModalVisible(true);
              }}
              size="small"
              style={{ color: '#fa8c16', borderColor: '#fa8c16' }}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          
          {record.actif ? (
            <Popconfirm
              title="Désactiver cet employé ?"
              description="Ses pointages seront masqués mais conservés."
              onConfirm={() => handleDelete(record.id)}
              okText="Désactiver"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Désactiver">
                <Button 
                  icon={<StopOutlined />} 
                  danger
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Réactiver cet employé ?"
              description="Ses pointages seront à nouveau visibles."
              onConfirm={() => handleActiver(record.id)}
              okText="Réactiver"
              cancelText="Annuler"
            >
              <Tooltip title="Réactiver">
                <Button 
                  icon={<CheckCircleOutlined />} 
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="👥 Gestion des Employés"
        extra={
          <Space>
            <Button 
              icon={<QrcodeOutlined />}
              onClick={() => setQrInscriptionModalVisible(true)}
              style={{ background: '#722ed1', borderColor: '#722ed1', color: 'white' }}
            >
              QR Inscription
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nouvel employé
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={employes}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="nom"
            label="Nom"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="prenom"
            label="Prénom"
            rules={[{ required: true, message: 'Prénom requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input disabled={!!editingEmploye} />
          </Form.Item>

          <Form.Item
            name="telephone"
            label="Téléphone"
            rules={[{ required: true, message: 'Téléphone requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="departement"
            label="Département"
          >
            <Input placeholder="Ex: Travaux neufs, Electricité 1..." />
          </Form.Item>

          <Form.Item
            name="superieurHierarchique"
            label="Supérieur hiérarchique"
          >
            <Input placeholder="Nom du manager" />
          </Form.Item>

          <Form.Item
            name="emailSuperieur"
            label="Email du Supérieur"
            rules={[
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input placeholder="email@exemple.com" />
          </Form.Item>

          {!editingEmploye && (
            <Form.Item
              name="pin"
              label="Code PIN"
              rules={[
                { required: true, message: 'PIN requis' },
                { len: 4, message: 'Le PIN doit contenir 4 chiffres' }
              ]}
            >
              <Input.Password maxLength={4} />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rôle"
            initialValue="EMPLOYE"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="EMPLOYE">Employé</Select.Option>
              <Select.Option value="JOURNALIER">Journalier</Select.Option>
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="ADMIN">Administrateur</Select.Option>
            </Select>
          </Form.Item>

          {editingEmploye && (
            <Form.Item
              name="actif"
              label="Status"
              valuePropName="checked"
            >
              <Select>
                <Select.Option value={true}>Actif</Select.Option>
                <Select.Option value={false}>Inactif</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEmploye ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal QR Code */}
      <Modal
        title={<span><QrcodeOutlined /> QR Code de l'employé</span>}
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printQR}>
            Imprimer
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadQR}>
            Télécharger PNG
          </Button>
        ]}
        width={400}
        centered
      >
        {selectedEmploye && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div 
              ref={qrRef}
              style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
                display: 'inline-block'
              }}
            >
              <QRCodeSVG 
                value={generateQRData(selectedEmploye)}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedEmploye.prenom} {selectedEmploye.nom}
              </Title>
              <Text type="secondary">{selectedEmploye.email}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>ID: {selectedEmploye.id}</Text>
            </div>
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#f6ffed', 
              borderRadius: '8px',
              border: '1px solid #b7eb8f'
            }}>
              <Text style={{ fontSize: '12px' }}>
                📱 Ce QR code permet à l'employé de pointer son arrivée et son départ.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal QR Code d'Inscription */}
      <Modal
        title={<span><UserAddOutlined /> QR Code d'Auto-Inscription</span>}
        open={qrInscriptionModalVisible}
        onCancel={() => setQrInscriptionModalVisible(false)}
        footer={[
          <Button 
            key="print" 
            icon={<PrinterOutlined />} 
            onClick={() => {
              const printWindow = window.open('', '_blank');
              const inscriptionUrl = getInscriptionUrl();
              printWindow.document.write(`
                <html>
                  <head>
                    <title>QR Code - Auto-Inscription</title>
                    <style>
                      body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 40px;
                      }
                      .qr-container {
                        border: 3px solid #722ed1;
                        border-radius: 16px;
                        padding: 40px;
                        display: inline-block;
                        margin: 20px;
                        background: white;
                      }
                      h1 { color: #722ed1; margin-bottom: 5px; }
                      h2 { color: #333; font-weight: normal; }
                      p { color: #666; margin: 10px 0; }
                      .url { 
                        font-size: 14px; 
                        color: #999; 
                        word-break: break-all;
                        margin-top: 20px;
                      }
                      .instructions {
                        background: #f6f0ff;
                        border-radius: 8px;
                        padding: 15px;
                        margin-top: 20px;
                        text-align: left;
                      }
                      .instructions li {
                        margin: 8px 0;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="qr-container">
                      <h1>🏢 POINTAGE</h1>
                      <h2>Auto-Inscription Employé</h2>
                      ${qrInscriptionRef.current?.innerHTML || ''}
                      <p class="url">${inscriptionUrl}</p>
                      <div class="instructions">
                        <strong>📱 Instructions :</strong>
                        <ol>
                          <li>Scannez ce QR code avec votre téléphone</li>
                          <li>Remplissez vos informations</li>
                          <li>Créez votre code PIN à 4 chiffres</li>
                          <li>Vous êtes inscrit !</li>
                        </ol>
                      </div>
                    </div>
                    <script>window.print(); window.close();</script>
                  </body>
                </html>
              `);
              printWindow.document.close();
            }}
          >
            Imprimer
          </Button>,
          <Button 
            key="copy" 
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(getInscriptionUrl());
              message.success('Lien copié !');
            }}
          >
            Copier le lien
          </Button>
        ]}
        width={450}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div 
            ref={qrInscriptionRef}
            style={{ 
              background: 'linear-gradient(135deg, #f6f0ff 0%, #e8daff 100%)', 
              padding: '30px', 
              borderRadius: '16px',
              border: '2px solid #722ed1',
              display: 'inline-block'
            }}
          >
            <QRCodeSVG 
              value={getInscriptionUrl()}
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#722ed1"
            />
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
              <UserAddOutlined /> Auto-Inscription
            </Title>
            <Text type="secondary">
              Les employés peuvent scanner ce QR code pour s'inscrire
            </Text>
            <div style={{ 
              marginTop: '12px', 
              padding: '8px 12px', 
              background: '#f0f0f0', 
              borderRadius: '6px',
              wordBreak: 'break-all',
              fontSize: '12px'
            }}>
              🔗 {getInscriptionUrl()}
            </div>
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            background: '#f6f0ff', 
            borderRadius: '12px',
            border: '1px solid #d3adf7',
            textAlign: 'left'
          }}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              📱 Comment ça marche :
            </Text>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li><Text style={{ fontSize: '13px' }}>L'employé scanne le QR code</Text></li>
              <li><Text style={{ fontSize: '13px' }}>Il remplit son nom, prénom et email</Text></li>
              <li><Text style={{ fontSize: '13px' }}>Il crée son code PIN à 4 chiffres</Text></li>
              <li><Text style={{ fontSize: '13px' }}>Il peut ensuite pointer !</Text></li>
            </ol>
          </div>

          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            background: '#fff7e6', 
            borderRadius: '8px',
            border: '1px solid #ffd591'
          }}>
            <Text style={{ fontSize: '12px', color: '#d46b08' }}>
              💡 Astuce : Imprimez ce QR code et affichez-le à l'entrée du site
            </Text>
          </div>
        </div>
      </Modal>

      {/* Modal Réinitialisation PIN */}
      <Modal
        title={<span><KeyOutlined style={{ color: '#fa8c16' }} /> Réinitialiser le code PIN</span>}
        open={resetPinModalVisible}
        onCancel={() => {
          setResetPinModalVisible(false);
          pinForm.resetFields();
        }}
        footer={null}
        width={400}
        centered
      >
        {selectedEmploye && (
          <div>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              padding: '16px',
              background: '#fff7e6',
              borderRadius: '8px',
              border: '1px solid #ffd591'
            }}>
              <Text strong style={{ fontSize: '16px' }}>
                {selectedEmploye.prenom} {selectedEmploye.nom}
              </Text>
              <br />
              <Text type="secondary">{selectedEmploye.email}</Text>
            </div>

            <Form
              form={pinForm}
              layout="vertical"
              onFinish={async (values) => {
                try {
                  const result = await employeService.resetPin(selectedEmploye.id, values.newPin);
                  message.success(result.message);
                  setResetPinModalVisible(false);
                  pinForm.resetFields();
                } catch (error) {
                  message.error(error.response?.data?.error || 'Erreur lors de la réinitialisation');
                }
              }}
            >
              <Form.Item
                name="newPin"
                label="Nouveau code PIN"
                rules={[
                  { required: true, message: 'Le code PIN est requis' },
                  { len: 4, message: 'Le PIN doit contenir exactement 4 chiffres' },
                  { pattern: /^\d{4}$/, message: 'Le PIN doit contenir uniquement des chiffres' }
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

              <Form.Item
                name="confirmPin"
                label="Confirmer le code PIN"
                dependencies={['newPin']}
                rules={[
                  { required: true, message: 'Confirmez le code PIN' },
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
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    letterSpacing: '8px' 
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setResetPinModalVisible(false);
                    pinForm.resetFields();
                  }}>
                    Annuler
                  </Button>
                  <Button type="primary" htmlType="submit" style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                    Réinitialiser le PIN
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#f6ffed', 
              borderRadius: '8px',
              border: '1px solid #b7eb8f'
            }}>
              <Text style={{ fontSize: '12px' }}>
                💡 Communiquez le nouveau code PIN à l'employé de manière sécurisée.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employes;
