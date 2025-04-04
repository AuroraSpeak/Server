import { defineStore } from 'pinia';

interface Friend {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  mutualServers: string[];
}

interface FriendRequest {
  id: string;
  from: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
}

export const useFriendsStore = defineStore('friends', {
  state: (): FriendsState => ({
    friends: [],
    friendRequests: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchFriends() {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.friends = await friendService.getFriends();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch friends';
        console.error('Failed to fetch friends:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchFriendRequests() {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.friendRequests = await friendService.getFriendRequests();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch friend requests';
        console.error('Failed to fetch friend requests:', error);
      } finally {
        this.loading = false;
      }
    },

    async sendFriendRequest(userId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await friendService.sendFriendRequest(userId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to send friend request';
        console.error('Failed to send friend request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async acceptFriendRequest(requestId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // const friend = await friendService.acceptFriendRequest(requestId);
        // this.friends.push(friend);
        this.friendRequests = this.friendRequests.filter(request => request.id !== requestId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to accept friend request';
        console.error('Failed to accept friend request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async rejectFriendRequest(requestId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await friendService.rejectFriendRequest(requestId);
        this.friendRequests = this.friendRequests.filter(request => request.id !== requestId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to reject friend request';
        console.error('Failed to reject friend request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeFriend(friendId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await friendService.removeFriend(friendId);
        this.friends = this.friends.filter(friend => friend.id !== friendId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove friend';
        console.error('Failed to remove friend:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    updateFriendStatus(friendId: string, status: Friend['status']) {
      const friend = this.friends.find(f => f.id === friendId);
      if (friend) {
        friend.status = status;
      }
    },

    updateFriendLastSeen(friendId: string, lastSeen: string) {
      const friend = this.friends.find(f => f.id === friendId);
      if (friend) {
        friend.lastSeen = lastSeen;
      }
    },

    addMutualServer(friendId: string, serverId: string) {
      const friend = this.friends.find(f => f.id === friendId);
      if (friend && !friend.mutualServers.includes(serverId)) {
        friend.mutualServers.push(serverId);
      }
    },

    removeMutualServer(friendId: string, serverId: string) {
      const friend = this.friends.find(f => f.id === friendId);
      if (friend) {
        friend.mutualServers = friend.mutualServers.filter(id => id !== serverId);
      }
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 