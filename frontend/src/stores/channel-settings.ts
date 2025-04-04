import { defineStore } from 'pinia';

interface ChannelSettings {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  nsfw: boolean;
  rateLimitPerUser: number;
  bitrate?: number;
  userLimit?: number;
  parentId?: string;
  position: number;
  permissionOverwrites: {
    id: string;
    type: 'role' | 'member';
    allow: string[];
    deny: string[];
  }[];
}

interface ChannelSettingsState {
  settings: ChannelSettings | null;
  loading: boolean;
  error: string | null;
}

export const useChannelSettingsStore = defineStore('channelSettings', {
  state: (): ChannelSettingsState => ({
    settings: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSettings(channelId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.settings = await channelService.getSettings(channelId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch channel settings';
        console.error('Failed to fetch channel settings:', error);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(channelId: string, updates: Partial<ChannelSettings>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const updatedSettings = await channelService.updateSettings(channelId, updates);
        if (this.settings) {
          this.settings = { ...this.settings, ...updates };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update channel settings';
        console.error('Failed to update channel settings:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updatePermissionOverwrites(
      channelId: string,
      overwriteId: string,
      updates: {
        allow?: string[];
        deny?: string[];
      }
    ) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await channelService.updatePermissionOverwrites(channelId, overwriteId, updates);
        if (this.settings) {
          const index = this.settings.permissionOverwrites.findIndex(
            overwrite => overwrite.id === overwriteId
          );
          if (index !== -1) {
            this.settings.permissionOverwrites[index] = {
              ...this.settings.permissionOverwrites[index],
              ...updates,
            };
          }
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update permission overwrites';
        console.error('Failed to update permission overwrites:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deletePermissionOverwrites(channelId: string, overwriteId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await channelService.deletePermissionOverwrites(channelId, overwriteId);
        if (this.settings) {
          this.settings.permissionOverwrites = this.settings.permissionOverwrites.filter(
            overwrite => overwrite.id !== overwriteId
          );
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete permission overwrites';
        console.error('Failed to delete permission overwrites:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setSettings(settings: ChannelSettings | null) {
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