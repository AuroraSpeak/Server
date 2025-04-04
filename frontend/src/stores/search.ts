import { defineStore } from 'pinia';

interface SearchResult {
  id: string;
  type: 'user' | 'server' | 'channel' | 'message';
  title: string;
  description?: string;
  avatarUrl?: string;
  timestamp?: string;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  recentSearches: string[];
}

export const useSearchStore = defineStore('search', {
  state: (): SearchState => ({
    query: '',
    results: [],
    loading: false,
    error: null,
    recentSearches: [],
  }),

  actions: {
    setQuery(query: string) {
      this.query = query;
    },

    async search(query: string) {
      try {
        this.loading = true;
        this.error = null;
        this.query = query;
        // Hier würde der API-Aufruf stehen
        // this.results = await searchService.search(query);
        this.addRecentSearch(query);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to perform search';
        console.error('Failed to perform search:', error);
      } finally {
        this.loading = false;
      }
    },

    addRecentSearch(query: string) {
      if (!query.trim()) return;
      
      // Entferne Duplikate
      this.recentSearches = this.recentSearches.filter(q => q !== query);
      
      // Füge die neue Suche am Anfang hinzu
      this.recentSearches.unshift(query);
      
      // Begrenze die Anzahl der gespeicherten Suchen
      if (this.recentSearches.length > 10) {
        this.recentSearches = this.recentSearches.slice(0, 10);
      }
      
      // Speichere die Suchen im localStorage
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    },

    loadRecentSearches() {
      try {
        const savedSearches = localStorage.getItem('recentSearches');
        if (savedSearches) {
          this.recentSearches = JSON.parse(savedSearches);
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    },

    clearRecentSearches() {
      this.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },

    clearResults() {
      this.results = [];
      this.query = '';
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
}); 