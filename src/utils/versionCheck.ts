import { forceClearCacheAndReload } from './cacheManager';

// Injected by Vite at build time via define
declare const __BUILD_TIMESTAMP__: number | undefined;

export const CLIENT_BUILD_TIMESTAMP: number =
  typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 0;

let isChecking = false;

/**
 * Checks the remote server for a newly deployed build.
 * If server build timestamp is newer than current client bundle,
 * returns true and automatically purges cache & reloads (or notifies via callback).
 */
export async function checkForAppUpdate(options?: {
  onUpdateDetected?: () => void;
}): Promise<boolean> {
  if (isChecking) return false;
  isChecking = true;

  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data && typeof data.buildTime === 'number') {
      const serverBuildTime = data.buildTime;

      // If client timestamp is known and server build is newer
      if (CLIENT_BUILD_TIMESTAMP > 0 && serverBuildTime > CLIENT_BUILD_TIMESTAMP + 1000) {
        console.log(
          `[SplitBill] New deployment detected! Server: ${serverBuildTime}, Client: ${CLIENT_BUILD_TIMESTAMP}. Purging cache...`
        );

        if (options?.onUpdateDetected) {
          options.onUpdateDetected();
        } else {
          await forceClearCacheAndReload();
        }
        return true;
      }
    }
  } catch {
    // Offline or network failure; ignore to preserve offline functionality
  } finally {
    isChecking = false;
  }

  return false;
}
