import '../lib/amplifyClient';

import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { useRouter } from 'next/router';

function AuthenticatedApp({ Component, pageProps }) {
  const { route } = useAuthenticator((context) => [context.route]);
  const router = useRouter();

  const publicPaths = ['/', '/login', '/guest-signin'];
  const isPublicPage = publicPaths.includes(router.pathname);
  const isAuthenticated = route === 'authenticated';

  // デバッグ用ログ
  console.log('Auth state:', { route, isPublicPage, isAuthenticated, pathname: router.pathname });

  const content = (
    <GoalsProvider>
      <TicketsProvider>
        <Component {...pageProps} />
      </TicketsProvider>
    </GoalsProvider>
  );

  if (isPublicPage || isAuthenticated) {
    return content;
  }

  return (
    <Authenticator>
      {content}
    </Authenticator>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <Authenticator.Provider>
      <AuthenticatedApp Component={Component} pageProps={pageProps} />
    </Authenticator.Provider>
  );
}

export default MyApp;