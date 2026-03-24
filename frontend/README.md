# 📘 Campus Hub

Campus Hub is a student-focused platform that combines a **marketplace**, **events hub**, **Q&A community**, and **AI-powered study tools** into one app. It simplifies campus life by helping students buy/sell items, discover events, ask/answer questions, and get study support in a single place.

---

## ✨ Features (MVP)
- 🔐 Student authentication with university email (NextAuth + JWT)
- 🛒 Marketplace for buying/selling items
- 📅 Events hub with RSVP & reminders
- ❓ Student Q&A community (module-specific, voting, accepted answers)
- 🤖 AI study assistant (summaries, flashcards, “Explain like I’m 5”)
- 💬 In-app chat (Socket.IO)

---

## 🛠 Tech Stack
**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Query for server state management
- NextAuth.js for authentication

**Backend**
- NestJS (TypeScript)
- MongoDB Atlas (data + Atlas Search + Vector Search)
- Redis (Upstash) for chat + queues
- Cloudinary for file storage
- OpenAI API for AI features

**Testing**
- Unit: Jest (API), Vitest + RTL (web)
- Integration: Supertest (API)
- End-to-End: Playwright
- Load testing: k6 / Artillery

**Deployment**
- Frontend: Vercel
- Backend: Railway / Render
- CI/CD: GitHub Actions

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>=18)
- npm
- MongoDB Atlas account
- Redis (Upstash or local)
- Cloudinary account
- OpenAI API key

### Installation
```bash
# Clone repository
git clone https://github.com/RaheemKhan0/CampusHub.git
cd CampusHub

# Install dependencies
npm install



