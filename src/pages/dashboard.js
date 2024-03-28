import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../components/styles.css';

export default function Dashboard() {
  // userData の初期状態を適切に設定
  const [userData, setUserData] = useState({ name: '', totalExp: 0, rank: 0 });

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
        console.log("Received data:", data);
        setUserData(data);
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
        {/* userData が null または undefined でないことを確認 */}
        <li>Name: {userData?.name}</li>
      </ul>
      <h2>Your EXP: {userData?.totalExp}</h2>
      <h2>Your Rank: {userData?.rank}</h2>

      {/*<p>Here are your recent activities:</p>
      {userData.latestCompletedGoals.map((goal) => (
        <div key={goal.id} className="small-goal">
          {goal.title}
          <span><strong> 完了!</strong></span>
          {goal.completedTime}
        </div>
      ))}*/}
      <p>Here are your recent activities:</p>
      {userData?.latestCompletedGoals && userData?.latestCompletedGoals.map((goal) => (
        <div key={goal.id} className="small-goal">
          {goal.title}
          <span><strong> 完了!</strong></span>
          {goal.completedTime}
        </div>
      ))}

    </Layout>
  );
}
