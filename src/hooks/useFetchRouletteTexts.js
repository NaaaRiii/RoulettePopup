import { useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useFetchRouletteTexts = () => {
  const [rouletteTexts, setRouletteTexts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllRouletteTexts = async () => {
      try {
        const response = await await fetchWithAuth(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/roulette_texts`,
          { method: 'GET' }
        );
        const data = await response.json();
        if (isMounted) {
          setRouletteTexts(data);
        }
      } catch (error) {
        console.error('Error fetching roulette texts:', error);
      }
    };

    fetchAllRouletteTexts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { rouletteTexts, setRouletteTexts };
};