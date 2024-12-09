import React, { createContext, useContext, useState, useEffect } from 'react';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 認証されたユーザー情報
  const [userRank, setUserRank] = useState(0);

  // ユーザーの認証状態をチェック
  useEffect(() => {
    const checkUser = async () => {
      try {
        const authenticatedUser = await Auth.currentAuthenticatedUser();
        setUser(authenticatedUser);
        // 認証済みユーザーの場合、バックエンドからユーザーデータを取得
        await fetchUserRank();
      } catch (error) {
        setUser(null);
        console.log('ユーザーは認証されていません');
      }
    };
    checkUser();
  }, []);

  // バックエンドからユーザーデータを取得
  const fetchUserRank = async () => {
    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/current_user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
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
  };

  // サインイン関数
  const signIn = async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      setUser(user);
      await fetchUserRank(); // サインイン後にユーザーデータを取得
      return user;
    } catch (error) {
      throw error;
    }
  };

  // サインアウト関数
  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setUserRank(0);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRank, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



//import React, { createContext, useContext, useState, useEffect } from 'react';
//import { signIn as amplifySignIn, signOut as amplifySignOut, currentAuthenticatedUser, currentSession } from '@aws-amplify/auth';

//const AuthContext = createContext();

//export const AuthProvider = ({ children }) => {
//  const [user, setUser] = useState(null); // 認証されたユーザー情報
//  const [userRank, setUserRank] = useState(0);

//  // ユーザーの認証状態をチェック
//  useEffect(() => {
//    const checkUser = async () => {
//      try {
//        const authenticatedUser = await currentAuthenticatedUser();
//        setUser(authenticatedUser);
//        // 認証済みユーザーの場合、バックエンドからユーザーデータを取得
//        await fetchUserRank();
//      } catch (error) {
//        setUser(null);
//        console.log('ユーザーは認証されていません');
//      }
//    };
//    checkUser();
//  }, []);

//  // バックエンドからユーザーデータを取得
//  const fetchUserRank = async () => {
//    try {
//      const session = await currentSession();
//      const idToken = session.getIdToken().getJwtToken();

//      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/current_user`, {
//        method: 'GET',
//        headers: {
//          Authorization: `Bearer ${idToken}`,
//        },
//      });

//      if (response.ok) {
//        const data = await response.json();
//        setUserRank(data.rank);
//      } else {
//        console.error('ユーザーランクの取得に失敗しました');
//      }
//    } catch (error) {
//      console.error('ユーザーランクの取得中にエラーが発生しました:', error);
//    }
//  };

//  // サインイン関数
//  const signIn = async (email, password) => {
//    try {
//      const user = await amplifySignIn({ username: email, password });
//      setUser(user);
//      await fetchUserRank(); // サインイン後にユーザーデータを取得
//      return user;
//    } catch (error) {
//      throw error;
//    }
//  };

//  // サインアウト関数
//  const signOut = async () => {
//    try {
//      await amplifySignOut();
//      setUser(null);
//      setUserRank(0);
//    } catch (error) {
//      throw error;
//    }
//  };

//  return (
//    <AuthContext.Provider value={{ user, userRank, signIn, signOut }}>
//      {children}
//    </AuthContext.Provider>
//  );
//};

//export const useAuth = () => useContext(AuthContext);
