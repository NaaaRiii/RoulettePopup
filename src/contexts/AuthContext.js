//import React, { createContext, useContext, useState, useEffect } from 'react';
////import { fetchWithAuth } from '../utils/fetchWithAuth';

//const AuthContext = createContext();

//export const AuthProvider = ({ children }) => {
//  const [isLoggedIn, setIsLoggedIn] = useState(false);
//  const [userRank, setUserRank] = useState(0);

//  const fetchUserRank = async () => {
//    try {
//      const response = await fetch(
//        `${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/current_user`,
//        { method: 'GET',}
//      );
  
//      if (response.ok) {
//        const data = await response.json();
//        setIsLoggedIn(true);
//        setUserRank(data.rank);
//      } else {
//        console.error('Failed to fetch user rank');
//      }
//    } catch (error) {
//      console.error('Error fetching user rank:', error);
//    }
//  };

//  useEffect(() => {
//    fetchUserRank();
//  }, []);

//  return (
//    <AuthContext.Provider value={{ isLoggedIn, userRank, setIsLoggedIn, setUserRank }}>
//      {children}
//    </AuthContext.Provider>
//  );
//};

//export const useAuth = () => useContext(AuthContext);
