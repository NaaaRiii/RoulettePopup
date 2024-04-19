import { GoalsProvider } from '../contexts/GoalsContext';

function MyApp({ Component, pageProps }) {
  return (
    <GoalsProvider>
      <Component {...pageProps} />
    </GoalsProvider>
  );
}

export default MyApp;
