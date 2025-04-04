import { defineStore } from 'pinia';
import { authService } from '@/services/auth.service';

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

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchUser() {
      this.loading = true;
      try {
        this.user = await authService.getCurrentUser();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch user';
      } finally {
        this.loading = false;
      }
    },

    async updateUser(userData: Partial<User>) {
      this.loading = true;
      try {
        this.user = await authService.updateUser(userData);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update user';
      } finally {
        this.loading = false;
      }
    },

    async updateAvatar(file: File) {
      this.loading = true;
      try {
        this.user = await authService.updateAvatar(file);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update avatar';
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(status: User['status']) {
      this.loading = true;
      try {
        this.user = await authService.updateStatus(status);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update status';
      } finally {
        this.loading = false;
      }
    },

    setUser(user: User | null) {
      this.user = user;
    },

    clearUser() {
      this.user = null;
      this.error = null;
    },
  },
}); 