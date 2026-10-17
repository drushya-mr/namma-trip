// Text validation, profanity moderation, and social handle normalizer

const PROFANITY_LIST = [
  'abuse', 'fraud', 'scam', 'hate', 'badword', 'offensive'
];

function validateContent(text, { minLength = 2, maxLength = 2000, fieldName = 'Text' } = {}) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  const trimmed = text.trim();
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
  }

  const lower = trimmed.toLowerCase();
  for (const word of PROFANITY_LIST) {
    if (lower.includes(word)) {
      return { valid: false, error: `Content contains inappropriate language` };
    }
  }

  return { valid: true, text: trimmed };
}

/**
 * Normalizes social media handles into full, safe URLs
 */
function normalizeSocialLinks({ instagram, youtube, x, facebook, website }) {
  const cleanHandle = (val) => (val || '').trim().replace(/^@/, '');

  let igUrl = null;
  const ig = cleanHandle(instagram);
  if (ig) {
    igUrl = ig.startsWith('http') ? ig : `https://instagram.com/${ig}`;
  }

  let ytUrl = null;
  const yt = cleanHandle(youtube);
  if (yt) {
    ytUrl = yt.startsWith('http') ? yt : `https://youtube.com/@${yt}`;
  }

  let xUrl = null;
  const xH = cleanHandle(x);
  if (xH) {
    xUrl = xH.startsWith('http') ? xH : `https://x.com/${xH}`;
  }

  let fbUrl = null;
  const fb = cleanHandle(facebook);
  if (fb) {
    fbUrl = fb.startsWith('http') ? fb : `https://facebook.com/${fb}`;
  }

  let webUrl = null;
  if (website && website.trim()) {
    const w = website.trim();
    webUrl = /^https?:\/\//i.test(w) ? w : `https://${w}`;
  }

  return {
    instagram_url: igUrl,
    youtube_url: ytUrl,
    x_url: xUrl,
    facebook_url: fbUrl,
    website_url: webUrl
  };
}

module.exports = {
  validateContent,
  normalizeSocialLinks
};
