import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { signOut as amplifySignOut, updateUserAttributes } from 'aws-amplify/auth';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const Header = () => {
  const router = useRouter();
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth('/api/current_user');
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);


  // 退会処理（論理削除）
  const handleWithdrawal = async () => {
    const confirmed = confirm('この動作は取り消しができません。このサービスから退会しますか？');
    
    if (confirmed) {
      try {
        // 1. Rails APIでユーザーデータ論理削除
        const response = await fetchWithAuth('/api/users/withdrawal', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // 2. Cognitoユーザー属性を更新（退会状態に設定）
          await updateUserAttributes({
            userAttributes: {
              'custom:status': 'deactivated',
            },
          });
          
          // 3. Amplifyでサインアウト
          await amplifySignOut({ global: true });
          
          // 4. ローカルストレージをクリーンアップ
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          
          // 5. ルートページにリダイレクト
          router.push('/');
        } else {
          console.error('Rails API withdrawal failed:', response.status);
        }
      } catch (error) {
        console.error('退会処理でエラーが発生しました:', error);
      }
      
      // ハンバーガーメニューを閉じる
      setIsMobileMenuOpen(false);
    }
  };

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

    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[rgb(240,239,226)] h-[90px]">
      <div className="flex items-center justify-between h-full px-10">
        {/* ロゴ */}
        <div className="text-[1.8rem] font-bold text-[#373741]">
          <Link href="/dashboard" id="logo">Plus ONE</Link>
        </div>
        
        {/* デスクトップメニュー（ログイン前のみ表示） */}
        {!isLoggedIn && (
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-5">
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="text-[1.2rem] px-2.5 py-2.5 hover:text-blue-600">使い方</Link>
              {/* <Link href="/guest-signin" className="text-[1.1rem] px-2.5 py-2.5 hover:text-blue-600">お試し</Link> */}
              <Link href="/login?tab=signUp" className="text-[1.1rem] px-2.5 py-2.5 hover:text-blue-600">サインイン</Link>
              <Link href="/login" className="text-[1.1rem] px-2.5 py-2.5 hover:text-blue-600">ログイン</Link>
            </div>
          </nav>
        )}
        
        {/* ハンバーガーメニュー（ログイン前はモバイルのみ、ログイン後は全画面で表示） */}
        <button 
          className={`${isLoggedIn ? 'flex' : 'md:hidden flex'} flex-col justify-center items-center w-8 h-8`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 my-1 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#373741] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>
      
      {/* ハンバーガーメニュー（ログイン前はモバイルのみ、ログイン後は全画面で表示） */}
      <div className={`${isLoggedIn ? 'fixed' : 'md:hidden fixed'} top-[90px] left-0 w-full bg-[rgb(240,239,226)] shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="flex flex-col p-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>ダッシュボード</Link>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
              <a href="/logout" onClick={(e) => { handleLogout(e); setIsMobileMenuOpen(false); }} className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200">ログアウト</a>
              <button onClick={handleWithdrawal} className="py-3 text-[#373741] hover:text-red-600 text-left">退会</button>
            </>
          ) : (
            <>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
              {/* <Link href="/guest-signin" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>お試し</Link> */}
              <Link href="/login?tab=signUp" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>サインイン</Link>
              <Link href="/login" className="py-3 text-[#373741] hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>ログイン</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;