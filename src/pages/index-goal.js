import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../components/styles.css';
import { useGoals } from '../contexts/GoalsContext';

function IndexGoal() {
  const [goalsState, setGoalsState] = useState([]);
  const { refresh } = useGoals();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/goals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => setGoalsState(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, [refresh]);

  return (
    <Layout>
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
    </Layout>
  );
}

export default IndexGoal;
