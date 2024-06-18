import { GoalsProvider } from '../contexts/GoalsContext';
import { AuthProvider } from '../contexts/AuthContext';
import '../components/styles.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <GoalsProvider>
        <Component {...pageProps} />
      </GoalsProvider>
    </AuthProvider>
  );
}

export default MyApp;