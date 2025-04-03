import { setActivePinia, createPinia } from 'pinia'
import { useWebRTCStore } from '../webrtc'
import { WebRTCService } from '@/services/webrtc.service'
import { WebSocketService } from '@/services/websocket.service'
import { VoiceService } from '@/services/voice'

// Mock der Services
vi.mock('@/services/webrtc.service')
vi.mock('@/services/websocket.service')
vi.mock('@/services/voice')

describe('WebRTC Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('sollte erfolgreich initialisieren', async () => {
      const store = useWebRTCStore()
      const mockWsUrl = 'ws://localhost:8080'
      
      await store.initialize(mockWsUrl)

      expect(store.connectionState).toBe('connected')
      expect(store.error).toBeNull()
    })

    it('sollte Fehler bei fehlgeschlagener Initialisierung behandeln', async () => {
      const store = useWebRTCStore()
      vi.mocked(VoiceService.prototype.connectToServer).mockRejectedValueOnce(new Error('Verbindungsfehler'))

      await store.initialize('ws://localhost:8080')

      expect(store.connectionState).toBe('disconnected')
      expect(store.error).toBe('Verbindungsfehler')
    })
  })

  describe('joinChannel', () => {
    it('sollte erfolgreich einem Kanal beitreten', async () => {
      const store = useWebRTCStore()
      const channelId = 'test-channel'
      
      await store.joinChannel(channelId)

      expect(store.currentChannel).toBe(channelId)
      expect(store.isCallActive).toBe(true)
      expect(store.error).toBeNull()
    })

    it('sollte Fehler bei fehlgeschlagenem Kanalbeitritt behandeln', async () => {
      const store = useWebRTCStore()
      vi.mocked(VoiceService.prototype.joinChannel).mockRejectedValueOnce(new Error('Kanalfehler'))

      await store.joinChannel('test-channel')

      expect(store.currentChannel).toBeNull()
      expect(store.isCallActive).toBe(false)
      expect(store.error).toBe('Kanalfehler')
    })
  })

  describe('leaveChannel', () => {
    it('sollte erfolgreich einen Kanal verlassen', async () => {
      const store = useWebRTCStore()
      store.currentChannel = 'test-channel'
      store.isCallActive = true

      await store.leaveChannel()

      expect(store.currentChannel).toBeNull()
      expect(store.isCallActive).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('toggleMute', () => {
    it('sollte Stummschaltung umschalten', async () => {
      const store = useWebRTCStore()
      vi.mocked(VoiceService.prototype.isMuted).mockReturnValueOnce(true)

      await store.toggleMute()

      expect(store.isMuted).toBe(true)
      expect(store.error).toBeNull()
    })
  })

  describe('disconnect', () => {
    it('sollte erfolgreich die Verbindung trennen', async () => {
      const store = useWebRTCStore()
      store.currentChannel = 'test-channel'
      store.isCallActive = true

      await store.disconnect()

      expect(store.connectionState).toBe('disconnected')
      expect(store.currentChannel).toBeNull()
      expect(store.error).toBeNull()
    })
  })
}) 