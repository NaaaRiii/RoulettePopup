import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import '../components/styles.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Login request initiated");
    setError('');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
  
    if (response.ok) {
      console.log("Login successful, redirecting to dashboard");
      router.push('/dashboard');
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Login failed, please try again.');
      console.error('Login failed:', errorData);
    }
  };

  return (
    <Layout>
      <div className="login-form">
        <div className="login">
          <h1>Log in</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                required
              />
            </label>

            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                required
              />
            </label>

            <label className="checkbox inline">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me on this computer
            </label>

            <button type="submit" className="btn btn-primary">Log in</button>
          </form>

          <p>New user? <Link href="/signup">Sign up now!</Link></p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
