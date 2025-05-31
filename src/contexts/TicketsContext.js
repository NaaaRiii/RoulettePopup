import React, { createContext, useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [tickets, setTickets] = useState(0);
  //const [editTickets, setEditTickets] = useState(0);

  const fetchTickets = async () => {
    console.log('[Tickets] fetch start');
    const res  = await fetchWithAuth('/api/roulette_texts/tickets');
    const { tickets } = await res.json();
    console.log('[Tickets] received', data.play_tickets);
    setTickets(tickets);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        setTickets,
        //editTickets,
        //setEditTickets,
        fetchTickets,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};