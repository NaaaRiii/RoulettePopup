//export const updateLastRouletteRank = async (userId, newRank) => {
//  const updateLastRouletteRank = async (newRank) => {
//    const userId = userData.id;
//    if (!userId) {
//      console.error('User ID is undefined. Cannot update last roulette rank.');
//      return;
//    }

//    console.log("Attempting to update last roulette rank for user ID:", userId);

//    const response = await fetch(`http://localhost:3000/api/current_users/${userId}/update_rank`, {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json'
//      },
//      credentials: 'include',
//      body: JSON.stringify({ lastRouletteRank: newRank })
//    });

//    if (response.ok) {
//      const resData = await response.json();
//      console.log('resData:', resData);
//      //if (resData.success) {
//      //  console.log("Update response received and successful");
//      //  localStorage.setItem('lastRouletteRank', newRank);
//      //  setUserData(prev => ({ ...prev, lastRouletteRank: newRank }));
//      //}
//      if (resData.success) {
//        console.log("Update response received and successful");
//        //localStorage.setItem('lastRouletteRank', newRank);
//        const formattedData = {
//          ...userData,
//          lastRouletteRank: parseInt(newRank, 10) || 0
//        };
//        setUserData(formattedData);
//        console.log('Updated formatted data:', formattedData);
//      } else {
//        console.error("Failed to update last roulette rank due to server error", resData.message || 'No error message provided');
//      }
//    } else {
//      console.error("Failed to update last roulette rank due to network error");
//    }
//  };
//};
