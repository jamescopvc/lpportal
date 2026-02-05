"use client";

import { useEffect, useRef } from "react";
import { signOut } from "@/lib/actions/auth";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const THROTTLE_MS = 1000; // only reset the timer once per second

export function IdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef(0);

  useEffect(() => {
    const reset = () => {
      const now = Date.now();
      if (now - lastResetRef.current < THROTTLE_MS) return;
      lastResetRef.current = now;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => signOut(), IDLE_MS);
    };

    reset();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  return null;
}
