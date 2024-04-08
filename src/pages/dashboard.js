import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../components/styles.css';
import { format } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  // userData の初期状態を適切に設定
  const [userData, setUserData] = useState({ name: '', totalExp: 0, rank: 0, goals: [], smallGoals: [], tasks: [], rouletteTexts: []});
  const [latestCompletedGoals, setLatestCompletedGoals] = useState([]);

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
        //console.log("Received data:", data);
        setUserData(data);
        setLatestCompletedGoals(data.latestCompletedGoals);

        //// ここで最新の完了アイテムを処理
        //const completedGoals = data.smallGoals?.filter(goal => goal.completed && goal.completed_time) || [];
        //const sortedCompletedGoals = completedGoals.sort((a, b) => new Date(b.completed_time) - new Date(a.completed_time));
        //let filteredGoals = sortedCompletedGoals.slice(0, 5); // 最新の5つを取得

        //// すべてのアイテムが5時間以上前の場合、最新のものを含めて表示
        //if (filteredGoals.length === 0 || filteredGoals.every(goal => new Date(goal.completed_time) <= new Date(Date.now() - 5 * 60 * 60 * 1000))) {
        //  filteredGoals = sortedCompletedGoals.slice(0, 1);
        //}

        //setLatestCompletedGoals(filteredGoals);
      } else {
        console.error('Failed to fetch user data');
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
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
            <Link href="/goals">
              <div className={'btn btn-primary'}>Your Goals</div>
            </Link>
          </div>
        </div>
      </div>

    </Layout>
  );
}