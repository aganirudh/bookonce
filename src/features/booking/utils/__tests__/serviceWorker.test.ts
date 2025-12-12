/**
 * Service Worker Tests
 * Tests for service worker registration and offline support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  clearServiceWorkerCache,
  isOffline,
  addNetworkListeners,
} from '../serviceWorker';

describe('Service Worker Utilities', () => {
  let originalNavigator: any;
  let originalWindow: any;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  describe('registerServiceWorker', () => {
    it('should register service worker if supported', () => {
      const mockRegister = vi.fn().mockResolvedValue({
        scope: '/',
        update: vi.fn(),
      });

      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: mockRegister,
        },
      });

      // Mock window.addEventListener
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      registerServiceWorker();

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('should not register if service worker not supported', () => {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: undefined,
      });

      // Should not throw
      expect(() => registerServiceWorker()).not.toThrow();
    });

    it('should handle registration errors', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: mockRegister,
        },
      });

      registerServiceWorker();

      // Trigger load event
      window.dispatchEvent(new Event('load'));

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('should unregister service worker if registered', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true);
      const mockGetRegistration = vi.fn().mockResolvedValue({
        unregister: mockUnregister,
      });

      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: {
          getRegistration: mockGetRegistration,
        },
      });

      const result = await unregisterServiceWorker();

      expect(mockGetRegistration).toHaveBeenCalled();
      expect(mockUnregister).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no registration found', async () => {
      const mockGetRegistration = vi.fn().mockResolvedValue(null);

      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: {
          getRegistration: mockGetRegistration,
        },
      });

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);
    });

    it('should return false if service worker not supported', async () => {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: undefined,
      });

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);
    });
  });

  describe('clearServiceWorkerCache', () => {
    it('should clear all caches', async () => {
      const mockDelete = vi.fn().mockResolvedValue(true);
      const mockKeys = vi.fn().mockResolvedValue(['cache1', 'cache2']);

      Object.defineProperty(global, 'caches', {
        writable: true,
        value: {
          keys: mockKeys,
          delete: mockDelete,
        },
      });

      Object.defineProperty(global.navigator, 'serviceWorker', {
        writable: true,
        value: {},
      });

      await clearServiceWorkerCache();

      expect(mockKeys).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should handle missing caches API', async () => {
      Object.defineProperty(global, 'caches', {
        writable: true,
        value: undefined,
      });

      // Should not throw
      await expect(clearServiceWorkerCache()).resolves.toBeUndefined();
    });
  });

  describe('isOffline', () => {
    it('should return true when offline', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(isOffline()).toBe(true);
    });

    it('should return false when online', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(isOffline()).toBe(false);
    });
  });

  describe('addNetworkListeners', () => {
    it('should add online and offline event listeners', () => {
      const onOnline = vi.fn();
      const onOffline = vi.fn();

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const cleanup = addNetworkListeners(onOnline, onOffline);

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      // Trigger events
      window.dispatchEvent(new Event('online'));
      expect(onOnline).toHaveBeenCalled();

      window.dispatchEvent(new Event('offline'));
      expect(onOffline).toHaveBeenCalled();

      // Cleanup
      cleanup();
    });

    it('should work without callbacks', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const cleanup = addNetworkListeners();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      // Should not throw when events fire
      expect(() => {
        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('offline'));
      }).not.toThrow();

      cleanup();
    });

    it('should remove event listeners on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const cleanup = addNetworkListeners();
      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});
