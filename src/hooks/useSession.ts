import { useState, useEffect } from 'react';

const SESSION_KEY = 'mumu_session_id';

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      stored = generateSessionId();
      localStorage.setItem(SESSION_KEY, stored);
    }
    setSessionId(stored);
  }, []);

  return sessionId;
}
