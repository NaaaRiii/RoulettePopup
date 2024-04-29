import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import Link from 'next/link';
import '../components/styles.css';
import RoulettePopup from '../components/RoulettePopup';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    totalExp: 0,
    rank: 0,
    lastRouletteRank: 0,
    goals: [],
    smallGoals: [],
    tasks: [],
    rouletteTexts: []
  });
  const [latestCompletedGoals, setLatestCompletedGoals] = useState([]);
  const router = useRouter();
  const message = router.query.message ? decodeURIComponent(router.query.message) : '';
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/current_user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedData = {
          ...data,
          lastRouletteRank: data.last_roulette_rank || 0  // APIからのlast_roulette_rankをキャメルケースでステートに保存
        };
        setUserData(formattedData);
        setLatestCompletedGoals(data.latestCompletedGoals);
  
        // コンソール出力で確認
        console.log("Fetched rank:", formattedData.rank);
        console.log("Last roulette rank:", formattedData.lastRouletteRank);
  
        // モーダル表示条件のチェック
        //if (formattedData.rank >= 10 && Math.floor(formattedData.rank / 10) > Math.floor(formattedData.lastRouletteRank / 10)) {
        //  console.log("Modal should open now.");
        //  setIsModalOpen(true);
        //}
        if (formattedData.rank > formattedData.lastRouletteRank) {
          console.log("Modal should open now.");
          setIsModalOpen(true);
        }
      } else {
        console.error('Failed to fetch user data');
      }
    };
  
    fetchData();
  }, []);

  const updateLastRouletteRank = async (newRank) => {
    const token = localStorage.getItem('token');
    const userId = userData.id;
    const response = await fetch(`http://localhost:3000/api/current_users/${userId}/update_rank`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lastRouletteRank: newRank })
    });
    if (response.ok) {
      // レスポンスが正常の場合、userDataを更新してlastRouletteRankを最新のランクに設定
      setUserData(prev => ({ ...prev, lastRouletteRank: newRank }));
    }
  };
  
  useEffect(() => {
    // rankが更新されたとき、かつlastRouletteRankが更新されていない場合のみモーダルを開く
    if (userData.rank > userData.lastRouletteRank) {
      console.log("Modal should open now.");
      setIsModalOpen(true);
      updateLastRouletteRank(userData.rank).then(() => {
        console.log("Last roulette rank updated.");
      }).catch((error) => {
        console.error("Failed to update last roulette rank", error);
      });
    }
  }, [userData.rank]);


  return (
    <Layout>
      {isModalOpen && (
        <div id="modal" className="modal">
          <div className="modal-content">
            <iframe src="http://localhost:4000/roulette-popup" width="500" height="500"></iframe>
            <span className="close-button" onClick={toggleModal}>Close</span>
          </div>
        </div>
      )}
      {/*<button onClick={toggleModal}>Open Roulette</button>*/}

      {/*{isModalOpen && (
        <RoulettePopup closeFunction={toggleModal} />
      )}*/}

      <div>
        {message && <p>{message}</p>}
      </div>
      <h1>Welcome to your dashboard</h1>
      <p>Here's some information about your account:</p>
      <ul>
        <li>Name: {userData?.name}</li>
      </ul>
      <h2>Your EXP: {userData?.totalExp}</h2>
      <h2>Your Rank: {userData?.rank}</h2>

      <p>Here are your recent activities:</p>
      {latestCompletedGoals.map(goal => (
        <div key={goal.id} className="small-goal">
          <p>{goal.title} <strong>完了!</strong> {formatDate(goal.completed_time)}</p>
        </div>
      ))}

      <div>
        <div class="pg-container">
          <div class="dashboard-container">
            <Link href="/new-goal">
              <div className={'btn btn-primary'}>Set Goal!</div>
            </Link>
            <Link href="/index-goal">
              <div className={'btn btn-primary'}>Your Goals</div>
            </Link>
          </div>
        </div>
      </div>

    </Layout>
  );
}