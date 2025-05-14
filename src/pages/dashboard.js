import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

import { FaPen } from 'react-icons/fa';
import EditUserNameModal from '../components/EditUserNameModal';

import Link from 'next/link';
import ExpCalendar from '../components/Calendar';
import ExpLineChart from '../components/ExpLineChart';
import Image from 'next/image';
import NewGoalModal from '../components/CreateGoal';
import '../components/styles.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

import '@aws-amplify/ui-react/styles.css';
import { signOut } from "aws-amplify/auth"
import { useAuthenticator } from '@aws-amplify/ui-react';


function Dashboard() {
  const { route, user } = useAuthenticator();
  const isLoggedIn = (route === 'authenticated');

  useEffect(() => {
    if (route === 'authenticated') {
      console.info('✅ authenticated:', user);
    } else {
      console.warn('🚪 not authenticated (route:', route, ')');
    }
  }, [route, user]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchGoals = async () => {
      const res = await fetchWithAuth('/api/goals');
      if (res.ok) setGoalsState(await res.json());
    };
    fetchGoals();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUser = async () => {
      const res = await fetchWithAuth('/api/current_user');
      if (res.ok) setUserData(await res.json());
    };
    fetchUser();
  }, [isLoggedIn]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };
  
  const [goalsState, setGoalsState] = useState([]);
  const [deletedGoalId, setDeletedGoalId] = useState(null);
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

  const handleOpenModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const openEditName = (e) => {
    e.preventDefault();
    setIsEditNameOpen(true);
  };
  const closeEditName = () => {
    setIsEditNameOpen(false);
  };

  const deleteGoal = async (goalId) => {
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetchWithAuth(`/api/goals/${goalId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setDeletedGoalId(goalId);
          setGoalsState((prevGoals) =>
            prevGoals.filter((goal) => goal.id !== goalId)
          );
          router.push('/dashboard');
        } else {
          alert('Failed to delete the goal.');
        }
      } catch (error) {
        alert('Communication has failed.');
        console.error(error);
      }
    }
  };
  


  useEffect(() => {
    console.debug('[useEffect] client side, fetching goals');
    console.debug('[useEffect] Dashboard mounting on client - about to fetch goals');
    const fetchGoals = async () => {
      console.debug('[fetchGoals] start');             // ← ここでフェッチ関数に入ったことを確認
      try {
        const response = await fetchWithAuth('/api/goals');
        console.debug('[fetchGoals] got response', response);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        console.debug('[fetchGoals] parsed json', data);
        setGoalsState(data);
      } catch (err) {
        console.error('[fetchGoals] error', err);
      }
    };
  
    fetchGoals();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWithAuth('/api/current_user');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user data:', data);
  
        // 必要なデータをセット
        setUserRank(data.rank);
        //const storedLastRouletteRank = data.last_roulette_rank || localStorage.getItem('lastRouletteRank');
        const formattedData = {
          ...data,
          lastRouletteRank: parseInt(data.last_roulette_rank, 10) || 0
        };
        setUserData(formattedData);
        setLatestCompletedGoals(data.latestCompletedGoals);

        console.log('Formatted data:', formattedData);
      } else {
        console.error('Failed to fetch user data');
      }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    console.log("Current rank:", userData.rank, "Last roulette rank:", userData.lastRouletteRank);
    console.log(process.env.NEXT_PUBLIC_RAILS_API_URL);
    if (userData.rank >= 10 && Math.floor(userData.rank / 10) > Math.floor(userData.lastRouletteRank / 10)) {
      //console.log("Modal should open now.");
      //setIsModalOpen(true);
      updateLastRouletteRank(userData.rank);
    }
  // TODO: Fix the dependency array issue for userData
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.rank, userData.lastRouletteRank]);

  const updateLastRouletteRank = async (newRank) => {
    const userId = userData.id;
    if (!userId) {
      console.error('User ID is undefined. Cannot update last roulette rank.');
      return;
    }

    console.log("Attempting to update last roulette rank for user ID:", userId);

    try {
      const response = await fetchWithAuth(
        `/api/current_users/${userId}/update_rank`,
        { method: 'POST', body: JSON.stringify({ lastRouletteRank: newRank }) }
      );

    if (response.ok) {
      const resData = await response.json();
      console.log('resData:', resData);
      //if (resData.success) {
      //  console.log("Update response received and successful");
      //  localStorage.setItem('lastRouletteRank', newRank);
      //  setUserData(prev => ({ ...prev, lastRouletteRank: newRank }));
      //}
      if (resData.success) {
        console.log("Update response received and successful");
        //localStorage.setItem('lastRouletteRank', newRank);
        const formattedData = {
          ...userData,
          lastRouletteRank: parseInt(newRank, 10) || 0
        };
        setUserData(formattedData);
        console.log('Updated formatted data:', formattedData);
      } else {
        console.error("Failed to update last roulette rank due to server error", resData.message || 'No error message provided');
      }
    } else {
      console.error("Failed to update last roulette rank due to network error");
    }
    } catch (error) {
      console.error('Error updating last roulette rank:', error);
    }
  };

  if (!isLoggedIn) return <p>Loading...（または /login へ誘導）</p>;

return (
  <>

    <button type="button" onClick={handleSignOut}>
      Sign out
    </button>
      {/*{isModalOpen && (
        <div id="modal" className="modal">
          <div className="modal-content">
            <iframe src="http://localhost:4000/roulette-popup" width="500" height="500"></iframe>
            <span className="close-button" onClick={toggleModal}>Close</span>
          </div>
        </div>
      )}*/}

      <div>
        {message && <p>{message}</p>}
      </div>
      
      <div className='dashboard'>
        <div className='dashboard-container'>
          <div className='dashboard-left-container'>
            <div className='user-profile-container'>
              <h1>Welcome to your dashboard</h1>
              {/* TODO: Fix the unescaped entities issue */}
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <div className='user-profile-card'>
                <div className='user-profile'>
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
                      <div className='user-profile__title'>
                        {userData?.currentTitle}
                      </div>
                      {/*<div className='user-profile__name'>
                        {userData?.name}
                      </div>*/}
                      <div className='user-profile__name'>
                        {userData?.name}
                        {/* ペンアイコンを表示してクリックでモーダルを開く */}
                        <Link href="/edit-name" onClick={openEditName}>
                          <FaPen />
                        </Link>
                      </div>
                      <EditUserNameModal isOpen={isEditNameOpen} onClose={closeEditName}/>
                      
                      <div className='user-profile__roulette'>
                        {userRank > 10 && <Link href={`/edit-roulette-text/`}>ごほうびルーレット</Link>}
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
            </div>

            <div className='chart'>
              <ExpLineChart />
            </div>

            <div className='dashboard-left-bottom-container'>
              <div className='button-container'>
                <Link href="/new-goal" onClick={handleOpenModal}>
                  <div className={'btn btn-primary'}>目標を設定する</div>
                </Link>
                <NewGoalModal isOpen={isModalOpen} onClose={handleCloseModal} />
                <Link href="/completed-goal">
                  <div className={'btn btn-primary'}>達成した目標</div>
                </Link>
              </div>

              <div className='small-goals'>
                <h2>進行中のSmall Goal</h2>
                {goalsState
                  .filter(goal => !goal.completed && goal.id !== deletedGoalId)
                  .map((goal) => {
                    const incompleteSmallGoals = goal.small_goals?.filter(smallGoal => !smallGoal.completed) || [];

                    return incompleteSmallGoals.map((smallGoal) => (
                      <div key={smallGoal.id} className='c-card small-goals'>
                        <div className='small-goal__image-container'>
                          <Image
                            src='/images/pen-memo4.png'
                            alt='Goal Image'
                            width={60}
                            height={60}
                            className='small-goal__image'
                          />
                        </div>
                        <div className='small-goal__content-container'>
                          <p className='goal-title'>{goal.title}</p> {/* Goalのタイトルは各small-goalに表示されます */}
                          <div className='small-goal__content'>
                          <p className='small-goal__title' data-testid='small-goal-title'>{smallGoal.title}</p>
                            <p className='small-goal__deadline'>Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                          </div>
                        </div>
                        <div className='small-goal__button-container'>
                          <Link href={`/goals/${goal.id}`}>
                            <button className='small-goal__confirm-button'>確認</button>
                          </Link>
                        </div>
                      </div>
                    ));
                  })}
            </div>

          </div>

          </div>
          
          <div className='dashboard-right-container'>
            <div className='calendar'>
              <ExpCalendar />
            </div>

            <div className='unmet-goals'>
              <h3>進行中のGoal</h3>
              <ul>
                {goalsState
                  .filter((goal) => !goal.completed)
                  .sort((a, b) => {
                    const dateA = a.deadline ? new Date(a.deadline) : Infinity;
                    const dateB = b.deadline ? new Date(b.deadline) : Infinity;
                    return dateA - dateB;
                  })
                  .map((goal) => (
                    <li key={goal.id} className="unmet-goals-card">
                      <Link href={`/goals/${goal.id}`} className="unmet-goals">
                        <span data-testid="goal-title">{goal.title}</span> 
                      </Link>
                      <p className="goal-deadline">
                        Deadline: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                      </p>
                    </li>
                  ))}
              </ul>

              <div className='dashboard-right-container-bottom'>
                <h3>最近完了したSmall-Goal</h3>
                {latestCompletedGoals.map(goal => (
                  <div key={goal.id} className="bottom-small-goal-card">
                    <p>{goal.title}</p>
                    <p>
                      <span className="completed-text">完了!</span>
                      <span className="completed-time">{formatDate(goal.completed_time)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;