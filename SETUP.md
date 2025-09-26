# Quick Setup Guide

## 1. Environment Setup

1. Copy `.env.local` and update with your credentials:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Firebase and OpenAI credentials.

## 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > General > Your apps
5. Add a web app and copy the config
6. Update `.env.local` with your Firebase config

## 3. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add it to `.env.local`

## 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

## 5. Run the Application

```bash
npm install
npm run dev
```

## 6. Test the API (Optional)

```bash
npm run test-api
```

## 7. Access the Game

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Game Flow

1. **Create Room**: Enter username and click "Create Room"
2. **Share Room ID**: Share the generated room ID with other players
3. **Join Room**: Other players enter the room ID and their username
4. **Generate Words**: Host clicks "Generate New Words" to get Vietnamese word pairs
5. **Start Round**: Host clicks "Start Round" to begin
6. **Play**: One player is the importer (red card), others are guessers (blue card)
7. **Mark Winner**: Host selects the winner who gets 50 points
8. **Repeat**: Generate new words and start another round

## Troubleshooting

- **Firebase errors**: Check your Firebase configuration in `.env.local`
- **OpenAI errors**: Verify your API key and billing setup
- **Room not found**: Make sure the room ID is correct and the room exists
- **Real-time updates not working**: Check Firestore rules and network connection

## Production Deployment

1. Deploy to Vercel: `vercel --prod`
2. Add environment variables in Vercel dashboard
3. Update Firestore rules for production security
