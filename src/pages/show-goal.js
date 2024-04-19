//import { useRouter } from 'next/router';
//import { useEffect, useState } from 'react';
//import Link from 'next/link';
//import Layout from '../components/Layout';

//function GoalPage() {
//  const router = useRouter();
//  const { id } = router.query;
//  const [goal, setGoal] = useState(null);
//  const [loading, setLoading] = useState(true);

//  useEffect(() => {
//    if (!id) return;
//    fetch(`/api/goals/${id}`)
//      .then(res => res.json())
//      .then(data => {
//        setGoal(data);
//        setLoading(false);
//      });
//  }, [id]);

//  if (loading) return <p>Loading...</p>;
//  if (!goal) return <p>Goal not found</p>;

//  return (
//    <Layout>
//      <div>
//        <h1>Goal Title:</h1>
//        <h3>{goal.title}</h3>
//        {goal.completed ? (
//          <p>このGoalは達成しました!</p>
//        ) : (
//          <>
//            <p>このGoalを完了しますか?</p>
//            {goal.small_goals.some(sg => !sg.completed) ? (
//              <button disabled className="btn btn-success">Goalを達成する</button>
//            ) : (
//              <button className="btn btn-success">Goalを達成する</button>
//            )}
//          </>
//        )}

//        <h2>Goal Content:</h2>
//        <h3>{goal.content}</h3>
//        <p>Deadline: {new Date(goal.deadline).toISOString().slice(0, 10)}</p>

//        {goal.small_goals.map(smallGoal => (
//          <div key={smallGoal.id} className="small-goal">
//            <h2>Small Goal Title:</h2>
//            <h3>{smallGoal.title}</h3>
//            {smallGoal.completed ? <span><strong>完了!</strong></span> : null}
//            <p>Difficulty: {smallGoal.difficulty}</p>
//            <p>Deadline: {new Date(smallGoal.deadline).toISOString().slice(0, 10)}</p>
//            {/* Add more interactive elements here as needed */}
//          </div>
//        ))}

//        <Link href={`/goals/edit/${goal.id}`}>Edit Goal</Link>
//        <Link href={`/goals/delete/${goal.id}`}>Delete Goal</Link>
//        <Link href={`/goals/new/small/${goal.id}`}>New Small Goal</Link>
//        <Link href="/goals">Back</Link>
//      </div>
//    </Layout>
//  );
//}

//export default GoalPage;