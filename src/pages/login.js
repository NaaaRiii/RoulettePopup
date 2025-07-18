import React, { useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();

  // Amplify v6 では useAuthenticator で認証状態を確認
  const { route } = useAuthenticator((context) => [context.route]);

  useEffect(() => {
    if (route === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [route, router]);

  return (
    <Authenticator>
      {/* ログインフォームは Authenticator が自動的に生成 */}
    </Authenticator>
  );
}
