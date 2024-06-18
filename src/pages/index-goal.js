import { useEffect, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import Link from 'next/link';
import Layout from '../components/Layout';
import '../components/styles.css';

function IndexGoal() {
  const [goalsState, setGoalsState] = useState([]);
  const { refresh } = useGoals();

  useEffect(() => {
    //const token = localStorage.getItem('token');
    const fetchGoals = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/goals', {
        method: 'GET',
        credentials: 'include'
      //headers: {
      //  'Authorization': `Bearer ${token}`
      //}
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

  //    .then((response) => response.json())
  //    .then((data) => setGoalsState(data))
  //    .catch((error) => console.error('Error fetching data:', error));
  //}, [refresh]);

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
