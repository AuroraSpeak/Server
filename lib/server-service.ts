import { prisma } from "@/lib/prisma"
import { stringToArray, arrayToString } from "@/lib/role-utils"

export async function getServers(userId: string) {
  return prisma.server.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      categories: {
        include: {
          channels: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })
}

export async function getServer(serverId: string) {
  return prisma.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      categories: {
        include: {
          channels: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      members: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      roles: true,
    },
  })
}

export async function getChannel(channelId: string) {
  return prisma.channel.findUnique({
    where: {
      id: channelId,
    },
    include: {
      category: {
        include: {
          server: true,
        },
      },
      voiceStates: {
        include: {
          user: true,
        },
      },
    },
  })
}

export async function getChannelMessages(channelId: string) {
  return prisma.message.findMany({
    where: {
      channelId,
    },
    include: {
      user: true,
      files: true,
      reactions: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

export async function getServerMembers(serverId: string) {
  const members = await prisma.serverMember.findMany({
    where: {
      serverId,
    },
    include: {
      user: {
        include: {
          profile: true,
          voiceStates: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  })

  // Transform the data to include roles as arrays
  return members.map((member) => ({
    ...member,
    roles: stringToArray(member.roleString),
    user: {
      ...member.user,
      roles: member.user.userRoles.map((ur) => ur.role),
    },
  }))
}

export async function createMessage(channelId: string, userId: string, content: string) {
  return prisma.message.create({
    data: {
      channelId,
      userId,
      content,
    },
    include: {
      user: true,
      files: true,
      reactions: true,
    },
  })
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  // Check if reaction already exists
  const existingReaction = await prisma.messageReaction.findFirst({
    where: {
      messageId,
      userId,
      emoji,
    },
  })

  if (existingReaction) {
    return existingReaction
  }

  return prisma.messageReaction.create({
    data: {
      messageId,
      userId,
      emoji,
    },
  })
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  return prisma.messageReaction.deleteMany({
    where: {
      messageId,
      userId,
      emoji,
    },
  })
}

export async function joinVoiceChannel(userId: string, channelId: string) {
  // Leave any existing voice channel first
  await prisma.voiceState.deleteMany({
    where: {
      userId,
    },
  })

  return prisma.voiceState.create({
    data: {
      userId,
      channelId,
      muted: false,
      deafened: false,
      speaking: false,
    },
  })
}

export async function leaveVoiceChannel(userId: string) {
  return prisma.voiceState.deleteMany({
    where: {
      userId,
    },
  })
}

export async function updateVoiceState(
  userId: string,
  channelId: string,
  data: {
    muted?: boolean
    deafened?: boolean
    speaking?: boolean
    video?: boolean
    streaming?: boolean
  },
) {
  return prisma.voiceState.update({
    where: {
      userId_channelId: {
        userId,
        channelId,
      },
    },
    data,
  })
}

export async function addUserRole(userId: string, roleId: string) {
  return prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
  })
}

export async function removeUserRole(userId: string, roleId: string) {
  return prisma.userRole.deleteMany({
    where: {
      userId,
      roleId,
    },
  })
}

export async function updateServerMemberRoles(serverId: string, userId: string, roles: string[]) {
  return prisma.serverMember.update({
    where: {
      serverId_userId: {
        serverId,
        userId,
      },
    },
    data: {
      roleString: arrayToString(roles),
    },
  })
}

export async function getUserRoles(userId: string, serverId: string) {
  // Get the server member
  const serverMember = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId,
      },
    },
  })

  if (!serverMember) {
    return []
  }

  // Get the user's roles
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
    },
    include: {
      role: {
        where: {
          serverId,
        },
      },
    },
  })

  // Return only the roles that belong to the server
  return userRoles.filter((ur) => ur.role).map((ur) => ur.role)
}

export async function getRolePermissions(roleId: string) {
  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  })

  if (!role) {
    return []
  }

  return stringToArray(role.permissionString)
}

