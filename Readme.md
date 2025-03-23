![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/AuroraSpeak/Server?utm_source=oss&utm_medium=github&utm_campaign=AuroraSpeak%2FServer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

> ⚠️ **This project is currently in _alpha_. Breaking changes are likely, and stability is not guaranteed.**

---
## 🌟 Overview

AuraSpeak is a feature-rich voice communication platform designed for gamers, teams, and communities. Built with Next.js and WebRTC, it offers high-quality, low-latency voice chat with a sleek, customizable interface. Unlike traditional platforms, AuraSpeak focuses on providing a seamless audio experience with minimal resource usage.

## ✨ Features

- **Real-time Voice Communication** - Crystal clear audio with WebRTC
- **Text Messaging** - Full-featured text channels with rich formatting
- **Server Organization** - Create and join multiple servers with customizable channels
- **User Presence** - See who's online, speaking, or away
- **Voice Activity Detection** - Automatically detect when users are speaking
- **Audio Visualization** - Visual feedback for audio levels
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Theme** - Easy on the eyes for long gaming sessions
- **Low Latency** - Peer-to-peer connections for minimal delay
- **Secure** - End-to-end encrypted voice communication


## 🛠️ Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Real-time Communication**: WebRTC, WebSockets
- **Authentication**: JWT, bcrypt
- **State Management**: React Context API
- **UI Components**: shadcn/ui
- **Database**: Prisma ORM


## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A modern web browser with WebRTC support


## 🚀 Getting Started

### Installation

1. Clone the repository:

```shellscript
git clone https://github.com/yourusername/auraspeak.git
cd auraspeak
```


2. Install dependencies:

```shellscript
npm install
# or
yarn install
```


3. Set up environment variables:

```plaintext
cp .env.example .env.local
```

Edit `.env.local` with your configuration.


4. Set up the database:

```shellscript
npx prisma migrate dev
npx prisma db seed
```


5. Start the development server:

```shellscript
npm run dev
# or
yarn dev
```


6. Open [http://localhost:3000](http://localhost:3000) in your browser.


## 🎮 Usage

### Creating an Account

1. Navigate to the registration page
2. Enter your username, email, and password
3. Click "Create Account"


### Joining a Server

1. Log in to your account
2. Click the "+" button in the server sidebar
3. Enter a server invite code or create your own server


### Voice Chat

1. Join a voice channel by clicking on it
2. Grant microphone permissions when prompted
3. Start talking - your audio will be transmitted to other users in the channel
4. Use the controls at the bottom to mute/unmute or adjust settings


## 🔊 WebRTC Implementation

AuraSpeak uses WebRTC for peer-to-peer voice communication, providing several advantages:

- **Low Latency**: Direct connections between users minimize delay
- **High Quality**: Adaptive bitrate for optimal audio quality
- **Reduced Server Load**: P2P connections reduce server bandwidth requirements
- **NAT Traversal**: ICE, STUN, and TURN servers handle complex network scenarios


The implementation includes:

- **Signaling Server**: Coordinates connection establishment between peers
- **Peer Connection Management**: Handles WebRTC peer connections
- **Media Stream Processing**: Captures and processes audio streams
- **Voice Activity Detection**: Identifies when users are speaking
- **Audio Visualization**: Provides visual feedback for audio levels


## 📁 Project Structure

```plaintext
auraspeak/
├── app/                  # Next.js app directory
│   ├── (auth)/           # Authentication routes
│   ├── api/              # API routes
│   └── page.tsx          # Main application page
├── components/           # React components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── aura-logo.tsx     # Logo component
│   ├── voice-chat.tsx    # Voice chat component
│   └── ...               # Other components
├── contexts/             # React contexts
│   ├── app-context.tsx   # Application state
│   └── webrtc-context.tsx # WebRTC functionality
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── prisma/               # Prisma ORM
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: Connection string for your database
- `JWT_SECRET`: Secret key for JWT authentication
- `NEXT_PUBLIC_STUN_SERVERS`: STUN servers for WebRTC NAT traversal
- `TURN_SERVER_URL`: TURN server URL (optional)
- `TURN_SERVER_USERNAME`: TURN server username (optional)
- `TURN_SERVER_CREDENTIAL`: TURN server credential (optional)


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [WebRTC.org](https://webrtc.org/) - For the amazing technology
- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - For the styling
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful UI components


---