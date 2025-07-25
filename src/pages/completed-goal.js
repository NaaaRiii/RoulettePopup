import React, { useEffect, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Link from 'next/link';
import Layout from '../components/Layout';
import Image from 'next/image';
import '../components/styles.css';


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
      <div className="completed-goals-container">
        <h1>達成したGoal</h1>
        <div className="completed-goals-grid">
          {goalsState.map((goal) => {
            console.log('Goal Data:', goal);
            return (
              <div key={goal.id} className="c-card goal-card">
                <div className="completed-goal-content">
                  <Link href={`/goals/${goal.id}`}>
                    <h3 className="goal-title">{goal.title}</h3>
                  </Link>
                  {goal.completed_time && (
                    <p className="goal-date">
                      達成日: {new Date(goal.completed_time).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <div className="goal-image">
                  <Image
                    src='/images/trophy.png'
                    alt='Trophy'
                    width={100}
                    height={100}
                    className='trophy-icon'
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default CompletedGoal;
