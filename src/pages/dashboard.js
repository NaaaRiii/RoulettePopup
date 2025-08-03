import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

import { FaPen } from 'react-icons/fa';
import EditUserNameModal from '../components/EditUserNameModal';

import Link from 'next/link';
import Layout from '../components/Layout';
import ExpLineChart from '../components/ExpLineChart';
import Image from 'next/image';
import NewGoalModal from '../components/CreateGoal';
import '../components/styles.css';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useUserData } from '../contexts/UserDataContext';


function Dashboard() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    goalsState,
    setGoalsState,
    userData,
    setUserData,
    latestCompletedGoals,
    refreshData
  } = useUserData();
  
  const [authLoading, setAuthLoading] = useState(true);
  const [deletedGoalId, setDeletedGoalId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRank, setUserRank] = useState(0);
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
    setUserRank(userData.rank);
  }, [userData.rank]);

  useEffect(() => {
    console.log("Current rank:", userData.rank, "Last roulette rank:", userData.lastRouletteRank);
    if (userData.rank >= 10 && Math.floor(userData.rank / 10) > Math.floor(userData.lastRouletteRank / 10)) {
      updateLastRouletteRank(userData.rank);
    }
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

    {/* レスポンシブレイアウト */}
    <div className='dashboard px-4 lg:px-8'>
      <div className='dashboard-container flex-col gap-4 lg:gap-8'>
        <div className='dashboard-left-container w-full'>
            <div className='user-profile-container'>
              <h1>Welcome to your dashboard</h1>
              {/* TODO: Fix the unescaped entities issue */}
              {/* eslint-disable-next-line react/no-unescaped-entities */}
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
                      <EditUserNameModal isOpen={isEditNameOpen} onClose={closeEditName} onUserUpdate={handleUserUpdate}/>

                      <div className='user-profile__roulette'>
                        {userRank >= 10 && <Link href="/edit-roulette-text">ごほうびルーレット</Link>}
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

            <div className='chart h-64 lg:h-80 xl:h-96 mt-4 lg:mt-6'>
              <ExpLineChart />
            </div>

            <div className='dashboard-left-bottom-container'>
              <div className='button-container flex-col sm:flex-row gap-2 lg:gap-4'>
                <Link href="/new-goal" onClick={handleOpenModal}>
                  <div className={'btn btn-primary w-full sm:w-auto flex-1'}>Goalを設定する</div>
                </Link>
                <NewGoalModal isOpen={isModalOpen} onClose={handleCloseModal} />
                <Link href="/completed-goal">
                  <div className={'btn btn-primary w-full sm:w-auto flex-1'}>達成したGoal</div>
                </Link>
              </div>

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
                          <p className='goal-title'>{goal.title}</p> {/* Goalのタイトルは各small-goalに表示されます */}
                          <div className='small-goal__content'>
                          <p className='small-goal__title' data-testid='small-goal-title'>{smallGoal.title}</p>
                            <p className='small-goal__deadline'>期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
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

        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;