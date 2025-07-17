import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GuestSigninPage() {
  const router = useRouter();

  useEffect(() => {
    const login = async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_RAILS_API_URL || '').replace(/\/$/, '');
        const response = await fetch(`${base}/api/guest_login`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Guest login failed: ${response.status} ${text}`);
        }
        router.replace('/dashboard');
      } catch (error) {
        console.error('Guest login failed:', error);
        router.replace('/login');
      }
    };

    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>ログイン中...</p>
    </div>
  );
} 