# Transvero - Live Caption and Transcript Assistant

[![Netlify Status](https://api.netlify.com/api/v1/badges/a4ff1a24-cdcd-4c0f-93bc-617ec4e838f2/deploy-status)](https://app.netlify.com/projects/transvero/deploys)

Link to Project: https://transvero.netlify.app/

A real-time speech recognition and transcription application built with React, TypeScript, Firebase, and Web Speech API.

## Features

- **Real-time Speech Recognition** - Live transcription using Web Speech API
- **Secure Authentication** - Firebase Authentication with email/password
- **Cloud Storage** - Firestore database for transcript management
- **PDF Export** - Download transcripts as formatted PDF documents
- **Multi-speaker Support** - Identify different speakers in conversations
- **Multi-language Support** - Support for various languages
- **Accessibility Focused** - High contrast design and keyboard navigation
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Speech Recognition**: Hybrid system - AssemblyAI API (primary, works in all browsers) or Web Speech API (fallback)
- **PDF Generation**: jsPDF
- **Icons**: React Icons
- **Routing**: React Router DOM

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- AssemblyAI API key for speech recognition that works in all browsers (MAKE SURE YOU PUT IT IN .env FILE!!!!!!)
- Modern browser (any modern browser works with API, Chrome/Edge/Safari for Web Speech API fallback)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd transvero
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password provider)
3. Enable Firestore Database
4. Get your Firebase configuration from Project Settings > General > Your apps
5. Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Optional: AssemblyAI API Key for speech recognition (works in all browsers including Brave)
# Get your free API key at https://www.assemblyai.com/
REACT_APP_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### 3. Firestore Security Rules

Set up Firestore security rules to allow users to access only their own transcripts:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/transcripts/{transcriptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage

### Getting Started

1. **Sign Up**: Create a new account with your email and password
2. **Sign In**: Use your credentials to access the dashboard
3. **Start Session**: Click "Start New Session" to begin recording
4. **Record**: Allow microphone access and start speaking
5. **Save**: Save your transcript to the cloud or export as PDF

### Features Overview

#### Live Session

- Real-time speech recognition with live captions
- Multi-speaker support with speaker identification
- Language selection for better accuracy
- Auto-save to prevent data loss
- Export to PDF functionality

#### Dashboard

- View all saved transcripts
- Search through transcript content
- Delete unwanted transcripts
- View session statistics
- Quick access to start new sessions

#### Transcript Management

- Organized by date and time
- Full-text search capability
- PDF export with proper formatting
- Speaker identification markers
- Session metadata (duration, language, etc.)

## Browser Compatibility

**With AssemblyAI API (Recommended):**
- **All modern browsers**: Full support including Chrome, Edge, Safari, Firefox, and Brave
- No browser-specific configuration needed
- Works even with privacy shields enabled

**Without API (Fallback to Web Speech API):**
- **Chrome**: Full support
- **Edge**: Full support
- **Safari**: Full support
- **Firefox**: Limited support
- **Brave**: Requires disabling shields and cross-site tracker blocking

## Accessibility Features

- High contrast color scheme
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators for all interactive elements
- Semantic HTML structure
- ARIA labels for complex components

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── pages/              # Page components
├── services/           # API services (Firebase)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx            # Main app component
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Deployment

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Environment Variables

Make sure to set up environment variables in your hosting platform:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] OpenAI Whisper API integration for better accuracy
- [ ] Real-time translation capabilities
- [ ] Team collaboration features
- [ ] Advanced speaker identification
- [ ] Custom vocabulary support
- [ ] Mobile app development
