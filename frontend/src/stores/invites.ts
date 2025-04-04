import { defineStore } from 'pinia';

interface Invite {
  id: string;
  code: string;
  serverId: string;
  inviterId: string;
  uses: number;
  maxUses: number | null;
  maxAge: number | null;
  temporary: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface InviteState {
  invites: Invite[];
  loading: boolean;
  error: string | null;
}

export const useInvitesStore = defineStore('invites', {
  state: (): InviteState => ({
    invites: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchInvites(serverId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.invites = await inviteService.getInvites(serverId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch invites';
        console.error('Failed to fetch invites:', error);
      } finally {
        this.loading = false;
      }
    },

    async createInvite(serverId: string, inviteData: Partial<Invite>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const newInvite = await inviteService.createInvite(serverId, inviteData);
        // this.invites.push(newInvite);
        // return newInvite;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create invite';
        console.error('Failed to create invite:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteInvite(serverId: string, inviteId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await inviteService.deleteInvite(serverId, inviteId);
        this.invites = this.invites.filter(invite => invite.id !== inviteId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete invite';
        console.error('Failed to delete invite:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateInvite(serverId: string, inviteId: string, updates: Partial<Invite>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const updatedInvite = await inviteService.updateInvite(serverId, inviteId, updates);
        const index = this.invites.findIndex(invite => invite.id === inviteId);
        if (index !== -1) {
          this.invites[index] = { ...this.invites[index], ...updates };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update invite';
        console.error('Failed to update invite:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async joinServer(inviteCode: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const server = await inviteService.joinServer(inviteCode);
        // return server;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to join server';
        console.error('Failed to join server:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setInvites(invites: Invite[]) {
      this.invites = invites;
    },

    clearInvites() {
      this.invites = [];
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 