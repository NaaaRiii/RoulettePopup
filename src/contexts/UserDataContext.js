import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
  const { route } = useAuthenticator((context) => [context.route]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [goalsState, setGoalsState] = useState([]);
  const [userData, setUserData] = useState({
    name: '',
    totalExp: 0,
    rank: 0,
    lastRouletteRank: 0,
    goals: [],
    smallGoals: [],
    tasks: [],
    rouletteTexts: []
  });
  const [latestCompletedGoals, setLatestCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route === 'authenticated') {
      setIsLoggedIn(true);
    } else if (route === 'unauthenticated' || route === 'signIn') {
      setIsLoggedIn(false);
    }
  }, [route]);

  const fetchGoals = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/goals');
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setGoalsState(data);
    } catch (err) {
      console.error('[fetchGoals] error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/current_user');
      if (response.ok) {
        const data = await response.json();
        
        const formattedData = {
          ...data,
          lastRouletteRank: parseInt(data.last_roulette_rank, 10) || 0
        };
        setUserData(formattedData);
        setLatestCompletedGoals(data.latestCompletedGoals || []);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchGoals();
      fetchUserData();
    } else {
      setGoalsState([]);
      setUserData({
        name: '',
        totalExp: 0,
        rank: 0,
        lastRouletteRank: 0,
        goals: [],
        smallGoals: [],
        tasks: [],
        rouletteTexts: []
      });
      setLatestCompletedGoals([]);
    }
  }, [isLoggedIn]);

  const updateUserData = (updatedData) => {
    setUserData(prevData => ({ ...prevData, ...updatedData }));
  };

  const refreshData = async () => {
    await Promise.all([fetchGoals(), fetchUserData()]);
  };

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    goalsState,
    setGoalsState,
    userData,
    setUserData,
    updateUserData,
    latestCompletedGoals,
    setLatestCompletedGoals,
    loading,
    refreshData,
    fetchGoals,
    fetchUserData
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};