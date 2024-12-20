import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
//import { AuthProvider } from '../contexts/AuthContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

//import { Amplify } from 'aws-amplify';
////import { Authenticator } from '@aws-amplify/ui-react';
//import '@aws-amplify/ui-react/styles.css';
//import outputs from '../../amplify_outputs.json';

//Amplify.configure(outputs);

function MyApp({ Component, pageProps }) {
  return (
        <GoalsProvider>
          <TicketsProvider>
            <Component {...pageProps} />
          </TicketsProvider>
        </GoalsProvider>
  );
}

export default MyApp;