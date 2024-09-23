import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

const Header = () => {
  const { isLoggedIn, userRank, setIsLoggedIn, setUserRank } = useAuth();
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:3000/api/logout', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUserRank(0);
        alert('Logged out successfully');
        router.push('/');
      } else {
        console.error('Failed to log out');
        alert('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Logout failed', error);
      alert('Logout failed. Please try again.');
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/current_user', {
        method: 'GET',
        credentials: 'include'
      });
  
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