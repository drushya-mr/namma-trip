const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

// Cluster adjacency map based on Karnataka geography
const CLUSTER_ADJACENCY = {
  '1. Bengaluru Belt': ['1. Bengaluru Belt', '2. Old Mysuru & Hoysala Heritage', '9. Central Karnataka'],
  '2. Old Mysuru & Hoysala Heritage': ['2. Old Mysuru & Hoysala Heritage', '1. Bengaluru Belt', '3. Malnad & Coffee Hills', '9. Central Karnataka'],
  '3. Malnad & Coffee Hills': ['3. Malnad & Coffee Hills', '2. Old Mysuru & Hoysala Heritage', '4. Coastal Karnataka', '9. Central Karnataka'],
  '4. Coastal Karnataka': ['4. Coastal Karnataka', '3. Malnad & Coffee Hills', '5. Mumbai-Karnataka (North-West)'],
  '5. Mumbai-Karnataka (North-West)': ['5. Mumbai-Karnataka (North-West)', '4. Coastal Karnataka', '6. Chalukya Heritage & Deccan Sultanate (North)', '9. Central Karnataka'],
  '6. Chalukya Heritage & Deccan Sultanate (North)': ['6. Chalukya Heritage & Deccan Sultanate (North)', '5. Mumbai-Karnataka (North-West)', '7. Kalyana-Karnataka (North-East)', '8. Hampi & Tungabhadra Region'],
  '7. Kalyana-Karnataka (North-East)': ['7. Kalyana-Karnataka (North-East)', '6. Chalukya Heritage & Deccan Sultanate (North)', '8. Hampi & Tungabhadra Region'],
  '8. Hampi & Tungabhadra Region': ['8. Hampi & Tungabhadra Region', '6. Chalukya Heritage & Deccan Sultanate (North)', '7. Kalyana-Karnataka (North-East)', '9. Central Karnataka'],
  '9. Central Karnataka': ['9. Central Karnataka', '1. Bengaluru Belt', '2. Old Mysuru & Hoysala Heritage', '3. Malnad & Coffee Hills', '5. Mumbai-Karnataka (North-West)', '8. Hampi & Tungabhadra Region']
};

// Base city to cluster mapping
const CITY_TO_CLUSTER = {
  'bengaluru': '1. Bengaluru Belt',
  'mysuru': '2. Old Mysuru & Hoysala Heritage',
  'hassan': '2. Old Mysuru & Hoysala Heritage',
  'mandya': '2. Old Mysuru & Hoysala Heritage',
  'chikkamagaluru': '3. Malnad & Coffee Hills',
  'madikeri': '3. Malnad & Coffee Hills',
  'kodagu': '3. Malnad & Coffee Hills',
  'shivamogga': '3. Malnad & Coffee Hills',
  'mangaluru': '4. Coastal Karnataka',
  'udupi': '4. Coastal Karnataka',
  'gokarna': '4. Coastal Karnataka',
  'karwar': '4. Coastal Karnataka',
  'hubballi': '5. Mumbai-Karnataka (North-West)',
  'hubballi-dharwad': '5. Mumbai-Karnataka (North-West)',
  'dharwad': '5. Mumbai-Karnataka (North-West)',
  'belagavi': '5. Mumbai-Karnataka (North-West)',
  'gadag': '5. Mumbai-Karnataka (North-West)',
  'haveri': '5. Mumbai-Karnataka (North-West)',
  'badami': '6. Chalukya Heritage & Deccan Sultanate (North)',
  'vijayapura': '6. Chalukya Heritage & Deccan Sultanate (North)',
  'bagalkote': '6. Chalukya Heritage & Deccan Sultanate (North)',
  'kalaburagi': '7. Kalyana-Karnataka (North-East)',
  'bidar': '7. Kalyana-Karnataka (North-East)',
  'raichur': '7. Kalyana-Karnataka (North-East)',
  'yadgir': '7. Kalyana-Karnataka (North-East)',
  'hampi': '8. Hampi & Tungabhadra Region',
  'hosapete': '8. Hampi & Tungabhadra Region',
  'ballari': '8. Hampi & Tungabhadra Region',
  'koppal': '8. Hampi & Tungabhadra Region',
  'davanagere': '9. Central Karnataka',
  'chitradurga': '9. Central Karnataka'
};

