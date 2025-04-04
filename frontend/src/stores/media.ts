import { defineStore } from 'pinia';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  channelId: string;
}

interface MediaState {
  files: MediaFile[];
  currentFile: MediaFile | null;
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

export const useMediaStore = defineStore('media', {
  state: (): MediaState => ({
    files: [],
    currentFile: null,
    loading: false,
    error: null,
    uploadProgress: 0,
  }),

  actions: {
    async fetchFiles(channelId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // this.files = await mediaService.getFiles(channelId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch media files';
        console.error('Failed to fetch media files:', error);
      } finally {
        this.loading = false;
      }
    },

    async uploadFile(channelId: string, file: File) {
      try {
        this.loading = true;
        this.error = null;
        this.uploadProgress = 0;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('channelId', channelId);

        // Hier würde der API-Aufruf stehen
        // const uploadedFile = await mediaService.uploadFile(formData, (progress) => {
        //   this.uploadProgress = progress;
        // });

        // this.files.unshift(uploadedFile);
        // return uploadedFile;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to upload file';
        console.error('Failed to upload file:', error);
        throw error;
      } finally {
        this.loading = false;
        this.uploadProgress = 0;
      }
    },

    async deleteFile(fileId: string) {
      try {
        this.loading = true;
        this.error = null;
        // Hier würde der API-Aufruf stehen
        // await mediaService.deleteFile(fileId);
        this.files = this.files.filter(file => file.id !== fileId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete file';
        console.error('Failed to delete file:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setCurrentFile(file: MediaFile | null) {
      this.currentFile = file;
    },

    clearFiles() {
      this.files = [];
      this.currentFile = null;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setUploadProgress(progress: number) {
      this.uploadProgress = progress;
    },
  },
}); 