import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'aws-amplify/auth';

export default function GuestSigninPage() {
  const router = useRouter();

  useEffect(() => {
    const login = async () => {
      const email = process.env.NEXT_PUBLIC_GUEST_EMAIL;
      const password = process.env.NEXT_PUBLIC_GUEST_PASSWORD;
      if (!email || !password) {
        console.error('Guest credentials are not set in environment variables.');
        router.replace('/login');
        return;
      }

      try {
        const { isSignedIn } = await signIn({ username: email, password });
        if (!isSignedIn) {
          throw new Error('Guest sign in did not complete');
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