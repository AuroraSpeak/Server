import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { serverService, type Server } from "../services/server.service"
import { channelService, type Channel } from "../services/channel.service"

interface ServersState {
  servers: Server[];
  currentServer: Server | null;
  channels: Channel[];
  currentChannel: Channel | null;
  loading: boolean;
  error: string | null;
}

export const useServersStore = defineStore("servers", {
  state: (): ServersState => ({
    servers: [],
    currentServer: null,
    channels: [],
    currentChannel: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchServers() {
      try {
        this.loading = true;
        this.error = null;
        this.servers = await serverService.getServers();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch servers';
        console.error('Failed to fetch servers:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchServer(id: string) {
      try {
        this.loading = true;
        this.error = null;
        this.currentServer = await serverService.getServer(id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch server';
        console.error('Failed to fetch server:', error);
      } finally {
        this.loading = false;
      }
    },

    async createServer(serverData: { name: string; description?: string }) {
      try {
        this.loading = true;
        this.error = null;
        const newServer = await serverService.createServer(serverData);
        this.servers.push(newServer);
        return newServer;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create server';
        console.error('Failed to create server:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateServer(id: string, serverData: { name?: string; description?: string }) {
      try {
        this.loading = true;
        this.error = null;
        const updatedServer = await serverService.updateServer(id, serverData);
        const index = this.servers.findIndex(server => server.id === id);
        if (index !== -1) {
          this.servers[index] = updatedServer;
        }
        if (this.currentServer?.id === id) {
          this.currentServer = updatedServer;
        }
        return updatedServer;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update server';
        console.error('Failed to update server:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteServer(id: string) {
      try {
        this.loading = true;
        this.error = null;
        await serverService.deleteServer(id);
        this.servers = this.servers.filter(server => server.id !== id);
        if (this.currentServer?.id === id) {
          this.currentServer = null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete server';
        console.error('Failed to delete server:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchChannels(serverId: string) {
      try {
        this.loading = true;
        this.error = null;
        this.channels = await channelService.getChannels(serverId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch channels';
        console.error('Failed to fetch channels:', error);
      } finally {
        this.loading = false;
      }
    },

    async createChannel(serverId: string, channelData: { 
      name: string; 
      description?: string; 
      type: 'text' | 'voice' 
    }) {
      try {
        this.loading = true;
        this.error = null;
        const newChannel = await channelService.createChannel(serverId, channelData);
        this.channels.push(newChannel);
        return newChannel;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create channel';
        console.error('Failed to create channel:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setCurrentChannel(channel: Channel | null) {
      this.currentChannel = channel;
    },

    setCurrentServer(server: Server | null) {
      this.currentServer = server;
      if (server) {
        this.fetchChannels(server.id);
      } else {
        this.channels = [];
        this.currentChannel = null;
      }
    },
  },
})

