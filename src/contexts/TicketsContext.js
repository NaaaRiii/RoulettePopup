import React, { createContext, useState, useEffect } from 'react';

export const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [playTickets, setPlayTickets] = useState(0);
  const [editTickets, setEditTickets] = useState(0);

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/roulette_texts/tickets', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setPlayTickets(data.play_tickets);
      setEditTickets(data.edit_tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <TicketsContext.Provider value={{ playTickets, setPlayTickets, editTickets, setEditTickets, fetchTickets }}>
      {children}
    </TicketsContext.Provider>
  );
};