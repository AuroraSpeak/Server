import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Check if demo user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@example.com" },
  })

  if (existingUser) {
    console.log("Demo user already exists")
    return
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 10)

  const demoUser = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000000",
      email: "demo@example.com",
      password: hashedPassword,
      fullName: "NightStalker",
      discriminator: "#0001",
      avatarUrl: "https://ui-avatars.com/api/?name=Night+Stalker&background=7289DA&color=fff",
      status: "online",
      profile: {
        create: {
          fullName: "NightStalker",
          email: "demo@example.com",
          avatarUrl: "https://ui-avatars.com/api/?name=Night+Stalker&background=7289DA&color=fff",
          status: "online",
          gameActivity: "Playing Apex Legends",
        },
      },
    },
  })

  console.log("Demo user created:", demoUser)

  // Create additional users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "fragmaster@example.com",
        password: hashedPassword,
        fullName: "FragMaster",
        discriminator: "#4242",
        avatarUrl: "https://ui-avatars.com/api/?name=Frag+Master&background=5865F2&color=fff",
        status: "idle",
        profile: {
          create: {
            fullName: "FragMaster",
            email: "fragmaster@example.com",
            avatarUrl: "https://ui-avatars.com/api/?name=Frag+Master&background=5865F2&color=fff",
            status: "idle",
            gameActivity: "In Call of Duty: Warzone Lobby",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "lootqueen@example.com",
        password: hashedPassword,
        fullName: "LootQueen",
        discriminator: "#6789",
        avatarUrl: "https://ui-avatars.com/api/?name=Loot+Queen&background=EB459E&color=fff",
        status: "online",
        profile: {
          create: {
            fullName: "LootQueen",
            email: "lootqueen@example.com",
            avatarUrl: "https://ui-avatars.com/api/?name=Loot+Queen&background=EB459E&color=fff",
            status: "online",
            gameActivity: "Raid: Vault of Glass in Destiny 2",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "sniperelite@example.com",
        password: hashedPassword,
        fullName: "SniperElite",
        discriminator: "#9999",
        avatarUrl: "https://ui-avatars.com/api/?name=Sniper+Elite&background=ED4245&color=fff",
        status: "dnd",
        profile: {
          create: {
            fullName: "SniperElite",
            email: "sniperelite@example.com",
            avatarUrl: "https://ui-avatars.com/api/?name=Sniper+Elite&background=ED4245&color=fff",
            status: "dnd",
            gameActivity: "Competitive Match in Valorant",
          },
        },
      },
    }),
  ])

  // Create a gaming server
  const gamingServer = await prisma.server.create({
    data: {
      name: "Gaming Hub",
      icon: "🎮",
      color: "bg-indigo-500",
      boostLevel: 2,
      createdById: demoUser.id,
    },
  })

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      serverId: gamingServer.id,
      name: "Admin",
      color: "#FF0000",
      position: 0,
      permissionString: "MANAGE_SERVER,MANAGE_CHANNELS,MANAGE_ROLES,KICK_MEMBERS,BAN_MEMBERS",
    },
  })

  const moderatorRole = await prisma.role.create({
    data: {
      serverId: gamingServer.id,
      name: "Moderator",
      color: "#00FF00",
      position: 1,
      permissionString: "MANAGE_MESSAGES,KICK_MEMBERS",
    },
  })

  const eventOrganizerRole = await prisma.role.create({
    data: {
      serverId: gamingServer.id,
      name: "Event Organizer",
      color: "#0000FF",
      position: 2,
      permissionString: "CREATE_EVENTS,MANAGE_EVENTS",
    },
  })

  const proPlayerRole = await prisma.role.create({
    data: {
      serverId: gamingServer.id,
      name: "Pro Player",
      color: "#FFFF00",
      position: 3,
      permissionString: "SPECIAL_VOICE_PRIORITY",
    },
  })

  // Create server members
  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: demoUser.id,
      roleString: "Admin,Moderator",
      isBoosting: true,
    },
  })

  // Assign roles to users
  await prisma.userRole.create({
    data: {
      userId: demoUser.id,
      roleId: adminRole.id,
    },
  })

  await prisma.userRole.create({
    data: {
      userId: demoUser.id,
      roleId: moderatorRole.id,
    },
  })

  // Create server members for other users
  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: users[0].id,
      roleString: "Moderator",
    },
  })

  await prisma.userRole.create({
    data: {
      userId: users[0].id,
      roleId: moderatorRole.id,
    },
  })

  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: users[1].id,
      roleString: "Event Organizer",
    },
  })

  await prisma.userRole.create({
    data: {
      userId: users[1].id,
      roleId: eventOrganizerRole.id,
    },
  })

  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: users[2].id,
      roleString: "Pro Player",
    },
  })

  await prisma.userRole.create({
    data: {
      userId: users[2].id,
      roleId: proPlayerRole.id,
    },
  })

  // Create categories and channels
  const generalCategory = await prisma.category.create({
    data: {
      serverId: gamingServer.id,
      name: "GENERAL",
      position: 0,
      channels: {
        create: [
          {
            name: "welcome",
            type: "text",
            position: 0,
          },
          {
            name: "announcements",
            type: "text",
            position: 1,
          },
          {
            name: "rules",
            type: "text",
            position: 2,
          },
        ],
      },
    },
  })

  const textCategory = await prisma.category.create({
    data: {
      serverId: gamingServer.id,
      name: "TEXT CHANNELS",
      position: 1,
      channels: {
        create: [
          {
            name: "general-chat",
            type: "text",
            position: 0,
          },
          {
            name: "looking-for-group",
            type: "text",
            position: 1,
          },
          {
            name: "memes",
            type: "text",
            position: 2,
          },
        ],
      },
    },
  })

  const voiceCategory = await prisma.category.create({
    data: {
      serverId: gamingServer.id,
      name: "VOICE CHANNELS",
      position: 2,
      channels: {
        create: [
          {
            name: "General Voice",
            type: "voice",
            userLimit: 0,
            bitrate: 64000,
            position: 0,
          },
          {
            name: "AFK",
            type: "voice",
            userLimit: 0,
            bitrate: 64000,
            position: 1,
          },
        ],
      },
    },
  })

  const fpsCategory = await prisma.category.create({
    data: {
      serverId: gamingServer.id,
      name: "FPS GAMES",
      position: 3,
      channels: {
        create: [
          {
            name: "valorant",
            type: "text",
            position: 0,
          },
          {
            name: "apex-legends",
            type: "text",
            position: 1,
          },
          {
            name: "Valorant Squad",
            type: "voice",
            userLimit: 5,
            bitrate: 96000,
            position: 2,
          },
          {
            name: "Apex Squad",
            type: "voice",
            userLimit: 3,
            bitrate: 96000,
            position: 3,
          },
        ],
      },
    },
  })

  // Get channels for adding messages and voice states
  const generalChatChannel = await prisma.channel.findFirst({
    where: {
      name: "general-chat",
      categoryId: textCategory.id,
    },
  })

  const announcementsChannel = await prisma.channel.findFirst({
    where: {
      name: "announcements",
      categoryId: generalCategory.id,
    },
  })

  const generalVoiceChannel = await prisma.channel.findFirst({
    where: {
      name: "General Voice",
      categoryId: voiceCategory.id,
    },
  })

  const valorantVoiceChannel = await prisma.channel.findFirst({
    where: {
      name: "Valorant Squad",
      categoryId: fpsCategory.id,
    },
  })

  const apexVoiceChannel = await prisma.channel.findFirst({
    where: {
      name: "Apex Squad",
      categoryId: fpsCategory.id,
    },
  })

  // Create messages
  if (generalChatChannel && announcementsChannel) {
    await Promise.all([
      prisma.message.create({
        data: {
          channelId: generalChatChannel.id,
          userId: demoUser.id,
          content: "Anyone up for some ranked matches tonight? I'm trying to hit Diamond before the season ends.",
          reactions: {
            create: [
              {
                userId: users[0].id,
                emoji: "🎮",
              },
              {
                userId: users[1].id,
                emoji: "🎮",
              },
              {
                userId: users[2].id,
                emoji: "🎮",
              },
            ],
          },
        },
      }),
      prisma.message.create({
        data: {
          channelId: generalChatChannel.id,
          userId: users[0].id,
          content: "I'm down for some games after 8pm. Just got a new gaming mouse and need to test it out!",
          reactions: {
            create: [
              {
                userId: demoUser.id,
                emoji: "🔥",
              },
              {
                userId: users[1].id,
                emoji: "🔥",
              },
            ],
          },
          files: {
            create: [
              {
                name: "new-mouse-setup.jpg",
                type: "image",
                size: "1.2 MB",
                url: "/placeholder.svg?height=200&width=300",
              },
            ],
          },
        },
      }),
      prisma.message.create({
        data: {
          channelId: announcementsChannel.id,
          userId: users[1].id,
          content:
            "Don't forget we have our weekly raid night tomorrow at 9pm! I've attached the loadout recommendations for everyone.",
          isPinned: true,
          reactions: {
            create: [
              {
                userId: demoUser.id,
                emoji: "⚔️",
              },
              {
                userId: users[0].id,
                emoji: "⚔️",
              },
              {
                userId: users[2].id,
                emoji: "⚔️",
              },
              {
                userId: users[1].id,
                emoji: "⚔️",
              },
            ],
          },
          files: {
            create: [
              {
                name: "raid-loadouts.pdf",
                type: "document",
                size: "245 KB",
                url: "/placeholder.svg?height=100&width=100",
              },
            ],
          },
        },
      }),
      prisma.message.create({
        data: {
          channelId: generalChatChannel.id,
          userId: users[2].id,
          content: "Just hit Immortal rank! Anyone want to join for some games later?",
          reactions: {
            create: [
              {
                userId: demoUser.id,
                emoji: "👑",
              },
              {
                userId: users[0].id,
                emoji: "👑",
              },
              {
                userId: users[1].id,
                emoji: "👑",
              },
              {
                userId: users[2].id,
                emoji: "👑",
              },
              {
                userId: demoUser.id,
                emoji: "👑",
              },
            ],
          },
        },
      }),
    ])
  }

  // Create voice states
  if (generalVoiceChannel && valorantVoiceChannel && apexVoiceChannel) {
    await Promise.all([
      prisma.voiceState.create({
        data: {
          userId: demoUser.id,
          channelId: generalVoiceChannel.id,
          muted: false,
          deafened: false,
          speaking: true,
        },
      }),
      prisma.voiceState.create({
        data: {
          userId: users[0].id,
          channelId: generalVoiceChannel.id,
          muted: true,
          deafened: false,
          speaking: false,
        },
      }),
      prisma.voiceState.create({
        data: {
          userId: users[2].id,
          channelId: valorantVoiceChannel.id,
          muted: false,
          deafened: false,
          speaking: true,
          streaming: true,
        },
      }),
      prisma.voiceState.create({
        data: {
          userId: users[1].id,
          channelId: apexVoiceChannel.id,
          muted: false,
          deafened: false,
          speaking: false,
        },
      }),
    ])
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

