//export const fetchRouletteText = async (number) => {
//  try {
//    const response = await fetch(`http://localhost:3000/api/roulette_texts/${number}`);
//    if (!response.ok) {
//      throw new Error(`Error: ${response.status}`);
//    }
//    const data = await response.json();
//    return data;
//  } catch (error) {
//    console.error('Error fetching roulette text:', error);
//    return null;
//  }
//};

export const fetchRouletteText = async (number) => {
  try {
    const response = await fetch(`http://localhost:3000/api/roulette_texts/${number}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
