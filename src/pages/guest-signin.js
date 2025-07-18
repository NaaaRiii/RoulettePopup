import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, getCurrentUser } from 'aws-amplify/auth';

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

        // Rails側のゲストログインが成功したら、Amplify側でも認証状態を設定
        const email = process.env.NEXT_PUBLIC_GUEST_EMAIL;
        const password = process.env.NEXT_PUBLIC_GUEST_PASSWORD;
        
        if (!email || !password) {
          console.error('Guest credentials not found in environment variables');
          router.replace('/login');
          return;
        }

        // 既に認証されているかチェック
        let isAlreadyAuthenticated = false;
        try {
          await getCurrentUser();
          isAlreadyAuthenticated = true;
          console.log('User is already authenticated');
        } catch (error) {
          console.log('User is not authenticated, proceeding with sign in');
        }

        // 認証されていない場合のみsignInを実行
        if (!isAlreadyAuthenticated) {
          try {
            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            console.log('Amplify signIn result:', { isSignedIn, nextStep });
            
            if (!isSignedIn) {
              throw new Error('Amplify sign in did not complete successfully');
            }
          } catch (amplifyError) {
            console.error('Amplify sign in failed:', amplifyError);
            router.replace('/login');
            return;
          }
        }

        // 認証状態を再確認
        try {
          const currentUser = await getCurrentUser();
          console.log('Final auth check - Current user:', currentUser);
        } catch (error) {
          console.error('Final auth check failed:', error);
        }

        // Amplifyの認証状態が確実に反映されるまで少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Redirecting to dashboard...');
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