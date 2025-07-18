import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';

const Header = () => {
  const router = useRouter();

  // Amplify 認証情報の取得
  const { route, signOut } = useAuthenticator((context) => [context.route, context.signOut]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // route が使える場合はそれを優先
  useEffect(() => {
    if (route === 'authenticated') {
      setIsLoggedIn(true);
    } else if (route === 'unauthenticated' || route === 'signIn') {
      setIsLoggedIn(false);
    }
  }, [route]);

  // route が更新されない場合のフォールバックとして getCurrentUser を利用
  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkUser();
  }, []);

  // Amplifyでのログアウト
  const handleLogout = async (e) => {
    e.preventDefault();
    // useAuthenticator の signOut
    try {
      if (signOut) {
        await signOut();
      }
      // Amplify v6 modular signOut (global)
      await amplifySignOut({ global: true });
    } catch (error) {
      console.error('Amplify signOut error:', error);
    }

    // ローカルストレージの JWT を削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }

    // Rails セッション Cookie も削除するため API にリクエスト
    const base = (process.env.NEXT_PUBLIC_RAILS_API_URL || '').replace(/\/$/, '');
    try {
      await fetch(`${base}/api/logout`, { method: 'DELETE', credentials: 'include' });
    } catch (_) {
      /* ignore */
    }

    // state 更新
    setIsLoggedIn(false);
    router.push('/');
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
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer">使い方</Link>
              <a href="/logout" onClick={handleLogout}>ログアウト</a>
            </div>
          ) : (
            <ul className="flex_list">
              <li><Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer">使い方</Link></li>
              <li><Link href="/guest-signin">お試し</Link></li>
              <li><Link href="/dashboard">ログイン</Link></li>
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Header;