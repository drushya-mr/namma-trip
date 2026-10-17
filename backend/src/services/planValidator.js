// Plan Validation and Enrichment Service
// Enforces strict adherence to database places, verified badges, fee rules, and Kannada phrases

const KANNADA_DESTINATION_PHRASES = {
  temple: {
    phrase_kn: 'ದೇವಾಲಯದ ದರ್ಶನದ ಸಮಯ ಯಾವುದು?',
    phrase_en: 'What is the temple darshan timing?',
    transliteration: 'Devaalayada darshanada samaya yaavudu?'
  },
  heritage: {
    phrase_kn: 'ಈ ಸ್ಮಾರಕದ ಇತಿಹಾಸವನ್ನು ತಿಳಿಸುವಿರಾ?',
    phrase_en: 'Could you tell me the history of this monument?',
    transliteration: 'Ee smaarakada itihaasavannu tilisuviraa?'
  },
  palace: {
    phrase_kn: 'ಅರಮನೆಯ ಪ್ರವೇಶ ದ್ವಾರ ಎಲ್ಲಿದೆ?',
    phrase_en: 'Where is the palace entrance gate?',
    transliteration: 'Aramaneya pravesha dvaara ellide?'
  },
  beach: {
    phrase_kn: 'ಇಲ್ಲಿ ಸೂರ್ಯಾಸ್ತ ವೀಕ್ಷಣೆಗೆ ಅತ್ಯುತ್ತಮ ಸಮಯ ಯಾವುದು?',
    phrase_en: 'What is the best time for sunset viewing here?',
    transliteration: 'Illi sooryaasta veekshanege atyuttama samaya yaavudu?'
  },
  waterfall: {
    phrase_kn: 'ಜಲಪಾತದ ಹತ್ತಿರ ಹೋಗಲು ಸುರಕ್ಷಿತವೇ?',
    phrase_en: 'Is it safe to go near the waterfall?',
    transliteration: 'Jalapaatada hattira hoogalu surakshitave?'
  },
  hills: {
    phrase_kn: 'ಬೆಟ್ಟ ಹತ್ತಲು ಎಷ್ಟು ಸಮಯ ಬೇಕಾಗುತ್ತದೆ?',
    phrase_en: 'How much time does it take to climb the hill?',
    transliteration: 'Betta hattalu eshtu samaya bekaaguttade?'
  },
  garden: {
    phrase_kn: 'ಉದ್ಯಾನವನದ ವಾಕಿಂಗ್ ಟ್ರ್ಯಾಕ್ ಎಲ್ಲಿದೆ?',
    phrase_en: 'Where is the garden walking track?',
    transliteration: 'Udyaanavanada walking track ellide?'
  },
  default: {
    phrase_kn: 'ಇಲ್ಲಿಗೆ ಹೋಗುವ ದಾರಿ ಯಾವುದು?',
    phrase_en: 'Which way goes to this place?',
    transliteration: 'Illige hooguva daari yaavudu?'
  }
};

function getCategoryPhrase(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('temple') || cat.includes('math') || cat.includes('shrine')) return KANNADA_DESTINATION_PHRASES.temple;
  if (cat.includes('palace')) return KANNADA_DESTINATION_PHRASES.palace;
  if (cat.includes('heritage') || cat.includes('fort') || cat.includes('unesco') || cat.includes('caves')) return KANNADA_DESTINATION_PHRASES.heritage;
  if (cat.includes('beach') || cat.includes('island')) return KANNADA_DESTINATION_PHRASES.beach;
  if (cat.includes('waterfall') || cat.includes('falls')) return KANNADA_DESTINATION_PHRASES.waterfall;
  if (cat.includes('hill') || cat.includes('trek') || cat.includes('peak')) return KANNADA_DESTINATION_PHRASES.hills;
  if (cat.includes('garden') || cat.includes('lake') || cat.includes('park')) return KANNADA_DESTINATION_PHRASES.garden;
  return KANNADA_DESTINATION_PHRASES.default;
}

// Distance approximation in km using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function estimateTravelTimeMinutes(distKm) {
  if (distKm === null) return 45; // Default average within cluster
  if (distKm <= 10) return 20;
  if (distKm <= 30) return 45;
  if (distKm <= 60) return 75;
  return Math.round(distKm * 1.5);
}

/**
 * Validates and enriches a generated itinerary plan
 * @param {Object} rawPlan - The JSON returned by LLM or generator
 * @param {Array} allPlaces - Full places array from database
 * @param {Array} candidatePlaces - Allowed candidate places
 * @param {string} language - 'kn' or 'en'
 * @returns {Object} { isValid: boolean, error: string, plan: Object }
 */
