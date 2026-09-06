import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';
import { cleanupReloadParam } from './utils/cacheManager';
import { checkForAppUpdate } from './utils/versionCheck';

// Clean up any cache-busting URL parameter from force reloads
cleanupReloadParam();

if (!import.meta.env.DEV) {
  // Check for newer deployment immediately on app launch
  checkForAppUpdate();

  // Auto-reload window when a newly installed service worker takes control
  let refreshing = false;
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Check for new deployments whenever user switches back to the app or focuses
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate();
    }
  });
  window.addEventListener('focus', () => {
    checkForAppUpdate();
  });

  // Also check periodically every 10 minutes
  setInterval(() => {
    checkForAppUpdate();
  }, 10 * 60 * 1000);
}

// Register PWA Service Worker with aggressive update checks on mobile
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update().catch(() => {});
      }, 10 * 60 * 1000);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
