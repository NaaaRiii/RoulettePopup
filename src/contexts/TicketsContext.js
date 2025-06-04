import React, { createContext, useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [tickets, setTickets] = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      console.log('[Tickets] fetch start');
      const res = await fetchWithAuth('/api/roulette_texts/tickets');

      if (!res.ok) throw new Error(`status=${res.status}`);

      const data = await res.json();
      console.log('[Tickets] received', data.tickets);

      setTickets(data.tickets ?? data.play_tickets ?? 0);
    } catch (e) {
      console.error('[Tickets] fetch failed:', e);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        setTickets,
        fetchTickets,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};