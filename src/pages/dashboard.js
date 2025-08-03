import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

import { FaPen } from 'react-icons/fa';
import EditUserNameModal from '../components/EditUserNameModal';

import Link from 'next/link';
import Layout from '../components/Layout';
import ExpCalendar from '../components/Calendar';
import ExpLineChart from '../components/ExpLineChart';
import Image from 'next/image';
import NewGoalModal from '../components/CreateGoal';
import '../components/styles.css';
import { fetchWithAuth } from '../utils/fetchWithAuth';


function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
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

  const formatDate = (dateString) => format(new Date(dateString), 'yyyy-MM-dd');

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

  const handleUserUpdate = (updatedUser) => {
    // ユーザーデータを更新
    setUserData(prevData => ({
      ...prevData,
      name: updatedUser.name || prevData.name,
      email: updatedUser.email || prevData.email
    }));
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
    const fetchGoals = async () => {
      try {
        const response = await fetchWithAuth('/api/goals');
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
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


        setUserRank(data.rank);

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
    if (userData.rank >= 10 && Math.floor(userData.rank / 10) > Math.floor(userData.lastRouletteRank / 10)) {


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





      if (resData.success) {
        console.log("Update response received and successful");

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth('/api/current_user');
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          router.replace('/login');
        }
      } catch {
        setIsLoggedIn(false);
        router.replace('/login');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (authLoading) return <p>Loading...</p>;
  if (!isLoggedIn)  return null;

return (
  <Layout>
    <div>
      {message && <p>{message}</p>}
    </div>

    <div className="dashboard">
      <div className='dashboard-container flex-col lg:flex-row'>
        {/* 左側コンテナ */}
        <div className='dashboard-left-container w-full lg:w-[60%] order-1 px-0'>
          {/* ユーザープロフィール */}
          <div className='user-profile-container'>
            <h1>Welcome to your dashboard</h1>
            <div className='user-profile-card w-full max-w-none lg:max-w-2xl'>
              <div className='user-profile flex-col sm:flex-row lg:flex-col xl:flex-row'>
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
                    <div className='user-profile__name'>
                      {userData?.name}
                      <Link href="/edit-name" onClick={openEditName}>
                        <FaPen />
                      </Link>
                    </div>
                    <EditUserNameModal 
                      isOpen={isEditNameOpen} 
                      onClose={closeEditName} 
                      onUserUpdate={handleUserUpdate}
                    />
                    <div className='user-profile__roulette'>
                      {userRank >= 10 && (
                        <Link href="/edit-roulette-text">ごほうびルーレット</Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className='user-profile__separator' />

                <div className='user-profile__rank'>
                  <h2>Your EXP: {userData?.totalExp}</h2>
                </div>

                <div className='user-profile__separator' />

                <div className='user-profile__exp'>
                  <h2>Your Rank: {userData?.rank}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* チャート */}
          <div className='chart h-64 lg:h-80 xl:h-96 mt-4 lg:mt-6'>
            <ExpLineChart />
          </div>

          {/* 左側下部コンテナ */}
          <div className='dashboard-left-bottom-container lg:max-w-2xl'>
            {/* ボタンコンテナ */}
            <div className='button-container space-y-2 sm:space-y-0 sm:space-x-4'>
              <Link href="/new-goal" onClick={handleOpenModal} className="block sm:inline-block">
                <div className='btn btn-primary w-full sm:w-auto'>Goalを設定する</div>
              </Link>
              <NewGoalModal isOpen={isModalOpen} onClose={handleCloseModal} />
              <Link href="/completed-goal" className="block sm:inline-block">
                <div className='btn btn-primary w-full sm:w-auto'>達成したGoal</div>
              </Link>
            </div>

            {/* 進行中のSmall Goal */}
            <div className='small-goals mt-4 lg:mt-6'>
              <h2>進行中のSmall Goal</h2>
              {goalsState
                .filter(goal => !goal.completed && goal.id !== deletedGoalId)
                .map((goal) => {
                  const incompleteSmallGoals = goal.small_goals?.filter(smallGoal => !smallGoal.completed) || [];

                  return incompleteSmallGoals.map((smallGoal) => (
                    <div key={smallGoal.id} className='c-card small-goals w-full max-w-none lg:max-w-2xl mb-3 lg:mb-4'>
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
                        <p className='goal-title'>{goal.title}</p>
                        <div className='small-goal__content'>
                          <p className='small-goal__title' data-testid='small-goal-title'>
                            {smallGoal.title}
                          </p>
                          <p className='small-goal__deadline'>
                            期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}
                          </p>
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

        {/* 右側コンテナ */}
        <div className='dashboard-right-container w-full lg:w-80 xl:w-96 order-2'>
          {/* カレンダー */}
          <div className='calendar mb-6 lg:mb-8'>
            <ExpCalendar />
          </div>

          {/* 進行中のGoal */}
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
                  <li
                    key={goal.id}
                    className="unmet-goals-card cursor-pointer mb-2 lg:mb-3"
                    onClick={() => router.push(`/goals/${goal.id}`)}
                  >
                    <span data-testid="goal-title">{goal.title}</span>
                    <p className="goal-deadline">
                      期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                    </p>
                  </li>
                ))}
            </ul>

            {/* 最近完了したSmall Goal */}
            <div className='dashboard-right-container-bottom'>
              <h3>最近完了したSmall Goal</h3>
              {latestCompletedGoals.map(goal => (
                <div key={goal.id} className="bottom-small-goal-card mb-2 lg:mb-3">
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
  </Layout>
);
}

export default Dashboard;