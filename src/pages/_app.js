import React from 'react';
import { GoalsProvider } from '../contexts/GoalsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { TicketsProvider } from '../contexts/TicketsContext';
import '../components/styles.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <GoalsProvider>
        <TicketsProvider>
          <Component {...pageProps} />
        </TicketsProvider>
      </GoalsProvider>
    </AuthProvider>
  );
}

export default MyApp;
