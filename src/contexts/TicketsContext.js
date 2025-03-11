import React, { createContext, useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [playTickets, setPlayTickets] = useState(0);
  const [editTickets, setEditTickets] = useState(0);

  const fetchTickets = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/roulette_texts/tickets`,
        { method: 'GET' }
      );
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