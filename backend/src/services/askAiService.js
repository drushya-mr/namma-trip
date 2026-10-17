// Grounded Ask-AI Service
// Enforces strict database grounding, badge statuses, no hallucinated fees/timings, and source citations

const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const db = require('../data/db');

let genAI = null;
if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  } catch (e) {
    console.warn('Failed to initialize GoogleGenerativeAI in askAiService:', e.message);
  }
}

function containsKannada(text = '') {
  return /[\u0C80-\u0CFF]/.test(text);
}

/**
 * Deterministic grounded answer generator when Gemini API is unavailable or for testing
 */
function generateGroundedAnswer(place, communityAnswers, question, replyLanguage) {
  const qLower = question.toLowerCase();
  const isAskingPrice = qLower.includes('price') || qLower.includes('fee') || qLower.includes('ticket') ||
                        qLower.includes('cost') || qLower.includes('ಶುಲ್ಕ') || qLower.includes('ದರ') || qLower.includes('ಖರ್ಚು') || qLower.includes('ಎಷ್ಟು');
  const isAskingTimings = qLower.includes('time') || qLower.includes('timing') || qLower.includes('open') ||
                          qLower.includes('close') || qLower.includes('ಸಮಯ') || qLower.includes('ತೆರೆಯ') || qLower.includes('ಮುಚ್ಚ');
  const isAskingBestTime = qLower.includes('best time') || qLower.includes('when to visit') || qLower.includes('month') ||
                           qLower.includes('ತಿಂಗಳು') || qLower.includes('ಯಾವಾಗ');

  const sources = [];
  if (place.source_hint) sources.push(place.source_hint);
  if (place.source_url) sources.push(place.source_url);

  let answerText = '';

  if (replyLanguage === 'kn') {
    if (isAskingPrice) {
      if (place.fee_inr === 0) {
        answerText += `${place.name_kn}ಗೆ ಪ್ರವೇಶ ಉಚಿತವಾಗಿದೆ (₹0).\n`;
      } else if (place.fee_inr !== null) {
        answerText += `${place.name_kn}ಗೆ ಅಧಿಕೃತ ಪ್ರವೇಶ ಶುಲ್ಕ ₹${place.fee_inr} ಆಗಿದೆ (${place.fee_text || ''}).\n`;
      } else {
        answerText += `${place.name_kn} ಪ್ರವೇಶ ಶುಲ್ಕವನ್ನು ಅಧಿಕೃತವಾಗಿ ದೃಢಪಡಿಸಲಾಗಿಲ್ಲ (ದರ ಅನಿಶ್ಚಿತ ಅಥವಾ ಪರಸ್ಪರ ವಿರೋಧಾತ್ಮಕ ಮಾಹಿತಿಯಿದೆ: ${place.fee_text || 'ಲಭ್ಯವಿಲ್ಲ'}).\n`;
      }

      if (place.verified_on) {
        answerText += `ಗಮನಿಸಿ: ಈ ಶುಲ್ಕ ಮಾಹಿತಿಯನ್ನು ${place.verified_on.split(' ')[0]} ರಂದು ಅಧಿಕೃತ ಆನ್‌ಲೈನ್ ಮೂಲದಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.`;
      } else {
        answerText += `ಎಚ್ಚರಿಕೆ: ಈ ಸ್ಥಳದ ಶುಲ್ಕವನ್ನು ಇತ್ತೀಚೆಗೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ. ಪ್ರಯಾಣಿಸುವ ಮುನ್ನ ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಮೂಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಪರಿಶೀಲಿಸಿ.`;
      }
    } else if (isAskingTimings) {
      answerText += `${place.name_kn} ಭೇಟಿ ಸಮಯ: ${place.timings || 'ಸ್ಥಳೀಯವಾಗಿ ಪರಿಶೀಲಿಸಿ'}.\n`;
      if (place.visit_hours) {
        answerText += `ಸೂಚಿಸಿದ ಭೇಟಿ ಅವಧಿ: ಸುಮಾರು ${place.visit_hours} ಗಂಟೆಗಳು.\n`;
      }
      if (!place.verified_on) {
        answerText += `ಸಮಯಗಳು ಬದಲಾಗುವ ಸಾಧ್ಯತೆ ಇರುವುದರಿಂದ ಭೇಟಿ ನೀಡುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.`;
      }
    } else if (isAskingBestTime) {
      answerText += `${place.name_kn} ಭೇಟಿಗೆ ಅತ್ಯುತ್ತಮ ತಿಂಗಳುಗಳು: ${place.best_months || 'ಅಕ್ಟೋಬರ್‌ನಿಂದ ಫೆಬ್ರವರಿ'}.\n`;
      if (place.notes) {
        answerText += `ವಿವರ: ${place.description_kn || place.notes}\n`;
      }
    } else {
      // General overview
      answerText += `${place.name_kn} (${place.district} ಜಿಲ್ಲೆ): ${place.description_kn || place.name}.\n`;
      answerText += `ವರ್ಗ: ${place.category}.\n`;
      answerText += `ಪ್ರವೇಶ ಶುಲ್ಕ: ${place.fee_inr !== null ? '₹' + place.fee_inr : 'ದೃಢಪಟ್ಟಿಲ್ಲ (ಪರಿಶೀಲಿಸಿ)'}.\n`;
      answerText += `ಸಮಯ: ${place.timings || 'ಸ್ಥಳೀಯವಾಗಿ ವಿಚಾರಿಸಿ'}.\n`;
      if (place.notes) answerText += `ಟಿಪ್ಪಣಿ: ${place.notes}\n`;
    }

    if (communityAnswers.length > 0) {
      const topAnswer = communityAnswers[0];
      answerText += `\n\nಸಮುದಾಯದ ಅನುಭವ (${topAnswer.user?.display_name || 'ಪ್ರವಾಸಿಗ'}): "${topAnswer.answer_text}" (ಗಮನಿಸಿ: ಇದು ಸಮುದಾಯದ ಅನಧಿಕೃತ ಅಭಿಪ್ರಾಯ).`;
    }
  } else {
    // English response
    if (isAskingPrice) {
      if (place.fee_inr === 0) {
        answerText += `Entry to ${place.name} is free (₹0).\n`;
      } else if (place.fee_inr !== null) {
        answerText += `The entry fee for ${place.name} is ₹${place.fee_inr} (${place.fee_text || ''}).\n`;
      } else {
        answerText += `The entry fee for ${place.name} is NOT confirmed (${place.fee_text || 'unverified or conflicting data in official records'}).\n`;
      }

      if (place.verified_on) {
        answerText += `Note: Verified on ${place.verified_on.split(' ')[0]} via official sources.`;
      } else {
        answerText += `Caution: This fee has not been recently verified online. Please verify with official authorities before travelling.`;
      }
    } else if (isAskingTimings) {
      answerText += `Timings for ${place.name}: ${place.timings || 'Check locally'}.\n`;
      if (place.visit_hours) {
        answerText += `Suggested visit duration: ~${place.visit_hours} hours.\n`;
      }
      if (!place.verified_on) {
        answerText += `Gate hours may fluctuate; please confirm prior to visit.`;
      }
    } else if (isAskingBestTime) {
      answerText += `Best months to visit ${place.name}: ${place.best_months || 'October to February'}.\n`;
      if (place.notes) {
        answerText += `Additional info: ${place.notes}\n`;
      }
    } else {
      answerText += `${place.name} is located in ${place.district} district (${place.category}).\n`;
      answerText += `Entry fee: ${place.fee_inr !== null ? '₹' + place.fee_inr : 'Not confirmed (verify before travel)'}.\n`;
      answerText += `Timings: ${place.timings || 'Check locally'}.\n`;
      if (place.notes) answerText += `Note: ${place.notes}\n`;
    }

    if (communityAnswers.length > 0) {
      const topAnswer = communityAnswers[0];
      answerText += `\n\nCommunity Insight (${topAnswer.user?.display_name || 'Traveller'}): "${topAnswer.answer_text}" (Notice: Community answer, not official).`;
    }
  }

  return {
    answer: answerText.trim(),
    sources: sources.filter(Boolean),
    verified_on: place.verified_on || null,
    is_verified: !!place.verified_on,
    source_url: place.source_url || null
  };
}

