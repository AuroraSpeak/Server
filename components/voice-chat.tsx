"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Settings,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { useWebRTC } from "@/contexts/webrtc-context";
import WebRTCStatus from "./webrtc-status";
import type { User } from "@/contexts/app-context";

interface VoiceChatProps {
  channelName: string;
  participants: User[];
}

export default function VoiceChat({
  channelName,
  participants,
}: VoiceChatProps) {
  const {
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    getAudioLevel,
    currentUser,
  } = useAppContext();
  const { isSpeaking, activeSpeakers, muteStatus, userPings } = useWebRTC();
  const [volume, setVolume] = useState(80);

  // Audio visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set up audio visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw audio waves
      ctx.lineWidth = 2;
      ctx.strokeStyle = isMuted ? "#ef4444" : "#8b5cf6";
      ctx.beginPath();

      const centerY = canvas.height / 2;
      const amplitude = isSpeaking ? 20 : 5;

      // Draw a sine wave
      for (let x = 0; x < canvas.width; x++) {
        const frequency = isSpeaking ? 0.05 : 0.02;
        const y =
          centerY + Math.sin(x * frequency + Date.now() * 0.005) * amplitude;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, isMuted]);

  // Function to get speaking status for a participant
  const isParticipantSpeaking = (participantId: string): boolean => {
    if (participantId === currentUser?.id) {
      return isSpeaking && !isMuted;
    }
    return activeSpeakers.has(participantId);
  };

  const isMutedGlobally = (participantId: string) => {
    return muteStatus?.has(participantId)
  };
  const userPing = (participantId: string) => {
    return userPings.has(participantId) ? userPings.get(participantId) : 0
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[hsl(var(--aura-chat))]">
      <div className="h-14 border-b border-[hsla(var(--aura-primary),0.1)] flex items-center justify-between px-4">
        <div className="flex items-center">
          <Volume2
            size={20}
            className="mr-2 text-[hsl(var(--aura-secondary))]"
          />
          <h2 className="font-medium">{channelName}</h2>
        </div>
        <WebRTCStatus />
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollable">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold flex items-center justify-center">
            <Volume2 className="mr-2 text-[hsl(var(--aura-secondary))]" />
            Voice Channel
          </h2>
          <p className="text-[hsl(var(--aura-text-muted))]">
            {participants.length} participants
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {participants.map((participant) => {
            const isSpeaking = isParticipantSpeaking(participant.id);
            const audioLevel = getAudioLevel(participant.id);
            const ringSize = Math.min(audioLevel / 5, 10); // Scale audio level to ring size

            return (
              <Card
                key={participant.id}
                className="flex flex-col items-center p-4 bg-[hsla(var(--aura-bg),0.5)] border-[hsla(var(--aura-primary),0.1)]"
              >
                <div
                  className={`relative ${
                    isSpeaking
                      ? "ring-2 ring-[hsl(var(--aura-primary))] ring-offset-2 ring-offset-[hsl(var(--aura-bg))] animate-pulse"
                      : ""
                  } rounded-full mb-3`}
                  style={{
                    boxShadow: isSpeaking
                      ? `0 0 ${ringSize}px rgba(139, 92, 246, 0.7)`
                      : "none",
                  }}
                >
                  <Avatar className="h-20 w-20 border-2 border-[hsla(var(--aura-primary),0.2)]">
                    <AvatarImage
                      src={
                        participant.avatarUrl ||
                        "/placeholder.svg?height=80&width=80"
                      }
                    />
                    <AvatarFallback className="bg-[hsla(var(--aura-primary),0.2)] text-white">
                      {participant.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isMutedGlobally(participant.id) && (
                    <div className="absolute bottom-0 right-0 bg-[hsl(var(--aura-danger))] text-white rounded-full p-1">
                      <MicOff size={14} />
                    </div>
                  )}
                  {participant.id === "user-1" && isDeafened && (
                    <div className="absolute bottom-0 left-0 bg-[hsl(var(--aura-danger))] text-white rounded-full p-1">
                      <VolumeX size={14} />
                    </div>
                  )}
                </div>
                <p className="font-medium">{participant.fullName}</p>
                <div className="flex items-center mt-1 text-xs text-[hsl(var(--aura-secondary))]">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSpeaking
                        ? "bg-[hsl(var(--aura-success))]"
                        : "bg-[hsl(var(--aura-muted))]"
                    } mr-1`}
                  ></div>
                  <span>{userPing(participant.id)}ms</span>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="overflow-hidden bg-[hsla(var(--aura-bg),0.5)] border-[hsla(var(--aura-primary),0.1)]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--aura-text-muted))]">
                Volume
              </span>
              <span className="text-sm font-medium">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="w-full"
            />

            <div className="h-20 bg-[hsla(var(--aura-bg),0.7)] rounded-lg overflow-hidden border border-[hsla(var(--aura-primary),0.1)]">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                width={600}
                height={100}
              ></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t border-[hsla(var(--aura-primary),0.1)] bg-[hsla(var(--aura-bg),0.7)] backdrop-blur-sm">
        <div className="flex justify-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  onClick={toggleMute}
                  className={
                    isMuted
                      ? "bg-[hsl(var(--aura-danger))] hover:bg-[hsla(var(--aura-danger),0.9)]"
                      : "bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)]"
                  }
                >
                  {isMuted ? <MicOff /> : <Mic />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "Unmute" : "Mute"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isDeafened ? "destructive" : "secondary"}
                  size="icon"
                  onClick={toggleDeafen}
                  className={
                    isDeafened
                      ? "bg-[hsl(var(--aura-danger))] hover:bg-[hsla(var(--aura-danger),0.9)]"
                      : "bg-[hsla(var(--aura-muted),0.6)] hover:bg-[hsla(var(--aura-muted),0.8)]"
                  }
                >
                  {isDeafened ? <VolumeX /> : <Volume2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDeafened ? "Undeafen" : "Deafen"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-[hsla(var(--aura-muted),0.6)] hover:bg-[hsla(var(--aura-muted),0.8)]"
                >
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="bg-[hsl(var(--aura-danger))] hover:bg-[hsla(var(--aura-danger),0.9)]"
                  onClick={leaveVoiceChannel}
                >
                  <PhoneOff />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
