import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../components/styles.css';
import { format } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
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

//あってもなくても変わらない
// この関数はサーバーサイドで実行されます
//export async function getServerSideProps(context) {
//  // ユーザー認証やAPIキーなど、コンテキストから必要な情報を取得
//  //const token = getTokenFromContext(context); // getTokenFromContextは例です
//  const token = context.req.headers.authorization || '';

//  // APIからデータをフェッチ
//  const response = await fetch('http://localhost:3000/api/current_user', {
//    headers: {
//      //'Authorization': `Bearer ${token}`
//      'Authorization': token,
//    },
//  });
//  const data = await response.json();

//  // ページコンポーネントにpropsとして渡すデータを返します
//  return {
//    props: {
//      userData: data,
//      latestCompletedGoals: data.latestCompletedGoals || [],
//    },
//  };
//}

//ローディングインジケータは私の望むものではないが、参考のために残しておく
//import { useEffect, useState } from 'react';
//import Layout from '../components/Layout';
//import '../components/styles.css';
//import { format } from 'date-fns';
//import Link from 'next/link';

//export default function Dashboard() {
//  const [userData, setUserData] = useState({ name: '', totalExp: 0, rank: 0, goals: [], smallGoals: [], tasks: [], rouletteTexts: []});
//  const [latestCompletedGoals, setLatestCompletedGoals] = useState([]);
//  const [isLoading, setIsLoading] = useState(false);

//  const formatDate = (dateString) => {
//    const date = new Date(dateString);
//    return format(date, 'yyyy-MM-dd HH:mm');
//  };

//  useEffect(() => {
//    const fetchData = async () => {
//      setIsLoading(true);
//      const token = localStorage.getItem('token');
//      const response = await fetch('http://localhost:3000/api/current_user', {
//        headers: {
//          'Authorization': `Bearer ${token}`
//        }
//      });
//      if (response.ok) {
//        const data = await response.json();
//        setUserData(data);
//        setLatestCompletedGoals(data.latestCompletedGoals);
//      } else {
//        console.error('Failed to fetch user data');
//      }
//      setIsLoading(false);
//    };

//    fetchData();
//  }, []);

//  // ローディング中に表示されるコンテンツ
//  if (isLoading) {
//    return (
//      <Layout>
//        <div>Loading...</div>
//      </Layout>
//    );
//  }

//  // データがロードされた後に表示されるコンテンツ
//  return (
//    <Layout>
//      <h1>Welcome to your dashboard</h1>
//      <p>Here's some information about your account:</p>
//      <ul>
//        <li>Name: {userData.name}</li>
//      </ul>
//      <h2>Your EXP: {userData.totalExp}</h2>
//      <h2>Your Rank: {userData.rank}</h2>

//      <p>Here are your recent activities:</p>
//      {latestCompletedGoals.map(goal => (
//        <div key={goal.id} className="small-goal">
//          <p>{goal.title} <strong>完了!</strong> {formatDate(goal.completed_time)}</p>
//        </div>
//      ))}

//      <div>
//        <div className="pg-container">
//          <div className="dashboard-container">
//            <Link href="/new-goal">
//              <div className={'btn btn-primary'}>Set Goal!</div>
//            </Link>
//            <Link href="/index-goal">
//              <div className={'btn btn-primary'}>Your Goals</div>
//            </Link>
//          </div>
//        </div>
//      </div>
//    </Layout>
//  );
//}
