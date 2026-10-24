# ನಮ್ಮ ಟ್ರಿಪ್ (Namma Trip) — AI Travel Planner for Karnataka
**Kannada Digital Innovation Hackathon 2026**
*Problem Statement: "AI Travel Planner for Karnataka"*

---

## 🌟 Executive Summary
**Namma Trip (ನಮ್ಮ ಟ್ರಿಪ್)** is a modern, mobile-first social travel application inspired by Instagram and Reels, designed to celebrate and explore all **31 districts of Karnataka**.

- **Default Language**: Starts in **ಕನ್ನಡ (Kannada)** by default on the first visit with an accessible instant **"ಕನ್ನಡ | English"** toggle.
- **Coverage**: Covers all 31 districts across 9 geographic clusters with 84 curated cultural and natural attractions.
- **Grounding Integrity**: Strictly grounds AI planning and QA answers on verified database records. Never invents fees or timings. Displays green **"Verified on 2026-10-17"** badges for verified places and amber **"Verify before travel"** badges for unverified places.
- **Privacy First**: Client-side canvas sanitizer strips all EXIF and GPS coordinates before photo upload.
- **Social Sharing**: Generates downloadable 9:16 Instagram Story cards and integrates with the native Web Share API.

---

## 🏗️ Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                       Frontend Client (React 18 + Vite)                         |
|  - Tailwind CSS + Lucide Icons + Leaflet Maps (no API key required)            |
|  - react-i18next (kn.json & en.json with 100% verified key parity)              |
|  - Client-side Canvas EXIF/GPS Stripper & Image Compressor                      |
|  - Instagram Stories 9:16 Card Renderer (HTML5 Canvas) + Web Share API          |
+----------------------------------------+----------------------------------------+
                                         | REST API (/api)
                                         v
+---------------------------------------------------------------------------------+
|                         Backend Service (Node.js + Express)                     |
|  - Places & Cluster Adjacency Engine (9 Karnataka Clusters)                     |
|  - Gemini AI Planner with Strict JSON Schema Validation & Retry Loop            |
|  - Grounded Ask-AI QA Service (Cites official sources; flags unverified fees)   |
|  - In-App Notification Bell & Community Q&A with Upvoting & Accepted Answers    |
|  - Rate-limiters, Content Moderation, and UGC Translation API                   |
+----------------------------------------+----------------------------------------+
                                         |
                   +---------------------+---------------------+
                   v                                           v
