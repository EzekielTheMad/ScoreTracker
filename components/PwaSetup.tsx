"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and requests persistent storage so iOS
 * doesn't evict IndexedDB (the source of truth) under storage pressure.
 */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline caching is a progressive enhancement; the app still runs.
      });
    }
    navigator.storage?.persist?.().catch(() => {});
  }, []);
  return null;
}
