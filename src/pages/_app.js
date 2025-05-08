import '../lib/amplifyClient';

import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // 認証不要ページのパスを定義
  const publicPaths = ['/', '/login']; 
  const isPublicPage = publicPaths.includes(router.pathname);

  // 認証不要なら <Authenticator> をスキップ
  const content = (
    <GoalsProvider>
      <TicketsProvider>
        <Component {...pageProps} />
      </TicketsProvider>
    </GoalsProvider>
  );

  if (isPublicPage) {
    return content;
  }

  // 認証必須ページはラップ
  return (
    <Authenticator>
      {content}
    </Authenticator>
  );
}

export default MyApp;