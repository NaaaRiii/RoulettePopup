import { useState, useEffect } from 'react';

export const useFetchRouletteTexts = () => {
  const [rouletteTexts, setRouletteTexts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllRouletteTexts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/roulette_texts', {
          method: 'GET',
          credentials: 'include',
        });
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