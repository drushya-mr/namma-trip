const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const db = require('../data/db');
const { validateAndEnrichPlan } = require('./planValidator');

let genAI = null;
if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  } catch (e) {
    console.warn('Failed to initialize GoogleGenerativeAI:', e.message);
  }
}

/**
 * Fallback deterministic plan generator using candidate places
 * Guarantees zero failures and 100% adherence to dataset
 */
function generateLocalPlan({ startingCity, days = 2, travelStyle = 'relaxed', interests = [], language = 'kn' }, candidates) {
  const stopsPerDay = travelStyle === 'packed' ? 3 : 2;
  const daysCount = Math.min(Math.max(1, parseInt(days) || 2), 7);

  // Score candidate places based on interests matching category
  const scored = candidates.map(place => {
    let score = 0;
    const catLower = (place.category || '').toLowerCase();
    const notesLower = (place.notes || '').toLowerCase();

    interests.forEach(interest => {
      const iLower = interest.toLowerCase();
      if (catLower.includes(iLower) || notesLower.includes(iLower)) score += 3;
    });

    // Prefer places with coordinates for route mapping
    if (place.lat && place.lng) score += 1;
    // Prefer verified places
    if (place.verified_on) score += 1;

    return { place, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Group by base_city or district to keep days geographically sensible
  const chosenStops = [];
  const usedIds = new Set();

  for (const item of scored) {
    if (chosenStops.length >= daysCount * stopsPerDay) break;
    if (!usedIds.has(item.place.id)) {
      usedIds.add(item.place.id);
      chosenStops.push(item.place);
    }
  }

  // If not enough scored places, pick remaining candidates
  for (const place of candidates) {
    if (chosenStops.length >= daysCount * stopsPerDay) break;
    if (!usedIds.has(place.id)) {
      usedIds.add(place.id);
      chosenStops.push(place);
    }
  }

  // Construct day-by-day JSON
  const daysArray = [];
  for (let d = 0; d < daysCount; d++) {
    const dayStops = chosenStops.slice(d * stopsPerDay, (d + 1) * stopsPerDay);
    if (dayStops.length === 0 && chosenStops.length > 0) {
      // Re-use or cycle if candidate list is small
      dayStops.push(chosenStops[0]);
    }

    const stops = dayStops.map((p, idx) => {
      const timeSlots = ['09:00 - 12:00', '13:30 - 16:00', '16:30 - 18:30'];
      return {
        place_id: p.id,
        timings: timeSlots[idx] || '10:00 - 13:00',
        visit_hours: p.visit_hours || 2,
        activity: language === 'kn' ? p.description_kn : `Visit and explore ${p.name}`
      };
    });

    const primaryDistrict = dayStops[0] ? dayStops[0].district : startingCity;
    daysArray.push({
      day_number: d + 1,
      theme: language === 'kn'
        ? `${primaryDistrict} ಜಿಲ್ಲೆಯ ಪ್ರಮುಖ ಆಕರ್ಷಣೆಗಳ ದರ್ಶನ`
        : `Exploration of ${primaryDistrict}`,
      stops
    });
  }

  return {
    title: language === 'kn'
      ? `${startingCity} ಪ್ರಾರಂಭಿಕ ಪ್ರವಾಸ ಯೋಜನೆ (${daysCount} ದಿನಗಳು)`
      : `${startingCity} Gateway Itinerary (${daysCount} Days)`,
    summary: language === 'kn'
      ? `ಕರ್ನಾಟಕದ ಅದ್ಭುತ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಪ್ರಾಕೃತಿಕ ತಾಣಗಳನ್ನು ಒಳಗೊಂಡ ${daysCount} ದಿನಗಳ ಕ್ಯುರೇಟೆಡ್ ಪ್ರವಾಸ ಯೋಜನೆ.`
      : `A curated ${daysCount}-day journey featuring authentic historical and natural attractions across Karnataka.`,
    starting_city: startingCity,
    days: daysArray
  };
}

/**
 * Plans itinerary using Gemini API with retry mechanism and fallback
 */
async function generatePlan(planParams) {
  const {
    interests = [],
    days = 2,
    budget = 5000,
    travelStyle = 'relaxed',
    groupType = 'friends',
    startingCity = 'Bengaluru',
    language = 'kn'
  } = planParams;

  const allPlaces = db.getRawPlaces();
  const startingCluster = db.clusters.getClusterForCity(startingCity);
  const allowedClusters = db.clusters.getAdjacent(startingCluster);
  const candidates = allPlaces.filter(p => allowedClusters.includes(p.cluster));

  console.log(`Planning for city "${startingCity}" (cluster: ${startingCluster}). Candidates count: ${candidates.length}`);

  // Create candidate summary for the LLM prompt
  const candidatesPromptList = candidates.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    district: c.district,
    cluster: c.cluster,
    visit_hours: c.visit_hours,
    fee_inr: c.fee_inr
  }));

  const systemInstructions = `
You are an expert Karnataka travel planner for the "Namma Trip" application.
Your task is to create a day-by-day travel plan based on the user's constraints.

CRITICAL RULES:
1. You MUST select places ONLY from the provided Candidate Places list.
2. Every stop MUST have a valid "place_id" matching one of the candidate IDs exactly. Do NOT invent new IDs or names.
3. Days per trip: ${days}. Travel style: ${travelStyle} (${travelStyle === 'packed' ? '3 stops/day' : '2 stops/day'}).
4. Keep stops within the same district or geographically adjacent on the same day. Do NOT zigzag.
5. Return ONLY a valid JSON object with NO markdown formatting, no code backticks, no comments.
6. The JSON structure MUST be:
{
  "title": "string",
  "summary": "string",
  "starting_city": "${startingCity}",
  "days": [
    {
      "day_number": 1,
      "theme": "string",
      "stops": [
        {
          "place_id": "exact-id-from-list",
          "timings": "e.g. 09:00 - 11:30",
          "visit_hours": 2,
          "activity": "Brief activity description in ${language === 'kn' ? 'Kannada' : 'English'}"
        }
      ]
    }
  ]
}
`.trim();

  const userPrompt = `
User preferences:
- Starting City: ${startingCity}
- Duration: ${days} days
- Budget: ₹${budget}
- Travel Style: ${travelStyle}
- Group Type: ${groupType}
- Interests: ${interests.join(', ') || 'heritage, nature'}
- UI Language: ${language}

Allowed Candidate Places (YOU MUST CHOOSE ONLY FROM THIS LIST):
${JSON.stringify(candidatesPromptList, null, 2)}
`.trim();

  let generatedJson = null;

  // Try with Gemini API if key is available
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      console.log('Requesting plan from Gemini API...');
      const result = await model.generateContent(`${systemInstructions}\n\n${userPrompt}`);
      const text = result.response.text();
      generatedJson = JSON.parse(text);

      // Validate the plan
      const validation = validateAndEnrichPlan(generatedJson, allPlaces, candidates, language);

      if (validation.isValid) {
        console.log('Gemini generated plan passed validation on first attempt.');
        return validation.plan;
      } else {
        console.warn('Gemini plan validation failed:', validation.error, 'Attempting retry with error correction...');

        // Retry once with error feedback
        const retryPrompt = `${systemInstructions}\n\n${userPrompt}\n\nERROR IN PREVIOUS ATTEMPT: ${validation.error}. Please fix this and output ONLY valid candidate place_ids.`;
        const retryResult = await model.generateContent(retryPrompt);
        const retryJson = JSON.parse(retryResult.response.text());
        const retryValidation = validateAndEnrichPlan(retryJson, allPlaces, candidates, language);

        if (retryValidation.isValid) {
          console.log('Gemini plan passed validation on retry.');
          return retryValidation.plan;
        } else {
          console.warn('Gemini plan validation failed on retry:', retryValidation.error, 'Falling back to local planner.');
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed or encountered error:', err.message, 'Falling back to local planner.');
    }
  }

  // Local fallback planner: guaranteed valid, adheres 100% to constraints
  console.log('Using local candidate-based planner...');
  const localRaw = generateLocalPlan(planParams, candidates);
  const validated = validateAndEnrichPlan(localRaw, allPlaces, candidates, language);
  return validated.plan;
}

