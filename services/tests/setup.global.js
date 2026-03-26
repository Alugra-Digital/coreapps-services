import { execFileSync } from 'child_process';

export async function setup() {
  // Restart the gateway before tests to clear any in-memory rate limit state.
  // Rate limiters skip localhost IPs (built into the code), so tests running
  // on localhost are never rate-limited. The restart is a safety net for any
  // other in-process state that might accumulate between test runs.
  try {
    console.log('[setup] Restarting gateway to clear rate limiters...');
    execFileSync('docker', ['restart', 'coreapps-alugra-gateway-1'], { stdio: 'pipe' });
    // Wait for gateway to be ready
    await new Promise(resolve => setTimeout(resolve, 4000));
    console.log('[setup] Gateway ready.');
  } catch (e) {
    console.warn('[setup] Could not restart gateway:', e.message);
  }
}
