import React, { useEffect, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Link from 'next/link';
import Layout from '../components/Layout';
import Image from 'next/image';


function CompletedGoal() {
  const [goalsState, setGoalsState] = useState([]);
  const { refresh } = useGoals();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetchWithAuth('/api/goals');

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Data is not an array');
        }

        // 達成済みの goal のみをセット
        setGoalsState(data.filter((goal) => goal.completed));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchGoals();
  }, [refresh]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FFFFEE] p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-[#373741] text-center">達成したGoal</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {goalsState.map((goal) => {
            console.log('Goal Data:', goal);
            return (
              <div key={goal.id} className="bg-[rgb(240,239,226)] rounded-lg shadow-sm p-4 md:p-6 transition-transform duration-300 hover:scale-105 flex flex-col justify-between h-full">
                <div className="flex-1">
                  <Link href={`/goals/${goal.id}`}>
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-[#373741] cursor-pointer hover:text-blue-600 transition-colors">{goal.title}</h3>
                  </Link>
                  {goal.completed_time && (
                    <p className="text-sm md:text-base text-green-600 mb-4">
                      達成日: {new Date(goal.completed_time).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <Image
                    src='/images/trophy.png'
                    alt='Trophy'
                    width={80}
                    height={80}
                    className='w-16 h-16 md:w-20 md:h-20'
                  />
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </Layout>
  );
}

export default CompletedGoal;
