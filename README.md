# TierLog — AI-Powered Thesis Supervision System

> An intelligent e-logbook and revision assistant that bridges lecturer feedback with student execution using AI guardrails, real-time collaboration, and multi-provider AI integration.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Demo Credentials](#demo-credentials)
- [First-Time Setup Order](#first-time-setup-order)

---

## Overview

TierLog is a full-stack thesis supervision platform built for university environments. It allows students to upload consultation recordings (`.mp3`) and thesis drafts (`.docx`), which are processed by AI to automatically extract transcription, classify feedback into severity levels (Major/Minor), and provide a guarded AI assistant that only responds based on official lecturer feedback — preventing hallucination and off-topic suggestions.

The system features real-time WebSocket synchronization so both students and lecturers see status changes instantly, a lecturer oversight panel for monitoring student-AI conversations, annotation OCR for reading handwritten feedback from uploaded images, and a multi-provider AI gateway that lets users bring their own API keys.

---

## Key Features

| Feature | Description |
|:---|:---|
| **Multi-Format Logbook** | Upload consultation audio (`.mp3`) and thesis drafts (`.docx`) in a single session |
| **AI Audio Transcription** | Automatic transcription via Groq Whisper with smart chunking for files >20 MB |
| **Guarded AI Oracle** | AI assistant that only responds based on official lecturer feedback — blocks off-topic queries |
| **Feedback Lifecycle** | Track revision items with severity (Major/Minor) and status (Pending → Fixed → Validated) |
| **Real-Time Sync** | WebSocket-powered instant status updates between student and lecturer dashboards |
| **Live AI Monitoring** | Lecturers can observe student-AI Oracle conversations in real time |
| **Annotation OCR** | Gemini Vision reads handwritten annotations and track changes from uploaded images |
| **Multi-Provider AI Gateway** | Supports OpenAI, Google Gemini, Anthropic Claude, NVIDIA NIM, and Groq |
| **Direct Messaging** | Student-lecturer messaging within consultation contexts |
| **JWT Authentication** | Secure access + refresh token flow with bcrypt password hashing |
| **Redeem Code System** | Admin-generated codes to activate AI Gateway features per user |

---

## Tech Stack

### Backend

| Component | Technology |
|:---|:---|
| Language | Go 1.25+ |
| HTTP Framework | Gin Gonic v1.11 |
| ORM | GORM v1.31 (MySQL driver) |
| WebSocket | Gorilla WebSocket v1.5 |
| Auth | Custom JWT (HMAC-SHA256) + bcrypt |
| AI — LLM | Google Gemini SDK, NVIDIA NIM, Anthropic Claude, OpenAI |
| AI — STT | Groq Whisper Large V3 |
| AI — Vision | Google Gemini 2.0 Flash (annotation OCR) |
| Environment | godotenv |

### Frontend (`tierlog_web/`)

| Component | Technology |
|:---|:---|
| Framework | React Native 0.79 + Expo 53 |
| Navigation | Expo Router v5 |
| Styling | NativeWind 4 (Tailwind CSS) |
| Animations | Framer Motion, Moti |
| State | Zustand |
| 3D Graphics | Three.js |

### Database

| Component | Technology |
|:---|:---|
| RDBMS | MySQL 8.0 |
| Driver | go-sql-driver/mysql |

---

## System Architecture

```
┌─────────────────────────────┐
│   Frontend (Expo / Web)     │
│   React Native + Expo Router│
└──────────────┬──────────────┘
               │ REST API + WebSocket
               ▼
┌─────────────────────────────┐
│   Go Backend (Gin)          │
│   ┌───────────┐ ┌─────────┐│
│   │Controllers│ │WebSocket││
│   └─────┬─────┘ │  Hub    ││
│         │       └─────────┘│
│   ┌─────▼─────┐            │
│   │  GORM ORM │            │
│   └─────┬─────┘            │
└─────────┼──────────────────┘
          │
   ┌──────▼──────┐     ┌──────────────────────┐
   │  MySQL DB   │     │   External Services   │
   └─────────────┘     │  ┌────────────────┐  │
                       │  │ Groq Whisper    │  │
                       │  │ Google Gemini   │  │
                       │  │ NVIDIA NIM      │  │
                       │  │ Anthropic Claude│  │
                       │  │ OpenAI          │  │
                       │  └────────────────┘  │
                       └──────────────────────┘
```

---

## Project Structure

```
PopularProgramingFinalProject/
├── main.go                        # Application entry point & route registration
├── go.mod                         # Go module definition
├── go.sum                         # Dependency checksums
├── struct_go.sql                  # Database initialization SQL script
│
├── auth/                          # Authentication utilities
│   ├── passwords.go               #   bcrypt hashing & comparison
│   └── tokens.go                  #   JWT creation, parsing, refresh token logic
│
├── controller/                    # HTTP request handlers (business logic)
│   ├── app_controller.go          #   Auth, dashboard, consultation V2, WebSocket handlers
│   ├── ai_controller.go           #   Multi-provider AI integration & guarded assistant
│   ├── annotation_controller.go   #   Gemini Vision OCR for handwritten annotations
│   ├── consultation_controller.go #   Legacy consultation endpoints & file upload
│   └── user_controller.go         #   User, lecturer, student CRUD & AI gateway settings
│
├── koneksi/                       # Database connection
│   └── koneksi.go                 #   GORM setup, auto-migration, connection pooling
│
├── middleware/                     # HTTP middleware
│   └── auth.go                    #   JWT authentication guard
│
├── models/                        # Data models (GORM structs)
│   └── models.go                  #   User, Student, Lecturer, ConsultationLog, FeedbackItem, etc.
│
├── realtime/                      # WebSocket infrastructure
│   └── hub.go                     #   Room-based pub/sub hub with ping/pong keepalive
│
├── utils/                         # Utility functions
│   └── docx_helper.go             #   DOCX text extraction & track changes parser
│
├── storage/                       # File storage (contents gitignored)
│   ├── audio/                     #   Consultation recordings (.mp3)
│   ├── paper/                     #   Thesis drafts (.docx)
│   ├── transcript/                #   AI-generated transcripts (.txt)
│   ├── annotations/               #   Uploaded annotation files (images, docx)
│   └── feedback/                  #   Feedback-related files
│
├── tierlog_web/                   # Frontend application (Expo / React Native)
│   ├── app/                       #   Expo Router pages
│   │   ├── _layout.tsx            #     Root layout with auth provider
│   │   ├── index.tsx              #     Landing / home page
│   │   ├── login.tsx              #     Login page
│   │   ├── register.tsx           #     Registration page
│   │   ├── dashboard.tsx          #     Student dashboard
│   │   ├── consultations.tsx      #     Consultation workspace
│   │   ├── lecturer-dashboard.tsx #     Lecturer dashboard
│   │   ├── archive.tsx            #     Archive / logs page
│   │   └── settings/              #     Settings pages
│   ├── src/
│   │   ├── components/            #   Reusable UI components
│   │   ├── hooks/                 #   Custom React hooks
│   │   ├── lib/                   #   API client, utilities
│   │   ├── providers/             #   Auth provider, context
│   │   ├── clarity/               #   Analytics / tracking
│   │   └── types.ts               #   TypeScript type definitions
│   ├── package.json               #   Frontend dependencies
│   ├── tailwind.config.js         #   Tailwind CSS configuration
│   └── tsconfig.json              #   TypeScript configuration
│
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

---

## Prerequisites

- **Go** 1.25 or higher
- **Node.js** 18+ and **npm** (for the frontend)
- **MySQL** 8.0
- At least one **AI API key** (Google Gemini recommended for full functionality)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/cruzhgggggg-coder/PROJECT_BARU_EXPO.git
cd PROJECT_BARU_EXPO
```

### 2. Set Up the Backend

```bash
# Install Go dependencies
go mod tidy
```

### 3. Set Up the Database

```bash
# Import the schema into MySQL
mysql -u root -p struct_go < struct_go.sql
```

Or import `struct_go.sql` via phpMyAdmin / MySQL Workbench.

### 4. Set Up the Frontend

```bash
cd tierlog_web
npm install
cd ..
```

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and AI API keys (see [Environment Variables](#environment-variables)).

Also configure the frontend:

```bash
cd tierlog_web
cp .env.example .env
cd ..
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|:---|:---|:---|:---|
| `DB_HOST` | No | `127.0.0.1` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_DATABASE` | No | `struct_go` | Database name |
| `DB_USERNAME` | No | `root` | MySQL username |
| `DB_PASSWORD` | No | *(empty)* | MySQL password |
| `JWT_SECRET` | No | `tierlog-dev-secret` | Secret key for JWT signing |
| `AI_PROVIDER` | No | `gemini` | Default AI provider (`gemini`, `nvidia`, `openai`, `anthropic`) |
| `GEMINI_API_KEY` | Recommended | — | Google Gemini API key (for AI analysis + annotation OCR) |
| `GROQ_API_KEY` | Recommended | — | Groq API key (for audio transcription via Whisper) |
| `NVIDIA_API_KEY` | No | — | NVIDIA NIM API key |
| `OPENAI_API_KEY` | No | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | — | Anthropic Claude API key |

### Frontend (`tierlog_web/.env`)

| Variable | Required | Default | Description |
|:---|:---|:---|:---|
| `EXPO_PUBLIC_API_URL` | No | `http://127.0.0.1:8080` | Backend API base URL |

---

## Running the Application

### Backend

```bash
# From the project root
go run main.go
```

The server starts at `http://localhost:8080`. Storage directories (`storage/audio`, `storage/transcript`, etc.) are created automatically on first run.

### Frontend (Development)

```bash
cd tierlog_web
npm run dev
```

Opens the Expo dev server. Access the web version at the URL shown in the terminal (typically `http://localhost:8081`).

---

## Database Schema

| Table | Description |
|:---|:---|
| `users` | Authentication & RBAC (`student` / `lecturer`). Supports soft delete. |
| `lecturers` | Extended profile for faculty members (NIP, name, faculty, expertise). |
| `students` | Student profile with thesis title, NIM, and supervisor link (`lecturer_id`). |
| `consultation_logs` | Core session record — stores file references and `transcript_text` for AI context. |
| `feedback_items` | Atomic feedback points (Major/Minor) with lifecycle status (Pending/Fixed/Validated). |
| `revision_annotations` | Uploaded annotation files (images or docx) with extracted OCR text. |
| `direct_messages` | Student-lecturer direct messages within consultation contexts. |
| `ai_chat_messages` | Persistent AI Oracle chat history per consultation. |
| `refresh_tokens` | Refresh token storage with revocation support. |
| `redeem_codes` | Admin-generated codes for AI Gateway activation. |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| POST | `/auth/register` | No | Register a new user (student or lecturer) |
| POST | `/auth/login` | No | Login and receive access + refresh tokens |
| POST | `/auth/refresh` | No | Refresh an expired access token |
| POST | `/auth/logout` | Yes | Revoke the current refresh token |
| GET | `/auth/me` | Yes | Get current authenticated user profile |

### Consultations

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/consultations` | Yes | List consultation logs (role-scoped) |
| POST | `/consultations` | Yes | Create a new consultation (multipart: audio + paper) |
| POST | `/consultations/chat` | Yes | Send a message to the AI Oracle |
| GET | `/consultations/:id/ai-chats` | Yes | Get AI chat history for a consultation |
| GET | `/consultations/:id/direct-messages` | Yes | Get direct messages for a consultation |
| POST | `/consultations/:id/direct-messages` | Yes | Send a direct message |
| POST | `/consultations/:id/add-feedback` | Yes | Lecturer adds feedback manually |
| POST | `/consultations/:id/classify-feedback` | Yes | AI classifies feedback into Major/Minor |
| PUT | `/consultations/feedback/:id/status` | Yes | Update feedback status (role-restricted) |

### Dashboard & Lecturer

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/dashboard/stats` | Yes | Get dashboard statistics (role-scoped) |
| GET | `/lecturer/consultations` | Yes | Get consultations for a lecturer's students |
| GET | `/lecturer/students` | Yes | Get students supervised by the lecturer |

### Settings

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| PATCH | `/settings/profile` | Yes | Update user profile |
| PUT | `/settings/password` | Yes | Change password |
| PATCH | `/settings/ai-gateway` | Yes | Update AI API keys and preferred model |
| POST | `/settings/ai-gateway/redeem` | Yes | Activate AI Gateway with a redeem code |

### Legacy API (`/api/*`)

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/consultation` | Create consultation (legacy) |
| GET | `/api/consultation` | List consultations (legacy) |
| GET | `/api/stats` | Get statistics (legacy) |
| POST | `/api/ai/assist` | AI assistant query (legacy) |
| GET | `/api/ai/models` | List available NVIDIA models |
| POST | `/api/settings/ai-keys` | Update AI Gateway settings (legacy) |
| POST | `/api/settings/redeem` | Redeem gateway code (legacy) |
| POST | `/api/admin/generate-code` | Generate a redeem code (admin) |

---

## WebSocket Events

### Connection

```
ws://localhost:8080/ws?token=<jwt>
```

### Subscribe to a Room

```json
{ "action": "subscribe", "room": "consultation.<log_id>" }
```

### Unsubscribe from a Room

```json
{ "action": "unsubscribe", "room": "consultation.<log_id>" }
```

### Server-Pushed Events

| Event | Description |
|:---|:---|
| `feedback.status-updated` | A feedback item's status or category changed |
| `feedback.new` | A lecturer added a new feedback item |
| `chat.message` | A new AI Oracle chat message (user or AI) |
| `chat.direct-message` | A new direct message between student and lecturer |

---

## Demo Credentials

After importing `struct_go.sql`:

| Role | Email | Password | Description |
|:---|:---|:---|:---|
| Lecturer | `dosen1@university.ac.id` | `password` | Dr. Arsitek Go, M.Kom (NIP: 198001012005011001) |
| Student | `mhs1@university.ac.id` | `password` | Budi Mahasiswa (NIM: 2200010001) |

> **Note:** If the password columns are empty after SQL import, set them via your application's registration flow or update directly in MySQL with a bcrypt-hashed value.

---

## First-Time Setup Order

```
1. POST /auth/register  → Create Lecturer account
2. POST /auth/register  → Create Student account
3. Login as Lecturer    → Get JWT token
4. Login as Student     → Get JWT token
5. POST /consultations  → Upload audio + paper (as student)
6. POST /consultations/chat → Ask the AI Oracle (as student or lecturer)
```

---

*TierLog — Bridging the gap between feedback and excellence.*
