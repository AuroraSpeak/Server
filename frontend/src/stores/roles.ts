import { defineStore } from 'pinia';

interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  position: number;
  permissions: string[];
  managed: boolean;
  mentionable: boolean;
  serverId: string;
}

interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

export const useRolesStore = defineStore('roles', {
  state: (): RoleState => ({
    roles: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchRoles(serverId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.roles = await roleService.getRoles(serverId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch roles';
        console.error('Failed to fetch roles:', error);
      } finally {
        this.loading = false;
      }
    },

    async createRole(serverId: string, roleData: Omit<Role, 'id' | 'serverId'>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const newRole = await roleService.createRole(serverId, roleData);
        // this.roles.push(newRole);
        // return newRole;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create role';
        console.error('Failed to create role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateRole(serverId: string, roleId: string, updates: Partial<Role>) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const updatedRole = await roleService.updateRole(serverId, roleId, updates);
        const index = this.roles.findIndex(role => role.id === roleId);
        if (index !== -1) {
          this.roles[index] = { ...this.roles[index], ...updates };
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update role';
        console.error('Failed to update role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteRole(serverId: string, roleId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await roleService.deleteRole(serverId, roleId);
        this.roles = this.roles.filter(role => role.id !== roleId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete role';
        console.error('Failed to delete role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateRolePosition(serverId: string, roleId: string, position: number) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await roleService.updateRolePosition(serverId, roleId, position);
        const role = this.roles.find(r => r.id === roleId);
        if (role) {
          role.position = position;
          // Sortiere die Rollen nach Position
          this.roles.sort((a, b) => a.position - b.position);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update role position';
        console.error('Failed to update role position:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setRoles(roles: Role[]) {
      this.roles = roles;
    },

    clearRoles() {
      this.roles = [];
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 