// Load places seed data
const findDatabaseFile = (filename) => {
  const candidate1 = path.join(__dirname, '..', '..', '..', 'database', filename);
  const candidate2 = path.join(__dirname, '..', '..', 'database', filename);
  const candidate3 = path.join(process.cwd(), 'database', filename);
  if (fs.existsSync(candidate1)) return candidate1;
  if (fs.existsSync(candidate2)) return candidate2;
  if (fs.existsSync(candidate3)) return candidate3;
  return candidate1;
};

const placesCombinedFile = findDatabaseFile('places_combined.json');
let places = [];

try {
  places = JSON.parse(fs.readFileSync(placesCombinedFile, 'utf8'));
} catch (e) {
  const seedPath = findDatabaseFile('places_seed.json');
  const knPath = findDatabaseFile('places_kn.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const kn = JSON.parse(fs.readFileSync(knPath, 'utf8'));
  places = seed.map(p => ({
    ...p,
    name_kn: (kn[p.id] && kn[p.id].name_kn) || p.name,
    description_kn: (kn[p.id] && kn[p.id].description_kn) || `${p.name} - ${p.category}`,
    machine_translated: true,
    reviewed: false
  }));
}

// In-Memory store for app data (supports full offline functionality and Supabase sync)
const store = {
  profiles: [
    {
      id: 'demo-user-id',
      username: 'kannada_traveller',
      display_name: 'ಪುನೀತ್ ಗೌಡ (Puneeth Gowda)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'ಕರುನಾಡಿನ ಮೂಲೆ ಮೂಲೆಯನ್ನೂ ಅನ್ವೇಷಿಸುವ ಪ್ರವಾಸಿಗ | Exploring every corner of Karnataka 💛❤️',
      home_city: 'Bengaluru',
      preferred_language: 'kn',
      instagram_handle: 'puneeth_travels_ka',
      youtube_handle: 'PuneethKarnatakaVlogs',
      x_handle: 'puneeth_ka',
      facebook_handle: '',
      website_url: 'https://karnatakatourism.org',
      show_social_links: true,
      created_at: new Date('2026-01-01').toISOString()
    },
    {
      id: 'user-ananya-id',
      username: 'ananya_hegde',
      display_name: 'ಅನನ್ಯ ಹೆಗಡೆ (Ananya Hegde)',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      bio: 'ಮಲೆನಾಡಿನ ಹುಡುಗಿ. ಪಶ್ಚಿಮ ಘಟ್ಟಗಳ ಪ್ರೇಮಿ 🌿☕',
      home_city: 'Shivamogga',
      preferred_language: 'kn',
      instagram_handle: 'ananya_malnad',
      youtube_handle: '',
      x_handle: 'ananya_h',
      facebook_handle: '',
      website_url: '',
      show_social_links: true,
      created_at: new Date('2026-02-15').toISOString()
    }
  ],
  posts: [
    {
      id: 'post-1',
      user_id: 'demo-user-id',
      place_id: 'virupaksha-temple-hampi',
      title: 'ಹಂಪಿಯ ಐತಿಹಾಸಿಕ ವಿರೂಪಾಕ್ಷ ಸನ್ನಿಧಿ | Spiritual Dawn at Hampi',
      review_text: 'ಮುಂಜಾನೆಯ ಹೊತ್ತಿನಲ್ಲಿ ಹೇಮಕೂಟ ಬೆಟ್ಟದಿಂದ ಕಂಡ ವಿರೂಪಾಕ್ಷ ದೇವಾಲಯದ ನೋಟ ಅವಿಸ್ಮರಣೀಯ. ಕಲ್ಲಿನ ರಥ ಮತ್ತು ತುಂಗಭದ್ರಾ ನದಿಯ ತಂಗಾಳಿ ಮೈಮನಸ್ಸಿಗೆ ತಂಪು ನೀಡುತ್ತದೆ. ಹಂಪಿಗೆ ಅಕ್ಟೋಬರ್‌ನಿಂದ ಫೆಬ್ರವರಿ ತಿಂಗಳು ಅತ್ಯುತ್ತಮ ಸಮಯ.',
      rating: 5,
      month_visited: 'January 2026',
      spend_inr: 1200,
      likes_count: 142,
      saves_count: 58,
      comments_count: 12,
      photos: [
        'https://images.unsplash.com/photo-1600100397608-f010e421e42e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: new Date('2026-10-10T09:30:00Z').toISOString()
    },
    {
      id: 'post-2',
      user_id: 'user-ananya-id',
      place_id: 'mullayanagiri',
      title: 'ಮುಳ್ಳಯ್ಯನಗಿರಿ ಚಾರಣ | Touching Clouds at Mullayanagiri',
      review_text: 'ಕರ್ನಾಟಕದ ಅತ್ಯುನ್ನತ ಶಿಖರ ಮುಳ್ಳಯ್ಯನಗಿರಿ ತಲುಪಿದಾಗ ಸಿಗುವ ಆನಂದವೇ ಬೇರೆ! ಬೆಳಿಗ್ಗೆ 6 ಗಂಟೆಗೆ ಹೋದರೆ ಮೋಡಗಳ ಸಮುದ್ರ ಕಾಣಿಸುತ್ತದೆ. ಹಸಿರು ಕಣಿವೆ ಮತ್ತು ತಂಪಾದ ಗಾಳಿ ನಿಮ್ಮನ್ನು ಮಂತ್ರಮುಗ್ಧರನ್ನಾಗಿಸುತ್ತದೆ.',
      rating: 5,
      month_visited: 'September 2026',
      spend_inr: 800,
      likes_count: 98,
      saves_count: 41,
      comments_count: 7,
      photos: [
        'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: new Date('2026-10-12T14:15:00Z').toISOString()
    },
    {
      id: 'post-3',
      user_id: 'demo-user-id',
      place_id: 'gokarna-mahabaleshwar-temple-beaches',
      title: 'ಗೋಕರ್ಣದ ಓಂ ಬೀಚ್ ಮತ್ತು ಪ್ರಶಾಂತ ಸಂಜೆ',
      review_text: 'ಕಡಲ ಅಲೆಗಳ ಸದ್ದು ಮತ್ತು ಅದ್ಭುತ ಸೂರ್ಯಾಸ್ತ. ಗೋಕರ್ಣದಲ್ಲಿ ದೈವಿಕ ಭಕ್ತಿ ಮತ್ತು ನಿಸರ್ಗದ ಸೌಂದರ್ಯ ಎರಡೂ ಒಟ್ಟಿಗೆ ದೊರೆಯುತ್ತದೆ. ಕುಡ್ಲೆ ಬೀಚ್ ನಡಿಗೆ ತಪ್ಪಿಸಬೇಡಿ!',
      rating: 5,
      month_visited: 'August 2026',
      spend_inr: 2500,
      likes_count: 184,
      saves_count: 76,
      comments_count: 19,
      photos: [
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: new Date('2026-10-14T17:45:00Z').toISOString()
    }
  ],
  likes: {
    'demo-user-id_post-1': true,
    'demo-user-id_post-2': true
  },
  saves: {
    'demo-user-id_post-1': true
  },
  comments: [
    {
      id: 'c-1',
      post_id: 'post-1',
      user_id: 'user-ananya-id',
      text: 'ತುಂಬಾ ಅದ್ಭುತ ಫೋಟೋಗಳು! ಸೈಕಲ್ ಬಾಡಿಗೆಗೆ ಸಿಗುತ್ತದೆಯೇ ಹಂಪಿಯಲ್ಲಿ?',
      created_at: new Date('2026-10-10T11:00:00Z').toISOString()
    },
    {
      id: 'c-2',
      post_id: 'post-1',
      user_id: 'demo-user-id',
      text: 'ಹೌದು, ಕಡಲೆಕಾಳು ಗಣಪತಿ ಬಳಿ ₹150 ಕ್ಕೆ ಇಡೀ ದಿನ ಸೈಕಲ್ ಬಾಡಿಗೆ ಸಿಗುತ್ತದೆ!',
      created_at: new Date('2026-10-10T11:15:00Z').toISOString()
    }
  ],
  follows: {
    'demo-user-id_user-ananya-id': true
  },
  questions: [
    {
      id: 'q-1',
      place_id: 'mysore-palace',
      user_id: 'demo-user-id',
      question_text: 'ದಸರಾ ಸಮಯದಲ್ಲಿ ಅರಮನೆ ಲೈಟಿಂಗ್ ಯಾವ ಸಮಯದಲ್ಲಿ ಇರುತ್ತದೆ? ಪ್ರವೇಶ ದರ ಎಷ್ಟು?',
      accepted_answer_id: 'ans-1',
      created_at: new Date('2026-10-05T10:00:00Z').toISOString()
    },
    {
      id: 'q-2',
      place_id: 'jog-falls',
      user_id: 'user-ananya-id',
      question_text: 'ಮೆಟ್ಟಿಲುಗಳ ಮೂಲಕ ಕೆಳಗೆ ಹೋಗಲು ಅವಕಾಶವಿದೆಯೇ?',
      accepted_answer_id: null,
      created_at: new Date('2026-10-08T12:00:00Z').toISOString()
    }
  ],
  answers: [
    {
      id: 'ans-1',
      question_id: 'q-1',
      user_id: 'user-ananya-id',
      answer_text: 'ಸಾಮಾನ್ಯವಾಗಿ ಭಾನುವಾರ ಮತ್ತು ರಜಾದಿನಗಳಲ್ಲಿ ಸಂಜೆ 7:00 ರಿಂದ 7:45 ರವರೆಗೆ ದೀಪಾಲಂಕಾರ ಇರುತ್ತದೆ. ದಸರಾ ಸಮಯದಲ್ಲಿ ರಾತ್ರಿ 9:00 ರವರೆಗೆ ಇರುತ್ತದೆ. ಪ್ರವೇಶ ಶುಲ್ಕ ₹50-₹100 ವ್ಯತ್ಯಾಸವಾಗುವುದರಿಂದ ಅಧಿಕೃತ ಕೌಂಟರ್‌ನಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ.',
      votes_count: 14,
      is_accepted: true,
      is_community: true,
      created_at: new Date('2026-10-05T12:30:00Z').toISOString()
    },
    {
      id: 'ans-2',
      question_id: 'q-2',
      user_id: 'demo-user-id',
      answer_text: 'ಮಳೆಗಾಲದಲ್ಲಿ ಸುರಕ್ಷತೆಯ ದೃಷ್ಟಿಯಿಂದ ಮೆಟ್ಟಿಲುಗಳನ್ನು ಮುಚ್ಚಿರುತ್ತಾರೆ. ಚಳಿಗಾಲದಲ್ಲಿ ಕೆಲವೊಮ್ಮೆ ಅನುಮತಿ ಇರುತ್ತದೆ. ಸ್ಥಳೀಯ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿಯನ್ನು ವಿಚಾರಿಸಿ.',
      votes_count: 8,
      is_accepted: false,
      is_community: true,
      created_at: new Date('2026-10-08T14:10:00Z').toISOString()
    }
  ],
  answer_votes: {
    'ans-1_demo-user-id': 1
  },
  notifications: [
    {
      id: 'notif-1',
      user_id: 'demo-user-id',
      sender_id: 'user-ananya-id',
      type: 'answer',
      title: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಬಂದಿದೆ',
      message: 'ಅನನ್ಯ ಹೆಗಡೆ ಮೈಸೂರು ಅರಮನೆ ಕುರಿತ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿದ್ದಾರೆ.',
      link_url: '/places/mysore-palace',
      is_read: false,
      created_at: new Date('2026-10-05T12:30:00Z').toISOString()
    }
  ],
  trips: [],
  reports: []
};

// Supabase Client (optional integration if configured)
let supabase = null;
if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY)) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY);
    console.log('Supabase client initialized successfully.');
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e.message);
  }
}

