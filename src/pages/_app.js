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

  //amplifyにデプロイする際は、'/edit-roulette-text'を外す
  const publicPaths = ['/', '/login', '/guest-signin'];
  const isPublicPage =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ||
    publicPaths.includes(router.pathname);

  const [signedIn, setSignedIn] = useState(null);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
        if (!cancelled) setSignedIn(true);
      } catch {
        try {
          const { tokens } = await (await import('aws-amplify/auth')).fetchAuthSession();
          const hasId = !!tokens?.idToken;
          if (!cancelled) setSignedIn(hasId);
        } catch {
          if (!cancelled) setSignedIn(false);
        }
      }
    })();
  }, [router.pathname]);

  const content = (
    <GoalsProvider>
      <TicketsProvider>
        <Component {...pageProps} />
      </TicketsProvider>
    </GoalsProvider>
  );

  if (isPublicPage) return content;

  if (signedIn === null) return null;

  if (signedIn) return content;

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