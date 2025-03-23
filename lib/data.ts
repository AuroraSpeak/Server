export const servers = [
  {
    id: "server-1",
    name: "Acme Gaming",
    icon: "A",
    boostLevel: 1,
    categories: [
      {
        id: "category-1",
        name: "General",
        channels: [
          {
            id: "channel-1",
            name: "general",
            type: "text",
            userLimit: null,
            users: [],
          },
          {
            id: "channel-2",
            name: "voice",
            type: "voice",
            userLimit: 5,
            users: [],
          },
        ],
      },
    ],
  },
]

export const users = [
  {
    id: "user-1",
    name: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    isBoosting: true,
    isBot: false,
    roleString: "Admin",
    game: "Apex Legends",
    voiceState: {
      speaking: true,
      muted: false,
      deafened: false,
      video: false,
      streaming: false,
    },
  },
  {
    id: "user-2",
    name: "Jane Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "idle",
    isBoosting: false,
    isBot: false,
    roleString: "Moderator",
    game: null,
    voiceState: null,
  },
  {
    id: "user-3",
    name: "Bot",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    isBoosting: false,
    isBot: true,
    roleString: "Bot",
    game: null,
    voiceState: null,
  },
]

export const messages = [
  {
    id: 1,
    channelId: "channel-1",
    user: users[0],
    content: "Hello everyone!",
    timestamp: "10:00 AM",
    reactions: [],
    isPinned: false,
    isThread: false,
    files: [],
  },
  {
    id: 2,
    channelId: "channel-1",
    user: users[1],
    content: "Hi John!",
    timestamp: "10:01 AM",
    reactions: [],
    isPinned: false,
    isThread: false,
    files: [],
  },
]

