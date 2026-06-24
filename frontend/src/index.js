import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import 'antd/dist/reset.css';
import './App.css';
import App from './App';
import moment from 'moment';
import 'moment/locale/fr';

// Polyfill pour éviter l'erreur "Cannot read properties of undefined (reading 'addListener')" avec certaines librairies et webpack-dev-server
if (window.matchMedia) {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = function(query) {
    const mql = originalMatchMedia(query);
    if (!mql.addListener) {
      mql.addListener = function() {};
      mql.removeListener = function() {};
    }
    return mql;
  };
}

moment.locale('fr');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider locale={frFR}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
