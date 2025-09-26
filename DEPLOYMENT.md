# Vercel Deployment Guide

This guide will help you deploy the Guess the Word game to Vercel.

## Prerequisites

- GitHub repository: [https://github.com/thong-elfie/guess-the-word](https://github.com/thong-elfie/guess-the-word)
- Firebase project with Firestore enabled
- OpenAI API key
- Vercel account (free tier available)

## Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import from GitHub:**
   - Select your repository: `thong-elfie/guess-the-word`
   - Click "Import"
4. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
5. **Add Environment Variables:**
   - Click "Environment Variables" tab
   - Add the following variables:

### Environment Variables to Add

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

6. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd /path/to/guess-the-word
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - What's your project's name? `guess-the-word`
   - In which directory is your code located? `./`

5. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
   vercel env add OPENAI_API_KEY
   ```

6. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

## Step 2: Configure Firebase for Production

1. **Update Firebase Security Rules:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Firestore Database > Rules
   - Update rules for production (more restrictive than development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if true; // Consider adding auth for production
      allow update: if true; // Consider adding auth for production
      allow delete: if true; // Consider adding auth for production

      match /players/{playerId} {
        allow read: if true;
        allow create: if true; // Consider adding auth for production
        allow update: if true; // Consider adding auth for production
        allow delete: if true; // Consider adding auth for production
      }

      match /rounds/{roundId} {
        allow read: if true;
        allow create: if true; // Consider adding auth for production
        allow update: if true; // Consider adding auth for production
        allow delete: if true; // Consider adding auth for production
      }
    }
  }
}
```

2. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 3: Test Your Deployment

1. **Visit your deployed app:**
   - Go to the Vercel dashboard
   - Click on your project
   - Click the domain link (e.g., `https://guess-the-word-xxx.vercel.app`)

2. **Test the game:**
   - Create a room
   - Join with another browser/device
   - Test the full game flow

## Step 4: Custom Domain (Optional)

1. **Add custom domain in Vercel:**
   - Go to project settings
   - Click "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## Step 5: Monitor and Maintain

1. **Monitor deployments:**
   - Check Vercel dashboard for deployment status
   - Monitor function logs for API errors

2. **Update environment variables:**
   - Go to project settings > Environment Variables
   - Update as needed

3. **Automatic deployments:**
   - Every push to main branch triggers automatic deployment
   - Preview deployments for pull requests

## Troubleshooting

### Common Issues:

1. **Build failures:**
   - Check environment variables are set correctly
   - Verify all dependencies are in package.json

2. **Firebase connection issues:**
   - Verify Firebase configuration in environment variables
   - Check Firestore rules allow public access

3. **OpenAI API errors:**
   - Verify OPENAI_API_KEY is set correctly
   - Check API key has sufficient credits

4. **Real-time updates not working:**
   - Check Firestore rules
   - Verify Firebase project is active

### Getting Help:

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## Production Checklist

- [ ] Environment variables configured
- [ ] Firebase rules deployed
- [ ] Custom domain configured (if desired)
- [ ] SSL certificate active
- [ ] Game functionality tested
- [ ] Performance monitoring set up
- [ ] Error tracking configured (optional)

## Cost Considerations

- **Vercel Free Tier:**
  - 100GB bandwidth per month
  - Unlimited personal projects
  - 100 serverless function executions per day

- **Firebase Free Tier:**
  - 1GB Firestore storage
  - 50K reads, 20K writes, 20K deletes per day

- **OpenAI API:**
  - Pay-per-use pricing
  - Very low cost for this game's usage

Your game should run comfortably within free tiers for personal use!
