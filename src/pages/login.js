import React, { useState } from 'react';
import Link from 'next/link';
import '../components/styles.css';
import Layout from '../components/Layout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });
  
    if (response.ok) {
      const { token } = await response.json();
      // トークンをローカルストレージに保存
      localStorage.setItem('token', token);
      // ダッシュボードページへリダイレクト
      window.location.href = '/dashboard';
    } else {
      // エラー処理
      console.error('Login failed.');
    }
  };

  return (
    <Layout>
    <div className="login-form">
      <div className="login">
        <h1>Log in</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
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
