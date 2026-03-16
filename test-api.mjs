import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/activity-logs';

async function test() {
  console.log('Testing activity-logs API...');
  // This might fail if auth is required, which it is.
  // Instead, let's just inspect the error by simulating the query logic with supabase-js
}
