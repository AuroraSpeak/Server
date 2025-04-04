import { defineStore } from 'pinia';

interface UserSettings {
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDMs: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    compactMode: boolean;
  };
  audio: {
    inputDevice: string;
    outputDevice: string;
    inputVolume: number;
    outputVolume: number;
    noiseSuppression: boolean;
    echoCancellation: boolean;
  };
}

interface SettingsState {
  settings: UserSettings;
  loading: boolean;
  error: string | null;
}

const defaultSettings: UserSettings = {
  language: 'de',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  privacy: {
    showOnlineStatus: true,
    allowDMs: true,
  },
  appearance: {
    theme: 'system',
    fontSize: 16,
    compactMode: false,
  },
  audio: {
    inputDevice: 'default',
    outputDevice: 'default',
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
  },
};

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    settings: { ...defaultSettings },
    loading: false,
    error: null,
  }),

  actions: {
    async loadSettings() {
      try {
        this.loading = true;
        this.error = null;
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          this.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load settings';
        console.error('Failed to load settings:', error);
      } finally {
        this.loading = false;
      }
    },

    async saveSettings() {
      try {
        this.loading = true;
        this.error = null;
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save settings';
        console.error('Failed to save settings:', error);
      } finally {
        this.loading = false;
      }
    },

    updateSettings(updates: Partial<UserSettings>) {
      this.settings = { ...this.settings, ...updates };
      this.saveSettings();
    },

    resetSettings() {
      this.settings = { ...defaultSettings };
      this.saveSettings();
    },

    setLanguage(language: string) {
      this.settings.language = language;
      this.saveSettings();
    },

    toggleNotifications(enabled: boolean) {
      this.settings.notifications.enabled = enabled;
      this.saveSettings();
    },

    toggleSound(enabled: boolean) {
      this.settings.notifications.sound = enabled;
      this.saveSettings();
    },

    toggleDesktopNotifications(enabled: boolean) {
      this.settings.notifications.desktop = enabled;
      this.saveSettings();
    },

    setTheme(theme: 'light' | 'dark' | 'system') {
      this.settings.appearance.theme = theme;
      this.saveSettings();
    },

    setFontSize(size: number) {
      this.settings.appearance.fontSize = size;
      this.saveSettings();
    },

    toggleCompactMode(enabled: boolean) {
      this.settings.appearance.compactMode = enabled;
      this.saveSettings();
    },

    setAudioInputDevice(deviceId: string) {
      this.settings.audio.inputDevice = deviceId;
      this.saveSettings();
    },

    setAudioOutputDevice(deviceId: string) {
      this.settings.audio.outputDevice = deviceId;
      this.saveSettings();
    },

    setInputVolume(volume: number) {
      this.settings.audio.inputVolume = volume;
      this.saveSettings();
    },

    setOutputVolume(volume: number) {
      this.settings.audio.outputVolume = volume;
      this.saveSettings();
    },

    toggleNoiseSuppression(enabled: boolean) {
      this.settings.audio.noiseSuppression = enabled;
      this.saveSettings();
    },

    toggleEchoCancellation(enabled: boolean) {
      this.settings.audio.echoCancellation = enabled;
      this.saveSettings();
    },
  },
}); 