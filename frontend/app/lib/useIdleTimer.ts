import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'gotutor_last_activity';
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;      // 30 minutes total
const DEFAULT_WARNING_THRESHOLD_MS = 5 * 60 * 1000;   // 5 minutes warning window

interface UseIdleTimerOptions {
  onIdle: () => void;
  enabled?: boolean;
  idleTimeoutMs?: number;
  warningThresholdMs?: number;
}

export function useIdleTimer({
  onIdle,
  enabled = true,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  warningThresholdMs = DEFAULT_WARNING_THRESHOLD_MS,
}: UseIdleTimerOptions) {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.floor(warningThresholdMs / 1000));

  // Sync refs during render to avoid extra useEffect overhead
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const isWarningVisibleRef = useRef(isWarningVisible);
  isWarningVisibleRef.current = isWarningVisible;

  const updateActivity = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (e) {
      console.error('Failed to update activity in localStorage', e);
    }
  }, []);

  const getRemainingTimeMs = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const lastActive = parseInt(stored, 10);
        if (!isNaN(lastActive)) {
          return idleTimeoutMs - (Date.now() - lastActive);
        }
      }
    } catch (e) {
      console.error('Failed to read activity from localStorage', e);
    }
    return idleTimeoutMs;
  }, [idleTimeoutMs]);

  const resetTimer = useCallback(() => {
    updateActivity();
    setIsWarningVisible(false);
    setSecondsRemaining(Math.floor(warningThresholdMs / 1000));
  }, [updateActivity, warningThresholdMs]);

  useEffect(() => {
    if (!enabled) {
      setIsWarningVisible(false);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      return;
    }

    // Reset activity timestamp to current time whenever hook becomes enabled (user logs in)
    updateActivity();

    let lastEventTime = 0;
    const handleUserActivity = () => {
      if (isWarningVisibleRef.current) return;
      const now = Date.now();
      if (now - lastEventTime > 1000) {
        lastEventTime = now;
        updateActivity();
      }
    };

    const checkStatus = () => {
      const remainingMs = getRemainingTimeMs();
      if (remainingMs <= 0) {
        setIsWarningVisible(false);
        onIdleRef.current();
      } else if (remainingMs <= warningThresholdMs) {
        setIsWarningVisible(true);
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
      } else {
        setIsWarningVisible(false);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) =>
      window.addEventListener(event, handleUserActivity, { passive: true })
    );
    window.addEventListener('storage', checkStatus);

    const interval = setInterval(checkStatus, 1000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleUserActivity)
      );
      window.removeEventListener('storage', checkStatus);
      clearInterval(interval);
    };
  }, [enabled, warningThresholdMs, updateActivity, getRemainingTimeMs]);

  return {
    isWarningVisible,
    secondsRemaining,
    resetTimer,
  };
}
