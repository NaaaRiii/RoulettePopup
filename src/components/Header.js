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
    // useAuthenticator の signOut があれば使用、なければ Amplify モジュラー API
    try {
      if (signOut) {
        await signOut();
      } else {
        await amplifySignOut();
      }
    } catch (error) {
      console.error('Amplify signOut error:', error);
    }
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