// Database helper functions
const db = {
  places: {
    getAll: (query = {}) => {
      let filtered = [...places];
      const { district, cluster, category, q } = query;

      if (district) {
        const dLower = district.toLowerCase();
        filtered = filtered.filter(p => p.district.toLowerCase() === dLower);
      }
      if (cluster) {
        filtered = filtered.filter(p => p.cluster === cluster || p.cluster.includes(cluster));
      }
      if (category) {
        const cLower = category.toLowerCase();
        filtered = filtered.filter(p => p.category.toLowerCase().includes(cLower));
      }
      if (q) {
        const qLower = q.toLowerCase().trim();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(qLower) ||
          (p.name_kn && p.name_kn.toLowerCase().includes(qLower)) ||
          p.district.toLowerCase().includes(qLower) ||
          p.category.toLowerCase().includes(qLower) ||
          p.base_city.toLowerCase().includes(qLower)
        );
      }
      return filtered;
    },
    getById: (id) => {
      const place = places.find(p => p.id === id);
      if (!place) return null;

      // Add related stats
      const placePosts = store.posts.filter(p => p.place_id === id);
      const avgRating = placePosts.length > 0
        ? (placePosts.reduce((acc, p) => acc + p.rating, 0) / placePosts.length).toFixed(1)
        : null;

      return {
        ...place,
        posts_count: placePosts.length,
        average_rating: avgRating ? parseFloat(avgRating) : null,
        questions_count: store.questions.filter(q => q.place_id === id).length
      };
    },
    getCandidatesForPlanning: (startingCity, allowedClusters = []) => {
      if (allowedClusters.length === 0) {
        const cluster = db.clusters.getClusterForCity(startingCity);
        allowedClusters = CLUSTER_ADJACENCY[cluster] || [cluster];
      }
      return places.filter(p => allowedClusters.includes(p.cluster));
    }
  },

  clusters: {
    getAll: () => Object.keys(CLUSTER_ADJACENCY),
    getAdjacent: (clusterName) => CLUSTER_ADJACENCY[clusterName] || [clusterName],
    getClusterForCity: (city) => {
      if (!city) return '1. Bengaluru Belt';
      const c = city.toLowerCase().trim();
      for (const [key, cluster] of Object.entries(CITY_TO_CLUSTER)) {
        if (c.includes(key)) return cluster;
      }
      return '1. Bengaluru Belt';
    }
  },

  profiles: {
    getById: (id) => store.profiles.find(p => p.id === id) || null,
    getByUsername: (username) => store.profiles.find(p => p.username === username) || null,
    update: (id, updates) => {
      const idx = store.profiles.findIndex(p => p.id === id);
      if (idx === -1) return null;
      store.profiles[idx] = {
        ...store.profiles[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return store.profiles[idx];
    }
  },

  posts: {
    getAll: (options = {}) => {
      const { place_id, user_id, limit = 50, currentUserId = 'demo-user-id' } = options;
      let list = [...store.posts];
      if (place_id) list = list.filter(p => p.place_id === place_id);
      if (user_id) list = list.filter(p => p.user_id === user_id);

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return list.slice(0, limit).map(p => {
        const author = store.profiles.find(u => u.id === p.user_id) || { display_name: 'ಪ್ರವಾಸಿಗ' };
        const place = places.find(pl => pl.id === p.place_id);
        const isLiked = !!store.likes[`${currentUserId}_${p.id}`];
        const isSaved = !!store.saves[`${currentUserId}_${p.id}`];
        const isFollowing = !!store.follows[`${currentUserId}_${p.user_id}`];

        return {
          ...p,
          author,
          place: place ? {
            id: place.id,
            name: place.name,
            name_kn: place.name_kn,
            district: place.district,
            category: place.category
          } : null,
          is_liked: isLiked,
          is_saved: isSaved,
          is_following: isFollowing
        };
      });
    },
    getById: (id, currentUserId = 'demo-user-id') => {
      const post = store.posts.find(p => p.id === id);
      if (!post) return null;
      const author = store.profiles.find(u => u.id === post.user_id);
      const place = places.find(pl => pl.id === post.place_id);
      const comments = store.comments
        .filter(c => c.post_id === id)
        .map(c => ({
          ...c,
          user: store.profiles.find(u => u.id === c.user_id)
        }));

      return {
        ...post,
        author,
        place,
        comments,
        is_liked: !!store.likes[`${currentUserId}_${post.id}`],
        is_saved: !!store.saves[`${currentUserId}_${post.id}`]
      };
    },
    create: (postData) => {
      const newPost = {
        id: `post-${Date.now()}`,
        likes_count: 0,
        saves_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        ...postData
      };
      store.posts.unshift(newPost);
      return newPost;
    },
    toggleLike: (postId, userId = 'demo-user-id') => {
      const post = store.posts.find(p => p.id === postId);
      if (!post) return null;
      const key = `${userId}_${postId}`;
      const alreadyLiked = !!store.likes[key];

      if (alreadyLiked) {
        delete store.likes[key];
        post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
      } else {
        store.likes[key] = true;
        post.likes_count = (post.likes_count || 0) + 1;
      }
      return { liked: !alreadyLiked, likes_count: post.likes_count };
    },
    toggleSave: (postId, userId = 'demo-user-id') => {
      const post = store.posts.find(p => p.id === postId);
      if (!post) return null;
      const key = `${userId}_${postId}`;
      const alreadySaved = !!store.saves[key];

      if (alreadySaved) {
        delete store.saves[key];
        post.saves_count = Math.max(0, (post.saves_count || 1) - 1);
      } else {
        store.saves[key] = true;
        post.saves_count = (post.saves_count || 0) + 1;
      }
      return { saved: !alreadySaved, saves_count: post.saves_count };
    },
    addComment: (postId, userId, text) => {
      const post = store.posts.find(p => p.id === postId);
      if (!post) return null;
      const newComment = {
        id: `c-${Date.now()}`,
        post_id: postId,
        user_id: userId,
        text,
        created_at: new Date().toISOString()
      };
      store.comments.push(newComment);
      post.comments_count = (post.comments_count || 0) + 1;

      // notify author if different user
      if (post.user_id !== userId) {
        db.notifications.create({
          user_id: post.user_id,
          sender_id: userId,
          type: 'comment',
          title: 'ನಿಮ್ಮ ಪೋಸ್ಟ್‌ಗೆ ಕಾಮೆಂಟ್ ಬಂದಿದೆ',
          message: text.slice(0, 50),
          link_url: `/posts/${postId}`
        });
      }

      return {
        ...newComment,
        user: store.profiles.find(u => u.id === userId)
      };
    }
  },

  questions: {
    getByPlace: (placeId) => {
      return store.questions
        .filter(q => q.place_id === placeId)
        .map(q => {
          const user = store.profiles.find(u => u.id === q.user_id);
          const answers = store.answers
            .filter(a => a.question_id === q.id)
            .map(a => ({
              ...a,
              user: store.profiles.find(u => u.id === a.user_id)
            }))
            .sort((a, b) => (b.is_accepted ? 1 : 0) - (a.is_accepted ? 1 : 0) || b.votes_count - a.votes_count);

          return {
            ...q,
            user,
            answers
          };
        });
    },
    create: (data) => {
      const newQ = {
        id: `q-${Date.now()}`,
        accepted_answer_id: null,
        created_at: new Date().toISOString(),
        ...data
      };
      store.questions.unshift(newQ);
      return newQ;
    },
    addAnswer: (questionId, userId, answerText) => {
      const q = store.questions.find(item => item.id === questionId);
      if (!q) return null;
      const newAns = {
        id: `ans-${Date.now()}`,
        question_id: questionId,
        user_id: userId,
        answer_text: answerText,
        votes_count: 0,
        is_accepted: false,
        is_community: true,
        created_at: new Date().toISOString()
      };
      store.answers.push(newAns);

      // Notify question owner
      if (q.user_id !== userId) {
        db.notifications.create({
          user_id: q.user_id,
          sender_id: userId,
          type: 'answer',
          title: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಹೊಸ ಸಮುದಾಯ ಉತ್ತರ',
          message: answerText.slice(0, 60),
          link_url: `/places/${q.place_id}`
        });
      }

      return {
        ...newAns,
        user: store.profiles.find(u => u.id === userId)
      };
    },
    voteAnswer: (answerId, userId, voteVal = 1) => {
      const ans = store.answers.find(a => a.id === answerId);
      if (!ans) return null;
      const key = `${answerId}_${userId}`;
      const existing = store.answer_votes[key];

      if (existing === voteVal) {
        delete store.answer_votes[key];
        ans.votes_count -= voteVal;
      } else {
        const diff = existing ? voteVal - existing : voteVal;
        store.answer_votes[key] = voteVal;
        ans.votes_count += diff;
      }
      return { votes_count: ans.votes_count };
    },
    acceptAnswer: (questionId, answerId, userId) => {
      const q = store.questions.find(item => item.id === questionId);
      if (!q || q.user_id !== userId) return null;

      q.accepted_answer_id = answerId;
      store.answers.forEach(a => {
        if (a.question_id === questionId) {
          a.is_accepted = a.id === answerId;
        }
      });
      return q;
    }
  },

  notifications: {
    getByUser: (userId) => {
      return store.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    create: (data) => {
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        is_read: false,
        created_at: new Date().toISOString(),
        ...data
      };
      store.notifications.unshift(notif);
      return notif;
    },
    markRead: (id) => {
      const notif = store.notifications.find(n => n.id === id);
      if (notif) notif.is_read = true;
      return notif;
    }
  },

  trips: {
    save: (tripData) => {
      const trip = {
        id: `trip-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...tripData
      };
      store.trips.unshift(trip);
      return trip;
    },
    getById: (id) => store.trips.find(t => t.id === id) || null,
    getByUser: (userId) => store.trips.filter(t => t.user_id === userId)
  },

  reports: {
    create: (data) => {
      const r = {
        id: `rep-${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        ...data
      };
      store.reports.push(r);
      return r;
    }
  },

  getRawPlaces: () => places
};

module.exports = db;
