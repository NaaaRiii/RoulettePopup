import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import Link from 'next/link';
import '../components/styles.css';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRank, setUserRank] = useState(0);
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
      //const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/current_user', {
        //headers: {
        //  'Content-Type': 'application/json'
        //},
        //method: 'GET',
        credentials: 'include',
        //headers: {
        //  'Authorization': `Bearer ${token}`
        //}
      });
      if (response.ok) {
        const data = await response.json();
        setUserRank(data.rank);
        const storedLastRouletteRank = localStorage.getItem('lastRouletteRank') || data.last_roulette_rank;
        const formattedData = {
          ...data,
          lastRouletteRank: parseInt(storedLastRouletteRank, 10) || 0
        };
        setUserData(formattedData);
        setLatestCompletedGoals(data.latestCompletedGoals);
  
        console.log("User ID:", formattedData.id);
        console.log("Fetched rank:", formattedData.rank);
        console.log("Last roulette rank:", formattedData.lastRouletteRank);
      } else {
        console.error('Failed to fetch user data');
      }
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    console.log("Current rank:", userData.rank, "Last roulette rank:", userData.lastRouletteRank);
    if (userData.rank >= 10 && Math.floor(userData.rank / 10) > Math.floor(userData.lastRouletteRank / 10)) {
      console.log("Modal should open now.");
      setIsModalOpen(true);
      updateLastRouletteRank(userData.rank);
    }
  }, [userData.rank, userData.lastRouletteRank]);

  const updateLastRouletteRank = async (newRank) => {
    //const token = localStorage.getItem('token');
    const userId = userData.id;
    console.log("Attempting to update last roulette rank for user ID:", userId);

    const response = await fetch(`http://localhost:3000/api/current_users/${userId}/update_rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      //headers: {
      //  'Authorization': `Bearer ${token}`,
      //  'Content-Type': 'application/json'
      //},
      body: JSON.stringify({ lastRouletteRank: newRank })
    });
    if (response.ok) {
      const resData = await response.json();
      if(resData.success) {
        console.log("Update response received and successful");
        localStorage.setItem('lastRouletteRank', newRank);
        setUserData(prev => ({ ...prev, lastRouletteRank: newRank }));
      } else {
        console.error("Failed to update last roulette rank due to server error", resData.message);
      }
    } else {
      console.error("Failed to update last roulette rank due to network error");
    }
  };

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

      <div>
        {message && <p>{message}</p>}
      </div>
      <h1>Welcome to your dashboard</h1>
      <p>Here's some information about your account:</p>
      {userRank > 10 && <Link href={`/edit-roulette-text/`}>Roulette Text</Link>}
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