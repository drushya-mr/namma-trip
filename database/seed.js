// Seed script for Namma Trip places table
// Populates places from places_seed.json and places_kn.json
const fs = require('fs');
const path = require('path');

let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
  dotenv.config();
} catch (e) {
  // dotenv not installed yet, proceed with process.env
}

const seedPath = path.join(__dirname, 'places_seed.json');
const knPath = path.join(__dirname, 'places_kn.json');
const combinedPath = path.join(__dirname, 'places_combined.json');

const rawSeed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const knMap = JSON.parse(fs.readFileSync(knPath, 'utf8'));

console.log(`Loading ${rawSeed.length} places from seed...`);

const combinedPlaces = rawSeed.map((place) => {
  const kn = knMap[place.id] || {};
  return {
    ...place,
    name_kn: kn.name_kn || place.name,
    description_kn: kn.description_kn || `${place.name} - ${place.category}`,
    machine_translated: kn.machine_translated !== undefined ? kn.machine_translated : true,
    reviewed: kn.reviewed !== undefined ? kn.reviewed : false
  };
});

fs.writeFileSync(combinedPath, JSON.stringify(combinedPlaces, null, 2), 'utf8');
console.log(`Wrote combined dataset with ${combinedPlaces.length} places to ${combinedPath}`);

// If Supabase credentials exist, upload to Supabase Postgres table
async function seedSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('No SUPABASE_URL and SUPABASE_KEY found. Combined JSON generated successfully for offline/local backend use.');
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Connecting to Supabase at:', supabaseUrl);
    const { data, error } = await supabase.from('places').upsert(combinedPlaces, { onConflict: 'id' });

    if (error) {
      console.error('Error seeding to Supabase:', error.message);
    } else {
      console.log('Successfully seeded places to Supabase!');
    }
  } catch (err) {
    console.warn('Supabase JS client not installed or connection error:', err.message);
  }
}

seedSupabase().then(() => {
  console.log('Seed process complete.');
});
