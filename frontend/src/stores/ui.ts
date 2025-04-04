import { defineStore } from 'pinia';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  currentView: string;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    theme: 'light',
    sidebarCollapsed: false,
    currentView: 'home',
    notifications: [],
    loading: false,
    error: null,
  }),

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    setCurrentView(view: string) {
      this.currentView = view;
    },

    addNotification(notification: Omit<Notification, 'id'>) {
      const id = Date.now().toString();
      this.notifications.push({
        id,
        ...notification,
        duration: notification.duration || 5000,
      });

      if (notification.duration !== 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, notification.duration || 5000);
      }
    },

    removeNotification(id: string) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
      if (error) {
        this.addNotification({
          type: 'error',
          message: error,
        });
      }
    },

    clearError() {
      this.error = null;
    },
  },
}); 