'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentLogin() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to unified login page
    router.replace('/login');
  }, [router]);

  return null;
}
