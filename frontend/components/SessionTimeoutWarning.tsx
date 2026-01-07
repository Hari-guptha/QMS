'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { getSessionManager } from '@/lib/session-manager';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const sessionManager = getSessionManager();
    if (!sessionManager) return;

    // Listen for warning
    sessionManager.onWarning((minutesLeft) => {
      setTimeLeft(minutesLeft);
      setShowWarning(true);
    });

    // Listen for timeout
    sessionManager.onTimeout(() => {
      setShowWarning(false);
      auth.logout();
      
      // Redirect to unified login page
      router.push('/login');
    });

    // Update time left periodically
    const interval = setInterval(() => {
      if (showWarning && sessionManager) {
        const remaining = sessionManager.getTimeRemaining();
        const minutes = Math.ceil(remaining / 1000 / 60);
        setTimeLeft(minutes);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [showWarning, router]);

  const handleExtendSession = () => {
    const sessionManager = getSessionManager();
    if (sessionManager) {
      sessionManager.reset();
      setShowWarning(false);
    }
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-destructive/10 border-2 border-destructive rounded-xl shadow-2xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Session Timeout Warning</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''} due to inactivity.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExtendSession}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Stay Logged In
                  </button>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

