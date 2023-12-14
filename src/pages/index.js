//import React, { useEffect } from 'react';
//import Roulette from '../components/RoulettePopup';
//import '../components/RoulettePopup.css';

//const UserProfile = ({ userId }) => {
//  console.log("Initial userId:", userId); 
//  useEffect(() => {
//    console.log("useEffect userId:", userId);
//    const fetchData = async () => {
//      try {
//        const response = await fetch(`http://localhost:3000/api/v1/users/${userId}`);
//        if (!response.ok) {
//          throw new Error(`HTTP error! status: ${response.status}`);
//        }
//        const data = await response.json();

//        const previousRank = parseInt(localStorage.getItem('previousRank'), 10) || 0;
//        const currentRank = data.rank;

//        if (previousRank % 10 < 9 && currentRank % 10 === 0) {
//          // ランクが10の倍数を超えた場合の処理
//        }

//        localStorage.setItem('previousRank', currentRank.toString());
//      } catch (error) {
//        console.error('Fetch error:', error);
//      }
//    };

//    if (userId) {
//      fetchData();
//    }
//  }, [userId]);

//  return (
//    <div>
//      <h1>ルーレット</h1>
//      <Roulette />
//    </div>
//  );
//};

//export default UserProfile;


import React, { useEffect } from 'react';
import axios from 'axios'; // axiosをimport
import Roulette from '../components/RoulettePopup';
import '../components/RoulettePopup.css';

const UserProfile = ({ userId }) => {
  console.log("Initial userId:", userId); 
  useEffect(() => {
    console.log("useEffect userId:", userId);
    const fetchData = async () => {
      try {
        // axiosを使用してAPIを呼び出す
        const response = await axios.get(`/api/v1/users/${userId}`);
        const data = response.data; // axiosは自動的にJSONをパースする

        const previousRank = parseInt(localStorage.getItem('previousRank'), 10) || 0;
        const currentRank = data.rank;

        if (previousRank % 10 < 9 && currentRank % 10 === 0) {
          // ランクが10の倍数を超えた場合の処理
        }

        localStorage.setItem('previousRank', currentRank.toString());
      } catch (error) {
        // axiosを使用すると、error.responseでHTTPステータスコードを確認できる
        console.error('Axios error:', error.response ? error.response : error);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  return (
    <div>
      <h1>ルーレット</h1>
      <Roulette />
    </div>
  );
};

export default UserProfile;