function validateAndEnrichPlan(rawPlan, allPlaces, candidatePlaces, language = 'kn') {
  if (!rawPlan || !Array.isArray(rawPlan.days) || rawPlan.days.length === 0) {
    return { isValid: false, error: 'Plan must contain a non-empty days array' };
  }

  const placesMap = new Map(allPlaces.map(p => [p.id, p]));
  const candidateIds = new Set(candidatePlaces.map(p => p.id));

  let totalEstimatedFees = 0;
  let hasAnyUnverifiedFees = false;
  const enrichedDays = [];

  for (let dIdx = 0; dIdx < rawPlan.days.length; dIdx++) {
    const rawDay = rawPlan.days[dIdx];
    const dayNumber = rawDay.day_number || (dIdx + 1);

    if (!Array.isArray(rawDay.stops) || rawDay.stops.length === 0) {
      return { isValid: false, error: `Day ${dayNumber} has no stops` };
    }

    let dayFees = 0;
    let dayHasUnverified = false;
    const enrichedStops = [];

    for (let sIdx = 0; sIdx < rawDay.stops.length; sIdx++) {
      const stop = rawDay.stops[sIdx];
      const placeId = stop.place_id;

      if (!placeId) {
        return { isValid: false, error: `Stop ${sIdx + 1} on Day ${dayNumber} is missing place_id` };
      }

      const placeRecord = placesMap.get(placeId);
      if (!placeRecord) {
        return {
          isValid: false,
          error: `Invalid place_id: "${placeId}" does not exist in the database`
        };
      }

      if (!candidateIds.has(placeId)) {
        return {
          isValid: false,
          error: `Place "${placeId}" is not in the allowed geographic clusters for this trip`
        };
      }

      // Check fee status according to rules:
      // fee_inr is numeric (0 = free, null = unknown)
      const isFeeConfirmed = placeRecord.fee_inr !== null;
      if (isFeeConfirmed) {
        dayFees += Number(placeRecord.fee_inr);
      } else {
        dayHasUnverified = true;
        hasAnyUnverifiedFees = true;
      }

      // Travel time to next stop
      let travelTimeToNext = null;
      let distToNext = null;
      if (sIdx < rawDay.stops.length - 1) {
        const nextStopPlace = placesMap.get(rawDay.stops[sIdx + 1].place_id);
        if (nextStopPlace && placeRecord.lat && placeRecord.lng && nextStopPlace.lat && nextStopPlace.lng) {
          distToNext = calculateDistance(placeRecord.lat, placeRecord.lng, nextStopPlace.lat, nextStopPlace.lng);
        }
        travelTimeToNext = stop.travel_time_mins || estimateTravelTimeMinutes(distToNext);
      }

      // Authentic Kannada phrase for destination
      const destinationPhrase = getCategoryPhrase(placeRecord.category);

      // Verified badge status:
      // Only 12 places have verified_on set. For those, green "Verified on <date>" badge.
      // All others: amber "Verify before travel" badge.
      const isVerified = !!placeRecord.verified_on;
      const verificationBadge = isVerified
        ? {
            status: 'verified',
            color: 'green',
            label_en: `Verified on ${placeRecord.verified_on.split(' ')[0]}`,
            label_kn: `${placeRecord.verified_on.split(' ')[0]} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ`
          }
        : {
            status: 'unverified',
            color: 'amber',
            label_en: 'Verify before travel',
            label_kn: 'ಪ್ರಯಾಣಿಸುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ'
          };

      enrichedStops.push({
        place_id: placeRecord.id,
        name: placeRecord.name,
        name_kn: placeRecord.name_kn,
        category: placeRecord.category,
        district: placeRecord.district,
        cluster: placeRecord.cluster,
        lat: placeRecord.lat,
        lng: placeRecord.lng,
        timings: stop.timings || placeRecord.timings,
        visit_hours: placeRecord.visit_hours || stop.visit_hours || 2,
        fee_inr: placeRecord.fee_inr,
        fee_text: placeRecord.fee_text,
        fee_status: placeRecord.fee_status,
        verified_on: placeRecord.verified_on,
        verificationBadge,
        source_hint: placeRecord.source_hint,
        source_url: placeRecord.source_url,
        notes: stop.activity || stop.notes || (language === 'kn' ? placeRecord.description_kn : placeRecord.notes),
        phrase: destinationPhrase,
        travel_time_to_next_mins: travelTimeToNext,
        dist_to_next_km: distToNext
      });
    }

    totalEstimatedFees += dayFees;

    enrichedDays.push({
      day_number: dayNumber,
      theme: rawDay.theme || (language === 'kn' ? `ದಿನ ${dayNumber} - ${enrichedStops[0].district} ದರ್ಶನ` : `Day ${dayNumber} - ${enrichedStops[0].district} Exploration`),
      stops: enrichedStops,
      day_fees_inr: dayFees,
      has_unverified_fees: dayHasUnverified
    });
  }

  const budgetNote = hasAnyUnverifiedFees
    ? (language === 'kn' ? 'ಕನಿಷ್ಠ ಅಂದಾಜು; ಕೆಲವು ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ದೃಢಪಟ್ಟಿಲ್ಲ' : 'minimum estimate; some fees unconfirmed')
    : (language === 'kn' ? 'ದೃಢಪಟ್ಟ ಪ್ರವೇಶ ಶುಲ್ಕ ಅಂದಾಜು' : 'confirmed fee estimate');

  return {
    isValid: true,
    plan: {
      title: rawPlan.title || (language === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಯೋಜನೆ' : 'Karnataka Exploration Plan'),
      summary: rawPlan.summary || (language === 'kn' ? 'ಕರುನಾಡಿನ ಸುಂದರ ತಾಣಗಳ ಸಂಪೂರ್ಣ ಪ್ರವಾಸ ಯೋಜನೆ.' : 'A curated day-by-day travel plan across Karnataka.'),
      starting_city: rawPlan.starting_city,
      days: enrichedDays,
      total_days: enrichedDays.length,
      budget_breakdown: {
        total_entry_fees_inr: totalEstimatedFees,
        has_unverified_fees: hasAnyUnverifiedFees,
        budget_note: budgetNote,
        estimated_daily_travel_inr: 500 * enrichedDays.length,
        estimated_daily_food_inr: 600 * enrichedDays.length
      }
    }
  };
}

module.exports = {
  validateAndEnrichPlan,
  getCategoryPhrase,
  calculateDistance,
  estimateTravelTimeMinutes
};
