import '../lib/amplifyClient';

import React, { useEffect, useState } from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { useRouter } from 'next/router';
import { getCurrentUser } from 'aws-amplify/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function AuthenticatedApp({ Component, pageProps }) {
  const router = useRouter();

  const publicPaths = ['/', '/login', '/guest-signin'];
  const isPublicPage = publicPaths.includes(router.pathname);

  const [signedIn, setSignedIn] = useState(null);

  // Material-UIテーマの作成
  const theme = createTheme({
    typography: {
      fontFamily: '"UD デジタル 教科書体 N-R", "UD Digi Kyokasho NP-R", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        fontFamily: '"UD デジタル 教科書体 N-R", "UD Digi Kyokasho NP-R", "Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
  });

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoalsProvider>
        <TicketsProvider>
          <Component {...pageProps} />
        </TicketsProvider>
      </GoalsProvider>
    </ThemeProvider>
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