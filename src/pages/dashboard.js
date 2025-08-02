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
  
return (
  <Layout>
      <div>
        {message && <p>{message}</p>}
      </div>
      
      <div className='dashboard px-2 justify-start py-6 lg:px-6 xl:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 xl:gap-20 w-full max-w-sm mx-auto sm:max-w-2xl lg:max-w-none'>
          <div className='lg:col-span-8 space-y-6 lg:space-y-8 xl:space-y-10'>
            <h1 className='text-xl md:text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-gray-800'>Welcome to your dashboard</h1>
            <div className='bg-[#FFFCEB] rounded-lg shadow-sm p-4 md:p-6 lg:p-10 xl:p-12'>
              <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    <Image
                      src="/images/learn.png"
                      alt="User Profile Image"
                      width={60}
                      height={60}
                      className="rounded-full lg:w-20 lg:h-20"
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm text-gray-600'>
                      {userData?.currentTitle}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-lg lg:text-xl font-semibold text-gray-900'>{userData?.name}</span>
                      <Link href="/edit-name" onClick={openEditName}>
                        <FaPen className='text-gray-500 hover:text-gray-700 cursor-pointer text-sm' />
                      </Link>
                    </div>
                    <EditUserNameModal isOpen={isEditNameOpen} onClose={closeEditName} onUserUpdate={handleUserUpdate}/>
                    
                    <div className='text-sm'>
                      {userRank >= 10 && <Link href="/edit-roulette-text" className='text-blue-600 hover:text-blue-800'>ごほうびルーレット</Link>}
                    </div>
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <div className='grid grid-cols-2 gap-4 lg:gap-6 text-center'>
                    <div className='bg-gray-50 rounded-lg p-3 lg:p-4'>
                      <div className='text-lg lg:text-2xl font-bold text-gray-800'>{userData?.totalExp}</div>
                      <div className='text-sm lg:text-base text-gray-600'>EXP</div>
                    </div>
                    <div className='bg-gray-50 rounded-lg p-3 lg:p-4'>
                      <div className='text-lg lg:text-2xl font-bold text-gray-800'>{userData?.rank}</div>
                      <div className='text-sm lg:text-base text-gray-600'>Rank</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-10 xl:p-12'>
              <div className='lg:min-h-[400px] xl:min-h-[500px]'>
                <ExpLineChart />
              </div>
            </div>

            <div className='space-y-6 lg:space-y-8 xl:space-y-10'>
              <div className='flex flex-col sm:flex-row gap-4 lg:gap-8 xl:gap-10'>
                <Link href="/new-goal" onClick={handleOpenModal} className='flex-1'>
                  <div className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 lg:py-4 lg:px-8 rounded-lg text-center transition-colors lg:text-lg'>
                    Goalを設定する
                  </div>
                </Link>
                <NewGoalModal isOpen={isModalOpen} onClose={handleCloseModal} />
                <Link href="/completed-goal" className='flex-1'>
                  <div className='bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 lg:py-4 lg:px-8 rounded-lg text-center transition-colors lg:text-lg'>
                    達成したGoal
                  </div>
                </Link>
              </div>

              <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-10 xl:p-12'>
                <h2 className='text-lg md:text-xl lg:text-2xl font-semibold mb-4 lg:mb-6 text-gray-800'>進行中のSmall Goal</h2>
                <div className='space-y-3'>
                  {goalsState
                    .filter(goal => !goal.completed && goal.id !== deletedGoalId)
                    .map((goal) => {
                      const incompleteSmallGoals = goal.small_goals?.filter(smallGoal => !smallGoal.completed) || [];

                      return incompleteSmallGoals.map((smallGoal) => (
                        <div key={smallGoal.id} className='flex items-center space-x-4 p-4 lg:p-6 border rounded-lg bg-[#FFFCEB] hover:bg-[#FFF6D9] transition-colors'>
                          <div className='flex-shrink-0'>
                            <Image
                              src='/images/pen-memo4.png'
                              alt='Goal Image'
                              width={40}
                              height={40}
                              className='rounded lg:w-12 lg:h-12'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm text-gray-600 truncate'>{goal.title}</p>
                            <p className='text-base lg:text-lg font-medium text-gray-900' data-testid='small-goal-title'>{smallGoal.title}</p>
                            <p className='text-sm lg:text-base text-gray-500'>期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                          </div>
                          <div className='flex-shrink-0'>
                            <Link href={`/goals/${goal.id}`}>
                              <button className='bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 lg:py-3 lg:px-6 rounded text-sm lg:text-base transition-colors'>
                                確認
                              </button>
                            </Link>
                          </div>
                        </div>
                      ));
                    })}
                </div>
              </div>
            </div>

          </div>
          
          <div className='lg:col-span-4 space-y-6 lg:space-y-8 xl:space-y-10'>
            <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-10 xl:p-12'>
              <div className='lg:min-h-[350px] xl:min-h-[400px]'>
                <ExpCalendar />
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-10 xl:p-12'>
              <h3 className='text-lg md:text-xl lg:text-2xl font-semibold mb-4 lg:mb-6 text-gray-800'>進行中のGoal</h3>
              <div className='space-y-3'>
                {goalsState
                  .filter((goal) => !goal.completed)
                  .sort((a, b) => {
                    const dateA = a.deadline ? new Date(a.deadline) : Infinity;
                    const dateB = b.deadline ? new Date(b.deadline) : Infinity;
                    return dateA - dateB;
                  })
                  .map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 lg:p-6 border rounded-lg bg-[#FFFCEB] hover:bg-[#FFF6D9] cursor-pointer transition-colors"
                      onClick={() => router.push(`/goals/${goal.id}`)}
                    >
                      <div className='flex justify-between items-start'>
                        <span data-testid="goal-title" className='font-medium lg:text-lg text-gray-900 flex-1 pr-3'>{goal.title}</span>
                        <span className='text-xs lg:text-sm text-gray-500 flex-shrink-0'>
                          期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className='mt-6 pt-6 border-t'>
                <h3 className='text-md lg:text-lg font-semibold mb-3 lg:mb-4 text-gray-800'>最近完了したSmall Goal</h3>
                <div className='space-y-2'>
                  {latestCompletedGoals.map(goal => (
                    <div key={goal.id} className="p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className='font-medium lg:text-lg text-gray-900'>{goal.title}</p>
                      <div className='flex items-center space-x-2 text-sm lg:text-base'>
                        <span className="font-medium" style={{color: 'green'}}>完了!</span>
                        <span style={{color: 'rgb(72, 99, 141)'}}>{formatDate(goal.completed_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;