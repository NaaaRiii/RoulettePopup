import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import '../components/styles.css';


//const checkLoginStatus = async () => {
//  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check_login`, {
//    method: 'GET',
//    credentials: 'include'
//  });
//  if (response.ok) {
//    const data = await response.json();
//    return data.logged_in;
//  }
//  return false;
//};

const LoginPage = () => {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  //useEffect(() => {
  //  const checkLogin = async () => {
  //    const isLoggedIn = await checkLoginStatus();
  //    if (isLoggedIn) {
  //      router.push('/dashboard');
  //    }
  //  };
  //  checkLogin();
  //  if (router.query.message) {
  //    alert(decodeURIComponent(router.query.message));
  //  }
  //}, [router]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
    if (router.query.message) {
      alert(decodeURIComponent(router.query.message));
    }
  }, [user, router]);

  //const handleSubmit = async (event) => {
  //  event.preventDefault();
  //  console.log("Login request initiated");
  //  setError('');
    
  //  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
  //    method: 'POST',
  //    headers: {
  //      'Content-Type': 'application/json',
  //    },
  //    body: JSON.stringify({ email, password }),
  //    credentials: 'include'
  //  });
  
  //  if (response.ok) {
  //    console.log("Login successful, redirecting to dashboard");
  //    router.push('/dashboard');
  //  } else {
  //    const errorData = await response.json();
  //    setError(errorData.error || 'Login failed, please try again.');
  //    console.error('Login failed:', errorData);
  //  }
  //};

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Login request initiated');
    setError('');

    try {
      await signIn(email, password); // `signIn` 関数を使用
      console.log('Login successful, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed, please try again.');
      console.error('Login failed:', error);
    }
  };

  return (
    //<Layout>
      <div className="login-form">
        <div className="background-image">
          <header className="header">
            <h1>Plus ONE</h1> 
          </header>
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

              <button type="submit" className="button">Log in</button>
            </form>

            <p className="sign-up-link">
              <span className="new-user-text">New user?</span> 
              <Link href="/signup" className="sign-up-now-link">Sign up now!</Link>
            </p>
          </div>

          <div className="log-dex-footer">
          <ul className="flex_list">
            <li>About</li>
            <li>Contact Us</li>
          </ul>
          <div className="footer_copyright">
            ©︎ 2023 Plus ONE, Inc.
          </div>
        </div>
        </div>
      </div>
    //</Layout>
  );
};

export default LoginPage;
