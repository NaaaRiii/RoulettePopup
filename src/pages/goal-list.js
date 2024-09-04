//import { useEffect, useState } from 'react';
//import Link from 'next/link';

//export default function GoalList() {
//  const [goals, setGoals] = useState([]);

//  useEffect(() => {
//    // ここでAPIからゴールのリストを取得します
//    // 例: fetch('/api/goals').then(response => response.json()).then(data => setGoals(data));
//  }, []);

//  return (
//    <div>
//      <h1>Welcome! These are your Goals!</h1>
//      <ul>
//        {goals.map((goal) => (
//          <li key={goal.id}>
//            {/* Next.jsのLinkコンポーネントを使用。goal_path(goal)の代わりにgoalの詳細ページへのパスを指定 */}
//            <Link href={`/goals/${goal.id}`}>
//              <a>{goal.title}</a>
//            </Link>
//            {/* ゴールが達成されている場合、「達成」を表示 */}
//            {goal.completed && <strong><span>達成</span></strong>}
//          </li>
//        ))}
//      </ul>
//    </div>
//  );
//}
