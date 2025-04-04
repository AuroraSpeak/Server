import { apiService } from "./api.service"

export interface WebRTCOfferRequest {
  sdp: RTCSessionDescriptionInit
  targetUserId: string
}

export interface WebRTCAnswerRequest {
  sdp: RTCSessionDescriptionInit
  targetUserId: string
}

export interface WebRTCIceCandidateRequest {
  candidate: RTCIceCandidateInit
  targetUserId: string
}

class WebRTCApiService {
  async sendOffer(data: WebRTCOfferRequest): Promise<void> {
    return apiService.post<void>("/webrtc/offer", data)
  }

  async sendAnswer(data: WebRTCAnswerRequest): Promise<void> {
    return apiService.post<void>("/webrtc/answer", data)
  }

  async sendIceCandidate(data: WebRTCIceCandidateRequest): Promise<void> {
    return apiService.post<void>("/webrtc/ice-candidate", data)
  }
}

export const webRTCApiService = new WebRTCApiService()