+--------------------------------------+   +--------------------------------------+
|        Supabase / Postgres DB        |   |       Google Gemini AI Engine        |
|  - schema.sql with RLS Policies      |   |  - gemini-1.5-flash with JSON mode   |
|  - places_seed.json (84 places)      |   |  - Cluster-constrained stops         |
|  - places_kn.json (Machine trans.)   |   |  - Kannada phrases & QA grounding    |
|  - Zero-config Local Fallback Mode   |   |  - Deterministic fallback generator  |
+--------------------------------------+   +--------------------------------------+
```

---

## 🚀 Key Features

### 1. AI Trip Planner
- **Form Inputs**: Select interests chips (heritage, nature, waterfalls, temples, beaches, adventure, palaces, wildlife), trip duration (1-7 days), budget in INR, travel style (relaxed: 2 stops/day vs packed: 3 stops/day), group type (solo, friends, family), and starting city.
- **Cluster-Constrained Routing**: Selects candidate places exclusively from the starting cluster or adjacent clusters to prevent zigzagging across the state.
- **Strict Grounding**: Gemini arranges candidate places into strict JSON. The backend validator validates every place ID against the database, checks pricing, and retries once if invalid.
- **Timeline & Route Map**: Day-by-day vertical timeline with timings, entry fees, travel duration between stops, interactive Leaflet route map, and a **"Regenerate This Day"** button.
- **Helpful Kannada Phrases**: Authentic Kannada phrase with English translation and transliteration for each destination.
- **Budget Honesty**: If any stop has unconfirmed fees (`fee_inr === null`), budget totals display: `"minimum estimate; some fees unconfirmed"` (`ಕನಿಷ್ಠ ಅಂದಾಜು; ಕೆಲವು ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ದೃಢಪಟ್ಟಿಲ್ಲ`).

### 2. Social Feed ("Trip Stories") — Instagram Style
- Vertical mobile card feed with photo carousels, caption, place tag, district tag, like button, bookmark/save, comments, and Web Share API.
- **Instagram Story Card Generator**: Generates high-res 9:16 story cards with Kannada typography and custom gradients that users can download and post directly to Instagram Stories.
- **Create Post Flow**: Select place from 84-place dataset, 1-5 star ratings, month visited, spend in INR, up to 5 photos.
- **Privacy Metadata Stripping**: Client-side canvas sanitization purges EXIF, GPS coordinates, and camera serial numbers before upload.
- **AI Translation on UGC**: Clickable "Translate" link under reviews that translates community text into the user's current UI language, clearly labeled "Translated by AI".

### 3. Ask a Question (AI Grounding + Community)
- **Ask AI**: Answers using ONLY that place's factual database record + approved community answers. Cites official URLs (`karnatakatourism.org`, ASI, district portals) and verified dates. Never invents prices or timings.
- **Ask Community**: Post questions publicly; other travelers answer; upvote answers; question owner can mark an answer as accepted. Labeled `"community answer, not official"`.

### 4. Bilingual Engine (Kannada Default, English Optional)
- Opens in **Kannada (ಕನ್ನಡ)** on the first visit without browser language override.
- Accessible **"ಕನ್ನಡ | English"** switch in the top bar and profile settings.
- 100% key parity between `kn.json` and `en.json` enforced by `scripts/test-i18n-parity.cjs` during every build.
- **Machine Translation Review Policy**: Kannada place names (`name_kn`) and descriptions (`description_kn`) in `/database/places_kn.json` are marked `"machine_translated": true` and `"reviewed": false` for community and editorial review.

### 5. All 31 Districts Coverage
- Dynamic district coverage counter showing **31/31 Districts Covered** computed directly from the dataset.
- Interactive district selector with bilingual search (`Hampi` and `ಹಂಪಿ` return identical results).

### 6. Profile & Social Accounts
- Social media handles for Instagram, YouTube, X, Facebook, and personal website.
- Stores handles/URLs only (no passwords or tokens). Normalizes to full URLs with `rel="noopener noreferrer nofollow"`.
- User toggle: "Show my social links on my posts".

---

## 🔑 Judge Demo Account
Hackathon judges can test the application with 1-click without creating a new account:
- **Display Name**: ಪುನೀತ್ ಗೌಡ (Puneeth Gowda)
- **Username**: `kannada_traveller`
- **Home City**: Bengaluru
- **Instagram Handle**: `puneeth_travels_ka`
- **Shortcut**: Click **"Log In as Demo User"** (`ಡೆಮೋ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ`) on the Profile tab or banner.

---

## ⚠️ Data Verification Notice
Entry fees and timings in this application were checked online on **2026-10-17** for only the **12 places** with a `verified_on` date:
- *Lalbagh Botanical Garden, Bangalore Palace, Nandi Hills, Mysore Palace, Chamundi Hills, Brindavan Gardens (KRS), Abbey Falls, Jog Falls, Panambur Beach, Malpe Beach, Yana Caves, Gokak Falls.*

For these 12 places, a green **"Verified on <date>"** badge is shown. For all other 72 places, an amber **"Verify before travel"** badge is displayed. Unverified fees or timings are never presented as confirmed.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, react-i18next, Leaflet, react-leaflet, Lucide Icons, canvas-confetti.
- **Backend**: Node.js, Express, express-rate-limit, zod, cors, dotenv.
- **Database & Storage**: Supabase (Postgres + Storage + Auth) + Built-in offline fallback store.
- **AI Engine**: Google Gemini API (`@google/generative-ai`), called strictly from the backend.
- **Deployment**: Frontend on Vercel, Backend on Render.

---

## 💻 Setup & Run Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24.20.0 and npm 11.19.0)

### 1. Clone & Install
```bash
# Clone the repository
git clone <repo-url>
cd "Namma Trip"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Copy `.env.example` in both folders:
```bash
# In backend:
cp .env.example .env

# In frontend:
cp .env.example .env
```

### 3. Run Automated Tests
```bash
# Run backend plan validation and grounding tests
cd backend
npm test

# Run frontend i18n key parity check (fails if keys mismatch)
cd ../frontend
npm run test:i18n
```

### 4. Run Development Servers
```bash
# Terminal 1: Start backend on port 5000
cd backend
npm start

# Terminal 2: Start frontend on port 5173
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser. The app will open in Kannada with the 31-district coverage counter, AI planner, and Instagram-style feed ready to explore!

---

## 🌐 Production Deployment
- **Frontend (Vercel)**: [https://namma-trip-beige.vercel.app](https://namma-trip-beige.vercel.app)
- **Backend (Render)**: [https://namma-trip.onrender.com](https://namma-trip.onrender.com)
- **GitHub Repository**: [https://github.com/drushya-mr/namma-trip](https://github.com/drushya-mr/namma-trip)

---

## 📊 Hackathon Presentation
A comprehensive 14-slide presentation prepared for the **Kannada Digital Innovation Hackathon 2026** is available in the repository:
- **PowerPoint (.pptx)**: [`docs/hackathon/Namma_Trip_Hackathon_Presentation.pptx`](docs/hackathon/Namma_Trip_Hackathon_Presentation.pptx)
- **Companion PDF (.pdf)**: [`docs/hackathon/Namma_Trip_Hackathon_Presentation.pdf`](docs/hackathon/Namma_Trip_Hackathon_Presentation.pdf)


## 🎥 Live Application Demo & Video Explanation

Watch the video walkthrough of Namma Trip:

[▶ Watch the Namma Trip Application Explanation](https://drive.google.com/file/d/1lw6HfyhsaQEEmbiUieKz8aD1VhIWsIt9/view?usp=sharing)

🌐 **Live Application:** [Open Namma Trip](https://namma-trip-beige.vercel.app)

📂 **Source Code:** [GitHub Repository](https://github.com/drushya-mr/namma-trip)
