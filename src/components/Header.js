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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="fixed top-0 left-0 w-full z-50 bg-[rgb(240,239,226)] h-[90px]">
      <div className="flex items-center justify-between h-full px-10">
        {/* ロゴ */}
        <div className="text-2xl font-bold text-[#373741]">
          <Link href="/dashboard" id="logo">Plus ONE</Link>
        </div>
        
        {/* デスクトップメニュー */}
        <nav className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4 text-sm text-red-800">
              <span>ログイン中</span>
              <Link href="/dashboard" className="hover:text-red-600">ダッシュボード</Link>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="hover:text-red-600">使い方</Link>
              <a href="/logout" onClick={handleLogout} className="hover:text-red-600">ログアウト</a>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="px-2.5 py-2.5 hover:text-blue-600">使い方</Link>
              <Link href="/guest-signin" className="px-2.5 py-2.5 hover:text-blue-600">お試し</Link>
              <Link href="/dashboard" className="px-2.5 py-2.5 hover:text-blue-600">ログイン</Link>
            </div>
          )}
        </nav>
        
        {/* モバイルハンバーガーメニュー */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-8 h-8"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 my-1 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>
      
      {/* モバイルメニュー */}
      <div className={`md:hidden fixed top-[90px] left-0 w-full bg-[rgb(240,239,226)] shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="flex flex-col p-4">
          {isLoggedIn ? (
            <>
              <span className="py-2 text-sm text-red-800">ログイン中</span>
              <Link href="/dashboard" className="py-3 text-[#373741] hover:text-red-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>ダッシュボード</Link>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="py-3 text-[#373741] hover:text-red-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
              <a href="/logout" onClick={(e) => { handleLogout(e); setIsMobileMenuOpen(false); }} className="py-3 text-[#373741] hover:text-red-600">ログアウト</a>
            </>
          ) : (
            <>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
              <Link href="/guest-signin" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>お試し</Link>
              <Link href="/dashboard" className="py-3 text-[#373741] hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>ログイン</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;