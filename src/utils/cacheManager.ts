/**
 * Utility to clear all Service Worker registrations, CacheStorage,
 * and reload with a fresh cache-busted request.
 * Essential for mobile devices (iOS Safari, Android Chrome) that aggressively
 * keep stale PWA caches.
 */
export async function forceClearCacheAndReload(): Promise<void> {
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

    // 3. Clear session storage
    sessionStorage.clear();
  } catch (err) {
    console.warn('Error clearing cache:', err);
  }

  // 4. Hard reload bypassing browser cache with timestamp query
  const cleanPath = window.location.pathname;
  window.location.replace(`${cleanPath}?reload=${Date.now()}`);
}

/**
 * Clean up reload query parameter from URL after fresh reload
 */
export function cleanupReloadParam(): void {
  if (typeof window !== 'undefined' && window.location.search.includes('reload=')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('reload');
    window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
  }
}
