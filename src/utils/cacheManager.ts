/**
 * Utility to clear all Service Worker registrations, CacheStorage,
 * and reload with a fresh cache-busted request.
 * Essential for mobile devices (iOS Safari, Android Chrome) that aggressively
 * keep stale PWA caches.
 */
export async function forceClearCacheAndReload(): Promise<void> {
  // Prevent infinite reload loop
  const lastReload = typeof localStorage !== 'undefined' ? localStorage.getItem('splitbill_last_force_reload') : null;
  if (lastReload && Date.now() - parseInt(lastReload, 10) < 45000) {
    console.warn('[SplitBill] Force reload throttled to avoid infinite loop.');
    return;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('splitbill_last_force_reload', Date.now().toString());
  }

  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Delete all CacheStorage entries
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
  } catch (err) {
    console.warn('Error clearing cache:', err);
  }

  // 3. Hard reload bypassing browser cache with timestamp query
  const cleanPath = window.location.pathname;
  window.location.replace(`${cleanPath}?reload=${Date.now()}`);
}

/**
 * Clean up reload query parameter from URL after fresh reload
 */
export function cleanupReloadParam(): void {
  if (typeof window !== 'undefined' && window.location.search.includes('reload=')) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('reload');
      const newUrl = url.pathname + (url.search ? url.search : '') + (url.hash || '');
      window.history.replaceState({}, document.title, newUrl);
    } catch {
      // ignore
    }
  }
}
