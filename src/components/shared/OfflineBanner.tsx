import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** @fileoverview Offline detection banner — appears when navigator.onLine is false. */
export function OfflineBanner(): React.ReactElement | null {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;
  return (
    <div role="alert" aria-live="assertive" className="offline-banner">
      <WifiOff size={14} style={{ display: 'inline', marginRight: 6 }} />
      You are offline — AI features unavailable, local planner still works
    </div>
  );
}
