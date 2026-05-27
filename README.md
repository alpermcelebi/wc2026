# 🏆 FIFA World Cup 2026 Bracket Predictor

A premium, interactive web application built with **Next.js**, **Tailwind CSS**, and **Supabase** that allows football fans to predict the entire Group Stage, third-place wildcards, Knockout brackets, and individual awards for the **FIFA World Cup 2026**. 

Users can download dynamic, auto-generated vertical story posters of their brackets, check global community statistics, and share their predictions directly to social media.

---

## 📸 Screenshots

*(Place a screenshot showing the main dashboard with the match lists and the interactive knockout bracket here)*
> **[Main Dashboard Preview]**

*(Place a screenshot showing the top header metrics panel with the active Match Totals, Timeline, and the integrated Ambient Background Music Controller card here)*
> **[Premium Ambient Player & Header Metrics]**

*(Place a screenshot showing the dedicated /stats page with the animated participant counter and global champion prediction progress bars here)*
> **[Global Community Stats Subpage]**

*(Place a screenshot of the simplified share modal displaying the story poster preview, the download CTA, and the direct WhatsApp / X sharing options here)*
> **[Share Modal & Story Poster Preview]**

---

## ✨ Features

### 🌟 Interactive Tournament Simulator
* **Group Stage Builder**: Predict outcomes for all 72 group matches across 12 groups (A-L). Group standings, points, goals, and goal differences update in real-time.
* **Third-Place Wildcards**: Automatically computes and ranks the top 8 third-place teams based on FIFA rules to qualify for the Round of 32.
* **Knockout Bracket Tree**: Interactive elimination tree from the Round of 32 down to the Grand Final, complete with score tracking, penalty overrides, and visual paths.

### 🎵 Integrated Ambient Music Controller
* Fully integrated ambient player built directly into the header dashboard metrics panel.
* Track selection (anthems, mixes), play/pause toggles, and volume mute controls.
* Visual indicators, including a **subtle pulsing audio waveform micro-animation** and glowing borders when music is active.

### 📊 Community Insights & Statistics (`/stats`)
* Dedicated statistics portal showcasing global community metrics.
* **Global Participant Counter**: Dynamic counter showcasing total brackets submitted worldwide with an animated count-up ticker.
* **Champion Odds Grid**: Horizontal progress bars showing the top-predicted countries to win the Cup.
* **Performance Caching**: Powered by server-side caching (ISR) with a 5-minute revalidation layer to protect database read credits.

### 📥 Story Poster & Sharing Terminal
* **Dynamic Image Generation**: Generates high-quality, vertical (9:16) mobile-story infographic posters optimized for Instagram, WhatsApp, and TikTok via Vercel OG image compilation.
* **Advanced Web Share API**: Convert poster blobs into actual file objects to deep-link directly into native apps (X and WhatsApp) on supported mobile devices.
* **Copyable Templates**: Quick clipboard copying that bundles the unique sharing link and a custom Turkish promotional text template.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand)
* **Image Compilation**: `@vercel/og`

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/wc2026-predictor.git
cd wc2026-predictor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*Note: If environment variables are omitted, the application will gracefully fall back to **Local Mock Mode** for development.*

### 4. Setup Database Schema
Run the SQL migration scripts located in the `/supabase` folder inside your Supabase SQL editor:
1. Run [`supabase/schema.sql`](file:///Users/alper/Desktop/wc2026/supabase/schema.sql) to set up profiles, predictions, and basic trigger hooks.
2. Run [`supabase/user_brackets_schema.sql`](file:///Users/alper/Desktop/wc2026/supabase/user_brackets_schema.sql) to create the brackets saving table.
3. Run [`supabase/migration.sql`](file:///Users/alper/Desktop/wc2026/supabase/migration.sql) to seed mock player pools and setup awards tables.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📦 Production Build
To build and optimize the production bundle:
```bash
npm run build
npm run start
```
This compile step statically optimizes pages like `/stats` and sets up ISR caching loops automatically.
