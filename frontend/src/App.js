import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Drawer } from 'antd';
import {
  DashboardOutlined,
  QrcodeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  MenuOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { authService } from './services';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Employes from './pages/Employes';
import Sites from './pages/Sites';
import Pointages from './pages/Pointages';
import MesPointages from './pages/MesPointages';
import QuickPointage from './pages/QuickPointage';
import AutoInscription from './pages/AutoInscription';
import ChangerPin from './pages/ChangerPin';
import Profil from './pages/Profil';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [currentUser, setCurrentUser] = React.useState(authService.getCurrentUser());

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mon profil',
      onClick: () => window.location.href = '/profil'
    },
    {
      key: 'change-pin',
      icon: <KeyOutlined />,
      label: 'Changer mon PIN',
      onClick: () => window.location.href = '/changer-pin'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Déconnexion',
      onClick: handleLogout
    }
  ];

  // Menu adapté selon le rôle
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  
  const menuItems = isAdmin ? [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: '/scanner',
      icon: <QrcodeOutlined />,
      label: 'Scanner'
    },
    {
      key: '/pointages',
      icon: <ClockCircleOutlined />,
      label: 'Pointages'
    },
    {
      key: '/employes',
      icon: <UserOutlined />,
      label: 'Employés'
    },
    {
      key: '/sites',
      icon: <EnvironmentOutlined />,
      label: 'Sites'
    }
  ] : [
    {
      key: '/scanner',
      icon: <QrcodeOutlined />,
      label: 'Scanner'
    },
    {
      key: '/mes-pointages',
      icon: <ClockCircleOutlined />,
      label: 'Mes pointages'
    }
  ];

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    const isAdminUser = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    
    if (!token) return <Navigate to="/login" />;
    if (!isAdminUser) return <Navigate to="/scanner" />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Route d'auto-inscription - accessible sans login */}
        <Route path="/inscription" element={<AutoInscription />} />
        {/* Route de pointage rapide - accessible sans login pour permettre la redirection */}
        <Route path="/pointage" element={
          currentUser ? (
            <Layout style={{ minHeight: '100vh' }}>
              {/* Sidebar pour desktop */}
              {!isMobile && (
                <Sider 
                  collapsible 
                  collapsed={collapsed} 
                  onCollapse={setCollapsed}
                  theme="light"
                  style={{
                    boxShadow: '2px 0 6px rgba(0,21,41,.08)'
                  }}
                >
                  <div style={{ 
                    height: 64, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: collapsed ? '24px' : '20px',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    {collapsed ? '🏢' : '🏢 Pointage'}
                  </div>
                  <Menu
                    mode="inline"
                    selectedKeys={['/pointage']}
                    items={menuItems}
                    onClick={({ key }) => window.location.href = key}
                    style={{ borderRight: 0 }}
                  />
                </Sider>
              )}

              {/* Drawer menu pour mobile */}
              <Drawer
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🏢</span>
                    <span>Menu</span>
                  </div>
                }
                placement="left"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                bodyStyle={{ padding: 0 }}
                width={280}
              >
                {/* Info utilisateur dans le drawer */}
                <div style={{ 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar size={48} icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {currentUser?.prenom} {currentUser?.nom}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {currentUser?.role === 'ADMIN' ? 'Administrateur' : 'Employé'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Menu
                  mode="inline"
                  selectedKeys={['/pointage']}
                  items={menuItems}
                  onClick={({ key }) => {
                    window.location.href = key;
                    setMobileMenuOpen(false);
                  }}
                  style={{ border: 'none' }}
                />
                
                <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: 'auto' }}>
                  <Button 
                    danger 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    block
                    size="large"
                  >
                    Déconnexion
                  </Button>
                </div>
              </Drawer>

              <Layout>
                <Header style={{ 
                  background: '#fff', 
                  padding: isMobile ? '0 12px' : '0 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                  position: isMobile ? 'sticky' : 'relative',
                  top: 0,
                  zIndex: 100
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isMobile && (
                      <Button 
                        type="text" 
                        icon={<MenuOutlined />} 
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ fontSize: '18px' }}
                      />
                    )}
                    <div style={{ 
                      fontSize: isMobile ? '16px' : '18px', 
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {isMobile && <span>🏢</span>}
                      <span>{isMobile ? 'Pointage' : 'Système de Badgeage'}</span>
                    </div>
                  </div>
                  
                  {!isMobile && (
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar icon={<UserOutlined />} />
                        <span>{currentUser?.prenom}</span>
                      </div>
                    </Dropdown>
                  )}
                </Header>

                <Content style={{ 
                  margin: isMobile ? '0' : '24px 16px', 
                  padding: isMobile ? '16px' : 24, 
                  background: '#f0f2f5',
                  minHeight: 280 
                }}>
                  <QuickPointage />
                </Content>
              </Layout>
            </Layout>
          ) : <QuickPointage />
        } />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout style={{ minHeight: '100vh' }}>
                {/* Sidebar pour desktop */}
                {!isMobile && (
                  <Sider 
                    collapsible 
                    collapsed={collapsed} 
                    onCollapse={setCollapsed}
                    theme="light"
                    style={{
                      boxShadow: '2px 0 6px rgba(0,21,41,.08)'
                    }}
                  >
                    <div style={{ 
                      height: 64, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: collapsed ? '24px' : '20px',
                      fontWeight: 'bold',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      {collapsed ? '🏢' : '🏢 Pointage'}
                    </div>
                    <Menu
                      mode="inline"
                      defaultSelectedKeys={[window.location.pathname]}
                      items={menuItems}
                      onClick={({ key }) => window.location.href = key}
                      style={{ borderRight: 0 }}
                    />
                  </Sider>
                )}

                {/* Drawer menu pour mobile */}
                <Drawer
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>🏢</span>
                      <span>Menu</span>
                    </div>
                  }
                  placement="left"
                  onClose={() => setMobileMenuOpen(false)}
                  open={mobileMenuOpen}
                  bodyStyle={{ padding: 0 }}
                  width={280}
                >
                  {/* Info utilisateur dans le drawer */}
                  <div style={{ 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #081BCC 0%, #0615A1 100%)',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar size={48} icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          {currentUser?.prenom} {currentUser?.nom}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                          {currentUser?.role === 'ADMIN' ? 'Administrateur' : 'Employé'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Menu
                    mode="inline"
                    selectedKeys={[window.location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => {
                      window.location.href = key;
                      setMobileMenuOpen(false);
                    }}
                    style={{ border: 'none' }}
                  />
                  
                  <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: 'auto' }}>
                    <Button 
                      danger 
                      icon={<LogoutOutlined />} 
                      onClick={handleLogout}
                      block
                      size="large"
                    >
                      Déconnexion
                    </Button>
                  </div>
                </Drawer>

                <Layout>
                  <Header style={{ 
                    background: '#fff', 
                    padding: isMobile ? '0 12px' : '0 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                    position: isMobile ? 'sticky' : 'relative',
                    top: 0,
                    zIndex: 100
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isMobile && (
                        <Button 
                          type="text" 
                          icon={<MenuOutlined />} 
                          onClick={() => setMobileMenuOpen(true)}
                          style={{ fontSize: '18px' }}
                        />
                      )}
                      <div style={{ 
                        fontSize: isMobile ? '16px' : '18px', 
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {isMobile && <span>🏢</span>}
                        <span>{isMobile ? 'Pointage' : 'Système de Badgeage'}</span>
                      </div>
                    </div>
                    
                    {!isMobile && (
                      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar icon={<UserOutlined />} />
                          <span>{currentUser?.prenom}</span>
                        </div>
                      </Dropdown>
                    )}
                  </Header>

                  <Content style={{ 
                    margin: isMobile ? '0' : '24px 16px', 
                    padding: isMobile ? 0 : 24, 
                    background: '#f0f2f5',
                    minHeight: 280 
                  }}>
                    <Routes>
                      <Route path="/" element={
                        isAdmin ? <Dashboard /> : <Navigate to="/scanner" />
                      } />
                      <Route path="/scanner" element={<Scanner />} />
                      <Route path="/mes-pointages" element={<MesPointages />} />
                      <Route path="/changer-pin" element={<ChangerPin />} />
                      <Route path="/profil" element={<Profil />} />
                      <Route path="/pointages" element={
                        <AdminRoute><Pointages /></AdminRoute>
                      } />
                      <Route path="/employes" element={
                        <AdminRoute><Employes /></AdminRoute>
                      } />
                      <Route path="/sites" element={
                        <AdminRoute><Sites /></AdminRoute>
                      } />
                    </Routes>
                  </Content>
                </Layout>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
