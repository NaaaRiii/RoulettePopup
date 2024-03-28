export const fetchRouletteText = async (number) => {
  try {
    const response = await fetch(`http://localhost:3000/roulette_texts/${number}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching roulette text:', error);
    return null;
  }
};

