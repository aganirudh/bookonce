/**
 * Service Worker Registration Utility
 * Handles service worker registration for offline support
 */

/**
 * Register the service worker for offline support
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          ); // Check every hour
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Unregister the service worker
 */
export function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker
      .getRegistration()
      .then(registration => {
        if (registration) {
          return registration.unregister();
        }
        return false;
      })
      .catch(error => {
        console.error('Service Worker unregistration failed:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}

/**
 * Clear all service worker caches
 */
export function clearServiceWorkerCache(): Promise<void> {
  if ('serviceWorker' in navigator && 'caches' in window) {
    return caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))).then(() => {
        console.log('All caches cleared');
      });
    });
  }
  return Promise.resolve();
}

/**
 * Check if the app is running in offline mode
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Add event listeners for online/offline status
 */
export function addNetworkListeners(onOnline?: () => void, onOffline?: () => void): () => void {
  const handleOnline = () => {
    console.log('Network: Online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('Network: Offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
