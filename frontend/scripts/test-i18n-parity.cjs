// Parity test script between kn.json and en.json
// Fails build (exit code 1) if keys do not match 100%
const fs = require('fs');
const path = require('path');

const knPath = path.join(__dirname, '..', 'src', 'locales', 'kn.json');
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');

if (!fs.existsSync(knPath) || !fs.existsSync(enPath)) {
  console.error('Error: Translation files kn.json or en.json do not exist yet.');
  process.exit(1);
}

const kn = JSON.parse(fs.readFileSync(knPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

const knKeys = new Set(getAllKeys(kn));
const enKeys = new Set(getAllKeys(en));

const missingInEn = [...knKeys].filter(k => !enKeys.has(k));
const missingInKn = [...enKeys].filter(k => !knKeys.has(k));

let hasError = false;

if (missingInEn.length > 0) {
  console.error('\n❌ Keys present in kn.json but missing in en.json:');
  missingInEn.forEach(k => console.error(`  - ${k}`));
  hasError = true;
}

if (missingInKn.length > 0) {
  console.error('\n❌ Keys present in en.json but missing in kn.json:');
  missingInKn.forEach(k => console.error(`  - ${k}`));
  hasError = true;
}

if (hasError) {
  console.error('\n💥 i18n key parity check failed! Please ensure both files have identical keys.\n');
  process.exit(1);
} else {
  console.log(`\n✅ i18n key parity check passed! Both kn.json and en.json have ${knKeys.size} identical keys.\n`);
  process.exit(0);
}
