import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import Link from 'next/link';
import '../components/styles.css';

export default function Dashboard() {
  const [userData, setUserData] = useState({ name: '', totalExp: 0, rank: 0, goals: [], smallGoals: [], tasks: [], rouletteTexts: []});
  const [latestCompletedGoals, setLatestCompletedGoals] = useState([]);
  const router = useRouter();
  const message = router.query.message ? decodeURIComponent(router.query.message) : '';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/current_user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setLatestCompletedGoals(data.latestCompletedGoals);
      } else {
        console.error('Failed to fetch user data');
      }
    };

    fetchData();
  }, []);


  return (
    <Layout>
      <div>
        {message && <p>{message}</p>}
      </div>
      <h1>Welcome to your dashboard</h1>
      <p>Here's some information about your account:</p>
      <ul>
        <li>Name: {userData?.name}</li>
      </ul>
      <h2>Your EXP: {userData?.totalExp}</h2>
      <h2>Your Rank: {userData?.rank}</h2>

      <p>Here are your recent activities:</p>
      {latestCompletedGoals.map(goal => (
        <div key={goal.id} className="small-goal">
          <p>{goal.title} <strong>完了!</strong> {formatDate(goal.completed_time)}</p>
        </div>
      ))}

      <div>
        <div class="pg-container">
          <div class="dashboard-container">
            <Link href="/new-goal">
              <div className={'btn btn-primary'}>Set Goal!</div>
            </Link>
            <Link href="/index-goal">
              <div className={'btn btn-primary'}>Your Goals</div>
            </Link>
          </div>
        </div>
      </div>

    </Layout>
  );
}