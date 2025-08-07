import React, { useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const { tab } = router.query;

  // Amplify v6 では useAuthenticator で認証状態を確認
  const { route } = useAuthenticator((context) => [context.route]);

  useEffect(() => {
    if (route === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [route, router]);

  // URL パラメータに基づいて初期タブを設定
  const initialState = tab === 'signUp' ? 'signUp' : 'signIn';

  return (
    <Authenticator initialState={initialState}>
      {/* ログインフォームは Authenticator が自動的に生成 */}
    </Authenticator>
  );
}
