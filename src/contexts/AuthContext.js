import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRank, setUserRank] = useState(0);

  const fetchUserRank = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/current_user', {
        method: 'GET',
        credentials: 'include'
      });
  
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserRank(data.rank);
      } else {
        console.error('Failed to fetch user rank');
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  useEffect(() => {
    fetchUserRank();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRank, setIsLoggedIn, setUserRank }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
