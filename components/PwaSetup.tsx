"use client";

import { useEffect } from "react";
import { queueSync } from "@/lib/sync";

/**
 * Registers the service worker, requests persistent storage so iOS
 * doesn't evict IndexedDB (the source of truth) under storage pressure,
 * and kicks a background sync on launch and whenever the app regains
 * focus (the moment another device's changes become interesting).
 */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline caching is a progressive enhancement; the app still runs.
      });
    }
    navigator.storage?.persist?.().catch(() => {});

    queueSync(1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") queueSync(500);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
