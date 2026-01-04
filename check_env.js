import 'dotenv/config';
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
console.log('URL_STATUS:' + (url ? 'Found' : 'Missing'));
console.log('KEY_STATUS:' + (key ? 'Found' : 'Missing'));
