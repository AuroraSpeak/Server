import { defineStore } from 'pinia';

interface ServerSettings {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  defaultChannelId?: string;
  verificationLevel: 'none' | 'low' | 'medium' | 'high';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
  defaultNotifications: 'all_messages' | 'only_mentions';
  afkChannelId?: string;
  afkTimeout: number;
  systemChannelId?: string;
  systemChannelFlags: number;
  rulesChannelId?: string;
  publicUpdatesChannelId?: string;
  preferredLocale: string;
  features: string[];
}

interface ServerSettingsState {
  settings: ServerSettings | null;
  loading: boolean;
  error: string | null;
}

export const useServerSettingsStore = defineStore('serverSettings', {
  state: (): ServerSettingsState => ({
    settings: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSettings(serverId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.settings = await serverService.getSettings(serverId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch server settings';
        console.error('Failed to fetch server settings:', error);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(serverId: string, updates: Partial<ServerSettings>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const updatedSettings = await serverService.updateSettings(serverId, updates);
        if (this.settings) {
          this.settings = { ...this.settings, ...updatedSettings };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update server settings';
        console.error('Failed to update server settings:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateIcon(serverId: string, file: File) {
      try {
        this.loading = true;
        this.error = null;
        const formData = new FormData();
        formData.append('icon', file);
        // Hier würde der API-Aufruf stehen
        // const updatedSettings = await serverService.updateIcon(serverId, formData);
        if (this.settings) {
          this.settings = { ...this.settings, ...updatedSettings };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update server icon';
        console.error('Failed to update server icon:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateBanner(serverId: string, file: File) {
      try {
        this.loading = true;
        this.error = null;
        const formData = new FormData();
        formData.append('banner', file);
        // Hier würde der API-Aufruf stehen
        // const updatedSettings = await serverService.updateBanner(serverId, formData);
        if (this.settings) {
          this.settings = { ...this.settings, ...updatedSettings };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update server banner';
        console.error('Failed to update server banner:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setSettings(settings: ServerSettings | null) {
      this.settings = settings;
    },

    clearSettings() {
      this.settings = null;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 