/**
 * Answers a question about a place with strict grounding
 */
async function answerPlaceQuestion({ placeId, question, language = 'kn' }) {
  const place = db.places.getById(placeId);
  if (!place) {
    throw new Error(`Place with id "${placeId}" not found`);
  }

  // Fetch approved community answers
  const qList = db.questions.getByPlace(placeId);
  const communityAnswers = [];
  qList.forEach(q => {
    q.answers.forEach(a => {
      if (a.is_accepted || a.votes_count > 0) {
        communityAnswers.push(a);
      }
    });
  });

  // Decide reply language: if question contains Kannada script, answer in Kannada regardless of UI setting
  const replyLanguage = containsKannada(question) ? 'kn' : language;

  // If Gemini API is available, formulate grounded prompt
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are the AI assistant for "Namma Trip" (Kannada Digital Innovation Hackathon 2026).
Your job is to answer the user's question about the place: "${place.name}" (${place.name_kn}).

STRICT GROUNDING RULES:
1. You MUST answer using ONLY the factual database record and approved community answers provided below.
2. NEVER INVENT, ESTIMATE OR GUESS prices, fees, or timings.
3. If fee_inr is null or unknown, state explicitly that the fee is NOT confirmed. Mention fee_text if available. Tell the user to verify before travel.
4. If verified_on is present, state that it was verified on that date. If verified_on is null, you MUST state "Verify before travel" and caution the user.
5. If source_url is present, cite it.
6. Reply in ${replyLanguage === 'kn' ? 'natural, friendly Kannada (ಕನ್ನಡ)' : 'friendly, concise English'}.
7. Label any community answers explicitly as "community answer, not official".

DATABASE RECORD FOR THIS PLACE:
${JSON.stringify({
  name: place.name,
  name_kn: place.name_kn,
  district: place.district,
  category: place.category,
  fee_inr: place.fee_inr,
  fee_text: place.fee_text,
  fee_status: place.fee_status,
  timings: place.timings,
  visit_hours: place.visit_hours,
  best_months: place.best_months,
  verified_on: place.verified_on,
  source_hint: place.source_hint,
  source_url: place.source_url,
  notes: place.notes,
  description_kn: place.description_kn
}, null, 2)}

APPROVED COMMUNITY ANSWERS:
${JSON.stringify(communityAnswers.map(a => ({ author: a.user?.display_name, answer: a.answer_text })), null, 2)}

USER QUESTION:
"${question}"
`.trim();

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const sources = [];
      if (place.source_hint) sources.push(place.source_hint);
      if (place.source_url) sources.push(place.source_url);

      return {
        answer: text.trim(),
        sources: sources.filter(Boolean),
        verified_on: place.verified_on || null,
        is_verified: !!place.verified_on,
        source_url: place.source_url || null
      };
    } catch (e) {
      console.warn('Gemini grounded QA failed:', e.message, 'Falling back to deterministic grounded engine.');
    }
  }

  // Fallback deterministic grounded answer
  return generateGroundedAnswer(place, communityAnswers, question, replyLanguage);
}

module.exports = {
  answerPlaceQuestion,
  generateGroundedAnswer,
  containsKannada
};
