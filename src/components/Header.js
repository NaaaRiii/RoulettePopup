import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRank, setUserRank] = useState(0);
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
  
    await fetch('http://localhost:3000/api/logout', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  
    localStorage.removeItem('token');
    router.push('/');
  };

  useEffect(() => {
    const fetchUserRank = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        try {
          const response = await fetch('http://localhost:3000/api/current_user', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserRank(data.rank);
          } else {
            console.error('Failed to fetch user rank');
          }
        } catch (error) {
          console.error('Error fetching user rank:', error);
        }
      }
    };
  
    fetchUserRank();
  }, []);
  

  return (
    <div className="flex_header">
      <div>
        <div className="flex_header-logo">
          <Link href="/" id="logo">Plus ONE</Link>
        </div>
        <nav className="flex_header-list">
          {isLoggedIn ? (
            <div className="logged_in">
              <span>You are Logged In</span>
              <Link href="/dashboard">Dashboard</Link>
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
