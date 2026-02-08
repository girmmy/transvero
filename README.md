# Transvero - Live Caption and Transcript Assistant

[![Netlify Status](https://api.netlify.com/api/v1/badges/a4ff1a24-cdcd-4c0f-93bc-617ec4e838f2/deploy-status)](https://app.netlify.com/projects/transvero/deploys)

<video src="https://drive.google.com/file/d/1yQw4rPutfS50EWcZqorIp8yrbf4pNW_w/view?usp=drive_link" width="320" height="240" controls></video>

Link to Project: https://transvero.netlify.app/

A real-time speech recognition and transcription application built with React, TypeScript, Firebase, and Web Speech API.

2025-2026 Theme: Develop a software program that removes barriers and increases accessibility for people with vision or hearing disabilities.

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


```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

