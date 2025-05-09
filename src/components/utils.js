import { fetchWithAuth } from '../utils/fetchWithAuth';

export const fetchRouletteText = async (number) => {
  try {
    // fetch から fetchWithAuth に置き換え
    const response = await fetchWithAuth(`/api/roulette_texts/${number}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const rouletteText = await response.json();
    return rouletteText; // オブジェクト全体を返す
  } catch (error) {
    console.error('Error fetching roulette text:', error);
    return { text: 'Error fetching text' }; // エラー時もオブジェクトを返す
  }
};
