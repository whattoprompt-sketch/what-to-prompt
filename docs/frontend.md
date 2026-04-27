# Frontend Documentation: The Interface of Alchemy 🎨

The WhatToPrompt frontend is a modern React application built using Vite and TypeScript. It is designed with a premium, high-converting aesthetic focusing on speed, responsiveness, and educational user guidance.

## 🛠 Technology Stack

- **Framework**: [React 18](https://react.dev/)
- **Build System**: [Vite](https://vitejs.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (for API orchestration)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Motion**: [Framer Motion](https://www.framer.com/motion/) (for animations)
- **Database/Auth**: [Supabase](https://supabase.com/)

---

## 🏗 Component Architecture

The application is structured into a logical hierarchy of pages and reusable components:

### 1. Page Routing (`App.tsx`)
- **Landing (`/`)**: High-impact introduction and quick entry.
- **Wizard (`/wizard`)**: The core interactive flow for prompt building.
- **Result (`/result`)**: Displays the generated prompt, quality audit, and refinement options.
- **Auth (`/auth`)**: Supabase-powered authentication.
- **History (`/history`)**: User's library of past generations.

### 2. The Wizard System (`pages/Wizard.tsx`)
The Wizard is a multi-step form that uses "Contextual Intelligence." As the user provides input, the UI updates dynamically:
- **Guided Extraction**: Asks targeted questions based on the detected task type (e.g., asking for "Target Audience" specifically for blog posts).
- **ProgressBar**: Visual feedback on prompt maturity.
- **Validation**: Ensures minimum requirements are met before allowing generation.

### 3. Result & Quality Visualization (`pages/Result.tsx`)
The Result page is where the "Alchemy" is revealed:
- **Prompt Display**: Syntax-highlighted/monospaced block for easy copying.
- **Prompt Anatomy**: A specialized component (`components/PromptAnatomy.tsx`) that breaks down the generated prompt into its theoretical axioms (Role, Task, Context, Constraints), educating the user on *why* it works.
- **Refinement UI**: Dynamic buttons to trigger backend refinement (CoT, ToT).

---

## 🎨 Design System

WhatToPrompt uses a custom Tailwind configuration (`tailwind.config.ts`) focused on:
- **Glassmorphism**: Transparent, blurred backgrounds for cards and overlays.
- **Dark Mode Support**: Seamless transitioning between themes.
- **Responsiveness**: A mobile-first approach ensuring a perfect experience on devices from 320px to 4K.
- **Micro-interactions**: Subtle hover states, pulse effects on loading, and spring transitions for UI elements.

---

## 🔄 State & Data Flow

### API Orchestration
The app communicates with the FastAPI backend using standard `fetch` or TanStack Query.
- **Base URL**: Configured via `VITE_API_URL` environment variable.
- **Request Cycle**: Wizard Inputs -> Backend Transform -> Quality Audit -> Result State.

### Persistence (Supabase)
- **Authentication**: Email/Password and OAuth providers.
- **Session History**: Automatically saves generated prompts and their explanations to the `prompt_sessions` table for authenticated users.

---

## 📦 Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   VITE_API_URL=http://localhost:8000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
