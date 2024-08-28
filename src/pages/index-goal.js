import { useEffect, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import Link from 'next/link';
import Layout from '../components/Layout';
import ExpCalendar from './calendar';
import '../components/styles.css';

function IndexGoal() {
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

    setGoalsState(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchGoals();
}, [refresh]);

  return (
    <Layout>
       <div className='dashboard'>
        <div className='dashboard-container'>
          <div className='dashboard-left-container'>
            <h1>Welcome! These are your Goals!</h1>
              <ul>
                {goalsState.map((goal) => (
                  <li key={goal.id}>
                    <Link href={`/goals/${goal.id}`}>
                      {goal.title}
                    </Link>
                    {goal.completed && (
                      <strong><span>達成</span></strong>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='dashboard-right-container'>
            <div className='calendar'>
              <ExpCalendar />
            </div>

            <h2>Here are your recent activities:</h2>
            {/*{latestCompletedGoals.map(goal => (
              <div key={goal.id} className="small-goal">
                <p>{goal.title} <strong>完了!</strong> {formatDate(goal.completed_time)}</p>
              </div>
            ))}*/}
          </div>
        </div>
    </Layout>
  );
}

export default IndexGoal;
