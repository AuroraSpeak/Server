import { defineStore } from 'pinia';
import { authService } from '@/services/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchCurrentUser() {
      try {
        this.loading = true;
        this.error = null;
        this.currentUser = await authService.getCurrentUser();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch user data';
        console.error('Failed to fetch user data:', error);
      } finally {
        this.loading = false;
      }
    },

    async updateUser(updates: Partial<User>) {
      try {
        this.loading = true;
        this.error = null;
        if (!this.currentUser) {
          throw new Error('No user logged in');
        }
        const updatedUser = await authService.updateUser(this.currentUser.id, updates);
        this.currentUser = { ...this.currentUser, ...updatedUser };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update user';
        console.error('Failed to update user:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateAvatar(file: File) {
      try {
        this.loading = true;
        this.error = null;
        if (!this.currentUser) {
          throw new Error('No user logged in');
        }
        const formData = new FormData();
        formData.append('avatar', file);
        const updatedUser = await authService.updateAvatar(this.currentUser.id, formData);
        this.currentUser = { ...this.currentUser, ...updatedUser };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update avatar';
        console.error('Failed to update avatar:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(status: User['status']) {
      try {
        this.loading = true;
        this.error = null;
        if (!this.currentUser) {
          throw new Error('No user logged in');
        }
        const updatedUser = await authService.updateStatus(this.currentUser.id, status);
        this.currentUser = { ...this.currentUser, ...updatedUser };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update status';
        console.error('Failed to update status:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setUser(user: User | null) {
      this.currentUser = user;
    },

    clearUser() {
      this.currentUser = null;
      this.error = null;
    },
  },
}); 