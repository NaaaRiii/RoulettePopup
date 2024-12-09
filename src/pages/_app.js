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


//import React from 'react';
//import { Amplify } from 'aws-amplify';
////import awsconfig from '../aws-exports';
//import outputs from '../amplify_outputs.json';
//import { GoalsProvider } from '../contexts/GoalsContext';
//import { AuthProvider } from '../contexts/AuthContext';
//import { TicketsProvider } from '../contexts/TicketsContext';
//import '../components/styles.css';
//import '@aws-amplify/ui-react/styles.css'; // Authenticator 用のスタイル

//// Amplify の設定
////Amplify.configure(awsconfig);
//Amplify.configure(outputs);

//function MyApp({ Component, pageProps }) {
//  return (
//    <AuthProvider>
//      <GoalsProvider>
//        <TicketsProvider>
//          <Component {...pageProps} />
//        </TicketsProvider>
//      </GoalsProvider>
//    </AuthProvider>
//  );
//}

//export default MyApp;
