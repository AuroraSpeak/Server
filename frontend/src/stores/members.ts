import { defineStore } from 'pinia';

interface Member {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  joinedAt: string;
  roles: string[];
  serverId: string;
}

interface MemberState {
  members: Member[];
  loading: boolean;
  error: string | null;
}

export const useMembersStore = defineStore('members', {
  state: (): MemberState => ({
    members: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchMembers(serverId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.members = await memberService.getMembers(serverId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch members';
        console.error('Failed to fetch members:', error);
      } finally {
        this.loading = false;
      }
    },

    async addMember(serverId: string, userId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const newMember = await memberService.addMember(serverId, userId);
        // this.members.push(newMember);
        // return newMember;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add member';
        console.error('Failed to add member:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeMember(serverId: string, userId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await memberService.removeMember(serverId, userId);
        this.members = this.members.filter(member => member.id !== userId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove member';
        console.error('Failed to remove member:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateMemberRoles(serverId: string, userId: string, roles: string[]) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await memberService.updateMemberRoles(serverId, userId, roles);
        const member = this.members.find(m => m.id === userId);
        if (member) {
          member.roles = roles;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update member roles';
        console.error('Failed to update member roles:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    updateMemberStatus(userId: string, status: Member['status']) {
      const member = this.members.find(m => m.id === userId);
      if (member) {
        member.status = status;
      }
    },

    updateMemberLastSeen(userId: string, lastSeen: string) {
      const member = this.members.find(m => m.id === userId);
      if (member) {
        member.lastSeen = lastSeen;
      }
    },

    setMembers(members: Member[]) {
      this.members = members;
    },

    clearMembers() {
      this.members = [];
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 