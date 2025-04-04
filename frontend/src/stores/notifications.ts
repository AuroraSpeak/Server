import { defineStore } from 'pinia';

interface Notification {
  id: string;
  type: 'message' | 'mention' | 'system' | 'friend_request';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: any;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  }),

  actions: {
    addNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...notification,
        read: false,
        timestamp: new Date().toISOString(),
      };
      this.notifications.unshift(newNotification);
      this.unreadCount++;
    },

    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        notification.read = true;
        this.unreadCount--;
      }
    },

    markAllAsRead() {
      this.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
        }
      });
      this.unreadCount = 0;
    },

    removeNotification(id: string) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        this.unreadCount--;
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
    },

    clearNotifications() {
      this.notifications = [];
      this.unreadCount = 0;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 