import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jezhiebjkbpuidabhvav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_06RsSpB-EhaTncT7xgsCHA_5L7Prauz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PING_STORAGE_KEY = 'birdypages_last_ping';
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Asynchronous, silent keep-alive ping to prevent Supabase auto-pause.
 * Checks localStorage for 'birdypages_last_ping'.
 * If absent or >24 hours old, sends a quiet request to public.healthcheck.
 * Never throws, blocks UI, or interrupts application execution.
 */
export async function pingSupabaseKeepAlive() {
  if (typeof window === 'undefined') return;

  try {
    const lastPingStr = localStorage.getItem(PING_STORAGE_KEY);
    const now = Date.now();

    if (lastPingStr) {
      const lastPingTime = parseInt(lastPingStr, 10);
      if (!isNaN(lastPingTime) && (now - lastPingTime) < PING_INTERVAL_MS) {
        return; // Pinged within the last 24 hours
      }
    }

    // Silent async ping to healthcheck table (select or upsert)
    const { error } = await supabase
      .from('healthcheck')
      .upsert(
        {
          id: 'birdy_ping',
          last_ping: new Date().toISOString(),
          note: 'Client browser keep-alive ping'
        },
        { onConflict: 'id' }
      );

    if (error) {
      // Fallback: silent select in case table is restricted or not yet migrated
      await supabase.from('healthcheck').select('id').limit(1);
    }

    // Record ping timestamp
    localStorage.setItem(PING_STORAGE_KEY, now.toString());
  } catch (err) {
    // Non-blocking silent error catch
    if (import.meta.env?.DEV) {
      console.debug('[Supabase Keep-Alive] Silent ping error:', err?.message || err);
    }
  }
}

// Automatically trigger on client initialization when browser is idle
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => pingSupabaseKeepAlive(), { timeout: 3000 });
  } else {
    setTimeout(pingSupabaseKeepAlive, 1500);
  }
}

