import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';

const Header = () => {
  const router = useRouter();

  // Amplify 認証情報の取得
  const { route, user, signOut } = useAuthenticator((context) => [context.route, context.user, context.signOut]);
  const isLoggedIn = route === 'authenticated' && !!user;

  // Amplifyでのログアウト
  const handleLogout = async (e) => {
    e.preventDefault();
    signOut();      // Amplify 側の認証情報をクリア
    router.push('/'); // ログアウト後の画面へ遷移
  };

  return (
    <div className="flex_header">
      <div>
        <div className="flex_header-logo">
          <Link href="/dashboard" id="logo">Plus ONE</Link>
        </div>
        <nav className="flex_header-list">
          {isLoggedIn ? (
            <div className="logged_in">
              <span>ログイン中</span>
              <Link href="/dashboard">ダッシュボード</Link>
              <Link href="/dashboard">使い方</Link>
              <a href="/logout" onClick={handleLogout}>ログアウト</a>
            </div>
          ) : (
            <ul className="flex_list">
              <li><Link href="/dashboard">使い方</Link></li>
              <li><Link href="/signup">お試し</Link></li>
              <li><Link href="/dashboard">ログイン</Link></li>
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Header;