import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MicrosoftCallbackClient = dynamic(() => import('./MicrosoftCallbackClient'), { ssr: false });

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-background dark:to-purple-950/20">
          <div className="text-center">
            <svg className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-gray-600 dark:text-muted-foreground">Completing sign in...</p>
          </div>
        </div>
      }
    >
      <MicrosoftCallbackClient />
    </Suspense>
  );
}

