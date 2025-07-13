import '../lib/amplifyClient';

import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
//import '../../styles/globals.css';
import '../components/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const publicPaths = ['/', '/login']; 
  const isPublicPage = publicPaths.includes(router.pathname);

  const content = (
    <GoalsProvider>
      <TicketsProvider>
        <Component {...pageProps} />
      </TicketsProvider>
    </GoalsProvider>
  );

  return (
    <Authenticator.Provider>
      {isPublicPage ? (
        content
      ) : (
        <Authenticator>
          {content}
        </Authenticator>
      )}
    </Authenticator.Provider>
  );
}

export default MyApp;