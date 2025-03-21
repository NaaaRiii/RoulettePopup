//export const fetchRouletteText = async (number) => {
//  try {
//    const response = await fetch(`http://localhost:3000/api/roulette_texts/${number}`, {
//      method: 'GET',
//      credentials: 'include',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//    });

//    if (!response.ok) {
//      throw new Error(`Error: ${response.status}`);
//    }

//    const rouletteText = await response.json();
//    return rouletteText; // オブジェクト全体を返す
//  } catch (error) {
//    console.error('Error fetching roulette text:', error);
//    return { text: 'Error fetching text' }; // エラー時もオブジェクトを返す
//  }
//};


// src/components/utils.js
//import { fetchWithAuth } from '../utils/fetchWithAuth';
// ↑ fetchWithAuth.js が src/utils/ フォルダにある場合のパス例

export const fetchRouletteText = async (number) => {
  try {
    // fetch から fetchWithAuth に置き換え
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/roulette_texts/${number}`,
      { method: 'GET' }
    );

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
