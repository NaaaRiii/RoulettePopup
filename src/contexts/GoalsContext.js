import React, { createContext, useState, useContext } from 'react';

const GoalsContext = createContext();

export function useGoals() {
  return useContext(GoalsContext);
}

export const GoalsProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false);
  const [goalsState, _setGoalsState] = useState([]);

  const refreshGoals = () => {
    setRefresh(!refresh);
  };

  const setGoalsState = (value) => {
    if (!Array.isArray(value)) {
      console.error('goalsState must be an array:', value);
      return;
    }
    _setGoalsState(value);
  };

  return (
    <GoalsContext.Provider value={{ refresh, refreshGoals, goalsState, setGoalsState }}>
      {children}
    </GoalsContext.Provider>
  );
};