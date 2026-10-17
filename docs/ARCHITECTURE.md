# Namma Trip Architecture & Design Document
**Kannada Digital Innovation Hackathon 2026 — AI Travel Planner for Karnataka**

---

## 1. System Overview
Namma Trip is an Instagram-style, mobile-first social travel planning platform designed specifically for Karnataka. It combines:
1. **AI Itinerary Planner**: Cluster-constrained itinerary generator with strict LLM JSON validation and automatic fallback.
2. **Social Feed (Trip Stories)**: Vertical reels/stories interface with photo carousels, client-side EXIF/GPS stripping, likes, saves, comments, and Web Share API / 9:16 Instagram Story card generator.
3. **Dual Q&A System (Ask AI + Ask Community)**: Strict database-grounded AI answering with official source citations, plus community Q&A with upvoting and accepted answer marks.
4. **Bilingual Engine**: Defaults to Kannada (`kn`) on first visit without browser override, offers instant bilingual toggle (`ಕನ್ನಡ | English`), and enforces 100% key parity via build scripts.
5. **Coverage of all 31 Districts**: Comprehensive dataset of 84 places organized into 9 geographic clusters, with a live 31/31 coverage counter.

---

## 2. Component Architecture

```
+---------------------------------------------------------------------------------+
|                         Namma Trip Web Client (React 18)                        |
|  - UI/UX: Tailwind CSS + Lucide Icons + Leaflet Maps                            |
|  - Localization: react-i18next (kn.json & en.json key parity)                   |
|  - Privacy: Client-side HTML5 Canvas EXIF/GPS Metadata Stripper & Compressor    |
|  - Social Sharing: 9:16 Instagram Story Canvas Generator + Web Share API        |
+----------------------------------------+----------------------------------------+
                                         | REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                        Node.js Express Backend Service                          |
|  - Rate-limiters on AI and posting endpoints (express-rate-limit)               |
|  - Content moderation (profanity filters, size constraints)                     |
|  - Places & Cluster Adjacency Engine                                            |
|  - Plan Validator & Enricher (verifies place IDs against database)              |
|  - Grounded Ask-AI Service (zero hallucination rule for fees & timings)         |
+----------------------------------------+----------------------------------------+
                                         |
                   +---------------------+---------------------+
                   v                                           v
+--------------------------------------+   +--------------------------------------+
|        Supabase / Postgres DB        |   |       Google Gemini AI Engine        |
|  - Tables: profiles, places, trips,  |   |  - gemini-1.5-flash with JSON mode   |
|    posts, comments, questions, etc.  |   |  - Strictly candidate-constrained    |
|  - RLS Policies & Foreign Keys       |   |  - Dual-language QA & phrases        |
|  - Offline In-Memory Fallback Store  |   |  - Retry loop & local generator      |
+--------------------------------------+   +--------------------------------------+
```

---

## 3. Geographic Clusters & Adjacency Routing
To ensure itineraries do not zigzag across the state, places are grouped into 9 geographic clusters:
1. **1. Bengaluru Belt**: Bengaluru Urban, Bengaluru Rural, Ramanagara, Chikkaballapura, Kolar, Tumakuru.
2. **2. Old Mysuru & Hoysala Heritage**: Mysuru, Mandya, Chamarajanagar, Hassan.
3. **3. Malnad & Coffee Hills**: Kodagu, Chikkamagaluru, Shivamogga.
4. **4. Coastal Karnataka**: Dakshina Kannada, Udupi, Uttara Kannada.
5. **5. Mumbai-Karnataka (North-West)**: Belagavi, Dharwad, Gadag, Haveri.
6. **6. Chalukya Heritage & Deccan Sultanate (North)**: Bagalkote, Vijayapura.
7. **7. Kalyana-Karnataka (North-East)**: Kalaburagi, Bidar, Yadgir, Raichur.
8. **8. Hampi & Tungabhadra Region**: Vijayanagara, Koppal, Ballari.
9. **9. Central Karnataka**: Chitradurga, Davanagere.

The itinerary planner restricts stops for each day to places within the starting cluster or its directly adjacent clusters.

---

## 4. Grounding and Verification Rules
- **Only 12 of 84 places** have `verified_on` set (checked online on 2026-10-17). These display a green "Verified on <date>" badge.
- **The remaining 72 places** display an amber "Verify before travel" badge.
- **Null Fees**: If `fee_inr` is null, the system never invents a number. It displays "Fee not confirmed" and displays `fee_text` if present (such as conflicting prices).
- **Budget Breakdown**: Any itinerary containing a stop with null fees displays "minimum estimate; some fees unconfirmed" (`ಕನಿಷ್ಠ ಅಂದಾಜು; ಕೆಲವು ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ದೃಢಪಟ್ಟಿಲ್ಲ`).
- **Map Coordinates**: Places with null lat/lng are skipped on the map without guessing coordinates.

---

## 5. Privacy & Media Security
Before any photo is uploaded to the social feed, it is loaded into an offscreen HTML5 `<canvas>` on the user's device and re-encoded as a clean image. This permanently purges:
- Embedded EXIF GPS coordinates (latitude, longitude, altitude).
- Camera hardware serial numbers, device model, and firmware version.
- Timestamps and personal device identifiers.
Images are compressed to under 500KB while preserving high visual quality.
