import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import Link from 'next/link';
import ExpCalendar from './calendar';
import ExpChart from './area-chart';
import Image from 'next/image';
import '../components/styles.css';

export default function Dashboard() {
  const [goalsState, setGoalsState] = useState([]);
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
    return format(date, 'yyyy-MM-dd');
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/goals', {
          method: 'GET',
          credentials: 'include',
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
  
        const data = await response.json();
        console.log("API Response Data:", data); // APIから取得したデータをログに出力
  
        if (!Array.isArray(data)) {
          throw new Error('Data is not an array');
        }
  
        setGoalsState(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchGoals();
  }, []);  

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:3000/api/current_user', {
        credentials: 'include',
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
  // TODO: Fix the dependency array issue for userData
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.rank, userData.lastRouletteRank]);


  const updateLastRouletteRank = async (newRank) => {
    const userId = userData.id;
    console.log("Attempting to update last roulette rank for user ID:", userId);

    const response = await fetch(`http://localhost:3000/api/current_users/${userId}/update_rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
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
      
      <div className='dashboard'>
        <div className='dashboard-container'>
          <div className='dashboard-left-container'>
            <h1>Welcome to your dashboard</h1>
            {/* TODO: Fix the unescaped entities issue */}
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <div className='c-card'>
              <div className='row user-profile'>
                <div className='user-profile__basic'>
                  <div className='user-profile__image'>
                    <Image
                      src="/images/learn.png"
                      alt="User Profile Image"
                      width={60}
                      height={60}
                      className="profile-image"
                    />
                    </div>
                  <div className='user-profile__info'>
                    <div className='user-profile__name'>
                      {userData?.name}
                    </div>
                    <div className='user-profile__roulette'>
                      {userRank > 10 && <Link href={`/edit-roulette-text/`}>Roulette</Link>}
                    </div>
                  </div>
                </div>
                <div className='user-profile__separator'>
                </div>
                <div className='user-profile__rank'>
                  <h2>Your EXP: {userData?.totalExp}</h2>
                </div>
                <div className='user-profile__separator'>
                </div>
                <div className='user-profile__exp'>
                  <h2>Your Rank: {userData?.rank}</h2>
                </div>
              </div>
            </div>

            <div className='chart'>
              <h2>Chart</h2>
              <ExpChart />
            </div>

            <div class="button-container">
              <Link href="/new-goal">
                <div className={'btn btn-primary'}>Set Goal!</div>
              </Link>
              <Link href="/index-goal">
                <div className={'btn btn-primary'}>Your Goals</div>
              </Link>
            </div>

            {/*<div className='small-goals'>
              {goalsState
                .filter(goal => !goal.completed)
                .map((goal) => {
                  console.log("goal.small_goals:", goal.small_goals);

                  const incompleteSmallGoals = goal.small_goals?.filter(smallGoal => !smallGoal.completed) || [];
                  console.log("Incomplete small goals:", incompleteSmallGoals);

                  return (
                    <div key={goal.id}>
                      <h3>goal title : {goal.title}</h3>
                      <h4>Small Goals:</h4>
                      {incompleteSmallGoals.length > 0 ? (
                        incompleteSmallGoals.map((smallGoal) => (
                          <div key={smallGoal.id}>
                            <h3>{smallGoal.title}</h3>
                            <p>Difficulty: {smallGoal.difficulty}</p>
                            <p>Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                            <p>Completed: No</p>
                          </div>
                        ))
                      ) : (
                        <p>No incomplete small goals available</p>
                      )}
                    </div>
                  );
                })}
            </div>*/}

            <div className='small-goals'>
              {goalsState
                .filter(goal => !goal.completed) // 未達成のゴールのみをフィルタリング
                .map((goal) => {
                  const incompleteSmallGoals = goal.small_goals?.filter(smallGoal => !smallGoal.completed) || [];

                  return (
                    <div key={goal.id} className="c-card small-goals">
                      <div className="small-goal__image-container">
                        <Image
                          src="/images/pen-memo3.png"
                          alt="Goal Image"
                          width={60}
                          height={60}
                          className="small-goal__image"
                        />
                      </div>
                      <div className="small-goal__content-container">
                        <p className="goal-title">{goal.title}</p>
                        {incompleteSmallGoals.map((smallGoal) => (
                          <div key={smallGoal.id} className="small-goal__content">
                            <p className="small-goal__title">{smallGoal.title}</p>
                            <p className="small-goal__deadline">Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="small-goal__button-container">
                        <Link href={`/goals/${goal.id}`}>
                          <button className="small-goal__confirm-button">確認</button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>


          </div>
          
          <div className='dashboard-right-container'>
            <div className='calendar'>
              <h2>Calendar</h2>
              <ExpCalendar />
            </div>

            <div className='unmet-goals'>
              <h3>未達成の目標</h3>
              <ul>
                {goalsState
                  .filter((goal) => !goal.completed)
                  .map((goal) => (
                    <li key={goal.id}>
                      <Link href={`/goals/${goal.id}`}>
                        {goal.title}
                      </Link>
                      <p>Deadline: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}</p>
                    </li>
                  ))}
              </ul>
            </div>


            <h2>Here are your recent activities:</h2>
            {latestCompletedGoals.map(goal => (
              <div key={goal.id} className="small-goal">
                <p>{goal.title} <strong>完了!</strong> {formatDate(goal.completed_time)}</p>
              </div>
            ))}
          </div>

        </div>

      </div>

    </Layout>
  );
}