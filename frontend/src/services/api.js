const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchJson(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Places
  getPlaces: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/places${query ? `?${query}` : ''}`);
  },
  getPlaceById: (id) => fetchJson(`/places/${id}`),

  // Plan
  generatePlan: (planParams) => fetchJson('/plan', {
    method: 'POST',
    body: JSON.stringify(planParams)
  }),
  regenerateDay: ({ plan, dayNumber, language }) => fetchJson('/plan/regenerate-day', {
    method: 'POST',
    body: JSON.stringify({ plan, dayNumber, language })
  }),
  saveTrip: (plan, userId) => fetchJson('/plan/save', {
    method: 'POST',
    body: JSON.stringify({ plan, userId })
  }),
  getTripById: (id) => fetchJson(`/plan/${id}`),

  // Feed & Posts
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/feed${query ? `?${query}` : ''}`);
  },
  getPostById: (id, currentUserId) => fetchJson(`/posts/${id}${currentUserId ? `?currentUserId=${currentUserId}` : ''}`),
  createPost: (postData) => fetchJson('/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }),
  toggleLike: (postId, userId) => fetchJson(`/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  toggleSave: (postId, userId) => fetchJson(`/posts/${postId}/save`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  addComment: (postId, userId, text) => fetchJson(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userId, text })
  }),

  // Ask AI & Community Q&A
  askAi: (placeId, question, language) => fetchJson('/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ placeId, question, language })
  }),
  getQuestions: (placeId) => fetchJson(`/questions?place_id=${placeId}`),
  askQuestion: (placeId, question_text, userId) => fetchJson('/questions', {
    method: 'POST',
    body: JSON.stringify({ place_id: placeId, question_text, userId })
  }),
  answerQuestion: (questionId, answer_text, userId) => fetchJson(`/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answer_text, userId })
  }),
  voteAnswer: (answerId, userId, vote) => fetchJson(`/questions/answers/${answerId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ userId, vote })
  }),
  acceptAnswer: (questionId, answerId, userId) => fetchJson(`/questions/${questionId}/accept-answer`, {
    method: 'POST',
    body: JSON.stringify({ answerId, userId })
  }),

  // Translation
  translateText: (text, targetLang) => fetchJson('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, targetLang })
  }),

  // Profile
  getDemoProfile: () => fetchJson('/profile/demo'),
  getProfile: (userId) => fetchJson(`/profile/${userId}`),
  updateProfile: (profileData) => fetchJson('/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  }),

  // Notifications
  getNotifications: (userId) => fetchJson(`/notifications${userId ? `?userId=${userId}` : ''}`),
  markNotificationRead: (id) => fetchJson(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Reports
  submitReport: (reportData) => fetchJson('/report', {
    method: 'POST',
    body: JSON.stringify(reportData)
  })
};
