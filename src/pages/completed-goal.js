import React, { useEffect, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import Link from 'next/link';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';
import Image from 'next/image';
import '../components/styles.css';

function CompletedGoal() {
  const [goalsState, setGoalsState] = useState([]);
  const { refresh } = useGoals();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/goals', {
        method: 'GET',
        credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Data is not an array');
    }

    // 達成済みのgoalのみをセット
    setGoalsState(data.filter(goal => goal.completed));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchGoals();
}, [refresh]);

  return (
    <Layout>
      <div className="completed-goals-container">
        <h1>These are your Completed Goals!</h1>
        <div className="completed-goals-grid">
          {goalsState.map((goal) => {
            console.log('Goal Data:', goal);  // goal オブジェクト全体を出力
            return (
              <div key={goal.id} className="c-card goal-card">
                <div className="completed-goal-content">
                  <Link href={`/goals/${goal.id}`}>
                    <h3 className="goal-title">{goal.title}</h3>
                  </Link>
                  {goal.completed_time && (
                    <p className="goal-date">
                      達成日: {new Date(goal.completed_time).toLocaleDateString()}
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

export default withAuth(CompletedGoal);
