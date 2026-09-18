# 🎙️ EcoCode.ai - AI-Powered  Coding Tutor Ecosystem

<div align="center">

![VoiceCode Banner](https://img.shields.io/badge/VoiceCode.ai-Learn%20by%20Speaking-orange?style=for-the-badge)

**The World's First Voice-Powered AI Coding Tutor**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20DB-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

</div>

---

## 🎯 The Problem We Solve

> **"Traditional coding tutorials are passive and boring. Learners watch videos, read docs, but never truly interact."**

**VoiceCode.ai** transforms learning to code into a **real conversation**. Just speak to your AI tutor like you would to a human mentor. Ask questions, get instant answers, and watch code appear on your screen in real-time. No more pausing videos or copy-pasting code.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice-First Learning** | Talk naturally to your AI tutor - ask questions, request examples |
| 🤖 **Responsive AI Tutor** | Powered by Gemini 2.5 Flash - answers YOUR questions, not a script |
| ⏱️ **Real-Time Stopwatch** | Track your learning sessions with persistent timer |
| 📊 **Live Dashboard Stats** | XP, streak, lessons completed - all real-time from Firebase |
| 💻 **Live Code Editor** | AI writes code in the editor as it explains concepts |
| 🎯 **Daily Quests** | Gamified learning with customizable daily goals |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript |
| **Bundler** | Vite 5 |
| **Styling** | Tailwind CSS |
| **AI/Voice** | Google Gemini 2.5 Flash Native Audio API |
| **Auth & DB** | Firebase (Authentication + Firestore) |
| **Editor** | Monaco Editor |
| **Hosting** | Vercel |

---

## 🔑 API Keys Required

```env
# .env file
API_KEY=your_google_gemini_api_key
```

| API | Description | Get It From |
|-----|-------------|-------------|
| **Gemini API** | Powers the AI voice tutor | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Firebase** | Auth & Database (configured in `lib/firebase.ts`) | [Firebase Console](https://console.firebase.google.com/) |

---

## 📁 Project Structure

```
VoiceCode.ai/
├── 📄 index.html              # Entry point
├── 📄 index.tsx               # React root
├── 📄 App.tsx                 # Main app & routing
├── 📄 vite.config.ts          # Vite configuration
├── 📄 .env                    # API keys (not committed)
│
├── 📁 components/             # React UI Components
│   ├── ConversationPanel.tsx  # AI chat & notes interface
│   ├── CodeWorkspace.tsx      # Monaco editor + console
│   ├── LearningView.tsx       # Main lesson interface
│   ├── StopwatchWidget.tsx    # Real-time learning timer
│   ├── DashboardWidgets.tsx   # Stats cards & charts
│   ├── RoadmapSidebar.tsx     # Course navigation
│   └── ...
│
├── 📁 pages/                  # Page components
│   ├── DashboardPage.tsx      # User dashboard
│   ├── CoursesPage.tsx        # Course catalog
│   ├── PricingPage.tsx        # Pricing plans
│   ├── LoginPage.tsx          # Authentication
│   └── SignupPage.tsx         # Registration
│
├── 📁 hooks/                  # Custom React Hooks
│   ├── useLiveTutor.ts        # Voice AI connection
│   ├── useLearningActivity.ts # Activity tracking
│   ├── useUserStats.ts        # Dashboard stats
│   ├── useCourseProgress.ts   # Lesson progress
│   └── useUserNotes.ts        # Notes management
│
├── 📁 services/               # API & Backend Services
│   ├── geminiService.ts       # Gemini AI integration
│   └── dbService.ts           # Firebase Firestore
│
├── 📁 contexts/               # React Context Providers
│   └── AuthContext.tsx        # Authentication state
│
├── 📁 lib/                    # Library configurations
│   └── firebase.ts            # Firebase initialization
│
├── 📁 utils/                  # Utility functions
│   ├── audio.ts               # Audio processing
│   └── codeExecutor.ts        # Safe code execution
│
└── 📄 types.ts                # TypeScript interfaces
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/vaibhav45sktech/aivoicemode.git
cd aivoicemode

# 2. Install dependencies
npm install

# 3. Add your API key
echo "API_KEY=your_gemini_api_key" > .env

# 4. Start development server
npm run dev

# 5. Open in browser
# → http://localhost:5173
```

---

## 📸 Screenshots

| Dashboard | Learning View |
|-----------|---------------|
| Real-time stats, stopwatch timer, daily quests | Voice AI tutor, live code editor |

---

## 📄 License

MIT License - feel free to use this for learning and building!

---

<div align="center">

**Built with ❤️ using React, Gemini AI, and Firebase**

[⭐ Star this repo](https://github.com/vaibhav45sktech/aivoicemode) if you find it helpful!

</div>
