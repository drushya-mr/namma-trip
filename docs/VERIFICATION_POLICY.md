# Namma Trip Data Verification & Pricing Policy
**Status as of: 2026-10-17**

---

## 1. Background
Accurate travel information in Karnataka varies widely between district administration portals, tourism boards, forest checkpoints, and archaeological trusts. Presenting unconfirmed estimates as verified facts risks leaving tourists stranded or incurring unexpected costs.

In Namma Trip:
- **Verified Data**: Entry fees and gate timings were checked online on **2026-10-17** for only **12 out of 84 places**. These locations show a green **"Verified on <date>"** badge with citations of the verified source.
- **Unverified Data**: All other 72 places show an amber **"Verify before travel"** badge (`ಪ್ರಯಾಣಿಸುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ`). The application never presents unverified fees or timings as confirmed.

---

## 2. Verified Places (12)
1. **Lalbagh Botanical Garden** (Bengaluru Urban): ₹30 adult entry; free morning/evening walker periods.
2. **Bangalore Palace** (Bengaluru Urban): ₹240 Indian adult; additional audio-guide/camera charges.
3. **Nandi Hills** (Chikkaballapura): ₹20 person; vehicle parking extra.
4. **Mysore Palace** (Mysuru): Conflicting published prices (district government page says ₹50, Karnataka tourism says ₹70/₹120). Clearly flagged as conflicting; official phone number cited.
5. **Chamundi Hills** (Mysuru): Temple timings verified from district administration page; hill access free.
6. **Brindavan Gardens (KRS)** (Mandya): Adults ₹50, children ₹15.
7. **Abbey Falls** (Kodagu): Timings verified (09:00-17:00); entry fee unconfirmed on official page.
8. **Jog Falls** (Shivamogga): ₹20 Indian adult; parking and camera charges separate.
9. **Panambur Beach** (Dakshina Kannada): 08:00-19:00; beach entry free.
10. **Malpe Beach** (Udupi): Free entry to main beach; water activities & St Mary's ferry extra.
11. **Yana Caves** (Uttara Kannada): ₹20-₹50 eco-development fee at Forest Dept checkpoint.
12. **Gokak Falls** (Belagavi): No entry fee; hanging bridge subject to local restrictions.

---

## 3. Grounding Rules for AI & Community
1. **Never Invent Numbers**: If `fee_inr` is null, the system outputs "Fee not confirmed". It never guesses or interpolates costs.
2. **Budget Totals**: Any plan with null fees says "minimum estimate; some fees unconfirmed".
3. **Community Answers**: All community contributions regarding prices and timings are clearly tagged: `"community answer, not official"` to ensure transparency.
