import React, { createContext, useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [playTickets, setPlayTickets] = useState(0);
  //const [editTickets, setEditTickets] = useState(0);

  const fetchTickets = async () => {
    console.log('[Tickets] fetch start');
    const res  = await fetchWithAuth('/api/roulette_texts/tickets');
    const data = await res.json();
    console.log('[Tickets] received', data.play_tickets);
    setPlayTickets(data.play_tickets);
    return data;  
    //try {
    //  const response = await fetchWithAuth('/api/roulette_texts/tickets');
    //  const data = await response.json();
    //  setPlayTickets(data.play_tickets);
    //  setEditTickets(data.edit_tickets);
    //  return data;
    //} catch (error) {
    //  console.error('Error fetching tickets:', error);
    //  throw error;
    //}
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <TicketsContext.Provider
      value={{
        playTickets,
        setPlayTickets,
        //editTickets,
        //setEditTickets,
        fetchTickets,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};