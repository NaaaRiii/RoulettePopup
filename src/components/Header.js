import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Link from 'next/link';

import { useAuthenticator } from '@aws-amplify/ui-react'; 

const Header = () => {
  //const { isLoggedIn, userRank, setIsLoggedIn, setUserRank } = useAuth();
  const router = useRouter();

  const { route, user, signOut } = useAuthenticator((context) => [
    context.route, 
    context.user, 
    context.signOut
  ]);

  // Amplify的にログインしているかどうか
  const isLoggedIn = (route === 'authenticated');

  // Amplifyでのログアウト
  const handleLogout = async (e) => {
    e.preventDefault();
    signOut();      // Amplify 側の認証情報をクリア
    router.push('/'); // ログアウト後の画面へ遷移
  };

  const fetchUserRank = async () => {
    try {
      const response = await fetchWithAuth('/api/current_user');

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserRank(data.rank);
      } else {
        console.error('Failed to fetch user rank');
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  useEffect(() => {
    fetchUserRank();
  // TODO: Fix the dependency array issue
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex_header">
      <div>
        <div className="flex_header-logo">
          <Link href="/dashboard" id="logo">Plus ONE</Link>
        </div>
        <nav className="flex_header-list">
          {isLoggedIn ? (
            <div className="logged_in">
              <span>You are Logged In</span>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard">How to Use</Link>
              <a href="/logout" onClick={handleLogout}>Log out</a>
            </div>
          ) : (
            <ul className="flex_list">
              <li><Link href="/guest_login">Guest Login</Link></li>
              <li><Link href="/signup">Sign Up</Link></li>
              <li><Link href="/login">Log In</Link></li>
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Header;