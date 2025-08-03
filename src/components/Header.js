import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { format } from 'date-fns';
import { useUserData } from '../contexts/UserDataContext';
import ExpCalendar from './Calendar';

const Header = () => {
  const router = useRouter();

  // Amplify 認証情報の取得
  const { route, signOut } = useAuthenticator((context) => [context.route, context.signOut]);
  const { isLoggedIn, goalsState, latestCompletedGoals } = useUserData();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatDate = (dateString) => format(new Date(dateString), 'yyyy-MM-dd');


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
        
        {/* デスクトップメニュー */}
        <nav className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4 text-[1.2rem] text-red-800">
              <span>ログイン中</span>
              <Link href="/dashboard" className="text-[1.2rem] px-2.5 py-2.5 text-blue-600 hover:text-blue-800">ダッシュボード</Link>
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="text-[1.2rem] px-2.5 py-2.5 text-blue-600 hover:text-blue-800">使い方</Link>
              <a href="/logout" onClick={handleLogout} className="text-[1.2rem] px-2.5 py-2.5 text-blue-600 hover:text-blue-800">ログアウト</a>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="text-[1.2rem] px-2.5 py-2.5 hover:text-blue-600">使い方</Link>
              <Link href="/guest-signin" className="text-[1.2rem] px-2.5 py-2.5 hover:text-blue-600">お試し</Link>
              <Link href="/dashboard" className="text-[1.2rem] px-2.5 py-2.5 hover:text-blue-600">ログイン</Link>
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
        <div className="max-h-[calc(100vh-90px)] overflow-y-auto">
          {isLoggedIn ? (
            <nav className="flex flex-col p-4">
              {/* カレンダー（最上位） */}
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">カレンダー</h3>
                <ExpCalendar />
              </div>
              
              {/* ダッシュボード・使い方・ログアウト */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">メニュー</h3>
                <div className="space-y-3">
                  <span className="block py-2 text-sm text-red-800">ログイン中</span>
                  <Link href="/dashboard" className="block py-3 px-4 bg-white rounded border text-center hover:bg-gray-100 text-blue-600 hover:text-blue-800" onClick={() => setIsMobileMenuOpen(false)}>ダッシュボード</Link>
                  <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="block py-3 px-4 bg-white rounded border text-center hover:bg-gray-100 text-blue-600 hover:text-blue-800" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
                  <a href="/logout" onClick={(e) => { handleLogout(e); setIsMobileMenuOpen(false); }} className="block py-3 px-4 bg-white rounded border text-center hover:bg-gray-100 text-blue-600 hover:text-blue-800">ログアウト</a>
                </div>
              </div>
              
              {/* 進行中のGoal */}
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">進行中のGoal</h3>
                <div className="space-y-3">
                  {goalsState
                    .filter((goal) => !goal.completed)
                    .sort((a, b) => {
                      const dateA = a.deadline ? new Date(a.deadline) : Infinity;
                      const dateB = b.deadline ? new Date(b.deadline) : Infinity;
                      return dateA - dateB;
                    })
                    .map((goal) => (
                      <div
                        key={goal.id}
                        className="p-3 bg-[#FFFCEB] rounded border cursor-pointer hover:bg-[#FFF6D9]"
                        onClick={() => {
                          router.push(`/goals/${goal.id}`);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span className="font-medium text-gray-900">{goal.title}</span>
                        <p className="text-sm text-gray-500">
                          期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* 最近完了したSmall Goal */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">最近完了したSmall Goal</h3>
                <div className="space-y-2">
                  {latestCompletedGoals.map(goal => (
                    <div key={goal.id} className="p-3 bg-gray-50 rounded border">
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">完了!</span>
                        <span className="text-blue-600 ml-2">{formatDate(goal.completed_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          ) : (
            <nav className="flex flex-col p-4">
              <Link href="https://qiita.com/NaaaRiii/items/b79753445554530fafd7" target="_blank" rel="noopener noreferrer" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>使い方</Link>
              <Link href="/guest-signin" className="py-3 text-[#373741] hover:text-blue-600 border-b border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>お試し</Link>
              <Link href="/dashboard" className="py-3 text-[#373741] hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>ログイン</Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;