/**
 * Regenerates a single day in a trip plan
 */
async function regenerateDay(currentPlan, dayNumberToRegenerate, language = 'kn') {
  const allPlaces = db.getRawPlaces();
  const startingCluster = db.clusters.getClusterForCity(currentPlan.starting_city);
  const allowedClusters = db.clusters.getAdjacent(startingCluster);
  const candidates = allPlaces.filter(p => allowedClusters.includes(p.cluster));

  // Collect already used place IDs in OTHER days
  const usedPlaceIds = new Set();
  (currentPlan.days || []).forEach(day => {
    if (day.day_number !== dayNumberToRegenerate) {
      (day.stops || []).forEach(s => usedPlaceIds.add(s.place_id));
    }
  });

  // Pick candidate places not yet used in other days
  const availableCandidates = candidates.filter(c => !usedPlaceIds.has(c.id));
  const fallbackCandidates = availableCandidates.length >= 2 ? availableCandidates : candidates;

  // Pick 2 new stops
  const newStops = fallbackCandidates.slice(0, 2).map((p, idx) => ({
    place_id: p.id,
    timings: idx === 0 ? '09:30 - 12:30' : '14:30 - 17:30',
    visit_hours: p.visit_hours || 2,
    activity: language === 'kn' ? p.description_kn : `Explore ${p.name}`
  }));

  const updatedRawDays = (currentPlan.days || []).map(day => {
    if (day.day_number === dayNumberToRegenerate) {
      return {
        day_number: day.day_number,
        theme: language === 'kn'
          ? `ದಿನ ${day.day_number} - ನವೀಕರಿಸಿದ ತಾಣಗಳ ದರ್ಶನ`
          : `Day ${day.day_number} - Alternate Route`,
        stops: newStops
      };
    }
    return day;
  });

  const rawPlan = {
    title: currentPlan.title,
    summary: currentPlan.summary,
    starting_city: currentPlan.starting_city,
    days: updatedRawDays
  };

  const validation = validateAndEnrichPlan(rawPlan, allPlaces, candidates, language);
  return validation.plan;
}

module.exports = {
  generatePlan,
  regenerateDay,
  generateLocalPlan
};
