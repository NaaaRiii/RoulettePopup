import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '/amplify_outputs.json';

function MyApp({ Component, pageProps }) {
  
  Amplify.configure(outputs);

  return (
        <Authenticator>
          <GoalsProvider>
            <TicketsProvider>
              <Component {...pageProps} />
            </TicketsProvider>
          </GoalsProvider>
        </Authenticator>
  );
}

export default MyApp;