import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRank, setUserRank] = useState(0);
  const router = useRouter();

  const handleLogout = async (event) => {
    event.preventDefault();
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
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // APIを呼び出してユーザーランクを取得するロジックをここに追加
      // 以下はユーザーランクを取得する例です（仮実装）
      // fetchUserRank().then(rank => setUserRank(rank));
    }
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
              {/*<Link href="/logout">Log out</Link>*/}
              <a href="/logout" onClick={handleLogout}>Log out</a>
              {userRank > 10 && <Link href={`/edit_roulette_text/${userRank}`}>Roulette Text</Link>}
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
