import React, { createContext, useState, useContext } from 'react';

const GoalsContext = createContext();

export function useGoals() {
  return useContext(GoalsContext);
}

export const GoalsProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false);
  const [goalsState, setGoalsState] = useState([]);

  const refreshGoals = () => {
    setRefresh(!refresh);
  };

  return (
    <GoalsContext.Provider value={{ refresh, refreshGoals, goalsState, setGoalsState }}>
      {children}
    </GoalsContext.Provider>
  );
};