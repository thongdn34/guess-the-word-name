# Guess the Word - Vietnamese Multiplayer Game

A real-time multiplayer word guessing game built with Next.js, Firebase Firestore, and local CSV word database.

## Features

- **Real-time multiplayer gameplay** with up to 6 players per room
- **Vietnamese word pairs** from local CSV database
- **Role-based gameplay** with importers and guessers
- **Live scoring system** with winner tracking
- **Round history** and player statistics
- **Responsive design** with modern UI

## Setup Instructions

### 1. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Go to Project Settings > General > Your apps
4. Add a web app and copy the configuration
5. Update `.env.local` with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. OpenAI Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add it to `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Deploy Firestore Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the game.

## How to Play

1. **Create or Join Room**: Enter a username and either create a new room or join an existing one using a room ID
2. **Wait for Players**: Up to 6 players can join a room
3. **Generate Words**: The host can generate Vietnamese word pairs from the local database
4. **Start Round**: The host starts the round, and one player is randomly selected as the "Importer"
5. **Play**: 
   - The Importer sees Word A (red card) and tries to get others to guess it
   - Other players see Word B (blue card) and try to guess the Importer's word
6. **Mark Winner**: The host selects the winner who gets 50 points
7. **Repeat**: Start a new round with new words

## Game Rules

- Each round has one Importer and multiple Guessers
- The Importer must get others to guess their word without saying it directly
- Other players try to guess the Importer's word based on their hints
- The host controls the game flow and marks winners
- Winners receive 50 points per round
- Scores persist throughout the room session

## Technical Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore, Next.js API Routes
- **Word Database**: Local CSV file with 100+ Vietnamese word pairs
- **Real-time**: Firestore real-time listeners
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/generate/       # Word generation API (CSV-based)
│   ├── room/[id]/         # Room page
│   └── page.tsx           # Landing page
├── data/                   # Word database
│   └── word-pairs.csv     # Vietnamese word pairs
├── components/            # React components
│   ├── Header.tsx
│   ├── PlayerList.tsx
│   ├── WordCard.tsx
│   ├── RoomControls.tsx
│   ├── RoundLog.tsx
│   └── Scoreboard.tsx
├── hooks/                 # Custom React hooks
│   ├── useRoom.ts
│   └── usePlayer.ts
├── lib/                   # Utility libraries
│   ├── firebase.ts
│   └── firestore.ts
└── types/                 # TypeScript type definitions
    └── game.ts
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# No OpenAI API key needed - using local CSV file
```

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push your code to GitHub: [https://github.com/thong-elfie/guess-the-word](https://github.com/thong-elfie/guess-the-word)
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thong-elfie/guess-the-word)

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.