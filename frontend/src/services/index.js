import api from './api';

export const authService = {
  login: async (email, pin) => {
    const response = await api.post('/auth/login', { email, pin });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.employe));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Auto-inscription publique (sans authentification)
  register: async (data) => {
    const response = await api.post('/auth/inscription', data);
    return response.data;
  }
};

export const employeService = {
  getAll: async () => {
    const response = await api.get('/employes');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/employes/${id}`);
    return response.data;
  },

  create: async (employe) => {
    const response = await api.post('/employes', employe);
    return response.data;
  },

  update: async (id, employe) => {
    const response = await api.put(`/employes/${id}`, employe);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employes/${id}`);
    return response.data;
  },

  activer: async (id) => {
    const response = await api.put(`/employes/${id}/activer`);
    return response.data;
  },

  resetPin: async (id, newPin) => {
    const response = await api.put(`/employes/${id}/reset-pin`, { newPin });
    return response.data;
  },

  changeMyPin: async (oldPin, newPin) => {
    const response = await api.put('/employes/me/change-pin', { oldPin, newPin });
    return response.data;
  }
};

export const siteService = {
  getAll: async () => {
    const response = await api.get('/sites');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sites/${id}`);
    return response.data;
  },

  create: async (site) => {
    // Ne PAS définir Content-Type pour FormData - le navigateur le fait automatiquement avec le boundary
    const response = await api.post('/sites', site);
    return response.data;
  },

  update: async (id, site) => {
    // Ne PAS définir Content-Type pour FormData - le navigateur le fait automatiquement avec le boundary
    const response = await api.put(`/sites/${id}`, site);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  },

  getQRCode: async (id) => {
    const response = await api.get(`/sites/${id}/qrcode`);
    return response.data;
  },

  getQRCodeUrl: async (id) => {
    const response = await api.get(`/sites/${id}/qrcode-url`);
    return response.data;
  }
};

export const pointageService = {
  create: async (pointage) => {
    const response = await api.post('/pointages', pointage);
    return response.data;
  },

  getAll: async (filters) => {
    const response = await api.get('/pointages', { params: filters });
    return response.data;
  },

  getByEmploye: async (employeId) => {
    const response = await api.get(`/pointages/employe/${employeId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/pointages/stats');
    return response.data;
  }
};
