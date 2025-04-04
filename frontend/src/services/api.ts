import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request Interceptor für Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CSRF-Token aus dem Cookie extrahieren
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

// Response Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  register: async (userData: { 
    username: string; 
    email: string; 
    password: string; 
    fullName: string 
  }) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};

export const serverService = {
  getServers: async () => {
    const response = await api.get('/api/servers');
    return response.data;
  },
  getServer: async (id: string) => {
    const response = await api.get(`/api/servers/${id}`);
    return response.data;
  },
  createServer: async (serverData: { name: string; description?: string }) => {
    const response = await api.post('/api/servers', serverData);
    return response.data;
  },
  updateServer: async (id: string, serverData: { name?: string; description?: string }) => {
    const response = await api.put(`/api/servers/${id}`, serverData);
    return response.data;
  },
  deleteServer: async (id: string) => {
    const response = await api.delete(`/api/servers/${id}`);
    return response.data;
  }
};

export const channelService = {
  getChannels: async (serverId: string) => {
    const response = await api.get(`/api/servers/${serverId}/channels`);
    return response.data;
  },
  getChannel: async (id: string) => {
    const response = await api.get(`/api/channels/${id}`);
    return response.data;
  },
  createChannel: async (serverId: string, channelData: { 
    name: string; 
    description?: string; 
    type: 'text' | 'voice' 
  }) => {
    const response = await api.post(`/api/servers/${serverId}/channels`, channelData);
    return response.data;
  },
  updateChannel: async (id: string, channelData: { 
    name?: string; 
    description?: string; 
    type?: 'text' | 'voice' 
  }) => {
    const response = await api.put(`/api/channels/${id}`, channelData);
    return response.data;
  },
  deleteChannel: async (id: string) => {
    const response = await api.delete(`/api/channels/${id}`);
    return response.data;
  }
};

export const messageService = {
  getMessages: async (channelId: string) => {
    const response = await api.get(`/api/channels/${channelId}/messages`);
    return response.data;
  },
  createMessage: async (channelId: string, content: string) => {
    const response = await api.post(`/api/channels/${channelId}/messages`, { content });
    return response.data;
  },
  updateMessage: async (id: string, content: string) => {
    const response = await api.put(`/api/messages/${id}`, { content });
    return response.data;
  },
  deleteMessage: async (id: string) => {
    const response = await api.delete(`/api/messages/${id}`);
    return response.data;
  }
};

export const webrtcService = {
  createOffer: async (data: any) => {
    const response = await api.post('/api/webrtc/offer', data);
    return response.data;
  },
  createAnswer: async (data: any) => {
    const response = await api.post('/api/webrtc/answer', data);
    return response.data;
  },
  addIceCandidate: async (data: any) => {
    const response = await api.post('/api/webrtc/ice-candidate', data);
    return response.data;
  },
  sendOffer: async (offer: RTCSessionDescriptionInit) => {
    const response = await api.post('/api/webrtc/send-offer', offer);
    return response.data;
  },
  sendAnswer: async (answer: RTCSessionDescriptionInit) => {
    const response = await api.post('/api/webrtc/send-answer', answer);
    return response.data;
  },
  sendIceCandidate: async (candidate: RTCIceCandidateInit) => {
    const response = await api.post('/api/webrtc/send-ice-candidate', candidate);
    return response.data;
  }
};

export default api; 