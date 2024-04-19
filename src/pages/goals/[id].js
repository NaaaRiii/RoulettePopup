import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import '../../components/styles.css';
import { format } from 'date-fns';
import { useGoals } from '../../contexts/GoalsContext';

function GoalPage() {
  const router = useRouter();
  const { id } = router.query;
  const [goal, setGoal] = useState({ small_goals: [] });
  //const [smallGoal, setSmallGoal] = useState({ tasks: [] });
  const [loading, setLoading] = useState(true);
  const { refreshGoals } = useGoals();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/goals/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setGoal(data);
        setLoading(false);
      });
  }, [id]);

  const deleteGoal = () => {
    if (window.confirm('本当にこのゴールを削除しますか？')) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          refreshGoals();
          router.push('/index-goal');
        } else {
          alert('ゴールの削除に失敗しました。');
        }
      })
      .catch(() => alert('通信に失敗しました。'));
    }
  };

  useEffect(() => {
    if (!id) return;
  
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/goals/${id}/small_goals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Fetched small goals:', data); // データ構造をログ出力
      setGoal(prevGoal => ({
        ...prevGoal,
        small_goals: data
      }));
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching small goals:', error);
    });
  }, [id]);

  function handleTaskToggle(taskId) {
    setGoal(prevGoal => {
      const updatedGoal = {
        ...prevGoal,
        small_goals: prevGoal.small_goals.map(smallGoal => {
          return {
            ...smallGoal,
            tasks: smallGoal.tasks.map(task => {
              if (task.id === taskId) {
                const updatedTask = { ...task, completed: !task.completed };
                saveTaskState(prevGoal.id, smallGoal.id, updatedTask);
                return updatedTask;
              }
              return task;
            })
          };
        })
      };
      localStorage.setItem(`goalState-${prevGoal.id}`, JSON.stringify(updatedGoal));
      return updatedGoal;
    });
  }
  
  function saveTaskState(goalId, smallGoalId, task) {
    const key = `taskState-${goalId}-${smallGoalId}-${task.id}`;
    localStorage.setItem(key, JSON.stringify(task.completed));
  }

  useEffect(() => {
    const storedState = localStorage.getItem(`goalState-${id}`);
    if (storedState) {
      setGoal(JSON.parse(storedState));
    } else if (id) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/goals/${id}/small_goals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Fetched small goals:', data);
        setGoal(prevGoal => ({
          ...prevGoal,
          small_goals: data
        }));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching small goals:', error);
      });
    }
  }, [id]);
  
  const allTasksCompleted = goal.small_goals?.every(smallGoal =>
    smallGoal.tasks?.every(task => task.completed)
  );

  if (loading) return <p>Loading...</p>;
  if (!goal) return <p>Goal not found</p>;

  return (
    <Layout>
      <div>
        <h1>Goal Title:</h1>
        <h3>{goal.title}</h3>
        {goal.completed ? (
          <p>このGoalは達成しました!</p>
        ) : (
          <>
            <p>このGoalを完了しますか?</p>
            {goal.small_goals?.some(sg => !sg.completed) ? (
              <button disabled className="btn btn-success">Goalを達成する</button>
            ) : (
              <button className="btn btn-success">Goalを達成する</button>
            )}
          </>
        )}

        <h2>Goal Content:</h2>
        <h3>{goal.content}</h3>
        <p>Deadline: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}</p>

        {goal.small_goals.map(smallGoal => (
          <div key={smallGoal.id} className="small-goal">
            <h2>Small Goal Title:</h2>
            <h3>{smallGoal.title}</h3>
            {smallGoal.completed ? <span><strong>完了!</strong></span> : null}
            {allTasksCompleted && (
              <button className="btn btn-success">完了</button>
            )}
            <p>Difficulty: {smallGoal.difficulty}</p>
            <p>Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
            {!smallGoal.completed && (
              <ul>
                {smallGoal.tasks?.map((task) => (
                  <li key={task.id}>
                    <label htmlFor={`task_${task.id}`}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id)} // 更新
                      />
                      {task.content}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div>**************************************</div>
          </div>
        ))}

        <Link href={`/goals/${goal.id}/edit`}>
          <div>Edit Goal</div>
        </Link>
        <Link href={`/index-goal`} onClick={deleteGoal}>
          <div>Delete Goal</div>
        </Link>
        <Link href={`/goals/${goal.id}/new-small_goal`}>
          <div className={'btn btn-primary'}>Add New Small Goal</div>
        </Link>
        <Link href="/index-goal">
          <div className={'btn btn-primary'}>Back</div>
        </Link>
      </div>
    </Layout>
  );
}

export default GoalPage;