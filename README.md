# GoTutor.ai

> ⚠️ **License: Creative Commons Attribution-NonCommercial (CC BY-NC 4.0)**
> You are free to view, explore, and use this project for personal or educational purposes. You may **not** use it for commercial purposes or profit without explicit written permission from the owner. See [LICENSE](./LICENSE) for details.

An AI-powered tutoring platform where students get a personal AI tutor for each class, and supervisors (aged 18+) can monitor student conversations within their classes.

## Overview

- **Students** join classes and chat with a personal AI tutor powered by OpenRouter
- **Supervisors** oversee a class and can monitor student conversations
- A single user can be a supervisor in one class and a student in another
- Supervisors can sponsor students for an ad-free experience, or students can subscribe themselves

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Node.js + TypeScript
- **Database:** PostgreSQL via Supabase
- **Auth:** Firebase Authentication
- **AI:** OpenRouter API

---

## Project Structure

```
gotutor/
├── client/         # React + TypeScript frontend
└── server/         # Node.js + TypeScript backend
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project
- A [Firebase](https://firebase.google.com/) project
- An [OpenRouter](https://openrouter.ai/) API key

---

## Setup

This is a private project. Setup instructions are available internally only (if you are a recruiter please request at andrew.v.sklyarov@gmail.com). At a high level the stack requires:

- A Supabase project for the PostgreSQL database
- A Firebase project for authentication
- An OpenRouter API key for the AI tutor
- Environment variables configured for both the client and server

---

## Notes

- All AI conversation history is stored per student per class, so each student has their own personal tutor context
- Supervisors must be 18 or older (enforced during signup)
