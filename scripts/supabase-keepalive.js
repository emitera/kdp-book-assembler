#!/usr/bin/env node

/**
 * Supabase Keep-Alive Ping Script (Birdy Pages)
 * Purpose: Prevent Supabase project auto-pause by executing REST API requests every 2 days.
 * Run in GitHub Actions or any autonomous cron environment.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://jezhiebjkbpuidabhvav.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.SUPABASE_ANON_KEY || 
                     'sb_publishable_06RsSpB-EhaTncT7xgsCHA_5L7Prauz';

const PING_ID = 'birdy_ping';

async function runKeepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[KeepAlive] Starting Supabase keep-alive ping at ${timestamp}`);
  console.log(`[KeepAlive] Target URL: ${SUPABASE_URL}`);

  if (!SUPABASE_KEY) {
    console.error('[KeepAlive] Error: Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY provided.');
    process.exit(1);
  }

  // 1. Primary Attempt: Upsert into public.healthcheck
  try {
    console.log(`[KeepAlive] Attempting primary ping -> table "healthcheck" (id="${PING_ID}")...`);
    
    const healthcheckUrl = `${SUPABASE_URL}/rest/v1/healthcheck?on_conflict=id`;
    const response = await fetch(healthcheckUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([
        {
          id: PING_ID,
          last_ping: timestamp,
          note: 'Automated GitHub Actions keep-alive ping'
        }
      ])
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[KeepAlive] SUCCESS: Primary ping recorded successfully in "healthcheck"! Status: ${response.status}`);
      console.log(`[KeepAlive] Record:`, JSON.stringify(data));
      process.exit(0);
    }

    const errText = await response.text();
    console.warn(`[KeepAlive] Primary ping failed with status ${response.status}: ${errText}`);
    console.log('[KeepAlive] Switching to Fallback strategy...');
  } catch (err) {
    console.warn(`[KeepAlive] Primary ping network/execution error: ${err.message}`);
    console.log('[KeepAlive] Switching to Fallback strategy...');
  }

  // 2. Fallback Attempt: Query existing tables (desktop_licenses, profiles, etc.)
  const fallbackTables = ['desktop_licenses', 'profiles', 'payment_settings'];
  let fallbackSuccess = false;

  for (const table of fallbackTables) {
    try {
      console.log(`[KeepAlive] Fallback: Querying "${table}" (limit=1)...`);
      const fallbackUrl = `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`;
      const fbResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (fbResponse.ok) {
        console.log(`[KeepAlive] SUCCESS: Fallback request to "${table}" succeeded with status ${fbResponse.status}.`);
        console.log(`[KeepAlive] Supabase server has registered active REST traffic. Auto-pause prevented.`);
        fallbackSuccess = true;
        break;
      } else {
        const fbErr = await fbResponse.text();
        console.warn(`[KeepAlive] Fallback query to "${table}" returned status ${fbResponse.status}: ${fbErr}`);
      }
    } catch (fbErr) {
      console.warn(`[KeepAlive] Fallback query error on "${table}": ${fbErr.message}`);
    }
  }

  if (fallbackSuccess) {
    process.exit(0);
  } else {
    console.error('[KeepAlive] CRITICAL: Both primary healthcheck and all fallback queries failed.');
    process.exit(1);
  }
}

runKeepAlive();
