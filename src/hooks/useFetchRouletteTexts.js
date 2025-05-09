import { useState, useEffect } from 'react';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useFetchRouletteTexts = () => {
  const [rouletteTexts, setRouletteTexts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllRouletteTexts = async () => {
      try {
        const response = await fetchWithAuth('/api/roulette_texts');
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