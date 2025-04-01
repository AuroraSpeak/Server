import { WebRTCService } from './webrtc.service';
import { WS_URL } from './api';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private webrtcService: WebRTCService;

  constructor(webrtcService: WebRTCService) {
    this.webrtcService = webrtcService;
  }

  connect() {
    this.ws = new WebSocket(`${WS_URL}/ws`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'offer':
          const answer = await this.webrtcService.createAnswer(data.offer);
          this.send({
            type: 'answer',
            answer,
            targetUserId: data.userId
          });
          break;
        
        case 'answer':
          await this.webrtcService.handleAnswer(data.answer);
          break;
        
        case 'ice-candidate':
          await this.webrtcService.handleIceCandidate(data.candidate);
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  initiateCall(targetUserId: string) {
    this.send({
      type: 'call-request',
      targetUserId
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 