import '../lib/amplifyClient';

import React, { useEffect, useState } from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { useRouter } from 'next/router';
import { getCurrentUser } from 'aws-amplify/auth';

function AuthenticatedApp({ Component, pageProps }) {
  const router = useRouter();

  const publicPaths = ['/', '/login', '/guest-signin'];
  const isPublicPage = publicPaths.includes(router.pathname);

  // サインイン状態を保持
  const [signedIn, setSignedIn] = useState(null); // null = loading, true/false = 判定済み

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
        if (!cancelled) setSignedIn(true);
      } catch {
        // getCurrentUser が失敗した場合は fetchAuthSession でトークンの有無を確認
        try {
          const { tokens } = await (await import('aws-amplify/auth')).fetchAuthSession();
          const hasId = !!tokens?.idToken;
          if (!cancelled) setSignedIn(hasId);
        } catch {
          if (!cancelled) setSignedIn(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // デバッグ用ログ
  console.log('Auth check:', { signedIn, isPublicPage, pathname: router.pathname });

  const content = (
    <GoalsProvider>
      <TicketsProvider>
        <Component {...pageProps} />
      </TicketsProvider>
    </GoalsProvider>
  );

  // 公開ページは常に表示
  if (isPublicPage) return content;

  // サインイン判定中は何も表示しない（またはローディング表示を追加しても良い）
  if (signedIn === null) return null;

  // サインイン済みの場合はそのまま表示
  if (signedIn) return content;

  // 未サインインの場合のみAuthenticatorを表示
  return <Authenticator>{content}</Authenticator>;
}

function MyApp({ Component, pageProps }) {
  return (
    <Authenticator.Provider>
      <AuthenticatedApp Component={Component} pageProps={pageProps} />
    </Authenticator.Provider>
  );
}

export default MyApp;